"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { ReceiptTextIcon, UsersIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { addManualPayment } from "@/lib/api/payments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@/components/ui/select";
import { STUDENT_LEVELS } from "@/lib/types";
import { useTenantAnalytics } from "@/hooks/use-analytics";
import { useFinanceSummary, useExpenseBreakdown } from "@/hooks/use-finance";
import { useTenant } from "@/hooks/use-tenants";
import { useActiveSession } from "@/hooks/use-sessions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentLinkActions } from "@/components/shared/payment-link-actions";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/errors";
import type { ExpenseCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Events: "var(--chart-1, #6366f1)",
  Welfare: "var(--chart-2, #f59e0b)",
  Logistics: "var(--chart-3, #10b981)",
  Administration: "var(--chart-4, #ef4444)",
  Miscellaneous: "var(--chart-5, #94a3b8)",
};

function BalanceStatisticsCard({ totalIncome }: { totalIncome: number }) {
  return (
    <Card className="rounded-3xl border-none shadow-sm bg-card flex flex-col justify-between overflow-hidden h-full">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Balance
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div>
          <span className="num text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground truncate block">
            {formatCurrency(totalIncome)}
          </span>
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
            Total accumulated earnings
          </p>
        </div>

        <div className="hidden sm:flex pt-2 border-t border-border/40 items-center justify-between text-[11px] text-muted-foreground">
          <span>Real-time aggregation</span>
          <span className="font-medium text-foreground">Active Ledger</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentsCountCard({ totalCount }: { totalCount: number | undefined }) {
  return (
    <Card className="rounded-3xl border-none shadow-sm bg-card flex flex-col justify-between overflow-hidden h-full">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Inflows
          </p>
          <div className="size-6 sm:size-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UsersIcon className="size-3.5" />
          </div>
        </div>

        <div>
          <span className="num text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground truncate block">
            {totalCount ?? 0}
          </span>
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
            Verified payment transactions
          </p>
        </div>

        <div className="hidden sm:flex pt-2 border-t border-border/40 items-center justify-between text-[11px] text-muted-foreground">
          <span>Transaction volume</span>
          <span className="font-medium text-foreground">Cleared records</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BankAccountCard({
  bankName,
  accountNumber,
  accountName,
}: {
  bankName: string | null | undefined;
  accountNumber: string | null | undefined;
  accountName: string | null | undefined;
}) {
  const formattedNumber = accountNumber
    ? accountNumber.replace(/(.{4})/g, "$1 ").trim()
    : "•••• •••• •••• ••••";

  return (
    <Card className="rounded-2xl overflow-hidden border-none bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-950 text-white shadow-md relative min-h-[140px] sm:min-h-[155px] max-h-[175px] flex flex-col justify-between h-full">
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/15 pointer-events-none" />

      <CardContent className="relative flex h-full flex-col justify-between p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-90 truncate max-w-[70%]">
            {bankName ?? "COMMERCIAL BANK"}
          </p>
          <svg
            className="size-3.5 sm:size-4 opacity-80 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0"
            />
          </svg>
        </div>

        <div className="flex items-center gap-3 my-auto py-1">
          <div className="w-8 h-5 sm:w-9 sm:h-6 rounded bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 shadow-sm border border-amber-400/40 relative overflow-hidden flex items-center justify-center shrink-0">
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-600/40" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-600/40" />
          </div>
          <p className="font-mono text-xs sm:text-sm tracking-[0.15em] font-medium drop-shadow-sm truncate">
            {formattedNumber}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-white/15">
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-75 font-medium">
              Cardholder
            </p>
            <p className="truncate text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
              {accountName ?? "AUTHORIZED USER"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseBreakdownDonut({
  breakdown,
}: {
  breakdown:
    | { category: ExpenseCategory; total: number; count: number }[]
    | undefined;
}) {
  const sorted = [...(breakdown ?? [])].sort((a, b) => b.total - a.total);
  const total = sorted.reduce((sum, entry) => sum + entry.total, 0);

  const chartData = sorted.map((entry) => ({
    name: entry.category,
    value: entry.total,
    fill: CATEGORY_COLORS[entry.category] || "var(--chart-5, #94a3b8)",
  }));

  const top = sorted[0];
  const topPercent =
    top && total > 0 ? Math.round((top.total / total) * 100) : 0;

  return (
    <Card className="rounded-3xl border-none shadow-sm flex flex-col justify-between h-full">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-base font-semibold">
          Expense Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        {sorted.length === 0 ? (
          <div className="py-2">
            <EmptyState icon={ReceiptTextIcon} title="No analytics" />
          </div>
        ) : (
          /* Changed permanently to flex-row so chart and list stay side-by-side */
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Chart Container */}
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, total]}
                    tick={false}
                  />
                  <RadialBar dataKey="value" cornerRadius={4} background />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {topPercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-medium truncate max-w-[80px]">
                  {top?.category ?? "Top Share"}
                </span>
              </div>
            </div>

            {/* Legend Container - Always on the side with a border separator */}
            <div className="w-full flex-1 grid grid-cols-1 gap-y-1.5 border-l border-border/40 pl-3 sm:pl-4 min-w-0">
              {sorted.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-2 text-[11px] truncate"
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: CATEGORY_COLORS[item.category],
                      }}
                    />
                    <span className="text-muted-foreground truncate">
                      {item.category}
                    </span>
                  </div>
                  <span className="font-semibold shrink-0 ml-1">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function ExpenseIncomeSplit({
  totalIncome,
  totalExpenses,
}: {
  totalIncome: number;
  totalExpenses: number;
}) {
  const combined = totalIncome + totalExpenses;
  const expensePercent =
    combined > 0 ? Math.round((totalExpenses / combined) * 100) : 0;
  const incomePercent = combined > 0 ? 100 - expensePercent : 0;

  return (
    <Card className="rounded-3xl border-none shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="p-5 pb-1">
        <CardTitle className="text-base font-semibold">
          Expenses &amp; Income Ratio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {expensePercent}%
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Expenses
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">
              {incomePercent}%
            </p>
            <p className="text-xs text-muted-foreground font-medium">Income</p>
          </div>
        </div>
        <div className="flex gap-1.5 h-3 w-full rounded-full bg-muted/60 p-0.5">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.max(expensePercent, 4)}%` }}
          />
          <div
            className="h-full flex-1 rounded-full bg-amber-300 transition-all"
            style={{ width: `${Math.max(incomePercent, 4)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceDirectorOverview({
  fullName,
  tenantId,
}: {
  fullName: string;
  tenantId: string | undefined;
}) {
  const activeSession = useActiveSession();
  const sessionId = activeSession.data?._id;

  const analytics = useTenantAnalytics(undefined);
  const finance = useFinanceSummary({ tenantId });
  const breakdown = useExpenseBreakdown({
    tenantId,
    sessionId,
    enabled: Boolean(sessionId),
  });
  const tenant = useTenant(tenantId);

  const isLoading =
    analytics.isLoading || finance.isLoading || tenant.isLoading;

  const queryClient = useQueryClient();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentName: "", email: "", phone: "", matricNumber: "",
    level: "", studentStatus: "", amount: "",
    department: "", gender: "", roomNumber: "", reasonForAmountDeviation: "",
  });

  const manualPaymentMutation = useMutation({
    mutationFn: () =>
      addManualPayment({
        studentName: paymentForm.studentName,
        email: paymentForm.email,
        phone: paymentForm.phone,
        matricNumber: paymentForm.matricNumber,
        level: paymentForm.level as never,
        studentStatus: paymentForm.studentStatus as "new" | "returning",
        amount: Number(paymentForm.amount),
        department: paymentForm.department || undefined,
        gender: paymentForm.gender || undefined,
        roomNumber: paymentForm.roomNumber || undefined,
        reasonForAmountDeviation: paymentForm.reasonForAmountDeviation || undefined,
      }),
    onSuccess: () => {
      toast.success("Payment recorded successfully.");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      setIsPaymentOpen(false);
      setPaymentForm({
        studentName: "", email: "", phone: "", matricNumber: "",
        level: "", studentStatus: "", amount: "",
        department: "", gender: "", roomNumber: "", reasonForAmountDeviation: "",
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to record payment.");
    },
  });

  function handlePaymentField(field: string, value: string) {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  }

  const isCollege = tenant.data?.type === "COLLEGE";

  return (
    <div id="top" className="space-y-6 max-w-8xl mx-auto pb-8">
      <PageHeader
        title={`Hello, ${fullName}`}
        description="View and control your finances here."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tenant.data?.code && (
              <PaymentLinkActions tenantCode={tenant.data.code} />
            )}
            <Button size="sm" onClick={() => setIsPaymentOpen(true)}>
              <PlusIcon className="mr-1.5 size-4" /> Record Payment
            </Button>
          </div>
        }
      />

      {isLoading && <LoadingState />}

      {analytics.isError && (
        <ErrorState
          message={
            analytics.error instanceof ApiClientError
              ? analytics.error.message
              : undefined
          }
          onRetry={() => analytics.refetch()}
        />
      )}

      {finance.isError && (
        <ErrorState
          message={
            finance.error instanceof ApiClientError
              ? finance.error.message
              : undefined
          }
          onRetry={() => finance.refetch()}
        />
      )}

      {finance.data && tenant.data && (
        <>
          <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* 1. Balance */}
            <div>
              <BalanceStatisticsCard totalIncome={finance.data.totalIncome} />
            </div>

            {/* 2. Inflows */}
            <div>
              <PaymentsCountCard totalCount={finance.data.incomeCount} />
            </div>

            {/* 3. Bank Account (Hidden on mobile/tablet grid cell, shown on md+) */}
            <div className="hidden md:block lg:hidden">
              <BankAccountCard
                bankName={tenant.data.bankName}
                accountNumber={tenant.data.accountNumber}
                accountName={tenant.data.accountName}
              />
            </div>

            {/* Desktop-only placement for Bank Account when lg:grid-cols-3 is active */}
            <div className="hidden lg:block">
              <BankAccountCard
                bankName={tenant.data.bankName}
                accountNumber={tenant.data.accountNumber}
                accountName={tenant.data.accountName}
              />
            </div>

            {/* 4. Expense Breakdown — spans full width (col-span-2) on mobile/tablet, hidden on desktop */}
            <div className="col-span-2 md:col-span-1 lg:hidden">
              <ExpenseBreakdownDonut breakdown={breakdown.data} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Last Transactions */}
            <div className="lg:col-span-2">
              <Card className="rounded-3xl border-none shadow-sm flex flex-col justify-between h-full">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Last Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {!analytics.data ||
                  analytics.data.recentPayments.length === 0 ? (
                    <EmptyState
                      icon={ReceiptTextIcon}
                      title="No payments yet"
                    />
                  ) : (
                    <div className="divide-y divide-border/60">
                      {[...analytics.data.recentPayments]
                        .slice(0, 5)
                        .map((tx) => (
                          <div
                            key={tx._id}
                            className="flex items-center justify-between gap-3 py-3 text-sm"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-muted/60 flex items-center justify-center font-bold text-xs shrink-0">
                                {tx.studentName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {tx.studentName}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {tx.matricNumber}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="num font-bold text-sm">
                                {formatCurrency(tx.baseAmount)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Expense Breakdown — desktop only */}
            <div className="hidden lg:block lg:col-span-1">
              <ExpenseBreakdownDonut breakdown={breakdown.data} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div>
              <ExpenseIncomeSplit
                totalIncome={finance.data.totalIncome}
                totalExpenses={finance.data.totalExpenses}
              />
            </div>
          </div>
        </>
      )}

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Log a cash or offline payment for a student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mp-name">Student Name</Label>
                <Input id="mp-name" value={paymentForm.studentName}
                  onChange={(e) => handlePaymentField("studentName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mp-matric">Matric Number</Label>
                <Input id="mp-matric" value={paymentForm.matricNumber}
                  onChange={(e) => handlePaymentField("matricNumber", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mp-email">Email</Label>
                <Input id="mp-email" type="email" value={paymentForm.email}
                  onChange={(e) => handlePaymentField("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mp-phone">Phone</Label>
                <Input id="mp-phone" value={paymentForm.phone}
                  onChange={(e) => handlePaymentField("phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Level</Label>
                <Select value={paymentForm.level} onValueChange={(v) => handlePaymentField("level", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Student Status</Label>
                <Select value={paymentForm.studentStatus} onValueChange={(v) => handlePaymentField("studentStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mp-amount">Amount (NGN)</Label>
              <Input id="mp-amount" type="number" min={1} value={paymentForm.amount}
                onChange={(e) => handlePaymentField("amount", e.target.value)} />
            </div>

            {isCollege && (
              <div className="space-y-1">
                <Label htmlFor="mp-dept">Department</Label>
                <Input id="mp-dept" value={paymentForm.department}
                  onChange={(e) => handlePaymentField("department", e.target.value)} />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="mp-reason">Reason for Amount Deviation (if any)</Label>
              <Textarea id="mp-reason" rows={2} value={paymentForm.reasonForAmountDeviation}
                onChange={(e) => handlePaymentField("reasonForAmountDeviation", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button
              onClick={() => manualPaymentMutation.mutate()}
              disabled={
                manualPaymentMutation.isPending ||
                !paymentForm.studentName || !paymentForm.email ||
                !paymentForm.phone || !paymentForm.matricNumber ||
                !paymentForm.level || !paymentForm.studentStatus ||
                !paymentForm.amount
              }
            >
              {manualPaymentMutation.isPending ? (
                <><Loader2Icon className="mr-2 size-4 animate-spin" /> Saving…</>
              ) : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
