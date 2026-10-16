"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as contactInfoApi from "@/lib/api/contact-info";
import { ApiClientError } from "@/lib/api/errors";

export const contactInfoKeys = {
  all: ["contact-info"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useContactInfo() {
  return useQuery({
    queryKey: contactInfoKeys.all,
    queryFn: () => contactInfoApi.getContactInfo(),
  });
}

export function useUpdateContactInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      financialDirectorExecutiveId?: string | null;
      softwareDirectorExecutiveId?: string | null;
    }) => contactInfoApi.updateContactInfo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactInfoKeys.all });
      toast.success("Contact info updated.");
    },
    onError,
  });
}
