import { useState, useEffect } from "react";

const OPEN_SUBMENU_STORAGE_KEY = "dashboard-ebm-open-submenu";

export const useSidebarState = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OPEN_SUBMENU_STORAGE_KEY);
    if (stored) {
      setOpenSubmenu(stored);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (openSubmenu) {
      localStorage.setItem(OPEN_SUBMENU_STORAGE_KEY, openSubmenu);
    } else {
      localStorage.removeItem(OPEN_SUBMENU_STORAGE_KEY);
    }
  }, [openSubmenu]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;

      if (next) {
        // collapsing sidebar → collapse any expanded submenu
        setOpenSubmenu(null);
      }

      return next;
    });
  };

  const toggleSubmenu = (id: string) => {
    setOpenSubmenu((prev) => (prev === id ? null : id));
  };

  const isSubmenuOpen = (id: string) => openSubmenu === id;

  return {
    collapsed,
    toggleSidebar,
    isSubmenuOpen,
    toggleSubmenu,
  };
};