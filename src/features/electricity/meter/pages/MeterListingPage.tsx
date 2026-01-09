import React, { useCallback, useMemo, useState } from "react";

import SelectField from "../../../../components/common/SelectField";
import SharedListingPage from "../../../shared/SharedListingPage";
import MeterListing from "../forms/MeterListing";

type ApartmentDTO = { apartmentId: number; apartmentName?: string | null };

const PREFERRED_APARTMENT_PREFIX = "mittal parkview";

const headerSelectCss = `
  .meter-apartment-filter { display: inline-flex; align-items: center; }
  .meter-apartment-filter .mb-2 { margin-bottom: 0 !important; }
  .meter-apartment-filter label { display: none !important; }

  /* Select visual size */
  .meter-apartment-filter .form-select {
    height: 38px;
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
  }

  /* Final alignment nudge to match Add button exactly */
  .meter-apartment-filter { transform: translateY(2px); }
`;

const MeterListingPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<
    number | undefined
  >(undefined);

  const handleApartmentsLoaded = useCallback((list: ApartmentDTO[]) => {
    setApartments(list);

    setSelectedApartmentId((prev) => {
      if (prev && list.some((a) => a.apartmentId === prev)) return prev;

      const preferred = list.find((a) =>
        (a.apartmentName ?? "")
          .toLowerCase()
          .startsWith(PREFERRED_APARTMENT_PREFIX)
      );

      return preferred?.apartmentId ?? list[0]?.apartmentId;
    });
  }, []);

  const apartmentOptions = useMemo(() => {
    return apartments.map((a) => ({
      value: a.apartmentId,
      label: a.apartmentName ?? `Apartment #${a.apartmentId}`,
    }));
  }, [apartments]);

  const handleApartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.currentTarget.value;
      setSelectedApartmentId(v ? Number(v) : undefined);
    },
    []
  );

  const extraHeaderActions = useMemo(() => {
    const disabled = apartmentOptions.length === 0;

    return (
      <div className="d-inline-flex align-items-center me-2 meter-apartment-filter">
        <style>{headerSelectCss}</style>

        <div style={{ minWidth: 320 }}>
          <SelectField
            label=""
            name="apartmentId"
            value={selectedApartmentId}
            onChange={handleApartmentChange}
            disabled={disabled}
            options={apartmentOptions}
          />
        </div>
      </div>
    );
  }, [apartmentOptions, selectedApartmentId, handleApartmentChange]);

  const ListingComponent = useMemo<React.FC>(() => {
    const Comp: React.FC = () => (
      <MeterListing
        selectedApartmentId={selectedApartmentId}
        onApartmentsLoaded={handleApartmentsLoaded}
      />
    );
    return Comp;
  }, [handleApartmentsLoaded, selectedApartmentId]);

  return (
    <SharedListingPage
      ListingComponent={ListingComponent}
      extraHeaderActions={extraHeaderActions}
    />
  );
};

export default MeterListingPage;