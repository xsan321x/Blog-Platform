const express = require('express');
const router = express.Router();
const {
  getComments,
  getReplies,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCommentSchema } = require('../utils/validators');

// Get comments for a post
router.get('/:postId', getComments);
router.get('/:postId/replies/:commentId', getReplies);

// Add comment (auth required)
router.post('/:postId', protect, validate(createCommentSchema), addComment);

// Update/delete comment
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

// Like comment
router.post('/:id/like', protect, toggleCommentLike);

module.exports = router;
