'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Save, Eye, Upload, Image as ImageIcon, X, Plus, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import { RichTextEditor, RichTextEditorRef } from '@/components/editor/RichTextEditor';
import { EditorErrorBoundary } from '@/components/editor/EditorErrorBoundary';
import { AIAssistant } from '@/components/editor/AIAssistant';
import { UnsplashPicker } from '@/components/editor/UnsplashPicker';
import { Button } from '@/components/ui/Button';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: post, isLoading } = usePost(id);
  const updatePost = useUpdatePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savingAs, setSavingAs] = useState<'draft' | 'published' | null>(null);
  const [initialized, setInitialized] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  // Populate form when post loads (only once)
  useEffect(() => {
    if (post && !initialized) {
      setTitle(post.title);
      setContent(post.content || '');
      setCoverImage(post.coverImage);
      setCoverImageAlt(post.coverImageAlt || '');
      setTags(post.tags);
      setInitialized(true);
    }
  }, [post, initialized]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    setIsUploading(true);
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCoverImage(res.data.data.url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (saveStatus: 'draft' | 'published') => {
    if (!title.trim()) { toast.error('Please add a title'); return; }
    if (!content || content === '<p></p>' || content === '') {
      toast.error('Please add some content');
      return;
    }
    setSavingAs(saveStatus);
    updatePost.mutate(
      { id, data: { title: title.trim(), content, coverImage, coverImageAlt, status: saveStatus, tags } },
      {
        onSuccess: (updatedPost) => {
          router.push(saveStatus === 'published' ? `/blog/${updatedPost.slug}` : '/dashboard/posts');
        },
        onSettled: () => setSavingAs(null),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-muted rounded-xl skeleton w-48" />
        <div className="h-12 bg-muted rounded-xl skeleton" />
        <div className="h-96 bg-muted rounded-2xl skeleton" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Post not found</p>
        <Link href="/dashboard/posts">
          <Button variant="outline">← Back to posts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/posts"
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Post</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            isLoading={savingAs === 'draft'}
            disabled={updatePost.isPending}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('published')}
            isLoading={savingAs === 'published'}
            disabled={updatePost.isPending}
          >
            <Eye className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
            maxLength={200}
          />
          <EditorErrorBoundary>
            <RichTextEditor ref={editorRef} content={content} onChange={setContent} />
          </EditorErrorBoundary>
        </div>

        <div className="space-y-5">
          {/* Cover Image */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-medium mb-3 text-sm">Cover Image</h3>
            {coverImage ? (
              <div className="relative">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                  <Image src={coverImage} alt={coverImageAlt || 'Cover'} fill className="object-cover" sizes="300px" />
                </div>
                <button
                  type="button"
                  onClick={() => { setCoverImage(null); setCoverImageAlt(''); }}
                  className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={coverImageAlt}
                  onChange={(e) => setCoverImageAlt(e.target.value)}
                  placeholder="Image description..."
                  className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-medium">Upload image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowUnsplash(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Pick from Unsplash
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-medium mb-3 text-sm">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length < 10 ? 'Add tag...' : 'Max 10 tags'}
                disabled={tags.length >= 10}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{tags.length}/10 tags</p>
          </div>

          <AIAssistant
            topic={title}
            currentContent={content}
            onInsertContent={(c) => {
              if (editorRef.current) {
                editorRef.current.insertContent(c);
              } else {
                setContent((prev) => prev + c);
              }
            }}
          />
        </div>
      </div>

      {showUnsplash && (
        <UnsplashPicker
          defaultQuery={title}
          onSelect={(url, alt) => { setCoverImage(url); setCoverImageAlt(alt); }}
          onClose={() => setShowUnsplash(false)}
        />
      )}
    </div>
  );
}
