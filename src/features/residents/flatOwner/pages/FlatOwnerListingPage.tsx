import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import FlatOwnerListing from "../forms/FlatOwnerListing";

const FlatOwnerListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={FlatOwnerListing} />;
};

export default FlatOwnerListingPage;
