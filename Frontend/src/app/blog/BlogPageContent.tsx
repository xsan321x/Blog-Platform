'use client';

import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/blog/PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
];

export function BlogPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get('tag') || undefined;
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePosts({ page, limit: 9, sort, tag });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">
          {tag ? `#${tag}` : 'All Posts'}
        </h1>
        <p className="text-muted-foreground">
          {tag ? `Posts tagged with "${tag}"` : 'Discover stories, ideas, and perspectives'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          Sort by:
        </div>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => { setSort(option.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {option.label}
          </button>
        ))}
        {tag && (
          <button
            onClick={() => router.push('/blog')}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors ml-auto"
          >
            Clear filter ×
          </button>
        )}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No posts found</p>
          <p className="text-sm mt-1">Try a different filter or check back later</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {data.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
