/* DRAGONSLEEP — Pyro's measure in the 8-bit game (the grid's twin: deep16/js/pyro.js, where his words are quoted in full).
   RULED 09-30b, Griz: "The Pyro scripting is intended to be for every fight he guests with the party. His walking the road with
   him is taking his measure of them, so he really holds himself back unless things go bad - at which time the party either loses
   half XP and continues, or it goes so bad they have to reload - not a particular fight. Custom script for custom important NPC."
   Every fight he walks in, both games:
   phase 1 -- one swing of the plain mace, and that is his turn;
   phase 2 -- he is at half his HP or one of the party is down: the Mace of Disruption drawn, two swings a turn, his word, and the
     party loses half its XP (each hero's XP halved; the level stays -- the seat's reading of "half XP", flagged for his word);
   phase 3 -- one of the party has left the fight (here, the party's RUN; on the grid, a hero out the way they came in): the white
     mace to his main hand, full level 12 to the end, then the save is loaded (the FOUND WANTING screen);
   down -- the fight ends there, and the save is loaded (THE KING FALLS).
   A fight fought on the grid comes back with the grid's measure (js/embed.js DS.pyroBack): its XP and its end are taken here.
   Wraps the 8-bit Battle (file order is call order: this loads after battle.js and scenes.js). */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, W8 = DS.W8, BP = DS.Battle.prototype;
  var S8 = DS.scripts8 = DS.scripts8 || {};
  function tx(k) { var t = DS.DATA.text[k]; return t ? t.t : k; }
  function ko(u) { return !u || (u.h ? (u.h.ko || u.h.hp <= 0) : u.dead); }
  function king(B) { return (B.heroes || []).filter(function (u) { return u.guest && u.h && u.h.script === 'measure'; })[0] || null; }
  function measure(B) { return B.pyro8 || (B.pyro8 = { phase: 1 }); }
  // "loses half XP": each of the party's XP halved, the level kept (R.gainXP banks from there; at the cap nothing is banked anyway)
  function halfXp() { (DS.G.party || []).forEach(function (h) { h.xp = Math.floor((h.xp || 0) / 2); }); }
  S8.halfXp = halfXp;

  // after every turn: has it gone bad?
  function* watch(B) {
    var u = king(B); if (!u || B.over) return;
    var P = measure(B);
    if (ko(u)) { B.over = 'pyro'; return; }
    var down = B.heroes.some(function (x) { return !x.guest && ko(x); });
    if (P.phase < 2 && (down || u.h.hp <= u.h.maxhp / 2)) {
      P.phase = 2; DS.audio.sfx('buff'); B.flashT = 6;
      yield* B.say('Pyronimus: "' + tx(down ? 'pyro.m2Down' : 'pyro.m2Hurt') + '"', 70);
      B.burst(u, '#F8F8F8', 14, 1.2, 'rise');
      yield* B.say(tx('pyro.m2Draw'), 50);
      halfXp(); DS.audio.sfx('error');
      yield* B.say(tx('pyro.m2Xp'), 60);
    }
  }
  S8.watch = watch;
  var turn0 = BP.turn;
  BP.turn = function* (u) { yield* turn0.apply(this, arguments); yield* watch(this); };
  var checkEnd0 = BP.checkEnd;
  BP.checkEnd = function () { var k = king(this); if (!this.over && k && ko(k)) { this.over = 'pyro'; return; } return checkEnd0.apply(this, arguments); };

  // the party runs: that is leaving the fight -- he stays, finishes it, and the save is loaded
  var run0 = BP.tryRun;
  BP.tryRun = function* (u) {
    yield* run0.apply(this, arguments);
    var k = king(this);
    if (this.over === 'run' && k && !ko(k)) {
      measure(this).phase = 3; DS.audio.sfx('encounter');
      yield* this.say('Pyronimus: "' + tx('pyro.m3') + '"', 70);
      yield* this.say(tx('pyro.m3Flip'), 50);
      this.over = 'pyroRun';
    }
  };

  // ------------------------------------------------------------------ his turn
  S8.measure = function* (u) {
    var B = this, P = measure(B), h = u.h, f = h.feats || {};
    var foes = B.liveFoes(); if (!foes.length) return;
    var plain = R.item(h.equip.weapon), white = R.item(h.equip.offhand) || plain;
    var full = P.phase >= 3, main = full ? white : plain, off = full ? plain : white, bonusUsed = false;
    if (full && f.secondWind && h.hp < h.maxhp * 0.4) {
      f.secondWind = 0; bonusUsed = true; var sw = B.heal(u, DS.roll('1d10') + h.lvl);
      DS.audio.sfx('heal'); B.elemBurst(u, 'heal', 'rise'); B.num(u, sw, '#58F898');
      yield* B.say(u.h.name + ' catches his second wind. +' + sw + ' HP.', 36);
    }
    var plan;
    if (P.phase === 1) plan = [[main, 1]];
    else if (P.phase === 2) plan = [[main, 1], [off, 1]];
    else plan = [[main, R.attacksPerTurn(h)], [off, 1]]; // Extra Attack's three; Hammer and Tongs' off-hand in the action
    if (full && f.actionSurge && foes.length >= 2) { f.actionSurge = 0; DS.audio.sfx('buff'); yield* B.say(u.h.name + ' surges!', 28); plan = plan.concat(plan.slice()); }
    if (full && !bonusUsed) plan.push([off, 1]); // the off-hand's own strike, the bonus action
    for (var i = 0; i < plan.length && !B.over; i++) {
      foes = B.liveFoes(); if (!foes.length) break;
      var t = foes.slice().sort(function (a, b) { return (b.x + b.art.w) - (a.x + a.art.w); })[0];
      u.off = 6;
      yield* B.heroAttack(u, t, { actions: 1, bonus: 0, surged: false, sneakUsed: true, w: plan[i][0], n: plan[i][1] }, null);
      u.off = 0;
    }
  };

  // ------------------------------------------------------------------ the end: the grid's measure, and the two that load the save
  var finish0 = BP.finish;
  BP.finish = function* () {
    var back = this.fromDeep ? DS.pyroBack : null, why = null;
    if (this.fromDeep) DS.pyroBack = null;
    if (back && back.held) { if (back.down) why = 'down'; else if (back.phase >= 3) why = 'wanting'; }
    if (this.over === 'pyro') why = 'down';
    if (this.over === 'pyroRun') why = 'wanting';
    if (why) {
      DS.audio.play('gameover');
      yield W8.frames(40);
      this.result = 'lose';
      DS.pop(this);
      DS.push(new PyroFail(why));
      return;
    }
    if (back && back.held && back.phase === 2) { halfXp(); DS.audio.sfx('error'); yield* this.say(tx('pyro.m2Xp'), 60); }
    yield* finish0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ a spell's save: the King's Mantle (+5 against spells) reads spellNow
  var special0 = BP.special;
  BP.special = function* (f, sp) {
    var was = this.spellNow; this.spellNow = !!(sp && (sp.spell || DS.DATA.spells[sp.id]));
    try { return yield* special0.apply(this, arguments); } finally { this.spellNow = was; }
  };

  // ------------------------------------------------------------------ the screen: RoostFail's shape (js/scenes.js), his words
  function PyroFail(why) { this.kind = 'gameover'; this.opaque = true; this.t = 0; this.menu = null; this.why = why; }
  DS.PyroFail = PyroFail;
  PyroFail.prototype.update = function () {
    this.t++;
    if (this.t === 150) {
      var any = [1, 2, 3].some(function (i) { return !!DS.loadSlot(i); });
      this.menu = new DS.Menu({ items: [{ label: 'CONTINUE FROM A SAVE', value: 'load', disabled: !any }, { label: 'TITLE', value: 'title' }], x: 56, y: 176, w: 144, cancelable: false,
        onSelect: function (it) { if (it.value === 'load') DS.push(new DS.SlotScene(false)); else { DS.clearScenes(); DS.push(new DS.Title()); } } });
    }
    if (this.menu) this.menu.update();
  };
  PyroFail.prototype.draw = function (ctx) {
    ctx.fillStyle = '#0A0806'; ctx.fillRect(0, 0, 256, 240);
    // the white mace's light, going out
    var glow = Math.max(0, 1 - this.t / 140);
    if (glow > 0) { ctx.globalAlpha = glow * 0.5; ctx.fillStyle = '#F8F8F8'; ctx.beginPath(); ctx.arc(128, 150, 10 + this.t * 0.4, 0, Math.PI * 2); ctx.fill(); }
    var head = tx(this.why === 'down' ? 'fail.pyroDownTitle' : 'fail.pyroTitle'), body = tx(this.why === 'down' ? 'fail.pyroDown' : 'fail.pyro');
    if (!Array.isArray(head)) head = [String(head)];
    ctx.globalAlpha = Math.min(1, Math.max(0, (this.t - 30) / 60));
    head.forEach(function (l, i) { DS.bigText(ctx, l, 128, 44 + i * 22, 2); });
    DS.wrap(body, 220).forEach(function (l, i) { DS.textCenter(ctx, l, 128, 104 + i * 11, '#E8E0C8'); });
    ctx.globalAlpha = 1;
    if (this.menu) this.menu.draw(ctx);
  };
})();
