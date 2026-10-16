"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as financeApi from "@/lib/api/finance";
import { ApiClientError } from "@/lib/api/errors";
import { toast } from "sonner";

interface Scope {
  tenantId?: string;
  sessionId?: string;
  enabled?: boolean;
}

export function useFinanceSummary({ enabled = true, ...scope }: Scope) {
  return useQuery({
    queryKey: ["finance", "summary", scope],
    queryFn: () => financeApi.getFinanceSummary(scope),
    enabled,
  });
}

export function useExpenseBreakdown({ enabled = true, ...scope }: Scope) {
  return useQuery({
    queryKey: ["finance", "breakdown", scope],
    queryFn: () => financeApi.getExpenseBreakdown(scope),
    enabled,
  });
}

export function useFinanceTrend({ enabled = true, ...scope }: Scope) {
  return useQuery({
    queryKey: ["finance", "trend", scope],
    queryFn: () => financeApi.getFinanceTrend(scope),
    enabled,
  });
}

export function usePlatformFinanceSummary(sessionId?: string) {
  return useQuery({
    queryKey: ["finance", "platform-summary", sessionId],
    queryFn: () => financeApi.getPlatformFinanceSummary(sessionId),
  });
}




export function useUpdateOpeningBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeApi.updateOpeningBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Opening balance updated successfully.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update opening balance.");
    },
  });
}