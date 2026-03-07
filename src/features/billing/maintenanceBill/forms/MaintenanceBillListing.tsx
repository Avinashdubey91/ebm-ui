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
  MonthlyBillApartmentGenerateRequestDTO,
} from "../../../../types/MaintenanceBillingDTOs";
import MaintenanceBillMonthSummaryTable from "../components/MaintenanceBillMonthSummaryTable";

type Props = {
  apartmentId?: number;
  apartmentName?: string;
  year: number;
  monthYear: string;
  generateRequestId: number;
};

// Minimal local Flat type (keeps TS strict + avoids guessing repo DTO shape)
type FlatLookupItem = {
  flatId?: number | null;
  flatNumber?: string | null;
  apartmentId?: number | null;
};

const endpoints = {
  monthSummary: "/MonthlyBilling/Get-MaintenanceBill-MonthSummary",
  flatOwnerLookup: "/MonthlyBilling/Get-FlatOwnerLookup",
  paidFlatIds: "/MonthlyBilling/Get-MaintenanceBill-PaidFlatIds",
  updateFlatPayment: "/MonthlyBilling/Update-FlatPaymentStatus",
  updateBillStatus: "/MonthlyBilling/Update-Bill-Status-For-Apartment",
  generateForApartment: "/MonthlyBilling/Generate-Monthly-Bills-For-Apartment",

  // ExtraExpense pattern: use /flat/Get-All-Flats and map flatId->flatNumber locally
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

function isSameYearMonth(aIso: string, b: Date): boolean {
  const a = new Date(aIso);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isFutureMonth(billingMonthIso: string, now: Date): boolean {
  const d = new Date(billingMonthIso);
  const a = d.getFullYear() * 12 + d.getMonth();
  const n = now.getFullYear() * 12 + now.getMonth();
  return a > n;
}

function isPastMonth(billingMonthIso: string, now: Date): boolean {
  const d = new Date(billingMonthIso);
  const a = d.getFullYear() * 12 + d.getMonth();
  const n = now.getFullYear() * 12 + now.getMonth();
  return a < n;
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

// ExtraExpense pattern: unwrap arrays coming either as [] or {data:[]} / {Data:[]}
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

function toFlatLabel(flatNumber?: string | null, flatId?: number | null): string {
  const label = (flatNumber ?? "").trim();
  if (label.length > 0) return label;
  if (typeof flatId === "number" && flatId > 0) return `Flat #${flatId}`;
  return "";
}

function parseMonthFromMonthYear(monthYear: string): number | null {
  const parts = monthYear.split("-");
  if (parts.length !== 2) return null;
  const m = Number(parts[1]);
  if (!Number.isFinite(m) || m < 1 || m > 12) return null;
  return m;
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
  monthYear,
  generateRequestId,
}) => {
  const [loading, setLoading] = useState(false);
  const [monthSummary, setMonthSummary] = useState<
    MaintenanceBillMonthSummaryDTO[]
  >([]);

  // Lookup contains flatId + owner name parts (flatNumber is NOT reliable here)
  const [flatOwners, setFlatOwners] = useState<FlatOwnerNameLookupDTO[]>([]);

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

  const flatOptions: MultiSelectOption[] = useMemo(() => {
    const items = [...flatOwners];

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
  }, [flatOwners, flatLabelById]);

  const [paidIdsByMonthKey, setPaidIdsByMonthKey] = useState<
    Record<MonthKey, number[]>
  >({});
  const paidIdsByMonthKeyRef = useRef<Record<MonthKey, number[]>>({});
  const paidFetchInFlightRef = useRef<Set<MonthKey>>(new Set());

  useEffect(() => {
    paidIdsByMonthKeyRef.current = paidIdsByMonthKey;
  }, [paidIdsByMonthKey]);

  const now = useMemo(() => new Date(), []);
  const currentMonthIso = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const visibleRows: RowVM[] = useMemo(() => {
    if (!apartmentId) return [];

    const currentYear = now.getFullYear();
    const yearRows = monthSummary.filter(
      (r) => getYearNumberFromBillingMonth(r.billingMonth) === year,
    );

    const filtered = yearRows.filter((r) => {
      if (isFutureMonth(r.billingMonth, now)) return false;

      if (year === currentYear) {
        if (isSameYearMonth(r.billingMonth, now)) return true;
        if (isPastMonth(r.billingMonth, now)) return r.isBillGenerated;
        return false;
      }

      return r.isBillGenerated;
    });

    if (year === currentYear) {
      const hasCurrent = filtered.some((r) =>
        isSameYearMonth(r.billingMonth, now),
      );
      if (!hasCurrent) {
        filtered.push({
          apartmentId,
          billingMonth: currentMonthIso,
          isBillGenerated: false,
          totalAmount: 0,
          individualMaintenanceAmount: 0,
          currencySymbol: "₹",
          paidFlatsCount: 0,
          totalFlatsCount: 0,
          isBillPaid: false,
          isLocked: false,
        });
      }
    }

    filtered.sort(
      (a, b) =>
        new Date(a.billingMonth).getTime() - new Date(b.billingMonth).getTime(),
    );

    return filtered.map((r) => {
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
  }, [
    apartmentId,
    apartmentName,
    currentMonthIso,
    monthSummary,
    now,
    year,
    paidIdsByMonthKey,
  ]);

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

  // ExtraExpense-style: load flats master once (flatId->flatNumber source of truth)
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

  const loadFlatOwnerLookup = useCallback(async () => {
    if (!apartmentId) {
      setFlatOwners([]);
      return;
    }

    try {
      const endpoint = `${endpoints.flatOwnerLookup}/${apartmentId}`;
      const raw = await fetchAllEntities<unknown>(endpoint);
      const list = normalizeLookupArray<FlatOwnerNameLookupDTO>(raw);
      setFlatOwners(list);
    } catch (err) {
      console.error("Failed to load flat owner lookup", err);
      setFlatOwners([]);
    }
  }, [apartmentId]);

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
    void loadMonthSummary();
    void loadFlatOwnerLookup();
  }, [loadFlatOwnerLookup, loadMonthSummary]);

  useEffect(() => {
    if (!apartmentId || !year) return;
    if (generateRequestId <= 0) return;

    const run = async () => {
      const current = new Date();

      const monthFromPicker = parseMonthFromMonthYear(monthYear);
      const monthToGenerate =
        monthFromPicker ??
        (year === current.getFullYear() ? current.getMonth() + 1 : 1);

      const req: MonthlyBillApartmentGenerateRequestDTO = {
        apartmentId,
        year,
        month: monthToGenerate,
      };

      try {
        await httpClient.post(endpoints.generateForApartment, req);

        const monthKey: MonthKey = `${year}-${pad2(monthToGenerate)}`;
        setPaidIdsByMonthKey((prev) => {
          const next = { ...prev };
          delete next[monthKey];
          return next;
        });

        await loadMonthSummary();
        void ensurePaidIdsLoaded(
          new Date(year, monthToGenerate - 1, 1).toISOString(),
        );
      } catch (err) {
        console.error("Generate monthly bills failed", err);
      }
    };

    void run();
  }, [
    apartmentId,
    ensurePaidIdsLoaded,
    generateRequestId,
    loadMonthSummary,
    monthYear,
    year,
  ]);

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
    <MaintenanceBillMonthSummaryTable
      loading={loading}
      rows={visibleRows}
      flatOptions={flatOptions}
      getSelectedPaidIds={getSelectedPaidIds}
      onEnsurePaidIdsLoaded={ensurePaidIdsLoaded}
      onPaidFlatsChange={updatePaidFlats}
      onBillPaidToggle={handleBillPaidToggle}
      onLockToggle={handleLockToggle}
      onPrint={handlePrint}
    />
  );
};

export default MaintenanceBillListing;