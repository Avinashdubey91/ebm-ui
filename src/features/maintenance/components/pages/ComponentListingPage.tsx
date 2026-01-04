import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import ComponentListing from "../forms/ComponentListing";

const ComponentListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={ComponentListing} />;
};

export default ComponentListingPage;