import { apiClient } from "./client";
import { paths } from "./paths";
import type { StudentLevel, StudentStatus, Transaction } from "@/lib/types";

export interface ManualPaymentInput {
  studentName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: StudentLevel;
  studentStatus: StudentStatus;
  amount: number;
  gender?: string;
  roomNumber?: string;
  department?: string;
  reasonForAmountDeviation?: string;
}

export function addManualPayment(input: ManualPaymentInput) {
  return apiClient.post<Transaction>(paths.payments.manual, input);
}
