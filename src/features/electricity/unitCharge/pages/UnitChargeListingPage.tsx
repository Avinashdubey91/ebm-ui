import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import UnitChargeListing from "../forms/UnitChargeListing";

const UnitChargeListingPage: React.FC = () => {
  return (
    <SharedListingPage
      title="MANAGE UNIT CHARGES"
      ListingComponent={UnitChargeListing}
    />
  );
};

export default UnitChargeListingPage;