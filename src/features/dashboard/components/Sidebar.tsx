import Collapse from 'react-bootstrap/Collapse';
import React, { useState, useEffect } from 'react';
import { useSidebarState } from '../hooks/useSidebarState';
import { FaSearch, FaChevronDown, FaChevronUp, FaCircle } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import { useMenuData } from '../hooks/useMenuData';
import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from '../../../types/menuTypes';
import type { IconType } from 'react-icons';

const Sidebar: React.FC = () => {
  const { collapsed, toggleSidebar, isSubmenuOpen, toggleSubmenu } = useSidebarState();
  const [searchQuery, setSearchQuery] = useState('');
  const { menus, loading } = useMenuData();

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
    if (override && (FaIcons as Record<string, IconType>)[override]) {
      return (FaIcons as Record<string, IconType>)[override];
    }

    const componentName = 'Fa' + iconKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const IconComponent = (FaIcons as Record<string, IconType>)[componentName];
    if (!IconComponent) {
      console.warn(`❌ Icon not found for: ${componentName}, raw: ${iconClass}`);
      return FaCircle;
    }

    return IconComponent;
  };

  const filteredMenu = menus.filter((item) =>
    item.menuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subMenus?.some((child) => child.subMenuName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <nav className={`dashboard-ebm-sidebar ${collapsed ? 'dashboard-ebm-collapsed' : ''}`} id="sidebar">
      {/* Search Box */}
      <div className="dashboard-ebm-sidebar-search px-3 mt-1">
        {collapsed ? (
          <a
            href="#"
            className="dashboard-ebm-nav-link dashboard-ebm-search-only-icon d-flex justify-content-center"
            onClick={(e) => {
              e.preventDefault();
              toggleSidebar();
            }}
          >
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
              <span
                className="dashboard-ebm-clear-icon"
                title="Clear Search"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </span>
            )}
            <div className="dashboard-ebm-search-separator" />
            <span className="dashboard-ebm-search-icon-box">
              <FaSearch />
            </span>
          </div>
        )}
        <div className="dashboard-ebm-search-no-results text-white small mt-2 d-none">
          No results found
        </div>
      </div>

      {/* Sidebar Menu */}
      <ul className="nav flex-column mt-2" id="sidebarMenu">
        {loading && <li className="text-white text-center small">Loading...</li>}
        {!loading && filteredMenu.map((item: SideNavigationMenuDTO) => {
          const Icon = getIconComponent(item.iconClass);
          const menuId = item.menuName || `Menu-${item.sideNavigationMenuId ?? Math.random().toString(36).substring(2)}`;
          const subMenus = menus
          .flatMap(menu => menu.subMenus ?? [])
          .filter(
            (sub: SideNavigationSubMenuDTO) =>
              sub.sideNavigationMenuId === item.sideNavigationMenuId && sub.isActive
          );
          const hasSubmenus = subMenus.length > 0;
          const keyId = item.sideNavigationMenuId ?? `missing-${menuId}`;

          return (
            <li
              key={`menu-${keyId}`}
              className={`dashboard-ebm-nav-item ${hasSubmenus ? 'dashboard-ebm-has-submenu' : ''} ${
                hasSubmenus && isSubmenuOpen(menuId) ? 'expanded' : ''
              }`}
            >
              <a
                href="#"
                className="dashboard-ebm-nav-link d-flex align-items-center dashboard-ebm-nav-link-animated"
                onClick={(e) => {
                  e.preventDefault();
                  if (collapsed) {
                    toggleSidebar();
                    return;
                  }
                  if (hasSubmenus) toggleSubmenu(menuId);
                }}
              >
                <Icon className="me-2" />
                <span>{item.menuName}</span>
                {hasSubmenus && !collapsed && (
                  isSubmenuOpen(menuId)
                    ? <FaChevronUp className="dashboard-ebm-toggle-chevron ms-auto" />
                    : <FaChevronDown className="dashboard-ebm-toggle-chevron ms-auto" />
                )}
              </a>

              {hasSubmenus && (
                <Collapse in={isSubmenuOpen(menuId)}>
                  <div>
                    <ul className="dashboard-ebm-submenu list-unstyled" id={`${menuId}-submenu`}>
                      {subMenus?.map((child) => (
                        <li key={`submenu-${child.sideNavigationSubMenuId}`}>
                          <a href="#" className="dashboard-ebm-nav-link small px-4 py-2 d-block">
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
