'use client';

import { CommunityPost, POST_TYPE_CONFIG } from '@/lib/community-types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/verification/VerifiedBadge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  ExternalLink,
  MoreVertical 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onUpdate: () => void;
}

export function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient();
  const config = POST_TYPE_CONFIG[post.post_type];

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isLiked) {
        // Unlike
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
        // Like
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('community_saved_posts')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id);

        if (error) throw error;

        setIsSaved(false);
        toast.success('Post removed from saved');
      } else {
        // Save
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/community/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast.success('Post deleted');
      onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const isAuthor = post.author_id === currentUserId;

  return (
    <Link href={`/community/${post.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Author Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={post.author?.avatar_url} alt={post.author?.full_name} />
                <AvatarFallback>
                  {post.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">
                    {post.author?.full_name || 'Unknown User'}
                  </span>
                  {post.author?.is_verified && (
                    <VerifiedBadge size="sm" />
                  )}
                  {post.author?.reputation_score !== undefined && post.author.reputation_score > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {post.author.reputation_score} rep
                    </Badge>
                  )}
                </div>
                {post.author?.institution && (
                  <p className="text-sm text-muted-foreground truncate">
                    {post.author.institution}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Post Type Badge & Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="flex items-center gap-1">
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.label}</span>
              </Badge>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleDelete(); }}>
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-3">
          {/* Pinned Badge */}
          {post.is_pinned && (
            <Badge variant="default" className="mb-2">
              📌 Pinned
            </Badge>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold line-clamp-2">
            {post.title}
          </h3>

          {/* Content Preview */}
          <p className="text-muted-foreground line-clamp-3">
            {post.content}
          </p>

          {/* Linked Paper */}
          {post.linked_paper_title && (
            <div 
              className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {post.linked_paper_title}
                </p>
                {post.linked_paper_doi && (
                  <p className="text-xs text-muted-foreground truncate">
                    DOI: {post.linked_paper_doi}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary" 
                  className="text-xs"
                  style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            {/* Engagement Stats */}
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

            {/* Action Buttons */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isProcessing}
                className="h-8 px-2"
              >
                <Heart className={isLiked ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isProcessing}
                className="h-8 px-2"
              >
                <Bookmark className={isSaved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-2"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
