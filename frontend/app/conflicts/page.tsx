"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Conflict } from "@/lib/types";

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const load = () => api.conflicts().then(c => { setConflicts(c); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resolve = async (id: number, resolution: string) => {
    setResolving(id);
    try {
      await api.resolveConflict(id, resolution);
      setConflicts(prev => prev.filter(c => c.conflict_id !== id));
    } catch (e) { alert(`Error: ${e}`); }
    finally { setResolving(null); }
  };

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚡ Conflicts</h1>
        <span className="text-muted text-sm">{conflicts.length} pending</span>
      </div>

      {conflicts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <span className="text-5xl">✅</span>
          <p className="text-lg font-semibold">No pending conflicts</p>
          <p className="text-muted text-sm">All field conflicts have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map(c => (
            <div key={c.conflict_id}
              className="bg-surface border border-red-800/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-200">
                  Field: <span className="text-accent">{c.field}</span>
                </span>
                <span className="text-xs text-muted">
                  Family {c.family_id}{c.member_id ? ` · Member ${c.member_id}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-950 border-l-4 border-blue-500 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">🌐 Website value</p>
                  <p className="text-blue-200 text-sm break-words">
                    {c.website_value || <em className="text-muted">empty</em>}
                  </p>
                </div>
                <div className="bg-green-950 border-l-4 border-green-500 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">🗄 Database value</p>
                  <p className="text-green-200 text-sm break-words">
                    {c.database_value || <em className="text-muted">empty</em>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {(["website","database","skip"] as const).map(r => (
                  <button key={r}
                    onClick={() => resolve(c.conflict_id!, r)}
                    disabled={resolving === c.conflict_id}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors
                      ${r === "website"  ? "bg-blue-600 hover:bg-blue-500" :
                        r === "database" ? "bg-green-700 hover:bg-green-600" :
                                           "bg-slate-700 hover:bg-slate-600"}`}>
                    {r === "website" ? "Use Website" : r === "database" ? "Use Database" : "Skip"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
