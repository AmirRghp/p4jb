import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import type { AddressInfo } from 'node:net';
import { buildEtag, createStaticHandler, getCacheControl, getMimeType, parseRangeHeader, resolveSafePath } from '../lib/static-server.ts';

const ROOT_DIR = path.resolve(process.cwd());

test('getMimeType returns required MIME types for PS4 host assets', () => {
  assert.equal(getMimeType('index.html'), 'text/html; charset=utf-8');
  assert.equal(getMimeType('style.css'), 'text/css; charset=utf-8');
  assert.equal(getMimeType('g2all/700/alert.js'), 'application/javascript; charset=utf-8');
  assert.equal(getMimeType('g2all/700/module.mjs'), 'application/javascript; charset=utf-8');
  assert.equal(getMimeType('g2all/700.manifest'), 'text/cache-manifest; charset=utf-8');
  assert.equal(getMimeType('g2all/goldhen_2.4b18.14.bin'), 'application/octet-stream');
  assert.equal(getMimeType('g2all/700/kpatch/700.elf'), 'application/octet-stream');
  assert.equal(getMimeType('public/assets/aistudio/Tanin1080p_b1930797.webm'), 'video/webm');
  assert.equal(getMimeType('public/assets/aistudio/tanin-bg.mp4'), 'video/mp4');
  assert.equal(getMimeType('public/assets/aistudio/tanin-poster.jpg'), 'image/jpeg');
  assert.equal(getMimeType('IMG.JPG'), 'image/jpeg');
});

test('getCacheControl distinguishes media/binaries from HTML, JS, CSS, and manifests', () => {
  assert.equal(getCacheControl('public/assets/aistudio/Tanin1080p_b1930797.webm'), 'public, max-age=3600');
  assert.equal(getCacheControl('public/assets/aistudio/tanin-bg.mp4'), 'public, max-age=3600');
  assert.equal(getCacheControl('public/assets/aistudio/tanin-poster.jpg'), 'public, max-age=3600');
  assert.equal(getCacheControl('g2all/goldhen_2.4b18.14.bin'), 'public, max-age=3600');
  assert.equal(getCacheControl('index.html'), 'no-cache');
  assert.equal(getCacheControl('bg-video.js'), 'no-cache');
  assert.equal(getCacheControl('style.css'), 'no-cache');
  assert.equal(getCacheControl('505/cache.manifest'), 'no-cache');
});

test('buildEtag produces stable weak ETags from stat size and mtimeMs', () => {
  const etag = buildEtag({ size: 1024, mtimeMs: 1700000000123.9 } as any);
  assert.equal(etag, 'W/"1024-1700000000123"');
});

test('parseRangeHeader handles byte ranges and rejects invalid ranges', () => {
  assert.deepEqual(parseRangeHeader('bytes=0-1023', 2048), { start: 0, end: 1023 });
  assert.deepEqual(parseRangeHeader('bytes=100-', 2048), { start: 100, end: 2047 });
  assert.deepEqual(parseRangeHeader('bytes=-512', 2048), { start: 1536, end: 2047 });
  assert.equal(parseRangeHeader('bytes=5000-6000', 2048), 'invalid');
  assert.equal(parseRangeHeader('items=0-5', 2048), 'invalid');
  assert.equal(parseRangeHeader(undefined, 2048), null);
});

test('resolveSafePath allows valid paths and blocks traversal or malformed URIs', () => {
  assert.equal(resolveSafePath(ROOT_DIR, '/'), ROOT_DIR);
  assert.equal(resolveSafePath(ROOT_DIR, '/g2all/index.html'), path.join(ROOT_DIR, 'g2all', 'index.html'));
  assert.equal(resolveSafePath(ROOT_DIR, '/505/cache.manifest'), path.join(ROOT_DIR, '505', 'cache.manifest'));
  assert.equal(resolveSafePath(ROOT_DIR, '/../etc/passwd'), null);
  assert.equal(resolveSafePath(ROOT_DIR, '/%2e%2e/etc/passwd'), null);
  assert.equal(resolveSafePath(ROOT_DIR, '/%E0%A4%A'), null);
  assert.equal(resolveSafePath(ROOT_DIR, '/index.html\0.txt'), null);
});

