'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, EyeOff, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyPosts, useDeletePost, useUpdatePost } from '@/hooks/usePosts';
import { Button } from '@/components/ui/Button';
import { Post } from '@/types';
import { formatDate, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MyPostsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyPosts({ page, status: statusFilter || undefined });
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const handleToggleStatus = (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updatePost.mutate({ id: post._id, data: { status: newStatus } });
  };

  const handleDelete = (post: Post) => {
    if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      deletePost.mutate(post._id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Posts</h1>
        <Link href="/dashboard/posts/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['', 'published', 'draft'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl skeleton" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground mb-4">No posts found</p>
          <Link href="/dashboard/posts/new">
            <Button variant="outline">Write your first post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((post) => (
            <div
              key={post._id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:shadow-sm transition-shadow"
            >
              {/* Status indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${post.status === 'published' ? 'bg-green-500' : 'bg-orange-400'}`} />

              {/* Post info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className={`capitalize font-semibold ${post.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>
                    {post.status}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.createdAt)}</span>
                  <span>·</span>
                  <span>❤️ {post.likesCount}</span>
                  <span>·</span>
                  <span>💬 {post.commentsCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {post.status === 'published' && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="View post"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={() => handleToggleStatus(post)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                >
                  {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link
                  href={`/dashboard/posts/${post._id}/edit`}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(post)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.pagination.pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.pages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
