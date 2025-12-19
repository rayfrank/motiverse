"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BackToDashboard } from "@/components/BackToDashboard";
import { auth, db } from "@/lib/firebaseClient";
import { addDoc, collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";

type CalendarEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  userId: string;
  createdAt: Timestamp;
};

const CATEGORIES = ["Wellness", "Focus Block", "1:1", "Deadline", "Other"];

export default function CalendarPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Wellness");
  const [date, setDate] = useState("");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const q = query(collection(db, "events"), where("userId", "==", user.uid));

      const unsubEvents = onSnapshot(
        q,
        (snap) => {
          const list: CalendarEvent[] = [];
          snap.forEach((docSnap) => list.push({ id: docSnap.id, ...(docSnap.data() as any) }));
          list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
          setEvents(list);
          setLoading(false);
        },
        (err) => {
          console.error("Calendar snapshot error:", err);
          setError("Failed to load events. Check console / Firestore rules.");
          setLoading(false);
        }
      );

      return () => unsubEvents();
    });

    return () => unsubAuth();
  }, [router]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim() || !date) return;

    try {
      await addDoc(collection(db, "events"), {
        title: title.trim(),
        category,
        date,
        userId,
        createdAt: Timestamp.now(),
      });

      setTitle("");
      setCategory("Wellness");
      setDate("");
    } catch (err) {
      console.error("Failed to add event:", err);
      setError("Failed to add event. Check console / rules.");
    }
  };

  return (
    <AppShell>
      <section className="p-4 md:p-8">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-1">Calendar</h1>
        <p className="text-sm text-red-200 mb-4">
          Track wellbeing check-ins, focus blocks, and important dates.
        </p>

        {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

        <form
          onSubmit={addEvent}
          className="panel-bg rounded-2xl p-4 mb-6 border border-red-900 grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-2 items-center w-full max-w-4xl"
        >
          <input
            className="px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="e.g. Weekly 1:1, Therapy session, Deep focus block"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className="px-3 py-2 rounded body-bg border border-red-900 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            className="px-3 py-2 rounded body-bg border border-red-900 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Add
          </button>
        </form>

        {loading ? (
          <p className="text-sm opacity-80">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-sm opacity-80">No events yet. Add your first event above.</p>
        ) : (
          <div className="space-y-2 w-full max-w-2xl">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="card-bg rounded-xl p-3 border border-red-900 text-sm flex flex-col sm:flex-row sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold break-words">{ev.title}</p>
                  <p className="text-xs text-red-200">{ev.category}</p>
                </div>
                <p className="text-xs">{ev.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
