import type { AgentErrorCode } from '../lib/agent.ts';

/** The bottom box once a screen is covered; the button opens the next screen. */
export const ADVISOR_MOVE_ON = {
  text: "That's all we need here. Click Next to continue.",
  button: 'Next',
};

export const ADVISOR_COPY = {
  replyPlaceholder: 'The more you share, the better. Just brain dump.',
  followupPlaceholder: 'Say as much as you want.',
  selectHint: 'Select to ask',
  btwPlaceholder: 'Ask a question…',
  /** While the Advisor works on a reply: before its highlights, then while they come in. */
  thinking: { reading: 'Reading your answer', highlighting: 'Highlighting the main points' },
  /** While a btw is answered. */
  btwThinking: 'Looking into it',
  /** Asked before leaving while the Advisor answers: leaving cancels the reply, unsaved. */
  leaveWhileAnswering:
    "The Advisor is still answering. If you leave now, what you just sent won't be saved. Leave anyway?",
  loadError: "We couldn't load your conversation.",
  loadErrorBody: 'Check your connection and try again. Your answers are saved.',
};

/** Shown once the Advisor ends the interview; `action` starts the draft. */
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
