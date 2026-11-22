import { useState } from 'react';

import { skipInterview } from '../../lib/agent.ts';

/**
 * Dev and local only: ends the interview with the answers given so far, so the draft and the
 * editor can be tried without answering every question.
 */
function SkipToEnd({ projectId }: { projectId: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle');
  const skip = async () => {
    setState('working');
    try {
      await skipInterview(projectId);
    } catch (error) {
      console.error('Skipping to the end failed:', error);
      setState('failed');
    }
  };
  return (
    <button
      type="button"
      onClick={() => void skip()}
      disabled={state === 'working'}
      title="Dev only: end the interview with the answers so far"
      className="rounded-full border border-dashed border-ink-faint px-3 py-1 text-[0.75rem] text-ink-muted transition hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {state === 'working'
        ? 'Skipping…'
        : state === 'failed'
          ? 'Skip failed, retry'
          : 'Skip to the end'}
    </button>
  );
}

export default SkipToEnd;
