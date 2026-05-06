const Comment = require('../models/Comment');
const { Post } = require('../models/Post');
const { ROLES } = require('../models/User');
const { hasPermission } = require('../middleware/rbac');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/comments/:postId
 * @desc    Get comments for a post (nested structure)
 * @access  Public
 */
const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Get top-level comments
  const [comments, total] = await Promise.all([
    Comment.find({ post: postId, parentComment: null, isDeleted: false })
      .populate('author', 'name avatar')
      .populate('repliesCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Comment.countDocuments({ post: postId, parentComment: null, isDeleted: false }),
  ]);

  ApiResponse.paginated(res, comments, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @route   GET /api/comments/:postId/replies/:commentId
 * @desc    Get replies for a specific comment
 * @access  Public
 */
const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const replies = await Comment.find({
    parentComment: commentId,
    isDeleted: false,
  })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 })
    .lean();

  ApiResponse.success(res, replies);
});

/**
 * @route   POST /api/comments/:postId
 * @desc    Add a comment to a post
 * @access  Auth
 */
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  // Verify post exists and is published
  const post = await Post.findOne({ _id: postId, status: 'published' });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // If replying, verify parent comment exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== postId) {
      throw new ApiError(404, 'Parent comment not found');
    }
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content,
    parentComment: parentComment || null,
  });

  await comment.populate('author', 'name avatar');

  ApiResponse.success(res, comment, 'Comment added successfully', 201);
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Edit a comment (own only)
 * @access  Auth
 */
const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) {
    throw new ApiError(404, 'Comment not found');
  }

  // Only the author can edit their comment
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own comments');
  }

  comment.content = req.body.content;
  await comment.save();
  await comment.populate('author', 'name avatar');

  ApiResponse.success(res, comment, 'Comment updated successfully');
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (own or admin+)
 * @access  Auth
 */
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) {
    throw new ApiError(404, 'Comment not found');
  }

  const isOwner = comment.author.toString() === req.user._id.toString();
  const isAdminOrAbove = hasPermission(req.user.role, ROLES.ADMIN);

  if (!isOwner && !isAdminOrAbove) {
    throw new ApiError(403, 'You do not have permission to delete this comment');
  }

  // Soft delete to preserve thread structure
  comment.isDeleted = true;
  comment.content = '[Comment deleted]';
  await comment.save();

  ApiResponse.success(res, null, 'Comment deleted successfully');
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    Toggle like on a comment
 * @access  Auth
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) {
    throw new ApiError(404, 'Comment not found');
  }

  const userId = req.user._id;
  const likeIndex = comment.likes.findIndex((id) => id.toString() === userId.toString());

  let action;
  if (likeIndex === -1) {
    comment.likes.push(userId);
    action = 'liked';
  } else {
    comment.likes.splice(likeIndex, 1);
    action = 'unliked';
  }

  await comment.save();

  ApiResponse.success(res, {
    liked: action === 'liked',
    likesCount: comment.likes.length,
  });
});

module.exports = {
  getComments,
  getReplies,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
};
