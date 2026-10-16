import type { Metadata } from "next";
import { RecoveryClient } from "./recovery-client";

export const metadata: Metadata = { title: "Recovery" };

export default function RecoveryPage() {
  return <RecoveryClient />;
}
