import serverless from 'serverless-http';
import app from '../server.js';

const handler = serverless(app);

// Keep Vercel from parsing a webhook before serverless-http passes its exact
// bytes to Express's `express.raw()` middleware for signature verification.
export const config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Vercel invokes Node functions with (req, res); serverless-http consumes an
// AWS-style event. This adapter only translates the request/response boundary;
// every existing Express route continues to run unchanged.
export default async function vercelHandler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const rawBody = await readRawBody(req);
  const event = {
    version: '1.0',
    httpMethod: req.method,
    path: url.pathname,
    resource: url.pathname,
    headers: req.headers,
    queryStringParameters: Object.fromEntries(url.searchParams),
    body: rawBody.length ? rawBody.toString('base64') : null,
    isBase64Encoded: true,
    requestContext: { identity: { sourceIp: req.socket?.remoteAddress } }
  };
  const response = await handler(event);

  res.statusCode = response.statusCode || 200;
  for (const [name, value] of Object.entries(response.headers || {})) {
    res.setHeader(name, value);
  }
  res.end(response.isBase64Encoded
    ? Buffer.from(response.body || '', 'base64')
    : response.body || '');
}
