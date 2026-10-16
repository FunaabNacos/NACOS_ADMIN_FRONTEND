import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

import { MainAdminOverview } from "./main-admin-overview";
import { FinanceDirectorOverview } from "./finance-director-overview";
import { SuperAdminOverview } from "./super-admin-overview";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "super_admin")
    return <SuperAdminOverview fullName={user.fullName} />;
  if (user.role === "main_admin")
    return <MainAdminOverview fullName={user.fullName} />;
  return (
    <FinanceDirectorOverview
      fullName={user.fullName}
      tenantId={user.tenantId ?? undefined}
    />
  );
}
