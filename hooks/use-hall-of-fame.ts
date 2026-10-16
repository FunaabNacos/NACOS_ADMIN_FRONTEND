"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as hallOfFameApi from "@/lib/api/hall-of-fame";
import type { CreateHallOfFameInput, UpdateHallOfFameInput } from "@/lib/api/hall-of-fame";
import { ApiClientError } from "@/lib/api/errors";

export const hallOfFameKeys = {
  all: ["hall-of-fame"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useHallOfFame() {
  return useQuery({
    queryKey: hallOfFameKeys.all,
    queryFn: () => hallOfFameApi.listHallOfFame(),
  });
}

export function useCreateHallOfFameEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHallOfFameInput) => hallOfFameApi.createHallOfFameEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallOfFameKeys.all });
      toast.success("Inductee added.");
    },
    onError,
  });
}

export function useUpdateHallOfFameEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHallOfFameInput }) =>
      hallOfFameApi.updateHallOfFameEntry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallOfFameKeys.all });
      toast.success("Inductee updated.");
    },
    onError,
  });
}

export function useUploadHallOfFameImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      hallOfFameApi.uploadHallOfFameImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallOfFameKeys.all });
      toast.success("Photo updated.");
    },
    onError,
  });
}

export function useDeleteHallOfFameEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hallOfFameApi.deleteHallOfFameEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hallOfFameKeys.all });
      toast.success("Inductee removed.");
    },
    onError,
  });
}
