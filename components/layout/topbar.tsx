"use client";

import Image from "next/image";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative size-7 shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/admin/nacos.png"
              alt="NACOS Logo"
              fill
              sizes="28px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold tracking-tight truncate">NACOS Platform</span>
        </div>
      </div>
    
    </header>
  );
}