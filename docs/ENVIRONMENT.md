# Environment Configuration

> **Baseline Notice:** `p4jb` is a pure static client-side project with no server runtime, `.env` files, or secrets. This document defines hosting requirements, local development server setup, and Git repository/branch configuration.

---

## 1. Environment Variables & Secrets

- **Public Variables:** None required. All routing and payload paths are relative (`./`, `../`, `../../`) so the site runs identically at a domain root (`/`) or a GitHub Pages subpath (`/p4jb/`).
- **Private Variables / Secrets:** None.

### Rules
- Never commit API keys, personal tokens, credentials, or `.env` files into this public/static repository.
- Any future build or helper scripts added locally must not embed credentials in client-delivered HTML/JS.

---

## 2. Local Development & Testing Server

Because `g2all/` uses `<script type="module">` and payload loaders use `XMLHttpRequest` / `fetch()`, opening `index.html` via `file://` will fail due to browser CORS restrictions. Always serve via HTTP.

### Requirements
- Run `npm run dev` (executes `node server.ts` on port `3000`, configurable via `PORT`/`HOST`) or any static HTTP server on LAN (e.g., `python -m http.server 8080`, `npx http-server`, Nginx, Caddy).
- **MIME Types:**
  - `.js` / `.mjs` → `application/javascript` or `text/javascript` (required for ES Modules).
  - `.manifest` → `text/cache-manifest` (recommended for strict AppCache testing on older WebKit browsers).
  - `.bin` / `.elf` → `application/octet-stream`.
- **OS Case-Sensitivity Warning:**
  - Local development on **Windows** is case-insensitive (`Img.jpg` matches `img.jpg`), whereas **GitHub Pages (Linux)** is strictly case-sensitive. Always match exact filename casing in HTML, JS, and `*.manifest` files.
  - Always use forward slashes (`/`) in URLs and new manifest entries, never Windows backslashes (`\`).

---

## 3. Git Remotes & Branch Environment

This repository is configured as a personal fork tracking upstream exploit updates:

### Configured Remotes
| Remote | URL | Role |
| :--- | :--- | :--- |
| `origin` | `git@github.com:taninbabol1/taninbabol1.github.io.git` | Primary production repository (read/write) |
| `upstream` | `https://github.com/GamerHack/GamerHack.github.io.git` | Upstream source repository (read-only fetch) |
| `backup` | `git@github.com:AmirRghp/p4jb.git` | Personal fork/backup repository |

### Configured Branches
| Branch | Tracks | Purpose | Write Policy |
| :--- | :--- | :--- | :--- |
| `main` | `origin/main` | Personal stable / production branch deployed to host | Merge tested `feat/*`, `fix/*`, `style/*`, `docs/*` branches here |
| `upstream-main` | `upstream/main` | Clean mirror of upstream repository | **Read-only sync target** — never commit custom changes here |
| `feat/*`, `fix/*`, `style/*`, `docs/*` | Local (temporary) | Isolated branches created from `main` for each customization | Delete after merging into `main` |
