import { Appointment } from "../models/appointment.model.js";
import { Client } from "../models/client.model.js";
import { HttpError } from "../utils/httpError.js";
import { addDaysToISO, businessMinutesNow } from "../utils/dateTime.js";
import { generateAvailableTimeSlots, todayISO } from "../utils/timeSlots.js";

export const VALID_APPOINTMENT_STATUSES = new Set([
  "pending",
  "present",
  "absent",
  "cancelled"
]);

export const BLOCKING_APPOINTMENT_STATUSES = [
  "pending",
  "present",
  "completed"
];

export function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function isValidPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(digits);
}

export function isValidCustomerName(name) {
  return name.length >= 3 && name.length <= 80 && name.split(" ").length >= 2;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function isValidAppointmentDate(date) {
  const maximumDate = addDaysToISO(todayISO(), 30);
  return isValidDate(date) && date >= todayISO() && date <= maximumDate;
}

export function isValidAppointmentTime(time) {
  return generateAvailableTimeSlots().includes(time);
}

export function hasRequiredLeadTime(time, date) {
  if (date !== todayISO()) return true;

  const [hour, minute] = time.split(":").map(Number);
  // Same-day bookings need a buffer so the barber can prepare for the customer.
  return hour * 60 + minute > businessMinutesNow() + 30;
}

export function createSlotKeys({
  date,
  time,
  barber,
  durationMinutes = 30,
  status = "pending"
}) {
  if (!BLOCKING_APPOINTMENT_STATUSES.includes(status)) return undefined;

  // Each 30-minute segment gets its own key so longer services block overlap.
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  const slots = Math.ceil(durationMinutes / 30);

  return Array.from({ length: slots }, (_, index) => {
    const slotMinutes = start + index * 30;
    const slotHour = String(Math.floor(slotMinutes / 60)).padStart(2, "0");
    const slotMinute = String(slotMinutes % 60).padStart(2, "0");
    return `${date}|${slotHour}:${slotMinute}|${barber || "primary"}`;
  });
}

export async function ensureNoAppointmentConflict({
  date,
  time,
  barber,
  durationMinutes = 30,
  ignoreId
}) {
  const requestedSlots = createSlotKeys({ date, time, barber, durationMinutes });
  const query = {
    date,
    status: { $in: BLOCKING_APPOINTMENT_STATUSES }
  };

  if (barber) query.barber = barber;
  if (ignoreId) query._id = { $ne: ignoreId };

  const appointments = await Appointment.find(query)
    .select("time durationMinutes")
    .lean();

  // Check generated slot keys instead of exact start times to catch partial overlaps.
  const requested = new Set(requestedSlots);
  const exists = appointments.some((appointment) => {
    const occupiedSlots = createSlotKeys({
      date,
      time: appointment.time,
      barber,
      durationMinutes: appointment.durationMinutes || 30
    });
    return occupiedSlots.some((slot) => requested.has(slot));
  });

  if (exists) {
    throw new HttpError(409, "This time slot is already booked.");
  }
}

export async function syncAppointmentClient({ name, phone }) {
  try {
    // The client record is a convenience mirror; appointment creation should survive sync issues.
    await Client.findOneAndUpdate(
      { phone },
      { name, phone },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    if (error?.code === 11000) {
      await Client.updateOne({ phone }, { name });
    } else {
      console.error("Could not synchronize the client record:", error);
    }
  }
}
