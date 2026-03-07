export type MaintenanceBillMonthStatusUpdateDTO = {
  apartmentId: number;
  billingMonth: string; // ISO
  isBillPaid: boolean;
  isLocked: boolean;
};