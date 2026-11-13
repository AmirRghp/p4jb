# Design System

> **Baseline Notice:** This document reflects the exact visual language currently implemented in `style.css`, `index.html`, and the firmware host pages. Update this file whenever `p4jb` introduces custom themes, colors, fonts, or layout changes.

---

## 1. Design Direction

- **Style:** Dark, high-contrast, TV-centric console utility interface.
- **Mood:** Technical, direct, retro-console dashboard designed for viewing from a couch on a television screen via the PS4 browser.
- **Design Principles:**
  - High contrast white text with dark drop shadows over a full-screen background image (`img.jpg`).
  - Large, uniform rectangular hit targets optimized for DualShock 4 analog-stick cursor navigation.
  - Zero external font or icon network dependencies so the entire UI renders identically offline.
  - Immediate single-line status feedback (`#msgs`) on button hover and exploit progress.

---

## 2. Brand

- **Current Baseline Name:** `PS4 Exploit Host by GamerHack` (to be updated when `p4jb` custom branding is applied).
- **Logo / Imagery:**
  - `img.jpg` — Full-viewport fixed background image shared across root and all sub-hosts (`../img.jpg`).
  - `btc.jpg`, `eth.jpg` — `150px × 150px` QR code images inside `#crypto` on `index.html`.
- **Brand Voice:** Concise, imperative, console-status messaging (e.g., `"Select Your Firmware"`, `"Loading GoldHEN v2.4b18.13... Please Wait"`, `"Cache Installed Successfully ✔"`).

---

## 3. Color Palette

All color tokens below are extracted directly from `style.css` and inline HTML attributes:

| Role | Value | Usage |
| :--- | :--- | :--- |
| **Background Fallback** | `#24272b` | `html { background-color: #24272b; }` when `img.jpg` is absent/loading |
| **Primary Button** | `#003263` | Default `.btn` fill (deep navy blue) |
| **Primary Button Hover** | `#0069d9` | `.btn:hover` fill (bright blue) |
| **Multi-FW Highlight Button** | `#b8860b` | `.btn-multi` fill (dark goldenrod for `GoldHEN Multi FW`) |
| **Multi-FW Hover** | `#daa520` | `.btn-multi:hover` fill (goldenrod) |
| **Online / Donate Button** | `#076300` | `.btn-onln` fill (forest green for online payloads, PS4 Trainer, donations) |
| **Online / Donate Hover** | `#18891b` | `.btn-onln:hover` fill |
| **Toolbox / Special Button** | `#ae2301` | `.btn-toolbox` fill (crimson/rust for `Orbis-Toolbox`) |
| **Toolbox Hover** | `#d42a01` | `.btn-toolbox:hover` fill |
| **Primary Text** | `white` (`#ffffff`) | Default `html` and `h1` text color |
| **Section / Warning Highlight** | `yellow` (`#ffff00`) | Section subheadings (`Select Your Firmware`, `Main Payloads`) and failure messages (`hostFail()`) |
| **Accent / Credit Links** | `#f31414` | Footer credit links (`@GamerHack93`, `@_AlAzif`, etc.) |
| **Status Pass / Fail (6.72)** | `green` / `red` | `Pass =` and `Fail =` counters in `672goldhen/index.html` and `672/index.html`; `Unsupported Firmware` in `g2all/index.html` |
| **Text Shadow** | `black` (`#000000`) | `text-shadow: 0.1em 0.1em 0.2em black` on `h1` |

---

## 4. Typography

- **Font Family:** System/Browser default sans-serif/serif (PS4 WebKit built-in default; no custom `font-family` or webfont declared).
- **Heading Font:** Browser default.
- **Body Font:** Browser default, centered (`text-align: center`).
- **Type Scale (Observed):**
  - **Main Header (`h1`):** `25px`, `color: white`, `text-shadow: 0.1em 0.1em 0.2em black`.
  - **Status / Loading Message (`#msgs`, `#msgs2`):** `30px` (inline style on exploit/cache pages).
  - **Section Subheading (`h1` inside `#menu`, `#mods`, `#lnx`, `#crypto`):** `18px`, `color: yellow` (or `white` for `"Payloads"`).
  - **Button Label (`.btn`):** `20px`, `color: white`.

---

## 5. Spacing

- **Base Unit:** Ad-hoc pixel spacing (recommended `4px` / `8px` scale for future customizations).
- **Observed Margins & Spacing:**
  - Button margins: `margin: 8px 5px;` (`top/bottom: 8px`, `left/right: 5px`), `padding-bottom: 5px`.
  - Footer separation: large top/bottom inline margins (`margin-top: 78px`–`338px`, `margin-bottom: 77px`–`455px`) to push footer credits near the bottom of a `1080p` / `720p` PS4 viewport.
  - **Rule for Future Customizations:** Replace fixed pixel vertical spacers with flexbox/grid or CSS variables if converting to a responsive layout, and document the change here.

---

## 6. Border Radius

- **Buttons (`.btn`):** `4px` (`border-radius: 4px;`).
- **Other Elements:** `0px` (square `<hr>`, `<img>`, `<select>`).

---

## 7. Shadows

- **Headings (`h1`):** `text-shadow: 0.1em 0.1em 0.2em black;` for legibility over `img.jpg`.
- **Buttons / Containers:** `none` (flat surface with `0.4s` background-color hover transition).

