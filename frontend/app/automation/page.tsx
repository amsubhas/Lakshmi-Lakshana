"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { SSEConsole } from "@/components/SSEConsole";
import { ConflictModal } from "@/components/ConflictModal";
import type { AppStatus, Conflict } from "@/lib/types";
import { Globe, GraduationCap, Play, Pause, Square } from "lucide-react";

export default function AutomationPage() {
  const [status,     setStatus]   = useState<AppStatus | null>(null);
  const [learning,   setLearning] = useState(false);
  const [conflict,   setConflict] = useState<Conflict | null>(null);
  const [toast,      setToast]    = useState<{msg:string;ok:boolean}|null>(null);

  const refresh = useCallback(() => api.status().then(setStatus), []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [refresh]);

  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const act = async (fn: () => Promise<unknown>, label: string) => {
    try { const r = await fn() as { message?: string }; show(r?.message || `✔ ${label} done`); refresh(); }
    catch (e) { show(`❌ ${label}: ${e}`, false); }
  };

  const Dot = ({ on }: { on: boolean }) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${on ? "bg-green-400" : "bg-red-500"}`} />
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-bold shrink-0">🌐 Automation</h1>

      {toast && (
        <div className={`rounded-lg px-4 py-2.5 text-sm shrink-0 ${
          toast.ok ? "bg-green-900/30 border border-green-600 text-green-200"
                   : "bg-red-900/30 border border-red-600 text-red-200"}`}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">

        {/* Status card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">Status</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Dot on={!!status?.browser_open} />
              <span>{status?.browser_open ? "Browser open" : "Browser closed"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dot on={!!status?.workflow_ok} />
              <span>{status?.workflow_ok ? "Workflow recorded" : "No workflow"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dot on={!!status?.busy} />
              <span>{status?.busy ? `Running: ${status.active_task}` : "Idle"}</span>
            </div>
          </div>
        </div>

        {/* Browser card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">Browser</p>
          <div className="space-y-2">
            <button onClick={() => act(api.browserLogin, "Open Browser")}
              className="flex w-full items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium">
              <Globe size={15} /> Open Browser & Login
            </button>
            <button onClick={() => act(api.syncStop, "Close Browser")}
              className="flex w-full items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
              <Square size={15} /> Close Browser
            </button>
          </div>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            After login, navigate manually to the data-entry page, then start Learning Mode or Sync.
          </p>
        </div>

        {/* Learning card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">Learning Mode</p>
          <div className="space-y-2">
            <button
              onClick={async () => {
                await act(api.learningStart, "Learning Start");
                setLearning(true);
              }}
              disabled={!status?.browser_open || learning}
              className="flex w-full items-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium disabled:opacity-40">
              <GraduationCap size={15} /> Start Recording
            </button>
            {learning && (
              <button
                onClick={async () => {
                  await act(api.learningStop, "Learning Stop");
                  setLearning(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 bg-orange-700 hover:bg-orange-600 rounded-lg text-sm font-medium animate-pulse">
                ⏹ Stop Recording
              </button>
            )}
          </div>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Record ONE complete family head + member entry. Only needed once.
          </p>
        </div>
      </div>

      {/* Sync controls */}
      <div className="bg-surface border border-border rounded-xl p-5 shrink-0">
        <p className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">Data Entry Sync</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => act(api.syncStart, "Sync")}
            disabled={!status?.browser_open || !status?.workflow_ok || status?.busy}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-semibold disabled:opacity-40">
            <Play size={15} /> Start Data Entry
          </button>
          <button onClick={() => act(api.syncPause, "Pause")} disabled={!status?.busy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm disabled:opacity-40">
            <Pause size={15} /> Pause
          </button>
          <button onClick={() => act(api.syncStop, "Stop")}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-800 hover:bg-red-700 rounded-lg text-sm">
            <Square size={15} /> Stop
          </button>
        </div>
        {!status?.workflow_ok && (
          <p className="text-yellow-400 text-xs mt-3">
            ⚠ No workflow recorded – complete Learning Mode first.
          </p>
        )}
      </div>

      {/* Live console */}
      <SSEConsole
        onConflict={d => setConflict(d as Conflict)}
        onStatusChange={() => refresh()}
      />

      {conflict && (
        <ConflictModal conflict={conflict} onResolved={() => { setConflict(null); refresh(); }} />
      )}
    </div>
  );
}
