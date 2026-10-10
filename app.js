/* Sur – सुर
 * Build your own sequence of stutis and aartis, read them page by page,
 * and sing along with English-letter transliteration.
 * Plain JavaScript, no build step. Data is stored locally and synced with Supabase.
 */
(function () {
  'use strict';

  /* ---------- constants & supabase config ---------- */
  const SUPABASE_URL = 'https://qtpliyaonscjmchdoqtt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGxpeWFvbnNjam1jaGRvcXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDM4MzksImV4cCI6MjEwNzIxOTgzOX0.jibwh0r3eRP_FtwA5_EUkq9OT269i9_4gLjTIYF6LG4';
  
  let supabaseClient = null;

  const KEY = 'sur.v1';
  const LANGS = [
    ['hi', 'Hindi', 'हिन्दी'], ['sa', 'Sanskrit', 'संस्कृत'], ['mr', 'Marathi', 'मराठी'],
    ['gu', 'Gujarati', 'ગુજરાતી'], ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'], ['ne', 'Nepali', 'नेपाली'],
    ['bn', 'Bengali', 'বাংলা'], ['as', 'Assamese', 'অসমীয়া'], ['or', 'Odia', 'ଓଡ଼ିଆ'],
    ['raj', 'Rajasthani', 'राजस्थानी'], ['bho', 'Bhojpuri', 'भोजपुरी'], ['mai', 'Maithili', 'मैथिली']
  ];
  const OCR = { hi: 'hin', sa: 'san', mr: 'mar', gu: 'guj', pa: 'pan', ne: 'nep', bn: 'ben', as: 'asm', or: 'ori', raj: 'hin', bho: 'hin', mai: 'hin' };
  const RULES = { raj: 'hi', bho: 'hi', mai: 'hi' };
  const CATEGORIES = [['stuti', 'Stuti'], ['aarti', 'Aarti'], ['chalisa', 'Chalisa'], ['bhajan', 'Bhajan'], ['mantra', 'Mantra'], ['other', 'Other']];
  const DEITIES = ['Ganesh', 'Durga', 'Lakshmi', 'Saraswati', 'Hanuman', 'Shiva', 'Vishnu', 'Krishna', 'Ram', 'Ambe Maa', 'Kali', 'Santoshi Maa'];

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'value') el.value = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat(2)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const btn = (label, onclick, cls) => h('button', { class: 'btn ' + (cls || ''), type: 'button', onclick, text: label });
  const link = (label, href, cls) => h('a', { class: 'btn ' + (cls || ''), href, text: label });

  function toast(msg) {
    const t = h('div', { class: 'toast', text: msg });
    document.body.append(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2400);
  }

  /* ---------- state & auth ---------- */
  let currentUser = null;

  async function initAuth() {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      const { data: { session } } = await supabaseClient.auth.getSession();
      currentUser = session?.user || null;
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        if (location.hash.slice(1) === '/settings') route();
      });
    } catch (e) {
      console.error('Failed to initialize Supabase auth:', e);
    }
  }

  async function loginWithGoogle() {
    if (!supabaseClient) {
      toast('Supabase is still initializing or offline.');
      return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
    if (error) toast('Login error: ' + error.message);
  }

  async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    route();
    toast('Signed out');
  }

  function fresh() {
    const seed = clone(window.SUR_SEED);
    return {
      v: 1, collections: seed.collections, stutis: seed.stutis, path: [], pos: null,
      settings: { view: 'both', size: 24, theme: 'dark', style: 'standard' }
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === 1 && Array.isArray(d.collections) && Array.isArray(d.stutis)) {
          d.settings = Object.assign(fresh().settings, d.settings || {});
          d.path = Array.isArray(d.path) ? d.path : [];
          return d;
        }
      }
    } catch (e) { /* ignore */ }
    return fresh();
  }
  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save – browser storage may be full.'); }
  }
  function cleanPath() {
    S.path = S.path.filter((st) => st.type === 'collection'
      ? S.collections.some((c) => c.id === st.id)
      : S.stutis.some((x) => x.id === st.id));
  }
  cleanPath();

  const colOf = (id) => S.collections.find((c) => c.id === id);
  const stutiOf = (id) => S.stutis.find((x) => x.id === id);
  const stutisIn = (cid) => S.stutis.filter((x) => x.collectionId === cid);
  const langName = (c) => (LANGS.find((l) => l[0] === c) || [c, c])[1];
  function buildQueue() {
    const q = [];
    for (const st of S.path) {
      if (st.type === 'stuti') { const x = stutiOf(st.id); if (x) q.push(x); }
      else q.push(...stutisIn(st.id));
    }
    return q;
  }
  const autoRoman = (text, lang) => window.Translit.transliterate(text, RULES[lang] || lang, S.settings.style);
  const romanOf = (st, pg) => (pg.translit ? pg.translit : autoRoman(pg.text, st.lang));
  function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; }

  /* ---------- router ---------- */
  let cleanups = [];
  function route() {
    cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
    cleanups = [];
    document.body.classList.remove('reading');
    applyTheme();
    const hash = location.hash.slice(1) || '/';
    const [path, qs] = hash.split('?');
    const params = new URLSearchParams(qs || '');
    const app = $('#app');
    app.replaceChildren();
    if (path === '/') viewHome(app);
    else if (path === '/path') viewPath(app, false);
    else if (path === '/library') viewLibrary(app);
    else if (path === '/add') viewEdit(app, null);
    else if (path.startsWith('/edit/')) viewEdit(app, decodeURIComponent(path.slice(6)));
    else if (path === '/read') viewRead(app, params);
    else if (path === '/settings') viewSettings(app);
    else viewHome(app);
    document.querySelectorAll('#nav a').forEach((a) => {
      const r = a.dataset.route;
      a.classList.toggle('on', r === path || (r === '/add' && path.startsWith('/edit')) || (r === '/' && path === '/path'));
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Home ---------- */
  function stepInfo(step) {
    if (step.type === 'collection') {
      const c = colOf(step.id);
      return c ? { name: c.name, sub: `Whole collection · ${stutisIn(c.id).length} stutis` } : null;
    }
    const x = stutiOf(step.id);
    if (!x) return null;
    const c = colOf(x.collectionId);
    return { name: x.title, sub: `${c ? c.name : ''} · ${x.pages.length} page${x.pages.length > 1 ? 's' : ''}` };
  }

  function viewHome(app) {
    if (!S.path.length) return viewPath(app, true);
    const q = buildQueue();
    const pages = q.reduce((a, s) => a + s.pages.length, 0);
    const hasPos = S.pos && q.some((x) => x.id === S.pos.sid);
    app.append(h('div', { class: 'screen' },
      h('div', { class: 'hero' },
        h('div', { class: 'logo', text: 'सुर' }),
        h('p', { class: 'muted', text: 'Your prayers, in your order.' })),
      h('section', { class: 'card' },
        h('h2', { text: 'Your Sur' }),
        h('ol', { class: 'steps' }, S.path.map((st) => {
          const i = stepInfo(st);
          return i ? h('li', null, h('div', { class: 'name' }, h('b', { text: i.name }), h('span', { class: 'muted', text: i.sub }))) : null;
        })),
        h('p', { class: 'muted', text: `${q.length} stutis · ${pages} pages` }),
        h('div', { class: 'row' },
          link('Start', '#/read', 'primary'),
          hasPos ? link('Continue', '#/read?resume=1') : null,
          link('Edit', '#/path', 'ghost')))));
  }

  /* ---------- Path builder ---------- */
  function viewPath(app, welcome) {
    const seqBox = h('section', { class: 'card' });
    const addBox = h('section', { class: 'card' });
    const startRow = h('div', { class: 'row' });

    function renderSeq() {
      seqBox.replaceChildren(h('h2', { text: 'Your sequence' }));
      cleanPath();
      if (!S.path.length) {
        seqBox.append(h('p', { class: 'muted', text: 'Nothing yet. Add collections or single stutis from the list below, in the order you want to read them.' }));
      } else {
        const ol = h('ol', { class: 'steps' });
        S.path.forEach((st, i) => {
          const info = stepInfo(st);
          if (!info) return;
          ol.append(h('li', null,
            h('div', { class: 'name' }, h('b', { text: info.name }), h('span', { class: 'muted', text: info.sub })),
            h('button', { class: 'btn small', type: 'button', 'aria-label': 'Move up', text: '▲', disabled: i === 0, onclick: () => move(i, -1) }),
            h('button', { class: 'btn small', type: 'button', 'aria-label': 'Move down', text: '▼', disabled: i === S.path.length - 1, onclick: () => move(i, 1) }),
            h('button', { class: 'btn small danger', type: 'button', 'aria-label': 'Remove', text: '✕', onclick: () => { S.path.splice(i, 1); save(); redraw(); } })));
        });
        seqBox.append(ol);
      }
      startRow.replaceChildren(
        h('a', { class: 'btn primary', href: S.path.length ? '#/read' : null, 'aria-disabled': S.path.length ? null : 'true', text: 'Start', onclick: (e) => { if (!S.path.length) { e.preventDefault(); toast('Add something first'); } } }),
        S.path.length ? link('Done', '#/', 'ghost') : null);
    }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= S.path.length) return;
      [S.path[i], S.path[j]] = [S.path[j], S.path[i]];
      save(); redraw();
    }
    function addStep(type, id) { S.path.push({ type, id }); save(); redraw(); }
    function renderAdd() {
      addBox.replaceChildren(h('h2', { text: 'Add to your sequence' }),
        h('p', { class: 'muted', text: 'Add a whole collection, or open it to pick single stutis. The same item can be added more than once.' }));
      S.collections.forEach((c) => {
        const items = stutisIn(c.id);
        addBox.append(h('details', null,
          h('summary', null,
            h('span', { class: 't', text: `${c.name} (${items.length})` }),
            h('button', { class: 'btn small', type: 'button', text: '+ Whole collection', disabled: !items.length,
              onclick: (e) => { e.preventDefault(); e.stopPropagation(); addStep('collection', c.id); } })),
          items.length
            ? items.map((x) => h('div', { class: 'item' },
              h('div', { class: 'name' }, h('b', { text: x.title }), h('span', { class: 'muted', text: `${langName(x.lang)} · ${x.pages.length} page${x.pages.length > 1 ? 's' : ''}` })),
              h('button', { class: 'btn small', type: 'button', text: '+ Add', onclick: () => addStep('stuti', x.id) })))
            : h('p', { class: 'muted', text: 'No stutis here yet.' })));
      });
      addBox.append(h('div', { class: 'row', style: 'margin-top:10px' }, link('+ Write a new stuti', '#/add', 'small ghost')));
    }
    function redraw() {
      const open = [...addBox.querySelectorAll('details')].map((d) => d.open);
      renderSeq(); renderAdd();
      addBox.querySelectorAll('details').forEach((d, i) => { d.open = !!open[i]; });
    }

    app.append(h('div', { class: 'screen' },
      welcome ? h('div', { class: 'hero' }, h('div', { class: 'logo', text: 'सुर' })) : null,
      h('h1', { text: welcome ? 'Build your Sur' : 'Edit your Sur' }),
      h('p', { class: 'muted', text: 'Choose what you want to recite and in what order...' }),
      seqBox, startRow, addBox));
    renderSeq(); renderAdd();
  }

  /* ---------- Reader ---------- */
  function viewRead(app, params) {
    const single = params.get('s');
    const queue = single ? [stutiOf(single)].filter(Boolean) : buildQueue();
    if (!queue.length) {
      app.append(h('div', { class: 'screen' }, h('h1', { text: 'Nothing to read yet' }),
        h('p', { class: 'muted', text: 'Build your sequence first.' }), link('Build your Sur', '#/path', 'primary')));
      return;
    }
    document.body.classList.add('reading');
    let qi = 0, pi = 0, done = false, editing = false;
    if (params.get('resume') && S.pos) {
      const i = queue.findIndex((x) => x.id === S.pos.sid);
      if (i >= 0) { qi = i; pi = Math.min(S.pos.page || 0, queue[i].pages.length - 1); }
    }
    const total = queue.reduce((a, s) => a + s.pages.length, 0);

    const titleEl = h('div', { class: 'ttl' });
    const subEl = h('div', { class: 'muted' });
    const fill = h('i');
    const stage = h('main', { class: 'stage' });
    const pageLabel = h('span', { class: 'muted' });
    const prevBtn = h('button', { class: 'btn', type: 'button', text: '◀ Back', onclick: () => prev() });
    const nextBtn = h('button', { class: 'btn primary', type: 'button', text: 'Next ▶', onclick: () => next() });
    const viewSeg = h('div', { class: 'seg' });

    function renderSeg() {
      viewSeg.replaceChildren(...[['orig', 'Original'], ['roman', 'English'], ['both', 'Both']].map(([k, l]) =>
        h('button', { type: 'button', class: S.settings.view === k ? 'on' : '', text: l, onclick: () => { S.settings.view = k; save(); renderSeg(); draw(); } })));
    }
    const setSize = (d) => { S.settings.size = Math.max(14, Math.min(48, S.settings.size + d)); save(); draw(); };

    const topbar = h('div', { class: 'topbar' },
      h('div', { class: 'row between' },
        h('a', { class: 'btn small ghost', href: single ? '#/library' : '#/', text: '✕ Close' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', type: 'button', text: 'A−', onclick: () => setSize(-2) }),
          h('button', { class: 'btn small', type: 'button', text: 'A+', onclick: () => setSize(2) }),
          h('button', { class: 'btn small', type: 'button', text: S.settings.theme === 'dark' ? '☀' : '☾',
            onclick: (e) => { S.settings.theme = S.settings.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); e.currentTarget.textContent = S.settings.theme === 'dark' ? '☀' : '☾'; }
          }))),
      h('div', { style: 'margin-top:8px' }, titleEl, subEl),
      h('div', { class: 'progress' }, fill),
      h('div', { class: 'tools' }, viewSeg,
        h('button', { class: 'btn small', type: 'button', text: 'Edit English', onclick: () => { if (!done) { editing = !editing; draw(); } } })));
    const bottom = h('div', { class: 'bottombar' }, prevBtn, pageLabel, nextBtn);
    app.append(h('div', { class: 'reader' }, topbar, stage, bottom));

    function lines(t) { return String(t).replace(/\s+$/, '').split('\n'); }
    function pageContent(st, pg) {
      const box = h('div', { class: 'text' });
      box.style.fontSize = S.settings.size + 'px';
      const view = S.settings.view;
      const o = lines(pg.text), r = lines(romanOf(st, pg));
      const line = (txt, cls) => (txt.trim() === '' ? h('div', { class: 'gap' }) : h('p', { class: 'ln ' + cls, text: txt }));
      if (view === 'orig') o.forEach((l) => box.append(line(l, 'o')));
      else if (view === 'roman') r.forEach((l) => box.append(line(l, 'o')));
      else if (o.length === r.length) o.forEach((l, i) => { box.append(line(l, 'o')); if (l.trim()) box.append(line(r[i], 'r')); });
      else { o.forEach((l) => box.append(line(l, 'o'))); box.append(h('div', { class: 'gap' })); r.forEach((l) => box.append(line(l, 'r'))); }
      return box;
    }
    function editor(st, pg) {
      const ta = h('textarea', { rows: 10, style: 'font-size:1rem' });
      ta.value = romanOf(st, pg);
      return h('div', null,
        h('p', { class: 'muted', text: 'Fix the English letters for this page.' }), ta,
        h('div', { class: 'row', style: 'margin-top:10px' },
          btn('Save', () => { pg.translit = ta.value.trim() ? ta.value : null; st.updated = Date.now(); save(); editing = false; draw(); toast('Saved'); }, 'primary'),
          btn('Reset to automatic', () => { pg.translit = null; save(); editing = false; draw(); }),
          btn('Cancel', () => { editing = false; draw(); }, 'ghost')));
    }
    function draw() {
      stage.replaceChildren();
      if (done) {
        stage.append(h('div', { class: 'done' }, h('h2', { text: 'Completed ' }),
          h('p', { class: 'muted', text: 'You reached the end.' }),
          h('div', { class: 'row', style: 'justify-content:center' },
            btn('Start again', () => { qi = 0; pi = 0; done = false; draw(); }, 'primary'), link('Home', '#/', 'ghost'))));
        fill.style.width = '100%'; titleEl.textContent = 'Completed'; subEl.textContent = '';
        pageLabel.textContent = ''; nextBtn.disabled = true; prevBtn.disabled = false;
        return;
      }
      const st = queue[qi], pg = st.pages[pi];
      const col = colOf(st.collectionId);
      titleEl.textContent = st.title;
      subEl.textContent = `${col ? col.name + ' · ' : ''}stuti ${qi + 1}/${queue.length}`;
      pageLabel.textContent = `Page ${pi + 1}/${st.pages.length}`;
      const before = queue.slice(0, qi).reduce((a, s) => a + s.pages.length, 0) + pi + 1;
      fill.style.width = (before / total * 100) + '%';
      prevBtn.disabled = qi === 0 && pi === 0;
      nextBtn.disabled = false;
      nextBtn.textContent = (qi === queue.length - 1 && pi === st.pages.length - 1) ? 'Finish ✓' : 'Next ▶';
      stage.append(editing ? editor(st, pg) : pageContent(st, pg));
      S.pos = { sid: st.id, page: pi };
      save();
    }
    function next() {
      if (done) return;
      const st = queue[qi];
      if (pi < st.pages.length - 1) pi++;
      else if (qi < queue.length - 1) { qi++; pi = 0; }
      else done = true;
      editing = false; draw(); window.scrollTo(0, 0);
    }
    function prev() {
      if (done) done = false;
      else if (pi > 0) pi--;
      else if (qi > 0) { qi--; pi = queue[qi].pages.length - 1; }
      editing = false; draw(); window.scrollTo(0, 0);
    }

    const onKey = (e) => {
      if (/^(TEXTAREA|INPUT|SELECT)$/.test((e.target.tagName || ''))) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    cleanups.push(() => document.removeEventListener('keydown', onKey));
    let tx = null, ty = null;
    stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (tx == null || editing) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      tx = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); }
    }, { passive: true });

    let lock = null;
    const getLock = async () => { try { if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); } catch (e) {} };
    const onVis = () => { if (document.visibilityState === 'visible') getLock(); };
    getLock();
    document.addEventListener('visibilitychange', onVis);
    cleanups.push(() => { document.removeEventListener('visibilitychange', onVis); try { lock && lock.release(); } catch (e) {} });

    renderSeg(); draw();
  }

  /* ---------- Library ---------- */
  function viewLibrary(app) {
    const q = h('input', { type: 'search', placeholder: 'Search title, deity or text…' });
    const list = h('div');
    function row(x) {
      return h('div', { class: 'item' },
        h('div', { class: 'name' }, h('b', { text: x.title }),
          h('span', { class: 'muted', text: `${langName(x.lang)} · ${x.pages.length} page${x.pages.length > 1 ? 's' : ''}${x.deity ? ' · ' + x.deity : ''}` })),
        link('Read', '#/read?s=' + encodeURIComponent(x.id), 'small primary'),
        h('button', { class: 'btn small', type: 'button', text: '+ Sur', onclick: () => { S.path.push({ type: 'stuti', id: x.id }); save(); toast('Added to your Sur'); } }),
        link('Edit', '#/edit/' + encodeURIComponent(x.id), 'small ghost'));
    }
    function draw() {
      const term = q.value.trim().toLowerCase();
      list.replaceChildren();
      S.collections.forEach((c) => {
        let items = stutisIn(c.id);
        if (term) items = items.filter((s) => (s.title + ' ' + s.deity + ' ' + s.pages.map((p) => p.text).join(' ')).toLowerCase().includes(term));
        if (term && !items.length) return;
        list.append(h('section', { class: 'card' },
          h('div', { class: 'row between' }, h('h3', { text: c.name }),
            term ? null : h('button', { class: 'btn small', type: 'button', text: '+ Whole collection', disabled: !items.length,
              onclick: () => { S.path.push({ type: 'collection', id: c.id }); save(); toast('Added to your Sur'); } })),
          items.length ? items.map(row) : h('p', { class: 'muted', text: 'No stutis yet.' })));
      });
      if (!list.children.length) list.append(h('p', { class: 'muted', text: 'No matches.' }));
    }
    q.addEventListener('input', draw);
    app.append(h('div', { class: 'screen' },
      h('div', { class: 'row between' }, h('h1', { text: 'Library' }), link('+ Add stuti', '#/add', 'primary')),
      q, list));
    draw();
  }

  /* ---------- Add / edit ---------- */
  let tesseractPromise = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tesseractPromise) {
      tesseractPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = () => resolve(window.Tesseract);
        s.onerror = () => { tesseractPromise = null; reject(new Error('Could not load text-reading engine.')); };
        document.head.append(s);
      });
    }
    return tesseractPromise;
  }
  async function ocr(file, lang, onProgress) {
    const T = await loadTesseract();
    const r = await T.recognize(file, OCR[lang] || 'hin', {
      logger: (m) => { if (m.status === 'recognizing text' && onProgress) onProgress(m.progress); }
    });
    return r.data.text;
  }

  function viewEdit(app, id) {
    const existing = id ? stutiOf(id) : null;
    if (id && !existing) {
      app.append(h('div', { class: 'screen' }, h('h1', { text: 'Not found' }), link('Back to library', '#/library')));
      return;
    }
    const mine = S.collections.find((c) => !c.builtin) || S.collections[0];
    const d = existing ? clone(existing)
      : { title: '', deity: '', category: 'stuti', lang: 'hi', collectionId: mine.id, pages: [{ text: '', translit: null }] };

    const pagesBox = h('div');
    const refreshers = [];

    const titleIn = h('input', { type: 'text', placeholder: 'Name of the stuti', value: d.title, oninput: (e) => { d.title = e.target.value; } });
    const langSel = h('select', { onchange: (e) => { d.lang = e.target.value; refreshers.forEach((f) => f()); } },
      LANGS.map(([c, n, nat]) => h('option', { value: c, selected: c === d.lang, text: `${n} · ${nat}` })));
    const catSel = h('select', { onchange: (e) => { d.category = e.target.value; } },
      CATEGORIES.map(([c, n]) => h('option', { value: c, selected: c === d.category, text: n })));
    const deityIn = h('input', { type: 'text', list: 'deities', placeholder: 'e.g. Durga', value: d.deity, oninput: (e) => { d.deity = e.target.value; } });
    const newColIn = h('input', { type: 'text', placeholder: 'Name of the new collection', style: 'display:none;margin-top:8px' });
    const colSel = h('select', {
      onchange: (e) => { d.collectionId = e.target.value; newColIn.style.display = e.target.value === '__new' ? 'block' : 'none'; }
    }, S.collections.map((c) => h('option', { value: c.id, selected: c.id === d.collectionId, text: c.name })),
      h('option', { value: '__new', text: '+ New collection…' }));

    function renderPages() {
      refreshers.length = 0;
      pagesBox.replaceChildren();
      d.pages.forEach((pg, i) => {
        const ta = h('textarea', { rows: 8, placeholder: 'Type or paste this page…' });
        ta.value = pg.text;
        const prev = h('div', { class: 'preview muted' });
        const romanTa = h('textarea', { rows: 5 });
        const upd = () => {
          const r = pg.text.trim() ? (pg.translit || autoRoman(pg.text, d.lang)) : '';
          prev.textContent = r;
          if (!pg.translit) romanTa.value = r;
        };
        refreshers.push(upd);
        ta.addEventListener('input', () => { pg.text = ta.value; pg.translit = null; upd(); });
        romanTa.addEventListener('input', () => { pg.translit = romanTa.value.trim() ? romanTa.value : null; prev.textContent = romanTa.value; });
        const mv = (dir) => { const j = i + dir; if (j < 0 || j >= d.pages.length) return; [d.pages[i], d.pages[j]] = [d.pages[j], d.pages[i]]; renderPages(); };
        pagesBox.append(h('div', { class: 'page-card' },
          h('div', { class: 'row between' }, h('b', { text: `Page ${i + 1}` }),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', text: '▲', disabled: i === 0, onclick: () => mv(-1) }),
              h('button', { class: 'btn small', type: 'button', text: '▼', disabled: i === d.pages.length - 1, onclick: () => mv(1) }),
              h('button', { class: 'btn small danger', type: 'button', text: 'Remove', disabled: d.pages.length === 1, onclick: () => { d.pages.splice(i, 1); renderPages(); } }))),
          ta, prev,
          h('details', null, h('summary', null, h('span', { class: 't muted', text: 'Edit English letters for this page' })), romanTa)));
        upd();
      });
    }
    function addPages(texts) {
      const clean = texts.map((t) => t.replace(/\s+$/, '')).filter((t) => t.trim());
      if (!clean.length) return;
      if (d.pages.length === 1 && !d.pages[0].text.trim()) d.pages = [];
      clean.forEach((t) => d.pages.push({ text: t, translit: null }));
      renderPages();
    }

    const splitTa = h('textarea', { rows: 6, placeholder: 'Paste the whole stuti here…' });
    const splitMode = h('select', null,
      h('option', { value: 'blank', text: 'Split at blank lines' }),
      h('option', { value: 'n', text: 'Split every N lines' }));
    const splitN = h('input', { type: 'number', min: 2, max: 60, value: 12, style: 'max-width:90px' });
    const splitTool = h('details', null, h('summary', null, h('span', { class: 't', text: 'Paste a long stuti and split it into pages' })),
      splitTa,
      h('div', { class: 'row', style: 'margin-top:8px' }, splitMode, splitN,
        btn('Split into pages', () => {
          const text = splitTa.value.replace(/\r/g, '').trim();
          if (!text) return;
          let parts;
          if (splitMode.value === 'blank') parts = text.split(/\n\s*\n+/);
          else {
            const n = Math.max(2, parseInt(splitN.value, 10) || 12), ls = text.split('\n');
            parts = [];
            for (let i = 0; i < ls.length; i += n) parts.push(ls.slice(i, i + n).join('\n'));
          }
          addPages(parts); splitTa.value = ''; toast(`Added ${parts.length} page(s)`);
        })));

    const photoIn = h('input', { type: 'file', accept: 'image/*', multiple: true });
    const photoStatus = h('p', { class: 'muted' });
    photoIn.addEventListener('change', async () => {
      const files = [...photoIn.files];
      if (!files.length) return;
      for (let k = 0; k < files.length; k++) {
        const label = `Reading photo ${k + 1} of ${files.length}`;
        try {
          photoStatus.textContent = label + '…';
          const text = await ocr(files[k], d.lang, (p) => { photoStatus.textContent = `${label}… ${Math.round(p * 100)}%`; });
          addPages([text.trim()]);
        } catch (e) {
          photoStatus.textContent = 'Could not read the photo: ' + (e && e.message ? e.message : e);
          return;
        }
      }
      photoStatus.textContent = 'Done.';
      photoIn.value = '';
    });
    const photoTool = h('details', null, h('summary', null, h('span', { class: 't', text: 'Add pages from a photo' })), photoIn, photoStatus);

    const saveBtn = btn(existing ? 'Save changes' : 'Save stuti', () => {
      const pages = d.pages.filter((p) => p.text.trim()).map((p) => ({ text: p.text.replace(/\s+$/, ''), translit: p.translit || null }));
      if (!d.title.trim()) return toast('Please add a title');
      if (!pages.length) return toast('Add at least one page');
      let cid = d.collectionId;
      if (cid === '__new') {
        const name = newColIn.value.trim();
        if (!name) return toast('Name the new collection');
        const c = { id: uid(), name, builtin: false };
        S.collections.push(c); cid = c.id;
      }
      const rec = { id: existing ? existing.id : uid(), title: d.title.trim(), deity: (d.deity || '').trim(), category: d.category, lang: d.lang, collectionId: cid, pages, updated: Date.now() };
      if (existing) S.stutis[S.stutis.indexOf(existing)] = rec; else S.stutis.push(rec);
      save(); toast('Saved'); location.hash = '#/library';
    }, 'primary');

    const delBtn = existing ? btn('Delete', () => {
      if (!confirm('Delete this stuti?')) return;
      S.stutis = S.stutis.filter((x) => x.id !== existing.id);
      cleanPath(); save(); toast('Deleted'); location.hash = '#/library';
    }, 'danger ghost') : null;

    app.append(h('div', { class: 'screen' },
      h('h1', { text: existing ? 'Edit stuti' : 'Add a stuti' }),
      h('label', { text: 'Title' }), titleIn,
      h('label', { text: 'Language' }), langSel,
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('label', { text: 'Type' }), catSel),
        h('div', { class: 'grow' }, h('label', { text: 'Deity' }), deityIn)),
      h('datalist', { id: 'deities' }, DEITIES.map((x) => h('option', { value: x }))),
      h('label', { text: 'Collection' }), colSel, newColIn,
      splitTool, photoTool,
      h('hr'), h('h2', { text: 'Pages' }), pagesBox,
      btn('+ Add page', () => { d.pages.push({ text: '', translit: null }); renderPages(); }, 'small'),
      h('div', { class: 'row', style: 'margin-top:20px' }, saveBtn, delBtn)));
    renderPages();
  }

  /* ---------- Settings (with Google Auth) ---------- */
  function viewSettings(app) {
    const themeSel = h('select', {
      onchange: (e) => { S.settings.theme = e.target.value; save(); applyTheme(); }
    }, h('option', { value: 'dark', selected: S.settings.theme === 'dark', text: 'Dark' }),
       h('option', { value: 'light', selected: S.settings.theme === 'light', text: 'Light' }));

    const authCard = h('section', { class: 'card' },
      h('h2', { text: 'Cloud Account' }),
      currentUser 
        ? h('div', null,
            h('p', { class: 'muted', text: `Signed in as: ${currentUser.email}` }),
            btn('Sign Out', logout, 'danger'))
        : h('div', null,
            h('p', { class: 'muted', text: 'Sign in with Google to sync and back up your stutis.' }),
            btn('Sign in with Google', loginWithGoogle, 'primary'))
    );

    app.append(h('div', { class: 'screen' },
      h('h1', { text: 'Settings' }),
      authCard,
      h('section', { class: 'card' },
        h('h2', { text: 'Appearance' }),
        h('label', { text: 'Theme' }), themeSel)));
  }

  // Initialize Auth session on startup and run initial route
  initAuth().then(() => route());
})();
