import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to fetch all projects for a user via their Clerk organization memberships
 * orgId === projectId (Clerk org ID is the Firestore document ID)
 */
export function useProjects(currentUser, userMemberships, orgsLoaded, authLoading) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !orgsLoaded || authLoading) return;

      try {
        const allProjects = [];
        const orgIds = userMemberships?.data?.map(m => m.organization.id) || [];

        for (const orgId of orgIds) {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', orgId));
            if (projectDoc.exists()) {
              allProjects.push({ id: projectDoc.id, ...projectDoc.data() });
            }
          } catch (err) {
            console.error(`Error fetching project ${orgId}:`, err.message);
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

    fetchProjects();
  }, [currentUser, userMemberships, orgsLoaded, authLoading]);

  return { projects, loading };
}
