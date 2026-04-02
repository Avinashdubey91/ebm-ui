import React from "react";
import type { InputHTMLAttributes } from "react";
interface TextInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
}
declare const TextInputField: React.FC<TextInputFieldProps>;
export default TextInputField;
