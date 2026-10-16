"use client";

import * as React from "react";
import { PlusIcon, PencilIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, UsersIcon, UploadCloudIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useExecutives,
  useCreateExecutive,
  useUpdateExecutive,
  useUploadExecutiveImage,
  useReorderExecutive,
  useDeleteExecutive,
} from "@/hooks/use-executives";
import { EXECUTIVE_POSITIONS, type Executive, type ExecutiveGroup } from "@/lib/api/executives";
import { ApiClientError } from "@/lib/api/errors";

const GROUP_LABELS: Record<ExecutiveGroup, string> = {
  LEADERSHIP: "Leadership",
  NRA: "NRA Members",
};

interface FormState {
  position: string;
  name: string;
  whatsapp: string;
  email: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  github: string;
}

const emptyForm: FormState = {
  position: "",
  name: "",
  whatsapp: "",
  email: "",
  twitter: "",
  instagram: "",
  linkedin: "",
  github: "",
};

// ==========================================
// SUB-COMPONENTS (Defined inside the file)
// ==========================================

interface ExecutiveRowProps {
  executive: Executive;
  index: number;
  totalCount: number;
  onMove: (executive: Executive, direction: "up" | "down") => void;
  onToggleActive: (executive: Executive) => void;
  onEdit: (executive: Executive) => void;
  onDelete: (executive: Executive) => void;
}

