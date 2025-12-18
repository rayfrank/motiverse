import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2a0000] text-white">
      <div className="text-center space-y-4 max-w-xl px-4">
        <h1 className="text-4xl font-extrabold tracking-[0.3em]">
          MOTIVERSE
        </h1>
        <p className="text-sm text-red-200 leading-relaxed">
          An employee wellness and engagement universe &mdash; micro goals,
          check-ins, and AI prompts to keep your team thriving.
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded bg-[#770000] hover:bg-[#990000] transition font-semibold text-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-block px-4 py-2 rounded border border-red-500 hover:bg-[#400000] transition font-semibold text-sm"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
