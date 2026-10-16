"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as onboardingApi from "@/lib/api/onboarding";
import type { OnboardingStatus } from "@/lib/types";
import { ApiClientError } from "@/lib/api/errors";

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useOnboardingList(status: OnboardingStatus, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["onboarding", "list", status, page, limit],
    queryFn: () => onboardingApi.listOnboarding(status, page, limit),
  });
}

export function useOnboardingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["onboarding", "detail", id],
    queryFn: () => onboardingApi.getOnboardingById(id as string),
    enabled: Boolean(id),
  });
}

function invalidateOnboarding(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["onboarding"] });
  queryClient.invalidateQueries({ queryKey: ["tenants"] });
}

export function useApproveOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => onboardingApi.approveOnboarding(id),
    onSuccess: () => {
      invalidateOnboarding(queryClient);
      toast.success("Association approved — tenant and finance director account created.");
    },
    onError,
  });
}

export function useRetryOnboardingApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => onboardingApi.retryOnboardingApproval(id),
    onSuccess: () => {
      invalidateOnboarding(queryClient);
      toast.success("Approval retried.");
    },
    onError,
  });
}

export function useRejectOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      onboardingApi.rejectOnboarding(id, rejectionReason),
    onSuccess: () => {
      invalidateOnboarding(queryClient);
      toast.success("Request rejected.");
    },
    onError,
  });
}
