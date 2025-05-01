import express from 'express';
import { createProxyServer } from 'http-proxy';
import { URL } from 'url';

const app = express();
const proxy = createProxyServer({ changeOrigin: true });

app.use('/proxy', (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query param' });
  }

  try {
    // Validate URL
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Strip the '/proxy?url=' part from the original request
  // so path, query, headers, and body are passed through cleanly
  req.url = targetUrl;

  proxy.web(req, res, {
    target: targetUrl,
    changeOrigin: true,
    ignorePath: true,
    selfHandleResponse: false,
    secure: false, // allow self-signed HTTPS in dev
  });
});

// Inject permissive CORS headers on all responses
proxy.on('proxyRes', (proxyRes, req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
});

// Optional: handle preflight requests
app.options('/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(204).end();
});

const PORT = process.env.PORT || 3420;
app.listen(PORT, () => {
  console.log(`Universal CORS proxy running on http://localhost:${PORT}`);
});
