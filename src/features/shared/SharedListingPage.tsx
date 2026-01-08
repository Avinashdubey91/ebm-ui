import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentMenu } from "../../hooks/useCurrentMenu";

interface SharedListingPageProps {
  title?: string;
  ListingComponent: React.FC;

  /**
   * Custom actions on the right side of the header.
   * If provided, it replaces the default "Add New" button.
   */
  headerActions?: React.ReactNode;

  /**
   * Changing this value forces the listing component to remount.
   * Useful when you need a clean reload (e.g. after modal save).
   */
  listingKey?: React.Key;

  /** Optional className applied to the listing content wrapper. */
  contentClassName?: string;
}

const SharedListingPage: React.FC<SharedListingPageProps> = ({
  title,
  ListingComponent,
  headerActions,
  listingKey,
  contentClassName,
}) => {
  const navigate = useNavigate();
  const { singularMenuName, pluralMenuName, createRoutePath } = useCurrentMenu();

  const handleAddNew = useCallback(() => {
    if (createRoutePath) {
      navigate(createRoutePath);
    } else {
      console.warn("⚠️ No dynamic create route path.");
    }
  }, [createRoutePath, navigate]);

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
          {headerActions ?? (
            <button className="btn btn-success btn-md" onClick={handleAddNew}>
              <i className="fa fa-plus me-2" />
              Add New {singularMenuName}
            </button>
          )}
        </div>
      </div>

      <div className={contentClassName ?? ""}>
        <ListingComponent key={listingKey} />
      </div>
    </div>
  );
};

export default React.memo(SharedListingPage);