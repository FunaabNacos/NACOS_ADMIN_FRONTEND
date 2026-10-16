"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, KeyRoundIcon, UnlockIcon, UserXIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useTenants } from "@/hooks/use-tenants";
import {
  useAdminUsers,
  useFinanceDirectors,
  useCreateMainAdmin,
  useCreateFinanceDirector,
  useDeleteFinanceDirector,
  useResetUserPassword,
  useUnlockUser,
  useDeactivateUser,
} from "@/hooks/use-users";
import { formatRole } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/shared/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreHorizontalIcon } from "lucide-react";
import type { AdminUser } from "@/lib/types";
import { ApiClientError } from "@/lib/api/errors";

export function UsersClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Users" description="Manage admin accounts across the platform." />
      <Tabs defaultValue={isSuperAdmin ? "admins" : "finance-directors"}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          {isSuperAdmin && <TabsTrigger value="admins">Admins</TabsTrigger>}
          <TabsTrigger value="finance-directors">Finance Directors</TabsTrigger>
        </TabsList>
        {isSuperAdmin && (
          <TabsContent value="admins" className="mt-4">
            <AdminsTab />
          </TabsContent>
        )}
        <TabsContent value="finance-directors" className="mt-4">
          <FinanceDirectorsTab isSuperAdmin={isSuperAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserActionsMenu({
  targetUser,
  isSuperAdmin,
  onDelete,
}: {
  targetUser: AdminUser;
  isSuperAdmin: boolean;
  onDelete?: () => void;
}) {
  const resetPassword = useResetUserPassword();
  const unlock = useUnlockUser();
  const deactivate = useDeactivateUser();
  const [confirmDeactivate, setConfirmDeactivate] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontalIcon className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => resetPassword.mutate(targetUser._id)}>
            <KeyRoundIcon className="mr-2 h-4 w-4" /> Reset password
          </DropdownMenuItem>
          {targetUser.lockedUntil && (
            <DropdownMenuItem onClick={() => unlock.mutate(targetUser._id)}>
              <UnlockIcon className="mr-2 h-4 w-4" /> Unlock account
            </DropdownMenuItem>
          )}
          {isSuperAdmin && targetUser.isActive && (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDeactivate(true)}>
              <UserXIcon className="mr-2 h-4 w-4" /> Deactivate
            </DropdownMenuItem>
          )}
          {isSuperAdmin && onDelete && (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2Icon className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate this user?"
        description={`${targetUser.fullName} will no longer be able to sign in.`}
        destructive
        confirmLabel="Deactivate"
        isLoading={deactivate.isPending}
        onConfirm={() => deactivate.mutate(targetUser._id, { onSuccess: () => setConfirmDeactivate(false) })}
      />
    </>
  );
}

function UserStatusBadge({ user }: { user: AdminUser }) {
  if (!user.isActive) {
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Deactivated</Badge>;
  }
  if (user.lockedUntil) {
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-amber-500 text-amber-500">Locked</Badge>;
  }
  return <Badge className="text-[10px] px-1.5 py-0.5">Active</Badge>;
}

