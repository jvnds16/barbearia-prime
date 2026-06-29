import { Appointment, ApiResponse } from "../types/appointment";
import { ApiError, apiRequest } from "./api";

function appointmentFromApi(appointment: Appointment): Appointment {
  return {
    ...appointment,
    customerName: appointment.customerName ?? "",
    customerPhone: appointment.customerPhone ?? "",
    serviceName: appointment.serviceName ?? "",
    date: appointment.date ?? "",
    time: appointment.time ?? ""
  };
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const appointmentService = {
  async list(params?: { date?: string }) {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<Appointment[]>>(
      `/appointments/public${suffix}`,
    );
    return { ...response, data: response.data.map(appointmentFromApi) };
  },

  async listAdmin(params?: { date?: string }) {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<Appointment[]>>(
      `/appointments${suffix}`,
      { auth: true },
    );
    return { ...response, data: response.data.map(appointmentFromApi) };
  },

  async create(appointment: Appointment) {
    const headers = new Headers();
    if (appointment.idempotencyKey) {
      headers.set("Idempotency-Key", appointment.idempotencyKey);
    }

    const send = () =>
      apiRequest<ApiResponse<Appointment>>("/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify(appointment),
      });

    // A brief retry helps when a cold serverless function is still connecting to MongoDB.
    const sendWithRetry = async () => {
      try {
        return await send();
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 503 ||
          !appointment.idempotencyKey
        ) {
          throw error;
        }
        await wait(1200);
        return send();
      }
    };

    const response = await sendWithRetry();
    return { ...response, data: appointmentFromApi(response.data) };
  },

  async update(id: string, appointment: Partial<Appointment>) {
    const response = await apiRequest<ApiResponse<Appointment>>(
      `/appointments/${id}`,
      {
        method: "PUT",
        auth: true,
        body: JSON.stringify(appointment),
      },
    );
    return { ...response, data: appointmentFromApi(response.data) };
  },

  async remove(id: string) {
    const response = await apiRequest<ApiResponse<Appointment>>(
      `/appointments/${id}`,
      { method: "DELETE", auth: true },
    );
    return { ...response, data: appointmentFromApi(response.data) };
  },
};