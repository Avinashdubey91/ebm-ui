// src/hooks/useFormNavigationGuard.ts
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showUnsavedChangesDialog } from "../utils/showUnsavedChangesDialog";

export const useFormNavigationGuard = (hasUnsavedChanges: boolean) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Native browser refresh / close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ✅ In-app anchor navigation (menu/submenu clicks)
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const isExternal = anchor.host !== window.location.host;
      const isSame = href === location.pathname;

      if (!href || href === "#" || isExternal || isSame) return;

      if (!hasUnsavedChanges) return;

      e.preventDefault();
      const shouldLeave = await showUnsavedChangesDialog();
      if (shouldLeave) navigate(href);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [hasUnsavedChanges, location.pathname, navigate]);

  // ✅ Browser back button (popstate)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    history.pushState(null, "", window.location.href);
    let allowBack = false;

    const onPopState = async () => {
      if (allowBack) return;

      const shouldLeave = await showUnsavedChangesDialog();
      if (shouldLeave) {
        allowBack = true;
        window.history.go(-1); // ✅ Let browser handle real back navigation
      } else {
        history.pushState(null, "", window.location.href); // ❌ Prevent back
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasUnsavedChanges]);
};
