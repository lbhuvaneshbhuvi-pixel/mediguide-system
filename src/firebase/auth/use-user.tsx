
'use client';
    
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider'; // Adjusted import path

export interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get the current authenticated user from Firebase.
 * @returns {UseUserResult} An object containing the user, loading state, and error.
 */
export function useUser(): UseUserResult {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no auth instance is available, we're not loading and there's no user.
    if (!auth) {
      setUser(null);
      setIsLoading(false);
      setError(new Error("Firebase Auth instance is not available."));
      return;
    }
    
    // Reset state for new auth instance
    setIsLoading(true);
    setError(null);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        setUser(firebaseUser);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("useUser - onAuthStateChanged error:", error);
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading, error };
}
