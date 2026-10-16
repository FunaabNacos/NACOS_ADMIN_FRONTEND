import type { Metadata } from "next";
import { Suspense } from "react";
import { FinanceDirectorSetupForm } from "./finance-director-setup-form";

export const metadata: Metadata = { title: "Set up your account" };

export default function FinanceDirectorSetupPage() {
  return (
    <Suspense>
      <FinanceDirectorSetupForm />
    </Suspense>
  );
}