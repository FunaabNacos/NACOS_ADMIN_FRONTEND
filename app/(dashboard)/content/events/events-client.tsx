"use client";

import * as React from "react";
import { PlusIcon, PencilIcon, Trash2Icon, CalendarDaysIcon, UploadCloudIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  useCommunityEvents,
  useCreateEvent,
  useUpdateEvent,
  useUploadEventImage,
  useDeleteEvent,
} from "@/hooks/use-community-events";
import type { CommunityEvent } from "@/lib/api/community-events";
import { ApiClientError } from "@/lib/api/errors";

interface FormState {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
}

const emptyForm: FormState = { title: "", description: "", date: "", location: "", category: "" };

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

// ==========================================
// SUB-COMPONENTS (Defined inside the file)
// ==========================================

interface EventRowProps {
  event: CommunityEvent;
  onTogglePublish: (event: CommunityEvent) => void;
  onEdit: (event: CommunityEvent) => void;
  onDelete: (event: CommunityEvent) => void;
}

function EventRow({ event, onTogglePublish, onEdit, onDelete }: EventRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{event.title}</TableCell>
      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
      <TableCell>{event.location}</TableCell>
      <TableCell>{event.category}</TableCell>
      <TableCell>
        <Badge variant={event.isActive ? "default" : "secondary"}>
          {event.isActive ? "Published" : "Unpublished"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onTogglePublish(event)}>
            {event.isActive ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(event)}>
            <PencilIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(event)}>
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface EventsTableProps {
  events: CommunityEvent[];
  onTogglePublish: (event: CommunityEvent) => void;
  onEdit: (event: CommunityEvent) => void;
  onDelete: (event: CommunityEvent) => void;
}

function EventsTable({ events, onTogglePublish, onEdit, onDelete }: EventsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <EventRow
            key={event._id}
            event={event}
            onTogglePublish={onTogglePublish}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

function EventDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  imageFile,
  setImageFile,
  onSubmit,
  isSaving,
}: EventDialogProps) {
  // Derive preview URL safely via useMemo to prevent cascading render/effect lint warnings
  const previewUrl = React.useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  // Cleanup blob storage URL when unmounting or changing preview
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <FormField label="Title" htmlFor="event-title">
            <Input
              id="event-title"
              placeholder="e.g. Annual Tech Summit"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Description (optional)" htmlFor="event-description">
            <Textarea
              id="event-description"
              rows={3}
              placeholder="Provide details about the event..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" htmlFor="event-date">
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Category" htmlFor="event-category" hint="Free text, e.g. Workshop">
              <Input
                id="event-category"
                placeholder="e.g. Workshop"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </FormField>
          </div>

          <FormField label="Location" htmlFor="event-location">
            <Input
              id="event-location"
              placeholder="e.g. Main Auditorium / Virtual"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              required
            />
          </FormField>

          {/* Enhanced Drag and Drop Image Uploader */}
          <FormField
            label="Event Banner / Photo (optional)"
            htmlFor="event-image-dropzone"
            hint="PNG, JPG or WEBP (Max 5MB)"
          >
            <div className="relative group mt-1">
              <input
                id="event-image-dropzone"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 z-20 size-full opacity-0 cursor-pointer"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-all text-center">
                {previewUrl ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Event Preview"
                      className="h-24 w-auto max-w-xs rounded-lg object-cover shadow-md mb-2 border border-primary/20"
                    />
                    <p className="text-xs font-medium text-foreground">{imageFile?.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Click or drag to replace image</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-3 rounded-full bg-background shadow-sm border border-border/50 mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloudIcon className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-primary underline underline-offset-2">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or WEBP</p>
                  </div>
                )}
              </div>
            </div>
          </FormField>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : editingId ? "Save changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function EventsClient() {
  const eventsQuery = useCommunityEvents();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const uploadImageMutation = useUploadEventImage();
  const deleteMutation = useDeleteEvent();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CommunityEvent | null>(null);

  const events = React.useMemo(
    () =>
      [...(eventsQuery.data ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [eventsQuery.data],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  }

  function openEditModal(event: CommunityEvent) {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description ?? "",
      date: toDateInputValue(event.date),
      location: event.location,
      category: event.category,
    });
    setImageFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date || !form.location || !form.category) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        input: {
          title: form.title,
          description: form.description || undefined,
          date: form.date,
          location: form.location,
          category: form.category,
        },
      });
      if (imageFile) {
        await uploadImageMutation.mutateAsync({ id: editingId, file: imageFile });
      }
    } else {
      await createMutation.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        date: form.date,
        location: form.location,
        category: form.category,
        image: imageFile ?? undefined,
      });
    }
    setModalOpen(false);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Events"
        description="Events shown on the homepage — upcoming and past."
        actions={
          <Button onClick={openCreateModal}>
            <PlusIcon /> Add Event
          </Button>
        }
      />

      {eventsQuery.isLoading && <LoadingState />}
      {eventsQuery.isError && (
        <ErrorState
          message={eventsQuery.error instanceof ApiClientError ? eventsQuery.error.message : undefined}
          onRetry={() => eventsQuery.refetch()}
        />
      )}
      {events.length === 0 && !eventsQuery.isLoading && !eventsQuery.isError && (
        <EmptyState icon={CalendarDaysIcon} title="No events yet" />
      )}

      {events.length > 0 && (
        <EventsTable
          events={events}
          onTogglePublish={(event) =>
            updateMutation.mutate({ id: event._id, input: { isActive: !event.isActive } })
          }
          onEdit={openEditModal}
          onDelete={(event) => setDeleteTarget(event)}
        />
      )}

      <EventDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        imageFile={imageFile}
        setImageFile={setImageFile}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete event"
        description={`This will permanently remove "${deleteTarget?.title ?? ""}" from the site.`}
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