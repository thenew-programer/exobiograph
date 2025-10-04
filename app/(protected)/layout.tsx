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

  return (
    <div className="flex min-h-screen flex-col">
      <AuthenticatedNav userEmail={user.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
