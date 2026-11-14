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
      if (d.madeStates) S.madeInit(u, d); // (a made thing: normal, withered or charged -- THE MADE THINGS' STATES, below)
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
    var fl = S.fed(B, u, lv);
    B.card(['{r}' + the(B, u, true) + '{/} drinks: {p}a level ' + lv + ' spell slot{/} from ' + host.name + ', gone.  {g}(no blood; ' + Math.min(10, u.drained) + ' of 10' + (u.drained >= 10 ? ': full' : ' so far') + '){/}'].concat(fl ? [fl] : []), fl ? 260 : 160);
    return true;
  };

  // ------------------------------------------------------------------ the mirror wolf's and the mirror worg's bite (battle.js, where the knockdown is read: atk.unspell)
  // THE FAMILY'S RULE (data/foes.js, above the mirror wolf): the wolf's knockdown, the same save at the same DC (STR, atk.prone), falls on the magic -- 'conc' the spell the
  // bitten one is holding, 'slot' its lowest slot left. Returns true when there was magic for it to fall on (saved or not: no knockdown then), false when there was none
  // (and the bite knocks prone as the original's does)
  S.mirrorBite = function* (B, att, tgt, atk) {
    var how = atk.unspell, lv = how === 'slot' ? S.lowSlot(tgt) : 0, held = how === 'conc' && tgt.conc ? tgt.conc.name : null;
    if (!(how === 'slot' ? lv : held)) return false;
    var sv = RU.save(tgt, 'str', atk.prone), head = '{r}' + tgt.name + '{/}: STR save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  ';
    if (sv.ok) { B.card([head + '{n}HOLDS{/}  {g}' + (how === 'slot' ? tgt.name + ' keeps every slot.' : tgt.name + ' keeps hold of ' + held + '.') + '{/}']); yield 24; return true; }
    FX.sparkle(tgt, 'violet', 10); D.sfx('poison');
    if (how === 'slot') {
      tgt.slots[lv - 1]--; FX.float('-1 slot', tgt, D.PAL.ramps.violet[5]);
      var fs = S.fed(B, att, lv);
      B.card([head + '{o}FAILED{/}', '{r}' + the(B, att, true) + '{/} tears it out: {p}a level ' + lv + ' spell slot{/} of ' + tgt.name + '\'s, gone.  {g}(the worg\'s knockdown, fallen on the magic: ' + tgt.name + ' stays up){/}'].concat(fs ? [fs] : []));
    } else {
      var fc = S.fed(B, att, S.heldLevel(tgt.conc)); // (a concentration ended counts as the level of the spell that was held)
      B.card([head + '{o}FAILED{/}', '{r}' + the(B, att, true) + '{/} pulls it down: {p}' + held + '{/}.  {g}(the wolf\'s knockdown, fallen on the spell: ' + tgt.name + ' stays up){/}'].concat(fc ? [fc] : []));
      D.magic.endConc(B, tgt, 'pulled down');
    }
    yield 24; return true;
  };

  // ------------------------------------------------------------------ THE MADE THINGS' STATES (2026-11-14, the made-states seat; the clock lane's last sections)
  // RULED 11-14, Griz to the lanes desk, verbatim:
  //   "1 - good" -- to the desk's lean: FED is its rider landing (the mirror wolf ends a concentration, the mirror worg tears out a slot; by THE FAMILY'S RULE the mirror
  //     wisp's Consume Magic and the mirror stirge's drink are the same thing -- the desk's reading), and it changes sheet right there in the fight: withered goes to
  //     normal, normal goes to charged.
  //   "2 - more than 3 days without feeding they poof out of existence. Approved." -- to the lean: WITHERED is one met three or more days after its making day with
  //     nothing eaten: half HP, speed -10, -2 to hit. (The days are js/world.js W.madeState: THE MADE THINGS' CLOCK.)
  //   "3 - rather than 1d6 force on the bite, HP as you said, +2 to hit, damage die steps up 1 (i.e. 1d6 becomes 1d8)" -- CHARGED, for the rest of the fight: 5 temporary
  //     hit points a level of the spell it took, +2 to hit, its damage die one step up. No force rider.
  //   11-13, to the cutter of the wolves: "grid will adjust stats and such for withered and charged states".
  // A made thing is a block with `madeStates` (data/foes.js: the mirror wisp, stirge, wolf, worg and hyena). It stands NORMAL unless the clock says otherwise (the road's
  // fight sets it as the fight opens: js/world.js World.fight). The numbers are laid on the unit, never the block: its attacks are its own copies. The sheet is the art
  // desk's for the state where one is cut (<sheet>_emaciated_p1, <sheet>_overcharged_p1 on the same cell and foot), else the Normal sheet in every state.
  // THE SEAT'S CALLS, each standing for his overrule: a withered one that feeds has its full hit-point ceiling back and its hit points as they stood (nothing mended by
  // the change itself), and no temporary hit points -- those are the charged state's; a charged one that feeds again stays charged and takes the new temporary hit points
  // only if they are more (the SRD: temporary hit points do not add); "speed" is its flying speed too; the die steps d4, d6, d8, d10, d12 and a d12 stays; half of an odd
  // number of hit points rounds down, never under 1; a spell held with no level known counts as its own level, else 1; a cantrip held is level 0: charged, no hit points
  S.MADE = { hp: 0.5, speed: -10, hit: -2, chargedHit: 2, temp: 5, sheet: { withered: 'emaciated', charged: 'overcharged' } };
  S.DIE = [4, 6, 8, 10, 12];
  S.dieUp = function (dice) { return String(dice).replace(/d(\d+)/, function (m, n) { var i = S.DIE.indexOf(+n); return 'd' + (i >= 0 && i < S.DIE.length - 1 ? S.DIE[i + 1] : n); }); };
  S.stateSheet = function (base, state) { var tag = S.MADE.sheet[state], sh = tag ? String(base).replace(/_p(\d+)$/, '_' + tag + '_p$1') : base; return sh !== base && D.SHEETS && D.SHEETS[sh] ? sh : base; };
  S.madeInit = function (u, d) {
    u.madeState = 'normal'; u.made0 = { hp: u.maxhp, sheet: u.sheet, attacks: d.attacks, spd: 0 };
    var more = ['withered', 'charged'].map(function (st) { return S.stateSheet(u.sheet, st); }).filter(function (sh) { return sh !== u.sheet; });
    if (more.length && D.spr && D.spr.prefetch) { try { D.spr.prefetch(more); } catch (e) { /* (a look: the fight goes on without it) */ } }
  };
  S.setState = function (B, u, state) { // (the state's numbers and its sheet laid on the unit: 'normal', 'withered' or 'charged'. True when it changed)
    if (!u || !u.made0 || u.madeState === state || !/^(normal|withered|charged)$/.test(state)) return false;
    var K = S.MADE, m0 = u.made0, hit = state === 'withered' ? K.hit : state === 'charged' ? K.chargedHit : 0, spd = state === 'withered' ? K.speed : 0, at = {};
    Object.keys(m0.attacks || {}).forEach(function (k) { var a = Object.assign({}, m0.attacks[k]); if (a.atk != null && !a.noRoll) a.atk += hit; if (state === 'charged' && a.dice) a.dice = S.dieUp(a.dice); at[k] = a; });
    u.attacks = at;
    var dv = spd - m0.spd; u.speed = Math.max(0, (u.speed || 0) + dv); if (u.walkSpeed != null) u.walkSpeed = Math.max(0, u.walkSpeed + dv); m0.spd = spd;
    var mx = state === 'withered' ? Math.max(1, Math.floor(m0.hp * K.hp)) : m0.hp; u.maxhp = mx; if (u.hp > mx) u.hp = mx;
    u.sheet = S.stateSheet(m0.sheet, state); u.madeState = state; if (B) B.cache = null;
    return true;
  };
  S.heldLevel = function (conc) { // (the level of a spell held: the cast's own where the engine kept it, else the spell's)
    if (!conc) return 0; if (conc.level != null) return conc.level; if (conc.lv != null) return conc.lv;
    var sp = (((window.DS || {}).DATA || {}).spells || {})[conc.id]; return sp && sp.level != null ? sp.level : 1;
  };
  // FED: its rider landed, and it took a spell of level lv. Returns the line for the rider's own card (null for one that is no made thing). The making it came from is
  // fed with it (js/world.js W.madeFed: no one beast is tracked between fights, so the count is the making's -- the desk's reading)
  S.fed = function (B, u, lv, o) { // (o.fear: fed on a hero's fear, not a spell -- the mirror hyena's, below: the flat 5, and the line says so)
    o = o || {};
    if (!u || !u.made0) return null;
    var K = S.MADE, was = u.madeState, who = '{r}' + the(B, u, true) + '{/}'; lv = Math.max(0, lv | 0); u.fedN = (u.fedN || 0) + 1;
    if (u.made && u.made.day != null && D.world && D.world.madeFed) { try { D.world.madeFed(u.made.day); } catch (e) { /* (the clock must never stop a fight) */ } }
    FX.ring(u, 'violet', 26); if (D.ripple) D.ripple(u, { region: 'body', dur: 40 });
    if (was === 'withered') {
      S.setState(B, u, 'normal');
      return who + ' has FED' + (o.fear ? ' on ' + o.fear + '\'s fear' : '') + ': {p}withered no longer{/}.  {g}(its hit points out of ' + u.maxhp + ' again, its speed ' + u.speed + ' ft, its aim its own){/}';
    }
    var t = K.temp * lv, a0 = u.made0.attacks || {}, k0 = Object.keys(a0).filter(function (k) { return a0[k].dice; })[0], more = t > (u.temp || 0);
    if (more) u.temp = t;
    if (o.fear) { if (was === 'charged') return who + ' feeds again on ' + o.fear + '\'s fear.  {g}(still charged){/}'; S.setState(B, u, 'charged'); if (D.sfx) D.sfx('buff'); return who + ' has FED on ' + o.fear + '\'s fear: {p}CHARGED{/} for the rest of the fight.  {g}(' + t + ' temporary hit points; +' + K.chargedHit + ' to hit' + (k0 ? '; its ' + a0[k0].name + ' ' + a0[k0].dice + ' to ' + u.attacks[k0].dice : '') + '){/}'; }
    if (was === 'charged') return who + ' feeds again: ' + (more ? '{p}' + t + ' temporary hit points{/}' : 'its ' + (u.temp || 0) + ' temporary hit points stand') + '.  {g}(' + K.temp + ' a level of the level-' + lv + ' spell it took; still charged){/}';
    S.setState(B, u, 'charged'); if (D.sfx) D.sfx('buff');
    return who + ' has FED: {p}CHARGED{/} for the rest of the fight.  {g}(' + t + ' temporary hit points, ' + K.temp + ' a level of the level-' + lv + ' spell it took; +' + K.chargedHit + ' to hit' + (k0 ? '; its ' + a0[k0].name + ' ' + a0[k0].dice + ' to ' + u.attacks[k0].dice : '') + '){/}';
  };

  // ------------------------------------------------------------------ THE MIRROR HYENA FEEDS ON FEAR (2026-11-14, the made-states seat)
  // Griz, 11-14, in the seat's own window, verbatim. On the mirror hyena having no rider to feed by: "Do they have that laugh makes people scared and we can use two steps
  // on that scare table as their feeding?" Then his lean: "requires frightened, and that feeds two  - and they'll knock prone without killing til all are fed to charged,
  // 5 hp and up step damage die at charged (lone can't count)". Then, on the seat's five questions: "1 - they spawn in charged" (the Harbinger's four); "2 - yes" (which
  // two are fed: the one that laughed first, then the least-fed nearest it); "3 - good call, forgot about panicked. Let's have a single panicked turn off the prone-thing
  // even if they aren't all fed" (each step a hero takes up to frightened or to panicked feeds two); "4 - yes" (charged is a flat 5 temporary hit points, the die a step
  // up, +2 to hit); "5 - yes, +2 applies if charged" (the knockdown is the SRD's Shove).
  // So: THE PACK'S LAUGH (js/traits.js packLaugh) is their rider. Each time it carries one of the party up to FRIGHTENED or to PANICKED, two of the pack are fed (S.fearFed).
  // Till every one of the pack standing is charged THEY TOY (S.toys, S.toyTurn; ai.js gives them the turn): no bite -- each goes to one of the party on its feet and
  // SHOVES it prone (SRD 5.1, Shoving a Creature: its Athletics against Athletics or Acrobatics; +2 if it is charged), and leaves the fallen alone, so the pack has its
  // falls to laugh at. One of the party PANICKED ends the toying for the fight, fed or not. A lone one cannot laugh (the laugh takes a pair), so it cannot feed and
  // does not toy: it bites. The Harbinger's four come charged (js/traits.js callPack), so they bite as they did.
  // THE SEAT'S CALLS, for his overrule: the toying is the grid's -- in the simple fight's lineup they bite as before; a charged one of a pack not all fed still shoves
  // (his "til all are fed to charged"); the pack is the made laughers standing on its side; one with nobody on their feet in reach of its move closes in and waits
  S.pack = function (B, u) { return B.units.filter(function (w) { return w.made0 && w.laugh && w.side === u.side && G.standing(w) && !w.dominated && !w.left; }); };
  S.toys = function (B, u) {
    if (!u || !u.made0 || !u.laugh || u.side !== 'foe' || u.dominated || B.packLit || B.simple || (B.o && B.o.simple)) return false;
    var p = S.pack(B, u); return p.length >= 2 && p.some(function (w) { return w.madeState !== 'charged'; });
  };
  S.toyTurn = function* (B, u) {
    var T = u.turn, rch = G.reachOf ? G.reachOf(u) : 5, up = AI.heroes(B, u).filter(function (w) { return !w.object && G.standing(w) && w.hp > 0 && !w.conds.prone && (w.size || 1) <= (u.size || 1) + 1; });
    if (!up.length || u.conds.prone && !(T.move > 0)) return; // (everyone is on the ground already: it waits for them to get up)
    var tgt = up.slice().sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (G.dist(u, tgt) > rch && T.move > 0 && !u.conds.grappled && !u.conds.restrained) { var e = AI.approach(u, tgt, G.reach(u, T.move), rch); if (e && (e.x !== u.x || e.y !== u.y)) yield* AI.walkTo(B, u, e); if (u.dead || u.hp <= 0) return; }
    tgt = up.filter(function (w) { return G.standing(w) && !w.conds.prone && G.dist(u, w) <= rch; }).sort(function (a, b) { return G.dist(u, a) - G.dist(u, b); })[0];
    if (!tgt || !(T.action > 0) || !RU.canAct(u)) return;
    T.action = 0; yield* AI.shoveOff(B, u, tgt, { how: 'prone', paid: true, bonus: u.madeState === 'charged' ? S.MADE.chargedHit : 0 });
  };
  // the laugh carried `w` up to step n of the fear scale (2 frightened, 3 panicked): two of the pack are fed -- the one that laughed first, then the least fed nearest it.
  // Returns the lines for the laugh's card
  S.fearFed = function (B, by, w, n) {
    if (!by || !(n >= 2)) return [];
    if (n >= 3 && !B.packLit && S.pack(B, by).length) B.packLit = true; // (his "a single panicked turn off the prone-thing even if they aren't all fed")
    var rank = { withered: 0, normal: 1, charged: 2 }, rest = S.pack(B, by).filter(function (h) { return h !== by; }).sort(function (a, b) { return rank[a.madeState] - rank[b.madeState] || G.dist(by, a) - G.dist(by, b); });
    var two = (by.made0 ? [by] : []).concat(rest).slice(0, 2), lines = [];
    two.forEach(function (h) { var l = S.fed(B, h, 1, { fear: w.name }); if (l) lines.push(l); });
    if (n >= 3 && lines.length) lines.push('{o}' + w.name + ' is panicked: the pack is done playing.{/}');
    return lines;
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
    var fm = S.fed(B, u, lv); // (fed before it mends: a withered one's hit points are its own again, and the slot's dice count against those)
    var dice = lv + 'd' + String(C.healPer || '1d6').replace(/^\d*d/, ''), h = D.roll(dice), got = mended(B, u, h.total);
    FX.float('-1 slot', t, D.PAL.ramps.violet[5]);
    B.card(['{r}' + t.name + '{/}: CON save  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  {o}FAILED{/}', '{p}' + t.name + ' loses a level ' + lv + ' spell slot: eaten.{/}  {g}(' + the(B, u, true) + ' regains ' + dice + ' ' + RU.fmtRolls(h.rolls) + ' = ' + h.total + (got < h.total ? ', ' + got + ' of it' : '') + ' hit points){/}'].concat(fm ? [fm] : []), 400);
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
