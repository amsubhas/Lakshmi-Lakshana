"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { SSEConsole } from "@/components/SSEConsole";
import { ConflictModal } from "@/components/ConflictModal";
import type { ProgressSummary, AppStatus, Conflict } from "@/lib/types";
import Link from "next/link";
import {
  Upload, Cpu, CheckSquare, FileSpreadsheet,
  Pause, Square, Database,
} from "lucide-react";

const STAT = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-surface border border-border rounded-xl p-4">
    <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const Btn = ({ icon: Icon, label, onClick, variant = "default", disabled = false }: {
  icon: React.ElementType; label: string; onClick: () => void;
  variant?: "default" | "success" | "danger" | "ghost"; disabled?: boolean;
}) => {
  const cls = {
    default: "bg-slate-700 hover:bg-slate-600",
    success: "bg-green-700 hover:bg-green-600",
    danger:  "bg-red-800   hover:bg-red-700",
    ghost:   "bg-transparent border border-border hover:bg-white/5",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${cls}`}>
      <Icon size={15} />
      {label}
    </button>
  );
};

export default function Dashboard() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [status,   setStatus]   = useState<AppStatus | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [toast,    setToast]    = useState("");

  const refresh = useCallback(async () => {
    const [p, s] = await Promise.all([api.progress(), api.status()]);
    setProgress(p);
    setStatus(s);
    if (s.conflict && !conflict) setConflict(s.conflict as Conflict);
  }, [conflict]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t); }, [refresh]);

  const act = async (fn: () => Promise<unknown>, label: string) => {
    try { await fn(); refresh(); } catch (e) { setToast(`❌ ${label}: ${e}`); setTimeout(() => setToast(""), 5000); }
  };

  const handleConflict = (data: object) => setConflict(data as Conflict);

  return (
    <div className="flex flex-col h-full gap-4">
      {toast && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg px-4 py-2 text-sm text-red-200">
          {toast}
        </div>
      )}

      {/* Alerts */}
      {status && !status.workflow_ok && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg px-4 py-2.5 text-sm text-yellow-200">
          ⚠ No workflow recorded. Go to <strong>Automation</strong> → run Learning Mode once.
        </div>
      )}
      {progress && progress.pending_verify > 0 && (
        <div className="bg-green-900/30 border border-green-600 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>📋 <strong>{progress.pending_verify}</strong> records ready for verification</span>
          <Link href="/verify" className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm font-medium">
            Open →
          </Link>
        </div>
      )}
      {progress && progress.conflicts_open > 0 && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>⚡ <strong>{progress.conflicts_open}</strong> unresolved conflicts</span>
          <Link href="/conflicts" className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium">
            Resolve →
          </Link>
        </div>
      )}
      {status?.busy && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg px-3 py-2 text-sm flex items-center gap-3">
          <span className="animate-spin">⚙</span>
          <span>Running: <strong>{status.active_task}</strong></span>
          <div className="ml-auto flex gap-2">
            <Btn icon={Pause}  label="Pause" onClick={() => act(api.syncPause, "Pause")} variant="ghost" />
            <Btn icon={Square} label="Stop"  onClick={() => act(api.syncStop,  "Stop")}  variant="danger" />
          </div>
        </div>
      )}

      {/* Progress cards */}
      {progress && (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          <STAT label="Imported"      value={progress.images_imported} color="text-blue-400" />
          <STAT label="OCR Done"      value={progress.ocr_completed}   color="text-blue-400" />
          <STAT label="Pending Verify"value={progress.pending_verify}  color="text-yellow-400" />
          <STAT label="Verified"      value={progress.verified}        color="text-green-400" />
          <STAT label="Sync Done"     value={progress.sync_completed}  color="text-green-400" />
          <STAT label="Members"       value={progress.members_total}   color="text-blue-400" />
          <STAT label="Conflicts"     value={progress.conflicts_open}  color="text-red-400" />
          <STAT label="Errors"        value={progress.errors}          color="text-red-400" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link href="/import">
          <Btn icon={Upload}        label="Import Images" onClick={() => {}} />
        </Link>
        <Btn icon={Cpu}            label="Run OCR"     onClick={() => act(api.startOcr,     "OCR")} disabled={status?.busy} />
        <Link href="/verify">
          <Btn icon={CheckSquare}  label="Verify"      onClick={() => {}} />
        </Link>
        <Btn icon={FileSpreadsheet} label="Excel"      onClick={() => act(() => api.generateExcel().then(r => { if(r.url) window.open(r.url); }), "Excel")} />
        <Btn icon={Database}       label="Backup"      onClick={() => act(api.backup, "Backup")} variant="ghost" />
      </div>

      {/* Console */}
      <SSEConsole onConflict={handleConflict} onStatusChange={() => refresh()} />

      {/* Conflict modal */}
      {conflict && (
        <ConflictModal conflict={conflict} onResolved={() => { setConflict(null); refresh(); }} />
      )}
    </div>
  );
}
