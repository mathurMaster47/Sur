/* Sur - in-browser transliteration of Indic scripts into English letters.
 * Rule based, no network, no API. Works by mapping Bengali/Assamese, Gurmukhi,
 * Gujarati and Odia onto the Devanagari block (the Unicode blocks are laid out
 * in parallel), then converting to Latin with schwa-deletion for Hindi-type
 * languages. Output is a friendly "how you would sing it" spelling, not a
 * scholarly scheme. Users can always edit the result.
 */
(function (root) {
  'use strict';

  // [start, end, offset to subtract to land in Devanagari]
  var RANGES = [
    [0x0980, 0x09FF, 0x80],  // Bengali / Assamese
    [0x0A00, 0x0A7F, 0x100], // Gurmukhi
    [0x0A80, 0x0AFF, 0x180], // Gujarati
    [0x0B00, 0x0B7F, 0x200]  // Odia
  ];

  function toDeva(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c === 0x200C || c === 0x200D) continue;     // joiners
      if (c === 0x0A71) continue;                      // Gurmukhi addak (gemination), skipped
      if (c === 0x0A70) { out += 'ं'; continue; } // Gurmukhi tippi -> anusvara
      if (c === 0x09F0) { out += 'र'; continue; } // Assamese ra
      if (c === 0x09F1) { out += 'व'; continue; } // Assamese wa
      if (c === 0x09CE) { out += 'त्'; continue; } // Bengali khanda ta
      var mapped = c;
      for (var r = 0; r < RANGES.length; r++) {
        if (c >= RANGES[r][0] && c <= RANGES[r][1]) { mapped = c - RANGES[r][2]; break; }
      }
      out += String.fromCharCode(mapped);
    }
    return out;
  }

  var CONS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'ळ': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ऩ': 'n', 'ऱ': 'r', 'ऴ': 'l'
  };
  // consonant + nukta
  var NUKTA = {
    'क': 'q', 'ख': 'kh', 'ग': 'g', 'ज': 'z',
    'ड': 'r', 'ढ': 'rh', 'फ': 'f'
  };
  var MATRA = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ॅ': 'e', 'ॉ': 'o', 'ॆ': 'e', 'ॊ': 'o'
  };
  var VOWEL = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u',
    'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o',
    'औ': 'au', 'ऑ': 'o', 'ऍ': 'e', 'ऎ': 'e', 'ऒ': 'o'
  };
  var DIGITS = '०१२३४५६७८९';

  // Languages whose written inherent "a" is pronounced "o" (Bengali family)
  var INHERENT_O = { bn: 1, as: 1, or: 1 };
  // Languages where we keep every inherent "a" (Sanskrit recitation) or where
  // schwa deletion rules differ (Bengali family)
  var NO_DELETE = { sa: 1, bn: 1, as: 1, or: 1 };

  function tokenise(word) {
    var out = [], i = 0, n = word.length;

    function coda() {
      var c = '';
      while (i < n) {
        var m = word[i];
        if (m === 'ं') { c += 'n'; i++; }
        else if (m === 'ँ') { c += (i + 1 >= n ? '' : 'n'); i++; }
        else if (m === 'ः') { c += 'h'; i++; }
        else break;
      }
      return c;
    }

    while (i < n) {
      var ch = word[i];
      if (CONS[ch]) {
        var onset = '';
        for (;;) {
          var c = word[i], lat = CONS[c];
          i++;
          if (word[i] === '़') { lat = NUKTA[c] || lat; i++; }
          onset += lat;
          if (word[i] === '्' && word[i + 1] && CONS[word[i + 1]]) { i++; continue; }
          break;
        }
        onset = onset.replace('jny', 'gy');
        var vowel = null; // null = inherent vowel
        if (MATRA[word[i]] !== undefined) { vowel = MATRA[word[i]]; i++; }
        else if (word[i] === '्') { vowel = ''; i++; }
        out.push({ onset: onset, vowel: vowel, coda: coda() });
      } else if (VOWEL[ch] !== undefined) {
        i++;
        out.push({ onset: '', vowel: VOWEL[ch], coda: coda() });
      } else if (ch === 'ॐ') {
        out.push({ raw: 'om' }); i++;
      } else if (ch === 'ऽ') {
        out.push({ raw: "'" }); i++;
      } else {
        var d = DIGITS.indexOf(ch);
        out.push({ raw: d >= 0 ? String(d) : '' });
        i++;
      }
    }
    return out;
  }

  function renderWord(sy, lang, style) {
    var inh = INHERENT_O[lang] ? 'o' : 'a';
    var n = sy.length, del = [], k;
    for (k = 0; k < n; k++) del[k] = false;

    if (!NO_DELETE[lang] && n > 1) {
      var last = sy[n - 1];
      if (last.vowel === null && !last.coda) del[n - 1] = true;
      for (k = n - 2; k >= 1; k--) {
        var s = sy[k], nx = sy[k + 1];
        if (s.vowel === null && !s.coda && nx.vowel) del[k] = true;
      }
    }

    var res = '';
    for (k = 0; k < n; k++) {
      var t = sy[k];
      if (t.raw !== undefined) { res += t.raw; continue; }
      var v;
      if (t.vowel === null) v = del[k] ? '' : inh;
      else v = (style === 'simple' && t.vowel === 'aa') ? 'a' : t.vowel;
      var cd = t.coda;
      if (cd === 'n' && sy[k + 1] && /^(p|b|m)/.test(sy[k + 1].onset || '')) cd = 'm';
      else if (cd.length > 1) cd = cd.replace(/n+/g, 'n');
      res += t.onset + v + cd;
    }
    return res;
  }

  /**
   * @param {string} text   text in any supported script
   * @param {string} lang   language code: hi, mr, sa, ne, gu, pa, bn, as, or ...
   * @param {string} style  'standard' (aa, ee, oo) or 'simple' (aa -> a)
   */
  function transliterate(text, lang, style) {
    if (text == null) return '';
    var s = toDeva(String(text)).normalize('NFD');
    s = s.replace(/।/g, '.').replace(/॥/g, '..');
    s = s.replace(/[ऀ-ॣ०-ॿ]+/g, function (w) {
      return renderWord(tokenise(w), lang, style || 'standard');
    });
    return s;
  }

  var api = { transliterate: transliterate, toDeva: toDeva };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Translit = api;
})(typeof window !== 'undefined' ? window : this);
