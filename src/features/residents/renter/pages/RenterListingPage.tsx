// src/features/residents/renter/pages/RenterListingPage.tsx
import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import RenterListing from "../forms/RenterListing";

const RenterListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={RenterListing} />;
};

export default RenterListingPage;
