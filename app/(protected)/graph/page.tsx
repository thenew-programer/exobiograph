import { createServerClient } from "@/lib/supabase/server";
import { KnowledgeGraphInterface } from "./components/KnowledgeGraphInterface";

export const metadata = {
  title: "Knowledge Graph - ExoBioGraph",
  description: "Explore entity relationships in space biology research",
};

// Enable static generation with revalidation
export const revalidate = 300; // Revalidate every 5 minutes

export default async function GraphPage() {
  const supabase = await createServerClient();

  // Fetch graph statistics (cached by Next.js)
  const { data: stats } = await supabase.rpc("get_graph_statistics");

  return <KnowledgeGraphInterface initialStats={stats} />;
}
