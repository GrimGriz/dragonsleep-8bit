/* DEEP16 -- THE SECOND ACT (11-04, the Inn build seat 2; the Halfway Inn lane's item 13: the Inn seat's §10 beat sheet, every beat RULED 11-04 -- his "take all the leans, will
   object later as needed" and "the second act is the Inn lane's §10, every beat ruled, the code list reconciled against inn.js in its first item, the art asked. Build it after
   items 1 and 2 as the sheet says. / Object as you read, and the page bends"). The wagon night has two acts on one clock: act one the yard (js/inn.js In.wagonNight, played on
   the floor); act two what the module calls the Warm-Up and the due, as a scene the party can enter -- while the yard is busy Gennet's half hour runs (the kitchen barred, the
   lantern lit, the singing, the lake flat, the bow-wave), and at its end the lantern leaves its post and walks to the point with the child she took at the greeting. The party
   chooses: the chase or the lantern. Three ends -- the due paid, the due stopped on the path, the god met at the stone -- and in every one the inn stands (CANON 08-27e).
   BUILT ON THE FLOOR inn.js HAS (§10.6.1): the lake door, the path, the point with its stone and post, the deep. The signs as cards on the map with their silent reads (a yard
   fight eats three); the fork card with its buttons by the yard's case (AFTER THEM hands to the chase, js/chase.js, with duePaid set); Gennet as a foe (the SRD Cult Fanatic
   reflavored, data/foes.js gennet, a cleric 4 by js/classes.js NPC.NAMED, `yields` at half and sits; her Spiritual Weapon the crook of lantern-light that guards the child --
   D.scripts.gennet casts it at whoever is nearest her); Doran a foe on a blow at a boy (the SRD Commoner with a woodaxe, yields at half); the boys and the child BYSTANDERS the
   AI never targets and that never act (the `bystander` flag, js/ai.js heroes -- built once here, the lamia lane's Wystan wants it next); TAKE THE CHILD; the rise on the iso
   camera (Battle.camTo) with its three cases and the chuul fight on the point when the ring is warm (the `chuul` fight's frog and the Ring of Binding's rounds laid on the
   floor's fight); Elsbeth's three states, the wand in the kitchen only (js/inn.js M.SCENES.elsbeth); the flags a line each (the registry under content/); the record on the trail; the show
   door deep16/?show=secondact&beat=<id>&case=<case> with the dice pinned; invented.json lines. The seat's calls where the sheet did not fit the floor are in the lane's section.
   Bench: dev/bench16.js mode=secondact1104; the probe dev/inn-probe.py. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, W = D.world, In = D.inn, G = D.grid, A = D.secondact = {};
  if (!M || !W || !In) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  var R = function () { return D.roam; };
  A.STONE = [44, 18]; A.POST = [42, 15]; A.PATH = { head: [38, 18], half: [40, 18], foot: [43, 18] }; A.DEEP = [44, 16]; // (the floor's squares: js/inn.js In.ROWS -- the flat stone 'i' at 44,18-19, the post 'l', the path from the lake door east, the deep 'Y' from 46)
  A.SHORE = 5; // (squares from the stone: "a party at the shore" -- the point's end; the path's head by the lake door, seven off, is not)
  // ---------------------------------------------------------------- §10.1 the clock: six signs, each a card with its read beside it (the §4 shape: the house reads in silence)
  A.SIGNS = [
    { at: 5, sign: 'Elsbeth is sent up, and the kitchen door is barred from inside.', dc: 10, read: 'A bar drops across the kitchen door.' },
    { at: 10, sign: 'Down at the water a light comes on at the post: the shore-lantern, lit.', dc: null, read: null },
    { at: 15, sign: 'From the family room, low, singing.', dc: 13, read: 'Singing, low. Two boys\' voices under a woman\'s.' },
    { at: 20, sign: 'The night-lines\' floats have stopped bobbing.', dc: 13, read: 'The lake has gone flat as a plate.' },
    { at: 25, sign: 'Out past the point the water is not still.', dc: 15, read: 'Something out past the point is moving toward it, and the water moves ahead of it.' },
    { at: 30, sign: 'The lantern has left its post.', dc: null, read: null }
  ];
  A.LINES = { // (the seat's drafts, the sheet's where it had them: invented.json halfway-second-act)
    fought: '{g}While the yard was busy, the house\'s half hour ran on.{/}',
    fork: 'The lantern has left its post. Down the path toward the water: a woman, two boys, and the one she took inside.',
    forkNorth: 'North up the road: two shapes going hard in the dark.',
    forkGoblin: '{g}(To the eye the one she leads is a goblin still.){/}',
    orrin: '{y}Orrin:{/} "Mam?"',
    gennetPath: '{y}Gennet Waterby:{/} "You\'ve had your supper and your beds. This is the house\'s business. Stand out of the light."',
    elsbethLantern: '{y}Elsbeth:{/} "You\'ll want this. I\'m not going nearer."',
    stand: 'You stand out of the light. The lantern goes on down the path to the water.',
    take: 'She is between you and the child. The fight begins on your step.',
    yielded: '{y}Gennet Waterby{/} sits down on the path, the lantern beside her, and says it to nobody: "It gave back. It always gave back."',
    doran: '{y}Doran Waterby{/} comes down out of the lake door with the woodaxe: "Not the boys."',
    doranYield: '{y}Doran{/} lowers the axe and goes to her.',
    doranSit: '{y}Doran{/} does not rage. He sits down.',
    childTaken: '{y}{name}{/} takes the child\'s hand, and she goes with it. The due has no offering.',
    childLeft: 'The child stands where the inn lady left her, on the path, in the lantern\'s light.',
    stone: 'At the flat stone the offering is set down. The lake goes glass-flat. The water heaves -- the take -- and the lantern comes back up the path alone.',
    stoneGoblin: 'At the flat stone the goblin is set down. The lake goes glass-flat. The water heaves -- the take -- and the lantern comes back up the path alone.',
    rise: 'The water off the point heaves. It comes halfway up: the size of a wagon, the colour of wet stone, plated, legged, two long soft arms that move as if they were thinking. It waits.',
    riseNone: 'Nothing stands on the stone. It goes down.',
    riseRing: 'It turns toward the ring before it turns toward anything else.',
    riseNoRing: 'and you are not ready for it. Nothing stands in the water. It goes down.',
    elsbethThat: '{y}Elsbeth:{/} "That\'s what it is. That\'s all it is."',
    mornStopped: 'Morning. Doran is gone, and the wagon with him, and eight children in the back of it. The inn lady keeps her back to the room.',
    mornDead: 'Morning. The lantern is on its hook by the lake door, and nobody lights it. Doran Waterby at the counter: "You\'ll want the road."',
    mornDoranDead: 'Morning. The inn is the inn lady\'s and the boys\'. The lantern is on its hook by the lake door, and it will be lit again at the month\'s end.',
    mornLake: 'Morning. Up at the inn a lamp came on in the kitchen before dawn. The Waterbys keep the inn; the lantern stays on its hook by the lake door, and nobody lights it. Doran walks down to the water with a bucket, draws from the lake in front of everyone, and drinks.',
    gaveBack: '{y}Gennet Waterby:{/} "It gave back."',
    noRoom: '{g}No room from her. Doran sells the rooms now.{/}',
    doranRoad: '{y}Doran Waterby:{/} "You\'ll want the road."',
    wandPush: '{y}{name}:{/} "Gennet Waterby is a fraud, and you know it."',
    wandOut: 'Her hand goes into the apron and comes out with a length of blackened bone-white wood, a hand and a half long, and she says one word.',
    wandFlee: '{y}{name}{/} turns and walks out of the kitchen, and cannot come nearer her for a minute.',
    wandHold: '{y}{name}{/} holds. The word slides off.',
    wandCone: 'The rest of you press, and she says the other word: the kitchen is a wall of fear, and you are through the door before you know it.',
    wandDone: 'Nobody is hurt. The kitchen is empty behind you, and she will not open it again tonight.',
    elsbethSilentWand: 'The kitchen door is shut. Nothing you say opens it.',
    // (the Winters seat, 11-05: the chuul on the due's own night and the rowboat -- invented.json halfway-lake-due-night-1105)
    ringWarmBack: 'Back up the path to the lake door, and in to bed.',
    mornLakeAway: 'Morning. Up at the inn a lamp came on in the kitchen before dawn. Doran is gone, and the wagon with him. The lantern stays on its hook by the lake door, and nobody lights it.',
    opts: { after: 'AFTER THEM', lantern: 'THE LANTERN', let: 'LET IT BE', stand: 'STAND ASIDE', take: 'TAKE THE CHILD', strike: 'STRIKE', leave: 'LEAVE HER', press: 'PRESS ON', back: 'BACK OFF', fraud: 'CALL GENNET A FRAUD',
      down: 'GO DOWN TO THE POINT', bed: 'BACK TO BED', leaveIt: 'LEAVE IT', sound: 'PUSH OUT AND SOUND THE DEEP' }
  };
  A.trail = function (s) { if (D.house && D.house.trail) D.house.trail('act', 'THE SECOND ACT: ' + s); };

  // ---------------------------------------------------------------- the signs: from f.warmup up to `upTo`, each a card with its read if the house caught it (the party's best passive Perception)
  A.signs = function* (B, upTo, batch) {
    var f = B.roam.flags, st = D.counter.state(B), from = f.warmup || 0;
    if (batch && upTo > from) yield* In.card(B, [A.LINES.fought], 300);
    for (var i = from; i < Math.min(upTo, A.SIGNS.length); i++) {
      var s = A.SIGNS[i], got = s.dc == null || In.read(st, 'Perception', s.dc);
      yield* In.card(B, ['{g}+' + s.at + ' minutes:{/} ' + s.sign].concat(got && s.read ? ['{c}(perception) ' + s.read + '{/}'] : []), batch ? 240 : 360);
      f.warmup = i + 1;
    }
    if (f.warmup >= A.SIGNS.length) f.lanternWalks = 1;
  };
  // ---------------------------------------------------------------- the cast on the path: Gennet (a foe, inert till the fight), Orrin with the lantern, Pell, the child -- bystanders
  A.cast = function (B, f, at) {
    var Y = {}, kid = f.glamourBroken || f.glamourSeen;
    Y.gennet = In.unit(B, { id: 'gennetPath', kind: 'gennet', at: [at[0], at[1]], name: In.named(f), face: [1, 0], foe: true });
    Y.gennet.script = 'gennet'; Y.gennet.flees = false; Y.gennet.yields = true;
    Y.orrin = In.unit(B, { id: 'orrinPath', kind: 'commonerchild', at: [at[0] + 1, at[1]], name: 'Orrin', face: [1, 0], lantern: true });
    Y.pell = In.unit(B, { id: 'pellPath', kind: 'commonerchild', at: [at[0], at[1] + 1], name: 'Pell', face: [1, 0] });
    Y.kid = In.unit(B, { id: 'dueChild', kind: kid ? 'commonerchild' : 'goblin', at: [at[0] + 1, at[1] + 1], name: kid ? 'A child' : 'A goblin', face: [1, 0] });
    [Y.orrin, Y.pell, Y.kid].forEach(function (u) { u.bystander = true; u.boy = u !== Y.kid; });
    Y.gennet.guards = Y.kid.id;
    return Y;
  };
  A.clear = function (B, Y) { ['gennet', 'orrin', 'pell', 'kid', 'doran', 'elsbeth', 'chuul', 'frog'].forEach(function (k) { if (Y[k] && B.units.indexOf(Y[k]) >= 0) In.gone(B, Y[k]); Y[k] = null; }); };
  A.walkAll = function* (B, Y, to) { // (the four of them down the path to a square, the lantern with them)
    yield* In.walk(B, Y.gennet, [to[0], to[1]], [1, 0]);
    yield* In.walk(B, Y.orrin, [to[0] + 1, to[1]], [1, 0]);
    yield* In.walk(B, Y.pell, [to[0], to[1] + 1], [1, 0]);
    yield* In.walk(B, Y.kid, [to[0] + 1, to[1] + 1], [1, 0]);
  };
  A.elsbethState = function (f) { return f.wandOut ? 'wand' : f.elsbethTier >= 3 ? 'earned' : 'neutral'; };
  A.hasRing = function (B) { var w = null; (B.roam.members || []).forEach(function (u) { if (!w && u.hp > 0 && u.src && DS.R.wears(u.src, 'ringofbinding')) w = u; }); return w; };

  // ---------------------------------------------------------------- BEAT 1: the fork, after the yard's business (a fight: the signs it ate, the rest, then the card and its buttons by the case)
  A.afterYard = function* (B, out) { // (out: 'inn' the pair down, 'fled' the pair away; the party up in the yard)
    var R0 = B.roam, f = R0.flags, st = D.counter.state(B);
    if (!f.dueTonight) return false; // (no handover: nothing walks tonight)
    yield* A.signs(B, 3, true);
    yield* A.signs(B, 6, false);
    var lines = [A.LINES.fork].concat(out === 'fled' ? [A.LINES.forkNorth] : [], f.glamourBroken || f.glamourSeen ? [] : [A.LINES.forkGoblin]), opts = [], acts = [];
    if (out === 'fled' && D.chase && D.chase.start) { opts.push(A.LINES.opts.after); acts.push('after'); }
    opts.push(A.LINES.opts.lantern); acts.push('lantern'); opts.push(A.LINES.opts.let); acts.push('let');
    yield* B.camTo({ gx: A.PATH.half[0], gy: A.PATH.half[1], gz: 0 }, D.iso.zoom, 30);
    var a = acts[yield* In.ask(B, 'THE LANTERN WALKS', lines, opts)];
    A.trail('the fork: ' + a);
    if (a === 'after') { f.duePaid = 1; f.dueSeen = 1; f.pathStand = 0; return 'after'; } // (the chase: the lantern is behind them and the due is paid -- js/chase.js takes it from the yard)
    if (a === 'let') { yield* In.dueWalk(B, f.glamourBroken || f.glamourSeen ? 'kid' : 'goblin'); f.duePaid = 1; return 'let'; }
    yield* A.path(B);
    return 'path';
  };
  // ---------------------------------------------------------------- BEAT 2: the path -- round the inn's end to the footpath; ahead in the lantern's light the four of them; her line; the choice
  A.path = function* (B) {
    var Rm = R(), R0 = B.roam, f = R0.flags, st = D.counter.state(B);
    f.pathStand = 1;
    var Y = A.cast(B, f, A.PATH.half);
    if (A.elsbethState(f) === 'earned') { Y.elsbeth = In.unit(B, { id: 'elsbethPath', kind: 'commonerwoman', at: [In.DOORS.lake[0] + 1, In.DOORS.lake[1] + 1], name: 'Elsbeth', face: [1, 0], lantern: true }); Y.elsbeth.bystander = true; f.elsbethLantern = 1; }
    yield* Rm.walkTo(B, A.PATH.head);
    yield* B.camTo({ gx: A.PATH.half[0], gy: A.PATH.half[1], gz: 0 }, D.iso.zoom, 24);
    yield* In.card(B, [A.LINES.orrin], 240);
    if (Y.elsbeth) yield* In.card(B, [A.LINES.elsbethLantern], 300);
    Y.gennet.facing = D.spr.facingFor(-1, 0);
    yield* In.card(B, [A.LINES.gennetPath], 420);
    var a = yield* In.ask(B, 'ON THE PATH', [A.LINES.gennetPath], [A.LINES.opts.stand, A.LINES.opts.take, A.LINES.opts.strike]);
    A.trail('on the path: ' + ['stand aside', 'take the child', 'strike'][a]);
    if (a === 0) { yield* In.card(B, [A.LINES.stand], 300); yield* A.due(B, Y, true); return; }
    yield* In.card(B, [a === 1 ? A.LINES.take : '{r}Steel.{/}'], 240);
    var o = yield* A.fight(B, Y);
    if (o === 'lost') return;
    if (o === 'won') { f.gennetDead = 1; A.trail('Gennet killed on the path'); yield* A.saved(B, Y, true); return; }
    if (o === 'yielded') {
      f.gennetYield = 1; yield* In.card(B, [A.LINES.yielded], 420);
      if (Y.doran && B.units.indexOf(Y.doran) >= 0) { if (Y.doran.hp > 0) yield* In.card(B, [A.LINES.doranYield], 300); }
      var b = yield* In.ask(B, 'THE CHILD', [A.LINES.childLeft], [A.LINES.opts.take, A.LINES.opts.leave]);
      if (b === 0) { yield* A.saved(B, Y, false); return; }
      yield* A.due(B, Y, false); return; // (left on the path: the lantern goes on down with her -- Gennet stands up and takes her)
    }
    // the party got out (escaped): the lantern goes on
    yield* A.due(B, Y, true);
  };
  // ---------------------------------------------------------------- BEAT 3: Gennet on the path (one fight at a time, deep16/signature-fights.md): the roam's own fight on the floor's squares
  A.fight = function* (B, Y) {
    var Rm = R(), R0 = B.roam, f = R0.flags, F = B.fight, keep = {};
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    F.runWhenHurt = null; F.fledEnds = false; F.loosen = null; F.exit = []; F.noFlee = true;
    Y.gennet.flees = false; delete Y.gennet.roamAside;
    // a blow at a boy brings Doran (the hurt hook, for this fight): the SRD Commoner with a woodaxe, from the lake door, at the fight's edge
    var hurt0 = B.hurt, self = B;
    B.hurt = function (u, n, type, src) { var r = hurt0.apply(this, arguments); if (u && u.boy && n > 0 && !Y.doran && !f.doranFights) { Y.doran = A.doranIn(self, Y); } return r; };
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* Rm.engage(B, { foes: [Y.gennet], why: 'path', zone: null }, false, 'path');
    var o = R0.lastOutcome;
    B.hurt = hurt0;
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    if (Y.doran && B.units.indexOf(Y.doran) >= 0 && Y.doran.hp <= Y.doran.maxhp / 2 && Y.doran.hp > 0) f.doranYield = 1;
    if (Y.doran && (Y.doran.hp <= 0 || Y.doran.dead)) f.doranDead = 1;
    return /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : o === 'won' ? 'won' : o === 'yielded' ? 'yielded' : 'escaped';
  };
  A.doranIn = function (B, Y) {
    var f = B.roam.flags, d = In.unit(B, { id: 'doranPath', kind: 'doran', at: [In.DOORS.lake[0] + 1, In.DOORS.lake[1]], name: 'Doran Waterby', face: [1, 0], foe: true });
    d.flees = false; d.yields = true; f.doranFights = 1;
    d.initRoll = 1; if (B.order && B.order.indexOf(d) < 0) B.order.push(d); // (of this fight, at the back of the order: js/roam.js R.fight walks B.order by index)
    B.card(D.roam.wrap([A.LINES.doran]), 360);
    return d;
  };
  // the crook of light guards the child: Gennet's own turn -- her Spiritual Weapon at whoever of them is nearest the child (its swing from beside the target), Shield of Faith on herself first; the cleric's tactics for the rest
  (D.scripts = D.scripts || {}).gennet = function* (B, u) {
    var kid = B.units.filter(function (w) { return w.id === u.guards; })[0], hs = D.ai && D.ai.heroes ? D.ai.heroes(B, u) : [], T = u.turn;
    var list = function () { return (D.magic && D.magic.list ? D.magic.list(B, u) : []).filter(function (x) { return x.ok; }); };
    if (!u.sof && T.action && list().some(function (x) { return x.id === 'shieldoffaith'; })) { u.sof = true; yield* B.exec(u, { do: 'cast', id: 'shieldoffaith', slot: 1, target: u }); }
    if (kid && hs.length && (T.bonus || T.action)) {
      var near = hs.slice().sort(function (a, b) { return G.dist(kid, a) - G.dist(kid, b); })[0];
      var sw = list().filter(function (x) { return x.id === 'spiritualweapon'; })[0];
      if (near && sw && G.dist(kid, near) <= 15) { yield* B.exec(u, { do: 'cast', id: 'spiritualweapon', slot: sw.slot || 2, target: near }); }
    }
    if (D.tactics && (T.action || T.move)) yield* D.tactics.turn(B, u);
  };
  // TAKE THE CHILD: she goes with whoever took her hand (into the party's token for the night); the due has no offering
  A.saved = function* (B, Y, afterKill) {
    var R0 = B.roam, f = R0.flags, t = R0.token;
    f.offeringSaved = 1; f.dueStopped = 1;
    if (Y.kid) In.gone(B, Y.kid); Y.kid = null;
    yield* In.card(B, [A.LINES.childTaken.split('{name}').join(t.name)], 360);
    A.trail('the child taken' + (afterKill ? ' over Gennet\'s body' : ' after the yield'));
    yield* A.rise(B, Y);
  };
  // ---------------------------------------------------------------- BEAT 4: the stone -- the due with its offering, or the lake rising at the hour anyway
  A.due = function* (B, Y, offering) {
    var R0 = B.roam, f = R0.flags;
    if (Y.gennet && B.units.indexOf(Y.gennet) >= 0) { Y.gennet.anim = 'idle'; delete Y.gennet.roamAside; }
    yield* A.walkAll(B, Y, [A.STONE[0] - 1, A.STONE[1]]);
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 24);
    yield* In.card(B, [f.glamourBroken || f.glamourSeen ? A.LINES.stone : A.LINES.stoneGoblin], 480); D.sfx('splash');
    if (Y.kid) { if (D.fx) D.fx.sparkle(Y.kid, 'blue', 24); In.gone(B, Y.kid); Y.kid = null; }
    f.duePaid = 1; f.dueSeen = 1; A.trail('the due paid at the stone');
    yield 40;
    yield* A.walkAll(B, Y, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]);
    A.clear(B, Y);
    if ((yield* A.ringWarm(B, Y, true)) === 'lost') return; // (the ring warm after the take: GO DOWN TO THE POINT -- the party stood out of the light on the path)
    yield* A.ends(B);
  };
  A.rise = function* (B, Y) {
    var R0 = B.roam, f = R0.flags, t = R0.token, st = D.counter.state(B);
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 30);
    yield* In.card(B, [A.LINES.rise], 480);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: A.DEEP.slice(), name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
    var near = Math.max(Math.abs(t.x - A.STONE[0]), Math.abs(t.y - A.STONE[1])) <= A.SHORE, ring = near ? A.hasRing(B) : null;
    if (!near) { yield* In.card(B, [A.LINES.riseNone].concat(Y.elsbeth ? [A.LINES.elsbethThat] : []), 420); A.trail('the lake rose: nobody at the shore'); In.gone(B, Y.chuul); Y.chuul = null; A.clear(B, Y); yield* A.ends(B); return; }
    if (!ring) { yield* In.card(B, [L('lake.risesNoRing').replace(', and you are not ready for it.', ''), A.LINES.riseNoRing].concat(Y.elsbeth ? [A.LINES.elsbethThat] : []), 480); A.trail('the lake rose: no ring, it went down'); In.gone(B, Y.chuul); Y.chuul = null; A.clear(B, Y); yield* A.ends(B); return; }
    yield* In.card(B, [A.LINES.riseRing], 360);
    if ((yield* A.meet(B, Y, ring)) === 'lost') return;
    A.clear(B, Y);
    yield* A.ends(B);
  };
  // the chuul met (the rise at the shore, the ring warm after the due, the rowboat): the fight, and what it leaves -- won, the deep is only water and the corpse's gift; 'lost' the
  // party down (the floor's own end); 'escaped' clear of the water
  A.meet = function* (B, Y, ring) {
    var f = B.roam.flags, st = D.counter.state(B);
    var o = yield* A.lakeFight(B, Y, ring);
    if (o === 'lost') return o;
    if (o === 'won') { f.lakeDone = 1; A.trail('the thing in the lake killed' + (ring ? '' : ', no ring')); yield* In.card(B, [].concat(L('lake.after')), 480); if (!f.lakeGiftGot) { var id = In.giftId(st); D.counter.give(st, id, 1); f.lakeGiftGot = 1; D.sfx('chest'); yield* In.card(B, [L('lake.corpseGift'), L('g.got', { item: DS.DATA.items[id].name })], 420); } }
    else { A.trail('the party got clear of the lake'); }
    return o;
  };
  // the chuul fight on the floor's point end, the `chuul` fight's frog with it and the Ring of Binding's rounds laid on the floor's fight (js/battle.js enter's rule, for this fight);
  // with no ring worn, the chuul and its frog as the SRD has them (`ring` null)
  A.lakeFight = function* (B, Y, ring) {
    var Rm = R(), R0 = B.roam, F = B.fight, keep = {}, Fd = D.fight && D.fight('chuul');
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    F.runWhenHurt = null; F.fledEnds = false; F.loosen = null; F.exit = []; F.noFlee = false;
    var at = Y.chuul ? [Y.chuul.x, Y.chuul.y] : A.DEEP;
    Y.frog = In.unit(B, { id: 'lakeFrog', kind: 'giantfrog', at: [at[0] - 1, at[1] + 2], name: 'Giant Frog', face: [-1, 0], foe: true }); Y.frog.flees = false;
    var rounds = (Fd && Fd.ring && Fd.ring.rounds) || [1, 4, 7, 10], con0 = ring && ring.saves ? ring.saves.con : null;
    if (ring) { if (ring.saves) { ring.saves = Object.assign({}, ring.saves); ring.saves.con += (Fd && Fd.ring && Fd.ring.con) || 3; } ring.ring = true; B.taunt = { u: ring, rounds: rounds }; }
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* Rm.engage(B, { foes: [Y.chuul, Y.frog], why: 'lake', zone: null }, false, 'lake');
    var o = R0.lastOutcome;
    B.taunt = null; if (ring) { if (ring.saves && con0 != null) ring.saves.con = con0; delete ring.ring; }
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    return /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : o === 'won' ? 'won' : 'escaped';
  };
  // ---------------------------------------------------------------- THE CHUUL ON THE DUE'S OWN NIGHT (11-05, the Winters seat; the lane's §3, RULED 11-04: "with the ring on, the ring warm,
  // and it may go down to the point THAT NIGHT ... watch a child go to the water for your shot at the god"; beat 4, "the ring warm then cold by morning"): the due paid tonight -- the
  // quiet, the gold, LET IT BE (js/inn.js In.wagonNight), STAND ASIDE or a child left on the path (A.due) -- and the Ring of Binding worn: the first game's due.after, then GO DOWN
  // TO THE POINT or BACK TO BED; down, the party at the flat stone, the water heaves (lake.rises), it turns toward the ring (Sense Magic, lake.senseMagic), and the fight. BACK TO BED,
  // the ring cold by morning. With no ring nothing calls it back up tonight: it has eaten. Returns null (no ring, or nothing to warm it), 'bed', or the fight's end
  A.ringWarm = function* (B, Y, onPath) {
    var R0 = B.roam, f = R0.flags; Y = Y || {};
    if (f.lakeDone || !f.duePaid || f.ringWarmNight === f.wagonCycle + 1) return null;
    var ring = A.hasRing(B); if (!ring) return null;
    f.ringWarmNight = (f.wagonCycle || 0) + 1; // (once a wagon night)
    var a = yield* In.ask(B, 'THE RING IS WARM', [].concat(L('due.after')), [A.LINES.opts.down, A.LINES.opts.bed]);
    A.trail('the ring warm after the due: ' + (a === 0 ? 'down to the point' : 'back to bed') + (onPath ? ' (from the path)' : ''));
    if (a !== 0) return 'bed';
    yield* R().walkTo(B, [A.STONE[0] - 2, A.STONE[1]]); // (by the flat stone, as the rise's beat stands them: the frog comes up on the square past it)
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 30);
    yield* In.card(B, [L('lake.rises')], 420);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: A.DEEP.slice(), name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
    yield* In.card(B, [L('lake.senseMagic')], 360);
    var o = yield* A.meet(B, Y, A.hasRing(B) || ring);
    if (o === 'lost') return o;
    A.clear(B, Y);
    if (!onPath) { yield* R().walkTo(B, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]); yield* In.card(B, [A.LINES.ringWarmBack], 240); }
    return o;
  };
  // the rowboat by day (the first game's S.rowboat; the lane's §3, RULED 11-04: "The rowboat by day stays the other way to the chuul"): LEAVE IT, or PUSH OUT AND SOUND THE DEEP --
  // the line goes down and down, and something comes up with it; the fight, ring or not (the ring's rounds if it is worn), off the boat's end of the point
  A.BOAT = [45, 22];
  A.sound = function* (B) {
    var R0 = B.roam, f = R0.flags, Y = {};
    if (f.lakeDone) { B.card(D.roam.wrap([L('lake.quiet')]), 320); yield 20; return; }
    var a = yield* In.ask(B, 'THE ROWBOAT', [L('lake.boatAsk')], [A.LINES.opts.leaveIt, A.LINES.opts.sound]);
    A.trail('the rowboat: ' + (a === 1 ? 'pushed out and sounded the deep' : 'left'));
    if (a !== 1) return;
    yield* B.camTo({ gx: A.BOAT[0], gy: A.BOAT[1], gz: 0 }, D.iso.zoom, 24);
    yield* In.card(B, [L('lake.woken')], 420);
    var ring = A.hasRing(B);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: [A.BOAT[0] + 2, A.BOAT[1] - 1], name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
    yield* In.card(B, [L(ring ? 'lake.rises' : 'lake.risesNoRing')].concat(ring ? [L('lake.senseMagic')] : []), 420);
    if ((yield* A.meet(B, Y, ring)) === 'lost') return;
    A.clear(B, Y);
  };
  // ---------------------------------------------------------------- BEAT 5: the ends -- the flags set, the morning reads them (In.actMorning); back to bed
  A.ends = function* (B) {
    var Rm = R(), R0 = B.roam, f = R0.flags;
    f.secondActDone = 1;
    yield* Rm.walkTo(B, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]);
    yield* In.card(B, [In.WN.back], 240);
    In.stage(B, [24, 17], 'inn');
  };
  A.morning = function (f) { // (the morning's line by the end: the due paid is the wagon's own mornings, js/inn.js)
    if (f.lakeDone) return f.doranAway ? A.LINES.mornLakeAway : A.LINES.mornLake; // (the yard stopped, Doran drove the children to Newland that night: not at the water in the morning -- 11-05)
    if (f.doranDead) return A.LINES.mornDoranDead;
    if (f.gennetDead) return A.LINES.mornDead;
    if (f.dueStopped) return A.LINES.mornStopped;
    return null;
  };
  // a quiet night's or the gold's morning when the thing in the lake died that night: the lake's morning first, then what the wagon's own morning says past its first word and the inn lady's hum
  A.lakeMorning = function (wagonMorning) { return A.LINES.mornLake + ' ' + String(wagonMorning || '').replace(/^Morning\.\s*/, '').replace(/\s*The inn lady hums at the stove\.\s*/, ' ').trim(); };

  // ---------------------------------------------------------------- §10.4 the wand, in the kitchen only (js/inn.js M.SCENES.elsbeth's push): Gennet named a fraud to her face -- the hand in the
  // apron, the flee word (Command, WIS 15) on the one who spoke, the cone (Fear, WIS 15) if the rest press; nobody hurt, the kitchen empty, she is done for the night
  A.wand = function* (sc, B, st, f) {
    var R0 = B.roam, lead = R0.token, name = lead.name;
    var sv = function (h) { var r = In.d20(), b = DS.R.saveBonus(h, 'wis'), ok = r + b >= 15; In.trail((h.name || h.id) + ' WIS save ' + r + (b >= 0 ? ' + ' : ' - ') + Math.abs(b) + ' vs DC 15 (the wand)' + (ok ? ', held' : ', failed')); return ok; };
    f.elsbethPushed = 1; f.wandOut = 1;
    yield sc.say([A.LINES.wandPush.split('{name}').join(name), A.LINES.wandOut]);
    var held = sv(lead.src || lead), walk = !held;
    yield sc.say([(held ? A.LINES.wandHold : A.LINES.wandFlee).split('{name}').join(name)]);
    var rest = R0.members.filter(function (u) { return u !== lead && u.hp > 0; });
    if (rest.length) {
      var p = yield sc.ask('The rest of you.', [A.LINES.opts.press, A.LINES.opts.back]);
      if (p === 0) { rest.forEach(function (u) { sv(u.src || u); }); walk = true; yield sc.say([A.LINES.wandCone]); }
    }
    In.wandWalk = walk;
    A.trail('the wand out in the kitchen' + (walk ? ': out of it' : ', the word held'));
  };

  // ---------------------------------------------------------------- the show: deep16/?show=secondact&beat=<id>&case=<case> -- a NEW GAME's four staged on the floor at the beat, the dice pinned
  A.BEATS = [
    { id: 'signs', beat: 'fork', label: 'BEAT 1: the signs and the fork, after the yard is won', note: 'The yard fought and won (the pair down), the four in the yard at the second watch. The house\'s half hour ran on while they fought: the signs it ate as a batch, then the last three with their reads (the dice pinned: the singing heard, the lake flat seen, the bow-wave caught), and the fork card: THE LANTERN or LET IT BE.', flags: { wagonOutcome: 'inn' }, dice: [19, 19, 19] },
    { id: 'forkfled', beat: 'fork', label: 'BEAT 1: the fork after the pair got away -- AFTER THEM too', note: 'The same fork with the pair away up the road on foot: three buttons -- AFTER THEM (the chase, the due paid behind you), THE LANTERN, LET IT BE.', flags: { wagonOutcome: 'fled', wagonFled: 'foot' }, dice: [19, 19, 19], fled: true },
    { id: 'path', beat: 'path', label: 'BEAT 2: the path -- Gennet, the boys, the child in the lantern\'s light', note: 'The four at the path\'s head by the lake door; ahead at its half-way Gennet with the child, Orrin with the shore-lantern, Pell at her skirt. "Stand out of the light." STAND ASIDE (the due at the stone, then the lake rises: at the shore without the ring it goes down), TAKE THE CHILD or STRIKE (the fight on the path).', flags: { wagonOutcome: 'inn' } },
    { id: 'pathearned', beat: 'path', label: 'BEAT 2 with Elsbeth EARNED: her lantern behind you', note: 'The same path with Elsbeth\'s third tier reached at the tub: she comes behind with the kitchen lantern -- "You\'ll want this. I\'m not going nearer."', flags: { wagonOutcome: 'inn', elsbethTier: 3, elsbethTold: 1, dishes: 1 } },
    { id: 'fight', beat: 'path', label: 'BEAT 3: Gennet on the path -- the crook of light, the yield at half', note: 'STRIKE on the path: Gennet opens with Shield of Faith, the crook of light stands over the child and strikes whoever comes near her, Hold Person, the cold through your boots, the daggers when she must. At half she yields and sits: TAKE THE CHILD or LEAVE HER. (A Fireball that catches a boy brings Doran with the woodaxe.)', flags: { wagonOutcome: 'inn' }, strike: true },
    { id: 'risering', beat: 'rise', label: 'BEAT 4: the rise with the ring warm -- the thing in the lake', note: 'The child taken, the lead wearing the Ring of Binding: the water off the point heaves, it comes halfway up and waits -- it turns toward the ring, and the fight on the point with its frog; the ring\'s rounds. Won: the deep is only water, the corpse\'s gift.', flags: { wagonOutcome: 'inn', offeringSaved: 1, dueStopped: 1, gennetYield: 1 }, ring: true },
    { id: 'risenone', beat: 'rise', label: 'BEAT 4: the rise with nobody at the shore', note: 'The child taken and the party back at the path\'s head: the water heaves, nothing stands on the stone, it goes down. The god seen: Elsbeth\'s third tier is yours for nothing after.', flags: { wagonOutcome: 'inn', offeringSaved: 1, dueStopped: 1, gennetYield: 1 }, far: true },
    { id: 'ringwarm', beat: 'fork', label: 'THE RING WARM after the due: LET IT BE, then down to the point (11-05)', note: 'The yard won, the lead wearing the Ring of Binding (Winters gives it at the lead\'s 3rd). The fork: LET IT BE -- the lantern walks, only the inn lady comes back. Then "The ring on your hand is warm. Go down to the point." -- GO DOWN TO THE POINT: at the flat stone the water heaves, it turns toward the ring, and the fight on the point with its frog; the ring\'s rounds. BACK TO BED: the ring cold by morning.', flags: { wagonOutcome: 'inn' }, dice: [19, 19, 19], ring: true },
    { id: 'standring', beat: 'path', label: 'STAND ASIDE with the ring on: the take, then the ring warm (11-05)', note: 'The path, the lead wearing the Ring of Binding. STAND ASIDE: the offering set on the flat stone, the take, the lantern back up the path alone -- then the ring warm: GO DOWN TO THE POINT, the fight; BACK TO BED, the morning.', flags: { wagonOutcome: 'inn' }, ring: true },
    { id: 'rowboat', beat: 'boat', label: 'THE ROWBOAT BY DAY: sound the deep (11-05)', note: 'Two in the afternoon on the point by the rowboat, no wagon tonight. LEAVE IT, or PUSH OUT AND SOUND THE DEEP -- "the worst decision available here": the line goes down and down, and something comes up with it. The fight off the boat\'s end of the point, ring or not (here, the lead wears it: the ring\'s rounds).', flags: {}, ring: true },
    { id: 'wand', beat: 'wand', label: 'ELSBETH\'S WAND in the kitchen', note: 'Day 12 at six, inside by the tub. E on Elsbeth: HELP WITH THE DISHES, then CALL GENNET A FRAUD -- the hand goes in the apron: the word, a WIS save at 15 (the dice pinned to fail), and you walk out of the kitchen; PRESS ON and the other word empties it. She is done for the night.', flags: {}, dice: [2, 2, 2, 2] }
  ];
  A.play = function (bt) {
    var H = D.house, rec = H.fresh(); rec.at = { town: null }; rec.silver = Math.max(rec.silver || 0, 60);
    rec.flags = Object.assign({ reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, wagonIn: 1, dueTonight: 1, kidTaken: 1, glamourBroken: 1, glamourSeen: 1, kidAtInn: 1, doranAway: 1, katGone: 1, wagonStopped: 'c0', secondAct: { beat: bt.beat, id: bt.id, strike: !!bt.strike, far: !!bt.far, fled: !!bt.fled } }, bt.flags || {});
    if (bt.beat === 'wand') { delete rec.flags.wagonIn; delete rec.flags.dueTonight; delete rec.flags.doranAway; rec.flags.secondAct = null; } // (doranAway too, 11-05: six on day 12 is before the wagon, and with Doran gone and no ring Elsbeth only sends the party to Winters -- js/inn.js M.SCENES.elsbeth; his "all i'm getting from elsbeth is 'go see winters'")
    if (bt.beat === 'boat') { ['wagonIn', 'dueTonight', 'kidTaken', 'kidAtInn', 'doranAway', 'wagonStopped'].forEach(function (k) { delete rec.flags[k]; }); } // (a day with no wagon: the rowboat's own)
    if (bt.ring) { var lead = rec.party[0]; if (lead && lead.equip) { lead.equip.ring = 'ringofbinding'; H.add(rec.inv, 'ringofbinding', 0); } }
    H.begin(rec, 0); var S = W.state && W.state(); if (S) S.t = (In.WAGON.first - 1) * 24 + (bt.beat === 'wand' ? 18 : bt.beat === 'boat' ? 14 - 24 : 23); // (the first WAGON DAY's night: day 12 since 11-05, js/inn.js In.WAGON; the rowboat the afternoon before)
    In.pinned = bt.dice ? bt.dice.slice() : null;
    var at = bt.beat === 'wand' ? [32, 21] : bt.beat === 'boat' ? [A.BOAT[0], A.BOAT[1] - 1] : bt.beat === 'rise' && bt.far ? A.PATH.head : bt.beat === 'rise' ? [A.STONE[0] - 2, A.STONE[1]] : bt.beat === 'path' ? [In.DOORS.lake[0] + 1, In.DOORS.lake[1]] : [In.WAGONAT[0] + 6, In.WAGONAT[1]];
    var nb = D.roam.make('?roam=' + In.KEY + (bt.beat === 'wand' ? '&inside' : ''), { save: H.living(H.cur), opts: { at8: at.slice() }, house: true });
    D.push(nb);
  };
  A.show = function (q) { return new D.roam.WetShow(q, { kind: 'actshow', beats: A.BEATS, play: A.play, title: '{y}THE SECOND ACT, 11-04{/} -- the signs, the fork, the path, the fight, the rise, the wand (a show)' }); };
  // the floor's script runs the staged beat first (a show's, or a bench's): f.secondAct { beat, strike, far, fled } -- cleared as it runs
  A.resume = function* (B) {
    var R0 = B.roam, f = R0.flags, s = f.secondAct; if (!s || !s.beat) return;
    f.secondAct = null; f.warmup = f.warmup || 0;
    if (s.beat === 'fork') { var r = yield* A.afterYard(B, s.fled ? 'fled' : 'inn'); if (r === 'after' && D.chase) { yield* D.chase.start(B, { horses: false, willem: true }); return; } if (r === 'let' && (yield* A.ringWarm(B, {})) === 'lost') return; } // (LET IT BE: the ring warm after the walk, as js/inn.js In.wagonNight has it)
    else if (s.beat === 'path') { if (s.strike) A.strikeNext = true; yield* A.path(B); }
    else if (s.beat === 'rise') { var Y = {}; yield* A.rise(B, Y); }
    else if (s.beat === 'boat') { yield* A.sound(B); return; } // (the rowboat by day: the floor goes on after)
    var mornA = A.morning(f);
    if (f.secondActDone) { var mornL = mornA || L('wagon.morning.' + (f.wagonOutcome === 'inn' ? 'inn' : 'quietSeen')); delete f.wagonIn; In.stage(B, [24, 17], 'inn'); yield* In.sleep(B, mornL); if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); }); }
  };
  var script0 = D.roam.script;
  D.roam.script = function* (B) {
    var def = D.roam.def; if (def && def.key === In.KEY && B.roam && B.roam.flags && B.roam.flags.secondAct) yield* A.resume(B);
    yield* script0.apply(this, arguments);
  };
})();
