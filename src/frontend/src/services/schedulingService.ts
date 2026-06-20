import { Agendamento, ApiResponse } from "../types/scheduling";
import { ApiError, apiRequest } from "./api";

type ApiAppointmentStatus = "pending" | "completed" | "cancelled";

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

const statusFromApi: Record<ApiAppointmentStatus, NonNullable<Agendamento["status"]>> = {
  pending: "pendente",
  completed: "concluido",
  cancelled: "cancelado"
};

const statusToApi: Record<NonNullable<Agendamento["status"]>, ApiAppointmentStatus> = {
  pendente: "pending",
  concluido: "completed",
  cancelado: "cancelled"
};

function appointmentFromApi(appointment: ApiAppointment): Agendamento {
  return {
    _id: appointment._id,
    nome: appointment.customerName ?? "",
    telefone: appointment.customerPhone ?? "",
    servico: appointment.serviceName ?? "",
    preco: appointment.price,
    data: appointment.date ?? "",
    horario: appointment.time ?? "",
    timestamp: appointment.timestamp,
    idempotencyKey: appointment.idempotencyKey,
    duracaoMinutos: appointment.durationMinutes,
    canceladoEm: appointment.cancelledAt,
    canceladoPor: appointment.cancelledBy,
    status: appointment.status ? statusFromApi[appointment.status] : undefined
  };
}

function appointmentToApi(appointment: Partial<Agendamento>): Partial<ApiAppointment> {
  const result: Partial<ApiAppointment> = {};
  if (appointment.nome !== undefined) result.customerName = appointment.nome;
  if (appointment.telefone !== undefined) result.customerPhone = appointment.telefone;
  if (appointment.servico !== undefined) result.serviceName = appointment.servico;
  if (appointment.preco !== undefined) result.price = appointment.preco;
  if (appointment.data !== undefined) result.date = appointment.data;
  if (appointment.horario !== undefined) result.time = appointment.horario;
  if (appointment.timestamp !== undefined) result.timestamp = appointment.timestamp;
  if (appointment.idempotencyKey !== undefined) result.idempotencyKey = appointment.idempotencyKey;
  if (appointment.duracaoMinutos !== undefined) result.durationMinutes = appointment.duracaoMinutos;
  if (appointment.status !== undefined) result.status = statusToApi[appointment.status];
  return result;
}

function mapAppointmentResponse(response: ApiResponse<ApiAppointment>): ApiResponse<Agendamento> {
  return { ...response, data: appointmentFromApi(response.data) };
}

function mapAppointmentListResponse(response: ApiResponse<ApiAppointment[]>): ApiResponse<Agendamento[]> {
  return { ...response, data: response.data.map(appointmentFromApi) };
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const schedulingService = {
  async list(params?: { data?: string }) {
    const search = new URLSearchParams();
    if (params?.data) search.set("date", params.data);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<ApiAppointment[]>>(`/scheduling${suffix}`);
    return mapAppointmentListResponse(response);
  },

  async listAdmin(params?: { data?: string }) {
    const search = new URLSearchParams();
    if (params?.data) search.set("date", params.data);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await apiRequest<ApiResponse<ApiAppointment[]>>(`/appointments${suffix}`, {
      auth: true
    });
    return mapAppointmentListResponse(response);
  },

  async create(appointment: Agendamento) {
    const headers = new Headers();
    if (appointment.idempotencyKey) {
      headers.set("Idempotency-Key", appointment.idempotencyKey);
    }

    const send = () =>
      apiRequest<ApiResponse<ApiAppointment>>("/scheduling", {
        method: "POST",
        headers,
        body: JSON.stringify(appointmentToApi(appointment))
      });

    try {
      return mapAppointmentResponse(await send());
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 503 || !appointment.idempotencyKey) {
        throw error;
      }

      await wait(1200);
      return mapAppointmentResponse(await send());
    }
  },

  async update(id: string, appointment: Partial<Agendamento>) {
    const response = await apiRequest<ApiResponse<ApiAppointment>>("/scheduling", {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ id, ...appointmentToApi(appointment) })
    });
    return mapAppointmentResponse(response);
  },

  async remove(id: string) {
    const response = await apiRequest<ApiResponse<ApiAppointment>>(`/scheduling?id=${id}`, {
      method: "DELETE",
      auth: true
    });
    return mapAppointmentResponse(response);
  }
};



