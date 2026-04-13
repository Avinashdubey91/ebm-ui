export interface AuthContextType {
    token: string | null;
    userId: string | null;
    isAuthenticated: boolean;
    isReady: boolean;
    setAuth: (token: string, userId: string) => void;
    clearAuth: () => void;
}
export declare const AuthContext: import("react").Context<AuthContextType | undefined>;
export declare const useAuthContext: () => AuthContextType;
