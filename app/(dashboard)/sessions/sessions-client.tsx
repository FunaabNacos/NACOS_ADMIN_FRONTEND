"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PlusIcon,
  CalendarRangeIcon,
  Settings2Icon,
  LockIcon,
  InfoIcon,
  UploadIcon,
  Loader2Icon,
  CoinsIcon,
} from "lucide-react";

import { useAuth } from "@/components/layout/auth-context";
import {
  useSessions,
  useCreateSession,
  useActivateSession,
  useCloseSession,
  useOwnTenantFees,
  useSetOwnTenantFees,
  useLockOwnTenantFees,
  useOverrideTenantFees,
} from "@/hooks/use-sessions";
import { useTenants, useTenant, useUploadTenantLogo } from "@/hooks/use-tenants";
import { formatDate } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/errors";

import { PageHeader } from "@/components/shared/page-header";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { AcademicSession, Tenant } from "@/lib/types";
import { BankAccountCard } from "../dashboard/finance-director-overview";

const feesSchema = z.object({
  newStudentFee: z.coerce.number().nonnegative("Must be 0 or greater"),
  returningStudentFee: z.coerce.number().nonnegative("Must be 0 or greater"),
});

type FeesValues = z.infer<typeof feesSchema>;

const createSessionSchema = z.object({
  label: z.string().min(1, "Required"),
  startDate: z.string().min(1, "Required"),
});

type CreateSessionValues = z.infer<typeof createSessionSchema>;

