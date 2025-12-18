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

type Bookmark = {
  id: string;
  label: string;
  url: string;
  note?: string;
  userId: string;
  createdAt: Timestamp;
};

export default function BookmarksPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth + subscribe
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const ref = collection(db, "bookmarks");
      const q = query(ref, where("userId", "==", user.uid));

      const unsubBookmarks = onSnapshot(
        q,
        (snap) => {
          const list: Bookmark[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });

          // sort newest first
          list.sort(
            (a, b) =>
              b.createdAt.toMillis() - a.createdAt.toMillis()
          );
          setBookmarks(list);
          setLoading(false);
        },
        (err) => {
          console.error("Bookmarks snapshot error:", err);
          setError("Failed to load bookmarks. Check console / rules.");
          setLoading(false);
        }
      );

      return () => unsubBookmarks();
    });

    return () => unsubAuth();
  }, [router]);

  const saveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !label.trim() || !url.trim()) return;

    try {
      const ref = collection(db, "bookmarks");
      await addDoc(ref, {
        label: label.trim(),
        url: url.trim(),
        note: note.trim(),
        userId,
        createdAt: Timestamp.now(),
      });

      setLabel("");
      setUrl("");
      setNote("");
    } catch (err) {
      console.error("Failed to save bookmark:", err);
      setError("Failed to save bookmark. Check console / rules.");
    }
  };

  return (
    <main className="flex h-screen body-bg text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto max-w-2xl">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-1">Bookmarks</h1>
        <p className="text-sm text-red-200 mb-4">
          Save wellness resources, articles, and prompts you want to revisit.
        </p>

        {error && (
          <p className="text-xs text-red-300 mb-3">{error}</p>
        )}

        {/* Form */}
        <form
          onSubmit={saveBookmark}
          className="panel-bg rounded-2xl p-4 mb-6 border border-red-900 space-y-2"
        >
          <input
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Label (e.g. Coping with burnout)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Link URL (https://…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Optional note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Save Bookmark
          </button>
        </form>

        {/* List */}
        {loading ? (
          <p className="text-sm opacity-80">Loading bookmarks…</p>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm opacity-80">No bookmarks yet.</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block card-bg rounded-xl p-3 border border-red-900 text-sm hover:opacity-90"
              >
                <p className="font-semibold">{b.label}</p>
                <p className="text-xs text-red-200 break-all">{b.url}</p>
                {b.note && (
                  <p className="text-xs opacity-90 mt-1">{b.note}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
