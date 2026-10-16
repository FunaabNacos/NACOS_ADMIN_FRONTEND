import { apiClient } from "./client";
import { paths } from "./paths";
import type {
  ExpenseBreakdownEntry,
  FinanceSummary,
  FinanceTrendPoint,
  PlatformFinanceSummaryEntry,
} from "@/lib/types";

interface Scope {
  tenantId?: string;
  sessionId?: string;
}

function scopeQuery(scope: Scope) {
  const search = new URLSearchParams();
  if (scope.tenantId) search.set("tenantId", scope.tenantId);
  if (scope.sessionId) search.set("sessionId", scope.sessionId);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getFinanceSummary(scope: Scope) {
  return apiClient.get<FinanceSummary>(`${paths.finance.summary}${scopeQuery(scope)}`);
}

export function getExpenseBreakdown(scope: Scope) {
  return apiClient.get<ExpenseBreakdownEntry[]>(`${paths.finance.breakdown}${scopeQuery(scope)}`);
}

export function getFinanceTrend(scope: Scope) {
  return apiClient.get<FinanceTrendPoint[]>(`${paths.finance.trend}${scopeQuery(scope)}`);
}

export function getPlatformFinanceSummary(sessionId?: string) {
  const qs = sessionId ? `?sessionId=${sessionId}` : "";
  return apiClient.get<PlatformFinanceSummaryEntry[]>(`${paths.finance.platformSummary}${qs}`);
}

export async function exportFinanceReport(
  scope: Required<Scope>,
  format: "pdf" | "csv"
): Promise<Blob> {
  const search = new URLSearchParams({ tenantId: scope.tenantId, sessionId: scope.sessionId, format });
  return apiClient.get<Blob>(`${paths.finance.exportReport}?${search.toString()}`, {
    responseType: "blob",
  });
}

/**
 * Updates the opening balance for a session.
 * Super admins targeting a specific tenant/session use the override endpoint;
 * finance directors (and super admins acting on the active session) use the patch endpoint.
 */
export async function updateOpeningBalance(input: {
  tenantId?: string;
  sessionId?: string;
  openingBalance: number;
  isSuperAdmin?: boolean;
}) {
  if (input.isSuperAdmin && input.tenantId && input.sessionId) {
    return apiClient.put(`/sessions/${input.sessionId}/tenants/${input.tenantId}/opening-balance`, {
      openingBalance: input.openingBalance,
    });
  }

  return apiClient.patch(`/sessions/opening-balance`, {
    openingBalance: input.openingBalance,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
  });
}
