import { createContext, useContext } from 'react';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setAuth: (token: string, userId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Add and export this hook
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
