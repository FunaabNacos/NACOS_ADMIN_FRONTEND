"use client";

import * as React from "react";
import { PlusIcon, PencilIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, TrophyIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useHallOfFame,
  useCreateHallOfFameEntry,
  useUpdateHallOfFameEntry,
  useUploadHallOfFameImage,
  useDeleteHallOfFameEntry,
} from "@/hooks/use-hall-of-fame";
import type { HallOfFameEntry } from "@/lib/api/hall-of-fame";
import { ApiClientError } from "@/lib/api/errors";

interface FormState {
  name: string;
  post: string;
  contribution: string;
}

const emptyForm: FormState = { name: "", post: "", contribution: "" };

export function HallOfFameClient() {
  const entriesQuery = useHallOfFame();
  const createMutation = useCreateHallOfFameEntry();
  const updateMutation = useUpdateHallOfFameEntry();
  const uploadImageMutation = useUploadHallOfFameImage();
  const deleteMutation = useDeleteHallOfFameEntry();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<HallOfFameEntry | null>(null);

  const entries = React.useMemo(
    () => [...(entriesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [entriesQuery.data],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  }

  function openEditModal(entry: HallOfFameEntry) {
    setEditingId(entry._id);
    setForm({ name: entry.name, post: entry.post ?? "", contribution: entry.contribution });
    setImageFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.contribution) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        input: { name: form.name, post: form.post || undefined, contribution: form.contribution },
      });
      if (imageFile) {
        await uploadImageMutation.mutateAsync({ id: editingId, file: imageFile });
      }
    } else {
      if (!imageFile) return;
      await createMutation.mutateAsync({
        name: form.name,
        post: form.post || undefined,
        contribution: form.contribution,
        image: imageFile,
      });
    }
    setModalOpen(false);
  }

  function move(entry: HallOfFameEntry, direction: "up" | "down") {
    const index = entries.findIndex((e) => e._id === entry._id);
    const swapWith = direction === "up" ? entries[index - 1] : entries[index + 1];
    if (!swapWith) return;
    updateMutation.mutate({ id: entry._id, input: { displayOrder: swapWith.displayOrder } });
    updateMutation.mutate({ id: swapWith._id, input: { displayOrder: entry.displayOrder } });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hall of Fame"
        description="Inductees and their contributions to the association."
        actions={
          <Button onClick={openCreateModal}>
            <PlusIcon /> Add Inductee
          </Button>
        }
      />

      {entriesQuery.isLoading && <LoadingState />}
      {entriesQuery.isError && (
        <ErrorState
          message={entriesQuery.error instanceof ApiClientError ? entriesQuery.error.message : undefined}
          onRetry={() => entriesQuery.refetch()}
        />
      )}
      {entries.length === 0 && !entriesQuery.isLoading && !entriesQuery.isError && (
        <EmptyState icon={TrophyIcon} title="No inductees yet" />
      )}

      {entries.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={entry._id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === 0}
                      onClick={() => move(entry, "up")}
                    >
                      <ArrowUpIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === entries.length - 1}
                      onClick={() => move(entry, "down")}
                    >
                      <ArrowDownIcon className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={entry.imageUrl} alt={entry.name} />
                    <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell>{entry.post || "—"}</TableCell>
                <TableCell>
                  <Badge variant={entry.isActive ? "default" : "secondary"}>
                    {entry.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({ id: entry._id, input: { isActive: !entry.isActive } })
                      }
                    >
                      {entry.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditModal(entry)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setDeleteTarget(entry)}>
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Inductee" : "Add Inductee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" htmlFor="hof-name">
              <Input
                id="hof-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Post (optional)" htmlFor="hof-post">
              <Input
                id="hof-post"
                value={form.post}
                onChange={(e) => setForm((f) => ({ ...f, post: e.target.value }))}
              />
            </FormField>

            <FormField label="Contribution" htmlFor="hof-contribution">
              <Textarea
                id="hof-contribution"
                rows={4}
                value={form.contribution}
                onChange={(e) => setForm((f) => ({ ...f, contribution: e.target.value }))}
                required
              />
            </FormField>

            <FormField
              label="Photo"
              htmlFor="hof-image"
              hint={editingId ? "Leave blank to keep the current photo." : undefined}
            >
              <Input
                id="hof-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required={!editingId}
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : editingId ? "Save changes" : "Add Inductee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete inductee"
        description={`This will permanently remove ${deleteTarget?.name ?? "this inductee"} from the Hall of Fame.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget._id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
