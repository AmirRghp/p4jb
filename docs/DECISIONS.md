# Architecture Decisions

> **Purpose:** Record key architectural and workflow decisions for `p4jb` so future customizations and AI-assisted changes do not repeatedly re-debate or accidentally undo foundational choices.

---

## Decision 001

- **Title:** Maintain Pure Static Architecture (No Build Pipeline or SPA Framework)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Context:** When customizing a forked web project, developers often introduce Node/Vite/React build steps. However, this project targets PlayStation 4 WebKit browsers ranging from firmware `5.05` (older WebKit) up to `14.00` and relies on direct static file serving with HTML5 AppCache.
- **Decision:** Keep `p4jb` as a pure static HTML5 + CSS3 + Vanilla JS application with zero build step and zero runtime external dependencies.
- **Alternatives:**
  - Introduce Vite/Webpack bundler or React/Tailwind build pipeline.
- **Reason:** Bundlers complicate per-firmware `*.manifest` maintenance, risk breaking older PS4 WebKit JS engines, and add unnecessary tooling overhead for a static exploit host.
- **Consequences:**
  - **Positive:** Instant local testing, direct GitHub Pages hosting, zero build failures, easy merging with upstream static files.
  - **Tradeoff:** Shared layout elements (header/footer/buttons) across sub-hosts require careful manual consistency or lightweight shared CSS/JS includes.

---

## Decision 002

- **Title:** Retain HTML5 Application Cache (`CACHE MANIFEST`) for Offline Support
- **Date:** 2026-11-13
- **Status:** Accepted
- **Context:** Modern web apps use Service Workers (`navigator.serviceWorker`) for offline caching, while PS4 exploit hosts use `<html manifest="*.manifest">`.
- **Decision:** Continue using HTML5 Application Cache (`*.manifest`) for offline PS4 browser caching across all firmware hosts.
- **Alternatives:**
  - Migrate offline caching to Service Workers.
- **Reason:** PS4 console browsers (especially older firmware `5.05`–`9.00` and User's Guide webviews) rely on AppCache over plain HTTP/HTTPS and do not uniformly support Service Workers across all target versions.
- **Consequences:**
  - **Positive:** Proven offline caching behavior on target PS4 consoles.
  - **Tradeoff:** Every added/updated offline asset must be manually listed in `*.manifest`, and the manifest file must be modified to trigger cache updates.

---

## Decision 003

- **Title:** Fork Git Branching Strategy (`main` Personal + `upstream-main` Tracker + `feat/*`)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Context:** `p4jb` is a customized personal fork of `GamerHack/GamerHack.github.io`. Without branch separation, pulling upstream exploit updates causes messy history conflicts or accidental overwrites.
- **Decision:**
  - `main` holds the customized personal production host (pushed to `origin`).
  - `upstream-main` tracks `upstream/main` cleanly with zero direct custom commits.
  - All new features, fixes, and docs are developed on short-lived `feat/*`, `fix/*`, `style/*`, or `docs/*` branches created from `main`, then merged back into `main`.
  - Upstream updates are pulled into `upstream-main` and integrated into `main` via `git merge upstream-main` (never `rebase` on `main`).
- **Alternatives:**
  - Develop customizations directly on `main` while rebasing onto `upstream/main`.
  - Keep `upstream` on `main` and deploy from a separate `custom` branch.
- **Reason:** Keeping `main` as the personal default branch integrates seamlessly with GitHub Pages defaults, while `merge` avoids history rewrites and force-pushes.
- **Consequences:**
  - **Positive:** Clean Git history, straightforward upstream syncs, safe feature isolation.
  - **Tradeoff:** Maintainer and AI agents must strictly avoid committing directly to `upstream-main`.

---

## Decision 004

- **Title:** Conflict-Minimizing Customization Isolation
- **Date:** 2026-11-13
- **Status:** Accepted
- **Context:** Upstream updates frequently modify firmware exploit directories (`g2all/`, `505/`, `672*/`, `900*/`) and payload binaries.
- **Decision:** Isolate personal customizations (custom themes, extra styles, custom scripts, new UI panels) into separate files (e.g., dedicated CSS/JS overrides imported with minimal 1–2 line hooks) and avoid touching core upstream exploit JS files unless required.
- **Alternatives:**
  - Rewrite upstream HTML/JS files inline across every firmware folder.
- **Reason:** Minimizes three-way merge conflicts when merging `upstream-main` into `main`.
- **Consequences:**
  - **Positive:** Much faster, safer upstream exploit updates.
  - **Tradeoff:** Requires discipline to append/include override files rather than inline-editing upstream files heavily.

---

## Decision 005

- **Title:** Living Documentation Policy (`/docs` + Root `AGENTS.md`)
- **Date:** 2026-11-13
- **Status:** Accepted
- **Context:** AI coding agents and future maintenance require a single source of truth that stays synchronized with the codebase.
- **Decision:** Capture the exact upstream baseline in `/docs` and `AGENTS.md` first, and require updating the relevant documentation files as part of every feature/customization PR or branch merge.
- **Alternatives:**
  - Ad-hoc prompting without persistent documentation.
- **Reason:** Prevents AI guessing on PS4 WebKit constraints, AppCache manifests, design tokens, and Git rules.
- **Consequences:**
  - **Positive:** Consistent AI-assisted development and clear onboarding.
  - **Tradeoff:** Small documentation maintenance step added to the Definition of Done.
