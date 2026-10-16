"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, InfoIcon } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useTenants } from "@/hooks/use-tenants";
import { useSessions } from "@/hooks/use-sessions";
import {
  useOwnTenantFees,
  useSetOwnTenantFees,
  useLockOwnTenantFees,
  useOverrideTenantFees,
} from "@/hooks/use-sessions";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState } from "@/components/shared/state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiClientError } from "@/lib/api/errors";

const feesSchema = z.object({
  newStudentFee: z.coerce.number().nonnegative("Must be 0 or greater"),
  returningStudentFee: z.coerce.number().nonnegative("Must be 0 or greater"),
});
type FeesValues = z.infer<typeof feesSchema>;

export function SessionFeesClient() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Session fees" description="Set and lock what students pay this session." />
      {user?.role === "finance_director" && <OwnTenantFees />}
      {user?.role === "super_admin" && <OverrideFees />}
      {user?.role === "main_admin" && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Not available for your role</AlertTitle>
          <AlertDescription>
            Fee settings are managed by each association&apos;s Finance Director, with Super Admin
            oversight. You don&apos;t have visibility into fee amounts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function OwnTenantFees() {
  const fees = useOwnTenantFees();
  const setFees = useSetOwnTenantFees();
  const lockFees = useLockOwnTenantFees();
  const [confirmLock, setConfirmLock] = React.useState(false);

  const form = useForm<FeesValues>({
    resolver: zodResolver(feesSchema),
    values: fees.data
      ? { newStudentFee: fees.data.newStudentFee, returningStudentFee: fees.data.returningStudentFee }
      : undefined,
    defaultValues: { newStudentFee: 0, returningStudentFee: 0 },
  });

  if (fees.isLoading) return <LoadingState />;
  if (fees.isError) {
    return (
      <ErrorState
        message={fees.error instanceof ApiClientError ? fees.error.message : undefined}
        onRetry={() => fees.refetch()}
      />
    );
  }

  const locked = fees.data?.feesLocked ?? false;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Your association&apos;s fees</CardTitle>
        <CardDescription>
          {locked
            ? "Fees are locked for this session and can no longer be changed."
            : "Set fees, then lock them once you're ready — students can only pay once fees are locked."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((values) => setFees.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <FormField label="New student fee (₦)" htmlFor="newStudentFee" error={form.formState.errors.newStudentFee?.message}>
            <Input id="newStudentFee" type="number" min={0} disabled={locked} {...form.register("newStudentFee")} />
          </FormField>
          <FormField label="Returning student fee (₦)" htmlFor="returningStudentFee" error={form.formState.errors.returningStudentFee?.message}>
            <Input id="returningStudentFee" type="number" min={0} disabled={locked} {...form.register("returningStudentFee")} />
          </FormField>

          {!locked && (
            <div className="flex gap-2">
              <Button type="submit" disabled={setFees.isPending}>
                {setFees.isPending ? "Saving…" : "Save fees"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmLock(true)}>
                <LockIcon /> Lock fees
              </Button>
            </div>
          )}
        </form>
      </CardContent>

      <ConfirmDialog
        open={confirmLock}
        onOpenChange={setConfirmLock}
        title="Lock fees for this session?"
        description="Once locked, fees can't be changed — only a Super Admin can override them."
        destructive
        confirmLabel="Lock fees"
        isLoading={lockFees.isPending}
        onConfirm={() => lockFees.mutate(undefined, { onSuccess: () => setConfirmLock(false) })}
      />
    </Card>
  );
}

function OverrideFees() {
  const tenants = useTenants({ limit: 100, status: "ACTIVE" });
  const sessions = useSessions();
  const overrideFees = useOverrideTenantFees();

  const [tenantId, setTenantId] = React.useState<string | undefined>();
  const [sessionIdOverride, setSessionId] = React.useState<string | undefined>();
  const sessionId = sessionIdOverride ?? sessions.data?.find((s) => s.isActive)?._id;

  const form = useForm<FeesValues>({
    resolver: zodResolver(feesSchema),
    defaultValues: { newStudentFee: 0, returningStudentFee: 0 },
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Override a tenant&apos;s fees</CardTitle>
        <CardDescription>
          There&apos;s no way to view a tenant&apos;s current fees from here — enter the correct values
          directly. This overwrites whatever is currently set, locked or not.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="Tenant" htmlFor="tenantId">
          <Select value={tenantId ?? ""} onValueChange={setTenantId}>
            <SelectTrigger id="tenantId"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
            <SelectContent>
              {tenants.data?.tenants.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Session" htmlFor="sessionId">
          <Select value={sessionId ?? ""} onValueChange={setSessionId}>
            <SelectTrigger id="sessionId"><SelectValue placeholder="Select a session" /></SelectTrigger>
            <SelectContent>
              {sessions.data?.map((s) => (
                <SelectItem key={s._id} value={s._id}>{s.label}{s.isActive ? " (active)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <form
          onSubmit={form.handleSubmit((values) => {
            if (!tenantId || !sessionId) return;
            overrideFees.mutate({ tenantId, sessionId, input: values });
          })}
          className="space-y-4"
          noValidate
        >
          <FormField label="New student fee (₦)" htmlFor="ovNewStudentFee" error={form.formState.errors.newStudentFee?.message}>
            <Input id="ovNewStudentFee" type="number" min={0} {...form.register("newStudentFee")} />
          </FormField>
          <FormField label="Returning student fee (₦)" htmlFor="ovReturningStudentFee" error={form.formState.errors.returningStudentFee?.message}>
            <Input id="ovReturningStudentFee" type="number" min={0} {...form.register("returningStudentFee")} />
          </FormField>
          <Button type="submit" disabled={!tenantId || !sessionId || overrideFees.isPending}>
            {overrideFees.isPending ? "Overriding…" : "Override fees"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}