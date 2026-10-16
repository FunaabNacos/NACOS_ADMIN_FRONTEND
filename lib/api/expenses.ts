import { apiClient } from "./client";
import { paths } from "./paths";
import type { Expense, ExpenseBreakdownEntry, ExpenseCategory } from "@/lib/types";

function tenantQuery(tenantId?: string, includeDeleted?: boolean) {
  const search = new URLSearchParams();
  if (tenantId) search.set("tenantId", tenantId);
  if (includeDeleted) search.set("includeDeleted", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listExpenses(tenantId?: string, includeDeleted?: boolean) {
  return apiClient.get<Expense[]>(`${paths.expenses.list}${tenantQuery(tenantId, includeDeleted)}`);
}

export function getExpenseSummary(tenantId?: string) {
  return apiClient.get<{ total: number; count: number }>(
    `${paths.expenses.summary}${tenantQuery(tenantId)}`
  );
}

export function getExpenseBreakdown(tenantId?: string) {
  return apiClient.get<ExpenseBreakdownEntry[]>(`${paths.expenses.breakdown}${tenantQuery(tenantId)}`);
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  date: string;
  category?: ExpenseCategory;
  note?: string;
  tenantId?: string;
}

export function createExpense(input: CreateExpenseInput) {
  const { tenantId, ...body } = input;
  return apiClient.post<Expense>(`${paths.expenses.create}${tenantQuery(tenantId)}`, body);
}

export function deleteExpense(id: string, tenantId?: string) {
  return apiClient.delete<Expense>(`${paths.expenses.delete(id)}${tenantQuery(tenantId)}`);
}

export function restoreExpense(id: string, tenantId?: string) {
  return apiClient.patch<Expense>(`${paths.expenses.restore(id)}${tenantQuery(tenantId)}`);
}
