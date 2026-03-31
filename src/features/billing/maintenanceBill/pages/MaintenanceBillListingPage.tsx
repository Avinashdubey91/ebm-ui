import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import SharedListingPage from "../../../shared/SharedListingPage";
import SelectField from "../../../../components/common/SelectField";
import MonthPickerField from "../../../../components/common/MonthPickerField";

import { fetchAllEntities } from "../../../../api/genericCrudApi";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import MaintenanceBillListing from "../forms/MaintenanceBillListing";
import "../forms/MaintenanceBill.css";
import httpClient from "../../../../api/httpClient";

const APARTMENT_ENDPOINT = "/apartment/Get-All-Apartment";
const GENERATE_ENDPOINT =
  "/MonthlyBilling/Generate-Monthly-Bills-For-Apartment";

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

function getMonthFromMonthYear(monthYear: string): number | null {
  const parts = monthYear.split("-");
  if (parts.length !== 2) return null;

  const month = Number(parts[1]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;

  return month;
}

const MaintenanceBillListingPage: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<
    number | undefined
  >(undefined);

  const [monthYear, setMonthYear] = useState<string>(getMonthYearToday());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const year = useMemo(() => getYearFromMonthYear(monthYear), [monthYear]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchAllEntities<ApartmentDTO>(APARTMENT_ENDPOINT);
        setApartments(data);

        if (data.length > 0) {
          setSelectedApartmentId((prev) => prev ?? data[0].apartmentId);
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

  const onApartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value);
      setSelectedApartmentId(Number.isFinite(id) ? id : undefined);
    },
    [],
  );

  const onMonthYearChange = useCallback((value: string) => {
    setMonthYear(value);
  }, []);

  const onGenerate = useCallback(async () => {
    if (!selectedApartmentId || isGenerating) return;

    const month = getMonthFromMonthYear(monthYear);
    if (!month) return;

    try {
      setIsGenerating(true);

      await httpClient.post(GENERATE_ENDPOINT, {
        apartmentId: selectedApartmentId,
        year,
        month,
      });

      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Generate monthly bills failed", err);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, monthYear, selectedApartmentId, year]);

  const generateButtonClassName = "btn btn-primary btn-md";

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
            disabled={!selectedApartmentId || isGenerating}
            title="Generate Maintenance Bill"
          >
            <i className="fa fa-bolt me-2" />
            {isGenerating ? "Generating..." : "Generate Maintenance Bill"}
          </button>
        </div>
      </div>
    ),
    [
      apartmentOptions,
      generateButtonClassName,
      isGenerating,
      monthYear,
      onApartmentChange,
      onGenerate,
      onMonthYearChange,
      selectedApartmentId,
    ],
  );

  const ListingComponent = useMemo<React.FC>(() => {
    const C: React.FC = () => (
      <MaintenanceBillListing
        apartmentId={selectedApartmentId}
        apartmentName={selectedApartmentName}
        year={year}
        refreshKey={refreshKey}
      />
    );

    C.displayName = "MaintenanceBillListingContent";
    return C;
  }, [refreshKey, selectedApartmentId, selectedApartmentName, year]);

  return (
    <div className="maintenance-bill-listing-page">
      <SharedListingPage
        title="MAINTENANCE BILL"
        headerActions={headerActions}
        ListingComponent={ListingComponent}
      />
    </div>
  );
};

export default MaintenanceBillListingPage;
