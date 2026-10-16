"use client";

import { RotateCcwIcon } from "lucide-react";
import { usePendingReceipts, useResyncTransaction } from "@/hooks/use-recovery";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/errors";

export function RecoveryClient() {
  const pending = usePendingReceipts();
  const resync = useResyncTransaction();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Recovery" description="Transactions stuck without a generated receipt." />

      {pending.isLoading && <LoadingState />}
      {pending.isError && (
        <ErrorState message={pending.error instanceof ApiClientError ? pending.error.message : undefined} onRetry={() => pending.refetch()} />
      )}
      {pending.data && pending.data.length === 0 && (
        <EmptyState title="All clear" message="No transactions are waiting on receipt recovery." />
      )}

      {pending.data && pending.data.length > 0 && (
        <Card className="overflow-hidden p-0 border shadow-sm">
          {/* Mobile View (< md) */}
          <div className="block md:hidden divide-y">
            {pending.data.map((tx) => (
              <div key={tx._id} className="p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-sm truncate">{tx.studentName}</p>
                    <p className="text-xs text-muted-foreground">{tx.matricNumber}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-sm num block">{formatCurrency(tx.amount)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed">
                  <span className="font-mono text-[11px] text-muted-foreground truncate">
                    Ref: {tx.reference}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    disabled={!tx.paystackReference || resync.isPending}
                    onClick={() => tx.paystackReference && resync.mutate(tx.paystackReference)}
                  >
                    <RotateCcwIcon className="h-3 w-3 mr-1.5" /> Re-sync
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet View (md and lg screens upwards) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3 px-4">Student</TableHead>
                  <TableHead className="py-3 px-4">Reference</TableHead>
                  <TableHead className="py-3 px-4">Amount</TableHead>
                  <TableHead className="py-3 px-4">Date</TableHead>
                  <TableHead className="py-3 px-4 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.data.map((tx) => (
                  <TableRow key={tx._id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <p className="font-medium">{tx.studentName}</p>
                      <p className="text-xs text-muted-foreground">{tx.matricNumber}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-mono text-xs">{tx.reference}</TableCell>
                    <TableCell className="py-3.5 px-4 num font-medium">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!tx.paystackReference || resync.isPending}
                        onClick={() => tx.paystackReference && resync.mutate(tx.paystackReference)}
                      >
                        <RotateCcwIcon className="h-4 w-4 mr-1.5" /> Re-sync
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}