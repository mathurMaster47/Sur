/* Sur – सुर
 * Public & Private Cloud Edition with Share Links and Author Names.
 */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzltbjBQxM-1_xLg30P1TNgKJPLf135MkUmLhl6WlUfWod1wQIJXCYry1iCM-xFX6Pr/exec';

  const KEY = 'sur.v1';
  const LANGS = [
    ['hi', 'Hindi', 'हिन्दी'], ['sa', 'Sanskrit', 'संस्कृत'], ['mr', 'Marathi', 'मराठी'],
    ['gu', 'Gujarati', 'ગુજરાતી'], ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'], ['ne', 'Nepali', 'नेपाली'],
    ['bn', 'Bengali', 'বাংলা'], ['as', 'Assamese', 'असमीया'], ['or', 'Odia', 'ଓଡ଼ିଆ'],
    ['raj', 'Rajasthani', 'राजस्थानी'], ['bho', 'Bhojpuri', 'भोजपुरी'], ['mai', 'Maithili', 'मैथिली']
  ];
  const OCR = { hi: 'hin', sa: 'san', mr: 'mar', gu: 'guj', pa: 'pan', ne: 'nep', bn: 'ben', as: 'asm', or: 'ori', raj: 'hin', bho: 'hin', mai: 'hin' };
  const RULES = { raj: 'hi', bho: 'hi', mai: 'hi' };
  const CATEGORIES = [['stuti', 'Stuti'], ['aarti', 'Aarti'], ['chalisa', 'Chalisa'], ['bhajan', 'Bhajan'], ['mantra', 'Mantra'], ['other', 'Other']];
  const categoryName = (category) => (CATEGORIES.find(([id]) => id === category) || [category, category])[1];
  const ADMIN_PASSPHRASE = 'pspspspsps';

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ensureArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

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

  /* ---------- state ---------- */
  function fresh() {
    const seed = clone(window.SUR_SEED || { collections: [], stutis: [] });
    return {
      v: 1, collections: seed.collections, stutis: seed.stutis, customStutis: [], deletedSeedIds: [], path: [], pos: null,
      settings: { view: 'both', size: 24, theme: 'dark', style: 'standard' }
    };
  }

  let S = loadLocal();

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        d.settings = Object.assign(fresh().settings, d.settings || {});
        // Remove old authorName from settings for backwards compatibility
        if (d.settings.authorName) delete d.settings.authorName;
        d.customStutis = Array.isArray(d.customStutis) ? d.customStutis : [];
        d.deletedSeedIds = Array.isArray(d.deletedSeedIds) ? d.deletedSeedIds : [];

        // Filter out deleted seed stutis
        if (d.deletedSeedIds.length > 0) {
          d.stutis = d.stutis.filter(s => !d.deletedSeedIds.includes(s.id));
        }
        return d;
      }
    } catch (e) {}
    return fresh();
  }

  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) {}
  }
  
  async function saveLocalWithBackup() {
    saveLocal();
    // Backup to Google Sheets in background (don't wait)
    backupToGoogle().catch(e => console.error('Auto-backup failed:', e));
  }

  /* ---------- Google Sheets backup ---------- */
  async function backupToGoogle() {
    try {
      const backupData = {
        id: 'user-backup-' + (localStorage.getItem('sur-backup-id') || Date.now()),
        user_data: JSON.stringify({
          customStutis: S.customStutis,
          deletedSeedIds: S.deletedSeedIds,
          settings: S.settings,
          path: S.path,
          backupDate: new Date().toISOString()
        }),
        is_backup: true
      };
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });
      
      localStorage.setItem('sur-backup-id', backupData.id);
      console.log('Backup sent to Google Sheets (no-cors mode)');
      return true;
    } catch (e) {
      console.error('Backup error:', e);
      return false;
    }
  }
  
  async function restoreFromGoogle() {
    try {
      const backupId = localStorage.getItem('sur-backup-id');
      if (!backupId) {
        toast('No backup found');
        return false;
      }
      
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        toast('Could not fetch backup');
        return false;
      }
      
      const backup = data.find(row => row.id === backupId);
      if (!backup) {
        toast('Backup not found in Google Sheets');
        return false;
      }
      
      const userData = JSON.parse(backup.user_data);
      S.customStutis = userData.customStutis || [];
      S.deletedSeedIds = userData.deletedSeedIds || [];
      S.settings = userData.settings || S.settings;
      S.path = userData.path || [];
      
      saveLocal();
      toast('Restored from Google Sheets!');
      return true;
    } catch (e) {
      console.error('Restore error:', e);
      toast('Restore failed: ' + e.message);
      return false;
    }
  }

  /* ---------- cloud & share handling ---------- */
  async function fetchCloudStutis() {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) return;
      
      const cloudStutis = data.filter(row => !row.is_backup && !S.deletedSeedIds.includes(row.id)).map(row => ({
        id: row.id,
        title: row.title,
        deity: row.deity || '',
        category: row.category || 'stuti',
        lang: row.language || 'hi',
        authorName: row.author_name || 'Anonymous',
        collectionId: 'cloud-collection',
        pages: typeof row.pages === 'string' ? JSON.parse(row.pages) : row.pages,
        isPublic: true
      }));

      if (!S.collections.some(c => c.id === 'cloud-collection')) {
        S.collections.push({ id: 'cloud-collection', name: 'Cloud Community Library', builtin: false });
      }

      // Merge all stutis: seed + custom + cloud
      // Custom stutis take precedence over cloud stutis with same ID
      const map = new Map();
      (window.SUR_SEED?.stutis || []).forEach(s => map.set(s.id, s));
      S.customStutis.forEach(s => map.set(s.id, s));
      cloudStutis.forEach(s => {
        // Keep local edits authoritative; otherwise later cloud rows replace older copies.
        if (!S.customStutis.some((custom) => custom.id === s.id)) {
          map.set(s.id, s);
        }
      });

      S.stutis = Array.from(map.values());
      cleanPath();
      route();
    } catch(e) {
      console.error('Fetch cloud error:', e);
    }
  }

  function initCloud() {
    try {
      fetchCloudStutis();
      checkImportLink();
    } catch (e) {
      console.error('Cloud connection error:', e);
    }
  }

  async function saveToCloud(rec) {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.id,
          title: rec.title,
          deity: rec.deity,
          category: rec.category,
          language: rec.lang,
          author_name: rec.authorName || 'Anonymous',
          pages: rec.pages
        })
      });
      console.log('Sent to Google Sheets (no-cors mode)');
      return true;
    } catch (e) {
      console.error('Save to cloud failed:', e);
      toast('Cloud save failed - saving locally instead');
      return false;
    }
  }

  function checkImportLink() {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      console.log('Share data found:', sharedData.substring(0, 100) + '...');
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedData))));
        console.log('Decoded data:', decoded);
        if (decoded && decoded.title && decoded.pages) {
          // Import as private local copy
          const imported = clone(decoded);
          imported.id = uid(); // Generate new ID
          imported.isPrivate = true;
          imported.collectionId = S.collections.find((c) => !c.builtin)?.id || S.collections[0].id;
          
          S.customStutis.push(imported);
          S.stutis.push(imported);
          saveLocalWithBackup();
          toast(`Imported "${decoded.title}" into your library!`);
          
          // Clear the share parameter from URL
          window.history.replaceState({}, document.title, window.location.pathname + '#/library');
          route();
        } else {
          console.error('Invalid decoded data:', decoded);
          toast('Invalid stuti data in link');
        }
      } catch (e) {
        console.error('Import error:', e);
        toast('Could not import from share link: ' + e.message);
      }
    }
  }

  function generateShareLink(stuti) {
    // Export as JSON data in URL (simple and reliable)
    const exportData = {
      title: stuti.title,
      deity: stuti.deity,
      category: stuti.category,
      lang: stuti.lang,
      authorName: stuti.authorName,
      pages: stuti.pages
    };
    const jsonStr = JSON.stringify(exportData);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    console.log('Generated share link for:', stuti.title);
    return `${window.location.origin}${window.location.pathname}?share=${encoded}#/library`;
  }
  
  function cleanPath() {
    S.path = S.path.filter((st) => st.type === 'collection'
      ? S.collections.some((c) => c.id === st.id)
      : S.stutis.some((x) => x.id === st.id));
  }

  const colOf = (id) => S.collections.find((c) => c.id === id);
  const stutiOf = (id) => S.stutis.find((x) => x.id === id);
  const stutisIn = (cid) => S.stutis.filter((x) => ensureArray(x.collectionId).includes(cid));
  const collectionsOf = (stuti) => ensureArray(stuti.collectionId).map(colOf).filter(Boolean);
  const editableCollections = () => S.collections.filter((c) => c.id !== 'cloud-collection');
  const langName = (c) => (LANGS.find((l) => l[0] === c) || [c, c])[1];
  function buildQueue() {
    const q = [];
    for (const st of S.path) {
      if (st.type === 'stuti') { const x = stutiOf(st.id); if (x) q.push(x); }
      else q.push(...stutisIn(st.id));
    }
    return q;
  }
  const autoRoman = (text, lang) => window.Translit ? window.Translit.transliterate(text, RULES[lang] || lang, S.settings.style) : text;
  const romanOf = (st, pg) => (pg.translit ? pg.translit : autoRoman(pg.text, st.lang));
  function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; }

  /* ---------- router ---------- */
  let cleanups = [];
  let sudoMode = false;
  function route() {
    cleanups.forEach((f) => { try { f(); } catch (e) {} });
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
    else if (path === '/select') viewSelect(app);
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
    const names = collectionsOf(x).map((c) => c.name).join(', ');
    return { name: x.title, sub: `${names ? names + ' · ' : ''}${x.pages.length} page${x.pages.length > 1 ? 's' : ''}` };
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
          link('Edit', '#/path', 'ghost'))),
      h('section', { class: 'card' },
        h('h2', { text: 'Quick Read' }),
        h('p', { class: 'muted', text: 'Choose a single stuti to read right now.' }),
        link('Select what to read', '#/select', 'primary'))));
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
        seqBox.append(h('p', { class: 'muted', text: 'Nothing yet. Add items below.' }));
      } else {
        const ol = h('ol', { class: 'steps' });
        S.path.forEach((st, i) => {
          const info = stepInfo(st);
          if (!info) return;
          ol.append(h('li', null,
            h('div', { class: 'name' }, h('b', { text: info.name }), h('span', { class: 'muted', text: info.sub })),
            h('button', { class: 'btn small', type: 'button', text: '▲', disabled: i === 0, onclick: () => move(i, -1) }),
            h('button', { class: 'btn small', type: 'button', text: '▼', disabled: i === S.path.length - 1, onclick: () => move(i, 1) }),
            h('button', { class: 'btn small danger', type: 'button', text: '✕', onclick: () => { S.path.splice(i, 1); saveLocal(); redraw(); } })));
        });
        seqBox.append(ol);
      }
      startRow.replaceChildren(
        h('a', { class: 'btn primary', href: S.path.length ? '#/read' : null, text: 'Start', onclick: (e) => { if (!S.path.length) { e.preventDefault(); toast('Add something first'); } } }),
        S.path.length ? link('Done', '#/', 'ghost') : null);
    }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= S.path.length) return;
      [S.path[i], S.path[j]] = [S.path[j], S.path[i]];
      saveLocal(); redraw();
    }
    function addStep(type, id) { S.path.push({ type, id }); saveLocal(); redraw(); }
    function renderAdd() {
      addBox.replaceChildren(h('h2', { text: 'Add to your sequence' }),
        h('p', { class: 'muted', text: 'Pick from whole collections or single stutis.' }));
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
      seqBox, startRow, addBox));
    renderSeq(); renderAdd();
  }

  /* ---------- Reader ---------- */
  function viewRead(app, params) {
    const single = params.get('s');
    const queue = single ? [stutiOf(single)].filter(Boolean) : buildQueue();
    if (!queue.length) {
      app.append(h('div', { class: 'screen' }, h('h1', { text: 'Nothing to read yet' }), link('Build your Sur', '#/path', 'primary')));
      return;
    }
    document.body.classList.add('reading');
    let qi = 0, pi = 0, done = false;
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
        h('button', { type: 'button', class: S.settings.view === k ? 'on' : '', text: l, onclick: () => { S.settings.view = k; saveLocal(); renderSeg(); draw(); } })));
    }
    const setSize = (d) => { S.settings.size = Math.max(14, Math.min(48, S.settings.size + d)); saveLocal(); draw(); };

    const topbar = h('div', { class: 'topbar' },
      h('div', { class: 'row between' },
        h('a', { class: 'btn small ghost', href: single ? '#/library' : '#/', text: '✕ Close' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', type: 'button', text: 'A−', onclick: () => setSize(-2) }),
          h('button', { class: 'btn small', type: 'button', text: 'A+', onclick: () => setSize(2) }),
          h('button', { class: 'btn small', type: 'button', text: S.settings.theme === 'dark' ? '☀' : '☾',
            onclick: (e) => { S.settings.theme = S.settings.theme === 'dark' ? 'light' : 'dark'; saveLocal(); applyTheme(); e.currentTarget.textContent = S.settings.theme === 'dark' ? '☀' : '☾'; }
          }))),
      h('div', { style: 'margin-top:8px' }, titleEl, subEl),
      h('div', { class: 'progress' }, fill),
      h('div', { class: 'tools' }, viewSeg));
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

    function draw() {
      stage.replaceChildren();
      if (done) {
        stage.append(h('div', { class: 'done' }, h('h2', { text: 'Completed ' }),
          h('div', { class: 'row', style: 'justify-content:center' },
            btn('Start again', () => { qi = 0; pi = 0; done = false; draw(); }, 'primary'),
            link('Choose another', '#/select', 'ghost'),
            link('Home', '#/', 'ghost'))));
        fill.style.width = '100%'; titleEl.textContent = 'Completed'; subEl.textContent = '';
        pageLabel.textContent = ''; nextBtn.disabled = true; prevBtn.disabled = false;
        return;
      }
      const st = queue[qi], pg = st.pages[pi];
      const collections = collectionsOf(st);
      titleEl.textContent = st.title;
      subEl.textContent = `${collections.length ? collections.map((c) => c.name).join(', ') + ' · ' : ''}stuti ${qi + 1}/${queue.length}`;
      pageLabel.textContent = `Page ${pi + 1}/${st.pages.length}`;
      const before = queue.slice(0, qi).reduce((a, s) => a + s.pages.length, 0) + pi + 1;
      fill.style.width = (before / total * 100) + '%';
      prevBtn.disabled = qi === 0 && pi === 0;
      nextBtn.disabled = false;
      nextBtn.textContent = (qi === queue.length - 1 && pi === st.pages.length - 1) ? 'Finish ✓' : 'Next ▶';
      stage.append(pageContent(st, pg));
    }
    function next() {
      if (done) return;
      const st = queue[qi];
      if (pi < st.pages.length - 1) pi++;
      else if (qi < queue.length - 1) { qi++; pi = 0; }
      else done = true;
      draw(); window.scrollTo(0, 0);
    }
    function prev() {
      if (done) done = false;
      else if (pi > 0) pi--;
      else if (qi > 0) { qi--; pi = queue[qi].pages.length - 1; }
      draw(); window.scrollTo(0, 0);
    }

    renderSeg(); draw();
  }

  /* ---------- Select what to read ---------- */
  function viewSelect(app) {
    const list = h('div');
    
    function draw() {
      list.replaceChildren();
      S.stutis.forEach(s => {
        const shareUrl = generateShareLink(s);
        const buttons = [
          link('Read', '#/read?s=' + encodeURIComponent(s.id), 'small primary')
        ];
        
        if (!s.isPrivate) {
          buttons.push(h('button', { class: 'btn small', type: 'button', text: ' Share Link', onclick: () => {
            if (confirm(`Share link:\n${shareUrl}\n\nCopy to clipboard?`)) {
              navigator.clipboard.writeText(shareUrl);
              toast('Share link copied to clipboard!');
            }
          }}));
        }
        
        list.append(h('div', { class: 'item' },
          h('div', { class: 'name' },
            h('b', { text: s.title }),
            h('span', { class: 'muted', text: `${langName(s.lang)} · ${s.pages.length} page${s.pages.length > 1 ? 's' : ''}` })),
          ...buttons));
      });
    }
    
    app.append(h('div', { class: 'screen' },
      h('div', { class: 'hero' },
        h('div', { class: 'logo', text: 'सुर' }),
        h('p', { class: 'muted', text: 'What would you like to read today?' })),
      list));
    draw();
  }

  /* ---------- Library ---------- */
  function viewLibrary(app) {
    const q = h('input', { type: 'search', placeholder: 'Search title, deity or text…' });
    const categoryFilter = h('select', {},
      h('option', { value: '', text: 'All categories' }),
      CATEGORIES.map(([id, name]) => h('option', { value: id, text: name })));
    const list = h('div');
    
    // Create new collection dialog
    function showCreateCollectionDialog() {
      const nameInput = h('input', { type: 'text', placeholder: 'Collection name (e.g., Diwali Stuti)' });
      const dialog = h('div', { class: 'dialog', style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000' },
        h('div', { class: 'card', style: 'padding:20px;max-width:400px;width:90%' },
          h('h2', { text: 'Create New Collection' }),
          nameInput,
          h('div', { class: 'row', style: 'margin-top:20px' },
            btn('Cancel', () => dialog.remove(), 'ghost'),
            btn('Create', () => {
              const name = nameInput.value.trim();
              if (!name) return toast('Please enter a collection name');
              if (S.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
                return toast('A collection with that name already exists');
              }
              S.collections.push({ id: 'c-' + uid(), name, builtin: false });
              saveLocal();
              toast('Collection created: ' + name);
              dialog.remove();
              draw();
            }, 'primary')
          )
        )
      );
      document.body.append(dialog);
      setTimeout(() => nameInput.focus(), 100);
    }

    function row(x) {
      const shareUrl = generateShareLink(x);
      const authorText = (x.authorName && x.authorName !== 'Local User' && !x.isPrivate) ? 'By ' + x.authorName + ' · ' : '';
      const isFromCloud = ensureArray(x.collectionId).includes('cloud-collection');
      const isCustom = S.customStutis.some(s => s.id === x.id);
      
      const buttons = [
        link('Read', '#/read?s=' + encodeURIComponent(x.id), 'small primary'),
        !x.isPrivate ? h('button', { class: 'btn small', type: 'button', text: ' Share Link', onclick: () => {
          if (confirm(`Share link:\n${shareUrl}\n\nCopy to clipboard?`)) {
            navigator.clipboard.writeText(shareUrl);
            toast('Share link copied to clipboard!');
          }
        }}) : null
      ];

      if (sudoMode || isCustom) {
        buttons.push(link('Edit', '#/edit/' + encodeURIComponent(x.id), 'small'));
      }
      
      if (!isFromCloud || sudoMode) {
        buttons.push(h('button', { class: 'btn small danger', type: 'button', text: 'Delete', onclick: () => {
          const confirmation = isFromCloud
            ? 'Hide this cloud stuti from this device? This will not delete its row from Google Sheets.'
            : 'Delete this stuti? This cannot be undone.';
          if (confirm(confirmation)) {
            if (isCustom) {
              S.customStutis = S.customStutis.filter(s => s.id !== x.id);
            }
            
            if (!isCustom || isFromCloud || !x.isPrivate) {
              if (!S.deletedSeedIds.includes(x.id)) {
                S.deletedSeedIds.push(x.id);
              }
            }
            
            S.stutis = S.stutis.filter(s => s.id !== x.id);
            S.path = S.path.filter(st => st.id !== x.id);
            saveLocal();
            toast(isFromCloud ? 'Cloud stuti hidden on this device' : 'Stuti deleted');
            draw();
          }
        }}));
      }
      
      return h('div', { class: 'item' },
        h('div', { class: 'name' },
          h('b', { text: x.title }),
          h('span', { class: 'muted', text: `${categoryName(x.category || 'stuti')} · ${langName(x.lang)} · ${authorText}${x.pages.length} page${x.pages.length > 1 ? 's' : ''}` })),
        ...buttons.filter(Boolean));
    }
    function draw() {
      const term = q.value.trim().toLowerCase();
      const category = categoryFilter.value;
      list.replaceChildren();
      editableCollections().concat(S.collections.filter((c) => c.id === 'cloud-collection')).forEach((c) => {
        let items = stutisIn(c.id);
        if (category) items = items.filter((s) => (s.category || 'stuti') === category);
        if (term) items = items.filter((s) => (s.title + ' ' + s.deity + ' ' + categoryName(s.category || 'stuti') + ' ' + s.pages.map((p) => p.text).join(' ')).toLowerCase().includes(term));
        if ((term || category) && !items.length) return;
        list.append(h('section', { class: 'card' },
          h('div', { class: 'row between' }, h('h3', { text: c.name }),
            (term || category) ? null : h('button', { class: 'btn small', type: 'button', text: '+ Whole collection', disabled: !items.length,
              onclick: () => { S.path.push({ type: 'collection', id: c.id }); saveLocal(); toast('Added to your Sur'); } })),
          items.length ? items.map(row) : h('p', { class: 'muted', text: 'No stutis yet.' })));
      });
      if (!list.children.length) list.append(h('p', { class: 'muted', text: term || category ? 'No matches.' : 'No collections yet.' }));
    }
    q.addEventListener('input', draw);
    categoryFilter.addEventListener('change', draw);
    app.append(h('div', { class: 'screen' },
      h('div', { class: 'row between' }, h('h1', { text: 'Library' }), 
        h('div', { class: 'row' },
          btn('+ Collection', showCreateCollectionDialog, 'small ghost'),
          btn('Restore from Google', () => restoreFromGoogle(), 'small ghost'),
          link('+ Add stuti', '#/add', 'primary'))),
      q, categoryFilter, list));
    draw();
  }

  /* ---------- Add / edit ---------- */
  function viewEdit(app, id) {
    const existing = id ? stutiOf(id) : null;
    if (id && !existing) {
      toast('Stuti not found');
      location.hash = '#/library';
      return;
    }
    const isAdminEditing = !!existing && sudoMode;
    const isCloudItem = !!existing && ensureArray(existing.collectionId).includes('cloud-collection');
    const isLocallyEditable = !!existing && S.customStutis.some((s) => s.id === existing.id);
    if (existing && !isLocallyEditable && !isAdminEditing) {
      toast('Unlock admin mode in Settings to edit this stuti');
      location.hash = '#/library';
      return;
    }
    const mine = editableCollections().find((c) => !c.builtin) || editableCollections()[0] || S.collections[0];
    const d = existing ? clone(existing)
      : { id: uid(), title: '', deity: '', category: 'stuti', lang: 'hi', isPrivate: false, authorName: '', collectionId: [mine.id], pages: [{ text: '', translit: null }] };
    d.collectionId = ensureArray(d.collectionId).filter((collectionId) => collectionId !== 'cloud-collection');
    if (!d.collectionId.length) d.collectionId = [mine.id];
    if (isAdminEditing && !isCloudItem && !isLocallyEditable) d.isPrivate = true;

    const pagesBox = h('div');
    const titleIn = h('input', { type: 'text', placeholder: 'Name of the stuti', value: d.title, oninput: (e) => { d.title = e.target.value; } });
    const deityIn = h('input', { type: 'text', placeholder: 'Deity name (optional)', value: d.deity || '', oninput: (e) => { d.deity = e.target.value; } });
    const authorIn = h('input', { type: 'text', placeholder: 'Your Name (Publisher)', value: d.authorName, oninput: (e) => { d.authorName = e.target.value; } });
    
    const privacySel = h('select', {
      onchange: (e) => { 
        d.isPrivate = e.target.value === 'private';
        authorIn.style.display = d.isPrivate ? 'none' : 'block';
      }
    },
      h('option', { value: 'public', selected: !d.isPrivate, text: ' Public (Publish to Cloud for everyone)' }),
      h('option', { value: 'private', selected: d.isPrivate, text: ' Private (Keep on this device only)' })
    );

    const catSel = h('select', { onchange: (e) => { d.category = e.target.value; } },
      CATEGORIES.map(([c, n]) => h('option', { value: c, selected: c === d.category, text: n })));

    const langSel = h('select', { onchange: (e) => { d.lang = e.target.value; } },
      LANGS.map(([c, n, nat]) => h('option', { value: c, selected: c === d.lang, text: `${n} · ${nat}` })));

    const collBox = h('div', { class: 'card' });
    function renderCollectionChoices() {
      const selectedIds = ensureArray(d.collectionId);
      collBox.replaceChildren(...editableCollections().map((c) => {
        const checkbox = h('input', {
          type: 'checkbox',
          value: c.id,
          checked: selectedIds.includes(c.id),
          onchange: (e) => {
            const nextIds = ensureArray(d.collectionId).filter((id) => id !== c.id);
            if (e.target.checked) nextIds.push(c.id);
            if (!nextIds.length) {
              e.target.checked = true;
              return toast('Choose at least one collection');
            }
            d.collectionId = nextIds;
          }
        });
        return h('label', { class: 'row', style: 'margin:0 0 8px' }, checkbox, h('span', { text: `${c.name} (${stutisIn(c.id).length})` }));
      }));
      if (!collBox.children.length) collBox.append(h('p', { class: 'muted', text: 'Create a collection from the Library first.' }));
    }

    // Photo upload and OCR
    let cropper = null;
    const fileInput = h('input', { type: 'file', accept: 'image/*', style: 'display: none' });
    const camInput = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display: none' });
    
    function handleImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = h('img', { src: e.target.result, style: 'max-width:100%;max-height:400px;display:none' });
        const modal = h('div', { class: 'modal', style: 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000' },
          h('div', { style: 'background:#1a1a1a;padding:20px;border-radius:8px;max-width:90%;max-height:90%;overflow:auto' },
            h('h3', { text: 'Crop Image' }),
            img,
            h('div', { class: 'row', style: 'margin-top:10px' },
              btn('Crop & Extract Text', async () => {
                if (cropper) {
                  const canvas = cropper.getCroppedCanvas();
                  const croppedDataUrl = canvas.toDataURL();
                  cropper.destroy();
                  modal.remove();
                  
                  toast('Extracting text from image...');
                  try {
                    const result = await Tesseract.recognize(croppedDataUrl, OCR[d.lang] || 'hin');
                    const extractedText = result.data.text;
                    if (extractedText.trim()) {
                      d.pages[d.pages.length - 1].text += (d.pages[d.pages.length - 1].text ? '\n' : '') + extractedText;
                      renderPages();
                      toast('Text extracted successfully!');
                    } else {
                      toast('No text found in image');
                    }
                  } catch (err) {
                    console.error('OCR error:', err);
                    toast('Failed to extract text from image');
                  }
                }
              }, 'primary'),
              btn('Cancel', () => {
                if (cropper) cropper.destroy();
                modal.remove();
              }, 'ghost')
            )
          )
        );
        document.body.append(modal);
        img.style.display = 'block';
        
        setTimeout(() => {
          cropper = new Cropper(img, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
          });
        }, 100);
      };
      reader.readAsDataURL(file);
    }
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImage(e.target.files[0]);
    });
    
    camInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImage(e.target.files[0]);
    });

    function renderPages() {
      pagesBox.replaceChildren();
      d.pages.forEach((pg, i) => {
        const textTa = h('textarea', { rows: 8, placeholder: 'Type page content…' });
        textTa.value = pg.text;
        textTa.addEventListener('input', () => { 
          pg.text = textTa.value;
          updateTranslitPreview();
        });
        
        const translitTa = h('textarea', { rows: 8, placeholder: 'English transliteration (auto-generated, editable)' });
        translitTa.value = pg.translit || autoRoman(pg.text, d.lang);
        translitTa.addEventListener('input', () => { 
          pg.translit = translitTa.value;
        });
        
        const card = h('div', { class: 'page-card' },
          h('b', { text: `Page ${i + 1}` }),
          h('div', { class: 'row' },
            btn('Camera', () => camInput.click(), 'small ghost'),
            btn('Upload Photo', () => fileInput.click(), 'small ghost')
          ),
          h('label', { text: 'Original Text' }),
          textTa,
          h('label', { text: 'Transliteration (editable)' }),
          translitTa
        );
        pagesBox.append(card);
      });
    }
    
    function updateTranslitPreview() {
      const translitTextareas = pagesBox.querySelectorAll('textarea:nth-of-type(2)');
      d.pages.forEach((pg, i) => {
        if (translitTextareas[i] && !pg.translit) {
          translitTextareas[i].value = autoRoman(pg.text, d.lang);
        }
      });
    }

    const saveBtn = btn(existing ? 'Save changes' : 'Save Stuti', async () => {
      // Get transliteration values from the textareas
      const translitTextareas = pagesBox.querySelectorAll('textarea:nth-of-type(2)');
      d.pages.forEach((pg, i) => {
        if (translitTextareas[i]) {
          pg.translit = translitTextareas[i].value.trim() || null;
        }
      });
      
      const pages = d.pages.filter((p) => p.text.trim()).map((p) => ({ text: p.text.replace(/\s+$/, ''), translit: p.translit }));
      if (!d.title.trim()) return toast('Please add a title');
      if (!pages.length) return toast('Add at least one page');
      if (!d.isPrivate && !d.authorName.trim()) return toast('Please enter your name for publishing');
      if (existing && !isLocallyEditable && !sudoMode) return toast('Admin mode is required to edit this stuti');

      const rec = {
        id: d.id,
        title: d.title.trim(),
        deity: (d.deity || '').trim(),
        category: d.category,
        lang: d.lang,
        authorName: d.isPrivate ? 'Local User' : d.authorName.trim(),
        collectionId: ensureArray(d.collectionId),
        pages,
        isPrivate: d.isPrivate,
        updated: Date.now()
      };
      S.deletedSeedIds = S.deletedSeedIds.filter((deletedId) => deletedId !== rec.id);

      if (d.isPrivate) {
        // Remove existing if editing
        const existingIdx = S.customStutis.findIndex(s => s.id === rec.id);
        if (existingIdx >= 0) S.customStutis.splice(existingIdx, 1);
        const stutiIdx = S.stutis.findIndex(s => s.id === rec.id);
        if (stutiIdx >= 0) S.stutis.splice(stutiIdx, 1);
        
        S.customStutis.push(rec);
        S.stutis.push(rec);
        saveLocal();
        toast('Saved privately on this device!');
      } else {
        // For public stutis, save to cloud and also to local collection
        const cloudSuccess = await saveToCloud(rec);
        if (cloudSuccess) {
          await fetchCloudStutis();
          toast(`Published to Cloud by ${rec.authorName}!`);
        } else {
          // Fallback to local storage if cloud fails
          toast('Cloud save failed - saving locally only');
        }
        
        // Always save to local collection as well for organization
        const existingIdx = S.customStutis.findIndex(s => s.id === rec.id);
        if (existingIdx >= 0) S.customStutis.splice(existingIdx, 1);
        const stutiIdx = S.stutis.findIndex(s => s.id === rec.id);
        if (stutiIdx >= 0) S.stutis.splice(stutiIdx, 1);
        
        S.customStutis.push(rec);
        S.stutis.push(rec);
        saveLocal();
        
        // Show share link for public stutis
        const shareUrl = generateShareLink(rec);
        if (confirm(`Stuti created!\n\nShare link:\n${shareUrl}\n\nCopy to clipboard?`)) {
          navigator.clipboard.writeText(shareUrl);
          toast('Link copied to clipboard!');
        }
      }

      location.hash = '#/library';
    }, 'primary');

    app.append(h('div', { class: 'screen' },
      h('h1', { text: existing ? 'Edit stuti' : 'Add a stuti' }),
      h('label', { text: 'Title' }), titleIn,
      h('label', { text: 'Deity (optional)' }), deityIn,
      h('label', { text: 'Category' }), catSel,
      h('label', { text: 'Collections (choose one or more)' }), collBox,
      h('label', { text: 'Privacy Setting' }), privacySel,
      h('label', { text: 'Publishing Author Name' }), authorIn,
      h('label', { text: 'Language' }), langSel,
      pagesBox,
      btn('+ Add page', () => { d.pages.push({ text: '', translit: null }); renderPages(); }, 'small'),
      h('div', { class: 'row', style: 'margin-top:20px' }, saveBtn),
      fileInput,
      camInput));
    
    // Set initial visibility of author input based on privacy
    authorIn.style.display = d.isPrivate ? 'none' : 'block';
    renderCollectionChoices();
    renderPages();
  }

  /* ---------- Settings ---------- */
  function viewSettings(app) {
    const themeSel = h('select', {
      onchange: (e) => { S.settings.theme = e.target.value; saveLocal(); applyTheme(); }
    }, h('option', { value: 'dark', selected: S.settings.theme === 'dark', text: 'Dark' }),
       h('option', { value: 'light', selected: S.settings.theme === 'light', text: 'Light' }));

    const passwordInput = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Password' });
    const adminStatus = h('p', {
      class: 'muted',
      text: sudoMode ? 'Admin mode is unlocked for this tab.' : 'Enter the admin password to edit or delete any stuti.'
    });
    const adminButton = btn(sudoMode ? 'Lock admin mode' : 'Unlock admin mode', () => {
      if (sudoMode) {
        sudoMode = false;
        passwordInput.value = '';
        adminStatus.textContent = 'Admin mode is locked.';
        adminButton.textContent = 'Unlock admin mode';
        toast('Admin mode locked');
        return;
      }
      if (passwordInput.value !== ADMIN_PASSPHRASE) {
        passwordInput.value = '';
        passwordInput.focus();
        return toast('Incorrect password');
      }
      sudoMode = true;
      passwordInput.value = '';
      adminStatus.textContent = 'Admin mode is unlocked for this tab.';
      adminButton.textContent = 'Lock admin mode';
      toast('Admin mode unlocked');
    }, 'primary');
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') adminButton.click();
    });

    app.append(h('div', { class: 'screen' },
      h('h1', { text: 'Settings' }),
      h('section', { class: 'card' },
        h('h2', { text: 'Appearance' }),
        h('label', { text: 'Theme' }), themeSel),
      h('section', { class: 'card' },
        h('h2', { text: 'Admin mode' }),
        adminStatus,
        h('label', { text: 'Password' }), passwordInput,
        h('div', { class: 'row', style: 'margin-top:12px' }, adminButton),
        h('p', { class: 'muted', text: 'This passphrase is part of the app code and is not a secure authentication system.' }))));
  }

  // Initial immediate route render so app opens with zero delay, then init cloud
  route();
  initCloud();
})();
