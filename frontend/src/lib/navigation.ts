import {
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

// The sidebar only shows items for the user's role. The API still enforces access on every request.
export const NAV_ITEMS: NavItem[] = [
  { label: "My Report", href: "/reports/new", icon: FileText, roles: ["MEMBER"] },
  { label: "Report History", href: "/reports", icon: History, roles: ["MEMBER"] },
  { label: "Dashboard", href: "/dashboard", icon: Gauge, roles: ["MANAGER", "ADMIN"] },
  { label: "Team Reports", href: "/team", icon: ClipboardList, roles: ["MANAGER", "ADMIN"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: ["MANAGER", "ADMIN"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
];

export function navItemsFor(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<Role, string> = {
  MEMBER: "Team Member",
  MANAGER: "Manager",
  ADMIN: "Admin",
};
