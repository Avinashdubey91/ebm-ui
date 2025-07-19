import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import FlatListing from "../forms/FlatListing";

const FlatListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={FlatListing} />;
};

export default FlatListingPage;
