'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, X, ExternalLink } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { UnsplashImage } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

interface UnsplashPickerProps {
  onSelect: (url: string, alt: string) => void;
  onClose: () => void;
  defaultQuery?: string;
}

/**
 * Unsplash image picker modal
 */
export function UnsplashPicker({ onSelect, onClose, defaultQuery = '' }: UnsplashPickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/unsplash/search', { params: { query, per_page: 12 } });
      setImages(res.data.data.results);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Pick a Cover Image</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Unsplash images..."
                className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-video bg-muted rounded-xl skeleton" />
              ))}
            </div>
          ) : !searched ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Search for images to get started</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No images found for "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    onSelect(img.urls.regular, img.alt_description || query);
                    onClose();
                  }}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                >
                  <Image
                    src={img.urls.small}
                    alt={img.alt_description || 'Unsplash image'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{img.user.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
          Photos from{' '}
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
            Unsplash <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
