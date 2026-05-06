const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserProfile,
  assignRole,
  toggleUserStatus,
  deleteUser,
  getUserPosts,
  resetUserProfile,
  resetUserPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { assignRoleSchema } = require('../utils/validators');

// Public routes
router.get('/:id', getUserProfile);
router.get('/:id/posts', getUserPosts);

// Admin routes
router.get('/', protect, requireAdmin, getUsers);
router.put('/:id/role', protect, requireAdmin, validate(assignRoleSchema), assignRole);
router.put('/:id/status', protect, requireAdmin, toggleUserStatus);
router.put('/:id/reset-profile', protect, requireAdmin, resetUserProfile);
router.put('/:id/reset-password', protect, requireAdmin, resetUserPassword);
router.delete('/:id', protect, requireAdmin, deleteUser);

module.exports = router;
