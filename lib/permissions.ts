import type { Role } from "./types";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Receipt,
  CalendarRange,
  Users,
  ClipboardCheck,
  ScrollText,
  RotateCcw,
  Settings,
  FileText,
  LayoutTemplate,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

// Note: the backend's permissions.ts declares manageOnboarding: ['super_admin'],
// but the actual /onboarding route guards require 'main_admin' and explicitly
// block super_admin. The route guards are ground truth, so this reflects that.
// The backend key is stale and should be reconciled.
export const PERMISSIONS = {
  viewOwnRevenue: ["super_admin", "main_admin", "finance_director"] as Role[],
  viewOwnExpenses: ["super_admin", "finance_director"] as Role[],
  manageExpenses: ["super_admin", "finance_director"] as Role[],
  viewOwnNetBalance: ["super_admin", "finance_director"] as Role[],
  viewAllTenantsNetBalance: ["super_admin"] as Role[],
  exportFinancialReport: ["super_admin", "finance_director"] as Role[],
  editTenantFeeConfig: ["super_admin"] as Role[],
  freezeOrArchiveTenant: ["super_admin", "main_admin"] as Role[],
  manageOnboarding: ["main_admin"] as Role[],
  managePaystackConfig: ["super_admin", "main_admin"] as Role[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function roleHasPermission(role: Role, key: PermissionKey): boolean {
  return (PERMISSIONS[key] as readonly Role[]).includes(role);
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

// Nav items are filtered by role at runtime — no per-role hardcoding.
// Order here controls display order in the sidebar.
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "main_admin", "finance_director"],
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Building2,
    roles: ["super_admin", "main_admin"],
  },
  {
    label: "Finance",
    href: "/finance",
    icon: Wallet,
    roles: ["super_admin", "finance_director"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["super_admin", "main_admin", "finance_director"],
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    roles: ["super_admin", "finance_director"],
  },
  {
    label: "Sessions",
    href: "/sessions",
    icon: CalendarRange,
    roles: ["super_admin", "finance_director", "main_admin"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["super_admin", "main_admin"],
  },
  {
    label: "Onboarding",
    href: "/onboarding",
    icon: ClipboardCheck,
    roles: ["main_admin"],
  },
  {
    label: "Audit Log",
    href: "/audit",
    icon: ScrollText,
    roles: ["super_admin"],
  },
  {
    label: "Recovery",
    href: "/recovery",
    icon: RotateCcw,
    roles: ["super_admin"],
  },
  {
    label: "Templates",
    href: "/templates",
    icon: FileText,
    roles: ["super_admin"],
  },
  {
    label: "Content",
    href: "/content",
    icon: LayoutTemplate,
    roles: ["super_admin", "main_admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "main_admin"],
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
