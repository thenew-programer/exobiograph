'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosticResult {
  success: boolean;
  count?: number;
  userId?: string;
  email?: string;
  error?: string;
  details?: unknown;
  sample?: unknown;
}

interface DiagnosticResults {
  [key: string]: DiagnosticResult;
}

export default function DiagnosticPage() {
  const [results, setResults] = useState<DiagnosticResults>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const supabase = createBrowserClient();
      const diagnostics: DiagnosticResults = {};

      try {
        // Test 1: Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        diagnostics.auth = {
          success: !authError,
          userId: user?.id,
          email: user?.email,
          error: authError?.message
        };

        // Test 2: Check community_posts table access
        const { data: posts, error: postsError } = await supabase
          .from('community_posts')
          .select('*')
          .limit(1);
        
        diagnostics.posts_access = {
          success: !postsError,
          count: posts?.length || 0,
          error: postsError?.message,
          details: postsError
        };

        // Test 3: Check profiles table access
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        diagnostics.profiles_access = {
          success: !profilesError,
          count: profiles?.length || 0,
          error: profilesError?.message
        };

        // Test 4: Check community_tags table
        const { data: tags, error: tagsError } = await supabase
          .from('community_tags')
          .select('*');
        
        diagnostics.tags_access = {
          success: !tagsError,
          count: tags?.length || 0,
          error: tagsError?.message
        };

        // Test 5: Test the actual query from CommunityPageClient
        const { data: fullQuery, error: fullError } = await supabase
          .from('community_posts')
          .select(`
            *,
            author:profiles(
              full_name,
              avatar_url,
              institution,
              is_verified,
              reputation_score
            ),
            tags:post_tags(
              tag:community_tags(*)
            )
          `)
          .eq('is_archived', false)
          .limit(5);
        
        diagnostics.full_query = {
          success: !fullError,
          count: fullQuery?.length || 0,
          error: fullError?.message,
          details: fullError,
          sample: fullQuery?.[0]
        };

        // Test 6: Count total posts
        const { count, error: countError } = await supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true });
        
        diagnostics.total_posts = {
          success: !countError,
          count: count || 0,
          error: countError?.message
        };

      } catch (error) {
        diagnostics.general_error = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setResults(diagnostics);
      setLoading(false);
    }

    runDiagnostics();
  }, []);

  if (loading) {
    return <div className="p-8">Running diagnostics...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold mb-6">Community Database Diagnostics</h1>
      
      {Object.entries(results).map(([key, value]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {value.success ? '✅' : '❌'} {key.replace(/_/g, ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(value, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
