import type { Metadata } from "next";
import Link from "next/link";
import {
  UsersIcon,
  ContactIcon,
  Share2Icon,
  TrophyIcon,
  HistoryIcon,
  CalendarDaysIcon,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Content" };

const SECTIONS: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Executives",
    description:
      "Main College Leadership and NRA Members, with photos and contacts.",
    href: "/content/executives",
    icon: UsersIcon,
  },
  {
    title: "Contact Info",
    description:
      "Financial Director and Software Director contacts, pulled from Executives.",
    href: "/content/contact-info",
    icon: ContactIcon,
  },
  {
    title: "Social Links",
    description:
      "Facebook, X/Twitter, Instagram, LinkedIn, WhatsApp, and YouTube.",
    href: "/content/social-links",
    icon: Share2Icon,
  },
  {
    title: "Hall of Fame",
    description: "Inductees and their contributions to the association.",
    href: "/content/hall-of-fame",
    icon: TrophyIcon,
  },
  {
    title: "Past Executives",
    description: "Executives grouped by session (e.g. 2024/2025).",
    href: "/content/past-executives",
    icon: HistoryIcon,
  },
  {
    title: "Community Events",
    description: "Upcoming and past community events shown on the homepage.",
    href: "/content/events",
    icon: CalendarDaysIcon,
  },
];

export default function ContentPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Content"
        description="Manage the public-facing content sections of the site."
      />

      {/* 
        Responsive Grid Layout:
        - Mobile (< sm): 1 column
        - Tablet (sm to lg): 2 columns
        - Desktop (lg and up): 3 columns
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-sm active:scale-[0.99] sm:active:scale-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <section.icon className="size-5 text-primary" />
                </div>
                <CardTitle className="mt-3 text-base sm:text-lg">{section.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}