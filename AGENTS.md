# AI Coding Agent Instructions

## 1. Project Context

**Project:** `p4jb` (Personal Fork of `GamerHack/GamerHack.github.io`)

**Purpose:** Static, offline-capable PlayStation 4 Exploit Host serving WebKit/kernel jailbreaks, GoldHEN, and utility/game-mod payloads across PS4 firmware `5.05`, `6.72`, and `7.00`–`14.00`, plus User's Guide restore utilities.

**Primary Users:**
- PS4 console owners accessing the host via the PS4 WebKit Browser (online for initial cache installation, then offline).
- The repository maintainer (`AmirRghp`) customizing UI, branding, payload selection, and firmware support on top of upstream updates.

---

## 2. Source of Truth

Before making significant changes, read the relevant documentation inside `/docs`:

- [PRD.md](docs/PRD.md) — Product scope, baseline features, and customization direction
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — Colors, typography, button classes, layout tokens
- [UX_FLOWS.md](docs/UX_FLOWS.md) — Cache installation, auto-exploit, payload, and restore journeys
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Static multi-page architecture, UA router, AppCache boundaries
- [TESTING.md](docs/TESTING.md) — Static checks, UA simulation, and console verification rules
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) — Static hosting constraints, local test server, Git remotes/branches
- [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) — AppCache, UA mismatch, script load, and exploit failure behavior
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Branch release flow, upstream sync runbook, cache-busting checklist
- [DECISIONS.md](docs/DECISIONS.md) — Architecture Decision Records (ADRs)
- [CHANGELOG.md](docs/CHANGELOG.md) — Baseline and release history

Do not contradict these documents without first identifying the conflict and asking the user.

---

## 3. Git & Branching Rules (Mandatory)

This repository tracks both the personal fork (`origin`) and the upstream project (`upstream`). Every agent must respect the branch topology:

| Branch / Remote | Purpose | Agent Rule |
| :--- | :--- | :--- |
| `origin` (`git@github.com:AmirRghp/p4jb.git`) | Personal fork repository | Push only when explicitly asked or when completing a requested release |
| `upstream` (`https://github.com/GamerHack/GamerHack.github.io.git`) | Upstream source repository | Fetch only; never push |
| `main` | Personal stable / production branch | Merge tested `feat/*`, `fix/*`, `style/*`, `docs/*` branches here |
| `upstream-main` | Clean read-only mirror of `upstream/main` | **NEVER** commit custom changes to `upstream-main` |
| `feat/*`, `fix/*`, `style/*`, `docs/*` | Short-lived working branches created from `main` | Do feature/customization work here, then merge into `main` |

### Git Safety Rules
- **Never commit custom code on `upstream-main`.**
- **Never run `git rebase` on `main` or `git push --force`** unless explicitly instructed by the user. Upstream updates are integrated via `git merge upstream-main` into `main` (see [DEPLOYMENT.md](docs/DEPLOYMENT.md)).
- **Minimize upstream merge conflicts:** Avoid editing core exploit scripts (`505/exploit.js`, `672*/`, `900*/`, `g2all/700/`, `g2all/900/`, `g2all/css/`, `g2all/slopkit/`) unless the task explicitly targets them. Prefer additive, isolated files (e.g., a custom CSS override or modular JS file) over rewriting upstream HTML/JS inline.
- Use clean, conventional commit prefixes: `feat:`, `fix:`, `style:`, `docs:`, `chore:`.

---

## 4. General Rules

- Understand existing code and AppCache manifests before modifying any file.
- Preserve existing upstream exploit behavior unless explicitly tasked with changing it.
- Do not introduce Node/Webpack/Vite build pipelines, TypeScript compilation steps, or external runtime CDN dependencies—every offline host page must run directly from static files on the PS4 WebKit Browser.
- Respect PS4 WebKit compatibility:
  - Legacy hosts (`505/`, `672/`, `672goldhen/`, `900goldhen/`, `900v3/`, `restore/`) use plain ES5-compatible `<script>` tags and `XMLHttpRequest`.
  - ES Modules (`type="module"`) are used only in `g2all/700/`, `g2all/900/`, and `g2all/slopkit/` (FW `7.00`+ / `9.00`+ / `11.50`+).
