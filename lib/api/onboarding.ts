import { apiClient } from "./client";
import { paths } from "./paths";
import type {
  OnboardingRequest,
  OnboardingRequestDetail,
  OnboardingStatus,
  PaginatedOnboardingRequests,
} from "@/lib/types";

export function listOnboarding(status: OnboardingStatus, page = 1, limit = 20) {
  const search = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  return apiClient.get<PaginatedOnboardingRequests>(`${paths.onboarding.list}?${search.toString()}`);
}

// Returns { request, auditTrail, supersedes, supersededBy } — not a flat OnboardingRequest.
// See OnboardingRequestDetail in lib/types.ts.
export function getOnboardingById(id: string) {
  return apiClient.get<OnboardingRequestDetail>(paths.onboarding.byId(id));
}

export function approveOnboarding(id: string) {
  return apiClient.patch<OnboardingRequest>(paths.onboarding.approve(id));
}

export function retryOnboardingApproval(id: string) {
  return apiClient.patch<OnboardingRequest>(paths.onboarding.retry(id));
}

export function rejectOnboarding(id: string, rejectionReason?: string) {
  return apiClient.patch<OnboardingRequest>(paths.onboarding.reject(id), { rejectionReason });
}

// Consumes the setup token from the Finance Director invitation email to
// activate the account and set the initial password.
export function activateFinanceDirector(token: string, newPassword: string) {
  return apiClient.post<{ message: string }>(
    paths.onboarding.activate,
    { token, newPassword },
    { skipAuth: true },
  );
}
