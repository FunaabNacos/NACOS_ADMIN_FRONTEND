"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as tenantsApi from "@/lib/api/tenants";
import type { ListTenantsParams, CreateTenantInput, UpdateTenantInput } from "@/lib/api/tenants";
import { ApiClientError } from "@/lib/api/errors";

export const tenantKeys = {
  all: ["tenants"] as const,
  list: (params: ListTenantsParams) => [...tenantKeys.all, "list", params] as const,
  detail: (id: string) => [...tenantKeys.all, "detail", id] as const,
};

export function useTenants(params: ListTenantsParams) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantsApi.listTenants(params),
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.detail(id ?? ""),
    queryFn: () => tenantsApi.getTenant(id as string),
    enabled: Boolean(id),
  });
}

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => tenantsApi.createTenant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Tenant created.");
    },
    onError,
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantInput) => tenantsApi.updateTenant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Tenant updated.");
    },
    onError,
  });
}

export function useTenantLifecycle(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: tenantKeys.all });

  const freeze = useMutation({
    mutationFn: () => tenantsApi.freezeTenant(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tenant frozen. It can no longer accept payments.");
    },
    onError,
  });
  const unfreeze = useMutation({
    mutationFn: () => tenantsApi.unfreezeTenant(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tenant unfrozen.");
    },
    onError,
  });
  const archive = useMutation({
    mutationFn: () => tenantsApi.archiveTenant(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tenant archived.");
    },
    onError,
  });
  const restore = useMutation({
    mutationFn: () => tenantsApi.restoreTenant(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tenant restored.");
    },
    onError,
  });

  return { freeze, unfreeze, archive, restore };
}

export function useUploadTenantLogo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => tenantsApi.uploadTenantLogo(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Logo updated.");
    },
    onError,
  });
}

export function useUpdateConvenienceFee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { convenienceFeeStudent?: number; convenienceFeeAssociation?: number }) =>
      tenantsApi.updateConvenienceFee(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Convenience fee updated.");
    },
    onError,
  });
}
