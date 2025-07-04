import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';

export const useAuth = () => {
  const [authUser, setAuthUser] = useState<null | boolean>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthUser(!!user);
      setEmailVerified(user?.emailVerified ?? false);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    authUser,
    emailVerified,
    isAuthLoading,
    currentUser: auth.currentUser,
  };
};
