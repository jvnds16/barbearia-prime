import { Appointment, DashboardStats } from "../types/appointment";
import { toDateValue } from "./date";

export function calculateDashboardStats(
  appointments: Appointment[],
): DashboardStats {
  const today = toDateValue(new Date());
  const currentMonth = today.substring(0, 7);
  const validAppointments = appointments.filter(
    (appointment) => appointment.status !== "cancelled",
  );
  // Financial metrics count only confirmed attendances.
  const attendedAppointments = appointments.filter(
    (appointment) => appointment.status === "present",
  );

  const appointmentsToday = validAppointments.filter(
    (appointment) => appointment.date === today,
  );
  const appointmentsThisMonth = validAppointments.filter((appointment) =>
    appointment.date.startsWith(currentMonth),
  );
  const attendedToday = attendedAppointments.filter(
    (appointment) => appointment.date === today,
  );
  const attendedThisMonth = attendedAppointments.filter((appointment) =>
    appointment.date.startsWith(currentMonth),
  );
  const pendingThisMonth = appointmentsThisMonth.filter(
    (appointment) => appointment.status === "pending",
  ).length;
  const absentThisMonth = appointmentsThisMonth.filter(
    (appointment) => appointment.status === "absent",
  ).length;

  const profitToday = attendedToday.reduce(
    (total, appointment) => total + (appointment.price || 0),
    0,
  );
  const monthlyProfit = attendedThisMonth.reduce(
    (total, appointment) => total + (appointment.price || 0),
    0,
  );

  const profitsByDay = attendedThisMonth.reduce(
    (result, appointment) => {
      result[appointment.date] =
        (result[appointment.date] || 0) + (appointment.price || 0);
      return result;
    },
    {} as Record<string, number>,
  );

  // Service popularity is calculated from attended appointments to match revenue.
  const services = attendedThisMonth.reduce(
    (result, appointment) => {
      if (!result[appointment.serviceName]) {
        result[appointment.serviceName] = { quantity: 0, totalProfit: 0 };
      }
      result[appointment.serviceName].quantity += 1;
      result[appointment.serviceName].totalProfit += appointment.price || 0;
      return result;
    },
    {} as Record<string, { quantity: number; totalProfit: number }>,
  );

  const popularServices = Object.entries(services)
    .map(([serviceName, stats]) => ({ serviceName, ...stats }))
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 5);

  const daysWithAppointments = Object.keys(profitsByDay).length;

  return {
    todayProfit: profitToday,
    monthlyProfit: monthlyProfit,
    totalAppointments: validAppointments.length,
    dailyAverage:
      daysWithAppointments > 0 ? monthlyProfit / daysWithAppointments : 0,
    todayAppointments: appointmentsToday.length,
    monthlyAppointments: appointmentsThisMonth.length,
    todayAttendances: attendedToday.length,
    monthlyAttendances: attendedThisMonth.length,
    monthlyPending: pendingThisMonth,
    monthlyAbsent: absentThisMonth,
    dailyProfits: profitsByDay,
    mostPopularServices: popularServices,
  };
}
