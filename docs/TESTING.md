# Testing Strategy

> **Baseline Notice:** `p4jb` has no automated test runner or package manager in its current baseline. This document defines practical static, browser-simulation, and hardware verification steps so changes are validated rather than assumed to work.

---

## 1. Testing Goals

Critical functionality that must be verified before merging changes to `main`:
- Root navigation (`index.html`) and all sub-host links resolve without 404s.
- `g2all/index.html` routes every supported PS4 User-Agent firmware string (`5.05`–`14.00`) and non-PS4 User-Agent correctly.
- Every `*.manifest` file lists valid, case-exact paths to existing local files (and flags backslash/missing-file bugs).
- UI layout (`style.css`, `#menu`, `#progress`, `#mods`, `#lnx`, `#crypto`) fits within `720p`/`1080p` PS4 viewports without clipped buttons under `overflow: hidden`.
- Offline caching and payload loading succeed on target PS4 hardware when exploit/cache files are touched.

---

## 2. Test Types

### Static Validation (Automated via PowerShell / CLI)
Verify:
- All local `<script src>`, `<link href>`, `<img src>`, and `location.replace(...)` targets exist on disk with exact filename casing.
- Every entry in every `*.manifest` file (excluding `CACHE MANIFEST`, `CACHE:`, `NETWORK:`, `*`, and comments) resolves to an existing file on disk.
- Check for Windows backslashes (`\`) inside `*.manifest` files (which break Linux/GitHub Pages AppCache).
- No unintended edits to `.bin`/`.elf` binary payloads (`git status` / `git diff --stat`).

### Browser & UA Simulation Testing (Desktop Chrome / Edge DevTools)
Verify:
- Serve the repo over local HTTP (do **not** test via `file://`, because ES Modules and XHR/`fetch` fail under `file://` CORS rules).
- Spoof `navigator.userAgent` in DevTools (Network Conditions / User-Agent override) to test `g2all/index.html` routing for:
  - Desktop UA → `"Only for PS4 with Firmware 5.05 and 7.00 to 14.00"`
  - `Mozilla/5.0 (PlayStation 4 5.05) AppleWebKit/601.2 (KHTML, like Gecko)`
  - `Mozilla/5.0 (PlayStation 4 9.00) AppleWebKit/605.1.15 (KHTML, like Gecko)`
  - `Mozilla/5.0 (PlayStation 4 11.00) AppleWebKit/605.1.15 (KHTML, like Gecko)`
  - `Mozilla/5.0 (PlayStation 4 12.50) AppleWebKit/605.1.15 (KHTML, like Gecko)`
  - `Mozilla/5.0 (PlayStation 4 14.00) AppleWebKit/605.1.15 (KHTML, like Gecko)`
  - Unsupported FW e.g., `6.72` on `g2all/` → `"Unsupported Firmware: 6.72"`
- Verify Network tab shows `200 OK` (no `404`) for routed scripts and CSS.

### Hardware-in-the-Loop Testing (Real PS4 Console)
Verify on target PS4 hardware over LAN HTTP server or deployed GitHub Pages:
- Clear browser cookies/website data before testing cache changes.
- Visit host online → verify `Installing Offline Cache: 0%..100%` → `"Cache Installed Successfully ✔"`.
- Close browser, disconnect internet, reopen browser → verify offline exploit runs and loads GoldHEN / selected payload.

---

## 3. Testing Tools

- **Local HTTP Server:** Python (`python -m http.server 8080`) or Node `http-server` / VS Code Live Server (for desktop & LAN PS4 testing).
- **Static Checks:** PowerShell file/manifest verification commands.
- **Browser Simulation:** Chromium/Firefox DevTools with custom User-Agent strings & `1280×720` / `1920×1080` viewport emulation.
- **Hardware:** Actual PlayStation 4 console on target firmware.

---

## 4. Test File Structure

No test directory exists in the baseline. If automated validation scripts are added in the future, place them under `scripts/` or `tests/` (and exclude them from all `*.manifest` files so consoles never cache test tooling):

```text
tests/            # Optional future validation scripts (not deployed to AppCache)
└── verify-manifests.ps1
```

---

## 5. Critical User Flows

- **Flow: Root Menu Navigation**
  1. Open `/index.html` over HTTP.
  2. Hover each button and verify `#msgs` updates and resets on mouseout.
  3. Toggle `For Donations` and click `Return`.
  - **Expected Result:** All links resolve (`200 OK`) and `#menu` / `#crypto` toggle cleanly.

- **Flow: `g2all` UA Dispatch**
  1. Open `/g2all/index.html` with spoofed PS4 UAs (`5.05`, `7.55`, `9.00`, `11.00`, `12.00`, `12.50`, `13.50`, `14.00`, and `6.72`).
  - **Expected Result:** Each valid firmware redirects to its expected `cache*.html` (when uncached) or requests its expected exploit script; `6.72` shows `Unsupported Firmware`.

- **Flow: Manifest Integrity**
  1. Parse every `*.manifest` in `505/`, `672/`, `672goldhen/`, `900goldhen/`, `900v3/`, and `g2all/`.
  - **Expected Result:** Every listed file exists on disk (note: normalize `\` to `/` before evaluating paths on Linux/GitHub Pages).

---

## 6. Coverage Priorities

Prioritize verification in this order:
1. AppCache `*.manifest` accuracy (missing files break offline usage completely).
2. `g2all/index.html` firmware range routing.
3. UI layout visibility at `1280×720` and `1920×1080` (`overflow: hidden` clipping check).
4. Payload XHR/fetch paths and filenames.

---

## 7. Commands

### Start Local Test Server
```powershell
python -m http.server 8080
```
Then open `http://localhost:8080/` (or `http://<LAN-IP>:8080/` from PS4).

### Verify All Manifest Entries Exist on Disk (PowerShell)
```powershell
Get-ChildItem -Recurse -Filter "*.manifest" | ForEach-Object {
    $dir = $_.DirectoryName
    Get-Content $_.FullName | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^(CACHE MANIFEST|CACHE:|NETWORK:|#|\*)' ) {
            $clean = ($line -split '\?')[0] -replace '\\','/'
            $target = Join-Path $dir $clean
            if (-not (Test-Path $target)) {
                Write-Warning "MISSING: $($_.FullName) -> $line"
            }
        }
    }
}
```

### Check for Backslashes in Manifests
```powershell
Select-String -Path (Get-ChildItem -Recurse -Filter "*.manifest").FullName -Pattern '\\'
```

### Review Changes Before Merge
```powershell
git status
git diff --stat
```

---

## 8. Definition of Done

- All modified HTML/CSS/JS pages load cleanly over `http://localhost` with zero unexpected 404s.
- All `*.manifest` files have been checked for missing entries and path separators.
- `g2all` UA routing verified if `g2all/index.html` was modified.
- `git diff` confirms no unintended edits to unrelated firmware folders or `.bin`/`.elf` binaries.
- Hardware test performed on PS4 whenever exploit chains, manifests, or payload loaders change.
