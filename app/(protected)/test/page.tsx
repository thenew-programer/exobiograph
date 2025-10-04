'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function QuickTest() {
  const [result, setResult] = useState<string>('Testing...');

  useEffect(() => {
    async function test() {
      const supabase = createBrowserClient();
      
      try {
        // Simple test
        const { data, error } = await supabase
          .from('community_posts')
          .select(`
            *,
            author:profiles!community_posts_author_id_fkey(
              full_name,
              avatar_url,
              institution,
              is_verified,
              reputation_score
            )
          `)
          .limit(1);

        if (error) {
          setResult(`ERROR: ${error.message}\n\nDetails: ${JSON.stringify(error, null, 2)}`);
        } else {
          setResult(`SUCCESS! Found ${data?.length || 0} posts\n\n${JSON.stringify(data, null, 2)}`);
        }
      } catch (e: any) {
        setResult(`EXCEPTION: ${e.message}`);
      }
    }
    test();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quick Community Test</h1>
      <pre className="bg-slate-900 p-4 rounded text-sm whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  );
}
