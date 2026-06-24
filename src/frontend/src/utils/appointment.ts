import { Appointment } from "../types/appointment";

export const sanitizePublicAppointments = (
  appointments: Appointment[],
): Appointment[] =>
  // Public cache only needs occupancy data, not customer information.
  appointments.map(({ date, time, status, durationMinutes }) => ({
    customerName: "",
    customerPhone: "",
    serviceName: "",
    date,
    time,
    status,
    durationMinutes,
  }));

export function hasAppointmentConflict(
  appointments: Appointment[],
  date: string,
  time: string,
  durationMinutes: number,
) {
  // Range comparison catches overlaps from services longer than a single 30-minute slot.
  const [candidateHour, candidateMinute] = time.split(":").map(Number);
  const candidateStart = candidateHour * 60 + candidateMinute;
  const candidateEnd = candidateStart + durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.status === "cancelled" || appointment.date !== date)
      return false;

    const [appointmentHour, appointmentMinute] = appointment.time
      .split(":")
      .map(Number);
    const appointmentStart = appointmentHour * 60 + appointmentMinute;
    const appointmentEnd =
      appointmentStart + (appointment.durationMinutes || 30);

    return candidateStart < appointmentEnd && candidateEnd > appointmentStart;
  });
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(digits);
}

export function createAvailableTimes() {
  const times = [];

  // Business hours are 08:00-19:00 with a lunch break at 12:00.
  for (let hour = 8; hour <= 19; hour += 1) {
    if (hour === 12) continue;

    times.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour !== 19) {
      times.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }

  return times;
}
