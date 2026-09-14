import { bearerHeaders } from "@/features/auth/auth-session";
import { apiRequest } from "@/lib/api/client";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listCategories(
  token: string,
  signal?: AbortSignal,
): Promise<CategoryRecord[]> {
  return apiRequest<CategoryRecord[]>("/categories", {
    headers: bearerHeaders(token),
    signal,
  });
}

export interface SaveCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export function createCategory(
  payload: SaveCategoryRequest,
  token: string,
): Promise<CategoryRecord> {
  return apiRequest<CategoryRecord>("/categories", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateCategory(
  id: string,
  payload: Partial<SaveCategoryRequest>,
  token: string,
): Promise<CategoryRecord> {
  return apiRequest<CategoryRecord>(`/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deactivateCategory(
  id: string,
  token: string,
): Promise<CategoryRecord> {
  return apiRequest<CategoryRecord>(`/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
}
