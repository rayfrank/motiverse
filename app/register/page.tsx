"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("Passwords do not match");
      return;
    }
    setStatus("Creating account...");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user && displayName) {
        await updateProfile(cred.user, { displayName });
      }
      setStatus("Account created! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      setStatus(err.message ?? "Registration failed");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2a0000] text-white">
      <div className="w-full max-w-sm bg-[#400000] p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Join Motiverse</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Display Name"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-2 rounded bg-[#770000] hover:bg-[#990000] transition font-semibold text-sm"
          >
            Create Account
          </button>
        </form>
        <p className="mt-3 text-xs text-center text-red-200 min-h-[1.5rem]">
          {status}
        </p>
        <p className="mt-2 text-xs text-center">
          Already have an account?{" "}
          <button
            type="button"
            className="underline"
            onClick={() => router.push("/login")}
          >
            Log in
          </button>
        </p>
      </div>
    </main>
  );
}
