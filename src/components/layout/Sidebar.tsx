"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  LayoutDashboard,
  Users,
  Settings,
  CalendarDays,
  Wallet,
  BarChart3,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "member"] },
  { href: "/summary", label: "Monthly Summary", icon: BarChart3, roles: ["admin", "manager", "member"] },
  { href: "/manager/daily-entry", label: "Daily Meals", icon: CalendarDays, roles: ["admin", "manager"] },
  { href: "/manager/deposits", label: "Deposits", icon: Wallet, roles: ["admin", "manager"] },
  { href: "/admin/members", label: "Members", icon: Users, roles: ["admin"] },
  { href: "/admin/settings", label: "Mess Settings", icon: Settings, roles: ["admin"] },
  { href: "/member", label: "My Dashboard", icon: User, roles: ["member"] },
];

export default function Sidebar({ messName }: { messName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, member, signOut } = useAuth();

  const role = member?.role ?? "member";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-surface-100 shadow-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-sm text-ink-900 truncate">
            {messName ?? "MessManager"}
          </p>
          <p className="text-xs text-ink-400 capitalize">{role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-surface-50 hover:text-ink-900"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                  isActive ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600"
                )}
                size={18}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-surface-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-700">
              {member?.name?.[0] ?? user?.full_name?.[0] ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">
              {member?.name ?? user?.full_name ?? "User"}
            </p>
            <p className="text-xs text-ink-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
