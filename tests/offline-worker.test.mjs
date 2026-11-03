import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const template = await readFile(new URL('../scripts/offline-worker.js', import.meta.url), 'utf8');
const origin = 'https://viewer.example';
const assets = ['/app.js', '/import-pdf.js', '/pdf.worker.min.mjs', '/pdf-assets/font.pfb'];

function worker() {
  const handlers = new Map(), stores = new Map(), requests = [];
  let offline = false, login = false, failure = '';
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        put: async (path, response) => store.set(path, response.clone()),
        match: async path => store.get(path)?.clone(),
      };
    },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
  };
  class LocalRequest extends Request {
    constructor(path, options) { super(new URL(path, origin), options); }
  }
  async function fetch(request) {
    const url = new URL(typeof request === 'string' ? request : request.url, origin);
    requests.push(url.href);
    if (offline) throw new Error('No network');
    if (login) return new Response('<html>Sign in</html>', { headers: { 'content-type': 'text/html' } });
    if (url.pathname === failure) return new Response('Unavailable', { status: 503 });
    return new Response(url.pathname === '/' ? '<body data-team-sheet-app="true"></body>' : 'asset', {
      headers: { 'content-type': url.pathname === '/' ? 'text/html' : 'application/octet-stream' },
    });
  }
  vm.runInNewContext(template.replace('__OFFLINE_VERSION__', 'test')
    .replace('/* __OFFLINE_ASSETS__ */ []', JSON.stringify(assets)), {
    self: { addEventListener: (type, handler) => handlers.set(type, handler), location: { origin }, clients: { claim: async () => {} } },
    caches, fetch, Request: LocalRequest, URL,
  });
  return {
    stores, requests,
    setOffline() { offline = true; },
    setLogin() { login = true; },
    setFailure(path) { failure = path; },
    async dispatch(type, request) {
      let promise;
      handlers.get(type)({ request, waitUntil: value => { promise = value; }, respondWith: value => { promise = value; } });
      return promise;
    },
  };
}

test('cold offline navigation and PDF importer use the complete saved bundle', async () => {
  const app = worker();
  await app.dispatch('install');
  app.setOffline();
  const before = app.requests.length;
  const page = await app.dispatch('fetch', { url: origin + '/', method: 'GET', mode: 'navigate' });
  assert.match(await page.text(), /data-team-sheet-app/);
  for (const path of assets) {
    const response = await app.dispatch('fetch', { url: origin + path, method: 'GET' });
    assert.equal(await response.text(), 'asset');
  }
  assert.equal(app.requests.length, before, 'offline reads must not contact the server');
  assert.equal(await app.dispatch('fetch', { url: origin + '/api/rk9', method: 'GET' }), undefined);
  assert.equal(await app.dispatch('fetch', { url: 'https://play.pokemonshowdown.com/sprites/gen5/pikachu.png', method: 'GET' }), undefined);
});

test('a hosting login page never becomes the offline viewer', async () => {
  const app = worker();
  app.setLogin();
  await assert.rejects(app.dispatch('install'), /could not be saved/);
  assert.equal(app.stores.size, 0);
});

test('an incomplete download cannot report a successful offline installation', async () => {
  const app = worker();
  app.setFailure('/pdf.worker.min.mjs');
  await assert.rejects(app.dispatch('install'), /Offline asset unavailable/);
  assert.equal(app.stores.size, 0);
});

test('activation removes old application caches and preserves unrelated caches', async () => {
  const app = worker();
  app.stores.set('team-sheet-offline-old', new Map());
  app.stores.set('unrelated', new Map());
  await app.dispatch('install');
  await app.dispatch('activate');
  assert.deepEqual([...app.stores.keys()].sort(), ['team-sheet-offline-test', 'unrelated']);
});
