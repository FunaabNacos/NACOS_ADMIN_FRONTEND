"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import * as templatesApi from "@/lib/api/templates";
import type { TemplatePreviewOverrides } from "@/lib/api/templates";

export function useTemplates() {
  return useQuery({ queryKey: ["templates", "list"], queryFn: templatesApi.listTemplates });
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: ({ templateId, overrides }: { templateId: string; overrides: TemplatePreviewOverrides }) =>
      templatesApi.previewTemplate(templateId, overrides),
  });
}