export function SessionsClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isFinanceDirector = user?.role === "finance_director";

  const tenantId = user?.tenantId ?? undefined;
  const tenant = useTenant(tenantId);

  const sessions = useSessions();
  const activate = useActivateSession();
  const close = useCloseSession();

  const [createOpen, setCreateOpen] = React.useState<boolean>(false);
  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    action: "activate" | "close";
  } | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sessions & Fees"
        description="Manage academic cycles, association dues, and payment configurations."
        actions={
          isSuperAdmin && (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <PlusIcon className="mr-1.5 h-4 w-4" /> New Session
            </Button>
          )
        }
      />

      {/* FINANCE DIRECTOR VIEW: 3-column top grid + full-width session table */}
      {isFinanceDirector && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Association Financial Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <OwnTenantFeesCard />

            {tenant.data && (
              <div className="rounded-xl border border-border/70 bg-card/30 p-5">
                <BankAccountCard
                  bankName={tenant.data.bankName}
                  accountNumber={tenant.data.accountNumber}
                  accountName={tenant.data.accountName}
                />
              </div>
            )}

            {tenantId && (
              <TenantLogoCard
                tenantId={tenantId}
                logoUrl={tenant.data?.logoUrl ?? null}
                tenantName={tenant.data?.name ?? ""}
              />
            )}
          </div>
        </section>
      )}

      {/* SUPER ADMIN VIEW & SESSIONS TABLE WORKSPACE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarRangeIcon className="h-4 w-4" />
            Academic Cycles
          </h2>
        </div>

        <div
          className={
            isSuperAdmin
              ? "grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
              : "space-y-4"
          }
        >
          {/* Sessions List */}
          <div className={isSuperAdmin ? "lg:col-span-7 xl:col-span-8 space-y-4" : "space-y-4"}>
            {sessions.isLoading && <LoadingState />}

            {sessions.isError && (
              <ErrorState
                message={
                  sessions.error instanceof ApiClientError
                    ? sessions.error.message
                    : undefined
                }
                onRetry={() => sessions.refetch()}
              />
            )}

            {sessions.data && sessions.data.length === 0 && (
              <EmptyState
                icon={CalendarRangeIcon}
                title="No sessions yet"
                message="Create the first academic session to get started."
              />
            )}

            {sessions.data && sessions.data.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-medium whitespace-nowrap">Session Label</TableHead>
                        <TableHead className="font-medium whitespace-nowrap">Start Date</TableHead>
                        <TableHead className="font-medium whitespace-nowrap">Status</TableHead>
                        {isSuperAdmin && (
                          <TableHead className="text-right px-6 font-medium whitespace-nowrap">
                            Actions
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.data.map((session: AcademicSession) => (
                        <TableRow
                          key={session._id}
                          className={session.isActive ? "bg-primary/[0.02]" : undefined}
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {session.label}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(session.startDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {session.isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none font-medium">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="opacity-70 font-normal">
                                Closed
                              </Badge>
                            )}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right px-6 whitespace-nowrap">
                              {!session.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-primary/20 text-primary hover:bg-primary/5 text-xs"
                                  onClick={() =>
                                    setConfirmTarget({
                                      id: session._id,
                                      action: "activate",
                                    })
                                  }
                                >
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-destructive/25 text-destructive hover:bg-destructive/10 text-xs"
                                  onClick={() =>
                                    setConfirmTarget({
                                      id: session._id,
                                      action: "close",
                                    })
                                  }
                                >
                                  Close Session
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Super Admin Override Panel */}
          {isSuperAdmin && (
            <div className="lg:col-span-5 xl:col-span-4">
              <SuperAdminOverrideCard sessions={sessions.data || []} />
            </div>
          )}
        </div>
      </section>

      {/* Read-Only Banner for other roles */}
      {!isFinanceDirector && !isSuperAdmin && (
        <Alert className="bg-muted/40 border border-border/60">
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
          <AlertTitle className="text-xs font-semibold uppercase tracking-wider">
            View-Only Mode
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Only association Finance Directors and Platform Admins can configure fee structures.
          </AlertDescription>
        </Alert>
      )}

      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget?.action === "activate"
            ? "Activate this session?"
            : "Close this session?"
        }
        description={
          confirmTarget?.action === "activate"
            ? "This will become the platform's active session. Any currently active session will be closed automatically."
            : "All fees will be locked and student balances carried forward. This action cannot be reversed."
        }
        destructive={confirmTarget?.action === "close"}
        isLoading={activate.isPending || close.isPending}
        onConfirm={() => {
          if (!confirmTarget) return;
          const mutation =
            confirmTarget.action === "activate" ? activate : close;
          mutation.mutate(confirmTarget.id, {
            onSuccess: () => setConfirmTarget(null),
          });
        }}
      />
    </div>
  );
}

function OwnTenantFeesCard() {
  const fees = useOwnTenantFees();
  const setFees = useSetOwnTenantFees();
  const lockFees = useLockOwnTenantFees();
  const [confirmLock, setConfirmLock] = React.useState<boolean>(false);

  const form = useForm<FeesValues>({
    resolver: zodResolver(feesSchema),
    values: fees.data
      ? {
          newStudentFee: fees.data.newStudentFee,
          returningStudentFee: fees.data.returningStudentFee,
        }
      : undefined,
    defaultValues: { newStudentFee: 0, returningStudentFee: 0 },
  });

  if (fees.isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/30 p-6 flex items-center justify-center min-h-[220px]">
        <LoadingState />
      </div>
    );
  }

  const locked: boolean = fees.data?.feesLocked ?? false;

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col justify-between transition-colors ${
        locked
          ? "border-dashed border-border/80 bg-muted/20"
          : "border-border/70 bg-card/30"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Current Session Fees
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locked
                ? "Dues are locked for this session."
                : "Set student payment requirements for this cycle."}
            </p>
          </div>
          {locked ? (
            <Badge variant="secondary" className="gap-1 text-[11px] shrink-0 font-medium">
              <LockIcon className="h-3 w-3" /> Locked
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] shrink-0 text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
              Draft
            </Badge>
          )}
        </div>

        <form
          id="fees-form"
          onSubmit={form.handleSubmit((v: FeesValues) => setFees.mutate(v))}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <FormField
            label="New Student (₦)"
            htmlFor="newFee"
            error={form.formState.errors.newStudentFee?.message}
          >
            <Input
              id="newFee"
              type="number"
              disabled={locked}
              {...form.register("newStudentFee")}
              className="bg-background/80"
            />
          </FormField>
          <FormField
            label="Returning Student (₦)"
            htmlFor="retFee"
            error={form.formState.errors.returningStudentFee?.message}
          >
            <Input
              id="retFee"
              type="number"
              disabled={locked}
              {...form.register("returningStudentFee")}
              className="bg-background/80"
            />
          </FormField>
        </form>
      </div>

      {!locked && (
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 mt-2 border-t border-border/40">
          <Button
            type="submit"
            form="fees-form"
            size="sm"
            disabled={setFees.isPending}
            className="w-full sm:flex-1"
          >
            {setFees.isPending ? "Saving..." : "Update Fees"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmLock(true)}
            className="w-full sm:w-auto text-xs"
          >
            <LockIcon className="mr-1.5 h-3.5 w-3.5" /> Lock & Finalize
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmLock}
        onOpenChange={setConfirmLock}
        title="Finalize & Lock Fees?"
        description="Once locked, students can begin making payments. You will need a Super Admin to make any further changes."
        destructive
        confirmLabel="Lock Fees"
        isLoading={lockFees.isPending}
        onConfirm={() =>
          lockFees.mutate(undefined, {
            onSuccess: () => setConfirmLock(false),
          })
        }
      />
    </div>
  );
}

