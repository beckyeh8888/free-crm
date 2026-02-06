/**
 * Email Client - Resend wrapper with graceful fallback
 *
 * When RESEND_API_KEY is not set, emails are logged instead of sent.
 * This allows development and testing without a real email service.
 */

import { Resend } from 'resend';

// Initialize Resend client if API key is available
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address
const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'Free CRM <noreply@example.com>';

export interface EmailOptions {
  readonly to: string | readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly from?: string;
  readonly replyTo?: string;
  readonly text?: string;
}

export interface EmailResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly error?: string;
}

/**
 * Send an email using Resend
 *
 * Falls back to console logging when RESEND_API_KEY is not configured.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, replyTo, text } = options;

  // Normalize recipients to array
  const recipients = Array.isArray(to) ? to : [to];

  // Development fallback: log email instead of sending
  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured, logging email instead:');
    console.log(JSON.stringify({ from, to: recipients, subject, replyTo }, null, 2));
    console.log('[Email] HTML content length:', html.length);

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: recipients as string[],
      subject,
      html,
      text,
      replyTo,
    });

    if (result.error) {
      console.error('[Email] Resend error:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Failed to send:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return resend !== null;
}
