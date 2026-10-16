# NEIGHBRLY — PHASE 1: COMPLETE PROJECT AUDIT REPORT

> **Audited By:** Senior Software Architect, Product UX Auditor & Frontend Engineering Lead  
> **Applicable Codebase:** `Neighbrly` (`web/`, `android/`, `backend/`, `shared/`, `web/shared/`, `tests/`)  
> **Date:** October 2026  
> **Status:** Strictly Non-Destructive Audit — No files modified or dependencies altered.

---

## 1. Executive Summary & Product Alignment

### 1.1 Product Purpose vs. Reference Model
* **Neighbrly’s True Purpose:** A **neighbourhood-intelligence and livability decision platform** for Indian homebuyers and tenants. It enables users to evaluate whether a locality, sub-market, or region fits their lifestyle and family needs by exploring granular metrics (air quality, transit walking times, school density, safety proxies, builder delivery track records, and price reality checks) supported by transparent, auditable citations.
* **What Neighbrly Is NOT:** It is **NOT** a property listing portal or marketplace. It does not advertise apartments, generate broker leads, collect broker commissions, or sell property.
* **The Role of NoBroker as Inspiration:**  
  NoBroker ([nobroker.in](https://www.nobroker.in/)) serves strictly as a **benchmark for consumer-grade Indian UX patterns**:
  * Clean, accessible search usability (city selection, locality autocomplete, micro-market grouping).
  * Prominent, high-trust value proposition headers.
  * Scannable information hierarchy and card modularity.
  * Modern, mobile-first responsive design and micro-interactions.
  * *Crucially:* These patterns will be adapted to **neighbourhood-level data** (livability indicators, sensitivity bounds, visit checklists), rather than property listings.

---

## 2. Existing System Architecture

### 2.1 Repository Directory Structure
```
Neighbrly/
├── FLOW_STRUCTURE.md            # Interaction architecture & screen flow specification
├── README.md                    # Project overview, quickstart & source attributions
├── VALIDATION.md                # Test execution and verification results log
├── THIRD-PARTY-NOTICES.md       # Open-source licensing (Leaflet BSD-2, CC BY 4.0 wards)
├── shared/                      # Root single source of truth for fixtures & core logic
│   ├── core.ts                  # Shared TypeScript scoring, bounds, and summary engine
│   └── demo.json                # Fixture data (7 metrics, 7 quiz questions, 3 demo areas)
├── web/                         # React 19 + TypeScript + Vite web application
│   ├── index.html               # Web root with viewport & meta tags
│   ├── package.json             # Web dependencies (Vite 7.1, React 19.3, Leaflet 1.9.4)
│   ├── tsconfig.json            # ESNext / Bundler module resolution
│   ├── shared/                  # Tracked duplicate of root shared/ (for independent builds)
│   │   ├── core.ts              # Identical SHA256 to root shared/core.ts
│   │   └── demo.json            # Identical SHA256 to root shared/demo.json
│   ├── scripts/
│   │   ├── inline-template.html # Template for single-file bundled preview
│   │   └── make-inline.mjs      # Esbuild + HTML bundler producing <1MB in-chat fragment
│   └── src/
│       ├── main.tsx             # ReactDOM entrypoint
│       ├── App.tsx              # Monolithic 33KB / 82-line application container
│       ├── style.css            # 28.8KB single vanilla CSS file with design tokens
│       └── mumbai-wards.json    # 24 BMC administrative ward GeoJSON polygons
├── android/                     # React Native 0.88 + Expo 58 native mobile application
│   ├── app.json                 # Expo config (slug: "neighbrly", package: "com.neighbrly.app")
│   ├── App.tsx                  # React Navigation NativeStackNavigator setup
│   ├── eas.json                 # Expo Application Services build profile
│   ├── metro.config.js          # Metro watcher configured to watch parent root shared/
│   ├── package.json             # Expo dependencies (@react-navigation, async-storage, webview)
│   └── src/
│       ├── api.ts               # API base URL configuration (currently set to null / offline)
│       ├── data.ts              # Data helper importing from ../../shared/demo.json
│       ├── score.ts             # Scoring adapter importing from ../../shared/core.ts
│       ├── theme.ts             # Native color palette (forest green, amber, terracotta)
│       ├── store.tsx            # Context provider with AsyncStorage persistence
│       ├── ui.tsx               # Atomic UI components (Screen, H1, Card, Button, RangeBar)
│       ├── mapHtml.ts           # 211KB bundled HTML/CSS/Leaflet script for Native WebView
│       └── screens/             # Modular screen components (Home, Report, Details, etc.)
├── backend/                     # FastAPI demonstration service (Python 3.11+)
│   ├── API-CONTRACT.md          # REST API contract documentation
│   ├── app.py                   # FastAPI application with CORS and Pydantic schemas
│   ├── engine.py                # Python deterministic scoring and summary engine
│   └── requirements.txt         # fastapi, uvicorn, pydantic, httpx
└── tests/                       # Automated cross-platform verification suite
    ├── package.json             # Test runner dependency (JSDOM 30.1)
    ├── core.test.cjs            # JS core assertions & 384 parity vector generator
    ├── preview.test.cjs         # End-to-end simulated DOM user interaction tests
    └── test_engine.py           # Python unittest suite for engine & FastAPI endpoints
```

---

## 3. Current Screen and Navigation Inventory

### 3.1 Web Application (`web/src/App.tsx`)
The web application uses a **pseudo-state router** (`s.screen: Screen`), storing the active screen in component state without browser history (`window.history.pushState`).

1. **`welcome` (Welcome Screen):** Landing page with value proposition, 3 trust pillars, and entry buttons (`Set my priorities →` or `Explore the demo first ↗`).
2. **`home` (Explore Hub):** Live search filter, priority banner (take or retake quiz), list of locality cards with overall scores and coverage, and Leaflet GeoJSON ward overview map.
3. **`quiz` (7-Question Priorities Quiz):** Progressive 7-step pairwise trade-off quiz with a progress bar and back button.
4. **`report` (Neighbourhood Report):** Composite score (/100), sensitivity bounds, deterministic 3-bullet summary with `[ref]` citations, 7-metric grid, deep-dive launchers, and Save/Share actions.
5. **`metric` (Evidence Ledger):** Raw observation value, data source, observation date, coverage boundary, missing data explanations, and physical inspection instructions.
6. **`price` (Price Reality Check):** Editable asking-price input (₹/sq ft), registered median transaction bar, and percentage difference calculation.
7. **`promoter` (Promoter Record):** Builder track record (total projects, delayed project count, average delay in months, consumer complaints under RERA).
8. **`checklist` (Visit Checklist):** Tailored list of inspection tasks ordered by user preference weights with persistent checkboxes.
9. **`compare` (Compare Areas):** Side-by-side trade-off matrix between two localities with overlapping bounds warnings.
10. **`saved` (Saved Reports):** Shortlist of saved locality snapshots displaying score at time of saving, evidence timestamp, and remove action.
11. **`settings` (Settings & Data):** Raw weight inspection (1–9), language roadmap, scoring methodology, private correction draft textarea, and data reset trigger.
12. **Modals:**
    * `Share Modal`: Plaintext dossier generator with clipboard copy and Web Share API.
    * `Reset Confirmation Modal`: Confirmation dialog before wiping local storage.

### 3.2 Android Application (`android/src/screens/`)
Built with `@react-navigation/native-stack` (`android/App.tsx:26-38`):
* `Welcome` (`Onboarding.tsx:10`)
* `Quiz` (`Onboarding.tsx:25`)
* `Home` (`Home.tsx:9`)
* `Report` (`Report.tsx:9`)
* `Metric` (`Details.tsx:9`)
* `Price` (`Details.tsx:38`)
* `Promoter` (`Details.tsx:63`)
* `Checklist` (`Details.tsx:81`)
* `Map` (`Map.tsx:6`)
* `Compare` (`Compare.tsx:9`)
* `Settings` (`Settings.tsx:6`)

---

## 4. Feature Implementation-Status Table

| Feature / Subsystem | Implementation Status | Evidence / Code References | Notes & Technical Gaps |
|---|---|---|---|
| **Responsive React/TS Web App** | **Implemented** | `web/src/App.tsx`, `web/src/style.css` | Single monolithic file (82 lines, 33KB). No CSS modules or Tailwind. Mobile switch via `.nb-phone`. |
| **Expo/React Native Android App** | **Implemented** | `android/App.tsx`, `android/package.json` | React Native 0.88, Expo SDK 58, Hermes bundle export verified. |
| **7-Question Preference Quiz** | **Implemented** | `shared/core.ts:9-11`, `shared/demo.json:46-100` | Strictly balanced: each metric appears exactly twice across options A and B. |
| **Seven Core Metrics** | **Implemented** | `shared/demo.json:2-45` | Air, transit, schools, safety, delivery, green, value. All scored 0–100. |
| **Weighted Scoring Engine** | **Implemented** | `shared/core.ts:12-17`, `backend/engine.py:26-35` | Math.round weighted average; enforces minimum 3 metrics and 50% weight. |
| **Evidence Ledger & Summaries** | **Implemented** | `shared/core.ts:20`, `backend/engine.py:35-39` | Deterministic template summaries with auditable bracketed citations `[ref]`. |
| **Missing-Data & Sensitivity Bounds** | **Implemented** | `shared/core.ts:16`, `web/src/App.tsx:70` | Sensitivity bounds (`lo`–`hi`) assuming missing data is 0 or 100. |
| **Interactive Leaflet Map (Web)** | **Implemented** | `web/src/App.tsx:24-43`, `web/src/mumbai-wards.json` | Renders 24 ward polygons + 900m demo radii for pins A, B, C. |
| **Interactive Leaflet Map (Android)**| **Implemented** | `android/src/screens/Map.tsx:1-7`, `android/src/mapHtml.ts` | Embedded WebView running self-contained HTML/JS bundle; posts message on tap. |
| **Locality Comparison Matrix** | **Implemented** | `web/src/App.tsx:75`, `android/src/screens/Compare.tsx:9-46` | Head-to-head table with automatic detection of overlapping bounds. |
| **Asking-Price Reality Check** | **Partially Implemented** | Web: `web/src/App.tsx:72`; Android: `android/src/screens/Details.tsx:38` | Web allows editing the asking price; **Android is static/read-only**. |
| **Builder / Promoter Record** | **Implemented** | Web: `web/src/App.tsx:73`; Android: `android/src/screens/Details.tsx:63` | Displays projects, delays, and complaints. Missing promoter handled gracefully. |
| **Visit Checklist** | **Partially Implemented** | Web: `web/src/App.tsx:74`; Android: `android/src/screens/Details.tsx:81` | Web has interactive checkboxes with storage; **Android has no checkboxes**. |
| **Saved Reports / Shortlist** | **Partially Implemented** | Web: `web/src/App.tsx:76`; Android: `android/src/store.tsx:12` | Web stores full snapshots; **Android only stores string IDs; has no Saved screen**. |
| **Data Correction Draft** | **Partially Implemented** | Web: `web/src/App.tsx:77`; Android: `android/src/screens/Settings.tsx` | Web saves draft in `localStorage`; **Android completely omits correction drafts**. |
| **FastAPI Backend & Validation** | **Implemented (Standalone)** | `backend/app.py:1-52`, `backend/engine.py:1-67` | Fully tested and validated, but **unconnected to clients** (clients run offline). |
| **Client-Side Persistence** | **Implemented** | Web: `localStorage['neighbrly.preview.v2']`; Android: `AsyncStorage['neighbrly.v2']` | Graceful fallbacks implemented if storage fails or is blocked. |
| **Live Real-Estate Data Ingestion** | **Unavailable / Planned** | `README.md:88-97`, `backend/engine.py:1` | All scores, prices, and promoter records are invented demonstration fixtures. |

---

## 5. Scoring and Data-Integrity Verification

The scoring engine was verified directly against the code in `shared/core.ts` and `backend/engine.py`:

### 5.1 Verification of Scoring Rules Against Actual Code
1. **0–100 Higher-is-More-Favourable Scale:**  
   Every metric entry in `shared/demo.json` assigns values between `0` and `100` (e.g., Transit: 88, Air: 62). Higher values always indicate superior livability.
2. **Observed Weighted Average Formula:**  
   In `shared/core.ts:12-16`:
   $$\text{Score} = \text{round}\left(\frac{\sum (w_i \times v_i)}{\sum w_i}\right) \quad \text{for all available metrics } i$$
3. **Minimum Data Availability Thresholds:**  
   The code explicitly enforces:
   ```typescript
   score: (used >= 3 && coverage >= 0.5) ? Math.round(num / known) : null
   ```
   * *Threshold A:* At least 3 available metrics (`used >= 3`).
   * *Threshold B:* At least 50% of total selected weight must be covered by available metrics (`coverage >= 0.5`).
   * *Verified Edge Case:* If Area A (missing price, weight=1) has its price weight manually inflated to 9, `coverage` drops below 50% and `score` immediately becomes `null` (tested in `tests/core.test.cjs:11`).
4. **Missing-Data Sensitivity Bounds (Not Confidence Intervals):**  
   In `shared/core.ts:16` and `backend/engine.py:48`:
   $$\text{Bound}_{\text{low}} = \left\lfloor\frac{\sum_{\text{known}} (w_i \times v_i)}{\sum_{\text{all}} w_i}\right\rfloor$$
   $$\text{Bound}_{\text{high}} = \left\lceil\frac{\sum_{\text{known}} (w_i \times v_i) + 100 \times \sum_{\text{missing}} w_i}{\sum_{\text{all}} w_i}\right\rceil$$
   *These bounds assume missing metrics are $0$ in the worst case and $100$ in the best case.* They do not assume a normal Gaussian distribution or standard deviation.
5. **Suppression of Unknown Price and Promoter Data:**  
   * When `area.price === null` (Area A): `price.tsx` renders `<div className="nb-warning">No data yet</div>` and suppresses median comparisons.
   * When `area.promoter === null` (Area C): `promoter.tsx` renders `<div className="nb-warning">No matched promoter</div>` to prevent attributing an unrelated builder’s liabilities to a property.
6. **Isolation of Asking Price Input:**  
   In `web/src/App.tsx:45,72`, `asking` is isolated in local component state (`useState('')`). It computes the percentage gap against `area.price.median`, but **never** writes back to `area.entries.value.value` or mutates the overall neighbourhood score.

---

## 6. Web vs. Android Differences

| Dimension | Web Application (`web/src/App.tsx`) | Android Application (`android/`) | Risk / Discrepancy Level |
|---|---|---|---|
| **Architecture** | Single monolithic file (`App.tsx`, 82 lines, 33KB) | Modular screens (`android/src/screens/*.tsx`) | **High:** Web needs refactoring to match clean modularity. |
| **Routing** | Pseudo-state (`s.screen: Screen`) | Native Stack (`@react-navigation/native-stack`) | **High:** Web lacks URL routing and browser Back button breaks. |
| **Map Rendering** | Leaflet directly rendered into DOM (`div.nb-map`) | Leaflet rendered inside a `WebView` via `mapHtml.ts` | **Medium:** Android WebView requires separate maintenance of HTML string. |
| **Saved Reports** | Full snapshot stored with score, timestamp, and dedicated `'saved'` screen | Only stores list of IDs (`saved: string[]`). **No dedicated Saved screen** | **High:** Feature disparity; Android users cannot view saved report history. |
| **Checklist** | Interactive checkboxes, strike-through, progress counter, persistent storage | Static text cards; **no checkboxes, no progress counter, no persistence** | **High:** Android checklist is completely non-interactive. |
| **Price Reality Check** | Interactive input to enter custom ₹/sq ft asking price | Read-only static comparison using fixture asking price | **Medium:** Android users cannot test prospective property quotes. |
| **Sharing** | Custom modal with clipboard copy + Web Share API fallback | Native OS Share Sheet via React Native `Share.share` | **Low:** Platform-appropriate implementation. |
| **Correction Drafts** | 1200-character textarea saved locally in settings | **Completely omitted from Android Settings screen** | **Medium:** Feedback channel missing on mobile. |
| **Shared Code Sync** | Tracked copy in `web/shared/` | Metro watches parent `../shared/` directly | **Medium:** Risk of `web/shared/` and root `shared/` drifting out of sync. |

---

## 7. Existing Tests and Build Commands

### 7.1 Existing Test Suite
1. **Core Parity & Invariance Test (`tests/core.test.cjs`):**
   * Verifies quiz balance (all 7 metrics appear exactly twice).
   * Asserts fixture outputs for Area A (`score=63, lo=53, hi=68, used=6`).
   * Validates `null` score on empty entries and extreme missing weights.
   * Tests all 128 possible quiz permutations $\times$ 3 localities = 384 test vectors to ensure score and citation consistency.
2. **Backend Engine & API Unit Tests (`tests/test_engine.py`):**
   * Validates request schemas for `/v1/report`, `/v1/quiz`, and `/v1/compare`.
   * Enforces rejection of identical comparison areas (`422 Choose two different localities`).
   * Validates deterministic claim security: rejects 120 altered or spoofed metric summaries.
3. **Simulated DOM End-to-End Test (`tests/preview.test.cjs`):**
   * Uses JSDOM to simulate full user journeys: Welcome $\to$ Explore $\to$ Report $\to$ Metric $\to$ Checklist checkbox $\to$ Price calculation $\to$ 7-question quiz $\to$ Android layout toggle $\to$ Share modal $\to$ LocalStorage inspection $\to$ Reset cancellation.

### 7.2 Build and Verification Commands
```powershell
# Web Verification
cd web
npm ci
npm run typecheck    # Checks TypeScript (tsc --noEmit)
npm run build        # Production bundle via Vite into web/dist/

# Android Verification
cd ../android
npm ci
npm run typecheck    # Checks TypeScript (tsc --noEmit)
npm run lint:palette # Ensures styling adheres to cream/forest-green/amber tokens
npx expo start       # Launches Metro bundler

# Backend Verification
cd ../backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000

# Automated Test Suite (from root)
python -m unittest discover -s tests -p test_engine.py -v
```

---

## 8. Architectural & UX Risks (with NoBroker Benchmark Gaps)

### 8.1 Technical & Architectural Risks
1. **Monolithic Web Anti-Pattern:**  
   `web/src/App.tsx` contains 82 lines and 33KB of dense code. Routing, state, Leaflet initialization, modals, UI primitives, and 11 distinct screens are all defined in a single component. Any UI change risks breaking unintended states.
2. **Missing Web URL Routing (Broken Browser Back):**  
   Because screen state is tracked solely in `s.screen`, pressing the browser’s "Back" button leaves the website entirely. There are no deep-linkable URLs (e.g. `/report/a` or `/compare?first=a&second=b`).
3. **Shared Source Synchronization Hazard:**  
   `web/shared/` is a manual duplicate of root `shared/`. If a developer edits one and forgets the other, web and mobile scoring will silently diverge.
4. **Backend Disconnection:**  
   Both Web and Android currently run 100% offline using bundled JSON fixtures. The FastAPI backend is completely decoupled from the frontend apps.
5. **Fixtures vs. Real Data:**  
   All scores, observations, promoter histories, and price transactions are fictional. Ward geometry represents real Mumbai BMC polygons, but the report pins (A, B, C) are arbitrary sample points.

---

## 9. Recommended Phased Implementation Plan

### Phase 1: Architectural Foundation & Code Decoupling (Pre-requisite)
* **Step 1.1:** Modularize `web/src/App.tsx` into `components/`, `views/`, and `hooks/`.
* **Step 1.2:** Introduce client routing with URL and browser history support.
* **Step 1.3:** Eliminate duplicate code by configuring Vite alias `@shared` to root `shared/`.

### Phase 2: Design System & NoBroker-Inspired UI Modernization
* **Step 2.1:** Modernize typography (Inter/Jakarta Sans instead of Georgia serif) and card design tokens.
* **Step 2.2:** Build the Livability Omnibar (City selector + autocomplete + quick filter chips).
* **Step 2.3:** Redesign locality and metric cards with scannable badges.

### Phase 3: Screen-by-Screen UX Polish & Deep-Dive Enhancements
* **Step 3.1:** Tiered Neighbourhood Report with sticky summary header.
* **Step 3.2:** Interactive Price Reality Check with real-time visual feedback.
* **Step 3.3:** Interactive Visit Checklist with WhatsApp / print sharing.
* **Step 3.4:** Comparison Matrix with Advantage chips.

### Phase 4: Feature Parity & Verification
* **Step 4.1:** Bring Android app to full feature parity (interactive checklist, saved screen, editable price).
* **Step 4.2:** Re-run and expand automated test suite (`core.test.cjs`, `preview.test.cjs`, `test_engine.py`).
