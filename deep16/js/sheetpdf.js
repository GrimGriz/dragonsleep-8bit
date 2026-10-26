/* DEEP16 — the character sheet as a PDF (10-26; Griz: "Somewhere in the pocket DM - reference user interface best practices - players should be
   able to save pdf of character sheet"). Where: a PDF button on each card of THE PARTY beside GEAR (the character's own place; the hint line names it
   when it is chosen), and SHEET PDF on the maker's last page; each saves at one press, a real file named for the character, and says the file's name
   (js/pocket.js). What: a sheet for the table -- one Letter page that A4 prints whole, in the order a 5e sheet keeps: the six scores with their saves
   and skills down the left; armour, hit points, hit dice, speed, initiative, proficiency and passive Perception across the top; then the attacks, the
   uses, the gear, the features and the spells in a column that runs on to a second page when it must. Ink-light: black on white, grey rules, and
   empty boxes and circles for a pencil (hit points on the day, slots and uses spent, a skill the Pocket DM does not keep).
   Every number is the engine's own reading -- R.ac, R.attackBonus, R.damageExpr, R.saveBonus, R.skill, R.spellDC, D16.FEATURES' words, the spells'
   own lines -- so the paper and the grid never disagree. No library: the PDF is written here in the reader's own Helvetica (one of the fourteen
   fonts every reader has; its widths below, for the wrap) and Courier for the character's word.
     D.sheetPdf.model(h, o)   the sheet's words and numbers -- o: { word, xp, at } -- the bench reads it
     D.sheetPdf.bytes(m)      the PDF of a model, a string of one-byte characters
     D.sheetPdf.fileName(m)   brokk-fighter5-sheet.pdf
     D.sheetPdf.save(h, o)    the model, the PDF and the download; the file's name, or null when the browser would not */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, R = DS.R, NPC = D.npc;
  var SP = D.sheetPdf = {};

  // ------------------------------------------------------------------ the sheet's words and numbers
  var ABIL_NAME = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
  // the eighteen skills of the SRD 5.1 and their abilities: the Pocket DM keeps the ones the grid reads (a class card's Stealth and Perception, a hero's
  // own list); the rest stand at the ability's modifier with an empty circle, for the table to mark its own
  SP.SKILLS = [['Acrobatics', 'dex'], ['Animal Handling', 'wis'], ['Arcana', 'int'], ['Athletics', 'str'], ['Deception', 'cha'], ['History', 'int'], ['Insight', 'wis'],
    ['Intimidation', 'cha'], ['Investigation', 'int'], ['Medicine', 'wis'], ['Nature', 'int'], ['Perception', 'wis'], ['Performance', 'cha'], ['Persuasion', 'cha'],
    ['Religion', 'int'], ['Sleight of Hand', 'dex'], ['Stealth', 'dex'], ['Survival', 'wis']];
  // the per-rest uses the sheet keeps (h.feats), in the order a turn reaches for them; a pool (Lay on Hands) is a number to count down, not boxes
  var USES = [['rage', 'Rage', 'long rest'], ['secondWind', 'Second Wind', 'short rest'], ['actionSurge', 'Action Surge', 'short rest'], ['channel', 'Channel Divinity', 'short rest'],
    ['wildShape', 'Wild Shape', 'short rest'], ['ki', 'Ki points', 'short rest'], ['sorcery', 'Sorcery points', 'long rest'], ['inspiration', 'Bardic Inspiration', 'long rest'],
    ['lay', 'Lay on Hands (hit points)', 'long rest', true], ['divineSense', 'Divine Sense', 'long rest'], ['darkLuck', 'Dark One\'s Own Luck', 'short rest'],
    ['relentless', 'Relentless Endurance', 'long rest']];
  var PLACES = [['weapon', 'WEAPON'], ['alt', 'SECOND WEAPON'], ['armor', 'ARMOR'], ['shield', 'SHIELD'], ['offhand', 'OFF HAND'], ['ring', 'RING'], ['ring2', 'RING'], ['cloak', 'CLOAK'], ['feet', 'FEET'], ['neck', 'NECK']];
  var plain = function (s) { return String(s == null ? '' : s).replace(/\{\/?[a-z]{0,2}\}/g, '').replace(/\s+/g, ' ').trim(); }; // (the game's colour marks off: {y}..{/})
  var sgn = function (n) { return (n >= 0 ? '+' : '') + n; };
  var item = function (id) { return id ? (DS.DATA.items[id] || null) : null; };
  var ord = function (n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); };
  var cap1 = function (s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  function dmgWord(dx) { return dx.dice === '0' ? String(Math.max(1, dx.mod)) : dx.dice + (dx.mod ? (dx.mod > 0 ? '+' : '') + dx.mod : ''); }
  function raceOf(h, hero) {
    if (h.race && NPC.RACES[h.race]) return NPC.RACES[h.race];
    var want = String((hero && hero.race) || h.race || '').toLowerCase().replace(/[^a-z]/g, ''), out = null;
    Object.keys(NPC.RACES).forEach(function (k) { if (k === want || NPC.RACES[k].name.toLowerCase().replace(/[^a-z]/g, '') === want) out = NPC.RACES[k]; });
    return out;
  }
  function spellOf(id) { return (D.magic && D.magic.data(id)) || null; }
  // the book as STATUS lists it (js/menu.js bookOf): what it knows, the paladin's list to its slots, the oath's own
  function bookOf(h) {
    var ids = (h.known || []).slice();
    if (h.cls === 'paladin' && R.PALADIN_SPELLS && R.maxSlotLevel(h) > 0) ids = ids.concat(R.PALADIN_SPELLS.filter(function (id) { var s = spellOf(id); return s && s.level <= R.maxSlotLevel(h); }));
    if (R.oathSpells) ids = ids.concat(R.oathSpells(h));
    return ids.filter(function (id, i, a) { return spellOf(id) && a.indexOf(id) === i; });
  }
  function weaponRow(h, w, o) {
    o = o || {};
    var dx = o.off && R.offhandDamage ? R.offhandDamage(h, w) : R.damageExpr(h, w), wd = w.weapon || {}, props = (wd.props || []).filter(function (p) { return p !== 'ranged'; });
    var notes = [];
    if (o.note) notes.push(o.note);
    if (wd.range) notes.push('range ' + wd.range.join('/') + ' ft');
    if (wd.versatile && !(props.indexOf('two-handed') >= 0)) notes.push('versatile ' + wd.versatile);
    props.filter(function (p) { return p !== 'versatile'; }).forEach(function (p) { notes.push(p); });
    if (w.id !== 'unarmed' && !R.isProfWeapon(h, w)) notes.push('not proficient');
    return { name: w.name, hit: sgn(R.attackBonus(h, w)), dmg: dmgWord(dx) + ' ' + (dx.type || ''), notes: notes.join(', ') };
  }
  // the race's own lines (SRD 5.1's traits, as the grid plays them: js/classes.js NPC.RACES and NPC.unit)
  function raceLines(h, race, hero) {
    var out = [], nm = (hero && hero.race) || (race && race.name) || '';
    if (!race) return out;
    if (race.dv) out.push({ name: 'Darkvision', words: 'You see in dim light within ' + race.dv + ' ft as if it were bright, and in darkness as if it were dim (shades of grey).' });
    if (race.fey) out.push({ name: 'Fey Ancestry', words: 'Advantage on saving throws against being charmed; magic cannot put you to sleep.' });
    if (race.resist) out.push({ name: nm + ' Resilience', words: 'Resistance to ' + race.resist.join(' and ') + ' damage.' + (race.resist.indexOf('poison') >= 0 ? ' Advantage on saving throws against poison.' : '') });
    if (race.hpLevel) out.push({ name: 'Dwarven Toughness', words: '+' + race.hpLevel + ' hit point a level (in the maximum above).' });
    if (race.relentless) out.push({ name: 'Relentless Endurance', words: 'Dropped to 0 hit points but not killed outright, you drop to 1 instead. Once a long rest.' });
    if (race.savage) out.push({ name: 'Savage Attacks', words: 'A critical hit with a melee weapon rolls one of its damage dice once more and adds it.' });
    if (h.lupine) out.push({ name: 'Lupine Senses', words: 'Darkvision 60 ft; keen hearing and smell.' });
    return out;
  }

  SP.model = function (h, o) {
    o = o || {};
    var RC = R.CLASSES[h.cls] || { name: cap1(h.cls), hd: 8, saves: [], armor: [], weapons: [] }, hero = (h.id && DS.DATA.heroes[h.id]) || null, race = raceOf(h, hero);
    var prof = R.prof(h.lvl), heroExp = (hero && hero.expertise) || [];
    var m = { name: plain(h.name) || RC.name, cls: h.cls, lvl: h.lvl, at: o.at || new Date(), word: o.word || null };
    m.fullName = hero && hero.fullName && hero.fullName !== h.name ? plain(hero.fullName) : null;
    m.line = [RC.name + ' ' + h.lvl, h.subclass, (hero && hero.race) || (race && race.name), hero && hero.background].filter(Boolean).map(plain);
    m.xp = typeof o.xp === 'number' ? o.xp : null; m.next = (o.cap == null || h.lvl < o.cap) && R.XP_LEVEL ? R.XP_LEVEL[h.lvl + 1] || null : null; // (o.cap: the table's level cap -- none past it)
    m.abil = R.ABIL.map(function (a) { return { k: a, name: ABIL_NAME[a], score: h.abil[a], mod: DS.mod(h.abil[a]), save: R.saveBonus(h, a), saveProf: (h.saveProf || []).indexOf(a) >= 0 }; });
    m.skills = SP.SKILLS.map(function (s) {
      var known = !!(h.skills && h.skills[s[0]] != null);
      return { name: s[0], ab: s[1], val: R.skill(h, s[0], s[1]), prof: known, exp: known && ((h.expertise || []).indexOf(s[0]) >= 0 || heroExp.indexOf(s[0]) >= 0) };
    });
    var per = m.skills.filter(function (s) { return s.name === 'Perception'; })[0];
    m.passive = 10 + (per ? per.val : DS.mod(h.abil.wis));
    m.ac = R.ac(h); m.maxhp = h.maxhp; m.hd = h.lvl + 'd' + RC.hd; m.init = R.initBonus ? R.initBonus(h) : DS.mod(h.abil.dex); m.prof = prof;
    if (!R.armored(h) && (h.known || []).indexOf('mageArmor') >= 0) { var ma = R.ac(Object.assign({}, h, { conds: Object.assign({}, h.conds, { mageArmor: 1 }) })); if (ma > m.ac) m.acNote = ma + ' with Mage Armor'; }
    // speed and senses as the grid's unit takes them (js/classes.js NPC.unit): the race's, a monk's unarmored movement, a barbarian's fast movement
    m.speed = ((race && race.speed) || 30) + (h.cls === 'monk' && h.lvl >= 2 ? (h.lvl >= 6 ? 15 : 10) : 0) + (h.cls === 'barbarian' && h.lvl >= 5 ? 10 : 0);
    var dv = Math.max((race && race.dv) || 0, h.lupine ? 60 : 0), inv = h.invocations || [];
    m.senses = [];
    if (inv.indexOf('devilsight') >= 0) m.senses.push('Devil\'s Sight 120 ft (magical darkness too)');
    if (dv) m.senses.push('darkvision ' + dv + ' ft');
    m.senses.push('passive Perception ' + m.passive);
    var res = ((race && race.resist) || []).concat(h.resist || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
    if (res.length) m.senses.push('resists ' + res.join(', '));
    m.profs = { armor: (RC.armor || []).map(function (a) { return a === 'robe' ? 'robes' : a === 'shield' ? 'shields' : a; }), weapons: (RC.weapons || []).map(function (w) { var it = item(w); return it ? it.name.toLowerCase() : w; }) };
    // the attacks: the weapon in hand, the second one carried, the off hand's swing
    m.attacks = [];
    var w = R.weaponOf(h); m.attacks.push(weaponRow(h, w));
    var alt = item(h.alt); if (alt && alt.weapon && alt.id !== w.id) m.attacks.push(weaponRow(h, alt, { note: 'carried' }));
    var oh = item(h.equip && h.equip.offhand);
    if (oh && oh.weapon) { var tw = R.twoWeapon ? R.twoWeapon(h) : { ok: true }; m.attacks.push(weaponRow(h, oh, { off: true, note: tw.ok ? 'off hand, a bonus action' : 'held: ' + (tw.why || 'no off-hand swing') })); }
    m.perTurn = R.attacksPerTurn(h); m.crit = R.critRange(h);
    var st = R.style(h); m.style = st && R.STYLES[st] ? { name: R.STYLES[st].name, words: R.STYLES[st].words } : null;
    // the uses: the per-rest features as a fresh sheet holds them
    m.uses = [];
    USES.forEach(function (u) { var n = h.feats && h.feats[u[0]]; if (n > 0) m.uses.push({ name: u[1], n: n, rest: u[2], pool: !!u[3] }); });
    // the gear, place by place, with the item's own line; a bonded one marked
    m.gear = [];
    PLACES.forEach(function (p) {
      var id = p[0] === 'alt' ? h.alt : h.equip && h.equip[p[0]], it = item(id);
      if (!it || (p[0] === 'alt' && it.id === w.id)) return;
      var bond = it.attune ? (R.bonded(h, id) ? 'bonded' : 'bonds at a rest') : null;
      m.gear.push({ place: p[1], name: plain(it.name), words: plain(it.desc || ''), bond: bond });
    });
    // the features: a story hero's own lines (the 8-bit sheet's, as STATUS shows them); a class card's, the grid's register (D16.FEATURES) to its level
    // and subclass; then the race's, the choices a level made (metamagic, invocations, the pact, a feat)
    m.features = [];
    var sub = String(h.subclass || '').toLowerCase(), FE = D.FEATURES || {};
    var reg = Object.keys(FE).map(function (k) { return FE[k]; }).filter(function (f) { return f.cls === h.cls && f.lvl <= h.lvl && (!f.sub || String(f.sub).toLowerCase() === sub); }).sort(function (a, b) { return a.lvl - b.lvl; });
    var lines = hero && hero.featText && DS.MENU && DS.MENU.featureLines ? DS.MENU.featureLines(h) : null;
    if (lines && lines.length) lines.forEach(function (f) { // (a hero's line split at its first bracket or colon; one that says only its name takes the register's words -- "Second Wind 1d10+level")
      var t = plain(f.t), pa = /^([^:(]{2,40}?)\s*\((.*?)\)\s*,?\s*(.*)$/.exec(t), co = /^([^:(]{2,40}?):\s*(.*)$/.exec(t), ft;
      if (pa) ft = { name: pa[1], words: cap1(pa[2] + (pa[3] ? ', ' + pa[3] : '')) }; else if (co) ft = { name: co[1], words: cap1(co[2]) }; else ft = t.length > 44 ? { name: '', words: t } : { name: t, words: '' };
      if (!ft.words) { var fr = reg.filter(function (r) { return t.toLowerCase().indexOf(r.name.toLowerCase()) === 0; })[0]; if (fr) ft.words = plain(fr.words); }
      m.features.push(ft);
    });
    else reg.forEach(function (f) { m.features.push({ name: f.name, words: plain(f.words), lvl: f.lvl }); });
    var said = function (s) { s = s.toLowerCase(); return m.features.some(function (g) { return (g.name + ' ' + g.words).toLowerCase().indexOf(s) >= 0; }); }; // (a line already there is not said twice)
    if (m.style && !said(m.style.name)) m.features.push({ name: 'Fighting Style: ' + m.style.name, words: cap1(m.style.words) + '.' });
    raceLines(h, race, hero).forEach(function (f) { if (!said(f.name)) m.features.push(f); });
    (NPC.OPTIONS[h.cls] || []).forEach(function (op) {
      var cur = h[op.key]; if (!cur) return;
      (Array.isArray(cur) ? cur : [cur]).forEach(function (id) { var x = op.opts.filter(function (q) { return q.id === id; })[0]; if (x) m.features.push({ name: x.name, words: cap1(x.desc || '') + '.', tag: op.word }); });
    });
    if (h.cls === 'druid' && h.land) m.features.push({ name: 'Circle of the Land: ' + cap1(h.land), words: 'Its circle spells are always prepared.' });
    if (h.hunterDef) m.features.push({ name: { horde: 'Escape the Horde', multiattack: 'Multiattack Defense', steelwill: 'Steel Will' }[h.hunterDef] || h.hunterDef, words: 'Defensive Tactics.' });
    (h.featIds || []).forEach(function (id) { var ft = R.FEATS && R.FEATS[id]; if (ft) m.features.push({ name: ft.name + ' (feat)', words: plain(ft.desc) }); });
    // the spells: the ability, the save DC and the attack, the slots, the book by level (a prepared caster's day marked)
    m.spells = null;
    if (RC.caster || (h.known && h.known.length)) {
      var book = bookOf(h), ready = h.prepared && R.castable ? R.castable(h, 'field').concat(R.castable(h, 'battle')) : null, levels = [];
      book.forEach(function (id) {
        var s = spellOf(id), g = (D.SPELLS && D.SPELLS[id]) || {}, lv = s.level || 0, row = levels.filter(function (l) { return l.lv === lv; })[0];
        if (!row) { row = { lv: lv, list: [] }; levels.push(row); }
        var tags = [];
        if (g.shape === 'reaction') tags.push('reaction'); else if (g.time) tags.push(g.time === 'B' ? 'bonus action' : g.time === 'A' ? 'action' : String(g.time));
        if (g.shape === 'touch') tags.push('touch');
        else if (g.shape === 'cone' || g.shape === 'line') tags.push('self, ' + (g.len ? g.len + '-ft ' : '') + g.shape);
        else if (g.shape === 'self' || g.shape === 'around' || g.range === 0) tags.push('self');
        else if (g.range != null) tags.push(g.range + ' ft');
        if (g.conc) tags.push('concentration');
        if (s.ritual) tags.push('ritual');
        row.list.push({ id: id, name: plain(s.name), tags: tags.join(' · '), desc: plain(s.desc || ''), ready: ready ? ready.indexOf(id) >= 0 || lv === 0 : null });
      });
      levels.sort(function (a, b) { return a.lv - b.lv; });
      var ab = RC.cast || 'int';
      m.spells = book.length || h.slotsMax ? { ability: ABIL_NAME[ab], dc: R.spellDC(h), atk: sgn(R.spellAtk ? R.spellAtk(h) : R.prof(h.lvl) + DS.mod(h.abil[ab])), slots: (h.slotsMax || []).slice(), pact: RC.caster === 'pact', prepared: !!ready, levels: levels } : null;
    }
    m.about = hero ? [hero.blurb, hero.note].filter(Boolean).map(plain) : [];
    return m;
  };

  // ------------------------------------------------------------------ the PDF: Helvetica's widths (its AFM, a thousandth of the size), WinAnsi's codes
  var HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333,
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  var BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975,
    722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333,
    556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
  var HIGH = { 0x80: 556, 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350, 0x96: 556, 0x97: 1000, 0x99: 1000, 0xA0: 278, 0xA9: 737, 0xB0: 400, 0xB1: 584, 0xB7: 278, 0xBC: 834, 0xBD: 834, 0xBE: 834, 0xD7: 584, 0xF7: 584 };
  var HIGHB = { 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500 };
  var U2W = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b,
    'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99,
    'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f };
  var SWAP = { '−': '-', '→': '->', '←': '<-', '≤': '<=', '≥': '>=', '≈': '~', '‑': '-', '‐': '-', '­': '' };
  var FONTS = { R: 'F1', B: 'F2', I: 'F3', M: 'F4' }; // regular, bold, oblique (the regular's widths), Courier (600 each)
  // a string to WinAnsi's one-byte codes
  function codes(s) {
    var out = [];
    String(s).split('').forEach(function (ch) {
      var c = ch.charCodeAt(0);
      if (SWAP[ch] != null) { SWAP[ch].split('').forEach(function (x) { out.push(x.charCodeAt(0)); }); return; }
      if (c >= 32 && c < 127) out.push(c);
      else if (U2W[ch]) out.push(U2W[ch]);
      else if (c >= 0xA0 && c <= 0xFF) out.push(c);
      else if (c === 9 || c === 10) out.push(32);
      else out.push(63); // ?
    });
    return out;
  }
  function cw(c, f) {
    if (f === 'M') return 600;
    if (c >= 32 && c <= 126) return (f === 'B' ? BOLD : HELV)[c - 32];
    if (f === 'B' && HIGHB[c]) return HIGHB[c];
    if (HIGH[c]) return HIGH[c];
    return c >= 0xC0 && c <= 0xDE ? 700 : 540;
  }
  SP.width = function (s, f, size, tc) { var cs = codes(s), n = 0; cs.forEach(function (c) { n += cw(c, f); }); return n * size / 1000 + (tc || 0) * cs.length; };
  function pdfStr(s) { return '(' + codes(s).map(function (c) { return c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c > 126 ? '\\' + ('00' + c.toString(8)).slice(-3) : String.fromCharCode(c); }).join('') + ')'; }
  var n2 = function (v) { return (Math.round(v * 100) / 100).toString(); };

  // the page: drawn top-down (y from the top edge), written bottom-up as PDF wants it
  var PW = 612, PH = 792, M = 36;
  var INK = 0, TEXT = 0.12, GREY = 0.42, RULE = 0.62, PALE = 0.93;
  function Page(doc) { this.doc = doc; this.ops = []; }
  Page.prototype.text = function (s, x, y, f, size, o) {
    o = o || {}; s = String(s); if (!s) return 0;
    var w = SP.width(s, f, size, o.tc), x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    this.ops.push(n2(o.gray == null ? TEXT : o.gray) + ' g BT /' + FONTS[f] + ' ' + n2(size) + ' Tf ' + (o.tc ? n2(o.tc) + ' Tc ' : '') + n2(x0) + ' ' + n2(PH - y) + ' Td ' + pdfStr(s) + ' Tj ' + (o.tc ? '0 Tc ' : '') + 'ET');
    return w;
  };
  Page.prototype.line = function (x1, y1, x2, y2, o) { o = o || {}; this.ops.push(n2(o.gray == null ? RULE : o.gray) + ' G ' + n2(o.w || 0.5) + ' w ' + n2(x1) + ' ' + n2(PH - y1) + ' m ' + n2(x2) + ' ' + n2(PH - y2) + ' l S'); };
  Page.prototype.rect = function (x, y, w, h, o) {
    o = o || {}; var r = Math.min(o.r || 0, w / 2, h / 2), k = 0.5523 * r, X = x, Y = PH - y - h, p;
    if (r > 0) p = n2(X + r) + ' ' + n2(Y) + ' m ' + n2(X + w - r) + ' ' + n2(Y) + ' l ' + n2(X + w - r + k) + ' ' + n2(Y) + ' ' + n2(X + w) + ' ' + n2(Y + r - k) + ' ' + n2(X + w) + ' ' + n2(Y + r) + ' c '
      + n2(X + w) + ' ' + n2(Y + h - r) + ' l ' + n2(X + w) + ' ' + n2(Y + h - r + k) + ' ' + n2(X + w - r + k) + ' ' + n2(Y + h) + ' ' + n2(X + w - r) + ' ' + n2(Y + h) + ' c '
      + n2(X + r) + ' ' + n2(Y + h) + ' l ' + n2(X + r - k) + ' ' + n2(Y + h) + ' ' + n2(X) + ' ' + n2(Y + h - r + k) + ' ' + n2(X) + ' ' + n2(Y + h - r) + ' c '
      + n2(X) + ' ' + n2(Y + r) + ' l ' + n2(X) + ' ' + n2(Y + r - k) + ' ' + n2(X + r - k) + ' ' + n2(Y) + ' ' + n2(X + r) + ' ' + n2(Y) + ' c h';
    else p = n2(X) + ' ' + n2(Y) + ' ' + n2(w) + ' ' + n2(h) + ' re';
    var paint = o.fill != null && o.stroke !== false ? 'B' : o.fill != null ? 'f' : 'S';
    this.ops.push((o.fill != null ? n2(o.fill) + ' g ' : '') + n2(o.gray == null ? RULE : o.gray) + ' G ' + n2(o.w || 0.6) + ' w ' + p + ' ' + paint);
  };
  Page.prototype.circle = function (cx, cy, r, o) {
    o = o || {}; var k = 0.5523 * r, X = cx, Y = PH - cy;
    var p = n2(X + r) + ' ' + n2(Y) + ' m ' + n2(X + r) + ' ' + n2(Y + k) + ' ' + n2(X + k) + ' ' + n2(Y + r) + ' ' + n2(X) + ' ' + n2(Y + r) + ' c ' + n2(X - k) + ' ' + n2(Y + r) + ' ' + n2(X - r) + ' ' + n2(Y + k) + ' ' + n2(X - r) + ' ' + n2(Y) + ' c '
      + n2(X - r) + ' ' + n2(Y - k) + ' ' + n2(X - k) + ' ' + n2(Y - r) + ' ' + n2(X) + ' ' + n2(Y - r) + ' c ' + n2(X + k) + ' ' + n2(Y - r) + ' ' + n2(X + r) + ' ' + n2(Y - k) + ' ' + n2(X + r) + ' ' + n2(Y) + ' c h';
    this.ops.push((o.fill ? n2(INK + 0.15) + ' g ' : '') + n2(o.gray == null ? 0.35 : o.gray) + ' G ' + n2(o.w || 0.6) + ' w ' + p + ' ' + (o.fill ? 'B' : 'S'));
  };
  Page.prototype.boxes = function (n, x, y, o) { o = o || {}; var s = o.s || 7, g = o.g || 2.5; for (var i = 0; i < n; i++) this.rect(x + i * (s + g), y, s, s, { r: 1, gray: 0.35, w: 0.6 }); return n * (s + g) - g; };
  Page.prototype.heading = function (s, x, y, w) { this.text(s.toUpperCase(), x, y, 'B', 7.5, { tc: 0.9, gray: INK }); this.line(x, y + 3.5, x + w, y + 3.5, { gray: RULE, w: 0.6 }); };

  // a paragraph of runs ({ t, f, size, gray }) wrapped to a width: lines of { runs: [{ t, f, size, gray, w }], w, h }
  function wrapRuns(runs, width) {
    var lines = [], cur = [], curW = 0, curH = 0;
    var push = function () { lines.push({ runs: cur, w: curW, h: curH }); cur = []; curW = 0; curH = 0; };
    runs.forEach(function (r) {
      var toks = String(r.t).split(/(\s+)/).filter(function (t) { return t !== ''; });
      toks.forEach(function (tok) {
        var sp = /^\s+$/.test(tok); if (sp) tok = ' ';
        var tw = SP.width(tok, r.f, r.size);
        if (sp) { if (!cur.length) return; }
        else if (curW + tw > width && cur.length) { while (cur.length && /^ +$/.test(cur[cur.length - 1].t)) { curW -= cur[cur.length - 1].w; cur.pop(); } push(); }
        if (!sp && tw > width) { // (a word longer than the line -- the character's word in Courier: cut where it fills)
          var piece = '';
          tok.split('').forEach(function (ch) { if (SP.width(piece + ch, r.f, r.size) > width - curW && (piece || cur.length)) { cur.push({ t: piece, f: r.f, size: r.size, gray: r.gray, w: SP.width(piece, r.f, r.size) }); curW += SP.width(piece, r.f, r.size); curH = Math.max(curH, r.size); push(); piece = ''; } piece += ch; });
          tok = piece; tw = SP.width(tok, r.f, r.size);
        }
        var last = cur[cur.length - 1];
        if (last && last.f === r.f && last.size === r.size && last.gray === r.gray) { last.t += tok; last.w += tw; } else cur.push({ t: tok, f: r.f, size: r.size, gray: r.gray, w: tw });
        curW += tw; curH = Math.max(curH, r.size);
      });
    });
    if (cur.length) push();
    return lines;
  }

  // the flow: the right column of the first page, then the full width of each page after; a thing that does not fit begins the next frame
  function Flow(doc, first) { this.doc = doc; this.f = first; }
  Flow.prototype.room = function () { return this.f.bottom - this.f.y; };
  Flow.prototype.need = function (h) { if (this.room() < h) this.f = this.doc.nextFrame(); return this.f; };
  Flow.prototype.gap = function (h) { if (this.f.y > this.f.top + 1) this.f.y += h; };
  Flow.prototype.heading = function (s, keep) { this.gap(7); var f = this.need(16 + (keep || 22)); f.page.heading(s, f.x, f.y + 7.5, f.w); f.y += 15; };
  Flow.prototype.sub = function (s, right, keep) { var f = this.need(12 + (keep || 20)); f.page.text(s, f.x, f.y + 7, 'B', 7, { tc: 0.6, gray: GREY }); if (right) right(f.page, f.x + SP.width(s, 'B', 7, 0.6) + 6, f.y); f.y += 11; };
  // (o.keep: its first two lines together -- a feature's name never alone at a column's foot; wrapped again when that moves it to a wider page)
  Flow.prototype.para = function (runs, o) {
    o = o || {}; var ind = o.indent || 0, hang = o.hang || 0, lead = o.lead || 1.22, self = this;
    var wrap = function () { return wrapRuns(runs.filter(function (r) { return r.t; }), self.f.w - ind - hang); }, lines = wrap(), first = true;
    if (o.keep && lines.length) { var f0 = this.f; this.need(Math.min(lines.length, 2) * lines[0].h * lead); if (this.f !== f0) lines = wrap(); }
    lines.forEach(function (ln) {
      var lh = ln.h * lead, f = self.need(lh), x = f.x + ind + (first ? 0 : hang);
      ln.runs.forEach(function (r) { f.page.text(r.t, x, f.y + ln.h * 0.95, r.f, r.size, { gray: r.gray }); x += r.w; });
      f.y += lh; first = false;
    });
    this.f.y += o.after == null ? 2 : o.after;
  };
  // a word in a fixed width: the size down to `min`, then cut with an ellipsis
  function fit(s, f, size, w, min) {
    s = String(s); while (size > (min || 6) && SP.width(s, f, size) > w) size -= 0.25;
    while (s.length > 1 && SP.width(s, f, size) > w) s = s.slice(0, -2) + '…';
    return { s: s, size: size };
  }

  function Doc() { this.pages = []; }
  Doc.prototype.page = function () { var p = new Page(this); this.pages.push(p); return p; };
  Doc.prototype.nextFrame = function () { var p = this.page(); this.contHead(p); return { page: p, x: M, w: PW - 2 * M, top: 66, y: 66, bottom: PH - M - 14 }; };

  // ------------------------------------------------------------------ the sheet, laid out
  SP.layout = function (m) {
    var doc = new Doc(), p = doc.page(), L = M, Rr = PW - M, ttl = m.name;
    doc.contHead = function (pg) { pg.text(ttl, L, M + 12, 'B', 12, { gray: INK }); pg.text(m.line.join(' · ') + ' -- continued', Rr, M + 12, 'R', 8, { gray: GREY, align: 'right' }); pg.line(L, M + 18, Rr, M + 18, { gray: 0.3, w: 0.8 }); };
    // the head: the name, the class line; the game's mark, the date and the XP on the right
    var ns = 20; while (ns > 12 && SP.width(m.name, 'B', ns) > 330) ns -= 1;
    p.text(m.name, L, M + 18, 'B', ns, { gray: INK });
    p.text(m.line.join(' · '), L, M + 34, 'R', 10.5);
    if (m.fullName) p.text(m.fullName, L, M + 46, 'I', 8.5, { gray: GREY });
    p.text('CHARACTER SHEET', Rr, M + 8, 'B', 7.5, { tc: 1.2, gray: GREY, align: 'right' });
    p.text('DRAGONSLEEP · the Pocket DM (alpha)', Rr, M + 20, 'R', 8.5, { align: 'right' });
    var d = m.at, pad = function (n) { return (n < 10 ? '0' : '') + n; };
    p.text('saved ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), Rr, M + 31, 'R', 8, { gray: GREY, align: 'right' });
    if (m.xp != null) p.text('XP ' + m.xp.toLocaleString('en-US') + (m.next ? '  ·  next level at ' + m.next.toLocaleString('en-US') : ''), Rr, M + 42, 'R', 8, { gray: GREY, align: 'right' });
    p.line(L, M + 54, Rr, M + 54, { gray: 0.3, w: 0.8 });
    // the strip: what a turn asks
    var strip = [['ARMOR CLASS', m.ac, m.acNote], ['HIT POINTS', m.maxhp, 'maximum'], ['HIT DICE', m.hd, null], ['SPEED', m.speed + ' ft', null], ['INITIATIVE', sgn(m.init), null], ['PROFICIENCY', sgn(m.prof), 'bonus'], ['PASSIVE PERCEPTION', m.passive, null]];
    var sy = M + 62, sh = 46, g = 6, bw = (Rr - L - g * (strip.length - 1)) / strip.length;
    strip.forEach(function (s, i) {
      var x = L + i * (bw + g), cx = x + bw / 2, lab = s[0], ls = 6.2; while (ls > 4.8 && SP.width(lab, 'B', ls, 0.4) > bw - 6) ls -= 0.2;
      p.rect(x, sy, bw, sh, { r: 5, gray: 0.35, w: 0.8 });
      p.text(lab, cx, sy + 10, 'B', ls, { tc: 0.4, gray: GREY, align: 'center' });
      var vs = 17; while (vs > 9 && SP.width(String(s[1]), 'B', vs) > bw - 8) vs -= 1;
      p.text(String(s[1]), cx, sy + 31, 'B', vs, { gray: INK, align: 'center' });
      if (s[2]) { var us = 6; while (us > 4.6 && SP.width(s[2], 'R', us) > bw - 6) us -= 0.2; p.text(s[2], cx, sy + 41, 'R', us, { gray: GREY, align: 'center' }); }
    });
    var top = sy + sh + 14;
    // ---------------------------------------------------------------- the left column: the scores, the saves, the skills, the senses, what it may use
    var lx = L, lw = 160, y = top;
    p.heading('Abilities', lx, y + 7.5, lw); y += 14;
    var aw = (lw - 2 * 6) / 3, ah = 52;
    m.abil.forEach(function (a, i) {
      var x = lx + (i % 3) * (aw + 6), yy = y + Math.floor(i / 3) * (ah + 6), cx = x + aw / 2;
      p.rect(x, yy, aw, ah, { r: 5, gray: 0.35, w: 0.8 });
      p.text(a.k.toUpperCase(), cx, yy + 10, 'B', 7, { tc: 0.8, gray: GREY, align: 'center' });
      p.text(sgn(a.mod), cx, yy + 30, 'B', 17, { gray: INK, align: 'center' });
      p.rect(cx - 12, yy + 36, 24, 12, { r: 6, gray: 0.5, w: 0.6, fill: 1 });
      p.text(String(a.score), cx, yy + 45, 'R', 8.5, { gray: INK, align: 'center' });
    });
    y += 2 * ah + 6 + 12;
    p.heading('Saving throws', lx, y + 7.5, lw); y += 15;
    m.abil.forEach(function (a) {
      p.circle(lx + 4, y + 4.2, 2.6, { fill: a.saveProf });
      p.text(sgn(a.save), lx + 25, y + 7, a.saveProf ? 'B' : 'R', 8.5, { align: 'right', gray: INK });
      p.text(a.name, lx + 30, y + 7, 'R', 8.5); y += 10.8;
    });
    y += 8;
    p.heading('Skills', lx, y + 7.5, lw); y += 15;
    m.skills.forEach(function (s) {
      p.circle(lx + 4, y + 3.8, 2.4, { fill: s.prof }); if (s.exp) p.circle(lx + 4, y + 3.8, 3.8, { gray: 0.35, w: 0.5 });
      p.text(sgn(s.val), lx + 25, y + 6.6, s.prof ? 'B' : 'R', 8, { align: 'right', gray: INK });
      p.text(s.name, lx + 30, y + 6.6, 'R', 8);
      p.text(s.ab.toUpperCase(), lx + lw, y + 6.6, 'R', 6, { gray: GREY, align: 'right' }); y += 10.3;
    });
    var note = 'Filled: proficient (ringed: expertise). The Pocket DM keeps the skills its fights read; mark your table\'s own and add +' + m.prof + '.';
    wrapRuns([{ t: note, f: 'I', size: 6.5, gray: GREY }], lw).forEach(function (ln) { p.text(ln.runs[0].t, lx, y + 7, 'I', 6.5, { gray: GREY }); y += 8; });
    y += 8;
    p.heading('Senses', lx, y + 7.5, lw); y += 15;
    m.senses.forEach(function (s) { wrapRuns([{ t: s, f: 'R', size: 8 }], lw).forEach(function (ln) { p.text(ln.runs[0].t, lx, y + 7, 'R', 8); y += 9.8; }); });
    y += 8;
    p.heading('Proficiencies', lx, y + 7.5, lw); y += 15;
    [['Armor', m.profs.armor.length ? m.profs.armor.join(', ') : 'none'], ['Weapons', m.profs.weapons.join(', ')]].forEach(function (r) {
      wrapRuns([{ t: r[0] + ': ', f: 'B', size: 7.5 }, { t: r[1], f: 'R', size: 7.5 }], lw).forEach(function (ln) { var x = lx; ln.runs.forEach(function (q) { p.text(q.t, x, y + 7, q.f, q.size); x += q.w; }); y += 9.2; });
      y += 2;
    });
    // ---------------------------------------------------------------- the right column, flowing on: the day, the attacks, the uses, the gear, the features, the spells
    var rx = L + lw + 16, fl = new Flow(doc, { page: p, x: rx, w: Rr - rx, top: top, y: top, bottom: PH - M - 14 });
    fl.heading('On the day', 30);
    (function () {
      var f = fl.f, x = f.x, yy = f.y, pg = f.page, bh = 24;
      var cell = function (lab, w, sub) { pg.rect(x, yy, w, bh, { r: 3, gray: 0.45, w: 0.6 }); pg.text(lab, x + 4, yy + 7, 'B', 5.6, { tc: 0.4, gray: GREY }); if (sub) pg.text(sub, x + w - 4, yy + bh - 4, 'R', 6, { gray: GREY, align: 'right' }); x += w + 6; };
      cell('CURRENT HIT POINTS', 96, 'of ' + m.maxhp); cell('TEMPORARY', 60); cell('HIT DICE LEFT', 70, 'of ' + m.hd);
      pg.text('DEATH SAVES', x, yy + 7, 'B', 5.6, { tc: 0.4, gray: GREY });
      pg.text('saved', x, yy + 17, 'R', 6.5, { gray: GREY }); pg.boxes(3, x + 22, yy + 11.5, { s: 6.5 });
      pg.text('failed', x + 50, yy + 17, 'R', 6.5, { gray: GREY }); pg.boxes(3, x + 72, yy + 11.5, { s: 6.5 });
      f.y += bh + 2;
    })();
    // the attacks
    fl.heading('Attacks', 34);
    (function () {
      var f = fl.need(12), c = [0, 128, 166, 250], nw = f.w - c[3];
      [['WEAPON', 0], ['TO HIT', 1], ['DAMAGE', 2], ['NOTES', 3]].forEach(function (h) { f.page.text(h[0], f.x + c[h[1]], f.y + 6, 'B', 5.8, { tc: 0.5, gray: GREY }); });
      f.y += 10;
      m.attacks.forEach(function (a) {
        var nl = wrapRuns([{ t: a.notes || '', f: 'R', size: 7, gray: GREY }], nw), rh = Math.max(12, nl.length * 8.4 + 3.5), ff = fl.need(rh);
        ff.page.rect(ff.x, ff.y, ff.w, rh - 2, { r: 2, fill: PALE, stroke: false });
        var an = fit(a.name, 'B', 8.5, c[1] - 8), ad = fit(a.dmg, 'R', 8.5, c[3] - c[2] - 4);
        ff.page.text(an.s, ff.x + 4, ff.y + 8, 'B', an.size, { gray: INK });
        ff.page.text(a.hit, ff.x + c[1] + 4, ff.y + 8, 'B', 8.5, { gray: INK });
        ff.page.text(ad.s, ff.x + c[2], ff.y + 8, 'R', ad.size, { gray: INK });
        nl.forEach(function (ln, i) { ff.page.text(ln.runs[0].t, ff.x + c[3], ff.y + 7.6 + i * 8.4, 'R', 7, { gray: GREY }); });
        ff.y += rh;
      });
    })();
    var at = [m.perTurn > 1 ? m.perTurn + ' attacks when you take the Attack action' : 'one attack when you take the Attack action'];
    if (m.crit < 20) at.push('a critical hit on ' + m.crit + '-20');
    fl.para([{ t: cap1(at.join('; ')) + '.', f: 'R', size: 7.5, gray: GREY }], { after: 0 });
    // the uses
    if (m.uses.length) {
      fl.heading('Uses', 24);
      m.uses.forEach(function (u) {
        var f = fl.need(11), x = f.x;
        f.page.text(u.name, x, f.y + 7.5, 'B', 8, { gray: INK }); x += Math.max(120, SP.width(u.name, 'B', 8) + 8);
        if (u.pool || u.n > 12) { f.page.text(u.n + ' a ' + u.rest + ';  left: ________', x, f.y + 7.5, 'R', 7.5); }
        else { x += f.page.boxes(u.n, x, f.y + 1.6, { s: 6.5 }) + 8; f.page.text(u.n + ' · back on a ' + u.rest, x, f.y + 7.5, 'R', 7, { gray: GREY }); }
        f.y += 11;
      });
    }
    // the gear
    if (m.gear.length) {
      fl.heading('Equipment', 24);
      m.gear.forEach(function (gr) {
        fl.para([{ t: gr.place + '  ', f: 'B', size: 6, gray: GREY }, { t: gr.name, f: 'B', size: 8.5, gray: INK }, { t: gr.bond ? '  (' + gr.bond + ')' : '', f: 'I', size: 7.5, gray: GREY },
          { t: gr.words ? '  ' + gr.words : '', f: 'R', size: 7.5 }], { hang: 10, after: 2.5 });
      });
    }
    // the features
    if (m.features.length) {
      fl.heading('Features & traits', 24);
      m.features.forEach(function (ft) { fl.para([{ t: ft.name ? ft.name + (ft.words ? '.' : '') : '', f: 'B', size: 8.2, gray: INK }, { t: ft.words ? (ft.name ? ' ' : '') + ft.words : '', f: 'R', size: 7.8 }], { hang: 10, after: 3, keep: true }); });
    }
    // the spells
    var S = m.spells;
    if (S) {
      fl.heading('Spellcasting', 40);
      fl.para([{ t: 'Ability ', f: 'R', size: 8, gray: GREY }, { t: S.ability, f: 'B', size: 8.5, gray: INK }, { t: '    save DC ', f: 'R', size: 8, gray: GREY }, { t: String(S.dc), f: 'B', size: 8.5, gray: INK },
        { t: '    spell attack ', f: 'R', size: 8, gray: GREY }, { t: S.atk, f: 'B', size: 8.5, gray: INK }], { after: 3 });
      var slotLv = []; S.slots.forEach(function (n, i) { if (n > 0) slotLv.push(i + 1); });
      if (slotLv.length) {
        var f0 = fl.need(13), x0 = f0.x;
        f0.page.text(S.pact ? 'PACT SLOTS (back on a short rest)' : 'SLOTS', x0, f0.y + 7.5, 'B', 6.2, { tc: 0.5, gray: GREY }); x0 += S.pact ? 128 : 34;
        slotLv.forEach(function (lv) { var n = S.slots[lv - 1]; if (x0 + 22 + n * 9 > f0.x + f0.w) { f0.y += 12; x0 = f0.x + 34; } f0.page.text(ord(lv), x0, f0.y + 7.5, 'B', 7.5, { gray: INK }); x0 += 16; x0 += f0.page.boxes(n, x0, f0.y + 1.5, { s: 6.5 }) + 12; });
        f0.y += 14;
      }
      if (S.prepared) fl.para([{ t: '• prepared today (a long rest changes them); the cantrips always are', f: 'I', size: 7, gray: GREY }], { after: 2 });
      S.levels.forEach(function (lvl) {
        fl.gap(3);
        fl.sub(lvl.lv === 0 ? 'CANTRIPS (at will)' : ord(lvl.lv).toUpperCase() + ' LEVEL', null, 18);
        lvl.list.forEach(function (s) {
          fl.para([{ t: (s.ready ? '• ' : '') + s.name, f: 'B', size: 8.2, gray: s.ready === false ? GREY : INK }, { t: s.tags ? '  ' + s.tags : '', f: 'I', size: 7, gray: GREY }, { t: s.desc ? '  ' + s.desc : '', f: 'R', size: 7.6 }], { hang: 10, after: 2.5, keep: true });
        });
      });
    }
    if (m.about.length) { fl.heading('About', 20); m.about.forEach(function (t) { fl.para([{ t: t, f: 'I', size: 8, gray: TEXT }], { after: 3 }); }); }
    // the word: the whole character in one line, as the Pocket DM keeps it
    if (m.word) {
      fl.heading('The word', 20);
      fl.para([{ t: 'The whole character in one line, as the Pocket DM keeps it (js/classes.js NPC.spec reads it):', f: 'R', size: 7, gray: GREY }], { after: 2 });
      fl.para([{ t: m.word, f: 'M', size: 7, gray: INK }], { after: 0, lead: 1.3 });
    }
    // the foot of every page, its number once they are counted
    var n = doc.pages.length;
    doc.pages.forEach(function (pg, i) {
      pg.line(L, PH - M - 6, Rr, PH - M - 6, { gray: RULE, w: 0.5 });
      pg.text('DRAGONSLEEP · the Pocket DM (alpha) · grimgriz.github.io/dragonsleep-8bit', L, PH - M + 3, 'R', 6.5, { gray: GREY });
      pg.text(m.name + ' · page ' + (i + 1) + ' of ' + n, Rr, PH - M + 3, 'R', 6.5, { gray: GREY, align: 'right' });
    });
    return doc;
  };

  // ------------------------------------------------------------------ the file: the objects, the pages' streams, the cross-reference
  SP.bytes = function (m) {
    var doc = SP.layout(m), objs = [], d = m.at, pad = function (v) { return (v < 10 ? '0' : '') + v; };
    var stamp = 'D:' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
    var nP = doc.pages.length, first = 8, kids = [];
    for (var i = 0; i < nP; i++) kids.push((first + i * 2) + ' 0 R');
    objs[1] = '<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /DisplayDocTitle true >> /Lang (en) >>';
    objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + nP + ' /MediaBox [0 0 ' + PW + ' ' + PH + '] >>';
    ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Courier'].forEach(function (f, k) { objs[3 + k] = '<< /Type /Font /Subtype /Type1 /BaseFont /' + f + ' /Encoding /WinAnsiEncoding >>'; });
    objs[7] = '<< /Title ' + pdfStr(m.name + ' -- ' + m.line.join(', ') + ' -- character sheet') + ' /Author (DRAGONSLEEP: the Pocket DM \\(alpha\\)) /Subject (A character sheet) /Creator (DRAGONSLEEP deep16/js/sheetpdf.js) /Producer (DRAGONSLEEP) /CreationDate (' + stamp + ') >>';
    doc.pages.forEach(function (pg, k) {
      var body = pg.ops.join('\n'), id = first + k * 2;
      objs[id] = '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ' + (id + 1) + ' 0 R >>';
      objs[id + 1] = '<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream';
    });
    var out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', offs = [];
    for (var j = 1; j < objs.length; j++) { offs[j] = out.length; out += j + ' 0 obj\n' + objs[j] + '\nendobj\n'; }
    var xref = out.length;
    out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
    for (var q = 1; q < objs.length; q++) out += ('000000000' + offs[q]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R /Info 7 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    return out;
  };
  SP.fileName = function (m) { // (brokk-fighter5-sheet.pdf; an unnamed card's own name says its class and level already: cleric-8-sheet.pdf)
    var slug = String(m.name || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'character';
    return (slug === m.cls + '-' + m.lvl ? slug : slug + '-' + m.cls + m.lvl) + '-sheet.pdf';
  };
  SP.save = function (h, o) {
    var m = SP.model(h, o), s = SP.bytes(m), u = new Uint8Array(s.length), name = SP.fileName(m);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
    SP.last = { name: name, size: u.length, model: m }; // (the bench reads what the last press made)
    if (SP.noDownload) return name; // (a bench: the file made, nothing handed to the browser)
    try { var a = document.createElement('a'), url = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); }
    catch (e) { return null; }
    return name;
  };
})();
