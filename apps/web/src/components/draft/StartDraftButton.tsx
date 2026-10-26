import { useState } from 'react';

import { draftErrorMessage } from '../../constants/draft.ts';
import { AgentError, startDraft } from '../../lib/agent.ts';

/**
 * Starts Drafting + Review. On success the project's `draftStatus` changes and the page moves on
 * by itself, so the button only reports a failure.
 */
function StartDraftButton({ projectId, label }: { projectId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      await startDraft(projectId);
    } catch (cause) {
      console.error('Starting the draft failed:', cause);
      setError(draftErrorMessage(cause instanceof AgentError ? cause.code : 'temporary'));
      setPending(false);
    }
  };

  return (
    <div className="mt-10 flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => void start()}
        disabled={pending}
        className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper disabled:opacity-50"
      >
        {label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default StartDraftButton;
