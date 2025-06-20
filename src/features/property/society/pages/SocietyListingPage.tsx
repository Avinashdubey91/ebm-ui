import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import SocietyListing from "../../../property/society/forms/SocietyListing";

const SocietyListingPage: React.FC = () => {
  return (
    <SharedListingPage>
      <SocietyListing />
    </SharedListingPage>
  );
};

export default SocietyListingPage;