---

## 8. Buttons

All buttons share the base `.btn` class in `style.css`:
- **Base Dimensions & Rules (`.btn`):**
  - `width: 227px; height: 46px; padding-bottom: 5px;`
  - `font-size: 20px; text-align: center; color: white;`
  - `border-style: none; border-radius: 4px; cursor: pointer;`
  - `transition-duration: 0.4s;`
  - `background-color: #003263;` (hover: `#0069d9`)
- **Primary / Standard Action (`.btn`):** Firmware hosts, standard offline payloads, `Return`.
- **Multi-FW Highlight (`.btn.btn-multi`):** `#b8860b` → hover `#daa520` (used for `GoldHEN Multi FW`).
- **Online / Support Action (`.btn.btn-onln`):** `#076300` → hover `#18891b` (used for online-only features like `PS4 Trainer Web`, `Games-Mods (Online)`, and `For Donations`; root donations button overrides width to `468px`).
- **Special / Toolbox Action (`.btn.btn-toolbox`):** `#ae2301` → hover `#d42a01` (used for `Orbis-Toolbox`).
- **Disabled / Loading States:** Not styled via CSS `:disabled`; instead, exploit pages hide `#menu` (`display: none`) and show `#progress` (`display: block`) during execution.

---

## 9. Inputs

- **Select Dropdown (`<select id="tempC">`):**
  - Used exclusively on `505/index.html`, `672/index.html`, and `900v3/index.html` beside the `Fan Threshold` button.
  - Populated dynamically via JS with options `50` to `75` in increments of `5` (default `60`, unit label `°C` inline after `<select>`).
  - Uses browser default `<select>` styling.

---

## 10. Containers / Sections

Pages use simple `display: block` / `display: none` section `<div>` containers toggled via JS instead of cards:
- `#progress` (`display: block` initially on exploit pages; hidden once jailbreak succeeds).
- `#menu` (`display: block` on landing/menu pages; `display: none` initially on auto-jailbreak menu pages like `505/index.html` and `900v3/index.html`).
- `#crypto` (`display: none` initially on `index.html`; shown when `For Donations` is clicked).
- `#tools`, `#lnx`, `#mods` (`display: none` initially in `style.css`; toggled for Linux Loaders and Games Mods submenus).

---

## 11. Navigation

- **Header:** Full-width `<h1>` title (often `id="msgs"` on menu pages so hover descriptions appear at the top) followed by `<hr><br>`.
- **Submenus:** In-page view swapping (`display: none` / `display: block`) with a `Return` button at the bottom.
- **Cross-Page Links:** Mix of `<button onclick="location.replace(...)">` (avoids adding entries to browser history on PS4) and `<a href="..."><button>...</button></a>`.
- **Footer:** Inline `<h1>` credits line with `#f31414` links.

---

## 12. States

- **Loading:** `#progress` visible with `#msgs2` (`30px` white text, e.g., `"Loading... Please Wait"`, `"Loading GoldHEN v2.4b18.13... Please Wait"`).
- **Cache Installing:** `#msgs` updates dynamically with `"Installing Offline Cache: <N>%"`.
- **Success:** `#msgs` displays `"Cache Installed Successfully ✔"` (followed by `"Now Close And Re-Open Your Browser ..."`), `"GoldHEN v2.4b18.13 Loaded ..."`, or `"<Payload> Loaded ✔"`.
- **Error:**
  - Cache error: `"Error Installing Cache! - Clear and Re-Open Your Browser ..."`
  - Missing cached script: `"Content not Found! - Clear Browser Data and Re-Install Cache ..."`
  - Exploit failure: `"Failed to Load! Restart Your Console ..."` (inline `color: yellow`)
  - Unsupported FW: `"Unsupported Firmware: <span style='color: red;'>...</span>"`

---

## 13. Icons

- **Icon Library:** None.
- **Usage:** Unicode checkmark `✔` used inline in status strings (`"Cache Installed Successfully ✔"`, `"GoldHEN v2.4b18.13 Loaded ✔"`).

---

## 14. Responsive Design

- **Target Viewports:** PS4 WebKit Browser (typically `1920×1080` or `1280×720` scaled viewport).
- **Current CSS Constraint:** `html { overflow: hidden; }` disables page scrolling across all hosts!
  - **Rule:** When adding buttons or menus in future customizations, verify total content height fits within `720p`/`1080p` viewports OR remove/adjust `overflow: hidden` in custom CSS—otherwise lower buttons and footer credits clip off-screen.
- **Mobile / Desktop:** Not responsive-optimized in baseline; desktop browsers can view pages, but `g2all/index.html` intentionally blocks non-PS4 User Agents.

---

## 15. Accessibility

- **Baseline Status & Rules Going Forward:**
  - Current baseline uses non-standard `<button>` wrapped inside `<a>` in several menus, relies on `onmouseover`/`onmouseout` for payload descriptions, and omits `alt` attributes on QR images (`btc.jpg`, `eth.jpg`).
  - **Rules for Customizations:**
    - Prefer `<a class="btn">` or `<button onclick="...">` rather than nesting `<button>` inside `<a>`.
    - Maintain high color contrast between `#ffffff` / `#ffff00` text and `#24272b` / button backgrounds.
    - Provide `alt` text for any new images and keep visible focus/hover states clear for controller & keyboard navigation.
