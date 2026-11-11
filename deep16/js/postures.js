/* DEEP16 -- the postures: how a foe the DM laid on a rune fights (the Pocket DM's runes, 2026-11-10; runes seat B).
   His ask (11-07): a DM lays each bound unit of his on a start square and sets it to "wait and ambush, patrol, defend"; RULED the four postures stand,
   ambush, patrol, defend (`cloud-notes/pocket-dm-runes-look-2026-11-07.md`, step 5; the Pocket DM lane's 11-07 and 11-10 sections). At play the lay
   floor's placement (runes seat A) sets one field on each laid foe, and this file reads it:
     u.post = { kind: 'stand'|'ambush'|'patrol'|'defend', at: [x, y], to: [x, y] (patrol's second square, or defend's ward), r: ft }
   STAND   waits where it was laid with a Ready (SRD 5.1, the Ready action): whatever comes into its reach, or its shot, it strikes from there.
           Struck, or striking, it is in the fight and fights as any foe.
   AMBUSH  hidden from the start, its own Stealth held (SRD 5.1 Combat, Surprise: the Stealth of each one hiding against each passive Perception;
           one that notices no threat is surprised and takes no turn in round 1 -- P.surprise, from battle.js run). Still till one of ours is in its
           reach (it strikes, from hiding) or in its sight (it Readies, unseen); found, struck, or once it strikes, the ambush is sprung.
   PATROL  walks from its rune to the second square and back while it knows of no one; a sight of one of ours, a blow or a spell heard within
           P.HEAR, or a blow at it, breaks it, and it hunts as any foe.
   DEFEND  holds within r (15 ft by default, his "aye" of 11-10) of its ward -- `to`, a square or the id of a thing or one on the map, else its
           rune: what comes near the ward, or into its shot, it fights from inside that ground (the leash on G.reach, below); the rest of the time
           a Ready. It never breaks. (The grid's `guard`, ai.js brute, guards a unit; this is its square-and-radius kin.)
   A unit's members share their posture and its break (P.sig: the same kind, rune and second square). One holding its post takes its turn by
   it first -- the hook in ai.js turnOf, ahead of the brute and the class turn (tactics.js TX.turn) alike -- so the hunt on hearing and the Search
   never pull it off; a turn handed over goes at P.pool's foes alone (ai.js heroes), inside the leash.
   SRD 5.1 has no posture rules: the DM's call (Combat, step 2: "the GM figures out where the adversaries are"), built of the SRD's own actions
   (Ready, Hide, Surprise) -- our design, SRD-clean. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, AI = D.ai;
  var P = D.postures = {};
  P.R = 15;    // DEFEND's radius when the rune names none (11-10, his "aye")
  P.HEAR = 60; // a blow or a spell heard nearer than this breaks a PATROL (ours: the SRD gives a fight's noise no reach)
  P.KINDS = { stand: 1, ambush: 1, patrol: 1, defend: 1 };

  // the posture in force on u, or null: none laid, an unknown kind, broken, or down
  P.of = function (u) { var p = u && u.post; return p && P.KINDS[p.kind] && !u.postBroke && !u.dead && u.hp > 0 ? p : null; };
  P.kindOf = function (u) { var p = P.of(u); return p ? p.kind : null; };
  P.sig = function (p) { return p.kind + '|' + (p.at || '') + '|' + (p.to || ''); };
  // the ward a defender holds by (a { x, y, size } to measure from): `to` -- a square, or the id of a unit or a thing on the map -- else its rune, else where it stands
  P.ward = function (B, u) {
    var p = u.post, w = p.to != null ? p.to : p.at;
    if (typeof w === 'string') { var t = ((B || D.battle || {}).units || []).filter(function (x) { return x.id === w && !x.dead; })[0]; if (t) return { x: t.x, y: t.y, size: t.size || 1 }; w = p.at; }
    return w && w.length === 2 ? { x: w[0], y: w[1], size: 1 } : { x: u.x, y: u.y, size: 1 };
  };
  // the ground a holder's moves must end on: within r of the ward for DEFEND, its own square for STAND (where it stood when the fight began); null for the rest
  P.leash = function (u) {
    var p = P.of(u); if (!p) return null;
    if (p.kind === 'defend') { var w = P.ward(D.battle, u); return { x: w.x, y: w.y, size: 1, r: p.r != null ? +p.r : P.R }; }
    if (p.kind === 'stand' && u.postHome) return { x: u.postHome[0], y: u.postHome[1], size: 1, r: 0 };
    return null;
  };
  // THE LEASH: the reach map of a holder marks a square outside its ground as no place to stop -- unless it is nearer home than where it stands (put out of it by a shove or a
  // fall, it works its way back). Every move the AIs weigh (ai.js approach, the class turn's plans, a readied move) is read from G.reach, so the one wrap holds them all
  var reach1 = G.reach;
  G.reach = function (u, budget, o) {
    var rm = reach1.apply(this, arguments), L = u && u.post && !(o && o.ghost) ? P.leash(u) : null;
    if (!L) return rm;
    var d0 = G.dist(u, L);
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand || (e.x === u.x && e.y === u.y)) return; var d = G.dist(u, L, e.x, e.y); if (d > L.r && !(d < d0)) e.stand = false; });
    return rm;
  };

  // ---- what it knows of: one of ours in its sight with a clear line, or beside it (ai.js heroes knows every one not hidden, by ear: a posture asks for more)
  P.seen = function (B, u) {
    return B.units.filter(function (w) {
      return G.hostile(u, w) && G.standing(w) && !w.object && !w.look && !w.bystander && !(w.riding && !w.attached) && !RU.charmedBy(u, w) &&
        (G.dist(u, w) <= 5 || (!w.conds.hidden && D.magic.sees(B, u, w) && G.los(u, w).clear));
    });
  };
  P.heard = function (B, u) { var h = B.heardOf && B.heardOf(u); return h && G.dist(u, h) <= P.HEAR ? h : null; };
  // a blade (or a bite, a claw) to strike with, and the farthest its shots reach without disadvantage (a bow's or a thrown weapon's normal range, an attack cantrip's)
  P.melee = function (u) {
    if (u.weapon && u.weapon.name) return !u.weapon.ranged || !!(u.alt && u.alt.name && !u.alt.ranged);
    return Object.keys(u.attacks && typeof u.attacks === 'object' ? u.attacks : {}).some(function (k) { var a = u.attacks[k]; return a && a.dice && !a.ranged && !a.holdOnly; });
  };
  P.shot = function (u) {
    var r = 0, wr = function (w) { if (w && w.ranged && w.range) r = Math.max(r, w.range[0] || 0); };
    wr(u.weapon); if (!u.conds.disarmed) wr(u.alt);
    Object.keys(u.attacks && typeof u.attacks === 'object' ? u.attacks : {}).forEach(function (k) { wr(u.attacks[k]); });
    if (D.tactics && D.tactics.caster && D.tactics.caster(u)) r = Math.max(r, 60);
    if (u.breath && u.breath.ft) r = Math.max(r, u.breath.ft);
    return r;
  };
  // the foes a holder may go at this turn (STAND, DEFEND): in its reach now; in its shot with a clear line; for a defender, anyone on its ground, or in its reach from a
  // square of that ground it can get to this turn
  P.pool = function (B, u, L) {
    var arm = AI.reachOf(u), shot = P.shot(u), T = u.turn || {}, rm = null;
    return P.seen(B, u).filter(function (w) {
      if (G.dist(u, w) <= arm) return true;
      if (shot && G.range(u, w) <= shot && G.los(u, w).clear) return true;
      if (!L || !(L.r > 0) || !(T.move > 0)) return false;
      if (G.dist(w, L) <= L.r) return true;
      rm = rm || G.reach(u, T.move);
      return Object.keys(rm).some(function (k) { var e = rm[k]; return e.stand && G.dist(u, w, e.x, e.y) <= arm; });
    });
  };

  // ---- the break: u and every one of its unit, out of the posture for the fight; one line in the log
  P.breakOf = function (B, u, why) {
    var p = u.post; if (!p || u.postBroke) return;
    var s = P.sig(p), all = B.units.filter(function (w) { return w.post && w.side === u.side && !w.postBroke && P.sig(w.post) === s; });
    all.forEach(function (w) { w.postBroke = why || 'broken'; delete w.postPool; });
    var word = { stand: 'stands no longer', ambush: 'springs the ambush', patrol: 'breaks off its patrol', defend: 'leaves its post' }[p.kind];
    if (B.logOnly) B.logOnly([(B.shortName ? B.shortName(u) : u.name) + ' ' + word + ' (' + (why || 'broken') + ')' + (all.length > 1 ? ', and its ' + (all.length - 1) + ' with it' : '')]);
  };
  // a blow, hit or miss (battle.js attack, at its head): the striker, and the one struck at, are in the fight -- except a defender, which holds its ground whatever comes
  P.blow = function (B, att, tgt) {
    var ka = P.kindOf(att), kt = tgt && P.kindOf(tgt);
    if (ka && ka !== 'defend') P.breakOf(B, att, 'strikes');
    if (kt && kt !== 'defend') P.breakOf(B, tgt, 'is attacked');
  };

  // ---- the fight's start (battle.js run, before the entry card): each laid foe's home, its hit points, a patrol's place in its unit's file, and the ambushers hidden --
  // each with its own Stealth, held (Battle.hide's `hidTotal`: found by a passing watch's passive Perception and its bonus, battle.js spots, or by a Search)
  P.bonus = function (u) { return u.stealth || D.mod(u.abil ? u.abil.dex : 10); }; // (a block that names no Stealth checks with its DEX: SRD 5.1, an ability check without the skill)
  P.start = function (B) {
    var any = false;
    B.units.forEach(function (u) {
      var p = u.post; if (!p || !P.KINDS[p.kind] || u.dead) return; any = true;
      u.postHome = [u.x, u.y]; u.postHp = u.hp; delete u.postBroke; delete u.postPool;
      if (p.kind === 'patrol' && p.at && p.to) { u.postOff = [u.x - p.at[0], u.y - p.at[1]]; u.postLeg = 'to'; }
      if (p.kind === 'ambush') {
        var s0 = u.stealth; u.stealth = P.bonus(u); var q = B.stealthRoll(u); u.stealth = s0;
        u.conds.hidden = true; u.hidTotal = q.total; u.postRoll = q.r;
        if (D.spr && D.spr.anim(u.sheet, 'hide')) { u.anim = 'hide'; u.animT = B.t || 0; } // (a sheet's crouch held while hidden: js/ui.js)
      }
    });
    return any;
  };
  // THE SURPRISE: the ambushers hidden above, the roll is the grid's own for any fight (battle.js Battle.surpriseRoll -- each hider's Stealth against each passive
  // Perception on the other side, an enemy in plain sight noticed; RULED 11-10, "we should have 'real' surprise"). Kept by this name for the rules show's beat
  P.surprise = function* (B) { return yield* B.surpriseRoll(); };

  // ---- the turn: true when the posture took it; false hands it to the AI's own turn (the brute's, the class turn's), with u.postPool for a holder
  P.turn = function* (B, u) {
    delete u.postPool;
    var p = P.of(u); if (!p) return false;
    if (u.postHp != null && u.hp < u.postHp && p.kind !== 'defend') { P.breakOf(B, u, 'is hurt'); return false; } // (a spell's harm: a blow broke it already, P.blow)
    u.postHp = u.hp;
    if (p.kind === 'ambush') return yield* ambushTurn(B, u);
    if (p.kind === 'patrol') return yield* patrolTurn(B, u, p);
    return yield* holdTurn(B, u);
  };
  // walk toward a square: onto it when this turn's move reaches it (ai.js approach reads a reach of 0 as the arm's 5 ft, and would stop a square short), else as near as
  // the move goes -- for a holder `r`, onto any square within r of it
  P.goTo = function* (B, u, sq, r) {
    var T = u.turn, rm = G.reach(u, T.move), k = sq[0] + ',' + sq[1];
    var e = !r && rm[k] && rm[k].stand ? rm[k] : AI.approach(u, { x: sq[0], y: sq[1], size: 1 }, rm, r || 5);
    if (e && (e.x !== u.x || e.y !== u.y)) { yield* AI.walkTo(B, u, e); return true; }
    return false;
  };
  function* ambushTurn(B, u) {
    if (!u.conds.hidden) { P.breakOf(B, u, 'is found'); return false; }
    var sn = P.seen(B, u), mel = P.melee(u), arm = AI.reachOf(u), shot = P.shot(u);
    // its prey: in its reach -- or, one with no blade, in its shot's normal range (a bow readied would loose at the long range, so an archer waits for the near one)
    var prey = sn.filter(function (w) { return mel ? G.dist(u, w) <= arm : shot && G.range(u, w) <= shot && G.los(u, w).clear; });
    if (prey.length) { P.breakOf(B, u, 'strikes from hiding'); return false; }
    // THE SURPRISE ROUND SPENT (RULED 11-11, Griz, on the desk's lean "An ambush that surprises its targets should spend that round, with javelins if that's all that reaches":
    // "that's my lean too"; his first word on it, "i bet the ambushers wasted surprised as tasked with protect - if they had ranged though..."): in round 1, one of ours caught
    // unaware (Battle.caught) and in its shot's NORMAL range with a clear line -- no shot at long range from hiding -- it looses from where it lies hidden, the blow springing the
    // ambush (P.blow) and Surprise Attack's dice where its sheet has them; a melee blow is the prey above, one already in reach. Nothing that reaches: it holds as before
    var cgt = B.round === 1 && shot ? sn.filter(function (w) { return D.Battle.caught(w, u) && G.range(u, w) <= shot && G.los(u, w).clear; }) : [];
    if (cgt.length) {
      var T = u.turn, ks = Object.keys(u.attacks && typeof u.attacks === 'object' ? u.attacks : {}).filter(function (k) { var a = u.attacks[k]; return a && a.ranged && a.range && a.dice && !a.holdOnly; });
      if (u.weapon && u.weapon.name || !ks.length || !T || !(T.action > 0)) { P.breakOf(B, u, 'looses from hiding'); return false; } // (a class foe's own turn takes the shot: tactics.js)
      var tg = cgt.slice().sort(function (p, q) { return RU.ac(p) - RU.ac(q) || p.hp - q.hp; })[0];
      var k1 = ks.filter(function (k) { return G.range(u, tg) <= u.attacks[k].range[0]; }).sort(function (a, b) { return D.tactics.avg(u.attacks[b].dice) - D.tactics.avg(u.attacks[a].dice); })[0];
      if (k1) { P.breakOf(B, u, 'looses from hiding'); T.action = 0; yield* B.attack(u, tg, u.attacks[k1]); return true; }
    }
    if (sn.length && mel) yield* P.ready(B, u); // (one of ours in sight: the blade readied for the first that comes in reach -- unseen, battle.js exec 'ready')
    return true;
  }
  function* holdTurn(B, u) {
    var L = P.leash(u), T = u.turn;
    // out of its ground (a shove, a fall, laid outside its ward's reach): back first
    if (L && G.dist(u, L) > L.r && T.move > 0 && (yield* P.goTo(B, u, [L.x, L.y], L.r)) && (u.dead || u.hp <= 0 || B.over())) return true;
    var pool = P.pool(B, u, L);
    if (pool.length) { u.postPool = pool.map(function (w) { return w.id; }); return false; }
    if (P.seen(B, u).length || P.heard(B, u)) yield* P.ready(B, u); // (nobody it knows of: it holds, and says nothing)
    return true;
  }
  P.leg = function (u, p) {
    var b = u.postLeg === 'at' ? p.at : p.to, o = u.postOff || [0, 0], q = [b[0] + o[0], b[1] + o[1]], s = G.map && G.map.at(q[0], q[1]);
    return s && s.walk ? q : b.slice(); // (its place in the unit's file at the far end, else the square itself)
  };
  function* patrolTurn(B, u, p) {
    var sn = P.seen(B, u), hd = P.heard(B, u);
    if (sn.length || hd) { P.breakOf(B, u, sn.length ? 'sees ' + sn[0].name : 'hears the fight'); return false; }
    var T = u.turn; if (!p.at || !p.to || !(T.move > 0)) return true;
    var goal = P.leg(u, p);
    if (u.x === goal[0] && u.y === goal[1]) { u.postLeg = u.postLeg === 'at' ? 'to' : 'at'; goal = P.leg(u, p); }
    if (yield* P.goTo(B, u, goal, 0)) { if (u.dead || u.hp <= 0 || B.over()) return true; }
    else u.postLeg = u.postLeg === 'at' ? 'to' : 'at'; // (as near as it gets, the way blocked: it turns back)
    if (u.x === goal[0] && u.y === goal[1]) u.postLeg = u.postLeg === 'at' ? 'to' : 'at';
    var sn2 = P.seen(B, u); // (what it walked into: the rest of the turn is the fight's)
    if (sn2.length) { P.breakOf(B, u, 'comes on ' + sn2[0].name); return false; }
    return true;
  }
  // a turn handed over, done: its pool let go; a holder with the action still unspent Readies
  P.after = function* (B, u) {
    delete u.postPool;
    var k = P.kindOf(u); if (k !== 'defend' && k !== 'stand') return;
    var T = u.turn; if (T && T.action > 0 && !T.attacksLeft && !u.ready && !T.waits && (P.seen(B, u).length || P.heard(B, u))) yield* P.ready(B, u);
  };

  // ---- READY (SRD 5.1; battle.js exec 'ready'): the class turn's own pick (TX.readyUp: a cantrip, a bow, the blade), else the stat block's best blade, else its shot
  P.readyAtk = function (u) {
    var best = null, bs = -1, avg = D.tactics && D.tactics.avg ? D.tactics.avg : function () { return 0; };
    Object.keys(u.attacks && typeof u.attacks === 'object' ? u.attacks : {}).forEach(function (k) { var a = u.attacks[k]; if (!a || !a.dice || a.holdOnly) return; var s = (a.ranged ? 0 : 1000) + avg(a.dice) + (a.mod || 0); if (s > bs) { bs = s; best = k; } });
    return best;
  };
  P.ready = function* (B, u) {
    var T = u.turn; if (!T || !(T.action > 0) || T.attacksLeft || u.ready || u.conds.disarmed) return false;
    if (u.classAI && D.tactics && D.tactics.readyUp && u.weapon && u.weapon.name) { yield* D.tactics.readyUp(B, u); if (u.ready) return true; }
    var k = P.readyAtk(u); if (k) yield* B.exec(u, { do: 'ready', pick: 'attack', atk: k });
    return !!u.ready;
  };
  // the class turn with nothing worth doing at its pool (tactics.js act): a holder Readies where it stands instead of closing in
  if (D.tactics && D.tactics.IDLE) D.tactics.IDLE.unshift(function* (B, u) {
    var k = P.kindOf(u); if (k !== 'defend' && k !== 'stand') return false;
    if (!u.ready) yield* P.ready(B, u);
    return true;
  });
})();
