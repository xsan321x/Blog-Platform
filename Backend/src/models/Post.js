const mongoose = require('mongoose');

const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true, // This already creates an index
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    coverImage: {
      type: String,
      default: null,
    },
    coverImageAlt: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.DRAFT,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search index on title and content
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Index for common queries (slug already has unique index from schema)
postSchema.index({ author: 1, status: 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

// Virtual: comment count
postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

// Virtual: likes count
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Auto-generate slug from title before saving
postSchema.pre('save', async function () {
  if (this.isModified('title') || this.isNew) {
    this.slug = await generateUniqueSlug(this.title, this._id);
  }

  // Auto-generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    // Strip HTML tags and take first 200 chars
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 200).trim();
    if (plainText.length > 200) this.excerpt += '...';
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/**
 * Generate a URL-friendly slug from title, ensuring uniqueness
 */
async function generateUniqueSlug(title, excludeId) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await mongoose.model('Post').findOne(query);
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

const Post = mongoose.model('Post', postSchema);

module.exports = { Post, POST_STATUS };
