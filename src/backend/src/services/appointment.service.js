import { Appointment } from "../models/appointment.model.js";
import { addDaysToISO, businessMinutesNow } from "../utils/dateTime.js";
import { generateAvailableTimeSlots, todayISO } from "../utils/timeSlots.js";

export const VALID_APPOINTMENT_STATUSES = new Set([
  "pending",
  "present",
  "absent",
  "cancelled"
]);

export const BLOCKING_APPOINTMENT_STATUSES = ["pending", "present"];

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

export async function ensureNoAppointmentConflict({
  date,
  time,
  durationMinutes = 30,
  ignoreId
}) {
  const [hour, minute] = time.split(":").map(Number);
  const startMinutes = hour * 60 + minute;
  const endMinutes = startMinutes + durationMinutes;
  // Overlap test: candidate [startMinutes, endMinutes) intersects any existing booking.
  // Mongo computes the intersect via $expr/$and/$lt/$gt, so we do not load documents into Node.
  const query = {
    date,
    status: { $in: BLOCKING_APPOINTMENT_STATUSES },
    $expr: {
      $and: [
        { $lt: [{ $add: [{ $multiply: [{ $toInt: { $substrBytes: ["$time", 0, 2] } }, 60] }, { $toInt: { $substrBytes: ["$time", 3, 2] } }] }, endMinutes] },
        { $gt: [{ $add: [{ $add: [{ $multiply: [{ $toInt: { $substrBytes: ["$time", 0, 2] } }, 60] }, { $toInt: { $substrBytes: ["$time", 3, 2] } }] }, { $ifNull: ["$durationMinutes", 30] }] }, startMinutes] }
      ]
    }
  };

  if (ignoreId) query._id = { $ne: ignoreId };

  const conflict = await Appointment.exists(query);
  if (conflict) {
    const error = new Error("This time slot is already booked.");
    error.statusCode = 409;
    throw error;
  }
}