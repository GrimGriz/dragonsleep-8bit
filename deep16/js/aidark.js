/* DEEP16 -- the AI's side of light and dark (11-13, the ai-lights seat; the AI and the dark 2.1-2.5, on Griz's 09-29 words: "The AI lights up: yes";
   "if the fight happens in the dark, involves those without darkvision, and doesn't have another reason not to, the various participants should already be
   holding torch, lantern, or someone glowing with Light as logical" -- both sides; which groups, "based on dark map and party darkvision (or reason to work
   in the dark)"; the AI knows when to go without light, "definitely"). Five pieces, one file:

   2.1 PRE-LIT (AD.prelight, called from battle.js enter): on dark ground a side the AI runs that has anyone with hands who cannot see in the dark, and who
       is not already standing in the place's own light, walks in with one light -- Light on its front man if one of them knows the cantrip, else a lantern
       or a torch in the free hand of the one nearest the front, else (every hand full) a torch burning on the floor at the front man's feet. Not a side
       with a light-hater in it, not under a roost (a hooded lantern there, hood down), not a kind whose sheet says `worksDark` (the sect's blades), not
       a fight whose record says `dark: 'works'` or `prelit: false`. The player's own four are the player's: the field's torch, the camp's, the wheel.
   2.2 THE AI'S TORCH (AD.strike): one the AI runs may strike a light -- the action, as a hero's (SRD 5.1, the tinderbox) -- from the party's pack on our
       side, from its own kit on theirs (u.lightKit: every foe with hands and no eyes for the dark carries one torch; a sheet's `lightKit: 'lantern'`).
   2.3 WHAT A LIGHT IS WORTH (AD.worth): only where the dark is one-sided -- they see us, we do not see them: the SRD's unseen target and unseen attacker.
       With both sides blind the two cancel and a light buys no roll, so none is struck. The class AI weighs it against its other plans (TX.ACTIONS, and
       the Light cantrip's EV.light); the brute strikes one when it can see no one a light would show and one of them sees it.
   2.4 GOING DARK (AD.wantsDark): when nobody left standing on its side needs the light and it blinds someone on the other, the one holding it puts it out
       (the turn's free hand on an object), and one that passes a torch or a lantern burning on the floor stamps it out (the same free hand: the seat's
       call, for his overrule). A shooter that sees in the dark looks for a square where none of its marks can see it (AD.perch: the SRD's advantage).
   2.5 THE LANTERN IN ITS HANDS: a lantern before a torch where there is one; lit hood down under a roost (dim 5 ft, and the roof sleeps), hood up
       anywhere else. A light costs the AI what it costs a hero (AD.hand): the off hand, so not with a shield, not with a second weapon in the routine;
       and a two-handed weapon lets it fall on the first swing or shot (battle.js attack, AD.twoHands).
   D.AIDARK = false turns all of it off (the bench's aidark=0: the fights as they were). */
