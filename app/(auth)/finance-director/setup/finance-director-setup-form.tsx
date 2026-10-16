"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import { activateFinanceDirector } from "@/lib/api/onboarding";
import { newPasswordSchema } from "@/lib/validation";
import { ApiClientError } from "@/lib/api/errors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";

const setupSchema = z
  .object({ newPassword: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function FinanceDirectorSetupForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = React.useState(false);

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm font-medium">No setup link found</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Use the link from your Finance Director invitation email. If it has
            expired, ask your association&apos;s Main Admin to resend it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <TokenFlow token={token} onDone={() => setDone(true)} done={done} />;
}

function TokenFlow({
  token,
  onDone,
  done,
}: {
  token: string;
  onDone: () => void;
  done: boolean;
}) {
  type Values = z.infer<typeof setupSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(setupSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    try {
      await activateFinanceDirector(token, values.newPassword);
      onDone();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof ApiClientError
            ? error.message
            : "That link may have expired. Ask your Main Admin to resend the invitation.",
      });
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2Icon className="size-8 text-primary" />
          <p className="text-sm font-medium">Account activated</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your Finance Director account is ready. You can now sign in with
            your email and new password.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set up your account</CardTitle>
        <CardDescription>
          Choose a password to activate your Finance Director account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="New password"
            htmlFor="newPassword"
            error={form.formState.errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type="password"
              {...form.register("newPassword")}
            />
          </FormField>
          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            error={form.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
            />
          </FormField>
          {form.formState.errors.root && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Activating…" : "Activate account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
