/**
 * Maintenance Bill UI DTOs (Frontend)
 * Keep these aligned with backend DTOs and JSON payloads.
 */
export type MonthKey = `${number}-${string}`;
export type MaintenanceBillMonthSummaryDTO = {
    apartmentId: number;
    billingMonth: string;
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
    month: number;
};
/**
 * Backend lookup DTOs sometimes differ in property naming depending on controller.
 * Keep this flexible to avoid "Unknown (Unknown)" labels when the backend uses FlatNo/Owner.
 */
export type FlatOwnerNameLookupDTO = {
    flatId: number;
    flatNumber?: string | null;
    ownerName?: string | null;
    flatNo?: string | null;
    owner?: string | null;
};
