import { apiClient } from "./client";
import { paths } from "./paths";

export interface HallOfFameEntry {
  _id: string;
  name: string;
  post?: string;
  contribution: string;
  imageUrl: string;
  imagePublicId: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listHallOfFame() {
  return apiClient.get<HallOfFameEntry[]>(paths.hallOfFame.list);
}

export interface CreateHallOfFameInput {
  name: string;
  post?: string;
  contribution: string;
  displayOrder?: number;
  image: File;
}

export function createHallOfFameEntry(input: CreateHallOfFameInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  if (input.post) formData.append("post", input.post);
  formData.append("contribution", input.contribution);
  if (input.displayOrder !== undefined) formData.append("displayOrder", String(input.displayOrder));
  formData.append("image", input.image);
  return apiClient.post<HallOfFameEntry>(paths.hallOfFame.create, formData);
}

export interface UpdateHallOfFameInput {
  name?: string;
  post?: string;
  contribution?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export function updateHallOfFameEntry(id: string, input: UpdateHallOfFameInput) {
  return apiClient.put<HallOfFameEntry>(paths.hallOfFame.update(id), input);
}

export function uploadHallOfFameImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient.post<HallOfFameEntry>(paths.hallOfFame.image(id), formData);
}

export function deleteHallOfFameEntry(id: string) {
  return apiClient.delete<HallOfFameEntry>(paths.hallOfFame.delete(id));
}
