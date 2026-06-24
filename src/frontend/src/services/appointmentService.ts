import { Appointment, ApiResponse } from "../types/appointment";
import { ApiError, apiRequest } from "./api";

type ApiAppointmentStatus =
  | "pending"
  | "present"
  | "absent"
  | "completed"
  | "cancelled";

interface ApiAppointment {
  _id?: string;
  customerName?: string;
  customerPhone?: string;
  serviceName?: string;
  price?: number;
  date?: string;
  time?: string;
  timestamp?: number;
  idempotencyKey?: string;
  durationMinutes?: number;
  cancelledAt?: string;
  cancelledBy?: string;
  status?: ApiAppointmentStatus;
}

const statusFromApi: Record<
  ApiAppointmentStatus,
  NonNullable<Appointment["status"]>
> = {
  pending: "pending",
  present: "present",
  absent: "absent",
  completed: "present",
  cancelled: "cancelled",
};

// The API still accepts "completed", but the UI treats it as an attended appointment.
const statusToApi: Record<
  NonNullable<Appointment["status"]>,
  ApiAppointmentStatus
> = {
  pending: "pending",
  present: "present",
  absent: "absent",
  cancelled: "cancelled",
};

function appointmentFromApi(appointment: ApiAppointment): Appointment {
  return {
    _id: appointment._id,
    customerName: appointment.customerName ?? "",
    customerPhone: appointment.customerPhone ?? "",
    serviceName: appointment.serviceName ?? "",
    price: appointment.price,
    date: appointment.date ?? "",
    time: appointment.time ?? "",
    timestamp: appointment.timestamp,
    idempotencyKey: appointment.idempotencyKey,
    durationMinutes: appointment.durationMinutes,
    cancelledAt: appointment.cancelledAt,
    cancelledBy: appointment.cancelledBy,
    status: appointment.status ? statusFromApi[appointment.status] : undefined,
  };
}

function appointmentToApi(
  appointment: Partial<Appointment>,
): Partial<ApiAppointment> {
  const result: Partial<ApiAppointment> = {};
  if (appointment.customerName !== undefined)
    result.customerName = appointment.customerName;
  if (appointment.customerPhone !== undefined)
    result.customerPhone = appointment.customerPhone;
  if (appointment.serviceName !== undefined)
    result.serviceName = appointment.serviceName;
  if (appointment.price !== undefined) result.price = appointment.price;
  if (appointment.date !== undefined) result.date = appointment.date;
  if (appointment.time !== undefined) result.time = appointment.time;
  if (appointment.timestamp !== undefined)
    result.timestamp = appointment.timestamp;
  if (appointment.idempotencyKey !== undefined)
    result.idempotencyKey = appointment.idempotencyKey;
  if (appointment.durationMinutes !== undefined)
    result.durationMinutes = appointment.durationMinutes;
  if (appointment.status !== undefined)
    result.status = statusToApi[appointment.status];
  return result;
}

function mapAppointmentResponse(
  response: ApiResponse<ApiAppointment>,
): ApiResponse<Appointment> {
  return { ...response, data: appointmentFromApi(response.data) };
}

function mapAppointmentListResponse(
  response: ApiResponse<ApiAppointment[]>,
): ApiResponse<Appointment[]> {
  return { ...response, data: response.data.map(appointmentFromApi) };
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const appointmentService = {
  async list(params?: { date?: string }) {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<ApiAppointment[]>>(
      `/appointments/public${suffix}`,
    );
    return mapAppointmentListResponse(response);
  },

  async listAdmin(params?: { date?: string }) {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<ApiAppointment[]>>(
      `/appointments${suffix}`,
      {
        auth: true,
      },
    );
    return mapAppointmentListResponse(response);
  },

  async create(appointment: Appointment) {
    const headers = new Headers();
    if (appointment.idempotencyKey) {
      headers.set("Idempotency-Key", appointment.idempotencyKey);
    }

    // Keep the payload builder in one place so the retry sends an identical request.
    const send = () =>
      apiRequest<ApiResponse<ApiAppointment>>("/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify(appointmentToApi(appointment)),
      });

    try {
      return mapAppointmentResponse(await send());
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        error.status !== 503 ||
        !appointment.idempotencyKey
      ) {
        throw error;
      }

      // A brief retry helps when a cold serverless function is still connecting to MongoDB.
      await wait(1200);
      return mapAppointmentResponse(await send());
    }
  },

  async update(id: string, appointment: Partial<Appointment>) {
    const response = await apiRequest<ApiResponse<ApiAppointment>>(
      `/appointments/${id}`,
      {
        method: "PUT",
        auth: true,
        body: JSON.stringify(appointmentToApi(appointment)),
      },
    );
    return mapAppointmentResponse(response);
  },

  async remove(id: string) {
    const response = await apiRequest<ApiResponse<ApiAppointment>>(
      `/appointments/${id}`,
      {
        method: "DELETE",
        auth: true,
      },
    );
    return mapAppointmentResponse(response);
  },
};
