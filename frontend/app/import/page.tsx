"use client";
import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Upload, FileImage, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface FileItem {
  file: File;
  status: "pending" | "done" | "error";
  msg?: string;
}

export default function ImportPage() {
  const [files, setFiles]     = useState<FileItem[]>([]);
  const [dragging, setDrag]   = useState(false);
  const [uploading, setUp]    = useState(false);
  const [result, setResult]   = useState("");

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = [".jpg",".jpeg",".png",".pdf"];
    const toAdd: FileItem[] = [];
    for (const f of Array.from(incoming)) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext && allowed.some(a => a.includes(ext))) {
        if (!files.some(x => x.file.name === f.name))
          toAdd.push({ file: f, status: "pending" });
      }
    }
    setFiles(prev => [...prev, ...toAdd]);
  }, [files]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const upload = async () => {
    if (!files.length || uploading) return;
    setUp(true); setResult("");
    try {
      const r = await api.importImages(files.map(f => f.file));
      setFiles(prev => prev.map(f => ({ ...f, status: "done" })));
      setResult(`✔ Imported ${r.imported} file(s) (batch: ${r.batch})`);
    } catch (e) {
      setResult(`❌ Error: ${e}`);
    } finally { setUp(false); }
  };

  const bytes = (n: number) =>
    n > 1e6 ? `${(n/1e6).toFixed(1)} MB` : `${(n/1024).toFixed(0)} KB`;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">📂 Import Images</h1>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-white/2"}`}
        onClick={() => document.getElementById("file-picker")?.click()}>
        <Upload className="mx-auto mb-3 text-muted" size={36} />
        <p className="text-slate-300 font-medium">Drag & drop images here</p>
        <p className="text-muted text-sm mt-1">or click to browse • JPG, PNG, PDF supported</p>
        <input id="file-picker" type="file" className="hidden" multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={e => addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">{files.length} file(s) selected</span>
            <button onClick={() => setFiles([])}
              className="text-xs text-muted hover:text-red-400">Clear all</button>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                {f.status === "done"  ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                 : f.status === "error" ? <AlertCircle size={16} className="text-red-400 shrink-0" />
                 : <FileImage size={16} className="text-muted shrink-0" />}
                <span className="flex-1 text-sm truncate">{f.file.name}</span>
                <span className="text-xs text-muted shrink-0">{bytes(f.file.size)}</span>
                <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))}
                  className="text-muted hover:text-red-400 shrink-0"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          result.startsWith("✔") ? "bg-green-900/30 border border-green-600 text-green-200"
                                 : "bg-red-900/30 border border-red-600 text-red-200"}`}>
          {result}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={upload} disabled={!files.length || uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-blue-500 rounded-lg font-medium disabled:opacity-40 transition-colors">
          <Upload size={16} />
          {uploading ? "Uploading…" : `Import ${files.length || ""} File(s)`}
        </button>
        {result.startsWith("✔") && (
          <Link href="/" className="px-5 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
            ← Dashboard →
          </Link>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 text-sm text-muted space-y-1">
        <p className="text-slate-300 font-medium mb-2">ℹ After importing:</p>
        <p>1. Go to Dashboard → click <strong>Run OCR</strong></p>
        <p>2. Open <strong>Verify</strong> to review each extracted record</p>
        <p>3. Generate Excel or start website sync</p>
      </div>
    </div>
  );
}
