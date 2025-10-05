import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase/server";
import { Rocket, Database, Network, FileText } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

async function getStats() {
  const supabase = await createServerClient();
  
  const [papers, entities, sentences, relationships] = await Promise.all([
    supabase.from('research_papers').select('*', { count: 'exact', head: true }),
    supabase.from('entities').select('*', { count: 'exact', head: true }),
    supabase.from('sentences').select('*', { count: 'exact', head: true }),
    supabase.from('entity_relationships').select('*', { count: 'exact', head: true }),
  ]);

  return {
    papers: papers.count || 0,
    entities: entities.count || 0,
    sentences: sentences.count || 0,
    relationships: relationships.count || 0,
  };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
        {/* NASA-style gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a5298]/10 via-transparent to-[#fc3d21]/5" />
        
        <div className="container relative mx-auto px-4 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <Badge variant="outline" className="mb-6 border-[#2a5298] text-[#2a5298] px-4 py-1">
              <Rocket className="mr-2 h-3 w-3" />
              NASA Biology Knowledge Engine
            </Badge>

            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
              Explore Space Biology Through{" "}
              <span className="bg-gradient-to-r from-[#2a5298] to-[#4a72b8] bg-clip-text text-transparent">
                ExoBioGraph
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-10 text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
              Discover insights from NASA&apos;s biological research using AI-powered search,
              interactive knowledge graphs, and intelligent chat. Explore relationships between samples,
              conditions, results, objectives, and entities in space biology research.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-[#2a5298] hover:bg-[#1e3a6f] text-white">
                <Link href="/login">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-[#2a5298]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Research Papers
                </CardTitle>
                <FileText className="h-4 w-4 text-[#2a5298]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.papers.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peer-reviewed studies
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Biological Entities
                </CardTitle>
                <Database className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.entities.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Samples, conditions, results
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Annotated Sentences
                </CardTitle>
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.sentences.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Searchable excerpts
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Entity Relationships
                </CardTitle>
                <Network className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.relationships.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Knowledge graph connections
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-[#2a5298] text-[#2a5298]">
              Platform Capabilities
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Powerful Features for Space Biology Research
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Advanced tools designed to accelerate scientific discovery and collaboration
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Database className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">Comprehensive Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Access {stats.papers.toLocaleString()}+ research papers with {stats.entities.toLocaleString()}+ 
                  extracted entities and {stats.relationships.toLocaleString()}+ documented relationships from 
                  NASA&apos;s space biology research.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Rocket className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">AI-Powered Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ask questions in natural language and get instant, context-aware answers backed by research papers. 
                  Upload your own documents for analysis and comparison.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Network className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">Visual Knowledge Graphs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Explore interactive force-directed graphs that reveal hidden connections between biological entities, 
                  experimental conditions, and research outcomes.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">Smart Search & Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Filter by entity types, search with natural language, and get highlighted excerpts with exact 
                  citations to quickly find relevant research.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-t-4 border-t-pink-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                    <Network className="h-5 w-5 text-pink-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">Research Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Connect with fellow researchers, share discoveries, follow experts in your field, and 
                  collaborate on space biology research projects.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-t-4 border-t-amber-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Rocket className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <CardTitle className="text-lg">Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Stay current with the latest research developments, new paper additions, and community 
                  insights as they happen.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Join researchers exploring the future of space biology
            </p>
            <Button asChild size="lg" className="bg-[#2a5298] hover:bg-[#1e3a6f]">
              <Link href="/signup">
                Start Exploring for Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 id="how-it-works" className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Explore Space Biology with Powerful Tools
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-500">AI Search</Badge>
                  Smart Research Discovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Search through NASA&apos;s biological research using natural language queries.
                  Filter by entity types, view highlighted results, and discover relevant papers instantly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-purple-500">AI Chat</Badge>
                  Intelligent Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ask questions about space biology research and get AI-powered answers.
                  Upload files, cite sources, and have contextual conversations about your research.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-indigo-500">Knowledge Graph</Badge>
                  Visual Exploration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Explore interactive force-directed graphs showing relationships between entities.
                  Filter by category, click nodes to view details, and discover connected research.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-pink-500">Community</Badge>
                  Collaborate & Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Connect with other researchers, share insights, follow people of interest,
                  and build your professional network in space biology.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <h3 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
              Entity Types in Our Database
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 text-center">
                <Badge className="bg-green-500 mb-2">Sample</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Biological specimens and organisms studied
                </p>
              </div>
              <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 text-center">
                <Badge className="bg-amber-500 mb-2">Conditions</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Environmental factors and experimental settings
                </p>
              </div>
              <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 text-center">
                <Badge className="bg-red-500 mb-2">Result</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Observed outcomes and findings
                </p>
              </div>
              <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 text-center">
                <Badge className="bg-purple-500 mb-2">Objective</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Research goals and measured endpoints
                </p>
              </div>
              <div className="rounded-lg border bg-white dark:bg-slate-900 p-4 text-center">
                <Badge className="bg-cyan-500 mb-2">Entity</Badge>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Other relevant scientific entities
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Ready to explore NASA&apos;s space biology research?
            </p>
            <Button asChild size="lg" className="bg-[#2a5298] hover:bg-[#1e3a6f]">
              <Link href="/login">
                Sign In to Start
              </Link>
            </Button>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </>
  );
}

