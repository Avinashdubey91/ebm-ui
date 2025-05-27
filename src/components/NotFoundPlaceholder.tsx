import React from 'react';

const NotFoundPlaceholder: React.FC = () => {
  return (
    <div className="alert alert-danger text-center m-5">
      <h4>🚫 Component Not Found</h4>
      <p>The requested page could not be loaded.</p>
    </div>
  );
};

export default NotFoundPlaceholder;
