import type { Metadata } from "next";
import { HallOfFameClient } from "./hall-of-fame-client";

export const metadata: Metadata = { title: "Hall of Fame" };

export default function HallOfFamePage() {
  return <HallOfFameClient />;
}
