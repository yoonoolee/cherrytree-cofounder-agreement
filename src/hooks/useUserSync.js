import { useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to sync Firebase Auth user data to Firestore
 * Creates/updates user document when user logs in
 * Works automatically with Firebase Auth state changes
 */
function useUserSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // User is logged out
        return;
      }

      try {
        const userId = user.uid;
        const userRef = doc(db, 'users', userId);

        // Check if user already exists
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // New user - create document
          await setDoc(userRef, {
            userId: userId,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
            picture: user.photoURL || null,
            emailVerified: user.emailVerified || false,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            subscriptionStatus: 'none', // none, active, cancelled
            plan: null, // starter, pro
            stripeCustomerId: null,
            hasCompletedOnboarding: false,
          });
        } else {
          // Existing user - update last login
          await setDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            // Update email/name in case they changed
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
            picture: user.photoURL || null,
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error syncing user to Firestore:', error);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
}

export default useUserSync;
