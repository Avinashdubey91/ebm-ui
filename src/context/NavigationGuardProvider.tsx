import React, { useCallback, useMemo, useRef } from "react";
import {
  NavigationGuardContext,
  type GuardHandler,
} from "./NavigationGuardContext";

export const NavigationGuardProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const guardHandlerRef = useRef<GuardHandler | null>(null);

  const setGuardHandler = useCallback((handler: GuardHandler | null) => {
    guardHandlerRef.current = handler;
  }, []);

  const confirmIfNeeded = useCallback(async () => {
    if (!guardHandlerRef.current) return true;
    return guardHandlerRef.current();
  }, []);

  const value = useMemo(
    () => ({
      setGuardHandler,
      confirmIfNeeded,
    }),
    [setGuardHandler, confirmIfNeeded],
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
};