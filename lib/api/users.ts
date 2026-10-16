import { apiClient } from "./client";
import { paths } from "./paths";
import type { AdminUser, Role } from "@/lib/types";

interface CreatedUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export function listAdminUsers() {
  return apiClient.get<AdminUser[]>(paths.users.admins);
}

export function listMainAdmins() {
  return apiClient.get<AdminUser[]>(paths.users.mainAdmins);
}

export function listFinanceDirectors() {
  return apiClient.get<AdminUser[]>(paths.users.financeDirectors);
}

export function createMainAdmin(input: { fullName: string; email: string }) {
  return apiClient.post<{ user: CreatedUser }>(paths.users.mainAdmins, input);
}

export function createFinanceDirector(input: { fullName: string; email: string; tenantId: string }) {
  return apiClient.post<{ user: CreatedUser }>(paths.users.financeDirectors, input);
}

export function deleteFinanceDirector(id: string) {
  return apiClient.delete<{ message: string }>(paths.users.deleteFinanceDirector(id));
}

export function resetUserPassword(id: string) {
  return apiClient.patch<{ message: string }>(paths.users.resetPassword(id));
}

export function unlockUser(id: string) {
  return apiClient.patch<{ message: string }>(paths.users.unlock(id));
}

export function deactivateUser(id: string) {
  return apiClient.patch<{ message: string }>(paths.users.deactivate(id));
}
