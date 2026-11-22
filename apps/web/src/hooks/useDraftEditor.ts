import { useEffect, useState } from 'react';
import { getDoc, onSnapshot } from 'firebase/firestore';
import type { AgentEdit, Draft, Thread } from '@cherrytree/shared';

import { agentEditsQuery, draftRef, threadsQuery } from '../lib/firebase.ts';

export interface WithId<T> {
  id: string;
  data: T;
}

export type DraftEditorData =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'ready';
      /** The draft as it was when the editor opened; from then on the editor owns the document. */
      draft: Draft;
      threads: WithId<Thread>[];
      edits: WithId<AgentEdit>[];
    };

/** The draft once, and its comment threads and agent edits live. */
export function useDraftEditor(projectId: string): DraftEditorData {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [threads, setThreads] = useState<WithId<Thread>[] | null>(null);
  const [edits, setEdits] = useState<WithId<AgentEdit>[] | null>(null);

  useEffect(() => {
    let active = true;
    const fail = (cause: unknown) => {
      console.error('Draft failed to load:', cause);
      if (active) setFailed(attempt);
    };
    getDoc(draftRef(projectId)).then((snapshot) => {
      const data = snapshot.data();
      if (!active) return;
      if (data) setDraft(data);
      else fail(new Error('No draft'));
    }, fail);
    const stopThreads = onSnapshot(
      threadsQuery(projectId),
      (snapshot) => setThreads(snapshot.docs.map((d) => ({ id: d.id, data: d.data() }))),
      fail,
    );
    const stopEdits = onSnapshot(
      agentEditsQuery(projectId),
      (snapshot) => setEdits(snapshot.docs.map((d) => ({ id: d.id, data: d.data() }))),
      fail,
    );
    return () => {
      active = false;
      stopThreads();
      stopEdits();
    };
  }, [projectId, attempt]);

  if (failed === attempt) return { status: 'error', retry: () => setAttempt((n) => n + 1) };
  if (!draft || !threads || !edits) return { status: 'loading' };
  return { status: 'ready', draft, threads, edits };
}
