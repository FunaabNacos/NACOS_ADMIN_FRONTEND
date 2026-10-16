import { apiClient } from "./client";
import { paths } from "./paths";
import { API_URL } from "./config";
import { getAccessToken } from "./client";
import type { ReceiptTemplate } from "@/lib/types";

export function listTemplates() {
  return apiClient.get<ReceiptTemplate[]>(paths.templates.list);
}

export interface TemplatePreviewOverrides {
  studentName?: string;
  matricNumber?: string;
  amount?: number;
  reference?: string;
  tenantName?: string;
  tenantLogo?: string;
  session?: string;
  paymentDate?: string;
  paymentType?: "online" | "manual";
  level?: string;
  studentStatus?: "new" | "returning";
  gender?: string;
  roomNumber?: string;
  email?: string;
  phone?: string;
}

/** Returns raw HTML (not the usual JSON envelope) — fetched directly rather than via apiClient. */
export async function previewTemplate(
  templateId: string,
  overrides: TemplatePreviewOverrides
): Promise<string> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${paths.templates.preview(templateId)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);
  return res.text();
}
