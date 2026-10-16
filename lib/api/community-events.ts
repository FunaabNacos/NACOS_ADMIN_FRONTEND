import { apiClient } from "./client";
import { paths } from "./paths";

export interface CommunityEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  category: string;
  imageUrl?: string;
  imagePublicId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listEvents() {
  return apiClient.get<CommunityEvent[]>(paths.communityEvents.list);
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  location: string;
  category: string;
  image?: File;
}

export function createEvent(input: CreateEventInput) {
  const formData = new FormData();
  formData.append("title", input.title);
  if (input.description) formData.append("description", input.description);
  formData.append("date", input.date);
  formData.append("location", input.location);
  formData.append("category", input.category);
  if (input.image) formData.append("image", input.image);
  return apiClient.post<CommunityEvent>(paths.communityEvents.create, formData);
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  category?: string;
  isActive?: boolean;
}

export function updateEvent(id: string, input: UpdateEventInput) {
  return apiClient.put<CommunityEvent>(paths.communityEvents.update(id), input);
}

export function uploadEventImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient.post<CommunityEvent>(paths.communityEvents.image(id), formData);
}

export function deleteEvent(id: string) {
  return apiClient.delete<CommunityEvent>(paths.communityEvents.delete(id));
}
