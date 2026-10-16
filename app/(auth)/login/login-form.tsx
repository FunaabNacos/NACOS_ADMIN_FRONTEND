"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, Loader2 } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const sessionExpired = searchParams.get("expired") === "1";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      const user = await login(values.email, values.password);
      const from = searchParams.get("from");
      if (user.mustChangePassword) {
        router.push("/reset-password?required=1");
        return;
      }
      router.push(from && from.startsWith("/") ? from : "/dashboard");
      router.refresh();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof ApiClientError
            ? error.message
            : "Couldn't sign in. Check your connection and try again.",
      });
    }
  }

  return (
    <Card className="border-border/60 shadow-xl shadow-black/[0.02] backdrop-blur-xl transition-all">
      <CardHeader className="space-y-1.5 pb-6 text-center sm:text-left">
        <div className="flex justify-center sm:justify-start mb-2"></div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm">
          Access the NACOS admin dashboard to manage your portal.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {sessionExpired && (
          <div
            className="flex items-center gap-3 rounded-lg border border-amber-200/65 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm animate-in fade-in-50 duration-300"
            role="status"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="font-medium">
              Your session expired. Please sign in again.
            </p>
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Email Address"
            htmlFor="email"
            error={form.formState.errors.email?.message}
          >
            <div className="relative flex items-center">
              <MailIcon className="absolute left-3 size-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={!!form.formState.errors.email}
                className="pl-9 h-11 transition-all bg-background/50 focus-visible:bg-background"
                {...form.register("email")}
              />
            </div>
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <div className="relative flex items-center">
              <LockIcon className="absolute left-3 size-4 text-muted-foreground/60 pointer-events-none z-10" />

              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!form.formState.errors.password}
                className="pl-9 pr-10 h-11 transition-all bg-background/50 focus-visible:bg-background"
                {...form.register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 inset-y-0 px-3 flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none z-20 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </FormField>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          {form.formState.errors.root && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive animate-in fade-in-50 duration-300"
              role="alert"
            >
              {form.formState.errors.root.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 active:scale-[0.99]"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in to Dashboard"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
