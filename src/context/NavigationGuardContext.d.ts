export type GuardHandler = () => Promise<boolean>;
export type NavigationGuardContextType = {
    setGuardHandler: (handler: GuardHandler | null) => void;
    confirmIfNeeded: () => Promise<boolean>;
};
export declare const NavigationGuardContext: import("react").Context<NavigationGuardContextType | null>;
