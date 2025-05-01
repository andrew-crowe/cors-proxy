import express from 'express';
import { createProxyServer } from 'http-proxy';
import { URL } from 'url';

const app = express();
const proxy = createProxyServer({ changeOrigin: true });

const addCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
};

// Handle preflight CORS requests
app.options('/proxy', (req, res) => {
  addCorsHeaders(res);
  res.sendStatus(204);
});

app.use('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    // Just parsing to ensure it's a valid URL
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Rewrite req.url so the proxy doesn't append `/proxy`
  req.url = targetUrl;

  proxy.web(req, res, {
    target: targetUrl,
    changeOrigin: true,
    ignorePath: true,
    selfHandleResponse: false,
  });
});

// Add CORS headers after proxy response
proxy.on('proxyRes', (proxyRes, req, res) => {
  addCorsHeaders(res);
});

const PORT = process.env.PORT || 3420;
app.listen(PORT, () => {
  console.log(`Universal CORS proxy running on http://localhost:${PORT}`);
});
