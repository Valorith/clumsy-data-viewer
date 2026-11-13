const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const zlib = require('node:zlib');
const express = require('express');
const compression = require('compression');

// Exercise the same middleware and defaults as server.js, on loopback only.
// No production endpoint or database is used by these bounded regressions.
async function fixture(t, configure = () => {}) {
  const app = express();
  app.use(compression());
  app.use(express.json());
  configure(app);
  app.post('/echo', (req, res) => res.json(req.body));
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/large', (req, res) => res.json({ text: 'hello '.repeat(500) }));
  app.use((err, req, res, next) => res.status(err.status || 500).json({ type: err.type }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  await once(server, 'listening');
  return server;
}

function request(server, options = {}, body) {
  return new Promise((resolve, reject) => {
    const client = http.request({
      hostname: '127.0.0.1', port: server.address().port, agent: false,
      path: '/health', ...options
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({
        status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks)
      }));
    });
    client.on('error', reject);
    client.setTimeout(2000, () => client.destroy(new Error('Request timed out')));
    client.end(body);
  });
}

test('Express resolves the patched body-parser and compression versions', () => {
  const fromExpress = createRequire(require.resolve('express'));
  const [major, minor] = fromExpress('body-parser/package.json').version.split('.').map(Number);
  assert.equal(major, 2);
  assert.ok(minor >= 4, 'CVE-2026-111181 requires body-parser >= 2.4.0');
  const [compressionMajor, compressionMinor, compressionPatch] = require('compression/package.json').version.split('.').map(Number);
  assert.equal(compressionMajor, 1);
  assert.ok(compressionMinor > 8 || (compressionMinor === 8 && compressionPatch >= 2),
    'CVE-2026-87776 requires compression >= 1.8.2');
});

test('JSON parsing preserves plain and compressed request behavior', { timeout: 5000 }, async t => {
  const server = await fixture(t);
  const payload = Buffer.from(JSON.stringify({ name: 'Épée', count: 0, enabled: false }));
  for (const [encoding, encode] of [
    ['identity', value => value], ['gzip', zlib.gzipSync],
    ['deflate', zlib.deflateSync], ['br', zlib.brotliCompressSync]
  ]) {
    const response = await request(server, {
      method: 'POST', path: '/echo',
      headers: { 'Content-Type': 'application/json', 'Content-Encoding': encoding }
    }, encode(payload));
    assert.equal(response.status, 200, encoding);
    assert.deepEqual(JSON.parse(response.body), JSON.parse(payload), encoding);
  }
});

test('JSON rejects invalid, unsupported and over-limit bodies', { timeout: 5000 }, async t => {
  const server = await fixture(t);
  for (const [body, extraHeaders, status, type] of [
    ['{', {}, 400, 'entity.parse.failed'],
    ['true', {}, 400, 'entity.parse.failed'],
    ['{}', { 'Content-Encoding': 'unknown' }, 415, 'encoding.unsupported'],
    [JSON.stringify({ text: 'x'.repeat(102400) }), {}, 413, 'entity.too.large'],
    [zlib.gzipSync(JSON.stringify({ text: 'x'.repeat(102400) })), { 'Content-Encoding': 'gzip' }, 413, 'entity.too.large']
  ]) {
    const response = await request(server, {
      method: 'POST', path: '/echo', headers: { 'Content-Type': 'application/json', ...extraHeaders }
    }, body);
    assert.equal(response.status, status);
    assert.equal(JSON.parse(response.body).type, type);
  }
  assert.equal((await request(server)).status, 200);
});

test('JSON detaches a completed decoder and drains late request bytes', { timeout: 5000 }, async t => {
  // CVE-2026-111181: one tiny deflate frame finishes before the HTTP body does.
  const first = Buffer.concat([zlib.deflateSync('{"ok":true}'), Buffer.from([0])]);
  const trailing = Buffer.alloc(32);
  const descriptor = Object.getOwnPropertyDescriptor(zlib, 'createInflate');
  let decoder;
  let decoderDestroyedAfterParsing;
  Object.defineProperty(zlib, 'createInflate', { ...descriptor, value: (...args) => {
    decoder = descriptor.value(...args);
    return decoder;
  } });
  t.after(() => Object.defineProperty(zlib, 'createInflate', descriptor));
  let client;
  const server = await fixture(t, app => app.post('/trailing', (req, res) => {
    decoderDestroyedAfterParsing = decoder?.destroyed;
    req.once('end', () => res.json(req.body));
    client.end(trailing);
  }));
  t.after(() => client?.destroy());
  const response = await new Promise((resolve, reject) => {
    client = http.request({
      hostname: '127.0.0.1', port: server.address().port, agent: false,
      method: 'POST', path: '/trailing', headers: {
        'Content-Type': 'application/json', 'Content-Encoding': 'deflate',
        'Content-Length': first.length + trailing.length
      }
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    client.on('error', reject);
    client.setTimeout(2000, () => client.destroy(new Error('Trailing body was not drained')));
    client.write(first);
  });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  assert.equal(decoderDestroyedAfterParsing, true, 'The decoder must be destroyed before late bytes arrive');
  assert.equal((await request(server)).status, 200);
});

test('response compression preserves encoding negotiation and content', { timeout: 5000 }, async t => {
  const server = await fixture(t);
  for (const [encoding, decode] of [
    ['gzip', zlib.gunzipSync], ['deflate', zlib.inflateSync], ['br', zlib.brotliDecompressSync]
  ]) {
    const response = await request(server, { path: '/large', headers: { 'Accept-Encoding': encoding } });
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-encoding'], encoding);
    assert.match(response.headers.vary, /Accept-Encoding/);
    assert.deepEqual(JSON.parse(decode(response.body)), { text: 'hello '.repeat(500) });
  }
  const plain = await request(server, { path: '/large', headers: { 'Accept-Encoding': 'identity' } });
  assert.equal(plain.headers['content-encoding'], undefined);
  assert.deepEqual(JSON.parse(plain.body), { text: 'hello '.repeat(500) });
});

for (const [encoding, factory] of [
  ['gzip', 'createGzip'], ['deflate', 'createDeflate'], ['br', 'createBrotliCompress']
]) {
  test(`compression releases ${encoding} stream after a client disconnect`, { timeout: 5000 }, async t => {
    // CVE-2026-87776: inspect cleanup after one bounded, aborted local response.
    const descriptor = Object.getOwnPropertyDescriptor(zlib, factory);
    let stream;
    Object.defineProperty(zlib, factory, { ...descriptor, value: (...args) => {
      stream = descriptor.value(...args);
      return stream;
    } });
    t.after(() => Object.defineProperty(zlib, factory, descriptor));
    let closed;
    const responseClosed = new Promise(resolve => { closed = resolve; });
    const server = await fixture(t, app => app.get('/stream', (req, res) => {
      res.once('close', closed);
      res.type('text/plain');
      res.write('hello '.repeat(500));
      res.flush();
    }));
    const client = http.get({
      hostname: '127.0.0.1', port: server.address().port, agent: false,
      path: '/stream', headers: { 'Accept-Encoding': encoding }
    }, res => res.once('data', () => res.destroy()));
    t.after(() => client.destroy());
    // An abort is expected here. The bounded test timeout catches absent cleanup.
    client.on('error', () => {});
    await responseClosed;
    assert.ok(stream, 'The response must actually create a compression stream');
    assert.equal(stream.destroyed, true, 'The native compression stream must be released');
    if (!stream.closed) await once(stream, 'close');
    assert.equal(stream.closed, true, 'Compression stream cleanup must finish');
  });
}
