'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommunityPost, CommunityComment, POST_TYPE_CONFIG } from '@/lib/community-types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Send,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CommentThread } from './CommentThread';

interface PostDetailClientProps {
  post: CommunityPost;
  currentUserId: string;
}

export function PostDetailClient({ post: initialPost, currentUserId }: PostDetailClientProps) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const router = useRouter();
  const supabase = createBrowserClient();
  const config = POST_TYPE_CONFIG[post.post_type];

  // Load comments
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          author:profiles!community_comments_author_id_fkey(
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('post_id', post.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threaded structure
      const commentMap = new Map<string, CommunityComment>();
      const rootComments: CommunityComment[] = [];

      // First pass: create map
      data?.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: build tree
      data?.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  }, [supabase, post.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: post.id,
          author_id: currentUserId,
          content: newComment.trim(),
          depth: 0,
        })
        .select(`
          *,
          author:profiles!community_comments_author_id_fkey(
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      setComments([...comments, { ...data, replies: [] }]);
      setNewComment('');
      setPost({ ...post, comment_count: post.comment_count + 1 });
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('community_reactions')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id)
          .eq('reaction_type', 'like');

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('community_reactions')
          .insert({
            user_id: currentUserId,
            post_id: post.id,
            reaction_type: 'like',
          });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('community_saved_posts')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id);

        if (error) throw error;

        setIsSaved(false);
        toast.success('Post removed from saved');
      } else {
        const { error } = await supabase
          .from('community_saved_posts')
          .insert({
            user_id: currentUserId,
            post_id: post.id,
          });

        if (error) throw error;

        setIsSaved(true);
        toast.success('Post saved!');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save post');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Community
      </Button>

      {/* Post Card */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author?.avatar_url} alt={post.author?.full_name} />
                <AvatarFallback>
                  {post.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    {post.author?.full_name || 'Unknown User'}
                  </span>
                  {post.author?.is_verified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  )}
                  {post.author?.reputation_score !== undefined && post.author.reputation_score > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {post.author.reputation_score} rep
                    </Badge>
                  )}
                </div>
                {post.author?.institution && (
                  <p className="text-sm text-muted-foreground">
                    {post.author.institution}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="flex items-center gap-1">
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </Badge>
          </div>

          {post.is_pinned && (
            <Badge variant="default" className="w-fit mb-2">
              📌 Pinned
            </Badge>
          )}

          <h1 className="text-3xl font-bold">{post.title}</h1>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.linked_paper_title && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold">{post.linked_paper_title}</p>
                    {post.linked_paper_doi && (
                      <p className="text-sm text-muted-foreground">
                        DOI: {post.linked_paper_doi}
                      </p>
                    )}
                    {post.linked_paper_id && (
                      <Link 
                        href={`/papers/${post.linked_paper_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Paper →
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.view_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className={isLiked ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
                <span>{likeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comment_count}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={isLiked ? "mr-2 h-4 w-4 fill-white" : "mr-2 h-4 w-4"} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>

              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
              >
                <Bookmark className={isSaved ? "mr-2 h-4 w-4 fill-white" : "mr-2 h-4 w-4"} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          Discussion ({post.comment_count})
        </h2>

        {/* New Comment Form */}
        {!post.is_locked && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {newComment.length}/5000
                  </p>
                  <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUserId={currentUserId}
                onUpdate={fetchComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
