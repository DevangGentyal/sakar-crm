import apiClient from "./client";
import { ExecutiveListItem, PaginatedResponse } from "../types";

export const adminService = {
  listExecutives: async (params: {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    page?: number;
    limit?: number;
    sortBy?: "name" | "email" | "created_at";
    sortOrder?: "asc" | "desc";
  }): Promise<{ rows: ExecutiveListItem[]; total: number }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { rows: ExecutiveListItem[]; total: number };
    }>("/admin/executives", {
      params,
    });
    return response.data.data;
  },

  approveExecutive: async (id: string) => {
    const response = await apiClient.put<{
      success: boolean;
      data: ExecutiveListItem;
    }>(`/admin/executives/${id}/approve`);
    return response.data.data;
  },

  rejectExecutive: async (id: string, reason?: string) => {
    const response = await apiClient.put<{
      success: boolean;
      data: ExecutiveListItem;
    }>(`/admin/executives/${id}/reject`, {
      reason,
    });
    return response.data.data;
  },

  enableExecutive: async (id: string) => {
    const response = await apiClient.put<{
      success: boolean;
      data: ExecutiveListItem;
    }>(`/admin/executives/${id}/enable`);
    return response.data.data;
  },

  disableExecutive: async (id: string) => {
    const response = await apiClient.put<{
      success: boolean;
      data: ExecutiveListItem;
    }>(`/admin/executives/${id}/disable`);
    return response.data.data;
  },
};
