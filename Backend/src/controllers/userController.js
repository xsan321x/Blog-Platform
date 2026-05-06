const { User, ROLES } = require('../models/User');
const { Post } = require('../models/Post');
const { hasPermission } = require('../middleware/rbac');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin view)
 * @access  Admin+
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, users, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @route   GET /api/users/:id
 * @desc    Get a user's public profile
 * @access  Public
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar bio role createdAt');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get their published posts count
  const postsCount = await Post.countDocuments({
    author: user._id,
    status: 'published',
  });

  ApiResponse.success(res, { ...user.toObject(), postsCount });
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Assign a role to a user
 * @access  Admin+
 */
const assignRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  // Cannot change master admin's role
  if (targetUser.role === ROLES.MASTER_ADMIN) {
    throw new ApiError(403, 'Master Admin role cannot be changed');
  }

  // Admin cannot assign admin or master_admin role (only master admin can)
  if (
    req.user.role === ROLES.ADMIN &&
    (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN)
  ) {
    throw new ApiError(403, 'Only Master Admin can assign admin roles');
  }

  targetUser.role = role;
  await targetUser.save();

  ApiResponse.success(
    res,
    { _id: targetUser._id, name: targetUser.name, email: targetUser.email, role: targetUser.role },
    'Role assigned successfully'
  );
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate or deactivate a user
 * @access  Admin+
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.role === ROLES.MASTER_ADMIN) {
    throw new ApiError(403, 'Master Admin cannot be deactivated');
  }

  // Admin cannot deactivate other admins
  if (
    req.user.role === ROLES.ADMIN &&
    hasPermission(targetUser.role, ROLES.ADMIN)
  ) {
    throw new ApiError(403, 'Admins cannot deactivate other admins');
  }

  targetUser.isActive = !targetUser.isActive;
  await targetUser.save();

  ApiResponse.success(
    res,
    { isActive: targetUser.isActive },
    `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`
  );
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Admin+
 */
const deleteUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.role === ROLES.MASTER_ADMIN) {
    throw new ApiError(403, 'Master Admin cannot be deleted');
  }

  // Admin cannot delete other admins
  if (
    req.user.role === ROLES.ADMIN &&
    hasPermission(targetUser.role, ROLES.ADMIN)
  ) {
    throw new ApiError(403, 'Admins cannot delete other admins');
  }

  await targetUser.deleteOne();

  // Optionally: reassign or delete their posts
  await Post.updateMany({ author: targetUser._id }, { status: 'draft' });

  ApiResponse.success(res, null, 'User deleted successfully');
});

/**
 * @route   GET /api/users/:id/posts
 * @desc    Get published posts by a specific author
 * @access  Public
 */
const getUserPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ author: req.params.id, status: 'published' })
      .populate('author', 'name avatar')
      .populate('commentsCount')
      .select('-content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Post.countDocuments({ author: req.params.id, status: 'published' }),
  ]);

  ApiResponse.paginated(res, posts, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

// ─── Admin-only reset functions are defined below, exports at end of file ────

/**
 * @route   PUT /api/users/:id/reset-profile
 * @desc    Admin resets a user's profile (name, bio, avatar)
 * @access  Admin+
 */
const resetUserProfile = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.role === ROLES.MASTER_ADMIN) {
    throw new ApiError(403, 'Cannot reset Master Admin profile');
  }

  // Admin cannot reset other admins
  if (
    req.user.role === ROLES.ADMIN &&
    hasPermission(targetUser.role, ROLES.ADMIN)
  ) {
    throw new ApiError(403, 'Admins cannot reset other admin profiles');
  }

  const { name, bio, avatar } = req.body;

  // Only update fields that are provided
  if (name !== undefined) targetUser.name = name;
  if (bio !== undefined) targetUser.bio = bio;
  if (avatar !== undefined) targetUser.avatar = avatar;

  await targetUser.save();

  ApiResponse.success(
    res,
    {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      bio: targetUser.bio,
      avatar: targetUser.avatar,
      role: targetUser.role,
    },
    'User profile updated successfully'
  );
});

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Admin resets a user's password
 * @access  Admin+
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (targetUser.role === ROLES.MASTER_ADMIN) {
    throw new ApiError(403, 'Cannot reset Master Admin password');
  }

  // Admin cannot reset other admins' passwords
  if (
    req.user.role === ROLES.ADMIN &&
    hasPermission(targetUser.role, ROLES.ADMIN)
  ) {
    throw new ApiError(403, 'Admins cannot reset other admin passwords');
  }

  // The pre-save hook will hash the new password
  targetUser.password = newPassword;
  await targetUser.save();

  ApiResponse.success(res, null, 'Password reset successfully');
});

module.exports = {
  getUsers,
  getUserProfile,
  assignRole,
  toggleUserStatus,
  deleteUser,
  getUserPosts,
  resetUserProfile,
  resetUserPassword,
};
