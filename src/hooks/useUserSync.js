import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to sync Clerk user data to Firestore
 * Creates/updates user document when user logs in
 * Works automatically with Clerk user state changes
 */
function useUserSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const syncUser = async () => {
      try {
        const userId = user.id;
        const userRef = doc(db, 'users', userId);

        // Check if user already exists
        const userSnap = await getDoc(userRef);

        const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;
        const userName = user.firstName || user.fullName || primaryEmail?.split('@')[0];

        if (!userSnap.exists()) {
          // New user - create document
          await setDoc(userRef, {
            userId: userId,
            email: primaryEmail,
            name: userName,
            picture: user.imageUrl || null,
            emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            subscriptionStatus: 'none',
            stripeCustomerId: null,
          });
        } else {
          // Existing user - update last login
          await setDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            email: primaryEmail,
            name: userName,
            picture: user.imageUrl || null,
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error syncing user to Firestore:', error);
      }
    };

    syncUser();
  }, [user?.id, isLoaded]);
}

export default useUserSync;
