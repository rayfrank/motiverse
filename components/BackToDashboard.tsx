"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackToDashboard() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/dashboard")}
      className="flex items-center gap-1 text-xs text-red-200 hover:text-white mb-4"
    >
      <ArrowLeft size={14} />
      <span>Back to Dashboard</span>
    </button>
  );
}
