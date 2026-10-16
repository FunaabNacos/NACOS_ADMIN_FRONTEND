"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import { requestPasswordReset } from "@/lib/api/auth";
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

const schema = z.object({ email: z.string().email("Invalid email address") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    try {
      await requestPasswordReset(values.email);
    } finally {
      // Backend always returns 200 regardless of whether the email exists
      // (prevents account enumeration) — the UI mirrors that intentionally.
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2Icon className="size-8 text-primary" />
          <p className="text-sm font-medium">Check your email</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            If an account exists for that address, we&apos;ve sent a link to
            reset your password.
          </p>
          <Link
            href="/login"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          We&apos;ll email you a link to choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Email"
            htmlFor="email"
            error={form.formState.errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
          </FormField>
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
          <Link
            href="/login"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
