import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "primary";
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && (
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                tone === "primary" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </div>
          )}
        </div>
        <p className="num mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
