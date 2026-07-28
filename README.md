# Sri Havyaka Automated Data Entry System

One-time migration tool for **srihavyaka.lakshmilakshana.com** — imports ~500 handwritten
Gurikkara (Havyaka Brahmin) family record images, runs multi-engine free OCR, verifies data
manually, then syncs to the website automatically.

**Zero paid APIs. Runs entirely on your own Ubuntu machine.**

---

## Architecture

```
┌──────────────────────────────────────────┐
│  Vercel (frontend)                       │
│  Next.js 15 + React + TypeScript         │
│  → Deployed once; works from any browser │
└────────────────┬─────────────────────────┘
                 │ HTTP / SSE
┌────────────────▼─────────────────────────┐
│  Ubuntu Server (backend – runs locally)  │
│  FastAPI + Python 3.11                   │
│  ├── PaddleOCR  (Kannada primary)        │
│  ├── EasyOCR    (mixed-script secondary) │
│  ├── Tesseract  (classical fallback)     │
│  ├── OpenCV     (image enhancement)      │
│  ├── Playwright (browser automation)     │
│  ├── SQLite     (WAL mode, indexed)      │
│  └── openpyxl   (Excel generation)      │
└──────────────────────────────────────────┘
```

---

## Ubuntu Setup (backend)

### Prerequisites

Ubuntu 20.04 / 22.04 / 24.04 LTS. Python 3.11+.

### One-command install

```bash
cd backend
bash setup.sh
```

`setup.sh` installs:
- `tesseract-ocr` + `tesseract-ocr-kan` (Kannada language pack)
- Python venv with PaddleOCR, EasyOCR, pytesseract, OpenCV, Playwright, FastAPI

### Manual steps (if setup.sh fails on any step)

```bash
# 1. System packages
sudo apt-get install -y \
  tesseract-ocr tesseract-ocr-kan tesseract-ocr-eng \
  libgl1-mesa-glx libglib2.0-0 fonts-noto-core

# 2. Python venv
python3.11 -m venv .venv && source .venv/bin/activate

# 3. PaddleOCR (CPU build)
pip install paddlepaddle
pip install paddleocr easyocr pytesseract

# 4. Remaining requirements
pip install -r requirements.txt

# 5. Playwright Chromium
python -m playwright install chromium
python -m playwright install-deps chromium
```

### Start the backend

```bash
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

For background / persistent sessions:

```bash
# tmux (recommended)
tmux new -s havyaka
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# systemd service (see docs/havyaka.service)
```

---

## Vercel Deployment (frontend)

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import repo.
3. Set **Root Directory** → `frontend`.
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=http://YOUR_UBUNTU_IP:8000
   ```
5. Click **Deploy**.

The frontend is a static dashboard — no secrets live on Vercel.

---

## Environment Variables

### Backend (`backend/.env`)

```dotenv
# No variables required for basic operation.
# The backend reads all settings from the SQLite settings table via the UI.

# Optional – override defaults:
# DATABASE_PATH=/custom/path/master_reference.db
# WEBSITE_URL=https://srihavyaka.lakshmilakshana.com/
```

### Frontend (`frontend/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000   # your Ubuntu IP
```

---

## First-Time Setup

1. Open the web UI (Vercel URL or `http://localhost:3000`).
2. Go to **Settings**.
3. Enter your website credentials (username + password for the target site).
4. No API key needed — OCR is entirely free and local.

---

## Workflow

| Step | Page       | Action                                                    |
|------|------------|-----------------------------------------------------------|
| 1    | Import     | Drag-drop JPG / PNG / PDF family record images            |
| 2    | Dashboard  | Click **Run OCR** (parallel: PaddleOCR + EasyOCR + Tesseract) |
| 3    | Verify     | Review extracted data; only flagged fields need attention |
| 4    | Dashboard  | **Generate Excel** for reference backup                   |
| 5    | Automation | **Open Browser** → log in to target website              |
| 6    | Automation | **Learning Mode** → record one family entry manually      |
| 7    | Automation | **Start Data Entry** → automated sync begins             |

---

## OCR Pipeline

Three free OCR engines run **in parallel** on every enhanced image:

```
PaddleOCR ──┐
EasyOCR   ──┼──► Ensemble Merger ──► Field Extractor ──► Structured JSON
Tesseract ──┘
```

**Confidence scoring:**
- All 3 engines agree → +10 % confidence boost
- 2 of 3 agree → moderate confidence
- All disagree → field flagged for manual review

**Field Extractor** maps raw text to structured fields using:
- Kannada + English keyword matching (`ಗ್ರಾಮ` → village, `ತಂದೆ` → father…)
- Regex patterns for phone numbers (`[6-9]\d{9}`) and dates (`DD/MM/YYYY`)
- Positional heuristics (first line = family head name)

**Verification UI** only highlights fields that genuinely need attention:
- Low confidence (< 60 %)
- Engine disagreement
- Missing mandatory field (family_head, village)
- Duplicate family head name

---

## Synchronisation Workflow

```
For each verified family:
  Search family head on website
  NOT FOUND → Create family → Create all members
  FOUND     →
    For each field:
      website empty + DB has value  → FILL (automatic)
      website == DB value           → IGNORE
      website != DB value           → PAUSE → show conflict UI
    For each DB member:
      Not on website → CREATE member
      On website     → compare fields → fill empty / flag conflicts
    Extra website members → FLAG ONLY, never delete
```

**Conflict resolution** blocks the sync thread and shows the conflict in the UI.
User chooses: **Keep Website Value** / **Use Database Value** / **Skip**.

