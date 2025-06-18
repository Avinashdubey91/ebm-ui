import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SocietyListing from '../../../property/society/forms/SocietyListing';
import { useCurrentMenu } from '../../../../hooks/useCurrentMenu';

const SocietyListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { singularMenuName, pluralMenuName, createRoutePath } = useCurrentMenu();

  useEffect(() => {
    console.log("✅ SocietyListingPage mounted");
  }, []);

  const handleAddSociety = () => {
    if (createRoutePath) {
      navigate(createRoutePath);
    } else {
      console.warn("⚠️ No dynamic create route path found for current menu.");
    }
  };

  return (
    <div className="page-listing">
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-3">
        <h4 className="inner-area-header-title flex-grow-1 text-center m-0">
          MANAGE {pluralMenuName.toUpperCase()}
        </h4>
        <div style={{ flexShrink: 0 }}>
          <button className="btn btn-success btn-md" onClick={handleAddSociety}>
            <i className="fa fa-plus me-2" />
            Add New {singularMenuName}
          </button>
        </div>
      </div>
      <SocietyListing />
    </div>
  );
};

export default SocietyListingPage;
