import React from "react";
import SharedListingPage from "../../../shared/SharedListingPage";
import ExpenseCategoryListing from "../forms/ExpenseCategoryListing";

const ExpenseCategorytListingPage: React.FC = () => {
  return <SharedListingPage ListingComponent={ExpenseCategoryListing} />;
};

export default ExpenseCategorytListingPage;