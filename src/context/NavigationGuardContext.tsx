import { createContext } from "react";

export type GuardHandler = () => Promise<boolean>;

export type NavigationGuardContextType = {
  setGuardHandler: (handler: GuardHandler | null) => void;
  confirmIfNeeded: () => Promise<boolean>;
};

export const NavigationGuardContext =
  createContext<NavigationGuardContextType | null>(null);