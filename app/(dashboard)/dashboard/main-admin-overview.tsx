"use client";

import Link from "next/link";
import { Building2Icon, ArrowRightIcon } from "lucide-react";
import { useTenants } from "@/hooks/use-tenants";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { Card, CardContent } from "@/components/ui/card";
import { TenantStatusBadge } from "@/components/shared/status-badge";
import { ApiClientError } from "@/lib/api/errors";

export function MainAdminOverview({ fullName }: { fullName: string }) {
  const tenants = useTenants({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${fullName.split(" ")[0]}`}
        description="Your associations at a glance."
      />

      {tenants.isLoading && <LoadingState />}
      {tenants.isError && (
        <ErrorState
          message={tenants.error instanceof ApiClientError ? tenants.error.message : undefined}
          onRetry={() => tenants.refetch()}
        />
      )}
      {tenants.data && tenants.data.tenants.length === 0 && (
        <EmptyState
          icon={Building2Icon}
          title="No associations yet"
          message="Tenants you manage will show up here once onboarded."
        />
      )}

      {tenants.data && tenants.data.tenants.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tenants.data.tenants.map((tenant) => (
            <Link key={tenant._id} href={`/tenants/${tenant._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.code} · {tenant.type === "COLLEGE" ? "College" : "Department"}</p>
                    <div className="mt-2"><TenantStatusBadge status={tenant.status} /></div>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
