import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconCalendarEvent } from "@tabler/icons-react";
import { useDatePicker } from "../../hooks/useDatePicker";
import { parseLocalDate, toDateValue } from "../../utils/date";

type ModernDatePickerProps = {
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function ModernDatePicker({
  value,
  min,
  max,
  onChange,
  placeholder = "Escolha uma data",
  ariaLabel = "Escolher data",
}: ModernDatePickerProps) {
  const {
    canGoNext,
    canGoPrevious,
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
    formattedMonthTitle,
  } = useDatePicker({ value, min, max, onChange, preferToday: true });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-left outline-none transition hover:border-zinc-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={selectedDate ? "text-white" : "text-zinc-400"}>
          {selectedDate
            ? selectedDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : placeholder}
        </span>
        <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300 transition group-hover:border-amber-400/45">
          <IconCalendarEvent size={18} stroke={1.8} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+0.6rem)] z-[90] w-full min-w-[19rem] rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl shadow-black/70 sm:w-[22rem]"
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
              <span
                key={`${day}-${index}`}
                className="py-1 text-[0.65rem] font-bold text-zinc-600"
              >
                {day}
              </span>
            ))}
            {days.map((date) => {
              const dateValue = toDateValue(date);
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth();
              const isDisabled =
                !isCurrentMonth || date < minDate || date > maxDate;
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
                  aria-label={date.toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
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
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Limpar
            </button>
            {todayValue >= min && todayValue <= max && (
              <button
                type="button"
                onClick={() => selectDate(parseLocalDate(todayValue))}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/10"
              >
                Hoje
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
