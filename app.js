/* Sur – सुर
 * Public & Private Cloud Edition with Share Links and Author Names.
 */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcJxJdTf5YpM4p-Evf-kO8EBNqTp_vFfR8DTMc23D7K0ny-LgHn4Q2aS4p1ev6XSlm/exec';

  const KEY = 'sur.v1';
  // App release version. Shown in the footer of the Settings page.
  // On each release, bump this AND the CACHE name in sw.js so users get fresh assets.
  const APP_VERSION = '4';
  const CLOUD_COLLECTION_ID = 'cloud-collection';
  const RETIRED_SAMPLE_IDS = new Set(['s-ganesh-1', 's-navratri-1', 's-rajbhog-1', 's-aarti-1']);
  const LANGS = [
    ['hi', 'Hindi', 'हिन्दी'], ['sa', 'Sanskrit', 'संस्कृत'], ['mr', 'Marathi', 'मराठी'],
    ['gu', 'Gujarati', 'ગુજરાતી'], ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'], ['ne', 'Nepali', 'नेपाली'],
    ['bn', 'Bengali', 'বাংলা'], ['as', 'Assamese', 'असमीया'], ['or', 'Odia', 'ଓଡ଼ିଆ'],
    ['raj', 'Rajasthani', 'राजस्थानी'], ['bho', 'Bhojpuri', 'भोजपुरी'], ['mai', 'Maithili', 'मैथिली']
  ];
  const OCR = { hi: 'hin', sa: 'san', mr: 'mar', gu: 'guj', pa: 'pan', ne: 'nep', bn: 'ben', as: 'asm', or: 'ori', raj: 'hin', bho: 'hin', mai: 'hin' };
  const RULES = { raj: 'hi', bho: 'hi', mai: 'hi' };
  const CATEGORIES = [['stuti', 'Stuti'], ['aarti', 'Aarti'], ['chalisa', 'Chalisa'], ['bhajan', 'Bhajan'], ['mantra', 'Mantra'], ['other', 'Other']];
  const ADMIN_PASSPHRASE = 'pspspspsps';

  const UI_LANGS = [
    ['en', 'English', 'English'],
    ['hi', 'Hindi', 'हिन्दी']
  ];

  const TRANSLATIONS = {
    en: {
      start: 'Start',
      done: 'Done',
      read: 'Read',
      edit: 'Edit',
      library: 'Library',
      add: 'Add',
      yourSur: 'Your Sur',
      yourPrayers: 'Your prayers, in your order.',
      yourSequence: 'Your sequence',
      addToSequence: 'Add to your sequence',
      addToSequenceDesc: 'Pick from whole collections or single stutis.',
      nothingYet: 'Nothing yet. Add items below.',
      writeNew: 'Write a new stuti',
      buildSur: 'Build your Sur',
      editSur: 'Edit your Sur',
      selectRead: 'Select what to read',
      quickRead: 'Quick Read',
      quickReadDesc: 'Choose a single stuti to read right now.',
      nothingToRead: 'Nothing to read yet',
      completed: 'Completed',
      startAgain: 'Start again',
      chooseAnother: 'Choose another',
      search: 'Search...',
      all: 'All',
      collections: 'Collections',
      noStutis: 'No stutis here yet.',
      noMatches: 'No matches.',
      noCollectionsYet: 'No collections yet.',
      language: 'Language',
      category: 'Category',
      deity: 'Deity',
      title: 'Title',
      theme: 'Theme',
      private: 'Private',
      public: 'Public',
      publicOption: 'Public (Publish to Cloud for everyone)',
      privateOption: 'Private (Keep on this device only)',
      publisherName: 'Publisher name',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      copy: 'Copy',
      shareLink: 'Share Link',
      exportJSON: 'Export JSON',
      importJSON: 'Import JSON',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      addPage: '+ Add page',
      removePage: 'Remove page',
      original: 'Original',
      english: 'English',
      both: 'Both',
      dark: 'Dark',
      light: 'Light',
      settings: 'Settings',
      createCollection: '+ Collection',
      enterCollectionName: 'Enter collection name',
      wholeCollection: '+ Whole collection',
      wholeCollectionDesc: 'Whole collection · {} stutis',
      pages: 'page',
      pages_plural: 'pages',
      by: 'By',
      deleteConfirm: 'Delete this stuti?',
      addFirst: 'Add something first',
      stuti: 'stuti',
      of: 'of',
      home: 'Home',
      libraryTitle: 'Library',
      selectTitle: 'Select what to read',
      addTitle: 'Add new stuti',
      editTitle: 'Edit stuti',
      settingsTitle: 'Settings',
      pageLabel: 'Page',
      resume: 'Continue',
      appearance: 'Appearance',
      adminMode: 'Admin mode',
      adminPassword: 'Enter admin password',
      adminUnlocked: 'Admin mode is unlocked for this tab.',
      adminLocked: 'Enter the admin password to edit or delete any stuti.',
      lockAdmin: 'Lock admin mode',
      unlockAdmin: 'Unlock admin mode',
      adminNote: 'This passphrase is part of the app code and is not a secure authentication system.',
      camera: 'Camera',
      uploadPhoto: 'Upload Photo',
      cropImage: 'Crop Image',
      cropExtract: 'Crop & Extract Text',
      typePageContent: 'Type page content…',
      englishTranslitPlaceholder: 'English transliteration (auto-generated, editable)',
      textLabel: 'Text',
      editable: 'editable',
      addedToSur: 'Added to your Sur',
      copiedToLibrary: 'Copied to your library',
      pleaseAddTitle: 'Please add a title',
      addAtLeastOnePage: 'Add at least one page',
      pleaseEnterAuthor: 'Please enter your name for publishing',
      update: 'Update',
      updatingCloud: 'Updating Cloud Community...',
      cloudUpdated: 'Cloud Community stutis updated!',
      cloudUpdateFailed: 'Failed to update Cloud Community'
    },
    hi: {
      start: 'शुरू',
      done: 'हो गया',
      read: 'पढ़ें',
      edit: 'संपादित करें',
      library: 'लाइब्रेरी',
      add: 'जोड़ें',
      yourSur: 'आपका सुर',
      yourPrayers: 'आपकी प्रार्थनाएं, आपके क्रम में।',
      yourSequence: 'आपका क्रम',
      addToSequence: 'अपने क्रम में जोड़ें',
      addToSequenceDesc: 'पूरे संग्रह या किसी एक स्तुति से चुनें।',
      nothingYet: 'अभी कुछ नहीं। नीचे से आइटम जोड़ें।',
      writeNew: '+ नई स्तुति लिखें',
      buildSur: 'अपना सुर बनाएं',
      editSur: 'अपना सुर संपादित करें',
      selectRead: 'पढ़ने के लिए चुनें',
      quickRead: 'तुरंत पढ़ें',
      quickReadDesc: 'अभी एक स्तुति चुनकर पढ़ें।',
      nothingToRead: 'पढ़ने के लिए कुछ नहीं',
      completed: 'पूर्ण हो गया',
      startAgain: 'फिर से शुरू करें',
      chooseAnother: 'दूसरा चुनें',
      search: 'खोजें...',
      all: 'सभी',
      collections: 'संग्रह',
      noStutis: 'यहां अभी कोई स्तुति नहीं है।',
      noMatches: 'कोई परिणाम नहीं मिला।',
      noCollectionsYet: 'अभी कोई संग्रह नहीं है।',
      language: 'भाषा',
      category: 'श्रेणी',
      deity: 'देवता',
      title: 'शीर्षक',
      theme: 'थीम',
      private: 'निजी',
      public: 'सार्वजनिक',
      publicOption: 'सार्वजनिक (सभी के लिए क्लाउड पर प्रकाशित करें)',
      privateOption: 'निजी (केवल इसी डिवाइस पर रखें)',
      publisherName: 'प्रकाशक का नाम',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      copy: 'कॉपी',
      shareLink: 'लिंक साझा करें',
      exportJSON: 'JSON निर्यात',
      importJSON: 'JSON आयात',
      close: 'बंद करें',
      back: 'पीछे',
      next: 'आगे',
      addPage: '+ पेज जोड़ें',
      removePage: 'पेज हटाएं',
      original: 'मूल',
      english: 'अंग्रेजी',
      both: 'दोनों',
      dark: 'अंधेरा',
      light: 'रोशनी',
      settings: 'सेटिंग्स',
      createCollection: '+ संग्रह',
      enterCollectionName: 'संग्रह का नाम दर्ज करें',
      wholeCollection: '+ पूरा संग्रह',
      wholeCollectionDesc: 'पूरा संग्रह · {} स्तुतियाँ',
      pages: 'पेज',
      pages_plural: 'पेज',
      by: 'द्वारा',
      deleteConfirm: 'इस स्तुति को हटाएं?',
      addFirst: 'पहले कुछ जोड़ें',
      stuti: 'स्तुति',
      of: 'में से',
      home: 'होम',
      libraryTitle: 'लाइब्रेरी',
      selectTitle: 'पढ़ने के लिए चुनें',
      addTitle: 'नई स्तुति जोड़ें',
      editTitle: 'स्तुति संपादित करें',
      settingsTitle: 'सेटिंग्स',
      pageLabel: 'पेज',
      resume: 'जारी रखें',
      appearance: 'दिखावट',
      adminMode: 'व्यवस्थापक मोड',
      adminPassword: 'व्यवस्थापक पासवर्ड दर्ज करें',
      adminUnlocked: 'इस टैब के लिए व्यवस्थापक मोड खुला है।',
      adminLocked: 'किसी भी स्तुति को संपादित या हटाने के लिए व्यवस्थापक पासवर्ड दर्ज करें।',
      lockAdmin: 'व्यवस्थापक मोड लॉक करें',
      unlockAdmin: 'व्यवस्थापक मोड अनलॉक करें',
      adminNote: 'यह पासफ़्रेज़ ऐप कोड का हिस्सा है और सुरक्षित प्रमाणीकरण प्रणाली नहीं है।',
      camera: 'कैमरा',
      uploadPhoto: 'फोटो अपलोड करें',
      cropImage: 'फोटो क्रॉप करें',
      cropExtract: 'क्रॉप करें और टेक्स्ट निकालें',
      typePageContent: 'पेज का पाठ यहाँ लिखें…',
      englishTranslitPlaceholder: 'अंग्रेजी लिप्यंतरण (स्वतः जनरेट, संपादन योग्य)',
      textLabel: 'पाठ',
      editable: 'संपादन योग्य',
      addedToSur: 'आपके सुर में जोड़ा गया',
      copiedToLibrary: 'आपकी लाइब्रेरी में कॉपी किया गया',
      pleaseAddTitle: 'कृपया एक शीर्षक दर्ज करें',
      addAtLeastOnePage: 'कम से कम एक पेज जोड़ें',
      pleaseEnterAuthor: 'प्रकाशन के लिए अपना नाम दर्ज करें',
      update: 'अपडेट',
      updatingCloud: 'क्लाउड कम्युनिटी अपडेट हो रही है...',
      cloudUpdated: 'क्लाउड कम्युनिटी स्तुतियाँ अपडेट हुईं!',
      cloudUpdateFailed: 'क्लाउड कम्युनिटी अपडेट करने में विफल'
    }
  };

  const t = (key) => {
    const lang = S.settings.uiLang || 'en';
    return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key;
  };

  const KNOWN_TRANSLATIONS = {
    'Stuti': 'स्तुति',
    'Aarti': 'आरती',
    'Chalisa': 'चालीसा',
    'Bhajan': 'भजन',
    'Mantra': 'मंत्र',
    'Other': 'अन्य',
    'Hindi': 'हिन्दी',
    'Sanskrit': 'संस्कृत',
    'English': 'अंग्रेजी',
    'Marathi': 'मराठी',
    'Gujarati': 'गुजराती',
    'Punjabi': 'पंजाबी',
    'Bengali': 'बांग्ला',
    'Nepali': 'नेपाली',
    'Assamese': 'असमिया',
    'Odia': 'ओडिया',
    'Rajasthani': 'राजस्थानी',
    'Bhojpuri': 'भोजपुरी',
    'Maithili': 'मैथिली',
    'Ganesh Ji': 'गणेश जी',
    'Navratri Stuti': 'नवरात्रि स्तुति',
    'Raj Bhog': 'राज भोग',
    'Cloud Community Library': 'क्लाउड कम्युनिटी लाइब्रेरी',
    'Update': 'अपडेट',
    'My Stutis': 'मेरी स्तुतियाँ',
    'By': 'द्वारा',
    'page': 'पेज',
    'pages': 'पेज',
    'स्तुति': 'Stuti',
    'आरती': 'Aarti',
    'चालीसा': 'Chalisa',
    'भजन': 'Bhajan',
    'मंत्र': 'Mantra',
    'अन्य': 'Other',
    'हिन्दी': 'Hindi',
    'संस्कृत': 'Sanskrit',
    'अंग्रेजी': 'English',
    'मराठी': 'Marathi',
    'गुजराती': 'Gujarati',
    'पंजाबी': 'Punjabi',
    'बांग्ला': 'Bengali',
    'नेपाली': 'Nepali',
    'असमिया': 'Assamese',
    'असमीया': 'Assamese',
    'ओडिया': 'Odia',
    'राजस्थानी': 'Rajasthani',
    'भोजपुरी': 'Bhojpuri',
    'मैथिली': 'Maithili',
    'गणेश जी': 'Ganesh Ji',
    'नवरात्रि स्तुति': 'Navratri Stuti',
    'राज भोग': 'Raj Bhog',
    'क्लाउड कम्युनिटी लाइब्रेरी': 'Cloud Community Library',
    'अपडेट': 'Update',
    'मेरी स्तुतियाँ': 'My Stutis',
    'द्वारा': 'By',
    'पेज': 'page'
  };

  // Simple translation function for user-created content
  async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    if (KNOWN_TRANSLATIONS[text]) return KNOWN_TRANSLATIONS[text];
    
    // Try to translate using Google Translate (unofficial API)
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
    } catch (e) {
      console.warn('Translation failed:', e);
    }
    
    return text;
  }

  // Synchronous translation for display (uses cache or returns original)
  const translateDisplay = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const lang = S.settings.uiLang || 'en';
    
    // 1. Bilingual split format: "English · Hindi"
    if (text.includes(' · ')) {
      const parts = text.split(' · ');
      if (parts.length === 2) {
        const hasDevanagari0 = /[ऀ-ॿ]/.test(parts[0]);
        const hasDevanagari1 = /[ऀ-ॿ]/.test(parts[1]);
        if (!hasDevanagari0 && hasDevanagari1) {
          return lang === 'hi' ? parts[1].trim() : parts[0].trim();
        } else if (hasDevanagari0 && !hasDevanagari1) {
          return lang === 'hi' ? parts[0].trim() : parts[1].trim();
        }
      }
    }
    
    // 2. Exact match in dictionary
    if (KNOWN_TRANSLATIONS[text]) {
      const trans = KNOWN_TRANSLATIONS[text];
      const transIsHindi = /[ऀ-ॿ]/.test(trans);
      if (lang === 'hi' && transIsHindi) return trans;
      if (lang === 'en' && !transIsHindi) return trans;
    }
    
    // If language matches text language, return as-is
    const isHindi = /[ऀ-ॿ]/.test(text);
    if (lang === 'hi' && isHindi) return text;
    if (lang === 'en' && !isHindi) return text;
    
    // 3. For custom English to Hindi phrases
    if (lang === 'hi' && !isHindi) {
      const wordsToHindi = [
        ['Cloud Community Library', 'क्लाउड कम्युनिटी लाइब्रेरी'],
        ['Community Library', 'कम्युनिटी लाइब्रेरी'],
        ['Navratri Stuti', 'नवरात्रि स्तुति'],
        ['Ganesh Ji', 'गणेश जी'],
        ['Raj Bhog', 'राज भोग'],
        ['My Stutis', 'मेरी स्तुतियाँ'],
        ['Chalisa', 'चालीसा'],
        ['Bhajan', 'भजन'],
        ['Mantra', 'मंत्र'],
        ['Aarti', 'आरती'],
        ['Stutis', 'स्तुतियाँ'],
        ['Stuti', 'स्तुति'],
        ['Ganesh', 'गणेश'],
        ['Durga', 'दुर्गा'],
        ['Shiva', 'शिव'],
        ['Krishna', 'कृष्ण'],
        ['Ram', 'राम'],
        ['Hanuman', 'हनुमान'],
        ['Navratri', 'नवरात्रि'],
        ['Raj', 'राज'],
        ['Bhog', 'भोग'],
        ['Cloud', 'क्लाउड'],
        ['My', 'मेरी'],
        ['Ji', 'जी']
      ];
      
      let result = text;
      for (const [en, hi] of wordsToHindi) {
        result = result.replace(new RegExp('\\b' + en + '\\b', 'gi'), hi);
      }
      return result;
    }
    
    // 4. For Hindi to English custom transliteration
    if (lang === 'en' && isHindi && window.Translit) {
      const roman = window.Translit.transliterate(text, 'hi', 'standard');
      return roman.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    
    return text;
  };

  const categoryName = (category) => {
    const name = (CATEGORIES.find(([id]) => id === category) || [category, category])[1];
    return translateDisplay(name);
  };

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
      settings: { view: 'both', size: 24, theme: 'dark', style: 'standard', uiLang: 'en' }
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
        d.stutis = d.stutis.filter((s) => !RETIRED_SAMPLE_IDS.has(s.id)
          || d.customStutis.some((custom) => custom.id === s.id));
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
  let isFetchingCloud = false;
  async function fetchCloudStutis(showFeedback = false) {
    if (isFetchingCloud) return false;
    isFetchingCloud = true;
    if (showFeedback) toast(t('updatingCloud'));
    try {
      ensureCloudCollection();
      let migratedPublicStutis = false;
      S.customStutis.forEach((stuti) => {
        const collectionIds = ensureArray(stuti.collectionId);
        if (isPublicStuti(stuti) && !collectionIds.includes(CLOUD_COLLECTION_ID)) {
          stuti.collectionId = [...collectionIds, CLOUD_COLLECTION_ID];
          migratedPublicStutis = true;
        }
      });
      if (migratedPublicStutis) saveLocal();

      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        if (showFeedback) toast(t('cloudUpdateFailed'));
        return false;
      }
      
      const cloudStutis = [];
      for (const row of data) {
        if (row.is_backup || row.user_data || String(row.id || '').startsWith('user-backup-')
          || S.deletedSeedIds.includes(row.id)) continue;

        let pages;
        try {
          pages = typeof row.pages === 'string' ? JSON.parse(row.pages) : row.pages;
        } catch (error) {
          console.warn('Skipping cloud stuti with invalid page data:', row.id, error);
          continue;
        }
        if (!row.id || !String(row.title || '').trim() || !Array.isArray(pages) || !pages.length
          || pages.some((page) => !page || typeof page.text !== 'string')) {
          console.warn('Skipping incomplete cloud stuti:', row.id);
          continue;
        }

        cloudStutis.push({
          id: row.id,
          title: row.title,
          deity: row.deity || '',
          category: row.category || 'stuti',
          lang: row.language || 'hi',
          authorName: row.author_name || 'Anonymous',
          collectionId: CLOUD_COLLECTION_ID,
          pages,
          isPublic: true
        });
      }

      // Merge all stutis: seed + custom + cloud
      // Latest cloud rows populate the cloud community collection
      const map = new Map();
      (window.SUR_SEED?.stutis || []).forEach(s => map.set(s.id, s));
      S.customStutis.forEach(s => map.set(s.id, s));
      cloudStutis.forEach(s => {
        const local = S.customStutis.find(c => c.id === s.id);
        if (local && local.collectionId) {
          s.collectionId = [...new Set([...ensureArray(local.collectionId), CLOUD_COLLECTION_ID])];
        }
        map.set(s.id, s);
      });

      S.stutis = Array.from(map.values());
      cleanPath();
      saveLocal();
      route();
      if (showFeedback) toast(t('cloudUpdated'));
      return true;
    } catch(e) {
      console.error('Fetch cloud error:', e);
      if (showFeedback) toast(t('cloudUpdateFailed'));
      return false;
    } finally {
      isFetchingCloud = false;
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
      try {
        const base64 = sharedData.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
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
    const exportData = {
      title: stuti.title,
      deity: stuti.deity,
      category: stuti.category,
      lang: stuti.lang,
      authorName: stuti.authorName,
      pages: stuti.pages
    };
    const jsonStr = JSON.stringify(exportData);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('share', encoded);
    url.hash = '/library';
    return url.toString();
  }
  
  function cleanPath() {
    S.path = S.path.filter((st) => st.type === 'collection'
      ? S.collections.some((c) => c.id === st.id)
      : S.stutis.some((x) => x.id === st.id));
  }

  const colOf = (id) => S.collections.find((c) => c.id === id);
  const stutiOf = (id) => S.stutis.find((x) => x.id === id);
  const isPublicStuti = (stuti) => stuti.isPublic === true || stuti.isPrivate !== true;
  const stutisIn = (cid) => cid === CLOUD_COLLECTION_ID
    ? S.stutis.filter(isPublicStuti)
    : S.stutis.filter((x) => ensureArray(x.collectionId).includes(cid));
  const collectionsOf = (stuti) => ensureArray(stuti.collectionId).map(colOf).filter(Boolean);
  const editableCollections = () => S.collections.filter((c) => c.id !== 'cloud-collection');
  function ensureCloudCollection() {
    if (!S.collections.some((collection) => collection.id === CLOUD_COLLECTION_ID)) {
      S.collections.push({ id: CLOUD_COLLECTION_ID, name: 'Cloud Community Library', builtin: false });
    }
  }
  const langName = (c) => {
    const lang = (LANGS.find((l) => l[0] === c) || [c, c])[1];
    return translateDisplay(lang);
  };
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

  function renderLangToggle() {
    return h('div', { class: 'lang-toggle' },
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => {
        S.settings.uiLang = S.settings.uiLang === 'en' ? 'hi' : 'en';
        saveLocal();
        window.location.reload();
      }, text: S.settings.uiLang === 'en' ? 'अ' : 'A', title: S.settings.uiLang === 'en' ? 'Switch to Hindi (हिन्दी)' : 'Switch to English' }));
  }

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
    else if (path.startsWith('/edit/')) {
      try {
        viewEdit(app, decodeURIComponent(path.slice(6)));
      } catch (e) {
        console.error('Invalid edit URL:', e);
        toast('Invalid stuti link');
        location.hash = '#/library';
      }
    }
    else if (path === '/read') viewRead(app, params);
    else if (path === '/settings') viewSettings(app);
    else viewHome(app);
    const navTitles = {
      '/': t('home'),
      '/library': t('libraryTitle'),
      '/add': t('add'),
      '/settings': t('settingsTitle')
    };
    document.querySelectorAll('#nav a').forEach((a) => {
      const r = a.dataset.route;
      if (navTitles[r]) a.textContent = navTitles[r];
      a.classList.toggle('on', r === path || (r === '/add' && path.startsWith('/edit')) || (r === '/' && path === '/path'));
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Home ---------- */
  function stepInfo(step) {
    if (step.type === 'collection') {
      const c = colOf(step.id);
      return c ? { name: translateDisplay(c.name), sub: `${t('wholeCollectionDesc').replace('{}', stutisIn(c.id).length)}` } : null;
    }
    const x = stutiOf(step.id);
    if (!x) return null;
    const names = collectionsOf(x).map((c) => translateDisplay(c.name)).join(', ');
    return { name: translateDisplay(x.title), sub: `${names ? names + ' · ' : ''}${x.pages.length} ${x.pages.length === 1 ? t('pages') : t('pages_plural')}` };
  }

  function viewHome(app) {
    const libraryBox = h('section', { class: 'card' });
    const seqBox = h('section', { class: 'card' });

    function addStep(type, id) { S.path.push({ type, id }); saveLocal(); renderSeq(); toast(t('addedToSur')); }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= S.path.length) return;
      [S.path[i], S.path[j]] = [S.path[j], S.path[i]];
      saveLocal(); renderSeq();
    }

    function renderLibrary() {
      ensureCloudCollection();
      const items = stutisIn(CLOUD_COLLECTION_ID);
      libraryBox.replaceChildren(
        h('div', { class: 'row between' },
          h('h2', { text: t('libraryTitle') }),
          h('div', { class: 'row' },
            btn('⟳ ' + t('update'), () => fetchCloudStutis(true), 'small'),
            h('button', { class: 'btn small', type: 'button', text: t('wholeCollection'), disabled: !items.length,
              onclick: () => addStep('collection', CLOUD_COLLECTION_ID) }))));
      if (!items.length) {
        libraryBox.append(h('p', { class: 'muted', text: t('noStutis') }));
        return;
      }
      items.forEach((x) => {
        libraryBox.append(h('div', { class: 'item' },
          h('div', { class: 'name' },
            h('b', { text: translateDisplay(x.title) }),
            h('span', { class: 'muted', text: `${langName(x.lang)} · ${x.pages.length} ${x.pages.length === 1 ? t('pages') : t('pages_plural')}` })),
          h('button', { class: 'btn small', type: 'button', text: t('add'), onclick: () => addStep('stuti', x.id) })));
      });
    }

    function renderSeq() {
      cleanPath();
      const q = buildQueue();
      const pages = q.reduce((a, s) => a + s.pages.length, 0);
      const hasPos = S.pos && q.some((x) => x.id === S.pos.sid);
      seqBox.replaceChildren(h('h2', { text: t('buildSur') }));
      if (!S.path.length) {
        seqBox.append(h('p', { class: 'muted', text: t('nothingYet') }));
        return;
      }
      const ol = h('ol', { class: 'steps' });
      S.path.forEach((st, i) => {
        const info = stepInfo(st);
        if (!info) return;
        ol.append(h('li', null,
          h('div', { class: 'name' }, h('b', { text: info.name }), h('span', { class: 'muted', text: info.sub || '' })),
          h('button', { class: 'btn small', type: 'button', text: '▲', disabled: i === 0, onclick: () => move(i, -1) }),
          h('button', { class: 'btn small', type: 'button', text: '▼', disabled: i === S.path.length - 1, onclick: () => move(i, 1) }),
          h('button', { class: 'btn small danger', type: 'button', text: '✕', onclick: () => { S.path.splice(i, 1); saveLocal(); renderSeq(); } })));
      });
      seqBox.append(ol,
        h('p', { class: 'muted', text: `${q.length} ${t('stuti')} · ${pages} ${pages === 1 ? t('pages') : t('pages_plural')}` }),
        h('div', { class: 'row' },
          link(t('start'), '#/read', 'primary'),
          hasPos ? link(t('resume'), '#/read?resume=1') : null,
          link(t('edit'), '#/path', 'ghost')));
    }

    app.append(h('div', { class: 'screen' },
      renderLangToggle(),
      h('div', { class: 'hero' },
        h('div', { class: 'logo', text: 'सुर' }),
        h('p', { class: 'muted', text: t('yourPrayers') })),
      libraryBox, seqBox));
    renderLibrary(); renderSeq();
  }

  /* ---------- Path builder ---------- */
  function viewPath(app, welcome) {
    const seqBox = h('section', { class: 'card' });
    const addBox = h('section', { class: 'card' });
    const startRow = h('div', { class: 'row' });

    function renderSeq() {
      seqBox.replaceChildren(h('h2', { text: t('yourSequence') }));
      cleanPath();
      if (!S.path.length) {
        seqBox.append(h('p', { class: 'muted', text: t('nothingYet') }));
      } else {
        const ol = h('ol', { class: 'steps' });
        S.path.forEach((st, i) => {
          const info = stepInfo(st);
          if (!info) return;
          ol.append(h('li', null,
            h('div', { class: 'name' }, h('b', { text: info.name }), h('span', { class: 'muted', text: info.sub || '' })),
            h('button', { class: 'btn small', type: 'button', text: '▲', disabled: i === 0, onclick: () => move(i, -1) }),
            h('button', { class: 'btn small', type: 'button', text: '▼', disabled: i === S.path.length - 1, onclick: () => move(i, 1) }),
            h('button', { class: 'btn small danger', type: 'button', text: '✕', onclick: () => { S.path.splice(i, 1); saveLocal(); redraw(); } })));
        });
        seqBox.append(ol);
      }
      startRow.replaceChildren(
        h('a', { class: 'btn primary', href: S.path.length ? '#/read' : null, text: t('start'), onclick: (e) => { if (!S.path.length) { e.preventDefault(); toast(t('addFirst')); } } }));
    }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= S.path.length) return;
      [S.path[i], S.path[j]] = [S.path[j], S.path[i]];
      saveLocal(); redraw();
    }
    function addStep(type, id) { S.path.push({ type, id }); saveLocal(); redraw(); }
    function renderAdd() {
      addBox.replaceChildren(h('h2', { text: t('addToSequence') }),
        h('p', { class: 'muted', text: t('addToSequenceDesc') }));
      S.collections.forEach((c) => {
        const items = stutisIn(c.id);
        addBox.append(h('details', null,
          h('summary', null,
            h('span', { class: 't', text: `${translateDisplay(c.name)} (${items.length})` }),
            h('button', { class: 'btn small', type: 'button', text: t('wholeCollection'), disabled: !items.length,
              onclick: (e) => { e.preventDefault(); e.stopPropagation(); addStep('collection', c.id); } })),
          items.length
            ? items.map((x) => h('div', { class: 'item' },
              h('div', { class: 'name' }, h('b', { text: translateDisplay(x.title) }), h('span', { class: 'muted', text: `${langName(x.lang)} · ${x.pages.length} ${x.pages.length === 1 ? t('pages') : t('pages_plural')}` })),
              h('button', { class: 'btn small', type: 'button', text: t('add'), onclick: () => addStep('stuti', x.id) })))
            : h('p', { class: 'muted', text: t('noStutis') })));
      });
      addBox.append(h('div', { class: 'row', style: 'margin-top:10px' }, link(t('writeNew'), '#/add', 'small ghost')));
    }
    function redraw() {
      const open = [...addBox.querySelectorAll('details')].map((d) => d.open);
      renderSeq(); renderAdd();
      addBox.querySelectorAll('details').forEach((d, i) => { d.open = !!open[i]; });
    }

    app.append(h('div', { class: 'screen' },
      renderLangToggle(),
      welcome ? h('div', { class: 'hero' }, h('div', { class: 'logo', text: 'सुर' })) : null,
      h('h1', { text: welcome ? t('buildSur') : t('editSur') }),
      seqBox, startRow, addBox));
    renderSeq(); renderAdd();
  }

  /* ---------- Reader ---------- */
  function viewRead(app, params) {
    const single = params.get('s');
    const queue = single ? [stutiOf(single)].filter(Boolean) : buildQueue();
    if (!queue.length) {
      app.append(h('div', { class: 'screen' }, renderLangToggle(), h('h1', { text: t('nothingToRead') }), link(t('buildSur'), '#/path', 'primary')));
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
    const prevBtn = h('button', { class: 'btn', type: 'button', text: '◀ ' + t('back'), onclick: () => prev() });
    const nextBtn = h('button', { class: 'btn primary', type: 'button', text: t('next') + ' ▶', onclick: () => next() });
    const viewSeg = h('div', { class: 'seg' });

    function renderSeg() {
      viewSeg.replaceChildren(...[['orig', t('original')], ['roman', t('english')], ['both', t('both')]].map(([k, l]) =>
        h('button', { type: 'button', class: S.settings.view === k ? 'on' : '', text: l, onclick: () => { S.settings.view = k; saveLocal(); renderSeg(); draw(); } })));
    }
    const setSize = (d) => { S.settings.size = Math.max(14, Math.min(48, S.settings.size + d)); saveLocal(); draw(); };

    const topbar = h('div', { class: 'topbar' },
      h('div', { class: 'row between' },
        h('a', { class: 'btn small ghost', href: single ? '#/library' : '#/', text: '✕ ' + t('close') }),
        h('div', { class: 'row' },
          renderLangToggle(),
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
        stage.append(h('div', { class: 'done' }, h('h2', { text: t('completed') }),
          h('div', { class: 'row', style: 'justify-content:center' },
            btn(t('startAgain'), () => { qi = 0; pi = 0; done = false; draw(); }, 'primary'),
            link(t('chooseAnother'), '#/select', 'ghost'),
            link(t('home'), '#/', 'ghost'))));
        fill.style.width = '100%'; titleEl.textContent = t('completed'); subEl.textContent = '';
        pageLabel.textContent = ''; nextBtn.disabled = true; prevBtn.disabled = false;
        return;
      }
      const st = queue[qi], pg = st.pages[pi];
      const collections = collectionsOf(st);
      titleEl.textContent = translateDisplay(st.title);
      subEl.textContent = `${collections.length ? collections.map((c) => translateDisplay(c.name)).join(', ') + ' · ' : ''}${t('stuti')} ${qi + 1} ${t('of')} ${queue.length}`;
      pageLabel.textContent = `${t('pageLabel')} ${pi + 1}/${st.pages.length}`;
      const before = queue.slice(0, qi).reduce((a, s) => a + s.pages.length, 0) + pi + 1;
      fill.style.width = (before / total * 100) + '%';
      prevBtn.disabled = qi === 0 && pi === 0;
      nextBtn.disabled = false;
      nextBtn.textContent = (qi === queue.length - 1 && pi === st.pages.length - 1) ? t('completed') + ' ✓' : t('next') + ' ▶';
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
          link(t('read'), '#/read?s=' + encodeURIComponent(s.id), 'small primary'),
          h('button', { class: 'btn small', type: 'button', text: ' ' + t('copy'), onclick: () => {
            const copy = clone(s);
            copy.id = uid();
            copy.isPrivate = true;
            copy.collectionId = ensureArray(copy.collectionId).filter(id => id !== 'cloud-collection');
            if (!copy.collectionId.length) {
              const mine = S.collections.find((c) => !c.builtin) || S.collections[0];
              copy.collectionId = [mine.id];
            }
            S.customStutis.push(copy);
            S.stutis.push(copy);
            saveLocal();
            toast(t('copiedToLibrary'));
            draw();
          }})
        ];
        
        if (!s.isPrivate) {
          buttons.push(h('button', { class: 'btn small', type: 'button', text: ' ' + t('shareLink'), onclick: () => {
            if (confirm(`Share link:\n${shareUrl}\n\nCopy to clipboard?`)) {
              navigator.clipboard.writeText(shareUrl);
              toast('Share link copied to clipboard!');
            }
          }}));
        }
        
        list.append(h('div', { class: 'item' },
          h('div', { class: 'name' },
            h('b', { text: translateDisplay(s.title) }),
            h('span', { class: 'muted', text: `${langName(s.lang)} · ${s.pages.length} ${s.pages.length === 1 ? t('pages') : t('pages_plural')}` })),
          ...buttons));
      });
    }
    
    app.append(h('div', { class: 'screen' },
      renderLangToggle(),
      h('div', { class: 'hero' },
        h('div', { class: 'logo', text: 'सुर' }),
        h('p', { class: 'muted', text: t('quickReadDesc') })),
      list));
    draw();
  }

  /* ---------- Library ---------- */
  function viewLibrary(app) {
    const q = h('input', { type: 'search', placeholder: t('search') });
    const categoryFilter = h('select', {},
      h('option', { value: '', text: t('all') }),
      CATEGORIES.map(([id]) => h('option', { value: id, text: categoryName(id) })));
    const list = h('div');
    
    // Create new collection dialog
    function showCreateCollectionDialog() {
      const nameInput = h('input', { type: 'text', placeholder: t('enterCollectionName') });
      const dialog = h('div', { class: 'dialog', style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000' },
        h('div', { class: 'card', style: 'padding:20px;max-width:400px;width:90%' },
          h('h2', { text: t('createCollection') }),
          nameInput,
          h('div', { class: 'row', style: 'margin-top:20px' },
            btn(t('cancel'), () => dialog.remove(), 'ghost'),
            btn(t('save'), () => {
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
      const authorText = (x.authorName && x.authorName !== 'Local User' && !x.isPrivate) ? t('by') + ' ' + x.authorName + ' · ' : '';
      const isFromCloud = ensureArray(x.collectionId).includes('cloud-collection');
      const isCustom = S.customStutis.some(s => s.id === x.id);
      
      const buttons = [
        link(t('read'), '#/read?s=' + encodeURIComponent(x.id), 'small primary'),
        h('button', { class: 'btn small', type: 'button', text: ' ' + t('copy'), onclick: () => {
          const copy = clone(x);
          copy.id = uid();
          copy.isPrivate = true;
          copy.collectionId = ensureArray(copy.collectionId).filter(id => id !== 'cloud-collection');
          if (!copy.collectionId.length) {
            const mine = S.collections.find((c) => !c.builtin) || S.collections[0];
            copy.collectionId = [mine.id];
          }
          S.customStutis.push(copy);
          S.stutis.push(copy);
          saveLocal();
          toast('Copied to your library');
          draw();
        }}),
        !x.isPrivate ? h('button', { class: 'btn small', type: 'button', text: ' ' + t('shareLink'), onclick: () => {
          if (confirm(`Share link:\n${shareUrl}\n\nCopy to clipboard?`)) {
            navigator.clipboard.writeText(shareUrl);
            toast('Share link copied to clipboard!');
          }
        }}) : null
      ];

      if (sudoMode || isCustom) {
        buttons.push(link(t('edit'), '#/edit/' + encodeURIComponent(x.id), 'small'));
      }
      
      if (!isFromCloud || sudoMode) {
        buttons.push(h('button', { class: 'btn small danger', type: 'button', text: t('delete'), onclick: () => {
          const confirmation = isFromCloud
            ? 'Hide this cloud stuti from this device? This will not delete its row from Google Sheets.'
            : t('deleteConfirm');
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
          h('b', { text: translateDisplay(x.title) }),
          h('span', { class: 'muted', text: `${categoryName(x.category || 'stuti')} · ${langName(x.lang)} · ${authorText}${x.pages.length} ${x.pages.length === 1 ? t('pages') : t('pages_plural')}` })),
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
        const isCloud = c.id === CLOUD_COLLECTION_ID;
        const headerButtons = (term || category) ? null : h('div', { class: 'row' },
          isCloud ? btn('⟳ ' + t('update'), () => fetchCloudStutis(true), 'small') : null,
          h('button', { class: 'btn small', type: 'button', text: t('wholeCollection'), disabled: !items.length,
            onclick: () => { S.path.push({ type: 'collection', id: c.id }); saveLocal(); toast(t('addedToSur')); } }));
        list.append(h('section', { class: 'card' },
          h('div', { class: 'row between' }, h('h3', { text: translateDisplay(c.name) }), headerButtons),
          items.length ? items.map(row) : h('p', { class: 'muted', text: t('noStutis') })));
      });
      if (!list.children.length) list.append(h('p', { class: 'muted', text: term || category ? t('noMatches') : t('noCollectionsYet') }));
    }
    q.addEventListener('input', draw);
    categoryFilter.addEventListener('change', draw);
    app.append(h('div', { class: 'screen' },
      renderLangToggle(),
      h('div', { class: 'row between' }, h('h1', { text: t('libraryTitle') }), 
        h('div', { class: 'row' },
          btn(t('createCollection'), showCreateCollectionDialog, 'small ghost'),
          link(t('addTitle'), '#/add', 'primary'))),
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
    const titleIn = h('input', { type: 'text', placeholder: t('title'), value: d.title, oninput: (e) => { d.title = e.target.value; } });
    const deityIn = h('input', { type: 'text', placeholder: t('deity') + ' (optional)', value: d.deity || '', oninput: (e) => { d.deity = e.target.value; } });
    const authorIn = h('input', { type: 'text', placeholder: t('publisherName'), value: d.authorName, oninput: (e) => { d.authorName = e.target.value; } });
    
    const privacySel = h('select', {
      onchange: (e) => { 
        d.isPrivate = e.target.value === 'private';
        authorIn.style.display = d.isPrivate ? 'none' : 'block';
      }
    },
      h('option', { value: 'public', selected: !d.isPrivate, text: t('publicOption') }),
      h('option', { value: 'private', selected: d.isPrivate, text: t('privateOption') })
    );

    const catSel = h('select', { onchange: (e) => { d.category = e.target.value; } },
      CATEGORIES.map(([c]) => h('option', { value: c, selected: c === d.category, text: categoryName(c) })));

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
        return h('label', { class: 'row', style: 'margin:0 0 8px' }, checkbox, h('span', { text: `${translateDisplay(c.name)} (${stutisIn(c.id).length})` }));
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
            h('h3', { text: t('cropImage') }),
            img,
            h('div', { class: 'row', style: 'margin-top:10px' },
              btn(t('cropExtract'), async () => {
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
        const textTa = h('textarea', { rows: 8, placeholder: t('typePageContent') });
        textTa.value = pg.text;
        textTa.addEventListener('input', () => { 
          pg.text = textTa.value;
          updateTranslitPreview();
        });
        
        const translitTa = h('textarea', { rows: 8, placeholder: t('englishTranslitPlaceholder') });
        translitTa.value = pg.translit || autoRoman(pg.text, d.lang);
        translitTa.addEventListener('input', () => { 
          pg.translit = translitTa.value;
        });
        
        const card = h('div', { class: 'page-card' },
          h('b', { text: `${t('pageLabel')} ${i + 1}` }),
          h('div', { class: 'row' },
            btn(t('camera'), () => camInput.click(), 'small ghost'),
            btn(t('uploadPhoto'), () => fileInput.click(), 'small ghost')
          ),
          h('label', { text: t('original') + ' ' + t('textLabel') }),
          textTa,
          h('label', { text: t('english') + ' (' + t('editable') + ')' }),
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

    const saveBtn = btn(existing ? t('save') : t('save'), async () => {
      // Get transliteration values from the textareas
      const translitTextareas = pagesBox.querySelectorAll('textarea:nth-of-type(2)');
      d.pages.forEach((pg, i) => {
        if (translitTextareas[i]) {
          pg.translit = translitTextareas[i].value.trim() || null;
        }
      });
      
      const pages = d.pages.filter((p) => p.text.trim()).map((p) => ({ text: p.text.replace(/\s+$/, ''), translit: p.translit }));
      if (!d.title.trim()) return toast(t('pleaseAddTitle'));
      if (!pages.length) return toast(t('addAtLeastOnePage'));
      if (!d.isPrivate && !d.authorName.trim()) return toast(t('pleaseEnterAuthor'));
      if (existing && !isLocallyEditable && !sudoMode) return toast('Admin mode is required to edit this stuti');
      if (!d.isPrivate) ensureCloudCollection();

      const rec = {
        id: d.id,
        title: d.title.trim(),
        deity: (d.deity || '').trim(),
        category: d.category,
        lang: d.lang,
        authorName: d.isPrivate ? 'Local User' : d.authorName.trim(),
        collectionId: d.isPrivate
          ? ensureArray(d.collectionId)
          : [...new Set([...ensureArray(d.collectionId), CLOUD_COLLECTION_ID])],
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
      renderLangToggle(),
      h('h1', { text: existing ? t('editTitle') : t('addTitle') }),
      h('label', { text: t('title') }), titleIn,
      h('label', { text: t('deity') + ' (optional)' }), deityIn,
      h('label', { text: t('category') }), catSel,
      h('label', { text: t('collections') }), collBox,
      h('label', { text: t('private') + ' / ' + t('public') }), privacySel,
      h('label', { text: t('publisherName') }), authorIn,
      h('label', { text: t('language') }), langSel,
      pagesBox,
      btn('+ ' + t('addPage'), () => { d.pages.push({ text: '', translit: null }); renderPages(); }, 'small'),
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
    }, h('option', { value: 'dark', selected: S.settings.theme === 'dark', text: t('dark') }),
       h('option', { value: 'light', selected: S.settings.theme === 'light', text: t('light') }));

    const passwordInput = h('input', { type: 'password', autocomplete: 'current-password', placeholder: t('adminPassword') });
    const adminStatus = h('p', {
      class: 'muted',
      text: sudoMode ? t('adminUnlocked') : t('adminLocked')
    });
    const adminButton = btn(sudoMode ? t('lockAdmin') : t('unlockAdmin'), () => {
      if (sudoMode) {
        sudoMode = false;
        passwordInput.value = '';
        adminStatus.textContent = t('adminLocked');
        adminButton.textContent = t('unlockAdmin');
        toast(S.settings.uiLang === 'hi' ? 'व्यवस्थापक मोड लॉक किया गया' : 'Admin mode locked');
        return;
      }
      if (passwordInput.value !== ADMIN_PASSPHRASE) {
        passwordInput.value = '';
        passwordInput.focus();
        return toast(S.settings.uiLang === 'hi' ? 'गलत पासवर्ड' : 'Incorrect password');
      }
      sudoMode = true;
      passwordInput.value = '';
      adminStatus.textContent = t('adminUnlocked');
      adminButton.textContent = t('lockAdmin');
      toast(S.settings.uiLang === 'hi' ? 'व्यवस्थापक मोड खुला' : 'Admin mode unlocked');
    }, 'primary');
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') adminButton.click();
    });

    app.append(h('div', { class: 'screen' },
      renderLangToggle(),
      h('h1', { text: t('settingsTitle') }),
      h('section', { class: 'card' },
        h('h2', { text: t('appearance') }),
        h('label', { text: t('theme') }), themeSel),
      h('section', { class: 'card' },
        h('h2', { text: t('adminMode') }),
        adminStatus,
        h('label', { text: t('adminPassword') }), passwordInput,
        h('div', { class: 'row', style: 'margin-top:12px' }, adminButton),
        h('p', { class: 'muted', text: t('adminNote') })),
      h('p', { class: 'muted', style: 'text-align:center;margin-top:18px', text: 'Sur v' + APP_VERSION })));
  }

  // Service worker registration for offline support.
  // When a new worker takes control (e.g. after a cache-name bump in sw.js),
  // reload once so open tabs pick up the new assets instead of the old cached ones.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    let reloadedForNewWorker = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedForNewWorker) return;
      reloadedForNewWorker = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Initial immediate route render so app opens with zero delay, then init cloud
  route();
  initCloud();
})();
