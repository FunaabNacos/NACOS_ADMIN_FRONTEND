import type { Metadata } from "next";
import { TemplatesClient } from "./templates-client";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return <TemplatesClient />;
}
