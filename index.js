import express from 'express';
import httpproxy from 'http-proxy';
import { URL } from 'url';

const createProxyServer = httpproxy.createProxyServer;

const app = express();
const proxy = createProxyServer({ changeOrigin: true, selfHandleResponse: true });

const addCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
};

// Preflight support
app.options('/proxy', (req, res) => {
  addCorsHeaders(res);
  res.status(204).end();
});

app.use('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url param' });

  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url param' });
  }

  req.url = targetUrl;

  proxy.web(req, res, {
    target: targetUrl,
    ignorePath: true,
  });
});

// Manually stream the response and inject headers
proxy.on('proxyRes', (proxyRes, req, res) => {
  addCorsHeaders(res);

  res.statusCode = proxyRes.statusCode;
  res.statusMessage = proxyRes.statusMessage;

  for (const [key, value] of Object.entries(proxyRes.headers)) {
    if (!/^access-control-/i.test(key)) {
      res.setHeader(key, value);
    }
  }

  proxyRes.pipe(res);
});

const PORT = process.env.PORT || 3420;
app.listen(PORT, () => {
  console.log(`Universal CORS proxy running on http://localhost:${PORT}`);
});
