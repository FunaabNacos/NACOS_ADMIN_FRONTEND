"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Building2Icon, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useTenants, useCreateTenant } from "@/hooks/use-tenants";
import type { TenantStatus, TenantType } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { DataPagination } from "@/components/shared/data-pagination";
import { TenantStatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApiClientError } from "@/lib/api/errors";

const createSchema = z.object({
  name: z.string().min(2, "Must be at least 2 characters"),
  type: z.enum(["COLLEGE", "DEPARTMENT"]),
});
type CreateValues = z.infer<typeof createSchema>;

export function TenantsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [type, setType] = React.useState<TenantType | "ALL">("ALL");
  const [status, setStatus] = React.useState<TenantStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const tenants = useTenants({
    type: type === "ALL" ? undefined : type,
    status: status === "ALL" ? undefined : status,
    page,
    limit: 20,
  });

  const canCreate = user?.role === "super_admin" || user?.role === "main_admin";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tenants"
        description="Associations onboarded onto the platform."
        actions={
          canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" /> New tenant
            </Button>
          )
        }
      />

      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => { setType(v as typeof type); setPage(1); }}>
          <SelectTrigger className="h-9 text-xs sm:text-sm w-[130px] sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="COLLEGE">College</SelectItem>
            <SelectItem value="DEPARTMENT">Department</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="h-9 text-xs sm:text-sm w-[130px] sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="FROZEN">Frozen</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tenants.isLoading && <LoadingState />}
      {tenants.isError && (
        <ErrorState
          message={tenants.error instanceof ApiClientError ? tenants.error.message : undefined}
          onRetry={() => tenants.refetch()}
        />
      )}
      {tenants.data && tenants.data.tenants.length === 0 && (
        <EmptyState icon={Building2Icon} title="No tenants found" message="Try adjusting your filters." />
      )}

      {tenants.data && tenants.data.tenants.length > 0 && (
        <Card className="overflow-hidden p-0 border shadow-sm">
          {/* Mobile view (< sm) */}
          <div className="block sm:hidden divide-y">
            {tenants.data.tenants.map((tenant) => (
              <Link 
                key={tenant._id} 
                href={`/tenants/${tenant._id}`}
                className="flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{tenant.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {tenant.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tenant.type === "COLLEGE" ? "College" : "Department"}</span>
                    <span>•</span>
                    <TenantStatusBadge status={tenant.status} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>

          {/* Desktop view (sm and up) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.data.tenants.map((tenant) => (
                  <TableRow 
                    key={tenant._id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/tenants/${tenant._id}`)}
                  >
                    <TableCell>
                      <Link 
                        href={`/tenants/${tenant._id}`} 
                        className="font-medium hover:text-primary underline-offset-4 hover:underline"
                        onClick={(e) => e.stopPropagation()} // Let the row click handle standard clicks, keep link for control/cmd-clicks
                      >
                        {tenant.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tenant.code}</TableCell>
                    <TableCell>{tenant.type === "COLLEGE" ? "College" : "Department"}</TableCell>
                    <TableCell><TenantStatusBadge status={tenant.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {tenants.data && (
        <DataPagination
          page={tenants.data.page}
          limit={tenants.data.limit}
          total={tenants.data.total}
          onPageChange={setPage}
        />
      )}

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateTenantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createTenant = useCreateTenant();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", type: "DEPARTMENT" },
  });

  async function onSubmit(values: CreateValues) {
    try {
      await createTenant.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch {
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>New tenant</DialogTitle>
          <DialogDescription>Create a new association tenant directly (skips the onboarding review flow).</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" {...form.register("name")} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLEGE">College</SelectItem>
                    <SelectItem value="DEPARTMENT">Department</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createTenant.isPending}>
              {createTenant.isPending ? "Creating…" : "Create tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}