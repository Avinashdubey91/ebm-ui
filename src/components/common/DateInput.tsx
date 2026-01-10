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
  const effectiveDisabled = disabled && !readOnly;
  const canInteract = !readOnly && !effectiveDisabled;

  const [isOpen, setIsOpen] = React.useState(false);

  // Local value ensures UI reacts immediately
  const [localValue, setLocalValue] = React.useState<string>(value ?? "");
  // Force remount of DatePicker to reset internal selection on Clear/Today
  const [pickerKey, setPickerKey] = React.useState(0);

  React.useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const parsedDate = localValue ? dayjs(localValue, "YYYY-MM-DD") : null;

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (readOnly) return;

    const formatted = date ? date.format("YYYY-MM-DD") : "";
    setLocalValue(formatted);
    onChange?.(formatted);
  };

  const closeAndRefresh = () => {
    setIsOpen(false);
    setPickerKey((k) => k + 1);
  };

  const handleClear = () => {
    if (readOnly) return;

    setLocalValue("");
    onChange?.("");
    closeAndRefresh();
  };

  const handleToday = () => {
    if (readOnly) return;

    const today = dayjs().format("YYYY-MM-DD");
    setLocalValue(today);
    onChange?.(today);
    closeAndRefresh();
  };

  return (
    <div className="form-group w-100 mb-2">
      <FormLabel label={label} htmlFor={id} required={required} />

      <DatePicker
        key={pickerKey}
        id={id}
        value={parsedDate}
        onChange={handleDateChange}
        format="DD-MMMM-YYYY"
        allowClear={allowClear}
        disabled={effectiveDisabled}
        inputReadOnly={!!readOnly}
        open={readOnly ? false : isOpen}
        onOpenChange={(nextOpen) => {
          if (readOnly) return;
          setIsOpen(nextOpen);
        }}
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
        showNow={false}
        renderExtraFooter={() => {
          if (!canInteract) return null;

          return (
            <div className="d-flex justify-content-between align-items-center px-1">
              <button
                type="button"
                onClick={handleClear}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#dc3545",
                  fontWeight: 400,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleToday}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#0d6efd",
                  fontWeight: 400,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Today
              </button>
            </div>
          );
        }}
      />
    </div>
  );
};

export default DateInput;