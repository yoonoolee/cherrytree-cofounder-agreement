import { useState, useEffect } from 'react';
import { getDoc } from 'firebase/firestore';

import type { ClerkUser, UserContextValue } from './useUser.ts';
import { projectRef } from '../lib/firebase.ts';
import type { ProjectWithId } from './useProjectSync.ts';

/**
 * Hook to fetch all projects for a user via their Clerk organization memberships
 * orgId === projectId (Clerk org ID is the Firestore document ID)
 */
export function useProjects(
  currentUser: ClerkUser | null | undefined,
  userMemberships: UserContextValue['userMemberships'],
  orgsLoaded: boolean,
  authLoading: boolean,
) {
  const [projects, setProjects] = useState<ProjectWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !orgsLoaded || authLoading) return;

      try {
        const allProjects: ProjectWithId[] = [];
        const orgIds = userMemberships?.data?.map((m) => m.organization.id) || [];

        for (const orgId of orgIds) {
          try {
            const projectDoc = await getDoc(projectRef(orgId));
            if (projectDoc.exists()) {
              allProjects.push({ id: projectDoc.id, ...projectDoc.data() });
            }
          } catch (err) {
            console.error(`Error fetching project ${orgId}:`, (err as Error).message);
          }
        }

        // Sort by lastOpened (most recent first)
        allProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, [currentUser, userMemberships, orgsLoaded, authLoading]);

  return { projects, loading };
}
