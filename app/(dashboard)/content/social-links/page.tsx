import type { Metadata } from "next";
import { SocialLinksClient } from "./social-links-client";

export const metadata: Metadata = { title: "Social Links" };

export default function SocialLinksPage() {
  return <SocialLinksClient />;
}