function AdminsTab() {
  const admins = useAdminUsers();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1" /> New admin
        </Button>
      </div>

      {admins.isLoading && <LoadingState />}
      {admins.isError && (
        <ErrorState message={admins.error instanceof ApiClientError ? admins.error.message : undefined} onRetry={() => admins.refetch()} />
      )}
      {admins.data && admins.data.length === 0 && <EmptyState icon={UsersIcon} title="No admins yet" />}

      {admins.data && admins.data.length > 0 && (
        <Card className="overflow-hidden p-0 border shadow-sm">
          {/* Mobile View */}
          <div className="block sm:hidden divide-y">
            {admins.data.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3.5 gap-2">
                <div className="space-y-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{u.fullName}</span>
                    <UserStatusBadge user={u} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{formatRole(u.role)}</p>
                </div>
                <div className="shrink-0">
                  <UserActionsMenu targetUser={u} isSuperAdmin />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.data.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{formatRole(u.role)}</TableCell>
                    <TableCell><UserStatusBadge user={u} /></TableCell>
                    <TableCell className="text-right">
                      <UserActionsMenu targetUser={u} isSuperAdmin />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreateMainAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function FinanceDirectorsTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const directors = useFinanceDirectors();
  const deleteFd = useDeleteFinanceDirector();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1" /> New finance director
        </Button>
      </div>

      {directors.isLoading && <LoadingState />}
      {directors.isError && (
        <ErrorState message={directors.error instanceof ApiClientError ? directors.error.message : undefined} onRetry={() => directors.refetch()} />
      )}
      {directors.data && directors.data.length === 0 && <EmptyState icon={UsersIcon} title="No finance directors yet" />}

      {directors.data && directors.data.length > 0 && (
        <Card className="overflow-hidden p-0 border shadow-sm">
          {/* Mobile View */}
          <div className="block sm:hidden divide-y">
            {directors.data.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3.5 gap-2">
                <div className="space-y-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{u.fullName}</span>
                    <UserStatusBadge user={u} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="shrink-0">
                  <UserActionsMenu
                    targetUser={u}
                    isSuperAdmin={isSuperAdmin}
                    onDelete={isSuperAdmin ? () => setDeleteTarget(u) : undefined}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {directors.data.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><UserStatusBadge user={u} /></TableCell>
                    <TableCell className="text-right">
                      <UserActionsMenu
                        targetUser={u}
                        isSuperAdmin={isSuperAdmin}
                        onDelete={isSuperAdmin ? () => setDeleteTarget(u) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreateFinanceDirectorDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this finance director?"
        description={`${deleteTarget?.fullName ?? ""} will lose access, and their tenant will need a new Finance Director assigned.`}
        destructive
        confirmLabel="Remove"
        isLoading={deleteFd.isPending}
        onConfirm={() => deleteTarget && deleteFd.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </div>
  );
}

const mainAdminSchema = z.object({
  fullName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});
type MainAdminValues = z.infer<typeof mainAdminSchema>;

function CreateMainAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMainAdmin = useCreateMainAdmin();
  const form = useForm<MainAdminValues>({ resolver: zodResolver(mainAdminSchema), defaultValues: { fullName: "", email: "" } });

  async function onSubmit(values: MainAdminValues) {
    try {
      await createMainAdmin.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch {
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>New admin</DialogTitle>
          <DialogDescription>They&apos;ll receive a temporary password by email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
            <Input id="fullName" {...form.register("fullName")} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" {...form.register("email")} />
          </FormField>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createMainAdmin.isPending}>
              {createMainAdmin.isPending ? "Creating…" : "Create admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const fdSchema = z.object({
  fullName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  tenantId: z.string().min(1, "Select a tenant"),
});
type FdValues = z.infer<typeof fdSchema>;

function CreateFinanceDirectorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createFd = useCreateFinanceDirector();
  const tenants = useTenants({ limit: 100, status: "ACTIVE" });
  const form = useForm<FdValues>({ resolver: zodResolver(fdSchema), defaultValues: { fullName: "", email: "", tenantId: "" } });

  async function onSubmit(values: FdValues) {
    try {
      await createFd.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch {
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>New finance director</DialogTitle>
          <DialogDescription>They&apos;ll receive a temporary password by email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Full name" htmlFor="fdFullName" error={form.formState.errors.fullName?.message}>
            <Input id="fdFullName" {...form.register("fullName")} />
          </FormField>
          <FormField label="Email" htmlFor="fdEmail" error={form.formState.errors.email?.message}>
            <Input id="fdEmail" type="email" {...form.register("email")} />
          </FormField>
          <FormField label="Tenant" htmlFor="fdTenantId" error={form.formState.errors.tenantId?.message}>
            <Controller
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="fdTenantId"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants.data?.tenants.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createFd.isPending}>
              {createFd.isPending ? "Creating…" : "Create finance director"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}