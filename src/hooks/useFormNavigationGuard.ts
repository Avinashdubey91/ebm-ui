// src/hooks/useFormNavigationGuard.ts
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export const useFormNavigationGuard = (hasUnsavedChanges: boolean) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Browser refresh/close alert
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ✅ In-App Anchor Tag Navigation Blocking
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const isExternal = anchor.host !== window.location.host;
      const isSame = href === location.pathname;

      if (!href || href === "#" || isExternal || isSame) return;

      e.preventDefault();

      const result = await Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Do you want to leave this page?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Leave",
        cancelButtonText: "Stay",
      });

      if (result.isConfirmed) {
        navigate(href);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [hasUnsavedChanges, location.pathname, navigate]);

  // ✅ Browser Back Button Sweet Alert
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Push dummy state to trap back
    history.pushState(null, "", window.location.href);

    let allowBack = false; // 🚨 fix flag

    const onPopState = async () => {
        if (allowBack) return; // ✅ allow true pop after confirmation

        const result = await Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Are you sure you want to go back?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Leave",
        cancelButtonText: "Stay",
        });

        if (result.isConfirmed) {
        allowBack = true; // ✅ allow next pop
        history.back();   // ✅ go back again now
        } else {
        history.pushState(null, "", window.location.href); // ❌ re-inject if canceled
        }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    }, [hasUnsavedChanges]);
};
