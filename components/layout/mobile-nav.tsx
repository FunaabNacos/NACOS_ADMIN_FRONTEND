"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, LogOutIcon, ChevronDown } from "lucide-react";
import { cn, formatRole, initials } from "@/lib/utils";
import { useAuth } from "./auth-context";
import { navItemsForRole } from "@/lib/permissions";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = user ? navItemsForRole(user.role) : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden shrink-0 gap-2 rounded-full border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 px-3 shadow-sm"
          aria-label="Open menu"
        >
          <MenuIcon className="size-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Menu</span>
          <ChevronDown className="size-3 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      
      {/* Compact Popover Menu optimized for fewer items */}
      <DropdownMenuContent 
        align="start" 
        className="w-64 rounded-2xl p-2 shadow-xl border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md"
      >
        {/* User Mini-Header inside dropdown */}
        {user && (
          <div className="flex items-center gap-2.5 p-2 mb-1 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{user.fullName}</p>
              <p className="truncate text-[10px] text-zinc-500 font-medium">{formatRole(user.role)}</p>
            </div>
          </div>
        )}

        <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

        {/* Navigation Links */}
        <div className="space-py-1 py-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild className="p-0 focus:bg-transparent">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors w-full my-0.5 cursor-pointer",
                    active
                      ? "bg-[#111318] text-white dark:bg-zinc-800 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-zinc-500")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

        {/* Logout Action */}
        <DropdownMenuItem 
          onClick={() => logout()}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer mt-1 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600"
        >
          <LogOutIcon className="size-4 shrink-0" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}