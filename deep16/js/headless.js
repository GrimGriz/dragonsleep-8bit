/* DEEP16 — THE HEADLESS FIGHT (11-13, the lanes desk): two of the Snoot's groups fought on the grid with nobody at the pad, on a field with no map.
   Griz: "The 3 hexes are the snoot positions on the snoot board, we zoom into an invisible grid that has no 'map' - the group 'charging' on the other via snoot
   movements get a 'charge' movement (or something). Then the fight runs headless and is communicated to the player translated into simultaneous turns per side, with
   special effects from spells and stuff - as if it was a 'simple' fight..."; the field, "more like their ranks at 60' to 90 feet - so 75 to 105 feet apart"; the
   bodies, "grab appropriate substitutes from 'humanoid' store in pocket DM list"; "we'll have to add some version of morale checks for the headless fight and allow
   escape endings I think"; "we're experimenting if we prefer this to replace chainmail table"; and "we'll need a janky head for me to watch the headless fights we're
   happy with" (the door, below).
   What is here: the bodies (H.BODY, H.listOf: a Snoot unit as a list of the grid's words); the field (flat earth made to the two groups' ranks, three squares round
   them, the front ranks 75 to 105 ft apart by the seed); the two groups each run by the grid's own AI (a class or a named one by its class turn, a creature of the
   bestiary by the brute's, as a fight's lent ally is); the fight's own ending (H.over: a group with nobody standing has lost it); morale (H.morale: the seat's
   draft, his to change); H.run, the whole fight unseen and what it came to; H.door, the same fight on the screen to be watched.
   Not here yet: the playback (a beat a side a round), the charge, more sides than two, and the Snoot's own page asking for one. */
