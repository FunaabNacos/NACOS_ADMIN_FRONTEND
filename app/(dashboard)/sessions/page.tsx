import type { Metadata } from "next";
import { SessionsClient } from "./sessions-client";

export const metadata: Metadata = { title: "Sessions & Settings" };

export default function SessionsPage() {
  return <SessionsClient />;
}
