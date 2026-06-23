import { describe, expect, it, vi } from "vitest";
import { calculateDashboardStats } from "./dashboard";

describe("dashboard statistics", () => {
  it("counts revenue only for attended appointments", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00-03:00"));

    const stats = calculateDashboardStats([
      {
        customerName: "João Silva",
        customerPhone: "27999999999",
        serviceName: "Corte",
        price: 30,
        date: "2026-06-22",
        time: "09:00",
        status: "present",
      },
      {
        customerName: "Maria Silva",
        customerPhone: "27988888888",
        serviceName: "Barba",
        price: 25,
        date: "2026-06-22",
        time: "10:00",
        status: "pending",
      },
    ]);

    expect(stats.todayProfit).toBe(30);
    expect(stats.todayAppointments).toBe(2);
    expect(stats.todayAttendances).toBe(1);
    vi.useRealTimers();
  });
});
