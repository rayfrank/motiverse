"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";

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

  // Protect route + subscribe to news
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
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
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

    const ref = collection(db, "news");
    await addDoc(ref, {
      title: title.trim(),
      summary: summary.trim(),
      createdAt: Timestamp.now(),
      author: user.displayName || user.email || "Team Member",
    });

    setTitle("");
    setSummary("");
  };

  return (
    <main className="flex h-screen bg-[#2a0000] text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2">News Feed</h1>
        <p className="text-sm text-red-200 mb-4">
          Company wellbeing updates, tips, and announcements.
        </p>

        {/* Create post */}
        <form onSubmit={addNews} className="mb-6 space-y-2 max-w-2xl">
          <p className="text-xs opacity-75">
            Use this to post wellness updates, reminders, or shout-outs to the
            team.
          </p>
          <input
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            placeholder="Headline (e.g. Mindfulness session this Friday)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded bg-[#2a0000] border border-red-900 text-sm"
            placeholder="Short description of the update"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#770000] hover:bg-[#990000] text-sm font-semibold border border-red-900"
          >
            Post Update
          </button>
        </form>

        {/* Feed */}
        <div className="space-y-4 max-w-2xl">
          {items.length === 0 ? (
            <p className="text-sm opacity-80">No updates yet.</p>
          ) : (
            items.map((item) => {
              const d = item.createdAt.toDate();
              return (
                <article
                  key={item.id}
                  className="bg-[#550000] rounded-2xl p-4 border border-red-900"
                >
                  <h2 className="text-lg font-semibold mb-1">
                    {item.title}
                  </h2>
                  <p className="text-sm opacity-90 mb-2">{item.summary}</p>
                  <p className="text-[10px] text-red-200 flex justify-between">
                    <span>{item.author}</span>
                    <span>{d.toLocaleString()}</span>
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
