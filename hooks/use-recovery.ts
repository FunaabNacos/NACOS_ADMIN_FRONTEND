"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as recoveryApi from "@/lib/api/recovery";
import { ApiClientError } from "@/lib/api/errors";

export function usePendingReceipts() {
  return useQuery({ queryKey: ["recovery", "pending-receipts"], queryFn: recoveryApi.listPendingReceipts });
}

export function useResyncTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paystackReference: string) => recoveryApi.resyncTransaction(paystackReference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery"] });
      toast.success("Transaction re-synced.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiClientError ? error.message : "Re-sync failed."),
  });
}
