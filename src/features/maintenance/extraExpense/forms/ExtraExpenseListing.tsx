// src/features/maintenance/extraExpense/forms/ExtraExpenseListing.tsx

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

type ApartmentDTO = { apartmentId: number; apartmentName?: string | null };

type FlatDTO = {
  flatId: number;
  apartmentId?: number | null;
  flatNo?: string | null;
  flatNumber?: string | null;
};

type ExpenseCategoryDTO = {
  // API may return either `expenseCategoryId` or a generic `id`
  expenseCategoryId?: number;
  id?: number;
  categoryName?: string | null;
  isActive?: boolean;
};

type ExtraExpenseDTO = {
  extraExpenseid: number;
  apartmentId: number;
  expenseCategoryId?: number | null;
  flatId?: number | null;
  monthYear?: string | null; // ISO
  expenseAmount?: number | null;
  expenseDescription?: string | null;

  isShared?: boolean;
  isActive?: boolean;
};

type SortField = keyof ExtraExpenseDTO;

const ENTITY_NAME = "Extra Expense";

const endpoints = {
  list: "/extraexpense/Get-All-ExtraExpenses",
  delete: "/extraexpense/Delete-ExtraExpense",

  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  categories: "/expensecategory/Get-All-Expense-Categories",
};

function monthLabel(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month} - ${d.getFullYear()}`;
}

function money(n?: number | null): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return n.toFixed(2);
}

function flatLabel(f: FlatDTO): string {
  const label = f.flatNumber ?? f.flatNo ?? null;
  return label && label.trim().length > 0 ? label : `Flat #${f.flatId}`;
}

const ExtraExpenseListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<ExtraExpenseDTO[]>([]);
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [flats, setFlats] = useState<FlatDTO[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryDTO[]>([]);

  const [sortField, setSortField] = useState<SortField>("monthYear");
  const [sortAsc, setSortAsc] = useState(true);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const [expenseList, aptList, flatList, categoryList] = await Promise.all(
          [
            fetchAllEntities<ExtraExpenseDTO>(endpoints.list),
            fetchAllEntities<ApartmentDTO>(endpoints.apartments),
            fetchAllEntities<FlatDTO>(endpoints.flats),
            fetchAllEntities<ExpenseCategoryDTO>(endpoints.categories),
          ]
        );

        if (!alive) return;

        setItems(Array.isArray(expenseList) ? expenseList : []);
        setApartments(Array.isArray(aptList) ? aptList : []);
        setFlats(Array.isArray(flatList) ? flatList : []);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const apartmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const a of apartments) {
      map.set(a.apartmentId, a.apartmentName ?? `Apartment #${a.apartmentId}`);
    }
    return map;
  }, [apartments]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categories) {
      const key = c.expenseCategoryId ?? c.id;
      if (typeof key === "number") {
        map.set(key, c.categoryName ?? `Category #${key}`);
      }
    }
    return map;
  }, [categories]);

  const flatById = useMemo(() => {
    const map = new Map<number, FlatDTO>();
    for (const f of flats) {
      map.set(f.flatId, f);
    }
    return map;
  }, [flats]);

  const sortedItems = useMemo(() => {
    const copy = [...items];

    const toComparable = (value: unknown): string | number => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (value === null || value === undefined) return "";

      const s = String(value).trim();
      if (!s) return "";

      if (sortField === "monthYear") {
        const t = Date.parse(s);
        return Number.isNaN(t) ? s : t;
      }

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
      setItems((prev) => prev.filter((x) => x.extraExpenseid !== id));
      setExpandedRowId(null);
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete extra expense:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "monthYear" as const,
        label: "Month",
        width: "160px",
        renderCell: (r: ExtraExpenseDTO) => monthLabel(r.monthYear),
      },
      {
        key: "apartmentId" as const,
        label: "Apartment",
        width: "260px",
        renderCell: (r: ExtraExpenseDTO) =>
          apartmentNameById.get(r.apartmentId) ?? safeValue(r.apartmentId),
      },
      {
        key: "expenseCategoryId" as const,
        label: "Category",
        width: "100px",
        renderCell: (r: ExtraExpenseDTO) =>
          r.expenseCategoryId
            ? categoryNameById.get(r.expenseCategoryId) ??
              safeValue(r.expenseCategoryId)
            : "-",
      },
      {
        key: "isShared" as const,
        label: "Scope",
        width: "150px",
        renderCell: (r: ExtraExpenseDTO) =>
          r.isShared ? "Apartment (Shared)" : "Personal (Flat)",
      },
      {
        key: "flatId" as const,
        label: "Flat",
        width: "140px",
        renderCell: (r: ExtraExpenseDTO) => {
          if (r.isShared) return "-";
          if (!r.flatId) return "N/A";
          const f = flatById.get(r.flatId);
          return f ? flatLabel(f) : `Flat #${r.flatId}`;
        },
      },
      {
        key: "expenseAmount" as const,
        label: "Amount",
        width: "120px",
        renderCell: (r: ExtraExpenseDTO) => money(r.expenseAmount),
      },
      {
        key: "expenseDescription" as const,
        label: "Description",
        width: "320px",
        renderCell: (r: ExtraExpenseDTO) => r.expenseDescription?.trim() || "-",
      },
      {
        key: "isActive" as const,
        label: "Active",
        width: "90px",
        renderCell: (r: ExtraExpenseDTO) => (r.isActive ? "Yes" : "No"),
      },
    ],
    [apartmentNameById, categoryNameById, flatById]
  );

  return (
    <SharedListingTable<ExtraExpenseDTO>
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
      getRowKey={(x) => x.extraExpenseid}
      columns={columns}
      renderExpandedRow={(r) => (
        <>
          <strong>Expense ID:</strong> {safeValue(r.extraExpenseid)}
        </>
      )}
    />
  );
};

export default ExtraExpenseListing;