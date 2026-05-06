import { Suspense } from 'react';
import { BlogPageContent } from './BlogPageContent';

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-10 bg-muted rounded skeleton w-48 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-72 bg-muted rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  );
}
