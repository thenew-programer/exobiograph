import { createServerClient } from "@/lib/supabase/server";
import { ProfileInterface } from "./components/ProfileInterface";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile - ExoBioGraph",
  description: "Manage your profile settings",
};

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get follower and following counts
  const { data: followerCount } = await supabase.rpc("get_follower_count", {
    user_id: user.id,
  });

  const { data: followingCount } = await supabase.rpc("get_following_count", {
    user_id: user.id,
  });

  return (
    <ProfileInterface
      user={user}
      profile={profile}
      followerCount={followerCount || 0}
      followingCount={followingCount || 0}
    />
  );
}
