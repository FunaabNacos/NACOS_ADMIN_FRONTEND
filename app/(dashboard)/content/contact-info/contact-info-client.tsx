"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useContactInfo, useUpdateContactInfo } from "@/hooks/use-contact-info";
import { useExecutives } from "@/hooks/use-executives";
import { ApiClientError } from "@/lib/api/errors";

const FINANCIAL_DIRECTOR_POSITION = "Financial Secretary";
const SOFTWARE_DIRECTOR_POSITION = "Director of Software, Research and Innovation";
const NONE_VALUE = "__none__";

type Executive = {
  _id: string;
  name: string;
  position: string;
  isActive: boolean;
  imageUrl: string;
  contacts?: { whatsapp?: string; email?: string };
};

type ContactInfoData = {
  financialDirectorExecutiveId: string | null;
  softwareDirectorExecutiveId: string | null;
};

function SlotPicker({
  label,
  position,
  candidates,
  value,
  onChange,
}: {
  label: string;
  position: string;
  candidates: Executive[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const selected = candidates.find((c) => c._id === value) ?? null;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <FormField label={label} htmlFor={`slot-${position}`} hint={`Filtered to executives holding "${position}".`}>
          <Select
            value={value ?? NONE_VALUE}
            onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
          >
            <SelectTrigger id={`slot-${position}`}>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Not set</SelectItem>
              {candidates.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {selected ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar>
              <AvatarImage src={selected.imageUrl} alt={selected.name} />
              <AvatarFallback>{selected.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {selected.contacts?.whatsapp || "No WhatsApp"} · {selected.contacts?.email || "No email"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {candidates.length === 0
              ? `No executive currently holds "${position}".`
              : "Nothing selected — this contact card will be hidden on the site."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ContactInfoForm({
  initialData,
  executives,
}: {
  initialData: ContactInfoData;
  executives: Executive[];
}) {
  const updateMutation = useUpdateContactInfo();

  const [financialId, setFinancialId] = React.useState<string | null>(
    initialData.financialDirectorExecutiveId
  );
  const [softwareId, setSoftwareId] = React.useState<string | null>(
    initialData.softwareDirectorExecutiveId
  );

  const financialCandidates = executives.filter(
    (e) => e.position === FINANCIAL_DIRECTOR_POSITION && e.isActive,
  );
  const softwareCandidates = executives.filter(
    (e) => e.position === SOFTWARE_DIRECTOR_POSITION && e.isActive,
  );

  async function handleSave() {
    await updateMutation.mutateAsync({
      financialDirectorExecutiveId: financialId,
      softwareDirectorExecutiveId: softwareId,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Info"
        description="Financial Director and Software Director contacts, pulled live from the matching Executive."
        actions={
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SlotPicker
          label="Financial Director contact"
          position={FINANCIAL_DIRECTOR_POSITION}
          candidates={financialCandidates}
          value={financialId}
          onChange={setFinancialId}
        />
        <SlotPicker
          label="Software Director contact"
          position={SOFTWARE_DIRECTOR_POSITION}
          candidates={softwareCandidates}
          value={softwareId}
          onChange={setSoftwareId}
        />
      </div>
    </div>
  );
}

export function ContactInfoClient() {
  const contactInfo = useContactInfo();
  const executives = useExecutives();

  const isLoading = contactInfo.isLoading || executives.isLoading;
  const isError = contactInfo.isError || executives.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contact Info"
          description="Financial Director and Software Director contacts, pulled live from the matching Executive."
        />
        <LoadingState />
      </div>
    );
  }

  if (isError || !contactInfo.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contact Info"
          description="Financial Director and Software Director contacts, pulled live from the matching Executive."
        />
        <ErrorState
          message={
            contactInfo.error instanceof ApiClientError
              ? contactInfo.error.message
              : executives.error instanceof ApiClientError
                ? executives.error.message
                : undefined
          }
          onRetry={() => {
            contactInfo.refetch();
            executives.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <ContactInfoForm
      initialData={contactInfo.data}
      executives={executives.data ?? []}
    />
  );
}