"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as expensesApi from "@/lib/api/expenses";
import type { CreateExpenseInput } from "@/lib/api/expenses";
import { ApiClientError } from "@/lib/api/errors";

function onError(error: unknown) {
  toast.error(error instanceof ApiClientError ? error.message : "Something went wrong.");
}

export function useExpenses(tenantId?: string, includeDeleted?: boolean) {
  return useQuery({
    queryKey: ["expenses", "list", tenantId, includeDeleted],
    queryFn: () => expensesApi.listExpenses(tenantId, includeDeleted),
  });
}

export function useExpenseBreakdown(tenantId?: string) {
  return useQuery({
    queryKey: ["expenses", "breakdown", tenantId],
    queryFn: () => expensesApi.getExpenseBreakdown(tenantId),
  });
}

function invalidateExpenses(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["expenses"] });
  queryClient.invalidateQueries({ queryKey: ["finance"] });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesApi.createExpense(input),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success("Expense recorded.");
    },
    onError,
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId }: { id: string; tenantId?: string }) =>
      expensesApi.deleteExpense(id, tenantId),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success("Expense deleted.");
    },
    onError,
  });
}

export function useRestoreExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId }: { id: string; tenantId?: string }) =>
      expensesApi.restoreExpense(id, tenantId),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success("Expense restored.");
    },
    onError,
  });
}