function TenantLogoCard({
  tenantId,
  logoUrl,
  tenantName,
}: {
  tenantId: string;
  logoUrl: string | null;
  tenantName: string;
}) {
  const upload = useUploadTenantLogo(tenantId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(file);
    e.target.value = "";
  }

  const initials = tenantName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border/70 bg-card/30 p-5 flex flex-col justify-between space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Association Logo
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Displayed on generated student receipts and invoices.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-xl border border-border/80 shrink-0">
          {logoUrl && <AvatarImage src={logoUrl} alt={tenantName} className="object-cover" />}
          <AvatarFallback className="rounded-xl text-sm font-bold bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={upload.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-fit text-xs"
          >
            {upload.isPending ? (
              <>
                <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <UploadIcon className="mr-1.5 h-3.5 w-3.5" /> Upload Logo
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground truncate">
            JPG, PNG or WebP · Max 5 MB
          </p>
        </div>
      </div>
    </div>
  );
}

function SuperAdminOverrideCard({ sessions }: { sessions: AcademicSession[] }) {
  const tenants = useTenants({ limit: 100, status: "ACTIVE" });
  const overrideFees = useOverrideTenantFees();

  const [tenantId, setTenantId] = React.useState<string | undefined>();
  const activeSessionId = sessions.find((s) => s.isActive)?._id;
  const [sessionId, setSessionId] = React.useState<string | undefined>(
    activeSessionId,
  );

  const form = useForm<FeesValues>({
    resolver: zodResolver(feesSchema),
    defaultValues: { newStudentFee: 0, returningStudentFee: 0 },
  });

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Settings2Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Fee Override
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manually update fee requirements for any association cycle.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Association
          </label>
          <Select value={tenantId ?? ""} onValueChange={setTenantId}>
            <SelectTrigger className="bg-background/80">
              <SelectValue placeholder="Select Association" />
            </SelectTrigger>
            <SelectContent>
              {tenants.data?.tenants.map((t: Tenant) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Target Session
          </label>
          <Select value={sessionId ?? ""} onValueChange={setSessionId}>
            <SelectTrigger className="bg-background/80">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s: AcademicSession) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.label}
                  {s.isActive ? " (Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((values: FeesValues) => {
          if (!tenantId || !sessionId) return;
          overrideFees.mutate({ tenantId, sessionId, input: values });
        })}
        className="space-y-3 pt-3 border-t border-border/50"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="New (₦)"
            htmlFor="ovNew"
            error={form.formState.errors.newStudentFee?.message}
          >
            <Input
              id="ovNew"
              type="number"
              {...form.register("newStudentFee")}
              className="bg-background/80"
            />
          </FormField>
          <FormField
            label="Returning (₦)"
            htmlFor="ovRet"
            error={form.formState.errors.returningStudentFee?.message}
          >
            <Input
              id="ovRet"
              type="number"
              {...form.register("returningStudentFee")}
              className="bg-background/80"
            />
          </FormField>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="sm"
          disabled={!tenantId || !sessionId || overrideFees.isPending}
        >
          {overrideFees.isPending ? "Applying..." : "Force Apply Fees"}
        </Button>
      </form>
    </div>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSession = useCreateSession();
  const form = useForm<CreateSessionValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      label: "",
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(values: CreateSessionValues) {
    try {
      await createSession.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Academic Session</DialogTitle>
          <DialogDescription>
            Define the label and start date for the next academic cycle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            label="Label (e.g. 2025/2026)"
            htmlFor="label"
            error={form.formState.errors.label?.message}
          >
            <Input
              id="label"
              placeholder="2025/2026"
              {...form.register("label")}
            />
          </FormField>
          <FormField
            label="Start Date"
            htmlFor="startDate"
            error={form.formState.errors.startDate?.message}
          >
            <Input id="startDate" type="date" {...form.register("startDate")} />
          </FormField>
          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={createSession.isPending}
            >
              {createSession.isPending ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}