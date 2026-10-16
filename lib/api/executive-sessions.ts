import { apiClient } from "./client";
import { paths } from "./paths";

export interface PastExecutive {
  _id: string;
  executiveSessionId: string;
  name: string;
  post: string;
  imageUrl: string;
  imagePublicId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveSession {
  _id: string;
  label: string;
  startYear: number;
  endYear: number;
  createdAt: string;
  updatedAt: string;
}

export function listExecutiveSessions() {
  return apiClient.get<ExecutiveSession[]>(paths.executiveSessions.list);
}

export function createExecutiveSession(label: string) {
  return apiClient.post<ExecutiveSession>(paths.executiveSessions.create, { label });
}

export function deleteExecutiveSession(id: string) {
  return apiClient.delete<ExecutiveSession>(paths.executiveSessions.delete(id));
}

export function listPastExecutives(sessionId: string) {
  return apiClient.get<PastExecutive[]>(paths.executiveSessions.pastExecutives(sessionId));
}

export interface CreatePastExecutiveInput {
  name: string;
  post: string;
  displayOrder?: number;
  image: File;
}

export function createPastExecutive(sessionId: string, input: CreatePastExecutiveInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("post", input.post);
  if (input.displayOrder !== undefined) formData.append("displayOrder", String(input.displayOrder));
  formData.append("image", input.image);
  return apiClient.post<PastExecutive>(paths.executiveSessions.pastExecutives(sessionId), formData);
}

export function updatePastExecutive(
  id: string,
  input: Partial<{ name: string; post: string; displayOrder: number }>
) {
  return apiClient.put<PastExecutive>(paths.executiveSessions.updatePastExecutive(id), input);
}

export function uploadPastExecutiveImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient.post<PastExecutive>(paths.executiveSessions.pastExecutiveImage(id), formData);
}

export function deletePastExecutive(id: string) {
  return apiClient.delete<PastExecutive>(paths.executiveSessions.deletePastExecutive(id));
}
