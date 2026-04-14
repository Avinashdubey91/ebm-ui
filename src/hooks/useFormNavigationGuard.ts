import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showUnsavedChangesDialog } from "../utils/showUnsavedChangesDialog";
import { useNavigationGuardContext } from "./useNavigationGuardContext";

export const useFormNavigationGuard = (
  hasUnsavedChanges: boolean,
  suppressPopstate = false,
) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setGuardHandler, confirmIfNeeded } = useNavigationGuardContext();

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setGuardHandler(null);
      return;
    }

    setGuardHandler(async () => {
      return showUnsavedChangesDialog();
    });

    return () => {
      setGuardHandler(null);
    };
  }, [hasUnsavedChanges, setGuardHandler]);

  // Native browser refresh / close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // In-app navigation via anchor clicks — capture phase so we stop it before router reacts
  useEffect(() => {
    const handleClickCapture = async (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor || anchor.dataset.bypassGuard === "true") return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const isExternal =
        anchor.host && anchor.host !== window.location.host;

      const isSame =
        href === location.pathname || href === `${location.pathname}${location.search}`;

      if (isExternal || isSame || !hasUnsavedChanges) return;

      e.preventDefault();
      e.stopPropagation();

      const shouldLeave = await confirmIfNeeded();
      if (shouldLeave) {
        navigate(href);
      }
    };

    document.addEventListener("click", handleClickCapture, true);
    return () =>
      document.removeEventListener("click", handleClickCapture, true);
  }, [hasUnsavedChanges, location.pathname, location.search, navigate, confirmIfNeeded]);

  // Browser back / forward
  useEffect(() => {
    if (!hasUnsavedChanges || suppressPopstate) return;

    history.pushState(null, "", window.location.href);
    let allowBack = false;

    const onPopState = async () => {
      if ((window as typeof window & { __suppressNavigationGuard?: boolean }).__suppressNavigationGuard) {
        (window as typeof window & { __suppressNavigationGuard?: boolean }).__suppressNavigationGuard = false;
        return;
      }

      if (allowBack) return;

      const shouldLeave = await confirmIfNeeded();
      if (shouldLeave) {
        allowBack = true;
        window.history.go(-1);
      } else {
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasUnsavedChanges, suppressPopstate, confirmIfNeeded]);
};