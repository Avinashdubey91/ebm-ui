// features/shared/ListingTable.tsx

import React from "react";
import { FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash } from "react-icons/fa";
import OverlayMessage from "../../components/common/OverlayMessage";

type Column<T> = {
  key: keyof T;
  label: string;
  width?: string;
  renderCell?: (item: T) => React.ReactNode; // ✅ Add this
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  sortField: keyof T;
  sortAsc: boolean;
  onSort: (field: keyof T) => void;
  onEdit: (id?: number) => void;
  onDelete: (id?: number) => void;
  expandedRowId: number | null;
  onExpand: (id: number | null) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
  getRowKey: (item: T) => number;
};

function ListingTable<T>({
  data,
  columns,
  loading = false,
  sortField,
  sortAsc,
  onSort,
  onEdit,
  onDelete,
  expandedRowId,
  onExpand,
  renderExpandedRow,
  getRowKey,
}: Props<T>) {
  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortAsc ? <FaSortUp className="text-primary" /> : <FaSortDown className="text-primary" />;
  };

  if (loading) {
    return (
      <OverlayMessage
        show={true}
        message="Loading..."
        subMessage="Please wait while we load the data."
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="alert alert-warning text-center m-5">
        <h5>📭 No Records Found</h5>
        <p>There are currently no entries to display.</p>
      </div>
    );
  }
  
  return (
    <div className="table-responsive p-2">
      <table className="table table-ebm-listing align-middle">
        <thead className="table-primary">
          <tr>
            {columns.map(({ key, label, width }) => (
              <th
                key={String(key)}
                onClick={() => onSort(key)}
                style={{ cursor: "pointer", whiteSpace: "nowrap", width }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span>{label}</span>
                  <span className="ms-1">{getSortIcon(key)}</span>
                </div>
              </th>
            ))}
            <th style={{ textAlign: "center", width: "110px", whiteSpace: "nowrap" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const id = getRowKey(item);
            if (id === undefined || id === null) return null; // 🛑 guard
            const isExpanded = expandedRowId === id;
            return (
              <React.Fragment key={`row-${id}`}>
                <tr onClick={() => onExpand(isExpanded ? null : id)} style={{ cursor: "pointer" }}>
                  {columns.map(({ key, renderCell }) => (
                    <td key={String(key)}>
                      {renderCell
                        ? renderCell(item)
                        : typeof item[key] === "object" || typeof item[key] === "undefined" || item[key] === null
                        ? "-"
                        : String(item[key])}
                    </td>
                  ))}
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-3 fs-2">
                      <button
                        className="btn btn-link p-0 text-primary"
                        title="Edit"
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
                  <tr key={`expanded-row-${id ?? `missing-${Math.random()}`}`}>
                    <td colSpan={columns.length + 1} className="bg-light text-muted">
                      {renderExpandedRow(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ListingTable;
