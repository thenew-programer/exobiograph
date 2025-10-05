'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CommunityComment } from '@/lib/community-types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  CheckCircle2,
  Send,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentThreadProps {
  comment: CommunityComment;
  postId: string;
  currentUserId: string;
  onUpdate: () => void;
  depth?: number;
}

const MAX_DEPTH = 3;

export function CommentThread({ 
  comment, 
  postId, 
  currentUserId, 
  onUpdate,
  depth = 0 
}: CommentThreadProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient();
  const isAuthor = comment.author_id === currentUserId;
  const canReply = depth < MAX_DEPTH - 1;

  const handleLike = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('community_reactions')
          .delete()
          .eq('user_id', currentUserId)
          .eq('comment_id', comment.id)
          .eq('reaction_type', 'like');

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('community_reactions')
          .insert({
            user_id: currentUserId,
            comment_id: comment.id,
            reaction_type: 'like',
          });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          parent_comment_id: comment.id,
          content: replyText.trim(),
          depth: depth + 1,
        });

      if (error) throw error;

      setReplyText('');
      setShowReplyForm(false);
      toast.success('Reply posted!');
      onUpdate();
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .update({ is_deleted: true, content: '[deleted]' })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success('Comment deleted');
      onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (comment.is_deleted) {
    return (
      <Card className={depth > 0 ? "ml-8 border-l-2" : ""}>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground italic">[This comment has been deleted]</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={depth > 0 ? "ml-8" : ""}>
      <Card className={depth > 0 ? "border-l-2" : ""}>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Link 
              href={`/profile/${comment.author_id}`}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.avatar_url} alt={comment.author?.full_name} />
                <AvatarFallback>
                  {comment.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {comment.author?.full_name || 'Unknown User'}
                  </span>
                  {comment.author?.is_verified && (
                    <CheckCircle2 className="h-3 w-3 text-blue-500" />
                  )}
                  {comment.is_best_answer && (
                    <Badge variant="default" className="text-xs">
                      ✓ Best Answer
                    </Badge>
                  )}
                  {comment.is_edited && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  
                  {isAuthor && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDelete}>
                          Delete Comment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isProcessing}
                  className="h-7 px-2 text-xs"
                >
                  <Heart className={isLiked ? "mr-1 h-3 w-3 fill-red-500 text-red-500" : "mr-1 h-3 w-3"} />
                  {likeCount > 0 && likeCount}
                </Button>

                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 px-2 text-xs"
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    Reply
                  </Button>
                )}
              </div>

              {showReplyForm && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {replyText.length}/2000
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmitReply}
                        disabled={isSubmitting || !replyText.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1 h-3 w-3" />
                            Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
