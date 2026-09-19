/**
 * Contact form → email to the team via Resend. Unauthenticated by design (the form is public);
 * App Check is the only gate today.
 */
import { logger } from 'firebase-functions';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { Resend } from 'resend';
import type { CallableRequest as CallableData, CallableResponse } from '@cherrytree/shared';

import {
  CALLABLE_OPTIONS,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  CONTACT_RECIPIENT_EMAIL,
  RESEND_API_KEY,
} from './config.ts';
import { toHttpsError } from './lib/errors.ts';
import { isValidEmail } from './lib/validation.ts';

const SEND_FAILED_MESSAGE =
  'Something went wrong sending your message. Please try again or email us directly.';

function isFilledText(value: unknown, maxLength: number): value is string {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length > 0 && length <= maxLength;
}

export const sendContactMessage = onCall(
  { ...CALLABLE_OPTIONS, secrets: [RESEND_API_KEY] },
  async (
    request: CallableRequest<CallableData<'sendContactMessage'>>,
  ): Promise<CallableResponse<'sendContactMessage'>> => {
    const { name, email, message } = request.data ?? {};

    if (!isFilledText(name, CONTACT_NAME_MAX_LENGTH)) {
      throw new HttpsError('invalid-argument', 'Please enter your name.');
    }
    if (!isValidEmail(email)) {
      throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
    }
    if (!isFilledText(message, CONTACT_MESSAGE_MAX_LENGTH)) {
      throw new HttpsError('invalid-argument', 'Please enter a message.');
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    let result: Awaited<ReturnType<Resend['emails']['send']>>;
    try {
      const resend = new Resend(RESEND_API_KEY.value());
      result = await resend.emails.send({
        from: `Cherrytree Contact Form <${CONTACT_RECIPIENT_EMAIL}>`,
        to: CONTACT_RECIPIENT_EMAIL,
        replyTo: trimmedEmail,
        subject: `New contact form message from ${trimmedName}`,
        text: `From: ${trimmedName} <${trimmedEmail}>\n\n${trimmedMessage}`,
      });
    } catch (error) {
      throw toHttpsError(error, 'Error sending contact message:', SEND_FAILED_MESSAGE);
    }

    if (result.error) {
      logger.error('Resend error sending contact message:', result.error);
      throw new HttpsError('internal', SEND_FAILED_MESSAGE);
    }

    // The submitter's address is personal data; the Resend id is enough to trace the email.
    logger.info('Contact message sent successfully', { resendId: result.data?.id });
    return { success: true };
  },
);
