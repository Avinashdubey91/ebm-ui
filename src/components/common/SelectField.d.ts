import React from "react";
interface SelectOption {
    label: string;
    value: string | number;
}
interface SelectFieldProps {
    label: string;
    name: string;
    value: string | number | undefined;
    options: SelectOption[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    required?: boolean;
    disabled?: boolean;
}
declare const SelectField: React.FC<SelectFieldProps>;
export default SelectField;
