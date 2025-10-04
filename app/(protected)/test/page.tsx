'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface DiagnosticCheck {
  status: string;
  error?: string;
  note?: string;
  count?: number;
}

interface DiagnosticRecommendation {
  priority: string;
  action: string;
  file?: string;
  instructions: string;
}

interface DiagnosticData {
  summary?: {
    total_checks: number;
    errors_count: number;
    warnings_count: number;
  };
  errors?: string[];
  warnings?: string[];
  recommendations?: DiagnosticRecommendation[];
  checks?: Record<string, DiagnosticCheck>;
  error?: string;
  message?: string;
}

export default function QuickTest() {
  const [communityResult, setCommunityResult] = useState<string>('Testing...');
  const [verificationDiagnostics, setVerificationDiagnostics] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);

  const testCommunity = async () => {
    const supabase = createBrowserClient();
    
    try {
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
        .limit(3);

      if (error) {
        setCommunityResult(`ERROR: ${error.message}\n\nDetails: ${JSON.stringify(error, null, 2)}`);
      } else {
        setCommunityResult(`SUCCESS! Found ${data?.length || 0} posts\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setCommunityResult(`EXCEPTION: ${errorMessage}`);
    }
  };

  const runVerificationDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verification/diagnostics');
      const data = await response.json();
      setVerificationDiagnostics(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setVerificationDiagnostics({
        error: 'Failed to fetch diagnostics',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testCommunity();
    runVerificationDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'FAILED':
      case 'MISSING':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge variant="default" className="bg-green-600">OK</Badge>;
      case 'FAILED':
      case 'MISSING':
        return <Badge variant="destructive">FAILED</Badge>;
      default:
        return <Badge variant="secondary">INFO</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Comprehensive testing for Community and Verification systems
          </p>
        </div>
        <Button onClick={runVerificationDiagnostics} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Verification System Diagnostics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification System Diagnostics</CardTitle>
          <CardDescription>
            Checks database tables, functions, RLS policies, and email configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationDiagnostics ? (
            <div className="space-y-6">
              {/* Summary */}
              {verificationDiagnostics.summary && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{verificationDiagnostics.summary.total_checks}</div>
                    <div className="text-sm text-muted-foreground">Total Checks</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {verificationDiagnostics.summary.total_checks - verificationDiagnostics.summary.errors_count}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Passed</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {verificationDiagnostics.summary.errors_count}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {verificationDiagnostics.summary.warnings_count}
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">Warnings</div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {verificationDiagnostics.errors && verificationDiagnostics.errors.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-4 rounded">
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Errors Found:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationDiagnostics.errors.map((error: string, i: number) => (
                      <li key={i} className="text-red-600 dark:text-red-400">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {verificationDiagnostics.warnings && verificationDiagnostics.warnings.length > 0 && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 rounded">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Warnings:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationDiagnostics.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-yellow-600 dark:text-yellow-400">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {verificationDiagnostics.recommendations && verificationDiagnostics.recommendations.length > 0 && (
                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-4 rounded">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Recommendations:</h3>
                  <div className="space-y-3">
                    {verificationDiagnostics.recommendations.map((rec, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={rec.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                          <span className="font-medium">{rec.action}</span>
                        </div>
                        {rec.file && (
                          <div className="text-sm text-muted-foreground">File: {rec.file}</div>
                        )}
                        <div className="text-sm text-blue-600 dark:text-blue-400">{rec.instructions}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Checks */}
              <div>
                <h3 className="font-semibold mb-3">Individual Checks:</h3>
                <div className="space-y-2">
                  {verificationDiagnostics.checks && Object.entries(verificationDiagnostics.checks).map(([key, check]) => (
                    <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="mt-1">{getStatusIcon(check.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          {getStatusBadge(check.status)}
                        </div>
                        {check.error && (
                          <div className="text-sm text-red-600 dark:text-red-400">Error: {check.error}</div>
                        )}
                        {check.note && (
                          <div className="text-sm text-muted-foreground">{check.note}</div>
                        )}
                        {check.count !== undefined && (
                          <div className="text-sm">Count: {check.count}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="cursor-pointer font-medium mb-2">View Raw JSON</summary>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(verificationDiagnostics, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Running diagnostics...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Posts Test */}
      <Card>
        <CardHeader>
          <CardTitle>Community Posts Query Test</CardTitle>
          <CardDescription>
            Tests fetching posts with author profile joins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {communityResult}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
