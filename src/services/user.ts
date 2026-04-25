import { 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy,
  getDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastActive: Date;
}

export const syncUserToFirestore = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastActive: Timestamp.now()
    },
    { merge: true }
  );
};

export const updateUserProfile = async (user: User, displayName: string) => {
  try {
    // 1. Update Firebase Auth Profile
    await updateProfile(user, { displayName });
    
    // 2. Update Firestore Document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      displayName: displayName,
      lastActive: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('lastActive', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        lastActive: data.lastActive?.toDate() || new Date()
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...data,
        lastActive: data.lastActive?.toDate() || new Date()
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
