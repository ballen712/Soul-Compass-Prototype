/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { indexPublicAssets } = require('./public-assets');

const STATIC_ROOT = path.resolve(__dirname, '..', 'static-build');
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'landing-page.html');
const LEGAL_CONTENT_PATH = path.resolve(__dirname, '..', 'constants', 'legal-documents.json');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const publicAssets = indexPublicAssets(STATIC_ROOT);
const legalDocuments = JSON.parse(fs.readFileSync(LEGAL_CONTENT_PATH, 'utf-8'));
const legalRoutes = new Map([
  ['/privacy', 'privacy'],
  ['/terms', 'terms'],
  ['/support', 'support'],
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    return typeof appJson.expo?.name === 'string'
      ? appJson.expo.name
      : 'App Landing Page';
  } catch {
    return 'App Landing Page';
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function serveManifest(platform, res) {
  const manifestPath = platform === 'ios' ? publicAssets.get('/ios/manifest.json')
    : platform === 'android' ? publicAssets.get('/android/manifest.json') : undefined;

  if (!manifestPath) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ error: 'Platform manifest not found.' }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, 'utf-8');
  res.writeHead(200, {
    'content-type': 'application/json',
    'expo-protocol-version': '1',
    'expo-sfv-version': '0',
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto === 'http' ? 'http' : 'https';
  const suppliedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const host = typeof suppliedHost === 'string' && /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(suppliedHost)
    ? suppliedHost : 'localhost';
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `exps://${host}${basePath}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, escapeHtml(baseUrl))
    .replace(/EXPS_URL_ATTRIBUTE_PLACEHOLDER/g, escapeHtml(expsUrl))
    .replace(/EXPS_URL_JSON_PLACEHOLDER/g, toScriptString(expsUrl))
    .replace(/APP_NAME_PLACEHOLDER/g, escapeHtml(appName));

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function renderLegalPage(pageKey) {
  const page = legalDocuments.pages[pageKey];
  const sections = page.sections.map((section) => {
    const paragraphs = (section.paragraphs ?? [])
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');
    const bullets = (section.bullets ?? []).length
      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
      : '';
    return `<section><h2>${escapeHtml(section.title)}</h2>${paragraphs}${bullets}</section>`;
  }).join('');
  const actions = page.actions.map((action) => {
    const route = typeof action.route === 'string' && action.route.startsWith('./')
      ? `/${action.route.slice(2)}`
      : action.route;
    const href = route && legalRoutes.has(route)
      ? route
      : typeof action.href === 'string' && action.href.startsWith('mailto:soulcompass.support@gmail.com')
        ? action.href
        : null;
    return href ? `<a href="${escapeHtml(href)}">${escapeHtml(action.label)}</a>` : '';
  }).filter(Boolean).join('');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${escapeHtml(page.title)} · Soul Compass</title>
    <style>
      :root{color-scheme:dark}*{box-sizing:border-box}
      body{margin:0;background:#080b12;color:#eef1f8;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      main{width:min(100% - 32px,820px);margin:0 auto;padding:28px 0 40px}
      nav,footer{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
      nav{margin-bottom:24px}nav a,footer a{color:#bdc8ec;text-decoration:none}
      .brand{font-size:12px;letter-spacing:.16em;color:#c7b8a2;font-weight:700}
      .draft{border:1px solid #756849;background:#17150f;border-radius:14px;padding:14px 16px;color:#ece0c3;margin:0 0 24px}
      .draft strong{display:block;font-size:12px;letter-spacing:.08em;margin-bottom:4px}
      h1{font-size:clamp(28px,7vw,40px);line-height:1.15;margin:0 0 10px}
      .subtitle{color:#b9bfd0;font-size:17px;margin:0 0 22px}
      .updated{color:#9ca5ba;font-size:13px;margin:-12px 0 22px}
      section{background:#10141e;border:1px solid #242a39;border-radius:18px;margin:12px 0;padding:18px}
      h2{font-size:18px;line-height:1.35;margin:0 0 10px}
      p,ul{margin:8px 0;color:#d0d5e1}ul{padding-left:22px}
      li+li{margin-top:6px}
      .actions{display:grid;gap:9px;margin:20px 0}
      .actions a{display:block;border:1px solid #343c50;border-radius:13px;padding:12px 14px;color:#eef1f8;text-decoration:none;background:#121827}
      footer{border-top:1px solid #242a39;padding-top:16px;color:#9ca5ba;font-size:13px}
    </style>
  </head>
  <body>
    <main>
      <nav><a class="brand" href="/">SOUL COMPASS</a><a href="/">Back to Soul Compass</a></nav>
      <aside class="draft"><strong>WORKING DRAFT — NOT FOR PUBLICATION</strong>This English draft is not legal advice or a final document. Do not rely on it until the listed facts and legal review are complete.</aside>
      <h1>${escapeHtml(page.title)}</h1>
      <p class="subtitle">${escapeHtml(page.subtitle)}</p>
      <p class="updated">Last updated: ${escapeHtml(legalDocuments.updated)}</p>
      ${sections}
      <div class="actions">${actions}</div>
      <footer><a href="mailto:soulcompass.support@gmail.com?subject=Soul%20Compass%20support">Soul Compass Support</a><a href="mailto:soulcompass.support@gmail.com">soulcompass.support@gmail.com</a></footer>
    </main>
  </body>
</html>`;
}

function serveLegalPage(pageKey, res) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'x-robots-tag': 'noindex, nofollow',
  });
  res.end(renderLegalPage(pageKey));
}

function serveStaticFile(urlPath, res) {
  const filePath = publicAssets.get(urlPath);
  if (!filePath) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'content-type': contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const appName = getAppName();

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').includes('..')) {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  if (basePath && (pathname === basePath || pathname.startsWith(basePath + '/'))) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  const normalizedLegalPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const legalPage = legalRoutes.get(normalizedLegalPath);
  if (legalPage) return serveLegalPage(legalPage, res);

  if (pathname === '/' || pathname === '/manifest') {
    const platform = req.headers['expo-platform'];
    if (platform === 'ios' || platform === 'android') {
      return serveManifest(platform, res);
    }

    if (pathname === '/') {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || '3000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`Serving static Expo build on port ${port}`);
});
