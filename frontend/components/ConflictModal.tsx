"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Conflict } from "@/lib/types";

interface Props {
  conflict: Conflict;
  onResolved: () => void;
}

export function ConflictModal({ conflict, onResolved }: Props) {
  const [loading, setLoading] = useState(false);

  const resolve = async (choice: string) => {
    setLoading(true);
    try {
      await api.resolveActive(choice);
      onResolved();
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border-2 border-red-500 rounded-xl p-7 w-full max-w-lg shadow-2xl">
        <h2 className="text-red-400 font-bold text-lg mb-1">⚡ Field Conflict</h2>
        <p className="text-muted text-sm mb-5">
          Field: <span className="text-slate-200 font-medium">{conflict.field}</span>
          {conflict.family_id && ` · Family ${conflict.family_id}`}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-950 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-xs text-muted mb-1">🌐 Website value</p>
            <p className="text-blue-200 text-sm break-words">
              {conflict.website_value || <em className="text-muted">empty</em>}
            </p>
          </div>
          <div className="bg-green-950 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-xs text-muted mb-1">🗄 Database value</p>
            <p className="text-green-200 text-sm break-words">
              {conflict.database_value || <em className="text-muted">empty</em>}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted mb-4">
          Sync is paused. Choose which value to keep:
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => resolve("website")} disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium disabled:opacity-50">
            Use Website
          </button>
          <button onClick={() => resolve("database")} disabled={loading}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium disabled:opacity-50">
            Use Database
          </button>
          <button onClick={() => resolve("skip")} disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium disabled:opacity-50">
            Skip Field
          </button>
        </div>
      </div>
    </div>
  );
}