async function withServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = http.createServer(createStaticHandler(ROOT_DIR));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      server.closeAllConnections();
    });
  }
}

test('static handler serves root, assets, manifests, binaries, video ranges, ETags/304, directory redirects, and 404/403', async () => {
  await withServer(async (baseUrl) => {
    const rootRes = await fetch(`${baseUrl}/`);
    assert.equal(rootRes.status, 200);
    assert.equal(rootRes.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(rootRes.headers.get('cache-control'), 'no-cache');
    assert.ok(rootRes.headers.get('etag'));
    const rootHtml = await rootRes.text();
    assert.match(rootHtml, /PS4\s+Exploit Host by TANIN/);

    const cssRes = await fetch(`${baseUrl}/style.css`);
    assert.equal(cssRes.status, 200);
    assert.equal(cssRes.headers.get('content-type'), 'text/css; charset=utf-8');
    assert.equal(cssRes.headers.get('cache-control'), 'no-cache');

    const manifestRes = await fetch(`${baseUrl}/g2all/700.manifest`);
    assert.equal(manifestRes.status, 200);
    assert.equal(manifestRes.headers.get('content-type'), 'text/cache-manifest; charset=utf-8');

    const jsRes = await fetch(`${baseUrl}/g2all/700/alert.js`);
    assert.equal(jsRes.status, 200);
    assert.equal(jsRes.headers.get('content-type'), 'application/javascript; charset=utf-8');

    const videoRangeRes = await fetch(`${baseUrl}/public/assets/aistudio/Tanin1080p_b1930797.webm`, {
      headers: { Range: 'bytes=0-1023' },
    });
    assert.equal(videoRangeRes.status, 206);
    assert.equal(videoRangeRes.headers.get('content-type'), 'video/webm');
    assert.equal(videoRangeRes.headers.get('content-length'), '1024');
    assert.equal(videoRangeRes.headers.get('cache-control'), 'public, max-age=3600');

    const mp4RangeRes = await fetch(`${baseUrl}/public/assets/aistudio/tanin-bg.mp4`, {
      headers: { Range: 'bytes=0-1023' },
    });
    assert.equal(mp4RangeRes.status, 206);
    assert.equal(mp4RangeRes.headers.get('content-type'), 'video/mp4');
    assert.equal(mp4RangeRes.headers.get('cache-control'), 'public, max-age=3600');

    const posterRes = await fetch(`${baseUrl}/public/assets/aistudio/tanin-poster.jpg`);
    assert.equal(posterRes.status, 200);
    assert.equal(posterRes.headers.get('content-type'), 'image/jpeg');
    assert.equal(posterRes.headers.get('cache-control'), 'public, max-age=3600');
    const posterEtag = posterRes.headers.get('etag');
    assert.ok(posterEtag);

    const gifRes = await fetch(`${baseUrl}/public/assets/aistudio/tanin-bg.gif`, { method: 'HEAD' });
    assert.equal(gifRes.status, 200);
    assert.equal(gifRes.headers.get('content-type'), 'image/gif');
    assert.equal(gifRes.headers.get('cache-control'), 'public, max-age=3600');

    const conditionalRes = await fetch(`${baseUrl}/public/assets/aistudio/tanin-poster.jpg`, {
      headers: { 'If-None-Match': posterEtag },
    });
    assert.equal(conditionalRes.status, 304);
    assert.equal(conditionalRes.headers.get('etag'), posterEtag);

    const assetFallbackRes = await fetch(`${baseUrl}/assets/aistudio/Tanin1080p_b1930797.webm`, {
      method: 'HEAD',
    });
    assert.equal(assetFallbackRes.status, 200);
    assert.equal(assetFallbackRes.headers.get('content-type'), 'video/webm');
    assert.equal(assetFallbackRes.headers.get('cache-control'), 'public, max-age=3600');

    const binRes = await fetch(`${baseUrl}/g2all/goldhen_2.4b18.14.bin`, { method: 'HEAD' });
    assert.equal(binRes.status, 200);
    assert.equal(binRes.headers.get('content-type'), 'application/octet-stream');
    assert.equal(binRes.headers.get('cache-control'), 'public, max-age=3600');
    assert.ok(Number(binRes.headers.get('content-length')) > 0);

    const dirRedirectRes = await fetch(`${baseUrl}/505`, { redirect: 'manual' });
    assert.equal(dirRedirectRes.status, 301);
    assert.equal(dirRedirectRes.headers.get('location'), '/505/');

    const subHostRes = await fetch(`${baseUrl}/505/`);
    assert.equal(subHostRes.status, 200);
    assert.equal(subHostRes.headers.get('content-type'), 'text/html; charset=utf-8');

    const missingRes = await fetch(`${baseUrl}/does-not-exist-12345`);
    assert.equal(missingRes.status, 404);

    const port = Number(new URL(baseUrl).port);
    const traversalStatus = await new Promise<number>((resolve, reject) => {
      http
        .get({ hostname: '127.0.0.1', port, path: '/%2e%2e/etc/passwd' }, (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        })
        .on('error', reject);
    });
    assert.equal(traversalStatus, 404);

    const malformedStatus = await new Promise<number>((resolve, reject) => {
      http
        .get({ hostname: '127.0.0.1', port, path: '/%E0%A4%A' }, (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        })
        .on('error', reject);
    });
    assert.equal(malformedStatus, 403);
  });
});

test('bg-video.js remains ES5-compatible and supports PS4 hybrid MP4/offline GIF fallback', () => {
  const bgVideo = fs.readFileSync(path.join(ROOT_DIR, 'bg-video.js'), 'utf8');
  new vm.Script(bgVideo);
  const codeWithoutComments = bgVideo.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(codeWithoutComments, /\b(const|let|class|async|await)\b/);
  assert.doesNotMatch(codeWithoutComments, /=>|`|\bpointerdown\b/);
  assert.match(bgVideo, /PlayStation 4/);
  assert.match(bgVideo, /tanin-bg\.gif/);
  assert.match(bgVideo, /navigator\.onLine/);
  assert.match(bgVideo, /'click'/);
  assert.match(bgVideo, /'mousedown'/);
  assert.match(bgVideo, /'touchstart'/);
});

test('all offline manifests list existing local assets and bg-video GIF/poster assets', () => {
  const manifests = [
    '505/cache.manifest',
    '672/cache.manifest',
    '672goldhen/cache.manifest',
    '900goldhen/cache.manifest',
    '900v3/cache.manifest',
    'g2all/505.manifest',
    'g2all/700.manifest',
    'g2all/900.manifest',
    'g2all/css.manifest',
    'g2all/slopkit.manifest',
  ];
  for (const manifestRel of manifests) {
    const manifestPath = path.join(ROOT_DIR, manifestRel);
    const manifestDir = path.dirname(manifestPath);
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.match(content, /\.\.\/bg-video\.js/);
    assert.match(content, /\.\.\/public\/assets\/aistudio\/tanin-bg\.gif/);
    assert.match(content, /\.\.\/public\/assets\/aistudio\/tanin-poster\.jpg/);
    let inNetwork = false;
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line === 'CACHE MANIFEST' || line === 'CACHE:') {
        inNetwork = false;
        continue;
      }
      if (line === 'NETWORK:' || line === 'FALLBACK:') {
        inNetwork = true;
        continue;
      }
      if (inNetwork || line === '*') continue;
      const cleanRel = line.split('?')[0].replace(/\\/g, '/');
      const resolved = path.resolve(manifestDir, cleanRel);
      assert.ok(fs.existsSync(resolved), `Missing manifest asset: ${manifestRel} -> ${line}`);
    }
  }
});
