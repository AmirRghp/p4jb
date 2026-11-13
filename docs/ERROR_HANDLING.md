# Error Handling

> **Baseline Notice:** This document catalogs how the current `p4jb` baseline detects, reports, and recovers from failures across AppCache, UA routing, script loading, and exploit execution.

---

## 1. Error Categories & System Behavior

Because `p4jb` runs purely client-side in the PS4 WebKit browser (where DevTools console is unavailable to end users), errors are surfaced either directly inside DOM status elements (`#msgs`, `#msgs2`) or via `alert()` dialogs (`g2all/700/alert.js`, `g2all/900/alert.js`).

---

## 2. User-Agent & Firmware Validation Errors

### Non-PS4 Browser (`g2all/index.html`)
- **Trigger:** `navigator.userAgent` does not match `/PlayStation 4[ /]([\d.]+)/i`.
- **UI Message:** `"Only for PS4 with Firmware 5.05 and 7.00 to 14.00"` (rendered into `#msgs` on `DOMContentLoaded`).
- **Recovery:** Open the page from a PlayStation 4 browser, or use a dedicated host / spoof UA for desktop testing.

### Unsupported PS4 Firmware (`g2all/index.html`)
- **Trigger:** PS4 UA detected, `applicationCache.status == '0'`, and `fwNum` does not fall into supported ranges (`5.05`/`5.07`, `7.00–8.52`, `9.00–9.60`, `10.00–11.02`, `11.50–14.00`—for example, `6.72` or unlisted minor versions).
- **UI Message:** `Unsupported Firmware: <span style="color: red;"><fwVersion></span>`.
- **Recovery:** Use dedicated `672/` or `672goldhen/` from root `index.html`, or verify firmware support.

### Strict BCD Target Errors (`g2all/700/config.js`, `g2all/900/config.js`)
- **Trigger:** `set_target(value)` receives non-integer, out-of-range (`< 0` or `>= 0x20000`), or invalid BCD firmware format.
- **Behavior:** Throws `TypeError` or `RangeError`, caught by `alert.js` and surfaced via `alert()`.

---

## 3. Offline AppCache Errors

### Cache Installation Failure (`505/cache.html`, `g2all/cache*.html`)
- **Trigger:** `window.applicationCache.onerror` fires (network interruption, 404 on a manifest entry, or server issue).
- **UI Message:** `"Error Installing Cache! - Clear and Re-Open Your Browser ..."`
- **Known Baseline Pitfall:** `g2all/*.manifest` files currently use backslashes (`\`) in paths (e.g., `700\alert.js`). On Linux/GitHub Pages hosts, this can trigger 404 errors during cache download and fire `onerror`.
- **Note on `672goldhen/index.html`:** `applicationCache.onerror` still sets `localStorage.cached672 = "yes"`, which can mask cache failure on subsequent visits until browser data is cleared.
- **Recovery:** Clear PS4 Browser Website Data/Cookies, verify network connection (and manifest paths if self-hosting), and revisit the host online.

### Missing Cached Script (`g2all/index.html`)
- **Trigger:** `script.onerror` (`onScriptError()`) when dynamically loading `505/exploit.js`, `700/alert.js`, `900/alert.js`, `css/main.js`, or `slopkit/*.js`.
- **UI Message:** `"Content not Found! - Clear Browser Data and Re-Install Cache ..."`
- **Recovery:** Clear browser cache/data and reinstall offline cache while online.

---

## 4. Exploit & Runtime Errors

### Unhandled JS / Module Errors (`g2all/700/alert.js`, `g2all/900/alert.js`)
- **Trigger:** Global `error` or `unhandledrejection` events during PSFree/Lapse execution.
- **Behavior:** Displays `alert()` containing error message, `sourceURL`, `line`, `column`, and `stack` because PS4 browser lacks a user-accessible console.

### Exploit Chain Failure (`g2all/css/main.js`, `g2all/slopkit/jb.js`, `g2all/slopkit/jb2.js`)
- **Trigger:** Exception in `doJb()` or Slopkit exploit chain (`hostFail()`).
- **UI Message:** `"Failed to Load! Restart Your Console ..."` styled in `color: yellow`.
- **Recovery:** Reboot the PS4 console (required after memory corruption / failed kernel state) and retry.

### Pass / Fail Tracking (`672goldhen/index.html`, `672/index.html`)
- **Behavior:** `localStorage.passcount` and `localStorage.failcount` track exploit attempts and display `Pass = X | Fail = Y` in the page header.

### Already Jailbroken Guard (`g2all/css/main.js`)
- **Trigger:** `fn.setuid.invoke(0) !== -1` indicates kernel patches / GoldHEN are already active.
- **UI Message:** `"GoldHEN is Already Loaded ..."` and skips re-running the kernel exploit (prevents double-exploit panic).

---

## 5. Payload Fetch & Network Failures

### Binary Payload Fetch (`XMLHttpRequest` / `fetch`)
- **Baseline Gap:** Legacy XHR loaders (`505/index.html`, `900goldhen/index.html`, `restore/*/index.html`) check `req.readyState == 4` without explicitly checking `req.status === 200` (if `req.response` is empty/HTML 404, executing it could crash the browser).
- **Rule for Future Customizations:** Always validate `req.status === 200 && req.response && req.response.byteLength > 0` before copying payload bytes into executable memory, and surface a clear `#msgs` error on failure.

### Online-Only Links While Offline
- **Affected Actions:** `PS4 Trainer Web` (`http://ps4trainer.com/Trainer/index.html`) and online Game Mods.
- **Expected Behavior:** Browser displays standard offline connection error; offline core payloads remain unaffected.

---

## 6. Retry & Recovery Guidance Matrix

| Symptom | Cause | User Recovery |
| :--- | :--- | :--- |
| `"Error Installing Cache!"` | Network drop or 404 in `.manifest` | Clear PS4 browser data, check internet, retry |
| `"Content not Found!"` | Partial/stale AppCache | Clear PS4 browser data & re-cache online |
| `"Failed to Load! Restart Your Console ..."` | Kernel/WebKit race failure | Fully restart PS4 and retry |
| Browser "There is not enough free system memory" | WebKit heap spray failure | Dismiss/refresh page or restart PS4 |
| Old UI persists after deploying update | PS4 AppCache didn't detect manifest change | Bump `.manifest` content (e.g., version comment) or clear PS4 browser data |
