import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/services/client";

export interface MetaIntegrationSettings {
  id: string;
  enabled: boolean;
  integrationKey: string;
  callbackUrl: string | null;
  connected: boolean;
  verifyToken: string;
  appId: string | null;
  appSecretMasked: string | null;
  pageId: string | null;
  pageAccessTokenMasked: string | null;
  defaultProjectId: string | null;
  defaultAssignedUserId: string | null;
  fieldMapping: Record<string, string>;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface MetaLeadEvent {
  id: string;
  leadgen_id: string;
  page_id: string | null;
  form_id: string | null;
  ad_id: string | null;
  status: string;
  retry_count: number;
  crm_lead_id: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

const key = ["meta-integration"] as const;

export function useMetaIntegration() {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: MetaIntegrationSettings | null;
      }>("/meta");
      return response.data.data;
    },
  });
}

export function useMetaEvents() {
  return useQuery({
    queryKey: [...key, "events"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: MetaLeadEvent[];
      }>("/meta/events");
      return response.data.data;
    },
  });
}

export function useSaveMetaIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const response = await apiClient.put<{
        success: boolean;
        data: MetaIntegrationSettings;
      }>("/meta", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: [...key, "events"] });
    },
  });
}

export function useDisconnectMetaIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete("/meta"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useTestMetaIntegration() {
  return useMutation({ mutationFn: () => apiClient.post("/meta/test") });
}

export function useRetryMetaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiClient.post(`/meta/events/${eventId}/retry`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...key, "events"] }),
  });
}
