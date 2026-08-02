import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { authService } from "@/src/services/services";
import {
  AuthUser,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types";

const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
};

export const useCurrentUser = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response.user;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
    enabled: options?.enabled !== false,
    retry: 1,
  });
};

export const useUsers = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [...authKeys.all, "users"],
    queryFn: authService.listUsers,
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 10,
  });

export const useLogin = (): UseMutationResult<
  AuthResponse & { mustChangePassword?: boolean },
  Error,
  LoginCredentials
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.currentUser(), response.user);
    },
  });
};

export const useChangePassword = (): UseMutationResult<
  void,
  Error,
  { currentPassword: string; newPassword: string }
> => {
  return useMutation({
    mutationFn: authService.changePassword,
  });
};

export const useRegister = (): UseMutationResult<
  { user: AuthUser; message: string },
  Error,
  RegisterCredentials
> => {
  return useMutation({
    mutationFn: authService.register,
  });
};

export const useLogout = (): UseMutationResult<void, Error, void> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.removeQueries();
    },
  });
};

export const useRefreshToken = (): UseMutationResult<
  AuthResponse,
  Error,
  void
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.currentUser(), response.user);
    },
  });
};
