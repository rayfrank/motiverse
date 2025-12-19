"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
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

  useEffect(() => {
    if (!userEmail) return;

    const inboxRef = collection(db, "inbox");
    const qReceived = query(inboxRef, where("to", "==", userEmail));
    const qSent = query(inboxRef, where("from", "==", userEmail));

    const handleSnapshot =
      (setter: (items: InboxMessage[]) => void) =>
        (snap: QuerySnapshot<DocumentData>) => {
          const items: InboxMessage[] = [];
          snap.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          items.sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0)
          );
          setter(items);
        };

    const handleError = (err: any) => {
      console.error("Inbox snapshot error:", err);
      setError("Failed to load messages. Check Firestore rules / indexes / console.");
    };

    const unsubReceived = onSnapshot(qReceived, handleSnapshot(setReceived), handleError);
    const unsubSent = onSnapshot(qSent, handleSnapshot(setSent), handleError);

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [userEmail]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;
    if (!toEmail.trim() || !title.trim() || !body.trim()) return;

    try {
      await addDoc(collection(db, "inbox"), {
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
      setTab("sent");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Check console / rules.");
    }
  };

  const toggleRead = async (msg: InboxMessage) => {
    try {
      await updateDoc(doc(db, "inbox", msg.id), { read: !msg.read });
    } catch (err) {
      console.error("Failed to update message:", err);
      setError("Failed to update message. Check console / rules.");
    }
  };

  const list = tab === "received" ? received : sent;

  return (
    <AppShell>
      <section className="p-4 md:p-8">
        <BackToDashboard />

        <h1 className="text-2xl font-bold mb-2">Inbox</h1>
        <p className="text-sm text-red-200 mb-4">
          Motivational nudges, reminders, and messages from your team.
        </p>

        {error && <p className="mb-3 text-xs text-red-300">{error}</p>}

        {/* Compose (stacks naturally on mobile) */}
        <form
          onSubmit={sendMessage}
          className="mb-6 space-y-2 w-full max-w-2xl panel-bg rounded-2xl p-4 border border-red-900"
        >
          <p className="text-xs opacity-75">
            Send a message by email. It will appear in their Motiverse inbox if they log in with that email.
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
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded accent-bg hover:opacity-90 text-sm font-semibold border accent-border"
          >
            Send Message
          </button>
        </form>

        {/* Tabs (wrap on mobile) */}
        <div className="mb-3 flex gap-2 text-xs flex-wrap">
          <button
            onClick={() => setTab("received")}
            className={`px-3 py-1 rounded-full border ${tab === "received" ? "accent-bg accent-border" : "border-red-900"
              }`}
          >
            Received ({received.length})
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`px-3 py-1 rounded-full border ${tab === "sent" ? "accent-bg accent-border" : "border-red-900"
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
          <div className="space-y-3 w-full max-w-3xl">
            {list.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl p-4 border text-sm ${msg.read ? "body-bg border-red-900 opacity-70" : "card-bg border-red-700"
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h2 className="font-semibold break-words">{msg.title}</h2>
                    <p className="text-[11px] text-red-200 break-words">
                      {tab === "received" ? `From: ${msg.from}` : `To: ${msg.to}`}
                    </p>
                  </div>
                  {tab === "received" && (
                    <button onClick={() => toggleRead(msg)} className="text-[11px] underline self-start sm:self-auto">
                      Mark as {msg.read ? "unread" : "read"}
                    </button>
                  )}
                </div>
                <p className="opacity-90 break-words">{msg.body}</p>
                <p className="mt-2 text-[10px] text-red-200">
                  {msg.createdAt?.toDate?.().toLocaleString?.() ?? ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
