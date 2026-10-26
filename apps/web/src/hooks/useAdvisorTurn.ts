import { useEffect, useRef, useState } from 'react';
import type { AdvisorResponse, WebSource } from '@cherrytree/shared';

import { AgentError, streamAdvisorTurn } from '../lib/agent.ts';
import type { AdvisorScreen } from '../utils/advisorScreen.ts';

/**
 * The turn this tab sent, shown on the screen it was sent from until the saved turn arrives
 * through Firestore.
 * - `streaming`: highlights, answer and sources as they arrive.
 * - `saved`: the saved response. `held` when it moves on to the next main question (or ends the
 *   interview): it stays on this screen until the user confirms the move.
 */
export type LiveTurn =
  | {
      status: 'streaming';
      screen: AdvisorScreen;
      reply: string;
      /** `null` until the highlights arrive. */
      highlights: string[] | null;
      answer: string;
      sources: WebSource[];
    }
  | {
      status: 'saved';
      screen: AdvisorScreen;
      reply: string;
      index: number;
      response: AdvisorResponse;
      held: boolean;
    };

type StreamingTurn = Extract<LiveTurn, { status: 'streaming' }>;

export interface AdvisorTurnControls {
  live: LiveTurn | null;
  error: AgentError | null;
  /** Resolves `true` once the turn is saved; on failure the reply is not cleared. */
  send: (screen: AdvisorScreen, reply: string, expectedTurnIndex: number) => Promise<boolean>;
  /** Leaves a held turn for the next main question's screen. */
  advance: () => void;
}

const holdsScreen = ({ question }: AdvisorResponse): boolean => question?.type !== 'followup';

/** Sends Advisor turns one at a time. Leaving the page aborts a running turn (nothing is saved). */
export function useAdvisorTurn(projectId: string): AdvisorTurnControls {
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [error, setError] = useState<AgentError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (screen: AdvisorScreen, reply: string, expectedTurnIndex: number) => {
    if (abortRef.current) return false;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLive({ status: 'streaming', screen, reply, highlights: null, answer: '', sources: [] });

    const update = (change: (turn: StreamingTurn) => Partial<StreamingTurn>) =>
      setLive((turn) => (turn?.status === 'streaming' ? { ...turn, ...change(turn) } : turn));

    try {
      const events = streamAdvisorTurn(projectId, { reply, expectedTurnIndex }, controller.signal);
      for await (const event of events) {
        switch (event.type) {
          case 'highlights':
            update(() => ({ highlights: event.highlights }));
            break;
          case 'answer_delta':
            update((turn) => ({ answer: turn.answer + event.text }));
            break;
          case 'sources':
            update(() => ({ sources: event.sources }));
            break;
          case 'done':
            setLive({
              status: 'saved',
              screen,
              reply,
              index: event.index,
              response: event.response,
              held: holdsScreen(event.response),
            });
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

  return { live, error, send, advance: () => setLive(null) };
}
