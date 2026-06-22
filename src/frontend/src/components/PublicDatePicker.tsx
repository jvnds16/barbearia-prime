import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconCalendarEvent } from "@tabler/icons-react";
import { parseLocalDate, toDateValue } from "../utils/date";

type PublicDatePickerProps = {
  value: string;
  min: string;
  max: string;
  invalid: boolean;
  describedBy: string;
  onChange: (value: string) => void;
};

export function PublicDatePicker({
  value,
  min,
  max,
  invalid,
  describedBy,
  onChange
}: PublicDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = value ? parseLocalDate(value) : parseLocalDate(min);
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
    if (!value) return;
    const nextDate = parseLocalDate(value);
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value]);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const canGoPrevious = previousMonth >= minMonth;
  const canGoNext = nextMonth <= maxMonth;
  const monthTitle = visibleMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  const formattedMonthTitle = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const selectDate = (date: Date) => {
    onChange(toDateValue(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id="data"
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center justify-between rounded-lg border bg-zinc-950/70 px-4 py-3 text-left outline-none transition focus:ring-2 focus:ring-amber-400/30 ${
          invalid
            ? "border-red-400/80 focus:border-red-300"
            : "border-zinc-700 hover:border-zinc-500 focus:border-amber-400"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        <span className={selectedDate ? "text-white" : "text-zinc-500"}>
          {selectedDate
            ? selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
            : "Escolha uma data"}
        </span>
        <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300 transition group-hover:border-amber-400/45 group-focus:border-amber-300/70 group-focus:bg-amber-400/20">
          <IconCalendarEvent size={19} stroke={1.8} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Escolher data do agendamento"
          className="absolute left-0 top-[calc(100%+0.6rem)] z-50 w-full min-w-[19rem] rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl shadow-black/70 sm:w-[22rem]"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => canGoPrevious && setVisibleMonth(previousMonth)}
              disabled={!canGoPrevious}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <strong className="text-sm text-white">
              {formattedMonthTitle}
            </strong>
            <button
              type="button"
              onClick={() => canGoNext && setVisibleMonth(nextMonth)}
              disabled={!canGoNext}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`} className="py-1 text-[0.65rem] font-bold uppercase text-zinc-600">
                {day}
              </span>
            ))}
            {days.map((date) => {
              const dateValue = toDateValue(date);
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isDisabled = !isCurrentMonth || date < minDate || date > maxDate;
              const isSelected = dateValue === value;
              const isToday = dateValue === todayValue;

              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => selectDate(date)}
                  disabled={isDisabled}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? "bg-amber-400 text-black shadow-md shadow-amber-500/20"
                      : isDisabled
                        ? "cursor-not-allowed text-zinc-800"
                        : "text-zinc-300 hover:bg-amber-400/10 hover:text-amber-300"
                  }`}
                  aria-label={date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                  aria-pressed={isSelected}
                >
                  {date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500">Disponível por até 30 dias</span>
            <button
              type="button"
              onClick={() => selectDate(minDate)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/10"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
