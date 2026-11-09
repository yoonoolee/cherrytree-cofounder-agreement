import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import type { AdvisorState, AdvisorTurn } from '@cherrytree/shared';

import { startAdvisorSession } from '../lib/agent.ts';
import { advisorStateRef, advisorTurnsQuery } from '../lib/firebase.ts';

export type AdvisorData =
  | { status: 'loading' }
  | { status: 'error'; error: unknown; retry: () => void }
  | { status: 'ready'; state: AdvisorState; turns: AdvisorTurn[] };

/**
 * Starts the project's Advisor session and follows its question list and turns live, so every
 * open tab shows the latest saved turn. Mount it once per project (keyed by project id).
 */
export function useAdvisor(projectId: string): AdvisorData {
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [state, setState] = useState<AdvisorState | null>(null);
  const [turns, setTurns] = useState<AdvisorTurn[] | null>(null);

  useEffect(() => {
    let active = true;
    const fail = (cause: unknown) => {
      if (!active) return;
      console.error('Advisor failed to load:', cause);
      setError(cause);
    };

    // Reads are validated against the shared schemas, so a malformed document throws here.
    const read = (apply: () => void) => {
      try {
        apply();
      } catch (cause) {
        fail(cause);
      }
    };

    startAdvisorSession(projectId).then(() => active && setStarted(true), fail);
    // The state document appears once the session has started; until then it reads as missing.
    const stopState = onSnapshot(
      advisorStateRef(projectId),
      (snapshot) => read(() => setState(snapshot.data() ?? null)),
      fail,
    );
    const stopTurns = onSnapshot(
      advisorTurnsQuery(projectId),
      (snapshot) => read(() => setTurns(snapshot.docs.map((turn) => turn.data()))),
      fail,
    );
    return () => {
      active = false;
      stopState();
      stopTurns();
    };
  }, [projectId, attempt]);

  if (error) {
    return {
      status: 'error',
      error,
      retry: () => {
        setError(null);
        setAttempt((n) => n + 1);
      },
    };
  }
  if (!started || !state || !turns) return { status: 'loading' };
  return { status: 'ready', state, turns };
}
