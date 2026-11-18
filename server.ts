import http from 'node:http';
import { createStaticHandler } from './lib/static-server.ts';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const rootDir = process.cwd();

const server = http.createServer(createStaticHandler(rootDir));

server.listen(port, host, () => {
  console.log(`p4jb static server listening on http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
