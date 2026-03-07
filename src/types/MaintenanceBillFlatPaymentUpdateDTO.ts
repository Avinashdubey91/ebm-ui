export type MaintenanceBillFlatPaymentUpdateDTO = {
  apartmentId: number;
  billingMonth: string; // ISO
  flatIds: number[];
};
