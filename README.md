# Neighbrly · web + Android starter

**Live web demo:** https://neighbrly-mumbai-preview.sacredape5.chatgpt.site

Current scope: seven metrics and a balanced seven-question quiz.

A working demonstration of evidence-led neighbourhood reports, using the approved cream, forest-green, amber and terracotta palette. All scores, observations, promoters, price samples and report locations are invented. The Mumbai administrative geometry is real sourced map data; it does not establish report coverage or validate claims.

## What is implemented

- Responsive React/TypeScript web app, plus Web / Android-layout size switch.
- Existing Expo/React Native Android app extended with a bundled Leaflet map in a WebView.
- Balanced seven-question quiz, weighted reports, evidence drill-downs, missing-data states, deterministic cited summaries, price check, promoter record, comparison and visit checklist.
- Web: on-device saved report snapshots, persistent checklist checkmarks, editable asking-price comparison, text sharing/copying, settings, a local correction draft, data reset and empty/search states.
- Android: on-device quiz weights and saved locality bookmarks, native text share sheet, safe-area padding, explicit missing price/promoter screens, Leaflet marker → native report navigation.
- FastAPI demo service with `/health`, `/v1/areas`, GET/POST `/v1/quiz`, POST `/v1/report`, POST `/v1/compare`, request validation and a deterministic claim validator.
- In-chat preview is built from the same React app. The Android-layout switch previews responsive behavior, not a running Android emulator. Native Android screens have a simpler layout than the web app.
- **System Architecture & Interaction Flow**: See [FLOW_STRUCTURE.md](file:///c:/Users/ACER%20NITRO%20V%2015/OneDrive/Desktop/Neighbrly/Neighbrly/FLOW_STRUCTURE.md) for the complete screen-by-screen flow, interaction logic, and system rationales.

## Start the web app

Use a supported recent Node.js release. From `web/`:

```powershell
npm ci
npm run dev
```

Open the printed localhost URL. `npm run typecheck` checks TypeScript; `npm run build` creates `web/dist/`. The web page is also published publicly through Sites. There is no sign-in or external connector integration in the application itself.

`web/shared/` is a tracked copy of the root shared fixture and engine, included so the web Site can build independently. Keep these copies synchronized when changing report semantics; parity checks should cover both clients and Python. The root `shared/` remains the Android input.

## Start Android

From `android/`:

```powershell
npm ci
npm run typecheck
npm run lint:palette
npx expo start
```

Use an Expo client compatible with SDK 58 or a development build. For a preview APK, use `eas build -p android --profile preview` after configuring your own Expo account and project. No Expo credentials, EAS project ID, keystore or store account is included. Preserve `shared/` beside `android/`: Metro watches the parent directory.

The native Leaflet view bundles its library, CSS and simplified boundaries locally. It makes no tile/geocoder requests and requires no location permission. The native screens use the source fixture directly for this offline demo. The supplied app package identifier is `com.neighbrly.app`; replace it with your owned identifier before store publication.

## Start the API

From `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

API docs: `http://127.0.0.1:8000/docs`. Example report request:

```json
{"area_id":"a","weights":{"air":1,"transit":1,"schools":1,"safety":1,"delivery":1,"green":1,"value":1}}
```

Both previews currently use the bundled demo engine and do not require a running API. The Python service implements the same contract and is independently tested; connecting clients to a live server, adding timeouts/cache freshness behavior, authentication/rate limits and deployment are subsequent integration work. There is no database or Redis dependency in the offline demo.

## Scoring and evidence rules

- Every metric is higher-is-more-favourable, 0–100. Fixtures do not implement real normalization from source measurements.
- Observed score is the rounded weighted average over available metrics. Require at least three available metrics and 50% of selected weight; otherwise score is unavailable.
- Missing-data bounds use all weights, assigning missing metrics 0 for the low bound and 100 for the high bound. These are sensitivity bounds, **not** confidence intervals. They do not account for measurement uncertainty.
- Unknown price and promoter data suppress the corresponding detail calculations.
- Reports retain observation dates, sources, coverage, evidence references and method version.
- Summaries are deterministic templates. The validator accepts only the exact supported metric/reference/text pairing. No LLM, prediction, crime-rate claim or live-data guarantee is implemented.
- Changing the seller's asking price updates the web comparison only. It does not silently rewrite the underlying price-value fixture score.

## Verification

The implementation was checked with web and Android TypeScript, a production web build, Android Metro/Hermes export, palette source lint, backend tests and JavaScript/Python report parity. See `VALIDATION.md` for results and remaining device/browser limitations.

Run backend tests from this folder after installing requirements:

```powershell
python -m unittest discover -s tests -p test_engine.py -v
```

The inline preview builder is `web/scripts/make-inline.mjs`; it bundles React, Leaflet, CSS, geometry and fixture data into a fragment under 1 MB. No API calls or external tile requests are made in that preview. State restoration depends on the host; if storage is unavailable, interactions still work for the session.

## Next implementation milestones

1. Verify access, reuse terms and resolution for the chosen real Mumbai datasets; begin with a manually reviewed import.
2. Version each metric transformation and evidence schema, then connect clients to the report service.
3. Add real property/project/promoter matching and comparable transaction filters before offering real price or delivery claims.
4. Add a compliant tile/geocoding provider and mark precise verified coverage. The current map is an administrative overview, not street navigation or address search.
5. Add PDF/image export, a submitted correction channel and reviewed Hindi/Marathi translations. They are visibly planned rather than simulated as completed.
6. Validate on a physical Android phone: WebView, hardware Back, offline restart, storage failure, 130% text, TalkBack, native share sheet and palette defaults. Build/sign an APK and run a buyer pilot before a real-data launch.

No iOS build, WhatsApp bot, resident pulses, payment, live ETL or calibrated confidence model is included.

## Source attribution

Mumbai ward geometry: [Sanjana Krishnan, mumbai_spatial_data](https://github.com/sanjanakrishnan/mumbai_spatial_data/blob/main/BMC_admin_wards.geojson), retrieved 16 October 2026. Repository default [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Coordinates were simplified and rounded for rendering; these are reference boundaries, not a statement of current administrative validity.

Leaflet 1.9.4: [Leaflet](https://leafletjs.com/), BSD-2-Clause. Its license is retained in `THIRD-PARTY-NOTICES.md`. The native bundled copy replaces default blue map UI colors with the product green; source geometry is unchanged apart from simplification. React and Expo dependencies retain their package licenses. App icons are retained from the supplied ZIP.
