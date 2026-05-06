const { Post } = require('../models/Post');
const { ROLES } = require('../models/User');
const { checkOwnership } = require('../middleware/rbac');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Build sort object from sort query param
 */
const getSortObject = (sort) => {
  switch (sort) {
    case 'oldest': return { createdAt: 1 };
    case 'popular': return { views: -1, likesCount: -1 };
    default: return { createdAt: -1 }; // newest
  }
};

/**
 * @route   GET /api/posts
 * @desc    Get all published posts (paginated)
 * @access  Public
 */
const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest', tag, author } = req.query;
  const skip = (page - 1) * limit;

  const filter = { status: 'published' };
  if (tag) filter.tags = tag.toLowerCase();
  if (author) filter.author = author;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name avatar bio')
      .populate('commentsCount')
      .select('-content') // Exclude full content in list view
      .sort(getSortObject(sort))
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Post.countDocuments(filter),
  ]);

  // Ensure likesCount is always a number on every post
  const postsWithCounts = posts.map(p => ({
    ...p,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
  }));

  ApiResponse.paginated(res, postsWithCounts, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID or slug
 * @access  Public (published only) | Author/Admin (any status)
 */
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Support both MongoDB ID and slug
  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { slug: id };

  // Admins and the post's own author can see drafts; everyone else only sees published
  const isAdminOrAbove = req.user &&
    (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MASTER_ADMIN);

  let post;

  if (isAdminOrAbove) {
    // Admins can see any post regardless of status
    post = await Post.findOne(query)
      .populate('author', 'name avatar bio')
      .populate('commentsCount')
      .lean({ virtuals: true });
  } else {
    // Try published first
    post = await Post.findOne({ ...query, status: 'published' })
      .populate('author', 'name avatar bio')
      .populate('commentsCount')
      .lean({ virtuals: true });

    // If not found as published, check if the requester is the author
    if (!post && req.user) {
      const draftPost = await Post.findOne(query)
        .populate('author', 'name avatar bio')
        .populate('commentsCount')
        .lean({ virtuals: true });

      if (draftPost && draftPost.author._id.toString() === req.user._id.toString()) {
        post = draftPost;
      }
    }
  }

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Increment view count only for published posts (fire and forget)
  if (post.status === 'published') {
    Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();
  }

  // Check if current user liked this post
  const isLiked = req.user
    ? post.likes.some((id) => id.toString() === req.user._id.toString())
    : false;

  // Ensure likesCount is always a number
  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

  ApiResponse.success(res, { ...post, isLiked, likesCount });
});

/**
 * @route   GET /api/posts/my
 * @desc    Get current author's posts (all statuses)
 * @access  Author+
 */
const getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { author: req.user._id };
  if (status) filter.status = status;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('commentsCount')
      .select('-content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Post.countDocuments(filter),
  ]);

  const postsWithCounts = posts.map(p => ({
    ...p,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
  }));

  ApiResponse.paginated(res, postsWithCounts, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Author+
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, coverImage, coverImageAlt, status, tags } = req.body;

  const post = await Post.create({
    title,
    content,
    excerpt,
    coverImage,
    coverImageAlt,
    status: status || 'draft',
    tags: tags || [],
    author: req.user._id,
  });

  await post.populate('author', 'name avatar');

  ApiResponse.success(res, post, 'Post created successfully', 201);
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Author (own) | Admin+
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Admins and master_admin can edit any post; authors can only edit their own
  const isAdminOrAbove = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MASTER_ADMIN;
  if (!isAdminOrAbove) {
    checkOwnership(post.author, req.user);
  }

  const { title, content, excerpt, coverImage, coverImageAlt, status, tags } = req.body;

  // Update fields
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (coverImageAlt !== undefined) post.coverImageAlt = coverImageAlt;
  if (status !== undefined) post.status = status;
  if (tags !== undefined) post.tags = tags;

  await post.save();
  await post.populate('author', 'name avatar');

  ApiResponse.success(res, post, 'Post updated successfully');
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Author (own) | Admin+
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Admins and master_admin can delete any post
  const isAdminOrAbove = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MASTER_ADMIN;
  if (!isAdminOrAbove) {
    checkOwnership(post.author, req.user);
  }

  await post.deleteOne();

  // Also delete associated comments
  const Comment = require('../models/Comment');
  await Comment.deleteMany({ post: post._id });

  ApiResponse.success(res, null, 'Post deleted successfully');
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like on a post
 * @access  Auth
 */
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, status: 'published' });

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const userId = req.user._id;
  const likeIndex = post.likes.findIndex((id) => id.toString() === userId.toString());

  let action;
  if (likeIndex === -1) {
    // Add like
    post.likes.push(userId);
    action = 'liked';
  } else {
    // Remove like
    post.likes.splice(likeIndex, 1);
    action = 'unliked';
  }

  await post.save();

  ApiResponse.success(res, {
    liked: action === 'liked',
    likesCount: post.likes.length,
  }, `Post ${action} successfully`);
});

/**
 * @route   GET /api/posts/search
 * @desc    Full-text search on posts
 * @access  Public
 */
const searchPosts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || q.trim().length === 0) {
    throw new ApiError(400, 'Search query is required');
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(
      { $text: { $search: q }, status: 'published' },
      { score: { $meta: 'textScore' } }
    )
      .populate('author', 'name avatar')
      .populate('commentsCount')
      .select('-content')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Post.countDocuments({ $text: { $search: q }, status: 'published' }),
  ]);

  const postsWithCounts = posts.map(p => ({
    ...p,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
  }));

  ApiResponse.paginated(res, postsWithCounts, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
    query: q,
  });
});

/**
 * @route   GET /api/posts/admin/all
 * @desc    Get all posts (admin view, all statuses)
 * @access  Admin+
 */
const getAllPostsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, author } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (author) filter.author = author;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name email avatar')
      .populate('commentsCount')
      .select('-content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean({ virtuals: true }),
    Post.countDocuments(filter),
  ]);

  const postsWithCounts = posts.map(p => ({
    ...p,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
  }));

  ApiResponse.paginated(res, postsWithCounts, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit),
  });
});

module.exports = {
  getPosts,
  getPost,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts,
  getAllPostsAdmin,
};
