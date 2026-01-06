// src/components/common/DateInput.tsx
import React from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import FormLabel from "./FormLabel";

dayjs.extend(customParseFormat);

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

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required,
  readOnly,
  allowClear = false,
  disabled = false,
}) => {
  const parsedDate = value ? dayjs(value, "YYYY-MM-DD") : null;
  const effectiveDisabled = disabled && !readOnly;

  return (
    <div className="form-group w-100 mb-2">
      <FormLabel label={label} htmlFor={id} required={required} />
      <DatePicker
        id={id}
        value={parsedDate}
        onChange={(date) => {
          if (readOnly) return;

          const formatted = date ? date.format("YYYY-MM-DD") : "";
          onChange?.(formatted);
        }}
        format="DD-MMMM-YYYY"
        allowClear={allowClear}
        disabled={effectiveDisabled}
        inputReadOnly={!!readOnly}
        open={readOnly ? false : undefined}
        style={{ width: "100%", height: "38px", fontSize: "14px" }}
        styles={{
          popup: {
            root: { zIndex: 9999 },
          },
        }}
        classNames={{
          popup: {
            root: "custom-ant-datepicker-dropdown",
          },
        }}
        placement="bottomLeft"
      />
    </div>
  );
};

export default DateInput;