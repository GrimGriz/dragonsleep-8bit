/* DEEP16 — the Pocket DM (alpha), 10-02. Griz: "the something page calls the class floor the pocket DM, but really it's this test runs
   page. In the style of 'the ladder' create a user friendly interface that apparently does everything through the power of a URL (or build
   something new actually called the pocket DM (alpha)" -- so: a scene of the grid's own (?pocket), in the ladder's look, over the oath-stone
   of the Silversands under the Sunshaft's noon (Solskaft's clan hall: wiki/solskaft.md; "At noon the light lands here."), and every fight
   it makes is a class-floor URL (?npc=...&vs=...&lvl=...&map=...) it shows and copies.
   The party (his words): "choose party size (I think our limit is 6?) by having 4 characters - defaults are fine. Arrows on the top and
   bottom cycle through existing characters - but make them unlock pyro - and a question mark slot"; the maker: "pick a race & class & set
   stats ... before they choose the character's level. Let them pick gear ... and let them save those new characters" -- scores "default
   values of ten with arrows they can click up to 18 and down to 3", "generic kits per class", spells "class based, SRD - what we don't have"
   (the class's list, the built ones). The map ("make it obvious which ones are dark maps"), a CR dial and a re-roll ("randomly put in
   monsters we have in existence that add up to that CR"; Willem and Amara in the pot when not in the party, the rest of the story's named
   out), the four-rung ladder with SHORT REST FOR THE WICKED between (SRD hit dice, the fallen up first), LONG REST FOR THE TRIAL after the
   fourth and the double deadly, which unlocks Pyro ("they can play him but not see or change his gear"); a magic item to a random character
   on each win; quit, retry or reroll a rung from what they went in with; the fights kept, with notes, saved to a file, sent by email or
   Discord. The words the fights are made of: js/classes.js NPC.spec (`barley:5+dagger1`, `talmok:5:grown`, `~fighter.5.dwarf....`).
   The level cap is 8 (his: "Cap them at lvl 8 (but pyro full power if they unlock)"). */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS, R = DS.R, NPC = D.npc, SV = D.save;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.pocket', KEEP = 60;
  var PK = D.pocket = {};
  PK.DISCORD = 'https://discord.gg/VDxa5hkA3x';
  PK.MAIL = 'grimgriz@gmail.com';
  PK.CAP = 8;

  // ------------------------------------------------------------------ the store
  PK.load = function () {
    var st = D.store.get(KEY) || {};
    st.roster = st.roster || [];          // the player's own characters: { code, name, cls, lvl }
    st.fights = st.fights || [];          // what was fought: summaries, with notes
    st.party = st.party || null;          // the slots: { w, lvl, loot } or { custom: i }
    st.pyro = !!st.pyro;                  // the trial won: Pyro on the roster
    st.run = st.run || null;              // the ladder under way
    return st;
  };
  PK.save = function (st) { return D.store.set(KEY, st); }; // (true when it was written: false with the browser's storage full or shut -- the scene says so, Pocket.prototype.keep)

  // ------------------------------------------------------------------ the roster: the 8-bit game's own, the named, the king, the player's
  // (lo: the lowest level the word builds -- a guest stands at its register's or higher, js/classes.js NPC.heroSheet)
  PK.STOCK = [
    { w: 'barley', lo: 1 }, { w: 'aurdin', lo: 1 }, { w: 'vivian', lo: 1 }, { w: 'lymen', lo: 1 },
    { w: 'brann', lo: 5 }, { w: 'hedda', lo: 5 }, { w: 'halldor', lo: 6 }, { w: 'ingrith', lo: 1 }, { w: 'dace', lo: 1 }, { w: 'trooper', lo: 4 },
    { w: 'talmok', lo: 1, grown: true }, { w: 'willem', lo: 1, grown: true }, { w: 'katarina', lo: 1, grown: true }, { w: 'torvald', lo: 1, grown: true },
    { w: 'higertha', lo: 1 }, { w: 'amara', lo: 1, grown: true },
    { w: 'pyro', lo: 12, hi: 12, king: true }
  ];
  PK.entries = function (st) {
    var out = PK.STOCK.map(function (s) { return { kind: 'stock', w: s.w, lo: s.lo, hi: s.hi || PK.CAP, grown: !!s.grown, locked: !!s.king && !st.pyro, king: !!s.king }; });
    st.roster.forEach(function (c, i) { out.push({ kind: 'custom', i: i, code: c.code, name: c.name }); });
    out.push({ kind: 'new' });
    return out;
  };
  PK.defaultParty = function () { return [{ w: 'barley', lvl: 3, loot: [] }, { w: 'aurdin', lvl: 3, loot: [] }, { w: 'vivian', lvl: 3, loot: [] }, { w: 'lymen', lvl: 3, loot: [] }]; };
  // the word a slot makes (js/classes.js NPC.spec reads it): 'barley:3+dagger1', 'talmok:5:grown', '~fighter.5....'
  PK.wordOf = function (st, slot) {
    if (!slot) return null;
    if (slot.custom != null) { var c = st.roster[slot.custom]; return c ? c.code : null; }
    if (slot.w === 'new' || slot.w === '?') return null;
    var s = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0] || { lo: 1 };
    var L = s.king ? 12 : Math.max(s.lo, Math.min(PK.CAP, slot.lvl || s.lo));
    return slot.w + ':' + L + (s.grown ? ':grown' : '') + (slot.loot || []).map(function (id) { return '+' + id; }).join('');
  };
  PK.specOf = function (st, slot) { var w = PK.wordOf(st, slot); return w ? NPC.spec(w) : null; };
  // a sheet for the card (the 8-bit's shape: hp, equip, abil...), and its figure
  PK.sheetOf = function (sp) { if (!sp) return null; try { return sp.hero ? NPC.heroSheet(sp) : NPC.sheet(sp); } catch (e) { return null; } };
  PK.lookOf = function (sp) { return sp ? (sp.hero ? sp.look : NPC.lookOf(sp)) : null; };
  PK.baseKey = function (word) { return String(word || '').split('+')[0].split(':')[0].split('.')[0].replace(/^~/, ''); };

  // ------------------------------------------------------------------ the DMG's table (5E 2014: XP thresholds a character, the multiplier for a crowd)
  PK.THRESH = { 1: [25, 50, 75, 100], 2: [50, 100, 150, 200], 3: [75, 150, 225, 400], 4: [125, 250, 375, 500], 5: [250, 500, 750, 1100], 6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700], 8: [450, 900, 1400, 2100], 9: [550, 1100, 1600, 2400], 10: [600, 1200, 1900, 2800], 11: [800, 1600, 2400, 3600], 12: [1000, 2000, 3000, 4500] };
  var MULTS = [0.5, 1, 1.5, 2, 2.5, 3, 4];
  PK.mult = function (nFoes, nParty) {
    var i = nFoes <= 1 ? 1 : nFoes === 2 ? 2 : nFoes <= 6 ? 3 : nFoes <= 10 ? 4 : nFoes <= 14 ? 5 : 6;
    if (nParty < 3) i = Math.min(6, i + 1); else if (nParty >= 6) i = Math.max(0, i - 1);
    return MULTS[i];
  };
  PK.cr8 = function (cr) { cr = String(cr); return cr === '0' ? 0 : cr === '1/8' ? 1 : cr === '1/4' ? 2 : cr === '1/2' ? 4 : Math.round((+cr || 0) * 8); };
  PK.fmt8 = function (e) { if (e <= 0) return '0'; if (e < 8) return e === 1 ? '1/8' : e === 2 ? '1/4' : e === 4 ? '1/2' : e + '/8'; var w = Math.floor(e / 8), f = e % 8; return w + (f === 4 ? ' 1/2' : f === 2 ? ' 1/4' : f ? ' ' + f + '/8' : ''); };
  PK.xpOf = function (kind) { var f = D.FOES[kind]; return f ? (R.CR_XP[String(f.cr)] || 0) : 0; };
  // how the fight reads for this party: the adjusted XP against the party's four thresholds
  PK.diff = function (levels, kinds) {
    var th = [0, 0, 0, 0];
    levels.forEach(function (L) { var t = PK.THRESH[Math.max(1, Math.min(12, L))]; for (var i = 0; i < 4; i++) th[i] += t[i]; });
    var xp = 0; kinds.forEach(function (k) { xp += PK.xpOf(k); });
    var mult = PK.mult(kinds.length, levels.length), adj = Math.round(xp * mult);
    var label = adj < th[0] ? 'TRIVIAL' : adj < th[1] ? 'EASY' : adj < th[2] ? 'MEDIUM' : adj < th[3] ? 'HARD' : 'DEADLY';
    var ratio = th[3] ? adj / th[3] : 0;
    return { xp: xp, adj: adj, mult: mult, thresh: th, label: label, ratio: ratio, deadlyX: ratio >= 1 ? Math.round(ratio * 10) / 10 : 0 };
  };

  // ------------------------------------------------------------------ the pot, and the roll (his: "randomly put in monsters we have in existence that add up to that CR")
  // out: the story's named (Talmok, Torvald, Hask, the Keeper), the familiars, CR 0; Willem and Amara only when not in the party ("throw in
  // willem and amara if they aren't in the player's party"); a thing bound to water only where the map has water
  PK.NAMED_OUT = ['talmok', 'torvald', 'hask', 'keeper', 'keeperold']; // (keeperold: the ladder's old Keeper, data/foes.js -- 10-03)
  PK.pot = function (partyWords, mapId) {
    var keys = (partyWords || []).map(PK.baseKey), def = D.MAPS[mapId], water = def ? def.rows.join('').indexOf('~') >= 0 : false;
    return Object.keys(D.FOES).filter(function (k) {
      var f = D.FOES[k];
      if (!f || /^fam_/.test(k) || PK.cr8(f.cr) <= 0) return false;
      if (PK.NAMED_OUT.indexOf(k) >= 0) return false;
      if ((k === 'willem' || k === 'amara') && keys.indexOf(k) >= 0) return false;
      if (f.bound && !water) return false;
      return true;
    });
  };
  PK.roomOn = function (mapId) { var def = D.MAPS[mapId]; if (!def) return 8; var n = 0, m = D.iso.load(def); for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var q = m.at(x, y); if (q && q.walk) n++; } return Math.max(2, Math.min(12, Math.floor(n / 12))); };
  // a list of kinds whose CRs sum to the target (in eighths), as near as the pot allows; packs happen (a kind already drawn is drawn again
  // half the time), and no more heads than the map has room for
  PK.roll = function (target8, pot, maxN, rnd) {
    rnd = rnd || D.rand; maxN = maxN || 8;
    var cr = {}; pot.forEach(function (k) { cr[k] = PK.cr8(D.FOES[k].cr); });
    var best = null;
    for (var t = 0; t < 400; t++) {
      var rem = target8, list = [];
      while (rem > 0 && list.length < maxN) {
        var fit = pot.filter(function (k) { return cr[k] <= rem; });
        if (!fit.length) break;
        var pick = null;
        if (list.length && rnd() < 0.5) { var again = list.filter(function (k) { return cr[k] <= rem; }); if (again.length) pick = again[Math.floor(rnd() * again.length)]; }
        if (!pick) {
          // the first head is a big one more often than not, so a CR 5 dial is not always ten rats
          fit.sort(function (a, b) { return cr[b] - cr[a]; });
          var top = fit.slice(0, Math.max(1, Math.ceil(fit.length / 3)));
          pick = (list.length === 0 && rnd() < 0.6 ? top : fit)[Math.floor(rnd() * (list.length === 0 && rnd() < 0.6 ? top.length : fit.length))];
        }
        list.push(pick); rem -= cr[pick];
      }
      if (rem === 0) return list;
      if (!best || rem < best.rem || (rem === best.rem && list.length < best.list.length)) best = { list: list, rem: rem };
    }
    return best ? best.list : [];
  };
  PK.sum8 = function (kinds) { var s = 0; kinds.forEach(function (k) { s += PK.cr8((D.FOES[k] || {}).cr); }); return s; };
  // the dial's stops, in eighths: 1/8 .. 40
  PK.VALUES = [1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  PK.countKinds = function (kinds) {
    var cnt = {}, order = [];
    kinds.forEach(function (k) { if (!cnt[k]) { cnt[k] = 0; order.push(k); } cnt[k]++; });
    return order.map(function (k) { var f = D.FOES[k] || { name: k, cr: '?' }; return { kind: k, n: cnt[k], name: f.name, cr: f.cr }; });
  };
  PK.foesText = function (kinds) {
    return PK.countKinds(kinds).map(function (c) { return (c.n > 1 ? c.n + ' ' : (c.name && /^[aeiou]/i.test(c.name) ? 'an ' : 'a ')) + (c.n > 1 ? plural(c.name) : c.name); }).join(', ') || 'no one';
  };
  function plural(s) { if (/wolf$/i.test(s)) return s.replace(/wolf$/i, 'wolves'); if (/[^aeiou]y$/i.test(s)) return s.slice(0, -1) + 'ies'; if (/(s|x|z|ch|sh)$/i.test(s)) return s + 's'; return s + 's'; }

  // ------------------------------------------------------------------ the rests (SRD 5.1), on what a fight left of a character
  // c: { hp, maxhp, slots, slotsMax, feats, cls, lvl, con } · hd: the hit dice left · arcane: Arcane Recovery spent this run already
  // The fallen stand first (his: "SRD + free rez for the fallen before the short rest applies is good"), then hit dice till whole or out
  PK.shortRest = function (c, hd, arcane, rnd) {
    rnd = rnd || D.rand;
    var RC = R.CLASSES[c.cls] || { hd: 8 }, notes = [], spent = 0, healed = 0, rez = false;
    if (c.hp <= 0) { c.hp = 1; rez = true; }
    while (c.hp < c.maxhp && hd > 0) { var g = Math.max(0, 1 + Math.floor(rnd() * RC.hd) + (c.con || 0)); c.hp = Math.min(c.maxhp, c.hp + g); healed += g; hd--; spent++; }
    var f = c.feats = c.feats || {}, back = [];
    if (c.cls === 'fighter') { if (!(f.secondWind > 0) || !(f.actionSurge > 0)) back.push('Second Wind, Action Surge'); f.secondWind = 1; f.actionSurge = 1; }
    if (c.cls === 'paladin' && c.lvl >= 3) { if (!(f.channel > 0)) back.push('Channel Divinity'); f.channel = 1; }
    if (c.cls === 'cleric' && c.lvl >= 2) { var ch = c.lvl >= 18 ? 3 : c.lvl >= 6 ? 2 : 1; if (!(f.channel >= ch)) back.push('Channel Divinity'); f.channel = ch; }
    if (c.cls === 'druid' && c.lvl >= 2) { if (!(f.wildShape >= 2)) back.push('Wild Shape'); f.wildShape = 2; }
    if (c.cls === 'monk' && c.lvl >= 2) { if (!(f.ki >= c.lvl)) back.push('ki'); f.ki = c.lvl; }
    if (c.cls === 'bard' && c.lvl >= 5) { f.inspiration = Math.max(1, c.cha || 1); back.push('Bardic Inspiration'); }
    if (c.cls === 'warlock' && c.slotsMax) { c.slots = c.slotsMax.slice(); back.push('pact slots'); }
    if (c.cls === 'wizard' && !arcane && c.slotsMax && c.slots) {
      var budget = Math.ceil(c.lvl / 2), got = 0;
      for (var L = Math.min(5, c.slotsMax.length); L >= 1; L--) while (c.slots[L - 1] < c.slotsMax[L - 1] && budget >= L) { c.slots[L - 1]++; budget -= L; got++; }
      if (got) { arcane = true; back.push('Arcane Recovery: ' + got + ' slot' + (got === 1 ? '' : 's')); }
    }
    if (rez) notes.push('back on their feet');
    if (spent) notes.push(spent + ' hit ' + (spent === 1 ? 'die' : 'dice') + ', +' + healed + ' HP');
    else if (c.hp >= c.maxhp) notes.push('whole'); else notes.push('no hit dice left');
    if (back.length) notes.push(back.join(', ') + ' back');
    return { c: c, hd: hd, arcane: arcane, text: notes.join('; '), rez: rez, spent: spent, healed: healed };
  };

  // ------------------------------------------------------------------ the winnings (his: "pick a random character on victory and give magic item appropriate to class" -- not Pyro)
  // the plus-ones and the two SRD items the ladder's armoury already carries, by what the class may wear; the +2s from the third rung and the trial
  // (10-06: and the worn things -- the Ring of Resistance (fire), the Boots of Elvenkind, the Periapt of Proof against Poison; any class may wear them: R.canEquip)
  PK.LOOT = ['longsword1', 'dagger1', 'maul1', 'staff1', 'leather1', 'studded1', 'padded1', 'hide1', 'chainshirt1', 'scalemail1', 'ringmail1', 'chainmail1', 'splint1', 'robes1', 'ringofprotection', 'cloakdisplacement', 'ringresistfire', 'bootselvenkind', 'periaptpoison'];
  PK.LOOT_LATE = ['longsword2', 'dagger2', 'staff2', 'flametongue', 'doorshield', 'dwarfplate'];
  function bonusOf(it) { if (!it) return 0; var w = it.weapon || it.armor || it.shield || {}; return w.bonus || (w.magic ? 1 : 0) || (it.kind === 'shield' && w.ac > 2 ? w.ac - 2 : 0); }
  PK.lootFor = function (h, late) {
    var pool = PK.LOOT.concat(late ? PK.LOOT_LATE : []), out = [];
    pool.forEach(function (id) {
      var it = DS.DATA.items[id]; if (!it) return;
      var slot = R.slotFor(h, it); if (!slot) return; // (a ring: the first free hand of two; boots, a periapt: their own place -- js/rules.js R.slotFor)
      if (it.kind !== 'cloak' && !R.canEquip(h, it)) return;
      if (R.wears(h, id)) return; // (one of a thing is enough: it is not a gift twice)
      // a weapon is a gift only in the kind already in hand (a longsword for a longsword): a greatsword's man is not handed a dagger
      if (it.kind === 'weapon') { var inHand = DS.DATA.items[h.equip.weapon]; if (inHand && inHand.weapon && (inHand.weapon.kind || inHand.weapon.group) !== (it.weapon.kind || '')) return; if (!inHand || h.equip.weapon === 'unarmed') return; }
      var have = DS.DATA.items[h.equip[slot]];
      if (have && bonusOf(have) >= bonusOf(it)) return;
      if (slot === 'armor' && have && have.armor && it.armor && have.armor.base > it.armor.base + bonusOf(it)) return; // (a +1 leather is no gift to a man in chain)
      out.push(id);
    });
    return out;
  };
  PK.loot = function (st, slots, late, rnd) {
    rnd = rnd || D.rand;
    var order = slots.map(function (s, i) { return i; }).filter(function (i) { var w = PK.wordOf(st, slots[i]); return w && PK.baseKey(w) !== 'pyro'; });
    for (var k = order.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var t = order[k]; order[k] = order[j]; order[j] = t; }
    for (var n = 0; n < order.length; n++) {
      var i = order[n], sp = PK.specOf(st, slots[i]), h = PK.sheetOf(sp); if (!h) continue;
      var c = PK.lootFor(h, late); if (!c.length) continue;
      return { who: i, item: c[Math.floor(rnd() * c.length)], name: h.name };
    }
    return null;
  };
  // the thing given: on a stock word as `+item`; in a player's own character's code, in its gear slot
  PK.give = function (st, slots, who, item) {
    var s = slots[who], it = DS.DATA.items[item]; if (!s || !it) return;
    if (s.custom != null) {
      var c = st.roster[s.custom]; if (!c) return;
      var sp = NPC.decode(c.code); if (!sp) return;
      sp.equip = sp.equip || {};
      var slot = R.slotFor({ equip: sp.equip }, it); if (!slot) return; // (the item's own place, a ring in the first free hand: js/rules.js R.slotFor)
      sp.equip[slot] = item; c.code = NPC.code(sp);
    } else {
      // a stock word's winnings are kept as `+item`s: a new one takes the place of what was won for the same place (a ring: the older of two ring hands)
      var same = function (a, b) { return a.kind === b.kind && (a.kind !== 'worn' || a.place === b.place); };
      var olds = (s.loot || []).filter(function (id) { return same(DS.DATA.items[id] || {}, it); }), drop = it.kind === 'ring' ? olds.slice(0, Math.max(0, olds.length - 1)) : olds;
      s.loot = (s.loot || []).filter(function (id) { return drop.indexOf(id) < 0; }); s.loot.push(item);
    }
  };

  // ------------------------------------------------------------------ the query (every fight a URL)
  PK.query = function (foes, words, L, mapId, watch) {
    var q = '?npc=' + foes.join(',') + '&vs=' + words.join(',') + '&lvl=' + L;
    if (mapId) q += '&map=' + mapId;
    if (watch) q += '&watch';
    return q;
  };
  PK.url = function (q) { return location.origin + location.pathname + q; };

  // ------------------------------------------------------------------ the scene
  function Pocket() { this.t = 0; this.kind = 'pocket'; }
  D.Pocket = Pocket;
  Pocket.prototype.opaque = true;
  Pocket.prototype.enter = function () {
    this.st = PK.load();
    if (!this.st.party) this.st.party = PK.defaultParty();
    this.screen = this.st.run ? 'cr' : 'title';
    this.btns = []; this.ksel = 0; this.scroll = 0; this.msg = null; this.field = null;
    this.mapSel = this.st.mapId || null; this.crI = this.st.crI == null ? -1 : this.st.crI; this.foes = this.st.foes || null; this.watch = !!this.st.watch;
    this.cache = {};
    if (this.st.run && !this.foes) this.foes = this.st.run.foes;
    // a ladder saved on a floor the table no longer deals (the Gate Floor, 10-03) draws a fresh one; the rung's foes stand
    if (this.st.run && this.mapIds().indexOf(this.st.run.map) < 0) { this.st.run.map = this.randomMap(); this.keep(); }
    if (this.st.run) this.fightMap = this.st.run.map; // (as START does from the title: the rung's own map, not the picker's)
    D.music('title');
  };
  Pocket.prototype.exit = function () { this.dropField(); };
  // a write that fails says so (10-03, Griz: "failed save should report"): a character made or a roster brought in stays on the screen for this visit and can go to a
  // file (SAVE ROSTER), but a reload would lose it -- the message outlasts the screen it was set on
  Pocket.prototype.keep = function () { this.st.mapId = this.mapSel; this.st.crI = this.crI; this.st.foes = this.foes; this.st.watch = this.watch; var ok = PK.save(this.st); if (!ok) this.failSay(); return ok; };
  Pocket.prototype.failSay = function () { this.msg = { text: 'NOT SAVED: this browser\'s storage is full or shut. SAVE ROSTER to a file.', t: 480, sticky: true, bad: true }; };
  Pocket.prototype.go = function (screen) { this.dropField(); this.screen = screen; this.ksel = 0; this.scroll = 0; this.msg = this.msg && this.msg.sticky ? this.msg : null; this.cache = {}; };

  // a field over the canvas (a name, the notes): the game hears no key while it has the focus (core.js D.typing)
  Pocket.prototype.useField = function (kind, rect, value, oninput) {
    if (this.field && this.field.kind === kind) { this.field.rect = rect; return this.field; }
    this.dropField();
    var el = document.createElement(kind === 'area' ? 'textarea' : 'input');
    if (kind !== 'area') { el.type = 'text'; el.maxLength = 24; }
    var s = el.style; s.position = 'fixed'; s.zIndex = 30; s.font = '14px system-ui, sans-serif'; s.background = '#10123a'; s.color = '#f8f8f8'; s.border = '1px solid #6e6e98'; s.padding = '2px 4px'; s.resize = 'none'; s.boxSizing = 'border-box'; s.outline = 'none';
    el.value = value || '';
    el.addEventListener('focus', function () { D.typing = true; });
    el.addEventListener('blur', function () { D.typing = false; });
    el.addEventListener('input', function () { oninput(el.value); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && kind !== 'area') { e.preventDefault(); el.blur(); } if (e.key === 'Escape') el.blur(); e.stopPropagation(); });
    document.body.appendChild(el);
    this.field = { kind: kind, el: el, rect: rect };
    setTimeout(function () { try { el.focus(); } catch (e) { /* (nothing) */ } }, 0);
    return this.field;
  };
  Pocket.prototype.placeField = function () {
    var f = this.field; if (!f) return;
    var r = D.canvas.getBoundingClientRect(), s = r.width / D.W;
    f.el.style.left = Math.round(r.left + f.rect.x * s) + 'px'; f.el.style.top = Math.round(r.top + f.rect.y * s) + 'px';
    f.el.style.width = Math.round(f.rect.w * s) + 'px'; f.el.style.height = Math.round(f.rect.h * s) + 'px';
  };
  Pocket.prototype.dropField = function () { if (this.field) { try { this.field.el.remove(); } catch (e) { /* (gone) */ } D.typing = false; this.field = null; } };

  // ------------------------------------------------------------------ buttons: laid out in draw, read in update
  function hit(b) { var m = I.mouse; return m.inside && m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h; }
  Pocket.prototype.btn = function (ctx, label, x, y, w, h, fn, o) {
    o = o || {};
    var b = { label: label, x: x, y: y, w: w, h: h, fn: fn, dis: !!o.dis, pri: !!o.pri, on: !!o.on, small: !!o.small, key: o.key, nokey: !!o.nokey }, i = this.btns.length;
    this.btns.push(b);
    var sel = this.ksel === i && !o.nokey;
    ctx.fillStyle = o.on ? P('gold', 1) : o.pri && !o.dis ? 'rgba(60,38,8,.95)' : 'rgba(20,16,30,.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = o.dis ? P('stone', 2) : sel ? P('gold', 4) : o.on ? P('gold', 3) : o.pri ? P('gold', 2) : P('stone', 3);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    var col = o.dis ? P('stone', 4) : o.on || o.pri ? P('gold', 4) : sel ? P('bone', 2) : P('bone', 1);
    D.text(ctx, label, x + w / 2, y + Math.floor((h - 8) / 2), col, 'center');
    return b;
  };
  // the arrows (the d-pad, the keys) go to the nearest button that way on the screen, not the next in the order drawn (10-06, a pad player: "d-pad presses
  // should change selected menu buttons based on direction"; Griz: "yes, and it's good the keyboard matches the d-pad"): of the centres that way -- no more
  // than twice as far off the line as along it -- the nearest, along plus off; a greyed button and one the keys never take are passed over; none, it stays
  function stepTo(btns, from, way) {
    var a = btns[from]; if (!a) return 0;
    var dx = way === 'left' ? -1 : way === 'right' ? 1 : 0, dy = way === 'up' ? -1 : way === 'down' ? 1 : 0, ax = a.x + a.w / 2, ay = a.y + a.h / 2, best = from, bs = Infinity;
    // (left and right keep to the row where one is on it: a card's v goes to the next card's v, not to the level arrow above it)
    var row = function (b) { return b.y < a.y + a.h && b.y + b.h > a.y; }, rowOnly = dx && btns.some(function (b, i) { return i !== from && !b.dis && !b.nokey && row(b) && (b.x + b.w / 2 - ax) * dx >= 1; });
    btns.forEach(function (b, i) {
      if (i === from || b.dis || b.nokey || (rowOnly && !row(b))) return;
      var vx = b.x + b.w / 2 - ax, vy = b.y + b.h / 2 - ay, along = vx * dx + vy * dy, off = Math.abs(vx * dy - vy * dx);
      if (along < 1 || off > along * 2) return;
      var s = along + off; if (s < bs) { bs = s; best = i; }
    });
    return best;
  }
  Pocket.prototype.fire = function (b) { if (!b || b.dis) { if (b) D.sfx('error'); return; } D.sfx(b.pri ? 'confirm' : 'cursor'); b.fn(); };
  Pocket.prototype.readButtons = function () {
    var m = I.mouse, self = this, n = this.btns.length;
    if (!n) return false;
    if (m.moved && m.inside) this.btns.forEach(function (b, i) { if (hit(b)) self.ksel = i; });
    if (this.ksel >= n) this.ksel = 0;
    ['up', 'down', 'left', 'right'].forEach(function (way) { if (!I.repeat(way)) return; var to = stepTo(self.btns, self.ksel, way); if (to !== self.ksel) { self.ksel = to; D.sfx('cursor'); } });
    if (m.click) { var hb = null; this.btns.forEach(function (b) { if (hit(b)) hb = b; }); if (hb) { this.fire(hb); return true; } }
    if (I.pressed('a')) { this.fire(this.btns[this.ksel]); return true; }
    return false;
  };

  // ------------------------------------------------------------------ update
  Pocket.prototype.update = function () {
    this.t++;
    if (this.msg && this.msg.t > 0) this.msg.t--;
    var s = this.screen;
    if (I.pressed('b') && !D.typing) { this.back(); return; }
    if (this.readButtons()) return;
    if (s === 'map' || s === 'fights' || s === 'maker' || s === 'useful') {
      var w = I.mouse.wheel; if (w) { this.scroll = Math.max(0, this.scroll + w); }
    }
    if (s === 'cr' && this.drag && I.mouse.inside) {
      var d = this.drag; if (!I.held || !I.mouse.inWin) { this.drag = null; }
      var fr = (I.mouse.x - d.x) / d.w, idx = Math.round(Math.max(0, Math.min(1, fr)) * (PK.VALUES.length - 1));
      if (idx !== this.crI) { this.setCR(idx); }
    }
  };
  Pocket.prototype.back = function () {
    var s = this.screen;
    D.sfx('cancel');
    if (s === 'title') { location.href = '../'; return; }
    if (s === 'useful' || s === 'party' || s === 'fights') { this.keep(); this.go('title'); return; }
    if (s === 'maker') { if (this.mk && this.mk.step > 1) this.mk.step--; else this.go('party'); return; }
    if (s === 'map') { this.go('party'); return; }
    if (s === 'cr') { if (this.st.run) { this.go('title'); return; } this.go('map'); return; }
    if (s === 'notes') { this.go('fights'); return; }
    if (s === 'result' || s === 'rest' || s === 'unlock') return; // (a card with its own buttons)
    this.go('title');
  };
  Pocket.prototype.say = function (text, frames) { this.msg = { text: text, t: frames || 180 }; };

  // ------------------------------------------------------------------ the party's sheets, cached a frame at a time
  Pocket.prototype.sheets = function () {
    var self = this, k = JSON.stringify(this.st.party) + '|' + this.st.roster.length;
    if (this.cache.sheetsKey === k) return this.cache.sheets;
    var out = this.st.party.map(function (slot) { var sp = PK.specOf(self.st, slot); var h = PK.sheetOf(sp); return { slot: slot, sp: sp, h: h, look: PK.lookOf(sp) }; });
    this.cache.sheetsKey = k; this.cache.sheets = out;
    D.spr.ensure(out.map(function (s) { return s.look; })); // (the party's figures, for the cards and the fight: fetched as the party is made -- js/sprites.js, 10-03)
    return out;
  };
  Pocket.prototype.levels = function () { return this.sheets().filter(function (s) { return s.h; }).map(function (s) { return s.h.lvl; }); };
  Pocket.prototype.words = function () { var self = this; return this.st.party.map(function (slot) { return PK.wordOf(self.st, slot); }).filter(Boolean); };
  Pocket.prototype.ready = function () { var self = this; return this.st.party.length > 0 && this.st.party.every(function (slot) { if (slot.custom != null) return !!self.st.roster[slot.custom]; var e = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0]; return !!e && !(e.king && !self.st.pyro); }); };
  Pocket.prototype.topLevel = function () { var L = 1; this.levels().forEach(function (x) { L = Math.max(L, x); }); return Math.min(12, L); };

  // ------------------------------------------------------------------ the CR dial, and the foes it rolls
  Pocket.prototype.mapFor = function () {
    if (this.mapSel && D.MAPS[this.mapSel]) return this.mapSel;
    return null;
  };
  Pocket.prototype.mapIds = function () { return Object.keys(D.MAPS).filter(function (id) { var d = D.MAPS[id]; return d && d.rows && d.entry && id !== 'wet' && id !== 'testground' && id !== 'floodstair-old' && !d.from8; }); }; // (floodstair-old: the ladder's copy of the old stair, data/maps.js -- the table's Flooded Stair is the new one, 10-03; a floor with no entry takes no party: the Gate Floor, js/view.js, is the figures' display, and a ladder's trial drew it 10-03 and froze setting the field)
  Pocket.prototype.randomMap = function () { var ids = this.mapIds(); return ids[Math.floor(D.rand() * ids.length)]; };
  Pocket.prototype.reroll = function () {
    var mapId = this.fightMap || this.mapFor() || 'hexfloor';
    var pot = PK.pot(this.words(), mapId), target = PK.VALUES[Math.max(0, this.crI)];
    this.foes = PK.roll(target, pot, PK.roomOn(mapId));
    this.keep();
  };
  Pocket.prototype.setCR = function (i) { this.crI = Math.max(0, Math.min(PK.VALUES.length - 1, i)); this.reroll(); D.sfx('cursor'); };
  // the dial's first setting for this party: the smallest stop that reads HARD
  Pocket.prototype.defaultCR = function () {
    var levels = this.levels(), mapId = this.mapFor() || 'hexfloor', pot = PK.pot(this.words(), mapId), room = PK.roomOn(mapId);
    for (var i = 0; i < PK.VALUES.length; i++) { var kinds = PK.roll(PK.VALUES[i], pot, room); var d = PK.diff(levels, kinds); if (d.label === 'HARD' || d.label === 'DEADLY') return i; }
    return 5;
  };

  // ------------------------------------------------------------------ the fight
  Pocket.prototype.fightWords = function () {
    // (the ladder carries what the last rung left: js/classes.js NPC.build reads { word, hpLeft, slotsLeft, featsLeft })
    var self = this, run = this.st.run, words = this.words();
    if (!run || !run.carry) return words;
    return words.map(function (w, i) { var c = run.carry[i]; return c ? { word: w, hpLeft: c.hp, slotsLeft: c.slots, featsLeft: c.feats, id: 'p' + i + '-' + PK.baseKey(w) } : w; });
  };
  Pocket.prototype.launch = function () {
    var self = this, run = this.st.run, mapId = this.fightMap || this.mapFor() || this.randomMap(), L = this.topLevel();
    if (!this.foes || !this.foes.length) this.reroll();
    this.fightMap = mapId;
    var words = this.words(), kinds = this.foes.slice(), d = PK.diff(this.levels(), kinds);
    var q = PK.query(kinds, words, L, mapId, this.watch);
    var name = run ? (run.trial ? 'THE TRIAL' : 'RUNG ' + run.rung + ' OF 4') : 'THE POCKET DM', sub = PK.foesText(kinds) + ' -- ' + d.label.toLowerCase() + (d.deadlyX > 1 ? ' x' + d.deadlyX : '');
    var def = D.classFight(L, { id: 'pocket', what: PK.foesText(kinds), map: mapId, name: name, sub: sub, music: run && run.trial ? 'boss' : undefined,
      intro: run && run.trial ? 'The last of it. Everything the dark could spare, at once. Win this and the king himself will walk with you.' : 'The Pocket DM sets the table: ' + PK.foesText(kinds) + ', on ' + (D.MAPS[mapId].name || mapId) + '.',
      won: run && run.trial ? 'THE TRIAL IS PASSED.' : 'THE TABLE IS CLEARED.', lost: 'THE DARK KEEPS THEM.' });
    var started = new Date().toISOString();
    this.before = JSON.parse(JSON.stringify({ run: run, party: this.st.party, roster: this.st.roster }));
    var B = new D.Battle({ npc: { foes: kinds, party: this.fightWords() }, watch: this.watch, fightDef: def, pocket: true,
      record: { fight: 'pocket', name: name + ': ' + PK.foesText(kinds), level: L },
      onDone: function (res, why) { if (B.rec) D.rec.finish(B, res); if (why && why.broke) self.floor(why.broke, false); else self.done(res, B, { q: q, kinds: kinds, mapId: mapId, d: d, started: started }); } });
    this.lastQ = q;
    this.keep();
    try { D.push(B); }
    catch (e) {
      if (window.console) console.error('the Pocket DM: the fight would not set', e);
      if (D.top() === B) D.pop();
      this.floor(String(e && e.message || e), true);
    }
  };
  // the floor: a fight that breaks -- while it sets the field (10-03, Griz: "1 - sounds good"; the trial on the Gate Floor sat frozen behind a half-set fight) or
  // mid-way (Griz: "1 - yes"; js/battle.js Battle.broke) -- comes back to the table as it went in, says so, and a ladder's rung gets a fresh map (the foes stand)
  Pocket.prototype.floor = function (why, setting) {
    this.restore();
    if (this.st.run) { this.fightMap = this.st.run.map = this.randomMap(); this.keep(); }
    D.music('title');
    this.go('cr');
    var head = setting ? 'THE TABLE WOULD NOT SET: ' : 'THE FIGHT BROKE: ', tail = ' -- nothing spent' + (this.st.run ? ', a fresh map' : ''), line = function (w) { return head + w + tail; };
    while (why.length > 12 && D.textWidth(line(why)) > D.W - 24) why = why.slice(0, -4) + '..'; // (the error's own words, as many as the screen holds: the console has the rest)
    this.msg = { text: line(why), t: 600, sticky: true, bad: true };
  };
  // the fight is over (the result card's E, or the menu's way out with nothing: res null)
  Pocket.prototype.done = function (res, B, info) {
    D.music('title');
    var self = this, run = this.st.run;
    var party = (B.units || []).filter(function (u) { return u.side === 'party' && !u.familiar && !u.summon && !u.dominated && !u.loose; });
    var end = party.map(function (u) { return { id: u.id, name: u.name, hp: Math.max(0, u.hp), maxhp: u.maxhp, slots: (u.slots || []).slice(), slotsMax: (u.slotsMax || []).slice(), feats: JSON.parse(JSON.stringify(u.feats || {})), cls: u.cls, lvl: u.lvl, con: DS.mod((u.abil || {}).con || 10), cha: DS.mod((u.abil || {}).cha || 10), down: !!(u.ko || u.hp <= 0 || u.dead) }; });
    var rec = { t: Date.now(), started: (B.rec && B.rec.started) || info.started, result: res || 'left', rounds: B.round || 0, q: info.q, map: info.mapId, mapName: (D.MAPS[info.mapId] || {}).name || info.mapId,
      party: end.map(function (e) { return e.name + ' (' + e.cls + ' ' + e.lvl + ')'; }), foes: PK.foesText(info.kinds), kinds: info.kinds, cr: PK.fmt8(PK.sum8(info.kinds)), diff: info.d.label + (info.d.deadlyX > 1 ? ' x' + info.d.deadlyX : ''), adj: info.d.adj,
      downs: end.filter(function (e) { return e.down; }).length, rung: run ? (run.trial ? 'trial' : run.rung) : null, notes: '' };
    this.st.fights.unshift(rec); while (this.st.fights.length > KEEP) this.st.fights.pop();
    this.result = { res: res, rec: rec, end: end, loot: null };
    if (res === 'won') {
      var late = run ? (run.trial || run.rung >= 3) : info.d.ratio >= 1.5;
      var gift = PK.loot(this.st, this.st.party, late);
      if (gift) { PK.give(this.st, this.st.party, gift.who, gift.item); this.result.loot = gift; rec.loot = gift.name + ': ' + DS.DATA.items[gift.item].name; }
      if (run) {
        // the party's slots are the fight's units in order (the familiars and summons left out above)
        run.carry = this.st.party.map(function (s, i) { var e = end[i]; return e ? { hp: e.hp, maxhp: e.maxhp, slots: e.slots, slotsMax: e.slotsMax, feats: e.feats, cls: e.cls, lvl: e.lvl, con: e.con, cha: e.cha } : null; });
        run.won = (run.won || 0) + 1;
        if (run.trial) { this.st.pyro = true; this.st.run = null; this.result.unlocked = true; }
      }
    }
    this.cache = {};
    this.keep();
    this.go('result');
    D.sfx(res === 'won' ? 'levelup' : 'cancel');
  };

  // ------------------------------------------------------------------ the ladder (his: "auto-fill the next map with a reasonable increase in CR (randomly generated 4-rung ladder)")
  Pocket.prototype.startRun = function () {
    var self = this, levels = this.levels();
    this.st.run = { rung: 1, trial: false, base8: PK.VALUES[Math.max(0, this.crI)], carry: null, hd: levels.map(function (L) { return L; }), arcane: levels.map(function () { return false; }), won: 0, startedAt: Date.now(), foes: this.foes, map: this.fightMap || this.mapFor() || this.randomMap() };
    this.fightMap = this.st.run.map;
    this.keep();
  };
  // the next rung's table: the CR about 1.3 times the last, a map drawn fresh
  Pocket.prototype.nextRung = function () {
    var run = this.st.run; if (!run) return;
    run.rung++;
    var target = Math.max(1, Math.round(run.base8 * Math.pow(1.3, run.rung - 1)));
    this.fightMap = run.map = this.randomMap();
    var pot = PK.pot(this.words(), run.map);
    this.foes = run.foes = PK.roll(target, pot, PK.roomOn(run.map));
    this.keep();
  };
  // the trial: double deadly, the smallest table that reads so (his: "give them a 'long rest for the trial' after the fourth win and then do your double deadly")
  Pocket.prototype.setTrial = function () {
    var run = this.st.run; if (!run) return;
    run.trial = true; run.carry = null; run.hd = this.levels().map(function (L) { return L; }); run.arcane = run.hd.map(function () { return false; });
    this.fightMap = run.map = this.randomMap();
    var pot = PK.pot(this.words(), run.map), levels = this.levels(), room = Math.max(PK.roomOn(run.map), 6), kinds = null;
    for (var i = 0; i < PK.VALUES.length && !kinds; i++) { for (var t = 0; t < 6 && !kinds; t++) { var k = PK.roll(PK.VALUES[i], pot, room); if (PK.diff(levels, k).ratio >= 2) kinds = k; } }
    this.foes = run.foes = kinds || PK.roll(PK.VALUES[PK.VALUES.length - 1], pot, room);
    this.keep();
  };
  // after a loss: the party as it went in, and a fresh table for the same step -- a lost trial rerolls as the trial, double deadly (10-03: it rolled a
  // fourth rung's table, and a win of that unlocked Pyro)
  Pocket.prototype.rerollRung = function () {
    this.restore();
    var run = this.st.run;
    if (run && run.trial) this.setTrial();
    else if (run) { run.rung--; this.nextRung(); }
    this.go('cr');
  };
  Pocket.prototype.restCard = function () {
    var run = this.st.run, self = this, lines = [];
    run.carry.forEach(function (c, i) {
      if (!c) return;
      var r = PK.shortRest(c, run.hd[i] == null ? c.lvl : run.hd[i], !!run.arcane[i]);
      run.hd[i] = r.hd; run.arcane[i] = r.arcane; run.carry[i] = r.c;
      lines.push({ name: self.sheets()[i] ? self.sheets()[i].h.name : c.cls, text: r.text, hp: c.hp, maxhp: c.maxhp, hd: r.hd });
    });
    this.rest = { lines: lines };
    this.keep();
  };
  // what they went in with (his: "quit, retry or reroll rung - restored to what they went in with before they died")
  Pocket.prototype.restore = function () {
    if (!this.before) return;
    this.st.run = JSON.parse(JSON.stringify(this.before.run));
    this.st.party = JSON.parse(JSON.stringify(this.before.party));
    this.st.roster = JSON.parse(JSON.stringify(this.before.roster));
    if (this.st.run) { this.foes = this.st.run.foes; this.fightMap = this.st.run.map; }
    this.cache = {};
    this.keep();
  };

  // ------------------------------------------------------------------ the record: a file, the clipboard, an email, the Discord
  Pocket.prototype.summary = function (rec) {
    var l = ['DRAGONSLEEP -- the Pocket DM (alpha)', new Date(rec.t).toLocaleString(), '', rec.result.toUpperCase() + ' in ' + rec.rounds + ' round' + (rec.rounds === 1 ? '' : 's') + (rec.downs ? ', ' + rec.downs + ' down' : '') + (rec.rung ? ' (rung ' + rec.rung + ')' : ''),
      'party: ' + rec.party.join(', '), 'foes: ' + rec.foes + ' (CR ' + rec.cr + ', ' + rec.diff + ')', 'map: ' + rec.mapName, rec.loot ? 'found: ' + rec.loot : '', '', 'URL: ' + PK.url(rec.q), '', 'NOTES: ' + (rec.notes || '(none)')];
    return l.filter(function (x) { return x !== ''; }).join('\n');
  };
  Pocket.prototype.saveFile = function (rec) {
    var plays = D.store.get('deep16.plays') || [], full = plays.filter(function (f) { return f.started === rec.started; })[0] || null;
    var d = new Date(rec.t), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'pocket-dm-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var body = JSON.stringify({ what: 'DRAGONSLEEP: a Pocket DM fight (deep16/?pocket; the play record by js/record.js)', summary: this.summary(rec), fight: rec, record: full }, null, 1);
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      this.say('saved ' + name);
    } catch (e) { this.say('could not save: ' + e); }
  };
  // ------------------------------------------------------------------ the roster in a file of its own (10-03, Griz: "pocket dm roster should save in pocket dm and not overlap with
  // the 8bit ideally"): the player's own characters, and Pyro if the trial is won, to a .json and back, from THE PARTY. The 8-bit's SAVE TO FILE (js/scenes.js FILE_KEYS) keeps the
  // 8-bit's slots and the grid's ladders and never carries deep16.pocket; this file carries nothing else
  PK.FILE_KIND = 'pocket-roster';
  PK.rosterFile = function (st) { return { game: 'DRAGONSLEEP', kind: PK.FILE_KIND, v: 1, at: new Date().toISOString(), roster: st.roster.slice(), pyro: !!st.pyro }; };
  Pocket.prototype.saveRoster = function () {
    var st = this.st; if (!st.roster.length) { this.say('no characters of your own yet: MAKE one on a ? seat'); return; }
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; }, name = 'pocket-dm-roster-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(PK.rosterFile(st), null, 1)], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      this.say('saved ' + st.roster.length + ' to ' + name, 300);
    } catch (e) { this.msg = { text: 'could not write the file: ' + e, t: 300, bad: true }; }
  };
  // the browser's own picker; what the file holds is added (takeRoster), nothing on the roster is lost
  Pocket.prototype.loadRoster = function () {
    var self = this, inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { self.takeRoster(rd.result); }; rd.readAsText(f); };
    inp.click();
  };
  // a file's roster onto this one: each character whose word builds (js/classes.js NPC.spec) and is not here already (the same word and name); Pyro, if the file has him
  Pocket.prototype.takeRoster = function (text) {
    var file = null; try { file = JSON.parse(text); } catch (e) { /* (not JSON) */ }
    if (!file || file.game !== 'DRAGONSLEEP' || file.kind !== PK.FILE_KIND || !Array.isArray(file.roster)) { this.msg = { text: 'that file is not a Pocket DM roster', t: 300, bad: true }; return null; }
    var st = this.st, added = 0, had = 0, bad = 0;
    file.roster.forEach(function (c) {
      var ok = false; try { ok = !!(c && typeof c.code === 'string' && NPC.spec(c.code)); } catch (e) { ok = false; }
      if (!ok) { bad++; return; }
      if (st.roster.some(function (r) { return r.code === c.code && r.name === c.name; })) { had++; return; }
      st.roster.push({ code: c.code, name: String(c.name || 'unnamed').slice(0, 24), cls: c.cls, lvl: c.lvl, made: c.made || Date.now() }); added++;
    });
    var pyro = !!file.pyro && !st.pyro; if (pyro) st.pyro = true;
    this.cache = {};
    var res = { added: added, had: had, bad: bad, pyro: pyro, saved: this.keep() };
    if (res.saved) this.say((added ? added + ' brought in' : 'nothing new') + (had ? ', ' + had + ' already here' : '') + (bad ? ', ' + bad + ' would not build' : '') + (pyro ? ', and Pyro' : ''), 300);
    return res;
  };
  Pocket.prototype.copy = function (text, what) {
    var self = this;
    try { navigator.clipboard.writeText(text).then(function () { self.say((what || 'copied') + ' to the clipboard'); }, function () { self.say('could not copy'); }); }
    catch (e) { this.say('could not copy'); }
  };
  Pocket.prototype.email = function (rec) {
    var href = 'mailto:' + PK.MAIL + '?subject=' + encodeURIComponent('Pocket DM: ' + rec.result + ' vs ' + rec.foes) + '&body=' + encodeURIComponent(this.summary(rec) + '\n\n(the saved .json can be attached to this mail)');
    try { var a = document.createElement('a'); a.href = href; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { this.say('could not open the mail'); }
  };
  Pocket.prototype.open = function (url) { try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; } };

  // ------------------------------------------------------------------ the maker (his order: race & class, the scores, then the level; the gear; the spells; a name)
  Pocket.prototype.makeNew = function (slotIndex, custom) {
    var sp = custom ? NPC.decode(custom.code) : null;
    var abil = {}; NPC.ABIL.forEach(function (k) { abil[k] = sp && sp.abil ? sp.abil[k] : 10; });
    // (the code keeps the scores with the race's numbers in: take them back out for the dials)
    if (sp && sp.abil) { var rc = NPC.RACES[sp.race] || NPC.RACES.human; Object.keys(rc.abil).forEach(function (k) { abil[k] -= rc.abil[k]; }); }
    this.mk = { step: 1, slot: slotIndex, editing: custom ? this.st.party[slotIndex].custom : null, cls: sp ? sp.cls : 'fighter', race: sp ? sp.race : 'human', abil: abil, lvl: sp ? Math.min(PK.CAP, sp.lvl) : 1,
      equip: sp ? Object.assign({}, sp.equip) : null, alt: sp ? sp.alt : undefined, known: sp && sp.known ? sp.known.slice() : null, name: sp ? sp.name : '', tab: 'weapon', spellTab: 0,
      style: sp ? sp.style || NPC.CLASSES[sp.cls].style || null : null };
    if (!this.mk.equip) this.kitUp();
    this.go('maker');
  };
  // (the class's own kit -- and its own fighting style, the maker's STYLE tab picks another: 10-06)
  Pocket.prototype.kitUp = function () { var c = NPC.CLASSES[this.mk.cls]; this.mk.equip = { weapon: c.kit.weapon, armor: c.kit.armor || null, shield: c.kit.shield || null, ring: null, cloak: null }; this.mk.alt = c.kit.alt || null; this.mk.known = null; this.mk.style = c.style || null; };
  Pocket.prototype.mkSpec = function () {
    var m = this.mk, rc = NPC.RACES[m.race] || NPC.RACES.human, abil = {};
    NPC.ABIL.forEach(function (k) { abil[k] = m.abil[k] + (rc.abil[k] || 0); });
    var sp = { cls: m.cls, lvl: m.lvl, race: m.race, abil: abil, asis: true, maxhp: true, named: true, custom: true, equip: Object.assign({}, m.equip), alt: m.alt, name: m.name || (R.CLASSES[m.cls].name + ' ' + m.lvl) };
    if (m.style && (R.STYLE_FOR[m.cls] || []).indexOf(m.style) >= 0) sp.style = m.style;
    if (m.known) sp.known = m.known.slice();
    if (NPC.CLASSES[m.cls].pact) sp.pact = NPC.CLASSES[m.cls].pact;
    return sp;
  };
  Pocket.prototype.mkSheet = function () { try { return NPC.sheet(this.mkSpec()); } catch (e) { return null; } };
  // the mundane racks, by what the class may use (his: "generic kits per class"; the plus-ones are winnings)
  Pocket.prototype.rack = function (kind) {
    var h = this.mkSheet(), self = this, items = DS.DATA.items, out = [];
    Object.keys(items).forEach(function (id) {
      var it = items[id]; if (!it || typeof it !== 'object' || it.kind !== kind || it.noSell || bonusOf(it) > 0 || id === 'unarmed' || id === 'kingsplate' || id === 'macedisruption') return;
      if (kind === 'weapon' && !(it.price > 0)) return;
      if (kind === 'armor' && !(it.price > 0)) return;
      if (h && kind !== 'cloak' && !R.canEquip(kind === 'shield' ? Object.assign({}, h, { equip: Object.assign({}, h.equip, { weapon: self.mk.equip.weapon }) }) : h, it)) return;
      out.push(id);
    });
    out.sort(function (a, b) { return (items[a].price || 0) - (items[b].price || 0) || (items[a].name < items[b].name ? -1 : 1); });
    return out;
  };
  // the class's spells, the built ones (his: "classed based, SRD - what we don't have"): the cantrips and the levelled, with the counts the level knows
  Pocket.prototype.spellInfo = function () {
    var sp = this.mkSpec(), c = NPC.CLASSES[sp.cls], info = null;
    try { info = NPC.prepInfo(Object.assign({}, sp, { known: null })); } catch (e) { info = null; }
    if (!info) return null;
    var built = function (id) { return !!D.magic.data(id); };
    var nc = c.cantrips ? c.cantrips[sp.lvl - 1] : 0, cpool = (c.spells && c.spells[0] ? c.spells[0] : []).filter(built);
    return { nc: nc, cpool: cpool, n: info.n, pool: info.pool.filter(built), always: info.always, def: info.def, defC: cpool.slice(0, nc) };
  };
  Pocket.prototype.saveMade = function () {
    var sp = this.mkSpec(), code = NPC.code(sp), rec = { code: code, name: sp.name, cls: sp.cls, lvl: sp.lvl, made: Date.now() };
    if (this.mk.editing != null && this.st.roster[this.mk.editing]) this.st.roster[this.mk.editing] = rec;
    else { this.st.roster.push(rec); this.mk.editing = this.st.roster.length - 1; }
    this.st.party[this.mk.slot] = { custom: this.mk.editing };
    this.cache = {}; var kept = this.keep();
    D.sfx(kept ? 'levelup' : 'error'); // (not written: the message says so, and stays through the screen change)
    this.go('party');
  };

  // ------------------------------------------------------------------ the slots
  Pocket.prototype.cycle = function (i, dir) {
    var es = PK.entries(this.st), slot = this.st.party[i], at = -1;
    es.forEach(function (e, k) { if (slot.custom != null ? (e.kind === 'custom' && e.i === slot.custom) : slot.w === 'new' ? e.kind === 'new' : (e.kind === 'stock' && e.w === slot.w)) at = k; });
    var e = es[(at + dir + es.length) % es.length];
    if (e.kind === 'stock') this.st.party[i] = { w: e.w, lvl: Math.max(e.lo, Math.min(e.hi, slot.lvl || 3)), loot: [] };
    else if (e.kind === 'custom') this.st.party[i] = { custom: e.i };
    else this.st.party[i] = { w: 'new' };
    this.cache = {}; this.keep(); D.sfx('cursor');
  };
  Pocket.prototype.levelSlot = function (i, dir) {
    var slot = this.st.party[i], e = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0]; if (!e || e.king) return;
    var L = Math.max(e.lo, Math.min(e.hi || PK.CAP, (slot.lvl || e.lo) + dir));
    if (L === slot.lvl) { D.sfx('error'); return; }
    slot.lvl = L; this.cache = {}; this.keep(); D.sfx('cursor');
  };

  // ------------------------------------------------------------------ drawing
  Pocket.prototype.draw = function (ctx) {
    this.btns = [];
    drawHall(ctx, this.t, this.screen === 'title' ? 1 : 0.42);
    var s = this.screen;
    if (s === 'title') this.drawTitle(ctx);
    else if (s === 'useful') this.drawUseful(ctx);
    else if (s === 'party') this.drawParty(ctx);
    else if (s === 'maker') this.drawMaker(ctx);
    else if (s === 'map') this.drawMap(ctx);
    else if (s === 'cr') this.drawCR(ctx);
    else if (s === 'result') this.drawResult(ctx);
    else if (s === 'rest') this.drawRest(ctx);
    else if (s === 'fights') this.drawFights(ctx);
    else if (s === 'notes') this.drawNotes(ctx);
    if (this.msg && this.msg.t > 0) { var mw = D.textWidth(this.msg.text) + 16; D.win8(ctx, (D.W - mw) / 2, D.H - 30, mw, 16); D.text(ctx, this.msg.text, D.W / 2, D.H - 26, this.msg.bad ? P('red', 4) : P('gold', 4), 'center'); }
    this.placeField();
  };
  function head(ctx, title, sub) {
    ctx.save(); ctx.translate(D.W / 2, 6); ctx.scale(2, 2); D.text(ctx, title, 0, 0, P('gold', 4), 'center'); ctx.restore();
    if (sub) D.text(ctx, sub, D.W / 2, 24, P('silver', 5), 'center');
  }
  Pocket.prototype.drawTitle = function (ctx) {
    var self = this;
    ctx.save(); ctx.translate(D.W / 2, 22); ctx.scale(3, 3); D.text(ctx, 'POCKET DM', 0, 0, P('gold', 4), 'center'); ctx.restore();
    D.text(ctx, '{o}alpha{/}', D.W / 2 + 92, 20, P('fire', 1));
    D.text(ctx, 'any party, any map, any CR -- every fight a URL', D.W / 2, 50, P('bone', 1), 'center');
    // (the buttons stand to the right, so the stone and the light on it stay in view)
    var w = 150, x = D.W - w - 22, y = 150, n = this.st.fights.length;
    this.btn(ctx, this.st.run ? 'THE LADDER: ' + (this.st.run.trial ? 'THE TRIAL' : 'RUNG ' + this.st.run.rung) : 'START', x, y, w, 18, function () { if (self.st.run) { self.foes = self.st.run.foes; self.fightMap = self.st.run.map; self.go('cr'); } else self.go('party'); }, { pri: true });
    this.btn(ctx, 'FIGHTS' + (n ? '  (' + n + ')' : ''), x, y + 22, w, 16, function () { self.go('fights'); }, { dis: !n });
    this.btn(ctx, 'USEFULS', x, y + 41, w, 16, function () { self.go('useful'); });
    this.btn(ctx, 'THE 8-BIT GAME', x, y + 60, w, 16, function () { location.href = '../'; });
    D.text(ctx, 'Solskaft: the oath-stone of the Silversands, under the Sunshaft. At noon the light lands here.', D.W / 2, 243, P('stone', 5), 'center');
    D.hint(ctx, 'up/down choose · E go · X the 8-bit game · the Discord: ' + PK.DISCORD.replace('https://', ''), D.W / 2, 256, P('stone', 4), 'center');
  };
  Pocket.prototype.drawUseful = function (ctx) {
    var self = this;
    head(ctx, 'USEFULS', 'the other doors of the grid, and the pages beside the game');
    var rows = [['THE LADDER', 'the story\'s fights, rung by rung, the four at each level', function () { location.href = '?ladder'; }],
      ['THE TESTER LADDER', 'Talmok, Willem, Katarina and Torvald; you watch, or play (P) and it is recorded', function () { location.href = '?ladder&party=ours'; }],
      ['THE CLIMB', 'one party from level 1 to 9, your own picks at each level', function () { location.href = '?climb'; }],
      ['THE SPELL GALLERY', 'every spell on the grid, cast in turn', function () { location.href = '?fxgallery'; }],
      ['THE FEATURE GALLERY', 'every class feature, fired in turn', function () { location.href = '?fxgallery&features'; }],
      ['TEST RUNS', 'the page that builds any URL of the game, row by row', function () { self.open('../test-runs.html'); }],
      ['SITUATIONS', 'twenty places in the 8-bit story to stand, one step short', function () { self.open('../situations.html'); }],
      ['EVERY URL', 'URLS.md: the whole list, with what each does', function () { self.open('https://github.com/GrimGriz/dragonsleep-8bit/blob/main/URLS.md'); }],
      ['THE DISCORD', PK.DISCORD, function () { self.open(PK.DISCORD); }]];
    var y = 40;
    rows.forEach(function (r) { self.btn(ctx, r[0], 20, y, 150, 15, r[2]); D.text(ctx, r[1], 180, y + 4, P('bone', 1)); y += 19; });
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
  };
  // the party: the slots across, arrows above and below (his words), the level beneath
  Pocket.prototype.drawParty = function (ctx) {
    var self = this, st = this.st, sh = this.sheets(), n = st.party.length;
    head(ctx, 'THE PARTY', n + ' of 6 · arrows cycle the roster · the ? makes a new one · level cap ' + PK.CAP + (st.pyro ? ' · Pyro at his 12' : ''));
    var cw = 70, gap = 6, x0 = Math.round((D.W - (n * cw + (n - 1) * gap)) / 2), top = 40;
    sh.forEach(function (s, i) {
      var x = x0 + i * (cw + gap), slot = s.slot, isNew = slot.w === 'new', e = isNew ? null : PK.STOCK.filter(function (q) { return q.w === slot.w; })[0];
      var locked = !!(e && e.king && !st.pyro), custom = slot.custom != null;
      self.btn(ctx, '^', x + cw / 2 - 12, top, 24, 11, function () { self.cycle(i, -1); }, { small: true });
      ctx.fillStyle = 'rgba(20,16,30,.9)'; ctx.fillRect(x, top + 13, cw, 118);
      ctx.strokeStyle = locked ? P('stone', 2) : isNew ? P('gold', 2) : P('stone', 3); ctx.strokeRect(x + 0.5, top + 13.5, cw - 1, 117);
      if (isNew) {
        ctx.save(); ctx.translate(x + cw / 2, top + 40); ctx.scale(3, 3); D.text(ctx, '?', 0, 0, P('gold', 4), 'center'); ctx.restore();
        D.text(ctx, 'a new', x + cw / 2, top + 80, P('bone', 1), 'center'); D.text(ctx, 'character', x + cw / 2, top + 89, P('bone', 1), 'center');
        self.btn(ctx, 'MAKE', x + 8, top + 108, cw - 16, 14, function () { self.makeNew(i, null); }, { pri: true });
      } else if (s.h) {
        var look = s.look;
        if (look && D.spr.has(look)) { ctx.save(); if (locked) ctx.globalAlpha = 0.35; D.spr.draw(ctx, look, 'idle', 0, self.t, x + cw / 2, top + 16 + Math.min(D.spr.top(look), 50) + 2, {}); ctx.restore(); }
        else if (look && !D.spr.failed(look)) D.text(ctx, ['.', '..', '...'][(self.t >> 4) % 3], x + cw / 2, top + 44, P('stone', 5), 'center'); // (its figure on its way)
        var nm = s.h.name.length > 11 ? s.h.name.slice(0, 11) : s.h.name;
        D.text(ctx, (locked ? '{g}' : '{y}') + nm + '{/}', x + cw / 2, top + 72, P('bone', 1), 'center');
        D.text(ctx, R.CLASSES[s.h.cls].name + ' ' + s.h.lvl, x + cw / 2, top + 82, locked ? P('stone', 4) : P('bone', 1), 'center');
        if (locked) { D.text(ctx, 'LOCKED', x + cw / 2, top + 94, P('red', 4), 'center'); D.text(ctx, 'win the trial', x + cw / 2, top + 104, P('stone', 5), 'center'); }
        else {
          var wn = R.weaponOf(s.h); D.text(ctx, 'HP ' + s.h.maxhp + ' AC ' + R.ac(s.h), x + cw / 2, top + 93, P('silver', 5), 'center');
          D.text(ctx, wn ? (wn.name.length > 13 ? wn.name.slice(0, 13) : wn.name) : '', x + cw / 2, top + 102, P('stone', 5), 'center');
          if (custom) self.btn(ctx, 'EDIT', x + 8, top + 113, cw - 16, 12, function () { self.makeNew(i, st.roster[slot.custom]); }, { small: true });
          else if (e && e.king) D.text(ctx, 'the king\'s own gear', x + cw / 2, top + 115, P('stone', 4), 'center');
          else { self.btn(ctx, '<', x + 8, top + 113, 14, 12, function () { self.levelSlot(i, -1); }, { small: true }); D.text(ctx, 'L' + s.h.lvl, x + cw / 2, top + 115, P('gold', 4), 'center'); self.btn(ctx, '>', x + cw - 22, top + 113, 14, 12, function () { self.levelSlot(i, 1); }, { small: true }); }
        }
      } else { D.text(ctx, '(no sheet)', x + cw / 2, top + 60, P('red', 4), 'center'); }
      self.btn(ctx, 'v', x + cw / 2 - 12, top + 134, 24, 11, function () { self.cycle(i, 1); }, { small: true });
    });
    var ready = this.ready();
    this.btn(ctx, '- a seat', 20, 200, 70, 14, function () { if (st.party.length > 1) { st.party.pop(); self.cache = {}; self.keep(); } }, { dis: n <= 1 });
    this.btn(ctx, '+ a seat', 96, 200, 70, 14, function () { if (st.party.length < 6) { st.party.push({ w: 'new' }); self.cache = {}; self.keep(); } }, { dis: n >= 6 });
    if (st.roster.length) D.text(ctx, st.roster.length + ' of your own on the roster (cycle to them)', 180, 203, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE ROSTER', 88, 236, 114, 15, function () { self.saveRoster(); }, { dis: !st.roster.length }); // (the roster's own file: saveRoster above, 10-03)
    this.btn(ctx, 'LOAD ROSTER', 208, 236, 114, 15, function () { self.loadRoster(); });
    this.btn(ctx, 'NEXT: THE MAP', D.W - 150, 236, 130, 15, function () { if (self.st.run) { self.st.run = null; } self.go('map'); }, { pri: true, dis: !ready });
    if (!ready) D.text(ctx, 'every seat wants a character (a locked one cannot come)', D.W / 2, 222, P('fire', 1), 'center');
    else D.hint(ctx, 'E on a card\'s arrows cycles · X back', D.W / 2, 222, P('stone', 4), 'center');
  };
  // the maker, step by step
  Pocket.prototype.drawMaker = function (ctx) {
    var self = this, m = this.mk, step = m.step, h = this.mkSheet();
    var names = ['', 'RACE AND CLASS', 'THE SCORES', 'THE LEVEL', 'THE GEAR', 'THE SPELLS', 'A NAME'];
    var caster = !!(R.CLASSES[m.cls].caster), steps = caster ? 6 : 5, showStep = step === 6 && !caster ? 5 : step;
    head(ctx, 'A NEW CHARACTER', 'step ' + Math.min(showStep, steps) + ' of ' + steps + ': ' + names[step]);
    var y = 40;
    if (step === 1) {
      D.text(ctx, '{y}RACE{/}', 30, y, P('bone', 1)); D.text(ctx, '{y}CLASS{/}', 250, y, P('bone', 1));
      var races = Object.keys(NPC.RACES), classes = Object.keys(NPC.CLASSES);
      races.forEach(function (rk, i) { var rc = NPC.RACES[rk], ks = Object.keys(rc.abil); self.btn(ctx, rc.name, 30, y + 12 + i * 15, 90, 13, function () { m.race = rk; }, { on: m.race === rk, small: true }); D.text(ctx, ks.length === 6 ? '+1 to all six' : ks.map(function (k) { return k.toUpperCase() + '+' + rc.abil[k]; }).join(' '), 126, y + 15 + i * 15, P('stone', 5)); });
      classes.forEach(function (ck, i) { var col = i < 6 ? 0 : 1, row = i % 6; self.btn(ctx, R.CLASSES[ck].name, 250 + col * 110, y + 12 + row * 15, 100, 13, function () { if (m.cls !== ck) { m.cls = ck; self.kitUp(); } }, { on: m.cls === ck, small: true }); });
      D.text(ctx, 'the race\'s numbers go on top of the scores you set next', 250, y + 108, P('stone', 5));
    } else if (step === 2) {
      var rc = NPC.RACES[m.race] || NPC.RACES.human;
      D.text(ctx, 'ten each to start; 3 to 18 (your table character\'s numbers, if you have one)', D.W / 2, y, P('silver', 5), 'center');
      NPC.ABIL.forEach(function (k, i) {
        var yy = y + 14 + i * 17, v = m.abil[k], tot = v + (rc.abil[k] || 0);
        D.text(ctx, k.toUpperCase(), 90, yy + 3, P('gold', 4));
        self.btn(ctx, '<', 130, yy, 16, 13, function () { if (m.abil[k] > 3) m.abil[k]--; else D.sfx('error'); }, { small: true });
        D.text(ctx, String(v), 162, yy + 3, P('bone', 2), 'center');
        self.btn(ctx, '>', 178, yy, 16, 13, function () { if (m.abil[k] < 18) m.abil[k]++; else D.sfx('error'); }, { small: true });
        D.text(ctx, (rc.abil[k] ? '+' + rc.abil[k] + ' ' + rc.name.toLowerCase() : ''), 204, yy + 3, P('moss', 2));
        D.text(ctx, '= ' + tot + '  (' + (DS.mod(tot) >= 0 ? '+' : '') + DS.mod(tot) + ')', 300, yy + 3, P('bone', 1));
      });
      var total = 0; NPC.ABIL.forEach(function (k) { total += m.abil[k]; });
      D.text(ctx, 'sum ' + total + (total === 60 ? ' (ten each)' : total <= 72 ? '' : '  -- generous'), 90, y + 120, P('stone', 5));
      this.btn(ctx, 'ALL TENS', 300, y + 117, 70, 13, function () { NPC.ABIL.forEach(function (k) { m.abil[k] = 10; }); }, { small: true });
      this.btn(ctx, 'THE ARRAY', 376, y + 117, 76, 13, function () { var c = NPC.CLASSES[m.cls]; c.prio.forEach(function (k, i) { m.abil[k] = [15, 14, 13, 12, 10, 8][i]; }); }, { small: true });
    } else if (step === 3) {
      D.text(ctx, 'the level, 1 to ' + PK.CAP + ' (ability score improvements come with it, +2 to the class\'s first)', D.W / 2, y, P('silver', 5), 'center');
      this.btn(ctx, '<', 190, y + 20, 20, 16, function () { if (m.lvl > 1) m.lvl--; else D.sfx('error'); });
      ctx.save(); ctx.translate(240, y + 18); ctx.scale(2, 2); D.text(ctx, String(m.lvl), 0, 0, P('gold', 4), 'center'); ctx.restore();
      this.btn(ctx, '>', 270, y + 20, 20, 16, function () { if (m.lvl < PK.CAP) m.lvl++; else D.sfx('error'); });
      if (h) {
        var lines = ['HP ' + h.maxhp + ' (a max hit die a level)  ·  AC ' + R.ac(h) + '  ·  proficiency +' + R.prof(h.lvl), 'scores: ' + NPC.ABIL.map(function (k) { return k.toUpperCase() + ' ' + h.abil[k]; }).join('  ')];
        if (h.subclass) lines.push(h.subclass);
        if (h.slotsMax && h.slotsMax.length) lines.push('slots ' + h.slotsMax.map(function (n, i) { return (i + 1) + ':' + n; }).join(' '));
        lines.forEach(function (l, i) { D.text(ctx, l, D.W / 2, y + 48 + i * 11, P('bone', 1), 'center'); });
      }
    } else if (step === 4) {
      // the fighting style beside the gear, from the class's level (SRD 5.1: the fighter at 1, the paladin and the ranger at 2; 10-06, Griz:
      // "Pocket DM is meant exactly for that type of character building")
      var stl = R.STYLE_AT[m.cls] && m.lvl >= R.STYLE_AT[m.cls] ? R.STYLE_FOR[m.cls] : null, per = 11, list = [], from = 0;
      if (m.tab === 'style' && !stl) m.tab = 'weapon';
      var tabs = [['weapon', 'WEAPON'], ['armor', 'ARMOUR'], ['shield', 'SHIELD'], ['alt', 'SECOND WEAPON']].concat(stl ? [['style', 'STYLE']] : []), tw = stl ? 90 : 110;
      tabs.forEach(function (tb, i) { self.btn(ctx, tb[1], 20 + i * tw, y, tw - 6, 13, function () { m.tab = tb[0]; self.scroll = 0; }, { on: m.tab === tb[0], small: true }); });
      if (m.tab === 'style') {
        stl.forEach(function (k, i) {
          var st = R.STYLES[k], yy = y + 18 + i * 15;
          self.btn(ctx, st.name, 20, yy, 130, 13, function () { m.style = k; }, { on: m.style === k, small: true });
          D.text(ctx, st.words, 156, yy + 3, P('bone', 1));
        });
        D.text(ctx, 'chosen at ' + R.CLASSES[m.cls].name.toLowerCase() + ' ' + R.STYLE_AT[m.cls] + ' (SRD 5.1); two-weapon fighting waits with the off-hand attack', 20, y + 18 + stl.length * 15 + 6, P('stone', 5));
      } else {
        var kind = m.tab === 'alt' ? 'weapon' : m.tab, rack = this.rack(kind), cur = m.tab === 'alt' ? m.alt : m.equip[m.tab];
        list = (m.tab === 'weapon' ? [] : [null]).concat(rack); from = Math.min(this.scroll, Math.max(0, list.length - per));
        this.scroll = from;
        list.slice(from, from + per).forEach(function (id, i) {
          var it = id ? DS.DATA.items[id] : null, yy = y + 18 + i * 15, label = it ? it.name : 'none';
          self.btn(ctx, label, 20, yy, 130, 13, function () { if (m.tab === 'alt') m.alt = id; else m.equip[m.tab] = id; if (m.tab === 'weapon' && id && (DS.DATA.items[id].weapon.props || []).indexOf('two-handed') >= 0) m.equip.shield = null; }, { on: cur === id, small: true });
          if (it) D.text(ctx, (it.desc || '').slice(0, 54), 156, yy + 3, P('bone', 1));
        });
      }
      var hs = h && R.style(h), sumLine = h ? 'AC ' + R.ac(h) + '  ·  ' + (R.weaponOf(h) || {}).name + (m.alt ? '  ·  second: ' + (DS.DATA.items[m.alt] || {}).name : '') + (hs ? '  ·  ' + R.STYLES[hs].name.toLowerCase() : '') : '';
      var sw2 = D.text(ctx, sumLine, 20, y + 18 + per * 15 + 1, P('gold', 4));
      if (list.length > per) D.text(ctx, '  {g}(wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length + '){/}', 20 + sw2, y + 18 + per * 15 + 1, P('stone', 5));
      this.btn(ctx, 'THE KIT', D.W - 90, y + 18 + per * 15 - 2, 70, 13, function () { var k = m.known; self.kitUp(); m.known = k; }, { small: true });
    } else if (step === 5) {
      var info = this.spellInfo();
      if (!info) { D.text(ctx, 'no spells for this class at this level', D.W / 2, y + 20, P('silver', 5), 'center'); }
      else {
        if (!m.known) m.known = info.defC.concat(info.def);
        var pickedC = m.known.filter(function (id) { return info.cpool.indexOf(id) >= 0; }), picked = m.known.filter(function (id) { return info.pool.indexOf(id) >= 0; });
        var tabs2 = [['cantrips ' + pickedC.length + '/' + info.nc, 0], ['spells ' + picked.length + '/' + info.n, 1]];
        tabs2.forEach(function (tb, i) { self.btn(ctx, tb[0], 20 + i * 120, y, 114, 13, function () { m.spellTab = tb[1]; self.scroll = 0; }, { on: m.spellTab === tb[1], small: true }); });
        this.btn(ctx, 'THE CLASS\'S OWN', 270, y, 120, 13, function () { m.known = info.defC.concat(info.def); }, { small: true });
        var pool = m.spellTab ? info.pool : info.cpool, cap = m.spellTab ? info.n : info.nc, have = m.spellTab ? picked : pickedC;
        var per2 = 22, cols = 2, from2 = Math.min(this.scroll * cols, Math.max(0, pool.length - per2)); this.scroll = Math.floor(from2 / cols);
        pool.slice(from2, from2 + per2).forEach(function (id, i) {
          var sd = D.magic.data(id), col = i % cols, row = Math.floor(i / cols), yy = y + 18 + row * 15, on = m.known.indexOf(id) >= 0;
          self.btn(ctx, (sd.level ? 'L' + sd.level + ' ' : '') + sd.name, 20 + col * 225, yy, 218, 13, function () {
            if (on) m.known = m.known.filter(function (x) { return x !== id; });
            else if (have.length >= cap) { D.sfx('error'); self.say('that is the count for level ' + m.lvl + ': take one off first'); }
            else m.known.push(id);
          }, { on: on, small: true });
        });
        if (pool.length > per2) D.text(ctx, 'wheel to scroll', 20, y + 18 + 11 * 15, P('stone', 5));
        if (info.always.length) D.text(ctx, 'always ready: ' + info.always.map(function (id) { return D.magic.data(id).name; }).join(', '), 20, y + 18 + 11 * 15 + 10, P('moss', 2));
      }
    } else if (step === 6) {
      D.text(ctx, 'a name (letters and numbers; 24 at most)', D.W / 2, y, P('silver', 5), 'center');
      this.useField('name', { x: 140, y: y + 16, w: 200, h: 16 }, m.name, function (v) { m.name = v; });
      if (h) {
        var sp = this.mkSpec(), code = NPC.code(sp);
        var ls = [(m.name || (R.CLASSES[m.cls].name + ' ' + m.lvl)) + ' -- ' + (NPC.RACES[m.race] || {}).name + ' ' + R.CLASSES[m.cls].name + ' ' + m.lvl + (h.subclass ? ' (' + h.subclass + ')' : ''),
          'HP ' + h.maxhp + '  AC ' + R.ac(h) + '  ' + (R.weaponOf(h) || {}).name + (h.equip.armor ? ', ' + DS.DATA.items[h.equip.armor].name : '') + (h.equip.shield ? ', shield' : ''),
          NPC.ABIL.map(function (k) { return k.toUpperCase() + ' ' + h.abil[k]; }).join('  ')];
        if (R.style(h)) ls.push('fighting style: ' + R.STYLES[R.style(h)].name);
        if (h.known && h.known.length) ls.push('spells: ' + h.known.map(function (id) { var sd = D.magic.data(id); return sd ? sd.name : id; }).join(', '));
        var yy2 = y + 44; ls.forEach(function (l) { D.wrap(l, D.W - 60).forEach(function (w) { D.text(ctx, w, 30, yy2, P('bone', 1)); yy2 += 10; }); });
        D.text(ctx, 'the word: ', 30, yy2 + 6, P('stone', 5));
        D.wrap(code, D.W - 60).slice(0, 3).forEach(function (w, i) { D.text(ctx, w, 30, yy2 + 16 + i * 10, P('stone', 5)); });
      }
    }
    this.btn(ctx, step === 1 ? 'BACK' : '< BACK', 20, 236, 70, 15, function () { self.back(); });
    if (step < 6) this.btn(ctx, 'NEXT >', D.W - 100, 236, 80, 15, function () { m.step = step === 4 && !caster ? 6 : step + 1; self.scroll = 0; self.dropField(); }, { pri: true });
    else this.btn(ctx, 'SAVE', D.W - 100, 236, 80, 15, function () { self.saveMade(); }, { pri: true });
  };
  // the maps, the dark ones said so and shown so
  Pocket.prototype.drawMap = function (ctx) {
    var self = this, ids = this.mapIds(), list = [null].concat(ids), per = 12;
    head(ctx, 'THE MAP', 'a dark map is lit only by its lamps and what the party brings; the ? draws one');
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    list.slice(from, from + per).forEach(function (id, i) {
      var def = id ? D.MAPS[id] : null, yy = 36 + i * 16, label = def ? def.name : '?  a random map';
      self.btn(ctx, label.length > 24 ? label.slice(0, 24) : label, 14, yy, 150, 14, function () { self.mapSel = id; self.keep(); }, { on: self.mapSel === id || (!id && !self.mapSel), small: true });
      if (def && def.dark) D.text(ctx, '{p}DARK{/}', 168, yy + 3, P('violet', 5));
    });
    if (list.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 14, 36 + per * 16, P('stone', 5));
    var sel = this.mapSel && D.MAPS[this.mapSel] ? this.mapSel : null, def2 = sel ? D.MAPS[sel] : null, px = 210, py = 36, pw = 256, ph = 160;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    if (def2) {
      drawMini(ctx, def2, px + 4, py + 4, pw - 8, ph - 30);
      D.text(ctx, '{y}' + def2.name + '{/}' + (def2.sub ? '  ' + def2.sub : ''), px + 6, py + ph - 22, P('bone', 1));
      D.text(ctx, def2.rows[0].length + ' x ' + def2.rows.length + ' squares' + (def2.dark ? '  ·  {p}DARK{/}: ' + ((def2.lights || []).length ? (def2.lights.length + ' light' + (def2.lights.length === 1 ? '' : 's') + ' of its own') : 'no light of its own') : '  ·  lit'), px + 6, py + ph - 12, P('silver', 5));
    } else { ctx.save(); ctx.translate(px + pw / 2, py + 50); ctx.scale(3, 3); D.text(ctx, '?', 0, 0, P('gold', 4), 'center'); ctx.restore(); D.text(ctx, 'a map drawn at random when the fight is set', px + pw / 2, py + 100, P('bone', 1), 'center'); D.text(ctx, '(dark ones among them)', px + pw / 2, py + 112, P('stone', 5), 'center'); }
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'NEXT: THE FOES', D.W - 150, 236, 130, 15, function () { self.fightMap = self.mapFor() || self.randomMap(); if (self.crI < 0) self.crI = self.defaultCR(); self.reroll(); self.go('cr'); }, { pri: true });
  };
  // the dial, the roll, the reading, and the ways in
  Pocket.prototype.drawCR = function (ctx) {
    var self = this, run = this.st.run, levels = this.levels(), kinds = this.foes || [], d = PK.diff(levels, kinds), mapId = this.fightMap || this.mapFor() || '?';
    if (this.crI < 0) this.crI = this.defaultCR();
    if (!this.foes) this.reroll();
    var fk = (this.foes || []).join(); if (this.foesAsked !== fk) { this.foesAsked = fk; D.spr.prefetch((this.foes || []).map(function (k) { return D.FOES[k] && D.FOES[k].sheet; })); } // (the table's foes fetched behind while it is set: js/sprites.js, 10-03)
    var title = run ? (run.trial ? 'THE TRIAL' : 'RUNG ' + run.rung + ' OF 4') : 'THE FOES';
    head(ctx, title, run ? (run.trial ? 'double deadly: win it and Pyro joins the roster' : 'the table set for you; a short rest between rungs') : 'the CR is the sum of theirs; the reading is the DMG\'s for this party');
    // the dial
    var sx = 60, sw = D.W - 120, sy = 40;
    ctx.fillStyle = P('stone', 2); ctx.fillRect(sx, sy + 6, sw, 3);
    var frac = this.crI / (PK.VALUES.length - 1), kx = Math.round(sx + frac * sw);
    ctx.fillStyle = run ? P('stone', 4) : P('gold', 3); ctx.fillRect(kx - 3, sy, 7, 15);
    if (!run) {
      this.btn(ctx, '<', 20, sy, 30, 15, function () { self.setCR(self.crI - 1); }, { small: true });
      this.btn(ctx, '>', D.W - 50, sy, 30, 15, function () { self.setCR(self.crI + 1); }, { small: true });
      if (I.mouse.click && I.mouse.inside && I.mouse.x >= sx && I.mouse.x < sx + sw && I.mouse.y >= sy - 4 && I.mouse.y < sy + 20) { this.drag = { x: sx, w: sw }; var idx = Math.round(Math.max(0, Math.min(1, (I.mouse.x - sx) / sw)) * (PK.VALUES.length - 1)); if (idx !== this.crI) this.setCR(idx); }
      if (!I.mouse.inWin) this.drag = null;
    }
    ctx.save(); ctx.translate(60, 60); ctx.scale(2, 2); D.text(ctx, 'CR ' + PK.fmt8(PK.sum8(kinds)), 0, 0, P('gold', 4)); ctx.restore();
    var col = d.label === 'DEADLY' ? P('red', 4) : d.label === 'HARD' ? P('fire', 1) : d.label === 'MEDIUM' ? P('gold', 4) : P('moss', 2);
    D.text(ctx, '{y}' + d.label + (d.deadlyX > 1 ? ' x' + d.deadlyX : '') + '{/}  for ' + levels.length + ' at level' + (levels.length === 1 ? ' ' : 's ') + levels.join('/'), 180, 58, col);
    D.text(ctx, 'adjusted XP ' + d.adj + ' (' + d.xp + ' x ' + d.mult + ')  ·  deadly at ' + d.thresh[3], 180, 68, P('silver', 5));
    D.text(ctx, 'on ' + ((D.MAPS[mapId] || {}).name || 'a random map') + ((D.MAPS[mapId] || {}).dark ? '  {p}DARK{/}' : ''), 180, 78, P('silver', 5));
    // the roll
    var cnt = PK.countKinds(kinds), y = 90;
    cnt.slice(0, 9).forEach(function (c, i) { var colI = i % 3, row = Math.floor(i / 3); D.text(ctx, (c.n > 1 ? c.n + ' x ' : '') + c.name + '  {g}CR ' + c.cr + '{/}', 60 + colI * 140, y + row * 11, P('bone', 1)); });
    if (!cnt.length) D.text(ctx, 'nothing fits this dial on this map', 60, y, P('red', 4));
    var wy = 132;
    if (!run || this.lossMenu) this.btn(ctx, 'REROLL', 60, wy, 80, 15, function () { self.reroll(); });
    this.btn(ctx, 'WATCH: ' + (this.watch ? 'ON' : 'OFF'), 150, wy, 100, 15, function () { self.watch = !self.watch; self.keep(); }, { on: this.watch, small: true });
    D.text(ctx, this.watch ? 'the class AI runs your side too; you watch' : 'you run your side', 258, wy + 4, P('stone', 5));
    // the URL
    var q = PK.query(kinds, this.words(), this.topLevel(), mapId === '?' ? null : mapId, this.watch), url = PK.url(q);
    D.text(ctx, 'the URL (E on it copies):', 60, 156, P('stone', 5));
    this.btn(ctx, url.length > 68 ? url.slice(0, 66) + '..' : url, 60, 166, D.W - 120, 14, function () { self.copy(url, 'the URL'); }, { small: true });
    // the ways in
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    if (run) {
      this.btn(ctx, run.trial ? 'FIGHT THE TRIAL' : 'FIGHT RUNG ' + run.rung, D.W - 170, 236, 150, 15, function () { self.launch(); }, { pri: true, dis: !kinds.length });
      this.btn(ctx, 'QUIT THE LADDER', 90, 236, 120, 15, function () { self.st.run = null; self.keep(); self.go('title'); });
      var pLine = (run.carry || []).map(function (c, i) { var s = self.sheets()[i]; return c && s && s.h ? s.h.name + ' ' + c.hp + '/' + c.maxhp : null; }).filter(Boolean).join('  ·  ');
      if (pLine) D.text(ctx, pLine, D.W / 2, 200, P('bone', 1), 'center');
      D.text(ctx, 'won ' + (run.won || 0) + ' of ' + (run.trial ? '4, and now the trial' : '4'), D.W / 2, 212, P('silver', 5), 'center');
    } else {
      this.btn(ctx, 'FIGHT', D.W - 90, 236, 70, 15, function () { self.launch(); }, { pri: true, dis: !kinds.length });
      this.btn(ctx, 'THE LADDER: 4 RUNGS FROM HERE', D.W - 300, 236, 200, 15, function () { self.startRun(); self.launch(); }, { dis: !kinds.length });
      D.wrap('the ladder: this table first, then three more at a third again each; SHORT REST FOR THE WICKED between; then a long rest, and the trial', D.W - 80).forEach(function (l, i) { D.text(ctx, l, D.W / 2, 204 + i * 10, P('stone', 5), 'center'); });
    }
  };
  Pocket.prototype.drawResult = function (ctx) {
    var self = this, r = this.result; if (!r) { this.go('title'); return; }
    var run = this.st.run, won = r.res === 'won', w = 400, x = (D.W - w) / 2, y = 40, h = 190;
    D.win8(ctx, x, y, w, h);
    var headT = r.unlocked ? '{y}THE TRIAL IS PASSED.{/}' : won ? '{y}WON{/}' : r.res === 'lost' ? '{r}LOST{/}' : r.res === 'escaped' ? '{o}OUT THE WAY THEY CAME IN{/}' : '{g}LEFT THE TABLE{/}';
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, headT, 0, 0, P('gold', 4), 'center'); ctx.restore();
    D.text(ctx, r.rec.foes + '  ·  CR ' + r.rec.cr + ', ' + r.rec.diff.toLowerCase() + '  ·  ' + r.rec.rounds + ' round' + (r.rec.rounds === 1 ? '' : 's') + (r.rec.downs ? '  ·  ' + r.rec.downs + ' down' : ''), D.W / 2, y + 30, P('bone', 1), 'center');
    var yy = y + 44;
    r.end.forEach(function (e) { D.text(ctx, (e.down ? '{r}' : '{y}') + e.name + '{/}  ' + e.hp + '/' + e.maxhp + (e.down ? '  down' : ''), D.W / 2, yy, P('bone', 1), 'center'); yy += 10; });
    if (r.loot) { yy += 4; D.text(ctx, '{y}' + r.loot.name + ' finds ' + DS.DATA.items[r.loot.item].name + '.{/}', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }
    if (r.unlocked) { yy += 4; D.text(ctx, '{y}Pyronimus, King of Solskaft, will walk with you.{/} He is on the roster now, at his 12, with his own gear.', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }
    var by = y + h - 22;
    if (run && won) {
      if (run.rung < 4) this.btn(ctx, 'SHORT REST FOR THE WICKED', x + 20, by, 190, 15, function () { self.restCard(); self.go('rest'); }, { pri: true });
      else this.btn(ctx, 'LONG REST FOR THE TRIAL', x + 20, by, 190, 15, function () { self.setTrial(); self.rest = { long: true }; self.go('rest'); }, { pri: true });
      this.btn(ctx, 'QUIT THE LADDER', x + w - 140, by, 120, 15, function () { self.st.run = null; self.keep(); self.go('title'); });
    } else if (run) {
      this.btn(ctx, 'RETRY', x + 20, by, 90, 15, function () { self.restore(); self.go('cr'); }, { pri: true });
      this.btn(ctx, 'REROLL THE RUNG', x + 120, by, 130, 15, function () { self.rerollRung(); });
      this.btn(ctx, 'QUIT', x + w - 90, by, 70, 15, function () { self.st.run = null; self.keep(); self.go('title'); });
      D.text(ctx, 'retry or reroll: the party as it went in', D.W / 2, by - 12, P('stone', 5), 'center');
    } else {
      this.btn(ctx, 'AGAIN', x + 20, by, 70, 15, function () { self.launch(); }, { pri: true });
      this.btn(ctx, 'NEW FOES', x + 100, by, 90, 15, function () { self.go('cr'); });
      this.btn(ctx, 'NOTES', x + 200, by, 70, 15, function () { self.note = 0; self.go('notes'); });
      this.btn(ctx, r.unlocked ? 'THE PARTY' : 'THE PARTY', x + w - 110, by, 90, 15, function () { self.go('party'); });
    }
  };
  Pocket.prototype.drawRest = function (ctx) {
    var self = this, run = this.st.run, w = 420, x = (D.W - w) / 2, y = 40, long = this.rest && this.rest.long;
    D.win8(ctx, x, y, w, 190);
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, long ? '{y}LONG REST FOR THE TRIAL{/}' : '{y}SHORT REST FOR THE WICKED{/}', 0, 0, P('gold', 4), 'center'); ctx.restore();
    var yy = y + 30;
    if (long) {
      D.text(ctx, 'A night of it. Hit points, slots and hit dice back; every feature ready.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12;
      D.text(ctx, 'Then the trial: ' + PK.foesText(run.foes) + ' on ' + ((D.MAPS[run.map] || {}).name || run.map) + '.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12;
      var dd = PK.diff(this.levels(), run.foes); D.text(ctx, '{r}' + dd.label + (dd.deadlyX > 1 ? ' x' + dd.deadlyX : '') + '{/}  adjusted XP ' + dd.adj + ' against deadly at ' + dd.thresh[3], D.W / 2, yy, P('red', 4), 'center');
    } else {
      D.text(ctx, 'An hour. The fallen are up first (the DM\'s hand), then hit dice till whole or out (SRD 5.1).', D.W / 2, yy, P('silver', 5), 'center'); yy += 12;
      (this.rest.lines || []).forEach(function (l) { D.wrap('{y}' + l.name + '{/} ' + l.hp + '/' + l.maxhp + ': ' + l.text + ' {g}(' + l.hd + ' hit dice left){/}', w - 30).forEach(function (t) { D.text(ctx, t, x + 15, yy, P('bone', 1)); yy += 10; }); });
    }
    this.btn(ctx, long ? 'TO THE TRIAL' : 'THE NEXT RUNG', x + w / 2 - 70, y + 190 - 22, 140, 15, function () { if (!long) self.nextRung(); self.go('cr'); }, { pri: true });
  };
  Pocket.prototype.drawFights = function (ctx) {
    var self = this, fs = this.st.fights, per = 11;
    head(ctx, 'THE FIGHTS', fs.length + ' kept in this browser · E on one for its notes, a file, a mail');
    var from = Math.min(this.scroll, Math.max(0, fs.length - per)); this.scroll = from;
    fs.slice(from, from + per).forEach(function (f, i) {
      var yy = 36 + i * 17, d = new Date(f.t), when = (d.getMonth() + 1) + '-' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      var rc = f.result === 'won' ? '{n}WON{/}' : f.result === 'lost' ? '{r}LOST{/}' : '{g}' + f.result + '{/}';
      self.btn(ctx, when + '  ' + rc + '  R' + f.rounds + (f.rung ? '  rung ' + f.rung : ''), 14, yy, 150, 15, function () { self.note = from + i; self.go('notes'); }, { small: true });
      D.text(ctx, (f.foes.length > 40 ? f.foes.slice(0, 40) + '..' : f.foes) + '  {g}CR ' + f.cr + ' ' + f.diff + '{/}' + (f.notes ? '  {y}*{/}' : ''), 170, yy + 4, P('bone', 1));
    });
    if (fs.length > per) D.text(ctx, 'wheel: ' + (from + 1) + '-' + Math.min(fs.length, from + per) + ' of ' + fs.length, 14, 36 + per * 17, P('stone', 5));
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'FORGET THEM ALL', D.W - 150, 236, 130, 15, function () { self.st.fights = []; self.keep(); self.go('title'); }, { dis: !fs.length });
  };
  Pocket.prototype.drawNotes = function (ctx) {
    var self = this, f = this.st.fights[this.note || 0]; if (!f) { this.go('fights'); return; }
    head(ctx, 'NOTES', new Date(f.t).toLocaleString());
    var ls = [(f.result === 'won' ? '{n}WON{/}' : f.result === 'lost' ? '{r}LOST{/}' : '{g}' + f.result + '{/}') + ' in ' + f.rounds + ' round' + (f.rounds === 1 ? '' : 's') + (f.downs ? ', ' + f.downs + ' down' : '') + (f.rung ? ' (rung ' + f.rung + ')' : ''), 'party: ' + f.party.join(', '), 'foes: ' + f.foes + '  (CR ' + f.cr + ', ' + f.diff + ')', 'map: ' + f.mapName + (f.loot ? '  ·  found: ' + f.loot : '')];
    var yy = 38; ls.forEach(function (l) { D.wrap(l, D.W - 40).forEach(function (t) { D.text(ctx, t, 20, yy, P('bone', 1)); yy += 10; }); });
    D.text(ctx, 'your notes (what you tried, what went wrong, what you would change):', 20, yy + 4, P('stone', 5));
    this.useField('area', { x: 20, y: yy + 16, w: D.W - 40, h: 215 - (yy + 16) }, f.notes, function (v) { f.notes = v; self.keep(); });
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE A FILE', 90, 236, 90, 15, function () { self.saveFile(f); }, { pri: true });
    this.btn(ctx, 'COPY', 186, 236, 50, 15, function () { self.copy(self.summary(f), 'the summary'); });
    this.btn(ctx, 'EMAIL GRIZ', 242, 236, 90, 15, function () { self.email(f); });
    this.btn(ctx, 'THE DISCORD', 338, 236, 90, 15, function () { self.copy(self.summary(f), 'the summary'); self.open(PK.DISCORD); });
    this.btn(ctx, 'URL', 434, 236, 30, 15, function () { self.copy(PK.url(f.q), 'the URL'); }, { small: true });
  };

  // ------------------------------------------------------------------ a map in little: its ground by character; a dark one greyed but for its lamps
  var MINI = { '#': '#161110', '.': '#46362c', '=': '#5c4838', ',': '#765e4a', 'g': '#3e6440', '~': '#1c2c5e', 'D': '#0e1430', 'r': '#342822', 'P': '#94795f', 'L': '#5c4838', '/': '#4e3c2e', 'c': '#b8c3d4', 'T': '#1e3a22', 'W': '#62401e', 'V': '#8c6430', 'k': '#3e2612', 'f': '#8c6430', 'w': '#475061', 'b': '#313846', 'y': '#3e2612', ' ': '#0a0810' };
  function drawMini(ctx, def, x, y, w, h) {
    var cols = def.rows[0].length, rows = def.rows.length, cell = Math.max(1, Math.floor(Math.min(w / cols, h / rows))), ox = x + Math.floor((w - cols * cell) / 2), oy = y + Math.floor((h - rows * cell) / 2);
    var lights = def.lights || [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var ch = def.rows[j][i], col = MINI[ch] || '#46362c';
      if (def.dark && ch !== '#' && ch !== ' ') {
        var lit = 0;
        lights.forEach(function (L) { var dd = Math.hypot(i - L[0], j - L[1]) * 5; if (dd <= L[2]) lit = Math.max(lit, 2); else if (dd <= L[2] * 2) lit = Math.max(lit, 1); });
        if (lit === 2) col = lightish(col, 0.35); else if (lit === 1) col = lightish(col, 0.12); else col = greyish(col);
      }
      ctx.fillStyle = col; ctx.fillRect(ox + i * cell, oy + j * cell, cell, cell);
    }
    (def.entry || []).forEach(function (e) { ctx.fillStyle = P('gold', 4); ctx.fillRect(ox + e[0] * cell, oy + e[1] * cell, cell, cell); });
    if (def.dark) lights.forEach(function (L) { ctx.fillStyle = '#f8d67a'; ctx.fillRect(ox + L[0] * cell, oy + L[1] * cell, cell, cell); });
  }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function rgb(a) { return 'rgb(' + a.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); }).join(',') + ')'; }
  function greyish(c) { var a = hex(c), g = (a[0] + a[1] + a[2]) / 3; return rgb([g * 0.35 + 10, g * 0.38 + 12, g * 0.5 + 22]); } // (the darkvision look: grey, a little blue)
  function lightish(c, f) { var a = hex(c); return rgb([a[0] + (255 - a[0]) * f, a[1] + (240 - a[1]) * f, a[2] + (200 - a[2]) * f * 0.8]); }

  // ------------------------------------------------------------------ the hall: Solskaft's clan hall from its doors, the dais and the empty high seat at the north
  // end, the oath-stone before it where the Sunshaft's noon lands (wiki/solskaft.md: "the beam pools on the oath-stone"; content/maps/solskaft.json
  // beam, sign at 17,22). Never drawn at 16-bit before (his word, 10-02): the 8-bit's colours (js/art.js dwarfWall, dwarfFloor, dais, throne,
  // oathStone, tombLamp) carried up, the beam as js/world.js drawBeam draws it. The still parts once to a canvas; the light and the motes a frame at a time
  var hallCv = null;
  function hallStill() {
    if (hallCv) return hallCv;
    var cv = document.createElement('canvas'); cv.width = D.W; cv.height = D.H;
    var c = cv.getContext('2d'), W = D.W, H = D.H, HOR = 150;
    // the ceiling, the skylight's throat
    c.fillStyle = '#121218'; c.fillRect(0, 0, W, 44);
    c.fillStyle = '#1a1a22'; for (var sx = 0; sx < W; sx += 16) c.fillRect(sx, 30 + ((sx / 16) & 1) * 2, 15, 1);
    c.fillStyle = '#26262e'; c.fillRect(196, 0, 88, 10); c.fillStyle = '#86847a'; c.fillRect(204, 0, 72, 8); c.fillStyle = '#c8c2a8'; c.fillRect(210, 0, 60, 5); c.fillStyle = '#eeeadc'; c.fillRect(216, 0, 48, 3);
    // the back wall: coursed stone
    c.fillStyle = '#26262e'; c.fillRect(0, 44, W, HOR - 44);
    for (var y = 44; y < HOR; y += 6) { var off = ((y / 6) & 1) ? 8 : 0; c.fillStyle = '#30303a'; for (var x = -off; x < W; x += 16) { c.fillRect(x, y, 15, 5); } c.fillStyle = '#3a3a44'; for (var x2 = -off; x2 < W; x2 += 16) c.fillRect(x2 + 1, y + 1, 9, 1); }
    // a frieze of runes along the wall (the hero-wall's hand)
    c.fillStyle = '#5a5a66'; c.fillRect(0, 56, W, 1); c.fillRect(0, 66, W, 1);
    for (var rx = 6; rx < W; rx += 7) if ((rx * 7 + 3) % 5 < 3) { c.fillStyle = (rx * 13) % 7 === 0 ? '#c0a040' : '#8a8a96'; c.fillRect(rx, 59 + ((rx / 7) & 1), 2, 4); }
    // the pillars
    [[36, 16], [428, 16]].forEach(function (p) {
      c.fillStyle = '#3a3a44'; c.fillRect(p[0] - 2, 10, p[1] + 4, HOR - 10 + 22);
      c.fillStyle = '#5a5a66'; c.fillRect(p[0], 10, p[1], HOR - 10 + 22);
      c.fillStyle = '#8a8a96'; c.fillRect(p[0] + 2, 10, 3, HOR - 10 + 22);
      c.fillStyle = '#44444e'; for (var by = 20; by < HOR + 20; by += 24) c.fillRect(p[0] - 2, by, p[1] + 4, 2);
      c.fillStyle = '#c0a040'; for (var gy = 32; gy < HOR + 10; gy += 24) c.fillRect(p[0] + 7, gy, 2, 2);
      c.fillStyle = '#6e6e7a'; c.fillRect(p[0] - 4, HOR + 20, p[1] + 8, 6); c.fillStyle = '#3a3a44'; c.fillRect(p[0] - 4, HOR + 26, p[1] + 8, 2);
    });
    // the floor: flagstones, the near rows taller
    var fy = HOR, rowH = 5, k = 0;
    c.fillStyle = '#5a5a66'; c.fillRect(0, HOR, W, H - HOR);
    while (fy < H) {
      var colW = 16 + k * 3;
      c.fillStyle = '#44444e'; c.fillRect(0, fy, W, 1);
      for (var fx = W / 2 - Math.ceil(W / colW) * colW - ((k & 1) ? colW / 2 : 0); fx < W; fx += colW) c.fillRect(Math.round(fx), fy, 1, rowH);
      c.fillStyle = '#6e6e7a'; for (var fx2 = W / 2 - Math.ceil(W / colW) * colW - ((k & 1) ? colW / 2 : 0) + 2; fx2 < W; fx2 += colW) c.fillRect(Math.round(fx2), fy + 1, 1, 1);
      fy += rowH; rowH = Math.min(30, rowH + 2 + (k & 1)); k++;
    }
    // the dais and the high seat
    c.fillStyle = '#3a3a44'; c.fillRect(170, 141, 140, 10);
    c.fillStyle = '#6a6a76'; c.beginPath(); c.moveTo(178, 122); c.lineTo(302, 122); c.lineTo(312, 141); c.lineTo(168, 141); c.closePath(); c.fill();
    c.fillStyle = '#7a7a86'; c.fillRect(182, 122, 116, 1); c.fillStyle = '#9a9aa6'; c.fillRect(168, 141, 144, 1); c.fillStyle = '#54545e'; for (var dx = 186; dx < 300; dx += 16) c.fillRect(dx, 124, 1, 16);
    c.fillStyle = '#3a3a44'; c.fillRect(224, 66, 32, 56); c.fillStyle = '#6e6e7a'; c.fillRect(227, 70, 26, 36); c.fillStyle = '#5a5a66'; c.fillRect(220, 104, 40, 12); c.fillStyle = '#7a7a86'; c.fillRect(224, 106, 32, 4);
    c.fillStyle = '#30303a'; c.fillRect(218, 116, 44, 4); c.fillRect(220, 96, 6, 20); c.fillRect(254, 96, 6, 20);
    c.fillStyle = '#c0a040'; c.fillRect(239, 72, 2, 2); c.fillRect(235, 76, 2, 2); c.fillRect(243, 76, 2, 2); c.fillStyle = '#3a3a44'; c.fillRect(230, 60, 20, 6); c.fillRect(236, 56, 8, 4);
    // the tomb lamps either side of the dais
    [150, 330].forEach(function (lx) { c.fillStyle = '#2a2a30'; c.fillRect(lx - 1, 104, 3, 44); c.fillRect(lx - 5, 146, 11, 2); c.fillStyle = '#1a1a20'; c.fillRect(lx - 5, 88, 11, 16); c.fillStyle = '#2a2a30'; c.fillRect(lx - 1, 85, 3, 3); });
    // the oath-stone: a waist-high block, the band of gold worn bright at hand height, its shadow on the floor
    c.fillStyle = 'rgba(20,16,24,.55)'; c.beginPath(); c.ellipse(240, 236, 40, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#44444e'; c.beginPath(); c.moveTo(264, 176); c.lineTo(274, 170); c.lineTo(274, 226); c.lineTo(264, 232); c.closePath(); c.fill();
    c.fillStyle = '#6a6a76'; c.fillRect(216, 176, 48, 56);
    c.fillStyle = '#9a9aa6'; c.beginPath(); c.moveTo(216, 176); c.lineTo(226, 170); c.lineTo(274, 170); c.lineTo(264, 176); c.closePath(); c.fill();
    c.fillStyle = '#8a8a96'; c.fillRect(216, 176, 6, 56); c.fillStyle = '#54545e'; c.fillRect(216, 231, 48, 1);
    c.fillStyle = '#44444e'; c.fillRect(216, 198, 48, 8); c.fillRect(264, 196, 10, 8);
    c.fillStyle = '#a4701e'; c.fillRect(216, 200, 48, 4); c.fillStyle = '#c0a040'; c.fillRect(220, 200, 40, 3); c.fillStyle = '#dca238'; c.fillRect(228, 201, 24, 2); c.fillStyle = '#f8d67a'; c.fillRect(234, 201, 12, 1); c.fillRect(238, 202, 4, 1);
    for (var ry = 182; ry < 196; ry += 5) { c.fillStyle = '#5a5a66'; c.fillRect(226 + ((ry / 5) & 1) * 6, ry, 20, 1); }
    hallCv = cv;
    return cv;
  }
  function drawHall(ctx, t, bright) {
    ctx.drawImage(hallStill(), 0, 0);
    // the lamps' flames
    [150, 330].forEach(function (lx, i) { var f = ((t >> 3) + i) & 1; ctx.fillStyle = f ? '#F8D878' : '#FCA044'; ctx.fillRect(lx - 3, 92, 7, 8); ctx.fillStyle = 'rgba(248,160,68,.10)'; ctx.fillRect(lx - 14, 80, 29, 34); });
    // the beam: the skylight's noon down onto the stone (as the 8-bit's drawBeam: lighter, brighter at the top, pooled where it lands)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var x0 = 212, x1 = 268, y0 = 0, y1 = 176, spread = 14;
    var g = ctx.createLinearGradient(x0 - spread, 0, x1 + spread, 0);
    g.addColorStop(0, 'rgba(255,236,180,0)'); g.addColorStop(0.3, 'rgba(255,236,180,0.10)'); g.addColorStop(0.5, 'rgba(255,240,200,0.17)'); g.addColorStop(0.7, 'rgba(255,236,180,0.10)'); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 4, y0); ctx.lineTo(x1 + 4, y0); ctx.lineTo(x1 + spread, y1); ctx.lineTo(x0 - spread, y1); ctx.closePath(); ctx.fill();
    var v = ctx.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, 'rgba(255,250,230,0.16)'); v.addColorStop(1, 'rgba(255,250,230,0.02)');
    ctx.fillStyle = v; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    var pr = 46 + Math.sin(t / 50) * 2, pg = ctx.createRadialGradient(240, 186, 4, 240, 186, pr);
    pg.addColorStop(0, 'rgba(255,248,220,0.36)'); pg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = pg; ctx.fillRect(240 - pr, 186 - pr, pr * 2, pr * 2);
    var fl = ctx.createRadialGradient(240, 236, 6, 240, 236, 70); fl.addColorStop(0, 'rgba(255,240,200,0.14)'); fl.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = fl; ctx.fillRect(170, 200, 140, 70);
    for (var i = 0; i < 30; i++) {
      var hh = y1 - y0, my = y0 + ((i * 97 + t * (0.25 + (i % 5) * 0.06)) % hh), mx = x0 + ((i * 53) % (x1 - x0)) + Math.sin(t / 40 + i) * 5;
      ctx.fillStyle = i % 3 ? 'rgba(255,245,210,0.55)' : 'rgba(255,255,255,0.8)';
      ctx.fillRect(Math.round(mx), Math.round(my), 1, 1);
    }
    ctx.restore();
    if (bright < 1) { ctx.fillStyle = 'rgba(5,4,10,' + (1 - bright) + ')'; ctx.fillRect(0, 0, D.W, D.H); }
  }
  PK.drawHall = drawHall;
})();
