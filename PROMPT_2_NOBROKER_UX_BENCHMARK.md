# PROMPT 2/7 — NoBroker UX Research & Neighbrly Design Benchmark

> **Author:** Senior Product Designer & UX Researcher  
> **Target Reference:** [NoBroker.in](https://www.nobroker.in/) (Live homepage and interface inspected)  
> **Product:** Neighbrly (Evidence-led neighbourhood intelligence platform for Indian homebuyers)  
> **Date:** October 2026  
> **Status:** Research, Benchmarking & UX Strategy — Non-destructive.

---

## 1. Summary of NoBroker’s Observed UX Strengths

A live inspection of [NoBroker.in](https://www.nobroker.in/) reveals why it is considered one of the highest-converting property interfaces in India. Its UX strength stems from addressing high friction, fragmented data, and skepticism among Indian consumers:

1. **The Dominant Omnibar Pattern:**  
   The primary search mechanism consolidates three actions into a single focal component:
   * **City Selector:** Clear geographic scoping (e.g. Bangalore, Mumbai) prevents mismatched multi-city results.
   * **Segmented Intent Tabs:** Sits directly on top of the search bar (`Buy`, `Rent`, `Commercial`), setting immediate context before typing.
   * **Multi-Token Autocomplete:** Allows users to select up to 3 localities or landmarks, rendering them as dismissible chips inside the search bar.
2. **Aggressive Friction Removal & Value Signaling:**  
   The headline immediately establishes editorial positioning (*"World's Largest NoBrokerage Property Site"*). Secondary hero banners (`Why Use NoBroker`) explain *why* the user is here through four crisp pillars: *Avoid Brokers*, *Free Listing*, *Shortlist without Visit*, and *Rental Agreement*.
3. **Structured Density & Visual Chunking:**  
   High volumes of complex real estate data (rent estimates, legal paperwork, packing logistics) are organized into modular, icon-led service tiles with badge overlays (`Lowest Price`, `New Offers`, `New`).
4. **Mobile-First Touch Ergonomics:**  
   Controls are designed around thumb zones: 48px+ touch targets, full-width inputs that stack vertically on mobile screens, and a persistent floating action button for instant support.

---

## 2. Neighbrly UX Benchmark Table

| # | UX Area | NoBroker Pattern Observed | Why It Works in Indian Real Estate | Neighbrly Adaptation (Neighbourhood Intelligence) | What Neighbrly Must Avoid |
|---|---|---|---|---|---|
| **1** | **Hero Search & Omnibar** | Integrated pill container combining City Selector dropdown + multi-locality autocomplete input + bold "Search" CTA. | Users think in geographic hubs (e.g., "Mumbai $\to$ Bandra West"). Combining city + locality prevents search ambiguity. | **Livability Omnibar:** City Selector (`Mumbai (Demo)`) + Locality autocomplete with tags (`Bandra West`, `Powai`, `Thane`) + *"Explore Locality"* button. | **Avoid listing filters:** No BHK selectors, budget sliders, or "Furnished / Unfurnished" toggles. |
| **2** | **Value Proposition & Trust Signals** | Explicit "Why Use NoBroker" section with 4 pillars, guarantee icons, and "Avoid Brokers" messaging. | High consumer skepticism in Indian real estate; users need immediate proof of independence. | **Editorial Trust Bar:** Front-and-center pillars: *Zero Broker Bias*, *Auditable Sources*, *Honest Missing Data*, *No Commission Model*. | **Avoid fake social proof:** No fabricated user reviews or unverified "50,000 happy families" claims. |
| **3** | **Search Autocomplete & Locality Feedback** | Typing reveals an overlay with categorized results (Localities, Societies, Transit Hubs, Landmarks). | Helps buyers who know landmark names (e.g., "Near Powai Lake") rather than municipal ward boundaries. | Autocomplete displaying locality name, sub-district, and quick metric highlights (e.g. *"Bandra West · High Transit Score"*). | **Avoid property-level suggestions:** Do not suggest specific apartment complexes or commercial builder projects. |
| **4** | **Card Architecture & Data Scannability** | High-contrast white cards, 12–16px border-radius, clean status badges (`Lowest Price`, `Verified`). | Allows users to visually scan and compare options without cognitive exhaustion. | **Locality Dossier Cards:** Clean card displaying overall Match Score, qualitative rating pill (`Strong`, `Mixed`, `Weak`), coverage %, and top 2 livability strengths. | **Avoid listing thumbnails:** Do not display bedroom photos, floor plans, or "Contact Owner" buttons. |
| **5** | **Progressive Disclosure of Complex Data** | High-level summary at the top; detailed fees, agreements, and legal checks expandable below. | Prevents overwhelming users with dense legal/financial data upfront. | **Tiered Neighbourhood Report:** Level 1: Match Score & bounds; Level 2: Top 3 cited takeaways; Level 3: 7-metric fact ledger; Level 4: Deep dives. | **Avoid hiding missing data:** Never hide incomplete data in nested accordions; missing metrics must be visibly highlighted. |
| **6** | **Decision Trade-offs & Comparisons** | Side-by-side comparison tables highlighting key amenities and differences. | Property decisions are inherently comparative; buyers struggle to weigh pros and cons in isolation. | **Livability Trade-Off Matrix:** Side-by-side comparison of 2 localities across all 7 metrics, with **Overlapping Sensitivity Bounds warning**. | **Avoid declaring a universal "Winner":** The tool must highlight personal trade-offs, not declare an objective "Best Area". |
| **7** | **Interactive Inspection Tools** | Digital checklists and preparation tools (e.g., Packer & Mover calculator, Rental Agreement preview). | Shifts the user from passive reader to active, prepared buyer. | **Priority-Weighted Visit Checklist:** Personalized physical inspection tasks ordered by user weights (weak and missing metrics placed first). | **Avoid commercial upsells:** Do not monetize the checklist with affiliate links to home painters or movers. |
| **8** | **Financial & Reality Benchmarking** | "Rentometer" / price trend graphs comparing typical local rates against averages. | Information asymmetry in pricing; buyers fear overpaying. | **Asking-Price Reality Check:** Interactive tool comparing user-entered asking price (₹/sq ft) against registered transaction medians. | **Avoid market valuations:** Do not claim this is an appraisal or guarantee of market value; clearly cite sample transaction limits. |
| **9** | **Mobile Touch Navigation** | Bottom sheets for filters, sticky search headers on scroll, and full-width touch targets (48px+). | Over 75% of Indian property searches happen on mobile devices during commutes or field visits. | Sticky report navigation (Overview, Scores, Evidence, Checklist), full-width tap targets, and thumb-friendly controls. | **Avoid cramped desktop tables on mobile:** Never render wide multi-column tables without responsive card or horizontal scroll fallbacks. |

---

## 3. Recommended Information Architecture (IA)

```
Discovery Layer:
  - Home / Landing Page
  - Livability Omnibar: City Selector + Locality Autocomplete + Quick Category Chips
  - Interactive Ward Map with 900m Radius Pins

Personalization Layer:
  - 7-Question Priorities Quiz
  - Balanced Pairwise Trade-Offs (Transit vs Greenery, Schools vs Price, etc.)
  - Calibrated User Weight Vector (1 to 9 scale)

Core Evaluation Layer:
  - Neighbourhood Report Dossier
  - Headline Match Score & Missing-Data Sensitivity Bounds (lo–hi)
  - Deterministic Salient Takeaways with Citation Chips [ref]
  - 7-Metric Fact Ledger (Air, Transit, Schools, Safety, Delivery, Green, Value)

Audit & Verification Layer:
  - Evidence Ledger: Raw Observation, Timestamp, Source Authority, Ward Scope
  - Price Reality Check: Asking Price vs Registered Median per sq ft
  - Promoter Track Record: Builder Delivery Delays & RERA Complaints
  - On-Site Visit Checklist: Prioritized Field Inspection Tasks with Offline Storage

Comparative & Utility Layer:
  - Multi-Locality Comparison Matrix with Overlapping Bounds Warning
  - Saved Shortlist & Historical Snapshots
  - Plaintext Auditable Dossier Share Sheet (Clipboard & Web Share API)
  - Settings, Privacy Guarantees & Private Local Correction Drafts
```

---

## 4. Proposed Screen-by-Screen User Journey

1. **Discover Neighbrly (`Home`):**  
   User encounters a clean, high-trust landing page with the **Livability Omnibar**. Search suggestions display *"Bandra West"*, *"Powai"*, and *"Thane"*. User can also explore the 24 BMC wards on the interactive map.
2. **Set Priorities (`7-Question Quiz`):**  
   User chooses between pairwise trade-offs. The system assigns personalized weights to each of the 7 metrics without modifying underlying evidence.
3. **Evaluate Neighbourhood (`Report Dossier`):**  
   Dossier presents the personalized Match Score / 100 alongside sensitivity bounds (`lo`–`hi`). Top 3 drivers cite references `[1]`, `[2]`. Explicit amber badges denote missing data.
4. **Audit Evidence (`Metric Fact Sheet`):**  
   Clicking a citation or metric card reveals raw sensor/registry readings, collection dates, and physical verification advice.
5. **Ground-Truth Financials & Builder Risk (`Price` & `Promoter`):**  
   * Price Reality Check allows testing broker quotes against government-registered sale deeds.
   * Promoter Record inspects builder track record across past projects and RERA disputes.
6. **Field Due Diligence (`Visit Checklist`):**  
   Buyer visits the site with an actionable checklist prioritized by their lifestyle weights.
7. **Compare & Shortlist (`Compare` & `Saved`):**  
   Buyer compares candidate localities side-by-side, alerted if missing data makes scores inconclusive.

---

## 5. Visual Direction & Design Tokens

* **Palette:**
  * Background Canvas: `#FAF7F0` (Cream / Off-White)
  * Card Surfaces: `#FFFFFF` (Pure White)
  * Primary Ink: `#1F5C42` (Dark Forest Green), `#2F7D5B` (Primary Green)
  * Accent Soft: `#E3F1E8` (Soft Green Pill Fill)
  * Caution / Warning: `#F2A900` (Amber), `#FCF0CF` (Amber Soft Badge)
  * Risk / Discrepancy: `#D9553A` (Terracotta), `#F9E6DE` (Terracotta Soft Fill)
  * Borders & Dividers: `#E4DFD3`
* **Typography:** Modern clean sans-serif (**Inter** / **Plus Jakarta Sans** / system sans-serif fallback).
* **Touch Targets:** Minimum 48px height across all buttons and inputs.

---

## 6. Prioritized Redesign Opportunities

* **P0 (Critical Architecture):**
  1. De-monolithize `web/src/App.tsx` into modular components, views, and state hooks.
  2. Implement browser history navigation and deep-linkable URLs.
  3. Redesign search experience with NoBroker-style Livability Omnibar.
* **P1 (High-Impact UX):**
  1. Modernize typography, spacing, and card tokens.
  2. Implement tiered Neighbourhood Report with sticky navigation and clear data bounds.
  3. Rebuild locality comparison matrix with visual advantage chips.
* **P2 (Platform Parity & Utility):**
  1. Upgrade Android app to full feature parity (interactive checklist, saved screen, editable price).
  2. Post-quiz summary card with weight fine-tuning sliders.
  3. Formatted print / WhatsApp export dossier.

---

## 7. Actionable Design Brief for Prompt 3

```markdown
# NEIGHBRLY DESIGN BRIEF · PROMPT 3
- Objective: Re-architect and design the core components of Neighbrly adapting NoBroker's usability 
  strengths to an independent neighbourhood intelligence product.
- Design Identity: Modern editorial, clean off-white (#FAF7F0), crisp cards (#FFFFFF), 
  forest-green primary (#2F7D5B), amber badge accents (#F2A900), terracotta risk tags (#D9553A).
- Key Components to Specify:
  1. Livability Omnibar (City selector + autocomplete input + quick chips).
  2. Redesigned Locality Card & Metric Tiles.
  3. Tiered Neighbourhood Report Layout (Header, Bounds, Citations, Metrics, Deep Dives).
  4. Redesigned Side-by-Side Comparison Matrix with Overlapping Bounds warning.
  5. Interactive Priority-Weighted Visit Checklist.
- Core UX Guardrails: Zero broker monetization, no property listings, complete transparency 
  on missing data, and strict preservation of existing scoring algorithms.
```
