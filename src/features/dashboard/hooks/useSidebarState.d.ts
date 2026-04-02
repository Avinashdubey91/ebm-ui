export declare const useSidebarState: () => {
    collapsed: boolean;
    toggleSidebar: () => void;
    isSubmenuOpen: (id: string) => boolean;
    toggleSubmenu: (id: string) => void;
};
