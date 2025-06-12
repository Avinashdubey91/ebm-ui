import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // ✅ Added

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('userId');

    if (t && u) {
      setToken(t);
      setUserId(u);
      setIsAuthenticated(true); // ✅ Set here
    }

    setIsReady(true); // Always mark auth state initialized
  }, []);

  const setAuth = (t: string, u: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', u);
    setToken(t);
    setUserId(u);
    setIsAuthenticated(true); // ✅ Set here as well
  };

  return isReady ? (
    <AuthContext.Provider value={{ token, userId, isAuthenticated, isReady, setAuth }}>
      {children}
    </AuthContext.Provider>
  ) : null;
};
