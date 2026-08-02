import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { adminService } from "@/src/services/adminService";
import { ExecutiveListItem, Company } from "@/src/types";
import { companyService } from "@/src/services/services";

export const useExecutives = (params: {
  status: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["executives", params.status, params.page, params.limit],
    queryFn: () => adminService.listExecutives(params),
    staleTime: 1000 * 60 * 1,
  });
};

export const useApproveExecutive = (): UseMutationResult<
  ExecutiveListItem,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.approveExecutive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
};

export const useRejectExecutive = (): UseMutationResult<
  ExecutiveListItem,
  Error,
  { id: string; reason?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminService.rejectExecutive(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
};

export const useEnableExecutive = (): UseMutationResult<
  ExecutiveListItem,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.enableExecutive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
};

export const useDisableExecutive = (): UseMutationResult<
  ExecutiveListItem,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.disableExecutive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    },
  });
};

export const useCompanies = () =>
  useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: companyService.list,
    staleTime: 1000 * 60,
  });

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

export const useActivateCompany = (): UseMutationResult<Company, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

export const useDeactivateCompany = (): UseMutationResult<Company, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};
