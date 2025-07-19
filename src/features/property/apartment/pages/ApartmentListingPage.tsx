// features/property/apartment/pages/ApartmentListingPage.tsx
import SharedListingPage from "../../../shared/SharedListingPage";
import ApartmentListing from "../forms/ApartmentListing";

export default function ApartmentListingPage() {
  return <SharedListingPage ListingComponent={ApartmentListing} />;
}
