const { ROLES } = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Role hierarchy — higher index = more permissions
 */
const ROLE_HIERARCHY = [
  ROLES.READER,
  ROLES.AUTHOR,
  ROLES.ADMIN,
  ROLES.MASTER_ADMIN,
];

/**
 * Check if a role has at least the required permission level
 */
const hasPermission = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
};

/**
 * Middleware factory: require minimum role
 * Usage: authorize('author') or authorize('admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    const hasRole = roles.some((role) => hasPermission(req.user.role, role));

    if (!hasRole) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${roles.join(' or ')}.`
      );
    }

    next();
  };
};

/**
 * Middleware: require author role or higher
 */
const requireAuthor = authorize(ROLES.AUTHOR);

/**
 * Middleware: require admin role or higher
 */
const requireAdmin = authorize(ROLES.ADMIN);

/**
 * Middleware: require master admin only
 */
const requireMasterAdmin = authorize(ROLES.MASTER_ADMIN);

/**
 * Check if user owns a resource or is admin+
 * Usage: in controller after fetching resource
 */
const checkOwnership = (resourceAuthorId, user) => {
  if (!user) throw new ApiError(401, 'Authentication required.');

  const isOwner = resourceAuthorId.toString() === user._id.toString();
  const isAdminOrAbove = hasPermission(user.role, ROLES.ADMIN);

  if (!isOwner && !isAdminOrAbove) {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
};

module.exports = {
  authorize,
  requireAuthor,
  requireAdmin,
  requireMasterAdmin,
  checkOwnership,
  hasPermission,
  ROLE_HIERARCHY,
};
