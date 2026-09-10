import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { setLibraryContext } from './db';

interface UserProfile {
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  profile: UserProfile | null;
  loading: boolean;
  libraryId: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  libraryId: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [libraryId, setLibraryId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Check for Super Admin (Main Authority)
            if (currentUser.email === 'admindiia2014@super.local') {
               setRole('SuperAdmin');
               setLibraryId(null);
               setLibraryContext(null);
            } else {
               const lid = data.libraryId || 'default_library';
               setLibraryId(lid);
               setLibraryContext(lid);
               
               // Verify subscription
               const libSnap = await getDoc(doc(db, 'libraries', lid));
               if (libSnap.exists()) {
                 const libData = libSnap.data();
                 const endDate = new Date(libData.subscriptionEndDate);
                 if (new Date() > endDate) {
                   setRole('Suspended');
                 } else {
                   setRole(data.role || 'Member');
                 }
               } else {
                 setRole(data.role || 'Member');
               }
            }
            setProfile({ displayName: data.displayName || currentUser.displayName, photoURL: data.photoURL || currentUser.photoURL });
          } else {
            if (currentUser.email === 'admindiia2014@super.local' || currentUser.email === 'admindiia2014@gmail.com') {
               setRole('SuperAdmin');
               setLibraryId(null);
               setLibraryContext(null);
            } else {
               const lid = 'default_library';
               setLibraryId(lid);
               setLibraryContext(lid);
               setRole(currentUser.email === 'bakirmannarkkad170@gmail.com' ? 'Admin' : 'Librarian');
            }
            setProfile({ displayName: currentUser.displayName, photoURL: currentUser.photoURL });
          }
        } catch (error) {
          console.error("Error fetching role", error);
          // Fallback if offline
          setRole(currentUser.email === 'bakirmannarkkad170@gmail.com' ? 'Admin' : 'Librarian');
          setProfile({ displayName: currentUser.displayName, photoURL: currentUser.photoURL });
        } finally {
          setLoading(false);
        }

        // Listen to user document for role updates in background
        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (currentUser.email === 'admindiia2014@super.local') {
               setRole('SuperAdmin');
            } else {
               const lid = data.libraryId || 'default_library';
               setLibraryId(lid);
               setLibraryContext(lid);
               const libSnap = await getDoc(doc(db, 'libraries', lid));
               if (libSnap.exists()) {
                 const libData = libSnap.data();
                 const endDate = new Date(libData.subscriptionEndDate);
                 if (new Date() > endDate) {
                   setRole('Suspended');
                 } else {
                   setRole(data.role || 'Member');
                 }
               } else {
                 setRole(data.role || 'Member');
               }
            }
            setProfile({ displayName: data.displayName || currentUser.displayName, photoURL: data.photoURL || currentUser.photoURL });
          } else {
            setRole(currentUser.email === 'bakirmannarkkad170@gmail.com' ? 'Admin' : 'Librarian');
          }
        }, (error) => {
          console.error("Error listening to role", error);
        });
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
        if (unsubscribeDoc) unsubscribeDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);


  useEffect(() => {
    if (!user || !libraryId) return;
    const updatePresence = async () => {
      try {
        await setDoc(doc(db, 'presence', user.uid), {
          libraryId,
          lastActive: new Date().toISOString(),
          role
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to update presence", e);
      }
    };
    updatePresence();
    const interval = setInterval(updatePresence, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user, libraryId, role]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, libraryId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
