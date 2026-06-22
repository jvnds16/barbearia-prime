import { afterEach, describe, expect, it, vi } from "vitest";
import { schedulingService } from "./schedulingService";

const okResponse = {
  ok: true,
  status: 200,
  text: async () => JSON.stringify({
    success: true,
    data: {
      _id: "appointment-id",
      customerName: "João Silva",
      customerPhone: "27999999999",
      serviceName: "Corte",
      date: "2026-06-22",
      time: "09:00",
      status: "pending"
    }
  })
};

describe("scheduling service routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the canonical appointments endpoint for creation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse);
    vi.stubGlobal("fetch", fetchMock);

    await schedulingService.create({
      nome: "João Silva",
      telefone: "27999999999",
      servico: "Corte",
      data: "2026-06-22",
      horario: "09:00"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/appointments",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("uses resource identifiers in update and delete URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("sessionStorage", {
      getItem: () => "token",
      setItem: () => undefined,
      removeItem: () => undefined
    });

    await schedulingService.update("appointment-id", { status: "presente" });
    await schedulingService.remove("appointment-id");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/appointments/appointment-id",
      expect.objectContaining({ method: "PUT" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/appointments/appointment-id",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
