'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from "@/lib/supabase/client";
import { CommunityPost, Tag } from '@/lib/community-types';
import { PostCard } from './PostCard';
import { CreatePostButton } from './CreatePostButton';
import VerificationPrompt from '@/components/verification/VerificationPrompt';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type SortOption = 'recent' | 'popular' | 'trending' | 'active';
type FilterOption = 'all' | 'discussions' | 'questions' | 'insights' | 'following' | 'my-posts';

interface CommunityPageClientProps {
  userId: string;
  isVerified: boolean;
}

export function CommunityPageClient({ userId, isVerified }: CommunityPageClientProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(!isVerified);

  const supabase = createBrowserClient();

  const fetchPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const pageSize = 20;
      const currentPage = reset ? 1 : page;

      console.log('Fetching posts with filters:', { sortBy, filterBy, currentPage });

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(
            full_name,
            avatar_url,
            institution,
            is_verified,
            reputation_score
          ),
          tags:post_tags(
            tag:community_tags(*)
          )
        `)
        .eq('is_archived', false)
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      console.log('Base query created');

      // Apply filters
      if (filterBy === 'discussions') {
        query = query.eq('post_type', 'discussion');
      } else if (filterBy === 'questions') {
        query = query.eq('post_type', 'question');
      } else if (filterBy === 'insights') {
        query = query.eq('post_type', 'insight');
      } else if (filterBy === 'my-posts') {
        query = query.eq('author_id', userId);
      } else if (filterBy === 'following') {
        // Get users we're following
        const { data: following } = await supabase
          .from('community_following')
          .select('following_id')
          .eq('follower_id', userId);
        
        const followingIds = following?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('author_id', followingIds);
        } else {
          // No following yet, return empty
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('like_count', { ascending: false });
      } else if (sortBy === 'trending') {
        // Trending: high engagement in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('view_count', { ascending: false });
      } else if (sortBy === 'active') {
        query = query.order('updated_at', { ascending: false });
      }

      console.log('Executing query...');
      const { data, error } = await query;
      console.log('Query executed. Data:', data?.length, 'Error:', error);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        throw error;
      }

      console.log('Fetched posts:', data?.length || 0, 'posts');

      // Transform tags structure
      const transformedPosts = (data || []).map(post => ({
        ...post,
        tags: post.tags?.map((pt: { tag: Tag }) => pt.tag).filter(Boolean) || [],
      }));

      // Check if user has liked/saved posts
      if (transformedPosts.length > 0) {
        const postIds = transformedPosts.map(p => p.id);
        
        console.log('Checking likes/saves for', postIds.length, 'posts');
        
        const [{ data: likes, error: likesError }, { data: saves, error: savesError }] = await Promise.all([
          supabase
            .from('community_reactions')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds)
            .eq('reaction_type', 'like'),
          supabase
            .from('community_saved_posts')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds),
        ]);

        if (likesError) {
          console.error('Likes query error:', likesError);
          throw likesError;
        }
        if (savesError) {
          console.error('Saves query error:', savesError);
          throw savesError;
        }

        console.log('Likes/saves fetched successfully');

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        const savedPostIds = new Set(saves?.map(s => s.post_id) || []);

        transformedPosts.forEach(post => {
          post.is_liked = likedPostIds.has(post.id);
          post.is_saved = savedPostIds.has(post.id);
        });
      }

      if (reset) {
        setPosts(transformedPosts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
        setPage(prev => prev + 1);
      }

      setHasMore(transformedPosts.length === pageSize);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [supabase, page, sortBy, filterBy, userId]);

  useEffect(() => {
    fetchPosts(true);
  }, [sortBy, filterBy, fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community Discussions</h1>
          <p className="text-muted-foreground">
            Connect with space biology researchers worldwide
          </p>
        </div>
        <CreatePostButton onPostCreated={handlePostCreated} />
      </div>

      {/* Verification Prompt for unverified users */}
      {showVerificationPrompt && (
        <div className="mb-6">
          <VerificationPrompt onDismiss={() => setShowVerificationPrompt(false)} />
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="active">Most Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {filterBy === 'following' 
                ? "Follow some users to see their posts here"
                : "Be the first to start a discussion!"}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={userId} onUpdate={handlePostCreated} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchPosts(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
