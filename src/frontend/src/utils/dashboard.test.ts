import { describe, expect, it, vi } from "vitest";
import { calculateDashboardStats } from "./dashboard";

describe("dashboard statistics", () => {
  it("counts revenue only for attended appointments", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00-03:00"));

    const stats = calculateDashboardStats([
      {
        nome: "João Silva",
        telefone: "27999999999",
        servico: "Corte",
        preco: 30,
        data: "2026-06-22",
        horario: "09:00",
        status: "presente"
      },
      {
        nome: "Maria Silva",
        telefone: "27988888888",
        servico: "Barba",
        preco: 25,
        data: "2026-06-22",
        horario: "10:00",
        status: "pendente"
      }
    ]);

    expect(stats.lucroHoje).toBe(30);
    expect(stats.agendamentosHoje).toBe(2);
    expect(stats.atendimentosHoje).toBe(1);
    vi.useRealTimers();
  });
});
