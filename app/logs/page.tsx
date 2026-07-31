"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { LogEntry } from "@/lib/types";

const LEVEL_STYLE: Record<string, string> = {
  INFO:    "text-blue-400  bg-blue-900/30",
  WARNING: "text-yellow-400 bg-yellow-900/30",
  ERROR:   "text-red-400   bg-red-900/30",
};

export default function LogsPage() {
  const [logs,   setLogs]   = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    api.logs(500).then(l => { setLogs(l); setLoading(false); });
    const t = setInterval(() => api.logs(500).then(setLogs), 10_000);
    return () => clearInterval(t);
  }, []);

  const visible = logs.filter(l => {
    if (filter !== "ALL" && l.level !== filter) return false;
    if (search && !`${l.action} ${l.details}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <h1 className="text-2xl font-bold">📝 Logs</h1>
        <div className="flex gap-2 ml-auto flex-wrap">
          {["ALL","INFO","WARNING","ERROR"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-slate-200"}`}>
              {f}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-surface border border-border rounded px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-accent placeholder:text-slate-600 w-36" />
          <button onClick={() => api.logs(500).then(setLogs)}
            className="px-3 py-1 bg-surface border border-border rounded text-xs text-muted hover:text-slate-200">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="flex-1 overflow-hidden bg-surface border border-border rounded-xl">
          <div className="overflow-auto h-full">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface border-b border-border">
                <tr className="text-muted uppercase tracking-wide">
                  <th className="px-3 py-2.5 text-left w-16">ID</th>
                  <th className="px-3 py-2.5 text-left w-36">Timestamp</th>
                  <th className="px-3 py-2.5 text-left w-20">Level</th>
                  <th className="px-3 py-2.5 text-left w-16">Family</th>
                  <th className="px-3 py-2.5 text-left w-40">Action</th>
                  <th className="px-3 py-2.5 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono">
                {visible.map(l => (
                  <tr key={l.log_id} className="hover:bg-white/2">
                    <td className="px-3 py-1.5 text-muted">{l.log_id}</td>
                    <td className="px-3 py-1.5 text-muted whitespace-nowrap">{l.timestamp}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${LEVEL_STYLE[l.level] || ""}`}>
                        {l.level}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-muted">{l.family_id ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-300">{l.action}</td>
                    <td className="px-3 py-1.5 text-muted max-w-xs truncate">{l.details}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">No matching logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
