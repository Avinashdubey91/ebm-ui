import React from 'react';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';
import { generateDynamicRoutes } from '../utils/generateRoutes';
import { useRoutes } from 'react-router-dom';

const DynamicRoutesWrapper: React.FC = () => {
  const { menus, loading } = useMenuData();

  // Always call hooks unconditionally
  const dynamicRoutes = loading ? [] : generateDynamicRoutes(menus);
  const element = useRoutes(dynamicRoutes);

  if (loading) return <div className="text-center p-4">Loading routes...</div>;

  return element ?? <div className="text-center text-danger">No routes available</div>;
};

export default DynamicRoutesWrapper;
