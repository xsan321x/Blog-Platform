'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Clock, Edit2 } from 'lucide-react';
import { Post } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { timeAgo, readingTime, cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'featured' | 'compact';
  /** Show edit button — pass true from dashboard/admin views */
  showEdit?: boolean;
}

export function PostCard({ post, variant = 'default', showEdit }: PostCardProps) {
  const { user } = useAuthStore();

  // Can edit if: explicitly told to show edit, OR user is the author, OR user is admin/master_admin
  const canEdit = showEdit ||
    (user && (
      user._id === post.author._id ||
      user.role === 'admin' ||
      user.role === 'master_admin'
    ));

  if (variant === 'featured') return <FeaturedPostCard post={post} canEdit={!!canEdit} />;
  if (variant === 'compact') return <CompactPostCard post={post} />;

  return (
    <article className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5">
      {/* Cover Image */}
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
          <div className="relative h-48 bg-muted">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      <div className="p-5">
        {/* Tags + Edit button row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
          {canEdit && (
            <Link
              href={`/dashboard/posts/${post._id}/edit`}
              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit post"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Draft badge */}
        {post.status === 'draft' && (
          <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full mb-2">
            Draft
          </span>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="font-semibold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* Author & Meta */}
        <div className="flex items-center justify-between">
          <Link href={`/authors/${post.author._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <UserAvatar user={post.author} size="sm" />
            <div>
              <p className="text-sm font-medium leading-none">{post.author.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {post.likesCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {post.commentsCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.content ? readingTime(post.content) : '3 min read'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeaturedPostCard({ post, canEdit }: { post: Post; canEdit: boolean }) {
  return (
    <article className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
      {post.coverImage && (
        <div className="relative h-72 bg-muted">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      )}

      {canEdit && (
        <Link
          href={`/dashboard/posts/${post._id}/edit`}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 backdrop-blur-sm text-white rounded-xl hover:bg-black/60 transition-colors"
          title="Edit post"
        >
          <Edit2 className="w-4 h-4" />
        </Link>
      )}

      <div className={cn('p-6', post.coverImage && 'absolute bottom-0 left-0 right-0 text-white')}>
        {post.tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-2xl font-bold leading-tight mb-2 hover:opacity-80 transition-opacity">
            {post.title}
          </h2>
        </Link>

        <p className="text-sm opacity-80 line-clamp-2 mb-4">{post.excerpt}</p>

        <div className="flex items-center justify-between">
          <Link href={`/authors/${post.author._id}`} className="flex items-center gap-2">
            <UserAvatar user={post.author} size="sm" />
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="text-xs opacity-70">{timeAgo(post.createdAt)}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs opacity-80">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likesCount ?? 0}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.commentsCount ?? 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactPostCard({ post }: { post: Post }) {
  return (
    <article className="flex gap-4 group py-4 border-b border-border last:border-0">
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="flex-shrink-0">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          </div>
        </Link>
      )}

      <div className="flex-1 min-w-0">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{post.author.name}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likesCount ?? 0}</span>
        </div>
      </div>
    </article>
  );
}
