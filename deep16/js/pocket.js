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
  // THE DM'S POCKET DM (10-09, Griz: "the DM's Pocket DM where the cool new stuff in URLs and the stuff in test runs unlocks"; the door and its screens: js/pocketdm.js):
  // no locks at that table -- the cap at 12, Pyro without the trial, the story's named on the shelves; st.dm is the switch, the front stays the release edition
  PK.cap = function (st) { return st && st.dm ? 12 : PK.CAP; };
  PK.kingOpen = function (st) { return !!(st && (st.pyro || st.dm)); };

  // ------------------------------------------------------------------ the store
  PK.load = function () {
    var st = D.store.get(KEY) || {};
    st.roster = st.roster || [];          // the player's own characters: { code, name, cls, lvl }
    st.fights = st.fights || [];          // what was fought: summaries, with notes
    st.party = st.party || null;          // the slots: { w, lvl, loot } or { custom: i }
    st.pyro = !!st.pyro;                  // the trial won: Pyro on the roster
    st.run = st.run || null;              // the ladder under way
    if (st.purse == null) st.purse = 100; // the party's purse, sp (10-17, his "Store with 100 sp starting cash first fight")
    st.pack = st.pack || [];              // the party's pack: { id, n } -- the market's, into every fight and back (PK.packBack)
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
  // THE MARKS (10-17, the DM's campaign, step C; his "being able to mark as villain or villain only to add to villain store and remove from 'campaign' available party
  // members"): a card of the roster marked VILLAIN is on THE VILLAINS' shelf and on the roster still; VILLAIN ONLY is on the shelf and off the roster at the DM's table.
  // A stock card's mark is the campaign's (st.camp.marks by its word), a made one's its own record's (c.mark); one made in THE VILLAINS (c.dm) is the DM's, on the
  // roster at the DM's table only (his "allows villains in the play roster in that mode also")
  PK.markOf = function (st, e) { return e.kind === 'custom' ? ((st.roster[e.i] || {}).mark || null) : ((st.camp && st.camp.marks) || {})[e.w] || null; };
  PK.entries = function (st) {
    var out = PK.STOCK.filter(function (s) { return !s.dm || st.dm; }).map(function (s) { return { kind: 'stock', w: s.w, lo: s.lo, hi: Math.min(s.hi || 12, PK.cap(st)), grown: !!s.grown, locked: !!s.king && !PK.kingOpen(st), king: !!s.king, villain: !!s.villain }; }); // (s.dm: on the DM's roster only -- GreyFang and the story's villains of a class, js/pocketdm.js)
    st.roster.forEach(function (c, i) { out.push({ kind: 'custom', i: i, code: c.code, name: c.name }); });
    out = out.filter(function (e) { if (e.kind === 'custom' && st.roster[e.i].dm && !st.dm) return false; return !(st.dm && PK.markOf(st, e) === 'only'); });
    out.push({ kind: 'new' });
    return out;
  };
  PK.defaultParty = function () { return [{ w: 'barley', lvl: 3, loot: [] }, { w: 'aurdin', lvl: 3, loot: [] }, { w: 'vivian', lvl: 3, loot: [] }, { w: 'lymen', lvl: 3, loot: [] }]; };
  // the word a slot makes (js/classes.js NPC.spec reads it): 'barley:3+dagger1', 'talmok:5:grown', '~fighter.5....'
  PK.wordOf = function (st, slot) {
    if (!slot) return null;
    if (slot.custom != null) { var c = st.roster[slot.custom]; return c ? c.code + PK.gearIds(slot).map(function (id) { return '+' + id; }).join('') : null; } // (its GEAR from the pack after its code, 10-17)
    if (slot.w === 'new' || slot.w === '?') return null;
    var s = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0] || { lo: 1 };
    var L = s.king ? 12 : Math.max(s.lo, Math.min(s.hi || 12, PK.cap(st), slot.lvl || s.lo));
    var pk = slot.picks && DS.R.picksWord ? DS.R.picksWord(slot.picks).filter(function (w0) { return +/^\^(\d+)/.exec(w0)[1] <= L; }) : []; // (its level picks: js/rules.js R.picksWord, 10-14)
    return slot.w + ':' + L + (s.grown ? ':grown' : '') + (slot.loot || []).concat(PK.gearIds(slot), pk).map(function (id) { return '+' + id; }).join(''); // (its winnings, its GEAR from the pack, its picks)
  };
  PK.specOf = function (st, slot) { var w = PK.wordOf(st, slot); return w ? NPC.spec(w) : null; };
  // a sheet for the card (the 8-bit's shape: hp, equip, abil...), and its figure
  PK.sheetOf = function (sp) { if (!sp) return null; try { return sp.hero ? NPC.heroSheet(sp) : NPC.sheet(sp); } catch (e) { return null; } };
  PK.lookOf = function (sp) { return sp ? NPC.lookOf(sp) : null; }; // (a hero's by what he wears, as NPC.lookOf reads it: Aurdin's two mantles, 10-20)
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
  // A VILLAIN OF A CLASS (10-17, the DM's campaign, step C; his "pull villains into a new store and allow 'make' from there as well as going through the existing roster
  // and being able to mark as villain"): a fight's foe may be a character's word -- 'torvald:7', 'barley:5', a made one's '~cleric.9....' -- built by its class on the foes'
  // side (js/battle.js: D.npc.build before the bestiary). Its CR is its level on the SRD's casters (RULED 10-17, "4-8 yes": the priest 5th CR 2, the mage 9th CR 6, the
  // archmage 18th CR 12, the levels between by line; below 5th from the acolyte, 1st and CR 1/4 -- the seat's), to the CR nearest. PK.foe is the bestiary's block, or
  // one made for the word: { name, cr, type, villain, word }
  PK.CRS = ['0', '1/8', '1/4', '1/2'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(String));
  PK.levelCR = function (L) {
    L = Math.max(1, Math.min(20, +L || 1));
    var at = [[1, 0.25], [5, 2], [9, 6], [18, 12]], cr = at[at.length - 1][1];
    for (var i = 0; i < at.length - 1; i++) if (L <= at[i + 1][0]) { var a = at[i], b = at[i + 1]; cr = a[1] + (b[1] - a[1]) * (L - a[0]) / (b[0] - a[0]); break; }
    if (L > 18) cr = 12 + (L - 18) * 6 / 9;
    var best = '0', bd = Infinity; PK.CRS.forEach(function (c) { var v = c.indexOf('/') > 0 ? 1 / +c.split('/')[1] : +c, d = Math.abs(v - cr); if (d < bd - 1e-9) { bd = d; best = c; } });
    return best;
  };
  var vcache = {};
  PK.foe = function (kind) {
    if (D.FOES[kind]) return D.FOES[kind];
    if (typeof kind !== 'string' || !kind) return null;
    if (vcache[kind] !== undefined) return vcache[kind];
    var sp = null; try { sp = NPC.spec(kind); } catch (e) { sp = null; }
    var f = sp && (sp.cls || sp.hero) ? { name: sp.name || (sp.named && sp.id ? sp.id.charAt(0).toUpperCase() + sp.id.slice(1) : (R.CLASSES[sp.cls] || {}).name) || kind, cr: PK.levelCR(sp.lvl), type: 'humanoid', villain: true, word: kind, cls: sp.cls, lvl: sp.lvl } : null;
    return (vcache[kind] = f);
  };
  PK.xpOf = function (kind) { var f = PK.foe(kind); return f ? (R.CR_XP[String(f.cr)] || 0) : 0; };
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
  PK.NAMED_OUT = ['talmok', 'torvald', 'hask', 'skell', 'keeper', 'keeperold', 'gnollmatriarcheldest', 'gnollmatriarchlama', 'gnollmatriarchguard']; // (keeperold: the ladder's old Keeper, data/foes.js -- 10-03; the Gray Keeping's matriarch-clerics, the Snoot's -- 10-16)
  PK.pot = function (partyWords, mapId, dm) {
    var keys = (partyWords || []).map(PK.baseKey), def = D.MAPS[mapId], water = def ? def.rows.join('').indexOf('~') >= 0 : false;
    return Object.keys(D.FOES).filter(function (k) {
      var f = D.FOES[k];
      if (!f || /^fam_/.test(k) || PK.cr8(f.cr) <= 0) return false;
      if (k === 'keeperold' || (!dm && PK.NAMED_OUT.indexOf(k) >= 0)) return false; // (dm: the DM's table deals the story's named too -- the old Keeper never: the new one stands)
      if ((k === 'willem' || k === 'amara' || dm) && (keys.indexOf(k) >= 0 || (f.build && keys.indexOf(f.build) >= 0))) return false; // (no one fights themself: at the DM's table GreyFang or Talmok in the party is out of the pot -- and the Eldest's block when the matriarch plays, by its `build`, 10-17)
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
  PK.sum8 = function (kinds) { var s = 0; kinds.forEach(function (k) { s += PK.cr8((PK.foe(k) || {}).cr); }); return s; };
  // the dial's stops, in eighths: 1/8 .. 40
  PK.VALUES = [1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  PK.countKinds = function (kinds) {
    var cnt = {}, order = [];
    kinds.forEach(function (k) { if (!cnt[k]) { cnt[k] = 0; order.push(k); } cnt[k]++; });
    return order.map(function (k) { var f = PK.foe(k) || { name: k, cr: '?' }; return { kind: k, n: cnt[k], name: f.name, cr: f.cr }; });
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
    delete f.dues; // (Fortune's Due: all gone at a rest -- js/features.js, 10-30)
    if (c.cls === 'fighter') { if (!(f.secondWind > 0) || !(f.actionSurge > 0)) back.push('Second Wind, Action Surge'); f.secondWind = 1; f.actionSurge = 1; }
    if (c.cls === 'paladin' && c.lvl >= 3) { if (!(f.channel > 0)) back.push('Channel Divinity'); f.channel = 1; }
    if (c.cls === 'paladin' && c.untempled) { var layMx = 5 * c.lvl; if ((f.lay || 0) < layMx) back.push('Lay on Hands, by half (Untempled)'); f.lay = Math.min(layMx, (f.lay || 0) + Math.floor(layMx / 2)); } // (the feat Untempled, ours: 10-30)
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
  PK.LOOT_LATE = ['longsword2', 'dagger2', 'staff2', 'flametongue', 'doorshield', 'dwarfplate',
    // (10-17, his "Make sure all the items we have in the game end up as fight rewards or in those stores": the story's own gear, priceless -- the king's plate and
    // mantle and the Game Show's supplies left to their owners)
    'threshingflail1', 'threshingflail2', 'greyfangbow', 'macedisruption', 'banhammer', 'winnower', 'greyseamknife', 'asmundhammer', 'sectblade', 'fatheraxe', 'sunshaftstaff', 'candleknife', 'ringofflying'];
  function bonusOf(it) { if (!it) return 0; var w = it.weapon || it.armor || it.shield || {}; return w.bonus || (w.magic ? 1 : 0) || (it.kind === 'shield' && w.ac > 2 ? w.ac - 2 : 0); }
  // the level a winning comes from (PK.LOOT_BY_LEVEL): a priced thing the market's (PK.tierOf); the story's priceless gear by its magic -- a +2 or more from 8th, a +1 or
  // another magic thing from 5th, a plain one from 1st (the +2 Greyseam Knife reached a 1st-level party's late fights by price 0 -- bench16 module1017, 10-17)
  PK.lootTier = function (id) {
    var it = DS.DATA.items[id]; if (!it) return 99; if (it.price > 0) return PK.tierOf(id);
    var b = bonusOf(it), w = it.weapon || {}, magic = b >= 1 || !!it.attune || /^(ring|cloak|worn)$/.test(it.kind) || !!(w.magic || w.flame || w.disrupt || w.onCrit || w.sneakPoison);
    return b >= 3 ? 11 : b >= 2 ? 8 : magic ? 5 : 1;
  };
  PK.lootFor = function (h, late, L) { // (L: the party's level -- a thing is won from the level the market sells it, PK.tierOf; 10-17)
    var pool = PK.LOOT.concat(late ? PK.LOOT_LATE : []), out = [];
    pool.forEach(function (id) {
      var it = DS.DATA.items[id]; if (!it) return;
      if (L != null && PK.lootTier(id) > L) return;
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
  // what is found goes into the pack (Pocket.done), the one it suits named, and is worn only when the player says so on the result card (PUT IT ON -- 10-17, Griz:
  // "rewards should go into pack and not-auto equip unless player confirms equip"). PK.LOOT_BY_LEVEL (ON, RULED 10-17 -- Griz: "these lvl 1 guys are starting wtih
  // longsword+1 and cloak of displacement with nothing magic for sale in store...", then "turn it on"): the winnings keep to the market's levels, a +1 from 5th, the
  // Cloak of Displacement from 8th (PK.tierOf), and a party below them finds a healing potion -- THE WAGON ROAD at 1st done 1 of 10 without a loss (16 of 20 with
  // the +1s worn); played as the module offers it, RETRY on a loss, bench16 module1017's `retry` counts the tries
  PK.LOOT_BY_LEVEL = true;
  PK.loot = function (st, slots, late, rnd) {
    rnd = rnd || D.rand;
    var L = 1; slots.forEach(function (s) { var sp = PK.specOf(st, s); if (sp && sp.lvl > L && PK.baseKey(PK.wordOf(st, s)) !== 'pyro') L = sp.lvl; });
    var order = slots.map(function (s, i) { return i; }).filter(function (i) { var w = PK.wordOf(st, slots[i]); return w && PK.baseKey(w) !== 'pyro'; });
    for (var k = order.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var t = order[k]; order[k] = order[j]; order[j] = t; }
    for (var n = 0; n < order.length; n++) {
      var i = order[n], sp = PK.specOf(st, slots[i]), h = PK.sheetOf(sp); if (!h) continue;
      var c = PK.lootFor(h, late, PK.LOOT_BY_LEVEL ? L : null); if (!c.length) continue;
      return { who: i, item: c[Math.floor(rnd() * c.length)], name: h.name };
    }
    if (!PK.LOOT_BY_LEVEL) return null;
    var heal = PK.stock(L).filter(function (id) { var u = DS.DATA.items[id].use; return u && u.effect === 'heal' && u.battle; }), hi = heal[heal.length - 1]; // (the dearest healing the market has at the level)
    return hi ? { who: -1, item: hi, name: 'The party' } : null;
  };
  // the thing given: on a stock word as `+item`; in a player's own character's code, in its gear slot
  PK.give = function (st, slots, who, item) {
    var s = slots[who], it = DS.DATA.items[item]; if (!s || !it) return;
    if (s.custom != null) {
      var c = st.roster[s.custom]; if (!c) return;
      var sp = NPC.decode(c.code); if (!sp) return;
      sp.equip = sp.equip || {};
      var slot = R.slotFor({ equip: sp.equip }, it); if (!slot) return; // (the item's own place, a ring in the first free hand: js/rules.js R.slotFor)
      PK.gearOff(st, s, slot);
      (c.loot = c.loot || []).push({ id: item, place: slot, was: sp.equip[slot] || null }); // (what it took the place of: back when it comes off in GEAR, PK.dropWin -- 10-17)
      sp.equip[slot] = item; c.code = NPC.code(sp);
    } else {
      // a stock word's winnings are kept as `+item`s: a new one takes the place of what was won for the same place (a ring: the older of two ring hands)
      var same = function (a, b) { return a.kind === b.kind && (a.kind !== 'worn' || a.place === b.place); };
      var olds = (s.loot || []).filter(function (id) { return same(DS.DATA.items[id] || {}, it); }), drop = it.kind === 'ring' ? olds.slice(0, Math.max(0, olds.length - 1)) : olds;
      s.loot = (s.loot || []).filter(function (id) { return drop.indexOf(id) < 0; }); s.loot.push(item);
      var hS = PK.sheetOf(PK.specOf(st, s)); if (hS) PK.gearOff(st, s, R.slotFor(Object.assign({}, hS, { equip: {} }), it)); // (GEAR in that place would cover it)
    }
  };

  // ------------------------------------------------------------------ the market and the pack (10-17, Griz: "like pocket DM, you make a party - if the CR is set hard
  // enough you level - you might take symmetric fighting and need another sword"; "Store with 100 sp starting cash first fight. Save party gear et al status after
  // every fight and ladder run. 2. Make sure all the items we have in the game end up as fight rewards or in those stores - stock by level is good"; "4 yes" -- sold
  // back at half; "5 yes, and they'll have to read packs now"): a purse and a pack on the table. Every priced thing of the game's is on the market from the level the
  // camp's armoury opens it (js/camp.js D.CAMP_ARMOURY), else by its price (under 1000 sp from 1, 4000 from 5, 8000 from 8, the rest from 11); the story's own gear,
  // priceless, is among the late winnings (PK.LOOT_LATE); the Game Show's supplies stay the Game Show's. A won fight pays 100 sp a CR beaten (the DM's shops' scale)
  var GOODS = ['weapon', 'ammo', 'armor', 'shield', 'ring', 'cloak', 'worn', 'use', 'tool'];
  PK.tierOf = function (id) {
    var it = DS.DATA.items[id], A = D.CAMP_ARMOURY || []; if (!it) return 99;
    for (var i = 0; i < A.length; i++) if (A[i][1].indexOf(id) >= 0) return A[i][0];
    var p = it.price || 0; return p < 1000 ? 1 : p < 4000 ? 5 : p < 8000 ? 8 : 11;
  };
  PK.stock = function (L) {
    var I = DS.DATA.items;
    return Object.keys(I).filter(function (id) { var it = I[id]; return it && typeof it === 'object' && it.price > 0 && !it.noSell && GOODS.indexOf(it.kind) >= 0 && PK.tierOf(id) <= L; })
      .sort(function (a, b) { return GOODS.indexOf(I[a].kind) - GOODS.indexOf(I[b].kind) || I[a].price - I[b].price || (I[a].name < I[b].name ? -1 : 1); });
  };
  PK.packN = function (st, id) { var s = (st.pack || []).filter(function (x) { return x.id === id; })[0]; return s ? s.n : 0; };
  PK.packAdd = function (st, id, d) {
    st.pack = st.pack || []; var s = st.pack.filter(function (x) { return x.id === id; })[0];
    if (!s) { if (d <= 0) return; s = { id: id, n: 0 }; st.pack.push(s); }
    s.n += d; if (s.n <= 0) st.pack = st.pack.filter(function (x) { return x !== s; });
  };
  PK.coinFor = function (kinds) { return Math.round(PK.sum8(kinds) / 8 * 100); };
  // what the fight used comes off the pack; a stack the fight lent (the armoury's crossbow and bolts, js/save.js) is not the table's
  PK.packBack = function (st, B) {
    (st.pack || []).slice().forEach(function (s) { var n = 0; (B.inv || []).forEach(function (x) { if (x.id === s.id) n += x.n || 0; }); if (n < s.n) PK.packAdd(st, s.id, n - s.n); });
  };
  // a card's gear from the pack (his: "add 'gear' button' (symbol?) below the down arrow to swap the characters"): rides its word as `+item`, worn after its
  // winnings (js/classes.js NPC.wear); `noshield` / `noarmor` take the place's own off
  PK.gearIds = function (slot) { var g = (slot && slot.gear) || {}; return Object.keys(g).filter(function (k) { return g[k]; }).map(function (k) { return g[k]; }); };
  // a card's GEAR in a place a new winning takes: back to the pack (a `no<place>` simply dropped), so the winning is worn and not covered
  PK.gearOff = function (st, slot, place) {
    var g = slot && slot.gear, v = g && place && g[place]; if (!v) return;
    if (!/^no/.test(v)) PK.packAdd(st, String(v).replace(/^off:/, ''), 1); delete g[place];
  };
  // the card as its word makes it without its GEAR: its own kit and its winnings
  PK.bareOf = function (st, slot) { var g0 = slot.gear; slot.gear = {}; try { return PK.sheetOf(PK.specOf(st, slot)); } finally { slot.gear = g0; } };
  // a card's winnings: a stock word's `loot`; a made character's as PK.give records them (c.loot: { id, place, was } -- since 10-17, so one won before is its kit)
  PK.winsOf = function (st, slot) { if (slot.custom != null) { var c = st.roster[slot.custom]; return c && c.loot ? c.loot.map(function (x) { return x.id; }) : []; } return (slot.loot || []).slice(); };
  // a winning taken off in GEAR leaves the card's record (10-17, his "removing it from barley doesn't take - doesn't go in pack, is on him again when you hit 'gear'"): it goes to the pack, a thing like any other, and
  // a made character gets back what it took the place of
  PK.dropWin = function (st, slot, id) {
    if (slot.custom != null) {
      var c = st.roster[slot.custom], k = c && c.loot ? c.loot.map(function (x) { return x.id; }).indexOf(id) : -1; if (k < 0) return false;
      var w = c.loot.splice(k, 1)[0], sp = NPC.decode(c.code);
      if (sp && sp.equip && sp.equip[w.place] === id) { sp.equip[w.place] = w.was || null; c.code = NPC.code(sp); }
      return true;
    }
    var j = (slot.loot || []).indexOf(id); if (j < 0) return false; slot.loot.splice(j, 1); return true;
  };
  // a card swapped off a seat: what it wore from the pack back to it, and a stock word's winnings with them (a made character keeps its own in its code)
  PK.slotToPack = function (st, slot) {
    if (!slot) return;
    Object.keys(slot.gear || {}).forEach(function (pl) { PK.gearOff(st, slot, pl); });
    if (slot.custom == null) (slot.loot || []).forEach(function (id) { PK.packAdd(st, id, 1); });
  };
  // a made character off the roster for good (10-21, Griz: "the tiefling was perma-deathed. We have no way to remove characters from the roster."): nothing he made is
  // lost with it -- its winnings and what its seat wore from the pack go to the pack, its seat stands empty (the ?), and the seats of the ones made after it follow
  // them down the list; refused while a ladder or a module under way holds it (its fights are the run's: finish it or put it away first). What a campaign bought of
  // it is the campaign's, by its word (js/pocketdm.js PD.buy), and stays
  PK.dropMade = function (st, i) {
    var c = st.roster[i]; if (!c) return { ok: false, why: 'no such character' };
    var seats = []; (st.party || []).forEach(function (s, k) { if (s && s.custom === i) seats.push(k); });
    if (st.run && seats.length) return { ok: false, why: c.name + ' is in the ' + (st.run.module ? 'module' : 'ladder') + ' under way: finish it, or put it away first' };
    seats.forEach(function (k) { PK.slotToPack(st, st.party[k]); if (st.light && st.light.seat === k) st.light = null; st.party[k] = { w: 'new' }; });
    (c.loot || []).forEach(function (x) { PK.packAdd(st, x.id, 1); });
    st.roster.splice(i, 1);
    (st.party || []).forEach(function (s) { if (s && s.custom != null && s.custom > i) s.custom--; });
    return { ok: true, name: c.name, seats: seats, wins: (c.loot || []).map(function (x) { return x.id; }) };
  };
  // a druid wears no metal (SRD 5.1; RULED 10-21, Griz: "yes to all 3" -- the question put: the Chain Shirt +1 off his Druid and into the pack): a card made
  // or won into metal armour before the ruling has it taken off into the pack, once -- a winning gives back what it took the place of (PK.dropWin), a made one's
  // own goes to its kit's; a seat's GEAR from the pack, and a stock druid's winning, back to the pack. What moved, for the say (js/rules.js R.canEquip keeps it so)
  PK.druidMetal = function (st) {
    var out = [], kit = NPC.CLASSES.druid.kit.armor || null, metal = function (id) { var it = id && DS.DATA.items[id]; return !!(it && it.kind === 'armor' && it.armor && it.armor.metal); };
    var said = function (who, id) { PK.packAdd(st, id, 1); out.push(who + '\'s ' + DS.DATA.items[id].name); };
    (st.roster || []).forEach(function (c, i) {
      var parts = String(c.code || '').split('+'), sp = null; try { sp = NPC.decode(parts[0]); } catch (e) { sp = null; }
      if (!sp || sp.cls !== 'druid' || !metal(sp.equip && sp.equip.armor)) return;
      var id = sp.equip.armor;
      if (!PK.dropWin(st, { custom: i }, id)) { sp.equip.armor = kit; c.code = [NPC.code(sp)].concat(parts.slice(1)).join('+'); }
      said(c.name, id);
    });
    (st.party || []).forEach(function (slot) {
      var sp = null; try { sp = PK.specOf(st, slot); } catch (e) { sp = null; } if (!sp || (sp.cls || (DS.DATA.heroes[sp.hero] || {}).cls) !== 'druid') return;
      var nm = (sp.name || slot.w || 'the druid');
      if (slot.gear && metal(slot.gear.armor)) { out.push(nm + '\'s ' + DS.DATA.items[slot.gear.armor].name); PK.gearOff(st, slot, 'armor'); }
      (slot.loot || []).slice().forEach(function (id) { if (metal(id)) { slot.loot.splice(slot.loot.indexOf(id), 1); said(nm, id); } });
    });
    return out;
  };
  Pocket.prototype.metalOff = function () { var mv = PK.druidMetal(this.st); if (mv.length) { this.cache = {}; this.keep(); this.msg = { text: mv.join(', ') + ' to the pack: a druid wears no metal (the SRD)', t: 600, sticky: true }; } return mv; };
  // a table whose GEAR was written before the kit went to the pack (10-17 early: its own kit offered free, never packed): what it took off its kit, packed once
  PK.kitToPack = function (st) {
    if (st.kitPacked) return; st.kitPacked = true;
    (st.party || []).forEach(function (slot) {
      var g = slot && slot.gear; if (!g || !Object.keys(g).length) return;
      var bare = PK.bareOf(st, slot); if (!bare) return;
      Object.keys(g).forEach(function (pl) { var was = bare.equip[pl]; if (was && g[pl] !== was) PK.packAdd(st, was, 1); });
    });
  };
  var MARKET_TABS = [['arms', 'WEAPONS', ['weapon', 'ammo']], ['armour', 'ARMOUR, SHIELDS', ['armor', 'shield']], ['worn', 'RINGS, CLOAKS', ['ring', 'cloak', 'worn']], ['goods', 'POTIONS, GOODS', ['use', 'tool']]];

  // ------------------------------------------------------------------ the query (every fight a URL)
  PK.query = function (foes, words, L, mapId, watch, kn) {
    var q = '?npc=' + foes.join(',') + '&vs=' + words.join(',') + '&lvl=' + L;
    if (mapId) q += '&map=' + mapId;
    if (watch) q += '&watch';
    kn = kn || {}; // (the DM's knobs, as the class floor reads them: js/classes.js D.npcFight)
    if (kn.fly) q += '&fly'; if (kn.legend) q += '&legend'; if (kn.breath) q += '&breath=' + kn.breath; if (kn.dark === true) q += '&dark';
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
    PK.kitToPack(this.st);
    this.screen = this.st.run ? (this.st.run.atCamp ? 'hub' : 'cr') : 'title'; // (a run resting at the camp comes back to the fire, 10-17)
    this.btns = []; this.ksel = 0; this.scroll = 0; this.msg = null; this.field = null;
    this.metalOff(); // (a druid's metal armour to the pack, once: PK.druidMetal, 10-21)
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
  Pocket.prototype.failSay = function () { this.msg = { text: 'NOT SAVED: this browser\'s storage is full or shut. SAVE CAMPAIGN to a file.', t: 480, sticky: true, bad: true }; };
  Pocket.prototype.go = function (screen) { if (screen === 'modules') this.fold = null; this.dropField(); this.noteFrom = null; this.screen = screen; this.ksel = 0; this.scroll = 0; this.kwant = null; this.msg = this.msg && this.msg.sticky ? this.msg : null; this.cache = {}; }; // (noteFrom: where NOTES came from -- the result's card sets it after its go, 10-21)

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
    var b = { label: label, x: x, y: y, w: w, h: h, fn: fn, dis: !!o.dis, why: o.why || null, pri: !!o.pri, on: !!o.on, small: !!o.small, key: o.key, nokey: !!o.nokey }, i = this.btns.length;
    this.btns.push(b);
    var sel = this.ksel === i && !o.nokey;
    ctx.fillStyle = o.on ? P('gold', 1) : o.pri && !o.dis ? 'rgba(60,38,8,.95)' : 'rgba(20,16,30,.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = o.dis ? (sel ? P('stone', 5) : P('stone', 2)) : sel ? P('gold', 4) : o.on ? P('gold', 3) : o.pri ? P('gold', 2) : P('stone', 3);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    var col = o.dis ? P('stone', 4) : o.on || o.pri ? P('gold', 4) : sel ? P('bone', 2) : P('bone', 1);
    D.text(ctx, label, x + w / 2, y + Math.floor((h - 8) / 2), col, 'center');
    return b;
  };
  // the arrows (the d-pad, the keys) go to the nearest button that way on the screen, not the next in the order drawn (10-06, a pad player: "d-pad presses
  // should change selected menu buttons based on direction"; Griz: "yes, and it's good the keyboard matches the d-pad"): of the centres that way -- no more
  // than twice as far off the line as along it -- the nearest, along plus off; a greyed button and one the keys never take are passed over; none, it stays
  function stepTo(btns, from, way, rows) {
    var a = btns[from]; if (!a) return 0;
    var skip = function (b, i) { return (b.dis && !(rows && rows[i])) || b.nokey; }; // (a greyed row of a list is walked to as the arrows walk the list, 10-27: else a shop the purse can't touch is shut to the keys from below)
    var dx = way === 'left' ? -1 : way === 'right' ? 1 : 0, dy = way === 'up' ? -1 : way === 'down' ? 1 : 0, ax = a.x + a.w / 2, ay = a.y + a.h / 2, best = from, bs = Infinity;
    // (left and right keep to the row where one is on it: a card's v goes to the next card's v, not to the level arrow above it)
    var row = function (b) { return b.y < a.y + a.h && b.y + b.h > a.y; }, rowOnly = dx && btns.some(function (b, i) { return i !== from && !skip(b, i) && row(b) && (b.x + b.w / 2 - ax) * dx >= 1; });
    btns.forEach(function (b, i) {
      if (i === from || skip(b, i) || (rowOnly && !row(b))) return;
      var vx = b.x + b.w / 2 - ax, vy = b.y + b.h / 2 - ay, along = vx * dx + vy * dy, off = Math.abs(vx * dy - vy * dx);
      if (along < 1 || off > along * 2) return;
      var s = along + off; if (s < bs) { bs = s; best = i; }
    });
    return best;
  }
  // a greyed button says why when it is pressed (10-06, Griz: "I couldn't seem to save a roster" -- SAVE ROSTER was greyed and said nothing)
  Pocket.prototype.fire = function (b) { if (!b || b.dis) { if (b) { D.sfx('error'); if (b.why) this.say(b.why, 300); } return; } D.sfx(b.pri ? 'confirm' : 'cursor'); b.fn(); };
  Pocket.prototype.readButtons = function () {
    var m = I.mouse, self = this, n = this.btns.length;
    if (!n) return false;
    if (m.moved && m.inside) this.btns.forEach(function (b, i) { if (hit(b)) self.ksel = i; });
    if (this.ksel >= n) this.ksel = 0;
    ['up', 'down', 'left', 'right'].forEach(function (way) { if (!I.repeat(way)) return; if ((way === 'up' || way === 'down') && self.listStep(way)) return; var to = stepTo(self.btns, self.ksel, way, self.rowSet()); if (to !== self.ksel) { self.ksel = to; D.sfx('cursor'); } });
    if (m.click) { var hb = null; this.btns.forEach(function (b) { if (hit(b)) hb = b; }); if (hb) { this.fire(hb); return true; } }
    if (I.pressed('a')) { this.fire(this.btns[this.ksel]); return true; }
    return false;
  };

  // ------------------------------------------------------------------ update
  Pocket.prototype.update = function () {
    this.t++;
    if (this.msg && this.msg.t > 0) this.msg.t--;
    if (this.egg) { this.eggUpdate(); return; } // (an egg on the screen holds the table till it is let go: js/pocketdm.js)
    if (this.pm) { this.pm.update(D.ui.menuKeys()); return; } // (a card's level picks: the one pick page holds the table till CONFIRM, 10-14)
    if (this.levelQueue && this.levelQueue.length) { var lq = this.levelQueue.shift(); this.askLevel(lq[0], lq[1]); return; } // (XP's level-ups with EDIT on: a card's page at a time, 10-17)
    if (this.screen === 'hub' && I.pressed('menu') && !D.typing && this.ready()) { this.openMenu(); return; } // (THE CAMP's M: the regular menu, 10-17)
    if (this.screen === 'title' && I.pressed('menu') && !D.typing && DS.MENU && DS.MENU.openOptions) { var selfT = this; D.sfx('confirm'); this.pm = DS.MENU.openOptions({ close: function () { selfT.pm = null; } }); return; } // (the front page's M: OPTIONS, the music off with E on MUSIC -- 10-28, Griz: "allow pressing 'm' on the pocket DM front page get you to the option menu to turn off the music"; the second game's title's own OPTIONS page, js/menu.js MN.openOptions)
    var s = this.screen;
    if (I.pressed('b') && !D.typing) { this.back(); return; }
    if (s === 'title' && this.titleClick()) return; // (the throne and the two lamps: js/pocketdm.js)
    if (this.readButtons()) return;
    if (s === 'map' || s === 'fights' || s === 'maker' || s === 'market' || s === 'modules' || s === 'morning' || this.scrolls(s)) { // (the market's list too, 10-17: his "i rolled the mousewheel over that ... and nothing happened")
      var w = I.mouse.wheel; if (w && !this.wheelTo(w)) { this.scroll = Math.max(0, this.scroll + w); } // (wheelTo: a screen of two lists takes it for the one under the mouse, js/pocketdm.js)
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
    if (this.backMore(s)) return; // (the DM's screens and the notes: js/pocketdm.js)
    if (s === 'title') { location.href = '../'; return; }
    if (s === 'party' || s === 'fights') { this.keep(); this.go('title'); return; }
    if (s === 'modules') { this.keep(); this.go('hub'); return; } // (LOAD MODULE is THE CAMP's)
    if (s === 'maker') { if (this.mk && this.mk.step > 1) this.mk.step--; else this.go(this.mk && this.mk.villain ? 'villains' : 'party'); return; } // (a villain's maker came from THE VILLAINS, 10-17)
    if (s === 'map') { this.go('hub'); return; } // (THE MAP is SINGLE FIGHT's, from THE CAMP since 10-17)
    if (s === 'hub') { this.keep(); this.go('party'); return; }
    if (s === 'morning') { this.go(this.mFrom && this.mFrom !== 'morning' ? this.mFrom : 'hub'); return; }
    if (s === 'cr') { if (this.st.run) { this.go('title'); return; } this.go('map'); return; }
    if (s === 'notes') { var nf = this.noteFrom; this.go(nf === 'result' && this.result ? 'result' : 'fights'); return; } // (opened from a fight's card: back to it)
    if (s === 'market') { this.go(this.marketFrom && this.marketFrom !== 'market' ? this.marketFrom : 'party'); return; }
    if (s === 'draft') { if (this.dOut) { this.dOut = null; this.scroll = 0; return; } this.go('rest'); return; } // (SECOND DRAFT: back a step, then to the rest card)
    if (s === 'result' || s === 'rest' || s === 'unlock') return; // (a card with its own buttons)
    this.go('title');
  };
  Pocket.prototype.say = function (text, frames) { this.msg = { text: text, t: frames || 180 }; };
  // ^ and v under a list that runs past its page, as THE MARKET's (10-17): a page a press, the wheel as before, 'a-b of n' beside them; key is the list's
  // scroll ('scroll', or 'scroll2' for a screen's second list). Every list of both tables has them since 10-27 (Griz: "menu on pocket DM doors is broken same
  // as other, requires mousewheel and doesn't scroll properly"); text false leaves the count to the caller
  Pocket.prototype.pager = function (ctx, x, y, n, per, from, key, text) {
    if (n <= per) return x;
    var self = this; key = key || 'scroll';
    this.btn(ctx, '^', x, y, 16, 12, function () { self[key] = Math.max(0, from - per); }, { small: true, dis: from <= 0, nokey: true });
    this.btn(ctx, 'v', x + 18, y, 16, 12, function () { self[key] = Math.min(n - per, from + per); }, { small: true, dis: from + per >= n, nokey: true });
    if (text !== false) D.text(ctx, (from + 1) + '-' + Math.min(n, from + per) + ' of ' + n, x + 40, y + 3, P('stone', 5));
    return x + 40;
  };
  // THE ARROWS IN A LIST (10-27, Griz: "if you were using the arrows to scroll through the list it jumped out of scrolling and only worked properly if you
  // scrolled with the mousewheel. This would be considered catastrophic loss to testers if shipped"): the arrows go to the nearest button that way (stepTo), so
  // down on a list's last row left it for BACK and the rest of the list was never reached -- DOORS' SITUATIONS PAGE, 33rd of 36, not at all. A list that pages
  // says which buttons are its rows, after drawing them: those from b0 on, a row every h px from y0 (a row's own small buttons go with it). In a list the
  // arrows walk it row by row -- a greyed row too, or a greyed last row would let them out (BUY too dear in a shop) -- to the button nearest the one they
  // leave; up on its top row or down on its bottom one scrolls it a row (step: what a row is worth to the scroll -- two where it counts spells two to a row)
  // and keeps the cursor there; past either end of the whole list they leave it for the nearest button that way, as before
  function nearestIn(btns, row, cx) {
    var best = row[0], bs = Infinity;
    row.forEach(function (j) { var b = btns[j], s = Math.abs(b.x + b.w / 2 - cx) + (b.dis ? 10000 : 0); if (s < bs) { bs = s; best = j; } }); // (one not greyed first)
    return best;
  }
  Pocket.prototype.listRows = function (b0, y0, h, n, per, from, key, step) {
    var rows = [], cap = Math.ceil(per / (step || 1)), L, w = this.kwant;
    for (var i = b0; i < this.btns.length; i++) { var r = Math.floor((this.btns[i].y - y0) / h); if (r >= 0 && r < cap && !this.btns[i].nokey) (rows[r] = rows[r] || []).push(i); }
    L = { rows: rows.filter(Boolean), n: n, per: per, from: from, key: key || 'scroll', step: step || 1 };
    (this.lists = this.lists || []).push(L);
    if (w && w.key === L.key && w.n === n) { if (L.rows[w.row]) this.ksel = nearestIn(this.btns, L.rows[w.row], w.cx); this.kwant = null; } // (the row the arrows scrolled into, picked as it is drawn)
    return L;
  };
  Pocket.prototype.rowSet = function () { var s = {}; (this.lists || []).forEach(function (L) { L.rows.forEach(function (row) { row.forEach(function (j) { s[j] = true; }); }); }); return s; };
  Pocket.prototype.listStep = function (way) {
    var k = this.ksel, b = this.btns[k], at = null;
    (this.lists || []).forEach(function (L) { L.rows.forEach(function (row, r) { if (row.indexOf(k) >= 0) at = { L: L, r: r }; }); });
    if (!at || !b) return false;
    var L = at.L, cx = b.x + b.w / 2, to = L.rows[at.r + (way === 'down' ? 1 : -1)];
    if (to) { this.ksel = nearestIn(this.btns, to, cx); D.sfx('cursor'); return true; }
    if (way === 'down' && L.from + L.per < L.n) this[L.key] = L.from + L.step;
    else if (way === 'up' && L.from > 0) this[L.key] = Math.max(0, L.from - L.step);
    else return false;
    this.kwant = { key: L.key, n: L.n, row: at.r, cx: cx }; D.sfx('cursor');
    return true;
  };
  // the hooks js/pocketdm.js fills: the DM's door on the title, its screens, the eggs
  Pocket.prototype.titleClick = function () { return false; };
  Pocket.prototype.backMore = function () { return false; };
  Pocket.prototype.scrolls = function () { return false; };
  Pocket.prototype.wheelTo = function () { return false; };
  Pocket.prototype.drawMore = function () { };
  Pocket.prototype.drawTitleDM = function () { };
  Pocket.prototype.drawKnobs = function () { };
  Pocket.prototype.eggUpdate = function () { this.egg = null; };
  Pocket.prototype.drawEgg = function () { };

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
  Pocket.prototype.ready = function () { var self = this; return this.st.party.length > 0 && this.st.party.every(function (slot) { if (slot.custom != null) { var c = self.st.roster[slot.custom]; return !!c && !(c.dm && !self.st.dm); } var e = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0]; return !!e && !(e.king && !PK.kingOpen(self.st)) && !(e.dm && !self.st.dm); }); };
  Pocket.prototype.topLevel = function () { var L = 1; this.levels().forEach(function (x) { L = Math.max(L, x); }); return Math.min(12, L); };

  // ------------------------------------------------------------------ the CR dial, and the foes it rolls
  Pocket.prototype.mapFor = function () {
    if (this.mapSel && D.MAPS[this.mapSel]) return this.mapSel;
    return null;
  };
  Pocket.prototype.mapIds = function () { return Object.keys(D.MAPS).filter(function (id) { var d = D.MAPS[id]; return d && d.rows && d.entry && id !== 'wet' && id !== 'testground' && id !== 'floodstair-old' && !d.from8; }); }; // (floodstair-old: the ladder's copy of the old stair, data/maps.js -- the table's Flooded Stair is the new one, 10-03; a floor with no entry takes no party: the Gate Floor, js/view.js, is the figures' display, and a ladder's trial drew it 10-03 and froze setting the field)
  // (at the DM's table the floors the campaign struck are never drawn -- his "your limited number of ladder map exclusions": js/pocketdm.js)
  Pocket.prototype.randomMap = function () { var ids = this.mapIds(), cp = this.st && this.st.dm && this.st.camp, s = cp && cp.strike || [], ok = ids.filter(function (id) { return s.indexOf(id) < 0; }); if (ok.length) ids = ok; return ids[Math.floor(D.rand() * ids.length)]; };
  // a ladder's foes as rolled, handed to the DM's table (js/pocketdm.js: the campaign's units take the places of rolled ones of their CR); the release edition keeps the roll
  Pocket.prototype.ladderFoes = function (kinds) { return kinds; };
  Pocket.prototype.reroll = function () {
    var mapId = this.fightMap || this.mapFor() || 'hexfloor';
    var pot = PK.pot(this.words(), mapId, this.st.dm), target = PK.VALUES[Math.max(0, this.crI)];
    this.foes = PK.roll(target, pot, PK.roomOn(mapId));
    this.keep();
  };
  Pocket.prototype.setCR = function (i) { this.crI = Math.max(0, Math.min(PK.VALUES.length - 1, i)); this.reroll(); D.sfx('cursor'); };
  // the dial's first setting for this party: the smallest stop that reads HARD
  Pocket.prototype.defaultCR = function () {
    var levels = this.levels(), mapId = this.mapFor() || 'hexfloor', pot = PK.pot(this.words(), mapId, this.st.dm), room = PK.roomOn(mapId);
    for (var i = 0; i < PK.VALUES.length; i++) { var kinds = PK.roll(PK.VALUES[i], pot, room); var d = PK.diff(levels, kinds); if (d.label === 'HARD' || d.label === 'DEADLY') return i; }
    return 5;
  };

  // ------------------------------------------------------------------ the fight
  Pocket.prototype.fightWords = function () {
    // (the ladder carries what the last rung left: js/classes.js NPC.build reads { word, hpLeft, slotsLeft, featsLeft })
    // (and the morning of THE LONG REST, 10-17: the day's spells, what was cast ahead -- the run's till its next long rest, else the single fight's)
    var self = this, run = this.st.run, words = this.words(), mm = run ? run.morning : this.st.dayMorning, mo = mm && mm.cards && JSON.stringify(mm.words) === JSON.stringify(words) ? mm.cards : null; // (a morning is its party's: a card changed since, and it is not worn)
    if ((!run || !run.carry) && !mo && !(run && run.drafts)) return words;
    return words.map(function (w, i) {
      var c = run && run.carry ? run.carry[i] : null, m = mo ? mo[i] : null, dr = run && run.drafts ? run.drafts[i] : null; // (dr: SECOND DRAFT's day, Pocket.draftSwap -- 10-31)
      if (!c && !m && !dr) return w;
      var o = Object.assign({ word: w, id: 'p' + i + '-' + PK.baseKey(w) }, m ? JSON.parse(JSON.stringify(m)) : {});
      if (c) Object.assign(o, { hpLeft: c.hp, slotsLeft: c.slots, featsLeft: c.feats });
      if (dr) o.prepared = dr.prepared.slice();
      // (what the morning laid that a fight since has ended -- a Death Ward that held, a Mage Armor dispelled -- stays ended till the long rest, SRD 5.1; the Light is lit again, a cantrip -- 10-21)
      if (c && c.conds && o.conds) Object.keys(o.conds).forEach(function (k) { if (k !== 'light' && c.conds.indexOf(k) < 0) delete o.conds[k]; });
      if (c && c.conds && o.aid && c.conds.indexOf('aid') < 0) delete o.aid;
      return o;
    });
  };
  Pocket.prototype.launch = function () {
    this.lossMenu = false; // (the CR screen's mid-ladder REROLL: only after a loss, till the next fight)
    var self = this, run = this.st.run, mapId = this.fightMap || this.mapFor() || this.randomMap(), L = this.topLevel();
    if (!this.foes || !this.foes.length) this.reroll();
    this.fightMap = mapId;
    var words = this.words(), kinds = this.foes.slice(), d = PK.diff(this.levels(), kinds), kn = this.knobs() || {};
    var q = PK.query(kinds, words, L, mapId, this.watch, kn);
    var slot = this.slotOf(run), lastM = !!(slot && run.rung >= run.plan.length); // (a module's fight: its own name and line, the last its boss music -- 10-17)
    var name = run ? (slot ? run.module.name + ': ' + this.rungName(run) : this.rungName(run)) : 'THE POCKET DM', sub = (slot && slot.name ? slot.name + ' -- ' : '') + PK.foesText(kinds) + ' -- ' + d.label.toLowerCase() + (d.deadlyX > 1 ? ' x' + d.deadlyX : '');
    var def = D.classFight(L, { id: 'pocket', what: PK.foesText(kinds), map: mapId, name: name, sub: sub, music: (run && run.trial) || lastM ? 'boss' : undefined, dark: kn.dark != null ? kn.dark : undefined,
      intro: slot && slot.intro ? slot.intro : run && run.trial ? (run.dmLadder ? 'The last of the DM\'s ladder, after a night\'s rest.' : 'The last of it. Everything the dark could spare, at once. Win this and the king himself will walk with you.') : 'The Pocket DM sets the table: ' + PK.foesText(kinds) + ', on ' + (D.MAPS[mapId].name || mapId) + '.',
      won: lastM ? run.module.name + ' IS DONE.' : run && run.trial ? 'THE TRIAL IS PASSED.' : 'THE TABLE IS CLEARED.', lost: 'THE DARK KEEPS THEM.' });
    var started = new Date().toISOString();
    this.before = JSON.parse(JSON.stringify({ run: run, party: this.st.party, roster: this.st.roster }));
    // (the camp's light in hand: its bearer holds it lit from the first round, the one in hand not in the fight's pack -- js/battle.js o.torch; back after, Pocket.done)
    var fw = this.fightWords(), lt = this.st.light && this.lightOf(this.st.light.seat), ltAt = -1, packIn = JSON.parse(JSON.stringify(this.st.pack || []));
    if (lt) { for (var si = 0, wi = -1; si <= lt.seat; si++) if (PK.wordOf(this.st, this.st.party[si])) wi++; ltAt = wi; }
    var ltW = ltAt >= 0 ? fw[ltAt] : null, ltId = ltW ? (typeof ltW === 'string' ? 'p' + ltAt + '-' + String(ltW).split(':')[0].split('.')[0].split('+')[0] : ltW.id) : null; // (the unit's id as js/battle.js gives it)
    if (ltId) packIn.forEach(function (s) { if (s.id === lt.id) s.n--; });
    this.lightHeld = ltId ? lt.id : null;
    var B = new D.Battle({ npc: { foes: kinds, party: fw }, pack: packIn.filter(function (s) { return s.n > 0; }), torch: ltId || undefined, torchKind: ltId ? lt.id : undefined, watch: this.watch, fightDef: def, pocket: true, flyTest: !!kn.fly, legendTest: !!kn.legend, breathTest: kn.breath || null, // (the class floor's knobs, set on the DM's foes screen: js/pocketdm.js)
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
    var end = party.map(function (u) { return { id: u.id, name: u.name, hp: Math.max(0, u.hp), maxhp: u.maxhp, slots: (u.slots || []).slice(), slotsMax: (u.slotsMax || []).slice(), feats: JSON.parse(JSON.stringify(u.feats || {})), cls: u.cls, lvl: u.lvl, con: DS.mod((u.abil || {}).con || 10), cha: DS.mod((u.abil || {}).cha || 10), untempled: !!(u.src && DS.R.hasFeat(u.src, 'untempled')), down: !!(u.ko || u.hp <= 0 || u.dead), conds: Object.keys(u.conds || {}).concat(u.gshelf && u.gshelf.recs ? Object.keys(u.gshelf.recs) : []) }; }); // (conds: what is on it at the end, a globe's shelf too -- the morning's that ended stay ended, Pocket.fightWords)
    var rec = { t: Date.now(), started: (B.rec && B.rec.started) || info.started, result: res || 'left', rounds: B.round || 0, q: info.q, map: info.mapId, mapName: (D.MAPS[info.mapId] || {}).name || info.mapId,
      party: end.map(function (e) { return e.name + ' (' + D.clsLabel(e.cls) + ' ' + e.lvl + ')'; }), foes: PK.foesText(info.kinds), kinds: info.kinds, cr: PK.fmt8(PK.sum8(info.kinds)), diff: info.d.label + (info.d.deadlyX > 1 ? ' x' + info.d.deadlyX : ''), adj: info.d.adj,
      downs: end.filter(function (e) { return e.down; }).length, rung: run ? (run.trial ? 'trial' : run.rung) : null, notes: '' };
    this.st.fights.unshift(rec); while (this.st.fights.length > KEEP) this.st.fights.pop();
    this.result = { res: res, rec: rec, end: end, loot: null };
    PK.packBack(this.st, B); // (what the fight used comes off the pack, 10-17)
    if (this.lightHeld) { if (!B.lampReturned) PK.packAdd(this.st, this.lightHeld, 1); this.lightHeld = null; } // (the light in hand back to the pack: it was never the fight's to spend -- a lantern nobody could take up came back by the fight's own pack)
    if (res === 'won') {
      var coin = PK.coinFor(info.kinds); this.st.purse = (this.st.purse == null ? 100 : this.st.purse) + coin; this.result.coin = coin; rec.coin = coin; // (100 sp a CR beaten)
      var xpe = this.xpOn() ? PK.giveXP(this.st, info.kinds) : 0; this.result.xp = xpe; rec.xp = xpe; this.result.noXP = !this.xpOn(); // (the SRD's XP for the foes, split across the seats -- 10-17; none watched, Pocket.xpOn)
      var late = run ? (run.trial || run.rung >= 3) : info.d.ratio >= 1.5;
      var gift = PK.loot(this.st, this.st.party, late);
      if (gift) { PK.packAdd(this.st, gift.item, 1); this.result.loot = gift; rec.loot = gift.name + ': ' + DS.DATA.items[gift.item].name + ' (to the pack)'; } // (into the pack, worn only on the player's word -- 10-17, Griz: "rewards should go into pack and not-auto equip unless player confirms equip")
      if (run) {
        // the party's slots are the fight's units in order (the familiars and summons left out above)
        run.carry = this.st.party.map(function (s, i) { var e = end[i]; return e ? { hp: e.hp, maxhp: e.maxhp, slots: e.slots, slotsMax: e.slotsMax, feats: e.feats, cls: e.cls, lvl: e.lvl, con: e.con, cha: e.cha, untempled: e.untempled, conds: e.conds } : null; });
        run.won = (run.won || 0) + 1;
        if (run.trial) { if (!run.dmLadder) this.st.pyro = true; this.st.run = null; this.result.unlocked = !run.dmLadder; } // (a DM's ladder's trial lets no king in)
        else if (run.module && run.rung >= run.plan.length) { this.st.run = null; this.result.moduleDone = run.module.name; } // (a module's last fight won: it is done)
      }
    }
    this.afterFight(res, run, info);
    if (res === 'won' && !this.st.run) this.result.levels = this.levelUps(); // (no run under way now -- a single fight, or the end of one: the long rest after it, and its levels)
    this.cache = {};
    this.keep();
    this.go('result');
    D.sfx(res === 'won' ? 'levelup' : 'cancel');
  };

  // ------------------------------------------------------------------ the ladder (his: "auto-fill the next map with a reasonable increase in CR (randomly generated 4-rung ladder)")
  // (a ladder of the DM's own making -- run.plan, his "build a ladder", js/pocketdm.js -- has as many rungs as it has slots, the fifth its trial)
  // (a module, run.module: as many fights as its slots, no trial -- js/pocket.js startModule)
  Pocket.prototype.lastRung = function (run) { return run && run.module ? run.plan.length : run && run.plan ? Math.max(1, Math.min(4, run.plan.length)) : 4; };
  Pocket.prototype.hasTrial = function (run) { return !run || (!run.module && (!run.plan || run.plan.length >= 5)); };
  Pocket.prototype.rungName = function (run) { return run.module ? 'FIGHT ' + run.rung + ' OF ' + run.plan.length : run.trial ? 'THE TRIAL' : 'RUNG ' + run.rung + ' OF ' + this.lastRung(run); };
  Pocket.prototype.slotOf = function (run) { return run && run.module ? run.plan[run.rung - 1] || null : null; };
  // hooks the DM's table fills (js/pocketdm.js): the knobs a fight takes, what a fight's end pays, a planned rung's table
  Pocket.prototype.knobs = function () { return null; };
  Pocket.prototype.afterFight = function () { };
  Pocket.prototype.planRung = function () { return false; };
  Pocket.prototype.startRun = function () {
    var self = this, levels = this.levels();
    this.st.run = { rung: 1, trial: false, base8: PK.VALUES[Math.max(0, this.crI)], carry: null, hd: levels.map(function (L) { return L; }), arcane: levels.map(function () { return false; }), won: 0, startedAt: Date.now(), foes: this.foes, map: this.fightMap || this.mapFor() || this.randomMap() };
    this.fightMap = this.st.run.map;
    this.foes = this.st.run.foes = this.ladderFoes(this.foes || [], this.st.run.map);
    this.keep();
  };
  // the next rung's table: the CR about 1.3 times the last, a map drawn fresh
  Pocket.prototype.nextRung = function () {
    var run = this.st.run; if (!run) return;
    run.rung++;
    if (this.planRung(run)) { this.keep(); return; }
    var target = Math.max(1, Math.round(run.base8 * Math.pow(1.3, run.rung - 1)));
    this.fightMap = run.map = this.randomMap();
    var pot = PK.pot(this.words(), run.map, this.st.dm);
    this.foes = run.foes = this.ladderFoes(PK.roll(target, pot, PK.roomOn(run.map)), run.map);
    this.keep();
  };
  // the trial: double deadly, the smallest table that reads so (his: "give them a 'long rest for the trial' after the fourth win and then do your double deadly")
  Pocket.prototype.setTrial = function () {
    var run = this.st.run; if (!run) return;
    run.trial = true; run.carry = null; run.drafts = null; run.hd = this.levels().map(function (L) { return L; }); run.arcane = run.hd.map(function () { return false; });
    if (this.planRung(run)) { this.keep(); return; }
    this.fightMap = run.map = this.randomMap();
    var pot = PK.pot(this.words(), run.map, this.st.dm), levels = this.levels(), room = Math.max(PK.roomOn(run.map), 6), kinds = null;
    for (var i = 0; i < PK.VALUES.length && !kinds; i++) { for (var t = 0; t < 6 && !kinds; t++) { var k = PK.roll(PK.VALUES[i], pot, room); if (PK.diff(levels, k).ratio >= 2) kinds = k; } }
    this.foes = run.foes = this.ladderFoes(kinds || PK.roll(PK.VALUES[PK.VALUES.length - 1], pot, room), run.map);
    this.keep();
  };
  // after a loss: the party as it went in, and a fresh table for the same step -- a lost trial rerolls as the trial, double deadly (10-03: it rolled a
  // fourth rung's table, and a win of that unlocked Pyro)
  Pocket.prototype.rerollRung = function () {
    this.restore();
    var run = this.st.run;
    this.rerolling = true; // (a planned rung refills its random part: js/pocketdm.js planRung)
    try { if (run && run.trial) this.setTrial(); else if (run) { run.rung--; this.nextRung(); } } finally { this.rerolling = false; }
    this.lossMenu = true; // (the CR screen's REROLL stays offered till the fight: drawCR)
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
  // SECOND DRAFT on a run (the feat, ours -- the leveling lane §8 item 4, RULED 10-30, his "Second Draft next leveling session"; js/rules.js R.FEATS.seconddraft, the house's
  // deep16/js/house.js H.secondDraft): at a short rest between fights, once a long rest, one spell of a card's day let go and another it could prepare taken up -- kept on the
  // run (run.drafts[seat]: { out, took, prepared }), worn by its fights (fightWords), gone at its long rest. drafters(): the seats with the feat that prepare, each { i, h, pool,
  // prepared: the day it has now -- its draft's, else the run's morning, else the class's own --, spent }
  Pocket.prototype.drafters = function () {
    var run = this.st.run; if (!run) return [];
    var words = this.words(), mm = run.morning, mo = mm && mm.cards && JSON.stringify(mm.words) === JSON.stringify(words) ? mm.cards : null, now = PK.morningInfo(this.st, PK.MORNING0(), false);
    return now.cards.filter(function (c) { return c && c.pi && R.hasFeat(c.h, 'seconddraft'); }).map(function (c) {
      var dr = run.drafts && run.drafts[c.i], day = dr ? dr.prepared : mo && mo[c.i] && mo[c.i].prepared ? mo[c.i].prepared : c.prepared;
      return { i: c.i, h: c.h, pool: c.pi.pool, prepared: (day || []).slice(), spent: !!dr };
    });
  };
  Pocket.prototype.draftSwap = function (i, out, took) {
    var run = this.st.run, d = this.drafters().filter(function (x) { return x.i === i; })[0], k = d ? d.prepared.indexOf(out) : -1;
    if (!run || !d || d.spent || k < 0 || d.pool.indexOf(took) < 0 || d.prepared.indexOf(took) >= 0) return false;
    d.prepared[k] = took; run.drafts = run.drafts || {}; run.drafts[i] = { out: out, took: took, prepared: d.prepared };
    this.keep(); D.sfx('magic');
    return true;
  };
  // its page, from the rest card: the seat's day (the spell to let go), then what it could take up in its place
  Pocket.prototype.drawDraft = function (ctx) {
    var self = this, d = this.drafters().filter(function (x) { return x.i === self.dSeat; })[0], back = function () { self.dOut = null; self.go('rest'); };
    head(ctx, 'SECOND DRAFT', 'once a long rest, at the end of a short rest: one prepared spell let go, another taken up in its place');
    var px = 20, py = 34, pw = D.W - 40, ph = 192;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    if (!d || d.spent) { D.text(ctx, d ? d.h.name + ' has had a second draft since the long rest.' : 'nobody here can redraft', D.W / 2, py + 80, P('stone', 5), 'center'); }
    else {
      var out = this.dOut && d.prepared.indexOf(this.dOut) >= 0 ? this.dOut : null, list = out ? d.pool.filter(function (id) { return d.prepared.indexOf(id) < 0; }) : d.prepared;
      D.text(ctx, '{y}' + d.h.name + '{/}: ' + (out ? 'in place of ' + (SV.spell(out) || { name: out }).name + ', which?' : 'let which go?'), px + 6, py + 5, P('bone', 1));
      var per = 26, from = Math.min(this.scroll, Math.max(0, list.length - per)), b0 = this.btns.length; this.scroll = from; // (two a row, a page of 26: the morning's own)
      list.slice(from, from + per).forEach(function (id, k) {
        var sp = SV.spell(id) || { name: id, level: '?' }, col = k % 2, rw = Math.floor(k / 2);
        self.btn(ctx, fitText((out ? '[ ] ' : '[x] ') + sp.name, 120) + '  L' + sp.level, px + 6 + col * ((pw - 12) / 2), py + 18 + rw * 12, (pw - 16) / 2, 11, function () {
          if (!out) { self.dOut = id; self.scroll = 0; D.sfx('cursor'); return; }
          if (self.draftSwap(d.i, out, id)) { self.say(d.h.name + ' lets ' + (SV.spell(out) || { name: out }).name + ' go and prepares ' + sp.name + ' in its place', 260); back(); }
        }, { small: true });
      });
      this.listRows(b0, py + 18, 12, list.length, per, from, 'scroll', 2);
      this.pager(ctx, px + 6, py + ph - 13, list.length, per, from);
    }
    this.btn(ctx, this.dOut ? 'BACK' : 'NOT NOW', 20, 236, 70, 15, function () { if (self.dOut) { self.dOut = null; self.scroll = 0; D.sfx('cancel'); } else back(); });
  };
  // the rest card's SECOND DRAFT buttons, a seat a button, under the lines (drawRest, drawModuleRest)
  Pocket.prototype.draftBtns = function (ctx, x, y) {
    var self = this;
    this.drafters().forEach(function (d, k) { self.btn(ctx, d.spent ? 'DRAFTED: ' + fitText(d.h.name.toUpperCase(), 70) : 'SECOND DRAFT: ' + fitText(d.h.name.toUpperCase(), 70), x + k * 140, y, 134, 13, function () { self.dSeat = d.i; self.dOut = null; self.go('draft'); }, { small: true, dis: d.spent }); });
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
  // SAVE ALL on THE FIGHTS (10-17, Griz: "a save on the previous page with all the fights that saves all the fights and all the notes with them would be better"):
  // every fight kept here in one file, each as a fight's own SAVE A FILE writes it -- its summary, its notes, its play record (js/record.js keeps the last 40, so an
  // older fight's `record` is null). R on the tester ladder (REC.save) writes the play records alone, with no notes and no summary
  Pocket.prototype.saveAll = function () {
    var fs = this.st.fights || []; if (!fs.length) return null;
    var plays = D.store.get('deep16.plays') || [], self = this;
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'pocket-dm-fights-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var body = JSON.stringify({ what: 'DRAGONSLEEP: every Pocket DM fight kept in this browser, newest first (deep16/?pocket THE FIGHTS, SAVE ALL; the play records by js/record.js)', saved: d.toISOString(), n: fs.length,
      noted: fs.filter(function (f) { return f.notes; }).length,
      fights: fs.map(function (rec) { return { summary: self.summary(rec), fight: rec, record: plays.filter(function (f) { return f.started === rec.started; })[0] || null }; }) }, null, 1);
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      this.say('saved ' + name + ': ' + fs.length + ' fight' + (fs.length === 1 ? '' : 's'));
    } catch (e) { this.say('could not save: ' + e); return null; }
    return name;
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

  // ------------------------------------------------------------------ the whole table in one file (10-06, Griz: "I couldn't seem to save a roster and saw no place to load a ladder
  // save"; "where am i supposed to save to?"; RULED "yes to 1 & 2"): the seats with their winnings, the made characters, Pyro, and the ladder under way, to a .json and back -- SAVE
  // TABLE / LOAD TABLE on the title (reachable mid-ladder) and on THE PARTY. The ladder still keeps itself in this browser between visits (deep16.pocket); the file is how it goes
  // to another browser, the live site from a local one, or past a cleared storage. LOAD TABLE takes a roster file (10-03's) too: its characters are added, as LOAD ROSTER did
  // SAVE CAMPAIGN (10-09, Griz: "Would it be accurate to call it 'Save Campaign' if it stores your party, your units, and your limited number of ladder map exclusions?"):
  // the same file, named for what it now carries -- the DM's purse, units, struck floors and built ladder (st.camp) and the Mascots let in (st.mascots) with the rest;
  // a table file of 10-06's (kind pocket-table) still loads
  PK.TABLE_KIND = 'pocket-table'; PK.CAMPAIGN_KIND = 'pocket-campaign';
  // A DM'S LADDER (10-17, Griz: "DM should be able to save a ladder that has to be played on the regular (as an option - play DMs ladder) rather than duping the
  // experience?" -- "1 yes"): a ladder a DM built and saved (js/pocketdm.js PD.saveLadder) played at any table as built -- its floors, its CRs, the foes its units
  // made; its fifth slot is its trial, which lets no king in (the king is the real trial's)
  PK.LADDER_KIND = 'pocket-dm-ladder';
  // MODULES (10-17, the two Pocket DMs, step B; Griz: "A DM will want to save multiple ladders (modules?)", "DM flag when he adds each map if he allows short rest,
  // long rest, market visit between runs of his module(ladder)", "to test it can you make a 6 fight module for a starting lvl 1 party of 4 that we can include for
  // new users to have as example module?"): a run of fights played as built, as many as PK.MODULE_MAX, each slot its floor, its foes, a name, a line to open it and
  // what follows it (`rest`: short, long, market -- a short rest unless it says not, RULED 10-17). The game's own are data/modules.js (D.MODULES); one from a file
  // is kept in this browser (st.modules, the newest first) to play again. A DM's ladder file of 10-17 still loads: its four rungs with a short rest and the market
  // between, a long rest before its fifth, the trial (as the DM's ladder ran). A module's last fight lets no king in, as a DM's trial never did
  PK.MODULE_KIND = 'pocket-dm-module'; PK.MODULE_MAX = 10; PK.MODULES_KEPT = 12;
  PK.moduleOf = function (f) {
    if (!f || f.game !== 'DRAGONSLEEP') return null;
    var ok = function (s) { return s && typeof s.map === 'string' && Array.isArray(s.foes) && s.foes.length && s.foes.every(function (k) { return !!PK.foe(k); }); }; // (a villain's word builds at any table: PK.foe)
    var str = function (v, n) { return v == null || v === '' ? null : String(v).slice(0, n); };
    if (f.kind === PK.LADDER_KIND && Array.isArray(f.plan)) {
      var plan = f.plan.filter(ok).slice(0, 5); if (!plan.length) return null;
      return { id: null, name: 'A DM\'S LADDER', by: null, party: null, about: 'A ladder a DM built and saved' + (f.at ? ' (' + String(f.at).slice(0, 10) + ')' : '') + ': ' + plan.length + ' fight' + (plan.length === 1 ? '' : 's') + (plan.length >= 5 ? ', the fifth the trial after a long rest' : '') + '.', at: f.at || null,
        slots: plan.map(function (s, i) { return { map: s.map, foes: s.foes.slice(), name: plan.length >= 5 && i === 4 ? 'The trial' : null, intro: null, rest: { short: true, long: plan.length >= 5 && i === 3, market: true } }; }) };
    }
    if ((f.kind === PK.MODULE_KIND || f.builtin) && Array.isArray(f.slots)) {
      var sl = f.slots.filter(ok).slice(0, PK.MODULE_MAX); if (!sl.length) return null;
      var pty = f.party && +f.party.lvl ? { n: Math.max(1, Math.min(6, +f.party.n || 4)), lvl: Math.max(1, Math.min(12, +f.party.lvl)) } : null;
      return { id: str(f.id, 40), name: (str(f.name, 32) || 'A MODULE').toUpperCase(), by: str(f.by, 40), party: pty, about: str(f.about, 400) || '', at: f.at || null,
        slots: sl.map(function (s) { var r = s.rest || {}; return { map: s.map, foes: s.foes.slice(), name: str(s.name, 40), intro: str(s.intro, 200), rest: { short: r.short !== false, long: !!r.long, market: !!r.market } }; }) };
    }
    return null;
  };
  // the game's own (data/modules.js) and those kept from files, each with a key the list picks by
  PK.modules = function (st) {
    var own = (D.MODULES || []).map(function (m) { var x = PK.moduleOf(Object.assign({ game: 'DRAGONSLEEP', builtin: true }, m)); if (x) { x.key = 'game:' + m.id; x.builtin = true; } return x; }).filter(Boolean);
    var kept = (st.modules || []).map(function (m, i) { var x = PK.moduleOf(Object.assign({ game: 'DRAGONSLEEP', kind: PK.MODULE_KIND }, m)); if (x) x.key = 'kept:' + (m.kid || i); return x; }).filter(Boolean); // (kid: a kept one's own key, so a later file shifts nothing)
    // (at the DM's table, the campaign's own modules as BUILD has them, to play-test with DM mode on -- his "3. yes - with DM mode on too (playtesting his own modules)";
    // YOUR LADDER, the one ladder, till step C)
    var mine = st.dm && st.camp && Array.isArray(st.camp.modules) ? st.camp.modules.map(function (m) {
      var x = PK.moduleOf({ game: 'DRAGONSLEEP', kind: PK.MODULE_KIND, name: m.name, by: 'this table', about: m.about, slots: m.slots });
      if (x) { x.key = 'table:' + m.id; x.mine = true; x.about = x.about || 'Your module on THE CAMPAIGN: ' + x.slots.length + ' fight' + (x.slots.length === 1 ? '' : 's') + '. Played here, it pays the DM\'s purse.'; }
      return x;
    }).filter(Boolean) : [];
    return mine.concat(own, kept);
  };
  PK.keepModule = function (st, mod) {
    var rec = JSON.parse(JSON.stringify({ id: mod.id, name: mod.name, by: mod.by, party: mod.party, about: mod.about, at: mod.at, slots: mod.slots }));
    var was = (st.modules || []).filter(function (m) { return m && m.name === rec.name && JSON.stringify(m.slots) === JSON.stringify(rec.slots); })[0];
    rec.kid = was && was.kid ? was.kid : 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    var same = function (m) { return m && m.name === rec.name && JSON.stringify(m.slots) === JSON.stringify(rec.slots); };
    st.modules = [rec].concat((st.modules || []).filter(function (m) { return !same(m); })).slice(0, PK.MODULES_KEPT);
    return 'kept:' + rec.kid;
  };
  // the stock cards to the module's level (the made characters keep theirs: their level is the maker's)
  PK.levelAll = function (st, L) {
    var moved = 0, kept = 0;
    st.party.forEach(function (slot) {
      var e = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0];
      if (!e || e.king || slot.custom != null) { if (slot.w !== 'new') kept++; return; }
      var to = Math.max(e.lo, Math.min(e.hi || 12, PK.cap(st), L)); if (to === slot.lvl) return;
      slot.lvl = to; slot.xp = R.XP_LEVEL[to] || 0; moved++; if (slot.picks) Object.keys(slot.picks).forEach(function (k) { if (+k > to) delete slot.picks[k]; });
    });
    return { moved: moved, kept: kept };
  };
  PK.readJSON = function (cb) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { cb(rd.result, f.name); }; rd.readAsText(f); };
    inp.click();
  };
  Pocket.prototype.readModule = function (text) {
    var f = null; try { f = JSON.parse(text); } catch (e) { f = null; }
    var m = PK.moduleOf(f);
    if (!m) { this.msg = { text: 'that file is not a module or a DM\'s ladder (or its foes are not in this game)', t: 300, bad: true }; return null; }
    return m;
  };
  // THE MODULES FOLDER (10-17, his "re 5 - can we when DM saves module store a pointer to a folder so player side load module doesn't open windows picker and can load
  // ones in that folder from in-game?" -- "2 yes, i'll test in brave after"): a folder picked once (the browser's picker, that one time) is kept in this browser's
  // IndexedDB, as tools/hexmap.js keeps its file; the DM's SAVE AS A MODULE writes into it, and THE MODULES lists its modules in the game. After the browser restarts it
  // asks one "allow" (a permission prompt, never the picker). Without folder access (Firefox, Safari; Brave may ship it switched off) FROM A FILE stands
  PK.canFolder = function () { return typeof window.showDirectoryPicker === 'function' && typeof indexedDB !== 'undefined'; };
  function idbP() { return new Promise(function (res, rej) { var r = indexedDB.open('deep16-pocket', 1); r.onupgradeneeded = function () { r.result.createObjectStore('h'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  PK.folderGet = function () { if (!PK.canFolder()) return Promise.resolve(null); return idbP().then(function (db) { return new Promise(function (res) { var q = db.transaction('h').objectStore('h').get('modules'); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }).catch(function () { return null; }); };
  PK.folderSet = function (h) { return idbP().then(function (db) { return new Promise(function (res) { var tx = db.transaction('h', 'readwrite'); tx.objectStore('h').put(h, 'modules'); tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); }; }); }).catch(function () { return false; }); };
  PK.folder = null; PK.folderGet().then(function (h) { PK.folder = h; }); // (held from the page's start, so a click's permission prompt is asked inside the click)
  PK.folderPick = function () { return window.showDirectoryPicker({ id: 'pocket-modules', mode: 'readwrite' }).then(function (h) { PK.folder = h; return PK.folderSet(h).then(function () { return h; }); }); };
  PK.folderAllowed = function (h, write, ask) {
    var o = { mode: write ? 'readwrite' : 'read' };
    return Promise.resolve(h.queryPermission ? h.queryPermission(o) : 'granted').then(function (p) { return p === 'granted' ? true : ask && h.requestPermission ? h.requestPermission(o).then(function (q) { return q === 'granted'; }) : false; });
  };
  // every .json the folder holds that reads as a module, its file name on it
  PK.folderScan = function (h) {
    var out = [], it = h && h.values ? h.values() : null; if (!it) return Promise.resolve(out);
    var step = function () { return it.next().then(function (r) {
      if (r.done) return out; var e = r.value; if (!e || e.kind !== 'file' || !/\.json$/i.test(e.name)) return step();
      return e.getFile().then(function (f) { return f.text(); }).then(function (t) { var j = null; try { j = JSON.parse(t); } catch (x) { j = null; } var m = PK.moduleOf(j); if (m) { m.file = e.name; out.push(m); } return step(); }, step);
    }); };
    return step().then(function (ms) { return ms.sort(function (a, b) { return a.file < b.file ? 1 : -1; }); }); // (the newest file names first: they carry the date)
  };
  PK.folderWrite = function (h, name, text) { return h.getFileHandle(name, { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) { return Promise.resolve(w.write(text)).then(function () { return w.close(); }); }); };
  // THE MODULES' view of the folder: none, waiting for an allow, read (its modules), or none to be had here
  Pocket.prototype.folderRead = function (ask) {
    var self = this, h = PK.folder;
    if (!PK.canFolder()) { this.fold = { state: 'unsupported', mods: [] }; return; }
    if (!h) { this.fold = { state: 'none', mods: [] }; return; }
    this.fold = { state: 'reading', name: h.name, mods: [] };
    PK.folderAllowed(h, false, ask).then(function (ok) {
      if (!ok) { self.fold = { state: 'ask', name: h.name, mods: [] }; return; }
      return PK.folderScan(h).then(function (ms) { self.fold = { state: 'ok', name: h.name, mods: ms.map(function (m) { m.key = 'dir:' + m.file; m.inFolder = true; return m; }) }; });
    }).catch(function (e) { self.fold = { state: 'ask', name: h.name, mods: [], err: String(e && e.message || e) }; });
  };
  Pocket.prototype.folderChoose = function () {
    var self = this;
    PK.folderPick().then(function () { self.folderRead(false); self.say('THE MODULES now read the folder ' + PK.folder.name, 300); }).catch(function (e) { if (!(e && e.name === 'AbortError')) self.say('could not keep the folder: ' + (e && e.message || e), 300); });
  };
  // FROM A FILE on THE MODULES: kept in the list and picked, not begun
  Pocket.prototype.loadModule = function () { var self = this; PK.readJSON(function (text) { var m = self.readModule(text); if (!m) return; self.modSel = PK.keepModule(self.st, m); self.keep(); self.say(m.name + ': ' + m.slots.length + ' fights, kept in this browser', 300); }); };
  Pocket.prototype.startModule = function (m) {
    if (!m || !m.slots || !m.slots.length) return null;
    if (!this.ready()) { this.go('party'); this.say('every seat wants a character first: then the module again', 300); return null; }
    var here = this.st.run, ask = this.ask || function (q) { return window.confirm(q); };
    if (here && !ask('A ' + (here.module ? 'module' : 'ladder') + ' is under way (' + (here.trial ? 'the trial' : (here.module ? 'fight ' : 'rung ') + here.rung) + '). Put it away for ' + m.name + '?')) { this.say('kept the one under way', 240); return null; }
    var levels = this.levels(), plan = m.slots.map(function (s) { return Object.assign(JSON.parse(JSON.stringify(s)), { cr8: PK.sum8(s.foes), mine: 0, units: [] }); });
    this.st.run = { rung: 1, trial: false, base8: plan[0].cr8, carry: null, hd: levels.slice(), arcane: levels.map(function () { return false; }), won: 0, startedAt: Date.now(), plan: plan,
      module: { name: m.name, key: m.key || null, n: plan.length }, foes: null, map: null, dmLadder: m.at || m.id || true };
    this.planRung(this.st.run); this.keep(); this.go('cr');
    this.say(m.name + ': ' + plan.length + ' fight' + (plan.length === 1 ? '' : 's'), 300);
    return this.st.run;
  };
  // a DM's ladder file played straight from its text (10-17's A DM'S LADDER; THE MODULES' FROM A FILE keeps one to pick instead)
  Pocket.prototype.takeLadder = function (text) { var m = this.readModule(text); return m ? this.startModule(m) : null; };
  // after a module's won fight: what its slot allows -- a long rest (hit points, slots, hit dice and features back), a short rest (the ladder's), or none
  Pocket.prototype.moduleRest = function () {
    var run = this.st.run, sl = run && run.plan[run.rung - 1], rs = (sl && sl.rest) || {};
    if (rs.long) { var lvs = this.levelUps(); run.carry = null; run.drafts = null; run.hd = this.levels().slice(); run.arcane = run.hd.map(function () { return false; }); this.rest = { long: true, levels: lvs }; this.keep(); } // (the XP's levels at the long rest, 10-17)
    else if (rs.short && run.carry) this.restCard();
    else this.rest = { none: true };
    this.rest.module = true; this.rest.market = !!rs.market;
    return this.rest;
  };

  // ------------------------------------------------------------------ XP (10-17, Griz: "watched the module, are we by chance not giving the xp?" -- and his 10-17 "if the CR is
  // set hard enough you level"): a won fight gives the SRD's XP for its foes (R.CR_XP), split evenly across the seats (the king takes none); a card with enough
  // (R.XP_LEVEL) goes up a level at the next long rest -- straight after a single fight (each is followed by one), at a ladder's or a module's long rest, and at
  // its end. LEVEL-UPS: EDIT opens each level's choices (askLevel), a card at a time; DEFAULTS takes them. A made card takes its class's own (EDIT it on THE
  // PARTY to choose). The arrows still set a level by hand, its XP to that level's floor. (The seat's leans, his to overrule.)
  PK.stockOf = function (slot) { return slot && slot.custom == null ? PK.STOCK.filter(function (q) { return q.w === slot.w; })[0] || null : null; };
  PK.recOf = function (st, slot) { return slot.custom != null ? st.roster[slot.custom] || null : slot.w === 'new' ? null : slot; };
  PK.lvlOf = function (st, slot) { var r = PK.recOf(st, slot), e = PK.stockOf(slot); return r ? (slot.custom != null ? r.lvl || 1 : r.lvl || (e ? e.lo : 1)) : 0; };
  PK.xpNow = function (st, slot) { var r = PK.recOf(st, slot); return r ? (r.xp != null ? r.xp : R.XP_LEVEL[PK.lvlOf(st, slot)] || 0) : 0; };
  PK.seatsXP = function (st) { return st.party.filter(function (slot) { var e = PK.stockOf(slot); return PK.recOf(st, slot) && !(e && e.king); }); };
  PK.giveXP = function (st, kinds) {
    var xp = 0; (kinds || []).forEach(function (k) { xp += PK.xpOf(k); });
    var seats = PK.seatsXP(st); if (!xp || !seats.length) return 0;
    var each = Math.floor(xp / seats.length);
    seats.forEach(function (slot) { PK.recOf(st, slot).xp = PK.xpNow(st, slot) + each; });
    return each;
  };
  // a fight WATCH ran gives no XP (10-17, Griz: "xp off if player has 'watch' turned on (unless DM mode is on)", "except for your benches"): the AI earned it, not the
  // player -- at the DM's table it does (his play-tests); a bench sets xpAlways
  Pocket.prototype.xpOn = function () { return !this.watch || !!this.st.dm || !!this.xpAlways; };
  PK.levelDue = function (st, slot) { var e = PK.stockOf(slot), L = PK.lvlOf(st, slot), top = Math.min(PK.cap(st), e ? e.hi || 12 : 12); return !!PK.recOf(st, slot) && !(e && e.king) && L < top && PK.xpNow(st, slot) >= (R.XP_LEVEL[L + 1] || Infinity); };
  // at a long rest: every card with the XP goes up, as far as it has earned; the lines say who
  Pocket.prototype.levelUps = function () {
    var st = this.st, self = this, ups = [];
    st.party.forEach(function (slot, i) {
      for (var g = 0; g < 12 && PK.levelDue(st, slot); g++) {
        var L = PK.lvlOf(st, slot) + 1, r = PK.recOf(st, slot);
        if (slot.custom != null) { if (st.editLevels) { r.lvl = L; r.code = PK.codeAt(r.code, L); (self.levelQueue = self.levelQueue || []).push([i, L]); } else PK.levelMade(r, L, null); } // (a made one by the toggle too, 10-17: his "can we accept the toggle on the party screen here?")
        else { slot.lvl = L; if (st.editLevels) (self.levelQueue = self.levelQueue || []).push([i, L]); }
        ups.push([i, L]);
      }
    });
    if (!ups.length) return [];
    this.cache = {}; this.keep();
    var sh = this.sheets(), seats = PK.seatsXP(st).length, one = ups.every(function (u) { return u[1] === ups[0][1]; });
    if (one && ups.length === seats && seats > 1) return ['The party reaches level ' + ups[0][1] + '.']; // (all of them at once: the party, never a pronoun)
    return ups.map(function (u) { var s = sh[u[0]]; return (s && s.h ? s.h.name : 'a seat') + ' reaches level ' + u[1] + '.'; });
  };
  // A MADE CARD'S LEVEL (10-17, step C; Griz: "made characters level up with their class's defaults (can we accept the toggle on the party screen here?)"): a level as the
  // maker's walk takes it (Pocket.walkLevels) -- the spells and cantrips it learns, the class options as they grow, the style, an increase or a subclass chosen -- folded
  // into the card's own word, so its list grows with it (till now a made caster's spells stood at the level it was made). LEVEL-UPS: DEFAULTS -- the class's own, no
  // page (the increase and the subclass the sheet's own by the class); EDIT -- the stock card's page (Pocket.askLevel), its choices folded here the same way
  PK.codeAt = function (code, L) { return String(code).replace(/^(~[^.]+\.)\d+/, '$1' + L); };
  // its spells as a list of its own: a blank list (the class's own) written out at a level, as the walk does an older one
  PK.madeBase = function (sp) {
    if (sp.known) return sp.known.slice();
    var info = null; try { info = NPC.prepInfo(Object.assign({}, sp, { known: null })); } catch (e) { info = null; }
    if (!info) return [];
    var c = NPC.CLASSES[sp.cls], nc = c.cantrips ? c.cantrips[sp.lvl - 1] || 0 : 0, cp = (c.spells && c.spells[0] ? c.spells[0] : []).filter(function (id) { return !!D.magic.data(id); });
    return cp.slice(0, nc).concat(info.def);
  };
  PK.levelMade = function (r, L, ch) {
    var sp = null; try { sp = NPC.decode(r.code); } catch (e) { sp = null; }
    var top = Math.max(r.lvl || 1, L);
    if (!sp) { r.lvl = top; r.code = PK.codeAt(r.code, top); return r; }
    if (!ch) {
      if (!sp.known) { r.lvl = top; r.code = PK.codeAt(r.code, top); return r; } // (a blank list is the class's own: it grows by itself)
      var a = null; try { a = NPC.levelAsks(Object.assign({}, sp, { lvl: L }), L, { known: sp.known, classDefaults: true }); } catch (e) { a = null; }
      ch = {}; ((a && a.asks) || []).forEach(function (q) { if (q.kind !== 'asi' && q.kind !== 'archetype') ch[R.askKey(q)] = q.took; });
    }
    var got = [].concat(ch.spells || [], ch.cantrip || []);
    if (got.length) { var k = sp.known || PK.madeBase(Object.assign({}, sp, { lvl: L - 1 })); sp.known = k.concat(got.filter(function (id) { return k.indexOf(id) < 0; })); }
    if (ch.asi) { sp.picks = sp.picks || {}; sp.picks[L] = Object.assign({}, sp.picks[L] || {}, { asi: ch.asi }); }
    if (ch.archetype != null) sp.subclass = ch.archetype;
    R.PICK_OPTS.forEach(function (k) { if (ch[k] != null) sp[k] = ch[k]; });
    sp.lvl = top; r.lvl = top; r.code = NPC.code(sp);
    return r;
  };

  // ------------------------------------------------------------------ THE LONG REST (10-17, the two Pocket DMs, step B; Griz: "For ladder and module play, long rest and daily
  // spells/pre-cast (aid, mage armor) then go to fight. For single fight, map and CR setting, then long rest spell selection"): the day's spells of each card that
  // prepares (a hero's by js/rules.js, a class card's by js/classes.js NPC.prepInfo), and what is cast that morning -- the grid camp's three (js/camp.js): Mage
  // Armor on one in no armour, Aid on three of the party, Light on one's gear -- each by whoever has it ready and the slot for it. Its choices are kept (st.morning)
  // and become each card's morning (PK.morningOf: prepared, conds, spend, aid; no Mage Armor by itself any more), worn into every fight of that day: a single
  // fight, or a ladder's or a module's fights till the next long rest (run.morning). By slot index: a seat's card
  // (10-21, Griz: "Morning spell cast options might need to be relabeled and allow to select for things like 'continual flame'"): the rows are the spells, not three:
  // every one built on the grid that is cast on a creature or its gear with no concentration and that, by the SRD 5.1's duration, outlasts a short rest's hour --
  // 8 hours or more, or till dispelled -- so it is on in each fight of the day; and Light, a cantrip, lit again before each fight. `lays`: the grid's condition it
  // lays (js/magic.js, js/grimoire.js); `n`: the creatures one casting takes (Aid's three); `bare`: one in no armour. Each creature picked is a casting and a slot,
  // spent in this order. (Left off: the 1-hour spells -- False Life, Longstrider, See Invisibility, Protection from Poison, Warding Bond, Freedom of Movement, True
  // Seeing -- which a short rest outlasts)
  PK.CAST_AHEAD = [
    { id: 'mageArmor', dur: '8 hours', lays: 'mageArmor', bare: true },
    { id: 'aid', dur: '8 hours', n: 3 },
    { id: 'darkvision', dur: '8 hours', lays: 'darkvision' },
    { id: 'continualflame', dur: 'till dispelled', lays: 'continualFlame' },
    { id: 'deathward', dur: '8 hours, or till it holds', lays: 'deathWard' },
    { id: 'mindblank', dur: '24 hours', lays: 'mindBlank' },
    { id: 'foresight', dur: '8 hours', lays: 'foresight' },
    { id: 'light', dur: '1 hour, lit before each fight', lays: 'light' }
  ];
  // m.cast[id] = { who: [seat, ...], by: seat }: who it is cast on and who casts it; a spell not there takes its defaults (Mage Armor on its caster, Light on the
  // front man when the fight is dark -- the grid camp's own -- the rest off)
  PK.MORNING0 = function () { return { prep: {}, cast: {} }; };
  function slotAt(h, lv) { for (var i = lv - 1; i < (h.slots || []).length; i++) if (h.slots[i] > 0) return i; return -1; }
  PK.morningInfo = function (st, m, dark) {
    var slots = st.party, out = { cards: [], casts: [] };
    slots.forEach(function (slot, i) {
      var sp = PK.specOf(st, slot); if (!sp) { out.cards.push(null); return; }
      var bare = PK.sheetOf(Object.assign({}, sp, { morning: true, mageArmor: false, prepared: null })); if (!bare) { out.cards.push(null); return; }
      var pi = null;
      if (sp.hero) { var n = R.prepCount(bare); if (n && bare.prepared) pi = { n: n, pool: R.prepPool(bare, SV.spell), always: R.oathSpells(bare) || [], def: bare.prepared.length ? bare.prepared.slice() : R.prepDefault(bare, SV.spell) }; } // (the build's own day by default: a morning left alone is the day the hero had)
      else if (NPC.CLASSES[sp.cls] && NPC.CLASSES[sp.cls].prepares) { pi = NPC.prepInfo(sp); if (pi && !pi.n) pi = null; }
      var prepared = pi ? (m.prep[i] || pi.def).filter(function (id) { return pi.pool.indexOf(id) >= 0; }).slice(0, pi.n) : null;
      var h = PK.sheetOf(Object.assign({}, sp, { morning: true, mageArmor: false, prepared: prepared })) || bare;
      var ready = (pi ? prepared.concat(pi.always || []) : []).concat(h.known || []);
      out.cards.push({ i: i, sp: sp, h: h, pi: pi, prepared: prepared, ready: ready, slots: (h.slots || []).slice(), unit: sp.hero || ('p' + i + '-' + PK.baseKey(PK.wordOf(st, slot))), fields: { morning: true, mageArmor: false, prepared: prepared || undefined, conds: {}, spend: [], aid: 0 } });
    });
    var cs = out.cards.filter(Boolean), knows = function (c, id) { return (c.pi ? c.pi.pool.concat(c.pi.always || []).concat(c.h.known || []) : c.h.known || []).indexOf(id) >= 0; };
    var byI = function (i) { return cs.filter(function (c) { return c.i === i; })[0] || null; };
    var spend = function (c, lv) { var k = slotAt(c, lv); if (k >= 0) c.slots[k]--; c.fields.spend.push(lv); };
    var front = cs.filter(function (c) { return /barbarian|fighter|paladin|monk/.test(c.h.cls); })[0] || cs[0];
    var dv0 = function (c) { return c.sp.hero ? (D.light && D.light.raceDV ? D.light.raceDV((DS.DATA.heroes[c.sp.hero] || {}).race) : 0) : ((NPC.RACES[c.h.race] || {}).dv || 0); }; // (the sight it had before: what a globe or Dispel Magic leaves, grimoire.js sense)
    var ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    PK.CAST_AHEAD.forEach(function (e) {
      var spl = SV.spell(e.id); if (!spl) return;
      var can = cs.filter(function (c) { return knows(c, e.id); }); if (!can.length) return; // (a row only for a spell someone in the party can cast)
      var lv = spl.level || 0, ready = cs.filter(function (c) { return c.ready.indexOf(e.id) >= 0; }), cur = m.cast[e.id] || {};
      var slotOK = function (c) { return !lv || slotAt(c, lv) >= 0; };
      var caster = (cur.by != null && ready.indexOf(byI(cur.by)) >= 0 ? byI(cur.by) : null) || ready.filter(slotOK)[0] || ready[0] || null;
      var who = Array.isArray(cur.who) ? cur.who : e.id === 'mageArmor' ? (caster ? [caster.i] : []) : e.id === 'light' ? (dark && front ? [front.i] : []) : [];
      var tg = who.map(byI).filter(Boolean), why = '', whyOf = {}, got = [];
      if (!ready.length) why = 'not prepared today' + (can.length > 1 ? ' by any of ' + can.map(function (c) { return c.h.name; }).join(', ') : ' (' + can[0].h.name + ')');
      if (e.bare) tg = tg.filter(function (c) { if (R.armored(c.h)) { whyOf[c.i] = 'wears armour'; return false; } return true; });
      if (caster && !why) {
        var val = function (c) { return e.lays === 'mageArmor' ? 1 : e.lays === 'continualFlame' ? ((c.h.equip && c.h.equip.weapon) || true) : e.lays === 'darkvision' ? { by: caster.unit, had: dv0(c) } : { by: caster.unit }; }; // (Continual Flame on the weapon in hand, the 8-bit's way: js/light.js)
        if (e.n) { if (tg.length) { if (slotOK(caster)) { spend(caster, lv); tg.slice(0, e.n).forEach(function (c) { c.fields.aid = 5; got.push(c); }); } else why = caster.h.name + ' has no ' + ORD[lv] + '-level slot left'; } }
        else tg.forEach(function (c) { if (!slotOK(caster)) { whyOf[c.i] = 'no slot left'; if (!why) why = caster.h.name + ' has no ' + ORD[lv] + '-level slot left'; return; } if (lv) spend(caster, lv); c.fields.conds[e.lays] = val(c); got.push(c); });
      }
      out.casts.push({ e: e, spell: spl, lv: lv, can: can, ready: ready, caster: caster, who: who, got: got, why: why, whyOf: whyOf });
    });
    return out;
  };
  PK.castText = function (r) { return r.spell.name + ' on ' + r.got.map(function (c) { return c.h.name; }).join(', '); };
  PK.morningOf = function (info) { return info.cards.map(function (c) { return c ? JSON.parse(JSON.stringify(c.fields)) : null; }); };
  // into THE LONG REST: what follows it (go: { label, fn }); the screen's BACK goes to `from`
  Pocket.prototype.toMorning = function (go, from) { this.mGo = go; this.mFrom = from || this.screen; this.mCaster = null; this.mInfo = null; this.go('morning'); };
  Pocket.prototype.morning = function () {
    var st = this.st, m = st.morning = st.morning && st.morning.prep ? st.morning : PK.MORNING0();
    if (!m.cast) { // (a morning kept before 10-21: its three rows as the spells' own)
      var c = m.cast = {}, seats = (st.party || []).map(function (s, i) { return i; });
      if (m.ma && !m.ma.on) c.mageArmor = { who: [] }; else if (m.ma && m.ma.who != null) c.mageArmor = { who: [m.ma.who] };
      if (m.aid && m.aid.on) c.aid = { who: seats.filter(function (i) { return i !== m.aid.out; }).slice(0, 3) };
      if (m.light && m.light.on === false) c.light = { who: [] }; else if (m.light && m.light.on && m.light.who != null) c.light = { who: [m.light.who] };
      delete m.ma; delete m.aid; delete m.light;
    }
    return m;
  };
  Pocket.prototype.mInfoNow = function () {
    if (!this.mInfo) { var run = this.st.run, mapId = run ? run.map : this.fightMap || this.mapFor(), def = D.MAPS[mapId] || {}; this.mInfo = PK.morningInfo(this.st, this.morning(), def.dark); }
    return this.mInfo;
  };
  Pocket.prototype.mChanged = function () { this.mInfo = null; this.keep(); D.sfx('cursor'); };
  // the morning chosen: worn by the run's fights (till its next long rest), or by the single fight and its AGAIN
  Pocket.prototype.takeMorning = function () {
    var mo = { words: this.words(), cards: PK.morningOf(this.mInfoNow()) };
    if (this.st.run) this.st.run.morning = mo; else this.st.dayMorning = mo;
    this.keep();
    return mo;
  };


  // THE CAMPAIGN'S FILE (v3 since 10-17, the DM's campaign, step C; Griz: "Campaign saves are DMs units, maps, and roster / Player saves are current party and pack"):
  // the roster and its marks, the DM's purse, receipts, units, maps, modules and struck floors (st.camp), what is let in (the Mascots, Pyro). The seats, the pack,
  // the purse and a run under way are the party's file (THE CAMP's SAVE THE PARTY). A file of v2 or before -- everything in one -- still loads whole (takeFile)
  PK.tableFile = function (st) {
    var copy = function (v) { return v == null ? null : JSON.parse(JSON.stringify(v)); };
    return { game: 'DRAGONSLEEP', kind: PK.CAMPAIGN_KIND, v: 3, at: new Date().toISOString(), roster: copy(st.roster) || [], pyro: !!st.pyro, camp: copy(st.camp), mascots: copy(st.mascots) };
  };
  Pocket.prototype.onCampaignSaved = function () { }; // (js/pocketdm.js: the first campaign made lets Beholda in)
  Pocket.prototype.saveTable = function () {
    this.keep(); // (the screen's own picks -- the map, the dial, the foes -- onto the store first)
    var st = this.st, d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'pocket-dm-campaign-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(PK.tableFile(st), null, 1)], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      this.say('saved the campaign (the roster' + (st.camp ? ', your units, maps and modules' : '') + ') to ' + name + ' -- where your browser puts downloads', 420);
      this.onCampaignSaved();
      return name;
    } catch (e) { this.msg = { text: 'could not write the file: ' + e, t: 300, bad: true }; return null; }
  };
  Pocket.prototype.loadTable = function () {
    var self = this, inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { self.takeFile(rd.result); }; rd.readAsText(f); };
    inp.click();
  };
  // a table file onto this table: its characters added to the roster (none here lost), the seats and the ladder taken as the file has them -- asked first when that would put
  // away a ladder under way here (this.ask: the browser's confirm, a bench's own); a roster file goes the roster's way
  Pocket.prototype.takeFile = function (text) {
    var file = null; try { file = JSON.parse(text); } catch (e) { /* (not JSON) */ }
    if (file && file.game === 'DRAGONSLEEP' && file.kind === PK.FILE_KIND) return this.takeRoster(text);
    if (!file || file.game !== 'DRAGONSLEEP' || (file.kind !== PK.TABLE_KIND && file.kind !== PK.CAMPAIGN_KIND) || !Array.isArray(file.roster)) { this.msg = { text: 'that file is not a Pocket DM campaign or roster', t: 300, bad: true }; return null; }
    var st = this.st, here = st.run, ask = this.ask || function (q) { return window.confirm(q); }, whole = !(file.v >= 3); // (v3: the campaign alone -- the seats and a run stay as they are here)
    if (whole && here && JSON.stringify(here) !== JSON.stringify(file.run || null) && !ask('A ladder is under way here (' + (here.trial ? 'the trial' : 'rung ' + here.rung) + '). Put it away for the file\'s ' + (file.run ? 'ladder (' + (file.run.trial ? 'the trial' : 'rung ' + file.run.rung) + ')' : 'table, with no ladder') + '?')) { this.say('kept the ladder here; nothing taken', 240); return { declined: true }; }
    // the roster: each of the file's characters found here (the same word and name) or added; its seats re-pointed to where each now stands
    var at = [], added = 0, bad = 0;
    file.roster.forEach(function (c, i) {
      var ok = false; try { ok = !!(c && typeof c.code === 'string' && NPC.spec(c.code)); } catch (e) { ok = false; }
      if (!ok) { at[i] = -1; bad++; return; }
      var j = -1; st.roster.forEach(function (r, k) { if (j < 0 && r.code === c.code && r.name === c.name) j = k; });
      if (j < 0) { var nr = { code: c.code, name: String(c.name || 'unnamed').slice(0, 24), cls: c.cls, lvl: c.lvl, made: c.made || Date.now() }; if (c.mark === 'villain' || c.mark === 'only') nr.mark = c.mark; if (c.dm) nr.dm = true; if (typeof c.xp === 'number') nr.xp = c.xp; st.roster.push(nr); j = st.roster.length - 1; added++; } // (its mark and XP with it, 10-17)
      else { if (c.mark === 'villain' || c.mark === 'only') st.roster[j].mark = c.mark; if (c.dm) st.roster[j].dm = true; }
      at[i] = j;
    });
    var seats = whole && Array.isArray(file.party) ? file.party.map(function (s) { if (!s) return null; if (s.custom == null) return JSON.parse(JSON.stringify(s)); var j = at[s.custom]; return j >= 0 ? Object.assign(JSON.parse(JSON.stringify(s)), { custom: j }) : null; }).filter(Boolean) : null;
    if (seats && seats.length) st.party = seats;
    if (file.pyro) st.pyro = true;
    if (file.camp && typeof file.camp === 'object') st.camp = JSON.parse(JSON.stringify(file.camp)); // (the DM's purse, receipts, units, maps, modules, marks, struck floors)
    if (file.mascots && typeof file.mascots === 'object') { st.mascots = st.mascots || {}; Object.keys(file.mascots).forEach(function (k) { if (file.mascots[k]) st.mascots[k] = true; }); } // (let in, never let out)
    if (whole) {
      st.run = file.run || null; st.mapId = file.mapId || null; st.crI = file.crI == null ? -1 : file.crI; st.foes = file.foes || null;
      this.mapSel = st.mapId; this.crI = st.crI; this.foes = st.run ? st.run.foes : st.foes; this.fightMap = st.run ? st.run.map : null;
      if (st.run && this.mapIds().indexOf(st.run.map) < 0) { this.fightMap = st.run.map = this.randomMap(); } // (as at the door: a floor the table no longer deals draws a fresh one)
    }
    this.cache = {};
    this.metalOff(); // (a campaign from before 10-21's ruling: a druid's metal to the pack -- PK.druidMetal)
    var res = { added: added, bad: bad, seats: st.party ? st.party.length : 0, run: st.run ? (st.run.trial ? 'trial' : st.run.rung) : null, saved: this.keep(), whole: whole };
    if (this.screen !== 'title' && this.screen !== 'party' && this.screen !== 'camp') this.go('title'); // (before the line: a screen change clears what is said)
    if (res.saved) this.say(whole ? 'the campaign brought in: ' + res.seats + ' at the table' + (added ? ', ' + added + ' new to the roster' : '') + (bad ? ', ' + bad + ' would not build' : '') + (st.run ? ', the ladder at ' + (st.run.trial ? 'the trial' : 'rung ' + st.run.rung) : '')
      : 'the campaign brought in' + (added ? ': ' + added + ' new to the roster' : ': the roster as it was') + (bad ? ', ' + bad + ' would not build' : '') + (st.camp ? ', the DM\'s units, maps and modules' : '') + ' -- the party here as it was', 360);
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
  Pocket.prototype.makeNew = function (slotIndex, custom, at) { // (at: the roster index edited, when no seat holds it -- a villain's, js/pocketdm.js)
    var sp = custom ? NPC.decode(custom.code) : null;
    var abil = {}; NPC.ABIL.forEach(function (k) { abil[k] = sp && sp.abil ? sp.abil[k] : 10; });
    // (the code keeps the scores with the race's numbers in: take them back out for the dials)
    if (sp && sp.abil) { var rc = NPC.RACES[sp.race] || NPC.RACES.human; Object.keys(rc.abil).forEach(function (k) { abil[k] -= rc.abil[k]; }); }
    this.mk = { step: 1, slot: slotIndex, editing: at != null ? at : custom ? this.st.party[slotIndex].custom : null, cls: sp ? sp.cls : 'fighter', race: sp ? sp.race : 'human', abil: abil, lvl: sp ? Math.min(PK.cap(this.st), sp.lvl) : 1,
      equip: sp ? Object.assign({}, sp.equip) : null, alt: sp ? sp.alt : undefined, known: sp && sp.known ? sp.known.slice() : null, name: sp ? sp.name : '', tab: 'weapon', spellTab: 0,
      style: sp ? sp.style || NPC.CLASSES[sp.cls].style || null : null, sub: sp && sp.subclass ? sp.subclass : null, picks: sp && sp.picks ? JSON.parse(JSON.stringify(sp.picks)) : null, opt: null,
      walked: 0, got: null }; // (walked: the levels NEXT has walked -- one of your own already made stands walked to its level, 10-17)
    if (sp) this.mk.walked = this.mk.lvl;
    var mk0 = this.mk; if (sp) (NPC.OPTIONS[sp.cls] || []).forEach(function (o) { if (sp[o.key] != null && !(o.key === 'pact' && sp.pact === NPC.CLASSES[sp.cls].pact)) { mk0.opt = mk0.opt || {}; mk0.opt[o.key] = o.count ? sp[o.key].slice() : sp[o.key]; } }); // (its class options, 10-14)
    if (!this.mk.equip) this.kitUp();
    this.go('maker');
  };
  // (the class's own kit -- and its own fighting style, the maker's STYLE tab picks another: 10-06)
  Pocket.prototype.kitUp = function () { var c = NPC.CLASSES[this.mk.cls]; this.mk.equip = { weapon: c.kit.weapon, armor: c.kit.armor || null, shield: c.kit.shield || null, ring: null, cloak: null }; this.mk.alt = c.kit.alt || null; this.mk.known = null; this.mk.style = c.style || null; this.mk.sub = null; this.mk.picks = null; this.mk.opt = null; };
  Pocket.prototype.mkSpec = function () {
    var m = this.mk, rc = NPC.RACES[m.race] || NPC.RACES.human, abil = {};
    NPC.ABIL.forEach(function (k) { abil[k] = m.abil[k] + (rc.abil[k] || 0); });
    var sp = { cls: m.cls, lvl: m.lvl, race: m.race, abil: abil, asis: true, maxhp: true, named: true, custom: true, equip: Object.assign({}, m.equip), alt: m.alt, name: m.name || (R.CLASSES[m.cls].name + ' ' + m.lvl) };
    if (m.style && (R.STYLE_FOR[m.cls] || []).indexOf(m.style) >= 0) sp.style = m.style;
    if (m.known) sp.known = m.known.slice();
    if (NPC.CLASSES[m.cls].pact) sp.pact = NPC.CLASSES[m.cls].pact;
    (NPC.OPTIONS[m.cls] || []).forEach(function (o) { var v = m.opt && m.opt[o.key]; if (v == null || m.lvl < o.at) return; sp[o.key] = o.count ? v.slice(0, o.count(m.lvl)) : v; }); // (the class options picked on THE GEAR's tabs, 10-14)
    var sc = R.SUBCLASSES[m.cls]; if (m.sub && sc && m.lvl >= sc.at && R.subOpt(m.cls, m.sub)) sp.subclass = m.sub;
    if (m.picks) { var pp = {}; Object.keys(m.picks).forEach(function (L) { if (+L <= m.lvl) pp[L] = m.picks[L]; }); if (Object.keys(pp).length) sp.picks = pp; } // (the increases picked on THE LEVEL, 10-14) // (the subclass picked on THE LEVEL, 10-14; none picked: the SRD's)
    return sp;
  };
  // a made one's increase at a level, on the one pick page (10-14): the scratch sheet at that level, the increase it takes now marked; the pick kept on the maker
  Pocket.prototype.askMakerAsi = function (at) {
    var m = this.mk, self = this, R8 = DS.R, sp = this.mkSpec(); sp.lvl = at;
    var h = null; try { h = NPC.sheet(sp); } catch (e) { h = null; }
    var got = h && h.asiAt && h.asiAt[at]; if (!got) { D.sfx('error'); return; }
    h.picks = [{ lvl: at, asks: [{ kind: 'asi', need: 2, took: got }] }]; R8.pendSync(h);
    this.pm = DS.MENU.openPicks({ party: function () { return [h]; }, close: function () { } }, [h], {}, function () {
      self.pm = null;
      var ch = h.chose && h.chose[at]; if (ch && ch.asi) { m.picks = m.picks || {}; m.picks[at] = { asi: ch.asi }; }
    });
  };
  Pocket.prototype.mkSheet = function () { try { return NPC.sheet(this.mkSpec()); } catch (e) { return null; } };
  // NEXT from THE LEVEL walks every level not yet walked, a pick page a level (10-17, Griz: "Ideally this wouldn't level until next, then you'd have to walk all
  // the way through each one for that character"): the level's lines, then what it gives (js/classes.js NPC.levelAsks), the class's own marked and CONFIRM
  // walking them; a level with nothing to choose passes, its lines said with the next page's. What is chosen is the maker's: the increase (m.picks), the
  // subclass, the spells (m.known, and m.got by level so a level given back takes its own), the class options, the style. done() when the last is kept
  Pocket.prototype.walkLevels = function (done) {
    var m = this.mk, self = this, R8 = DS.R, said = [];
    if ((m.walked || 0) >= m.lvl) { done(); return; }
    if (!m.walked) { m.known = []; m.got = {}; } // (from level 1: every spell is the walk's)
    else if (!m.known) { var inf = this.spellInfo(m.walked); m.known = inf ? inf.defC.concat(inf.def) : []; } // (an older one on its class's list: that list, written out)
    m.got = m.got || {};
    var scl = R.SUBCLASSES[m.cls];
    var step = function () {
      var L = (m.walked || 0) + 1;
      if (L > m.lvl) { if (said.length) self.say(said[said.length - 1]); done(); return; }
      var sp = self.mkSpec(); sp.name = m.name || R.CLASSES[m.cls].name;
      if (scl && L < scl.at) delete sp.subclass; // (the subclass from its own level only)
      var a = null; try { a = NPC.levelAsks(sp, L, { known: m.known, classDefaults: true }); } catch (e) { a = null; }
      if (!a || !a.asks.length) { if (a) said = said.concat(a.lines); m.walked = L; step(); return; }
      var h = a.h, rec = { lvl: L, asks: a.asks, lines: said.concat(a.lines).slice(-6) }; said = [];
      h.picks = [rec]; R8.pendSync(h);
      self.pm = DS.MENU.openPicks({ party: function () { return [h]; }, close: function () { } }, [h], { built: D.climb.built }, function () {
        self.pm = null;
        var ch = (h.chose && h.chose[L]) || {}, got = [].concat(ch.spells || [], ch.cantrip || []);
        if (ch.asi) { m.picks = m.picks || {}; m.picks[L] = { asi: ch.asi }; }
        if (ch.archetype != null) { var so = R.subOpt(m.cls, ch.archetype); m.sub = so && so.srd ? null : ch.archetype; }
        m.known = m.known.concat(got.filter(function (id) { return m.known.indexOf(id) < 0; })); m.got[L] = got;
        R8.PICK_OPTS.forEach(function (k) { if (ch[k] == null) return; if (k === 'style') m.style = ch[k]; else { m.opt = m.opt || {}; m.opt[k] = ch[k]; } });
        m.walked = L; step();
      });
    };
    step();
  };
  // a level given back on THE LEVEL takes what the walk gave it: its spells, its increase; the walk starts again from there
  Pocket.prototype.levelBack = function () {
    var m = this.mk;
    for (var L = m.walked || 0; L > m.lvl; L--) {
      var g = (m.got || {})[L] || [];
      if (m.known) m.known = m.known.filter(function (id) { return g.indexOf(id) < 0; });
      if (m.got) delete m.got[L]; if (m.picks) delete m.picks[L];
    }
    if ((m.walked || 0) > m.lvl) m.walked = m.lvl;
  };
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
  Pocket.prototype.spellInfo = function (atL) {
    var sp = this.mkSpec(), c = NPC.CLASSES[sp.cls], info = null; if (atL) sp.lvl = atL; // (atL: another level's, the walk's start -- 10-17)
    try { info = NPC.prepInfo(Object.assign({}, sp, { known: null })); } catch (e) { info = null; }
    if (!info) return null;
    var built = function (id) { return !!D.magic.data(id); };
    var nc = c.cantrips ? c.cantrips[sp.lvl - 1] : 0, cpool = (c.spells && c.spells[0] ? c.spells[0] : []).filter(built);
    return { nc: nc, cpool: cpool, n: info.n, pool: info.pool.filter(built), always: info.always, def: info.def, defC: cpool.slice(0, nc) };
  };
  Pocket.prototype.saveMade = function () {
    var sp = this.mkSpec(), code = NPC.code(sp), rec = { code: code, name: sp.name, cls: sp.cls, lvl: sp.lvl, made: Date.now() };
    var was = this.mk.editing != null ? this.st.roster[this.mk.editing] : null;
    if (was) { if (was.mark) rec.mark = was.mark; if (was.dm) rec.dm = true; if (typeof was.xp === 'number' && was.lvl === rec.lvl) rec.xp = was.xp; } // (its mark kept, and its XP while its level is the same -- 10-17)
    else if (this.mk.villain) { rec.dm = true; rec.mark = 'villain'; } // (MAKE in THE VILLAINS: the DM's, on the shelf -- js/pocketdm.js)
    if (was) this.st.roster[this.mk.editing] = rec;
    else { this.st.roster.push(rec); this.mk.editing = this.st.roster.length - 1; }
    if (!this.mk.villain) this.st.party[this.mk.slot] = { custom: this.mk.editing };
    this.cache = {}; var kept = this.keep();
    D.sfx(kept ? 'levelup' : 'error'); // (not written: the message says so, and stays through the screen change)
    this.go(this.mk.villain ? 'villains' : 'party');
  };

  // ------------------------------------------------------------------ THE MARKET and GEAR (10-17: the screens; the rules are PK's, above)
  // what a thing is, in a line (10-17, Griz: "item descriptions on mouseover and highlight of store options (bow range, finesse, etc on weapons)"): a weapon's damage,
  // its group and its properties, the range; armour's AC and how DEX adds, its weight, STR and Stealth; a shield's AC; then the item's own words where they say more
  PK.itemLine = function (id) {
    var it = DS.DATA.items[id]; if (!it) return { stats: '', desc: '' };
    var bits = [], w = it.weapon, a = it.armor, s = it.shield;
    if (w) {
      bits.push(w.dmg + ' ' + (w.type || '') + (w.versatile ? ' (' + w.versatile + ' two-handed)' : ''), (w.group || '') + ' ' + (w.kind || 'weapon'));
      (w.props || []).forEach(function (p) { if (p === 'ranged') return; bits.push(p === 'thrown' && w.thrown ? 'thrown (' + w.thrown.join('/') + ' ft)' : p); });
      if ((w.props || []).indexOf('ranged') >= 0) bits.push('range ' + (w.range || [80, 320]).join('/') + ' ft' + (w.ammo ? ', ' + w.ammo : ''));
      if (w.bonus) bits.push('+' + w.bonus + ' to hit and damage'); else if (w.magic) bits.push('magic');
    } else if (a) {
      var dm = a.dexMax == null ? (a.type === 'medium' ? 2 : null) : a.dexMax;
      bits.push('AC ' + (a.base + (a.bonus || 0)) + (dm === 0 ? '' : dm ? ' + DEX (max ' + dm + ')' : ' + DEX'), a.type || 'armour'); // (what the game's armour carries: no STR or Stealth rows, the grid reads neither from it)
    } else if (s) bits.push('+' + s.ac + ' AC', 'a hand');
    if (it.attune) bits.push('takes a bond');
    var d = String(it.desc || ''), plain = /^(\d+d\d+ [a-z]+[.,]|AC \d+|\+\d+ AC)/.test(d); // (the SRD basics' words only repeat the numbers)
    return { stats: bits.join(' · '), desc: plain ? '' : d };
  };
  Pocket.prototype.openMarket = function (from) { this.marketFrom = from || this.screen; this.marketTab = this.marketTab || 'arms'; if (this.st.purse == null) this.st.purse = 100; this.go('market'); this.scroll2 = 0; }; // (scroll2: the pack's page, 10-17)
  Pocket.prototype.drawMarket = function (ctx) {
    var self = this, st = this.st, L = this.topLevel(), mt = this.marketTab || 'arms', tab = MARKET_TABS.filter(function (t) { return t[0] === mt; })[0] || MARKET_TABS[0];
    if (st.purse == null) st.purse = 100;
    head(ctx, 'THE MARKET', 'the purse ' + st.purse + ' sp  ·  stock for level ' + L + '  ·  sold back at half');
    var y = 40;
    MARKET_TABS.forEach(function (t, k) { self.btn(ctx, t[1], 20 + k * 112, y, 106, 13, function () { self.marketTab = t[0]; self.scroll = 0; }, { on: tab === t, small: true }); });
    var list = PK.stock(L).filter(function (id) { return tab[2].indexOf(DS.DATA.items[id].kind) >= 0; }), per = 8, from = Math.min(this.scroll, Math.max(0, list.length - per));
    this.scroll = from;
    var rowsAt = []; // (each row's button, for the line under the lists: the one under the mouse or the keys -- 10-17)
    D.text(ctx, '{y}FOR SALE{/}', 20, y + 20, P('bone', 1));
    var b0 = this.btns.length;
    list.slice(from, from + per).forEach(function (id, k) {
      var it = DS.DATA.items[id], yy = y + 32 + k * 15, dear = it.price > st.purse;
      self.btn(ctx, it.name, 20, yy, 150, 13, function () {
        if (st.purse < it.price) { D.sfx('error'); self.say('the purse is ' + st.purse + ' sp: ' + it.name + ' is ' + it.price); return; }
        st.purse -= it.price; PK.packAdd(st, id, 1); self.keep(); D.sfx('confirm'); self.say(it.name + ' into the pack');
      }, { small: true, dis: dear, why: 'the purse is short' }); rowsAt.push([self.btns.length - 1, id, yy, 20]);
      D.text(ctx, it.price + ' sp', 176, yy + 3, dear ? P('stone', 5) : P('gold', 4));
    });
    this.listRows(b0, y + 32, 15, list.length, per, from); // (the arrows scroll it, 10-27)
    if (list.length > per) { // (^ and v, and the wheel: his "arrows would have shown more?", 10-17)
      D.text(ctx, (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length, 60, y + 32 + per * 15 + 4, P('stone', 5));
      this.btn(ctx, '^', 20, y + 32 + per * 15 + 1, 16, 12, function () { self.scroll = Math.max(0, self.scroll - per); }, { small: true, dis: from <= 0, nokey: true });
      this.btn(ctx, 'v', 38, y + 32 + per * 15 + 1, 16, 12, function () { self.scroll = Math.min(list.length - per, self.scroll + per); }, { small: true, dis: from + per >= list.length, nokey: true });
    }
    var px = 262, pk = (st.pack || []).filter(function (s) { return s.n > 0 && DS.DATA.items[s.id]; });
    D.text(ctx, '{y}THE PACK{/}  {g}(a click sells one){/}', px, y + 20, P('bone', 1));
    if (!pk.length) D.text(ctx, 'empty', px, y + 34, P('stone', 5));
    var pFrom = Math.min(this.scroll2 || 0, Math.max(0, pk.length - per)); this.scroll2 = pFrom; // (the pack pages as the stock does -- ^ v and the wheel over it: 10-17, his "the pack contains more items than it can sell - it doesn't scroll like buying items does")
    var b1 = this.btns.length;
    pk.slice(pFrom, pFrom + per).forEach(function (s, k) {
      var it = DS.DATA.items[s.id], yy = y + 32 + k * 15, half = Math.floor((it.price || 0) / 2);
      self.btn(ctx, it.name + (s.n > 1 ? ' x' + s.n : ''), px, yy, 150, 13, function () { st.purse += half; PK.packAdd(st, s.id, -1); self.keep(); D.sfx('cursor'); self.say(it.name + ' sold: ' + half + ' sp'); }, { small: true, dis: !(it.price > 0) || it.noSell, why: 'nobody buys that' }); rowsAt.push([self.btns.length - 1, s.id, yy, px]);
      D.text(ctx, half + ' sp', px + 156, yy + 3, P('silver', 5));
    });
    this.listRows(b1, y + 32, 15, pk.length, per, pFrom, 'scroll2');
    if (pk.length > per) {
      D.text(ctx, (pFrom + 1) + '-' + Math.min(pk.length, pFrom + per) + ' of ' + pk.length, px + 40, y + 32 + per * 15 + 4, P('stone', 5));
      this.btn(ctx, '^', px, y + 32 + per * 15 + 1, 16, 12, function () { self.scroll2 = Math.max(0, pFrom - per); }, { small: true, dis: pFrom <= 0, nokey: true });
      this.btn(ctx, 'v', px + 18, y + 32 + per * 15 + 1, 16, 12, function () { self.scroll2 = Math.min(pk.length - per, pFrom + per); }, { small: true, dis: pFrom + per >= pk.length, nokey: true });
    }
    // the row under the mouse or the keys: lit, and what it is under the lists (his "item descriptions on mouseover and highlight of store options")
    var hv = rowsAt.filter(function (q) { return q[0] === self.ksel; })[0];
    if (hv) {
      ctx.strokeStyle = P('gold', 4); ctx.strokeRect(hv[3] - 1.5, hv[2] - 1.5, 153, 16);
      var il = PK.itemLine(hv[1]), dy = 207, iw = D.W - 40, hit0 = DS.DATA.items[hv[1]];
      D.text(ctx, fitText('{y}' + hit0.name + '{/}  ' + il.stats, iw), 20, dy, P('bone', 1)); dy += 9;
      if (il.desc) D.wrap(il.desc, iw).slice(0, 2).forEach(function (t) { D.text(ctx, t, 20, dy, P('silver', 5)); dy += 9; });
    } else D.hint(ctx, 'what you buy waits in the pack: a card\'s GEAR puts it on · point at a thing for what it is', D.W / 2, 222, P('stone', 4), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
  };
  // a card's GEAR (10-17, Griz: "Gear - why not open the regular menu with equip and that character selected?"): the one menu's EQUIP on the card's sheet, over the
  // table's pack. Whatever comes off goes into the pack, a thing like any other, to wear or sell (10-17, his "wouldn't the kit items go in the pack to sell at the new market?"): a winning off the card's
  // record first (PK.dropWin); its own kit stays off because the word says so -- when the menu closes, what it wears that its word does not is written as its
  // GEAR (PK.gearIds) and a place its word fills that it left empty as `no<place>` -- so nothing comes back to be sold twice
  Pocket.prototype.openGear = function (i) {
    var self = this, st = this.st, slot = st.party[i]; if (!slot) return;
    var h = PK.sheetOf(PK.specOf(st, slot)); if (!h) return;
    slot.gear = slot.gear || {}; var wins = PK.winsOf(st, slot);
    var wornN = function (id) { return Object.keys(h.equip).filter(function (pl) { return h.equip[pl] === id; }).length; };
    var give = function (id, n) { // (called while still worn)
      var wk = wins.indexOf(id); if (wk >= 0 && wornN(id) <= 1 && PK.dropWin(st, slot, id)) wins.splice(wk, 1); // (a winning: off the card's record)
      PK.packAdd(st, id, n || 1);
    };
    var lh = this.lightHost([h], [i], give); // (a torch or a lantern in the off hand too, 10-17: Pocket.lightHost)
    this.pm = DS.MENU.openEquip({
      party: function () { return [h]; },
      pack: function () { return self.campPack(); },
      give: give,
      take: function (id, n) { PK.packAdd(st, id, -(n || 1)); },
      canSave: function () { return false; },
      light: lh.light,
      run: lh.run,
      close: function () { self.pm = null; self.gearBack(i, h); }
    }, h);
  };
  Pocket.prototype.gearBack = function (i, h) {
    var slot = this.st.party[i], own = slot && PK.bareOf(this.st, slot); if (!slot || !own) return; // (as its word now makes it: a winning taken off is gone from it)
    var g = {};
    ['weapon', 'armor', 'shield', 'offhand'].concat(R.PLACES).forEach(function (pl) {
      var now = h.equip[pl] || null, was = own.equip[pl] || null;
      if (now === was) return;
      if (now) g[pl] = pl === 'offhand' ? 'off:' + now : now;
      else g[pl] = 'no' + pl; // (any place: what came off is in the pack, not on the card -- 10-17)
    });
    slot.gear = g; this.cache = {}; this.keep();
  };

  // ------------------------------------------------------------------ the slots
  Pocket.prototype.cycle = function (i, dir) {
    var es = PK.entries(this.st), slot = this.st.party[i], at = -1;
    es.forEach(function (e, k) { if (slot.custom != null ? (e.kind === 'custom' && e.i === slot.custom) : slot.w === 'new' ? e.kind === 'new' : (e.kind === 'stock' && e.w === slot.w)) at = k; });
    var e = es[(at + dir + es.length) % es.length];
    PK.slotToPack(this.st, slot); // (its GEAR and a stock word's winnings into the pack, not lost with the card -- 10-17)
    if (this.st.light && this.st.light.seat === i) this.st.light = null; // (its light in hand stays in the pack, 10-17)
    if (e.kind === 'stock') this.st.party[i] = { w: e.w, lvl: Math.max(e.lo, Math.min(e.hi, slot.lvl || 3)), loot: [] };
    else if (e.kind === 'custom') this.st.party[i] = { custom: e.i };
    else this.st.party[i] = { w: 'new' };
    this.cache = {}; this.keep(); D.sfx('cursor');
  };
  // DROP on a made card (10-21): asked first, then off the roster for good (PK.dropMade)
  Pocket.prototype.dropMade = function (i) {
    var c = this.st.roster[i], ask = this.ask || function (q) { return window.confirm(q); }; if (!c) return;
    var wins = (c.loot || []).length;
    if (!ask('Take ' + c.name + ' off the roster for good?' + (wins ? ' ' + (wins > 1 ? 'Their ' + wins + ' winnings go' : 'Their winning goes') + ' to the pack.' : '') + ' Their seat stands empty. (SAVE THE PARTY first keeps them in a file.)')) return;
    var r = PK.dropMade(this.st, i);
    if (!r.ok) { D.sfx('error'); this.say(r.why, 300); return; }
    this.cache = {}; this.keep(); D.sfx('cursor'); this.say(r.name + ' is off the roster' + (r.wins.length ? ': ' + r.wins.length + ' to the pack' : ''), 240);
  };
  Pocket.prototype.levelSlot = function (i, dir) {
    var slot = this.st.party[i], e = PK.STOCK.filter(function (x) { return x.w === slot.w; })[0]; if (!e || e.king) return;
    var L = Math.max(e.lo, Math.min(e.hi || 12, PK.cap(this.st), (slot.lvl || e.lo) + dir));
    if (L === slot.lvl) { D.sfx('error'); return; }
    slot.lvl = L; slot.xp = R.XP_LEVEL[L] || 0; this.cache = {}; this.keep(); D.sfx('cursor'); // (the XP to the level's floor: the arrows set a level by hand, 10-17)
    if (slot.picks) Object.keys(slot.picks).forEach(function (k) { if (+k > L) delete slot.picks[k]; }); // (a level given back takes its picks with it)
    if (dir > 0 && this.st.editLevels) this.askLevel(i, L); // (EDIT off: the level's defaults, no page -- 10-17, his "or it always takes defaults (unlike Aurdin now)")
  };
  // a card's level up asks that level's choices (10-14, Griz: "I just clicked brann from L5 to L6 and expected choices"): the 8-bit's heroes and guests, made by
  // js/rules.js R.makeHero, on the one pick page (js/menu.js MN.openPicks) where the grid's M menu stands, as the climb asks them -- every spell offered (the
  // ladders' rule), one not on the grid greyed; what is chosen rides the card's word (slot.picks). A named one of the class floor keeps its register's
  Pocket.prototype.askLevel = function (i, L) {
    var slot = this.st.party[i], self = this, R8 = DS.R, sp = PK.specOf(this.st, slot), h = null, rec = null;
    if (!sp || !R8.picksDue) return;
    if (sp.hero) { // (an 8-bit hero or guest, made by R.makeHero: the level's asks as the 8-bit's level-up leaves them)
      var d = DS.DATA.heroes[sp.hero]; if (!d || L <= d.level) return; // (at or below its start a hero is drawn as it starts: nothing a level gave)
      h = R8.makeHero(sp.hero, L - 1); if (slot.picks) R8.repick(h, slot.picks);
      h.picks = null; R8.pendSync(h); h.xp = R8.XP_LEVEL[L]; var msgs = R8.levelUp(h);
      rec = (h.picks || []).filter(function (r) { return r.lvl === L; })[0];
      if (rec) rec.lines = msgs.filter(function (x) { return (msgs.asked || []).indexOf(x) < 0; }); // (its level lines over its page, 10-17)
    } else { // (one of the class floor's named, made by NPC.sheet: the whole level as the maker's walk asks it -- 10-17, his "full edit of torvald and aurdin
      // and such"; the spells it lets go ride the card's word as `drop`, js/classes.js pickedOver)
      var a = null; try { a = NPC.levelAsks(Object.assign({}, sp, { lvl: L }), L, slot.custom != null ? { known: sp.known || undefined, classDefaults: true } : undefined); } catch (e) { a = null; } // (a made one: its own list, the class's new ones marked -- 10-17)
      if (a && a.asks.length) { h = a.h; rec = { lvl: L, asks: a.asks, lines: a.lines }; }
    }
    if (!rec) return;
    h.picks = [rec]; R8.pendSync(h);
    var kinds = rec.asks.map(R8.askKey), tooks = rec.asks.map(function (a) { return { k: a.kind, took: a.took }; }); // (before the page takes them)
    this.pm = DS.MENU.openPicks({ party: function () { return [h]; }, close: function () { } }, [h], { built: D.climb.built }, function () {
      self.pm = null;
      var ch = (h.chose && h.chose[L]) || {}, keep = {};
      kinds.forEach(function (k) { if (ch[k] != null) keep[k] = ch[k]; });
      if (slot.custom != null) { var mr = self.st.roster[slot.custom]; if (mr) PK.levelMade(mr, L, keep); self.cache = {}; self.keep(); return; } // (a made one's word takes the level, 10-17)
      if (!sp.hero) tooks.forEach(function (t) { if ((t.k === 'spells' || t.k === 'cantrip') && ch[t.k]) { var dr = (t.took || []).filter(function (id) { return ch[t.k].indexOf(id) < 0; }); if (dr.length) keep.drop = (keep.drop || []).concat(dr); } });
      slot.picks = slot.picks || {}; slot.picks[L] = keep;
      self.cache = {}; self.keep();
    });
  };

  // ------------------------------------------------------------------ drawing
  Pocket.prototype.draw = function (ctx) {
    this.btns = []; this.lists = [];
    if (this.screen === 'hub' && D.campfire) this.drawFire(ctx); // (THE CAMP at the ladder camp's fire, 10-17: his "camp background based on the old combat ladder camp image")
    else drawHall(ctx, this.t, this.screen === 'title' ? 1 : 0.42, this.st.dm);
    var s = this.screen;
    if (s === 'title') this.drawTitle(ctx);
    else if (s === 'modules') this.drawModules(ctx);
    else if (s === 'hub') this.drawHub(ctx);
    else if (s === 'morning') this.drawMorning(ctx);
    else if (s === 'party') this.drawParty(ctx);
    else if (s === 'maker') this.drawMaker(ctx);
    else if (s === 'map') this.drawMap(ctx);
    else if (s === 'cr') this.drawCR(ctx);
    else if (s === 'result') this.drawResult(ctx);
    else if (s === 'rest') this.drawRest(ctx);
    else if (s === 'draft') this.drawDraft(ctx); // (SECOND DRAFT, from the rest card: 10-31)
    else if (s === 'fights') this.drawFights(ctx);
    else if (s === 'notes') this.drawNotes(ctx);
    else if (s === 'market') this.drawMarket(ctx);
    else this.drawMore(ctx, s);
    if (this.msg && this.msg.t > 0) { var mw = D.textWidth(this.msg.text) + 16; D.win8(ctx, (D.W - mw) / 2, D.H - 30, mw, 16); D.text(ctx, this.msg.text, D.W / 2, D.H - 26, this.msg.bad ? P('red', 4) : P('gold', 4), 'center'); }
    if (this.egg) this.drawEgg(ctx);
    if (this.pm) { ctx.fillStyle = 'rgba(4,3,10,.6)'; ctx.fillRect(0, 0, D.W, D.H); D.ui.drawMenu(ctx, this.pm); } // (a card's level picks, over the table)
    this.placeField();
  };
  function head(ctx, title, sub) {
    ctx.save(); ctx.translate(D.W / 2, 6); ctx.scale(2, 2); D.text(ctx, title, 0, 0, P('gold', 4), 'center'); ctx.restore();
    if (sub) D.text(ctx, sub, D.W / 2, 24, P('silver', 5), 'center');
  }
  Pocket.prototype.drawTitle = function (ctx) {
    var self = this;
    if (this.st.dm) D.text(ctx, '{y}THE DM\'S{/}', D.W / 2, 12, P('gold', 4), 'center'); // (the DM's table: js/pocketdm.js)
    ctx.save(); ctx.translate(D.W / 2, 22); ctx.scale(3, 3); D.text(ctx, 'POCKET DM', 0, 0, P('gold', 4), 'center'); ctx.restore();
    D.text(ctx, this.st.dm ? '{y}behind the screen{/}' : '{o}alpha{/}', D.W / 2 + 92, 20, P('fire', 1));
    D.text(ctx, this.st.dm ? 'every creature, every door, a campaign of your own' : 'any party, any map, any CR -- every fight a URL', D.W / 2, 50, P('bone', 1), 'center');
    // (the buttons stand to the right, so the stone and the light on it stay in view; the column starts under the right lamp, whose head is one of the DM's three)
    var w = 150, x = D.W - w - 22, y = 104, n = this.st.fights.length; // (y 150 till 10-06, 132 till 10-09, 120 till 10-17: up for the campaign's two rows, then A DM'S LADDER)
    this.btn(ctx, this.st.run ? (this.st.run.module ? 'MODULE: FIGHT ' + this.st.run.rung + ' OF ' + this.st.run.plan.length : 'THE LADDER: ' + (this.st.run.trial ? 'THE TRIAL' : 'RUNG ' + this.st.run.rung)) : 'START', x, y, w, 18, function () { if (self.st.run && self.st.run.atCamp) self.go('hub'); else if (self.st.run) { self.foes = self.st.run.foes; self.fightMap = self.st.run.map; self.go('cr'); } else self.go('party'); }, { pri: true });
    this.btn(ctx, 'FIGHTS' + (n ? '  (' + n + ')' : ''), x, y + 22, w, 16, function () { self.go('fights'); }, { dis: !n, why: 'no fights kept yet: START one' });
    this.btn(ctx, 'DOORS', x, y + 41, w, 16, function () { self.scroll = 0; self.go('doors'); }); // (one DOORS on both tables, js/pocketdm.js PD.doorsFor -- USEFULS till 10-17, Griz: "Usefuls is a less functional version of DOORS")
    this.btn(ctx, 'THE 8-BIT GAME', x, y + 60, w, 16, function () { location.href = '../'; });
    // the whole campaign to a file and back, here where a ladder under way can reach it (10-06: PK.tableFile; SAVE TABLE till 10-09)
    this.btn(ctx, 'SAVE CAMPAIGN', x, y + 79, w, 15, function () { self.saveTable(); });
    this.btn(ctx, 'LOAD CAMPAIGN', x, y + 96, w, 15, function () { self.loadTable(); });
    // (MODULES -- A DM'S LADDER till 10-17 -- is THE CAMP's LOAD MODULE since 10-17, his "Remove 'Play DM Ladder' from the Front page")
    this.drawTitleDM(ctx);
    D.text(ctx, 'Solskaft: the oath-stone of the Silversands, under the Sunshaft. At noon the light lands here.', D.W / 2, 243, P('stone', 5), 'center');
    D.hint(ctx, 'up/down choose · E go · M options · X the 8-bit game · the Discord: ' + PK.DISCORD.replace('https://', ''), D.W / 2, 256, P('stone', 4), 'center');
  };
  // (USEFULS, the release's eight doors, is DOORS since 10-17: js/pocketdm.js PD.PUBLIC, the same rows in DOORS' list)
  // the party: the slots across, arrows above and below (his words), the level beneath
  Pocket.prototype.drawParty = function (ctx) {
    var self = this, st = this.st, sh = this.sheets(), n = st.party.length;
    head(ctx, 'THE PARTY', n + ' of 6 · arrows cycle the roster · the ? makes a new one · level cap ' + PK.cap(st) + (PK.kingOpen(st) ? ' · Pyro at his 12' : ''));
    var cw = 70, gap = 6, x0 = Math.round((D.W - (n * cw + (n - 1) * gap)) / 2), top = 40;
    sh.forEach(function (s, i) {
      var x = x0 + i * (cw + gap), slot = s.slot, isNew = slot.w === 'new', e = isNew ? null : PK.STOCK.filter(function (q) { return q.w === slot.w; })[0];
      var locked = !!(e && e.king && !PK.kingOpen(st)), custom = slot.custom != null;
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
          if (custom) { self.btn(ctx, 'EDIT', x + 5, top + 113, 30, 12, function () { self.makeNew(i, st.roster[slot.custom]); }, { small: true }); self.btn(ctx, 'DROP', x + 37, top + 113, 28, 12, function () { self.dropMade(slot.custom); }, { small: true }); } // (DROP: off the roster for good, asked first -- 10-21)
          else if (e && e.king) D.text(ctx, 'the king\'s own gear', x + cw / 2, top + 115, P('stone', 4), 'center');
          else { self.btn(ctx, '<', x + 8, top + 113, 14, 12, function () { self.levelSlot(i, -1); }, { small: true }); D.text(ctx, 'L' + s.h.lvl, x + cw / 2, top + 115, P('gold', 4), 'center'); self.btn(ctx, '>', x + cw - 22, top + 113, 14, 12, function () { self.levelSlot(i, 1); }, { small: true }); }
        }
      } else { D.text(ctx, '(no sheet)', x + cw / 2, top + 60, P('red', 4), 'center'); }
      self.btn(ctx, 'v', x + cw / 2 - 12, top + 134, 24, 11, function () { self.cycle(i, 1); }, { small: true });
      if (!isNew && s.h && !locked && !(e && e.king)) { // (10-17: below the down arrow, his word)
        self.btn(ctx, 'GEAR', x + 4, top + 147, 33, 11, function () { self.openGear(i); }, { small: true });
        self.btn(ctx, 'PDF', x + 39, top + 147, cw - 43, 11, function () { self.cardPdf(i); }, { small: true }).tip = 'PDF: saves ' + s.h.name + '\'s character sheet, to print or keep'; // (10-26: the card's sheet as a file, js/sheetpdf.js; the hint line says it when chosen)
      }
    });
    var ready = this.ready();
    this.btn(ctx, '- a seat', 20, 200, 70, 14, function () { if (st.party.length > 1) { st.party.pop(); self.cache = {}; self.keep(); } }, { dis: n <= 1 });
    this.btn(ctx, '+ a seat', 96, 200, 70, 14, function () { if (st.party.length < 6) { st.party.push({ w: 'new' }); self.cache = {}; self.keep(); } }, { dis: n >= 6 });
    // the cards' level arrows (10-17, Griz: "For the named characters let's add an edit toggle on the level select screen, where they get full edit of torvald
    // and aurdin and such, or it always takes defaults (unlike Aurdin now)"): EDIT, each level up opens its pick page (Pocket.askLevel); DEFAULTS, none does
    this.btn(ctx, st.editLevels ? 'LEVEL-UPS: EDIT' : 'LEVEL-UPS: DEFAULTS', 172, 200, 132, 14, function () { st.editLevels = !st.editLevels; self.keep(); D.sfx('cursor'); }, { on: !!st.editLevels, why: 'EDIT: a card\'s level up asks its choices; DEFAULTS: it takes its own' });
    this.btn(ctx, 'THE MARKET  ' + (st.purse == null ? 100 : st.purse) + ' sp', 312, 200, 148, 14, function () { self.openMarket('party'); }); // (10-17)
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE THE PARTY', 88, 236, 114, 15, function () { self.saveParty(); }); // (the party's file, 10-17 -- his "Player saves are current party and pack"; SAVE CAMPAIGN till then, the campaign's file now the roster and the DM's, on the title)
    this.btn(ctx, 'LOAD A PARTY', 208, 236, 114, 15, function () { self.loadParty(); });
    this.btn(ctx, 'NEXT: THE CAMP', D.W - 150, 236, 130, 15, function () { self.keep(); self.go('hub'); }, { pri: true, dis: !ready, why: 'every seat wants someone in it: arrows cycle the roster, the ? makes one' }); // (THE CAMP at both tables, 10-17: TO THE CAMPAIGN and NEXT: THE MAP till then)
    if (!ready) D.text(ctx, 'every seat wants a character (a locked one cannot come)', D.W / 2, 222, P('fire', 1), 'center');
    else { var kb = this.btns[this.ksel]; if (kb && kb.tip) D.hint(ctx, kb.tip, D.W / 2, 222, P('bone', 1), 'center'); else D.hint(ctx, 'E on a card\'s arrows cycles · X back', D.W / 2, 222, P('stone', 4), 'center'); } // (a chosen button with a tip says what it does: a card's PDF, 10-26)
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
      classes.forEach(function (ck, i) { var col = i < 6 ? 0 : 1, row = i % 6; self.btn(ctx, R.CLASSES[ck].name, 250 + col * 110, y + 12 + row * 15, 100, 13, function () { if (m.cls !== ck) { m.cls = ck; self.kitUp(); m.walked = 0; m.got = null; } }, { on: m.cls === ck, small: true }); });
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
      // (10-17: the arrows set the level and NEXT walks it, a pick page a level -- Pocket.walkLevels; what is below changes one level's after)
      D.text(ctx, 'the level, 1 to ' + PK.cap(this.st) + ': NEXT walks each level\'s choices, the class\'s own marked', D.W / 2, y, P('silver', 5), 'center');
      if ((m.walked || 0) < m.lvl) D.text(ctx, '{y}NEXT walks level' + ((m.walked || 0) + 1 < m.lvl ? 's ' + ((m.walked || 0) + 1) + ' to ' + m.lvl : ' ' + m.lvl) + '{/}', 330, y + 24, P('bone', 1));
      this.btn(ctx, '<', 190, y + 20, 20, 16, function () { if (m.lvl > 1) { m.lvl--; self.levelBack(); } else D.sfx('error'); });
      ctx.save(); ctx.translate(240, y + 18); ctx.scale(2, 2); D.text(ctx, String(m.lvl), 0, 0, P('gold', 4), 'center'); ctx.restore();
      this.btn(ctx, '>', 270, y + 20, 20, 16, function () { if (m.lvl < PK.cap(self.st)) m.lvl++; else D.sfx('error'); });
      if (h) {
        var lines = ['HP ' + h.maxhp + ' (a max hit die a level)  ·  AC ' + R.ac(h) + '  ·  proficiency +' + R.prof(h.lvl), 'scores: ' + NPC.ABIL.map(function (k) { return k.toUpperCase() + ' ' + h.abil[k]; }).join('  ')];
        if (h.subclass) lines.push(h.subclass);
        if (h.slotsMax && h.slotsMax.length) lines.push('slots ' + h.slotsMax.map(function (n, i) { return (i + 1) + ':' + n; }).join(' '));
        lines.forEach(function (l, i) { D.text(ctx, l, D.W / 2, y + 48 + i * 11, P('bone', 1), 'center'); });
      }
      // the subclass with the level (10-14, the level-up pick §5; Griz: "better build it for the pocket DM as well, there are actual choices to work with"): the
      // SRD's and ours from the class's level (js/rules.js R.SUBCLASSES), the one picked lit and its line under; a class with the SRD's one alone shows it above.
      // A caster's spells start again from the class's own on a change (a domain's, a patron's own list)
      // the ability increases the level gives (10-14, the level-up pick: "Pocket has leveling choices"): each level's as taken -- the class's first until one is
      // picked -- a button that opens the one pick page for it (js/menu.js), +2 to one or +1 to two
      var ats = h && h.asiAt ? Object.keys(h.asiAt).map(Number).sort(function (a, b) { return a - b; }) : [];
      if (ats.length) {
        var xA = 30 + D.text(ctx, '{y}ABILITY INCREASES{/}', 30, y + 96, P('bone', 1)) + 8;
        ats.forEach(function (at) {
          var g = h.asiAt[at], lab = 'L' + at + ' ' + (Object.keys(g).map(function (k) { return k === 'feat' ? ((window.DS.R.FEATS || {})[g.feat] || { name: 'a feat' }).name.toUpperCase() : k.toUpperCase() + '+' + g[k]; }).join(' ') || '--'), bw2 = D.textWidth(lab) + 12;
          self.btn(ctx, lab, xA, y + 93, bw2, 13, function () { self.askMakerAsi(at); }, { small: true, on: !!(m.picks && m.picks[at]) });
          xA += bw2 + 6;
        });
      }
      var scl = R.SUBCLASSES[m.cls];
      if (scl) {
        var yS = y + 112;
        D.text(ctx, '{y}' + scl.word + '{/}' + (m.lvl >= scl.at ? '' : '  {g}(chosen at ' + R.CLASSES[m.cls].name.toLowerCase() + ' ' + scl.at + '){/}'), 30, yS, P('bone', 1));
        if (m.lvl >= scl.at) {
          var curS = (h && h.subclass) || scl.opts[0].name, bw = Math.floor((D.W - 60) / scl.opts.length) - 6;
          scl.opts.forEach(function (o, i) {
            self.btn(ctx, o.name + (o.srd ? '' : ' *'), 30 + i * (bw + 6), yS + 12, bw, 13, function () {
              if (curS === o.name) return;
              m.sub = o.srd ? null : o.name;
              if (R.CLASSES[m.cls].caster) m.known = null;
            }, { on: curS === o.name, small: true });
          });
          var oc = R.subOpt(m.cls, curS), yD = yS + 32;
          if (oc) D.wrap(oc.desc, D.W - 60).slice(0, 3).forEach(function (w) { D.text(ctx, w, 30, yD, P('bone', 2)); yD += 10; });
          D.text(ctx, '* ours, not the SRD\'s', 30, yS + 64, P('stone', 5));
        }
      }
    } else if (step === 4) {
      // the fighting style beside the gear, from the class's level (SRD 5.1: the fighter at 1, the paladin and the ranger at 2; 10-06, Griz:
      // "Pocket DM is meant exactly for that type of character building")
      var stl = R.STYLE_AT[m.cls] && m.lvl >= R.STYLE_AT[m.cls] ? R.STYLE_FOR[m.cls] : null, per = 11, list = [], from = 0;
      if (m.tab === 'style' && !stl) m.tab = 'weapon';
      // the class's options beside the style, each from its level (10-14, the level-up pick: "Pocket has leveling choices" -- js/classes.js NPC.OPTIONS): the
      // sorcerer's metamagic, the warlock's invocations and pact, the druid's land; the one the sheet stands with lit (the class's own until one is picked)
      var opts = (NPC.OPTIONS[m.cls] || []).filter(function (o) { return m.lvl >= o.at && (!o.sub || o.sub === (m.sub || ((NPC.CLASSES[m.cls] || {}).sub || [])[1])); } /* (an archetype's own: none picked yet is the class's own, the SRD's -- 10-30) */), od = opts.filter(function (o) { return o.key === m.tab; })[0];
      if (!od && ['weapon', 'armor', 'shield', 'alt', 'style'].indexOf(m.tab) < 0) m.tab = 'weapon';
      var tabs = [['weapon', 'WEAPON'], ['armor', 'ARMOUR'], ['shield', 'SHIELD'], ['alt', 'SECOND WEAPON']].concat(stl ? [['style', 'STYLE']] : []).concat(opts.map(function (o) { return [o.key, o.word]; })), tw = tabs.length > 4 ? Math.floor(450 / tabs.length) : 110;
      tabs.forEach(function (tb, i) { self.btn(ctx, tb[1], 20 + i * tw, y, tw - 6, 13, function () { m.tab = tb[0]; self.scroll = 0; }, { on: m.tab === tb[0], small: true }); });
      if (od) {
        var have = (m.opt && m.opt[od.key] != null) ? m.opt[od.key] : h ? h[od.key] : null, n = od.count ? od.count(m.lvl) : 1;
        if (od.count) have = (have || []).slice(0, n);
        od.opts.forEach(function (o, i) {
          var yy = y + 18 + i * 15, on = od.count ? have.indexOf(o.id) >= 0 : have === o.id;
          self.btn(ctx, o.name, 20, yy, 140, 13, function () {
            m.opt = m.opt || {};
            if (!od.count) { m.opt[od.key] = o.id; return; }
            var cur = have.slice();
            if (on) cur = cur.filter(function (x) { return x !== o.id; });
            else if (cur.length >= n) { D.sfx('error'); self.say('that is the count for level ' + m.lvl + ': take one off first'); return; }
            else cur.push(o.id);
            m.opt[od.key] = cur;
          }, { on: on, small: true });
          D.text(ctx, o.desc, 166, yy + 3, P('bone', 1));
        });
        D.text(ctx, (od.count ? have.length + ' of ' + n + ' at level ' + m.lvl : 'one') + '  ·  from ' + R.CLASSES[m.cls].name.toLowerCase() + ' ' + od.at + ' (SRD 5.1, the built ones)', 20, y + 18 + od.opts.length * 15 + 6, P('stone', 5));
      } else if (m.tab === 'style') {
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
        var b0 = this.btns.length;
        list.slice(from, from + per).forEach(function (id, i) {
          var it = id ? DS.DATA.items[id] : null, yy = y + 18 + i * 15, label = it ? it.name : 'none';
          self.btn(ctx, label, 20, yy, 130, 13, function () { if (m.tab === 'alt') m.alt = id; else m.equip[m.tab] = id; if (m.tab === 'weapon' && id && (DS.DATA.items[id].weapon.props || []).indexOf('two-handed') >= 0) m.equip.shield = null; }, { on: cur === id, small: true });
          if (it) D.text(ctx, (it.desc || '').slice(0, 54), 156, yy + 3, P('bone', 1));
        });
        this.listRows(b0, y + 18, 15, list.length, per, from); // (the arrows scroll it, 10-27)
      }
      var hs = h && R.style(h), sumLine = h ? 'AC ' + R.ac(h) + '  ·  ' + (R.weaponOf(h) || {}).name + (m.alt ? '  ·  second: ' + (DS.DATA.items[m.alt] || {}).name : '') + (hs ? '  ·  ' + R.STYLES[hs].name.toLowerCase() : '') : '';
      var sx2 = this.pager(ctx, 20, y + 18 + per * 15 - 2, list.length, per, from, 'scroll', false); // (^ v left of the line, the count after it: 10-27)
      var sw2 = D.text(ctx, sumLine, sx2, y + 18 + per * 15 + 1, P('gold', 4));
      if (list.length > per) D.text(ctx, '  {g}(' + (from + 1) + '-' + Math.min(list.length, from + per) + ' of ' + list.length + '){/}', sx2 + sw2, y + 18 + per * 15 + 1, P('stone', 5));
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
        var b0s = this.btns.length;
        pool.slice(from2, from2 + per2).forEach(function (id, i) {
          var sd = D.magic.data(id), col = i % cols, row = Math.floor(i / cols), yy = y + 18 + row * 15, on = m.known.indexOf(id) >= 0;
          self.btn(ctx, (sd.level ? 'L' + sd.level + ' ' : '') + sd.name, 20 + col * 225, yy, 218, 13, function () {
            if (on) m.known = m.known.filter(function (x) { return x !== id; });
            else if (have.length >= cap) { D.sfx('error'); self.say('that is the count for level ' + m.lvl + ': take one off first'); }
            else m.known.push(id);
          }, { on: on, small: true });
        });
        this.listRows(b0s, y + 18, 15, Math.ceil(pool.length / cols), per2 / cols, Math.ceil(from2 / cols)); // (by rows of two, as the scroll counts here; an odd count's last page starts mid-row, read as the end)
        if (pool.length > per2) { // (^ v by rows of two, the wheel as before: 10-27)
          var yP = y + 18 + 11 * 15 - 2;
          this.btn(ctx, '^', 20, yP, 16, 12, function () { self.scroll = Math.max(0, self.scroll - per2 / cols); }, { small: true, dis: from2 <= 0, nokey: true });
          this.btn(ctx, 'v', 38, yP, 16, 12, function () { self.scroll += per2 / cols; }, { small: true, dis: from2 + per2 >= pool.length, nokey: true });
          D.text(ctx, (from2 + 1) + '-' + Math.min(pool.length, from2 + per2) + ' of ' + pool.length, 60, yP + 3, P('stone', 5));
        }
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
    if (step < 6) this.btn(ctx, 'NEXT >', D.W - 100, 236, 80, 15, function () {
      if (step === 3) { self.walkLevels(function () { m.step = 4; self.scroll = 0; }); return; } // (the level's choices first, 10-17)
      m.step = step === 4 && !caster ? 6 : step + 1; self.scroll = 0; self.dropField();
    }, { pri: true });
    else {
      this.btn(ctx, 'SHEET PDF', D.W - 194, 236, 86, 15, function () { var sp = self.mkSpec(), hS = null; try { hS = NPC.sheet(PK.bareSpec(sp)); } catch (eS) { hS = null; } self.sheetPdf(hS, NPC.code(sp), null); }); // (10-26: the sheet before it is saved, js/sheetpdf.js)
      this.btn(ctx, 'SAVE', D.W - 100, 236, 80, 15, function () { self.saveMade(); }, { pri: true });
    }
  };
  // the maps, the dark ones said so and shown so
  Pocket.prototype.drawMap = function (ctx) {
    var self = this, ids = this.mapIds(), list = [null].concat(ids), per = list.length > 12 ? 11 : 12; // (a row less when ^ v stand under it, 10-27)
    head(ctx, 'THE MAP', 'a dark map is lit only by its lamps and what the party brings; the ? draws one');
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    var b0 = this.btns.length;
    list.slice(from, from + per).forEach(function (id, i) {
      var def = id ? D.MAPS[id] : null, yy = 36 + i * 16, label = def ? def.name : '?  a random map';
      self.btn(ctx, label.length > 24 ? label.slice(0, 24) : label, 14, yy, 150, 14, function () { self.mapSel = id; self.keep(); }, { on: self.mapSel === id || (!id && !self.mapSel), small: true });
      if (def && def.dark) D.text(ctx, '{p}DARK{/}', 168, yy + 3, P('violet', 5));
    });
    this.listRows(b0, 36, 16, list.length, per, from); // (the arrows scroll it, 10-27)
    this.pager(ctx, 14, 36 + per * 16, list.length, per, from);
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
    var fk = (this.foes || []).join(); if (this.foesAsked !== fk) { this.foesAsked = fk; D.spr.prefetch((this.foes || []).map(function (k) { if (D.FOES[k]) return D.FOES[k].sheet; var vf = PK.foe(k); if (!vf) return null; var vs = null; try { vs = NPC.spec(k); } catch (e) { vs = null; } return PK.lookOf(vs); }).filter(Boolean)); } // (a villain's word: its class's figure, 10-17) // (the table's foes fetched behind while it is set: js/sprites.js, 10-03)
    var title = run ? this.rungName(run) : 'THE FOES', mSlot = this.slotOf(run);
    head(ctx, title, mSlot ? fitText(run.module.name + (mSlot.name ? ': ' + mSlot.name : '') + (mSlot.intro ? ' -- ' + mSlot.intro : ''), D.W - 20) : run ? (run.trial ? (run.plan ? 'the last slot of your ladder, after a long rest' : 'double deadly: win it and Pyro joins the roster') : run.plan ? 'your ladder\'s rung: your units first, the rest rolled' : 'the table set for you; a short rest between rungs') : 'the CR is the sum of theirs; the reading is the DMG\'s for this party');
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
    // (mid-ladder, after a lost rung only -- RETRY or REROLL THE RUNG on the loss card sets it, the fight begun clears it: it rerolls the rung the run's way, rerollRung -- a
    // planned rung's random part, the trial its own; the Pocket DM lane §2.2, the flag that was never set, wired on its lean 10-14)
    if (!run || (this.lossMenu && !mSlot)) this.btn(ctx, 'REROLL', 60, wy, 80, 15, function () { if (run) self.rerollRung(); else self.reroll(); }); // (a module's foes are the DM's: never rerolled)
    this.btn(ctx, 'WATCH: ' + (this.watch ? 'ON' : 'OFF'), 150, wy, 100, 15, function () { self.watch = !self.watch; self.keep(); }, { on: this.watch, small: true });
    D.text(ctx, this.watch ? 'the class AI runs your side too; you watch' : 'you run your side', 258, wy + 4, P('stone', 5));
    this.drawKnobs(ctx); // (the DM's: fly, legendary, breath, dark -- js/pocketdm.js)
    // the URL
    var q = PK.query(kinds, this.words(), this.topLevel(), mapId === '?' ? null : mapId, this.watch, this.knobs()), url = PK.url(q);
    D.text(ctx, 'the URL (E on it copies):', 60, 156, P('stone', 5));
    this.btn(ctx, url.length > 68 ? url.slice(0, 66) + '..' : url, 60, 166, D.W - 120, 14, function () { self.copy(url, 'the URL'); }, { small: true });
    // the ways in
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    if (run) {
      this.btn(ctx, run.trial ? 'FIGHT THE TRIAL' : mSlot ? 'FIGHT ' + run.rung + ' OF ' + run.plan.length : 'FIGHT RUNG ' + run.rung, D.W - 170, 236, 150, 15, function () { self.launch(); }, { pri: true, dis: !kinds.length });
      this.btn(ctx, mSlot ? 'QUIT THE MODULE' : 'QUIT THE LADDER', 90, 236, 120, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
      var pLine = (run.carry || []).map(function (c, i) { var s = self.sheets()[i]; return c && s && s.h ? s.h.name + ' ' + c.hp + '/' + c.maxhp : null; }).filter(Boolean).join('  ·  ');
      if (pLine) D.text(ctx, pLine, D.W / 2, 200, P('bone', 1), 'center');
      var nR = this.lastRung(run); D.text(ctx, 'won ' + (run.won || 0) + ' of ' + (run.trial ? nR + ', and now the trial' : nR), D.W / 2, 212, P('silver', 5), 'center');
    } else {
      this.btn(ctx, 'FIGHT', D.W - 90, 236, 70, 15, function () { self.toMorning({ label: 'FIGHT', fn: function () { self.takeMorning(); self.launch(); } }, 'cr'); }, { pri: true, dis: !kinds.length }); // (by THE LONG REST, 10-17: his "For single fight, map and CR setting, then long rest spell selection")
      D.text(ctx, 'FIGHT: the long rest first (the day\'s spells, what is cast ahead); a ladder or a module starts from THE CAMP', D.W / 2, 212, P('stone', 5), 'center');
    }
  };
  Pocket.prototype.drawResult = function (ctx) {
    var self = this, r = this.result; if (!r) { this.go('title'); return; }
    var run = this.st.run, won = r.res === 'won', w = 400, x = (D.W - w) / 2, y = 40, h = 190;
    D.win8(ctx, x, y, w, h);
    var headT = r.unlocked ? '{y}THE TRIAL IS PASSED.{/}' : won ? '{y}WON{/}' : r.res === 'lost' ? '{r}LOST{/}' : r.res === 'escaped' ? '{o}OUT THE WAY THEY CAME IN{/}' : '{g}LEFT THE TABLE{/}';
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, headT, 0, 0, P('gold', 4), 'center'); ctx.restore();
    // NOTES after every fight, in one place (RULED 10-13, the Pocket DM lane 2e, Griz: "same as clicking that fight in fights list notes - yes"): this fight's own notes,
    // the page THE FIGHTS opens; its BACK comes back to this card, so a ladder or a module goes on from here
    this.btn(ctx, 'NOTES' + (r.rec.notes ? ' *' : ''), x + w - 66, y + 6, 58, 13, function () { self.note = Math.max(0, self.st.fights.indexOf(r.rec)); self.go('notes'); self.noteFrom = 'result'; }, { small: true });
    D.text(ctx, r.rec.foes + '  ·  CR ' + r.rec.cr + ', ' + r.rec.diff.toLowerCase() + '  ·  ' + r.rec.rounds + ' round' + (r.rec.rounds === 1 ? '' : 's') + (r.rec.downs ? '  ·  ' + r.rec.downs + ' down' : ''), D.W / 2, y + 30, P('bone', 1), 'center');
    var yy = y + 44;
    r.end.forEach(function (e) { D.text(ctx, (e.down ? '{r}' : '{y}') + e.name + '{/}  ' + e.hp + '/' + e.maxhp + (e.down ? '  down' : ''), D.W / 2, yy, P('bone', 1), 'center'); yy += 10; });
    if (r.coin || r.xp || r.noXP) { yy += 4; D.text(ctx, '{y}' + [r.coin ? '+' + r.coin + ' sp to the purse (' + this.st.purse + ' sp)' : '', r.xp ? '+' + r.xp + ' XP each' : '', r.noXP ? 'no XP: WATCH was on' : ''].filter(Boolean).join('  ·  ') + '{/}', D.W / 2, yy, P('gold', 4), 'center'); yy += 6; } // (10-17: the coin, and the XP -- none for a fight WATCH ran, Pocket.xpOn)
    if (r.levels && r.levels.length) { yy += 4; D.wrap('{y}' + r.levels.join(' ') + '{/}' + (this.st.editLevels ? ' The choices next (LEVEL-UPS: EDIT).' : ''), w - 30).slice(0, 2).forEach(function (t) { D.text(ctx, t, D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }); }
    if (r.loot) { // (into the pack; PUT IT ON is the player's word -- 10-17, his "rewards should go into pack and not-auto equip unless player confirms equip")
      var lg = r.loot, lit = DS.DATA.items[lg.item], lst = this.st;
      yy += 4; D.text(ctx, '{y}' + lg.name + ' finds ' + (/^[aeiou]/i.test(lit.name) ? 'an ' : 'a ') + lit.name + (lg.worn ? '{/}, and puts it on.' : '{/}: in the pack.'), D.W / 2, yy, P('gold', 4), 'center'); yy += 10;
      if (lg.who >= 0 && !lg.worn && PK.packN(lst, lg.item) > 0) { this.btn(ctx, fitText('PUT IT ON ' + String(lg.name).toUpperCase(), 150), D.W / 2 - 80, yy, 160, 12, function () { PK.packAdd(lst, lg.item, -1); PK.give(lst, lst.party, lg.who, lg.item); lg.worn = true; self.cache = {}; self.keep(); }, { small: true }); yy += 14; }
    }
    if (r.unlocked) { yy += 4; D.text(ctx, '{y}Pyronimus, King of Solskaft, will walk with you.{/} He is on the roster now, at his 12, with his own gear.', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }
    (r.lines || []).forEach(function (l) { yy += 2; D.text(ctx, l, D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }); // (what the DM's purse took in: js/pocketdm.js afterFight)
    if (r.moduleDone) { yy += 4; D.text(ctx, '{y}' + r.moduleDone + ' IS DONE.{/} Every fight of it won.', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }
    var by = y + h - 22, slot = this.slotOf(run);
    if (r.moduleDone) {
      this.btn(ctx, 'THE CAMP', x + 20, by, 120, 15, function () { self.go('hub'); }, { pri: true });
      this.btn(ctx, 'THE MODULES', x + w - 110, by, 90, 15, function () { self.go('modules'); });
    } else if (slot && won) {
      // a module's fight won: what its slot allows next (10-17, his "DM flag ... if he allows short rest, long rest, market visit between runs")
      var rs = slot.rest || {}, nx = run.plan[run.rung], nName = 'FIGHT ' + (run.rung + 1) + (nx && nx.name ? ': ' + nx.name : '');
      this.btn(ctx, rs.long ? 'A LONG REST' : rs.short ? 'A SHORT REST' : 'ON TO FIGHT ' + (run.rung + 1), x + 20, by, 160, 15, function () { self.moduleRest(); self.go('rest'); }, { pri: true });
      this.btn(ctx, 'QUIT THE MODULE', x + w - 140, by, 120, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
      D.text(ctx, 'next: ' + (nName.length > 60 ? nName.slice(0, 58) + '..' : nName), D.W / 2, by - 12, P('stone', 5), 'center');
    } else if (slot) {
      this.btn(ctx, 'RETRY', x + 20, by, 90, 15, function () { self.restore(); self.go('cr'); }, { pri: true }); // (a module's foes are the DM's: no reroll)
      this.btn(ctx, 'QUIT THE MODULE', x + w - 140, by, 120, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
      D.text(ctx, 'retry: the party as it went in, the same fight', D.W / 2, by - 12, P('stone', 5), 'center');
    } else if (run && won && !run.trial && run.rung >= this.lastRung(run) && !this.hasTrial(run)) {
      // a ladder of the DM's making with no fifth slot ends at its last rung
      this.btn(ctx, 'THE LADDER IS CLIMBED', x + 20, by, 190, 15, function () { self.st.run = null; var lv = self.levelUps(); self.keep(); self.go('hub'); if (lv.length) self.say(lv.join(' '), 360); }, { pri: true });
    } else if (run && won) {
      if (!run.trial && run.rung < this.lastRung(run)) this.btn(ctx, 'SHORT REST FOR THE WICKED', x + 20, by, 190, 15, function () { self.restCard(); self.go('rest'); }, { pri: true });
      else this.btn(ctx, 'LONG REST FOR THE TRIAL', x + 20, by, 190, 15, function () { var lv = self.levelUps(); self.setTrial(); self.rest = { long: true, levels: lv }; self.go('rest'); }, { pri: true });
      this.btn(ctx, 'QUIT THE LADDER', x + w - 140, by, 120, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
    } else if (run) {
      this.btn(ctx, 'RETRY', x + 20, by, 90, 15, function () { self.restore(); self.lossMenu = true; self.go('cr'); }, { pri: true });
      this.btn(ctx, 'REROLL THE RUNG', x + 120, by, 130, 15, function () { self.rerollRung(); });
      this.btn(ctx, 'QUIT', x + w - 90, by, 70, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
      D.text(ctx, 'retry or reroll: the party as it went in', D.W / 2, by - 12, P('stone', 5), 'center');
    } else {
      this.btn(ctx, 'AGAIN', x + 20, by, 70, 15, function () { self.launch(); }, { pri: true });
      this.btn(ctx, 'NEW FOES', x + 100, by, 90, 15, function () { self.go('cr'); });
      this.btn(ctx, 'THE CAMP', x + w - 110, by, 90, 15, function () { self.go('hub'); });
    }
  };
  Pocket.prototype.drawRest = function (ctx) {
    if (this.rest && this.rest.module) { this.drawModuleRest(ctx); return; }
    var self = this, run = this.st.run, w = 420, x = (D.W - w) / 2, y = 40, long = this.rest && this.rest.long;
    D.win8(ctx, x, y, w, 190);
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, long ? '{y}LONG REST FOR THE TRIAL{/}' : '{y}SHORT REST FOR THE WICKED{/}', 0, 0, P('gold', 4), 'center'); ctx.restore();
    var yy = y + 30;
    if (long) {
      D.text(ctx, 'A night of it. Hit points, slots and hit dice back; every feature ready.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12;
      ((this.rest && this.rest.levels) || []).forEach(function (l) { D.text(ctx, '{y}' + l + '{/}', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }); // (the XP's levels, 10-17)
      D.text(ctx, 'Then the trial: ' + PK.foesText(run.foes) + ' on ' + ((D.MAPS[run.map] || {}).name || run.map) + '.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12;
      var dd = PK.diff(this.levels(), run.foes); D.text(ctx, '{r}' + dd.label + (dd.deadlyX > 1 ? ' x' + dd.deadlyX : '') + '{/}  adjusted XP ' + dd.adj + ' against deadly at ' + dd.thresh[3], D.W / 2, yy, P('red', 4), 'center');
    } else {
      D.text(ctx, 'An hour. The fallen are up first (the DM\'s hand), then hit dice till whole or out (SRD 5.1).', D.W / 2, yy, P('silver', 5), 'center'); yy += 12;
      (this.rest.lines || []).forEach(function (l) { D.wrap('{y}' + l.name + '{/} ' + l.hp + '/' + l.maxhp + ': ' + l.text + ' {g}(' + l.hd + ' hit dice left){/}', w - 30).forEach(function (t) { D.text(ctx, t, x + 15, yy, P('bone', 1)); yy += 10; }); });
      this.draftBtns(ctx, x + 15, Math.min(yy + 4, y + 190 - 40)); // (SECOND DRAFT, a seat with the feat a button: 10-31)
    }
    this.btn(ctx, long ? 'TO THE TRIAL' : 'THE NEXT RUNG', x + w / 2 - 70, y + 190 - 22, 140, 15, function () { if (long) { self.toMorning({ label: 'TO THE TRIAL', fn: function () { self.takeMorning(); self.go('cr'); } }, 'rest'); return; } self.nextRung(); self.go('cr'); }, { pri: true }); // (a long rest: THE LONG REST's page, 10-17)
    this.btn(ctx, 'THE MARKET', x + 8, y + 190 - 22, 76, 15, function () { self.openMarket('rest'); }); // (between rungs, 10-17)
    this.btn(ctx, 'THE CAMP', x + w - 84, y + 190 - 22, 76, 15, function () { self.toCamp({ long: long, trial: long, market: true }); }); // (to equip what the market sold, 10-17)
  };
  function fitText(s, w) { s = String(s); if (D.textWidth(s) <= w) return s; while (s.length > 1 && D.textWidth(s + '..') > w) s = s.slice(0, -1); return s + '..'; }
  PK.restText = function (rs) { rs = rs || {}; return (rs.long ? 'a long rest' : rs.short !== false ? 'a short rest' : 'no rest') + (rs.market ? ' and the market' : ''); };
  // a module's rest (10-17): the one its slot allows, then the next fight -- its name, its foes, how they read; the market only where the DM allows it
  Pocket.prototype.drawModuleRest = function (ctx) {
    var self = this, run = this.st.run, rs = this.rest, w = 420, x = (D.W - w) / 2, y = 40, h = 190;
    if (!run) { this.go('title'); return; }
    var nx = run.plan[run.rung]; // (the next slot: the rung is still the one just won)
    D.win8(ctx, x, y, w, h);
    ctx.save(); ctx.translate(D.W / 2, y + 8); ctx.scale(2, 2); D.text(ctx, '{y}' + (rs.long ? 'A LONG REST' : rs.none ? 'NO REST' : 'A SHORT REST') + '{/}', 0, 0, P('gold', 4), 'center'); ctx.restore();
    var yy = y + 30;
    if (rs.long) { D.text(ctx, 'A night of it. Hit points, slots and hit dice back; every feature ready.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12; (rs.levels || []).forEach(function (l) { D.text(ctx, '{y}' + l + '{/}', D.W / 2, yy, P('gold', 4), 'center'); yy += 10; }); }
    else if (rs.none) { D.text(ctx, 'The DM allows no rest here: straight on, as you are.', D.W / 2, yy, P('bone', 1), 'center'); yy += 12; }
    else {
      D.text(ctx, 'An hour. The fallen are up first (the DM\'s hand), then hit dice till whole or out (SRD 5.1).', D.W / 2, yy, P('silver', 5), 'center'); yy += 12;
      (rs.lines || []).forEach(function (l) { D.wrap('{y}' + l.name + '{/} ' + l.hp + '/' + l.maxhp + ': ' + l.text + ' {g}(' + l.hd + ' hit dice left){/}', w - 30).forEach(function (t) { D.text(ctx, t, x + 15, yy, P('bone', 1)); yy += 10; }); });
      if (rs.lines) { this.draftBtns(ctx, x + 15, yy + 2); yy += 16; } // (SECOND DRAFT: 10-31)
    }
    if (nx) {
      var dd = PK.diff(this.levels(), nx.foes); yy += 6;
      D.text(ctx, fitText('{y}NEXT, FIGHT ' + (run.rung + 1) + ' OF ' + run.plan.length + (nx.name ? ': ' + nx.name : '') + '{/}', w - 20), D.W / 2, yy, P('gold', 4), 'center'); yy += 11;
      D.text(ctx, fitText(PK.foesText(nx.foes) + ' on ' + ((D.MAPS[nx.map] || {}).name || nx.map) + '  {g}' + dd.label + '{/}', w - 20), D.W / 2, yy, P('bone', 1), 'center');
    }
    this.btn(ctx, 'FIGHT ' + (run.rung + 1), x + w / 2 - 60, y + h - 22, 120, 15, function () { if (rs.long) { var lbl = 'TO FIGHT ' + (run.rung + 1); self.toMorning({ label: lbl, fn: function () { self.nextRung(); self.takeMorning(); self.go('cr'); } }, 'rest'); return; } self.nextRung(); self.go('cr'); }, { pri: true }); // (a long rest: THE LONG REST's page, 10-17)
    if (rs.market) this.btn(ctx, 'THE MARKET', x + 8, y + h - 22, 76, 15, function () { self.openMarket('rest'); });
    this.btn(ctx, 'THE CAMP', x + w - 144, y + h - 22, 76, 15, function () { self.toCamp({ long: !!rs.long, market: !!rs.market }); }); // (to equip what the market sold, 10-17)
    this.btn(ctx, 'QUIT', x + w - 60, y + h - 22, 52, 15, function () { self.st.run = null; self.keep(); self.go('hub'); });
  };
  // THE CAMP (10-17, the two Pocket DMs, step B; Griz: "The FOES page on the player side becomes the camp, where they can open the standard 'm' menu / The pick from
  // there, single fight, random ladder or play module (load module to change greyed out play module when none loaded or to change loaded module)"; "Player saves
  // are current party and pack"): after THE PARTY, the party at the fire -- THE MENU (M: the regular menu over the four, PK's pack), THE MARKET, the party's own
  // file -- and where to: SINGLE FIGHT (THE MAP, THE FOES, then THE LONG REST), RANDOM LADDER and PLAY MODULE (THE LONG REST, then the first fight)
  // a rest's THE CAMP (10-17, Griz: "return to camp 'so i can equip after visit market' on long rests"): the run waits at the fire (run.atCamp: what the rest was, and
  // whether its market is open) -- THE MENU's EQUIP on what the market sold -- and GO ON is the rest's own way on: a long rest's day first (THE LONG REST), then the fight
  Pocket.prototype.toCamp = function (o) { var run = this.st.run; if (!run) return; run.atCamp = { long: !!o.long, trial: !!o.trial, market: !!o.market }; this.keep(); this.go('hub'); };
  Pocket.prototype.restOn = function () {
    var self = this, run = this.st.run, rest = run && run.atCamp; if (!run) return;
    if (!rest) { this.foes = run.foes; this.fightMap = run.map; this.go('cr'); return; }
    var on = function () { delete run.atCamp; if (!rest.trial) self.nextRung(); };
    if (rest.long) { this.toMorning({ label: rest.trial ? 'TO THE TRIAL' : 'TO ' + (run.module ? 'FIGHT ' : 'RUNG ') + (run.rung + 1), fn: function () { on(); self.takeMorning(); self.go('cr'); } }, 'hub'); return; }
    on(); this.keep(); this.go('cr');
  };
  // the night clearing of the ladder's camp (js/campfire.js, js/camp.js): the party's first four in the fire's four seats, in THE PARTY's order
  var SEATKEY = ['barley', 'aurdin', 'lymen', 'vivian'], FIRE_HUB = [232, 196];
  Pocket.prototype.drawFire = function (ctx) {
    var hs = this.sheets().filter(function (s) { return s.h && s.look; }).slice(0, 4).map(function (s, i) { return { id: SEATKEY[i], sheet: s.look }; });
    try { D.campfire.draw(ctx, { cx: FIRE_HUB[0], cy: FIRE_HUB[1], t: this.t, dim: 0.8, heroes: hs }); }
    catch (e) { drawHall(ctx, this.t, 0.42, this.st.dm); } // (the fire would not draw: the hall, as before)
  };
  Pocket.prototype.loadedModule = function () { var k = this.st.moduleKey; return k ? PK.modules(this.st).filter(function (m) { return m.key === k; })[0] || null : null; };
  // the long rest that opens a ladder or a module levels a card whose XP is due, as every other long rest does (10-17: XP earned on a road given up waited for the
  // next road's third fight -- bench16 module1017 restart=)
  Pocket.prototype.dayLevels = function () { var lv = this.levelUps(); if (lv.length) this.say(lv.join(' '), 360); return lv; };
  Pocket.prototype.drawHub = function (ctx) {
    var self = this, st = this.st, sh = this.sheets(), run = st.run, ready = this.ready(), mod = this.loadedModule();
    head(ctx, 'THE CAMP', 'the party at the fire: the menu, the market, then where to');
    var yy = 36;
    sh.forEach(function (s, i) {
      if (!s.h) return; var slot = st.party[i], L = PK.lvlOf(st, slot), nx = R.XP_LEVEL[L + 1], e = PK.stockOf(slot);
      D.text(ctx, '{y}' + s.h.name + '{/}  ' + R.CLASSES[s.h.cls].name + ' ' + s.h.lvl + '   {g}HP ' + s.h.maxhp + '  AC ' + R.ac(s.h) + (e && e.king ? '' : '  XP ' + PK.xpNow(st, slot) + (nx ? ' of ' + nx : '')) + '{/}' + (PK.levelDue(st, slot) ? '  {y}a level at the next long rest{/}' : ''), 24, yy, P('bone', 1)); yy += 11;
    });
    var ltH = st.light && this.lightOf(st.light.seat), ltS = ltH && sh[ltH.seat] && sh[ltH.seat].h; // (the light in hand, 10-17)
    D.text(ctx, 'the purse ' + (st.purse == null ? 100 : st.purse) + ' sp  ·  the pack ' + (st.pack || []).reduce(function (n, s) { return n + (s.n || 0); }, 0) + ' things' + (ltS ? '  ·  {y}' + ltS.name + '{/} carries the ' + DS.DATA.items[ltH.id].name.toLowerCase() : ''), 24, yy + 3, P('silver', 5));
    var lx = 20, rx = D.W - 180, rw = 160, by = 116, rest = run && run.atCamp; // (the right column narrower since 10-17: the fire between the two)
    this.btn(ctx, 'THE MENU  (M)', lx, by, 150, 16, function () { self.openMenu(); }, { dis: !ready, why: 'every seat at THE PARTY wants a character' });
    this.btn(ctx, 'THE MARKET  ' + (st.purse == null ? 100 : st.purse) + ' sp', lx, by + 20, 150, 16, function () { self.openMarket('hub'); }, { dis: !!(rest && !rest.market), why: 'the DM allows no market at this rest' });
    this.btn(ctx, 'SAVE THE PARTY', lx, by + 40, 150, 15, function () { self.saveParty(); });
    this.btn(ctx, 'LOAD A PARTY', lx, by + 59, 150, 15, function () { self.loadParty(); });
    if (run) {
      var rn = run.module ? run.module.name + ': FIGHT ' + run.rung + ' OF ' + run.plan.length : 'THE LADDER: ' + (run.trial ? 'THE TRIAL' : 'RUNG ' + run.rung);
      // (come to the camp from a rest -- 10-17, his "return to camp 'so i can equip after visit market' on long rests": GO ON is the rest's way on, the long rest's day first)
      var nextN = rest ? (run.module ? 'FIGHT ' + (run.rung + 1) : rest.trial ? 'THE TRIAL' : 'RUNG ' + (run.rung + 1)) : null;
      D.text(ctx, (rest ? '{o}resting:{/} ' : '{o}under way:{/} ') + fitText(rest ? (run.module ? run.module.name + ', then ' : 'the ladder, then ') + nextN : rn, rw), rx, by - 10, P('bone', 1));
      this.btn(ctx, rest ? 'GO ON: ' + nextN : 'GO ON', rx, by, rw, 18, function () { self.restOn(); }, { pri: true });
      this.btn(ctx, 'PUT IT AWAY', rx, by + 22, rw, 15, function () { var ask = self.ask || function (q) { return window.confirm(q); }; if (ask('Put away ' + rn + '? It cannot be taken up again.')) { st.run = null; self.keep(); } });
    } else {
      this.btn(ctx, 'SINGLE FIGHT', rx, by, rw, 18, function () { self.go('map'); }, { pri: true, dis: !ready, why: 'every seat at THE PARTY wants a character' });
      this.btn(ctx, 'RANDOM LADDER', rx, by + 22, rw, 16, function () { self.dayLevels(); self.toMorning({ label: 'TO RUNG 1', fn: function () { self.fightMap = self.randomMap(); self.mapSel = null; self.crI = self.defaultCR(); self.reroll(); self.startRun(); self.takeMorning(); self.go('cr'); } }, 'hub'); }, { dis: !ready, why: 'every seat at THE PARTY wants a character' });
      this.btn(ctx, mod ? 'PLAY ' + fitText(mod.name, 110) : 'PLAY MODULE', rx, by + 42, rw, 16, function () { self.dayLevels(); self.toMorning({ label: 'TO FIGHT 1', fn: function () { if (self.startModule(mod)) self.takeMorning(); } }, 'hub'); }, { dis: !mod || !ready, why: !mod ? 'no module loaded: LOAD MODULE' : 'every seat at THE PARTY wants a character' });
      this.btn(ctx, mod ? 'CHANGE MODULE' : 'LOAD MODULE', rx, by + 62, rw, 15, function () { self.scroll = 0; self.go('modules'); });
      D.text(ctx, 'a ladder: four rungs at a third again each, short rests between, a long rest and the trial', D.W / 2, 212, P('stone', 5), 'center');
    }
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    D.hint(ctx, 'M the menu · X back to THE PARTY', D.W / 2, 224, P('stone', 4), 'center');
  };
  // THE MENU at the camp: the regular one over the party (EQUIP, ITEMS, MAGIC, SKILLS, STATUS -- the same pages as everywhere), on PK's pack; what comes off goes into
  // the pack and each card's word keeps what it wears, as GEAR's (gearBack). The order is THE PARTY's (its arrows); nothing is cast or used out here
  Pocket.prototype.openMenu = function () {
    var self = this, st = this.st, hs = [], at = [];
    st.party.forEach(function (slot, i) { var e = PK.STOCK.filter(function (q) { return q.w === slot.w; })[0]; if (slot.w === 'new' || (e && e.king)) return; var h = PK.sheetOf(PK.specOf(st, slot)); if (h) { h.xp = PK.xpNow(st, slot); hs.push(h); at.push(i); } }); // (the card's XP on the sheet: the menu's Next)
    if (!hs.length) return;
    var wins = at.map(function (i) { return PK.winsOf(st, st.party[i]); }), wornN = function (h, id) { return Object.keys(h.equip).filter(function (pl) { return h.equip[pl] === id; }).length; };
    var give = function (id, n) { for (var k = 0; k < hs.length; k++) if (wornN(hs[k], id) >= 1) { var wk = wins[k].indexOf(id); if (wk >= 0 && wornN(hs[k], id) <= 1 && PK.dropWin(st, st.party[at[k]], id)) wins[k].splice(wk, 1); break; } PK.packAdd(st, id, n || 1); };
    var lh = this.lightHost(hs, at, give);
    this.pm = DS.MENU.open({
      party: function () { return hs; },
      pack: function () { return self.campPack(); },
      give: give,
      take: function (id, n) { PK.packAdd(st, id, -(n || 1)); },
      canSave: function () { return false; },
      order: function () { self.say('the order is THE PARTY\'s: its arrows', 240); },
      light: lh.light,
      run: lh.run,
      close: function () { self.pm = null; hs.forEach(function (h, k) { self.gearBack(at[k], h); }); }
    });
  };
  // A LIGHT IN HAND (10-17, Griz: "lanterns and torches not appearing when bought in market (on camp equip menu - they're in the pack on the grid)"): at the camp a torch or
  // a lantern from the pack goes into one card's off hand -- EQUIP's OFFHAND, or ITEMS' WHO CARRIES IT? -- one bearer, as the ladder camp's A TORCH IN HAND, and that card
  // walks into the next fights holding it lit (js/battle.js o.torch, Pocket.launch). It stays the pack's: the menus show the pack less the one in hand, and it comes back
  // after each fight (Pocket.done). st.light: { seat, id }
  PK.isLight = function (id) { var it = DS.DATA.items[id]; return !!(it && it.use && it.use.effect === 'light'); };
  Pocket.prototype.lightOf = function (i) { var l = this.st.light; return l && l.seat === i && this.st.party[i] && PK.packN(this.st, l.id) > 0 ? l : null; };
  Pocket.prototype.campPack = function () {
    var l = this.st.light && this.lightOf(this.st.light.seat);
    return (this.st.pack || []).map(function (s) { return { id: s.id, n: s.n - (l && l.id === s.id ? 1 : 0) }; }).filter(function (s) { return s.n > 0 && DS.DATA.items[s.id]; });
  };
  Pocket.prototype.lightHost = function (hs, at, give) {
    var self = this, st = this.st, seatOf = function (h) { var k = hs.indexOf(h); return k >= 0 ? at[k] : -1; };
    hs.forEach(function (h, k) { delete h.equip.torch; if (self.lightOf(at[k])) h.equip.torch = st.light.id; }); // (the bearer's sheet holds it: the menu's OFFHAND says so)
    return {
      light: function (h) { var l = self.lightOf(seatOf(h)); if (!l) return null; var it = DS.DATA.items[l.id]; return { id: l.id, name: it ? it.name : 'Torch', hooded: false }; },
      run: function (kind, a, done) {
        var h = a && a.h, i = h ? seatOf(h) : -1, it = a && DS.DATA.items[a.id];
        if (kind === 'item' && it && PK.isLight(a.id) && i >= 0) {
          var bare = Object.assign({}, h, { equip: Object.assign({}, h.equip, { torch: null }) });
          if (!a.clearOff && !R.lightHand(bare)) { self.say(h.name + ': ' + R.lightWhy(bare), 300); if (done) done(); return; }
          ['shield', 'offhand'].forEach(function (pl) { if (h.equip[pl]) { give(h.equip[pl], 1); h.equip[pl] = null; } }); // (the off hand emptied for it: what was there to the pack)
          hs.forEach(function (o) { delete o.equip.torch; }); h.equip.torch = a.id; st.light = { seat: i, id: a.id };
          self.keep(); self.say(h.name + ' carries the ' + it.name.toLowerCase() + ', lit, into the next fight', 300);
        } else if (kind === 'light-off' && h) { if (st.light && st.light.seat === i) st.light = null; delete h.equip.torch; self.keep(); self.say(h.name + ' puts the light away: back in the pack', 240); }
        else self.say('at the camp the party is whole: nothing to use that on', 240);
        if (done) done();
      }
    };
  };
  // the party's own file (his "Player saves are current party and pack"): the seats, the characters made for them, the pack and the purse; loaded, the made ones join
  // the roster (by their word) and the seats point at them
  PK.PARTY_KIND = 'pocket-party';
  Pocket.prototype.saveParty = function () {
    var st = this.st, used = {}, roster = [], party = JSON.parse(JSON.stringify(st.party)).map(function (slot) { if (slot.custom != null && st.roster[slot.custom]) { if (used[slot.custom] == null) { used[slot.custom] = roster.length; roster.push(st.roster[slot.custom]); } slot.custom = used[slot.custom]; } return slot; });
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; }, name = 'pocket-party-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var body = JSON.stringify({ game: 'DRAGONSLEEP', kind: PK.PARTY_KIND, v: 1, at: d.toISOString(), party: party, roster: JSON.parse(JSON.stringify(roster)), pack: JSON.parse(JSON.stringify(st.pack || [])), purse: st.purse == null ? 100 : st.purse }, null, 1);
    try { var a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); this.say('saved the party to ' + name, 300); }
    catch (e) { this.say('could not save: ' + e); return null; }
    return name;
  };
  // A CARD'S PDF (10-26, Griz: "Somewhere in the pocket DM - reference user interface best practices - players should be able to save pdf of character sheet"): the
  // character as a sheet for the table at one press, its file's name said as SAVE THE PARTY says its own (js/sheetpdf.js) -- the sheet bare and whole, nothing cast
  // ahead and nothing a ladder's fight took (the paper's boxes keep the day), with its word and its XP
  PK.bareSpec = function (sp) { return sp ? Object.assign({}, sp, { morning: true, mageArmor: false, prepared: null, hpLeft: null, slotsLeft: null, featsLeft: null, condsLeft: null }) : null; };
  Pocket.prototype.sheetPdf = function (h, word, xp) {
    if (!h || !D.sheetPdf) { D.sfx('error'); this.say('no sheet to save', 240); return null; }
    var name = null;
    try { name = D.sheetPdf.save(h, { word: word, xp: xp, cap: PK.cap(this.st) }); } catch (e) { D.sfx('error'); this.say('could not make the sheet: ' + (e && e.message || e), 360); return null; }
    if (name) { var said = 'saved ' + name + ' -- where your browser puts downloads'; this.say(D.textWidth(said) <= D.W - 24 ? said : 'saved ' + name + ' to your downloads', 420); } // (the line kept inside the screen: a long name takes the short one)
    else { D.sfx('error'); this.say('the browser would not take the file', 300); }
    return name;
  };
  Pocket.prototype.cardPdf = function (i) { var st = this.st, slot = st.party[i]; return slot ? this.sheetPdf(PK.sheetOf(PK.bareSpec(PK.specOf(st, slot))), PK.wordOf(st, slot), PK.xpNow(st, slot)) : null; };
  Pocket.prototype.takeParty = function (text) {
    var f = null; try { f = JSON.parse(text); } catch (e) { f = null; }
    if (!f || f.game !== 'DRAGONSLEEP' || f.kind !== PK.PARTY_KIND || !Array.isArray(f.party) || !f.party.length) { this.msg = { text: 'that file is not a party', t: 300, bad: true }; return null; }
    var st = this.st, ask = this.ask || function (q) { return window.confirm(q); };
    if (st.run && !ask('A ' + (st.run.module ? 'module' : 'ladder') + ' is under way. Put it away for this party?')) { this.say('kept the party as it was', 240); return null; }
    st.roster = st.roster || [];
    var party = f.party.slice(0, 6).map(function (slot) {
      if (slot.custom == null) return slot;
      var c = (f.roster || [])[slot.custom]; if (!c) return { w: 'new' };
      var k = st.roster.map(function (x) { return x.code; }).indexOf(c.code); if (k < 0) { st.roster.push(c); k = st.roster.length - 1; }
      return Object.assign({}, slot, { custom: k });
    });
    st.party = party; st.pack = Array.isArray(f.pack) ? f.pack : []; st.purse = typeof f.purse === 'number' ? f.purse : 100; st.run = null; st.dayMorning = null;
    this.cache = {}; this.keep(); this.say('the party: ' + party.length + ' seats, the pack and ' + st.purse + ' sp', 300);
    this.metalOff(); // (a party file from before 10-21's ruling: a druid's metal to the pack)
    return st.party;
  };
  Pocket.prototype.loadParty = function () { var self = this; PK.readJSON(function (text) { self.takeParty(text); }); };
  // THE LONG REST's page: the casters' day on the left (pick one, its spells on the right), what is cast this morning under them, then what follows (mGo)
  Pocket.prototype.drawMorning = function (ctx) {
    var self = this, mi = this.mInfoNow(), m = this.morning(), cards = mi.cards.filter(function (c) { return c && c.pi; });
    head(ctx, 'THE LONG REST', 'a night of it -- everything back -- then the day\'s spells, and what is cast this morning');
    if (this.mCaster == null || (this.mCaster !== 'cast' || !mi.casts.length) && !cards.some(function (c) { return c.i === self.mCaster; })) this.mCaster = cards.length ? cards[0].i : mi.casts.length ? 'cast' : -1;
    var yy = 36;
    D.text(ctx, '{y}THE DAY\'S SPELLS{/}', 14, yy, P('gold', 4)); yy += 10;
    if (!cards.length) { D.text(ctx, 'nobody here prepares spells', 14, yy + 3, P('stone', 5)); yy += 14; }
    cards.forEach(function (c) { self.btn(ctx, fitText(c.h.name.toUpperCase(), 100) + '  ' + c.prepared.length + ' OF ' + c.pi.n, 14, yy, 150, 14, function () { self.mCaster = c.i; self.scroll = 0; }, { on: self.mCaster === c.i, small: true }); yy += 16; });
    // what is cast this morning (10-21: a row a spell, in the panel; here what is on, and on whom)
    yy += 6; D.text(ctx, '{y}CAST THIS MORNING{/}', 14, yy, P('gold', 4)); yy += 10;
    var castOn = mi.casts.filter(function (r) { return r.got.length; });
    if (!mi.casts.length) D.text(ctx, 'nobody here casts ahead', 14, yy + 3, P('stone', 5));
    else {
      self.btn(ctx, 'THE LONG SPELLS  ' + castOn.length + ' ON', 14, yy, 150, 14, function () { self.mCaster = 'cast'; self.scroll = 0; }, { on: self.mCaster === 'cast', small: true }); yy += 18;
      castOn.forEach(function (r) { if (yy > 222) return; D.text(ctx, fitText(PK.castText(r), 150), 16, yy, P('bone', 2)); yy += 10; });
      if (!castOn.length) D.text(ctx, 'nothing cast ahead', 16, yy, P('stone', 5));
    }
    var px = 172, py = 34, pw = D.W - px - 10, ph = 192, c = cards.filter(function (x) { return x.i === self.mCaster; })[0];
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    if (this.mCaster === 'cast') {
      // the long spells: a row a spell someone here can cast -- its level, how long it lasts by the SRD, who casts it (a click for the next who has it ready), and
      // the party under it, lit where it is cast: a click on a name casts it on them, or lets it go (each one a casting and a slot; Aid's three one casting)
      D.text(ctx, '{y}The long spells{/}: on as each fight starts, a slot a casting', px + 6, py + 5, P('bone', 1));
      var rows = mi.casts, per = rows.length > 6 ? 5 : 6, from = Math.min(this.scroll, Math.max(0, rows.length - per)), seats = mi.cards.filter(Boolean), cw = Math.floor((pw - 12) / Math.max(1, seats.length)); this.scroll = from;
      var ORD = ['cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
      var mine = function (r) { var cur = m.cast[r.e.id] = m.cast[r.e.id] || {}; if (!Array.isArray(cur.who)) cur.who = r.who.slice(); return cur; };
      var b0 = this.btns.length;
      rows.slice(from, from + per).forEach(function (r, k) {
        var ry = py + 18 + k * 28;
        var room = pw - 100 - D.textWidth(r.spell.name + '  ' + ORD[r.lv] + '  '); // (the duration, or why not, in what the line has left beside who casts it)
        D.text(ctx, '{y}' + r.spell.name + '{/}  ' + ORD[r.lv] + (r.why ? '  {r}' + fitText(r.why, room) + '{/}' : '  {g}' + fitText(r.e.dur, room) + '{/}'), px + 6, ry + 2, P('bone', 1));
        if (r.ready.length > 1) self.btn(ctx, fitText('by ' + r.caster.h.name, 74), px + pw - 86, ry, 80, 11, function () { var cur = mine(r), k2 = r.ready.indexOf(r.caster); cur.by = r.ready[(k2 + 1) % r.ready.length].i; self.mChanged(); }, { small: true });
        else if (r.caster) D.text(ctx, fitText('by ' + r.caster.h.name, 80), px + pw - 8, ry + 2, P('silver', 5), 'right');
        seats.forEach(function (sc, j) {
          var w = r.whyOf[sc.i], got = r.got.indexOf(sc) >= 0;
          self.btn(ctx, fitText(sc.h.name.toUpperCase(), cw - 10), px + 6 + j * cw, ry + 13, cw - 4, 12, function () {
            var cur = mine(r), at = cur.who.indexOf(sc.i);
            if (at >= 0) cur.who.splice(at, 1);
            else if (r.e.n && cur.who.length >= r.e.n) { self.say(r.spell.name + ' is cast on ' + r.e.n + ': let one go first', 240); return; }
            else cur.who.push(sc.i);
            self.mChanged();
          }, { on: got, small: true, dis: !!w && !got && r.e.bare, why: w ? sc.h.name + ' ' + w : null });
        });
      });
      this.listRows(b0, py + 18, 28, rows.length, per, from); // (the arrows scroll it, 10-27)
      this.pager(ctx, px + 6, py + ph - 13, rows.length, per, from); // (five a page when ^ v stand under them, 10-27)
    } else if (c) {
      D.text(ctx, '{y}' + c.h.name + '{/}: ' + c.prepared.length + ' of ' + c.pi.n + ' prepared  {g}(cantrips' + ((c.pi.always || []).length ? ' and the always-ready' : '') + ' need none){/}', px + 6, py + 5, P('bone', 1));
      var pool = c.pi.pool, per = 26, from = Math.min(this.scroll, Math.max(0, pool.length - per)); this.scroll = from;
      var b0p = this.btns.length;
      pool.slice(from, from + per).forEach(function (id, k) {
        var sp = SV.spell(id) || { name: id, level: '?' }, on = c.prepared.indexOf(id) >= 0, col = k % 2, rw = Math.floor(k / 2);
        self.btn(ctx, fitText((on ? '[x] ' : '[ ] ') + sp.name, 120) + '  L' + sp.level, px + 6 + col * ((pw - 12) / 2), py + 18 + rw * 12, (pw - 16) / 2, 11, function () {
          var cur = (m.prep[c.i] || c.prepared).slice(), at2 = cur.indexOf(id);
          if (at2 >= 0) cur.splice(at2, 1); else if (cur.length < c.pi.n) cur.push(id); else { self.say(c.h.name + ' has ' + c.pi.n + ' prepared: let one go first', 240); return; }
          m.prep[c.i] = cur; self.mChanged();
        }, { on: on, small: true });
      });
      this.listRows(b0p, py + 18, 12, pool.length, per, from, 'scroll', 2); // (two spells a row: a row is two to the scroll, 10-27)
      this.pager(ctx, px + 6, py + ph - 13, pool.length, per, from);
      if ((c.pi.always || []).length) D.text(ctx, fitText('always ready: ' + c.pi.always.map(function (id) { return (SV.spell(id) || { name: id }).name; }).join(', '), pw - 12), px + 6, py + ph - (pool.length > per ? 20 : 10), P('silver', 5));
    } else D.text(ctx, 'nobody here prepares spells: the rest is the rest', px + pw / 2, py + 80, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'THE CLASS\'S OWN', 86, 236, 110, 15, function () { self.st.morning = PK.MORNING0(); self.mChanged(); }, { small: true });
    var g = this.mGo || { label: 'DONE', fn: function () { self.go('hub'); } };
    this.btn(ctx, g.label, D.W - 150, 236, 130, 15, function () { g.fn(); }, { pri: true });
  };
  // THE MODULES (10-17): the game's own (data/modules.js) and any kept from a file; the one picked shows its fights, how each reads for this party, and what the
  // DM allows after each. On the title for now; THE CAMP's LOAD MODULE when the camp stands (the two Pocket DMs, step B)
  Pocket.prototype.drawModules = function (ctx) {
    if (!this.fold) this.folderRead(false); // (the folder read once a visit: js/pocket.js go clears it)
    var self = this, st = this.st, fold = this.fold || { mods: [] }, list = PK.modules(st).concat(fold.mods), per = 10;
    head(ctx, 'THE MODULES', 'a DM\'s fights, played as built: the game\'s own, your folder\'s, and any you load from a file');
    if (!list.some(function (m) { return m.key === self.modSel; })) this.modSel = list.length ? list[0].key : null;
    var from = Math.min(this.scroll, Math.max(0, list.length - per)); this.scroll = from;
    var b0 = this.btns.length;
    list.slice(from, from + per).forEach(function (m, i) { self.btn(ctx, fitText(m.name, 128), 14, 36 + i * 17, 140, 15, function () { self.modSel = m.key; }, { on: self.modSel === m.key, small: true }); });
    this.listRows(b0, 36, 17, list.length, per, from); // (the arrows scroll it, 10-27)
    this.pager(ctx, 14, 36 + per * 17, list.length, per, from);
    var m = list.filter(function (x) { return x.key === self.modSel; })[0], px = 162, py = 34, pw = D.W - px - 10, ph = 196;
    ctx.fillStyle = 'rgba(10,8,16,.9)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = P('stone', 3); ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    var levels = this.levels(), off = false;
    if (m) {
      var yy = py + 5;
      D.text(ctx, fitText('{y}' + m.name + '{/}' + (m.builtin ? '  {g}comes with the game{/}' : m.inFolder ? '  {g}' + m.file + '{/}' : m.mine ? '  {g}this table\'s{/}' : ''), pw - 12), px + 6, yy, P('gold', 4)); yy += 10;
      if (m.party) { off = levels.length !== m.party.n || levels.some(function (L) { return L !== m.party.lvl; }); D.text(ctx, 'made for ' + m.party.n + ' at level ' + m.party.lvl + (off ? '  {o}yours: ' + levels.length + ' at ' + levels.join('/') + '{/}' : '  {n}yours fit{/}'), px + 6, yy, P('silver', 5)); yy += 10; }
      D.wrap(m.about || '', pw - 12).slice(0, 3).forEach(function (t) { D.text(ctx, t, px + 6, yy, P('bone', 1)); yy += 9; });
      yy += 3;
      m.slots.forEach(function (s, i) {
        var d = PK.diff(levels, s.foes), col = d.label === 'DEADLY' ? '{r}' : d.label === 'HARD' ? '{o}' : '{g}';
        D.text(ctx, fitText('{y}' + (i + 1) + '{/} ' + (s.name || PK.foesText(s.foes)) + '  ' + col + d.label + (d.deadlyX > 1 ? ' x' + d.deadlyX : '') + '{/}', pw - 12), px + 6, yy, P('bone', 1)); yy += 9;
        D.text(ctx, fitText(PK.foesText(s.foes) + ', ' + ((D.MAPS[s.map] || {}).name || s.map) + (i < m.slots.length - 1 ? '  ·  then ' + PK.restText(s.rest) : ''), pw - 20), px + 14, yy, P('stone', 5)); yy += 10;
      });
    } else D.text(ctx, 'no modules yet: FROM A FILE loads one', px + pw / 2, py + 80, P('stone', 5), 'center');
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'FROM A FILE', 86, 236, 90, 15, function () { self.loadModule(); });
    // the folder (10-17): choose one once; after a restart, one allow; read again for a module saved since
    if (fold.state === 'unsupported') D.text(ctx, 'this browser keeps no folder: FROM A FILE', 20, 222, P('stone', 5));
    else {
      this.btn(ctx, fold.state === 'none' ? 'CHOOSE A FOLDER' : fitText('FOLDER: ' + (fold.name || ''), 140), 20, 218, 156, 13, function () { self.folderChoose(); }, { small: true });
      if (fold.state === 'ask') this.btn(ctx, 'ALLOW IT', 182, 218, 80, 13, function () { self.folderRead(true); }, { pri: true, small: true });
      else if (fold.state === 'ok') { this.btn(ctx, 'READ IT AGAIN', 182, 218, 90, 13, function () { self.folderRead(false); }, { small: true }); D.text(ctx, fold.mods.length + ' module' + (fold.mods.length === 1 ? '' : 's') + ' there', 278, 222, P('stone', 5)); }
      else if (fold.state === 'none') D.text(ctx, 'a folder where SAVE AS A MODULE writes, read here', 182, 222, P('stone', 5));
    }
    if (m && m.party && off) this.btn(ctx, 'THE PARTY TO LEVEL ' + m.party.lvl, 182, 236, 130, 15, function () { var r = PK.levelAll(st, m.party.lvl); self.cache = {}; self.keep(); self.say(r.moved + ' to level ' + m.party.lvl + (r.kept ? '; ' + r.kept + ' made by hand keep their own (EDIT on THE PARTY)' : '') + (levels.length !== m.party.n ? '; the module wants ' + m.party.n + ' seats (THE PARTY)' : ''), 360); });
    this.btn(ctx, this.st.moduleKey === (m && m.key) ? 'LOADED' : 'LOAD THIS MODULE', D.W - 150, 236, 130, 15, function () { self.st.moduleKey = m.inFolder ? PK.keepModule(st, m) : m.key; self.keep(); self.go('hub'); self.say(m.name + ' loaded: PLAY it from THE CAMP', 240); }, { pri: true, dis: !m, why: 'no module picked' }); // (THE CAMP's PLAY MODULE plays it, 10-17)
  };
  Pocket.prototype.drawFights = function (ctx) {
    var self = this, fs = this.st.fights, per = 11;
    head(ctx, 'THE FIGHTS', fs.length + ' kept in this browser · E on one for its notes · SAVE ALL: every fight and its notes in one file');
    var from = Math.min(this.scroll, Math.max(0, fs.length - per)); this.scroll = from;
    var b0 = this.btns.length;
    fs.slice(from, from + per).forEach(function (f, i) {
      var yy = 36 + i * 17, d = new Date(f.t), when = (d.getMonth() + 1) + '-' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      var rc = f.result === 'won' ? '{n}WON{/}' : f.result === 'lost' ? '{r}LOST{/}' : '{g}' + f.result + '{/}';
      self.btn(ctx, when + '  ' + rc + '  R' + f.rounds + (f.rung ? '  rung ' + f.rung : ''), 14, yy, 150, 15, function () { self.note = from + i; self.go('notes'); }, { small: true });
      D.text(ctx, (f.foes.length > 40 ? f.foes.slice(0, 40) + '..' : f.foes) + '  {g}CR ' + f.cr + ' ' + f.diff + '{/}' + (f.notes ? '  {y}*{/}' : ''), 170, yy + 4, P('bone', 1));
    });
    this.listRows(b0, 36, 17, fs.length, per, from); // (the arrows scroll it, 10-27)
    this.pager(ctx, 14, 36 + per * 17 - 1, fs.length, per, from);
    this.btn(ctx, 'BACK', 20, 236, 60, 15, function () { self.back(); });
    this.btn(ctx, 'SAVE ALL', 90, 236, 90, 15, function () { self.saveAll(); }, { pri: true, dis: !fs.length }); // (10-17: one file, every fight and its notes)
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
  function drawHall(ctx, t, bright, dm) {
    ctx.drawImage(hallStill(), 0, 0);
    // the lamps' flames
    [150, 330].forEach(function (lx, i) { var f = ((t >> 3) + i) & 1; ctx.fillStyle = f ? '#F8D878' : '#FCA044'; ctx.fillRect(lx - 3, 92, 7, 8); ctx.fillStyle = 'rgba(248,160,68,.10)'; ctx.fillRect(lx - 14, 80, 29, 34); });
    // the DM's table (js/pocketdm.js): the high seat taken -- its rim gold, a breath of light on it
    if (dm) { var gl = 0.35 + Math.sin(t / 30) * 0.12; ctx.strokeStyle = 'rgba(248,214,122,' + gl + ')'; ctx.strokeRect(222.5, 55.5, 35, 67); ctx.fillStyle = 'rgba(248,214,122,' + (gl * 0.25) + ')'; ctx.fillRect(227, 70, 26, 36); }
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
