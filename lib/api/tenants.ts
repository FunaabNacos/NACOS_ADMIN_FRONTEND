import { apiClient } from "./client";
import { paths } from "./paths";
import type {
  PaginatedTenants,
  PublicTenant,
  PublicTenantSummary,
  Tenant,
  TenantStatus,
  TenantType,
} from "@/lib/types";

export interface ListTenantsParams {
  type?: TenantType;
  status?: TenantStatus;
  page?: number;
  limit?: number;
}

export function listTenants(params: ListTenantsParams = {}) {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  return apiClient.get<PaginatedTenants>(`${paths.tenants.list}?${search.toString()}`);
}

export function getTenant(id: string) {
  return apiClient.get<Tenant>(paths.tenants.byId(id));
}

export interface CreateTenantInput {
  name: string;
  type: TenantType;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  paystackSubaccountCode?: string;
}

export function createTenant(input: CreateTenantInput) {
  return apiClient.post<Tenant>(paths.tenants.create, input);
}

export interface UpdateTenantInput {
  name?: string;
  code?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paystackSubaccountCode?: string;
}

export function updateTenant(id: string, input: UpdateTenantInput) {
  return apiClient.put<Tenant>(paths.tenants.update(id), input);
}

export function freezeTenant(id: string) {
  return apiClient.patch<Tenant>(paths.tenants.freeze(id));
}

export function unfreezeTenant(id: string) {
  return apiClient.patch<Tenant>(paths.tenants.unfreeze(id));
}

export function archiveTenant(id: string) {
  return apiClient.patch<Tenant>(paths.tenants.archive(id));
}

export function restoreTenant(id: string) {
  return apiClient.patch<Tenant>(paths.tenants.restore(id));
}

export function uploadTenantLogo(id: string, file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  return apiClient.post<{ logoUrl: string; tenant: Tenant }>(paths.tenants.logo(id), formData);
}

export function updateConvenienceFee(
  id: string,
  input: { convenienceFeeStudent?: number; convenienceFeeAssociation?: number }
) {
  return apiClient.patch<Tenant>(paths.tenants.convenienceFee(id), input);
}

export function getPublicTenants(type?: TenantType) {
  const search = type ? `?type=${type}` : "";
  return apiClient.get<PublicTenantSummary[]>(`${paths.tenants.public}${search}`, {
    skipAuth: true,
  });
}

export function getTenantByCode(code: string) {
  return apiClient.get<PublicTenant>(paths.tenants.publicByCode(code), { skipAuth: true });
}
