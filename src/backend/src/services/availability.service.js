import { Appointment } from "../models/appointment.model.js";
import { generateAvailableTimeSlots } from "../utils/timeSlots.js";
import { hasRequiredLeadTime } from "./appointment.service.js";

const SLOT_MINUTES = 30;

export async function getAvailableSlots({ date }) {
  const appointments = await Appointment.find({ date, status: { $in: ["pending", "present"] } })
    .select("time durationMinutes")
    .lean();

  return generateAvailableTimeSlots().filter((time) => {
    if (!hasRequiredLeadTime(time, date)) return false;
    const [hour, minute] = time.split(":").map(Number);
    const candidateStart = hour * 60 + minute;
    const candidateEnd = candidateStart + SLOT_MINUTES;
    return !appointments.some((item) => {
      const [itemHour, itemMinute] = item.time.split(":").map(Number);
      const itemStart = itemHour * 60 + itemMinute;
      const itemEnd = itemStart + (item.durationMinutes || SLOT_MINUTES);
      return candidateStart < itemEnd && candidateEnd > itemStart;
    });
  });
}