"use client";

import { useMutation } from "@tanstack/react-query";
import * as paymentsApi from "@/lib/api/payments";

export function useManualPayment() {
  return useMutation({ mutationFn: paymentsApi.addManualPayment });
}
