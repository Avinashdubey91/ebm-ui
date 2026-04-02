import React from "react";
type Props = {
    id: string;
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
};
declare const TimePickerField: React.FC<Props>;
export default TimePickerField;
