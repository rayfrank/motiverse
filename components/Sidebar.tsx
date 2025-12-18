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

  useEffect(() => {
    const u = auth.currentUser;
    if (u) setDisplayName(u.displayName || u.email || "User");
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 panel-bg flex flex-col items-center py-6 text-white">
      {/* Avatar + name */}
      <div className="flex flex-col items-center">
        <User size={64} />
        <p className="mt-2 text-lg font-bold text-center px-4 break-words">
          {displayName}
        </p>
      </div>

      {/* Nav links (including Dashboard) */}
      <nav className="mt-8 space-y-3 text-left w-3/4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 text-sm cursor-pointer transition ${
                active
                  ? "font-semibold text-red-200"
                  : "text-white hover:text-red-200"
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
    </aside>
  );
}
