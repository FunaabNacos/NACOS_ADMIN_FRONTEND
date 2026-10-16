"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheckIcon, EyeIcon, ChevronRightIcon } from "lucide-react";
import { useOnboardingList } from "@/hooks/use-onboarding";
import type { OnboardingStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { DataPagination } from "@/components/shared/data-pagination";
import { OnboardingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiClientError } from "@/lib/api/errors";

const STATUS_TABS: OnboardingStatus[] = ["PENDING", "APPROVED", "REJECTED", "APPROVAL_FAILED"];

export function OnboardingClient() {
  const router = useRouter();
  const [status, setStatus] = React.useState<OnboardingStatus>("PENDING");
  const [page, setPage] = React.useState(1);
  const list = useOnboardingList(status, page, 20);

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" description="Review association registration requests." />

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as OnboardingStatus);
          setPage(1);
        }}
      >
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === "APPROVAL_FAILED" ? "Approval failed" : s.charAt(0) + s.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.isLoading && <LoadingState />}
      {list.isError && (
        <ErrorState
          message={list.error instanceof ApiClientError ? list.error.message : undefined}
          onRetry={() => list.refetch()}
        />
      )}
      {list.data && list.data.requests.length === 0 && (
        <EmptyState icon={ClipboardCheckIcon} title="Nothing here" message="No requests with this status." />
      )}

      {list.data && list.data.requests.length > 0 && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Association</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.requests.map((r) => (
                <TableRow
                  key={r._id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/onboarding/${r._id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {r.associationName}
                    </span>
                  </TableCell>
                  <TableCell>{r.associationType === "COLLEGE" ? "College" : "Department"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.submittedAt)}</TableCell>
                  <TableCell>
                    <OnboardingStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1 text-muted-foreground group-hover:text-foreground"
                    >
                      <Link href={`/onboarding/${r._id}`} onClick={(e) => e.stopPropagation()}>
                        <EyeIcon className="h-4 w-4" />
                        <span>{r.status === "PENDING" ? "Review" : "View"}</span>
                        <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {list.data && (
        <DataPagination
          page={list.data.page}
          limit={list.data.limit}
          total={list.data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}