"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as executiveSessionsApi from "@/lib/api/executive-sessions";
import type { CreatePastExecutiveInput } from "@/lib/api/executive-sessions";
import { ApiClientError } from "@/lib/api/errors";

export const executiveSessionKeys = {
  all: ["executive-sessions"] as const,
  pastExecutives: (sessionId: string) =>
    [...executiveSessionKeys.all, sessionId, "past-executives"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useExecutiveSessions() {
  return useQuery({
    queryKey: executiveSessionKeys.all,
    queryFn: () => executiveSessionsApi.listExecutiveSessions(),
  });
}

export function useCreateExecutiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => executiveSessionsApi.createExecutiveSession(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.all });
      toast.success("Session created.");
    },
    onError,
  });
}

export function useDeleteExecutiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executiveSessionsApi.deleteExecutiveSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.all });
      toast.success("Session deleted.");
    },
    onError,
  });
}

export function usePastExecutives(sessionId: string | undefined) {
  return useQuery({
    queryKey: executiveSessionKeys.pastExecutives(sessionId ?? ""),
    queryFn: () => executiveSessionsApi.listPastExecutives(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useCreatePastExecutive(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePastExecutiveInput) =>
      executiveSessionsApi.createPastExecutive(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.pastExecutives(sessionId) });
      toast.success("Past executive added.");
    },
    onError,
  });
}

export function useUpdatePastExecutive(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<{ name: string; post: string; displayOrder: number }>;
    }) => executiveSessionsApi.updatePastExecutive(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.pastExecutives(sessionId) });
      toast.success("Past executive updated.");
    },
    onError,
  });
}

export function useUploadPastExecutiveImage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      executiveSessionsApi.uploadPastExecutiveImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.pastExecutives(sessionId) });
      toast.success("Photo updated.");
    },
    onError,
  });
}

export function useDeletePastExecutive(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executiveSessionsApi.deletePastExecutive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveSessionKeys.pastExecutives(sessionId) });
      toast.success("Past executive removed.");
    },
    onError,
  });
}
