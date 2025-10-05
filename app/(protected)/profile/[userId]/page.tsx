import { createServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PublicProfileInterface } from "./components/PublicProfileInterface";

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = await createServerClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Redirect to own profile if viewing own userId
  if (params.userId === currentUser.id) {
    redirect("/profile");
  }

  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Get follower and following counts
  const { data: followerCount } = await supabase.rpc("get_follower_count", {
    user_id: params.userId,
  });

  const { data: followingCount } = await supabase.rpc("get_following_count", {
    user_id: params.userId,
  });

  // Check if current user is following this user
  const { data: isFollowingData } = await supabase.rpc("is_following", {
    follower: currentUser.id,
    following: params.userId,
  });

  return (
    <PublicProfileInterface
      userId={params.userId}
      profile={profile}
      followerCount={followerCount || 0}
      followingCount={followingCount || 0}
      initialIsFollowing={isFollowingData || false}
    />
  );
}
