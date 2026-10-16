import { apiClient } from "./client";
import { paths } from "./paths";
import type { PendingReceiptTransaction } from "@/lib/types";

export function listPendingReceipts() {
  return apiClient.get<PendingReceiptTransaction[]>(paths.recovery.pendingReceipts);
}

export function resyncTransaction(paystackReference: string) {
  return apiClient.post<{ message: string }>(paths.recovery.resync, { paystackReference });
}
