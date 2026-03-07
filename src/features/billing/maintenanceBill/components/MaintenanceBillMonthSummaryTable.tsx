import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaLock, FaPrint, FaSort, FaUnlock } from "react-icons/fa";

import MultiSelectField, {
  type MultiSelectOption,
} from "../../../../components/common/MultiSelectField";

type RowVM = {
  key: string; // yyyy-mm
  billingMonth: string; // ISO
  monthLabel: string;

  isBillGenerated: boolean;
  isLocked: boolean;
  isBillPaid: boolean;

  totalAmountText: string;
  individualMaintenanceText: string;

  paidCountText: string;

  apartmentNameHidden: string;
};

type Props = {
  loading: boolean;
  rows: RowVM[];
  flatOptions: MultiSelectOption[];

  getSelectedPaidIds: (billingMonthIso: string) => number[];
  onEnsurePaidIdsLoaded: (billingMonthIso: string) => Promise<void> | void;

  onPaidFlatsChange: (
    billingMonthIso: string,
    values: string[],
  ) => Promise<void> | void;

  onBillPaidToggle: (
    billingMonthIso: string,
    nextIsBillPaid: boolean,
    currentIsLocked: boolean,
  ) => Promise<void> | void;

  onLockToggle: (
    billingMonthIso: string,
    currentIsBillPaid: boolean,
    nextIsLocked: boolean,
  ) => Promise<void> | void;

  onPrint: (billingMonthIso: string) => void;
};

const MIN_LOADING_MS = 250;
const ICON_SIZE = 18;

function formatBillingMonthDate(iso: string): string {
  const datePart = iso?.slice(0, 10);
  const parts = datePart.split("-");
  if (parts.length !== 3) return iso;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return iso;
  if (m < 1 || m > 12 || d < 1 || d > 31) return iso;

  const monthName = new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  //const dd = String(d).padStart(2, "0");
  return `${monthName}-${y}`;
}

