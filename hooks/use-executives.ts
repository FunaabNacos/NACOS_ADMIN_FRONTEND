"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as executivesApi from "@/lib/api/executives";
import type {
  ExecutiveGroup,
  CreateExecutiveInput,
  UpdateExecutiveInput,
} from "@/lib/api/executives";
import { ApiClientError } from "@/lib/api/errors";

export const executiveKeys = {
  all: ["executives"] as const,
  list: (group?: ExecutiveGroup) => [...executiveKeys.all, "list", group ?? "all"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useExecutives(group?: ExecutiveGroup) {
  return useQuery({
    queryKey: executiveKeys.list(group),
    queryFn: () => executivesApi.listExecutives(group),
  });
}

export function useCreateExecutive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExecutiveInput) => executivesApi.createExecutive(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
      toast.success("Executive added.");
    },
    onError,
  });
}

export function useUpdateExecutive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExecutiveInput }) =>
      executivesApi.updateExecutive(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
      toast.success("Executive updated.");
    },
    onError,
  });
}

export function useUploadExecutiveImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      executivesApi.uploadExecutiveImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
      toast.success("Photo updated.");
    },
    onError,
  });
}

export function useReorderExecutive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, displayOrder }: { id: string; displayOrder: number }) =>
      executivesApi.reorderExecutive(id, displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
    },
    onError,
  });
}

export function useDeleteExecutive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executivesApi.deleteExecutive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
      toast.success("Executive removed.");
    },
    onError,
  });
}
