"use client";

import * as React from "react";
import {
  DownloadIcon,
  WalletIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  PencilIcon,
  Loader2Icon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/layout/auth-context";
import { useTenants } from "@/hooks/use-tenants";
import { useSessions } from "@/hooks/use-sessions";
import {
  useFinanceSummary,
  useExpenseBreakdown as useFinanceBreakdown,
  useFinanceTrend,
} from "@/hooks/use-finance";
import { exportFinanceReport, updateOpeningBalance } from "@/lib/api/finance";
import { formatCurrency, formatDate, triggerBlobDownload } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentLinkActions } from "@/components/shared/payment-link-actions";
import { StatCard } from "@/components/shared/stat-card";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/errors";

export function FinanceClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();

  const tenantsQuery = useTenants({ limit: 100, status: "ACTIVE" });
  const sessionsQuery = useSessions();

  const [tenantIdOverride, setTenantId] = React.useState<string | undefined>(
    isSuperAdmin ? undefined : (user?.tenantId ?? undefined),
  );
  const tenantId =
    tenantIdOverride ??
    (isSuperAdmin ? tenantsQuery.data?.tenants[0]?._id : undefined);
  const [sessionIdOverride, setSessionId] = React.useState<string | undefined>(
    undefined,
  );
  const sessionId =
    sessionIdOverride ?? sessionsQuery.data?.find((s) => s.isActive)?._id;
  const [exporting, setExporting] = React.useState<"pdf" | "csv" | null>(null);

  const [isOpeningBalanceDialogOpen, setIsOpeningBalanceDialogOpen] =
    React.useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = React.useState("");

  const enabled = Boolean(tenantId);
  const financeDirectorTenant = !isSuperAdmin
    ? tenantsQuery.data?.tenants.find((t) => t._id === tenantId)
    : undefined;

  const summary = useFinanceSummary({ tenantId, sessionId, enabled });
  const breakdown = useFinanceBreakdown({ tenantId, sessionId, enabled });
  const trend = useFinanceTrend({ tenantId, sessionId, enabled });

  const updateBalanceMutation = useMutation({
    mutationFn: (newBalance: number) =>
      updateOpeningBalance({
        tenantId,
        sessionId,
        openingBalance: newBalance,
        isSuperAdmin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Opening balance updated successfully.");
      setIsOpeningBalanceDialogOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Failed to update opening balance.",
      );
    },
  });

  function handleOpenBalanceDialog() {
    setOpeningBalanceInput(String(summary.data?.openingBalance ?? 0));
    setIsOpeningBalanceDialogOpen(true);
  }

  function handleSaveOpeningBalance(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(openingBalanceInput.trim());
    if (isNaN(parsed)) {
      toast.error("Please enter a valid numeric amount.");
      return;
    }
    updateBalanceMutation.mutate(parsed);
  }

  async function handleExport(format: "pdf" | "csv") {
    if (!tenantId || !sessionId) return;
    setExporting(format);
    try {
      const blob = await exportFinanceReport({ tenantId, sessionId }, format);
      triggerBlobDownload(blob, `finance-report.${format}`);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Export failed.",
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Income, expenses, and net balance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {financeDirectorTenant && (
              <PaymentLinkActions tenantCode={financeDirectorTenant.code} />
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!enabled || exporting !== null}
              onClick={() => handleExport("csv")}
            >
              <DownloadIcon className="mr-1.5 h-4 w-4" />{" "}
              {exporting === "csv" ? "Exporting…" : "CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!enabled || exporting !== null}
              onClick={() => handleExport("pdf")}
            >
              <DownloadIcon className="mr-1.5 h-4 w-4" />{" "}
              {exporting === "pdf" ? "Exporting…" : "PDF"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {isSuperAdmin && (
          <Select value={tenantId ?? ""} onValueChange={setTenantId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenantsQuery.data?.tenants.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sessionId ?? ""} onValueChange={setSessionId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a session" />
          </SelectTrigger>
          <SelectContent>
            {sessionsQuery.data?.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.label}
                {s.isActive ? " (active)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!enabled && (
        <EmptyState
          title="Select a tenant and session"
          message="Choose above to view finance data."
        />
      )}

      {enabled && summary.isLoading && <LoadingState />}
      {enabled && summary.isError && (
        <ErrorState
          message={
            summary.error instanceof ApiClientError
              ? summary.error.message
              : undefined
          }
          onRetry={() => summary.refetch()}
        />
      )}

      {enabled && summary.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative group">
              <StatCard
                label="Opening balance"
                value={formatCurrency(summary.data.openingBalance)}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3 h-7 w-7 opacity-75 hover:opacity-100 transition-opacity"
                onClick={handleOpenBalanceDialog}
                title="Adjust opening balance"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Edit opening balance</span>
              </Button>
            </div>

            <StatCard
              label="Income"
              value={formatCurrency(summary.data.totalIncome)}
              icon={WalletIcon}
              tone="primary"
              hint={`${summary.data.incomeCount} payments`}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(summary.data.totalExpenses)}
              icon={TrendingDownIcon}
              hint={`${summary.data.expenseCount} entries`}
            />
            <StatCard
              label="Net balance"
              value={formatCurrency(summary.data.netBalance)}
              icon={PiggyBankIcon}
              hint={
                summary.data.isClosed
                  ? `Closed ${formatDate(summary.data.closedAt)}`
                  : "Open"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income vs. expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {!trend.data || trend.data.length === 0 ? (
                <EmptyState title="No trend data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend.data}>
                    <defs>
                      <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-warning)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-warning)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(v) => formatDate(v)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={40}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      labelFormatter={(v) => formatDate(v as string)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="var(--color-primary)"
                      fill="url(#income)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="var(--color-warning)"
                      fill="url(#expenses)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {!breakdown.data || breakdown.data.length === 0 ? (
                <EmptyState title="No expenses recorded" />
              ) : (
                <div className="divide-y divide-border">
                  {breakdown.data.map((row) => (
                    <div
                      key={row.category}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span>{row.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {row.count} entries
                        </span>
                        <span className="num font-medium">
                          {formatCurrency(row.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog for setting / overriding opening balance */}
      <Dialog
        open={isOpeningBalanceDialogOpen}
        onOpenChange={setIsOpeningBalanceDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveOpeningBalance}>
            <DialogHeader>
              <DialogTitle>Set opening balance</DialogTitle>
              <DialogDescription>
                Set or adjust the starting balance for this session (e.g.
                onboarded cash on hand or deficit). Negative values are allowed.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <Label htmlFor="openingBalance">Opening Balance (NGN)</Label>
              <Input
                id="openingBalance"
                type="number"
                step="any"
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(e.target.value)}
                placeholder="e.g. 50000 or -15000"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Current preview:{" "}
                <span className="font-semibold text-foreground">
                  {isNaN(Number(openingBalanceInput))
                    ? "—"
                    : formatCurrency(Number(openingBalanceInput))}
                </span>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpeningBalanceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateBalanceMutation.isPending}>
                {updateBalanceMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save balance"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
