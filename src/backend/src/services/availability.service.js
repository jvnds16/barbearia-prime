import { Appointment } from "../models/appointment.model.js";
import { generateAvailableTimeSlots, todayISO } from "../utils/timeSlots.js";
import { businessMinutesNow } from "../utils/dateTime.js";

function hasFutureLeadTime(time, date) {
  if (date !== todayISO()) return true;

  const [hour, minute] = time.split(":").map(Number);
  const slotMinutes = hour * 60 + minute;

  return slotMinutes > businessMinutesNow() + 30;
}

export async function getAvailableSlots({ date, barber }) {
  const query = {
    date,
    status: { $in: ["pending", "present", "completed"] }
  };

  if (barber) {
    query.barber = barber;
  }

  const appointments = await Appointment.find(query)
    .select("time durationMinutes")
    .lean();

  return generateAvailableTimeSlots().filter((time) => {
    const [hour, minute] = time.split(":").map(Number);
    const candidateStart = hour * 60 + minute;
    const candidateEnd = candidateStart + 30;
    const occupied = appointments.some((item) => {
      const [itemHour, itemMinute] = item.time.split(":").map(Number);
      const appointmentStart = itemHour * 60 + itemMinute;
      const appointmentEnd = appointmentStart + (item.durationMinutes || 30);
      return candidateStart < appointmentEnd && candidateEnd > appointmentStart;
    });

    return !occupied && hasFutureLeadTime(time, date);
  });
}
