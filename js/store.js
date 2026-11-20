/* Local persistence: every application lives in localStorage on this device only. */
(function () {
  const KEY = 'udyog.applications.v1';

  function readAll() {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { return {}; }
    const map = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return map;
    for (const k of Object.keys(raw)) {
      const a = cleanApp(raw[k], ID_RE.test(k) ? k : null);
      if (a) map[a.id] = a;
    }
    return map;
  }
  function writeAll(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
      return true;
    } catch (e) {
      window.dispatchEvent(new CustomEvent('store:error', { detail: e }));
      return false;
    }
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- sanitizing ----------
  // Everything read from storage or a backup file is untrusted (it can be edited from the
  // console or crafted by hand), so it is normalized before the app uses it.
  const KEY_RE = /^(?!__proto__$|constructor$|prototype$)[a-z_][a-z0-9_]{0,39}$/;
  const ID_RE = /^[a-z0-9]{6,24}$/;
  const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  const MAX_TEXT = 4000, MAX_PHOTO = 400 * 1024, MAX_KEYS = 300;
  const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g; // control + bidi-override chars

  function cleanData(d) {
    const out = {};
    if (!d || typeof d !== 'object' || Array.isArray(d)) return out;
    let n = 0;
    for (const k of Object.keys(d)) {
      if (n >= MAX_KEYS || !KEY_RE.test(k)) continue;
      const v = d[k];
      if (k === 'photo') { if (typeof v === 'string' && v.length <= MAX_PHOTO && PHOTO_RE.test(v)) out.photo = v; }
      else if (typeof v === 'boolean') out[k] = v;
      else if (typeof v === 'string') out[k] = v.replace(CTRL_RE, '').slice(0, MAX_TEXT);
      else if (typeof v === 'number' && Number.isFinite(v)) out[k] = String(v);
      else continue;
      n++;
    }
    return out;
  }
  function cleanApp(a, idFallback) {
    if (!a || typeof a !== 'object') return null;
    const id = typeof a.id === 'string' && ID_RE.test(a.id) ? a.id : idFallback;
    if (!id) return null;
    const ts = (t) => (Number.isFinite(t) && t > 0 && t < 8.64e15 ? t : Date.now());
    return { id, createdAt: ts(a.createdAt), updatedAt: ts(a.updatedAt), step: Math.min(Math.max(parseInt(a.step, 10) || 0, 0), 5), data: cleanData(a.data) };
  }

  window.Store = {
    list() {
      return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    get(id) {
      return (id && readAll()[id]) || null;
    },
    save(app) {
      const map = readAll();
      app.updatedAt = Date.now();
      const clean = cleanApp(app);
      if (!clean) return null;
      map[clean.id] = clean;
      return writeAll(map) ? app : null;
    },
    create(data) {
      const now = Date.now();
      return this.save({ id: uid(), createdAt: now, updatedAt: now, step: 0, data: data || {} });
    },
    remove(id) {
      const map = readAll();
      delete map[id];
      writeAll(map);
    },
    duplicate(id) {
      const src = this.get(id);
      if (!src) return null;
      return this.create(JSON.parse(JSON.stringify(src.data)));
    },
    exportJSON() {
      return JSON.stringify({ app: 'udyog', version: 1, exportedAt: new Date().toISOString(), applications: this.list() }, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.applications;
      if (!Array.isArray(list)) throw new Error('invalid file');
      if (text.length > 20 * 1024 * 1024) throw new Error('file too large');
      const map = readAll();
      let n = 0;
      for (const a of list.slice(0, 500)) {
        if (!a || typeof a.data !== 'object') continue;
        const clean = cleanApp({ ...a, id: typeof a.id === 'string' && ID_RE.test(a.id) && !map[a.id] ? a.id : uid() });
        if (!clean) continue;
        map[clean.id] = clean;
        n++;
      }
      writeAll(map);
      return n;
    },
    cleanData,
    KEY,
  };
  Object.freeze(window.Store);
})();

