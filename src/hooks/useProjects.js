import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to fetch all projects for a user via their Clerk organization memberships
 */
export function useProjects(currentUser, userMemberships, orgsLoaded) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !orgsLoaded) return;

      try {
        const allProjects = [];
        const orgIds = userMemberships?.data?.map(m => m.organization.id) || [];

        if (orgIds.length > 0) {
          const projectsRef = collection(db, 'projects');

          for (const orgId of orgIds) {
            const orgQuery = query(
              projectsRef,
              where('clerkOrgId', '==', orgId),
              limit(100)
            );
            const snapshot = await getDocs(orgQuery);

            snapshot.docs.forEach(doc => {
              if (!allProjects.find(p => p.id === doc.id)) {
                allProjects.push({ id: doc.id, ...doc.data() });
              }
            });
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
  }, [currentUser, userMemberships, orgsLoaded]);

  return { projects, loading };
}
