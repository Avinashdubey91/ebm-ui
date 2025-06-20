import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import ApartmentListing from "../../../property/apartment/forms/ApartmentListing";

const ApartmentListingPage: React.FC = () => {
  return (
    <SharedListingPage>
      <ApartmentListing />
    </SharedListingPage>
  );
};

export default ApartmentListingPage;
