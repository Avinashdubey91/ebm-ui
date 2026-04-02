import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    meterReadingId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditMeterReading: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditMeterReading;
