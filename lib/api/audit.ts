import { apiClient } from "./client";
import { paths } from "./paths";
import type { PaginatedAuditLogs } from "@/lib/types";

export interface ListAuditLogParams {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function listAuditLogs(params: ListAuditLogParams = {}) {
  const search = new URLSearchParams();
  if (params.userId) search.set("userId", params.userId);
  if (params.action) search.set("action", params.action);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  return apiClient.get<PaginatedAuditLogs>(`${paths.audit.list}?${search.toString()}`);
}
