"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as communityEventsApi from "@/lib/api/community-events";
import type { CreateEventInput, UpdateEventInput } from "@/lib/api/community-events";
import { ApiClientError } from "@/lib/api/errors";

export const communityEventKeys = {
  all: ["community-events"] as const,
};

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useCommunityEvents() {
  return useQuery({
    queryKey: communityEventKeys.all,
    queryFn: () => communityEventsApi.listEvents(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => communityEventsApi.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityEventKeys.all });
      toast.success("Event created.");
    },
    onError,
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      communityEventsApi.updateEvent(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityEventKeys.all });
      toast.success("Event updated.");
    },
    onError,
  });
}

export function useUploadEventImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      communityEventsApi.uploadEventImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityEventKeys.all });
      toast.success("Photo updated.");
    },
    onError,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communityEventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityEventKeys.all });
      toast.success("Event removed.");
    },
    onError,
  });
}
