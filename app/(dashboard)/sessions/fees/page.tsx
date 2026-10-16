import type { Metadata } from "next";
import { SessionFeesClient } from "./session-fees-client";

export const metadata: Metadata = { title: "Session fees" };

export default function SessionFeesPage() {
  return <SessionFeesClient />;
}
