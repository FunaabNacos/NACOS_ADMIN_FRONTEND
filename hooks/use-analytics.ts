"use client";

import { useQuery } from "@tanstack/react-query";
import * as analyticsApi from "@/lib/api/analytics";
import type { ListTransactionsParams } from "@/lib/api/analytics";

export function usePlatformAnalytics(sessionId?: string) {
  return useQuery({
    queryKey: ["analytics", "platform", sessionId],
    queryFn: () => analyticsApi.getPlatformAnalytics(sessionId),
  });
}

export function useTenantAnalytics(tenantId?: string, sessionId?: string) {
  return useQuery({
    queryKey: ["analytics", "tenant", tenantId, sessionId],
    queryFn: () => analyticsApi.getTenantAnalytics(tenantId, sessionId),
  });
}

export function useTransactions(params: ListTransactionsParams) {
  return useQuery({
    queryKey: ["analytics", "transactions", params],
    queryFn: () => analyticsApi.listTransactions(params),
  });
}
