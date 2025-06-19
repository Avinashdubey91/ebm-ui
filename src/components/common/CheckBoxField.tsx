import React from "react";
import type { InputHTMLAttributes } from "react";
import FormLabel from "./FormLabel";

// Extend all native checkbox attributes and add custom props
interface CheckBoxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  checked: boolean;
  checkboxStyle?: React.CSSProperties;
}

const CheckBoxField: React.FC<CheckBoxFieldProps> = ({
  label,
  name,
  checked,
  required,
  checkboxStyle,
  ...inputProps
}) => (
  <div className="form-check mb-2">
    <input
      id={name}
      name={name}
      type="checkbox"
      className="form-check-input"
      checked={checked}
      required={required}
      style={checkboxStyle} // ✅ scale here
      {...inputProps}
    />
    <FormLabel label={label} htmlFor={name} required={required} className="form-check-label fw-semibold" />
  </div>
);

export default CheckBoxField;
