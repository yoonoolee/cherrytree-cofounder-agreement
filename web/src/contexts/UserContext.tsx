import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  useUser as useClerkUser,
  useAuth,
  useOrganizationList,
  type useOrganizationList as UseOrganizationList,
} from '@clerk/clerk-react';
import { onSnapshot } from 'firebase/firestore';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserDoc } from '@cherrytree/shared';

import { auth, userRef } from '../lib/firebase.ts';
import { callFunction } from '../lib/functions.ts';

/** The signed-in Clerk user, as `useUser` from Clerk exposes it. */
export type ClerkUser = NonNullable<ReturnType<typeof useClerkUser>['user']>;

type OrganizationListValue = ReturnType<
  typeof UseOrganizationList<{ userMemberships: { infinite: true } }>
>;

export interface UserContextValue {
  currentUser: ClerkUser | null | undefined;
  /** `users/{clerkUserId}`, kept in sync by the Clerk webhook; `null` until it exists. */
  userProfile: UserDoc | null;
  /** True until Clerk has loaded, the Firebase session is established and the profile read. */
  loading: boolean;
  /** Account name, else the email local part, else "User". */
  displayName: string;
  // Organization data (fetched once, shared everywhere)
  userMemberships: OrganizationListValue['userMemberships'];
  setActive: OrganizationListValue['setActive'];
  orgsLoaded: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const { getToken } = useAuth();
  const {
    userMemberships,
    setActive,
    isLoaded: orgsLoaded,
  } = useOrganizationList({ userMemberships: { infinite: true } });
  const [userProfile, setUserProfile] = useState<UserDoc | null>(null);
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

          const { firebaseToken } = await callFunction('getFirebaseToken', { sessionToken });

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
        } catch {
          // Ignore sign out errors
        }
      }
    };

    signInToFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser?.id, isLoaded, getToken]);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    if (isLoaded && firebaseAuthReady && clerkUser) {
      // Listen to Firestore user document in real-time
      unsubscribeFirestore = onSnapshot(
        userRef(clerkUser.id),
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setLoading(false);
        },
      );
    } else if (isLoaded && !clerkUser) {
      setUserProfile(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser?.id, isLoaded, firebaseAuthReady]);

  const isAuthReady = isLoaded && (!clerkUser || firebaseAuthReady);

  const value: UserContextValue = {
    currentUser: clerkUser,
    userProfile,
    loading: !isAuthReady || loading,
    displayName:
      [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') ||
      clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      'User',
    // Organization data (fetched once, shared everywhere)
    userMemberships,
    setActive,
    orgsLoaded,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
