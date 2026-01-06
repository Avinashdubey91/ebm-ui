import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

type Props = {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

const MonthPickerField: React.FC<Props> = ({
  id,
  label,
  name,
  value,
  onChange,
  required,
  disabled,
}) => {
  return (
    <div className="d-flex flex-column">
      <label className="form-label fw-semibold mb-2" htmlFor={id}>
        {label}
      </label>

      {/* Same wrapper + input class as Topbar.tsx */}
      <div className="dashboard-ebm-month-picker-wrapper position-relative dashboard-ebm-custom-month-wrapper w-100">
        <input
          id={id}
          name={name}
          type="month"
          className="form-control form-control-md month-selector w-100"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={required}
          disabled={disabled}
        />
        <FaCalendarAlt className="dashboard-ebm-custom-calendar-icon" />
      </div>
    </div>
  );
};

export default MonthPickerField;