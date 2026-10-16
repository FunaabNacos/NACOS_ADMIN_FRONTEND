import type { Metadata } from "next";
import { PastExecutivesClient } from "./past-executives-client";

export const metadata: Metadata = { title: "Past Executives" };

export default function PastExecutivesPage() {
  return <PastExecutivesClient />;
}
