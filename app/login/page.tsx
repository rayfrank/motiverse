"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("Success! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      setStatus(err.message ?? "Login failed");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2a0000] text-white">
      <div className="w-full max-w-sm bg-[#400000] p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Motiverse Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-2 rounded bg-[#770000] hover:bg-[#990000] transition font-semibold text-sm"
          >
            Log In
          </button>
        </form>
        <p className="mt-3 text-xs text-center text-red-200 min-h-[1.5rem]">
          {status}
        </p>
        <p className="mt-2 text-xs text-center">
          No account?{" "}
          <button
            type="button"
            className="underline"
            onClick={() => router.push("/register")}
          >
            Create one
          </button>
        </p>
      </div>
    </main>
  );
}
