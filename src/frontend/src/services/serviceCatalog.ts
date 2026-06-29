import { ApiResponse, Service } from "../types/appointment";
import { apiRequest } from "./api";

export async function listServices() {
  const response = await apiRequest<ApiResponse<Service[]>>("/services");
  return response;
}