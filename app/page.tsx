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
              Discover insights from NASA&apos;s biological research using natural language queries
              and interactive knowledge graphs. Uncover relationships between organisms, conditions,
              effects, and experimental endpoints in space biology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-[#2a5298] hover:bg-[#1e3a6f] text-white">
                <Link href="/login">
                  Get Started →
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">
                  Create Account
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
                Organisms, conditions, effects
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

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 id="how-it-works" className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            What is ExoBioGraph?
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-500">Organism</Badge>
                  Biological Entities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Living organisms studied in space, including mice, plants like <em>Arabidopsis thaliana</em>,
                  human cells, and microbial cultures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-amber-500">Condition</Badge>
                  Environmental Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Experimental conditions such as microgravity, radiation exposure, low Earth orbit,
                  and simulated deep space environments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-red-500">Effect</Badge>
                  Biological Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Observed biological effects including bone density loss, muscle atrophy, DNA damage,
                  immune suppression, and altered gene expression.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-purple-500">Endpoint</Badge>
                  Measured Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Quantifiable measurements such as bone mineral content, cell proliferation rates,
                  cytokine levels, and muscle fiber cross-sectional area.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Ready to explore NASA&apos;s space biology research?
            </p>
            <Button asChild size="lg" className="bg-[#2a5298] hover:bg-[#1e3a6f]">
              <Link href="/login">
                Sign In to Start →
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

