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
    let stat: fs.Stats;

    try {
      stat = await fs.promises.stat(targetPath);
    } catch {
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

    res.writeHead(200, {
      'Content-Type': getMimeType(targetPath),
      'Content-Length': stat.size,
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
