"use client";

import * as React from "react";
import { FileTextIcon } from "lucide-react";
import { useTemplates, usePreviewTemplate } from "@/hooks/use-templates";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/errors";

export interface Template {
  templateId: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

// ==========================================
// SUB-COMPONENTS (Defined inside the file)
// ==========================================

interface TemplateSelectorProps {
  templates: Template[];
  selected: string | null;
  onSelect: (templateId: string) => void;
}

function TemplateSelector({ templates, selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:overflow-visible lg:pb-0">
      {templates.map((t) => (
        <Button
          key={t.templateId}
          variant={selected === t.templateId ? "default" : "outline"}
          size="sm"
          className={cn(
            "justify-start whitespace-nowrap shrink-0 lg:shrink",
            selected === t.templateId && "shadow-sm"
          )}
          onClick={() => onSelect(t.templateId)}
        >
          {t.templateId}
        </Button>
      ))}
    </div>
  );
}

interface TemplatePreviewCardProps {
  isPending: boolean;
  isError: boolean;
  data: string | undefined;
}

function TemplatePreviewCard({ isPending, isError, data }: TemplatePreviewCardProps) {
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const [scale, setScale] = React.useState(0.7);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setScale(0.8); // lg: 80%
      } else if (width >= 640) {
        setScale(0.7); // md: 70%
      } else {
        setScale(0.4); // sm: 40%
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full">
      {isPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingState label="Rendering preview…" />
        </div>
      )}
      {isError && <ErrorState title="Couldn't render preview" />}
      
      {data && (
        /* Outer area with generous padding around the preview document */
        <div className="w-full flex justify-center overflow-x-auto p-4 sm:p-8 bg-muted/30 rounded-2xl border">
          {/* Document canvas wrapper matching the scaled A4 bounds precisely */}
          <div 
            className="relative overflow-hidden bg-white shadow-lg rounded-lg border transition-all duration-200"
            style={{
              width: `${A4_WIDTH * scale}px`,
              height: `${A4_HEIGHT * scale}px`,
            }}
          >
            <iframe
              title="A4 Receipt template preview"
              srcDoc={data}
              className="absolute top-0 left-0 border-0 origin-top-left bg-white"
              style={{
                width: `${A4_WIDTH}px`,
                height: `${A4_HEIGHT}px`,
                transform: `scale(${scale})`,
              }}
              sandbox=""
            />
          </div>
        </div>
      )}
    </div>
  );
}
// ==========================================
// MAIN COMPONENT
// ==========================================

export function TemplatesClient() {
  const templates = useTemplates();
  const preview = usePreviewTemplate();
  const [selectedOverride, setSelectedOverride] = React.useState<string | null>(null);

  const rawTemplates = (templates.data as Template[]) ?? [];
  const selected = selectedOverride ?? rawTemplates[0]?.templateId ?? null;

  // Trigger preview fetch when the selected template changes
  React.useEffect(() => {
    if (selected) {
      preview.mutate({ templateId: selected, overrides: {} });
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Receipt templates" 
        description="Preview how receipts render for each template." 
      />

      {templates.isLoading && <LoadingState />}
      {templates.isError && (
        <ErrorState 
          message={templates.error instanceof ApiClientError ? templates.error.message : undefined} 
          onRetry={() => templates.refetch()} 
        />
      )}
      {templates.data && rawTemplates.length === 0 && (
        <EmptyState icon={FileTextIcon} title="No templates available" />
      )}

      {templates.data && rawTemplates.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[160px_1fr] items-start">
          <TemplateSelector
            templates={rawTemplates}
            selected={selected}
            onSelect={setSelectedOverride}
          />

          <TemplatePreviewCard
            isPending={preview.isPending}
            isError={preview.isError}
            data={preview.data}
          />
        </div>
      )}
    </div>
  );
}