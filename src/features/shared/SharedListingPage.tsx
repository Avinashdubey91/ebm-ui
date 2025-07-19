import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentMenu } from "../../hooks/useCurrentMenu";

interface SharedListingPageProps {
  title?: string;
  ListingComponent: React.FC;
}

const SharedListingPage: React.FC<SharedListingPageProps> = ({
  title,
  ListingComponent,
}) => {
  const navigate = useNavigate();
  const { singularMenuName, pluralMenuName, createRoutePath } = useCurrentMenu();

  // 🧠 Memoize handler so it doesn't recreate every render
  const handleAddNew = useCallback(() => {
    if (createRoutePath) {
      navigate(createRoutePath);
    } else {
      console.warn("⚠️ No dynamic create route path.");
    }
  }, [createRoutePath, navigate]);

  // ✨ Memoize expensive text processing (if needed)
  const headerText = useMemo(() => {
    return title || `MANAGE ${pluralMenuName.toUpperCase()}`;
  }, [title, pluralMenuName]);

  return (
    <div className="page-listing">
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-2">
        <h4 className="inner-area-header-title flex-grow-1 text-center m-0">
          {headerText}
        </h4>
        <div className="action-button-container">
          <button className="btn btn-success btn-md" onClick={handleAddNew}>
            <i className="fa fa-plus me-2" />
            Add New {singularMenuName}
          </button>
        </div>
      </div>
      <ListingComponent />
    </div>
  );
};

export default React.memo(SharedListingPage);
