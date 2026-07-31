"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { FamilyDetail, ValidationIssue, OcrField } from "@/lib/types";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Check, SkipForward, XCircle } from "lucide-react";

function confBadge(c: number) {
  if (c >= 80) return "bg-green-900 text-green-300";
  if (c >= 50) return "bg-yellow-900 text-yellow-300";
  return "bg-red-900 text-red-300";
}

function ocrVal(field: OcrField): string {
  if (!field) return "";
  if (typeof field === "object" && "value" in field) return field.value ?? "";
  return String(field);
}
function ocrConf(field: OcrField): number {
  if (!field || typeof field !== "object") return 0;
  return (field as { confidence?: number }).confidence ?? 0;
}

const FAMILY_FIELDS = [
  ["family_head_kn", "Name (Kannada)", "name_kn"],
  ["family_head",    "Name (English)", "name_en"],
  ["father_kn",      "Father (KN)",    "father_kn"],
  ["father",         "Father (EN)",    "father_en"],
  ["mother_kn",      "Mother (KN)",    "mother_kn"],
  ["mother",         "Mother (EN)",    "mother_en"],
  ["house",          "House #",        "house"],
  ["village",        "Village",        "village"],
  ["district",       "District",       "district"],
  ["phone",          "Phone",          "phone"],
  ["gothra",         "Gothra",         "gothra"],
  ["occupation",     "Occupation",     "occupation"],
  ["community",      "Community",      "community"],
  ["sub_caste",      "Sub Caste",      "sub_caste"],
  ["address",        "Address",        "address"],
] as const;

const MEMBER_FIELDS = [
  ["name_kn",      "Name (KN)",      "name_kn"],
  ["name",         "Name (EN)",      "name_en"],
  ["relationship", "Relationship",   "relationship"],
  ["gender",       "Gender",         "gender"],
  ["dob",          "Date of Birth",  "dob"],
  ["education",    "Education",      "education"],
  ["occupation",   "Occupation",     "occupation"],
  ["marriage",     "Marital Status", "marriage"],
  ["spouse_name",  "Spouse Name",    "spouse_name"],
  ["mobile",       "Mobile",         "mobile"],
] as const;

