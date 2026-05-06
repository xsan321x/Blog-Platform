'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchPosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/blog/PostCard';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 300);

  // Only search when query is at least 2 characters
  const { data, isLoading } = useSearchPosts(
    debouncedQuery.length >= 2 ? debouncedQuery : '',
    page
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1); // Reset page on new search
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Search</h1>

      {/* Search Input */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search posts by title, content, or tags..."
          autoFocus
          className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-ring transition-colors shadow-sm"
        />
        {query && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results */}
      {!debouncedQuery || debouncedQuery.length < 2 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Type at least 2 characters to search</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No results for "{debouncedQuery}"</p>
          <p className="text-sm mt-1">Try different keywords or check your spelling</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            {data?.pagination.total} result{data?.pagination.total !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.data.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
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
