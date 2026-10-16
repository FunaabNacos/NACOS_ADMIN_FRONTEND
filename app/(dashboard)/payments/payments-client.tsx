"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useTenantAnalytics, useTransactions } from "@/hooks/use-analytics";
import { useSessions } from "@/hooks/use-sessions";
import { useTenants, useTenant } from "@/hooks/use-tenants";
import { listTransactions } from "@/lib/api/analytics";
import { formatCurrency, formatDate, triggerBlobDownload } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataPagination } from "@/components/shared/data-pagination";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { STUDENT_LEVELS } from "@/lib/types";
import { ApiClientError } from "@/lib/api/errors";

const LIMIT = 20;

export function PaymentsClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isFinanceDirector = user?.role === "finance_director";

  const tenantsQuery = useTenants({ limit: 100, status: "ACTIVE" });
  const sessionsQuery = useSessions();

  const [tenantIdOverride, setTenantId] = React.useState<string | undefined>(undefined);
  const tenantId =
    isFinanceDirector
      ? (user?.tenantId ?? undefined)
      : tenantIdOverride ?? (isSuperAdmin ? tenantsQuery.data?.tenants[0]?._id : undefined);

  const [sessionId, setSessionId] = React.useState<string | undefined>(undefined);
  const [level, setLevel] = React.useState<string>("");
  const [paymentType, setPaymentType] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [exporting, setExporting] = React.useState(false);

  const tenant = useTenant(tenantId);
  const isCollege = tenant.data?.type === "COLLEGE";

  const analytics = useTenantAnalytics(
    isFinanceDirector ? undefined : tenantId,
    sessionId,
  );

  const txParams = {
    tenantId: isFinanceDirector ? undefined : tenantId,
    sessionId,
    level: level || undefined,
    paymentType: paymentType || undefined,
    page,
    limit: LIMIT,
  };

  const txQuery = useTransactions(
    (tenantId || isFinanceDirector) ? txParams : { page: 1, limit: LIMIT },
  );

  const enabled = Boolean(tenantId) || isFinanceDirector;

  React.useEffect(() => { setPage(1); }, [sessionId, level, paymentType, tenantId]);

  async function handleExport() {
    setExporting(true);
    try {
      const all = await listTransactions({
        tenantId: isFinanceDirector ? undefined : tenantId,
        sessionId,
        level: level || undefined,
        paymentType: paymentType || undefined,
        page: 1,
        limit: 10000,
      });

      const cols = [
        "Student Name", "Matric Number", "Level",
        ...(isCollege ? ["Department"] : []),
        "Student Status", "Payment Type", "Amount (NGN)", "Date Paid",
      ];

      const rows = all.transactions.map((tx) => [
        tx.studentName,
        tx.matricNumber,
        tx.level,
        ...(isCollege ? [tx.department ?? ""] : []),
        tx.studentStatus,
        tx.paymentType,
        String(tx.baseAmount ?? tx.amount ?? 0),
        formatDate(tx.createdAt),
      ]);

      const csv = [cols, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const assocName = (tenant.data?.name ?? "payments").replace(/\s+/g, "_");
      const levelTag = level ? `_${level.replace(/[()]/g, "")}` : "";
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
      triggerBlobDownload(blob, `${assocName}${levelTag}_${ts}.csv`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Payments by level and full transaction list." />

      <div className="flex flex-wrap gap-2">
        {isSuperAdmin && (
          <Select value={tenantId ?? ""} onValueChange={setTenantId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenantsQuery.data?.tenants.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sessionId ?? ""} onValueChange={(v) => setSessionId(v || undefined)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sessions</SelectItem>
            {sessionsQuery.data?.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.label}{s.isActive ? " (active)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!enabled && (
        <EmptyState title="Select a tenant" message="Choose above to view payment data." />
      )}

      {enabled && analytics.isLoading && <LoadingState />}
      {enabled && analytics.isError && (
        <ErrorState
          message={analytics.error instanceof ApiClientError ? analytics.error.message : undefined}
          onRetry={() => analytics.refetch()}
        />
      )}

      {enabled && analytics.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.data.byLevel.map((row) => (
              <StatCard
                key={row._id}
                label={row._id}
                value={formatCurrency(row.totalCollected)}
                hint={`${row.count} payment${row.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold">Transactions</CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    {STUDENT_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={exporting || !txQuery.data?.transactions.length}
                  onClick={handleExport}
                >
                  <DownloadIcon className="mr-1.5 size-4" />
                  {exporting ? "Exporting…" : "Export CSV"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              {txQuery.isLoading && <LoadingState />}
              {txQuery.isError && (
                <ErrorState
                  message={txQuery.error instanceof ApiClientError ? txQuery.error.message : undefined}
                  onRetry={() => txQuery.refetch()}
                />
              )}

              {txQuery.data && txQuery.data.transactions.length === 0 && (
                <EmptyState title="No transactions found" />
              )}

              {txQuery.data && txQuery.data.transactions.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Matric No.</TableHead>
                          <TableHead>Level</TableHead>
                          {isCollege && <TableHead>Department</TableHead>}
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txQuery.data.transactions.map((tx) => (
                          <TableRow key={tx._id}>
                            <TableCell className="font-medium">{tx.studentName}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.matricNumber}</TableCell>
                            <TableCell>{tx.level}</TableCell>
                            {isCollege && (
                              <TableCell className="text-muted-foreground text-sm">
                                {tx.department ?? "—"}
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {tx.studentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize text-xs">
                                {tx.paymentType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right num font-semibold">
                              {formatCurrency(tx.baseAmount ?? tx.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <DataPagination
                    page={page}
                    limit={LIMIT}
                    total={txQuery.data.total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
