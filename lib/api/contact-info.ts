import { apiClient } from "./client";
import { paths } from "./paths";

export interface RawContactInfo {
  _id: string;
  financialDirectorExecutiveId: string | null;
  softwareDirectorExecutiveId: string | null;
}

export function getContactInfo() {
  return apiClient.get<RawContactInfo>(paths.contactInfo.get);
}

export function updateContactInfo(input: {
  financialDirectorExecutiveId?: string | null;
  softwareDirectorExecutiveId?: string | null;
}) {
  return apiClient.put<RawContactInfo>(paths.contactInfo.update, input);
}
