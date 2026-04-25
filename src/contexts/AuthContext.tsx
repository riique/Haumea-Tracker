import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { syncUserToFirestore } from '../services/user';
import { AuthContext } from './auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      try {
        await syncUserToFirestore(currentUser);
      } catch (error) {
        console.error('Falha ao sincronizar usuário no Firestore:', error);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
