import { useState, useEffect, type ReactNode } from 'react';
import { useUser as useClerkUser, useAuth, useOrganizationList } from '@clerk/clerk-react';
import { onSnapshot } from 'firebase/firestore';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import type { UserDoc } from '@cherrytree/shared';

import { UserContext, type UserContextValue } from '../hooks/useUser.ts';
import { auth, userRef } from '../lib/firebase.ts';
import { callFunction } from '../lib/functions.ts';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const { getToken } = useAuth();
  const {
    userMemberships,
    setActive,
    isLoaded: orgsLoaded,
  } = useOrganizationList({ userMemberships: { infinite: true } });
  // The profile remembers which user it was read for, so `userProfile` and `loading` are
  // derived below instead of reset from an effect: a signed-out or switched user never sees
  // a previous session's document.
  const [profile, setProfile] = useState<{ userId: string; doc: UserDoc | null } | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const clerkUserId = clerkUser?.id;

  // Sign in to Firebase Auth when Clerk user is authenticated
  useEffect(() => {
    const signInToFirebase = async () => {
      if (isLoaded && clerkUserId) {
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
      } else if (isLoaded && !clerkUserId) {
        setFirebaseAuthReady(false);
        try {
          await firebaseSignOut(auth);
        } catch {
          // Ignore sign out errors
        }
      }
    };

    void signInToFirebase();
  }, [clerkUserId, isLoaded, getToken]);

  // Follow the signed-in user's document in real time.
  useEffect(() => {
    if (!isLoaded || !firebaseAuthReady || !clerkUserId) return;
    return onSnapshot(
      userRef(clerkUserId),
      (docSnap) => {
        setProfile({ userId: clerkUserId, doc: docSnap.exists() ? docSnap.data() : null });
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setProfile({ userId: clerkUserId, doc: null });
      },
    );
  }, [clerkUserId, isLoaded, firebaseAuthReady]);

  const isAuthReady = isLoaded && (!clerkUser || firebaseAuthReady);
  const profileForUser = clerkUserId && profile?.userId === clerkUserId ? profile : null;
  const userProfile = profileForUser?.doc ?? null;

  const value: UserContextValue = {
    currentUser: clerkUser,
    userProfile,
    loading: !isAuthReady || (Boolean(clerkUserId) && !profileForUser),
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
