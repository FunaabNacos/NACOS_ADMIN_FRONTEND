"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckIcon,
  XIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
} from "lucide-react";
import {
  useOnboardingDetail,
  useApproveOnboarding,
  useRejectOnboarding,
  useRetryOnboardingApproval,
} from "@/hooks/use-onboarding";
import { formatDateTime } from "@/lib/utils";
import { LoadingState, ErrorState } from "@/components/shared/state";
import { OnboardingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiClientError } from "@/lib/api/errors";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4 border-b border-border/40 last:border-b-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:col-span-2 break-words whitespace-normal">
        {children}
      </dd>
    </div>
  );
}

export function OnboardingDetailClient({ id }: { id: string }) {
  const request = useOnboardingDetail(id);
  const approve = useApproveOnboarding();
  const reject = useRejectOnboarding();
  const retry = useRetryOnboardingApproval();

  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  if (request.isLoading) return <LoadingState />;
  if (request.isError || !request.data) {
    return (
      <ErrorState
        message={
          request.error instanceof ApiClientError
            ? request.error.message
            : undefined
        }
        onRetry={() => request.refetch()}
      />
    );
  }

  const { request: r, auditTrail, supersedes, supersededBy } = request.data;
  const isPending = r.status === "PENDING";
  const isFailed = r.status === "APPROVAL_FAILED";
  const canTakeAction = isPending || isFailed;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2.5 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Link href="/onboarding">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to requests</span>
          </Link>
        </Button>
      </div>

      {/* Main Header / Dossier Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground break-words">
              {r.associationName}
            </h1>
            <OnboardingStatusBadge status={r.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Application ID:{" "}
            <span className="font-mono text-xs text-foreground/80">
              {r._id}
            </span>
          </p>
        </div>

        {canTakeAction && (
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <XIcon className="h-4 w-4 mr-1.5" /> Reject
            </Button>
            {isPending && (
              <Button size="sm" onClick={() => setConfirmApprove(true)}>
                <CheckIcon className="h-4 w-4 mr-1.5" /> Approve Registration
              </Button>
            )}
            {isFailed && (
              <Button
                size="sm"
                onClick={() => retry.mutate(id)}
                disabled={retry.isPending}
              >
                <RotateCcwIcon
                  className={`h-4 w-4 mr-1.5 ${retry.isPending ? "animate-spin" : ""}`}
                />
                {retry.isPending ? "Retrying…" : "Retry Approval"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status Notice Banners */}
      {r.status === "APPROVAL_FAILED" && r.failureReason && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Approval Failure Reason</AlertTitle>
          <AlertDescription className="mt-1 text-sm break-words whitespace-normal">
            {r.failureReason}
          </AlertDescription>
        </Alert>
      )}

      {r.status === "REJECTED" && (
        <Alert variant="warning">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Rejection Reason</AlertTitle>
          <AlertDescription className="mt-1 text-sm break-words whitespace-normal">
            {r.rejectionReason || "No explicit reason was provided."}
          </AlertDescription>
        </Alert>
      )}

      {r.status === "APPROVED" && r.resultingTenantId && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200">
          <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-emerald-900 dark:text-emerald-100">
            Approved & Provisioned
          </AlertTitle>
          <AlertDescription className="mt-1 text-sm flex items-center gap-1.5">
            <span>Tenant record has been generated.</span>
            <Link
              href={`/tenants/${r.resultingTenantId}`}
              className="inline-flex items-center gap-1 font-semibold underline hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              View Tenant Profile <ExternalLinkIcon className="h-3.5 w-3.5" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Section 1: Association Information */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          1. Association Profile
        </h2>
        <dl className="border-t border-b">
          <DetailRow label="Association Name">{r.associationName}</DetailRow>
          <DetailRow label="Association Type">
            {r.associationType === "COLLEGE"
              ? "College Level"
              : "Department Level"}
          </DetailRow>
          <DetailRow label="Official Email">
            <a
              href={`mailto:${r.associationEmail}`}
              className="text-primary hover:underline"
            >
              {r.associationEmail}
            </a>
          </DetailRow>
          <DetailRow label="Date Submitted">
            {formatDateTime(r.submittedAt)}
          </DetailRow>
        </dl>
      </section>

      {/* Section 2: Contact & Key Personnel */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          2. Representatives & Administration
        </h2>
        <dl className="border-t border-b">
          <DetailRow label="Primary Contact">{r.contactFullName}</DetailRow>
          <DetailRow label="Contact Phone Number">
            <a
              href={`tel:${r.contactPhone}`}
              className="text-primary hover:underline"
            >
              {r.contactPhone}
            </a>
          </DetailRow>
          <DetailRow label="Finance Director">
            {r.financeDirectorFullName}
          </DetailRow>
        </dl>
      </section>

      {/* Section 3: Bank Settlement Details */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          3. Bank Account & Settlement
        </h2>
        <dl className="border-t border-b">
          <DetailRow label="Bank Name">{r.bankName}</DetailRow>
          <DetailRow label="Account Number">
            <span className="font-mono font-bold tracking-widest">
              {r.accountNumber}
            </span>
          </DetailRow>
          <DetailRow label="Resolved Account Name">
            {r.resolvedAccountName}
          </DetailRow>
        </dl>
      </section>

      {/* Section 4: Related Requests (If applicable) */}
      {(supersedes || supersededBy) && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            4. Related Submissions
          </h2>
          <dl className="border-t border-b">
            {supersedes && (
              <DetailRow label="Supersedes">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/onboarding/${supersedes._id}`}
                    className="font-medium underline hover:text-primary inline-flex items-center gap-1"
                  >
                    {supersedes.associationName}{" "}
                    <ExternalLinkIcon className="h-3 w-3" />
                  </Link>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({supersedes.status.toLowerCase()})
                  </span>
                </div>
              </DetailRow>
            )}
            {supersededBy && (
              <DetailRow label="Superseded By">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/onboarding/${supersededBy._id}`}
                    className="font-medium underline hover:text-primary inline-flex items-center gap-1"
                  >
                    {supersededBy.associationName}{" "}
                    <ExternalLinkIcon className="h-3 w-3" />
                  </Link>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({supersededBy.status.toLowerCase()})
                  </span>
                </div>
              </DetailRow>
            )}
          </dl>
        </section>
      )}

      {/* Section 5: Audit Trail */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {supersedes || supersededBy ? "5. Audit Trail" : "4. Audit Trail"}
        </h2>
        {auditTrail.length === 0 ? (
          <p className="text-sm text-muted-foreground border-t pt-3">
            No activity recorded.
          </p>
        ) : (
          <div className="border-t">
            {auditTrail.map((entry) => (
              <div
                key={entry._id}
                className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-3 border-b border-border/40 text-sm"
              >
                <div className="text-muted-foreground text-xs sm:text-sm">
                  {formatDateTime(entry.timestamp)}
                </div>
                <div className="sm:col-span-2 space-y-0.5">
                  <div className="font-medium capitalize text-foreground">
                    {entry.action.replaceAll("_", " ").toLowerCase()}
                  </div>
                  <div className="text-xs text-muted-foreground break-words">
                    {entry.userEmail
                      ? `${entry.userEmail} (${entry.userRole})`
                      : "System Action"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title="Approve this association?"
        description="This will provision a live tenant, create the Finance Director account, and send an invitation email."
        confirmLabel="Approve Request"
        isLoading={approve.isPending}
        onConfirm={() =>
          approve.mutate(id, { onSuccess: () => setConfirmApprove(false) })
        }
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Association Application</DialogTitle>
            <DialogDescription>
              Add an optional reason for the rejection record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              placeholder="e.g. Account details could not be verified with the registered department name."
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={reject.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() =>
                reject.mutate(
                  { id, rejectionReason: rejectionReason || undefined },
                  { onSuccess: () => setRejectOpen(false) },
                )
              }
            >
              {reject.isPending ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
