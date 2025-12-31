
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/data';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        // If user logs out, clear profile and stop loading
        setUserProfile(null);
        setLoading(false);
      }
      // The snapshot listener below will handle fetching the profile and setting loading to false
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
      if (!user) {
          // Ensure profile is null and loading is false if there's no user.
          setUserProfile(null);
          setLoading(false);
          return;
      }
      
      // We are now fetching the user profile, so set loading to true.
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      
      const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
              setUserProfile({ uid: doc.id, ...doc.data() } as UserProfile);
          } else {
              // This case might happen if the user exists in Auth but not Firestore.
              // We can attempt to create it.
               getUserProfile(user.uid).then(profile => {
                  setUserProfile(profile);
               });
          }
           // We're done loading the profile.
           setLoading(false);
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
      });

      return () => unsubscribeSnapshot();
  }, [user]);

  // We no longer render a global loading spinner here.
  // The consuming layouts will handle their own loading state.
  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const useUser = () => {
    const context = useAuth();
    return context.user;
}
