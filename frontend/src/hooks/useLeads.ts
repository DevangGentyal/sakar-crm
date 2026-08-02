import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  leadService,
  followupService,
  callService,
} from "@/src/services/services";
import {
  Lead,
  LeadHistoryRecord,
  LeadListParams,
  PaginatedResponse,
  CreateLeadInput,
  UpdateLeadInput,
  LeadFollowUp,
  LeadCall,
} from "../types";

// Query keys
const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (params: LeadListParams) => [...leadKeys.lists(), params] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
};

// ============= Queries =============
export const useLeads = (
  params: LeadListParams,
  options?: { enabled?: boolean },
): UseQueryResult<PaginatedResponse<Lead>, Error> => {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadService.getLeads(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled !== false,
    retry: 1,
  });
};

export const useLead = (
  id: string | null | undefined,
  options?: { enabled?: boolean },
): UseQueryResult<Lead, Error> => {
  return useQuery({
    queryKey: leadKeys.detail(id || ""),
    queryFn: () => leadService.getLead(id!),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!id && options?.enabled !== false,
    retry: 1,
  });
};

export const useLeadDetails = (
  id: string | null | undefined,
  options?: { enabled?: boolean },
): UseQueryResult<{ lead: Lead; history: LeadHistoryRecord[] }, Error> => {
  return useQuery({
    queryKey: [...leadKeys.detail(id || ""), "details"],
    queryFn: () => leadService.getLeadDetails(id!),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!id && options?.enabled !== false,
    retry: 1,
  });
};

export const useLeadFollowups = (id: string | null | undefined) =>
  useQuery<LeadFollowUp[], Error>({
    queryKey: [...leadKeys.detail(id || ""), "followups"],
    queryFn: () => followupService.getAll(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

export const useLeadCalls = (
  id: string | null | undefined,
  options?: {
    refetchInterval?:
      | number
      | false
      | ((query: { state: { data?: LeadCall[] } }) => number | false);
  },
) =>
  useQuery<LeadCall[], Error>({
    queryKey: [...leadKeys.detail(id || ""), "calls"],
    queryFn: () => callService.getAll(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
    refetchInterval: options?.refetchInterval,
  });

export const useCreateFollowup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      followupDate,
      notes,
    }: {
      leadId: string;
      followupDate: string;
      notes?: string;
    }) => followupService.create(leadId, { followupDate, notes }),
    onSuccess: (_item, input) =>
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.detail(input.leadId), "followups"],
      }),
  });
};

export const useAllFollowups = (filter?: string) =>
  useQuery({
    queryKey: ["followups", "all", filter],
    queryFn: () => followupService.getAllFollowups(filter),
    staleTime: 1000 * 60,
  });

export const useCompleteFollowup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      followupId,
      completed,
    }: {
      leadId: string;
      followupId: string;
      completed: boolean;
    }) => followupService.complete(leadId, followupId, completed),
    onSuccess: (_result, input) =>
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.detail(input.leadId), "followups"],
      }),
  });
};

export const useInitiateLeadCall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      followupId,
      statusCallbackUrl,
    }: {
      leadId: string;
      followupId?: string | null;
      statusCallbackUrl?: string;
    }): Promise<LeadCall> =>
      callService.initiate(leadId, { followupId, statusCallbackUrl }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: [...leadKeys.detail(variables.leadId), "calls"],
      });
      const previousCalls = queryClient.getQueryData<LeadCall[]>([
        ...leadKeys.detail(variables.leadId),
        "calls",
      ]);
      const optimisticCall: LeadCall = {
        id: `pending-${Date.now()}`,
        leadId: variables.leadId,
        followupId: variables.followupId ?? null,
        initiatedBy: "pending",
        callerId: "pending",
        fromNumber: "",
        toNumber: "",
        status: "queued",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LeadCall;
      queryClient.setQueryData<LeadCall[]>(
        [...leadKeys.detail(variables.leadId), "calls"],
        (existing = []) => [optimisticCall, ...existing],
      );
      return { previousCalls };
    },
    onError: (_error, variables, context) => {
      if (context?.previousCalls) {
        queryClient.setQueryData<LeadCall[]>(
          [...leadKeys.detail(variables.leadId), "calls"],
          context.previousCalls,
        );
      }
    },
    onSuccess: (call, input) => {
      queryClient.setQueryData<LeadCall[]>(
        [...leadKeys.detail(input.leadId), "calls"],
        (existing = []) => {
          const withoutPending = existing.filter(
            (item) => item.id !== `pending-${Date.now()}`,
          );
          return [
            call,
            ...withoutPending.filter((item) => item.id !== call.id),
          ];
        },
      );
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.detail(input.leadId), "calls"],
      });
    },
  });
};

export const useUpdateLeadCall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      callId,
      input,
    }: {
      leadId: string;
      callId: string;
      input: { notes?: string | null; outcome?: string | null };
    }) => callService.update(leadId, callId, input),
    onSuccess: (_call, input) => {
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.detail(input.leadId), "calls"],
      });
    },
  });
};

// ============= Mutations =============
export const useCreateLead = (): UseMutationResult<
  Lead,
  Error,
  CreateLeadInput,
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadService.createLead,
    onSuccess: (newLead) => {
      // Invalidate leads list to refetch
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      // Add to cache for immediate access
      queryClient.setQueryData(leadKeys.detail(newLead.id), newLead);
    },
    retry: 1,
  });
};

export const useUpdateLead = (): UseMutationResult<
  Lead,
  Error,
  { id: string; input: UpdateLeadInput },
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => leadService.updateLead(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(id) });

      // Get previous data
      const previousLead = queryClient.getQueryData(leadKeys.detail(id));

      // Optimistic update
      if (previousLead) {
        queryClient.setQueryData(leadKeys.detail(id), (old: Lead) => ({
          ...old,
          ...input,
        }));
      }

      return { previousLead };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousLead) {
        queryClient.setQueryData(leadKeys.detail(id), context.previousLead);
      }
    },
    onSuccess: (updatedLead) => {
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead);
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
};
