import { ApiResponse, Service } from "../types/appointment";
import { apiRequest } from "./api";

interface ApiService {
  _id?: string;
  name: string;
  price: number;
  duration: string;
  durationMinutes?: number;
  active?: boolean;
}

export const defaultServices: Service[] = [
  {
    name: "Corte Clássico",
    price: 30,
    duration: "30 min",
    durationMinutes: 30,
  },
  { name: "Corte + Barba", price: 50, duration: "50 min", durationMinutes: 50 },
  {
    name: "Corte com Pigmentação",
    price: 70,
    duration: "60 min",
    durationMinutes: 60,
  },
  { name: "Barba", price: 25, duration: "25 min", durationMinutes: 25 },
  { name: "Sobrancelha", price: 15, duration: "10 min", durationMinutes: 10 },
  {
    name: "Pacote Premium",
    price: 90,
    duration: "80 min",
    durationMinutes: 80,
  },
];

export async function listServices() {
  const response = await apiRequest<ApiResponse<ApiService[]>>("/services");
  return {
    ...response,
    data: response.data.map(
      (service): Service => ({
        _id: service._id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        durationMinutes: service.durationMinutes,
        active: service.active,
      }),
    ),
  };
}
