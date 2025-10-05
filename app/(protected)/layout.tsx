import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile for avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <AuthenticatedNav 
        userEmail={user.email} 
        avatarUrl={profile?.avatar_url}
        userName={profile?.full_name}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
