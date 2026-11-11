// Local dev server: serves the prototype and proxies ULS (KW Unified Listing Service) calls.
// The client secret and access token stay here, never in the browser.
// Run: node server.js   (reads .env in this folder)
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
loadEnv(path.join(ROOT, '.env'));

const PORT = parseInt(process.env.PORT, 10) || 8907;
// Local runs stay on this machine; a hosted container sets HOST=0.0.0.0.
const HOST = process.env.HOST || '127.0.0.1';
// Optional shared password (HTTP Basic auth) for hosted copies without SSO in front. Username is ignored.
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || '';
const ENV = (process.env.ULS_ENV || 'qa').toLowerCase() === 'prod' ? 'prod' : 'qa';
const API_HOST = ENV === 'prod' ? 'https://partners.api.kw.com' : 'https://qa.partners.api.kw.com';
const TOKEN_URL = API_HOST + '/idp/token';
const ULS_URL = API_HOST + '/uls';
const CLIENT_ID = process.env.ULS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.ULS_CLIENT_SECRET || '';
const SCOPE = process.env.ULS_SCOPE || 'read_all_listings read_syndicated_listings';
const MEDIA = 'application/vnd.kwri.uls.listing-search+json;version=1';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// ---- Token: one per app at a time, so cache it and only refresh near expiry or on 401 ----
let token = null, tokenExp = 0, pending = null;
async function getToken(force) {
  if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_SECRET === 'paste-your-secret-here') throw Object.assign(new Error('ULS credentials missing. Add ULS_CLIENT_ID and ULS_CLIENT_SECRET to .env.'), { status: 503 });
  if (!force && token && Date.now() < tokenExp - 60000) return token;
  if (pending) return pending;
  pending = (async () => {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials', scope: SCOPE }),
    });
    const text = await res.text();
    if (!res.ok) throw Object.assign(new Error('Token request failed (' + res.status + '): ' + text.slice(0, 300)), { status: 502 });
    const data = JSON.parse(text);
    token = data.access_token;
    tokenExp = Date.now() + (data.expires_in || 3600) * 1000;
    return token;
  })();
  try { return await pending; } finally { pending = null; }
}

async function ulsSearch(body) {
  const call = async (t) => fetch(ULS_URL + '/listings/search', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': MEDIA, Accept: MEDIA },
    body: JSON.stringify(body),
  });
  let res = await call(await getToken());
  if (res.status === 401) res = await call(await getToken(true));
  return { status: res.status, text: await res.text() };
}

// ---- Guards: only relay the searches the CMA makes, so the proxy can't be used as a general MLS query tool ----
const FILTERS = new Set(['fullStreetAddress', 'text', 'listingCategory', 'listingStatus', 'closeDate', 'propertySubtypeGranular', 'livingArea', 'bedrooms', 'postalCode']);
function checkSearch(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return 'Body must be an object';
  for (const k of Object.keys(b)) if (!['query', 'sort', 'pagination'].includes(k)) return 'Unsupported field: ' + k;
  const q = b.query || {}, f = q.filters || {}, loc = q.location || {};
  for (const k of Object.keys(q)) if (!['filters', 'location'].includes(k)) return 'Unsupported query field: ' + k;
  for (const k of Object.keys(f)) if (!FILTERS.has(k)) return 'Unsupported filter: ' + k;
  for (const k of Object.keys(loc)) if (k !== 'geoNear') return 'Unsupported location: ' + k;
  if (loc.geoNear && !(loc.geoNear.radiusMi > 0 && loc.geoNear.radiusMi <= 3)) return 'Radius must be 3 miles or less';
  const pg = b.pagination || {};
  if ((pg.max || 0) > 100 || (pg.offset || 0) > 400) return 'Pagination out of range';
  if (!(f.fullStreetAddress || f.text || f.postalCode || loc.geoNear)) return 'Search needs an address, ZIP code, or location';
  return '';
}
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = hits.get(ip) || [];
  const recent = win.filter(t => now - t < 60000);
  recent.push(now); hits.set(ip, recent);
  return recent.length > 240;
}
function authorized(req) {
  if (!ACCESS_PASSWORD) return true;
  const m = /^Basic (.+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const pass = Buffer.from(m[1], 'base64').toString().replace(/^[^:]*:/, '');
  const a = crypto.createHash('sha256').update(pass).digest(), b = crypto.createHash('sha256').update(ACCESS_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

// ---- HTTP ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };
const send = (res, status, body, type) => { res.writeHead(status, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' }); res.end(body); };
const readBody = (req) => new Promise((ok, fail) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); }); req.on('end', () => ok(b)); req.on('error', fail); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') return send(res, 200, 'ok', 'text/plain');
  if (!authorized(req)) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="KWIQ prototype"', 'Content-Type': 'text/plain' }); return res.end('Password required'); }
  try {
    if (url.pathname === '/api/uls/status') {
      await getToken();
      return send(res, 200, JSON.stringify({ ok: true, env: ENV }));
    }
    if (url.pathname === '/api/uls/search' && req.method === 'POST') {
      if (rateLimited(req.socket.remoteAddress || '')) return send(res, 429, JSON.stringify({ error: 'Too many requests' }));
      const body = JSON.parse((await readBody(req)) || '{}');
      const bad = checkSearch(body);
      if (bad) return send(res, 400, JSON.stringify({ error: bad }));
      const r = await ulsSearch(body);
      return send(res, r.status, r.text);
    }
    if (url.pathname.startsWith('/api/')) return send(res, 404, JSON.stringify({ error: 'Not found' }));
    // Static files, confined to this folder; secrets and server code are never served.
    let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    const base = path.basename(file);
    if (!file.startsWith(ROOT + path.sep) || base.startsWith('.') || ['server.js', 'Dockerfile'].includes(base)) return send(res, 404, 'Not found', 'text/plain');
    fs.readFile(file, (err, data) => err ? send(res, 404, 'Not found', 'text/plain') : send(res, 200, data, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'));
  } catch (e) {
    send(res, e.status || 500, JSON.stringify({ error: e.message }));
  }
}).listen(PORT, HOST, () => console.log('KWIQ prototype on http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + (HOST === '0.0.0.0' ? ' (all interfaces)' : '') + '  ·  ULS ' + ENV.toUpperCase()
  + (CLIENT_SECRET && CLIENT_SECRET !== 'paste-your-secret-here' ? '' : '  ·  no credentials yet (sample data only)') + (ACCESS_PASSWORD ? '  ·  password required' : '')));
