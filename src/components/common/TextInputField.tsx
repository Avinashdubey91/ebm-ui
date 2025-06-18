import React from "react";
import type { InputHTMLAttributes } from "react";
import FormLabel from "./FormLabel";

// Extend all native HTML input attributes and add label separately
interface TextInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  name,
  required,
  ...inputProps
}) => (
  <div className="mb-2">
    <FormLabel label={label} htmlFor={name} required={required} />
    <input
      id={name}
      name={name}
      className="form-control"
      required={required}
      {...inputProps}
    />
  </div>
);

export default TextInputField;
