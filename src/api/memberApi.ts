import type {
  ImportAnalyzeResponse,
  ImportMapping,
  ImportPreviewResponse,
  ImportResult,
} from "../types/import";
import type {
  CreateMemberRequest,
  Member,
} from "../types/member";
import { apiClient } from "./client";

export async function getMembers(businessId: string, ownerId: string) {
  try {
    const response = await apiClient.get<Member[]>(
      `/business/member/getAllmembers/${ownerId}/${businessId}`,
    );
    
    return response.data;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return [];
    }
    throw error;
  }
}

export async function createMember(data: CreateMemberRequest) {
  const response = await apiClient.post<Member>(
    "/business/member/createMember",
    data,
  );
  return response.data;
}

export async function deleteMember(
  memberId: string,
  businessId: string,
  ownerId: string,
) {
  const response = await apiClient.delete<string>(
    `/business/member/deleteMemberById/${ownerId}/${businessId}/${memberId}`,
  );
  return response.data;
}

// ---- Bulk import: analyze -> preview -> commit. The same file is re-sent each time (max 5 MB),
// so the server keeps no temporary upload and the final import is always validated from scratch.

// apiClient defaults to Content-Type: application/json, and axios then turns a FormData body into a
// JSON string, so the server never sees a multipart request. Overriding it per call keeps the FormData
// intact; the browser then adds the real multipart header with its boundary.
const multipart = { headers: { "Content-Type": "multipart/form-data" } };

function importForm(file: File, mapping?: ImportMapping) {
  const form = new FormData();
  form.append("file", file);

  if (mapping) {
    for (const [fieldKey, columnIndex] of Object.entries(mapping.columns)) {
      if (columnIndex !== null) form.append(fieldKey, String(columnIndex));
    }
    for (const [fieldKey, value] of Object.entries(mapping.defaults)) {
      if (value) form.append(`default_${fieldKey}`, value);
    }
  }
  return form;
}

export async function analyzeImport(businessId: string, file: File) {
  const response = await apiClient.post<ImportAnalyzeResponse>(
    `/business/${businessId}/member/import/analyze`,
    importForm(file),
    multipart,
  );
  return response.data;
}

export async function previewImport(
  businessId: string,
  file: File,
  mapping: ImportMapping,
) {
  const response = await apiClient.post<ImportPreviewResponse>(
    `/business/${businessId}/member/import/preview`,
    importForm(file, mapping),
    multipart,
  );
  return response.data;
}

export async function commitImport(
  businessId: string,
  file: File,
  mapping: ImportMapping,
) {
  const response = await apiClient.post<ImportResult>(
    `/business/${businessId}/member/import/commit`,
    importForm(file, mapping),
    multipart,
  );
  return response.data;
}