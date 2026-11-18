# Product Requirements Document

> **Baseline & Living Fork Notice:** This document records the exact current baseline inherited from `GamerHack/GamerHack.github.io` at the time `p4jb` was forked. As personal customizations are introduced to `p4jb`, this PRD will be updated incrementally to reflect new goals, UI changes, and payload selections.

---

## 1. Product Overview

- **Product Name:** `p4jb` (PS4 Exploit Host — Personal Fork of GamerHack PS4 Exploit Host)
- **One-Line Description:** An offline-capable, static web host that delivers PlayStation 4 WebKit/kernel exploits, GoldHEN, and homebrew/mod payloads directly through the PS4 console browser.
- **Product Type:** Static Multi-Page Client-Side Web Application (HTML5 + CSS3 + Vanilla JS + HTML5 AppCache + Binary Payloads)
- **Primary Platform:** PlayStation 4 Built-in WebKit Browser (Firmware `5.05`, `6.72`, `7.00`–`14.02`), hosted via GitHub Pages or a local LAN HTTP server.

---

## 2. Problem

### What problem are we solving?
Stock PlayStation 4 consoles on exploitable firmware versions (`5.05` through `14.02`) require running a WebKit and kernel exploit chain from the console's browser after cold boots or rest-mode failures in order to load GoldHEN and homebrew payloads. Users also need a reliable way to run the host **completely offline** once cached so consoles can remain disconnected from the internet (avoiding accidental firmware updates or Sony server telemetry).

### Why does this problem matter?
- Different PS4 firmware versions require completely different WebKit entrypoints, ROP/memory primitives, kernel exploits, and binary patches.
- Without offline caching (`CACHE MANIFEST`), users would need an active internet connection or local PC server every time they jailbreak their console.
- Without a structured fork workflow and documentation, personalizing the UI, payloads, or branding makes merging future upstream exploit updates error-prone.