'use strict';
(function () {
  var D = window.D16, G = D.grid, L = D.light, AI = D.ai, TX = D.tactics;
  var AD = D.aidark = {};
  AD.HORIZON = 2;   // the rounds a light is reckoned to keep paying, against a blow now
  function on() { return D.AIDARK !== false; }
  function M() { return D.magic; }
  function sheet(u, k) { var d = D.FOES && u.kind && D.FOES[u.kind]; return d ? d[k] : undefined; }
  function member(u) { return !!u && !u.object && !u.isWall && !u.bystander && !u.familiar && !u.dead && !u.left && !u.fled && !u.riding && !u.ethereal; }
  function up(u) { return member(u) && u.hp > 0 && G.standing(u); }
  function sideOf(B, side) { return B.units.filter(function (u) { return u.side === side && member(u); }); }
  function roost(B) { return !!(B.fight && B.fight.roost); }
  function nm(B, u) { return u.side === 'foe' ? AI.the(B, u) : u.name; }
  function aiRun(u) { return u.side === 'foe' || !!(u.guest || u.ally || u.summon); } // (`guest` is the mark of one of ours the AI plays: a class hero the player plays -- the Pocket DM's band -- is classAI and no guest)
  function ownKit(u) { return u.side === 'foe' || !!u.ally; } // (its own torch on its belt; one of ours the AI runs takes from the party's pack)
  // eyes for the dark: darkvision, truesight, a blindsight that reaches a fight, or no eyes at all (the grimlock)
  AD.darkSighted = function (u) { return !!(u.darkvision || u.truesight || u.blind || (u.blindsight || 0) >= 30); };
  // hands to carry a light, and the wit to bring one: a class unit, a humanoid sheet, or a sheet that says so
  AD.hasHands = function (u) { return !!(u.src || u.cls || u.type === 'humanoid' || sheet(u, 'hands')); };
  AD.worksDark = function (B, u) { var F = B.fight || {}; return !!(u.worksDark || sheet(u, 'worksDark') || (u.side === 'foe' && (F.dark === 'works' || F.prelit === false))); };
  // a hand for a light, as a hero pays for one (light.js L.handForLight): the off hand empty. A sheet foe has no kit to read, so its block is: a shield is
  // the off hand, and so is a second melee weapon in its routine (Hask: the bar and the knife)
  AD.hand = function (u) {
    if (u.torch) return false;
    if (u.src || (u.weapon && u.weapon.id)) return L.handForLight(u);
    if (u.shield) return false;
    if (Array.isArray(u.multi)) { var seen = {}; u.multi.forEach(function (k) { var a = u.attacks && u.attacks[k]; if (a && !a.ranged) seen[k] = 1; }); if (Object.keys(seen).length >= 2) return false; }
    return AD.hasHands(u);
  };
  // a sheet foe swinging or loosing something that wants both hands with a light in the other: it lets the light fall first (battle.js attack). A hand
  // crossbow is one hand (SRD 5.1); the rest of the bows and crossbows are two, and the weapons the SRD marks two-handed by name
  AD.twoHands = function (att, atk) {
    if (!on() || !att || !atk || att.src || (att.weapon && att.weapon.id) || atk.spell || atk.thrown) return false;
    if (atk.twoHanded) return true;
    var n = String(atk.name || '');
    if (/hand crossbow/i.test(n)) return false;
    return /crossbow|longbow|shortbow|^great|glaive|halberd|pike|maul/i.test(n);
  };
  // what it could light now: 'lantern' before 'torch'; null with neither
  AD.kit = function (B, u) {
    if (ownKit(u)) return u.lightKit || null;
    return L.inPack(B, 'lantern') ? 'lantern' : L.inPack(B, 'torch') ? 'torch' : null;
  };
  AD.radii = function (B, kind) { return L.radii(kind === 'torch' ? { lit: true } : L.make(kind, roost(B))); };
  function shySide(B, side) { return sideOf(B, side).some(function (w) { return w.lightSensitive; }); }
  AD.canStrike = function (B, u) {
    if (!B.dark || !up(u) || !AD.hasHands(u) || AD.worksDark(B, u) || u.conds.hidden || u.conds.invisible) return false;
    var k = AD.kit(B, u); if (!k || !AD.hand(u)) return false;
    if (roost(B) && k === 'torch') return false; // (the roost's one law: no fire -- light.js L.canLight)
    if (u.hang && G.hanging && G.hanging(u)) return false;
    return !shySide(B, u.side);
  };
  // the light struck: the action is the caller's to spend
  AD.strike = function* (B, u, kind) {
    if (!ownKit(u)) { yield* L.lightTorch(B, u, kind); return; } // (ours: out of the pack, the hero's own way -- hood down under a roost, the card, the recoil)
    var lantern = kind !== 'torch', hood = lantern && roost(B);
    u.lightKit = null; u.torch = lantern ? L.make(kind, hood) : { lit: true };
    var r = L.radii(u.torch);
    D.sfx('fire'); D.fx.sparkle(u, 'fire', 14);
    if (hood) { if (B.lightMap) B.lightMap = null; B.card(['{y}' + nm(B, u) + '{/} lights a lantern with the hood down: {o}dim light 5 ft{/}, and nothing overhead stirs.'], 420); yield 30; return; }
    yield* M().brighten(B, u, 'torch', '{y}' + nm(B, u) + '{/} strikes a light: ' + (lantern ? 'a hooded lantern' : 'a torch') + ', {o}bright ' + r.bright + ' ft{/} and dim ' + r.dim + ' more.', { x: u.x, y: u.y, bright: r.bright });
  };

  // ---------------------------------------------------------------- 2.1 pre-lit
  function give(B, u, kind) {
    if (ownKit(u)) u.lightKit = null;
    else { var s = (B.inv || []).filter(function (x) { return x.id === kind; })[0]; if (!s || s.n < 1) return false; s.n--; }
    u.torch = kind === 'torch' ? { lit: true } : L.make(kind, roost(B));
    return true;
  }
  function prelightSide(B, side) {
    var us = sideOf(B, side).filter(function (u) { return u.hp > 0; });
    if (!us.length) return null;
    if (side === 'party' && (B.o.torch || (B.o.embed && B.o.embed.torch) || !us.every(aiRun))) return null; // (the player's four are the player's)
    // the kits: a foe (or a lent ally) with hands and no eyes for the dark carries one light of its own, whether or not it walks in lit
    us.forEach(function (u) { if (ownKit(u) && u.lightKit === undefined) u.lightKit = !AD.darkSighted(u) && AD.hasHands(u) && !AD.worksDark(B, u) ? (sheet(u, 'lightKit') || 'torch') : null; });
    if (shySide(B, side)) return null;
    if (us.some(function (u) { return L.carried(u).length > 0; })) return null; // (a light on one of them already: the camp's, a glow of its own)
    var need = us.filter(function (u) { return !AD.darkSighted(u) && AD.hasHands(u) && !AD.worksDark(B, u) && L.levelOf(B, u) < 1; });
    if (!need.length) return null;
    var foes = B.units.filter(function (w) { return w.side !== side && member(w); });
    var front = function (u) { return foes.length ? Math.min.apply(null, foes.map(function (f) { return G.dist(u, f); })) : 0; };
    var byFront = function (a, b) { return front(a) - front(b); }, man = need.slice().sort(byFront)[0], rs = roost(B);
    // someone glowing with Light: the cantrip costs no hand (never under a roost: bright light wakes it)
    var caster = !rs && us.filter(function (u) { return (u.known || []).indexOf('light') >= 0; })[0];
    if (caster) { man.conds.light = { by: caster.id, from: null, lv: 0 }; return { how: 'light', who: man.id, by: caster.id }; }
    // a light in a hand: the one with a hand for it nearest the front -- one who needs it before one who does not, the sneak last
    var can = us.filter(function (u) { var k = AD.kit(B, u); return k && AD.hasHands(u) && AD.hand(u) && !AD.worksDark(B, u) && !(rs && k === 'torch'); });
    var rank = function (u) { return (AD.darkSighted(u) ? 2 : 0) + (u.cls === 'rogue' || u.sneak ? 1 : 0); };
    var pick = can.slice().sort(function (a, b) { return rank(a) - rank(b) || byFront(a, b); })[0];
    if (pick) { var k = AD.kit(B, pick); if (give(B, pick, k)) return { how: k, who: pick.id }; }
    // every hand full: a torch set burning on the floor where the front man stands (not under a roost)
    var owner = !rs && us.filter(function (u) { return AD.kit(B, u) === 'torch' && AD.hasHands(u) && !AD.worksDark(B, u); })[0];
    if (owner && !L.torchAt(B, man.x, man.y)) {
      if (ownKit(owner)) owner.lightKit = null; else { var st = (B.inv || []).filter(function (x) { return x.id === 'torch'; })[0]; if (!st || st.n < 1) return null; st.n--; }
      B.torchSeq = (B.torchSeq || 0) + 1;
      B.lights = (B.lights || []).concat([{ id: 'torch' + B.torchSeq, kind: 'torch', hood: false, item: undefined, x: man.x, y: man.y, bright: L.TORCH.bright, dim: L.TORCH.dim, color: 'gold', flame: true, by: owner.id }]);
      return { how: 'floor', who: man.id, by: owner.id };
    }
    return null;
  }
  AD.prelight = function (B) {
    B.prelit = {};
    if (!on() || !B || !B.dark || !B.map) return;
    ['foe', 'party'].forEach(function (side) { var r = prelightSide(B, side); if (r) B.prelit[side] = r; });
    if (B.lightMap) B.lightMap = null;
  };

  // ---------------------------------------------------------------- 2.3 what a light is worth
  // the foes a light of `ft` feet about w would show to one of u's side who cannot see them for the dark while they see him: per blind friend, most of
  // his blows back (0.4 of them: disadvantage on a 60% blow is about that; half again for a caster, who cannot aim a spell at what he cannot see), less
  // where he already has someone in sight; and a fifth of each such foe's blows (its advantage gone)
  AD.worth = function (B, u, w, ft) {
    if (!on() || !B.dark || shySide(B, u.side)) return 0;
    var mine = sideOf(B, u.side).filter(up), foes = B.units.filter(function (f) { return G.hostile(u, f) && up(f) && !f.conds.hidden; });
    var lit = foes.filter(function (f) { return G.dist(w, f) <= ft; });
    if (!lit.length) return 0;
    var gain = 0, freed = {};
    mine.forEach(function (a) {
      if (AD.darkSighted(a) || a.conds.blinded) return;
      var asym = lit.filter(function (f) { var v = M().seeWhy(B, a, f); return !v.ok && v.why === 'dark' && M().sees(B, f, a); });
      if (!asym.length) return;
      var sees = foes.some(function (f) { return G.dist(a, f) <= 30 && M().sees(B, a, f); });
      gain += (sees ? 0.15 : 0.4) * TX.dpr(a) * (TX.caster && TX.caster(a) ? 1.5 : 1);
      asym.forEach(function (f) { freed[f.id] = f; });
    });
    Object.keys(freed).forEach(function (id) { gain += 0.2 * TX.dpr(freed[id]); });
    return gain * AD.HORIZON;
  };
  // the brute's rule: no one a light would show is seen, and one of them sees it
  AD.blindTo = function (B, u, ft) {
    var foes = B.units.filter(function (f) { return G.hostile(u, f) && up(f) && !f.conds.hidden && G.dist(u, f) <= ft; });
    if (!foes.length || foes.some(function (f) { return M().sees(B, u, f); })) return [];
    return foes.filter(function (f) { var v = M().seeWhy(B, u, f); return !v.ok && v.why === 'dark' && M().sees(B, f, u); });
  };

  // ---------------------------------------------------------------- 2.4 going dark
  AD.wantsDark = function (B, u) {
    if (!on() || !B.dark) return false;
    var mine = sideOf(B, u.side).filter(up), foes = B.units.filter(function (w) { return G.hostile(u, w) && up(w); });
    if (!foes.length || !mine.length || !mine.every(AD.darkSighted)) return false; // (someone of its own still needs the light)
    return foes.some(function (f) { return !AD.darkSighted(f); });                    // (and the dark blinds one of theirs)
  };
  function* goDark(B, u) {
    var T = u.turn; if (!T || T.freeObj || !u.torch || u.torch.lit === false || !AD.wantsDark(B, u)) return false;
    T.freeObj = true;
    if (!ownKit(u)) { L.douseTorch(B, u); if (B.lightMap) B.lightMap = null; yield 20; return true; }
    var t = u.torch, lantern = L.kindOf(t) === 'lantern'; delete u.torch; u.lightKit = lantern ? (t.item || 'lantern') : 'torch';
    if (B.lightMap) B.lightMap = null;
    B.card(['{y}' + nm(B, u) + '{/} puts the ' + L.word(t) + ' out.  {o}It sees in the dark, and not everyone here does.{/}'], 300); yield 24;
    return true;
  }
  // a torch or a lantern burning on the floor within its reach, and no one of its side needing it: stamped out (the free hand on an object). A lantern is
  // never lost: ours goes back in the pack, as Gust of Wind leaves it (light.js L.gust)
  function* stampOut(B, u) {
    var T = u.turn; if (!T || T.freeObj || !up(u) || u.conds.hidden) return false;
    if (!(AD.hasHands(u) || ((u.abil || {}).int || 0) >= 6) || !AD.wantsDark(B, u)) return false;
    var ft = G.foot(u), t = (B.lights || []).filter(function (l) { return (l.kind === 'torch' || l.kind === 'lantern') && ft.some(function (q) { return Math.max(Math.abs(q[0] - l.x), Math.abs(q[1] - l.y)) <= 1; }); })[0];
    if (!t) return false;
    T.freeObj = true; B.lights = B.lights.filter(function (l) { return l !== t; }); if (B.lightMap) B.lightMap = null;
    var by = B.units.filter(function (w) { return w.id === t.by; })[0], ours = t.kind === 'lantern' && (!by || !ownKit(by));
    if (ours) { var id = t.item || 'lantern', s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s) s.n++; else (B.inv = B.inv || []).push({ id: id, n: 1 }); }
    D.sfx('step');
    B.card(['{y}' + nm(B, u) + '{/} ' + (t.kind === 'lantern' ? 'shuts the ' + L.word(t) + ' on the floor' + (ours ? ': out, and back in the pack.' : ': out.') : 'stamps out the torch on the floor.') + '  {o}It is dark there.{/}'], 300); yield 24;
    return true;
  }
  // a shooter with eyes for the dark: a square to loose from where none of the marks it can see from there sees it. `vis`: those marks
  AD.unseenAt = function (B, u, x, y, vis) {
    var probe = Object.assign({}, u, { x: x, y: y });
    return vis.length > 0 && vis.every(function (w) { return !M().sees(B, w, probe); });
  };
  AD.perch = function (B, u, x, y, vis) { return on() && B.dark && AD.darkSighted(u) && !u.torch && AD.unseenAt(B, u, x, y, vis) ? 8 : 0; };
  // it stands where a mark sees it, and has the eyes to do better: look for a perch this turn
  AD.wantsPerch = function (B, u, hs) {
    if (!on() || !B.dark || !AD.darkSighted(u) || u.torch || !hs.length) return false;
    return hs.some(function (w) { return M().sees(B, w, u); }) && hs.some(function (w) { return !AD.darkSighted(w); });
  };

  // ---------------------------------------------------------------- the hooks: the brute's turn (ai.js turnOf), the class turn (tactics.js)
  // before a turn that is not the class AI's: the light put out if it wants the dark; else a light struck, the action, when the dark is one-sided against it
  AD.first = function* (B, u) {
    if (!on() || !B.dark || u.classAI || !u.turn || !up(u) || u.familiar || u.script) return;
    if (yield* goDark(B, u)) return;
    if (yield* stampOut(B, u)) return; // (before it walks off from it: the free hand)
    var T = u.turn; if (!T.action || !AD.canStrike(B, u)) return;
    var k = AD.kit(B, u), r = AD.radii(B, k);
    if (!AD.blindTo(B, u, r.bright + r.dim).length) return;
    T.action = 0; yield* AD.strike(B, u, k);
  };
  // after any AI turn: a light on the floor beside it stamped out
  AD.after = function* (B, u) { if (on() && B.dark && u.turn && !u.familiar) yield* stampOut(B, u); };
  if (TX) {
    TX.FIRST.push(function* (B, u) { if (on() && B.dark && !(yield* goDark(B, u))) yield* stampOut(B, u); });
    TX.ACTIONS.push(function (B, u) {
      var T = u.turn; if (!on() || !B.dark || !T || !T.action || T.attacksLeft || !AD.canStrike(B, u)) return null;
      var k = AD.kit(B, u), r = AD.radii(B, k), s = AD.worth(B, u, u, r.bright + r.dim);
      if (!(s > 0)) return null;
      return { kind: 'item', id: k, score: s, why: 'strikes a light (the ' + L.word(k) + ')', go: function* () { u.turn.action = 0; yield* AD.strike(B, u, k); } };
    });
    // the Light cantrip in a one-sided dark: on the friend within a touch whose light shows the most (tactics.js EV.light keeps its own case, the light-haters)
    var light0 = TX.EVAL && TX.EVAL.light;
    if (TX.EVAL) TX.EVAL.light = function (B, u, e, slot, fs, allies) {
      var best = light0 ? light0.apply(this, arguments) : null;
      if (!on() || !B.dark || roost(B)) return best;
      (allies || []).concat((allies || []).indexOf(u) < 0 ? [u] : []).forEach(function (w) {
        if (!up(w) || G.dist(u, w) > 5 || (w.conds && (w.conds.light || w.conds.hidden || w.conds.invisible))) return;
        var s = AD.worth(B, u, w, 40);
        if (s > 0 && (!best || s > best.score)) best = { score: s, t: w };
      });
      return best;
    };
  }
})();
