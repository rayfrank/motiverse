"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BackToDashboard } from "@/components/BackToDashboard";
import { auth, db } from "@/lib/firebaseClient";
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from "firebase/firestore";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: Timestamp;
  author?: string;
};

export default function NewsFeedPage() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = collection(db, "news");
      const q = query(ref, orderBy("createdAt", "desc"));

      const unsubNews = onSnapshot(q, (snap) => {
        const list: NewsItem[] = [];
        snap.forEach((docSnap) => list.push({ id: docSnap.id, ...(docSnap.data() as any) }));
        setItems(list);
      });

      return () => unsubNews();
    });

    return () => unsubAuth();
  }, [router]);

  const addNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !title.trim() || !summary.trim()) return;

    await addDoc(collection(db, "news"), {
      title: title.trim(),
      summary: summary.trim(),
      createdAt: Timestamp.now(),
      author: user.displayName || user.email || "Team Member",
    });

    setTitle("");
    setSummary("");
  };

  return (
    <AppShell>
      <section className="p-4 md:p-8">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-2">News Feed</h1>
        <p className="text-sm text-red-200 mb-4">
          Company wellbeing updates, tips, and announcements.
        </p>

        <form
          onSubmit={addNews}
          className="mb-6 space-y-2 w-full max-w-3xl panel-bg rounded-2xl p-4 border border-red-900"
        >
          <p className="text-xs opacity-75">
            Post wellness updates, reminders, or shout-outs to the team.
          </p>
          <input
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Headline (e.g. Mindfulness session this Friday)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Short description of the update"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Post Update
          </button>
        </form>

        <div className="space-y-4 w-full max-w-3xl">
          {items.length === 0 ? (
            <p className="text-sm opacity-80">No updates yet.</p>
          ) : (
            items.map((item) => {
              const d = item.createdAt.toDate();
              return (
                <article key={item.id} className="card-bg rounded-2xl p-4 border border-red-900">
                  <h2 className="text-lg font-semibold mb-1 break-words">{item.title}</h2>
                  <p className="text-sm opacity-90 mb-2 break-words">{item.summary}</p>
                  <p className="text-[10px] text-red-200 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="break-words">{item.author}</span>
                    <span>{d.toLocaleString()}</span>
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
