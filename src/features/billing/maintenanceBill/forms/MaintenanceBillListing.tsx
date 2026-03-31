import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchAllEntities } from "../../../../api/genericCrudApi";
import httpClient from "../../../../api/httpClient";
import type { MultiSelectOption } from "../../../../components/common/MultiSelectField";
import type { FlatOwnerNameLookupDTO } from "../../../../types/FlatOwnerNameLookupDTO";
import type {
  MaintenanceBillFlatPaymentUpdateDTO,
  MaintenanceBillMonthStatusUpdateDTO,
  MaintenanceBillMonthSummaryDTO,
  MonthKey,
} from "../../../../types/MaintenanceBillingDTOs";
import MaintenanceBillMonthSummaryTable from "../components/MaintenanceBillMonthSummaryTable";

type Props = {
  apartmentId?: number;
  apartmentName?: string;
  year: number;
  refreshKey: number;
};

// Minimal local Flat type (keeps TS strict + avoids guessing repo DTO shape)
type FlatLookupItem = {
  flatId?: number | null;
  flatNumber?: string | null;
  apartmentId?: number | null;
};

const endpoints = {
  monthSummary: "/MonthlyBilling/Get-MaintenanceBill-MonthSummary",
  generatedFlatOwnerLookup: "/MonthlyBilling/Get-Generated-FlatOwnerLookup",
  paidFlatIds: "/MonthlyBilling/Get-MaintenanceBill-PaidFlatIds",
  updateFlatPayment: "/MonthlyBilling/Update-FlatPaymentStatus",
  updateBillStatus: "/MonthlyBilling/Update-Bill-Status-For-Apartment",
  flats: "/flat/Get-All-Flats",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toMonthKeyFromBillingMonth(billingMonthIso: string): MonthKey {
  const d = new Date(billingMonthIso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${pad2(m)}`;
}

function getMonthNumberFromBillingMonth(billingMonthIso: string): number {
  return new Date(billingMonthIso).getMonth() + 1; // 1..12
}

function getYearNumberFromBillingMonth(billingMonthIso: string): number {
  return new Date(billingMonthIso).getFullYear();
}

function toMonthStartIso(year: number, month: number): string {
  return new Date(year, month - 1, 1).toISOString();
}

function getLastVisibleMonth(year: number, now: Date): number {
  const currentYear = now.getFullYear();

  if (year < currentYear) return 12;
  if (year > currentYear) return 0;

  return now.getMonth() + 1;
}

function formatMonthLabel(billingMonthIso: string): string {
  const d = new Date(billingMonthIso);
  const monthName = d.toLocaleString("en-US", { month: "long" });
  return `${monthName} - ${d.getFullYear()}`;
}

function currencySymbolOrDefault(symbol?: string | null): string {
  return (symbol ?? "").trim().length > 0 ? String(symbol) : "₹";
}

function formatAmount(amount: number, symbol?: string | null): string {
  const s = currencySymbolOrDefault(symbol);
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${s} ${formatted}`;
}

function normalizeLookupArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const data = record.data ?? record.Data;
    if (Array.isArray(data)) return data as T[];
  }

  return [];
}

function buildOwnerDisplayName(x: FlatOwnerNameLookupDTO): string {
  const ownerDirect = (x.ownerName ?? "").trim();
  if (ownerDirect.length > 0) return ownerDirect;

  const first = (x.firstName ?? "").trim();
  const last = (x.lastName ?? "").trim();
  return `${first} ${last}`.trim();
}

function toFlatLabel(
  flatNumber?: string | null,
  flatId?: number | null,
): string {
  const label = (flatNumber ?? "").trim();
  if (label.length > 0) return label;
  if (typeof flatId === "number" && flatId > 0) return `Flat #${flatId}`;
  return "";
}

type RowVM = {
  key: MonthKey;
  billingMonth: string;
  monthLabel: string;

  isBillGenerated: boolean;
  isLocked: boolean;
  isBillPaid: boolean;

  totalAmountText: string;
  individualMaintenanceText: string;

  paidCountText: string;

  apartmentNameHidden: string;
};

