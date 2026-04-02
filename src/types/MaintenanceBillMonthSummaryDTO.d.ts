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
