import { useEffect, useRef, useState } from "react";
import type { TextFieldProps } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { enGB, fr } from "date-fns/locale";
import { isValid, parseISO } from "date-fns";
import { enUS as pickerEn, frFR as pickerFr } from "@mui/x-date-pickers/locales";
import { useTranslation } from "react-i18next";

import { INVALID_DATE_TIME, toDateTimeLocalValue } from "./dateTime";

type DateTimePickerFieldProps = Omit<TextFieldProps, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

/** Masked day/month/year entry with an explicit calendar button and 24-hour time. */
export function DateTimePickerField({ value, onChange, label, disabled, readOnly, ...textFieldProps }: DateTimePickerFieldProps) {
  const { i18n } = useTranslation();
  const french = i18n.language?.startsWith("fr");
  const [date, setDate] = useState<Date | null>(() => value ? parseISO(value) : null);
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    // Keep partially typed/invalid sections intact until a real external reset.
    if (value !== lastEmittedValue.current) {
      setDate(value ? parseISO(value) : null);
      lastEmittedValue.current = value;
    }
  }, [value]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={french ? fr : enGB}
      localeText={{
        ...(french ? pickerFr : pickerEn).components.MuiLocalizationProvider.defaultProps.localeText,
        fieldDayPlaceholder: () => "--",
        fieldMonthPlaceholder: () => "--",
        fieldYearPlaceholder: () => "----",
        fieldHoursPlaceholder: () => "--",
        fieldMinutesPlaceholder: () => "--"
      }}
    >
      <DateTimePicker
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        value={date}
        format="dd/MM/yyyy HH:mm"
        ampm={false}
        // Existing forms allow historical dates to be reviewed; their schemas
        // remain responsible for expiration and campaign chronology rules.
        minDate={parseISO("0001-01-01")}
        onChange={nextDate => {
          setDate(nextDate);
          const nextValue = nextDate === null ? "" : isValid(nextDate)
            ? toDateTimeLocalValue(nextDate) : INVALID_DATE_TIME;
          lastEmittedValue.current = nextValue;
          onChange(nextValue);
        }}
        slotProps={{
          textField: {
            ...textFieldProps,
            fullWidth: false,
            sx: [
              { alignSelf: "flex-start", width: "auto", maxWidth: "100%" },
              ...(Array.isArray(textFieldProps.sx) ? textFieldProps.sx : [textFieldProps.sx])
            ],
            InputLabelProps: { ...textFieldProps.InputLabelProps, shrink: true }
          },
          field: { clearable: !textFieldProps.required }
        }}
      />
    </LocalizationProvider>
  );
}