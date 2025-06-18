import React from "react";
import FormLabel from "./FormLabel";

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

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
}) => (
  <div className="mb-2">
    <FormLabel label={label} htmlFor={name} required={required} />
    <select
      id={name}
      name={name}
      className="form-select"
      value={value ?? ""}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      <option value="">-- Select --</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default SelectField;
