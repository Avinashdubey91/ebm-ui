import React from "react";
export interface MultiSelectOption {
    label: string;
    value: string | number;
}
interface MultiSelectFieldProps {
    label: string;
    name: string;
    value: Array<string | number>;
    options: MultiSelectOption[];
    onChange: (values: string[]) => void;
    required?: boolean;
    disabled?: boolean;
    showCountOnly?: boolean;
}
declare const MultiSelectField: React.FC<MultiSelectFieldProps>;
export default MultiSelectField;
