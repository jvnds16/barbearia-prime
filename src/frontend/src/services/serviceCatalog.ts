import { ApiResponse, Servico } from "../types/scheduling";
import { apiRequest } from "./api";

interface ApiService {
  _id?: string;
  name: string;
  price: number;
  duration: string;
  active?: boolean;
}

export const defaultServices: Servico[] = [
  { nome: "Corte Clássico", preco: 30, duracao: "30 min" },
  { nome: "Corte + Barba", preco: 50, duracao: "50 min" },
  { nome: "Corte com Pigmentação", preco: 70, duracao: "60 min" },
  { nome: "Barba", preco: 25, duracao: "25 min" },
  { nome: "Sobrancelha", preco: 15, duracao: "10 min" },
  { nome: "Pacote Premium", preco: 90, duracao: "80 min" }
];

export async function listServices() {
  const response = await apiRequest<ApiResponse<ApiService[]>>("/services");
  return {
    ...response,
    data: response.data.map((service): Servico => ({
      _id: service._id,
      nome: service.name,
      preco: service.price,
      duracao: service.duration,
      ativo: service.active
    }))
  };
}
