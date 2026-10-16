# Build and validation results · 16 October 2026

## Passed

- Web TypeScript: `tsc --noEmit`.
- Production web build: Vite, 36 modules; self-contained inline preview approximately 510 KB.
- Android TypeScript: `tsc --noEmit`.
- Expo dependency compatibility: `expo install --check` reported dependencies up to date.
- Android Metro/Hermes export: 884 modules, 2.5 MB Hermes bundle, 17 assets. This is a bundle export, not an APK or device launch.
- Android palette source lint after replacing Leaflet's default blue styles. The lint does not examine image pixels or system UI.
- Python: seven engine/API test methods, including request validation, balanced quiz, insufficient evidence, missing-detail consistency, and 120 altered summary claims rejected by the deterministic validator.
- JavaScript core assertions and parity with Python for all 128 possible quiz choices across three localities: 384 combinations, matching scores, bounds, coverage and summaries.
- Isolated JSDOM interaction checks: welcome, locality search results, rendered Leaflet ward paths, report and bounds, save, missing-price screen, metric evidence, checklist checkmark, comparison, seven quiz answers, phone-layout switch, share contents and Escape dismissal, price calculation, stored state, and reset cancellation. No runtime errors in this simulated DOM. This does not replace a real-browser layout or device test.
- Private Sites deployment succeeded. Site URL: https://neighbrly-mumbai-preview.sacredape5.chatgpt.site . The web app is a static offline-data demonstration; the Python API is not hosted at this URL.
- Authenticated hosted-browser inspection subsequently became available: inspected the home page, report, evidence citation, save state, checklist checkmark and Android layout switch in the built-in browser. Screenshots confirmed readable desktop/sidebar and phone layouts at the browser's current size.

## Verification limits

- Local browser inspection was blocked by the browser access policy. The hosted private page initially showed sign-in, then became accessible. Hosted smoke checks and screenshots were completed; a comprehensive browser matrix, 320px layout test, 130% browser zoom test and formal accessibility audit were not performed.
- The in-chat preview is self-contained, has no live API/geocoder/tile requests and uses the same React UI as the web build. The Android-layout switch is a layout preview, not an Android emulator.
- No physical Android run, TalkBack assessment, 130% font-scale device test, native share-sheet test, or signed APK/AAB build was performed. Java/adb were not available on PATH.
- Real data adapters, source access/reuse verification, a database, server deployment, reviewed translations, live client/API integration, PDF/image export and external correction submission remain future work. All report figures are demo fixtures.
- The Sites source synchronization succeeded; its local archive packager requires Bash, which is unavailable here. Deployment used the supported remote build fallback.

## Reproducing the core checks

Install backend requirements, then run `python -m unittest discover -s tests -p test_engine.py -v` from the project root.

After installing the web dependencies, bundle `shared/core.ts` to CommonJS with esbuild and pass that output path to `node tests/core.test.cjs <absolute-core-bundle-path>`. An optional third argument writes parity vectors. The optional DOM test requires the dependencies in `tests/package.json` and the generated inline fragment path: `node tests/preview.test.cjs <absolute-fragment-path>`.

## Current feature revision

Seven metrics and seven balanced quiz questions. Previous saved snapshots are rebuilt with the current method while preserving bookmarks and save dates. Removed metrics do not contribute to reports, summaries, checklists or sharing. Method version: demo-bounds-v2.
