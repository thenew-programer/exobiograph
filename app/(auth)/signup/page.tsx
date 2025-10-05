import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SignupForm } from "./components/SignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";

export default async function SignupPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If already logged in, redirect to search
  if (session) {
    redirect('/search');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <Badge variant="outline" className="border-[#2a5298] text-[#2a5298]">
              <Rocket className="mr-2 h-3 w-3" />
              NASA Biology Knowledge Engine
            </Badge>
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Join ExoBioGraph to explore space biology research
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2a5298] hover:underline font-medium">
              Sign in
            </Link>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
