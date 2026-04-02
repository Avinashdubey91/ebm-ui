export type MaintenanceBillMonthStatusUpdateDTO = {
    apartmentId: number;
    billingMonth: string;
    isBillPaid: boolean;
    isLocked: boolean;
};
