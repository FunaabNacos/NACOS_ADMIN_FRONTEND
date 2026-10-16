"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as socialLinksApi from "@/lib/api/social-links";
import type { SocialPlatform } from "@/lib/api/social-links";
import { ApiClientError } from "@/lib/api/errors";

export const socialLinksKeys = {
  all: ["social-links"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useSocialLinks() {
  return useQuery({
    queryKey: socialLinksKeys.all,
    queryFn: () => socialLinksApi.getSocialLinks(),
  });
}

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Record<SocialPlatform, { url?: string; isVisible?: boolean }>>) =>
      socialLinksApi.updateSocialLinks(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialLinksKeys.all });
      toast.success("Social links updated.");
    },
    onError,
  });
}
