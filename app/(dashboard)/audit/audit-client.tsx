"use client";

import * as React from "react";
import { ScrollTextIcon, SearchIcon } from "lucide-react";
import { useAuditLogs } from "@/hooks/use-audit";
import { formatDateTime, debounce } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { DataPagination } from "@/components/shared/data-pagination";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApiClientError } from "@/lib/api/errors";

export function AuditClient() {
  const [actionInput, setActionInput] = React.useState("");
  const [action, setAction] = React.useState("");
  const [page, setPage] = React.useState(1);

  const debouncedSetAction = React.useMemo(() => debounce((v: string) => { setAction(v); setPage(1); }, 350), []);

  const logs = useAuditLogs({ action: action || undefined, page, limit: 25 });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Audit log" description="A record of administrative actions across the platform." />

      <div className="relative w-full sm:max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by action…"
          className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
          value={actionInput}
          onChange={(e) => {
            setActionInput(e.target.value);
            debouncedSetAction(e.target.value);
          }}
        />
      </div>

      {logs.isLoading && <LoadingState />}
      {logs.isError && (
        <ErrorState message={logs.error instanceof ApiClientError ? logs.error.message : undefined} onRetry={() => logs.refetch()} />
      )}
      {logs.data && logs.data.logs.length === 0 && (
        <EmptyState icon={ScrollTextIcon} title="No matching entries" />
      )}

      {logs.data && logs.data.logs.length > 0 && (
        <Card className="overflow-hidden p-0 border shadow-sm">
          {/* Mobile View */}
          <div className="block sm:hidden divide-y">
            {logs.data.logs.map((entry) => (
              <div key={entry._id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{entry.userEmail}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.ipAddress}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
                    {entry.userRole}
                  </Badge>
                </div>
                <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all text-foreground">
                  {entry.action}
                </div>
                <div className="text-[11px] text-muted-foreground text-right">
                  {formatDateTime(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.logs.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <p className="font-medium">{entry.userEmail}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">{entry.userRole}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.ipAddress}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(entry.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {logs.data && (
        <DataPagination page={logs.data.page} limit={logs.data.limit} total={logs.data.total} onPageChange={setPage} />
      )}
    </div>
  );
}