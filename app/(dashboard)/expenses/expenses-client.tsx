"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, RotateCcwIcon, Trash2Icon, ReceiptIcon } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useTenants } from "@/hooks/use-tenants";
import { useExpenses, useCreateExpense, useDeleteExpense, useRestoreExpense } from "@/hooks/use-expenses";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  title: z.string().min(1, "Required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  date: z.string().min(1, "Required"),
  category: z.enum(EXPENSE_CATEGORIES),
  note: z.string().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

export function ExpensesClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const tenantsQuery = useTenants({ limit: 100, status: "ACTIVE" });
  const [tenantIdOverride, setTenantIdOverride] = React.useState<string | undefined>(
    isSuperAdmin ? undefined : (user?.tenantId ?? undefined)
  );
  const tenantId =
    tenantIdOverride ?? (isSuperAdmin ? tenantsQuery.data?.tenants[0]?._id : undefined);
  const setTenantId = setTenantIdOverride;
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const expenses = useExpenses(tenantId, includeDeleted);
  const deleteExpense = useDeleteExpense();
  const restoreExpense = useRestoreExpense();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and record association spending."
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={!tenantId}>
            <PlusIcon /> New expense
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        {isSuperAdmin && (
          <Select value={tenantId ?? ""} onValueChange={setTenantId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
            <SelectContent>
              {tenantsQuery.data?.tenants.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Switch id="includeDeleted" checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
          <Label htmlFor="includeDeleted" className="text-sm text-muted-foreground">Show deleted</Label>
        </div>
      </div>

      {!tenantId && <EmptyState title="Select a tenant" message="Choose a tenant above to view its expenses." />}

      {tenantId && expenses.isLoading && <LoadingState />}
      {tenantId && expenses.isError && (
        <ErrorState
          message={expenses.error instanceof ApiClientError ? expenses.error.message : undefined}
          onRetry={() => expenses.refetch()}
        />
      )}
      {tenantId && expenses.data && expenses.data.length === 0 && (
        <EmptyState icon={ReceiptIcon} title="No expenses recorded" message="Record your first expense to get started." />
      )}

      {tenantId && expenses.data && expenses.data.length > 0 && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.data.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate font-medium">{expense.title}</p>
                    {expense.isDeleted && <Badge variant="secondary" className="mt-1">Deleted</Badge>}
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell className="num">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="text-right">
                    {expense.isDeleted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Restore"
                        disabled={restoreExpense.isPending}
                        onClick={() => restoreExpense.mutate({ id: expense._id, tenantId })}
                      >
                        <RotateCcwIcon className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        disabled={deleteExpense.isPending}
                        onClick={() => deleteExpense.mutate({ id: expense._id, tenantId })}
                      >
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {tenantId && (
        <CreateExpenseDialog open={createOpen} onOpenChange={setCreateOpen} tenantId={isSuperAdmin ? tenantId : undefined} />
      )}
    </div>
  );
}

function CreateExpenseDialog({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
}) {
  const createExpense = useCreateExpense();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: "Miscellaneous",
      note: "",
    },
  });

  async function onSubmit(values: CreateValues) {
    try {
      await createExpense.mutateAsync({ ...values, tenantId });
      form.reset();
      onOpenChange(false);
    } catch {
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
          <DialogDescription>Record a new spending entry for this session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Title" htmlFor="title" error={form.formState.errors.title?.message}>
            <Input id="title" {...form.register("title")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount (₦)" htmlFor="amount" error={form.formState.errors.amount?.message}>
              <Input id="amount" type="number" min={0} step="0.01" {...form.register("amount")} />
            </FormField>
            <FormField label="Date" htmlFor="date" error={form.formState.errors.date?.message}>
              <Input id="date" type="date" {...form.register("date")} />
            </FormField>
          </div>
          <FormField label="Category" htmlFor="category">
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Note (optional)" htmlFor="note">
            <Input id="note" {...form.register("note")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? "Saving…" : "Record expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}