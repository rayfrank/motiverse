"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { BackToDashboard } from "@/components/BackToDashboard";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type ThemeMode = "dark" | "midnight" | "light";

type UserSettings = {
  themeMode: ThemeMode;
  accent: "red" | "blue" | "orange" | "purple" | "green";
  reduceMotion: boolean;
  compactMode: boolean;
  showMotivationOnDashboard: boolean;
  showEmployeeStrip: boolean;
};

const DEFAULTS: UserSettings = {
  themeMode: "dark",
  accent: "red",
  reduceMotion: false,
  compactMode: false,
  showMotivationOnDashboard: true,
  showEmployeeStrip: true,
};

const SETTINGS_KEY = "motiverse_settings_v1";

const ACCENTS: Array<UserSettings["accent"]> = [
  "red",
  "blue",
  "orange",
  "purple",
  "green",
];

function applyThemeToDom(settings: UserSettings) {
  // Matches your globals.css variables:
  // --bg-color, --panel-color, --card-color, --accent-color
  const root = document.documentElement;

  const themes: Record<ThemeMode, Record<string, string>> = {
    dark: {
      "--bg-color": "#2a0000",
      "--panel-color": "#400000",
      "--card-color": "#550000",
    },
    midnight: {
      "--bg-color": "#060816",
      "--panel-color": "#0c1230",
      "--card-color": "#101a3e",
    },
    light: {
      "--bg-color": "#f7f7fb",
      "--panel-color": "#ffffff",
      "--card-color": "#ffffff",
    },
  };

  const accents: Record<UserSettings["accent"], string> = {
    red: "#770000",
    blue: "#2563eb",
    orange: "#f97316",
    purple: "#a855f7",
    green: "#22c55e",
  };

  // Apply theme variables
  Object.entries(themes[settings.themeMode]).forEach(([k, v]) =>
    root.style.setProperty(k, v)
  );

  // Apply accent variable
  root.style.setProperty("--accent-color", accents[settings.accent]);

  // Optional toggles using data attributes
  root.dataset.compact = settings.compactMode ? "1" : "0";
  root.dataset.reduceMotion = settings.reduceMotion ? "1" : "0";
}

export default function SettingsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const accentPreview = useMemo(() => settings.accent, [settings.accent]);

  // Auth gate
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUserId(u.uid);
    });
    return () => unsub();
  }, [router]);

  // Load settings: localStorage first (instant), then Firestore
  useEffect(() => {
    if (!userId) return;

    // 1) local cache
    try {
      const cached = localStorage.getItem(SETTINGS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<UserSettings>;
        const merged = { ...DEFAULTS, ...parsed };
        setSettings(merged);
        applyThemeToDom(merged);
      } else {
        applyThemeToDom(DEFAULTS);
      }
    } catch {
      applyThemeToDom(DEFAULTS);
    }

    // 2) Firestore
    (async () => {
      try {
        const ref = doc(db, "settings", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<UserSettings>;
          const merged = { ...DEFAULTS, ...data };
          setSettings(merged);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
          applyThemeToDom(merged);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Apply live on change + update local cache
  useEffect(() => {
    if (loading) return;
    applyThemeToDom(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { }
  }, [settings, loading]);

  const saveToFirestore = async () => {
    if (!userId) return;
    setSaving(true);
    setStatus("");
    try {
      const ref = doc(db, "settings", userId);
      await setDoc(
        ref,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setStatus("Saved successfully.");
    } catch (e) {
      console.error("Failed to save settings:", e);
      setStatus("Failed to save. Check console / rules.");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(""), 2500);
    }
  };

  const reset = () => {
    setSettings(DEFAULTS);
    setStatus("Reset to default.");
    setTimeout(() => setStatus(""), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] body-bg text-white flex items-center justify-center">
        <p className="text-sm opacity-80">Loading settings…</p>
      </main>
    );
  }

  return (
    <AppShell>
      <section className="p-4 md:p-8 w-full">
        <BackToDashboard />

        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-red-200 mb-6">
            Customize your Motiverse experience. Changes apply instantly.
          </p>

          {status && (
            <div className="mb-4 text-xs px-3 py-2 rounded border border-red-900 panel-bg">
              {status}
            </div>
          )}

          {/* Appearance */}
          <div className="panel-bg rounded-2xl p-4 border border-red-900 mb-6">
            <h2 className="text-lg font-semibold mb-3">Appearance</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Theme mode
                </label>
                <select
                  className="w-full px-3 py-2 rounded body-bg border border-red-900 text-sm"
                  value={settings.themeMode}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      themeMode: e.target.value as ThemeMode,
                    }))
                  }
                >
                  <option value="dark">Dark (Motiverse Red)</option>
                  <option value="midnight">Midnight</option>
                  <option value="light">Light</option>
                </select>
                <p className="text-[11px] opacity-75 mt-1">
                  Desktop keeps the sidebar. Mobile uses a top bar + drawer (if
                  your Sidebar supports it).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  Accent color
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSettings((s) => ({ ...s, accent: c }))}
                      className={`px-3 py-2 rounded border text-xs font-semibold ${settings.accent === c
                          ? "accent-bg border accent-border"
                          : "border-red-900"
                        }`}
                      type="button"
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-xs opacity-90">
                  Preview:
                  <span className="ml-2 inline-flex items-center gap-2">
                    <span className="px-2 py-1 rounded accent-bg border accent-border font-semibold">
                      {accentPreview}
                    </span>
                    <span className="text-[11px] opacity-75">
                      Buttons and highlights
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="panel-bg rounded-2xl p-4 border border-red-900 mb-6">
            <h2 className="text-lg font-semibold mb-3">Preferences</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleRow
                label="Reduce motion"
                desc="Helpful for accessibility and smoother mobile performance."
                checked={settings.reduceMotion}
                onChange={(v) => setSettings((s) => ({ ...s, reduceMotion: v }))}
              />

              <ToggleRow
                label="Compact mode"
                desc="Tighter spacing for small screens."
                checked={settings.compactMode}
                onChange={(v) => setSettings((s) => ({ ...s, compactMode: v }))}
              />

              <ToggleRow
                label="Show dashboard motivation"
                desc="Display motivational prompt card on dashboard."
                checked={settings.showMotivationOnDashboard}
                onChange={(v) =>
                  setSettings((s) => ({ ...s, showMotivationOnDashboard: v }))
                }
              />

              <ToggleRow
                label="Show employee strip"
                desc="Show saved employee details at the top of dashboard."
                checked={settings.showEmployeeStrip}
                onChange={(v) =>
                  setSettings((s) => ({ ...s, showEmployeeStrip: v }))
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={saveToFirestore}
              disabled={saving}
              className="px-4 py-2 rounded accent-bg hover:opacity-90 disabled:opacity-60 font-semibold text-sm border accent-border"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            <button
              onClick={reset}
              type="button"
              className="px-4 py-2 rounded border border-red-900 text-sm hover:opacity-90"
            >
              Reset
            </button>
          </div>

          <p className="text-[11px] opacity-70 mt-3">
            Settings are stored per user in Firestore and cached locally for
            faster loading next time.
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="card-bg rounded-xl p-3 border border-red-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-[11px] opacity-75">{desc}</p>
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`shrink-0 w-12 h-7 rounded-full border transition relative ${checked ? "accent-bg accent-border" : "border-red-900"
            }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"
              }`}
          />
        </button>
      </div>
    </div>
  );
}
