"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as sessionsApi from "@/lib/api/sessions";
import { ApiClientError } from "@/lib/api/errors";

export const sessionKeys = {
  all: ["sessions"] as const,
  active: ["sessions", "active"] as const,
  list: ["sessions", "list"] as const,
  fees: ["sessions", "fees"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useActiveSession() {
  return useQuery({ queryKey: sessionKeys.active, queryFn: sessionsApi.getActiveSession });
}

export function useSessions() {
  return useQuery({ queryKey: sessionKeys.list, queryFn: sessionsApi.listSessions });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Session created.");
    },
    onError,
  });
}

export function useActivateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.activateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Session activated. It's now the platform's current session.");
    },
    onError,
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.closeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Session closed. Balances have been carried forward.");
    },
    onError,
  });
}

export function useOwnTenantFees() {
  return useQuery({ queryKey: sessionKeys.fees, queryFn: sessionsApi.getOwnTenantFees });
}

export function useSetOwnTenantFees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.setOwnTenantFees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.fees });
      toast.success("Fees saved for this session.");
    },
    onError,
  });
}

export function useLockOwnTenantFees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.lockOwnTenantFees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.fees });
      toast.success("Fees locked for this session — they can no longer be changed.");
    },
    onError,
  });
}

export function useOverrideTenantFees() {
  return useMutation({
    mutationFn: ({
      sessionId,
      tenantId,
      input,
    }: {
      sessionId: string;
      tenantId: string;
      input: { newStudentFee: number; returningStudentFee: number };
    }) => sessionsApi.overrideTenantFees(sessionId, tenantId, input),
    onSuccess: () => toast.success("Fees overridden for that tenant."),
    onError,
  });
}
