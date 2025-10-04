import { createServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PostDetailClient } from "./components/PostDetailClient";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { postId } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from('community_posts')
    .select('title, content')
    .eq('id', postId)
    .single();

  return {
    title: post?.title || 'Community Post',
    description: post?.content?.substring(0, 160) || 'View community discussion',
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch post with author and tags
  const { data: post, error } = await supabase
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
    .eq('id', postId)
    .single();

  if (error || !post) {
    notFound();
  }

  // Transform tags
  const transformedPost = {
    ...post,
    tags: post.tags?.map((pt: { tag: { id: string; name: string; slug: string; description?: string; use_count: number; color?: string } }) => pt.tag).filter(Boolean) || [],
  };

  // Check if user has liked/saved the post
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from('community_reactions')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .eq('reaction_type', 'like'),
    supabase
      .from('community_saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', postId),
  ]);

  transformedPost.is_liked = likes && likes.length > 0;
  transformedPost.is_saved = saves && saves.length > 0;

  // Increment view count (fire and forget)
  supabase
    .from('community_posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', postId)
    .then();

  return <PostDetailClient post={transformedPost} currentUserId={user.id} />;
}
