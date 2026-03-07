import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SharedListingPage from "../../../shared/SharedListingPage";
import SelectField from "../../../../components/common/SelectField";
import MonthPickerField from "../../../../components/common/MonthPickerField";

import { fetchAllEntities } from "../../../../api/genericCrudApi";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import MaintenanceBillListing from "../forms/MaintenanceBillListing";
import "../forms/MaintenanceBill.css";

const APARTMENT_ENDPOINT = "/apartment/Get-All-Apartment";

function getMonthYearToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getYearFromMonthYear(monthYear: string): number {
  const parts = monthYear.split("-");
  const y = Number(parts[0]);
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

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

type ListingPropsRef = {
  apartmentId?: number;
  apartmentName: string;
  year: number;
  monthYear: string;
  generateRequestId: number;
};

const MaintenanceBillListingPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | undefined>(undefined);

  const [monthYear, setMonthYear] = useState<string>(getMonthYearToday());
  const [generateRequestId, setGenerateRequestId] = useState<number>(0);

  const hasWindowScrollbar = useHasWindowVerticalScrollbar();
  const contentClassName = hasWindowScrollbar ? "me-3" : "";

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchAllEntities<ApartmentDTO>(APARTMENT_ENDPOINT);
        setApartments(data);

        if (data.length > 0) {
          setSelectedApartmentId((prev) => (prev ?? data[0].apartmentId));
        }
      } catch (err) {
        console.error("Failed to load apartments", err);
      }
    };

    void run();
  }, []);

  const apartmentOptions = useMemo(
    () =>
      apartments.map((a) => ({
        value: String(a.apartmentId),
        label: a.apartmentName ?? "",
      })),
    [apartments],
  );

  const selectedApartmentName = useMemo(() => {
    const found = apartments.find((a) => a.apartmentId === selectedApartmentId);
    return found?.apartmentName ?? "";
  }, [apartments, selectedApartmentId]);

  const onApartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedApartmentId(Number.isFinite(id) ? id : undefined);
  }, []);

  const onMonthYearChange = useCallback((value: string) => {
    setMonthYear(value);
  }, []);

  const onGenerate = useCallback(() => {
    if (!selectedApartmentId) return;
    setGenerateRequestId(Date.now());
  }, [selectedApartmentId]);

  const year = useMemo(() => getYearFromMonthYear(monthYear), [monthYear]);

  const generateButtonClassName = useMemo(() => {
    const classes = ["btn", "btn-primary", "btn-md"];
    if (hasWindowScrollbar) classes.push("me-3");
    return classes.join(" ");
  }, [hasWindowScrollbar]);

  const headerActions = useMemo(
    () => (
      <div className="meter-reading-header-actions">
        <div className="meter-reading-controls">
          <SelectField
            label=""
            name="maintenanceBillApartment"
            value={selectedApartmentId ? String(selectedApartmentId) : ""}
            options={apartmentOptions}
            onChange={onApartmentChange}
          />

          <MonthPickerField
            id="maintenanceBillMonthYear"
            name="maintenanceBillMonthYear"
            label=""
            value={monthYear}
            onChange={onMonthYearChange}
          />

          <button
            type="button"
            className={generateButtonClassName}
            onClick={onGenerate}
            disabled={!selectedApartmentId}
            title="Generate Maintenance Bill"
          >
            <i className="fa fa-bolt me-2" />
            Generate Maintenance Bill
          </button>
        </div>
      </div>
    ),
    [
      apartmentOptions,
      generateButtonClassName,
      monthYear,
      onApartmentChange,
      onGenerate,
      onMonthYearChange,
      selectedApartmentId,
    ],
  );

  // Keep ListingComponent stable to prevent unmount/mount loops
  const listingPropsRef = useRef<ListingPropsRef>({
    apartmentId: selectedApartmentId,
    apartmentName: selectedApartmentName,
    year,
    monthYear,
    generateRequestId,
  });

  useEffect(() => {
    listingPropsRef.current = {
      apartmentId: selectedApartmentId,
      apartmentName: selectedApartmentName,
      year,
      monthYear,
      generateRequestId,
    };
  }, [generateRequestId, monthYear, selectedApartmentId, selectedApartmentName, year]);

  const ListingComponent = useMemo<React.FC>(() => {
    const C: React.FC = () => {
      const p = listingPropsRef.current;
      return (
        <MaintenanceBillListing
          apartmentId={p.apartmentId}
          apartmentName={p.apartmentName}
          year={p.year}
          monthYear={p.monthYear}
          generateRequestId={p.generateRequestId}
        />
      );
    };
    C.displayName = "MaintenanceBillListingContent";
    return C;
  }, []);

  return (
    <div className="maintenance-bill-listing-page">
      <SharedListingPage
        title="MAINTENANCE BILL"
        headerActions={headerActions}
        contentClassName={contentClassName}
        ListingComponent={ListingComponent}
      />
    </div>
  );
};

export default MaintenanceBillListingPage;