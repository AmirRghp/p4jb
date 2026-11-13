# Deployment & Git Release Runbook

> **Baseline Notice:** `p4jb` is deployed as static files (GitHub Pages or local LAN HTTP server) from the `main` branch of `AmirRghp/p4jb`.

---

## 1. Environments

- **Local Development / LAN Testing:**
  - Served locally over HTTP (e.g., `http://localhost:8080` or `http://<LAN-IP>:8080` for PS4 console testing).
- **Production (GitHub Pages):**
  - Repository: `git@github.com:AmirRghp/p4jb.git`
  - Source branch: `main` (root `/` folder)
  - Upstream reference: `https://github.com/GamerHack/GamerHack.github.io.git`

---

## 2. Feature Development & Release Process

Never develop features directly on `upstream-main`, and avoid committing untested changes straight to `main`.

1. **Create a feature branch from `main`:**
   ```bash
   git checkout main
   git checkout -b feat/<short-name>
   ```
   *(Use `fix/...` for bug fixes, `style/...` for UI/CSS changes, `docs/...` for documentation updates.)*
2. **Implement changes** following [AGENTS.md](../AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
3. **Update affected `*.manifest` files** and bump a manifest comment (e.g., `# v1.0.1`) so PS4 AppCache detects changed assets.
4. **Run verification** (see [TESTING.md](TESTING.md)):
   - Static manifest & path checks
   - Local HTTP test + UA simulation
   - PS4 hardware test (for exploit/cache changes)
5. **Merge to `main` and clean up:**
   ```bash
   git checkout main
   git merge feat/<short-name>
   git branch -d feat/<short-name>
   ```
6. **Deploy:**
   ```bash
   git push origin main
   ```
7. **Run smoke tests** on the live GitHub Pages URL (check root page, `g2all/`, and DevTools Network tab for zero 404s).

---

## 3. Syncing Updates from Upstream (`GamerHack/GamerHack.github.io`)

When the upstream repository releases new exploit chains, firmware support, or GoldHEN updates, sync using `merge` (not `rebase`) so personal commit history on `main` is never rewritten and `--force` push is never needed:

1. **Fetch latest upstream commits:**
   ```bash
   git fetch upstream
   ```
2. **Update the clean `upstream-main` tracker branch:**
   ```bash
   git checkout upstream-main
   git merge upstream/main
   ```
3. **Merge `upstream-main` into your personal `main` branch:**
   ```bash
   git checkout main
   git merge upstream-main
   ```
4. **Resolve any merge conflicts:**
   - Keep personal branding/UI customizations while adopting upstream exploit script and binary updates.
   - Verify `*.manifest` files include all newly added upstream payloads/scripts.
5. **Test locally, then push to `origin/main`:**
   ```bash
   git push origin main
   ```

---

## 4. AppCache Invalidation (Cache Busting)

PS4 browsers using HTML5 AppCache **only** re-download cached assets when the byte-content of the `.manifest` file itself changes—editing `index.html` or `style.css` alone is ignored by cached clients until the manifest changes.

- **Rule:** Whenever any cached HTML, CSS, JS, image, or `.bin`/`.elf` file changes, update the corresponding `*.manifest` file (e.g., add or increment a `# version X.Y.Z` comment line) so online consoles automatically refresh their offline cache on next visit.

---

## 5. Rollback

If a deployed customization breaks routing, UI, or caching on `main`:

1. Identify the last good commit on `main` (`git log -n 10 --oneline`).
2. Revert cleanly without rewriting published history:
   ```bash
   git revert <bad-commit-hash>
   git push origin main
   ```
3. Ensure the reverted `.manifest` differs from the broken version (or bump a version comment) so consoles that already cached the broken build pull the rollback cleanly.

---

## 6. Production Checklist

- [ ] Working branch merged into `main` cleanly (`upstream-main` untouched)
- [ ] All `<script>`, `<link>`, `<img>`, and payload paths verified with exact case
- [ ] Affected `*.manifest` files updated and version-bumped for AppCache refresh
- [ ] Zero 404s when served over local HTTP
- [ ] `docs/CHANGELOG.md` and affected `/docs/*.md` files updated
- [ ] Live GitHub Pages deployment verified after `git push origin main`
