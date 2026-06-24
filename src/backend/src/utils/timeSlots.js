import { businessDateISO } from "./dateTime.js";

export function generateAvailableTimeSlots() {
  const timeSlots = [];

  // Business hours are 08:00-19:00 with 30-minute intervals and no 12:00 slot.
  for (let hour = 8; hour <= 19; hour += 1) {
    if (hour === 12) continue;

    timeSlots.push(`${String(hour).padStart(2, "0")}:00`);

    if (hour !== 19) {
      timeSlots.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }

  return timeSlots;
}

export function todayISO() {
  return businessDateISO();
}
