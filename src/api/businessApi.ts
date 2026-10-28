import type {
  Business,
  CreateBusinessRequest,
} from "../types/business";
import type { LoginResponse } from "../types/auth";
import { apiClient } from "./client";

export async function getBusinesses(userId: string) {
  const response = await apiClient.get<Business[]>(
    `/business/allBusiness/${userId}`,
  );
  return response.data;
}

export async function getBusiness(businessId: string, ownerId: string) {
  const response = await apiClient.get<Business>(
    `/business/getBusinessbyId/${ownerId}/${businessId}`,
  );
  return response.data;
}
export async function getAllBusiness( ownerId: string) {
  const response = await apiClient.get<Business>(
    `/business/getBusinessbyId/${ownerId}`,
  );
  return response.data;
}

export async function createBusiness(
  data: CreateBusinessRequest,
  session: LoginResponse,
) {
  const response = await apiClient.post<Business>(
    "/business/createBusiness",
    {
      ...data,
      loginResponseDto: session,
    },
  );
  return response.data;
}
