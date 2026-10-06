/* DRAGONSLEEP — Find Familiar in the 8-bit game (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet - let's reinstate").
   The ritual is cast from the field menu's MAGIC, from the book (no slot), burning a bundle of Calling Herbs (500 sp, Mama's only:
   RULED 09-29), and the shape is picked from what lives on the ground you stand on (js/rules.js R.famForms: "select by biome").
   A new casting while it serves gives it a new shape. Canon: Aurdin's familiar is "undecided until he does the ritual in story"
   (wiki/aurdin.md, CANON 09-10) -- this is that ritual, and the player's pick is his.
   In an 8-bit fight it rides the wizard's shoulder (RULED 09-29): "First ally to attack after wizards turn if the wizard doesn't
   attack" has advantage -- and if he does attack, his own first attack roll that turn has it; no new choice in the combat menu. The
   foes never pick it, but a blast that catches the wizard catches it, "even if wizard saves". The grid's familiar (a figure of its
   own) is deep16/js/familiar.js. Lines are looked up from content/text.json ('fam.*'). */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, W8 = DS.W8, EV = DS.EV, L = DS.L;
  function G() { return DS.G; }
  function F() { return DS.field; }
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }

  // the shapes a spirit may take here: the world map's ground under the party, else the caves or the town
  function formsHere() {
    var g = G(), f = F(), src = f && f.map && f.map.src;
    if (!src) return ['owl'];
    if (src.id === 'world') { var row = src.rows[g.y] || '', t = row.charAt(g.x); return R.famForms(t, 'world'); }
    return R.famForms(null, src.tileset === 'town' || src.tileset === 'inside' ? 'town' : 'cave');
  }

  var baseCast = EV.fieldCast;
  EV.fieldCast = function* (h, sp, t0) { // (t0: the menu's panel's pick, passed on -- 10-06)
    if (sp.kind !== 'familiar') { yield* baseCast(h, sp, t0); return; }
    var g = G(), fl = g.flags.familiar, had = fl && fl.by === h.id ? fl : null;
    if (had) {
      yield DS.say(L('fam.keep', { name: h.name, form: R.FAMILIARS[had.kind].name }));
      var go = yield DS.choose({ items: [{ label: 'A NEW SHAPE', value: 'y' }, { label: 'LEAVE IT', value: 'n' }], x: 60, y: 60, w: 150, title: 'A NEW SHAPE?' });
      if (go !== 'y') return;
    }
    if (sp.component && g.count(sp.component) < 1) { yield DS.say(L('g.noComponent', { item: DS.DATA.items[sp.component].name })); return; }
    var forms = formsHere().filter(function (k) { return R.FAMILIARS[k]; });
    var items = forms.map(function (k) { return { label: R.FAMILIARS[k].name.toUpperCase(), right: R.FAMILIARS[k].hp + ' HP', value: k }; });
    var pick = yield DS.choose({ items: items, x: 60, y: 50, w: 150, title: 'WHAT SHAPE?',
      drawExtra: function (ctx, menu) { var c = menu.current() && menu.current().value; if (!c || !R.FAMILIARS[c]) return; DS.win(ctx, 4, 196, 248, 40); DS.wrap(R.FAMILIARS[c].gift, 236).slice(0, 3).forEach(function (l, i) { DS.text(ctx, l, 10, 203 + i * 10, '#E0C8A0'); }); } });
    if (!pick) return;
    if (sp.component) g.take(sp.component, 1);
    yield DS.say(L('fam.ritual'));
    yield DS.fade(1, 20); yield W8.frames(40); yield DS.fade(0, 20);
    g.flags.familiar = { kind: pick, by: h.id, hp: R.FAMILIARS[pick].hp };
    delete g.flags.familiarGone;
    DS.audio.sfx('magic');
    yield DS.say(had ? L('fam.change', { name: h.name, old: R.FAMILIARS[had.kind].name, a: an(R.FAMILIARS[pick].name) })
                     : L('fam.come', { name: h.name, a: an(R.FAMILIARS[pick].name) }));
  };

  // ---------------------------------------------------------------- the 8-bit fight: on the wizard's shoulder
  var B = DS.Battle.prototype;
  function famFor(u) { var f = G().flags.familiar; return f && u && u.h && !u.guest && u.h.id === f.by ? f : null; }
  function downed(u) { return u.h ? (u.h.ko || u.h.hp <= 0) : u.dead; }
  // the one question js/battle.js advantage() asks: does the familiar's help land on this roll?
  B.famHelps = function (a, t) {
    var f = G().flags.familiar; if (!f || !a || !a.h) return false;
    if (this.famTurn && a === this.famTurn) { if (this.famAttacked) return false; this.famAttacked = true; return true; } // (his own first attack)
    if (this.famPending && a.h.id !== f.by) { this.famPending = false; return true; }                                  // (the first ally after him)
    return false;
  };
  var baseHero = B.heroTurn;
  B.heroTurn = function* (u) {
    var f = famFor(u);
    if (f) { this.famTurn = u; this.famAttacked = false; this.famPending = false; } // (a help not taken lapses at his next turn: SRD Help)
    yield* baseHero.call(this, u);
    if (f && this.famTurn === u) {
      this.famTurn = null;
      if (!this.famAttacked && !downed(u) && !this.over && G().flags.familiar) {
        this.famPending = true;
        yield* this.say(L('fam.darts', { name: u.h.name, form: R.FAMILIARS[f.kind].name }), 34);
      }
    }
  };
  // a blast that catches the wizard catches it, whatever his save (js/battle.js asks this after each one caught)
  B.famSplash = function* (t, dmg) {
    var f = famFor(t); if (!f || !dmg) return;
    var form = R.FAMILIARS[f.kind].name;
    f.hp = (f.hp == null ? R.FAMILIARS[f.kind].hp : f.hp) - dmg;
    if (f.hp > 0) { yield* this.say(L('fam.buffeted', { name: t.h.name, form: form }), 30); return; }
    delete G().flags.familiar; G().flags.familiarGone = f.kind; this.famPending = false;
    yield* this.say(L('fam.caught', { name: t.h.name, form: form }), 40);
  };

  // ---------------------------------------------------------------- the perks (RULED 09-30, Griz: "rat grants nightvision, spider
  // buffs web spell and gives 'webwalk' ... snake sense hidden within 15 feet (counts as vision)" · "EXCELLENT call on the frog. will
  // need audible." · "Snake still charm related spells, diplomacy and persuasion checks by caster"). A perk is its CASTER's: the hero
  // the spirit rides with (flags.familiar.by), while he is in the party. The values are R.FAMILIARS[kind].perk (js/rules.js). The
  // 8-bit has no ranges, so a distance (darkvision 30, sonar 15, senseHidden 15) is simply "yes" here.
  DS.famPerk = function (heroId, key) {
    var g = G(), f = g && g.flags && g.flags.familiar, form = f && R.FAMILIARS[f.kind];
    if (!form || !heroId || f.by !== heroId || !g.party.some(function (h) { return h.id === heroId; })) return null;
    var v = form.perk && form.perk[key];
    return v == null ? null : v;
  };
  // the rat's eyes (darkvision) and the bat's ears (sonar, any dark): he sees in the dark without a light (R.darkvision is the 16-bit's, left alone)
  var baseSees = B.seesDark;
  B.seesDark = function (u) { return baseSees.call(this, u) || !!(u && u.h && (DS.famPerk(u.h.id, 'darkvision') || DS.famPerk(u.h.id, 'sonar'))); };
  // + to the save DC of the spell u casts: the spider's Web (webDC), the snake's charms (charmDC; R.CHARM_SPELLS). js/battle.js castSpell asks
  B.famDC = function (u, sp) {
    if (!u || !u.h || !sp) return 0;
    var n = 0;
    if (sp.id === 'web') n += DS.famPerk(u.h.id, 'webDC') || 0;
    if (sp.cond === 'charmed' || (R.CHARM_SPELLS || []).indexOf(sp.id) >= 0) n += DS.famPerk(u.h.id, 'charmDC') || 0;
    return n;
  };
  // the frog's warning: its caster is never surprised (js/battle.js: he acts in round 1 and no ambush crits him) ...
  B.famAlarm = function (u) { return !!(u && u.h && DS.famPerk(u.h.id, 'alarm')); };
  // ... and it croaks as the fight opens (audible: DS.audio.sfx('croak'))
  B.famCroak = function* () {
    var f = G().flags.familiar, self = this;
    var who = f && this.heroes.filter(function (u) { return famFor(u) && !downed(u) && self.famAlarm(u); })[0];
    if (!who) return;
    DS.audio.sfx('croak');
    yield* this.say(L('fam.croak', { name: who.h.name, form: R.FAMILIARS[f.kind].name }), 40);
  };
  // the spider's walk: a foe's web does not hold its caster (js/battle.js special 'web' asks; true = he was spared, the line said)
  B.famWebWalk = function* (t) {
    var f = G().flags.familiar;
    if (!f || !t || !t.h || !DS.famPerk(t.h.id, 'webWalker')) return false;
    yield* this.say(L('fam.webwalk', { name: t.h.name, form: R.FAMILIARS[f.kind].name }), 34);
    return true;
  };
  // (the snake's senseHidden and Persuasion 'adv' are asked in place: js/battle.js advantage() and js/deep.js EV.check)

  // ---------------------------------------------------------------- and it is drawn (09-29). Griz: "owl on shoulder, others by
  // feet in 8-bit (can look horrible!)". So the owl and the snowy owl perch on the wizard's back shoulder (the party faces left, so
  // that is the side away from the foes), and the rest sit at his heel -- but the bat (09-30, Griz: "have it flutter around his head
  // both versions", "correct" to the 8-bit) goes in a slow figure of eight about his head, its two frames flapping. It goes where he
  // goes: his step forward to act, his lean when hurt, the shake of a hit. It is not drawn while he is down, nor once flags.familiar is gone.
  // And when its help is about to land on a roll it goes to the target first and comes home (09-30, Griz: "fly from aurdin to target
  // before allies attack lands"; "after aurdin picked a spell to attack with but before the spell went off"): the owls and the bat fly
  // in an arc, the rat, spider, frog and snake run the ground line.
  var INK = '#101018';
  // the seven forms: rows of pixels ('.' is clear) and a colour for each letter; two frames (a blink, a wing flick, a tail twitch,
  // a tongue); `every` is [period, frames] for how long frame two shows; `edge` is the ink outline (the dark two need none)
  var FAMART = {
    owl: { perch: 1, wing: '#B07838', edge: 1, every: [150, 7], map: { b: '#B07838', p: '#F0D8A8', y: '#F8B800', e: INK }, rows: [
      ['b.....b', 'bbbbbbb', 'bpepepb', 'bppyppb', 'bbpppbb', '.bpbpb.'],
      ['b.....b', 'bbbbbbb', 'bpbpbpb', 'bppyppb', 'bbpppbb', '.bpbpb.']] },
    snowyowl: { perch: 1, wing: '#F8F8F8', edge: 1, every: [170, 7], map: { w: '#F8F8F8', s: '#787878', y: '#F8B800', e: INK }, rows: [
      ['w.....w', 'wwswsww', 'wweweww', 'wweyeww', 'wswwwsw', '.wwswsw'],
      ['w.....w', 'wwswsww', 'wwwwwww', 'wwsysww', 'wswwwsw', '.wwswsw']] },
    bat: { head: 1, flutter: 1, every: [70, 10], map: { m: '#7A5C9A', k: '#3A2A52', r: '#F85838' }, rows: [
      ['m..k.k..m', 'mm.kkk.mm', 'mmmkrkmmm', 'mmmkkkmmm', 'm.m.m.m.m'],
      ['m.......m', 'mm.k.k.mm', '.mmkrkmm.', '..mmkmm..', '...mmm...']] },
    rat: { edge: 1, every: [80, 10], map: { g: '#A8A8B0', p: '#F8A4C0', e: INK }, rows: [
      ['..gp......', '.ggggg....', 'pegggggg..', '.gggggggpp', '..p.p.p...'],
      ['..gp......', '.ggggg....', 'pegggggg.p', '.ggggggggp', '..p.p.p...']] },
    spider: { every: [64, 32], map: { k: '#1A1418', l: '#5A5A6E', r: '#E40058' }, rows: [
      ['l..k.k..l', '.l.kkk.l.', 'llkkkkkll', '.l.krk.l.', 'l..kkk..l'],
      ['.l.k.k.l.', 'l..kkk..l', '.lkkkkkl.', 'l..krk..l', '.l.kkk.l.']] },
    frog: { edge: 1, every: [64, 32], map: { g: '#28A828', d: '#006000', p: '#B8F818', e: INK }, rows: [
      ['.ge......', 'ggggg....', 'pggggggg.', '.pgggdddg', '..gg.dddd'],
      ['.ge......', 'ggggg....', 'pggggggg.', 'ppgggdddg', '..gg.dddd']] },
    snake: { edge: 1, every: [90, 8], map: { g: '#7A9A30', d: '#3A5A18', t: '#F83800', e: INK }, rows: [
      ['.ggg....', '.geg....', '..ggg...', '.gggggg.', 'gdgdgdgg', '.gggggg.'],
      ['.ggg....', 'tgeg....', '..ggg...', '.gggggg.', 'gdgdgdgg', '.gggggg.']] }
  };
  // built once, on first sight, with the game's own Pix (js/art.js)
  var famCache = {};
  // (the drawn forms face left, toward the foes; `flip` is the same figure facing right, for the way home from a flight)
  function famArt(kind, frame, flip) {
    var a = FAMART[kind]; if (!a) return null;
    var key = kind + frame + (flip ? 'f' : ''), c = famCache[key];
    if (!c) {
      if (flip) {
        var src = famArt(kind, frame, false); c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
        var fx = c.getContext('2d'); fx.translate(src.width, 0); fx.scale(-1, 1); fx.drawImage(src, 0, 0);
        return (famCache[key] = c);
      }
      var rows = a.rows[frame], w = 0, pad = a.edge ? 1 : 0; rows.forEach(function (r) { w = Math.max(w, r.length); });
      var p = new DS.Pix(w + pad * 2, rows.length + pad * 2).rows(rows, a.map, pad, pad); if (a.edge) p.outline(INK);
      c = famCache[key] = p.canvas();
    }
    return c;
  }
  // where a hero's figure moves in each pose (js/sprites.js BATTLE: the act stance is a step wide, the hurt one leans back and sinks)
  var FAMPOSE = { perch: { act: [-1, 0], hurt: [2, 1] }, heel: { act: [3, 0], hurt: [2, 0] } };
  function heroPose(u) {
    var h = u.h, weak = u.conds.paralyzed || u.conds.asleep || u.conds.stunned;
    return u.pose ? u.pose : (h.hp < h.maxhp / 4 || weak) ? 'hurt' : 'stand';
  }
  // the sprite's top-left where it rests: on the shoulder's top edge against his neck; the bat about his head (his head sits near
  // x+7, y+6 in the 16x24 figure); the rest on the ground behind his heel. `sx` is the battle's shake
  function restAt(bt, u, art, c, sx, pose) {
    var o = FAMPOSE[art.perch || art.head ? 'perch' : 'heel'][pose] || [0, 0];
    var x = u.x - (bt.active === u ? (u.off || 0) : 0) + sx + o[0], y = u.y + o[1];
    if (art.head) { var tt = DS.frame / 24; return [x + 7 + Math.round(Math.sin(tt) * 8) - (c.width >> 1), y + 1 + Math.round(Math.sin(tt * 2) * 4) - (c.height >> 1)]; }
    if (art.perch) return [x + 13 - (c.width >> 1), y + 12 - c.height];
    return [x + 11, y + 24 - c.height];
  }
  function idleFrame(art) { return art.flutter ? (DS.frame >> 2) & 1 : (DS.frame % art.every[0]) < art.every[1] ? 1 : 0; }

  // the help flight (09-30): out to the target, a beat there, home. 38 frames in all
  var OUT = 14, STAY = 10, BACK = 14, FLIES = { owl: 1, snowyowl: 1, bat: 1 };
  function ease(q) { q = q < 0 ? 0 : q > 1 ? 1 : q; return q * q * (3 - 2 * q); }
  function flightAt(n) { return n < OUT ? ease(n / OUT) : n < OUT + STAY ? 1 : ease(1 - (n - OUT - STAY) / BACK); }
  // a pure peek at B.famHelps: would the help land on attacker a's next roll? (nothing is consumed; js/battle.js asks it before the roll)
  B.famWill = function (a) {
    var f = G().flags.familiar; if (!f || !a || !a.h) return false;
    if (this.famTurn && a === this.famTurn) return !this.famAttacked;   // (his own first attack)
    return !!(this.famPending && a.h.id !== f.by);                      // (the first ally after him)
  };
  // the flight itself: the frames pass here while draw() moves the sprite (this.famFlight); the roll follows, and advantage() takes the help
  B.famFly = function* (a, t) {
    var f = G().flags.familiar;
    var wiz = f && this.heroes.filter(function (x) { return famFor(x); })[0];
    if (!wiz || !t || downed(wiz) || wiz.conds.engulfed || !FAMART[f.kind] || this.intro > 0 || this.bats) return;
    var fl = this.famFlight = { u: wiz, t: t, n: 0, kind: f.kind };
    try { for (; fl.n < OUT + STAY + BACK; fl.n++) yield this.wait(1); }
    finally { if (this.famFlight === fl) this.famFlight = null; }
  };
  function drawFlight(ctx, bt, u, fl, art, sx, pose) {
    var n = fl.n, p = flightAt(n), moving = n < OUT || n >= OUT + STAY, home = n >= OUT + STAY, flies = !!FLIES[fl.kind];
    var c = famArt(fl.kind, moving ? (DS.frame >> 2) & 1 : idleFrame(art), home);   // (going out it faces the foes; coming home, the party)
    var from = restAt(bt, u, art, c, sx, pose), t = fl.t, tx, ty, tw, th;
    if (t.side === 'hero') { tx = t.x + sx; ty = t.y; tw = 16; th = 24; }
    else { tx = t.x + sx + (t.off || 0); ty = t.y; tw = t.art.w; th = t.art.h; }
    // the goal: in front of the target's near edge; a flier at the height of its head, a runner on its ground line
    var gx = tx + tw - (c.width >> 1), gy = flies ? ty + Math.round(th * 0.3) - (c.height >> 1) : ty + th - c.height;
    var x = from[0] + (gx - from[0]) * p, y = from[1] + (gy - from[1]) * p;
    if (flies) { y -= Math.sin(Math.PI * p) * 14; if (!moving) y += (DS.frame >> 3) & 1; }                       // (an arc; a hover at the end)
    else if (moving && p > 0 && p < 1) {
      if (fl.kind === 'frog') y -= Math.abs(Math.sin(p * Math.PI * 3)) * 5;                                      // (hops)
      else if (fl.kind === 'snake') y += Math.round(Math.sin(n * 0.9));                                          // (a slither)
      else y -= (DS.frame >> 1) & 1;                                                                             // (a scurry)
    }
    x = Math.round(x); y = Math.max(31, Math.min(155 - c.height, Math.round(y)));                               // (never over the banner or the panels)
    if (art.wing && moving) { // (the owls' wings, drawn under the body)
      var wy = ((DS.frame >> 2) & 1) ? y : y + 4;
      ctx.fillStyle = INK; ctx.fillRect(x - 4, wy - 1, 5, 4); ctx.fillRect(x + c.width - 1, wy - 1, 5, 4);
      ctx.fillStyle = art.wing; ctx.fillRect(x - 3, wy, 4, 2); ctx.fillRect(x + c.width - 1, wy, 4, 2);
    }
    ctx.drawImage(c, x, y); fl.at = [x, y]; // (where it was last drawn: the bench reads it)
  }
  var baseDraw = B.draw;
  B.draw = function (ctx) {
    var fam = G().flags.familiar, jit = null, rint = DS.rint;
    // (the battle's shake takes its jitter as the first roll of the frame; note it, so the familiar shakes with the hero)
    if (fam && this.shake) DS.rint = function () { var v = rint.apply(DS, arguments); if (jit === null) jit = v; return v; };
    try { baseDraw.apply(this, arguments); } finally { DS.rint = rint; }
    if (!fam || !FAMART[fam.kind] || this.intro > 0 || this.bats) return;
    var self = this, art = FAMART[fam.kind], sx = jit === null ? 0 : (jit - 1) * 2;
    this.heroes.forEach(function (u) {
      if (!famFor(u) || downed(u) || u.conds.engulfed) return;
      var pose = heroPose(u);
      if (pose === 'ko') return;
      if (self.famFlight && self.famFlight.u === u) { drawFlight(ctx, self, u, self.famFlight, art, sx, pose); return; }   // (in flight: not on its perch)
      var c = famArt(fam.kind, idleFrame(art)), at = restAt(self, u, art, c, sx, pose);
      ctx.drawImage(c, at[0], at[1]); self.famAt = at; // (where it was last drawn: the bench reads it)
    });
  };
})();
