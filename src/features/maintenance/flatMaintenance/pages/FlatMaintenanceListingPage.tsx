// src/features/maintenance/flatMaintenance/pages/FlatMaintenanceListingPage.tsx
import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import FlatMaintenanceListing from "../forms/FlatMaintenanceListing";

const FlatMaintenanceListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={FlatMaintenanceListing} />;
};

export default FlatMaintenanceListingPage;