/* DEEP16 — Find Familiar on the grid (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet - let's reinstate").
   The 8-bit game's ritual (js/familiar.js there) leaves flags.familiar { kind, by, hp }; the seam hands the flags over and the familiar
   walks in beside its wizard as a figure of the party's side that the fight runs itself. Griz's shape (09-29): "move, harass and
   provide advantage and fly back, are the main deals - though the AI gets to add it as a target"; agreed with the seat's pick --
   Help, the owl's Flyby, the foes may strike it, dismiss and recall -- "except if owl gets flyby I want to give deliver touch attacks
   to the other ones - an option when you cast the spell if familiar hasn't used help action".
   So: on its turn it goes to the foe the party is on and takes the Help action (the next ally to swing at that foe has advantage);
   an owl flies in, helps and flies back out of reach, drawing no opportunity attack (Flyby), the others stay where they helped. It
   cannot attack (SRD). A form without Flyby carries its wizard's touch spell (its reaction, within 100 ft) to a creature beside it,
   when it hasn't helped this round (js/magic.js touchTargets / targetOK ask FM.delivers). DISMISS FAMILIAR sends it to its pocket
   dimension and CALL FAMILIAR brings it back within 30 ft (an action each, the wizard's SKILLS). At 0 hit points it vanishes, and the
   8-bit game hears of it (js/embed.js result.familiar). The forms' numbers: js/rules.js R.FAMILIARS (shared with the 8-bit game). */
