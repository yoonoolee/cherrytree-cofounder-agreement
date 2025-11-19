import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null); // Firestore user data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore = null;

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous Firestore listener if exists
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      setCurrentUser(user);

      if (user) {
        // Listen to Firestore user document in real-time
        const userRef = doc(db, 'users', user.uid);
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
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const value = {
    currentUser, // Firebase Auth user (uid, email)
    userProfile, // Firestore data (name, preferences, etc.)
    loading,
    displayName: userProfile?.name || currentUser?.email?.split('@')[0] || 'User'
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
