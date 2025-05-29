import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { DashboardContext } from '../context/DashboardContext';
import { Outlet } from 'react-router-dom';
import '../dashboard.css';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<'Online' | 'Offline'>('Online');

  const user = {
    name: 'A.K. Dubey',
    role: 'Admin',
    status,
    image: '/img/AKDubey.png',
    setStatus,
  };

  return (
    <DashboardContext.Provider value={user}>
      <div className="dashboard-ebm-layout-wrapper d-flex flex-column min-vh-100">
        <Topbar />
        <div className="d-flex flex-grow-1">
          <Sidebar />
          <div className="dashboard-ebm-main-area d-flex flex-column">
            <div className="dashboard-ebm-main-area-inner">
              <Outlet />
            </div>
            <footer className="footer">
              <small>
                &copy; 2025 EBM Technologies Pvt. Ltd. &nbsp;|&nbsp;
                <a href="#">Privacy Policy</a> &nbsp;|&nbsp;
                <a href="#">Terms</a> &nbsp;|&nbsp;
                <a href="#">Contact</a>
              </small>
            </footer>
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
