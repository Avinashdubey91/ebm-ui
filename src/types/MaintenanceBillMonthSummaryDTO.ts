export type MaintenanceBillMonthSummaryDTO = {
  apartmentId: number;
  billingMonth: string; // ISO date string (from backend)
  isBillGenerated: boolean;

  totalAmount: number;
  individualMaintenanceAmount: number;
  currencySymbol?: string | null;

  paidFlatsCount: number;
  totalFlatsCount: number;

  isBillPaid: boolean;
  isLocked: boolean;
};