function ExecutiveRow({
  executive,
  index,
  totalCount,
  onMove,
  onToggleActive,
  onEdit,
  onDelete,
}: ExecutiveRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled={index === 0}
            onClick={() => onMove(executive, "up")}
          >
            <ArrowUpIcon className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled={index === totalCount - 1}
            onClick={() => onMove(executive, "down")}
          >
            <ArrowDownIcon className="size-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Avatar>
          <AvatarImage src={executive.imageUrl} alt={executive.name} />
          <AvatarFallback>{executive.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell>{executive.position}</TableCell>
      <TableCell className="font-medium">{executive.name}</TableCell>
      <TableCell>
        <Badge variant={executive.isActive ? "default" : "secondary"}>
          {executive.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onToggleActive(executive)}>
            {executive.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(executive)}>
            <PencilIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(executive)}>
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ExecutivesTableProps {
  executives: Executive[];
  onMove: (executive: Executive, direction: "up" | "down") => void;
  onToggleActive: (executive: Executive) => void;
  onEdit: (executive: Executive) => void;
  onDelete: (executive: Executive) => void;
}

function ExecutivesTable({ executives, onMove, onToggleActive, onEdit, onDelete }: ExecutivesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>Photo</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executives.map((executive, index) => (
          <ExecutiveRow
            key={executive._id}
            executive={executive}
            index={index}
            totalCount={executives.length}
            onMove={onMove}
            onToggleActive={onToggleActive}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface ExecutiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  group: ExecutiveGroup;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

function ExecutiveDialog({
  open,
  onOpenChange,
  editingId,
  group,
  form,
  setForm,
  imageFile,
  setImageFile,
  onSubmit,
  isSaving,
}: ExecutiveDialogProps) {
  // Derive preview URL directly using useMemo instead of useEffect + setState
  const previewUrl = React.useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  // Clean up object URL when component unmounts or previewUrl changes to prevent memory leaks
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
          <DialogTitle>{editingId ? "Edit Executive" : "Add Executive"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5 pt-2">
          <FormField label="Position" htmlFor="position">
            <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
              <SelectTrigger id="position">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {EXECUTIVE_POSITIONS[group].map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Full Name" htmlFor="name">
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </FormField>

          {/* Enhanced Image Dropzone Component */}
          <FormField
            label="Profile Photo"
            htmlFor="image-dropzone"
            hint={editingId ? "Leave empty to keep the existing photo." : "PNG, JPG or WEBP (Max 5MB)"}
          >
            <div className="relative group mt-1">
              <input
                id="image-dropzone"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 z-20 size-full opacity-0 cursor-pointer"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required={!editingId}
              />
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-all text-center">
                {previewUrl ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="size-20 rounded-full object-cover shadow-md mb-2 border-2 border-primary/20"
                    />
                    <p className="text-xs font-medium text-foreground">{imageFile?.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Click or drag to replace image</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-3 rounded-full bg-background shadow-sm border border-border/50 mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloudIcon className="size-6 text-muted-foreground" />
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

          {/* Socials / Contacts Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Social Links & Contacts (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "WhatsApp", key: "whatsapp", placeholder: "+1234567890" },
                { label: "Email", key: "email", type: "email", placeholder: "name@example.com" },
                { label: "Twitter / X", key: "twitter", placeholder: "@username" },
                { label: "Instagram", key: "instagram", placeholder: "@username" },
                { label: "LinkedIn", key: "linkedin", placeholder: "in/username" },
                { label: "GitHub", key: "github", placeholder: "username" },
              ].map((field) => (
                <FormField key={field.key} label={field.label} htmlFor={field.key}>
                  <Input
                    id={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof FormState]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </FormField>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : editingId ? "Save changes" : "Add Executive"}
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

export function ExecutivesClient() {
  const [group, setGroup] = React.useState<ExecutiveGroup>("LEADERSHIP");
  const executivesQuery = useExecutives(group);
  const createMutation = useCreateExecutive();
  const updateMutation = useUpdateExecutive();
  const uploadImageMutation = useUploadExecutiveImage();
  const reorderMutation = useReorderExecutive();
  const deleteMutation = useDeleteExecutive();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Executive | null>(null);

  const executives = React.useMemo(
    () => [...(executivesQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [executivesQuery.data],
  );

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  }

  function openEditModal(executive: Executive) {
    setEditingId(executive._id);
    setForm({
      position: executive.position,
      name: executive.name,
      whatsapp: executive.contacts?.whatsapp ?? "",
      email: executive.contacts?.email ?? "",
      twitter: executive.contacts?.twitter ?? "",
      instagram: executive.contacts?.instagram ?? "",
      linkedin: executive.contacts?.linkedin ?? "",
      github: executive.contacts?.github ?? "",
    });
    setImageFile(null);
    setModalOpen(true);
  }

  function buildContacts() {
    const contacts = {
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      twitter: form.twitter || undefined,
      instagram: form.instagram || undefined,
      linkedin: form.linkedin || undefined,
      github: form.github || undefined,
    };
    const hasAny = Object.values(contacts).some(Boolean);
    return hasAny ? contacts : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.position || !form.name) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        input: { position: form.position, name: form.name, contacts: buildContacts() },
      });
      if (imageFile) {
        await uploadImageMutation.mutateAsync({ id: editingId, file: imageFile });
      }
    } else {
      if (!imageFile) return;
      await createMutation.mutateAsync({
        group,
        position: form.position,
        name: form.name,
        contacts: buildContacts(),
        image: imageFile,
      });
    }
    setModalOpen(false);
  }

  function move(executive: Executive, direction: "up" | "down") {
    const index = executives.findIndex((e) => e._id === executive._id);
    const swapWith = direction === "up" ? executives[index - 1] : executives[index + 1];
    if (!swapWith) return;
    reorderMutation.mutate({ id: executive._id, displayOrder: swapWith.displayOrder });
    reorderMutation.mutate({ id: swapWith._id, displayOrder: executive.displayOrder });
  }

  function handleToggleActive(executive: Executive) {
    updateMutation.mutate({
      id: executive._id,
      input: { isActive: !executive.isActive },
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executives"
        description="Main College Leadership and NRA Members."
        actions={
          <Button onClick={openCreateModal}>
            <PlusIcon /> Add Executive
          </Button>
        }
      />

      <Tabs value={group} onValueChange={(v) => setGroup(v as ExecutiveGroup)}>
        <TabsList>
          <TabsTrigger value="LEADERSHIP">Leadership</TabsTrigger>
          <TabsTrigger value="NRA">NRA Members</TabsTrigger>
        </TabsList>
      </Tabs>

      {executivesQuery.isLoading && <LoadingState />}
      {executivesQuery.isError && (
        <ErrorState
          message={
            executivesQuery.error instanceof ApiClientError ? executivesQuery.error.message : undefined
          }
          onRetry={() => executivesQuery.refetch()}
        />
      )}
      {executives.length === 0 && !executivesQuery.isLoading && !executivesQuery.isError && (
        <EmptyState icon={UsersIcon} title={`No ${GROUP_LABELS[group]} executives yet`} />
      )}

      {executives.length > 0 && (
        <ExecutivesTable
          executives={executives}
          onMove={move}
          onToggleActive={handleToggleActive}
          onEdit={openEditModal}
          onDelete={(executive) => setDeleteTarget(executive)}
        />
      )}

      <ExecutiveDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingId={editingId}
        group={group}
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
        title="Delete executive"
        description={`This will permanently remove ${deleteTarget?.name ?? "this executive"} from the site.`}
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