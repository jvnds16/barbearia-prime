import { Appointment } from "../models/appointment.model.js";
import { gerarHorariosDisponiveis, hojeISO } from "../utils/timeSlots.js";
import { businessMinutesNow, isSunday } from "../utils/dateTime.js";

function horarioEhFuturoComMargem(horario, data) {
  if (data !== hojeISO()) return true;

  const [hora, minuto] = horario.split(":").map(Number);
  const minutosHorario = hora * 60 + minuto;

  return minutosHorario > businessMinutesNow() + 30;
}

export async function getAvailableSlots({ data, barbeiro }) {
  if (isSunday(data)) return [];

  const query = {
    date: data,
    status: { $in: ["pending", "present", "completed"] }
  };

  if (barbeiro) {
    query.barber = barbeiro;
  }

  const appointments = await Appointment.find(query)
    .select("time durationMinutes")
    .lean();

  return gerarHorariosDisponiveis().filter((horario) => {
    const [hour, minute] = horario.split(":").map(Number);
    const candidateStart = hour * 60 + minute;
    const candidateEnd = candidateStart + 30;
    const occupied = appointments.some((item) => {
      const [itemHour, itemMinute] = item.time.split(":").map(Number);
      const appointmentStart = itemHour * 60 + itemMinute;
      const appointmentEnd = appointmentStart + (item.durationMinutes || 30);
      return candidateStart < appointmentEnd && candidateEnd > appointmentStart;
    });

    return !occupied && horarioEhFuturoComMargem(horario, data);
  });
}
