import { useNavigate } from 'react-router-dom';
import { DYNAMIC_MENU_BASE_PATH } from '../../../constants/routes'; // ✅ make sure this is imported
import Collapse from 'react-bootstrap/Collapse';
import React, { useState, useEffect } from 'react';
import { useSidebarState } from '../hooks/useSidebarState';
import { FaSearch, FaChevronDown, FaCircle } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import { useMenuData } from '../hooks/useMenuData';
import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from '../../../types/menuTypes';
import type { IconType } from 'react-icons';
import Swal from 'sweetalert2';

const Sidebar: React.FC<{ hasUnsavedChanges: boolean }> = ({ hasUnsavedChanges }) => {
  const { collapsed, toggleSidebar, isSubmenuOpen, toggleSubmenu } = useSidebarState();
  const [searchQuery, setSearchQuery] = useState('');
  const { menus, loading } = useMenuData();
  const navigate = useNavigate();

  useEffect(() => {
    const sidebarToggleButton = document.getElementById('sidebarToggle');
    const handleToggle = () => toggleSidebar();
    sidebarToggleButton?.addEventListener('click', handleToggle);
    return () => sidebarToggleButton?.removeEventListener('click', handleToggle);
  }, [toggleSidebar]);

  const iconOverrideMap: Record<string, string> = {
    'building-columns': 'FaUniversity',
  };

  const getIconComponent = (iconClass: string): IconType => {
    if (!iconClass) return FaCircle;
    const classParts = iconClass.split(' ');
    const iconNameClass = classParts.find(cls =>
      cls.startsWith('fa-') &&
      !['fa-solid', 'fa-regular', 'fa-light', 'fa-duotone', 'fa-thin', 'fa-sharp', 'fas', 'far', 'fab'].includes(cls)
    ) ?? 'fa-circle';
    const iconKey = iconNameClass.replace('fa-', '');
    const override = iconOverrideMap[iconKey];
    const componentName = override ?? ('Fa' + iconKey.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(''));
    return (FaIcons as Record<string, IconType>)[componentName] || FaCircle;
  };

  const filteredMenu = menus.filter((item) =>
    item.menuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subMenus ?? []).some((child) =>
      child.subMenuName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleLinkClick = (path: string) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm("You have unsaved changes. Leave this page?");
      if (!confirmLeave) return;
    }

    if (window.location.pathname === path) {
      navigate('/reload-dashboard', { replace: true });
      setTimeout(() => navigate('/dashboard'), 0);
    } else {
      navigate(path);
    }
  };

  return (
    <nav className={`dashboard-ebm-sidebar ${collapsed ? 'dashboard-ebm-collapsed' : ''}`} id="sidebar">
      <div className="dashboard-ebm-sidebar-search px-3 mt-1">
        {collapsed ? (
          <a href="#" className="dashboard-ebm-nav-link dashboard-ebm-search-only-icon d-flex justify-content-center"
             onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>
            <i className="fas fa-search"></i>
          </a>
        ) : (
          <div className="dashboard-ebm-search-container-box dashboard-ebm-search-container position-relative">
            <input
              type="text"
              className="form-control dashboard-ebm-search-input-box border-0 shadow-none"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span className="dashboard-ebm-clear-icon" title="Clear Search" onClick={() => setSearchQuery('')}>&times;</span>
            )}
            <div className="dashboard-ebm-search-separator" />
            <span className="dashboard-ebm-search-icon-box"><FaSearch /></span>
          </div>
        )}
      </div>

      <ul className="nav flex-column mt-2" id="sidebarMenu">
        {loading && <li className="text-white text-center small">Loading...</li>}
        {!loading && filteredMenu.map((item: SideNavigationMenuDTO) => {
          const Icon = getIconComponent(item.iconClass);
          const menuId = item.menuName || `menu-${item.sideNavigationMenuId ?? Math.random().toString(36).substring(2)}`;
          const keyId = item.sideNavigationMenuId ?? `missing-${menuId}`;
          const subMenus = menus.flatMap(menu => menu.subMenus ?? [])
            .filter((sub: SideNavigationSubMenuDTO) =>
              sub.sideNavigationMenuId === item.sideNavigationMenuId && sub.isActive)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const hasSubmenus = subMenus.length > 0;

          return (
            <li key={`menu-${keyId}`} className={`dashboard-ebm-nav-item ${hasSubmenus ? 'dashboard-ebm-has-submenu' : ''} ${hasSubmenus && isSubmenuOpen(menuId) ? 'expanded' : ''}`}>
              <a href="#" className="dashboard-ebm-nav-link d-flex align-items-center dashboard-ebm-nav-link-animated position-relative"
                 onClick={(e) => {
                   e.preventDefault();
                   if (collapsed) return toggleSidebar();
                   if (hasSubmenus) return toggleSubmenu(menuId);
                   if (item.routePath) {
                     const path = item.routePath.startsWith('/') ? item.routePath : `/${item.routePath}`;
                     handleLinkClick(path);
                   }
                 }}>
                <Icon className="me-2" />
                <span>{item.menuName}</span>
                {hasSubmenus && !collapsed && <FaChevronDown className="dashboard-ebm-toggle-chevron ms-auto" />}
              </a>
              {hasSubmenus && (
                <Collapse in={isSubmenuOpen(menuId)}>
                  <div>
                    <ul className="dashboard-ebm-submenu list-unstyled" id={`${menuId}-submenu`}>
                      {subMenus.map((child, index) => (
                        <li key={`submenu-${child.sideNavigationSubMenuId ?? `${child.subMenuName}-${index}`}`} className="px-4">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const base = `/${DYNAMIC_MENU_BASE_PATH}`;
                              const menuPath = (item.routePath ?? '').replace(/^\/|\/$/g, '');
                              const subPath = (child.routePath ?? '').replace(/^\/|\/$/g, '');
                              const path = `${base}/${menuPath}/${subPath}`;

                              if (hasUnsavedChanges) {
                                Swal.fire({
                                  title: "Unsaved Changes",
                                  text: "You have unsaved changes. Are you sure you want to leave this page?",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonText: "Yes, leave",
                                  cancelButtonText: "No, stay",
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    navigate(path);
                                  }
                                });
                              } else {
                                navigate(path);
                              }
                            }}
                            className="dashboard-ebm-nav-link small px-4 py-2 d-block"
                          >
                            {child.subMenuName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Collapse>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
