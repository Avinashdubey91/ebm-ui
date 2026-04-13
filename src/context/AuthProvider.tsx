import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { clearAccessToken, setAccessToken } from '../api/httpClient';
import { refreshAccessToken } from '../features/auth/authService';

interface Props {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const authVersionRef = useRef(0);

  const isAuthenticated = Boolean(token && userId);

  const setAuth = (nextToken: string, nextUserId: string) => {
    // Advance auth version so stale bootstrap responses cannot overwrite
    // a newer interactive login or restored session.
    authVersionRef.current += 1;
    setToken(nextToken);
    setUserId(nextUserId);
  };

  const clearAuth = () => {
    authVersionRef.current += 1;
    setToken(null);
    setUserId(null);
  };

  useEffect(() => {
    let isMounted = true;
    const bootstrapVersion = authVersionRef.current;

    const restoreSession = async () => {
      try {
        const response = await refreshAccessToken();

        // Ignore stale bootstrap result if auth state changed while request was in flight.
        if (!isMounted || authVersionRef.current !== bootstrapVersion) {
          return;
        }

        if (!response.accessToken || !response.userId) {
          clearAccessToken();
          setToken(null);
          setUserId(null);
          return;
        }

        // Restore the access token into the shared in-memory HTTP client store.
        setAccessToken(response.accessToken);

        // Restore full auth state from refresh response.
        authVersionRef.current += 1;
        setToken(response.accessToken);
        setUserId(response.userId.toString());
      } catch {
        // Only clear bootstrap state if no newer auth action has already succeeded.
        if (!isMounted || authVersionRef.current !== bootstrapVersion) {
          return;
        }

        clearAccessToken();
        setToken(null);
        setUserId(null);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      token,
      userId,
      isAuthenticated,
      isReady,
      setAuth,
      clearAuth,
    }),
    [token, userId, isAuthenticated, isReady]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};