'use strict';
(function () {
  var D = window.D16, H = D.headless = {};
  H.FIELD = 'headless-field';
  H.FILES = 8;      // men across a rank
  H.MARGIN = 3;     // squares of field round the ranks (his "3 more squares")
  H.GAP = [75, 105]; // the front ranks apart, ft (his "75 to 105 feet apart")
  // THE BODIES: what each of the Snoot's men is on the grid, from the bestiary's humanoids (data/foes.js). The seat's picks, his to change:
  //   heavy foot, the Pit's fighters, Newland's horse dismounted -- the Line Guard (the SRD Guard); crossbows and the plains' outriders -- the Bandit (the SRD's, a
  //   light crossbow); the plains tribes -- the Visiting Barbarian (the SRD Berserker); the Dominion's -- its own soldier and patrol lady; the gnolls -- their own
  //   kinds (a unit's `comp`); the Harbinger's six -- the mirror hyena. No horse stands on this field: a mounted man fights on foot.
  H.BODY = { foot: 'guard', horse: 'guard', missile: 'bandit', plains: 'berserker', dominion: 'dominion', mirror: 'mirrorhyena' };
  H.PALADIN = 'paladin:4'; // (his "drop the pally's to 4")
  H.HEROES = { GreyFang: 'greyfang', Katarina: 'katarina', 'the Harbinger': 'harbinger' };
  var rep = function (w, n) { var a = []; for (var i = 0; i < n; i++) a.push(w); return a; };
  H.bodyOf = function (u, g) {
    if (u.kind === 'the Dominion') return H.BODY.dominion;
    if (u.kind === 'the plains') return (g || u).mounted ? H.BODY.missile : H.BODY.plains;
    if ((g || u).volley) return H.BODY.missile;
    return (g || u).mounted ? H.BODY.horse : H.BODY.foot;
  };
  // a Snoot unit (snoot-mode/js/data.js SN.FORCES, as it stands that hour: figs, groups, comp scaled by the caller) as the grid's words, the heroes first
  H.listOf = function (u) {
    var out = [];
    (u.heroes || []).forEach(function (h) {
      if (h.dead) return;
      var w = h.grid || H.HEROES[h.name] || (h.paladin ? H.PALADIN : h.warlock ? 'patrollady' : h.harbinger ? 'harbinger' : null);
      if (w) out.push(w);
    });
    if (u.comp) Object.keys(u.comp).forEach(function (k) { out = out.concat(rep(u.harbinger && k === 'hyena' ? H.BODY.mirror : k, u.comp[k])); });
    else if (u.groups && u.groups.length) u.groups.forEach(function (g) { out = out.concat(rep(H.bodyOf(u, g), g.n || 0)); });
    else out = out.concat(rep(H.bodyOf(u), u.figs || 0));
    return out;
  };
  // 'paladin:4,guard*12' -> the words, each a man
  H.words = function (s) {
    var out = [];
    String(s || '').split(',').filter(Boolean).forEach(function (w) { var m = /^(.+)\*(\d+)$/.exec(w); if (m) out = out.concat(rep(m[1], +m[2])); else out.push(w); });
    return out;
  };

  var up = function (u) { return !u.dead && !u.fled && u.hp > 0 && !u.hless; };
  H.men = function (B, k) { return B.units.filter(function (u) { return u.hgroup === k; }); };
  H.tally = function (B, k) {
    var us = H.men(B, k), t = { name: B.hl[k].name, n: us.length, up: 0, away: 0, down: 0, broke: !!B.hl[k].broke, kinds: {} };
    us.forEach(function (u) {
      var kd = u.hword, r = t.kinds[kd] = t.kinds[kd] || { n: 0, up: 0, away: 0, down: 0 }, w = up(u) ? 'up' : u.fled ? 'away' : 'down';
      r.n++; r[w]++; t[w]++;
    });
    return t;
  };

  // MORALE (the seat's draft, his to change): a group checks at the end of a round in which it first stands at half its men or fewer, and again at a quarter --
  // 2d6, and it breaks on a roll over its rating and two (the Snoot's own ratings: heavy foot 5, the gnolls 7; SN.rating there). A group that breaks is away:
  // every one of it still standing leaves the field, and the fight is the other's. `never`: the ones the Snoot never checks (SN.nevers).
  H.STEPS = [0.5, 0.25];
  H.morale = function (B) {
    ['a', 'b'].forEach(function (k) {
      var g = B.hl[k]; if (g.never || g.broke) return;
      var us = H.men(B, k), n = us.length, st = us.filter(up).length; if (!st || !n) return;
      while (g.step < H.STEPS.length && st <= n * H.STEPS[g.step]) {
        g.step++;
        var d1 = 1 + Math.floor(D.rand() * 6), d2 = 1 + Math.floor(D.rand() * 6), need = (g.morale || 5) + 2, broke = d1 + d2 > need;
        var line = 'R' + B.round + ' MORALE  ' + g.name + ' (' + st + ' of ' + n + ' standing)  2d6 [' + d1 + ',' + d2 + '] = ' + (d1 + d2) + '  vs ' + need + '  ' + (broke ? 'BREAKS' : 'HOLDS');
        if (B.log) B.log.push(line); B.hl.lines.push(line);
        if (broke) { g.broke = true; us.filter(up).forEach(function (u) { u.dead = true; u.fled = true; u.deadT = B.t; }); B.cache = null; return; }
      }
    });
  };
  // the fight's ending: nobody of a group standing, and it is the other's ('won': group a's, 'lost': group b's -- the grid's own two words)
  H.over = function (B) {
    if (B.hl.round !== B.round) { B.hl.round = B.round; if (B.round > 1) H.morale(B); }
    var a = H.men(B, 'a').filter(up).length, b = H.men(B, 'b').filter(up).length;
    if (!b) return 'won'; if (!a) return 'lost'; return null;
  };

  // the field and the fight. spec: { a: { name, list, morale, never }, b: { ... }, level, seed, gap (ft) }; o: the Battle's own options ({ bench: true } unseen)
  H.make = function (spec, o) {
    var L = Math.max(1, Math.min(12, spec.level || 4)), NPC = D.npc;
    if (spec.seed != null) D.seed = spec.seed | 0;
    var isClass = function (w) { return !!(NPC.spec && NPC.spec(w, L)); };
    var A = spec.a.list.slice(), Bl = spec.b.list.slice(), aClass = A.filter(isClass), ph = !aClass.length;
    var steps = Math.round((H.GAP[1] - H.GAP[0]) / 5) + 1, gap = spec.gap || (H.GAP[0] + 5 * Math.floor(D.rand() * steps)), g = Math.round(gap / 5);
    var F = H.FILES, rA = Math.ceil(A.length / F), rB = Math.ceil(Bl.length / F), M = H.MARGIN;
    var w = Math.max(Math.min(F, A.length), Math.min(F, Bl.length)) + 2 * M, h = rA + rB + g - 1 + 2 * M, rows = [], hts = [];
    for (var y = 0; y < h; y++) { rows.push(new Array(w + 1).join('.')); hts.push(new Array(w + 1).join('0')); }
    D.MAPS[H.FIELD] = Object.assign({}, D.MAPS.gnollhills, { name: 'The Field', sub: spec.a.name + ' and ' + spec.b.name, rows: rows, heights: hts });
    var q = '?npc=' + Bl.join(',') + '&lvl=' + L + '&vs=' + (ph ? 'fighter:1' : aClass.join(',')) + '&map=' + H.FIELD + (o && o.bench ? '' : '&watch');
    var B = D.npcFight(q, o || {});
    B.hl = { a: { name: spec.a.name, morale: spec.a.morale, never: !!spec.a.never, step: 0 }, b: { name: spec.b.name, morale: spec.b.morale, never: !!spec.b.never, step: 0 }, gap: g * 5, w: w, h: h, round: 0, lines: [] };
    var enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      var self = this, P = this.units.filter(function (u) { return u.side === 'party'; }), Fo = this.units.filter(function (u) { return u.side === 'foe'; });
      if (ph) P.forEach(function (u) { u.hless = true; u.dead = true; u.fled = true; u.x = -99; u.y = -99; }); // (a group with no class or named one in it: the Battle's own hero stands nowhere)
      var ci = 0, mine = [];
      A.forEach(function (wd, i) {
        var u;
        if (isClass(wd)) { u = P[ci++]; if (u) { u.guest = true; u.classAI = true; } }
        else if (D.FOES[wd]) { u = self.makeFoe({ id: 'a' + i + '-' + wd, kind: wd, at: [0, 0], side: 'party', ally: true }); self.units.push(u); }
        if (u) { u.hgroup = 'a'; u.hword = wd; mine.push(u); }
      });
      Fo.forEach(function (u, i) { u.hgroup = 'b'; u.hword = u.rword || Bl[i] || u.kind; });
      var seat = function (us, front, dir, face) {
        var wide = Math.min(F, us.length), x0 = Math.floor((w - wide) / 2);
        us.forEach(function (u, i) { u.x = x0 + (i % F); u.y = front + dir * Math.floor(i / F); if (D.spr && D.spr.facingFor) u.facing = D.spr.facingFor(0, face); });
      };
      seat(mine, M + rA - 1, -1, 1); seat(Fo, M + rA - 1 + g, 1, -1);
      this.cache = null;
      this.over = function () { return H.over(this); };
    };
    return B;
  };
  // the whole fight unseen: what it came to
  H.run = function (spec) {
    var B = H.make(spec, { bench: true }), v, guard = 0, err = null; D.battle = B; B.enter();
    while (B.co && guard++ < 600000 && !(B.round > 60)) {
      var r; try { r = B.co.next(v); } catch (e) { err = String(e && e.stack || e).slice(0, 600); break; }
      v = undefined; if (r.done) break;
      var y = r.value; if (typeof y === 'number' || !y) continue;
      if (y.prompt) v = y.prompt.opts[0].value; else if (y.turn) v = { do: 'end' };
    }
    var res = B.result && B.result.result ? B.result.result : (typeof B.result === 'string' ? B.result : H.over(B));
    if (!err && !H.men(B, 'a').some(up) && !H.men(B, 'b').some(up)) res = 'both'; // (the last of each down or away in the one round: nobody's)
    return { result: err ? 'error' : res || 'unended', error: err, rounds: B.round, gapFt: B.hl.gap, field: B.hl.w + 'x' + B.hl.h, a: H.tally(B, 'a'), b: H.tally(B, 'b'), morale: B.hl.lines, log: B.log || [] };
  };
  // THE JANKY HEAD: the same fight on the screen, both groups run by the AI --
  //   deep16/?headless&a=paladin:4,guard*12&b=gloryseeker*3,gnoll*9,hyena*6&seed=7   (&an= &bn= their names, &am= &bm= their morale ratings, &gap= ft, &lvl=)
  H.door = function (q) {
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    return H.make({ a: { name: get('an') || 'the first', list: H.words(get('a') || 'paladin:4*3,guard*12'), morale: +get('am') || 5 }, b: { name: get('bn') || 'the second', list: H.words(get('b') || 'gloryseeker*3,gnoll*9,hyena*6'), morale: +get('bm') || 7 },
      level: +get('lvl') || 4, seed: get('seed') != null ? +get('seed') : null, gap: +get('gap') || 0 }, {});
  };
})();
