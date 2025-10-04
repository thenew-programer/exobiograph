import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { isAcademicEmail, getAcademicEmailHint } from '@/lib/academic-emails';

const verificationSchema = z.object({
  verification_method: z.enum(['edu_email', 'researchgate', 'google_scholar', 'orcid', 'linkedin', 'manual_review']),
  edu_email: z.string().email().optional(),
  researchgate_url: z.string().url().optional(),
  google_scholar_url: z.string().url().optional(),
  orcid_id: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  additional_info: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_verified')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.is_verified) {
      return NextResponse.json({ error: 'User is already verified' }, { status: 400 });
    }

    // Check for existing pending request
    const { data: existingRequest, error: checkError } = await supabase
      .from('verification_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'under_review'])
      .single();

    // If table doesn't exist, return helpful error
    if (checkError && checkError.code === '42P01') {
      console.error('verification_requests table does not exist');
      return NextResponse.json(
        { 
          error: 'Verification system not initialized',
          hint: 'Please run the database migration first. See VERIFICATION_SYSTEM.md for instructions.'
        },
        { status: 503 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending verification request' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = verificationSchema.parse(body);

    // Prepare verification request data
    const requestData: Record<string, unknown> = {
      user_id: user.id,
      verification_method: validatedData.verification_method,
      status: 'pending',
    };

    // Add method-specific fields
    if (validatedData.verification_method === 'edu_email' && validatedData.edu_email) {
      // Validate educational/research institution email using shared validator
      if (!isAcademicEmail(validatedData.edu_email)) {
        return NextResponse.json(
          { 
            error: 'Email must be from an educational or research institution',
            hint: getAcademicEmailHint()
          },
          { status: 400 }
        );
      }

      // Generate verification code
      const verificationCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      requestData.edu_email = validatedData.edu_email;
      requestData.verification_code = verificationCode;
      requestData.code_expires_at = expiresAt.toISOString();

      // Send verification email with code
      await sendVerificationEmail(validatedData.edu_email, verificationCode);
    }

    if (validatedData.verification_method === 'researchgate') {
      if (!validatedData.researchgate_url?.includes('researchgate.net')) {
        return NextResponse.json(
          { error: 'Invalid ResearchGate profile URL' },
          { status: 400 }
        );
      }
      requestData.researchgate_url = validatedData.researchgate_url;
      requestData.status = 'under_review';
    }

    if (validatedData.verification_method === 'google_scholar') {
      if (!validatedData.google_scholar_url?.includes('scholar.google')) {
        return NextResponse.json(
          { error: 'Invalid Google Scholar profile URL' },
          { status: 400 }
        );
      }
      requestData.google_scholar_url = validatedData.google_scholar_url;
      requestData.status = 'under_review';
    }

    if (validatedData.verification_method === 'orcid') {
      // Validate ORCID format (XXXX-XXXX-XXXX-XXXX)
      const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
      if (!validatedData.orcid_id || !orcidRegex.test(validatedData.orcid_id)) {
        return NextResponse.json(
          { error: 'Invalid ORCID ID format. Expected: XXXX-XXXX-XXXX-XXXX' },
          { status: 400 }
        );
      }
      requestData.orcid_id = validatedData.orcid_id;
      requestData.status = 'under_review';
    }

    if (validatedData.verification_method === 'linkedin') {
      if (!validatedData.linkedin_url?.includes('linkedin.com')) {
        return NextResponse.json(
          { error: 'Invalid LinkedIn profile URL' },
          { status: 400 }
        );
      }
      requestData.linkedin_url = validatedData.linkedin_url;
      requestData.status = 'under_review';
    }

    if (validatedData.additional_info) {
      requestData.additional_info = validatedData.additional_info;
    }

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabase
      .from('verification_requests')
      .insert(requestData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating verification request:', createError);
      
      // Check if it's a table not found error
      if (createError.code === '42P01') {
        return NextResponse.json(
          { 
            error: 'Verification system not initialized',
            hint: 'Database migration required. Run the SQL migration in supabase/migrations/20251004_create_verification_system.sql'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create verification request',
          details: createError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verificationRequest,
      message: validatedData.verification_method === 'edu_email'
        ? 'Verification code sent to your email'
        : 'Verification request submitted for review',
    });

  } catch (error) {
    console.error('Error in verification request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's verification requests
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verification requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: requests });

  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
