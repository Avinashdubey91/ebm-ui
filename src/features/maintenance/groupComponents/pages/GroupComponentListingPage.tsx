import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import GroupComponentListing from "../forms/GroupComponentListing";

const GroupComponentListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={GroupComponentListing} />;
};

export default GroupComponentListingPage;