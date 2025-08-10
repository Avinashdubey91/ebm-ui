import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import FlatRenterListing from "../forms/FlatRenterListing";

const FlatRenterListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={FlatRenterListing} />;
};

export default FlatRenterListingPage;