export default function VerifyRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const famId   = Number(id);

  const [detail,   setDetail]   = useState<FamilyDetail | null>(null);
  const [issues,   setIssues]   = useState<ValidationIssue[]>([]);
  const [pending,  setPending]  = useState<number[]>([]);
  const [zoom,     setZoom]     = useState(1.0);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");

  // Form state
  const [headFields, setHead] = useState<Record<string, string>>({});
  const [memberData, setMem]  = useState<Record<string, string>[]>([]);

  useEffect(() => {
    async function load() {
      const [d, v, p] = await Promise.all([
        api.familyDetail(famId),
        api.validate(famId),
        api.families("pending"),
      ]);
      setDetail(d);
      setIssues(v.issues);
      setPending(p.map(f => f.family_id));

      // Pre-fill head fields from DB + OCR
      const hf: Record<string, string> = {};
      for (const [dbKey,, ocrKey] of FAMILY_FIELDS) {
        const dbVal  = (d.family as unknown as Record<string, string>)[dbKey] ?? "";
        const ocrFld = d.ocr_data?.family_head?.[ocrKey];
        hf[dbKey] = dbVal || ocrVal(ocrFld);
      }
      setHead(hf);

      // Pre-fill members
      const mems = d.members.map((m, i) => {
        const ocrM = d.ocr_data?.members?.[i] ?? {};
        const row: Record<string, string> = {};
        for (const [dbK,, ocrK] of MEMBER_FIELDS) {
          const dbV  = (m as unknown as Record<string, string>)[dbK] ?? "";
          const ocrFld = ocrM[ocrK];
          row[dbK] = dbV || ocrVal(ocrFld);
        }
        return row;
      });
      setMem(mems);
    }
    load();
  }, [famId]);

  const navigate = (nextId: number | null) => {
    if (nextId) router.push(`/verify/${nextId}`);
    else router.push("/verify");
  };

  const submit = async (action: "confirm" | "skip" | "reject") => {
    setSaving(true);
    try {
      const payload = {
        action,
        ...headFields,
        members: memberData.map(m => ({ ...m, verification_status: "verified" })),
      };
      const r = await api.verifyFamily(famId, payload);
      navigate(r.next_id);
    } catch (e) {
      setToast(`❌ ${e}`);
      setTimeout(() => setToast(""), 4000);
    } finally { setSaving(false); }
  };

  const pos     = pending.indexOf(famId);
  const prevId  = pos > 0 ? pending[pos - 1] : null;
  const nextId  = pos >= 0 && pos < pending.length - 1 ? pending[pos + 1] : null;

  if (!detail) return <div className="text-muted p-8">Loading record…</div>;

  const errors   = issues.filter(i => i.level === "ERROR");
  const warnings = issues.filter(i => i.level === "WARNING");

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <h1 className="font-bold text-lg">
          📋 Record {pos >= 0 ? pos + 1 : "?"} / {pending.length}
        </h1>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={() => navigate(prevId)} disabled={!prevId}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm disabled:opacity-40">
            <ChevronLeft size={14} /> Prev
          </button>
          <button onClick={() => navigate(nextId)} disabled={!nextId}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm disabled:opacity-40">
            Next <ChevronRight size={14} />
          </button>
          <button onClick={() => submit("confirm")} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-sm font-semibold disabled:opacity-40">
            <Check size={14} /> Confirm
          </button>
          <button onClick={() => submit("skip")} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-40">
            <SkipForward size={14} /> Skip
          </button>
          <button onClick={() => { if(confirm("Mark as unreadable?")) submit("reject"); }}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-sm disabled:opacity-40">
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-red-900/40 border border-red-500 rounded-lg px-3 py-2 text-sm text-red-200 shrink-0">
          {toast}
        </div>
      )}

      {/* Validation banners */}
      {errors.length > 0 && (
        <div className="bg-red-950 border border-red-600 rounded-lg px-4 py-2.5 shrink-0">
          <p className="text-red-300 text-sm font-semibold mb-1">❌ Issues – review before confirming</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-red-300">• [{e.field}] {e.message}</p>)}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-yellow-950 border border-yellow-600 rounded-lg px-4 py-2.5 shrink-0">
          <p className="text-yellow-300 text-sm font-semibold mb-1">⚠ Warnings</p>
          {warnings.map((w, i) => <p key={i} className="text-xs text-yellow-300">• [{w.field}] {w.message}</p>)}
        </div>
      )}

      {/* Main split panel */}
      <div className="grid grid-cols-[420px_1fr] gap-3 flex-1 overflow-hidden min-h-0">

        {/* Image panel */}
        <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.2).toFixed(1)))}
              className="p-1 rounded hover:bg-white/10"><ZoomOut size={15} /></button>
            <span className="text-xs text-muted">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(1)))}
              className="p-1 rounded hover:bg-white/10"><ZoomIn size={15} /></button>
            <span className="ml-auto text-xs text-muted">
              OCR conf: {detail.ocr_data?.confidence_avg?.toFixed(1)}%
            </span>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-[#090e1a]">
            {detail.img_url ? (
              <img src={detail.img_url} alt="Record"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                className="max-w-none rounded shadow-lg" />
            ) : (
              <p className="text-muted mt-20">No image available</p>
            )}
          </div>
          {detail.blur_score != null && detail.blur_score < 50 && (
            <p className="text-yellow-400 text-xs px-3 py-2 border-t border-border shrink-0">
              ⚠ Blurry image (score={detail.blur_score.toFixed(0)}) – verify fields carefully
            </p>
          )}
        </div>

        {/* Form panel */}
        <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border shrink-0">
            <p className="text-sm font-semibold">Edit extracted data – all fields editable</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">

            {/* Family Head */}
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2 mt-1">Family Head</p>
            {FAMILY_FIELDS.map(([dbKey, label, ocrKey]) => {
              const conf = ocrConf(detail.ocr_data?.family_head?.[ocrKey]);
              return (
                <div key={dbKey} className="grid grid-cols-[140px_1fr_44px] items-center gap-2 mb-1">
                  <label className="text-xs text-muted">{label}</label>
                  <input
                    value={headFields[dbKey] ?? ""}
                    onChange={e => setHead(h => ({ ...h, [dbKey]: e.target.value }))}
                    className="bg-bg border border-border rounded px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent w-full"
                  />
                  <span className={`text-center text-xs font-bold px-1.5 py-0.5 rounded ${confBadge(conf)}`}>
                    {conf}%
                  </span>
                </div>
              );
            })}

            {/* Members */}
            {detail.members.map((_, mi) => {
              const ocrM = detail.ocr_data?.members?.[mi] ?? {};
              return (
                <div key={mi}>
                  <p className="text-xs font-bold text-accent uppercase tracking-widest mt-4 mb-2">
                    Member {mi + 1}
                  </p>
                  {MEMBER_FIELDS.map(([dbKey, label, ocrKey]) => {
                    const conf = ocrConf(ocrM[ocrKey]);
                    return (
                      <div key={dbKey} className="grid grid-cols-[140px_1fr_44px] items-center gap-2 mb-1">
                        <label className="text-xs text-muted">{label}</label>
                        <input
                          value={memberData[mi]?.[dbKey] ?? ""}
                          onChange={e => setMem(prev => {
                            const next = [...prev];
                            next[mi] = { ...(next[mi] ?? {}), [dbKey]: e.target.value };
                            return next;
                          })}
                          className="bg-bg border border-border rounded px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent w-full"
                        />
                        <span className={`text-center text-xs font-bold px-1.5 py-0.5 rounded ${confBadge(conf)}`}>
                          {conf}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
