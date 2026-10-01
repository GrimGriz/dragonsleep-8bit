/* DEEP16 — the climb (Griz, 09-27: "an alternate mode that goes fight-by-fight 1-9 (random of created battles)"; "TPK puts
   you back at the bottom of the ladder, at least one escaped party member back to the campfire, lol 'a giant pair of DM
   hands appear above the campfire and wave vigorously, your fallen comrades appear around the campfire resurrected'";
   "build the climb mode first"). One party, level 1 to 9. Each rung: a fight drawn at random from the rung's, the camp
   before it (a long rest between fights), and after a win the level-up with the player's own picks (SRD 5.1, as the
   build plays it): ability scores at 4 and 8 (the fighter at 6 too), the rogue's archetype at 3 and Expertise at 6, the
   wizard's two new spells a level from 3 and a cantrip at 4. The quests' reward weapons come at 5 and 9. A party wiped
   out goes back to the bottom; one that got a hero out goes back to the campfire. Kept in deep16.climb. */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS, SV = D.save;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.climb', IDS = ['barley', 'aurdin', 'vivian', 'lymen'], ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  // the wizard spells a climb can learn (the 8-bit game's list and Misty Step); the cantrips
  var WIZARD = ['burninghands', 'magicmissile', 'shield', 'sleep', 'detectmagic', 'mageArmor', 'thunderwave', 'scorchingray', 'shatter', 'web',
    'holdperson', 'mistystep', 'fireball', 'lightningbolt', 'icestorm', 'greaterinvisibility', 'stoneskin', 'coneofcold', 'holdmonster', 'ropetrick', 'tinyhut', // (the resting spells: RULED 09-28, the climb offers them too)
    // the wizard's spells built for the class NPCs (09-28, js/grimoire.js): his to learn on the climb and try by hand
    'colorspray', 'grease', 'hideouslaughter', 'falselife', 'expeditiousretreat', 'longstrider', 'protectionfromevilandgood', 'fogcloud',
    'acidarrow', 'blur', 'mirrorimage', 'rayofenfeeblement', 'gustofwind', 'enlargereduce', 'magicweapon', 'invisibility', 'darkvision', 'seeinvisibility', 'continualflame', 'darkness',
    'haste', 'slow', 'hypnoticpattern', 'fear', 'vampirictouch', 'blink', 'protectionfromenergy', 'dispelmagic', 'stinkingcloud', 'sleetstorm'];
  var CANTRIPS = ['firebolt', 'acidsplash', 'light', 'rayoffrost', 'shockinggrasp', 'chilltouch', 'poisonspray', 'truestrike', 'dancinglights'];

  // ------------------------------------------------------------------ the climb's state
  var CL = D.climb = {};
  CL.load = function () { return D.store.get(KEY); };
  CL.save = function (s) { D.store.set(KEY, s); };
  CL.fresh = function (prev) {
    var party = IDS.map(function (id) {
      var h = SV.levelOne(DS.R.makeHero(id)); h.climb = true;
      if (id === 'barley' && !h.equip.armor) h.equip.armor = 'splint'; // the ladder dresses him (Griz, 09-27: "let's go with splint-mail")
      return h;
    });
    var s = { level: 1, party: party, fight: null, run: (prev ? prev.run : 0) + 1, best: prev ? prev.best : 1, camp: null };
    CL.draw(s);
    return s;
  };
  // a fight at random from the rung's (another than `not`, if the rung has another)
  CL.draw = function (s, not) {
    var fs = D.fightsAt(s.level), other = fs.filter(function (f) { return f.id !== not; });
    if (other.length) fs = other;
    s.fight = fs.length ? fs[Math.floor(Math.random() * fs.length)].id : null;
  };
  // the party after a long rest, for the camp: whole, slots and features back, the last fight's leftovers gone
  CL.rested = function (s) {
    var party = JSON.parse(JSON.stringify(s.party));
    party.forEach(function (h) {
      h.conds = {}; DS.R.refresh(h, true); h.hp = h.maxhp; h.ko = false;
      if (h.cls === 'fighter' && h.lvl < 2) h.feats.actionSurge = 0; // Action Surge comes at 2
    });
    return { party: party, guests: [], inv: SV.fixture(s.level).inv, flags: { lakeDone: 1 }, level: s.level, climb: true };
  };
  CL.keep = function (s, party) {
    party.forEach(function (h) { var mine = s.party.filter(function (x) { return x.id === h.id; })[0]; if (mine) mine.equip = JSON.parse(JSON.stringify(h.equip)); });
  };

  // ------------------------------------------------------------------ levelling with the player's picks
  // what a hero chooses going up from his level (SRD 5.1; the fighter's third increase at 6; the paladin prepares at camp)
  CL.choices = function (h) {
    var n = h.lvl + 1, out = [];
    if (h.cls === 'rogue' && n === 3) out.push({ kind: 'archetype' });
    if (n === 4 || n === 8 || (h.cls === 'fighter' && n === 6)) out.push({ kind: 'asi' });
    if (h.cls === 'rogue' && n === 6) out.push({ kind: 'expertise', n: 2 });
    if (h.cls === 'wizard' && n >= 3) out.push({ kind: 'spells', n: 2 });
    if (h.cls === 'wizard' && n === 4) out.push({ kind: 'cantrip', n: 1 });
    return out;
  };
  // the 8-bit game's R.levelUp does the class's part (HP, slots, features, the subclass); then the build's own picks
  // (its ability scores, its spells, its Expertise) are taken back and the player's go in
  CL.levelUp = function (h, picks) {
    var R = DS.R, before = { abil: JSON.parse(JSON.stringify(h.abil)), known: (h.known || []).slice(), expertise: (h.expertise || []).slice() }, hp0 = h.maxhp;
    var msgs = (R.levelUp(h) || []).map(function (m) { return DS.stripCodes ? DS.stripCodes(String(m)) : String(m); });
    h.abil = before.abil; h.known = before.known; h.expertise = before.expertise;
    var out = [];
    if (picks.asi) { Object.keys(picks.asi).forEach(function (k) { h.abil[k] = Math.min(20, h.abil[k] + picks.asi[k]); }); out.push(Object.keys(picks.asi).map(function (k) { return k.toUpperCase() + ' +' + picks.asi[k]; }).join(', ') + '.'); }
    if (picks.archetype) { h.subclass = picks.archetype; delete h.pendingChoice; out.push(h.name + ' is a ' + picks.archetype + '.'); }
    if (picks.expertise) { h.expertise = h.expertise.concat(picks.expertise); out.push('Expertise: ' + picks.expertise.join(', ') + '.'); }
    var learnt = (picks.spells || []).concat(picks.cantrip || []);
    learnt.forEach(function (id) { if (h.known.indexOf(id) < 0) h.known.push(id); });
    if (learnt.length) out.push('Learns ' + learnt.map(function (id) { return SV.spell(id).name; }).join(', ') + '.');
    var c = R.CLASSES[h.cls];
    h.maxhp = h.lvl * Math.max(1, c.hd + DS.mod(h.abil.con)); h.hp = h.maxhp; // a max hit die a level, CON back to level 1 (RULED 09-25)
    // the quests' reward weapons, as the 8-bit game gives them: a +1 at 5, a +2 at 9 (in place of the hero's own)
    var d = DS.DATA.heroes[h.id], rw = d.rewardWeapons || [], it = DS.DATA.items;
    if (h.lvl === 5 && rw[0] && it[rw[0]] && h.equip.weapon === d.equip.weapon) { h.equip.weapon = rw[0]; out.push('The quests reward: ' + it[rw[0]].name + '.'); }
    if (h.lvl === 9 && rw[1] && it[rw[1]] && (h.equip.weapon === d.equip.weapon || h.equip.weapon === rw[0])) { h.equip.weapon = rw[1]; out.push('The quests reward: ' + it[rw[1]].name + '.'); }
    var keep = msgs.filter(function (m) { return !/Ability scores|learns|Expertise:|has a choice|is now level/.test(m); });
    return ['{y}' + h.name + '{/} is a ' + h.cls + ' of level ' + h.lvl + '  {n}HP ' + hp0 + ' -> ' + h.maxhp + '{/}'].concat(out, keep);
  };

  // ------------------------------------------------------------------ drawing bits
  function box(ctx, x, y, w, h) { D.win8(ctx, x, y, w, h); } // (the 8-bit game's window, as every DEEP16 menu: js/core.js D.win8, 10-01)
  function fire(ctx, x, y, t, big) {
    var fl = [P('red', 3), P('fire', 1), P('gold', 3), P('gold', 4)], n = big ? 13 : 7;
    ctx.fillStyle = P('stone', 3); ctx.fillRect(x - n / 2 - 2, y, n + 4, 2);
    for (var k = 0; k < n; k++) { var h = (big ? 5 : 3) + ((t / 4 + k * 5) % (big ? 12 : 7)) * (1 - Math.abs(k - n / 2) / n); ctx.fillStyle = fl[k % 4]; ctx.fillRect(Math.round(x - n / 2 + k), Math.round(y - h), 1, Math.round(h)); }
  }
  // the abilities in a card's width, and a subclass in a word
  function abils(h) { return ABIL.map(function (k) { return k.charAt(0).toUpperCase() + (k === 'cha' ? 'h' : '') + h.abil[k]; }).join(' '); }
  var SUB = { 'School of Evocation': 'evoker', 'Oath of Devotion': 'Devotion' };
  function sub(h) { return h.subclass ? ' (' + (SUB[h.subclass] || h.subclass) + ')' : ''; }

  // ------------------------------------------------------------------ the climb's screen: the party, the rung, the fight drawn
  function Climb() { this.t = 0; }
  D.Climb = Climb;
  Climb.prototype.opaque = true;
  Climb.prototype.enter = function () {
    this.s = CL.load() || CL.fresh(null);
    if (!this.s.fight) CL.draw(this.s);
    CL.save(this.s);
    this.sel = 0; this.card = null;
    D.music('title');
  };
  // the camp's view of the climb
  Climb.prototype.hooks = function () {
    var s = this.s;
    return { rested: function () { return CL.rested(s); }, campState: function () { return s.camp; }, setCamp: function (st) { s.camp = st; CL.save(s); },
      keep: function (party) { CL.keep(s, party); CL.save(s); } };
  };
  Climb.prototype.rows = function () {
    var self = this;
    return [
      { label: 'TO THE CAMP, THEN THE FIGHT', act: function () { self.go(); } },
      { label: 'START OVER (a new climb at level 1)', act: function () { self.card = { ask: 'over', lines: ['{y}START OVER?{/}', 'The party goes back to level 1, and this climb is done.', D.keys('{g}E start over  ·  X keep climbing{/}')] }; } },
      { label: 'BACK TO THE LADDER', act: function () { D.pop(); D.push(new D.Ladder()); } }
    ];
  };
  Climb.prototype.go = function () {
    var self = this, F = D.fight(this.s.fight);
    D.sfx('confirm');
    D.push(new D.Camp(this.s.level, F, function (res, info) { self.after(res, info); }, { climb: this.hooks() }));
  };
  Climb.prototype.after = function (res, info) {
    var s = this.s, self = this;
    D.music('title');
    if (res === 'won') {
      if (s.level >= 9) { s.best = 9; CL.save(s); this.card = { top: true, lines: ['{y}THE TOP OF THE CLIMB{/}', 'Level 9 won, from level 1, run ' + s.run + '.', 'The ladder goes no higher -- yet.', D.keys('{g}E{/}')] }; return; }
      D.push(new LevelUp(s, function () {
        s.level++; s.best = Math.max(s.best, s.level); s.camp = s.camp ? { equip: {}, prep: {}, cast: s.camp.cast } : null;
        CL.draw(s); CL.save(s);
        var F = D.fight(s.fight);
        self.card = { lines: ['{y}LEVEL ' + s.level + '{/}', 'The next rung: {y}' + (F ? F.name : '?') + '{/}' + (F && F.sub ? ', ' + F.sub : '') + '.', D.keys('{g}E{/}')] };
      }));
      return;
    }
    if (res === 'lost') {
      var at = s.level;
      this.s = CL.fresh(s); CL.save(this.s);
      this.card = { lines: ['{r}THE DARK KEEPS THEM.{/}', 'All four went down on the rung of level ' + at + '.', 'Back to the bottom: a new climb, at level 1 (run ' + this.s.run + ').', D.keys('{g}E{/}')] };
      return;
    }
    if (res === 'escaped') {
      var fell = (info && info.down) || [];
      CL.draw(s, s.fight); CL.save(s);
      var F2 = D.fight(s.fight);
      this.card = { hands: true, t0: this.t, down: fell, lines: ['{y}BACK TO THE CAMPFIRE{/}', 'A giant pair of DM hands appears above the campfire and waves vigorously.', fell.length ? 'Your fallen comrades appear around the fire, resurrected.' : 'Nobody fell. The hands wave anyway.', 'No level for it. The next fight on this rung: {y}' + (F2 ? F2.name : '?') + '{/}.', D.keys('{g}E{/}')] };
    }
  };
  Climb.prototype.update = function () {
    this.t++;
    if (this.card) {
      if (this.card.ask === 'over') {
        if (I.pressed('a')) { this.s = CL.fresh(this.s); CL.save(this.s); this.card = { lines: ['{y}A NEW CLIMB{/}', 'Level 1, run ' + this.s.run + '.', D.keys('{g}E{/}')] }; D.sfx('confirm'); }
        else if (I.pressed('b') || I.pressed('menu') || I.mouse.click) { this.card = null; D.sfx('cancel'); }
        return;
      }
      if (I.pressed('a') || I.pressed('b') || I.mouse.click) {
        D.sfx('confirm');
        if (this.card.top) { this.s = CL.fresh(this.s); CL.save(this.s); }
        this.card = null;
      }
      return;
    }
    var rows = this.rows(), n = rows.length, s0 = this.sel, m = I.mouse, hit = -1;
    if (I.repeat('up')) this.sel = (this.sel + n - 1) % n;
    if (I.repeat('down')) this.sel = (this.sel + 1) % n;
    if (m.inside && this.rects) this.rects.forEach(function (r, i) { if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) hit = i; });
    if (m.moved && hit >= 0) this.sel = hit;
    if (this.sel !== s0) D.sfx('cursor');
    if (I.pressed('a') || (m.click && hit >= 0)) { rows[this.sel].act(); return; }
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('cancel'); this.sel = 2; }
  };
  // back to the campfire, whole screen (Griz, 09-28: "fancy up the DM handwaving"): the hands come down out of the dark,
  // wave, the sparkles fall on the empty places, the fallen come back into them, and the hands go
  Climb.prototype.drawHands = function (ctx) {
    var c = this.card, s = this.s, tt = this.t - (c.t0 || 0), CF = D.campfire, cx = D.W / 2, cy = 172;
    var back = Math.max(0, Math.min(1, (tt - 70) / 80));
    CF.draw(ctx, { cx: cx, cy: cy, t: this.t, dim: 1, heroes: s.party.map(function (h) { return { id: h.id, sheet: SV.look(h.id, null).sheet || h.id + '_p0', alpha: c.down.indexOf(h.id) >= 0 ? back : 1 }; }) });
    if (tt > 45 && tt < 175) c.down.forEach(function (id) { var st = CF.seatAt(id, cx, cy); if (st) CF.sparkle(ctx, st.x, st.y - 10, tt); });
    var hy = tt < 40 ? -100 + tt / 40 * 160 : tt < 190 ? 60 : 60 - (tt - 190) * 4;
    if (hy > -100) {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + 10, 70 * Math.min(1, tt / 40), 8, 0, 0, 7); ctx.fill(); // their shadow on the clearing
      CF.hands(ctx, cx, hy, tt < 40 || tt > 190 ? tt * 0.3 : tt, 3, 1);
    }
    if (tt > 30) {
      var wl = []; c.lines.forEach(function (l) { wl = wl.concat(D.wrap(l, 340)); });
      var bh = wl.length * 10 + 8, by = D.H - bh - 8;
      box(ctx, cx - 180, by, 360, bh, P('gold', 4));
      wl.forEach(function (w, i) { D.text(ctx, w, cx, by + 5 + i * 10, P('bone', 1), 'center'); });
    }
  };
  Climb.prototype.draw = function (ctx) {
    if (this.card && this.card.hands) return this.drawHands(ctx);
    var R = DS.R, s = this.s, self = this, F = D.fight(s.fight);
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    ctx.save(); ctx.translate(6, 5); ctx.scale(2, 2); D.text(ctx, 'THE CLIMB', 0, 0, P('gold', 4)); ctx.restore();
    D.text(ctx, 'one party, level 1 to 9  ·  run ' + s.run + '  ·  best: level ' + s.best, 104, 9, P('silver', 5));
    // the rungs up the left, the party's marked
    for (var L = 1; L <= 9; L++) {
      var yy = 32 + (9 - L) * 20, on = L === s.level;
      ctx.fillStyle = on ? P('gold', 3) : L < s.level ? P('stone', 4) : P('stone', 2); ctx.fillRect(10, yy + 8, 18, 3);
      D.text(ctx, String(L), 32, yy + 5, on ? P('gold', 4) : P('stone', 5));
    }
    fire(ctx, 20, 32 + (9 - s.level) * 20 + 7, this.t, false);
    // the four
    s.party.forEach(function (h, i) {
      var x = 46, y = 30 + i * 46, w = 188;
      box(ctx, x, y, w, 43, P('stone', 3));
      ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, 30, 37); ctx.clip();
      var sheet = SV.look(h.id, null).sheet || h.id + '_p0';
      D.spr.draw(ctx, sheet, 'idle', 0, self.t, x + 18, y + Math.min(D.spr.top(sheet), 42) + 3, {});
      ctx.restore();
      var w0 = R.weaponOf(h);
      D.text(ctx, '{y}' + h.name + '{/}  ' + h.cls + ' ' + h.lvl + sub(h), x + 38, y + 4, P('bone', 1));
      D.text(ctx, 'HP ' + h.maxhp + '  AC ' + R.ac(h) + '  ' + w0.name, x + 38, y + 14, P('silver', 5));
      D.text(ctx, abils(h), x + 38, y + 24, P('stone', 5));
      if (h.cls === 'wizard') D.text(ctx, D.wrap((h.known || []).length + ' in the book', w - 42)[0], x + 38, y + 33, P('accent', 2));
    });
    // the rung's fight
    var bx = 240, bw = D.W - bx - 6;
    box(ctx, bx, 30, bw, 128, P('gold', 3));
    D.text(ctx, 'LEVEL ' + s.level + '  ·  THE FIGHT DRAWN', bx + 6, 35, P('gold', 4));
    var ty = 47, put = function (txt, col) { D.wrap(txt, bw - 12).forEach(function (l) { if (ty < 150) D.text(ctx, l, bx + 6, ty, col); ty += 9; }); };
    if (F) {
      put('{y}' + F.name + '{/}  ' + (F.sub || ''), P('bone', 1)); ty += 2;
      put(F.intro || '', P('bone', 2)); ty += 2;
      var cnt = {}; (F.foes || D.MAPS[F.map].foes).forEach(function (f) { var nm = D.FOES[f.kind] ? D.FOES[f.kind].name : f.kind; cnt[nm] = (cnt[nm] || 0) + 1; });
      put('foes: ' + Object.keys(cnt).map(function (n) { return (cnt[n] > 1 ? cnt[n] + ' ' : '') + n; }).join(', '), P('red', 4));
    }
    // the choices
    box(ctx, bx, 164, bw, 52, P('stone', 3));
    this.rects = [];
    this.rows().forEach(function (r, i) {
      var rr = { x: bx + 3, y: 168 + i * 14, w: bw - 6, h: 13 };
      self.rects.push(rr);
      if (i === self.sel) { ctx.fillStyle = P('gold', 1); ctx.fillRect(rr.x, rr.y, rr.w, rr.h); }
      D.text(ctx, r.label, rr.x + 5, rr.y + 3, i === self.sel ? P('gold', 4) : P('bone', 1));
    });
    D.text(ctx, 'A win: level up, your picks.  All four down: back to the bottom.  One gets out the way in: back to the campfire.', D.W / 2, 226, P('stone', 5), 'center');
    D.hint(ctx, 'up/down choose  ·  E pick  ·  in a fight, LEAVE THE FIGHT from the squares you came in by', D.W / 2, D.H - 12, P('stone', 5), 'center');
    if (this.card) {
      var c = this.card, cw = 330, wl = [];
      c.lines.forEach(function (l) { wl = wl.concat(D.wrap(l, cw - 16)); });
      var ch = wl.length * 10 + 16, cx = (D.W - cw) / 2, cy = Math.max(10, (D.H - ch) / 2), y0 = cy + 8;
      box(ctx, cx, cy, cw, ch, P('gold', 4));
      wl.forEach(function (w, i) { D.text(ctx, w, D.W / 2, y0 + i * 10, P('bone', 1), 'center'); });
    }
  };

  // ------------------------------------------------------------------ the level-up: the four's picks, one list at a time
  function LevelUp(s, done) { this.s = s; this.done = done; this.t = 0; }
  D.LevelUp = LevelUp;
  LevelUp.prototype.opaque = true;
  LevelUp.prototype.enter = function () {
    var q = this.queue = [], picks = this.picks = {};
    this.s.party.forEach(function (h) { picks[h.id] = {}; CL.choices(h).forEach(function (c) { q.push({ hero: h.id, c: c }); }); });
    this.i = 0; this.sel = 0; this.top = 0; this.temp = []; this.split = false; this.summary = null;
    D.sfx('levelup');
    if (!q.length) this.apply();
  };
  LevelUp.prototype.hero = function (id) { return this.s.party.filter(function (h) { return h.id === id; })[0]; };
  LevelUp.prototype.apply = function () {
    var self = this;
    this.summary = [];
    this.s.party.forEach(function (h) { self.summary = self.summary.concat(CL.levelUp(h, self.picks[h.id] || {})); });
  };
  // the current step's list
  LevelUp.prototype.list = function () {
    var R = DS.R, st = this.queue[this.i], self = this;
    if (!st) return { title: '', rows: [] };
    var h = this.hero(st.hero), c = st.c, n = h.lvl + 1, d = DS.DATA.heroes[h.id];
    if (c.kind === 'asi') {
      if (this.split) return { title: h.name.toUpperCase() + ': +1 TO TWO (' + this.temp.length + ' of 2)', rows: ABIL.map(function (k) {
        var on = self.temp.indexOf(k) >= 0;
        return { label: (on ? '[x] ' : '[ ] ') + k.toUpperCase() + '  ' + h.abil[k] + ' -> ' + Math.min(20, h.abil[k] + 1), ok: h.abil[k] < 20, why: 'already 20', act: function () { self.toggle(k, 2, function (t) { var a = {}; t.forEach(function (x) { a[x] = 1; }); return { asi: a }; }); } };
      }) };
      return { title: h.name.toUpperCase() + ', LEVEL ' + n + ': ABILITY SCORE INCREASE', rows: ABIL.map(function (k) {
        return { label: '+2 ' + k.toUpperCase() + '  ' + h.abil[k] + ' -> ' + Math.min(20, h.abil[k] + 2), ok: h.abil[k] < 20, why: 'already 20', act: function () { var a = {}; a[k] = 2; self.take({ asi: a }); } };
      }).concat([{ label: '+1 to two scores', act: function () { self.split = true; self.temp = []; self.sel = 0; } }]), desc: 'The SRD 5.1 feat (Grappler) is not built; feats of our own come later.' };
    }
    if (c.kind === 'archetype') return { title: h.name.toUpperCase() + ', LEVEL 3: HER ARCHETYPE', rows: (d.archetypes || []).map(function (a) {
      return { label: a.name, desc: a.desc, act: function () { self.take({ archetype: a.name }); } };
    }) };
    if (c.kind === 'expertise') {
      var have = (d.expertise || []).concat(h.expertise || []);
      return { title: h.name.toUpperCase() + ', LEVEL 6: EXPERTISE (' + this.temp.length + ' of 2)', rows: Object.keys(h.skills || {}).filter(function (k) { return have.indexOf(k) < 0; }).map(function (k) {
        var on = self.temp.indexOf(k) >= 0;
        return { label: (on ? '[x] ' : '[ ] ') + k, desc: 'Her proficiency counts twice for ' + k + '.' + (k === 'Stealth' ? ' (HIDE reads Stealth.)' : ''), act: function () { self.toggle(k, 2, function (t) { return { expertise: t.slice() }; }); } };
      }), desc: 'Two skills she is proficient in: her proficiency counts twice for them.' };
    }
    if (c.kind === 'spells' || c.kind === 'cantrip') {
      var h2 = JSON.parse(JSON.stringify(h)); h2.lvl = n;
      var top = R.slotsFor(h2).length, src = c.kind === 'cantrip' ? CANTRIPS : WIZARD;
      return { title: h.name.toUpperCase() + ', LEVEL ' + n + ': ' + (c.kind === 'cantrip' ? 'A CANTRIP' : 'TWO SPELLS FOR THE BOOK') + ' (' + this.temp.length + ' of ' + c.n + ')', rows: src.filter(function (id) {
        var sp = SV.spell(id); return sp && (c.kind === 'cantrip' ? !sp.level : sp.level && sp.level <= top) && (h.known || []).indexOf(id) < 0;
      }).map(function (id) {
        var sp = SV.spell(id), g = D.SPELLS[id], on = self.temp.indexOf(id) >= 0, built = !!g && g.why !== 'not on the grid yet';
        return { label: (on ? '[x] ' : '[ ] ') + sp.name, right: (sp.level ? 'L' + sp.level : 'cantrip') + (!built ? '  not built yet' : g.shape === 'none' ? '  no use in a fight' : ''), ok: built, why: 'not on the grid yet', desc: D.typeText(sp.desc),
          act: function () { self.toggle(id, c.n, function (t) { var o = {}; o[c.kind === 'cantrip' ? 'cantrip' : 'spells'] = t.slice(); return o; }); } };
      }) };
    }
    return { title: '', rows: [] };
  };
  // a pick made: note it, and on to the next step (or apply them all)
  LevelUp.prototype.take = function (p) {
    var st = this.queue[this.i];
    Object.assign(this.picks[st.hero], p);
    this.i++; this.sel = 0; this.top = 0; this.temp = []; this.split = false;
    D.sfx('confirm');
    if (this.i >= this.queue.length) this.apply();
  };
  LevelUp.prototype.toggle = function (x, n, make) {
    var i = this.temp.indexOf(x);
    if (i >= 0) { this.temp.splice(i, 1); D.sfx('cancel'); return; }
    this.temp.push(x); D.sfx('cursor');
    if (this.temp.length >= n) this.take(make(this.temp));
  };
  var PX = 244, PY = 30, PW = D.W - 244 - 6, ROW = 11, VIS = 13;
  LevelUp.prototype.update = function () {
    this.t++;
    var m = I.mouse;
    if (this.summary) { if (I.pressed('a') || m.click) { D.sfx('confirm'); D.pop(); this.done(); } return; }
    var L = this.list(), n = L.rows.length, s0 = this.sel, hit = -1;
    if (n) { if (I.repeat('up')) this.sel = (this.sel + n - 1) % n; if (I.repeat('down')) this.sel = (this.sel + 1) % n; }
    if (m.inside && this.rects) this.rects.forEach(function (r) { if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) hit = r.i; });
    if (m.moved && hit >= 0) this.sel = hit;
    if (this.sel !== s0) D.sfx('cursor');
    if (this.sel < this.top) this.top = this.sel;
    if (this.sel >= this.top + VIS) this.top = this.sel - VIS + 1;
    var row = L.rows[this.sel];
    if (I.pressed('a') || (m.click && hit >= 0)) {
      if (!row) return;
      if (row.ok === false) { D.sfx('error'); return; }
      row.act(); return;
    }
    // X: take back a half-made pick
    if (I.pressed('b')) { if (this.temp.length) { this.temp.pop(); D.sfx('cancel'); } else if (this.split) { this.split = false; this.sel = 0; D.sfx('cancel'); } }
  };
  LevelUp.prototype.draw = function (ctx) {
    var R = DS.R, self = this, st = this.queue[this.i];
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    ctx.save(); ctx.translate(6, 5); ctx.scale(2, 2); D.text(ctx, 'LEVEL UP', 0, 0, P('gold', 4)); ctx.restore();
    var lv = this.s.party[0].lvl;
    D.text(ctx, 'the climb  ·  ' + (this.summary ? 'level ' + lv : 'level ' + lv + ' -> ' + (lv + 1)) + '  ·  your picks', 104, 9, P('silver', 5));
    if (this.summary) {
      box(ctx, 16, 28, D.W - 32, 214, P('gold', 3));
      var y = 36;
      this.summary.forEach(function (l) { D.wrap(l, D.W - 50).forEach(function (w) { if (y < 232) D.text(ctx, w, 24, y, P('bone', 1)); y += 9; }); });
      D.hint(ctx, '{g}E on to the next rung{/}', D.W / 2, D.H - 14, P('accent', 2), 'center');
      return;
    }
    // the four, the one choosing lit
    this.s.party.forEach(function (h, i) {
      var x = 6, y = 30 + i * 56, on = st && st.hero === h.id, left = self.queue.slice(self.i).filter(function (q) { return q.hero === h.id; }).length;
      box(ctx, x, y, 232, 53, on ? P('gold', 4) : P('stone', 3));
      ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, 32, 47); ctx.clip();
      var sheet = SV.look(h.id, null).sheet || h.id + '_p0';
      D.spr.draw(ctx, sheet, 'idle', 0, self.t, x + 19, y + Math.min(D.spr.top(sheet), 46) + 3, {});
      ctx.restore();
      D.text(ctx, '{y}' + h.name + '{/}  ' + h.cls + ' ' + h.lvl + ' -> ' + (h.lvl + 1), x + 40, y + 4, P('bone', 1));
      D.text(ctx, abils(h), x + 40, y + 15, P('silver', 5));
      var c = R.CLASSES[h.cls];
      D.text(ctx, 'HP ' + h.maxhp + ' -> ' + (h.lvl + 1) * Math.max(1, c.hd + DS.mod(h.abil.con)) + ' (a max hit die)', x + 40, y + 26, P('moss', 2));
      D.text(ctx, left ? left + ' pick' + (left > 1 ? 's' : '') + ' to make' : '{g}nothing to choose this level{/}', x + 40, y + 37, P('accent', 2));
    });
    var L = this.list();
    box(ctx, PX, PY, PW, 224, P('gold', 3));
    D.text(ctx, D.wrap(L.title, PW - 12)[0], PX + 6, PY + 5, P('gold', 4));
    this.rects = [];
    L.rows.slice(this.top, this.top + VIS).forEach(function (r, j) {
      var i = self.top + j, ry = PY + 18 + j * ROW, rr = { x: PX + 3, y: ry - 1, w: PW - 6, h: ROW, i: i };
      self.rects.push(rr);
      if (i === self.sel) { ctx.fillStyle = P('gold', 1); ctx.fillRect(rr.x, rr.y, rr.w, rr.h); }
      var dim = r.ok === false;
      D.text(ctx, r.label, PX + 7, ry + 1, dim ? P('stone', 5) : i === self.sel ? P('gold', 4) : P('bone', 1));
      if (r.right) D.text(ctx, r.right, PX + PW - 7, ry + 1, dim ? P('stone', 4) : P('stone', 6), 'right');
    });
    var row = L.rows[this.sel], desc = row && row.desc ? row.desc : L.desc || '';
    D.wrap(desc, PW - 12).slice(0, 7).forEach(function (l, j) { D.text(ctx, l, PX + 6, PY + 164 + j * 8, P('bone', 2)); }); // (seven lines from just under the rows: five cut a long spell's words on a phone)
    D.hint(ctx, 'up/down choose  ·  E pick  ·  X take a pick back', D.W / 2, D.H - 10, P('stone', 5), 'center');
  };
})();
