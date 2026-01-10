import React, { useEffect, useMemo, useState } from "react";

import "./MeterReading.css";
import "../../../../styles/_forms.scss";
import { createEntity, fetchAllEntities } from "../../../../api/genericCrudApi";
import SelectField from "../../../../components/common/SelectField";
import DateInput from "../../../../components/common/DateInput";

import {
  formatDateDmy,
  normalizeToYmd,
  safeValue,
} from "../../../../utils/format";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { showActionConfirmation } from "../../../../utils/alerts/showDeleteConfirmation";

import type { ReadingTypeDTO } from "../../../../types/ReadingTypeDTO";
import type {
  MeterReadingEntryRowDTO,
  MeterReadingEntryBulkRequestDTO,
} from "../../../../types/MeterReadingEntryDTO";

type ApartmentLookup = {
  apartmentId: number;
  apartmentName?: string | null;
  name?: string | null;
};

type EntryRowState = MeterReadingEntryRowDTO & {
  readingTypeId: number | null;
  readingValueText: string;
  error?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseYmd = (ymd: string): { y: number; m: number; d: number } | null => {
  if (!ymd || ymd.length < 10) return null;
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  const d = Number(ymd.slice(8, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;
  if (y < 1900 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
};

const getBillingPeriod = (
  readingYmd: string
): { from: string; to: string; label: string } => {
  const parsed = parseYmd(readingYmd);
  if (!parsed) return { from: "", to: "", label: "-" };

  const { d } = parsed;
  let { y, m } = parsed;

  if (d <= 7) {
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }

  const from = `${y}-${pad2(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${pad2(m)}-${pad2(lastDay)}`;
  const label = `${MONTH_NAMES[m - 1]}-${y}`;

  return { from, to, label };
};

const normalizeDigitsOnly = (raw: string, maxLen: number): string => {
  const onlyDigits = raw.replace(/\D/g, "");
  return onlyDigits.slice(0, maxLen);
};

const pickMonthlyReadingTypeId = (types: ReadingTypeDTO[]): number | null => {
  const monthly = types.find((x) =>
    String(x.typeName ?? "")
      .trim()
      .toLowerCase()
      .includes("monthly")
  );
  if (monthly?.readingTypeId) return monthly.readingTypeId;
  return types.length > 0 ? types[0].readingTypeId ?? null : null;
};

const MeterReadingEntryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);

  const [apartments, setApartments] = useState<ApartmentLookup[]>([]);
  const [readingTypes, setReadingTypes] = useState<ReadingTypeDTO[]>([]);

  const [apartmentId, setApartmentId] = useState<number | null>(null);
  const [readingDate, setReadingDate] = useState<string>(
    () => normalizeToYmd(new Date()) || ""
  );

  const [readingDateError, setReadingDateError] = useState<string>("");
  const [rows, setRows] = useState<EntryRowState[]>([]);
  const [step, setStep] = useState<"select" | "table">("select");
  const [topError, setTopError] = useState<string>("");

  const ENDPOINTS = useMemo(
    () => ({
      apartments: "/apartment/Get-All-Apartment",
      readingTypes: "/meterreading/Get-All-ReadingTypes",
      entryRows: "/meterreading/Get-MeterReading-Entry-Rows",
      bulkCreate: "/meterreading/Add-MeterReadings-Bulk",
    }),
    []
  );

  const billing = useMemo(() => getBillingPeriod(readingDate), [readingDate]);

  const apartmentOptions = useMemo(
    () =>
      apartments.map((a) => ({
        value: a.apartmentId,
        label: String(
          a.apartmentName ?? a.name ?? `Apartment #${a.apartmentId}`
        ),
      })),
    [apartments]
  );

  const readingTypeOptions = useMemo(
    () =>
      readingTypes.map((t) => ({
        value: t.readingTypeId,
        label: String(t.typeName ?? `Type #${t.readingTypeId}`),
      })),
    [readingTypes]
  );

  const resetState = () => {
    setRows([]);
    setStep("select");
    setTopError("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!readingDate) {
      setReadingDateError("");
      return;
    }

    const todayYmd = normalizeToYmd(new Date()) || "";
    if (todayYmd && readingDate > todayYmd) {
      setReadingDateError("Future reading date is not allowed.");
      return;
    }

    setReadingDateError("");
  }, [isOpen, readingDate]);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoadingLookups(true);
      try {
        const [aptRes, rtRes] = await Promise.all([
          fetchAllEntities<ApartmentLookup>(ENDPOINTS.apartments),
          fetchAllEntities<ReadingTypeDTO>(ENDPOINTS.readingTypes),
        ]);

        setApartments(Array.isArray(aptRes) ? aptRes : []);
        setReadingTypes(Array.isArray(rtRes) ? rtRes : []);
      } catch (err) {
        console.error("Failed to load lookups:", err);
        setApartments([]);
        setReadingTypes([]);
      } finally {
        setLoadingLookups(false);
      }
    };

    void load();
  }, [ENDPOINTS.apartments, ENDPOINTS.readingTypes, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("mr-entry-modal-open");
    return () => {
      document.body.classList.remove("mr-entry-modal-open");
    };
  }, [isOpen]);

  const setRowValue = (meterId: number, next: Partial<EntryRowState>) => {
    setRows((prev) =>
      prev.map((r) => (r.meterId === meterId ? { ...r, ...next } : r))
    );
  };

  const handleProceed = async () => {
    setTopError("");

    if (!apartmentId) {
      setTopError("Apartment is required.");
      return;
    }

    if (!readingDate) {
      setTopError("Reading Date is required.");
      return;
    }

    if (readingDateError) return;

    setLoadingRows(true);
    try {
      const query = `${
        ENDPOINTS.entryRows
      }/${apartmentId}?readingDate=${encodeURIComponent(readingDate)}`;

      const res = await fetchAllEntities<MeterReadingEntryRowDTO>(query);
      const list = Array.isArray(res) ? res : [];

      const defaultTypeId = pickMonthlyReadingTypeId(readingTypes);

      const mapped: EntryRowState[] = list.map((r) => ({
        ...r,
        readingTypeId: r.readingTypeIdDefault ?? defaultTypeId,
        readingValueText: "",
        error: undefined,
      }));

      setRows(mapped);
      setStep("table");
    } catch (err) {
      console.error("Failed to load entry rows:", err);
      setRows([]);
      setTopError("Failed to load meters for entry. Please try again.");
    } finally {
      setLoadingRows(false);
    }
  };

  const validateRows = (): boolean => {
    let ok = true;

    setRows((prev) =>
      prev.map((r) => {
        const value = r.readingValueText.trim();
        if (!value) {
          return { ...r, error: undefined };
        }
        if (!/^\d+$/.test(value)) {
          ok = false;
          return { ...r, error: "Only numbers allowed." };
        }

        if (value.length > 12) {
          ok = false;
          return { ...r, error: "Max 12 digits allowed." };
        }

        if (!r.readingTypeId) {
          ok = false;
          return { ...r, error: "Reading Type is required." };
        }

        return { ...r, error: undefined };
      })
    );

    return ok;
  };

  const handleFinalise = async () => {
    setTopError("");

    if (!apartmentId) {
      setTopError("Apartment is required.");
      return;
    }

    const filledRows = rows.filter((r) => r.readingValueText.trim().length > 0);

    if (filledRows.length === 0) {
      setTopError(
        "Please enter at least one Current Reading before finalising."
      );
      return;
    }

    if (!validateRows()) {
      setTopError("Please fix validation errors before finalising.");
      return;
    }

    const confirmed = await showActionConfirmation({
      title: "Confirm Finalize",
      text: "Are you sure to Finalize these Meter Reading Entries ?",
      icon: "warning",
      confirmButtonText: "Finalize",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#aaa",
    });

    if (!confirmed) return;

    const createdBy = Number(localStorage.getItem("userId") ?? 0);
    if (!Number.isFinite(createdBy) || createdBy <= 0) {
      setTopError("UserId not found. Please login again.");
      return;
    }

    const payload: MeterReadingEntryBulkRequestDTO = {
      apartmentId,
      readingDate,
      entries: filledRows.map((r) => ({
        meterId: r.meterId,
        currentReading: Number(r.readingValueText),
        readingTypeId: r.readingTypeId ?? null,
      })),
    };

    setSaving(true);
    try {
      await createEntity(ENDPOINTS.bulkCreate, payload, createdBy, false);
      await showAddUpdateResult(true, "add", "Meter Reading Entry");

      window.dispatchEvent(new Event("meterReadingEntry:refresh"));

      resetState();
      onClose();
    } catch (err) {
      console.error("Failed to save entry:", err);
      await showAddUpdateResult(false, "add", "Meter Reading Entry");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-modal-overlay mr-entry-overlay">
      <div
        className="user-modal-dialog mr-entry-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-modal-content mr-entry-content">
          <div className="mr-entry-topbar">
            <h3 className="mr-entry-title">Meter Reading Entry</h3>
          </div>

          <div
            className="user-modal-close-circle"
            onClick={onClose}
            title="Close"
          />

          <div className="user-modal-body mr-entry-body">
            {topError ? (
              <div className="alert alert-danger py-2">{topError}</div>
            ) : null}

            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <SelectField
                  name="apartmentId"
                  label="Apartment"
                  value={apartmentId ?? ""}
                  options={apartmentOptions}
                  required
                  onChange={(e) => {
                    const val = Number(e.currentTarget.value);
                    setApartmentId(Number.isFinite(val) ? val : null);
                    if (step === "table") resetState();
                  }}
                  disabled={loadingLookups || loadingRows || saving}
                />
                <div
                  className="mr-entry-field-help"
                  style={{ visibility: "hidden" }}
                >
                  placeholder
                </div>
              </div>

              <div className="col-md-6">
                <DateInput
                  id="mr-entry-readingDate"
                  label="Reading Date"
                  value={readingDate}
                  onChange={(ymd) => {
                    setReadingDate(ymd);
                    if (step === "table") resetState();
                  }}
                />
                <div
                  className="mr-entry-field-help text-danger"
                  style={{ visibility: readingDateError ? "visible" : "hidden" }}
                >
                  {readingDateError || "placeholder"}
                </div>
              </div>
            </div>

            <div className="mr-entry-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  loadingLookups ||
                  loadingRows ||
                  saving ||
                  !apartmentId ||
                  !readingDate ||
                  !!readingDateError
                }
                onClick={handleProceed}
              >
                {loadingRows ? "Loading..." : "Proceed"}
              </button>
            </div>

            {step === "table" ? (
              <>
                <hr />
                <div className="table-responsive">
                  <div className="mr-entry-table-wrap">
                    <table className="table table-striped table-bordered mr-entry-table">
                      <thead className="table-primary">
                        <tr>
                          <th>Flat Number</th>
                          <th>OwnerName / RenterName</th>
                          <th>Reading Date</th>
                          <th>Billing Month</th>
                          <th>Reading Type</th>
                          <th>Current Reading</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map((r) => {
                          const owner = safeValue(r.ownerName);
                          const renter = safeValue(r.renterName);
                          const combinedOwnerRenter =
                            safeValue(r.ownerRenterDisplay) !== "-"
                              ? safeValue(r.ownerRenterDisplay)
                              : owner !== "-" && renter !== "-"
                              ? `${owner} / ${renter}`
                              : owner !== "-"
                              ? owner
                              : renter;

                          return (
                            <tr key={r.meterId}>
                              <td>
                                {safeValue(r.flatNumber) === "-"
                                  ? "N/A"
                                  : safeValue(r.flatNumber)}
                              </td>
                              <td>{combinedOwnerRenter || "-"}</td>
                              <td>{formatDateDmy(readingDate)}</td>
                              <td>{billing.label}</td>

                              <td style={{ minWidth: 220 }}>
                                <SelectField
                                  name={`readingType-${r.meterId}`}
                                  label=""
                                  value={r.readingTypeId ?? ""}
                                  options={readingTypeOptions}
                                  onChange={(e) => {
                                    const v = Number(e.currentTarget.value);
                                    setRowValue(r.meterId, {
                                      readingTypeId: Number.isFinite(v)
                                        ? v
                                        : null,
                                      error: undefined,
                                    });
                                  }}
                                  disabled={saving}
                                />
                              </td>

                              <td style={{ minWidth: 200 }}>
                                <input
                                  type="text"
                                  className={`form-control mr-entry-reading-input ${
                                    r.error ? "is-invalid" : ""
                                  }`}
                                  inputMode="numeric"
                                  value={r.readingValueText}
                                  onChange={(e) => {
                                    const next = normalizeDigitsOnly(
                                      e.currentTarget.value,
                                      12
                                    );
                                    setRowValue(r.meterId, {
                                      readingValueText: next,
                                      error: undefined,
                                    });
                                  }}
                                  disabled={saving}
                                  placeholder="Numbers only"
                                />
                                {r.error ? (
                                  <div className="invalid-feedback d-block">
                                    {r.error}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {rows.length === 0 ? (
                    <div className="alert alert-warning text-center">
                      No active meters found for this apartment.
                    </div>
                  ) : null}
                </div>

                {rows.length > 0 ? (
                  <div className="mr-entry-actions">
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={saving}
                      onClick={handleFinalise}
                    >
                      {saving ? "Saving..." : "Finalise Reading Entry"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeterReadingEntryModal;
