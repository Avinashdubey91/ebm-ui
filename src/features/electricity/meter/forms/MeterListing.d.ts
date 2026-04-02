import React from "react";
type ApartmentDTO = {
    apartmentId: number;
    apartmentName?: string | null;
};
type MeterListingProps = {
    selectedApartmentId?: number;
    onApartmentsLoaded?: (apartments: ApartmentDTO[]) => void;
};
declare const MeterListing: React.FC<MeterListingProps>;
export default MeterListing;
