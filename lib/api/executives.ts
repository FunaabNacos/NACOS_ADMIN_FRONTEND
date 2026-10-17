import { apiClient } from "./client";
import { paths } from "./paths";

export type ExecutiveGroup = "LEADERSHIP" | "NRA";

export const EXECUTIVE_POSITIONS: Record<ExecutiveGroup, readonly string[]> = {
  LEADERSHIP: [
    "President",
    "Vice President",
    "General Secretary",
    "Software Director",
    "Assistant General Secretary",
    "Financial Secretary",
    "Treasurer",
    "Public Relations Officer",
    "Welfare Director",
    "Social Director",
    "Sport Director",
  ],
  NRA: ["Speaker", "Deputy Speaker", "Clerk of the House", "Deputy Clerk", "Sergeant at Arms"],
};

export interface ExecutiveContacts {
  whatsapp?: string;
  email?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
}

export interface Executive {
  _id: string;
  group: ExecutiveGroup;
  position: string;
  name: string;
  imageUrl: string;
  imagePublicId: string;
  contacts?: ExecutiveContacts;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listExecutives(group?: ExecutiveGroup) {
  const search = group ? `?group=${group}` : "";
  return apiClient.get<Executive[]>(`${paths.executives.list}${search}`);
}

export interface CreateExecutiveInput {
  group: ExecutiveGroup;
  position: string;
  name: string;
  displayOrder?: number;
  contacts?: ExecutiveContacts;
  image: File;
}

export function createExecutive(input: CreateExecutiveInput) {
  const formData = new FormData();
  formData.append("group", input.group);
  formData.append("position", input.position);
  formData.append("name", input.name);
  if (input.displayOrder !== undefined) formData.append("displayOrder", String(input.displayOrder));
  if (input.contacts) formData.append("contacts", JSON.stringify(input.contacts));
  formData.append("image", input.image);
  return apiClient.post<Executive>(paths.executives.create, formData);
}

export interface UpdateExecutiveInput {
  name?: string;
  position?: string;
  displayOrder?: number;
  isActive?: boolean;
  contacts?: ExecutiveContacts;
}

export function updateExecutive(id: string, input: UpdateExecutiveInput) {
  return apiClient.put<Executive>(paths.executives.update(id), {
    ...input,
    contacts: input.contacts ? JSON.stringify(input.contacts) : undefined,
  });
}

export function uploadExecutiveImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient.post<Executive>(paths.executives.image(id), formData);
}

export function reorderExecutive(id: string, displayOrder: number) {
  return apiClient.patch<Executive>(paths.executives.reorder(id), { displayOrder });
}

export function deleteExecutive(id: string) {
  return apiClient.delete<Executive>(paths.executives.delete(id));
}
