"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BackToDashboard } from "@/components/BackToDashboard";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

type InboxMessage = {
  id: string;
  from: string;
  to: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  read: boolean;
};

export default function InboxPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [received, setReceived] = useState<InboxMessage[]>([]);
  const [sent, setSent] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toEmail, setToEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"received" | "sent">("received");

  // 1) Watch auth just to know who we are
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user || !user.email) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // 2) Subscribe to inbox messages when we know the email
  useEffect(() => {
    if (!userEmail) return;

    const inboxRef = collection(db, "inbox");

    // no orderBy -> no composite index needed
    const qReceived = query(inboxRef, where("to", "==", userEmail));
    const qSent = query(inboxRef, where("from", "==", userEmail));

    const handleSnapshot =
      (setter: (items: InboxMessage[]) => void) =>
      (snap: QuerySnapshot<DocumentData>) => {
        const items: InboxMessage[] = [];
        snap.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // newest first in memory
        items.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        );
        setter(items);
      };

    const handleError = (err: any) => {
      console.error("Inbox snapshot error:", err);
      setError(
        "Failed to load messages. Check Firestore rules / indexes / console."
      );
    };

    const unsubReceived = onSnapshot(
      qReceived,
      handleSnapshot(setReceived),
      handleError
    );
    const unsubSent = onSnapshot(
      qSent,
      handleSnapshot(setSent),
      handleError
    );

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [userEmail]);

  // 3) Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;
    if (!toEmail.trim() || !title.trim() || !body.trim()) return;

    try {
      const inboxRef = collection(db, "inbox");
      await addDoc(inboxRef, {
        from: user.email,
        to: toEmail.trim(),
        title: title.trim(),
        body: body.trim(),
        createdAt: Timestamp.now(),
        read: false,
      });

      setToEmail("");
      setTitle("");
      setBody("");
      setTab("sent"); // jump to sent so you see it
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Check console / rules.");
    }
  };

  // 4) Toggle read/unread on received messages
  const toggleRead = async (msg: InboxMessage) => {
    try {
      const ref = doc(db, "inbox", msg.id);
      await updateDoc(ref, { read: !msg.read });
    } catch (err) {
      console.error("Failed to update message:", err);
      setError("Failed to update message. Check console / rules.");
    }
  };

  const list = tab === "received" ? received : sent;

  return (
    <main className="flex h-screen body-bg text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-2">Inbox</h1>
        <p className="text-sm text-red-200 mb-4">
          Motivational nudges, reminders, and messages from your team.
        </p>

        {error && (
          <p className="mb-3 text-xs text-red-300">{error}</p>
        )}

        {/* Compose */}
        <form
          onSubmit={sendMessage}
          className="mb-6 space-y-2 max-w-xl panel-bg rounded-2xl p-4 border border-red-900"
        >
          <p className="text-xs opacity-75">
            Send a message by email. It will appear in their Motiverse inbox if
            they log in with that email.
          </p>
          <input
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="To (email)"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
            placeholder="Message"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Send Message
          </button>
        </form>

        {/* Tabs */}
        <div className="mb-3 flex gap-2 text-xs">
          <button
            onClick={() => setTab("received")}
            className={`px-3 py-1 rounded-full border ${
              tab === "received"
                ? "accent-bg accent-border"
                : "border-red-900"
            }`}
          >
            Received ({received.length})
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`px-3 py-1 rounded-full border ${
              tab === "sent" ? "accent-bg accent-border" : "border-red-900"
            }`}
          >
            Sent ({sent.length})
          </button>
        </div>

        {/* Messages list */}
        {!userEmail && loading ? (
          <p className="text-sm opacity-80">Loading messages…</p>
        ) : list.length === 0 ? (
          <p className="text-sm opacity-80">
            No {tab === "received" ? "received" : "sent"} messages yet.
          </p>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {list.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl p-4 border text-sm ${
                  msg.read
                    ? "body-bg border-red-900 opacity-70"
                    : "card-bg border-red-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h2 className="font-semibold">{msg.title}</h2>
                    <p className="text-[11px] text-red-200">
                      {tab === "received"
                        ? `From: ${msg.from}`
                        : `To: ${msg.to}`}
                    </p>
                  </div>
                  {tab === "received" && (
                    <button
                      onClick={() => toggleRead(msg)}
                      className="text-[11px] underline"
                    >
                      Mark as {msg.read ? "unread" : "read"}
                    </button>
                  )}
                </div>
                <p className="opacity-90 mb-1">{msg.body}</p>
                <p className="mt-1 text-[10px] text-red-200">
                  {msg.createdAt?.toDate?.().toLocaleString?.() ?? ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
