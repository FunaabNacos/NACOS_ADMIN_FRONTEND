import { apiClient } from "./client";
import { paths } from "./paths";
import type { AcademicSession, TenantSessionFees } from "@/lib/types";

export function getActiveSession() {
  return apiClient.get<AcademicSession | null>(paths.sessions.active, { skipAuth: true });
}

export function listSessions() {
  return apiClient.get<AcademicSession[]>(paths.sessions.list);
}

export function createSession(input: { label: string; startDate: string }) {
  return apiClient.post<AcademicSession>(paths.sessions.create, input);
}

export function activateSession(id: string) {
  return apiClient.patch<AcademicSession>(paths.sessions.activate(id));
}

export function closeSession(id: string) {
  return apiClient.patch<AcademicSession>(paths.sessions.close(id));
}

/** finance_director only — always their own tenant, current active session. */
export function getOwnTenantFees() {
  return apiClient.get<TenantSessionFees>(paths.sessions.fees);
}

export function setOwnTenantFees(input: { newStudentFee: number; returningStudentFee: number }) {
  return apiClient.put<TenantSessionFees>(paths.sessions.fees, input);
}

export function lockOwnTenantFees() {
  return apiClient.patch<TenantSessionFees>(paths.sessions.lockFees);
}

/** super_admin only — no GET counterpart exists on the backend, so this is entered blind. */
export function overrideTenantFees(
  sessionId: string,
  tenantId: string,
  input: { newStudentFee: number; returningStudentFee: number }
) {
  return apiClient.put<TenantSessionFees>(paths.sessions.overrideFees(sessionId, tenantId), input);
}
