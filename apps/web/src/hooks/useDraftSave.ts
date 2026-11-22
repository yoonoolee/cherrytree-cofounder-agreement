import { useCallback, useEffect, useRef, useState } from 'react';
import type { DraftBlock } from '@cherrytree/shared';

import { AgentError, saveDraft } from '../lib/agent.ts';

export type SaveStatus = 'saved' | 'saving' | 'failed' | 'stale';

const DELAY_MS = 900;

/**
 * Saves the editor's document a moment after each change, one save at a time, each based on the
 * version the last one returned. `stale` once the draft changed elsewhere: saving stops there.
 */
export function useDraftSave(projectId: string, initialVersion: number) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const version = useRef(initialVersion);
  const latest = useRef<DraftBlock[] | null>(null);
  const saving = useRef(false);
  const stale = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (saving.current) return;
    saving.current = true;
    let failed = false;
    // Changes made while a save is in flight are saved right after it, on its new version.
    while (latest.current && !stale.current && !failed) {
      const content = latest.current;
      latest.current = null;
      try {
        version.current = await saveDraft(projectId, { content, version: version.current });
      } catch (error) {
        console.error('Saving the draft failed:', error);
        if (error instanceof AgentError && error.code === 'stale') stale.current = true;
        else {
          latest.current ??= content;
          failed = true;
        }
      }
    }
    saving.current = false;
    setStatus(stale.current ? 'stale' : failed ? 'failed' : 'saved');
  }, [projectId]);

  const schedule = useCallback(
    (content: DraftBlock[]) => {
      if (stale.current) return;
      latest.current = content;
      setStatus('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DELAY_MS);
    },
    [flush],
  );

  // Leaving the page saves what is waiting.
  useEffect(() => () => void flush(), [flush]);

  return { status, schedule, retry: flush };
}
