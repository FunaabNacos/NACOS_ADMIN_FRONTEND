"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as settingsApi from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/errors";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: settingsApi.getSettings });
}

export function useSetMaintenanceMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => settingsApi.setMaintenanceMode(enabled),
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(enabled ? "Maintenance mode enabled." : "Maintenance mode disabled.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Something went wrong."),
  });
}

export function usePaystackSettings() {
  return useQuery({
    queryKey: ["settings", "paystack"],
    queryFn: settingsApi.getPaystackSettings,
  });
}

export function useUpdatePaystackSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updatePaystackSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "paystack"] });
      toast.success("Paystack settings updated.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Something went wrong."),
  });
}

export function useDeletePaystackSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deletePaystackSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "paystack"] });
      toast.success("Paystack secret removed.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Something went wrong."),
  });
}
