import React from "react";
interface DateInputProps {
    id: string;
    label: string;
    value: string;
    onChange?: (date: string) => void;
    required?: boolean;
    readOnly?: boolean;
    allowClear?: boolean;
    disabled?: boolean;
}
declare const DateInput: React.FC<DateInputProps>;
export default DateInput;
