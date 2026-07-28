"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Family } from "@/lib/types";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

const STATUS_COLOR: Record<string,string> = {
  pending:  "text-yellow-400 bg-yellow-900/30",
  verified: "text-green-400  bg-green-900/30",
  skipped:  "text-slate-400  bg-slate-700/30",
  error:    "text-red-400    bg-red-900/30",
};

export default function VerifyListPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.families("pending").then(f => { setFamilies(f); setLoading(false); });
  }, []);

  if (loading) return <p className="text-muted">Loading…</p>;

  if (families.length === 0) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
      <CheckSquare size={48} className="text-green-400" />
      <h2 className="text-xl font-bold">All records verified ✔</h2>
      <p className="text-muted">No pending records. Ready to sync or generate Excel.</p>
      <Link href="/" className="px-4 py-2 bg-accent hover:bg-blue-500 rounded-lg text-sm font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 Verification Queue</h1>
        <span className="text-muted text-sm">{families.length} pending</span>
      </div>
      <Link href={`/verify/${families[0].family_id}`}
        className="block px-4 py-2.5 bg-accent hover:bg-blue-500 rounded-lg text-sm font-medium w-fit">
        Start Verifying →
      </Link>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs uppercase">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Family Head</th>
              <th className="px-4 py-3 text-left">Village</th>
              <th className="px-4 py-3 text-left">Conf%</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {families.map(f => (
              <tr key={f.family_id} className="hover:bg-white/2">
                <td className="px-4 py-2.5 text-muted">{f.family_id}</td>
                <td className="px-4 py-2.5 font-medium">
                  <div>{f.family_head || <em className="text-muted">—</em>}</div>
                  {f.family_head_kn && <div className="text-xs text-muted">{f.family_head_kn}</div>}
                </td>
                <td className="px-4 py-2.5 text-muted">{f.village || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={f.ocr_confidence >= 80 ? "text-green-400"
                    : f.ocr_confidence >= 60 ? "text-yellow-400" : "text-red-400"}>
                    {f.ocr_confidence?.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[f.verification_status] || ""}`}>
                    {f.verification_status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/verify/${f.family_id}`}
                    className="text-accent hover:underline text-xs">Review →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
