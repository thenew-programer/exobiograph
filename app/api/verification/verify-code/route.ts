import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendVerificationApprovalEmail } from '@/lib/email';

const verifyCodeSchema = z.object({
  request_id: z.string().uuid(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { request_id, code } = verifyCodeSchema.parse(body);

    // Get verification request
    const { data: verificationRequest, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', request_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (verificationRequest.status === 'approved') {
      return NextResponse.json(
        { error: 'Request already approved' },
        { status: 400 }
      );
    }

    // Check if code expired
    if (verificationRequest.code_expires_at) {
      const expiresAt = new Date(verificationRequest.code_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification code has expired' },
          { status: 400 }
        );
      }
    }

    // Verify code
    if (verificationRequest.verification_code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Auto-approve verification
    const { error: approveError } = await supabase.rpc('approve_verification_request', {
      request_id,
    });

    if (approveError) {
      console.error('Error approving verification:', approveError);
      return NextResponse.json(
        { error: 'Failed to approve verification' },
        { status: 500 }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Send success email (don't block the response if email fails)
    if (profile?.email && profile?.full_name) {
      sendVerificationApprovalEmail(profile.email, profile.full_name).catch((error) => {
        console.error('Failed to send approval email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account is now verified.',
    });

  } catch (error) {
    console.error('Error verifying code:', error);
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
