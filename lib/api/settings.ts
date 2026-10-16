import { apiClient } from "./client";
import { paths } from "./paths";
import type { PlatformSettings, PaystackSettingsView } from "@/lib/types";

export function getSettings() {
  return apiClient.get<PlatformSettings>(paths.settings.get);
}

export function setMaintenanceMode(enabled: boolean) {
  return apiClient.patch<PlatformSettings>(paths.settings.maintenance, { enabled });
}

export function getPaystackSettings() {
  return apiClient.get<PaystackSettingsView>(paths.settings.paystackGet);
}

export function updatePaystackSettings(data: {
  secret?: string;
  timeoutMs?: number;
  maxRetries?: number;
  feeTolerancePct?: number;
  feeToleranceFlatKobo?: number;
}) {
  return apiClient.patch<PaystackSettingsView>(paths.settings.paystackUpdate, data);
}

export function deletePaystackSecret() {
  return apiClient.delete<PaystackSettingsView>(paths.settings.paystackDeleteSecret);
}
