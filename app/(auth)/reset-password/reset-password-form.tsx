"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import { resetPassword, changePassword } from "@/lib/api/auth";
import { newPasswordSchema } from "@/lib/validation";
import { useAuth } from "@/components/layout/auth-context";
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

const tokenSchema = z
  .object({ newPassword: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const token = searchParams.get("token");
  const required = searchParams.get("required") === "1";
  const [done, setDone] = React.useState(false);

  if (token)
    return <TokenFlow token={token} onDone={() => setDone(true)} done={done} />;

  if (required && user) {
    return (
      <ChangeFlow
        onDone={() => {
          setUser({ ...user, mustChangePassword: false });
          router.push("/dashboard");
          router.refresh();
        }}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm font-medium">No reset link found</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Use the link from your password reset email, or request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Request a reset link
        </Link>
      </CardContent>
    </Card>
  );
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
  type Values = z.infer<typeof tokenSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    try {
      await resetPassword(token, values.newPassword);
      onDone();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof ApiClientError
            ? error.message
            : "That link may have expired.",
      });
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2Icon className="size-8 text-primary" />
          <p className="text-sm font-medium">Password updated</p>
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
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          At least 8 characters, one uppercase letter, one number.
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
            {form.formState.isSubmitting ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangeFlow({ onDone }: { onDone: () => void }) {
  type Values = z.infer<typeof changeSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: Values) {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      onDone();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof ApiClientError
            ? error.message
            : "Couldn't update your password.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          You&apos;re signing in with a temporary password — choose a new one to
          continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Current (temporary) password"
            htmlFor="currentPassword"
            error={form.formState.errors.currentPassword?.message}
          >
            <Input
              id="currentPassword"
              type="password"
              {...form.register("currentPassword")}
            />
          </FormField>
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
            {form.formState.isSubmitting ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
