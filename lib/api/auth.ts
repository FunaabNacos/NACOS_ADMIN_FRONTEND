import { apiClient } from "./client";
import { paths } from "./paths";

export function requestPasswordReset(email: string) {
  return apiClient.post<{ message: string }>(paths.auth.requestPasswordReset, { email }, {
    skipAuth: true,
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiClient.post<{ message: string }>(
    paths.auth.resetPassword,
    { token, newPassword },
    { skipAuth: true }
  );
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient.put<{ message: string }>(paths.auth.changePassword, {
    currentPassword,
    newPassword,
  });
}