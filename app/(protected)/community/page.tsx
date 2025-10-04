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

  return <CommunityPageClient userId={user.id} />;
}
