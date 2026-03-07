/**
 * Maintenance Bill UI DTOs (Frontend)
 * Keep these aligned with backend DTOs and JSON payloads.
 */

export type MonthKey = `${number}-${string}`; // e.g. "2025-01"

export type MaintenanceBillMonthSummaryDTO = {
  apartmentId: number;
  billingMonth: string; // ISO date (1st day of month)

  isBillGenerated: boolean;
  totalAmount: number;
  individualMaintenanceAmount: number;
  currencySymbol?: string | null;

  paidFlatsCount: number;
  totalFlatsCount: number;

  isBillPaid: boolean;
  isLocked: boolean;
};

export type MaintenanceBillFlatPaymentUpdateDTO = {
  apartmentId: number;
  billingMonth: string;
  paidFlatIds: number[];
};

export type MaintenanceBillMonthStatusUpdateDTO = {
  apartmentId: number;
  billingMonth: string;
  isBillPaid: boolean;
  isLocked: boolean;
};

export type MonthlyBillApartmentGenerateRequestDTO = {
  apartmentId: number;
  year: number;
  month: number; // 1..12
};

/**
 * Backend lookup DTOs sometimes differ in property naming depending on controller.
 * Keep this flexible to avoid "Unknown (Unknown)" labels when the backend uses FlatNo/Owner.
 */
export type FlatOwnerNameLookupDTO = {
  flatId: number;

  // preferred names (most controllers)
  flatNumber?: string | null;
  ownerName?: string | null;

  // fallback names (if backend uses different naming)
  flatNo?: string | null;
  owner?: string | null;
};