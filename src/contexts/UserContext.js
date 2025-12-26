import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser, useAuth } from '@clerk/clerk-react';
import { db, auth, functions } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in to Firebase Auth when Clerk user is authenticated
  useEffect(() => {
    const signInToFirebase = async () => {
      if (isLoaded && clerkUser) {
        try {
          // Get Clerk session token
          const sessionToken = await getToken();

          if (sessionToken) {
            // Exchange for Firebase custom token
            const getFirebaseToken = httpsCallable(functions, 'getFirebaseToken');
            const result = await getFirebaseToken({ sessionToken });

            // Sign in to Firebase Auth with custom token
            await signInWithCustomToken(auth, result.data.firebaseToken);
          }
        } catch (error) {
          console.error('Error signing in to Firebase:', error);
        }
      } else if (isLoaded && !clerkUser) {
        // Sign out from Firebase Auth when Clerk user is null
        try {
          await firebaseSignOut(auth);
        } catch (error) {
          // Ignore errors if already signed out
        }
      }
    };

    signInToFirebase();
  }, [clerkUser?.id, isLoaded, getToken]);

  useEffect(() => {
    let unsubscribeFirestore = null;

    if (isLoaded) {
      if (clerkUser) {
        // Listen to Firestore user document in real-time
        const userRef = doc(db, 'users', clerkUser.id);
        unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [clerkUser?.id, isLoaded]);

  const value = {
    currentUser: clerkUser, // Clerk user (id, emailAddresses, etc.)
    userProfile, // Firestore data (plan, stripeCustomerId, etc.)
    loading: !isLoaded || loading,
    displayName: [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
