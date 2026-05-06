'use client';

import { useState } from 'react';
import { MessageCircle, Trash2, Reply, ChevronDown } from 'lucide-react';
import { useComments, useAddComment, useDeleteComment, useReplies } from '@/hooks/useComments';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { Comment } from '@/types';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data, isLoading } = useComments(postId);
  const { user, isAuthenticated } = useAuthStore();
  const addComment = useAddComment(postId);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate({ content: content.trim() }, {
      onSuccess: () => setContent(''),
    });
  };

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments {data?.pagination.total ? `(${data.pagination.total})` : ''}
      </h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            {user && <UserAvatar user={user} size="sm" className="mt-1 flex-shrink-0" />}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors placeholder:text-muted-foreground"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{content.length}/1000</span>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={addComment.isPending}
                  disabled={!content.trim()}
                >
                  Post comment
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-muted rounded-2xl text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
            {' '}to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {data?.data.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              currentUserId={user?._id}
              currentUserRole={user?.role}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
  isReply?: boolean;
}

function CommentItem({ comment, postId, currentUserId, currentUserRole, isReply }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const deleteComment = useDeleteComment(postId);
  const addComment = useAddComment(postId);

  // Only fetch replies when user expands them (lazy)
  const { data: replies, isLoading: repliesLoading } = useReplies(postId, comment._id, showReplies);

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    addComment.mutate(
      { content: replyContent.trim(), parentComment: comment._id },
      {
        onSuccess: () => {
          setReplyContent('');
          setShowReplyForm(false);
          setShowReplies(true);
        },
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm('Delete this comment?')) {
      deleteComment.mutate(comment._id);
    }
  };

  return (
    <div className={isReply ? 'ml-10 mt-3' : ''}>
      <div className="flex gap-3">
        <UserAvatar user={comment.author} size="sm" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {comment.isDeleted ? (
                <span className="italic text-muted-foreground">[Comment deleted]</span>
              ) : (
                comment.content
              )}
            </p>
          </div>

          {/* Actions */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-3 mt-1.5 px-1">
              {currentUserId && !isReply && (
                <button
                  onClick={() => {
                    setShowReplyForm(!showReplyForm);
                    if (showReplyForm) setReplyContent('');
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}
              {/* Show delete for comment owner OR admin/master_admin */}
              {(currentUserId === comment.author._id ||
                currentUserRole === 'admin' ||
                currentUserRole === 'master_admin') && (
                <button
                  onClick={handleDelete}
                  disabled={deleteComment.isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
              {comment.repliesCount > 0 && !isReply && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showReplies ? 'rotate-180' : ''}`}
                  />
                  {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3 ml-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author.name}...`}
                rows={2}
                autoFocus
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={1000}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={addComment.isPending}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowReplyForm(false); setReplyContent(''); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Replies */}
          {showReplies && (
            <div className="mt-2 space-y-3">
              {repliesLoading ? (
                <div className="ml-2 text-xs text-muted-foreground animate-pulse">Loading replies...</div>
              ) : replies && replies.length > 0 ? (
                replies.map((reply) => (
                  <CommentItem
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    isReply
                  />
                ))
              ) : (
                <p className="ml-2 text-xs text-muted-foreground">No replies yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
