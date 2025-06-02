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
  onChange: (date: string) => void;
  required?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required,
}) => {
  const parsedDate = value ? dayjs(value, "YYYY-MM-DD") : null;

  return (
    <div className="form-group w-100">
      <FormLabel label={label} htmlFor={id} required={required} />
      <DatePicker
        id={id}
        value={parsedDate}
        onChange={(date) => {
          const formatted = date ? date.format("YYYY-MM-DD") : "";
          onChange(formatted);
        }}
        format="DD-MMMM-YYYY"
        allowClear={false}
        style={{ width: "100%", height: "38px", fontSize: "14px" }} // match Bootstrap field height
        popupStyle={{ zIndex: 9999 }}
        dropdownClassName="custom-ant-datepicker-dropdown"
        placement="bottomLeft"
      />
    </div>
  );
};

export default DateInput;
