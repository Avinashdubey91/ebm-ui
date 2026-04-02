export interface UserContextType {
    name: string;
    role: string;
    status: 'Online' | 'Offline';
    image: string;
    setStatus: (status: 'Online' | 'Offline') => void;
}
export declare const DashboardContext: import("react").Context<UserContextType | null>;
