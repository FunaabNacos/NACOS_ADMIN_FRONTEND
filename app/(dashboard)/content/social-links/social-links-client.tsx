"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState } from "@/components/shared/state";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useSocialLinks, useUpdateSocialLinks } from "@/hooks/use-social-links";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/api/social-links";
import { ApiClientError } from "@/lib/api/errors";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  twitter: "X / Twitter",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
};

type FormState = Record<SocialPlatform, { url: string; isVisible: boolean }>;

const emptyForm: FormState = SOCIAL_PLATFORMS.reduce((acc, platform) => {
  acc[platform] = { url: "", isVisible: false };
  return acc;
}, {} as FormState);

function SocialLinksForm({ initialData }: { initialData: FormState }) {
  const updateMutation = useUpdateSocialLinks();
  
  const [form, setForm] = React.useState<FormState>(() => ({
    ...emptyForm,
    ...initialData,
  }));

  async function handleSave() {
    await updateMutation.mutateAsync(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Links"
        description="Toggle visibility and set the URL for each platform."
        actions={
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <Card>
        <CardContent className="divide-y divide-border pt-6">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <Switch
                checked={form[platform]?.isVisible ?? false}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    [platform]: { ...f[platform], isVisible: checked },
                  }))
                }
              />
              <FormField
                label={PLATFORM_LABELS[platform]}
                htmlFor={`platform-${platform}`}
                className="flex-1 space-y-1.5"
              >
                <Input
                  id={`platform-${platform}`}
                  placeholder={`https://...`}
                  value={form[platform]?.url ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [platform]: { ...f[platform], url: e.target.value },
                    }))
                  }
                />
              </FormField>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SocialLinksClient() {
  const socialLinks = useSocialLinks();

  if (socialLinks.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Social Links"
          description="Toggle visibility and set the URL for each platform."
        />
        <LoadingState />
      </div>
    );
  }

  if (socialLinks.isError || !socialLinks.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Social Links"
          description="Toggle visibility and set the URL for each platform."
        />
        <ErrorState
          message={
            socialLinks.error instanceof ApiClientError
              ? socialLinks.error.message
              : undefined
          }
          onRetry={() => socialLinks.refetch()}
        />
      </div>
    );
  }

  return <SocialLinksForm initialData={socialLinks.data.platforms} />;
}