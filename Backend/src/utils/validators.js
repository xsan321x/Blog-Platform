const { z } = require('zod');

// ─── Auth Validators ──────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email'),
  password: z.string({ required_error: 'Password is required' }),
});

// ─── Post Validators ──────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content is required' })
    .min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url('Invalid image URL').optional().nullable(),
  coverImageAlt: z.string().max(200).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string().trim().toLowerCase()).max(10, 'Maximum 10 tags').optional().default([]),
});

const updatePostSchema = createPostSchema.partial();

// ─── Comment Validators ───────────────────────────────────────────────────────

const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim(),
  parentComment: z.string().optional().nullable(),
});

// ─── User Validators ──────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().url().optional().nullable(),
});

const assignRoleSchema = z.object({
  role: z.enum(['reader', 'author', 'admin'], {
    errorMap: () => ({ message: 'Role must be reader, author, or admin' }),
  }),
});

// ─── Query Validators ─────────────────────────────────────────────────────────

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['newest', 'oldest', 'popular']).default('newest'),
});

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateProfileSchema,
  assignRoleSchema,
  paginationSchema,
  searchSchema,
};
