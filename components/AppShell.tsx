"use client";

import { Sidebar } from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-[100dvh] body-bg text-white flex flex-col md:flex-row">
            <Sidebar />
            {/* Content area */}
            <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
    );
}
