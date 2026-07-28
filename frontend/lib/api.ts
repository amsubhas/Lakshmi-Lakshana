const BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false,
): Promise<T> {
  const opts: RequestInit = { method };
  if (body) {
    if (isForm) {
      opts.body = body as FormData;
    } else {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const get  = <T>(p: string)              => req<T>("GET",  p);
const post = <T>(p: string, b?: unknown) => req<T>("POST", p, b);

export const api = {
  // ── Progress (dashboard stats cards) ──────────────────────────────────
  progress: () => get<import("./types").ProgressSummary>("/api/progress"),

  // ── Status ────────────────────────────────────────────────────────────
  status: () => get<import("./types").AppStatus>("/api/status"),
  logs:   (n = 200) => get<import("./types").LogEntry[]>(`/api/logs?limit=${n}`),

  // ── Import ────────────────────────────────────────────────────────────
  importImages: (files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    return req<{ ok: boolean; imported: number; batch: string }>(
      "POST", "/api/import", fd, true,
    );
  },

  // ── OCR ───────────────────────────────────────────────────────────────
  startOcr: () => post<{ ok: boolean; message: string }>("/api/ocr"),

  // ── Validate ──────────────────────────────────────────────────────────
  validate: (id: number) =>
    get<import("./types").ValidationResult>(`/api/validate/${id}`),

  // ── Families ──────────────────────────────────────────────────────────
  families: (status = "pending") =>
    get<import("./types").Family[]>(`/api/families?status=${status}`),
  familyDetail: (id: number) =>
    get<import("./types").FamilyDetail>(`/api/families/${id}`),
  verifyFamily: (id: number, data: unknown) =>
    post<{ ok: boolean; next_id: number | null }>(`/api/families/${id}/verify`, data),

  // ── Excel ─────────────────────────────────────────────────────────────
  generateExcel: () =>
    post<{ ok: boolean; url: string; filename: string }>("/api/excel"),

  // ── Conflicts ─────────────────────────────────────────────────────────
  conflicts: () => get<import("./types").Conflict[]>("/api/conflicts"),
  resolveConflict: (id: number, resolution: string) =>
    post<{ ok: boolean }>(`/api/conflicts/${id}/resolve`, { resolution }),

  // ── Real-time sync conflict ────────────────────────────────────────────
  activeConflict: () =>
    get<{ active: boolean; conflict?: import("./types").Conflict }>("/api/sync/conflict"),
  resolveActive: (r: string) =>
    post<{ ok: boolean }>("/api/sync/conflict/resolve", { resolution: r }),

  // ── Browser & Automation ─────────────────────────────────────────────
  browserLogin:  () => post<{ ok: boolean }>("/api/browser/login"),
  learningStart: () => post<{ ok: boolean }>("/api/learning/start"),
  learningStop:  () => post<{ ok: boolean; steps: number }>("/api/learning/stop"),
  syncStart:     () => post<{ ok: boolean; message: string }>("/api/sync/start"),
  syncPause:     () => post<{ ok: boolean }>("/api/sync/pause"),
  syncStop:      () => post<{ ok: boolean }>("/api/sync/stop"),

  // ── Settings ──────────────────────────────────────────────────────────
  getSettings: () =>
    get<{ username: string; password_set: boolean; website_url: string }>("/api/settings"),
  saveSettings: (d: { username?: string; password?: string; website_url?: string }) =>
    post<{ ok: boolean }>("/api/settings", d),

  // ── Recovery ──────────────────────────────────────────────────────────
  recoveryCheckpoint: () =>
    get<{ checkpoint: import("./types").RecoveryCheckpoint | null }>(
      "/api/recovery/checkpoint",
    ),
  recoveryClear: () => post<{ ok: boolean }>("/api/recovery/clear"),

  // ── Maintenance ───────────────────────────────────────────────────────
  dbOptimize: () => post<{ ok: boolean }>("/api/db/optimize"),
  backup:     () => post<{ ok: boolean; file: string }>("/api/backup"),
};
