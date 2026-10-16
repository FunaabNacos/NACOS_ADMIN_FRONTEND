"use client";

import Link from "next/link";
import {
  Building2Icon,
  ArrowRightIcon,
  WalletIcon,
  ReceiptTextIcon,
  UsersIcon,
  TrendingUpIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  BadgePercentIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useTenants } from "@/hooks/use-tenants";
import { usePlatformAnalytics } from "@/hooks/use-analytics";
import { usePlatformFinanceSummary } from "@/hooks/use-finance";
import { formatCurrency } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/errors";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/state";
import { TenantStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SuperAdminOverview({ fullName }: { fullName: string }) {
  const firstName = fullName.split(" ")[0];

  const tenants = useTenants({ limit: 50 });
  const analytics = usePlatformAnalytics();
  const platformFinance = usePlatformFinanceSummary();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Monitor platform activity and manage tenant associations."
      />

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <LayoutDashboardIcon className="size-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <BuildingIcon className="size-4" />
            Associations
          </TabsTrigger>
        </TabsList>

        {/* INSIGHTS TAB */}
        <TabsContent
          value="insights"
          className="space-y-6 outline-none focus-visible:ring-0"
        >
          {analytics.isLoading && <LoadingState />}
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

          {analytics.data && (
            <>
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total collected"
                  value={formatCurrency(analytics.data.totals.totalCollected)}
                  icon={WalletIcon}
                  tone="primary"
                />
                <StatCard
                  label="Transactions"
                  value={String(analytics.data.totals.totalTransactions)}
                  icon={ReceiptTextIcon}
                  hint={`${analytics.data.totals.successfulPayments} successful`}
                />
                <StatCard
                  label="Online payments"
                  value={String(analytics.data.totals.onlineTransactions)}
                  icon={TrendingUpIcon}
                />
                <StatCard
                  label="Convenience fees collected"
                  value={formatCurrency(
                    analytics.data.totals.totalConvenienceFee,
                  )}
                  icon={BadgePercentIcon}
                  tone="primary"
                />
              </div>

              {/* Charts */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily collections</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    {analytics.data.dailyTrend.length === 0 ? (
                      <EmptyState title="No activity yet" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analytics.data.dailyTrend.map((d) => ({
                            label: `${d._id.day}/${d._id.month}`,
                            total: d.totalCollected,
                          }))}
                        >
                          <defs>
                            <linearGradient
                              id="fillTotal"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
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
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="var(--color-border)"
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            width={40}
                          />
                          <Tooltip
                            formatter={(v: number) => formatCurrency(v)}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid var(--color-border)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--color-primary)"
                            fill="url(#fillTotal)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Collections by tenant</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    {analytics.data.byTenant.length === 0 ? (
                      <EmptyState title="No tenants yet" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.data.byTenant.slice(0, 8)}>
                          <CartesianGrid
                            vertical={false}
                            stroke="var(--color-border)"
                          />
                          <XAxis
                            dataKey="tenantName"
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            width={40}
                          />
                          <Tooltip
                            formatter={(v: number) => formatCurrency(v)}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid var(--color-border)",
                            }}
                          />
                          <Bar
                            dataKey="totalCollected"
                            fill="var(--color-primary)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Convenience fees by tenant</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.data.byTenant.length === 0 ? (
                    <EmptyState title="No tenants yet" />
                  ) : (
                    <div className="divide-y divide-border">
                      {analytics.data.byTenant.map((tenant) => (
                        <div
                          key={tenant._id}
                          className="flex items-center justify-between py-3 text-sm"
                        >
                          <span className="font-medium">
                            {tenant.tenantName}
                          </span>
                          <span className="num font-medium text-primary">
                            {formatCurrency(tenant.convenienceFeeCollected)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}


        </TabsContent>

        {/* TENANTS/ASSOCIATIONS TAB */}
        <TabsContent
          value="tenants"
          className="space-y-6 outline-none focus-visible:ring-0"
        >
          {tenants.isLoading && <LoadingState />}
          {tenants.isError && (
            <ErrorState
              message={
                tenants.error instanceof ApiClientError
                  ? tenants.error.message
                  : undefined
              }
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
                        <p className="text-xs text-muted-foreground">
                          {tenant.code} ·{" "}
                          {tenant.type === "COLLEGE" ? "College" : "Department"}
                        </p>
                        <div className="mt-2">
                          <TenantStatusBadge status={tenant.status} />
                        </div>
                      </div>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
