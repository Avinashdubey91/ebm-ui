import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { DashboardContext } from '../context/DashboardContext';
import '../dashboard.css';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<'Online' | 'Offline'>('Offline');

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
            <div id="" className="dashboard-ebm-main-area-inner flex-grow-1 px-4 py-4">
              {/* Dynamic content can go here */}
              <h4 className="text-blacktext-black pt-5 text-center">Welcome to EBM Dashboard</h4>
            </div>
            <footer className="footer">
              <div className="container-fluid px-4">
                <small>
                  &copy; 2025 EBM Technologies Pvt. Ltd. &nbsp;|&nbsp;
                  <a href="#">Privacy Policy</a> &nbsp;|&nbsp;
                  <a href="#">Terms</a> &nbsp;|&nbsp;
                  <a href="#">Contact</a>
                </small>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default Dashboard;
