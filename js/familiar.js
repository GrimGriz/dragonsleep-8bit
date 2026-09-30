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
  EV.fieldCast = function* (h, sp) {
    if (sp.kind !== 'familiar') { yield* baseCast(h, sp); return; }
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

  // ---------------------------------------------------------------- and it is drawn (09-29). Griz: "owl on shoulder, others by
  // feet in 8-bit (can look horrible!)". So the owl and the snowy owl perch on the wizard's back shoulder (the party faces left, so
  // that is the side away from the foes), and the bat, rat, spider, frog and snake sit at his heel. It goes where he goes: his step
  // forward to act, his lean when hurt, the shake of a hit. It is not drawn while he is down, nor once flags.familiar is gone.
  var INK = '#101018';
  // the seven forms: rows of pixels ('.' is clear) and a colour for each letter; two frames (a blink, a wing flick, a tail twitch,
  // a tongue); `every` is [period, frames] for how long frame two shows; `edge` is the ink outline (the dark two need none)
  var FAMART = {
    owl: { perch: 1, edge: 1, every: [150, 7], map: { b: '#B07838', p: '#F0D8A8', y: '#F8B800', e: INK }, rows: [
      ['b.....b', 'bbbbbbb', 'bpepepb', 'bppyppb', 'bbpppbb', '.bpbpb.'],
      ['b.....b', 'bbbbbbb', 'bpbpbpb', 'bppyppb', 'bbpppbb', '.bpbpb.']] },
    snowyowl: { perch: 1, edge: 1, every: [170, 7], map: { w: '#F8F8F8', s: '#787878', y: '#F8B800', e: INK }, rows: [
      ['w.....w', 'wwswsww', 'wweweww', 'wweyeww', 'wswwwsw', '.wwswsw'],
      ['w.....w', 'wwswsww', 'wwwwwww', 'wwsysww', 'wswwwsw', '.wwswsw']] },
    bat: { every: [70, 10], map: { m: '#7A5C9A', k: '#3A2A52', r: '#F85838' }, rows: [
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
  function famArt(kind, frame) {
    var a = FAMART[kind]; if (!a) return null;
    var key = kind + frame, c = famCache[key];
    if (!c) {
      var rows = a.rows[frame], w = 0, pad = a.edge ? 1 : 0; rows.forEach(function (r) { w = Math.max(w, r.length); });
      var p = new DS.Pix(w + pad * 2, rows.length + pad * 2).rows(rows, a.map, pad, pad); if (a.edge) p.outline(INK);
      c = famCache[key] = p.canvas();
    }
    return c;
  }
  // where a hero's figure moves in each pose (js/sprites.js BATTLE: the act stance is a step wide, the hurt one leans back and sinks)
  var FAMPOSE = { perch: { act: [-1, 0], hurt: [2, 1] }, heel: { act: [3, 0], hurt: [2, 0] } };
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
      var h = u.h, weak = u.conds.paralyzed || u.conds.asleep || u.conds.stunned;
      var pose = u.pose ? u.pose : (h.hp < h.maxhp / 4 || weak) ? 'hurt' : 'stand';
      if (pose === 'ko') return;
      var c = famArt(fam.kind, (DS.frame % art.every[0]) < art.every[1] ? 1 : 0), o = FAMPOSE[art.perch ? 'perch' : 'heel'][pose] || [0, 0];
      var x = u.x - (self.active === u ? (u.off || 0) : 0) + sx + o[0], y = u.y + o[1];
      if (art.perch) ctx.drawImage(c, x + 13 - (c.width >> 1), y + 12 - c.height);   // (on the shoulder's top edge, against his neck)
      else ctx.drawImage(c, x + 11, y + 24 - c.height);                              // (on the ground, behind his heel)
    });
  };
})();
