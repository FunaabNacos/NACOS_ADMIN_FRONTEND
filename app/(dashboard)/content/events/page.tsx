import type { Metadata } from "next";
import { EventsClient } from "./events-client";

export const metadata: Metadata = { title: "Community Events" };

export default function ContentEventsPage() {
  return <EventsClient />;
}
