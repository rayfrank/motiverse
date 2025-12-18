"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BackToDashboard } from "@/components/BackToDashboard";
import { auth, db } from "@/lib/firebaseClient";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

type CalendarEvent = {
  id: string;
  title: string;
  category: string;
  date: string; // "yyyy-mm-dd"
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

  // Watch auth, then subscribe to this user's events
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("userId", "==", user.uid));

      const unsubEvents = onSnapshot(
        q,
        (snap) => {
          const list: CalendarEvent[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });

          // sort by date ascending in memory
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
      const eventsRef = collection(db, "events");
      await addDoc(eventsRef, {
        title: title.trim(),
        category,
        date, // "yyyy-mm-dd"
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
    <main className="flex h-screen body-bg text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-1">Calendar</h1>
        <p className="text-sm text-red-200 mb-4">
          Track wellbeing check-ins, focus blocks, and important dates.
        </p>

        {error && (
          <p className="text-xs text-red-300 mb-3">{error}</p>
        )}

        {/* Add event */}
        <form
          onSubmit={addEvent}
          className="panel-bg rounded-2xl p-4 mb-6 border border-red-900 grid md:grid-cols-[2fr,1fr,1fr,auto] gap-2 items-center"
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
            className="px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Add
          </button>
        </form>

        {/* Events list */}
        {loading ? (
          <p className="text-sm opacity-80">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-sm opacity-80">
            No events yet. Add your first wellness event above.
          </p>
        ) : (
          <div className="space-y-2 max-w-xl">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="card-bg rounded-xl p-3 border border-red-900 text-sm flex justify-between"
              >
                <div>
                  <p className="font-semibold">{ev.title}</p>
                  <p className="text-xs text-red-200">
                    {ev.category}
                  </p>
                </div>
                <p className="text-xs">
                  {ev.date ||
                    (ev.createdAt &&
                      ev.createdAt.toDate().toLocaleDateString())}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
