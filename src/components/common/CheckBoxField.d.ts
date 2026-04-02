import React from "react";
import type { InputHTMLAttributes } from "react";
interface CheckBoxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    checked: boolean;
    checkboxStyle?: React.CSSProperties;
}
declare const CheckBoxField: React.FC<CheckBoxFieldProps>;
export default CheckBoxField;
