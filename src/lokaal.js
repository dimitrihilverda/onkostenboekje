// Stand-in for the claude.ai runtime when the boekje runs on its own (a file or a website).
// It offers the small part of the `db` and `downloads` API that app.html uses, and keeps
// every document in this browser's localStorage, one key per document.
(() => {
  'use strict';
  if (window.claude) return;
  const PREFIX = 'okb:';
  const cache = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const [col, id] = key.slice(PREFIX.length).split('/');
      try { (cache[col] = cache[col] || {})[id] = JSON.parse(localStorage.getItem(key)); } catch {}
    }
  } catch {}

  const listeners = new Set();
  const dirty = new Set();
  let timer = null;
  const meta = { fromCache: false, hasPendingWrites: false };
  const snap = (id, body) => { const data = body ? JSON.parse(JSON.stringify(body)) : undefined; return { id, exists: !!body, data: () => data, metadata: meta }; };
  function notify(col) {
    dirty.add(col);
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      const cols = [...dirty];
      dirty.clear();
      for (const l of listeners) if (cols.includes(l.col)) l.fire();
    }, 30);
  }
  const nieuwId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function write(col, id, body) {
    const key = PREFIX + col + '/' + id;
    try {
      if (body === undefined) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(body));
    } catch (e) {
      throw { code: 'quota_exceeded', message: 'De opslag van deze browser is vol.' };
    }
    if (body === undefined) { if (cache[col]) delete cache[col][id]; }
    else (cache[col] = cache[col] || {})[id] = JSON.parse(JSON.stringify(body));
    notify(col);
  }
  function listen(col, fire) {
    const l = { col, fire };
    listeners.add(l);
    setTimeout(fire, 0);
    return () => listeners.delete(l);
  }
  function docRef(col, id) {
    return {
      id, path: col + '/' + id,
      async get() { return snap(id, (cache[col] || {})[id]); },
      async set(body) { write(col, id, body); },
      async update(body) { write(col, id, { ...((cache[col] || {})[id] || {}), ...body }); },
      async delete() { write(col, id, undefined); },
      onSnapshot(next) { return listen(col, () => next(snap(id, (cache[col] || {})[id]))); },
    };
  }
  function colRef(col) {
    return {
      path: col,
      doc(id) { return docRef(col, id || nieuwId()); },
      async add(body) { const r = docRef(col, nieuwId()); await r.set(body); return r; },
      onSnapshot(next) {
        return listen(col, () => {
          const docs = Object.keys(cache[col] || {}).sort().map(id => snap(id, cache[col][id]));
          next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: meta });
        });
      },
    };
  }
  const db = Object.freeze({
    collection: path => colRef(path),
    doc: path => { const i = path.lastIndexOf('/'); return docRef(path.slice(0, i), path.slice(i + 1)); },
  });

  // Another tab or window of the same boekje changed something.
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith(PREFIX)) return;
    const [col, id] = e.key.slice(PREFIX.length).split('/');
    if (e.newValue === null) { if (cache[col]) delete cache[col][id]; }
    else { try { (cache[col] = cache[col] || {})[id] = JSON.parse(e.newValue); } catch {} }
    notify(col);
  });

  const TYPES = { csv: 'text/csv', json: 'application/json', txt: 'text/plain' };
  const downloads = Object.freeze({
    async save({ filename, data }) {
      const ext = String(filename).split('.').pop().toLowerCase();
      const blob = data instanceof Blob ? data : new Blob([data], { type: (TYPES[ext] || 'application/octet-stream') + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return { status: 'saved' };
    },
  });

  window.claude = Object.freeze({
    lokaal: true,
    use: async name => name === 'db' ? db : name === 'downloads' ? downloads : null,
  });

  // Ask the browser not to clear this storage, and work offline when served from a website.
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
