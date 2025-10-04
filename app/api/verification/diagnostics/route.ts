import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface DiagnosticCheck {
  status: string;
  [key: string]: unknown;
}

interface DiagnosticsData {
  timestamp: string;
  checks: Record<string, DiagnosticCheck>;
  errors: string[];
  warnings: string[];
  summary?: {
    total_checks: number;
    errors_count: number;
    warnings_count: number;
    ready_for_verification: boolean;
  };
  recommendations?: Array<{
    priority: string;
    action: string;
    file?: string;
    instructions: string;
  }>;
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const diagnostics: DiagnosticsData = {
      timestamp: new Date().toISOString(),
      checks: {},
      errors: [],
      warnings: [],
    };

    // 1. Check Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    diagnostics.checks.authentication = {
      status: user ? 'OK' : 'FAILED',
      user_id: user?.id,
      email: user?.email,
      error: authError?.message,
    };

    if (!user) {
      diagnostics.errors.push('Not authenticated');
      return NextResponse.json(diagnostics, { status: 401 });
    }

    // 2. Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_verified, created_at')
      .eq('id', user.id)
      .single();

    diagnostics.checks.profile = {
      status: profile ? 'OK' : 'FAILED',
      exists: !!profile,
      is_verified: profile?.is_verified,
      full_name: profile?.full_name,
      error: profileError?.message,
      error_code: profileError?.code,
    };

    if (profileError) {
      diagnostics.errors.push(`Profile error: ${profileError.message}`);
    }

    // 3. Check if verification_requests table exists
    const { error: tableError } = await supabase
      .from('verification_requests')
      .select('count')
      .limit(0);

    const tableExists = !tableError || tableError.code !== '42P01';
    
    diagnostics.checks.verification_requests_table = {
      status: tableExists ? 'OK' : 'MISSING',
      exists: tableExists,
      error: tableError?.message,
      error_code: tableError?.code,
    };

    if (!tableExists) {
      diagnostics.errors.push('verification_requests table does not exist - MIGRATION REQUIRED');
      diagnostics.warnings.push('Run: supabase/migrations/20251004_create_verification_system.sql');
    }

    // 4. Check for existing verification requests (only if table exists)
    if (tableExists) {
      const { data: requests, error: requestsError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      diagnostics.checks.verification_requests = {
        status: requestsError ? 'FAILED' : 'OK',
        count: requests?.length || 0,
        requests: requests?.map(r => ({
          id: r.id,
          method: r.verification_method,
          status: r.status,
          created_at: r.created_at,
          email: r.edu_email,
        })),
        error: requestsError?.message,
      };

      if (requestsError) {
        diagnostics.errors.push(`Failed to fetch requests: ${requestsError.message}`);
      }
    }

    // 5. Check verification enums exist
    if (tableExists) {
      diagnostics.checks.database_enums = {
        status: 'CHECKING',
        note: 'Enums checked indirectly via table structure',
      };
    }

    // 6. Check functions exist
    if (tableExists) {
      const { error: funcError } = await supabase.rpc('approve_verification_request', {
        request_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
      });

      const functionExists = funcError?.code !== '42883'; // function does not exist
      
      diagnostics.checks.approve_function = {
        status: functionExists ? 'OK' : 'MISSING',
        exists: functionExists,
        error: funcError?.message,
        error_code: funcError?.code,
      };

      if (!functionExists) {
        diagnostics.errors.push('approve_verification_request function does not exist');
      }
    }

    // 7. Check RLS policies
    if (tableExists) {
      diagnostics.checks.rls_policies = {
        status: 'INFO',
        note: 'RLS policies enforced by Supabase',
        user_can_read_own: 'Should be able to read own requests',
        user_can_create: 'Should be able to create requests',
      };
    }

    // 8. Test academic email validation
    const testEmails = [
      { email: 'test@mit.edu', expected: true },
      { email: 'test@ox.ac.uk', expected: true },
      { email: 'test@nasa.gov', expected: true },
      { email: 'test@gmail.com', expected: false },
    ];

    try {
      const { isAcademicEmail } = await import('@/lib/academic-emails');
      diagnostics.checks.email_validation = {
        status: 'OK',
        tests: testEmails.map(t => ({
          email: t.email,
          expected: t.expected,
          result: isAcademicEmail(t.email),
          passed: isAcademicEmail(t.email) === t.expected,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.checks.email_validation = {
        status: 'FAILED',
        error: errorMessage,
      };
      diagnostics.errors.push(`Email validation import failed: ${errorMessage}`);
    }

    // 9. Check Resend email configuration
    diagnostics.checks.resend_config = {
      status: process.env.RESEND_API_KEY ? 'OK' : 'MISSING',
      api_key_set: !!process.env.RESEND_API_KEY,
      api_key_prefix: process.env.RESEND_API_KEY?.substring(0, 7) || 'NOT_SET',
    };

    if (!process.env.RESEND_API_KEY) {
      diagnostics.warnings.push('RESEND_API_KEY not set in environment');
    }

    // 10. Check @react-email packages
    try {
      await import('@react-email/render');
      diagnostics.checks.react_email_packages = {
        status: 'OK',
        installed: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.checks.react_email_packages = {
        status: 'FAILED',
        installed: false,
        error: errorMessage,
      };
      diagnostics.errors.push('@react-email/render not installed');
    }

    // Summary
    diagnostics.summary = {
      total_checks: Object.keys(diagnostics.checks).length,
      errors_count: diagnostics.errors.length,
      warnings_count: diagnostics.warnings.length,
      ready_for_verification: diagnostics.errors.length === 0,
    };

    // Recommendations
    diagnostics.recommendations = [];
    
    if (!tableExists) {
      diagnostics.recommendations.push({
        priority: 'CRITICAL',
        action: 'Run database migration',
        file: 'supabase/migrations/20251004_create_verification_system.sql',
        instructions: 'See RUN_MIGRATION_FIRST.md',
      });
    }

    if (!process.env.RESEND_API_KEY) {
      diagnostics.recommendations.push({
        priority: 'HIGH',
        action: 'Set RESEND_API_KEY in .env.local',
        instructions: 'Get API key from https://resend.com/api-keys',
      });
    }

    if (profile && !profile.is_verified && tableExists) {
      diagnostics.recommendations.push({
        priority: 'INFO',
        action: 'User is not verified',
        instructions: 'User can submit verification request via /community page',
      });
    }

    const statusCode = diagnostics.errors.length > 0 ? 500 : 200;
    
    return NextResponse.json(diagnostics, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Diagnostics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      error: 'Diagnostics failed',
      message: errorMessage,
      stack: errorStack,
    }, { status: 500 });
  }
}
