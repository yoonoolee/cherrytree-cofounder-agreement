import { useCallback, useEffect } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

/**
 * While `when`, leaving the page asks first: in-app navigation (links, the browser's Back) with
 * `message`, a reload or closing the tab with the browser's own prompt.
 */
function LeavePrompt({ when, message }: { when: boolean; message: string }) {
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker, message]);

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (when) event.preventDefault();
      },
      [when],
    ),
  );

  return null;
}

export default LeavePrompt;
