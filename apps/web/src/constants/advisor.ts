import type { AgentErrorCode } from '../lib/agent.ts';

/** The bottom box once a main question is covered; the button opens the next one's screen. */
export const ADVISOR_MOVE_ON = {
  text: "We're good for this part. Click Next to move on.",
  next_question: 'Next question',
  next_section: 'Next section',
};

/** The highlight legend in the bottom box. */
export const ADVISOR_LEGEND = { kept: 'Kept', needs: 'Needs more' };

export const ADVISOR_COPY = {
  replyPlaceholder: 'Start anywhere. Say as much as you want.',
  followupPlaceholder: 'Say as much as you want.',
  selectHint: 'Select to ask',
  btwPlaceholder: 'Ask a question…',
  thinking: 'Thinking…',
};

/** Shown once every main question is done or skipped; `action` starts the draft. */
export const ADVISOR_COMPLETE = {
  title: 'That covers everything.',
  body: "Your answers are saved. Next, Cherrytree writes the first draft of your cofounder agreement from them. Once it starts, the interview is closed and your answers can't be changed here.",
  action: 'Write my draft',
};

/** What the user sees when a turn fails; their reply stays in the box. */
export function advisorErrorMessage(
  code: AgentErrorCode,
  retryAfterSeconds: number | null,
): string {
  switch (code) {
    case 'temporary':
      return 'Something went wrong. Your message is still here. Try again.';
    case 'refusal':
      return "I couldn't respond to that. Try rephrasing your message.";
    case 'stale':
      return 'This conversation moved on in another tab. Your message is still here.';
    case 'rate_limited': {
      const minutes = retryAfterSeconds ? Math.ceil(retryAfterSeconds / 60) : null;
      return minutes
        ? `You've sent a lot of messages this hour. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
        : "You've sent a lot of messages this hour. Try again later.";
    }
    case 'unauthenticated':
      return 'Your session has expired. Reload the page to continue.';
    case 'forbidden':
      return "You don't have access to this project.";
  }
}
