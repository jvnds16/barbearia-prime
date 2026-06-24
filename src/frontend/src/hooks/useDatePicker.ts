import { useEffect, useRef, useState } from "react";
import { parseLocalDate, toDateValue } from "../utils/date";

type UseDatePickerOptions = {
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  preferToday?: boolean;
};

function getInitialDate(value: string, min: string, max: string, preferToday: boolean) {
  if (value) return parseLocalDate(value);

  const todayValue = toDateValue(new Date());
  // Public booking starts on today when it is inside the allowed range.
  if (preferToday && todayValue >= min && todayValue <= max) {
    return parseLocalDate(todayValue);
  }

  return parseLocalDate(min);
}

export function useDatePicker({
  value,
  min,
  max,
  onChange,
  preferToday = false
}: UseDatePickerOptions) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = getInitialDate(value, min, max, preferToday);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const minDate = parseLocalDate(min);
  const maxDate = parseLocalDate(max);
  const selectedDate = value ? parseLocalDate(value) : null;
  const todayValue = toDateValue(new Date());

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const nextDate = getInitialDate(value, min, max, preferToday);
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value, min, max, preferToday]);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  // Six weeks keep the calendar grid size stable while navigating months.
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const monthTitle = visibleMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const selectDate = (date: Date) => {
    onChange(toDateValue(date));
    setOpen(false);
  };

  return {
    canGoNext: nextMonth <= maxMonth,
    canGoPrevious: previousMonth >= minMonth,
    containerRef,
    days,
    maxDate,
    minDate,
    nextMonth,
    open,
    previousMonth,
    selectedDate,
    selectDate,
    setOpen,
    setVisibleMonth,
    todayValue,
    visibleMonth,
    formattedMonthTitle: monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)
  };
}
