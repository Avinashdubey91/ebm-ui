import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import OwnerListing from "../../../residents/owner/forms/OwnerListing";

const OwnerListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={OwnerListing} />;
};

export default OwnerListingPage;
