'use client';

import { usePosts } from '@/hooks/usePosts';
import { PostCard } from './PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';

interface PostGridProps {
  limit?: number;
  tag?: string;
  sort?: string;
  featured?: boolean;
}

/**
 * Grid of post cards with loading state
 */
export function PostGrid({ limit = 9, tag, sort = 'newest', featured = false }: PostGridProps) {
  const { data, isLoading, isError } = usePosts({ limit, tag, sort });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit > 6 ? 6 : limit }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load posts. Please try again.</p>
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts found.</p>
      </div>
    );
  }

  const posts = data.data;

  if (featured && posts.length > 0) {
    const [featuredPost, ...rest] = posts;
    return (
      <div className="space-y-6">
        <PostCard post={featuredPost} variant="featured" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
