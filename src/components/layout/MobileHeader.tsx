"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed, LayoutDashboard, Users, Settings,
  CalendarDays, Wallet, BarChart3, User, LogOut, Menu, X,
} from "lucide-react";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "member"] },
  { href: "/summary", label: "Monthly Summary", icon: BarChart3, roles: ["admin", "manager", "member"] },
  { href: "/manager/daily-entry", label: "Daily Meals", icon: CalendarDays, roles: ["admin", "manager"] },
  { href: "/manager/deposits", label: "Deposits", icon: Wallet, roles: ["admin", "manager"] },
  { href: "/admin/members", label: "Members", icon: Users, roles: ["admin"] },
  { href: "/admin/settings", label: "Mess Settings", icon: Settings, roles: ["admin"] },
  { href: "/member", label: "My Dashboard", icon: User, roles: ["member"] },
];

export default function MobileHeader({ messName }: { messName?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, member, signOut } = useAuth();
  const role = member?.role ?? "member";
  const visible = navItems.filter((i) => i.roles.includes(role));

  const handleSignOut = async () => {
    signOut();
    toast.success("Signed out");
    router.push("/login");
    setOpen(false);
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-surface-100 px-4 py-3 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-ink-900">{messName ?? "MessManager"}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors"
        >
          <Menu size={20} className="text-ink-600" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink-900">{messName ?? "MessManager"}</p>
                  <p className="text-xs text-ink-400 capitalize">{role}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-100">
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {visible.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-surface-50"
                    )}
                  >
                    <Icon size={18} className={isActive ? "text-brand-600" : "text-ink-400"} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-surface-100">
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {member?.name ?? user?.full_name}
                </p>
                <p className="text-xs text-ink-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut size={16} />Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
