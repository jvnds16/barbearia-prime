import { Agendamento, DashboardStats } from "../types/scheduling";
import { toDateValue } from "./date";

export function calculateDashboardStats(appointments: Agendamento[]): DashboardStats {
  const today = toDateValue(new Date());
  const currentMonth = today.substring(0, 7);
  const validAppointments = appointments.filter((appointment) => appointment.status !== "cancelado");
  const attendedAppointments = appointments.filter((appointment) => appointment.status === "presente");

  const appointmentsToday = validAppointments.filter((appointment) => appointment.data === today);
  const appointmentsThisMonth = validAppointments.filter((appointment) => appointment.data.startsWith(currentMonth));
  const attendedToday = attendedAppointments.filter((appointment) => appointment.data === today);
  const attendedThisMonth = attendedAppointments.filter((appointment) => appointment.data.startsWith(currentMonth));
  const pendingThisMonth = appointmentsThisMonth.filter((appointment) => appointment.status === "pendente").length;
  const absentThisMonth = appointmentsThisMonth.filter((appointment) => appointment.status === "ausente").length;

  const profitToday = attendedToday.reduce((total, appointment) => total + (appointment.preco || 0), 0);
  const monthlyProfit = attendedThisMonth.reduce((total, appointment) => total + (appointment.preco || 0), 0);

  const profitsByDay = attendedThisMonth.reduce((result, appointment) => {
    result[appointment.data] = (result[appointment.data] || 0) + (appointment.preco || 0);
    return result;
  }, {} as Record<string, number>);

  const services = attendedThisMonth.reduce((result, appointment) => {
    if (!result[appointment.servico]) {
      result[appointment.servico] = { quantidade: 0, lucroTotal: 0 };
    }
    result[appointment.servico].quantidade += 1;
    result[appointment.servico].lucroTotal += appointment.preco || 0;
    return result;
  }, {} as Record<string, { quantidade: number; lucroTotal: number }>);

  const popularServices = Object.entries(services)
    .map(([servico, stats]) => ({ servico, ...stats }))
    .sort((first, second) => second.quantidade - first.quantidade)
    .slice(0, 5);

  const daysWithAppointments = Object.keys(profitsByDay).length;

  return {
    lucroHoje: profitToday,
    lucroMensal: monthlyProfit,
    totalAgendamentos: validAppointments.length,
    mediaDiaria: daysWithAppointments > 0 ? monthlyProfit / daysWithAppointments : 0,
    agendamentosHoje: appointmentsToday.length,
    agendamentosMes: appointmentsThisMonth.length,
    atendimentosHoje: attendedToday.length,
    atendimentosMes: attendedThisMonth.length,
    pendentesMes: pendingThisMonth,
    ausentesMes: absentThisMonth,
    lucrosPorDia: profitsByDay,
    servicosMaisPopulares: popularServices
  };
}
