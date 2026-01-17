import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEntity, fetchAllEntities } from "../../../../api/genericCrudApi";
import SharedListingTable from "../../../shared/SharedListingTable";

import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { safeValue } from "../../../../utils/format";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";

import type { ExpenseCategoryDTO } from "../../../../types/ExpenseCategoryDTO";

type SortField = keyof ExpenseCategoryDTO;

const ENTITY_NAME = "Expense Category";

const endpoints = {
  list: "/expensecategory/Get-All-Expense-Categories",
  delete: "/expensecategory/Delete-Expense-Category",
};

function resolveCategoryId(dto: ExpenseCategoryDTO): number | undefined {
  const id = dto.expenseCategoryId ?? dto.id;
  return typeof id === "number" && id > 0 ? id : undefined;
}

const ExpenseCategoryListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExpenseCategoryDTO[]>([]);

  const [sortField, setSortField] = useState<SortField>("categoryName");
  const [sortAsc, setSortAsc] = useState(true);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchAllEntities<ExpenseCategoryDTO>(endpoints.list);
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const sortedItems = useMemo(() => {
    const copy = [...items];

    const toComparable = (value: unknown): string | number => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (value === null || value === undefined) return "";

      const s = String(value).trim();
      if (!s) return "";
      return s.toLowerCase();
    };

    copy.sort((a, b) => {
      const va = toComparable(a[sortField]);
      const vb = toComparable(b[sortField]);

      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }

      const sa = String(va);
      const sb = String(vb);
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });

    return copy;
  }, [items, sortAsc, sortField]);

  const handleEdit = (id?: number) => {
    if (!id || !createRoutePath) return;
    const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
    navigate(editPath);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setItems((prev) => prev.filter((x) => resolveCategoryId(x) !== id));
      setExpandedRowId(null);
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete expense category:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "categoryName" as const,
        label: "Category Name",
        width: "260px",
        renderCell: (r: ExpenseCategoryDTO) => r.categoryName?.trim() || "-",
      },
      {
        key: "description" as const,
        label: "Description",
        width: "360px",
        renderCell: (r: ExpenseCategoryDTO) => r.description?.trim() || "-",
      },
      {
        key: "isActive" as const,
        label: "Active",
        width: "90px",
        renderCell: (r: ExpenseCategoryDTO) => (r.isActive ? "Yes" : "No"),
      },
    ],
    []
  );

  return (
    <SharedListingTable<ExpenseCategoryDTO>
      data={sortedItems}
      loading={loading}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
      getRowKey={(x) => x.expenseCategoryId ?? x.id ?? 0}
      columns={columns}
      renderExpandedRow={(r) => (
        <>
          <strong>Expense Category ID:</strong>{" "}
          {safeValue(resolveCategoryId(r))}
        </>
      )}
    />
  );
};

export default ExpenseCategoryListing;
