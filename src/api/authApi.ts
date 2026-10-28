import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/auth";
import { apiClient } from "./client";

export async function registerUser(data: RegisterRequest) {
  const response = await apiClient.post<string>("/auth/register", data);
  return response.data;
}

export async function loginUser(data: LoginRequest) {
  const response = await apiClient.post<LoginResponse>("/auth/login", data);
  return response.data;
}
