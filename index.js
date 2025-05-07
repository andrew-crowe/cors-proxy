import express from 'express';
import httpproxy from 'http-proxy';

const createProxyServer = httpproxy.createProxyServer;

const app = express();
const proxy = createProxyServer({
  changeOrigin: true,
  ignorePath: true,
  selfHandleResponse: true,
  secure: false,
  preserveHeaderKeyCase: true,
});

const getTargetUrl = (req) => {
  const targetUrl = req.originalUrl.split('?url=').pop();
  if (!targetUrl) return null;

  return targetUrl.toString();
};

app.options('/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.sendStatus(204);
});

app.use('/proxy', (req, res) => {
  const targetUrl = getTargetUrl(req);
  if (!targetUrl) return res.status(400).json({ error: 'Missing or invalid "url" param' });

  req.url = targetUrl;


  proxy.web(req, res, {
    target: targetUrl,
    headers: { ...req.headers, host: undefined },
  });

  console.log(req.headers);
  console.log(req.rawHeaders);
  console.log(req.headers.authorization);
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  res.statusCode = proxyRes.statusCode;
  res.statusMessage = proxyRes.statusMessage;

  for (const [key, value] of Object.entries(proxyRes.headers)) {
    if (!/^access-control-/i.test(key)) {
      res.setHeader(key, value);
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  proxyRes.pipe(res);
});

app.listen(3420, () => console.log('CORS proxy running on port 3420'));
