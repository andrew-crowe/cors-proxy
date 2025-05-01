import express from 'express';
import httpproxy from 'http-proxy';
import { URL } from 'url';

const createProxyServer = httpproxy.createProxyServer;

const app = express();
const proxy = createProxyServer({
  changeOrigin: true,
  ignorePath: true,
  selfHandleResponse: true, // <== take full control of response
  secure: false,
  preserveHeaderKeyCase: true,
});

const PORT = process.env.PORT || 3420;

const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
};

// Preflight handler
app.options('/proxy', (req, res) => {
  setCORSHeaders(res);
  res.sendStatus(204);
});

app.use('/proxy', (req, res) => {
  const { url: baseUrl, ...extraParams } = req.query;

  if (!baseUrl) return res.status(400).json({ error: 'Missing url param' });

  // Manually reattach extra query params
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.append(key, value);
  }

  req.url = url.toString();

  proxy.web(req, res, {
    target: req.url,
    headers: { ...req.headers, host: undefined },
  });
});

// Full manual response handling with CORS injection
proxy.on('proxyRes', (proxyRes, req, res) => {
  // Copy upstream headers, but strip CORS-related ones
  const headers = proxyRes.headers;
  for (const [key, value] of Object.entries(headers)) {
    if (!/^access-control-/i.test(key)) {
      res.setHeader(key, value);
    }
  }

  // Inject permissive CORS headers
  setCORSHeaders(res);

  res.statusCode = proxyRes.statusCode;
  res.statusMessage = proxyRes.statusMessage;

  proxyRes.pipe(res);
});

app.listen(PORT, () => {
  console.log(`CORS proxy running on http://localhost:${PORT}`);
});