- Always keep relative asset paths accurate (`../style.css`, `../../style.css`).
- Whenever adding, renaming, or removing an asset used by an offline host, update its corresponding `*.manifest` file and bump the manifest content so PS4 AppCache detects the update.
- Avoid unrelated changes to untouched firmware directories.

---

## 5. Planning

Before implementing any non-trivial change:

1. Inspect relevant `/docs/*.md` files.
2. Inspect the affected HTML pages, JS modules, CSS rules, and `*.manifest` files.
3. Check whether the change touches core upstream files (assess merge-conflict impact).
4. Identify affected firmware directories (`index.html`, `g2all/`, `505/`, `672/`, `672goldhen/`, `900goldhen/`, `900v3/`, `restore/`).
5. Identify manifest updates required for offline caching.
6. Identify verification steps (static link/manifest checks, browser UA simulation, PS4 console test).
7. Create a concise implementation plan before editing files when working on multi-file changes.

---

## 6. Implementation

During implementation:

- Make focused, minimal changes.
- Reuse existing CSS classes (`.btn`, `.btn-multi`, `.btn-onln`, `.btn-toolbox`) and layout IDs (`#menu`, `#progress`, `#msgs`, `#msgs2`, `#crypto`, `#mods`, `#lnx`) defined in [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), unless intentionally updating the design system.
- Do not add external runtime fonts, analytics, or remote scripts to cached pages.
- Keep `g2all/*.manifest` path-separator awareness in mind (prefer `/` for newly added entries and note existing `\` baseline entries documented in [ARCHITECTURE.md](docs/ARCHITECTURE.md)).

---

## 7. Validation

After implementation:

1. Verify all referenced assets (`<link>`, `<script>`, `<img>`, `.bin`/`.elf` payload paths, and `*.manifest` entries) exist on disk with exact case-matching filenames.
2. Serve locally over HTTP and test routing/UI in a desktop browser (including simulated PS4 User-Agent strings for `g2all/index.html`).
3. Check `git status` and `git diff` for unintended edits to binary payloads or unrelated firmware folders.
4. For exploit, payload, or AppCache changes, specify manual verification on target PS4 hardware.

---

## 8. Documentation Lifecycle

This repository is a living fork: baseline behavior is documented first, and `/docs` must evolve alongside customizations. Update the corresponding document whenever a change affects:

| Change Type | Document to Update |
| :--- | :--- |
| Product scope, supported firmwares, payloads, or customization goals | `docs/PRD.md` |
| Colors, typography, buttons, layout, or visual states | `docs/DESIGN_SYSTEM.md` |
| Navigation steps, cache flow, or user interactions | `docs/UX_FLOWS.md` |
| Folder structure, UA router, exploit chains, or manifest rules | `docs/ARCHITECTURE.md` |
| Test commands, validation scripts, or QA checklists | `docs/TESTING.md` |
| Hosting setup, local server config, or Git branch setup | `docs/ENVIRONMENT.md` |
| Error messages, fallback behavior, or recovery steps | `docs/ERROR_HANDLING.md` |
| GitHub Pages deployment, upstream sync, or cache-busting steps | `docs/DEPLOYMENT.md` |
| Major technical/architectural choices | `docs/DECISIONS.md` |
| Releases, upstream merges, or notable customizations | `docs/CHANGELOG.md` |
| Agent rules, workflow, or coding constraints | `AGENTS.md` |

---

## 9. Conflict Handling

If requirements, firmware targets, or documentation conflict:
- Do not guess memory offsets, binary payload compatibility, or user customization preferences.
- Identify the conflict explicitly and ask the user for clarification.

---

## 10. Completion Criteria

A task is complete only when:

- Requested behavior is implemented cleanly on the appropriate branch (`feat/*`, `fix/*`, etc., or as directed).
- Referenced files, paths, and manifests are verified on disk.
- No unintended files or binary assets were altered.
- Relevant `/docs/*.md` files (and `docs/CHANGELOG.md` for meaningful changes) are updated.
