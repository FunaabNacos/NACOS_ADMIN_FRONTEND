import { apiClient } from "./client";
import { paths } from "./paths";
import type { PaginatedTransactions, PlatformAnalytics, TenantAnalytics } from "@/lib/types";

export function getPlatformAnalytics(sessionId?: string) {
  const qs = sessionId ? `?sessionId=${sessionId}` : "";
  return apiClient.get<PlatformAnalytics>(`${paths.analytics.platform}${qs}`);
}

/** super_admin/main_admin pass tenantId explicitly; finance_director omits it (scoped server-side). */
export function getTenantAnalytics(tenantId?: string, sessionId?: string) {
  const qs = sessionId ? `?sessionId=${sessionId}` : "";
  return apiClient.get<TenantAnalytics>(`${paths.analytics.tenant(tenantId)}${qs}`);
}

export interface ListTransactionsParams {
  tenantId?: string;
  sessionId?: string;
  level?: string;
  department?: string;
  paymentType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function listTransactions(params: ListTransactionsParams = {}) {
  const search = new URLSearchParams();
  if (params.tenantId) search.set("tenantId", params.tenantId);
  if (params.sessionId) search.set("sessionId", params.sessionId);
  if (params.level) search.set("level", params.level);
  if (params.department) search.set("department", params.department);
  if (params.paymentType) search.set("paymentType", params.paymentType);
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  return apiClient.get<PaginatedTransactions>(`${paths.analytics.transactions}?${search.toString()}`);
}
