// features/users/pages/UserListingPage.tsx

import SharedListingPage from "../../shared/SharedListingPage";
import UserListing from "../forms/UserListing";

export default function UserListingPage() {
  return <SharedListingPage ListingComponent={UserListing} />;
}
