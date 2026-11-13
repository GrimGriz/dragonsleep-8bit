/* DEEP16 -- THE SEEP'S OWN (2026-11-13, the wisp-and-stirge seat; the bestiary lane's section 2). Griz to the lanes desk that day:
     "yeah - they get a save against consume life, coz - build it and have it end the game 'character was lost the seep' - check for that with permadeath from massive
      damage or what-have-you as well"
     "also make a mirror version that consumes magic (eats spell slots) (wisp is engine-drawn not sprite?)"
     "Let's mirror version of the stirge similar (drains spell slots)"

   THE WILL-O'-WISP BY THE SRD (5.1; data/foes.js wisp) -- its four traits that were not read till now, and its own turn:
     Consume Life            a bonus action: one creature it can see within 5 ft at 0 hit points and still alive, CON DC 10 "against this magic" or it dies; if it dies the
                             wisp regains 3d6. Dead for good (battle.js lostForGood), and in a game being played the game is over on S.LINES.life. A Death Ward takes it
                             (SRD: an effect that would kill instantly without damage is negated, and the ward ends). `grace` (the seat's call, a word in its block): it
                             takes only one who was already down as its turn began, never the one its own Shock just dropped -- the party gets a round to get them up
     Incorporeal Movement    through creatures and objects as difficult terrain (js/grid.js: `incorporeal`); 1d10 force if it ends its turn inside an object (S.endTurn --
                             the grid lets it stop only on open ground, so only something thrown up round it can do that)
     fly 50 (hover)          wings in every fight (js/flight-ai.js); it hovers, so nothing that only stops it acting brings it down (Battle.flyWhy)
     Variable Illumination   bright 5 to 20 ft, dim as far again, changed with a bonus action: 20 as it hunts, 5 as it lurks (the lane's lean, the AI's pick); its light
                             goes out with it when it is invisible (js/light.js L.carried)
   Its turn (S.turn; ai.js gives it the turn): one down beside it or within its flight first -- Consume Life; then Shock at the nearest; the first time it is bloodied it
   fades (Invisibility, its action) and lurks a turn, its light at 5, then comes back unseen.

   THE MIRROR WISP (ours; data/foes.js mirrorwisp): the same frame, and CONSUME MAGIC where the wisp has Consume Life -- a bonus action, one it can see within 5 ft with a
   spell slot left, CON DC 10 or its highest slot left is eaten, and the mirror wisp regains 1d6 a level of it. It goes for the one with the most magic left.
   THE MIRROR STIRGE (ours; data/foes.js mirrorstirge): latched, it eats the lowest slot left each turn, 5 a level toward its 10 (S.drinkSlot, called from ai.js's stirge
   branch); it goes for one with magic (AI.heroes, below).

   DEAD FOR GOOD, THE GAME OVER (S.gameOver): the house's game ends on a card of its own as the roost's and Dace's do (js/mines.js M.RoostFail) -- GAME OVER, the death's
   line by name, then CONTINUE FROM A SAVE or the title, nothing saved. The door: deep16/?slainfail (and &line=...). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, FX = D.fx, Battle = D.Battle, AI = D.ai;
  var S = D.seep = {};

  // ------------------------------------------------------------------ the lines (a hero's name in the slot, never a pronoun)
  // (life: his words were "character was lost the seep"; "was lost to the Seep" is the lanes desk's reading of them -- his to reword)
  S.LINES = {
    life: function (n) { return n + ' was lost to the Seep.'; },
    massive: function (n) { return n + ' was killed by MASSIVE DAMAGE.'; }, // (RULED 11-13, Griz: "if MASSIVE DAMAGE is the only 'outright' go with MASSIVE DAMAGE"; battle.js hurt says it)
    exhaustion: function (n) { return n + ' died of exhaustion.'; },
    march: function (n) { return n + ' died of exhaustion on the march.'; }
  };
  S.playing = function () { return !!(D.house && D.house.playing); };
  function SlainFail(line) {
    var RF = D.mines && D.mines.RoostFail; if (RF) RF.call(this);
    this.kind = 'slainfail'; this.bats = []; this.head = ['GAME', 'OVER']; this.line = line; this.words = [line, 'The last save stands.'];
  }
  S.SlainFail = SlainFail;
  function proto() { var RF = D.mines && D.mines.RoostFail; if (RF && !SlainFail.wired) { SlainFail.prototype = Object.create(RF.prototype); SlainFail.prototype.constructor = SlainFail; SlainFail.wired = true; } return !!RF; }
  S.gameOver = function (line) {
    var H = D.house; D.sfx('error'); try { D.music('gameover'); } catch (e) { }
    if (H) { H.playing = false; H.cur = null; }
    S.lastLine = line;
    if (!proto()) { if (H && H.lost) H.lost(); return; }
    D.scenes.length = 0; D.push(new SlainFail(line));
  };

  // ------------------------------------------------------------------ what the block gives the creature
  var make0 = Battle.prototype.makeFoe;
  Battle.prototype.makeFoe = function () {
    var u = make0.apply(this, arguments), d = u && D.FOES && D.FOES[u.kind];
    if (d) {
      if (d.incorporeal) u.incorporeal = true;
      if (d.hover) u.hover = true;
      if (d.consume) u.consume = d.consume;
      if (d.seeksMagic) u.seeksMagic = true;
      if (d.glow && d.glow.vary) u.glow = Object.assign({}, d.glow); // (its own: Variable Illumination changes it)
    }
    return u;
  };
  // it hovers (SRD 5.1 Flying Movement: "... unless it has the ability to hover"): what only stops it acting or moving does not bring it down
  var flyWhy0 = Battle.flyWhy;
  Battle.flyWhy = function (u) { var w = flyWhy0.apply(this, arguments); return w && u.hover && w !== 'dead' && w !== 'down' && w !== 'no wings' ? null : w; };

  // ------------------------------------------------------------------ the magic one has left
  S.slotsLeft = function (w) { var n = 0; ((w && w.slots) || []).forEach(function (k, i) { n += Math.max(0, k || 0) * (i + 1); }); return n; };
  S.highSlot = function (w) { var s = (w && w.slots) || []; for (var i = s.length - 1; i >= 0; i--) if (s[i] > 0) return i + 1; return 0; };
  S.lowSlot = function (w) { var s = (w && w.slots) || []; for (var i = 0; i < s.length; i++) if (s[i] > 0) return i + 1; return 0; };
  function the(B, u, cap) { var s = AI.the ? AI.the(B, u) : 'the ' + u.name; return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function mended(B, u, n) { var was = u.hp; u.hp = Math.min(u.maxhp, u.hp + n); if (u.hp > was) FX.float('+' + (u.hp - was), u, D.PAL.ramps.moss[2]); return u.hp - was; }

  // one who seeks magic (the mirror stirge) goes for those with a slot left, while any stands
  var heroes0 = AI.heroes;
  AI.heroes = function (B, u) {
    var hs = heroes0.apply(this, arguments);
    if (u && u.seeksMagic && !u.riding) { var mg = hs.filter(function (w) { return S.slotsLeft(w) > 0 && G.standing(w); }); if (mg.length) return mg; }
    return hs;
  };

  // ------------------------------------------------------------------ the mirror stirge's drink (ai.js, the stirge's branch): the lowest slot left, 5 a level toward its 10
  S.drinkSlot = function (B, u, host) {
    var lv = S.lowSlot(host); if (!lv) return false;
    host.slots[lv - 1]--; u.drained = (u.drained || 0) + 5 * lv;
    FX.sparkle(host, 'violet', 10); FX.float('-1 slot', host, D.PAL.ramps.violet[5]); D.sfx('poison');
    B.card(['{r}' + the(B, u, true) + '{/} drinks: {p}a level ' + lv + ' spell slot{/} from ' + host.name + ', gone.  {g}(no blood; ' + Math.min(10, u.drained) + ' of 10' + (u.drained >= 10 ? ': full' : ' so far') + '){/}'], 160);
    return true;
  };

  // ------------------------------------------------------------------ Variable Illumination (a bonus action)
  S.vary = function (B, u, ft, quiet) {
    var g = u.glow, T = u.turn; if (!g || !g.vary || g.bright === ft || !T || !(T.bonus > 0)) return false;
    ft = Math.max(g.vary[0], Math.min(g.vary[1], ft));
    T.bonus = 0; var up = ft > g.bright; g.bright = ft; g.dim = ft; B.cache = null; if (D.light && D.light.dirty) D.light.dirty(B);
    if (!quiet) { D.sfx('magic'); FX.ring(u, g.color === 'violet' ? 'violet' : 'glow', up ? 34 : 14); B.card(['{r}' + the(B, u, true) + '{/} ' + (up ? 'flares' : 'gutters low') + ': bright light ' + ft + ' ft round it, dim ' + ft + ' ft past that.  {g}(Variable Illumination, a bonus action)' + '{/}'], 220); }
    return true;
  };

  // ------------------------------------------------------------------ Consume Life
  S.prey = function (B, u) { return B.units.filter(function (w) { return G.hostile(u, w) && G.present(w) && !w.object && !w.summon && !w.familiar && !w.dead && !w.slain && w.hp <= 0 && !w.regenDown && !(w.conds && w.conds.petrified); }); };
  S.consumeLife = function* (B, u, t) {
    var T = u.turn, C = u.consume; if (!T || !(T.bonus > 0) || !C) return false;
    T.bonus = 0; if (u.conds.invisible) delete u.conds.invisible; // (SRD: invisible "until it attacks or uses its Consume Life")
    u.facing = B.faceTo ? B.faceTo(u, t) : u.facing; if (D.spr.anim(u.sheet, 'attack')) { u.anim = 'attack'; u.animT = B.t; }
    D.sfx('magic'); FX.sparkle(t, 'glow', 18); FX.ring(t, 'glow', 22);
    B.card(['{r}' + the(B, u, true) + '{/} settles over ' + t.name + ': {p}CONSUME LIFE{/}.  {g}(a bonus action: one at 0 hit points within 5 ft -- CON DC ' + C.dc + ' or dead){/}'], 300);
    yield 34;
    if (t.conds.deathWard) { // (SRD 5.1 Death Ward: "an effect that would kill it instantaneously without dealing damage, that effect is instead negated against the target, and the spell ends")
      delete t.conds.deathWard; FX.ring(t, 'gold', 30); D.sfx('buff');
      B.card(['{y}The death ward on ' + t.name + ' takes it, and is spent.{/}  {g}(Consume Life negated){/}'], 280); u.anim = 'idle'; yield 30; return true;
    }
    var sv = RU.save(t, C.ab || 'con', C.dc, false, null);
    if (sv.ok) {
      B.card(['{r}' + t.name + '{/}: CON save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  {n}SAVED{/}  {g}' + t.name + ' holds on.{/}'], 280);
      u.anim = 'idle'; yield 30; return true;
    }
    var h = D.roll(C.heal || '3d6'), got = mended(B, u, h.total), line = S.LINES.life(t.name);
    B.card(['{r}' + t.name + '{/}: CON save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  {o}FAILED{/}', '{r}' + line + '{/}  {g}(' + the(B, u, true) + ' regains ' + (C.heal || '3d6') + ' ' + RU.fmtRolls(h.rolls) + ' = ' + h.total + (got < h.total ? ', ' + got + ' of it' : '') + ' hit points){/}'], 420);
    B.lostForGood(t, line);
    u.anim = 'idle'; yield 40; return true;
  };
  // ------------------------------------------------------------------ Consume Magic (the mirror wisp's)
  S.consumeMagic = function* (B, u, t) {
    var T = u.turn, C = u.consume, lv = S.highSlot(t); if (!T || !(T.bonus > 0) || !C || !lv) return false;
    T.bonus = 0; if (u.conds.invisible) delete u.conds.invisible;
    u.facing = B.faceTo ? B.faceTo(u, t) : u.facing; if (D.spr.anim(u.sheet, 'attack')) { u.anim = 'attack'; u.animT = B.t; }
    D.sfx('magic'); FX.sparkle(t, 'violet', 18); FX.ring(t, 'violet', 22);
    B.card(['{r}' + the(B, u, true) + '{/} turns its mirror on ' + t.name + ': {p}CONSUME MAGIC{/}.  {g}(a bonus action: one with a spell slot left within 5 ft -- CON DC ' + C.dc + ' or the highest slot is eaten){/}'], 300);
    yield 34;
    var sv = RU.save(t, C.ab || 'con', C.dc, false, null);
    if (sv.ok) { B.card(['{r}' + t.name + '{/}: CON save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  {n}SAVED{/}  {g}' + t.name + ' keeps every slot.{/}'], 280); u.anim = 'idle'; yield 30; return true; }
    t.slots[lv - 1]--;
    var dice = lv + 'd' + String(C.healPer || '1d6').replace(/^\d*d/, ''), h = D.roll(dice), got = mended(B, u, h.total);
    FX.float('-1 slot', t, D.PAL.ramps.violet[5]);
    B.card(['{r}' + t.name + '{/}: CON save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  {o}FAILED{/}', '{p}' + t.name + ' loses a level ' + lv + ' spell slot: eaten.{/}  {g}(' + the(B, u, true) + ' regains ' + dice + ' ' + RU.fmtRolls(h.rolls) + ' = ' + h.total + (got < h.total ? ', ' + got + ' of it' : '') + ' hit points){/}'], 400);
    u.anim = 'idle'; yield 36; return true;
  };

  // ------------------------------------------------------------------ the wisp's turn (and its mirror's)
  S.wispy = function (u) { return !!(u && u.consume && u.side === 'foe' && !u.dominated && !u.classAI); };
  function* flyNear(B, u, list, rch) {
    var FA = D.flightAI, T = u.turn;
    if (!list.length || !(T.move > 0) || u.conds.grappled || u.conds.restrained) return;
    if (G.winged(u) && FA && FA.spotFor) { var spot = FA.spotFor(B, u, list, rch); if (spot) { yield* B.flyMove(u, spot.x, spot.y, spot.z); return; } }
    var near = list.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0], e = AI.approach(u, near, G.reach(u, T.move), rch);
    if (e && (e.x !== u.x || e.y !== u.y)) yield* AI.walkTo(B, u, e);
  }
  S.turn = function* (B, u) {
    var T = u.turn, C = u.consume, magic = C.what === 'magic', shock = u.attacks[Object.keys(u.attacks)[0]];
    var foes = function () { return AI.heroes(B, u).filter(function (w) { return !w.object && G.standing(w); }); };
    var hs = foes(), prey0 = magic ? [] : S.prey(B, u).filter(function (w) { return !w.vitalSpared; });
    var canFade = u.invis && !u.conds.invisible && !u.conds.faerie && !u.conds.pinned && !u.conds.branded;
    // 1. one down within its flight: Consume Life comes first (the nearest)
    if (prey0.length && T.bonus > 0 && !u.conds.blinded) {
      var p = prey0.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
      if (G.dist(u, p) > 5) yield* flyNear(B, u, [p], 5);
      if (u.dead || u.hp <= 0) return;
      if (G.dist(u, p) <= 5) yield* S.consumeLife(B, u, p);
      if (B.over && B.over()) return;
      hs = foes();
    }
    // 2. bloodied for the first time, and nobody to take: it fades and lurks a turn (Invisibility its action; its light low, the bonus action; away, unseen)
    if (!u.lurked && canFade && T.action > 0 && u.hp <= u.maxhp / 2 && hs.length) {
      u.lurked = true; T.action = 0; u.conds.invisible = { ends: true }; delete u.conds.hidden; D.sfx('magic'); FX.sparkle(u, 'silver', 18);
      var dimmed = S.vary(B, u, u.glow && u.glow.vary ? u.glow.vary[0] : 5, true);
      B.card(['{r}' + the(B, u, true) + '{/} gutters and is gone.  {g}(Invisibility, its action: till it attacks or uses ' + C.name + (dimmed ? '; its light drawn in to 5 ft, a bonus action' : '') + '){/}'], 360);
      yield 30;
      // away from them, as far as its move takes it
      if (T.move > 0 && G.winged(u)) {
        var z = u.fz != null ? u.fz : G.gzAt(u, u.x, u.y), rm = G.flyReach(u, Math.max(z, G.groundAt(u, u.x, u.y) + G.LAYER()), T.move), best = null, bd = -1;
        Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var dmin = Infinity; hs.forEach(function (w) { dmin = Math.min(dmin, Math.hypot(w.x - e.x, w.y - e.y)); }); if (dmin > bd) { bd = dmin; best = e; } });
        if (best && (best.x !== u.x || best.y !== u.y)) yield* B.flyMove(u, best.x, best.y, best.layer);
      }
      return;
    }
    if (!hs.length) return;
    // 3. its blow: the mirror wisp at the one with the most magic left, the wisp at the nearest
    var tgt = null;
    if (magic) tgt = hs.filter(function (w) { return S.slotsLeft(w) > 0; }).sort(function (a, b) { return S.slotsLeft(b) - S.slotsLeft(a) || G.dist(u, a) - G.dist(u, b); })[0] || null;
    var rch = G.reachOf ? G.reachOf(u) : 5;
    if (tgt && G.dist(u, tgt) > rch) { yield* flyNear(B, u, [tgt], rch); if (u.dead || u.hp <= 0) return; }
    if (!tgt || G.dist(u, tgt) > rch) {
      if (!hs.some(function (w) { return G.dist(u, w) <= rch; })) { yield* flyNear(B, u, hs, rch); if (u.dead || u.hp <= 0) return; }
      tgt = hs.filter(function (w) { return G.dist(u, w) <= rch; }).sort(function (a, b) { return (magic ? S.slotsLeft(b) - S.slotsLeft(a) : 0) || a.hp - b.hp; })[0] || null;
    }
    if (tgt && T.action > 0 && shock) { T.action = 0; yield* B.attack(u, tgt, shock); if (u.dead || u.hp <= 0) return; }
    if (B.over && B.over()) return;
    // 4. its bonus action: the mirror wisp eats a slot off one beside it; the wisp with no `grace` takes the one it just dropped; else its light, up to 20 as it hunts
    if (T.bonus > 0 && magic && !u.conds.blinded) {
      var eat = foes().filter(function (w) { return S.highSlot(w) && G.dist(u, w) <= 5; }).sort(function (a, b) { return (b === tgt) - (a === tgt) || S.slotsLeft(b) - S.slotsLeft(a); })[0];
      if (eat) yield* S.consumeMagic(B, u, eat);
    }
    if (T.bonus > 0 && !magic && !C.grace && !u.conds.blinded) {
      var p2 = S.prey(B, u).filter(function (w) { return G.dist(u, w) <= 5; })[0];
      if (p2) yield* S.consumeLife(B, u, p2);
    }
    if (T.bonus > 0 && u.glow && u.glow.vary && !u.conds.invisible) S.vary(B, u, u.glow.vary[1]);
  };
  // Incorporeal Movement's price (SRD: "It takes 5 (1d10) force damage if it ends its turn inside an object")
  S.endTurn = function (B, u) {
    if (!u || !u.incorporeal || u.dead || u.hp <= 0 || G.inside(u, u.x, u.y) !== 'rock') return 0;
    var r = D.roll('1d10');
    B.card(['{r}' + the(B, u, true) + '{/} ends its turn inside the stone: 1d10 ' + RU.fmtRolls(r.rolls) + ' = {r}' + r.total + '{/} force.  {g}(Incorporeal Movement){/}'], 240);
    B.hurt(u, r.total, 'force', {});
    return r.total;
  };

  // ------------------------------------------------------------------ the game-over card's own door: deep16/?slainfail (&line=<the words>)
  S.door = function (q) {
    var m = /[?&]line=([^&]*)/.exec(q || ''), line = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : S.LINES.life('Aurdin');
    if (!proto()) return null;
    return new SlainFail(line);
  };
})();
