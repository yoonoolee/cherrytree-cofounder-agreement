import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Constants
const MAX_PROJECTS_PER_QUERY = 100; // Maximum projects to fetch per query

/**
 * Custom hook to fetch all projects for a user
 * Fetches projects from:
 * 1. Organizations the user is a member of (via clerkOrgId)
 * 2. Projects owned by the user directly (legacy support)
 *
 * @param {object} currentUser - Clerk current user object
 * @param {object} userMemberships - Clerk user memberships
 * @param {boolean} orgsLoaded - Whether orgs have loaded
 * @returns {object} - { projects, loading }
 */
export function useProjects(currentUser, userMemberships, orgsLoaded) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser || !orgsLoaded) return;

      try {
        const allProjects = [];
        const userId = currentUser.id;

        // Get organization IDs from Clerk user memberships
        const orgIds = userMemberships?.data?.map(membership => membership.organization.id) || [];

        if (orgIds.length > 0) {
          // Fetch projects for each organization
          const projectsRef = collection(db, 'projects');

          // Query projects by Clerk Organization IDs
          for (const orgId of orgIds) {
            const orgQuery = query(
              projectsRef,
              where('clerkOrgId', '==', orgId),
              limit(MAX_PROJECTS_PER_QUERY)
            );
            const orgSnapshot = await getDocs(orgQuery);

            orgSnapshot.docs.forEach(doc => {
              if (!allProjects.find(p => p.id === doc.id)) {
                allProjects.push({ id: doc.id, ...doc.data() });
              }
            });
          }
        }

        // Fallback: Also fetch projects without clerkOrgId (legacy projects)
        const projectsRef = collection(db, 'projects');
        const ownedQuery = query(
          projectsRef,
          where('ownerId', '==', userId),
          limit(MAX_PROJECTS_PER_QUERY)
        );
        const ownedSnapshot = await getDocs(ownedQuery);

        ownedSnapshot.docs.forEach(doc => {
          if (!allProjects.find(p => p.id === doc.id)) {
            allProjects.push({ id: doc.id, ...doc.data() });
          }
        });

        // Sort by lastOpened (most recent first)
        allProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
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
