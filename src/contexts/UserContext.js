import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser, useAuth, useOrganizationList } from '@clerk/clerk-react';
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
  const {
    userMemberships,
    organizationList,
    setActive,
    isLoaded: orgsLoaded
  } = useOrganizationList({ userMemberships: { infinite: true } });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);

  // Sign in to Firebase Auth when Clerk user is authenticated
  useEffect(() => {
    const signInToFirebase = async () => {
      if (isLoaded && clerkUser) {
        try {
          // Get Clerk session token and exchange for Firebase token via cloud function
          const sessionToken = await getToken();
          if (!sessionToken) return;

          const getFirebaseToken = httpsCallable(functions, 'getFirebaseToken');
          const result = await getFirebaseToken({ sessionToken });
          const { firebaseToken } = result.data;

          if (firebaseToken) {
            await signInWithCustomToken(auth, firebaseToken);
            setFirebaseAuthReady(true);
          }
        } catch (error) {
          console.error('Error signing in to Firebase:', error);
          setFirebaseAuthReady(false);
        }
      } else if (isLoaded && !clerkUser) {
        setFirebaseAuthReady(false);
        try {
          await firebaseSignOut(auth);
        } catch (error) {
          // Ignore sign out errors
        }
      }
    };

    signInToFirebase();
  }, [clerkUser?.id, isLoaded, getToken]);

  useEffect(() => {
    let unsubscribeFirestore = null;

    if (isLoaded && firebaseAuthReady && clerkUser) {
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
    } else if (isLoaded && !clerkUser) {
      setUserProfile(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [clerkUser?.id, isLoaded, firebaseAuthReady]);

  const isAuthReady = isLoaded && (!clerkUser || firebaseAuthReady);

  const value = {
    currentUser: clerkUser,
    userProfile,
    loading: !isAuthReady || loading,
    displayName: [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    // Organization data (fetched once, shared everywhere)
    userMemberships,
    organizationList,
    setActive,
    orgsLoaded
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
