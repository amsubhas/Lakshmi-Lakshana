"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [websiteUrl,  setWebsiteUrl]  = useState("");
  const [passwordSet, setPasswordSet] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.getSettings().then(s => {
      setUsername(s.username || "");
      setPasswordSet(s.password_set || false);
      setWebsiteUrl(s.website_url || "");
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveSettings({
        username:    username,
        password:    password || undefined,
        website_url: websiteUrl || undefined,
      });
      setToast({ msg: "✔ Settings saved", ok: true });
      setPassword("");
      api.getSettings().then(s => { setPasswordSet(s.password_set || false); });
    } catch (err) {
      setToast({ msg: `❌ ${err}`, ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4_000);
    }
  };

  const Field = ({
    label, type, value, onChange, placeholder, hint,
  }: {
    label: string; type: string; value: string;
    onChange: (v: string) => void; placeholder?: string; hint?: string;
  }) => (
    <div className="mb-5">
      <label className="block text-sm text-muted mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm
                   text-slate-200 focus:outline-none focus:border-accent
                   placeholder:text-slate-600"
      />
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">⚙ Settings</h1>

      {/* Free-OCR notice */}
      <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 text-sm text-green-200">
        <p className="font-semibold mb-1">✔ No API key required</p>
        <p className="text-green-300 text-xs">
          OCR uses free open-source engines (PaddleOCR + EasyOCR + Tesseract) —
          zero paid subscriptions.
        </p>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-2.5 text-sm ${
          toast.ok
            ? "bg-green-900/30 border border-green-600 text-green-200"
            : "bg-red-900/30 border border-red-600 text-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      <form onSubmit={save} className="bg-surface border border-border rounded-xl p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted mb-4">
          Website Credentials
        </p>

        <Field
          label="Target Website URL"
          type="text"
          value={websiteUrl}
          onChange={setWebsiteUrl}
          placeholder="https://srihavyaka.lakshmilakshana.com/"
          hint="The website where family data will be entered."
        />
        <Field
          label="Email / Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={passwordSet ? "••••••  (set — paste to update)" : "Enter password"}
          hint="Stored locally on your Ubuntu machine only. Never sent to Vercel."
        />
        {passwordSet && (
          <p className="text-green-400 text-xs -mt-3 mb-4">✔ Password is configured</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-accent hover:bg-blue-500 rounded-lg
                     text-sm font-semibold disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "💾 Save Settings"}
        </button>
      </form>

      <div className="bg-surface border border-border rounded-xl p-5 text-sm text-muted space-y-2">
        <p className="text-slate-300 font-medium">OCR Stack (all free)</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li><span className="text-slate-300">PaddleOCR</span> — primary; excellent Kannada support</li>
          <li><span className="text-slate-300">EasyOCR</span> — secondary; mixed-script accuracy</li>
          <li><span className="text-slate-300">Tesseract</span> — tertiary; classical OCR fallback</li>
        </ul>
        <p className="text-xs pt-1">
          All three engines run in parallel; results are merged with confidence
          voting. Fields where engines disagree are highlighted for manual review.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 text-sm text-muted space-y-2">
        <p className="text-slate-300 font-medium">Security note</p>
        <p className="text-xs">
          Credentials are stored in the local SQLite database on your Ubuntu server.
          They are never sent to Vercel or any external service.
        </p>
      </div>
    </div>
  );
}
