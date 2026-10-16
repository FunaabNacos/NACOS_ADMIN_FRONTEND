"use client";

import { useQuery } from "@tanstack/react-query";
import * as auditApi from "@/lib/api/audit";
import type { ListAuditLogParams } from "@/lib/api/audit";

export function useAuditLogs(params: ListAuditLogParams) {
  return useQuery({
    queryKey: ["audit", "list", params],
    queryFn: () => auditApi.listAuditLogs(params),
  });
}
