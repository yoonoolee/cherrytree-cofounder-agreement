import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function RedirectToLatestProject() {
  const navigate = useNavigate();
  const { currentUser, loading } = useUser();

  useEffect(() => {
    const redirectToLatest = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const projectsRef = collection(db, 'projects');

        // Query for user's projects (owned or collaborated)
        // Don't use orderBy here to handle projects without lastOpened field
        const ownedQuery = query(
          projectsRef,
          where('ownerId', '==', currentUser.uid)
        );

        const collaboratorQuery = query(
          projectsRef,
          where('collaboratorIds', 'array-contains', currentUser.uid)
        );

        // Execute both queries
        const [ownedSnapshot, collaboratorSnapshot] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(collaboratorQuery)
        ]);

        // Collect all projects
        const allProjects = [];

        ownedSnapshot.docs.forEach(doc => {
          allProjects.push({ id: doc.id, ...doc.data() });
        });

        collaboratorSnapshot.docs.forEach(doc => {
          // Avoid duplicates
          if (!allProjects.find(p => p.id === doc.id)) {
            allProjects.push({ id: doc.id, ...doc.data() });
          }
        });

        if (allProjects.length === 0) {
          // No projects found - redirect to pricing to create one
          navigate('/pricing');
          return;
        }

        // Sort by lastOpened (fallback to createdAt if lastOpened doesn't exist)
        allProjects.sort((a, b) => {
          const aTime = a.lastOpened?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const bTime = b.lastOpened?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // Navigate to the most recent project
        navigate(`/survey/${allProjects[0].id}`);
      } catch (error) {
        console.error('Error fetching latest project:', error);
        navigate('/pricing');
      }
    };

    // Only run when loading is complete and we have auth state
    if (!loading) {
      redirectToLatest();
    }
  }, [currentUser, loading, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="mt-4 text-gray-600">Loading your workspace...</p>
      </div>
    </div>
  );
}

export default RedirectToLatestProject;
