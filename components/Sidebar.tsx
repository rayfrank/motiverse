"use client";

import {
  User,
  Inbox,
  Calendar,
  Bookmark,
  Rss,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inbox", icon: Inbox, href: "/inbox" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  { label: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
  { label: "News Feed", icon: Rss, href: "/news" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("User");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) setDisplayName(u.displayName || u.email || "User");
  }, []);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open (mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const NavLinks = ({ compact }: { compact?: boolean }) => (
    <nav className={compact ? "space-y-3 text-left" : "mt-8 space-y-3 text-left w-3/4"}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-2 text-sm cursor-pointer transition ${active ? "font-semibold text-red-200" : "text-white hover:text-red-200"
              }`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 mt-6 text-red-200 hover:text-white text-sm"
      >
        <LogOut size={18} />
        <span>Log Out</span>
      </button>
    </nav>
  );

  return (
    <>
      {/* ✅ Desktop sidebar (unchanged) */}
      <aside className="hidden md:flex w-64 panel-bg flex-col items-center py-6 text-white">
        <div className="flex flex-col items-center">
          <User size={64} />
          <p className="mt-2 text-lg font-bold text-center px-4 break-words">
            {displayName}
          </p>
        </div>
        <NavLinks />
      </aside>

      {/* ✅ Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 panel-bg border-b border-red-900 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded hover:opacity-90 border border-red-900"
          >
            <Menu size={20} />
          </button>

          <div className="text-center">
            <p className="text-sm font-bold leading-tight">Motiverse</p>
            <p className="text-[11px] text-red-200 truncate max-w-[220px]">
              {displayName}
            </p>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* ✅ Mobile drawer + overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] panel-bg text-white border-r border-red-900 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <User size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-[11px] text-red-200">Menu</p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded hover:opacity-90 border border-red-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6">
              <NavLinks compact />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
