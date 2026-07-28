"use client";
import { useState, useRef, useEffect } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { SSEMessage } from "@/lib/types";

interface Props {
  onConflict?: (data: object) => void;
  onStatusChange?: (status: string) => void;
}

export function SSEConsole({ onConflict, onStatusChange }: Props) {
  const [lines, setLines] = useState<{ ts: string; text: string; cls: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useSSE((msg: SSEMessage) => {
    if (msg.type === "conflict" && onConflict) {
      try { onConflict(JSON.parse(msg.text)); } catch { onConflict(msg.text as unknown as object); }
      return;
    }
    if (msg.type === "status" && onStatusChange) {
      onStatusChange(msg.text);
      return;
    }
    if (msg.type === "log") {
      const t = msg.text;
      const cls = t.includes("✔") || t.includes("Done")     ? "text-green-400"
                : t.includes("❌") || t.includes("Error")   ? "text-red-400"
                : t.includes("⚠")  || t.includes("⚡")      ? "text-yellow-400"
                : "text-blue-200";
      setLines(prev => [...prev.slice(-300), { ts: msg.ts, text: t, cls }]);
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="bg-[#0a0f1e] rounded-lg border border-border flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-muted font-medium">📟 CONSOLE (live)</span>
        <button onClick={() => setLines([])}
          className="text-xs text-muted hover:text-slate-300 px-2 py-0.5 rounded hover:bg-white/5">
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {lines.length === 0 && (
          <p className="text-muted italic">Waiting for activity…</p>
        )}
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-600 shrink-0">{l.ts}</span>
            <span className={l.cls}>{l.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
