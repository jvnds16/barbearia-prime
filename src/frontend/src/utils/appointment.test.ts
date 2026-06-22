import { describe, expect, it } from "vitest";
import {
  createAvailableTimes,
  formatPhone,
  hasAppointmentConflict,
  isValidPhone,
  sanitizePublicAppointments
} from "./appointment";

describe("appointment utilities", () => {
  it("creates the expected business time grid", () => {
    const times = createAvailableTimes();
    expect(times[0]).toBe("08:00");
    expect(times).not.toContain("12:00");
    expect(times[times.length - 1]).toBe("19:00");
  });

  it("detects overlaps using service duration", () => {
    expect(
      hasAppointmentConflict(
        [{
          nome: "",
          telefone: "",
          servico: "",
          data: "2026-06-22",
          horario: "09:00",
          duracaoMinutos: 50,
          status: "pendente"
        }],
        "2026-06-22",
        "09:30",
        30
      )
    ).toBe(true);
  });

  it("formats and validates Brazilian phone numbers", () => {
    expect(formatPhone("27999999999")).toBe("(27) 99999-9999");
    expect(isValidPhone("(27) 99999-9999")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("removes private fields from public appointments", () => {
    expect(
      sanitizePublicAppointments([{
        nome: "João Silva",
        telefone: "(27) 99999-9999",
        servico: "Corte",
        data: "2026-06-22",
        horario: "10:00"
      }])[0]
    ).toMatchObject({ nome: "", telefone: "", servico: "" });
  });
});
