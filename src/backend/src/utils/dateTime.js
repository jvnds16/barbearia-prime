export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

function getParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function businessDateISO(date = new Date()) {
  const parts = getParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function businessMinutesNow(date = new Date()) {
  const parts = getParts(date);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function addDaysToISO(dateISO, days) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

export function isSunday(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() === 0;
}
