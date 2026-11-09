import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import type { Project } from '@cherrytree/shared';

import { projectRef } from '../lib/firebase.ts';

export type ProjectData =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; project: Project };

/** Follows the project document live, so the page moves on as `draftStatus` changes. */
export function useProject(projectId: string): ProjectData {
  const [data, setData] = useState<ProjectData>({ status: 'loading' });

  useEffect(() => {
    const fail = (cause: unknown) => {
      console.error('Project failed to load:', cause);
      setData({ status: 'error' });
    };
    return onSnapshot(
      projectRef(projectId),
      (snapshot) => {
        // Reads are validated against the shared schema, so a malformed document throws here.
        try {
          const project = snapshot.data();
          setData(project ? { status: 'ready', project } : { status: 'error' });
        } catch (cause) {
          fail(cause);
        }
      },
      fail,
    );
  }, [projectId]);

  return data;
}
