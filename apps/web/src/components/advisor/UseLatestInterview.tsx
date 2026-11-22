import { useState } from 'react';

import { upgradeInterview } from '../../lib/agent.ts';

/**
 * Ad hoc, dev and local only: moves the interview onto the current `interview.json`, keeping the
 * answers so far (agent `devtools/upgrade_interview.py`). Delete with that file.
 */
function UseLatestInterview({ projectId }: { projectId: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle');
  const upgrade = async () => {
    setState('working');
    try {
      await upgradeInterview(projectId);
      setState('idle');
    } catch (error) {
      console.error('Using the latest interview failed:', error);
      setState('failed');
    }
  };
  return (
    <button
      type="button"
      onClick={() => void upgrade()}
      disabled={state === 'working'}
      title="Dev only: switch to the current interview.json, keeping the answers so far"
      className="rounded-full border border-dashed border-ink-faint px-3 py-1 text-[0.75rem] text-ink-muted transition hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {state === 'working'
        ? 'Updating…'
        : state === 'failed'
          ? 'Update failed, retry'
          : 'Use latest interview'}
    </button>
  );
}

export default UseLatestInterview;
