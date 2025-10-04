import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatPageClient } from "./components/ChatPageClient";

export const metadata = {
  title: "AI Chat - ExoBioGraph",
  description: "Chat with AI about NASA space biology research",
};

async function getConversations(userId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

export default async function ChatPage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const conversations = await getConversations(user.id);

  return (
    <ChatPageClient 
      conversations={conversations}
      userId={user.id}
    />
  );
}
