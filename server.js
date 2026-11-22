import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const CLIENT_DIR = path.resolve(__dirname, 'dist/client');

// TanStack Start builds to server.js when targeting Node; index.js when targeting edge/workers.
// Check all potential output filenames.
const candidateServerEntries = [
  path.resolve(__dirname, 'dist/server/server.js'),
  path.resolve(__dirname, 'dist/server/index.js'),
  path.resolve(__dirname, 'dist/server/server.mjs'),
  path.resolve(__dirname, 'dist/server/index.mjs'),
];

const SERVER_ENTRY = candidateServerEntries.find((p) => fs.existsSync(p));

// Verify production build existence
if (!SERVER_ENTRY) {
  console.error(`[Server] Error: No server entry file found in dist/server/`);
  console.error(`[Server] Looked for: ${candidateServerEntries.map((p) => path.basename(p)).join(', ')}`);
  console.error(`[Server] Please run 'npm run build' before starting the server.`);
  process.exit(1);
}

// Standard MIME types for web assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// Dynamically load the compiled TanStack Start server entry
let fetchHandler = null;
try {
  console.log(`[Server] Loading server entry from ${SERVER_ENTRY}...`);
  const mod = await import(SERVER_ENTRY);
  const candidate = mod.default || mod;

  if (typeof candidate?.fetch === 'function') {
    fetchHandler = candidate.fetch.bind(candidate);
  } else if (typeof candidate === 'function') {
    fetchHandler = candidate;
  } else if (typeof mod.fetch === 'function') {
    fetchHandler = mod.fetch.bind(mod);
  } else if (typeof mod.createServerEntry === 'function') {
    const entry = mod.createServerEntry();
    fetchHandler = typeof entry?.fetch === 'function' ? entry.fetch.bind(entry) : entry;
  }
} catch (err) {
  console.error('[Server] Fatal: Failed to load server entry module:', err);
  process.exit(1);
}

if (!fetchHandler) {
  console.error('[Server] Fatal: Could not resolve a fetch handler from', SERVER_ENTRY);
  process.exit(1);
}

function resolveStaticFile(clientDir, urlPath) {
  try {
    const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
    const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
    const candidate = path.join(clientDir, safePath);

    // Prevent directory traversal outside of clientDir
    if (!candidate.startsWith(clientDir)) return null;

    // Direct file match (e.g. /assets/styles-DCtaurYn.css, /favicon.png)
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }

    // Prerendered HTML file match (e.g. /blog -> /blog.html)
    const htmlCandidate = candidate + '.html';
    if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      return htmlCandidate;
    }

    // Directory index match (e.g. / -> /index.html)
    const indexCandidate = path.join(candidate, 'index.html');
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      return indexCandidate;
    }

    return null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Health check endpoint for Render, load balancers, and container orchestrators
    if (pathname === '/healthz' || pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('OK');
      return;
    }

    // Attempt to serve static or pre-rendered asset from dist/client
    if (fs.existsSync(CLIENT_DIR)) {
      const staticFile = resolveStaticFile(CLIENT_DIR, pathname);
      if (staticFile) {
        const stat = fs.statSync(staticFile);
        const ext = path.extname(staticFile).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Cache control: immutable for hashed build assets, shorter for HTML/other assets
        if (pathname.startsWith('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (ext === '.html') {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }

        // ETag validation
        const etag = `"${stat.size}-${stat.mtimeMs}"`;
        res.setHeader('ETag', etag);

        if (req.headers['if-none-match'] === etag) {
          res.statusCode = 304;
          res.end();
          return;
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
        });

        if (req.method === 'HEAD') {
          res.end();
          return;
        }

        const stream = fs.createReadStream(staticFile);
        stream.pipe(res);
        return;
      }
    }

    // SSR & dynamic request routing through TanStack Start's fetch handler
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `${HOST}:${PORT}`;
    const fullUrl = `${protocol}://${host}${rawUrl}`;

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val !== undefined) {
        if (Array.isArray(val)) {
          for (const item of val) headers.append(key, item);
        } else {
          headers.set(key, val);
        }
      }
    }

    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
      duplex: body ? 'half' : undefined,
    });

    const webResponse = await fetchHandler(webRequest);

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, val);
      }
    });

    if (webResponse.body && req.method !== 'HEAD') {
      const reader = webResponse.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    res.end();
  } catch (err) {
    console.error('[Server] Request processing error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    } else {
      res.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Server] Production Node.js server listening on http://${HOST}:${PORT}`);
  console.log(`[Server] Health check endpoint available at http://${HOST}:${PORT}/healthz`);
});

// Graceful shutdown handling
function shutdown(signal) {
  console.log(`[Server] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('[Server] HTTP server closed gracefully. Exiting.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
