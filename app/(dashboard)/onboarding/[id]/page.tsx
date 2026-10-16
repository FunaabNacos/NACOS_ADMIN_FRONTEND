import type { Metadata } from "next";
import { OnboardingDetailClient } from "./onboarding-detail-client";

export const metadata: Metadata = { title: "Onboarding request" };

export default async function OnboardingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OnboardingDetailClient id={id} />;
}
