import React, { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";

type Props = {
  id: string;
  label: string;
  name: string; // kept for compatibility
  value: string; // "HH:mm:ss" (preferred) or "HH:mm"
  onChange: (value: string) => void; // "HH:mm:ss"
  required?: boolean;
  disabled?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const normalizeHHmmss = (raw: string): string => {
  const v = raw.trim();

  // HH:mm:ss
  const m1 = /^(\d{2}):(\d{2}):(\d{2})$/.exec(v);
  if (m1) return `${m1[1]}:${m1[2]}:${m1[3]}`;

  // HH:mm  -> HH:mm:00
  const m2 = /^(\d{2}):(\d{2})$/.exec(v);
  if (m2) return `${m2[1]}:${m2[2]}:00`;

  // Accept HH:mm:ss.xxx etc
  const m3 = /^(\d{2}):(\d{2}):(\d{2})/.exec(v);
  if (m3) return `${m3[1]}:${m3[2]}:${m3[3]}`;

  return "";
};

const hhmmssToDayjs = (hhmmss: string): Dayjs | null => {
  const v = normalizeHHmmss(hhmmss);
  if (!v) return null;

  const [hStr, mStr, sStr] = v.split(":");
  const hh = Number(hStr);
  const mm = Number(mStr);
  const ss = Number(sStr);

  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;

  return dayjs().hour(hh).minute(mm).second(ss).millisecond(0);
};

const dayjsToHHmmss = (d: Dayjs | null): string => {
  if (!d) return "";
  return `${pad2(d.hour())}:${pad2(d.minute())}:${pad2(d.second())}`;
};

const TimePickerField: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
}) => {
  const pickerValue = useMemo(() => hhmmssToDayjs(value), [value]);

  return (
    <div className="d-flex flex-column w-100">
      <label className="form-label fw-semibold mb-2" htmlFor={id}>
        {label}
      </label>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileTimePicker
          value={pickerValue}
          onChange={(newValue: Dayjs | null) => onChange(dayjsToHHmmss(newValue))}
          ampm
          views={["hours", "minutes", "seconds"]}
          format="hh:mm:ss A"
          disabled={disabled}
          slotProps={{
            textField: {
              id,
              required,
              fullWidth: true,
              size: "small",
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export default TimePickerField;