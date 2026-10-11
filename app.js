/* Sur – सुर
 * Public & Private Cloud Edition with Share Links and Author Names.
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
    ['bn', 'Bengali', 'বাংলা'], ['as', 'Assamese', 'असमीया'], ['or', 'Odia', 'ଓଡ଼ିଆ'],
    ['raj', 'Rajasthani', 'राजस्थानी'], ['bho', 'Bhojpuri', 'भोजपुरी'], ['mai', 'Maithili', 'मैथिली']
  ];
  const OCR = { hi: 'hin', sa: 'san', mr: 'mar', gu: 'guj', pa: 'pan', ne: 'nep', bn: 'ben', as: 'asm', or: 'ori', raj: 'hin', bho: 'hin', mai: 'hin' };
  const RULES = { raj: 'hi', bho: 'hi', mai: 'hi' };
  const CATEGORIES = [['stuti', 'Stuti'], ['aarti', 'Aarti'], ['chalisa', 'Chalisa'], ['bhajan', 'Bhajan'], ['mantra', 'Mantra'], ['other', 'Other']];

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

  /* ---------- cloud & share handling ---------- */
  async function fetchCloudStutis() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('stutis').select('*');
      if (!error && data) {
        const cloudStutis = data.map(row => ({
          id: row.id,
          title: row.title,
          deity: row.deity || '',
          category: row.category || 'stuti',
          lang: row.language || 'hi',
          authorName: row.author_name || 'Anonymous',
          collectionId: 'cloud-collection',
          pages: row.pages || [],
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
          // Only add cloud stuti if not already in customStutis
          if (!map.has(s.id)) {
            map.set(s.id, s);
          }
        });

        S.stutis = Array.from(map.values());
        cleanPath();
        route();
      }
    } catch(e) {
      console.error('Fetch cloud error:', e);
    }
  }

  function initCloud() {
    try {
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        fetchCloudStutis();

        // Check for share link after a short delay to ensure cloud is ready
        setTimeout(() => checkImportLink(), 100);

        supabaseClient
          .channel('public:stutis')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'stutis' }, () => {
            fetchCloudStutis();
          })
          .subscribe();
      }
    } catch (e) {
      console.error('Cloud connection error:', e);
    }
  }

  async function saveToCloud(rec) {
    if (!supabaseClient) {
      toast('Cloud not available - saving locally instead');
      return false;
    }
    try {
      const { error } = await supabaseClient.from('stutis').upsert({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        deity: rec.deity,
        language: rec.lang,
        author_name: rec.authorName || 'Anonymous',
        pages: rec.pages
      });
      if (error) {
        toast('Cloud save error: ' + error.message + ' - saving locally instead');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Save to cloud failed:', e);
      toast('Cloud connection failed - saving locally instead');
      return false;
    }
  }

  async function checkImportLink() {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId && supabaseClient) {
      try {
        toast('Loading shared stuti...');
        const { data, error } = await supabaseClient
          .from('stutis')
          .select('*')
          .eq('id', shareId)
          .single();
        
        if (error || !data) {
          toast('Could not find shared stuti');
          return;
        }
        
        const sharedStuti = {
          id: data.id,
          title: data.title,
          deity: data.deity || '',
          category: data.category || 'stuti',
          lang: data.language || 'hi',
          authorName: data.author_name || 'Anonymous',
          pages: data.pages || [],
          isPrivate: false
        };
        
        // Import as private local copy
        const imported = clone(sharedStuti);
        imported.id = uid(); // Generate new ID
        imported.isPrivate = true;
        imported.collectionId = S.collections.find((c) => !c.builtin)?.id || S.collections[0].id;
        
        S.customStutis.push(imported);
        S.stutis.push(imported);
        saveLocal();
        toast(`Imported "${sharedStuti.title}" into your library!`);
        
        // Clear the share parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname + '#/library');
        route();
      } catch (e) {
        console.error('Import error:', e);
        toast('Could not import from share link');
      }
    }
  }

  function generateShareLink(stuti) {
    // Use the stuti ID as the share parameter - much shorter link
    return `${window.location.origin}${window.location.pathname}?share=${stuti.id}#/library`;
  }

  function cleanPath() {
    S.path = S.path.filter((st) => st.type === 'collection'
      ? S.collections.some((c) => c.id === st.id)
      : S.stutis.some((x) => x.id === st.id));
  }

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
  const autoRoman = (text, lang) => window.Translit ? window.Translit.transliterate(text, RULES[lang] || lang, S.settings.style) : text;
  const romanOf = (st, pg) => (pg.translit ? pg.translit : autoRoman(pg.text, st.lang));
  function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; }

  /* ---------- router ---------- */
  let cleanups = [];
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
      const col = colOf(st.collectionId);
      titleEl.textContent = st.title;
      subEl.textContent = `${col ? col.name + ' · ' : ''}stuti ${qi + 1}/${queue.length}`;
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
          buttons.push(h('button', { class: 'btn small', type: 'button', text: ' Share', onclick: () => {
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
    const list = h('div');
    function row(x) {
      const shareUrl = generateShareLink(x);
      const authorText = (x.authorName && x.authorName !== 'Local User' && !x.isPrivate) ? 'By ' + x.authorName + ' · ' : '';
      const isFromCloud = x.collectionId === 'cloud-collection';
      const isCustom = S.customStutis.some(s => s.id === x.id);
      
      const buttons = [
        link('Read', '#/read?s=' + encodeURIComponent(x.id), 'small primary'),
        !x.isPrivate ? h('button', { class: 'btn small', type: 'button', text: ' Share', onclick: () => {
          if (confirm(`Share link:\n${shareUrl}\n\nCopy to clipboard?`)) {
            navigator.clipboard.writeText(shareUrl);
            toast('Share link copied to clipboard!');
          }
        }}) : null
      ];
      
      // Show delete button for everything except cloud stutis
      if (!isFromCloud) {
        buttons.push(h('button', { class: 'btn small danger', type: 'button', text: 'Delete', onclick: () => {
          if (confirm('Delete this stuti? This cannot be undone.')) {
            if (isCustom) {
              S.customStutis = S.customStutis.filter(s => s.id !== x.id);
            }
            
            // Track deleted seed stutis so they don't reappear on reload
            if (!isCustom) {
              if (!S.deletedSeedIds.includes(x.id)) {
                S.deletedSeedIds.push(x.id);
              }
            }
            
            S.stutis = S.stutis.filter(s => s.id !== x.id);
            S.path = S.path.filter(st => st.id !== x.id);
            saveLocal();
            toast('Stuti deleted');
            draw();
          }
        }}));
      }
      
      return h('div', { class: 'item' },
        h('div', { class: 'name' },
          h('b', { text: x.title }),
          h('span', { class: 'muted', text: `${langName(x.lang)} · ${authorText}${x.pages.length} page${x.pages.length > 1 ? 's' : ''}` })),
        ...buttons.filter(Boolean));
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
              onclick: () => { S.path.push({ type: 'collection', id: c.id }); saveLocal(); toast('Added to your Sur'); } })),
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
  function viewEdit(app, id) {
    const existing = id ? stutiOf(id) : null;
    const mine = S.collections.find((c) => !c.builtin) || S.collections[0];
    const d = existing ? clone(existing)
      : { id: uid(), title: '', deity: '', category: 'stuti', lang: 'hi', isPrivate: false, authorName: '', collectionId: mine.id, pages: [{ text: '', translit: null }] };

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

    // Collection selector - always shows for both private and public
    const collSel = h('select', { onchange: (e) => { d.collectionId = e.target.value; } },
      S.collections.map(c => h('option', { value: c.id, selected: c.id === d.collectionId, text: `${c.name} (${stutisIn(c.id).length})` })));

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

      const rec = {
        id: d.id,
        title: d.title.trim(),
        deity: (d.deity || '').trim(),
        category: d.category,
        lang: d.lang,
        authorName: d.isPrivate ? 'Local User' : d.authorName.trim(),
        collectionId: d.collectionId,
        pages,
        isPrivate: d.isPrivate,
        updated: Date.now()
      };

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
      }

      // Only show share link for public stutis
      if (!d.isPrivate) {
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
      h('label', { text: 'Collection' }), collSel,
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
    renderPages();
  }

  /* ---------- Settings ---------- */
  function viewSettings(app) {
    const themeSel = h('select', {
      onchange: (e) => { S.settings.theme = e.target.value; saveLocal(); applyTheme(); }
    }, h('option', { value: 'dark', selected: S.settings.theme === 'dark', text: 'Dark' }),
       h('option', { value: 'light', selected: S.settings.theme === 'light', text: 'Light' }));

    app.append(h('div', { class: 'screen' },
      h('h1', { text: 'Settings' }),
      h('section', { class: 'card' },
        h('h2', { text: 'Appearance' }),
        h('label', { text: 'Theme' }), themeSel)));
  }

  // Initial immediate route render so app opens with zero delay, then init cloud
  route();
  initCloud();
})();
