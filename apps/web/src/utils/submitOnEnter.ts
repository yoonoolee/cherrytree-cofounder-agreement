import type { KeyboardEvent } from 'react';

/**
 * A reply box's keys: Enter submits its form, Shift+Enter starts a new line, and Enter while
 * composing (an IME, e.g. Korean or Japanese) only confirms the characters.
 */
export function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}
