const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts,
  getAllPostsAdmin,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { requireAuthor, requireAdmin } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createPostSchema, updatePostSchema } = require('../utils/validators');

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/search', searchPosts);

// Admin routes (must come before /:id to avoid conflicts)
router.get('/admin/all', protect, requireAdmin, getAllPostsAdmin);

// Author routes
router.get('/my', protect, requireAuthor, getMyPosts);
router.post('/', protect, requireAuthor, validate(createPostSchema), createPost);

// Single post routes
router.get('/:id', optionalAuth, getPost);
router.put('/:id', protect, requireAuthor, validate(updatePostSchema), updatePost);
router.delete('/:id', protect, requireAuthor, deletePost);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
