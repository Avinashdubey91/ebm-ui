import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const App = () => {
  useEffect(() => {
    console.log("🌐 VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Outlet />
    </div>
  );
};

export default App;
