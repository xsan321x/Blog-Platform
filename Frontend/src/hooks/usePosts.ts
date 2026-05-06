import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { Post, CreatePostData, PaginatedResponse } from '@/types';

/**
 * Fetch paginated published posts
 */
export function usePosts(params?: { page?: number; limit?: number; sort?: string; tag?: string }) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const res = await api.get('/posts', { params });
      return res.data as PaginatedResponse<Post>;
    },
  });
}

/**
 * Fetch a single post by ID or slug
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await api.get(`/posts/${id}`);
      return res.data.data as Post;
    },
    enabled: !!id,
  });
}

/**
 * Fetch current author's posts
 */
export function useMyPosts(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['my-posts', params],
    queryFn: async () => {
      const res = await api.get('/posts/my', { params });
      return res.data as PaginatedResponse<Post>;
    },
  });
}

/**
 * Search posts
 */
export function useSearchPosts(query: string, page = 1) {
  return useQuery({
    queryKey: ['search', query, page],
    queryFn: async () => {
      const res = await api.get('/posts/search', { params: { q: query, page } });
      return res.data as PaginatedResponse<Post>;
    },
    enabled: query.length > 0,
  });
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const res = await api.post('/posts', data);
      return res.data.data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Update post mutation
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePostData> }) => {
      const res = await api.put(`/posts/${id}`, data);
      return res.data.data as Post;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post._id] });
      queryClient.invalidateQueries({ queryKey: ['post', post.slug] });
      toast.success('Post updated!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Delete post mutation
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Toggle like mutation — optimistic update + proper cache invalidation by both id and slug
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post(`/posts/${postId}/like`);
      return { postId, ...res.data.data } as { postId: string; liked: boolean; likesCount: number };
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['post'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['post'] });

      queryClient.setQueriesData({ queryKey: ['post'] }, (old: Post | undefined) => {
        if (!old || old._id !== postId) return old;
        const isLiked = !old.isLiked;
        // Guard against undefined/NaN — default to 0
        const currentCount = typeof old.likesCount === 'number' && !isNaN(old.likesCount)
          ? old.likesCount
          : 0;
        return {
          ...old,
          isLiked,
          likesCount: isLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
        };
      });

      return { previousData };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update like');
    },
    onSuccess: (data) => {
      // Update cache with real server values (no NaN possible)
      queryClient.setQueriesData({ queryKey: ['post'] }, (old: Post | undefined) => {
        if (!old || old._id !== data.postId) return old;
        return { ...old, isLiked: data.liked, likesCount: data.likesCount };
      });
    },
    onSettled: () => {
      // Don't invalidate — onSuccess already set the correct values
      // Only invalidate the posts list to update like counts there
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
