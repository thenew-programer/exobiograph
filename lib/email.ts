import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ExoBioGraph <noreply@exobiograph.com>',
      to: email,
      subject: 'Verify your ExoBioGraph account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your ExoBioGraph account</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 ExoBioGraph</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-top: 0;">Verify Your Scientific Credentials</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Thank you for choosing to verify your account with ExoBioGraph! Your verification code is:
              </p>
              
              <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #4b5563; font-size: 14px;">
                Enter this code in the verification modal to complete your verification. This code will expire in <strong>24 hours</strong>.
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ExoBioGraph staff will never ask for your verification code.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 5px;">
                If you didn't request this verification, please ignore this email or contact support if you have concerns.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                © ${new Date().getFullYear()} ExoBioGraph - Advancing Space Biology Research
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
ExoBioGraph - Verify Your Account

Your verification code is: ${code}

Enter this code in the verification modal to complete your verification.
This code will expire in 24 hours.

Security Notice: Never share this code with anyone. ExoBioGraph staff will never ask for your verification code.

If you didn't request this verification, please ignore this email.

© ${new Date().getFullYear()} ExoBioGraph
      `.trim(),
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Verification email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendVerificationApprovalEmail(email: string, userName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ExoBioGraph <noreply@exobiograph.com>',
      to: email,
      subject: '✅ Your ExoBioGraph account has been verified!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Verification Approved!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-top: 0;">Congratulations, ${userName}!</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your scientific credentials have been verified! You now have a verified badge on your profile and posts.
              </p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
                <div style="font-size: 18px; font-weight: bold; color: #059669;">
                  Verified Scientist
                </div>
              </div>
              
              <p style="color: #4b5563; font-size: 14px;">
                This badge helps build trust in the ExoBioGraph community and shows that you're a verified researcher in the field of space biology.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://exobiograph.com/community" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Visit Community
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                © ${new Date().getFullYear()} ExoBioGraph - Advancing Space Biology Research
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
ExoBioGraph - Verification Approved!

Congratulations, ${userName}!

Your scientific credentials have been verified! You now have a verified badge on your profile and posts.

This badge helps build trust in the ExoBioGraph community and shows that you're a verified researcher in the field of space biology.

Visit the community: https://exobiograph.com/community

© ${new Date().getFullYear()} ExoBioGraph
      `.trim(),
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Approval email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
}
