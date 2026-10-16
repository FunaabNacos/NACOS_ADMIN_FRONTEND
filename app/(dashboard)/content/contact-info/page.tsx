import type { Metadata } from "next";
import { ContactInfoClient } from "./contact-info-client";

export const metadata: Metadata = { title: "Contact Info" };

export default function ContactInfoPage() {
  return <ContactInfoClient />;
}
