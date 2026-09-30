/* DEEP16 — Find Familiar on the grid (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet - let's reinstate").
   The 8-bit game's ritual (js/familiar.js there) leaves flags.familiar { kind, by, hp }; the seat hands the flags over and the familiar
   rides its wizard -- a figure of the party's side that the fight runs itself.
   REWORKED 09-30 on his word ("even if it's not the SRD way, I'd put the familiars 'turn' after his casters ... if my familiar is out and
   I cast a touch spell on someone not next to me - it should fail if it's out of the familiars movement. If not out of the familiar's
   movement, go ahead and use familiars turn to go touch and try to start coming back (as limited by familiar movement) - ground and
   flier. Also, the touch delivery would not work if they'd ordered the familiar to help already (owl wouldn't do it's auto-help if used to
   deliver a touch). they'll spend their move getting back into their caster's square, but can be ordered back in before they make it
   back. (only way a familiar is on a square is if it runs out of movement - at which time it would enter enemy targeting"):
   - it has no initiative of its own: its turn comes right after its caster's (battle.js run: FM.after);
   - a touch spell on one not beside the caster goes by the familiar when a square beside that one is within the familiar's movement,
     from where it is (his square, riding): it goes there as the spell is cast (M.cast: FM.carries / FM.carry), and its own turn after
     his is what is left of that movement, spent heading home;
   - Help: the owls on their own (Flyby: in, help, out unharmed); the bat never ("have it flutter around his head"); the others when he
     orders it (FAMILIAR: HELP, free: "it always obeys your commands"); the AI's casters order it for themselves;
   - it rides (Griz, 09-29: the owls on his shoulder, the others at his feet, the bat about his head) whenever it gets back into his
     square: untargetable then, and caught by any area that catches him; short of his square when its movement runs out, it holds a
     square of its own and the foes may strike it;
   - what it lends its caster (R.FAMILIARS[..].perk, RULED 09-30): the rat's darkvision 30, the bat's sonar 15 (blindsight), the snake's
     sense of the hidden and the unseen within 15 ft and +1 to his charms, the spider's Web Walker and +1 to his Web, the frog's croak (he
     is never caught off guard). Each is on its caster while it is in the fight (not sent away, not fallen).
   DISMISS FAMILIAR sends it to its pocket dimension and CALL FAMILIAR brings it back (an action each, the wizard's SKILLS). At 0 hit
   points it vanishes, and the 8-bit game hears of it (js/embed.js result.familiar). The forms' numbers: js/rules.js R.FAMILIARS. */
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
  function formOf(f) { return R.FAMILIARS[String(f.kind).replace(/^fam_/, '')]; }
  function here(f) { return !!f && f.hp > 0 && !f.dead && !f.away && !f.left; }
  // a caster the fight runs (a class NPC, a guest, a foe, a hero on the bench): he orders its Help himself
  function aiRun(m) { return !!(m && (m.guest || m.side !== 'party')); } // (classAI marks every class NPC, the player's own too: guest is the fight's)

  // the familiar the 8-bit game's save carries, seated with the party when its wizard is in the fight (battle.js, as the party is made)
  FM.unit = function (B, data, party) {
    var fl = data && data.flags && data.flags.familiar, d = fl && R.FAMILIARS[fl.kind];
    if (!d || !D.FOES['fam_' + fl.kind]) return null;
    var master = party.filter(function (u) { return u.id === fl.by && u.hp > 0; })[0];
    if (!master) return null;
    var u = B.makeFoe({ id: 'familiar', kind: 'fam_' + fl.kind });
    u.side = 'party'; u.guest = true; u.familiar = master.id; u.name = master.name + '\'s ' + d.name;
    u.hp = Math.max(1, Math.min(d.hp, fl.hp == null ? d.hp : fl.hp)); u.maxhp = d.hp;
    u.flies = !!d.fly; u.flyby = !!d.flyby; u.help = d.help || 'order'; u.drawScale = d.scale || 1; u.lvl = 0; u.cls = null; u.known = []; u.slots = [];
    u.lift = d.fly && !d.flyby ? 12 : 0; // (the bat stand-in's sheet walks on the ground: out on the field it is drawn up in the air, ui.js)
    if (d.darkvision) u.darkvision = d.darkvision;
    if (d.blindsight) u.blindsight = d.blindsight;
    // it rides (Griz, 09-29: "still needs to ride shoulder (or sitting at casters feet)"; 09-30 the bat "flutter around his head"): the
    // owls on the wizard's shoulder, the bat about his head, the rest at his feet. While it rides its square is his (a getter: every area
    // that catches him catches it), it holds no square of its own, and the foes' AI does not single it out (ai.js heroes)
    var mx = master.x, my = master.y;
    Object.defineProperty(u, 'x', { get: function () { return u.riding ? master.x : mx; }, set: function (v) { mx = v; }, enumerable: true, configurable: true });
    Object.defineProperty(u, 'y', { get: function () { return u.riding ? master.y : my; }, set: function (v) { my = v; }, enumerable: true, configurable: true });
    u.riding = true; u.perch = d.help === 'never' ? 'head' : d.fly ? 'shoulder' : 'feet'; u.master = master;
    // what it lends him, while it is here: his own senses read through (a Darkvision spell on him still sets his own)
    var P = d.perk || {};
    function lend(key, fn) {
      var base = master[key];
      Object.defineProperty(master, key, { get: function () { return fn(base); }, set: function (v) { base = v; }, enumerable: true, configurable: true });
    }
    if (P.darkvision) lend('darkvision', function (b) { return here(u) ? Math.max(b || 0, P.darkvision) : b; });
    if (P.sonar) lend('blindsight', function (b) { return here(u) ? Math.max(b || 0, P.sonar) : b; });
    if (P.senseHidden) lend('senseHidden', function (b) { return here(u) ? Math.max(b || 0, P.senseHidden) : b; });
    if (P.webWalker) lend('webWalker', function (b) { return b || here(u); });
    master.famPerk = function (k) { return here(u) ? P[k] || 0 : 0; };
    return u;
  };
  FM.of = function (B, master) { return B.units.filter(function (w) { return w.familiar === master.id; })[0] || null; };

  // its turn, right after its caster's (battle.js run): no initiative of its own (RULED 09-30)
  FM.after = function* (B, m) {
    var f = FM.of(B, m);
    if (!here(f) || B.over()) return;
    B.active = f;
    yield* D.ai.turn(B, f);
    B.active = null;
  };

  // its turn (ai.js turn): home after a carried spell; else Help -- the owls always, the others on his order -- and home again
  FM.turn = function* (B, u) {
    var T = u.turn, AI = D.ai, master = u.master;
    if (u.carried) { T.move = Math.max(0, T.move - u.carried.spent); delete u.carried; delete u.order; yield* home(B, u, master); return; }
    var ordered = u.order === 'help'; delete u.order;
    var helps = u.help === 'auto' || (u.help !== 'never' && (ordered || aiRun(master)));
    var mates = B.units.filter(function (w) { return w.side === u.side && w !== u && !w.familiar && G.standing(w); });
    var foes = B.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && !w.ethereal && !w.conds.invisible && !w.conds.hidden; });
    if (helps && foes.length && T.action) {
      // to the foe the party is on (the most of its side beside it, then the nearest)
      var tgt = foes.map(function (f) { return { f: f, n: mates.filter(function (a) { return G.dist(a, f) <= 5; }).length, d: G.dist(u, f) }; })
        .sort(function (a, b) { return b.n - a.n || a.d - b.d; })[0].f;
      var budget = u.flyby ? Math.floor(T.move / 2) : T.move; // (an owl keeps half its flight for the way back)
      var rode = u.riding; if (rode) dismount(u);
      var e = AI.approach(u, tgt, G.reach(u, budget), 5);
      if (e && G.dist(u, tgt, e.x, e.y) <= 5) {
        yield* go(B, u, e);
        if (u.hp <= 0) return;
        u.facing = B.faceTo(u, tgt); u.anim = 'attack'; u.animT = B.t;
        yield* B.exec(u, { do: 'help', target: tgt });
        u.helpedRound = B.round;
        yield 18;
        yield* home(B, u, master); // (with what movement is left; the owl's Flyby draws no blow as it goes)
        return;
      }
      if (rode) { u.riding = true; if (ordered) B.card(['{g}' + u.name + ': no foe within its reach this turn.{/}'], 200); return; }
    }
    yield* home(B, u, master);
  };
  function dismount(u) { var sx = u.x, sy = u.y; u.riding = false; u.x = sx; u.y = sy; } // (down off him, from his square)
  // back into his square: a square beside him with 5 ft to spare, and up (or at his feet) again; short of it, as near him as it gets
  function* home(B, u, m) {
    if (u.riding || u.hp <= 0) return;
    if (!m || !G.standing(m)) return; // (he is down: it holds where it is)
    var mv = u.turn ? u.turn.move : 0, rm = G.reach(u, mv), mount = null, best = null, bs = Infinity;
    Object.keys(rm).forEach(function (k) {
      var q = rm[k]; if (!q.stand && !(q.x === u.x && q.y === u.y)) return;
      var d = G.dist(m, { x: q.x, y: q.y, size: 1 });
      if (d <= 5 && q.cost + 5 <= mv && (!mount || q.cost < mount.cost)) mount = q;
      var threat = B.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w, q.x, q.y) <= Math.max(5, G.reachOf(w)); });
      var s = d * 10 + (threat ? 5 : 0) + q.cost * 0.01;
      if (s < bs) { bs = s; best = q; }
    });
    if (mount) { yield* go(B, u, mount); if (u.hp > 0 && !u.dead) remount(B, u, m); return; }
    if (best) yield* go(B, u, best);
    if (u.hp > 0 && !u.dead && !u.riding) B.card(['{o}' + u.name + ' is short of him: it holds its ground.{/}'], 200);
  }
  function remount(B, u, master) { if (master && G.standing(master) && u.hp > 0 && G.dist(u, master) <= 5) { u.riding = true; u.facing = master.facing; } }
  function* go(B, u, e) {
    if (!e || (e.x === u.x && e.y === u.y)) return;
    var path = G.path(G.reach(u, u.turn.move), e.x, e.y);
    if (path && path.length) yield* B.moveAlong(u, path, { spend: true, noOA: !!u.flyby }); // (Flyby: no opportunity attack as it goes)
  }

  // ------------------------------------------------------------------ the touch spell it carries (RULED 09-30)
  // the familiar that could carry his touch spell now: here, not ordered to Help, not already out with one, within 100 ft (the bond)
  FM.deliverer = function (B, u) {
    var f = B && u && FM.of(B, u);
    if (!here(f) || f.order === 'help' || f.carried || G.dist(u, f) > 100) return null;
    return f;
  };
  // where it would stand to touch w: the nearest square beside w within its movement from where it is (cached while nobody moves)
  var cache = { key: null, rm: null };
  function reachOf(B, f) {
    var key = f.x + ',' + f.y + '|' + B.units.map(function (w) { return w.dead ? '' : w.x + ',' + w.y; }).join(';');
    if (cache.key !== key || cache.f !== f) { if (!f.turn) f.turn = { move: f.speed, action: 0, bonus: 0, disengaged: false }; cache = { key: key, f: f, rm: G.reach(f, f.speed) }; }
    return cache.rm;
  }
  function spotFor(B, u, w) {
    var f = FM.deliverer(B, u);
    if (!f || !w || w === f || w === u || w.x == null || G.dist(u, w) <= 5) return null;
    var rm = reachOf(B, f), best = null;
    Object.keys(rm).forEach(function (k) { var q = rm[k]; if ((q.stand || (q.x === f.x && q.y === f.y && !f.riding)) && G.dist(f, w, q.x, q.y) <= 5 && (!best || q.cost < best.cost)) best = q; });
    return best ? { f: f, q: best } : null;
  }
  // (js/magic.js touchTargets / targetOK ask this: may u touch w by its familiar?)
  FM.delivers = function (B, u, w) { return !!spotFor(B, u, w); };
  FM.carries = function (B, u, t) { var w = t && t.units ? t.units[0] : t; return !!spotFor(B, u, w); };
  // (js/magic.js M.cast, after the cast pose): it goes; false if the spell dies with it on the way
  FM.carry = function* (B, u, t) {
    var w = t && t.units ? t.units[0] : t, s = spotFor(B, u, w);
    if (!s) return true;
    var f = s.f, name = w.side === 'foe' ? B.shortName(w) : w.name;
    if (f.riding) dismount(f);
    B.card(['{y}' + f.name + '{/} carries the spell to ' + name + '.']);
    var path = G.path(G.reach(f, f.speed), s.q.x, s.q.y);
    if (path && path.length) yield* B.moveAlong(f, path, { noOA: !!f.flyby }); // (the movement of its own turn, taken now: spent below, at its turn)
    f.carried = { spent: s.q.cost, round: B.round };
    if (f.hp <= 0 || f.dead || G.dist(f, w) > 5) { B.card(['{o}The spell dies with ' + (f.hp <= 0 || f.dead ? 'it' : 'it, short of ' + name) + '.{/}']); yield 16; return false; }
    f.facing = B.faceTo(f, w); f.anim = 'attack'; f.animT = B.t;
    yield 10;
    return true;
  };

  // ------------------------------------------------------------------ the frog's croak (RULED 09-30): its caster is never caught off guard
  FM.alarm = function* (B) {
    var woke = B.units.filter(function (m) { return m.famPerk && m.famPerk('alarm') && m.conds.surprised; });
    if (!woke.length) return;
    woke.forEach(function (m) { delete m.conds.surprised; var f = FM.of(B, m); if (f) delete f.conds.surprised; });
    D.sfx('croak');
    B.card(['{y}A croak from the ground:{/} ' + woke.map(function (m) { return m.name; }).join(', ') + (woke.length > 1 ? ' are' : ' is') + ' ready for them.'], 300);
    yield 40;
  };
  // (the initiative strip, ui.js: the familiar right after its caster, by its shape's name)
  FM.stripName = function (f) { return String(formOf(f).name).split(' ').pop(); };

  // ------------------------------------------------------------------ his SKILLS: dismiss and call (an action each: SRD); Help on his order (free)
  var F = D.features, cmd0 = F.commands, exec0 = F.exec;
  F.commands = function (B, u) {
    var out = cmd0(B, u), f = u.side === 'party' && !u.guest && FM.of(B, u);
    if (!f || f.hp <= 0 && !f.away) return out;
    var T = u.turn, act = T.action > 0 && !T.attacksLeft, nm = formOf(f).name;
    if (!f.away && f.help === 'order') {
      if (f.order === 'help') out.push({ id: 'famstay', label: 'FAMILIAR: STAY', cost: 'F', icon: 'sacred', skill: true, ok: true, note: 'the ' + nm + ' stays with you (its Help called off)' });
      else out.push({ id: 'famhelp', label: 'FAMILIAR: HELP', cost: 'F', icon: 'sacred', skill: true, ok: !f.carried, why: 'it is out with your spell', note: 'at its turn, after yours: the ' + nm + ' goes to the foe your side is on and helps the next blow at it (it may not live)' });
    }
    if (f.away) out.push({ id: 'callfam', label: 'CALL FAMILIAR', cost: 'A', icon: 'sacred', skill: true, ok: act, why: 'the action is spent', note: 'the ' + nm + ' back from its pocket of the world, within 30 ft' });
    else out.push({ id: 'dismissfam', label: 'DISMISS FAMILIAR', cost: 'A', icon: 'sacred', skill: true, ok: act, why: 'the action is spent', note: 'the ' + nm + ' into its pocket of the world, safe till called' });
    return out;
  };
  F.exec = function* (B, u, c) {
    if (c.do !== 'dismissfam' && c.do !== 'callfam' && c.do !== 'famhelp' && c.do !== 'famstay') { yield* exec0(B, u, c); return; }
    var f = FM.of(B, u); if (!f) return;
    if (c.do === 'famhelp' || c.do === 'famstay') {
      if (c.do === 'famhelp') { f.order = 'help'; B.card(['{y}' + u.name + '{/} sends ' + f.name.replace(/^.*'s /, 'the ') + ' in to help, at its turn.']); }
      else { delete f.order; B.card(['{y}' + u.name + '{/} keeps ' + f.name.replace(/^.*'s /, 'the ') + ' with him.']); }
      D.sfx('confirm'); yield 10; return;
    }
    u.turn.action = 0;
    if (c.do === 'dismissfam') {
      FX.sparkle(f, 'glow', 14); D.sfx('magic');
      f.away = true; f.left = true; f.dead = true; f.deadT = B.t; f.riding = false; delete f.order; delete f.carried;
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
