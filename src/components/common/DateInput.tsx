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

  // Patch Start: allow a readonly display mode (not disabled-looking)
  readOnly?: boolean;
  // Patch End
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required,

  // Patch Start
  readOnly,
  // Patch End
}) => {
  const parsedDate = value ? dayjs(value, "YYYY-MM-DD") : null;

  return (
    <div className="form-group w-100 mb-2">
      <FormLabel label={label} htmlFor={id} required={required} />
      <DatePicker
        id={id}
        value={parsedDate}
        onChange={(date) => {
          // Patch Start: ignore changes in readOnly mode
          if (readOnly) return;
          // Patch End

          const formatted = date ? date.format("YYYY-MM-DD") : "";
          onChange?.(formatted);
        }}
        format="DD-MMMM-YYYY"
        allowClear={false}
        // Patch Start: prevent typing + prevent opening calendar
        inputReadOnly={!!readOnly}
        open={readOnly ? false : undefined}
        // Patch End
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