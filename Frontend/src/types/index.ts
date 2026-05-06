// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = 'reader' | 'author' | 'admin' | 'master_admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  bio: string;
  isActive?: boolean;
  postsCount?: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Post Types ───────────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'published';

export interface Post {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string;
  author: Pick<User, '_id' | 'name' | 'avatar' | 'bio'>;
  coverImage: string | null;
  coverImageAlt: string;
  status: PostStatus;
  tags: string[];
  likes: string[];
  likesCount: number;
  commentsCount: number;
  views: number;
  isLiked?: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string | null;
  coverImageAlt?: string;
  status: PostStatus;
  tags?: string[];
}

// ─── Comment Types ────────────────────────────────────────────────────────────

export interface Comment {
  _id: string;
  post: string;
  author: Pick<User, '_id' | 'name' | 'avatar'>;
  content: string;
  parentComment: string | null;
  likes: string[];
  repliesCount: number;
  isDeleted: boolean;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    query?: string;
  };
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    links: { html: string };
  };
  links: { html: string };
}
