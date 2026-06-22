import { Appointment } from "../models/appointment.model.js";
import { Client } from "../models/client.model.js";
import { HttpError } from "../utils/httpError.js";
import { addDaysToISO, businessMinutesNow } from "../utils/dateTime.js";
import { gerarHorariosDisponiveis, hojeISO } from "../utils/timeSlots.js";

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
  const maximumDate = addDaysToISO(hojeISO(), 30);
  return isValidDate(date) && date >= hojeISO() && date <= maximumDate;
}

export function isValidAppointmentTime(time) {
  return gerarHorariosDisponiveis().includes(time);
}

export function hasRequiredLeadTime(time, date) {
  if (date !== hojeISO()) return true;

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute > businessMinutesNow() + 30;
}

export function createSlotKeys({
  data,
  horario,
  barbeiro,
  duracaoMinutos = 30,
  status = "pending"
}) {
  if (!BLOCKING_APPOINTMENT_STATUSES.includes(status)) return undefined;

  const [hour, minute] = horario.split(":").map(Number);
  const start = hour * 60 + minute;
  const slots = Math.ceil(duracaoMinutos / 30);

  return Array.from({ length: slots }, (_, index) => {
    const slotMinutes = start + index * 30;
    const slotHour = String(Math.floor(slotMinutes / 60)).padStart(2, "0");
    const slotMinute = String(slotMinutes % 60).padStart(2, "0");
    return `${data}|${slotHour}:${slotMinute}|${barbeiro || "principal"}`;
  });
}

export async function ensureNoAppointmentConflict({
  data,
  horario,
  barbeiro,
  duracaoMinutos = 30,
  ignoreId
}) {
  const requestedSlots = createSlotKeys({ data, horario, barbeiro, duracaoMinutos });
  const query = {
    date: data,
    status: { $in: BLOCKING_APPOINTMENT_STATUSES }
  };

  if (barbeiro) query.barber = barbeiro;
  if (ignoreId) query._id = { $ne: ignoreId };

  const appointments = await Appointment.find(query)
    .select("time durationMinutes")
    .lean();
  const requested = new Set(requestedSlots);
  const exists = appointments.some((appointment) => {
    const occupiedSlots = createSlotKeys({
      data,
      horario: appointment.time,
      barbeiro,
      duracaoMinutos: appointment.durationMinutes || 30
    });
    return occupiedSlots.some((slot) => requested.has(slot));
  });

  if (exists) {
    throw new HttpError(409, "This time slot is already booked.");
  }
}

export async function syncAppointmentClient({ name, phone }) {
  try {
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
