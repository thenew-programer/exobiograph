import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommunityPageClient } from "./components/CommunityPageClient";

export const metadata = {
  title: "Community Discussions - ExoBioGraph",
  description: "Join the conversation with space biology researchers worldwide",
};

export default async function CommunityPage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile to check verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_verified')
    .eq('id', user.id)
    .single();

  return <CommunityPageClient userId={user.id} isVerified={profile?.is_verified || false} />;
}
