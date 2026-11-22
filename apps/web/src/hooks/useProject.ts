import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import type { Project } from '@cherrytree/shared';

import { projectRef } from '../lib/firebase.ts';

export type ProjectData =
  | { status: 'loading' }
  | { status: 'error'; missing: boolean; retry: () => void }
  | { status: 'ready'; project: Project };

type Loaded = { status: 'error'; missing: boolean } | { status: 'ready'; project: Project };

/**
 * Follows the project document live, so the page moves on as `draftStatus` changes. Mount it
 * once the Firebase session exists: the rules deny reads before it.
 */
export function useProject(projectId: string): ProjectData {
  const [attempt, setAttempt] = useState(0);
  // Tagged with its attempt, so a retry shows loading until its own first snapshot.
  const [loaded, setLoaded] = useState<{ attempt: number; result: Loaded } | null>(null);

  useEffect(() => {
    const settle = (result: Loaded) => setLoaded({ attempt, result });
    const fail = (cause: unknown) => {
      console.error('Project failed to load:', cause);
      settle({ status: 'error', missing: false });
    };
    return onSnapshot(
      projectRef(projectId),
      (snapshot) => {
        // Reads are validated against the shared schema, so a malformed document throws here.
        try {
          const project = snapshot.data();
          settle(project ? { status: 'ready', project } : { status: 'error', missing: true });
        } catch (cause) {
          fail(cause);
        }
      },
      fail,
    );
  }, [projectId, attempt]);

  if (loaded?.attempt !== attempt) return { status: 'loading' };
  if (loaded.result.status === 'error') {
    return { ...loaded.result, retry: () => setAttempt((n) => n + 1) };
  }
  return loaded.result;
}
