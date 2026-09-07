/**
 * server.js
 * Zero-dependency local Node.js development server
 * 
 * - Automatically reads .env
 * - Serves static files (HTML, CSS, JS, Assets)
 * - Exposes /api/config endpoint
 * - Serves dynamic /js/env-config.js for client runtime
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const ENV_PATH = path.join(ROOT_DIR, '.env');

function loadEnv() {
    const config = {};
    if (fs.existsSync(ENV_PATH)) {
        const content = fs.readFileSync(ENV_PATH, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
                const key = trimmed.substring(0, eqIdx).trim();
                let val = trimmed.substring(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                config[key] = val;
            }
        }
    }
    return config;
}

const envConfig = loadEnv();
const PORT = parseInt(process.env.PORT || envConfig.PORT || '3000', 10);

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Endpoint: /api/config
    if (pathname === '/api/config') {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            SUPABASE_URL: envConfig.SUPABASE_URL || '',
            SUPABASE_ANON_KEY: envConfig.SUPABASE_ANON_KEY || '',
            APP_USERNAME: envConfig.APP_USERNAME || 'SirviBrothers',
            APP_PASSWORD: envConfig.APP_PASSWORD || 'SB1234'
        }));
        return;
    }

    // Dynamic virtual script: /js/env-config.js
    if (pathname === '/js/env-config.js') {
        const script = `window.__ENV__ = Object.assign(window.__ENV__ || {}, {
    SUPABASE_URL: ${JSON.stringify(envConfig.SUPABASE_URL || '')},
    SUPABASE_ANON_KEY: ${JSON.stringify(envConfig.SUPABASE_ANON_KEY || '')},
    APP_USERNAME: ${JSON.stringify(envConfig.APP_USERNAME || 'SirviBrothers')},
    APP_PASSWORD: ${JSON.stringify(envConfig.APP_PASSWORD || 'SB1234')}
});\n`;
        res.writeHead(200, {
            'Content-Type': 'application/javascript; charset=UTF-8',
            'Cache-Control': 'no-cache'
        });
        res.end(script);
        return;
    }

    // Disallow serving .env or hidden files directly
    if (pathname === '/.env' || pathname.startsWith('/.git')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access denied.');
        return;
    }

    // Map root to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT_DIR, pathname));
    if (!safePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access denied.');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  Sirvi Brothers App Server Started`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  Login URL: http://localhost:${PORT}/login.html`);
    console.log(`========================================`);
});