const MaintenanceBillMonthSummaryTable: React.FC<Props> = ({
  loading,
  rows,
  flatOptions,
  getSelectedPaidIds,
  onEnsurePaidIdsLoaded,
  onPaidFlatsChange,
  onBillPaidToggle,
  onLockToggle,
  onPrint,
}) => {
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartedAtRef = useRef<number | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      loadingStartedAtRef.current = Date.now();
      setShowLoading(true);
      return;
    }

    const startedAt = loadingStartedAtRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : MIN_LOADING_MS;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

    const timerId = window.setTimeout(() => setShowLoading(false), remaining);
    return () => window.clearTimeout(timerId);
  }, [loading]);

  const effectiveLoading = loading || showLoading;

  const showEmptyState = useMemo(
    () => !effectiveLoading && rows.length === 0,
    [effectiveLoading, rows.length],
  );

  const paidValueByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const r of rows) {
      map[r.key] = getSelectedPaidIds(r.billingMonth).map(String);
    }
    return map;
  }, [rows, getSelectedPaidIds]);

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const thClass = "mb-th py-1";
  const tdClass = "mb-td py-1";

  const iconSquareBtnStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    minWidth: 34,
    minHeight: 34,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    borderRadius: 6,
    boxSizing: "border-box",
  };

  return (
    <div className="mb-listing-table-wrap p-2 position-relative">
      {effectiveLoading && (
        <div className="mb-listing-table-overlay position-absolute d-flex flex-column justify-content-center align-items-center">
          <div className="spinner-border" role="status" aria-label="Loading" />
          <div className="mt-2 text-muted">Loading...</div>
        </div>
      )}

      {showEmptyState ? (
        <div className="alert alert-warning text-center m-5">
          <h5>No Records Found</h5>
          <p className="mb-0">There are currently no entries to display.</p>
        </div>
      ) : (
        <table className="table table-ebm-listing align-middle mb-0 mb-maintenance-table">
          <thead className="table-primary">
            <tr>
              <th className={`${thClass} mb-col-billing-month`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Billing Month</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-col-total-amount`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Total Amount</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-col-individual-amount`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Amount/Flat</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-col-payment-status`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Paid Status</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-col-update-payment`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Update Payment</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-col-bill-status`}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Bill Status</span>
                  <span className="ms-1">
                    <FaSort className="text-muted" />
                  </span>
                </div>
              </th>

              <th className={`${thClass} mb-th-center mb-col-bill-paid`}>
                Paid
              </th>
              <th className={`${thClass} mb-th-center mb-col-lock`} />
              <th className={`${thClass} mb-th-center mb-col-action`} />
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const paidValue = paidValueByKey[r.key] ?? [];
              const disableRowEdits = r.isLocked || !r.isBillGenerated;
              const isExpanded = expandedKey === r.key;
              const rowClassName = effectiveLoading ? "" : "mb-row-clickable";

              return (
                <React.Fragment key={r.key}>
                  <tr
                    onClick={() => {
                      if (!effectiveLoading) toggleExpand(r.key);
                    }}
                    className={rowClassName}
                  >
                    <td className={`${tdClass} mb-nowrap`}>{r.monthLabel}</td>
                    <td className={`${tdClass} mb-nowrap`}>
                      {r.totalAmountText}
                    </td>
                    <td className={`${tdClass} mb-nowrap`}>
                      {r.individualMaintenanceText}
                    </td>
                    <td className={`${tdClass} mb-nowrap`}>{r.paidCountText}</td>

                    <td className="mb-update-payment-td py-1">
                      <div
                        className="maintenance-bill-multiselect-width mb-update-payment-cell"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <MultiSelectField
                          label=""
                          name={`paidFlats_${r.key}`}
                          value={paidValue}
                          options={flatOptions}
                          disabled={
                            disableRowEdits ||
                            flatOptions.length === 0 ||
                            effectiveLoading
                          }
                          showCountOnly
                          onChange={async (values) => {
                            await onEnsurePaidIdsLoaded(r.billingMonth);
                            await onPaidFlatsChange(r.billingMonth, values);
                          }}
                        />
                      </div>
                    </td>

                    <td className={`${tdClass} mb-nowrap`}>
                      {r.isBillGenerated ? (
                        <span className="badge bg-success">Generated</span>
                      ) : (
                        <span className="badge bg-secondary">Not Generated</span>
                      )}
                    </td>

                    <td className={`${tdClass} mb-td-center`}>
                      <div className="d-flex justify-content-center">
                        <input
                          className="form-check-input mb-billpaid-checkbox"
                          type="checkbox"
                          checked={r.isBillPaid}
                          disabled={disableRowEdits || effectiveLoading}
                          onClick={(e) => e.stopPropagation()}
                          onChange={async (e) => {
                            e.stopPropagation();
                            await onBillPaidToggle(
                              r.billingMonth,
                              e.target.checked,
                              r.isLocked,
                            );
                          }}
                        />
                      </div>
                    </td>

                    <td className="text-center py-1">
                      <div className="d-flex justify-content-center">
                        <button
                          type="button"
                          className={`btn ${
                            r.isLocked
                              ? "btn-outline-success"
                              : "btn-outline-danger"
                          }`}
                          style={iconSquareBtnStyle}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onLockToggle(
                              r.billingMonth,
                              r.isBillPaid,
                              !r.isLocked,
                            );
                          }}
                          disabled={
                            effectiveLoading ||
                            (!r.isBillGenerated && !r.isLocked)
                          }
                          title={r.isLocked ? "Unlock" : "Lock"}
                        >
                          {r.isLocked ? (
                            <FaUnlock size={ICON_SIZE} />
                          ) : (
                            <FaLock size={ICON_SIZE} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="text-center py-1">
                      <div className="d-flex justify-content-center">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          style={iconSquareBtnStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(r.billingMonth);
                          }}
                          disabled={effectiveLoading || !r.isBillGenerated}
                          title="Print"
                        >
                          <FaPrint size={ICON_SIZE} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="bg-light text-muted py-1">
                        <div className="mb-expanded-details py-1 px-2">
                          <span className="mb-expanded-label">Apartment:</span>{" "}
                          <span className="mb-expanded-value">
                            {r.apartmentNameHidden || "-"}
                          </span>
                          <span className="mb-expanded-sep mx-2">|</span>
                          <span className="mb-expanded-label">
                            Billing Month:
                          </span>{" "}
                          <span className="mb-expanded-value">
                            {formatBillingMonthDate(r.billingMonth)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MaintenanceBillMonthSummaryTable;