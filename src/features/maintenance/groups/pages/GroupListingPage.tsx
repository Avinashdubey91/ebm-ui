import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import GroupListing from "../forms/GroupListing";

const GroupListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={GroupListing} />;
};

export default GroupListingPage;