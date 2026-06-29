import { ApiResponse, Service } from "../types/appointment";
import { apiRequest } from "./api";

export async function listServices() {
  const response = await apiRequest<ApiResponse<Service[]>>("/services");
  if (Array.isArray(response.data)) {
    response.data = response.data.map((service) => ({
      ...service,
      duration: parseInt(String(service.duration), 10),
    }));
  }
  return response;
}
