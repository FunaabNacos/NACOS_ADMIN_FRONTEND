"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as usersApi from "@/lib/api/users";
import { ApiClientError } from "@/lib/api/errors";

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useAdminUsers() {
  return useQuery({ queryKey: ["users", "admins"], queryFn: usersApi.listAdminUsers });
}

export function useMainAdmins() {
  return useQuery({ queryKey: ["users", "main-admins"], queryFn: usersApi.listMainAdmins });
}

export function useFinanceDirectors() {
  return useQuery({ queryKey: ["users", "finance-directors"], queryFn: usersApi.listFinanceDirectors });
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["users"] });
  queryClient.invalidateQueries({ queryKey: ["tenants"] });
}

export function useCreateMainAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createMainAdmin,
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success("Admin created — their temporary password has been emailed to them.");
    },
    onError,
  });
}

export function useCreateFinanceDirector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createFinanceDirector,
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success("Finance Director created — their temporary password has been emailed to them.");
    },
    onError,
  });
}

export function useDeleteFinanceDirector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteFinanceDirector(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success("Finance Director removed.");
    },
    onError,
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: string) => usersApi.resetUserPassword(id),
    onSuccess: () => toast.success("Password reset — a temporary password has been emailed."),
    onError,
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unlockUser(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success("Account unlocked.");
    },
    onError,
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivateUser(id),
    onSuccess: () => {
      invalidateUsers(queryClient);
      toast.success("User deactivated.");
    },
    onError,
  });
}
