"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOutIcon, 
  SettingsIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  UserIcon,
  SlidersHorizontalIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-context";
import { navItemsForRole } from "@/lib/permissions";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const allNavItems = user ? navItemsForRole(user.role) : [];

  // Separate settings from main navigation if it exists in the role's items
  const navItems = allNavItems.filter(
    (item) => !item.href.includes("settings") && item.label.toLowerCase() !== "settings"
  );
  const settingsItem = allNavItems.find(
    (item) => item.href.includes("settings") || item.label.toLowerCase() === "settings"
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex sticky top-0 h-screen shrink-0 select-none z-30 transition-all duration-300 ease-in-out py-3 pl-3",
        isCollapsed ? "w-[88px]" : "w-[240px]"
      )}
    >
      {/* Floating Sidebar Container */}
      <div 
        className={cn(
          "relative flex flex-col h-[calc(100vh-1.5rem)] w-full bg-sidebar text-sidebar-foreground",
          "rounded-[2rem] border border-sidebar-border shadow-sm overflow-hidden",
          "transition-all duration-300 ease-in-out"
        )}
      >
        {/* Header: Brand Logo & Collapse Toggle */}
        <div className={cn(
          "flex items-center px-4 py-5 shrink-0 border-b border-sidebar-border/50",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Image
                src="/admin/nacos.png"
                alt="NACOS Logo"
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-sm tracking-tight text-sidebar-foreground truncate">
                  NACOS Admin
                </span>
                <span className="text-xs text-muted-foreground truncate capitalize">
                  {user?.role?.replace("_", " ") || "Dashboard"}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground transition-colors"
              aria-label="Collapse Sidebar"
              title="Collapse Sidebar"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Expand Button when collapsed (Floating toggle on border or header) */}
        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-sidebar-border/50">
            <button
              onClick={() => setIsCollapsed(false)}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground transition-colors"
              aria-label="Expand Sidebar"
              title="Expand Sidebar"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        )}

        {/* Middle: Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150 group relative",
                    active
                      ? "bg-ink text-ink-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0 transition-transform duration-150")} />
                  
                  {!isCollapsed && (
                    <span className="text-sm truncate">{item.label}</span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink text-ink-foreground text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Settings Section (Separated visually) */}
          {settingsItem && (
            <>
              <div className="my-3 border-t border-sidebar-border/60 mx-1" />
              <Link
                href={settingsItem.href}
                title={isCollapsed ? settingsItem.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150 group relative",
                  pathname === settingsItem.href || pathname.startsWith(`${settingsItem.href}/`)
                    ? "bg-ink text-ink-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground"
                )}
              >
                <settingsItem.icon className="size-5 shrink-0" />
                {!isCollapsed && <span className="text-sm truncate">{settingsItem.label}</span>}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink text-ink-foreground text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                    {settingsItem.label}
                  </div>
                )}
              </Link>
            </>
          )}
        </div>

        {/* Bottom Area: User Profile & Account Controls */}
        <div className="p-3 border-t border-sidebar-border/50 shrink-0 relative">
          {/* Profile Popover / Dropdown Menu */}
          {isProfileOpen && (
            <div className={cn(
              "absolute bottom-full mb-2 left-3 right-3 bg-sidebar border border-sidebar-border rounded-2xl shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150",
              isCollapsed && "left-20 w-56"
            )}>
              <div className="px-3 py-2 border-b border-sidebar-border/60 mb-1">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.fullName || "Administrator"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || "admin@nacos.org"}
                </p>
              </div>
              
              
              
              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground rounded-xl transition-colors"
              >
                <SlidersHorizontalIcon className="size-4" />
                Preferences
              </Link>

              <div className="my-1 border-t border-sidebar-border/60" />

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 rounded-xl transition-colors"
              >
                <LogOutIcon className="size-4" />
                Log out
              </button>
            </div>
          )}

          {/* Trigger Profile Card */}
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left",
              isProfileOpen ? "bg-secondary text-sidebar-foreground" : "hover:bg-secondary/60 text-muted-foreground hover:text-sidebar-foreground"
            )}
            title={isCollapsed ? user?.fullName || "Account" : undefined}
          >
            {/* Avatar Initials / Image */}
            <div className="size-8 shrink-0 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs border border-primary/20">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.fullName || "Admin User"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate capitalize">
                  {user?.role?.replace("_", " ") || "Active"}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}