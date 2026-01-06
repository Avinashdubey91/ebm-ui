import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import MeterListing from "../forms/MeterListing";

const MeterListingPage: React.FC = () => {
  return <SharedListingPage title="MANAGE ELECTRIC METERS" ListingComponent={MeterListing} />;
};

export default MeterListingPage;