### How are users solving this today?
Users either rely on public third-party hosts (such as `gamerhack.github.io` or DNS-redirected User's Guide hosts), self-host locally via ESP8266/Raspberry Pi/PC HTTP servers, or manually edit static HTML/JS files without a design/architecture specification.

---

## 3. Goal

- **Primary Goal:** Provide a reliable, fast, offline-first PS4 Exploit Host supporting firmware `5.05`, `6.72`, and `7.00`–`14.02`, while establishing a clean, documented baseline for safe personal customization in `p4jb`.
- **Secondary Goals:**
  - Support automatic firmware detection (`g2all/`) for zero-click GoldHEN loading across `5.05` and `7.00`–`14.02`.
  - Provide full dedicated payload menus for legacy firmwares (`5.05`, `6.72`, `9.00`).
  - Provide User's Guide restoration payloads (`restore/`) without requiring custom DNS.
  - Keep customizations isolated enough to cleanly merge future `upstream` (`GamerHack/GamerHack.github.io`) exploit updates.

---

## 4. Target Users

### User Type 1 — PS4 Console Owner / End User
- **Description:** A PS4 owner running firmware `5.05`, `6.72`, or `7.00`–`14.02` using the console's built-in browser with a DualShock 4 controller.
- **Needs:**
  - Clear firmware selection and one-click auto-exploit execution.
  - Reliable offline caching so the console can stay disconnected from the internet.
  - Readable TV-friendly UI with clear status feedback (`Loading`, `Cache Installed`, `Loaded`, `Failed`).
- **Pain Points:**
  - Memory errors / kernel panics on WebKit exploits.
  - Confusion about when to close the browser and disable internet during cache installation.
  - Broken or incomplete offline caches if manifests omit files.

### User Type 2 — Fork Maintainer (`AmirRghp`)
- **Description:** The developer customizing `p4jb` for personal use (branding, theme/UI tweaks, payload curation, or localization) while tracking upstream exploit fixes.
- **Needs:**
  - Clear separation between UI/branding customizations and low-level exploit engines.
  - Explicit Git branching and upstream-sync procedures.
  - AI-readable documentation so coding agents do not break PS4 WebKit compatibility or AppCache manifests.

---

## 5. User Stories

- As a PS4 user on firmware `5.05` or `7.00`–`14.02`, I want the multi-firmware host (`g2all/`) to automatically detect my firmware and load GoldHEN `v2.4b18.14` so that I don't have to pick an exploit chain manually.
- As a PS4 user on `5.05`, `6.72`, or `9.00`, I want access to a dedicated payload menu so that I can run tools like FTP, Dumper, App2USB, Fan Threshold, Linux Loaders, Web-Activator, and Game Mods.
- As a PS4 user, I want the host to install all required files into the browser's offline cache on first visit so that I can turn off the internet afterward.
- As a PS4 user, I want a Restore Host option (`restore/`) so that I can restore a User's Guide host without configuring DNS.
- As the fork maintainer, I want documented architecture, design tokens, and Git workflows so that I can customize `p4jb` safely and still pull upstream updates.

---

## 6. Core Features (Current Baseline)

### Feature 1 — Root Firmware & Host Selector (`index.html`)
- **Purpose:** Serves as the main landing menu linking to all supported firmware hosts, the restore menu, and the cryptocurrency donations view.
- **User Flow:** User opens root `/` → hovers buttons to inspect descriptions in `#msgs` → clicks a host button or `For Donations`.
- **Inputs:** Controller/mouse hover (`onmouseover`/`onmouseout`) and button click (`onclick` / `<a href>`).
- **Outputs:** Navigation to `g2all/index.html`, `505/index.html`, `672goldhen/index.html`, `672/index.html`, `900goldhen/index.html`, `900v3/index.html`, `restore/index.html`, or toggling `#crypto` view.
- **Acceptance Criteria:**
  - All 7 navigation buttons route to valid local HTML entry points.
  - `#msgs` updates on hover and resets on mouseout.
  - Donations view toggles `#menu` / `#crypto` cleanly and returns to `#menu`.

### Feature 2 — Auto-Detecting Multi-Firmware GoldHEN Host (`g2all/`)
- **Purpose:** Detects the console's PS4 firmware version from `navigator.userAgent`, installs the matching firmware family's offline AppCache, and executes the appropriate exploit chain to load `goldhen_2.4b18.14.bin`.
- **Supported Firmware Ranges (Baseline):**
  - `5.05`, `5.07` → `cache505.html` / `505/exploit.js`
  - `7.00`–`8.52` → `cache700.html` / `700/alert.js` (PSFree + Lapse + kpatch)
  - `9.00`–`9.60` → `cache900.html` / `900/alert.js` (PSFree + Lapse + kpatch)
  - `10.00`–`11.02` → `cachecss.html` / `css/main.js` (Lapse or Poops chain + patches)
  - `11.50`–`11.52` → `cacheslopkit.html` / `slopkit/chain_lapse.js`
  - `12.00`–`14.02` → `cacheslopkit.html` / `slopkit/jb.js`
- **Edge Cases:**
  - Non-PS4 browser visits → displays `"Only for PS4 with Firmware 5.05 and 7.00 to 14.02"`.
  - Unsupported PS4 firmware → displays `"Unsupported Firmware: <version>"` in red.
  - Uncached state (`applicationCache.status == '0'`) → redirects to firmware-specific cache page.

### Feature 3 — Dedicated Firmware Hosts (`505/`, `672goldhen/`, `672/`, `900goldhen/`, `900v3/`)
- **Purpose:** Provide single-firmware optimized hosts:
  - `672goldhen/` & `900goldhen/`: Automatic GoldHEN `v2.4b18.14` loading (with `passcount`/`failcount` tracking on `672goldhen`).
  - `505/` (v2.5), `672/` (v3.0), `900v3/` (v3.0): Full payload dashboards including GoldHEN `v2.4b18.14` & `v2.3`, Bin Loader (port `9020`), system utilities (ToDex, Dumper, FTP, App2USB, DB Backup/Restore, Update Blocker, Kernel/Module Dumper, PS4 Debug, RIF Renamer, Remote Play, WebRTE, Fan Threshold `50°C`–`75°C`, Orbis Toolbox), Linux loaders (1GB–4GB standard & PS4-Pro on 9.00), Web-Activator (`900v3`), and Game Mods (GTA V & RDR2).
- **Edge Cases:**
  - Uncached visit (`applicationCache.status == '0'`) redirects to local `cache.html` (`505/`, `900goldhen/`, `900v3/`) or caches inline (`672/`, `672goldhen/`).
  - External links (e.g., `http://ps4trainer.com/Trainer/index.html` and online Game Mods) require an active internet connection.

### Feature 4 — Offline HTML5 AppCache System
- **Purpose:** Persists HTML, CSS, JS, `.elf`/`.bin` patches, and payloads in the PS4 browser cache via `<html manifest="...">`.
- **Acceptance Criteria:**
  - Displays live percentage progress (`0%`–`100%`) and completion instruction (`Cache Installed Successfully ✔` → `Now Close And Re-Open Your Browser ...`).

### Feature 5 — Restore Host (`restore/`)
- **Purpose:** Restores a User's Guide exploit host on `5.05`, `6.72` (v3.0 / GoldHEN), and `900` (v3.0 / GoldHEN) without using custom DNS.

---

## 7. Non-Goals

The following are intentionally NOT part of the current baseline:
- Backend server, database, user accounts, or authentication.
- Modern SPA framework (React/Vue/Next.js) or bundler pipeline (Webpack/Vite).
- Automated exploit payload compilation from C/C++ sources (payloads are prebuilt `.bin`/`.elf` binaries).
- PS5 exploit hosting (though `g2all/*/config.js` includes upstream PSFree PS5 UA parsing stubs, `g2all/index.html` filters strictly for `PlayStation 4`).

---

## 8. Scope: Current Baseline vs. Future Personalization

### Current Baseline (Documented Now)
- Complete GamerHack PS4 Exploit Host (`5.05`–`14.02`) as forked in `p4jb`.
- English UI with GamerHack branding, credits, and BTC/ETH donation view.
- Full documentation suite (`/docs` + `AGENTS.md`) and Git branch strategy (`main` + `upstream-main`).

### Planned Personalization Direction (To Be Updated Incrementally)
- Custom branding, title/credits updates, and removal or customization of donation screens.
- UI/UX styling customizations (via isolated CSS/assets where possible).
- Curated payload menus or localized UI adjustments, documented in `PRD.md`, `DESIGN_SYSTEM.md`, and `CHANGELOG.md` as each change is implemented.

---

## 9. Success Metrics

- **Offline Reliability:** 100% of assets required for offline jailbreak/GoldHEN loading are cached cleanly with zero 404 errors.
- **Routing Accuracy:** `g2all/index.html` maps every documented PS4 firmware string (`5.05`–`14.02`) to its intended exploit script without syntax or path errors.
- **Maintainability:** Future upstream updates from `GamerHack/GamerHack.github.io` merge into `main` cleanly with minimal conflicts.

---

## 10. Constraints

### Technical
- Must work inside the PS4 WebKit Browser (older Safari/WebKit engines on `5.05`/`6.72`; no Service Workers, no assumptions of modern ES2022+ APIs on legacy firmware).
- Zero server-side execution—must operate strictly as static files (GitHub Pages compatible).
- Must not depend on external CDNs or Google Fonts for core UI or offline exploit execution.

### Design
- Must remain legible and navigable on 720p/1080p television screens using a PS4 controller cursor.

### Operational
- Every file needed offline must be declared in the corresponding `*.manifest` file.

---

## 11. Assumptions

- Users follow the documented cache installation workflow (visit online → wait for `100%` → exit browser → disable internet → reopen browser).
- Binary payloads (`.bin`, `.elf`) committed in the repository are pre-verified upstream releases.
- Case-sensitive file hosting (GitHub Pages / Linux) is the target production environment even when developing on Windows.

---

## 12. Open Questions

- Which personalizations will be prioritized first (e.g., removing/modifying `#crypto` donations, custom background/theme, Persian UI support, or pruning unused game mod payloads)?
- Will `g2all/*.manifest` backslash path separators (`\`) be normalized to forward slashes (`/`) in an upcoming fix branch?

---

## 13. Definition of Done

A feature or customization in `p4jb` is considered complete when:
- [ ] Implementation matches requirements in `docs/PRD.md` and visual rules in `docs/DESIGN_SYSTEM.md`.
- [ ] All affected `*.manifest` files include every modified/added offline asset.
- [ ] Static validation (local HTTP server, asset existence, console/browser check) passes with zero 404s or console errors.
- [ ] Git branch workflow (`feat/*` → `main`) is followed cleanly.
- [ ] Relevant documents in `/docs` and `docs/CHANGELOG.md` are updated.
