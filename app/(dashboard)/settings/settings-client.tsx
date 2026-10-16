"use client";

import * as React from "react";
import { AlertTriangleIcon } from "lucide-react";
import {
  useSettings,
  useSetMaintenanceMode,
  usePaystackSettings,
  useUpdatePaystackSettings,
  useDeletePaystackSecret,
} from "@/hooks/use-settings";
import { useAuth } from "@/components/layout/auth-context";
import { roleHasPermission } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState } from "@/components/shared/state";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiClientError } from "@/lib/api/errors";

export function SettingsClient() {
  const settings = useSettings();
  const setMaintenanceMode = useSetMaintenanceMode();

  const { user } = useAuth();
  const canManagePaystack = user ? roleHasPermission(user.role, "managePaystackConfig") : false;

  if (settings.isLoading) return <LoadingState />;
  if (settings.isError || !settings.data) {
    return (
      <ErrorState
        message={settings.error instanceof ApiClientError ? settings.error.message : undefined}
        onRetry={() => settings.refetch()}
      />
    );
  }

  const s = settings.data;
  const emailUsagePct = s.emailDailyLimit > 0 ? Math.min(100, (s.emailSentToday / s.emailDailyLimit) * 100) : 0;
  const nearLimit = s.emailSentToday >= s.emailWarningThreshold;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform-wide configuration and integration settings." />

      <div className={`grid grid-cols-1 gap-6 items-start ${canManagePaystack ? "lg:grid-cols-12" : "max-w-2xl"}`}>
        {/* Left Column: General Platform Settings */}
        <div className={`space-y-6 ${canManagePaystack ? "lg:col-span-5" : ""}`}>
          {/* Maintenance Mode */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="maintenanceMode" className="text-sm font-semibold">
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When active, the public checkout flow stops accepting new customer transactions.
                </p>
                <p className="pt-1 text-xs font-medium">
                  Status:{" "}
                  <span className={s.maintenanceMode ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-400"}>
                    {s.maintenanceMode ? "Payments paused" : "Payments active"}
                  </span>
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={s.maintenanceMode}
                disabled={setMaintenanceMode.isPending}
                onCheckedChange={(checked) => setMaintenanceMode.mutate(checked)}
              />
            </div>
          </div>

          {/* Email Quota */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Email Delivery Quota</h2>
              <p className="text-xs text-muted-foreground">
                Resets daily at {formatDateTime(s.emailLastReset)}.
              </p>
            </div>

            {nearLimit && (
              <Alert variant="warning" className="py-2.5">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle className="text-xs font-medium">Approaching daily limit</AlertTitle>
                <AlertDescription className="text-xs">
                  {s.emailSentToday} of {s.emailDailyLimit} emails dispatched today.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Usage</span>
                <span>{s.emailSentToday} / {s.emailDailyLimit} sent</span>
              </div>
              <Progress value={emailUsagePct} className="h-2" />
            </div>
          </div>
        </div>

        {/* Right Column: Paystack Configuration */}
        {canManagePaystack && <PaystackConfigSection />}
      </div>
    </div>
  );
}

/**
 * Handles Paystack fetching state and renders the form once data is ready.
 */
function PaystackConfigSection() {
  const paystackSettings = usePaystackSettings();

  return (
    <div className="lg:col-span-7 rounded-lg border border-border bg-card p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-base font-semibold">Paystack Configuration</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage credentials, webhook verification, and request network limits.
        </p>
      </div>

      {paystackSettings.isLoading && <LoadingState />}
      {paystackSettings.isError && (
        <ErrorState
          message={paystackSettings.error instanceof ApiClientError ? paystackSettings.error.message : undefined}
          onRetry={() => paystackSettings.refetch()}
        />
      )}

      {paystackSettings.data && (
        <PaystackConfigForm data={paystackSettings.data} />
      )}
    </div>
  );
}

/**
 * Initializes form state directly from props—no useEffect required.
 */
function PaystackConfigForm({
  data,
}: {
  data: NonNullable<ReturnType<typeof usePaystackSettings>["data"]>;
}) {
  const updatePaystack = useUpdatePaystackSettings();
  const deletePaystackSecret = useDeletePaystackSecret();

  const [newSecret, setNewSecret] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Initialized directly with initial server data
  const [timeoutMs, setTimeoutMs] = React.useState(String(data.timeoutMs ?? ""));
  const [maxRetries, setMaxRetries] = React.useState(String(data.maxRetries ?? ""));
  const [feeTolerancePct, setFeeTolerancePct] = React.useState(String(data.feeTolerancePct ?? ""));
  const [feeToleranceFlatKobo, setFeeToleranceFlatKobo] = React.useState(String(data.feeToleranceFlatKobo ?? ""));

  function handlePaystackSave(e: React.FormEvent) {
    e.preventDefault();
    const payload: Parameters<typeof updatePaystack.mutate>[0] = {};
    if (newSecret.trim()) payload.secret = newSecret.trim();

    const t = parseInt(timeoutMs, 10);
    const r = parseInt(maxRetries, 10);
    const p = parseFloat(feeTolerancePct);
    const f = parseInt(feeToleranceFlatKobo, 10);

    if (!isNaN(t)) payload.timeoutMs = t;
    if (!isNaN(r)) payload.maxRetries = r;
    if (!isNaN(p)) payload.feeTolerancePct = p;
    if (!isNaN(f)) payload.feeToleranceFlatKobo = f;

    updatePaystack.mutate(payload, {
      onSuccess: () => setNewSecret(""),
    });
  }

  return (
    <>
      <form onSubmit={handlePaystackSave} className="space-y-6">
        {/* Secret Key Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="paystackSecret" className="text-xs font-medium">
                Secret Key
              </Label>
              <p className="text-xs text-muted-foreground">
                {data.secretConfigured ? (
                  <>
                    Active key: <code className="font-mono text-foreground font-medium">{data.secretPreview}</code>
                  </>
                ) : (
                  <span className="text-amber-500 font-medium">No secret configured. Payments will fail.</span>
                )}
              </p>
            </div>

            {data.secretConfigured && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deletePaystackSecret.isPending}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Remove secret
              </Button>
            )}
          </div>

          <Input
            id="paystackSecret"
            type="password"
            autoComplete="off"
            placeholder={data.secretConfigured ? "Enter new secret to replace…" : "sk_live_..."}
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Leave blank to preserve the currently stored secret key.
          </p>
        </div>

        {/* Gateway Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label htmlFor="paystackTimeout" className="text-xs">
              Timeout (ms)
            </Label>
            <Input
              id="paystackTimeout"
              type="number"
              min={1000}
              max={60000}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paystackRetries" className="text-xs">
              Max Retries
            </Label>
            <Input
              id="paystackRetries"
              type="number"
              min={0}
              max={5}
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paystackFeePct" className="text-xs">
              Fee Tolerance (%)
            </Label>
            <Input
              id="paystackFeePct"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={feeTolerancePct}
              onChange={(e) => setFeeTolerancePct(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paystackFeeKobo" className="text-xs">
              Fee Tolerance Flat (kobo)
            </Label>
            <Input
              id="paystackFeeKobo"
              type="number"
              min={0}
              value={feeToleranceFlatKobo}
              onChange={(e) => setFeeToleranceFlatKobo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" disabled={updatePaystack.isPending}>
            {updatePaystack.isPending ? "Saving changes…" : "Save Paystack Settings"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove Paystack Secret"
        description="This will clear the configured Paystack secret key. All payment processing and webhook verifications will fail until a replacement key is configured."
        confirmLabel="Remove Secret"
        destructive
        onConfirm={() => {
          deletePaystackSecret.mutate();
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}