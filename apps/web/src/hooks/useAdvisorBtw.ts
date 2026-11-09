import { useEffect, useRef, useState } from 'react';
import type { WebSource } from '@cherrytree/shared';

import { AgentError, streamAdvisorBtw } from '../lib/agent.ts';

/** A btw in the popup: the selected text, then the question and its answer once asked. */
export interface Btw {
  quote: string;
  question: string | null;
  answer: string;
  sources: WebSource[];
  status: 'idle' | 'streaming' | 'done';
  error: AgentError | null;
}

export interface AdvisorBtwControls {
  btw: Btw | null;
  /** Opens the popup on `quote`, closing any other. */
  open: (quote: string) => void;
  ask: (question: string, expectedTurnIndex: number) => Promise<void>;
  /** Closes the popup; a btw still running is cancelled and not saved. */
  close: () => void;
}

/** The btw popup. Once asked, its answer stays in the popup until it is closed. */
export function useAdvisorBtw(projectId: string): AdvisorBtwControls {
  const [btw, setBtw] = useState<Btw | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBtw(null);
  };

  const open = (quote: string) => {
    close();
    setBtw({ quote, question: null, answer: '', sources: [], status: 'idle', error: null });
  };

  const ask = async (question: string, expectedTurnIndex: number) => {
    if (!btw || abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const update = (change: Partial<Btw>) =>
      setBtw((current) => current && { ...current, ...change });
    update({ question, answer: '', status: 'streaming', error: null });

    try {
      const request = { quote: btw.quote, question, expectedTurnIndex };
      let answer = '';
      for await (const event of streamAdvisorBtw(projectId, request, controller.signal)) {
        if (event.type === 'answer_delta') {
          answer += event.text;
          update({ answer });
        } else if (event.type === 'btw_done') {
          update({ answer: event.message.text, sources: event.message.sources, status: 'done' });
        }
      }
    } catch (cause) {
      if (controller.signal.aborted) return;
      if (!(cause instanceof AgentError)) console.error('Advisor btw failed:', cause);
      const error = cause instanceof AgentError ? cause : new AgentError('temporary');
      update({ question: null, answer: '', status: 'idle', error });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  return { btw, open, ask, close };
}
