"use client";

import * as React from "react";
import {
  PlusIcon,
  Trash2Icon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HistoryIcon,
  PencilIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  useExecutiveSessions,
  useCreateExecutiveSession,
  useDeleteExecutiveSession,
  usePastExecutives,
  useCreatePastExecutive,
  useUpdatePastExecutive,
  useUploadPastExecutiveImage,
  useDeletePastExecutive,
} from "@/hooks/use-executive-sessions";
import type { ExecutiveSession, PastExecutive } from "@/lib/api/executive-sessions";
import { EXECUTIVE_POSITIONS } from "@/lib/api/executives";
import { ApiClientError } from "@/lib/api/errors";

const LABEL_REGEX = /^\d{4}\/\d{4}$/;

// Past executives aren't restricted to a fixed enum (they may have held
// posts that predate the current structure), so this is offered as a
// quick-pick convenience only — the text field below it stays freely
// editable for anything not on this list.
const KNOWN_POSTS = Array.from(
  new Set([...EXECUTIVE_POSITIONS.LEADERSHIP, ...EXECUTIVE_POSITIONS.NRA]),
);

interface FormState {
  name: string;
  post: string;
}

const emptyForm: FormState = { name: "", post: "" };

function SessionDetail({ session, onBack }: { session: ExecutiveSession; onBack: () => void }) {
  const pastExecutivesQuery = usePastExecutives(session._id);
  const createMutation = useCreatePastExecutive(session._id);
  const updateMutation = useUpdatePastExecutive(session._id);
  const uploadImageMutation = useUploadPastExecutiveImage(session._id);
  const deleteMutation = useDeletePastExecutive(session._id);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PastExecutive | null>(null);

  const pastExecutives = React.useMemo(
    () => [...(pastExecutivesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [pastExecutivesQuery.data],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  }

  function openEditModal(pe: PastExecutive) {
    setEditingId(pe._id);
    setForm({ name: pe.name, post: pe.post });
    setImageFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.post) return;

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, input: { name: form.name, post: form.post } });
      if (imageFile) {
        await uploadImageMutation.mutateAsync({ id: editingId, file: imageFile });
      }
    } else {
      if (!imageFile) return;
      await createMutation.mutateAsync({ name: form.name, post: form.post, image: imageFile });
    }
    setModalOpen(false);
  }

  function move(pe: PastExecutive, direction: "up" | "down") {
    const index = pastExecutives.findIndex((p) => p._id === pe._id);
    const swapWith = direction === "up" ? pastExecutives[index - 1] : pastExecutives[index + 1];
    if (!swapWith) return;
    updateMutation.mutate({ id: pe._id, input: { displayOrder: swapWith.displayOrder } });
    updateMutation.mutate({ id: swapWith._id, input: { displayOrder: pe.displayOrder } });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session ${session.label}`}
        description="Past executives who served during this session."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeftIcon /> All sessions
            </Button>
            <Button onClick={openCreateModal}>
              <PlusIcon /> Add Executive
            </Button>
          </div>
        }
      />

      {pastExecutivesQuery.isLoading && <LoadingState />}
      {pastExecutivesQuery.isError && (
        <ErrorState
          message={
            pastExecutivesQuery.error instanceof ApiClientError ? pastExecutivesQuery.error.message : undefined
          }
          onRetry={() => pastExecutivesQuery.refetch()}
        />
      )}
      {pastExecutives.length === 0 && !pastExecutivesQuery.isLoading && !pastExecutivesQuery.isError && (
        <EmptyState icon={HistoryIcon} title="No executives added to this session yet" />
      )}

      {pastExecutives.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Post</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastExecutives.map((pe, index) => (
              <TableRow key={pe._id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === 0}
                      onClick={() => move(pe, "up")}
                    >
                      <ArrowUpIcon className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === pastExecutives.length - 1}
                      onClick={() => move(pe, "down")}
                    >
                      <ArrowDownIcon className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={pe.imageUrl} alt={pe.name} />
                    <AvatarFallback>{pe.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{pe.name}</TableCell>
                <TableCell>{pe.post}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditModal(pe)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setDeleteTarget(pe)}>
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
            <DialogTitle>{editingId ? "Edit Past Executive" : "Add Past Executive"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" htmlFor="pe-name">
              <Input
                id="pe-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Post" htmlFor="pe-post" hint="Pick a known post or type your own below.">
              <div className="space-y-2">
                <Select
                  value=""
                  onValueChange={(value) => setForm((f) => ({ ...f, post: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quick pick a post…" />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWN_POSTS.map((post) => (
                      <SelectItem key={post} value={post}>
                        {post}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="pe-post"
                  value={form.post}
                  onChange={(e) => setForm((f) => ({ ...f, post: e.target.value }))}
                  required
                />
              </div>
            </FormField>
            <FormField
              label="Photo"
              htmlFor="pe-image"
              hint={editingId ? "Leave blank to keep the current photo." : undefined}
            >
              <Input
                id="pe-image"
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
                {isSaving ? "Saving…" : editingId ? "Save changes" : "Add Executive"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete past executive"
        description={`This will permanently remove ${deleteTarget?.name ?? "this executive"} from the ${session.label} session.`}
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

export function PastExecutivesClient() {
  const sessionsQuery = useExecutiveSessions();
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);

  const selectedSession = sessionsQuery.data?.find((s) => s._id === selectedSessionId) ?? null;

  if (selectedSessionId && selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => setSelectedSessionId(null)}
      />
    );
  }

  return <SessionListWithSelect onSelect={setSelectedSessionId} />;
}

function SessionListWithSelect({ onSelect }: { onSelect: (id: string) => void }) {
  const sessionsQuery = useExecutiveSessions();
  const createMutation = useCreateExecutiveSession();
  const deleteMutation = useDeleteExecutiveSession();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [labelError, setLabelError] = React.useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<ExecutiveSession | null>(null);

  const sessions = sessionsQuery.data ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!LABEL_REGEX.test(label)) {
      setLabelError("Use the format YYYY/YYYY, e.g. 2024/2025");
      return;
    }
    const [start, end] = label.split("/").map((y) => parseInt(y, 10));
    if (end !== start + 1) {
      setLabelError("The second year must be exactly one year after the first");
      return;
    }
    setLabelError(undefined);
    await createMutation.mutateAsync(label);
    setLabel("");
    setCreateOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Past Executives"
        description="Sessions group past executives by year, e.g. 2024/2025."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon /> New Session
          </Button>
        }
      />

      {sessionsQuery.isLoading && <LoadingState />}
      {sessionsQuery.isError && (
        <ErrorState
          message={sessionsQuery.error instanceof ApiClientError ? sessionsQuery.error.message : undefined}
          onRetry={() => sessionsQuery.refetch()}
        />
      )}
      {sessions.length === 0 && !sessionsQuery.isLoading && !sessionsQuery.isError && (
        <EmptyState icon={HistoryIcon} title="No sessions yet" message="Create a session to start adding past executives." />
      )}

      {sessions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session._id}>
              <CardContent className="flex items-center justify-between pt-6">
                <button
                  className="text-lg font-semibold hover:underline"
                  onClick={() => onSelect(session._id)}
                >
                  {session.label}
                </button>
                <Button variant="outline" size="icon" onClick={() => setDeleteTarget(session)}>
                  <Trash2Icon className="size-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="Session label" htmlFor="session-label" error={labelError} hint="Format: YYYY/YYYY">
              <Input
                id="session-label"
                placeholder="2024/2025"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete session"
        description={`This will permanently remove the ${deleteTarget?.label ?? ""} session and every past executive in it.`}
        confirmLabel="Delete session"
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