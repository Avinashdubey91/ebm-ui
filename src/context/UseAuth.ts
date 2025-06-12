import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const UseAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
