"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BackToDashboard } from "@/components/BackToDashboard";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

type Goal = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  userId: string;
};

export default function GoalsPage() {
  const router = useRouter();
  const [newGoal, setNewGoal] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const q = query(
        collection(db, "goals"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubGoals = onSnapshot(q, (snapshot) => {
        const items: Goal[] = [];
        snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...(docSnap.data() as any) }));
        setGoals(items);
        computeStreak(items);
      });

      return () => unsubGoals();
    });

    return () => unsubAuth();
  }, [router]);

  const computeStreak = (items: Goal[]) => {
    const daysWithCompletion = new Set<string>();
    items.forEach((g) => {
      if (g.completed && g.completedAt) {
        const d = g.completedAt.toDate();
        const key = d.toISOString().slice(0, 10);
        daysWithCompletion.add(key);
      }
    });

    let streakCount = 0;
    const today = new Date();
    for (let offset = 0; ; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const key = d.toISOString().slice(0, 10);
      if (daysWithCompletion.has(key)) streakCount++;
      else break;
    }
    setStreak(streakCount);
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newGoal.trim()) return;

    await addDoc(collection(db, "goals"), {
      text: newGoal.trim(),
      completed: false,
      createdAt: Timestamp.now(),
      userId: user.uid,
    });

    setNewGoal("");
  };

  const toggleComplete = async (goal: Goal) => {
    await updateDoc(doc(db, "goals", goal.id), {
      completed: !goal.completed,
      completedAt: !goal.completed ? Timestamp.now() : null,
    });
  };

  const openGoals = goals.filter((g) => !g.completed);
  const doneToday = goals.filter(
    (g) =>
      g.completed &&
      g.completedAt &&
      g.completedAt.toDate().toDateString() === new Date().toDateString()
  ).length;

  return (
    <AppShell>
      <section className="p-4 md:p-8 w-full max-w-3xl">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-2">Micro Goals &amp; Streaks</h1>
        <p className="text-sm text-red-200 mb-4">
          Set tiny goals, check them off, and keep your momentum going.
        </p>

        <div className="panel-bg rounded-2xl p-4 border border-red-900 mb-6 flex flex-col sm:flex-row sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Current streak</p>
            <p className="text-3xl font-bold">{streak} days</p>
          </div>
          <div className="text-xs opacity-80 sm:text-right">
            <p>Open goals: {openGoals.length}</p>
            <p>Completed today: {doneToday}</p>
          </div>
        </div>

        <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            className="flex-1 px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="e.g. Take a 5-minute stretch break…"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          {goals.length === 0 && (
            <p className="text-xs opacity-75">No goals yet. Add one above to get started.</p>
          )}

          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => toggleComplete(goal)}
              className={`w-full text-left px-3 py-2 rounded border text-sm transition break-words ${goal.completed
                ? "bg-[#14532d] border-green-700 line-through opacity-75"
                : "card-bg border-red-900 hover:opacity-90"
                }`}
            >
              {goal.text}
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
