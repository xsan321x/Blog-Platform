'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PenSquare, FileText, Eye, Heart, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyPosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/blog/PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: postsData, isLoading } = useMyPosts({ limit: 6 });

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  const isAuthor = ['author', 'admin', 'master_admin'].includes(user.role);
  const publishedCount = postsData?.data.filter((p) => p.status === 'published').length || 0;
  const draftCount = postsData?.data.filter((p) => p.status === 'draft').length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        {isAuthor && (
          <Link href="/dashboard/posts/new">
            <Button>
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      {isAuthor && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Posts', value: postsData?.pagination.total || 0, icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Published', value: publishedCount, icon: Eye, color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
            { label: 'Drafts', value: draftCount, icon: PenSquare, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
            { label: 'Total Likes', value: postsData?.data.reduce((sum, p) => sum + p.likesCount, 0) || 0, icon: Heart, color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {isAuthor && (
          <Link href="/dashboard/posts/new" className="p-5 bg-primary/5 border border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors group">
            <PenSquare className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Write New Post</h3>
            <p className="text-sm text-muted-foreground">Start writing with AI assistance</p>
          </Link>
        )}
        <Link href="/dashboard/profile" className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
          <UserAvatar user={user} size="sm" className="mb-3" />
          <h3 className="font-semibold mb-1">Edit Profile</h3>
          <p className="text-sm text-muted-foreground">Update your bio and avatar</p>
        </Link>
        {(user.role === 'admin' || user.role === 'master_admin') && (
          <Link href="/admin" className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-purple-500 text-xs font-bold">A</span>
            </div>
            <h3 className="font-semibold mb-1">Admin Panel</h3>
            <p className="text-sm text-muted-foreground">Manage users and content</p>
          </Link>
        )}
      </div>

      {/* My Posts */}
      {isAuthor && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">My Posts</h2>
            <Link href="/dashboard/posts" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
            </div>
          ) : postsData?.data.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <PenSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No posts yet</p>
              <Link href="/dashboard/posts/new" className="text-primary text-sm hover:underline mt-1 inline-block">
                Write your first post →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {postsData?.data.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
