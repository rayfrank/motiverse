"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";

type ThemeName = "red" | "midnight" | "forest";

type UserSettings = {
  enablePrompts: boolean;
  enableReminders: boolean;
  reminderTime: string; // "09:00"
  theme: ThemeName;
  accentColor: string;
};

const defaultSettings: UserSettings = {
  enablePrompts: true,
  enableReminders: true,
  reminderTime: "09:00",
  theme: "red",
  accentColor: "#ef4444", // Tailwind red-500
};

const THEME_OPTIONS: { id: ThemeName; label: string; preview: string }[] = [
  { id: "red", label: "Motiverse Red", preview: "#7f1d1d" },
  { id: "midnight", label: "Midnight", preview: "#020617" },
  { id: "forest", label: "Forest", preview: "#064e3b" },
];

function applyThemeToDocument(settings: UserSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const themeMap: Record<ThemeName, { bg: string; panel: string; card: string }> =
    {
      red: {
        bg: "#2a0000",
        panel: "#400000",
        card: "#550000",
      },
      midnight: {
        bg: "#020617",
        panel: "#020617",
        card: "#111827",
      },
      forest: {
        bg: "#022c22",
        panel: "#064e3b",
        card: "#065f46",
      },
    };

  const theme = themeMap[settings.theme] ?? themeMap.red;

  root.style.setProperty("--bg-color", theme.bg);
  root.style.setProperty("--panel-color", theme.panel);
  root.style.setProperty("--card-color", theme.card);
  root.style.setProperty("--accent-color", settings.accentColor || "#ef4444");
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "settings", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const s = { ...defaultSettings, ...(snap.data() as any) } as UserSettings;
        setSettings(s);
        applyThemeToDocument(s);
      } else {
        setSettings(defaultSettings);
        applyThemeToDocument(defaultSettings);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (settings) applyThemeToDocument(settings);
  }, [settings?.theme, settings?.accentColor]);

  const updateField = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const saveSettings = async () => {
    const user = auth.currentUser;
    if (!user || !settings) return;

    setSaving(true);
    try {
      const ref = doc(db, "settings", user.uid);
      await setDoc(ref, settings, { merge: true });
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Could not save settings. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <main className="flex h-screen body-bg text-white items-center justify-center">
        <p className="text-sm opacity-80">Loading your settings…</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen body-bg text-white">
      <Sidebar />
      <section className="flex-1 p-8 overflow-y-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-red-200 mb-6">
          Control how Motiverse looks and how often it nudges you.
        </p>

        <div className="panel-bg rounded-2xl p-4 border border-red-900 space-y-5">
          {/* Notifications */}
          <SettingRow
            title="Motivational Prompts"
            description="Show motivational quotes and encouragement on your dashboard."
          >
            <input
              type="checkbox"
              checked={settings.enablePrompts}
              onChange={(e) =>
                updateField("enablePrompts", e.target.checked)
              }
            />
          </SettingRow>

          <SettingRow
            title="AI Reminders"
            description="Send reminders to stretch, rest, or hydrate."
          >
            <input
              type="checkbox"
              checked={settings.enableReminders}
              onChange={(e) =>
                updateField("enableReminders", e.target.checked)
              }
            />
          </SettingRow>

          <SettingRow
            title="Preferred reminder time"
            description="Used for daily wellbeing reminders (local time)."
          >
            <input
              type="time"
              className="px-3 py-1 rounded body-bg border border-red-900 text-xs"
              value={settings.reminderTime}
              onChange={(e) =>
                updateField("reminderTime", e.target.value)
              }
            />
          </SettingRow>

          {/* Theme */}
          <div className="border-t border-red-900 pt-4 space-y-3">
            <h2 className="text-sm font-semibold">Theme</h2>
            <div className="flex flex-col gap-2">
              {THEME_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center justify-between text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="theme"
                      checked={settings.theme === opt.id}
                      onChange={() => updateField("theme", opt.id)}
                    />
                    <span>{opt.label}</span>
                  </div>
                  <span
                    className="w-10 h-4 rounded-full border border-red-900"
                    style={{ backgroundColor: opt.preview }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <SettingRow
            title="Accent color"
            description="Used for buttons and highlights."
          >
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) =>
                updateField("accentColor", e.target.value)
              }
              className="w-10 h-6 p-0 border border-red-900 rounded"
            />
          </SettingRow>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="mt-2 px-4 py-2 rounded accent-bg hover:opacity-90 disabled:opacity-60 font-semibold text-sm border accent-border"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-red-200">
          In a real deployment, these preferences can drive email or push
          notifications and consistent theming across all devices.
        </p>
      </section>
    </main>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{description}</p>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
