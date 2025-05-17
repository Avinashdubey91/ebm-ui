import { useState, useEffect } from 'react';

export const useSidebarState = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dashboard-ebm-open-submenus');
    if (stored) {
      setOpenSubmenus(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-ebm-open-submenus', JSON.stringify(openSubmenus));
  }, [openSubmenus]);

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      if (next) {
        // collapsing sidebar → collapse all open submenus
        setOpenSubmenus([]);
      }
      return next;
    });
  };

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isSubmenuOpen = (id: string) => openSubmenus.includes(id);

  return {
    collapsed,
    toggleSidebar,
    isSubmenuOpen,
    toggleSubmenu,
  };
};
