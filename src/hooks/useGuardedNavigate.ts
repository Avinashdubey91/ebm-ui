import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { NavigateOptions, To } from "react-router-dom";
import { useNavigationGuardContext } from "./useNavigationGuardContext";

export const useGuardedNavigate = () => {
  const navigate = useNavigate();
  const { confirmIfNeeded } = useNavigationGuardContext();

  return useCallback(
    async (to: To, options?: NavigateOptions) => {
      const shouldLeave = await confirmIfNeeded();
      if (!shouldLeave) return false;

      navigate(to, options);
      return true;
    },
    [navigate, confirmIfNeeded],
  );
};