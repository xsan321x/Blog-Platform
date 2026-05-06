import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { Comment, PaginatedResponse } from '@/types';

/**
 * Fetch comments for a post
 */
export function useComments(postId: string, page = 1) {
  return useQuery({
    queryKey: ['comments', postId, page],
    queryFn: async () => {
      const res = await api.get(`/comments/${postId}`, { params: { page } });
      return res.data as PaginatedResponse<Comment>;
    },
    enabled: !!postId,
  });
}

/**
 * Fetch replies for a comment — only when enabled (lazy)
 */
export function useReplies(postId: string, commentId: string, enabled = false) {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: async () => {
      const res = await api.get(`/comments/${postId}/replies/${commentId}`);
      return res.data.data as Comment[];
    },
    enabled: !!commentId && enabled,
    // Always refetch when enabled becomes true
    staleTime: 0,
  });
}

/**
 * Add comment mutation
 */
export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parentComment?: string }) => {
      const res = await api.post(`/comments/${postId}`, data);
      return { comment: res.data.data as Comment, parentComment: data.parentComment };
    },
    onSuccess: ({ parentComment }) => {
      // Always refresh the top-level comments list (updates repliesCount)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // If this was a reply, also refresh that comment's replies list
      if (parentComment) {
        queryClient.invalidateQueries({ queryKey: ['replies', parentComment] });
      }
      toast.success('Comment added!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Delete comment mutation
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      // Refresh comments and all replies
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
