'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PostCard } from '@/components/blog/PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { User, Post } from '@/types';
import { formatDate } from '@/lib/utils';
import { Calendar, FileText } from 'lucide-react';

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export default function AuthorPage({ params }: AuthorPageProps) {
  const { id } = use(params);

  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ['author', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data.data as User & { postsCount: number };
    },
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['author-posts', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}/posts`);
      return res.data;
    },
  });

  if (authorLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 bg-muted rounded-full skeleton" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded skeleton w-40" />
            <div className="h-4 bg-muted rounded skeleton w-60" />
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Author not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      {/* Author Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-12 pb-12 border-b border-border">
        <UserAvatar user={author} size="xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{author.name}</h1>
          {author.bio && (
            <p className="text-muted-foreground leading-relaxed mb-3">{author.bio}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(author.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {author.postsCount} {author.postsCount === 1 ? 'post' : 'posts'}
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-xl font-semibold mb-6">Posts by {author.name}</h2>

      {postsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : postsData?.data?.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No published posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {postsData?.data?.map((post: Post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