'use strict';
(function () {
  var D = window.D16, R = window.DS.R, G = D.grid, FX = D.fx, FM = D.familiar = {};
  // the SRD forms' abilities (STR DEX CON INT WIS CHA); the rest of each is R.FAMILIARS
  var ABIL = { owl: [3, 13, 8, 2, 12, 7], snowyowl: [3, 13, 8, 2, 12, 7], bat: [2, 15, 8, 2, 12, 4], rat: [2, 11, 9, 2, 10, 4],
    spider: [2, 14, 8, 1, 10, 2], frog: [1, 13, 8, 1, 8, 3], snake: [2, 16, 11, 1, 10, 3] };
  var AB = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  Object.keys(R.FAMILIARS).forEach(function (k) {
    var f = R.FAMILIARS[k], a = ABIL[k] || [2, 12, 8, 2, 10, 4], abil = {}, saves = {};
    AB.forEach(function (s, i) { abil[s] = a[i]; saves[s] = Math.floor((a[i] - 10) / 2); });
    D.FOES['fam_' + k] = { name: f.name, type: 'fey', sheet: f.sheet, cr: '0', ac: f.ac, hp: f.hp, speed: Math.max(f.speed || 0, f.fly || 0), size: 1, reach: 5,
      darkvision: f.darkvision || 0, blindsight: f.blindsight || 0, abil: abil, saves: saves, init: saves.dex, perception: 13, attacks: {}, multi: 0,
      webWalker: !!f.webWalker, src: 'SRD 5.1 Find Familiar (a spirit, fey, in the shape of the ' + f.name + '); js/rules.js R.FAMILIARS' };
  });

  // the familiar the 8-bit game's save carries, seated with the party when its wizard is in the fight (battle.js, as the party is made)
  FM.unit = function (B, data, party) {
    var fl = data && data.flags && data.flags.familiar, d = fl && R.FAMILIARS[fl.kind];
    if (!d || !D.FOES['fam_' + fl.kind]) return null;
    var master = party.filter(function (u) { return u.id === fl.by && u.hp > 0; })[0];
    if (!master) return null;
    var u = B.makeFoe({ id: 'familiar', kind: 'fam_' + fl.kind });
    u.side = 'party'; u.guest = true; u.familiar = master.id; u.name = master.name + '\'s ' + d.name;
    u.hp = Math.max(1, Math.min(d.hp, fl.hp == null ? d.hp : fl.hp)); u.maxhp = d.hp;
    u.flies = !!d.fly; u.flyby = !!d.flyby; u.drawScale = d.scale || 1; u.lvl = 0; u.cls = null; u.known = []; u.slots = [];
    if (d.darkvision) u.darkvision = d.darkvision;
    if (d.blindsight) u.blindsight = d.blindsight;
    // it rides (Griz, 09-29: "still needs to ride shoulder (or sitting at casters feet)"): the owls on the wizard's shoulder, the rest at his
    // feet. While it rides its square is his (a getter: every area that catches him catches it), it holds no square of its own, and the
    // foes' AI does not single it out (ai.js heroes); out on the field it is a creature like any other (SRD: it can be struck)
    var mx = master.x, my = master.y;
    Object.defineProperty(u, 'x', { get: function () { return u.riding ? master.x : mx; }, set: function (v) { mx = v; }, enumerable: true, configurable: true });
    Object.defineProperty(u, 'y', { get: function () { return u.riding ? master.y : my; }, set: function (v) { my = v; }, enumerable: true, configurable: true });
    u.riding = true; u.perch = d.fly ? 'shoulder' : 'feet'; u.master = master;
    return u;
  };
  FM.of = function (B, master) { return B.units.filter(function (w) { return w.familiar === master.id; })[0] || null; };

  // its turn: to the foe the party is on (the most of its side beside it, then the nearest), the Help action, and -- an owl -- back out
  FM.turn = function* (B, u) {
    var T = u.turn, AI = D.ai, master = B.units.filter(function (w) { return w.id === u.familiar; })[0];
    var mates = B.units.filter(function (w) { return w.side === u.side && w !== u && !w.familiar && G.standing(w); });
    var foes = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && !w.ethereal && !w.conds.invisible && !w.conds.hidden; });
    if (!foes.length) return;
    var tgt = foes.map(function (f) { return { f: f, n: mates.filter(function (a) { return G.dist(a, f) <= 5; }).length, d: G.dist(u, f) }; })
      .sort(function (a, b) { return b.n - a.n || a.d - b.d; })[0].f;
    var budget = u.flyby ? Math.floor(T.move / 2) : T.move; // (an owl keeps half its flight for the way back)
    var rode = u.riding; if (rode) { var sx = u.x, sy = u.y; u.riding = false; u.x = sx; u.y = sy; } // (down off him, from his square)
    var e = AI.approach(u, tgt, G.reach(u, budget), 5);
    if (e && G.dist(u, tgt, e.x, e.y) <= 5 && T.action) {
      yield* go(B, u, e);
      if (u.hp <= 0) return;
      u.facing = B.faceTo(u, tgt); u.anim = 'attack'; u.animT = B.t;
      yield* B.exec(u, { do: 'help', target: tgt });
      u.helpedRound = B.round;
      yield 18;
      if (u.flyby && T.move > 0 && master) { yield* go(B, u, safeBy(B, u, master, G.reach(u, T.move))); remount(B, u, master); }
      return;
    }
    // nothing to reach this turn: back to the wizard, and up (or at his feet) again
    if (rode) { u.riding = true; return; }
    if (master && G.dist(u, master) > 5) yield* go(B, u, safeBy(B, u, master, G.reach(u, T.move)));
    remount(B, u, master);
  };
  // beside its wizard, standing, it is up on his shoulder (or at his feet) again
  function remount(B, u, master) { if (master && G.standing(master) && u.hp > 0 && G.dist(u, master) <= 5) { u.riding = true; u.facing = master.facing; } }
  function* go(B, u, e) {
    if (!e || (e.x === u.x && e.y === u.y)) return;
    var path = G.path(G.reach(u, u.turn.move), e.x, e.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true, noOA: !!u.flyby }); // (Flyby: no opportunity attack as it goes)
  }
  // the square it can reach nearest its wizard with no foe within 5 ft of it
  function safeBy(B, u, master, rm) {
    var best = null, bs = Infinity;
    Object.keys(rm).forEach(function (k) {
      var q = rm[k]; if (!q.stand) return;
      var threat = B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w, q.x, q.y) <= Math.max(5, G.reachOf(w)); });
      var s = (threat ? 1000 : 0) + G.dist(u, master, q.x, q.y) + q.cost * 0.01;
      if (s < bs) { bs = s; best = q; }
    });
    return best;
  }

  // a touch spell carried by the familiar (not the owl, which has Flyby instead: RULED 09-29), within 100 ft of its wizard, its reaction
  // unspent, when it hasn't helped this round
  FM.deliverer = function (B, u) {
    var f = B && u && FM.of(B, u);
    if (!f || f.dead || f.hp <= 0 || f.left || f.flyby || f.reaction <= 0 || f.helpedRound === B.round || G.dist(u, f) > 100) return null;
    return f;
  };
  FM.delivers = function (B, u, w) { var f = FM.deliverer(B, u); return !!(f && w && w !== f && w !== u && G.dist(u, w) > 5 && G.dist(f, w) <= 5); };
  // (js/magic.js M.cast asks this once the target is chosen: a delivery spends the familiar's reaction, and the card says so)
  FM.spend = function (B, u, t) {
    var w = t && t.units ? t.units[0] : t;
    if (!w || w.x == null || !FM.delivers(B, u, w)) return;
    var f = FM.deliverer(B, u); f.reaction = 0; f.anim = 'attack'; f.animT = B.t;
    B.card(['{y}' + f.name + '{/} carries the spell to ' + (w.side === 'foe' ? B.shortName(w) : w.name) + '.']);
  };

  // DISMISS FAMILIAR / CALL FAMILIAR on the wizard's SKILLS (an action each: SRD)
  var F = D.features, cmd0 = F.commands, exec0 = F.exec;
  F.commands = function (B, u) {
    var out = cmd0(B, u), f = u.side === 'party' && !u.guest && FM.of(B, u);
    if (!f || f.hp <= 0 && !f.away) return out;
    var T = u.turn, act = T.action > 0 && !T.attacksLeft;
    if (f.away) out.push({ id: 'callfam', label: 'CALL FAMILIAR', cost: 'A', icon: 'sacred', skill: true, ok: act, why: 'the action is spent', note: 'the ' + R.FAMILIARS[f.kind.replace(/^fam_/, '')].name + ' back from its pocket of the world, within 30 ft' });
    else out.push({ id: 'dismissfam', label: 'DISMISS FAMILIAR', cost: 'A', icon: 'sacred', skill: true, ok: act, why: 'the action is spent', note: 'the ' + R.FAMILIARS[f.kind.replace(/^fam_/, '')].name + ' into its pocket of the world, safe till called' });
    return out;
  };
  F.exec = function* (B, u, c) {
    if (c.do !== 'dismissfam' && c.do !== 'callfam') { yield* exec0(B, u, c); return; }
    var f = FM.of(B, u); if (!f) return;
    u.turn.action = 0;
    if (c.do === 'dismissfam') {
      FX.sparkle(f, 'glow', 14); D.sfx('magic');
      f.away = true; f.left = true; f.dead = true; f.deadT = B.t; f.riding = false;
      B.card(['{y}' + u.name + '{/} sends ' + f.name.replace(/^.*'s /, 'the ') + ' away, into its pocket of the world.']);
      yield 20; return;
    }
    if (G.standing(u)) { f.away = false; f.left = false; f.dead = false; f.riding = true; f.anim = 'idle'; f.animT = B.t; FX.sparkle(u, 'glow', 14); D.sfx('magic'); B.card(['{y}' + u.name + '{/} calls, and ' + f.name.replace(/^.*'s /, 'the ') + ' is back with him.']); yield 20; return; }
    var spot = null, bd = Infinity;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (G.dist(u, { x: x, y: y, size: 1 }) > 30 || G.occupant(x, y) || !G.canStand(f, x, y)) continue;
      var dd = G.dist(u, { x: x, y: y, size: 1 }) + (B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(w, { x: x, y: y, size: 1 }) <= 5; }) ? 100 : 0);
      if (dd < bd) { bd = dd; spot = [x, y]; }
    }
    if (!spot) { u.turn.action = 1; B.card(['{o}No room within 30 ft for it.{/}']); return; }
    f.x = spot[0]; f.y = spot[1]; f.away = false; f.left = false; f.dead = false; f.anim = 'idle'; f.animT = B.t;
    FX.sparkle(f, 'glow', 14); D.sfx('magic');
    B.card(['{y}' + u.name + '{/} calls, and ' + f.name.replace(/^.*'s /, 'the ') + ' is back.']);
    yield 20;
  };
})();
