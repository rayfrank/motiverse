"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";

type EmployeeInfo = {
  department: string;
  jobTitle: string;
  employmentType: string;
  dateJoined: string;
  status: string;
};

const defaultEmployee: EmployeeInfo = {
  department: "",
  jobTitle: "",
  employmentType: "",
  dateJoined: "",
  status: "Active",
};

const features = [
  {
    title: "Motivational Prompts",
    desc: "AI-powered encouragement to boost morale and engagement.",
    href: undefined as string | undefined,
  },
  {
    title: "Self-Assessment Tools",
    desc: "Track your mood, stress and satisfaction levels weekly.",
    href: undefined as string | undefined,
  },
  {
    title: "Micro Goals & Streaks",
    desc: "Set small daily goals and earn points for consistency.",
    href: "/goals",
  },
  {
    title: "Wellness Resources",
    desc: "Access coping strategies and digital counselor guidance.",
    href: undefined as string | undefined,
  },
  {
    title: "AI Reminders",
    desc: "Personalized reminders to stretch, rest, or hydrate.",
    href: undefined as string | undefined,
  },
];

const QUOTES = [
  "Small steps every day lead to big changes.",
  "You don’t have to do it all today. Just do the next right thing.",
  "Your work matters more than you think.",
  "Rest is a productive activity.",
  "Progress, not perfection.",
  "You’ve done hard things before. You can do this too.",
  "Even 10 focused minutes move you forward.",
];

export default function DashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [editEmployee, setEditEmployee] =
    useState<EmployeeInfo>(defaultEmployee);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<string>("");

  // Auth + load employee data
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "employees", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as EmployeeInfo;
        setEmployee(data);
        setEditEmployee(data);
      } else {
        setEmployee(null);
        setEditEmployee(defaultEmployee);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // Initial motivational quote
  useEffect(() => {
    pickRandomQuote();
  }, []);

  const pickRandomQuote = () => {
    const idx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[idx]);
  };

  const handleEmployeeChange = (
    field: keyof EmployeeInfo,
    value: string
  ) => {
    setEditEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const saveEmployeeInfo = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "employees", user.uid);
      await setDoc(ref, editEmployee, { merge: true });
      // Once saved, reflect at the top
      setEmployee(editEmployee);
    } catch (err) {
      console.error("Failed to save employee info", err);
      alert("Could not save employee info. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-screen body-bg text-white items-center justify-center">
        <p className="text-sm opacity-80">Loading your Motiverse...</p>
      </main>
    );
  }

  // Use saved employee info if available, otherwise the editing state
  const displayEmployee = employee ?? editEmployee;

  return (
    <main className="flex h-screen body-bg text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto">
        {/* Employee strip at top */}
        <div className="panel-bg rounded-2xl p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-6 border border-red-900">
          <Info label="Department" value={displayEmployee.department || "—"} />
          <Info label="Job Title" value={displayEmployee.jobTitle || "—"} />
          <Info
            label="Employment Type"
            value={displayEmployee.employmentType || "—"}
          />
          <Info label="Date Joined" value={displayEmployee.dateJoined || "—"} />
          <Info label="Status" value={displayEmployee.status || "Active"} />
        </div>

        {/* Header + Motivational Prompt */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">Employee Dashboard</h1>
            <p className="text-xs text-red-200">
              Welcome back. Here&apos;s a little motivation for you:
            </p>
          </div>
          <div className="panel-bg rounded-xl px-4 py-3 border border-red-900 max-w-xl">
            <p className="text-sm italic">“{quote}”</p>
            <button
              onClick={pickRandomQuote}
              className="mt-2 text-[11px] px-2 py-1 rounded accent-bg hover:opacity-90 font-semibold border accent-border"
            >
              New Prompt
            </button>
          </div>
        </div>

        {/* Employee info form */}
        <div className="panel-bg rounded-2xl p-4 mb-6 border border-red-900">
          <h2 className="text-lg font-semibold mb-3">Your Employee Info</h2>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <LabeledInput
              label="Department"
              value={editEmployee.department}
              onChange={(v) => handleEmployeeChange("department", v)}
            />
            <LabeledInput
              label="Job Title"
              value={editEmployee.jobTitle}
              onChange={(v) => handleEmployeeChange("jobTitle", v)}
            />
            <LabeledInput
              label="Employment Type"
              placeholder="e.g. Full-time, Part-time, Contractor"
              value={editEmployee.employmentType}
              onChange={(v) => handleEmployeeChange("employmentType", v)}
            />
            <LabeledInput
              label="Date Joined"
              placeholder="e.g. Jan 12, 2022"
              value={editEmployee.dateJoined}
              onChange={(v) => handleEmployeeChange("dateJoined", v)}
            />
            <LabeledInput
              label="Status"
              placeholder="Active / On Leave / etc."
              value={editEmployee.status}
              onChange={(v) => handleEmployeeChange("status", v)}
            />
          </div>

          <button
            onClick={saveEmployeeInfo}
            disabled={saving}
            className="mt-4 px-4 py-2 rounded accent-bg hover:opacity-90 disabled:opacity-60 font-semibold text-sm border accent-border"
          >
            {saving ? "Saving..." : "Save Employee Info"}
          </button>

          {employee && (
            <p className="mt-2 text-[11px] text-red-200">
              Saved. Your details are displayed at the top of the dashboard.
            </p>
          )}
        </div>

        {/* Features */}
        <h2 className="text-xl font-semibold mb-4">
          Wellness &amp; Engagement Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((item) => {
            const card = (
              <div
                key={item.title}
                className="card-bg rounded-2xl p-4 hover:opacity-90 transition shadow-md border border-red-900"
              >
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm opacity-90">{item.desc}</p>
              </div>
            );

            return item.href ? (
              <Link href={item.href} key={item.title}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>

        {/* Incident Reporting */}
        <div className="mt-8 max-w-xl">
          <h2 className="text-xl font-semibold mb-2">Report an Incident</h2>
          <p className="text-sm opacity-90 mb-3">
            Report issues such as harassment, burnout risk, or workplace stress
            anonymously.
          </p>
          <button className="px-4 py-2 rounded accent-bg hover:opacity-90 font-semibold text-sm border accent-border">
            Report Incident
          </button>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">{label}: </span>
      {value}
    </p>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold">{label}</span>
      <input
        className="px-3 py-2 rounded body-bg border border-red-900 text-xs"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
