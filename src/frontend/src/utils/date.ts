export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

export function addLocalDays(date: Date, days: number) {
  // Constructing with local date parts avoids UTC shifts around midnight.
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
