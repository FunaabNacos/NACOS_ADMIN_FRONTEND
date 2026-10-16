import type { Metadata } from "next";
import { ExecutivesClient } from "./executives-client";

export const metadata: Metadata = { title: "Executives" };

export default function ExecutivesPage() {
  return <ExecutivesClient />;
}
