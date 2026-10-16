"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SnowflakeIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  UploadIcon,
  Loader2Icon,
} from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import {
  useTenant,
  useUpdateTenant,
  useTenantLifecycle,
  useUploadTenantLogo,
  useUpdateConvenienceFee,
} from "@/hooks/use-tenants";
import { useTenantAnalytics } from "@/hooks/use-analytics";
import { useFinanceSummary, useExpenseBreakdown } from "@/hooks/use-finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentLinkActions } from "@/components/shared/payment-link-actions";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { TenantStatusBadge, TransactionStatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormField } from "@/components/shared/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ApiClientError } from "@/lib/api/errors";

export function TenantDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const tenant = useTenant(id);
  const [confirmAction, setConfirmAction] = React.useState<null | "freeze" | "unfreeze" | "archive" | "restore">(null);
  const lifecycle = useTenantLifecycle(id);

  if (tenant.isLoading) return <LoadingState />;
  if (tenant.isError || !tenant.data) {
    return (
      <ErrorState
        message={tenant.error instanceof ApiClientError ? tenant.error.message : undefined}
        onRetry={() => tenant.refetch()}
      />
    );
  }

  const t = tenant.data;
  const canManageLifecycle = user?.role === "super_admin" || user?.role === "main_admin";
  const canViewFinance = user?.role === "super_admin" || user?.role === "finance_director";

  const actionMap = {
    freeze: lifecycle.freeze,
    unfreeze: lifecycle.unfreeze,
    archive: lifecycle.archive,
    restore: lifecycle.restore,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.name}
        description={`${t.code} · ${t.type === "COLLEGE" ? "College" : "Department"}`}
        actions={
          <div className="flex items-center gap-2">
            <TenantStatusBadge status={t.status} />
            {user?.role === "finance_director" && <PaymentLinkActions tenantCode={t.code} />}
            {canManageLifecycle && t.status === "ACTIVE" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("freeze")}>
                <SnowflakeIcon /> Freeze
              </Button>
            )}
            {canManageLifecycle && t.status === "FROZEN" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("unfreeze")}>
                Unfreeze
              </Button>
            )}
            {canManageLifecycle && t.status !== "ARCHIVED" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("archive")}>
                <ArchiveIcon /> Archive
              </Button>
            )}
            {canManageLifecycle && t.status === "ARCHIVED" && (
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("restore")}>
                <ArchiveRestoreIcon /> Restore
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {canViewFinance && <TabsTrigger value="finance">Finance</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab tenant={t} canEditFee={user?.role === "super_admin"} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab tenantId={t._id} />
        </TabsContent>

        {canViewFinance && (
          <TabsContent value="finance">
            <FinanceTab tenantId={t._id} />
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction === "freeze"
            ? "Freeze this tenant?"
            : confirmAction === "unfreeze"
              ? "Unfreeze this tenant?"
              : confirmAction === "archive"
                ? "Archive this tenant?"
                : "Restore this tenant?"
        }
        description={
          confirmAction === "freeze"
            ? "They'll immediately stop being able to accept payments."
            : confirmAction === "archive"
              ? "This tenant will be hidden from active lists. This can be undone."
              : "This will re-enable normal access for this tenant."
        }
        destructive={confirmAction === "freeze" || confirmAction === "archive"}
        isLoading={confirmAction ? actionMap[confirmAction].isPending : false}
        onConfirm={() => {
          if (!confirmAction) return;
          actionMap[confirmAction].mutate(undefined, { onSuccess: () => setConfirmAction(null) });
        }}
      />
    </div>
  );
}

const editSchema = z.object({
  name: z.string().min(2).max(100),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

function OverviewTab({
  tenant,
  canEditFee,
}: {
  tenant: NonNullable<ReturnType<typeof useTenant>["data"]>;
  canEditFee: boolean;
}) {
  const updateTenant = useUpdateTenant(tenant._id);
  const uploadLogo = useUploadTenantLogo(tenant._id);
  const updateFee = useUpdateConvenienceFee(tenant._id);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: tenant.name,
      bankName: tenant.bankName ?? "",
      accountNumber: tenant.accountNumber ?? "",
      accountName: tenant.accountName ?? "",
    },
  });

  const [studentFee, setStudentFee] = React.useState(String(tenant.convenienceFeeStudent));
  const [associationFee, setAssociationFee] = React.useState(String(tenant.convenienceFeeAssociation));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => updateTenant.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
              <Input id="name" {...form.register("name")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bank name" htmlFor="bankName">
                <Input id="bankName" {...form.register("bankName")} />
              </FormField>
              <FormField label="Account number" htmlFor="accountNumber">
                <Input id="accountNumber" {...form.register("accountNumber")} />
              </FormField>
            </div>
            <FormField label="Account name" htmlFor="accountName">
              <Input id="accountName" {...form.register("accountName")} />
            </FormField>
            <Button type="submit" disabled={updateTenant.isPending}>
              {updateTenant.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Avatar className="size-20 rounded-2xl">
              <AvatarImage src={tenant.logoUrl ?? undefined} />
              <AvatarFallback className="rounded-2xl text-lg">{tenant.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo.mutate(file);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadLogo.isPending}>
              {uploadLogo.isPending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
              {uploadLogo.isPending ? "Uploading…" : "Upload logo"}
            </Button>
          </CardContent>
        </Card>

        {canEditFee && (
          <Card>
            <CardHeader><CardTitle>Convenience fee</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Student-side fee (₦)" htmlFor="studentFee">
                <Input id="studentFee" type="number" min={0} value={studentFee} onChange={(e) => setStudentFee(e.target.value)} />
              </FormField>
              <FormField label="Association-side fee (₦)" htmlFor="associationFee">
                <Input id="associationFee" type="number" min={0} value={associationFee} onChange={(e) => setAssociationFee(e.target.value)} />
              </FormField>
              <Button
                size="sm"
                disabled={updateFee.isPending}
                onClick={() =>
                  updateFee.mutate({
                    convenienceFeeStudent: Number(studentFee),
                    convenienceFeeAssociation: Number(associationFee),
                  })
                }
              >
                {updateFee.isPending ? "Saving…" : "Save fee"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ tenantId }: { tenantId: string }) {
  const analytics = useTenantAnalytics(tenantId);

  if (analytics.isLoading) return <LoadingState />;
  if (analytics.isError || !analytics.data) {
    return (
      <ErrorState
        message={analytics.error instanceof ApiClientError ? analytics.error.message : undefined}
        onRetry={() => analytics.refetch()}
      />
    );
  }

  const d = analytics.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total collected" value={formatCurrency(d.totals.totalCollected)} tone="primary" />
        <StatCard label="Transactions" value={String(d.totals.totalTransactions)} />
        <StatCard label="Online / Manual" value={`${d.totals.onlineTransactions} / ${d.totals.manualTransactions}`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
        <CardContent>
          {d.recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="divide-y divide-border">
              {d.recentPayments.slice(0, 10).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tx.studentName}</p>
                    <p className="text-xs text-muted-foreground">{tx.matricNumber} · {formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="num font-medium">{formatCurrency(tx.amount)}</span>
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceTab({ tenantId }: { tenantId: string }) {
  const summary = useFinanceSummary({ tenantId });
  const breakdown = useExpenseBreakdown({ tenantId });

  if (summary.isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {summary.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Income" value={formatCurrency(summary.data.totalIncome)} tone="primary" />
          <StatCard label="Expenses" value={formatCurrency(summary.data.totalExpenses)} />
          <StatCard label="Net balance" value={formatCurrency(summary.data.netBalance)} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Expense breakdown</CardTitle></CardHeader>
        <CardContent>
          {!breakdown.data || breakdown.data.length === 0 ? (
            <EmptyState title="No expenses recorded" />
          ) : (
            <div className="divide-y divide-border">
              {breakdown.data.map((row) => (
                <div key={row.category} className="flex items-center justify-between py-3 text-sm">
                  <span>{row.category}</span>
                  <span className="num font-medium">{formatCurrency(row.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
