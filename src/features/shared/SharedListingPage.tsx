import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentMenu } from "../../hooks/useCurrentMenu";

interface SharedListingPageProps {
  title?: string; // Optional: custom header title (otherwise uses pluralMenuName)
  children: React.ReactNode; // Listing component (e.g., <ApartmentListing />)
}

const SharedListingPage: React.FC<SharedListingPageProps> = ({
  title,
  children,
}) => {
  const navigate = useNavigate();
  const { singularMenuName, pluralMenuName, createRoutePath } = useCurrentMenu();

  useEffect(() => {
    console.log("✅ SharedListingPage mounted");
  }, []);

  const handleAddClick = () => {
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
          MANAGE {(title ?? pluralMenuName).toUpperCase()}
        </h4>
        <div style={{ flexShrink: 0 }}>
          <button className="btn btn-success btn-md" onClick={handleAddClick}>
            <i className="fa fa-plus me-2" />
            Add New {singularMenuName}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default SharedListingPage;
