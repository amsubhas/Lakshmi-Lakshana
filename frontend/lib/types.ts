// ── Progress summary (dashboard stats cards) ──────────────────────────────
export interface ProgressSummary {
  images_imported:  number;
  images_enhanced:  number;
  ocr_completed:    number;
  pending_verify:   number;
  verified:         number;
  sync_completed:   number;
  sync_pending:     number;
  conflicts_open:   number;
  members_total:    number;
  errors:           number;
}

// ── App status (automation + dashboard header) ────────────────────────────
export interface AppStatus {
  // Normalised names (used by new code)
  total_families:       number;
  pending_verification: number;
  verified:             number;
  synced:               number;
  pending_conflicts:    number;
  task_running:         boolean;
  task_name:            string | null;
  browser_open:         boolean;
  workflow_exists:      boolean;
  // Aliases kept for dashboard / automation pages
  busy:         boolean;
  active_task:  string | null;
  workflow_ok:  boolean;
  conflict?:    Conflict | null;
}

// ── Family ────────────────────────────────────────────────────────────────
export interface Family {
  family_id:           number;
  family_head:         string;
  family_head_kn:      string;
  father:              string;
  father_kn:           string;
  mother:              string;
  mother_kn:           string;
  house:               string;
  village:             string;
  district:            string;
  address:             string;
  phone:               string;
  gothra:              string;
  occupation:          string;
  community:           string;
  sub_caste:           string;
  ocr_confidence:      number;
  verification_status: string;
  sync_status:         string;
  image_id:            number | null;
}

// ── Member ────────────────────────────────────────────────────────────────
export interface Member {
  member_id:           number;
  family_id:           number;
  name:                string;
  name_kn:             string;
  relationship:        string;
  gender:              string;
  dob:                 string;
  education:           string;
  occupation:          string;
  marriage:            string;
  spouse_name:         string;
  mobile:              string;
  verification_status: string;
  sync_status:         string;
}

// ── Family detail (verify page) ───────────────────────────────────────────
export interface FamilyDetail {
  family:           Family;
  members:          Member[];
  ocr_data:         OcrData;
  img_url:          string | null;
  blur_score:       number | null;
  attention_fields: string[];
}

// ── OCR ───────────────────────────────────────────────────────────────────
export interface OcrFieldValue {
  value:      string;
  confidence: number;
}
export type OcrField = OcrFieldValue | string | undefined;

export interface OcrData {
  confidence_avg?: number;
  family_head?:    Record<string, OcrField>;
  members?:        Record<string, OcrField>[];
  disagreements?:  string[];
  raw_text?:       string;
}

// ── Validation ────────────────────────────────────────────────────────────
export interface ValidationIssue {
  level:   "ERROR" | "WARNING" | "INFO";
  field:   string;
  message: string;
}
export interface ValidationResult {
  has_errors:    boolean;
  has_warnings:  boolean;
  issues:        ValidationIssue[];
  disagreements: string[];
}

// ── Conflict ──────────────────────────────────────────────────────────────
export interface Conflict {
  conflict_id?:   number;
  family_id?:     number;
  member_id?:     number;
  field:          string;
  website_value:  string;
  database_value: string;
}

// ── Logs ──────────────────────────────────────────────────────────────────
export interface LogEntry {
  log_id:    number;
  timestamp: string;
  level:     string;
  family_id: number | null;
  action:    string;
  details:   string;
}

// ── SSE ───────────────────────────────────────────────────────────────────
export interface SSEMessage {
  type: "log" | "status" | "conflict" | "ping";
  text: string;
  ts:   string;
}

// ── Recovery ──────────────────────────────────────────────────────────────
export interface RecoveryCheckpoint {
  family_id: number;
  stage:     string;
  ts:        string;
}
