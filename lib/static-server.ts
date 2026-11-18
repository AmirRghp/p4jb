import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.manifest': 'text/cache-manifest; charset=utf-8',
  '.appcache': 'text/cache-manifest; charset=utf-8',
  '.bin': 'application/octet-stream',
  '.elf': 'application/octet-stream',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

export function resolveSafePath(rootDir: string, urlPathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPathname);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) {
    return null;
  }

  const normalizedRoot = path.resolve(rootDir);
  const relative = decoded.replace(/^\/+/, '');
  const resolved = path.resolve(normalizedRoot, relative);

  if (resolved !== normalizedRoot && !resolved.startsWith(normalizedRoot + path.sep)) {
    return null;
  }

  return resolved;
}

export function parseRangeHeader(
  rangeHeader: string | undefined,
  fileSize: number,
): { start: number; end: number } | 'invalid' | null {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return 'invalid';

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return 'invalid';

  if (fileSize === 0) return 'invalid';

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return 'invalid';
    start = Math.max(0, fileSize - suffixLength);
    end = fileSize - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : fileSize - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= fileSize || end < start) {
      return 'invalid';
    }
    end = Math.min(end, fileSize - 1);
  }

  return { start, end };
}

function sendError(res: ServerResponse, statusCode: number, message: string, method?: string): void {
  const body = `${statusCode} ${message}\n`;
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  if (method === 'HEAD') {
    res.end();
  } else {
    res.end(body);
  }
}

export function createStaticHandler(rootDir: string) {
  const normalizedRoot = path.resolve(rootDir);

  return async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      sendError(res, 405, 'Method Not Allowed', method);
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(req.url ?? '/', 'http://localhost');
    } catch {
      sendError(res, 400, 'Bad Request', method);
      return;
    }

    const safePath = resolveSafePath(normalizedRoot, parsedUrl.pathname);
    if (!safePath) {
      sendError(res, 403, 'Forbidden', method);
      return;
    }

    let targetPath = safePath;
    let stat: fs.Stats | null = null;

    try {
      stat = await fs.promises.stat(targetPath);
    } catch {
      if (parsedUrl.pathname.startsWith('/assets/')) {
        const publicFallback = resolveSafePath(normalizedRoot, `/public${parsedUrl.pathname}`);
        if (publicFallback) {
          try {
            stat = await fs.promises.stat(publicFallback);
            targetPath = publicFallback;
          } catch {
            stat = null;
          }
        }
      }
    }

    if (!stat) {
      sendError(res, 404, 'Not Found', method);
      return;
    }

    if (stat.isDirectory()) {
      if (!parsedUrl.pathname.endsWith('/')) {
        const redirectTarget = `${parsedUrl.pathname}/${parsedUrl.search}`;
        res.writeHead(301, { Location: redirectTarget });
        res.end();
        return;
      }

      targetPath = path.join(targetPath, 'index.html');
      try {
        stat = await fs.promises.stat(targetPath);
      } catch {
        sendError(res, 404, 'Not Found', method);
        return;
      }
    }

    if (!stat.isFile()) {
      sendError(res, 404, 'Not Found', method);
      return;
    }

    const mimeType = getMimeType(targetPath);
    const rangeHeader = typeof req.headers.range === 'string' ? req.headers.range : undefined;
    const range = parseRangeHeader(rangeHeader, stat.size);

    if (range === 'invalid') {
      res.writeHead(416, {
        'Content-Range': `bytes */${stat.size}`,
      });
      res.end();
      return;
    }

    if (range) {
      const chunkLength = range.end - range.start + 1;
      res.writeHead(206, {
        'Content-Type': mimeType,
        'Content-Length': chunkLength,
        'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });

      if (method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(targetPath, { start: range.start, end: range.end });
      stream.on('error', () => {
        if (!res.headersSent) {
          sendError(res, 500, 'Internal Server Error', method);
        } else {
          res.destroy();
        }
      });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        sendError(res, 500, 'Internal Server Error', method);
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  };
}
