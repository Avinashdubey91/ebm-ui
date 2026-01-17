import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import ExtraExpenseListing from "../forms/ExtraExpenseListing";

const ExtraExpenseListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={ExtraExpenseListing} />;
};

export default ExtraExpenseListingPage;