const MaintenanceBillListing: React.FC<Props> = ({
  apartmentId,
  apartmentName,
  year,
  refreshKey,
}) => {
  const [loading, setLoading] = useState(false);
  const [monthSummary, setMonthSummary] = useState<
    MaintenanceBillMonthSummaryDTO[]
  >([]);

  // Lookup contains flatId + owner name parts (flatNumber is NOT reliable here)
  const [flatOwnersByMonthKey, setFlatOwnersByMonthKey] = useState<
    Record<MonthKey, FlatOwnerNameLookupDTO[]>
  >({});
  const flatOwnersByMonthKeyRef = useRef<
    Record<MonthKey, FlatOwnerNameLookupDTO[]>
  >({});
  const flatOwnerLookupInFlightRef = useRef<Set<MonthKey>>(new Set());

  // ExtraExpense approach: get flatNumber from flat master
  const [flats, setFlats] = useState<FlatLookupItem[]>([]);

  const flatLabelById = useMemo(() => {
    const m = new Map<number, string>();
    for (const f of flats) {
      const id = f.flatId ?? null;
      if (typeof id !== "number" || id <= 0) continue;
      m.set(id, toFlatLabel(f.flatNumber, id));
    }
    return m;
  }, [flats]);

  const getFlatOptionsForMonth = useCallback(
    (billingMonthIso: string): MultiSelectOption[] => {
      const key = toMonthKeyFromBillingMonth(billingMonthIso);
      const items = [...(flatOwnersByMonthKey[key] ?? [])];

      const getFlatLabel = (flatId: number): string => {
        return flatLabelById.get(flatId) ?? `Flat #${flatId}`;
      };

      items.sort((a, b) => {
        const aLabel = getFlatLabel(a.flatId);
        const bLabel = getFlatLabel(b.flatId);
        return aLabel.localeCompare(bLabel, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      return items.map((o) => {
        const owner = buildOwnerDisplayName(o);
        const flatLabel = getFlatLabel(o.flatId);
        const label = owner.length > 0 ? `${owner} (${flatLabel})` : flatLabel;

        return {
          label,
          value: String(o.flatId),
        };
      });
    },
    [flatOwnersByMonthKey, flatLabelById],
  );

  const [paidIdsByMonthKey, setPaidIdsByMonthKey] = useState<
    Record<MonthKey, number[]>
  >({});
  const paidIdsByMonthKeyRef = useRef<Record<MonthKey, number[]>>({});
  const paidFetchInFlightRef = useRef<Set<MonthKey>>(new Set());

  useEffect(() => {
    paidIdsByMonthKeyRef.current = paidIdsByMonthKey;
  }, [paidIdsByMonthKey]);

  useEffect(() => {
    flatOwnersByMonthKeyRef.current = flatOwnersByMonthKey;
  }, [flatOwnersByMonthKey]);

  const now = useMemo(() => new Date(), []);

  const visibleRows: RowVM[] = useMemo(() => {
    if (!apartmentId) return [];

    const lastVisibleMonth = getLastVisibleMonth(year, now);
    if (lastVisibleMonth <= 0) return [];

    const summaryByMonthKey = new Map<
      MonthKey,
      MaintenanceBillMonthSummaryDTO
    >();

    for (const item of monthSummary) {
      const itemYear = getYearNumberFromBillingMonth(item.billingMonth);
      if (itemYear !== year) continue;

      const key = toMonthKeyFromBillingMonth(item.billingMonth);
      summaryByMonthKey.set(key, item);
    }

    const normalizedRows: MaintenanceBillMonthSummaryDTO[] = [];

    for (let month = 1; month <= lastVisibleMonth; month++) {
      const billingMonth = toMonthStartIso(year, month);
      const key = `${year}-${pad2(month)}` as MonthKey;

      const existing = summaryByMonthKey.get(key);

      normalizedRows.push(
        existing ?? {
          apartmentId,
          billingMonth,
          isBillGenerated: false,
          totalAmount: 0,
          individualMaintenanceAmount: 0,
          currencySymbol: "₹",
          paidFlatsCount: 0,
          totalFlatsCount: 0,
          isBillPaid: false,
          isLocked: false,
        },
      );
    }

    return normalizedRows.map((r) => {
      const key = toMonthKeyFromBillingMonth(r.billingMonth);
      const selectedIds = paidIdsByMonthKey[key];
      const paidCount = Array.isArray(selectedIds)
        ? selectedIds.length
        : r.paidFlatsCount;

      return {
        key,
        billingMonth: r.billingMonth,
        monthLabel: formatMonthLabel(r.billingMonth),

        isBillGenerated: r.isBillGenerated,
        isLocked: r.isLocked,
        isBillPaid: r.isBillPaid,

        totalAmountText: formatAmount(r.totalAmount, r.currencySymbol),
        individualMaintenanceText: formatAmount(
          r.individualMaintenanceAmount,
          r.currencySymbol,
        ),

        paidCountText: `${paidCount}/${r.totalFlatsCount}`,
        apartmentNameHidden: apartmentName ?? "",
      };
    });
  }, [apartmentId, apartmentName, monthSummary, now, year, paidIdsByMonthKey]);

  const loadMonthSummary = useCallback(async () => {
    if (!apartmentId || !year) {
      setMonthSummary([]);
      return;
    }

    setLoading(true);
    try {
      const endpoint = `${endpoints.monthSummary}?apartmentId=${apartmentId}&year=${year}`;
      const data =
        await fetchAllEntities<MaintenanceBillMonthSummaryDTO>(endpoint);
      setMonthSummary(data);
    } catch (err) {
      console.error("Failed to load month summary", err);
      setMonthSummary([]);
    } finally {
      setLoading(false);
    }
  }, [apartmentId, year]);

  useEffect(() => {
    let mounted = true;

    const loadFlats = async () => {
      try {
        const raw = await fetchAllEntities<unknown>(endpoints.flats);
        const list = normalizeLookupArray<FlatLookupItem>(raw);

        if (!mounted) return;
        setFlats(list);
      } catch (err) {
        console.error("Failed to load flats", err);
        if (!mounted) return;
        setFlats([]);
      }
    };

    void loadFlats();

    return () => {
      mounted = false;
    };
  }, []);

  const ensureFlatOwnerLookupLoaded = useCallback(
    async (billingMonthIso: string) => {
      if (!apartmentId || !year) return;

      const key = toMonthKeyFromBillingMonth(billingMonthIso);

      if (flatOwnersByMonthKeyRef.current[key] !== undefined) return;
      if (flatOwnerLookupInFlightRef.current.has(key)) return;

      flatOwnerLookupInFlightRef.current.add(key);

      try {
        const month = getMonthNumberFromBillingMonth(billingMonthIso);
        const endpoint = `${endpoints.generatedFlatOwnerLookup}?apartmentId=${apartmentId}&year=${year}&month=${month}`;

        const raw = await fetchAllEntities<unknown>(endpoint);
        const list = normalizeLookupArray<FlatOwnerNameLookupDTO>(raw);

        setFlatOwnersByMonthKey((prev) => ({
          ...prev,
          [key]: list,
        }));
      } catch (err) {
        console.error("Failed to load generated flat owner lookup", err);
        setFlatOwnersByMonthKey((prev) => ({
          ...prev,
          [key]: [],
        }));
      } finally {
        flatOwnerLookupInFlightRef.current.delete(key);
      }
    },
    [apartmentId, year],
  );

  const ensurePaidIdsLoaded = useCallback(
    async (billingMonthIso: string) => {
      if (!apartmentId || !year) return;

      const key = toMonthKeyFromBillingMonth(billingMonthIso);

      if (paidIdsByMonthKeyRef.current[key] !== undefined) return;
      if (paidFetchInFlightRef.current.has(key)) return;

      paidFetchInFlightRef.current.add(key);

      try {
        const month = getMonthNumberFromBillingMonth(billingMonthIso);
        const endpoint = `${endpoints.paidFlatIds}?apartmentId=${apartmentId}&year=${year}&month=${month}`;
        const ids = await fetchAllEntities<number>(endpoint);
        setPaidIdsByMonthKey((prev) => ({ ...prev, [key]: ids }));
      } catch (err) {
        console.warn("PaidFlatIds endpoint failed; using empty selection", err);
        setPaidIdsByMonthKey((prev) => ({ ...prev, [key]: [] }));
      } finally {
        paidFetchInFlightRef.current.delete(key);
      }
    },
    [apartmentId, year],
  );

  useEffect(() => {
    if (!apartmentId) return;

    visibleRows
      .filter((r) => r.isBillGenerated)
      .map((r) => r.billingMonth)
      .forEach((bm) => {
        void ensurePaidIdsLoaded(bm);
      });
  }, [apartmentId, ensurePaidIdsLoaded, visibleRows]);

  useEffect(() => {
    if (!apartmentId) return;

    visibleRows
      .filter((r) => r.isBillGenerated)
      .map((r) => r.billingMonth)
      .forEach((bm) => {
        void ensureFlatOwnerLookupLoaded(bm);
      });
  }, [apartmentId, visibleRows, ensureFlatOwnerLookupLoaded]);

  useEffect(() => {
    void loadMonthSummary();
  }, [loadMonthSummary, refreshKey]);

  const getSelectedPaidIds = useCallback(
    (billingMonthIso: string): number[] => {
      const key = toMonthKeyFromBillingMonth(billingMonthIso);
      return paidIdsByMonthKey[key] ?? [];
    },
    [paidIdsByMonthKey],
  );

  const updatePaidFlats = useCallback(
    async (billingMonthIso: string, values: string[]) => {
      if (!apartmentId) return;

      const ids = values
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0);

      const dto: MaintenanceBillFlatPaymentUpdateDTO = {
        apartmentId,
        billingMonth: billingMonthIso,
        paidFlatIds: ids,
      };

      await httpClient.post(endpoints.updateFlatPayment, dto);

      const key = toMonthKeyFromBillingMonth(billingMonthIso);
      setPaidIdsByMonthKey((prev) => ({ ...prev, [key]: ids }));
    },
    [apartmentId],
  );

  const updateMonthStatus = useCallback(
    async (
      billingMonthIso: string,
      nextIsBillPaid: boolean,
      nextIsLocked: boolean,
    ) => {
      if (!apartmentId) return;

      const dto: MaintenanceBillMonthStatusUpdateDTO = {
        apartmentId,
        billingMonth: billingMonthIso,
        isBillPaid: nextIsBillPaid,
        isLocked: nextIsLocked,
      };

      await httpClient.post(endpoints.updateBillStatus, dto);
      await loadMonthSummary();
    },
    [apartmentId, loadMonthSummary],
  );

  const handleBillPaidToggle = useCallback(
    async (
      billingMonthIso: string,
      nextIsBillPaid: boolean,
      currentIsLocked: boolean,
    ) => {
      await updateMonthStatus(billingMonthIso, nextIsBillPaid, currentIsLocked);
    },
    [updateMonthStatus],
  );

  const handleLockToggle = useCallback(
    async (
      billingMonthIso: string,
      currentIsBillPaid: boolean,
      nextIsLocked: boolean,
    ) => {
      await updateMonthStatus(billingMonthIso, currentIsBillPaid, nextIsLocked);
    },
    [updateMonthStatus],
  );

  const handlePrint = useCallback((billingMonthIso: string) => {
    void billingMonthIso;
  }, []);

  return (
    <div className="maintenance-bill-listing-content">
      <MaintenanceBillMonthSummaryTable
        loading={loading}
        rows={visibleRows}
        getFlatOptionsForMonth={getFlatOptionsForMonth}
        getSelectedPaidIds={getSelectedPaidIds}
        onEnsurePaidIdsLoaded={ensurePaidIdsLoaded}
        onEnsureFlatOwnerLookupLoaded={ensureFlatOwnerLookupLoaded}
        onPaidFlatsChange={updatePaidFlats}
        onBillPaidToggle={handleBillPaidToggle}
        onLockToggle={handleLockToggle}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default MaintenanceBillListing;
