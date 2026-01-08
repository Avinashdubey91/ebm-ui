// Patch Start: src/features/shared/SharedListingTable.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash } from "react-icons/fa";

type Column<T> = {
  key: keyof T;
  label: string;
  width?: string;
  renderCell?: (item: T) => React.ReactNode;
};

type PaginationProps = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (nextPageNumber: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  minLoadingMs?: number;
  sortField: keyof T;
  sortAsc: boolean;
  onSort: (field: keyof T) => void;
  onEdit: (id?: number) => void;
  onDelete: (id?: number) => void;
  expandedRowId: number | null;
  onExpand: (id: number | null) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
  getRowKey: (item: T) => number;
  pagination?: PaginationProps;
};

function SharedListingTable<T>({
  data,
  columns,
  loading = false,
  minLoadingMs = 300,
  sortField,
  sortAsc,
  onSort,
  onEdit,
  onDelete,
  expandedRowId,
  onExpand,
  renderExpandedRow,
  getRowKey,
  pagination,
}: Props<T>) {
  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortAsc ? (
      <FaSortUp className="text-primary" />
    ) : (
      <FaSortDown className="text-primary" />
    );
  };

  const [showLoading, setShowLoading] = useState<boolean>(false);
  const loadingStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    // when a request starts, show overlay immediately
    if (loading) {
      loadingStartedAtRef.current = Date.now();
      setShowLoading(true);
      return;
    }

    // when request finishes, keep overlay visible for at least minLoadingMs
    const startedAt = loadingStartedAtRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : minLoadingMs;
    const remaining = Math.max(0, minLoadingMs - elapsed);

    const timerId = window.setTimeout(() => {
      setShowLoading(false);
    }, remaining);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loading, minLoadingMs]);

  const effectiveLoading = loading || showLoading;

  const pageSizeOptions = useMemo(() => {
    const base = pagination?.pageSizeOptions ?? [10, 20, 30, 50, 100];
    if (!pagination) return base;

    const set = new Set<number>(base);
    set.add(pagination.pageSize);

    return Array.from(set).sort((a, b) => a - b);
  }, [pagination]);

  const rangeText = (() => {
    if (!pagination) return "";
    if (pagination.totalCount === 0) return "Showing 0 of 0";
    const start = (pagination.pageNumber - 1) * pagination.pageSize + 1;
    const end = start + data.length - 1;
    const safeEnd = Math.min(end, pagination.totalCount);
    return `Showing ${start}-${safeEnd} of ${pagination.totalCount}`;
  })();

  const showEmptyState = !effectiveLoading && data.length === 0;
  const disablePaging = effectiveLoading;

  return (
    <div
      className="table-responsive p-2 position-relative"
      style={{ overflowX: "auto", overflowY: "hidden" }}
    >
      {/* ✅ Component-level overlay (uses inset so it always covers the table area) */}
      {effectiveLoading && (
        <div
          className="position-absolute d-flex flex-column justify-content-center align-items-center"
          style={{
            inset: 0,
            zIndex: 5,
            background: "rgba(255,255,255,0.72)",
          }}
        >
          <div className="spinner-border" role="status" aria-label="Loading" />
          <div className="mt-2 text-muted">Loading...</div>
        </div>
      )}

      {showEmptyState ? (
        <div className="alert alert-warning text-center m-5">
          <h5>📭 No Records Found</h5>
          <p>There are currently no entries to display.</p>
        </div>
      ) : (
        <>
          <table className="table table-ebm-listing align-middle">
            <thead className="table-primary">
              <tr>
                {columns.map(({ key, label, width }) => (
                  <th
                    key={String(key)}
                    onClick={() => {
                      if (!disablePaging) onSort(key);
                    }}
                    style={{
                      cursor: disablePaging ? "default" : "pointer",
                      whiteSpace: "nowrap",
                      width,
                      opacity: disablePaging ? 0.7 : 1,
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{label}</span>
                      <span className="ms-1">{getSortIcon(key)}</span>
                    </div>
                  </th>
                ))}
                <th
                  style={{
                    textAlign: "center",
                    width: "90px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => {
                const id = getRowKey(item);
                if (id === undefined || id === null) return null;

                const isExpanded = expandedRowId === id;

                return (
                  <React.Fragment key={`row-${id}`}>
                    <tr
                      onClick={() => {
                        if (!disablePaging) onExpand(isExpanded ? null : id);
                      }}
                      style={{ cursor: disablePaging ? "default" : "pointer" }}
                    >
                      {columns.map(({ key, renderCell }) => (
                        <td key={String(key)}>
                          {renderCell
                            ? renderCell(item)
                            : typeof item[key] === "boolean"
                            ? item[key]
                              ? "Yes"
                              : "No"
                            : typeof item[key] === "object" || item[key] == null
                            ? "-"
                            : String(item[key])}
                        </td>
                      ))}

                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-3 fs-2">
                          <button
                            className="btn btn-link p-0 text-primary"
                            title="Edit"
                            disabled={disablePaging}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(id);
                            }}
                          >
                            <FaEdit size={22} />
                          </button>
                          <button
                            className="btn btn-link p-0 text-danger"
                            title="Delete"
                            disabled={disablePaging}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(id);
                            }}
                          >
                            <FaTrash size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && renderExpandedRow && (
                      <tr key={`expanded-row-${id}`}>
                        <td
                          colSpan={columns.length + 1}
                          className="bg-light text-muted"
                        >
                          {renderExpandedRow(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {pagination && (
            <div className="d-flex align-items-center justify-content-between mt-2">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">{rangeText}</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "110px" }}
                  value={pagination.pageSize}
                  disabled={disablePaging}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next) && next > 0) {
                      pagination.onPageSizeChange(next);
                    }
                  }}
                >
                  {pageSizeOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={disablePaging || pagination.pageNumber <= 1}
                  onClick={() =>
                    pagination.onPageChange(pagination.pageNumber - 1)
                  }
                >
                  Prev
                </button>

                <span className="text-muted">
                  Page {pagination.pageNumber} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={
                    disablePaging ||
                    pagination.totalPages === 0 ||
                    pagination.pageNumber >= pagination.totalPages
                  }
                  onClick={() =>
                    pagination.onPageChange(pagination.pageNumber + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SharedListingTable;
