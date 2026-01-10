// Patch Start: src/features/electricity/meterReadings/pages/MeterReadingListingPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../forms/MeterReading.css";

import SharedListingPage from "../../../shared/SharedListingPage";
import SelectField from "../../../../components/common/SelectField";
import MonthPickerField from "../../../../components/common/MonthPickerField";

import { fetchAllEntities } from "../../../../api/genericCrudApi";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import MeterReadingListing, {
  DEFAULT_METER_READING_APARTMENT_ID,
} from "../forms/MeterReadingListing";
import MeterReadingEntryModal from "../forms/MeterReadingEntryModal";

const APARTMENT_ENDPOINT = "/apartment/Get-All-Apartment";
const PREFERRED_APARTMENT_NAME_PREFIX = "mittal parkview";

const useHasWindowVerticalScrollbar = (): boolean => {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const update = () => {
      const docEl = document.documentElement;
      setHasScrollbar(window.innerWidth > docEl.clientWidth);
    };

    update();
    window.addEventListener("resize", update);

    const ro = new ResizeObserver(() => update());
    ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  return hasScrollbar;
};

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return getCurrentYearMonth();
  }

  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function pickDefaultApartmentId(apartments: ApartmentDTO[]): number | undefined {
  if (apartments.length === 0) return undefined;

  const configuredId =
    typeof DEFAULT_METER_READING_APARTMENT_ID === "number" &&
    DEFAULT_METER_READING_APARTMENT_ID > 0
      ? DEFAULT_METER_READING_APARTMENT_ID
      : undefined;

  if (configuredId) {
    const exists = apartments.some((a) => a.apartmentId === configuredId);
    if (exists) return configuredId;
  }

  const preferred = apartments.find((a) =>
    (a.apartmentName ?? "")
      .trim()
      .toLowerCase()
      .startsWith(PREFERRED_APARTMENT_NAME_PREFIX),
  );

  return preferred?.apartmentId ?? apartments[0].apartmentId;
}

const MeterReadingListingPage: React.FC = () => {
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [listingKey, setListingKey] = useState(0);

  const hasWindowScrollbar = useHasWindowVerticalScrollbar();

  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<
    number | undefined
  >(undefined);

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedEntryMonth, setSelectedEntryMonth] =
    useState<string>(currentYearMonth);

  const [autoDefaultEnabled, setAutoDefaultEnabled] = useState(true);

  useEffect(() => {
    const onRefresh = () => setListingKey((k) => k + 1);
    window.addEventListener("meterReadingEntry:refresh", onRefresh);
    return () =>
      window.removeEventListener("meterReadingEntry:refresh", onRefresh);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadApartments = async () => {
      try {
        const all = await fetchAllEntities<ApartmentDTO>(APARTMENT_ENDPOINT);
        if (!isMounted) return;

        const sorted = [...all].sort((a, b) =>
          (a.apartmentName ?? "").localeCompare(b.apartmentName ?? ""),
        );

        setApartments(sorted);

        if (selectedApartmentId === undefined) {
          const defaultId = pickDefaultApartmentId(sorted);
          if (defaultId !== undefined) setSelectedApartmentId(defaultId);
        }
      } catch {
        if (!isMounted) return;
        setApartments([]);
      }
    };

    void loadApartments();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentClassName = hasWindowScrollbar ? "me-3" : "";

  // ✅ keep your original behavior
  const addButtonClassName = useMemo(() => {
    const classes = ["btn", "btn-success", "btn-md"];
    if (hasWindowScrollbar) classes.push("me-3");
    return classes.join(" ");
  }, [hasWindowScrollbar]);

  const apartmentOptions = useMemo(
    () =>
      apartments.map((a) => ({
        value: String(a.apartmentId),
        label: a.apartmentName ?? "",
      })),
    [apartments],
  );

  const handleApartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value);
      if (!Number.isNaN(id)) setSelectedApartmentId(id);
      setAutoDefaultEnabled(false);
    },
    [],
  );

  const handleMonthChange = useCallback((value: string) => {
    // empty month => show ALL data (handled in listing query)
    setSelectedEntryMonth(value);
    setAutoDefaultEnabled(false);
  }, []);

  const extraHeaderActions = useMemo(
    () => (
      <div className="meter-reading-header-actions">
        <div className="meter-reading-controls">
          <SelectField
            label=""
            name="meterReadingApartment"
            value={selectedApartmentId ? String(selectedApartmentId) : ""}
            options={apartmentOptions}
            onChange={handleApartmentChange}
          />

          <MonthPickerField
            id="meterReadingEntryMonth"
            name="meterReadingEntryMonth"
            label="All Month-Year"
            value={selectedEntryMonth}
            onChange={handleMonthChange}
          />

          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => setIsEntryOpen(true)}
            disabled={!selectedApartmentId}
          >
            <i className="fa fa-bolt me-2" />
            Bulk Reading Entry
          </button>
        </div>
      </div>
    ),
    [
      apartmentOptions,
      handleApartmentChange,
      handleMonthChange,
      selectedApartmentId,
      selectedEntryMonth,
    ],
  );

  const ListingComponent = useMemo(() => {
    const Component: React.FC = () => (
      <MeterReadingListing
        selectedApartmentId={selectedApartmentId}
        entryMonth={selectedEntryMonth}
        autoDefaultEnabled={autoDefaultEnabled}
        onAutoDefaultResolved={() => setAutoDefaultEnabled(false)}
        onAutoFallbackToPreviousMonth={() => {
          const previous = getPreviousYearMonth(currentYearMonth);
          setSelectedEntryMonth(previous);
          setAutoDefaultEnabled(false);
        }}
      />
    );
    return Component;
  }, [autoDefaultEnabled, currentYearMonth, selectedApartmentId, selectedEntryMonth]);

  return (
    <div className="meter-reading-listing-page">
      <SharedListingPage
        title="MANAGE METER READINGS"
        ListingComponent={ListingComponent}
        listingKey={listingKey}
        contentClassName={contentClassName}
        extraHeaderActions={extraHeaderActions}
        addButtonClassName={addButtonClassName}
      />

      <MeterReadingEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
      />
    </div>
  );
};

export default MeterReadingListingPage;