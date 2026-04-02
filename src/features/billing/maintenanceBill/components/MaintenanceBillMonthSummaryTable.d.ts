import React from "react";
import { type MultiSelectOption } from "../../../../components/common/MultiSelectField";
type RowVM = {
    key: string;
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
type Props = {
    loading: boolean;
    rows: RowVM[];
    getFlatOptionsForMonth: (billingMonthIso: string) => MultiSelectOption[];
    getSelectedPaidIds: (billingMonthIso: string) => number[];
    onEnsurePaidIdsLoaded: (billingMonthIso: string) => Promise<void> | void;
    onEnsureFlatOwnerLookupLoaded: (billingMonthIso: string) => Promise<void> | void;
    onPaidFlatsChange: (billingMonthIso: string, values: string[]) => Promise<void> | void;
    onBillPaidToggle: (billingMonthIso: string, nextIsBillPaid: boolean, currentIsLocked: boolean) => Promise<void> | void;
    onLockToggle: (billingMonthIso: string, currentIsBillPaid: boolean, nextIsLocked: boolean) => Promise<void> | void;
    onPrint: (billingMonthIso: string) => void;
};
declare const MaintenanceBillMonthSummaryTable: React.FC<Props>;
export default MaintenanceBillMonthSummaryTable;
