# Changelog

All notable changes to `p4jb` will be documented in this file.

---

## [Unreleased]

### Changed
- Synced upstream `GamerHack/GamerHack.github.io` (`upstream/main` @ `52edf4c`) into `p4jb` via `upstream-main`, preserving all `TANIN` branding and local customizations, and updated `tests/static-server.test.ts` root title assertion to match `TANIN`.
- Optimized background video delivery, decoding, and playback without modifying core exploit files:
  - Re-encoded `public/assets/aistudio/Tanin1080p_b1930797.webm` (2-pass 1080p VP9 CRF 37, GOP 24, stripped unused audio stream: reduced from `2.0 MB` to `1.04 MB`), generated `public/assets/aistudio/tanin-bg.mp4` (`758 KB` 720p H.264 Main `+faststart` fallback for Safari/PS4 WebKit), and generated `public/assets/aistudio/tanin-poster.jpg` (`55 KB` 720p frame-0 poster).
  - Upgraded `bg-video.js` (ES5) with `canPlayType` codec selection, runtime source fallback to poster background, GPU/smooth opacity reveal (`is-ready`), `visibilitychange`/`pagehide` pause-resume, `prefers-reduced-motion` support, PiP/remote-playback suppression, and gesture autoplay retry.
  - Optimized `#p4jb-bg-layer` and `#p4jb-bg-video` in `style.css` with poster fallback background, `translateZ(0)`, `contain: strict`, `user-select: none`, and `0.25s` opacity fade-in.
  - Added `ETag`, `Last-Modified`, conditional `304 Not Modified`, and differentiated `Cache-Control` (`public, max-age=3600` for media/binaries, `no-cache` for HTML/CSS/JS/manifests) in `lib/static-server.ts` with corresponding tests in `tests/static-server.test.ts`.
  - Registered `tanin-bg.mp4` and `tanin-poster.jpg` across all 10 `*.manifest` offline caches and bumped cache version comment to `# bg-video v3`.
- Added `Designed by : Tanin` heading using `.brand-tanin` above the `Special Thanks to:` footer in `g2all/index.html`.
- Renamed the root `GoldHEN Multi FW` button in `index.html` to `5.05 to 14.02 FW`.
- Styled `TANIN` credit in root `index.html` with `.brand-tanin` in `style.css` (crimson-to-cyan gradient, tracking, underline, and glow) and changed `@GamerHack93` link color to `#ffffff`.
- Synced upstream `GamerHack/GamerHack.github.io` (`upstream/main` @ `6017271`) into `p4jb` via `upstream-main` while preserving all local customizations (`bg-video.js`, `style.css` video layer, `index.html` `histlength` fix, static dev server, tests, and `/docs`):
  - Updated GoldHEN across `505/`, `672/`, `672goldhen/`, `900goldhen/`, `900v3/`, and `g2all/` from `v2.4b18.13` to `v2.4b18.14` (`goldhen_2.4b18.14.bin`).
  - Extended `g2all/` auto-host firmware support through `14.02`, updated `g2all/slopkit/` (`chain_lapse.js` for `11.50`–`11.52`, unified `jb.js` for `12.00`–`14.02`), removed obsolete `chain_poops.js` / `jb2.js`, and added `1202.bin`, `1252.bin`, `1304.bin`, and `1402.bin` patches.
  - Updated `tests/static-server.test.ts` and `/docs` to reference `goldhen_2.4b18.14.bin` and firmware `14.02`.

### Removed
- Removed all `Designed by` and `Special Thanks to:` bottom credit `<h1>` headings across all 21 host, cache, and restore HTML pages (along with the unused `.brand-tanin` rule in `style.css`), leaving zero text at the bottom of pages and bumping all 10 `*.manifest` files to `# bg-video v4`.
- Removed the `For Donations (Only in Cryptocurrencies)` button and `#crypto` view from root `index.html` (adjusting footer `margin-top` to `338px` to preserve vertical layout alignment).

### Fixed
- Removed legacy `img.jpg` background image (`style.css`, `bg-video.js` `poster`, all `*.manifest` files, and `img.jpg` file) and switched `html` fallback background to `#0a0c12` (bumping manifests to `# bg-video v2`) so the old controller image no longer flashes before the background video loads.
- Fixed `Uncaught SyntaxError: missing ) after argument list` in root `index.html` line 8 (`history.go(-histlength);`).

### Added
- Added looping full-viewport background video (`public/assets/aistudio/Tanin1080p_b1930797.webm`) across all host pages via `bg-video.js` and `style.css` (`#p4jb-bg-layer`, `#p4jb-bg-video`, `.p4jb-bg-scrim`), registered in all `*.manifest` offline caches, with HTTP `Range` (`206`) and `video/webm` support in `lib/static-server.ts`.
- Added zero-dependency Node.js static HTTP dev/preview server (`server.ts`, `lib/static-server.ts`, `package.json`, and `tests/static-server.test.ts`) serving all PS4 host files on port `3000` with proper `.js`/`.mjs`, `.manifest`, and `.bin`/`.elf` MIME types.
- Created complete project documentation suite following The Vibe Coding Blueprint:
  - Root `AGENTS.md` with AI coding agent rules and mandatory Git/branching constraints.
  - `docs/PRD.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_FLOWS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/ERROR_HANDLING.md`, `docs/ENVIRONMENT.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`, and `docs/CHANGELOG.md`.
- Configured `upstream-main` branch tracking `upstream/main` (`GamerHack/GamerHack.github.io`) for safe upstream syncs alongside personal `main`.

---

## [Baseline — Upstream Fork]

### Inherited from `GamerHack/GamerHack.github.io`
- Root firmware selector (`index.html`, `style.css`) with crypto donation toggle.
- Multi-firmware auto-detecting GoldHEN host (`g2all/`) supporting PS4 `5.05`, `5.07`, and `7.00`–`14.00` with GoldHEN `v2.4b18.13` and per-family AppCache manifests.
- Dedicated `505/` Host v2.5, `672goldhen/` & `672/` Host v3.0, and `900goldhen/` & `900v3/` Host v3.0 with system utilities, Fan Threshold selector, Linux loaders, Web-Activator, and Game Mods.
- User's Guide restore hosts (`restore/`) for `505`, `672`, `672goldhen`, `900goldhen`, and `900v3`.