---

## Recovery After Interruption

The system recovers from:
- **Browser crash** → Playwright restarted; page reloaded
- **Internet drop** → exponential-backoff retry (up to 5× per operation)
- **Backend restart / Ubuntu reboot** → checkpoint saved in SQLite settings

To resume after any interruption:
```bash
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```
Then click **Start Data Entry** again. Completed families (`sync_status = completed`)
are never re-processed. In-progress families are re-tried from scratch (safe — fill-empty
is idempotent).

---

## GitHub Workflow

```
.github/workflows/
├── test.yml    # runs pytest on every push to main + PRs
└── deploy.yml  # triggers Vercel deployment on push to main
```

Tests run without browser / OCR engines (unit + integration tests only).

---

## Performance (Task 7)

Optimised for 500 families / 5 000+ members / long unattended sessions:

| Area           | Optimisation                                           |
|----------------|--------------------------------------------------------|
| OCR            | 3 engines run in parallel threads                      |
| SQLite         | WAL journal mode + 6 indexes (status, family_head, …) |
| Memory         | Images processed one-at-a-time; not held in RAM        |
| Image cache    | Enhanced images saved to disk; re-used on re-run       |
| DB indexing    | `/api/db/optimize` runs ANALYZE + CREATE INDEX         |
| Batch fills    | Sync processes families sequentially, members batched  |

Run **DB Optimize** from the Automation page before starting a large sync session.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `tesseract: command not found` | `sudo apt install tesseract-ocr tesseract-ocr-kan` |
| PaddleOCR install error | Try `pip install paddlepaddle --index-url https://www.paddlepaddle.org.cn/packages/stable/cpu/` |
| EasyOCR GPU warning | Safe to ignore — it falls back to CPU automatically |
| `playwright install` fails | Run `python -m playwright install-deps chromium` first |
| Browser opens but crashes | Check `/data/screenshots/` for failure screenshots |
| OCR returns empty family | Image may be too blurry — check blur_score in Verify view |
| Sync paused on conflict | Open **Conflicts** tab in UI and resolve the conflict |
| Backend unreachable from Vercel | Check firewall: `sudo ufw allow 8000/tcp` |
| DB locked error | Another uvicorn process is running — `pkill -f uvicorn` |

---

## Project Structure

```
sri_havyaka_web/
├── backend/
│   ├── main.py                    FastAPI application
│   ├── config.py                  Path constants
│   ├── requirements.txt           Python dependencies (all free)
│   ├── setup.sh                   Ubuntu one-command setup
│   ├── src/
│   │   ├── core/
│   │   │   ├── ocr_engine.py      Multi-engine OCR ensemble
│   │   │   ├── field_extractor.py Structured field extraction
│   │   │   ├── image_processor.py OpenCV enhancement pipeline
│   │   │   ├── ocr_validator.py   Pre-verification quality checks
│   │   │   ├── database.py        SQLite manager
│   │   │   ├── sync_engine.py     Website synchronisation logic
│   │   │   ├── automation.py      Playwright browser control
│   │   │   ├── recovery.py        Crash recovery engine
│   │   │   └── website_reader.py  Read fields from live website
│   │   └── utils/
│   │       ├── excel_utils.py     Excel report generation
│   │       └── logger.py          Structured logging
│   └── tests/
│       └── test_integration.py    Full integration test suite
├── frontend/
│   ├── app/                       Next.js pages
│   │   ├── page.tsx               Dashboard
│   │   ├── import/page.tsx        Image import
│   │   ├── verify/[id]/page.tsx   Verification UI
│   │   ├── conflicts/page.tsx     Conflict resolver
│   │   ├── automation/page.tsx    Browser & sync control
│   │   ├── logs/page.tsx          Audit log viewer
│   │   └── settings/page.tsx      Credentials (no API key)
│   ├── components/
│   │   ├── ConflictModal.tsx      Real-time conflict dialog
│   │   ├── SSEConsole.tsx         Live log stream
│   │   └── layout/Sidebar.tsx     Navigation
│   └── lib/
│       ├── api.ts                 Typed API client
│       └── types.ts               TypeScript interfaces
├── .github/workflows/
│   ├── test.yml
│   └── deploy.yml
├── vercel.json
├── .env.example
└── README.md
```

---

## Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

Test coverage:
- Database CRUD (11 tests)
- OCR Validator (6 tests)
- FieldExtractor (8 tests)
- OCR Engine merge logic (6 tests)
- SyncEngine comparison (8 tests)
- Excel generation (3 tests)
- Resume / crash recovery (4 tests)
- Conflict state threading (4 tests)
- Recovery engine (6 tests)
- Attention fields logic (5 tests)
- Image processor blur detection (3 tests)

---

## Free Software Compliance

| Component       | Library         | Licence   |
|-----------------|-----------------|-----------|
| Web framework   | FastAPI         | MIT       |
| OCR primary     | PaddleOCR       | Apache 2  |
| OCR secondary   | EasyOCR         | Apache 2  |
| OCR tertiary    | Tesseract       | Apache 2  |
| Image processing| OpenCV          | Apache 2  |
| PDF extraction  | PyMuPDF         | AGPL / commercial-free for personal use |
| Browser         | Playwright      | Apache 2  |
| Database        | SQLite          | Public domain |
| Excel           | openpyxl        | MIT       |
| Frontend        | Next.js / React | MIT       |

**No paid APIs. No subscriptions. No cloud OCR.**
