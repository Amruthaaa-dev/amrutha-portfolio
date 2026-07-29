/* ============================================================================
   Minimal static server for local testing.
   ----------------------------------------------------------------------------
   The contact form cannot work when the page is opened as a file:// document —
   browsers block cross-origin requests from file URLs, and FormSubmit rejects
   them outright. Run this to serve the site over http:// instead:

       node serve.js

   then open http://localhost:5500

   Nothing to install — this uses only Node's built-in modules.
   Not needed in production: GitHub Pages / Netlify already serve over https.
   ========================================================================== */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.woff2':'font/woff2',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8'
};

http.createServer((req, res) => {
  // Strip the query string, then resolve against the project root
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';

  const filePath = path.join(ROOT, path.normalize(rel));

  // Refuse anything that escapes the project directory
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>' + rel + ' not found</p>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Portfolio running at  http://localhost:' + PORT);
  console.log('Contact form will work from here. Ctrl+C to stop.');
});
