import type { Metadata } from "next";
import { TenantDetailClient } from "./tenant-detail-client";

export const metadata: Metadata = { title: "Tenant" };

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TenantDetailClient id={id} />;
}
