'use client';

import { useState } from 'react';
import { usePost, useToggleLike } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { PostDetailSkeleton } from '@/components/ui/Skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CommentSection } from '@/components/blog/CommentSection';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Share2, Eye, Clock, ArrowLeft,
  Link2, Check, Edit2,
} from 'lucide-react';
import { formatDate, readingTime, getShareUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { use } from 'react';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { slug } = use(params);
  const { data: post, isLoading, isError } = usePost(slug);
  const { user, isAuthenticated } = useAuthStore();
  const toggleLike = useToggleLike();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <PostDetailSkeleton />;

  if (isError || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">
          This post may have been removed or doesn't exist.
        </p>
        <Link href="/blog">
          <Button variant="outline">← Back to Blog</Button>
        </Link>
      </div>
    );
  }

  const shareUrl = getShareUrl(post.slug);

  // Can edit: post author OR admin/master_admin
  const canEdit = user && (
    user._id === post.author._id ||
    user.role === 'admin' ||
    user.role === 'master_admin'
  );

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to like posts');
      return;
    }
    toggleLike.mutate(post._id);
  };

  const handleCopyLink = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for HTTP / older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: show the URL in a prompt
      window.prompt('Copy this link:', shareUrl);
    }
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${post.title} — ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
    setShowShareMenu(false);
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener'
    );
    setShowShareMenu(false);
  };

  return (
    <article className="animate-fade-in">
      {/* Back Button + Edit */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          {canEdit && (
            <Link
              href={`/dashboard/posts/${post._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit post
            </Link>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-muted">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">{post.title}</h1>

        {/* Author & Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-8 border-b border-border">
          <Link
            href={`/authors/${post.author._id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <UserAvatar user={post.author} size="md" />
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readingTime(post.content || post.excerpt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.views ?? 0} views
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="blog-content mb-12"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Actions Bar */}
        <div className="flex items-center justify-between py-6 border-t border-b border-border mb-12">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-70 ${
              post.isLiked
                ? 'bg-red-50 text-red-500 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                post.isLiked ? 'fill-current scale-110' : ''
              }`}
            />
            <span>{typeof post.likesCount === 'number' && !isNaN(post.likesCount) ? post.likesCount : 0}</span>
            <span className="hidden sm:inline">{(post.likesCount ?? 0) === 1 ? 'like' : 'likes'}</span>
          </button>

          {/* Share Button with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowShareMenu(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 bottom-full mb-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden animate-fade-in">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    {/* X (Twitter) icon */}
                    <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X (Twitter)
                  </button>
                  <button
                    onClick={handleShareFacebook}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    {/* Facebook icon */}
                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Share on Facebook
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Author Bio */}
        {post.author.bio && (
          <div className="p-6 bg-muted/50 rounded-2xl mb-12 flex gap-4">
            <UserAvatar user={post.author} size="lg" className="flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">{post.author.name}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.author.bio}</p>
              <Link
                href={`/authors/${post.author._id}`}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View all posts →
              </Link>
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentSection postId={post._id} />
      </div>
    </article>
  );
}
