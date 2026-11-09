import { useEffect, useRef, useState } from 'react';
import type { Highlight } from '@cherrytree/shared';

import { AgentError, streamAdvisorTurn } from '../lib/agent.ts';
import type { LiveRedHighlight } from '../utils/advisorScreen.ts';

/**
 * The turn this tab is sending, shown on its screen until the saved turn arrives through
 * Firestore: the reply, then its highlights and the answer as they stream. `saved` once the
 * service has saved it.
 */
interface LiveTurn {
  index: number;
  screen: string;
  reply: string;
  greenHighlights: Highlight[];
  redHighlights: LiveRedHighlight[];
  answer: string;
  saved: boolean;
}

export interface AdvisorTurnControls {
  live: LiveTurn | null;
  error: AgentError | null;
  /** Resolves `true` once the turn is saved; on failure the reply is not cleared. */
  send: (screen: string, reply: string, expectedTurnIndex: number) => Promise<boolean>;
}

/** Sends Advisor turns one at a time. Leaving the page aborts a running turn (nothing is saved). */
export function useAdvisorTurn(projectId: string): AdvisorTurnControls {
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [error, setError] = useState<AgentError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (screen: string, reply: string, expectedTurnIndex: number) => {
    if (abortRef.current) return false;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLive({
      index: expectedTurnIndex,
      screen,
      reply,
      greenHighlights: [],
      redHighlights: [],
      answer: '',
      saved: false,
    });
    const update = (change: (turn: LiveTurn) => Partial<LiveTurn>) =>
      setLive((turn) => turn && { ...turn, ...change(turn) });

    try {
      const request = { reply, expectedTurnIndex };
      for await (const event of streamAdvisorTurn(projectId, request, controller.signal)) {
        switch (event.type) {
          case 'green_highlight':
            update((turn) => ({ greenHighlights: [...turn.greenHighlights, event.highlight] }));
            break;
          case 'red_highlight':
            update((turn) => ({
              redHighlights: [
                ...turn.redHighlights,
                { followupId: event.followupId, highlight: event.highlight },
              ],
            }));
            break;
          case 'withdraw_red_highlights':
            update((turn) => ({
              redHighlights: turn.redHighlights.filter(
                (red) => !event.followupIds.includes(red.followupId),
              ),
            }));
            break;
          case 'answer_delta':
            update((turn) => ({ answer: turn.answer + event.text }));
            break;
          case 'done':
            update(() => ({ saved: true }));
            return true;
        }
      }
      return false;
    } catch (cause) {
      if (controller.signal.aborted) return false;
      if (!(cause instanceof AgentError)) console.error('Advisor turn failed:', cause);
      setLive(null);
      setError(cause instanceof AgentError ? cause : new AgentError('temporary'));
      return false;
    } finally {
      abortRef.current = null;
    }
  };

  return { live, error, send };
}
