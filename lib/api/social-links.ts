import { apiClient } from "./client";
import { paths } from "./paths";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "whatsapp",
  "youtube",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialPlatformLink {
  url: string;
  isVisible: boolean;
}

export interface AllSocialLinks {
  _id: string;
  platforms: Record<SocialPlatform, SocialPlatformLink>;
}

export function getSocialLinks() {
  return apiClient.get<AllSocialLinks>(paths.socialLinks.get);
}

export function updateSocialLinks(
  input: Partial<Record<SocialPlatform, { url?: string; isVisible?: boolean }>>
) {
  return apiClient.put<AllSocialLinks>(paths.socialLinks.update, input);
}
