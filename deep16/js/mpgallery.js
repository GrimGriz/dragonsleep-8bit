/* DEEP16 — the Mascot gallery (?mpgallery, or ?fxgallery&mascots; 10-07). The four Mascots' kits -- Denny, Beholda, Rascal and Goose (js/mpmon.js) --
   one ability at a time on the class floor, the way the spell gallery shows the spells (js/gallery.js) and ?mpshow stages each move with the dice pinned
   (js/mpshow.js). Griz, 10-07: "a spell gallery version of the heroes abilities ... before we run any more benches"; "a gallery view of lobstamonkee
   abilities like the spell effect one (repeats on click, advances on arrows) and to examine the current effects of the various abilities per level - to
   adjust their balance and visuals in tandem before we run more benches"; "Please make the giant info box left adjusted scrollable column - hard to see moves".

     keys    left/right the ability before or after · UP/DOWN THE LEVEL, 1 to 9 (the four rebuilt at it, every number recomputed) · E (or A), or a click on the
             floor: again · the wheel over the column, or a click on it (its top half up, its bottom half down): the column scrolls
     doors   &lvl=N starts at that level (5) · &ability=<id> at that ability · &who=denny,goose keeps to those Mascots · &only=a,b,c to those abilities · &auto goes on by itself · &fast cuts the pauses

   THE COLUMN (his word): the card is a column down the left of the screen, COL px wide, scrollable; the stage is shifted right of it and the battle's own
   cards (the ability's rolls) are drawn over the stage, not under the column. THE DICE ARE REAL, the Mascot's own above all -- a show of what the kit does,
   not a proof of its rules (that is ?mpshow's) -- except a foe's TRIGGER where a reaction or a passive needs one to fire (its blow pinned to land for Not
   Today, Hot Take, Lifeline and Eye Contact; Denny's d20 a 1 for Lucky Dice, a point short for the Social die): the column says so each time. THE FOES ARE
   NORMIES, as the spell gallery's (Griz, 10-07: "soften like the spell gallery"): every score 8, AC 10, no proficient saves, 100 HP, so a demonstration lands
   and nothing dies mid-way; the ogre keeps its size. The column: the ability's name; who and what it is; what it does at this level, in words; the ring's own
   rules line (the button's note, js/mpmon.js F.commands); BY LEVEL, its numbers at every level from the one it comes at to 9th, this level marked -- the
   growth (MP.pw / MP.rc: power on the even levels, reach on the odd) laid out to be read and argued with. An ability not yet come at this level shows its
   column and the figure idle. A Mascot's SHEET is the first entry of its run: the body at this level.
   MG.walk(B, opts) runs the same machinery inside another fight -- the Game Show's tutorial on the lighthouse floor (js/gameshow.js, 10-07: "build for denny
   as test") -- one pass through the entries asked for, then back to the caller. Nothing here is read by a fight. dev/bench16.js mode=mpgallery1007 runs
   every entry headless at 1, 5 and 9 and reads S.report. */
'use strict';
(function () {
  var D = window.D16, G = D.grid, RU = D.rules, I = D.input, MP = D.mpmon, F = D.features, NPC = D.npc;
  if (!MP) return;
  var MG = D.mpgallery = {};
  var COL = 150, LH = 9; // (the column's width in screen px, and a line's height: the cards' own)
  MG.COL = COL;
  function mod(s) { return Math.floor(((s || 10) - 10) / 2); }
  function prof(L) { return 2 + Math.floor(((L || 1) - 1) / 4); }
  function score(b, k, L) { var v = b.abil[k]; Object.keys(b.asi || {}).forEach(function (at) { if (L >= +at && b.asi[at] === k) v = Math.min(20, v + 2); }); return v; }
  function keyOf(b) { return b.cast || MP.SUBS[b.sub].key; }
  function statAt(who, k, L) { return mod(score(MP.BUILDS[who], k, L)); }
  function dcAt(who, L) { var b = MP.BUILDS[who]; return 8 + prof(L) + mod(score(b, keyOf(b), L)); }
  function hitAt(who, L) { var b = MP.BUILDS[who]; return prof(L) + mod(score(b, keyOf(b), L)); }
  function hpAt(who, L) { var b = MP.BUILDS[who], con = mod(score(b, 'con', L)); return b.hd + con + (L - 1) * (b.hd / 2 + 1 + con); }
  function avg(dx) { var m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(String(dx || '').replace(/\s/g, '')); if (!m) return 0; return +m[1] * (+m[2] + 1) / 2 + (m[3] ? +m[3] : 0); }
  function withAvg(dx) { var a = avg(dx); return dx + (a ? ' (avg ' + (Math.round(a * 10) / 10) + ')' : ''); }
  function sign(n) { return (n >= 0 ? '+' : '') + n; }
  function nth(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  var NAME = { denny: 'Denny', beholda: 'Beholda', rascal: 'Rascal', goose: 'Goose' };
  var ROLE = { denny: 'the Tank', beholda: 'Buffs', rascal: 'the DPS', goose: 'the Heals' };
  var KIND = { sheet: 'the body', blow: 'the regular blow', special: 'an action, a special', bonus: 'a bonus action, a special', free: 'a free bonus action', passive: 'a passive, always on', reaction: 'a reaction', capstone: 'the capstone, every Mascot' };
  var WHO = ['denny', 'beholda', 'rascal', 'goose'], SHORT = { denny: 'dn', beholda: 'bh', rascal: 'rs', goose: 'gs' };
  // the gallery's foes are normies (the spell gallery's rule, js/gallery.js; 10-02, Griz: "targets of the effects are normies with all 8s on their stats but
  // like 100 hp"): every score 8, no proficient saves, AC 10, 100 HP -- a save or a blow shows what the ability does; the size and the blows stay the sheet's
  function normie(w) {
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (k) { w.abil[k] = 8; if (w.base) w.base[k] = 8; });
    w.saves = { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 }; w.saveProf = []; w.feats = {};
    w.baseAC = 10; w.maxhp = w.hp = 100; w.temp = 0; w.gMax = 100;
    return w;
  }
  MG.normie = normie;

  // ------------------------------------------------------------------ the sheet: the body at a level, in words and in a line
  function sheetWords(u, L) {
    var b = MP.BUILDS[u.mpmon], k = MP.RACES[b.kind], ab = u.abil, w = u.weapon || {}, key = keyOf(b).toUpperCase();
    var traits = [k.climbs ? 'climbs' : '', k.floats ? 'floats (5 ft)' : '', k.dv ? 'darkvision ' + k.dv : '', k.noHands ? 'no hands' : ''].filter(Boolean).join(', ');
    var kit = ENTRIES.filter(function (e) { return e.who === u.mpmon && e.kind !== 'sheet' && e.kind !== 'blow' && L >= e.at; }).map(function (e) { return e.name; });
    var p = prof(L);
    return k.name + ', ' + ROLE[u.mpmon] + '. HP ' + u.maxhp + ', AC ' + RU.ac(u) + ', speed ' + u.speed + (traits ? ' (' + traits + ')' : '') + '. STR ' + ab.str + ' DEX ' + ab.dex + ' CON ' + ab.con + ' INT ' + ab.int + ' WIS ' + ab.wis + ' CHA ' + ab.cha + '; proficiency +' + p + ', saves ' + b.saves.map(function (s) { return s.toUpperCase(); }).join(' and ') + '. ' +
      (w.name || 'the blow') + ' ' + sign(w.atk || 0) + ' to hit, ' + (w.dice || '') + sign(w.mod || 0) + (u.attacksBase > 1 ? ', ' + u.attacksBase + ' swings an Attack action' : '') + '. DC ' + (u.mpSub === 'tank' ? MP.tauntDC(u) : u.spellDC) + ' (' + key + '). ' +
      'specials a fight: ' + MP.poolsAt(L).B + ' bonus and ' + MP.poolsAt(L).A + ' action, back on a short rest; a passive\'s or a reaction\'s uses ' + p + ' a fight. ' +
      (kit.length ? 'The kit at ' + nth(L) + ': ' + kit.join(', ') + '.' : '');
  }
  function sheetNums(who, l) { return 'HP ' + hpAt(who, l) + ', ' + sign(hitAt(who, l)) + ' hit, DC ' + dcAt(who, l) + ', specials ' + MP.poolsAt(l).B + '/' + MP.poolsAt(l).A; }

  // ------------------------------------------------------------------ the register: every ability, by Mascot and the level it comes at
  //   id · who · name · at (the level) · kind · button (the ring's id, for its rules line) · pin (the trigger pinned, said on the column)
  //   words(L, c): what it does at level L · nums(l): its numbers at level l, one short line for the ladder · run(c): the demonstration
  // c = { B, L, dn, bh, rs, gs, gob[], hob, ogre, stage, act, turn, swings, beside, W } -- see ctx() below
  var ENTRIES = [
    // ---- DENNY, the Tank
    { id: 'denny', who: 'denny', name: 'Denny', at: 1, kind: 'sheet', words: function (L, c) { return sheetWords(c.dn, L); }, nums: function (l) { return sheetNums('denny', l); },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.gob[0], 5, 0]], c.dn); yield c.W(40); } },
    { id: 'fists', who: 'denny', name: 'Monkey Fists', at: 1, kind: 'blow',
      words: function (L, c) { var w = c.dn.weapon; return 'Bare fists, 1d6 + STR (1d8 with both hands free): ' + sign(w.atk) + ' to hit, ' + w.dice + sign(w.mod) + ' bludgeoning a punch' + (L >= 5 ? ', two punches an Attack action (Extra Attack at 5th)' : '') + '. Here, at the hobgoblin.'; },
      nums: function (l) { return sign(hitAt('denny', l)) + ', 1d8' + sign(statAt('denny', 'str', l)) + (l >= 5 ? ' x2' : ''); },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.hob, 1, 0], [c.bh, -2, 1]], c.dn); yield* c.swings(c.dn, c.hob); } },
    { id: 'taunt', who: 'denny', name: 'Taunt', at: 1, kind: 'bonus', button: 'mp-taunt',
      words: function (L) { return 'He waggles his fingers by his ears -- come on, then. The ' + MP.tauntN(L) + ' nearest foes within ' + MP.tauntR(L) + ' ft that can hear him save WIS (DC ' + dcAt('denny', L) + ') or are TAUNTED till the end of HIS next turn, no save to end it sooner: they go only at him if they can reach him, and swing at anyone else at disadvantage. No swing of its own: his action is still his. Here the hobgoblin and the two goblins by Beholda; then the near goblin takes its turn.'; },
      nums: function (l) { return MP.tauntN(l) + ' foes in ' + MP.tauntR(l) + ' ft, DC ' + dcAt('denny', l); },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.hob, 1, 0], [c.bh, -2, 2], [c.gob[0], -2, 3], [c.gob[1], -3, 2]], c.dn); RU.startTurn(c.dn); yield* c.act(c.dn, MP.taunt(c.B, c.dn)); yield* c.turn(c.gob[0]); } },
    { id: 'denim', who: 'denny', name: 'Denim Damage', at: 1, kind: 'special', button: 'mp-denim',
      words: function (L) { return 'The spin, the jacket flaring, the haymaker: his swings, and the first that lands takes +' + withAvg(MP.denimDice(L)) + ' (doubled on a critical)' + (MP.denimPush(L) ? ', and the denim knocks that one ' + MP.denimPush(L) + ' ft straight back (Large or smaller; no save)' : '') + '. Here, on the ogre.'; },
      nums: function (l) { return '+' + MP.denimDice(l) + (MP.denimPush(l) ? ', knock ' + MP.denimPush(l) + ' ft' : ''); },
      run: function* (c) { c.stage([[c.ogre, 2, 0], [c.dn, 0, 0], [c.bh, -2, 1]], c.ogre); c.beside(c.dn, c.ogre); RU.startTurn(c.dn); yield* c.act(c.dn, MP.denim(c.B, c.dn, c.ogre)); } },
    { id: 'flurry', who: 'denny', name: 'Monkey Flurry', at: 2, kind: 'free', button: 'mp-flurry',
      words: function (L, c) { var w = c.dn.weapon; return 'After the Attack action, one more punch as a bonus action, free (the monk\'s Martial Arts): ' + w.dice + sign(w.mod) + ' more a turn when it lands. Here: the Attack action at the hobgoblin, then the flurry.'; },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.hob, 1, 0], [c.bh, -3, 2]], c.dn); yield* c.swings(c.dn, c.hob); if (MP.flurryOK(c.dn)) yield* c.act(c.dn, MP.flurry(c.B, c.dn, c.hob)); } },
    { id: 'standfirm', who: 'denny', name: 'Stand Firm', at: 3, kind: 'passive',
      words: function () { return 'Advantage on every save against being knocked prone, on every STR save (a shove, a wave, a wind), and on the check to break a grip. Here: a blow at his feet, DC 14 -- his save rolls two d20s and keeps the better; Beholda beside him rolls one.'; },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.bh, -1, 0], [c.ogre, 2, 0]], c.dn); var sd = RU.save(c.dn, 'dex', 14, false, 'prone'), sb = RU.save(c.bh, 'dex', 14, false, 'prone'); c.B.card(['{y}Denny{/}: DEX vs prone, DC 14  ' + RU.saveText(sd) + '   {y}Beholda{/}: ' + RU.saveText(sb)], c.W(320)); yield c.W(60); } },
    { id: 'cannonball', who: 'denny', name: 'Cannonball', at: 5, kind: 'special', button: 'mp-cannonball',
      words: function (L) { return 'The crouch and the spring: a leap of up to ' + MP.leap(L) + ' ft (no opportunity attacks: he is in the air) to a square beside a foe; every foe within 5 ft where he lands saves DEX (DC ' + dcAt('denny', L) + ') or takes ' + withAvg(MP.cannonDice(L)) + ' bludgeoning and is knocked PRONE (half, and on its feet, on a save; a Huge one is not knocked down); then one swing at the one he came down by. Here, beside two goblins.'; },
      nums: function (l) { return MP.cannonDice(l) + ', leap ' + MP.leap(l) + ' ft, DC ' + dcAt('denny', l); },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.bh, -1, 1], [c.gob[0], 4, 0], [c.gob[1], 5, 0]], c.dn); RU.startTurn(c.dn); yield* c.act(c.dn, MP.cannonball(c.B, c.dn, c.gob[1])); } },
    { id: 'bodyguard', who: 'denny', name: 'Bodyguard', at: 6, kind: 'reaction',
      words: function () { return 'A foe he sees swings at a friend within 5 ft of him: his reaction -- he hops in and braces (GUARD), and the roll is at disadvantage (the Protection fighting style, without the shield). The player is asked; here he answers yes. The goblin swings at Beholda.'; },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.dn, 1, 0], [c.gob[0], -1, 0]], c.bh); yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.bh, MP.meleeOf(c.gob[0]).atk)); } },
    { id: 'hug', who: 'denny', name: 'Lobstah Hug', at: 7, kind: 'special', button: 'mp-hug',
      words: function (L) { return 'The lunge, arms and tail wrapped round: a foe beside him, ' + (MP.hugSize(L) > 2 ? 'Huge' : 'Large') + ' or smaller, saves STR (DC ' + dcAt('denny', L) + ') or is HELD -- grappled and restrained by him (BREAK FREE against his DC lets go), taunted to him while he holds it, and at the start of each of his turns squeezed for ' + withAvg(MP.hugDice(L)) + ' + STR. Here the hobgoblin, then the squeeze.'; },
      nums: function (l) { return MP.hugDice(l) + '+STR, ' + (MP.hugSize(l) > 2 ? 'Huge' : 'Large') + ' or smaller, DC ' + dcAt('denny', l); },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.hob, 1, 0], [c.bh, -3, 3]], c.dn); RU.startTurn(c.dn); yield* c.act(c.dn, MP.hug(c.B, c.dn, c.hob)); if (c.hob.conds.restrained) { c.B.active = c.dn; c.B.mpHive = c.B.round; D.magic.onStart(c.B, c.dn); yield c.W(70); c.B.active = null; } } },
    // ---- BEHOLDA, Buffs
    { id: 'beholda', who: 'beholda', name: 'Beholda', at: 1, kind: 'sheet', words: function (L, c) { return sheetWords(c.bh, L); }, nums: function (l) { return sheetNums('beholda', l); },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.gob[0], 5, 0]], c.bh); yield c.W(40); } },
    { id: 'diceslam', who: 'beholda', name: 'Dice Slam', at: 1, kind: 'blow',
      words: function (L, c) { var w = c.bh.weapon; return 'Her three dice swung on their chains, on her will: ' + sign(w.atk) + ' to hit (WIS), ' + w.dice + sign(w.mod) + ' bludgeoning. Here, at the hobgoblin.'; },
      nums: function (l) { return sign(hitAt('beholda', l)) + ', 1d8' + sign(statAt('beholda', 'wis', l)); },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.hob, 1, 0], [c.dn, -2, 1]], c.bh); yield* c.swings(c.bh, c.hob); } },
    { id: 'bubble', who: 'beholda', name: 'The VNA Bubble', at: 1, kind: 'special', button: 'mp-bubble',
      words: function (L) { return 'An action and her concentration (10-07): her eye squeezes shut and flies open, and the film forms round her -- she and every friend within ' + MP.bubbleR(L) + ' ft have +' + MP.bubbleAC(L) + ' AC for as long as she holds it. Only her concentration breaking ends it: a blow\'s CON save lost, or her down, stunned or incapacitated. Here: the bubble over her and Denny, then a goblin looses at them.'; },
      nums: function (l) { return '+' + MP.bubbleAC(l) + ' AC, ' + MP.bubbleR(l) + ' ft'; },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.bh, -1, 1], [c.gob[0], 6, 0]], c.bh); RU.startTurn(c.bh); yield* c.act(c.bh, MP.bubble(c.B, c.bh)); yield* c.turn(c.gob[0]); } },
    { id: 'gaze', who: 'beholda', name: 'Baleful Gaze', at: 1, kind: 'bonus', button: 'mp-gaze',
      words: function (L) { return 'A bonus action, or her action from the action specials -- one gaze a turn either way (10-07): the eye swells violet, the spiral in it -- one creature she sees within ' + MP.gazeRange(L) + ' ft saves WIS (DC ' + dcAt('beholda', L) + '). Failed: ' + withAvg(MP.gazeDice(L)) + ' psychic and its AC ' + MP.gazeAC(L) + ' lower, till it makes the save again at the end of one of its turns. Saved: half, and no mark. No domination (the Big Screen keeps that). Here the hobgoblin; then its turn, and its save at the end.'; },
      nums: function (l) { return MP.gazeDice(l) + ', AC -' + MP.gazeAC(l) + ', ' + MP.gazeRange(l) + ' ft, DC ' + dcAt('beholda', l); },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.dn, -1, -1], [c.hob, 4, 0], [c.gob[0], 5, 0]], c.hob); RU.startTurn(c.bh); yield* c.act(c.bh, MP.gaze(c.B, c.bh, c.hob)); yield* c.turn(c.hob); D.magic.endTurn(c.B, c.hob); yield c.W(40); } },
    { id: 'eye', who: 'beholda', name: 'Eye On It', at: 2, kind: 'free', button: 'mp-eye',
      words: function () { return 'The four stalks swivel to a foe she sees within 30 ft, a star at each tip: the Help from 30 ft, free -- the next swing her side makes at it has advantage (spent on that swing; lapsed at her next turn). Here the hobgoblin, then Denny\'s swing at it.'; },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.dn, 3, 1], [c.hob, 4, 0]], c.hob); RU.startTurn(c.bh); yield* c.act(c.bh, MP.eyeOnIt(c.B, c.bh, c.hob)); yield* c.swings(c.dn, c.hob); } },
    { id: 'lucky', who: 'beholda', name: 'Lucky Dice', at: 3, kind: 'passive', pin: 'Denny\'s d20 pinned to a 1 the first time, real the second',
      words: function (L) { return 'A friend she sees within 30 ft -- or she -- who rolls a 1 on the d20 of an attack or a save rolls it again (the halfling\'s Lucky, given to her friends by her three dice), ' + prof(L) + ' times a fight. Here: Denny\'s d20 comes up a 1 at the hobgoblin, and he rolls it again.'; },
      nums: function (l) { return prof(l) + ' a fight'; },
      run: function* (c) { c.stage([[c.dn, 0, 0], [c.hob, 1, 0], [c.bh, -1, 1]], c.dn); RU.startTurn(c.dn); var k = 0; yield* c.act(c.dn, c.B.attack(c.dn, c.hob, c.dn.weapon), function () { return k++ ? null : 1; }); } },
    { id: 'screen', who: 'beholda', name: 'The Big Screen', at: 5, kind: 'special', button: 'mp-screen',
      words: function (L) { return 'The projection: her eye opens a ' + MP.screenLen(L) + '-ft cone at one she sees, and every foe in it saves WIS (DC ' + dcAt('beholda', L) + ') -- failed, ' + withAvg(MP.screenDice(L)) + ' psychic and DOMINATED; saved, half. Set against a Fireball\'s 8d6. Here, at the middle goblin of three.'; },
      nums: function (l) { return MP.screenDice(l) + ', ' + MP.screenLen(l) + '-ft cone, DC ' + dcAt('beholda', l); },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.dn, -1, 1], [c.gob[0], 3, 0], [c.gob[1], 4, 1], [c.gob[2], 4, -1]], c.gob[0]); RU.startTurn(c.bh); yield* c.act(c.bh, MP.screen(c.B, c.bh, c.gob[0])); } },
    { id: 'eyecontact', who: 'beholda', name: 'Eye Contact', at: 6, kind: 'reaction', pin: 'the goblin\'s d20 pinned to land by a little',
      words: function (L) { return 'A foe she sees within 60 ft lands a blow on a friend of hers, or on her, by a little: she meets its eye -- her reaction, 1d6 off the roll (the bard\'s Cutting Words), ' + prof(L) + ' times a fight. It goes on its own, where a d6 could turn the blow. Here a goblin on Rascal, Beholda 30 ft off.'; },
      nums: function (l) { return prof(l) + ' a fight'; },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.bh, -6, 0], [c.dn, -6, 3], [c.gob[0], 1, 0]], c.rs); var a = MP.meleeOf(c.gob[0]).atk, need = RU.ac(c.rs) - (a.atk || 0); yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.rs, a), Math.max(2, Math.min(19, need + 2))); } },
    { id: 'spotlight', who: 'beholda', name: 'Spotlight', at: 7, kind: 'special', button: 'mp-spotlight',
      words: function (L) { return 'The eye glows gold and the stage light shines: ' + (MP.spotN(L) > 1 ? MP.spotN(L) + ' friends' : 'a friend') + ' she sees within ' + MP.spotR(L) + ' ft are HASTED till the end of their next turn -- +2 AC, advantage on DEX saves, double speed, one more attack in the Attack action -- and no lethargy after. Here Denny, then his swings at the hobgoblin.'; },
      nums: function (l) { return MP.spotN(l) + (MP.spotN(l) > 1 ? ' friends' : ' friend') + ', ' + MP.spotR(l) + ' ft'; },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.dn, 2, 0], [c.hob, 3, 0], [c.rs, -2, 1]], c.bh); RU.startTurn(c.bh); yield* c.act(c.bh, MP.spotlight(c.B, c.bh, [c.dn])); yield* c.swings(c.dn, c.hob); } },
    // ---- RASCAL, the DPS
    { id: 'rascal', who: 'rascal', name: 'Rascal', at: 1, kind: 'sheet', words: function (L, c) { return sheetWords(c.rs, L); }, nums: function (l) { return sheetNums('rascal', l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.gob[0], 5, 0]], c.rs); yield c.W(40); } },
    { id: 'firebolt', who: 'rascal', name: 'Fire Bolt', at: 1, kind: 'blow',
      words: function (L, c) { return 'His regular blow is a cantrip, Fire Bolt on CHA ("He\'ll range attack with a cantrip like Aurdin"): a spell attack ' + sign(c.rs.spellAtk) + ' to hit at 120 ft, ' + (L >= 5 ? '2d10' : '1d10') + ' fire' + (L >= 3 ? ' + CHA (Spicy)' : '') + '. When something is on him, the PINCH: the giant claw, 1d6 + STR. Here the bolt at the hobgoblin.'; },
      nums: function (l) { return sign(hitAt('rascal', l)) + ', ' + (l >= 5 ? '2d10' : '1d10') + (l >= 3 ? sign(statAt('rascal', 'cha', l)) : ''); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, 3], [c.hob, 4, 0]], c.hob); RU.startTurn(c.rs); yield* c.act(c.rs, D.magic.cast(c.B, c.rs, 'firebolt', 0, c.hob)); } },
    { id: 'sharing', who: 'rascal', name: 'Social Sharing', at: 1, kind: 'bonus', button: 'mp-sharing', pin: 'Denny\'s d20 pinned a point short, so the die has a miss to turn',
      words: function (L) { return 'The hat comes off and he bows: ' + (MP.shareN(L) > 1 ? 'up to ' + MP.shareN(L) + ' friends' : 'a friend') + ' within 30 ft each get a Social die, a ' + MP.shareDie(L) + ', spent where it turns a miss into a hit or a failed save into a saved one (the bard\'s inspiration). Here Denny and Beholda; then Denny swings at the hobgoblin a point short, and the die decides it.'; },
      nums: function (l) { return 'a ' + MP.shareDie(l) + ' to ' + MP.shareN(l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, 2, 0], [c.bh, -1, 1], [c.hob, 3, 0]], c.rs); RU.startTurn(c.rs); yield* c.act(c.rs, MP.sharing(c.B, c.rs)); var d20 = Math.max(2, Math.min(19, RU.ac(c.hob) - 1 - c.dn.weapon.atk)); RU.startTurn(c.dn); yield* c.act(c.dn, c.B.attack(c.dn, c.hob, c.dn.weapon), d20); } },
    { id: 'flame', who: 'rascal', name: 'Social Flame', at: 1, kind: 'special', button: 'mp-flame',
      words: function (L) { return 'The dance, the claw clapping over his head, and a ball of fire bursts at a point he sees within 60 ft, ' + MP.flameR(L) + ' ft round: everyone in it (friends too) saves DEX (DC ' + dcAt('rascal', L) + ') or takes ' + withAvg(MP.flameDice(L)) + ' fire, half on a save. Here, round the middle goblin of three; Denny and Beholda stand well back.'; },
      nums: function (l) { return MP.flameDice(l) + ', ' + MP.flameR(l) + ' ft round, DC ' + dcAt('rascal', l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, -3], [c.bh, -3, 3], [c.gob[0], 5, 0], [c.gob[1], 6, 1], [c.gob[2], 6, -1]], c.gob[1]); RU.startTurn(c.rs); yield* c.act(c.rs, MP.flame(c.B, c.rs, c.gob[1])); } },
    { id: 'scuttle', who: 'rascal', name: 'Scuttle', at: 2, kind: 'free', button: 'cdisengage',
      words: function () { return 'Dash, Disengage or Hide as a bonus action, free (the rogue\'s Cunning Action) -- sideways like a lobster. Here a goblin beside him: he disengages, his action still his.'; },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.gob[0], 1, 0], [c.dn, -4, 3]], c.rs); RU.startTurn(c.rs); yield* c.act(c.rs, c.B.exec(c.rs, { do: 'cdisengage' })); } },
    { id: 'spicy', who: 'rascal', name: 'Spicy', at: 3, kind: 'passive',
      words: function (L) { return 'His Fire Bolt adds his CHA (' + sign(statAt('rascal', 'cha', L)) + ') to its damage (the warlock\'s Agonizing Blast, on his own cantrip). Here the bolt at the hobgoblin, the CHA on the line.'; },
      nums: function (l) { return (l >= 5 ? '2d10' : '1d10') + sign(statAt('rascal', 'cha', l)); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, 3], [c.hob, 4, 0]], c.hob); RU.startTurn(c.rs); yield* c.act(c.rs, D.magic.cast(c.B, c.rs, 'firebolt', 0, c.hob)); } },
    { id: 'distancing', who: 'rascal', name: 'Social Distancing', at: 5, kind: 'special', button: 'mp-distancing',
      words: function (L) { return 'He clears the ring round him ("clears the 8 square donut around him"): every foe within ' + MP.distR(L) + ' ft saves WIS (DC ' + dcAt('rascal', L) + ') or takes ' + withAvg(MP.distDice(L)) + ' psychic, is SHOVED out of the ring straight away from him, and is FRIGHTENED of him till the end of its next turn (it gets away, and swings at disadvantage while it sees him); half, and it stands its ground, on a save. Here two goblins right beside him; then the nearer one\'s turn.'; },
      nums: function (l) { return MP.distDice(l) + ', ' + MP.distR(l) + ' ft round him, DC ' + dcAt('rascal', l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, 3], [c.bh, -3, -3], [c.gob[0], 1, 0], [c.gob[1], -1, 0]], c.rs); RU.startTurn(c.rs); yield* c.act(c.rs, MP.distancing(c.B, c.rs)); yield* c.turn(c.gob[0]); } },
    { id: 'hottake', who: 'rascal', name: 'Hot Take', at: 6, kind: 'reaction', pin: 'the goblin\'s d20 pinned to land',
      words: function (L) { return 'A foe he sees within 60 ft hits him: fire back -- his reaction, the foe saves DEX (DC ' + dcAt('rascal', L) + ') or takes 2d10 fire, half on a save (Hellish Rebuke at 1st), ' + prof(L) + ' times a fight. The player is asked; here he answers HOT TAKE. The goblin\'s blow lands.'; },
      nums: function (l) { return '2d10, ' + prof(l) + ' a fight, DC ' + dcAt('rascal', l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -4, 3], [c.bh, -4, -3], [c.gob[0], 1, 0]], c.rs); yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.rs, MP.meleeOf(c.gob[0]).atk), 19); } },
    { id: 'viral', who: 'rascal', name: 'Going Viral', at: 7, kind: 'special', button: 'mp-viral',
      words: function (L) { return 'Fire that spreads foe to foe (Chain Lightning\'s shape): a foe he sees within 120 ft, then the nearest foe within 30 ft of the last not yet caught, ' + MP.viralN(L) + ' in all; each saves DEX (DC ' + dcAt('rascal', L) + ') or takes ' + withAvg(MP.viralDice(L)) + ' fire, half on a save. It never jumps to a friend. Here three goblins in a line.'; },
      nums: function (l) { return MP.viralDice(l) + ' to ' + MP.viralN(l) + ', DC ' + dcAt('rascal', l); },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, 3], [c.bh, -3, -3], [c.gob[0], 4, 0], [c.gob[1], 7, 0], [c.gob[2], 10, 0]], c.gob[1]); RU.startTurn(c.rs); yield* c.act(c.rs, MP.viral(c.B, c.rs, c.gob[0])); } },
    // ---- GOOSE, the Heals
    { id: 'goose', who: 'goose', name: 'Goose', at: 1, kind: 'sheet', words: function (L, c) { return sheetWords(c.gs, L); }, nums: function (l) { return sheetNums('goose', l); },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.gob[0], 5, 0]], c.gs); yield c.W(40); } },
    { id: 'sling', who: 'goose', name: 'The Sling', at: 1, kind: 'blow',
      words: function (L, c) { var w = c.gs.weapon; return 'His old sling, a stone off the floor, slung on his heart ("yes, historically a sling"): ' + sign(w.atk) + ' to hit (WIS), ' + w.dice + sign(w.mod) + ' bludgeoning at 30/120 ft. Here, at the hobgoblin.'; },
      nums: function (l) { return sign(hitAt('goose', l)) + ', 1d4' + sign(statAt('goose', 'wis', l)); },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.dn, -3, 3], [c.hob, 4, 0]], c.hob); yield* c.swings(c.gs, c.hob); } },
    { id: 'heart', who: 'goose', name: 'Heart to Heart', at: 1, kind: 'bonus', button: 'mp-heart',
      words: function (L) { return 'The jump, the glow between his hands, green: a friend he sees within ' + MP.heartR(L) + ' ft, or he, heals ' + MP.heartDice(L) + ' + WIS' + (L >= 3 ? ' + ' + L + ' (Big Heart)' : '') + ' (avg ' + Math.round((avg(MP.heartDice(L)) + statAt('goose', 'wis', L) + (L >= 3 ? L : 0)) * 10) / 10 + ') -- up again, if it was down. A bonus action: his action is still his. Here Denny at 3 HP across the floor.'; },
      nums: function (l) { return MP.heartDice(l) + '+WIS' + (l >= 3 ? '+' + l : '') + ', ' + MP.heartR(l) + ' ft'; },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.dn, 6, 0], [c.bh, -2, 2]], c.dn); c.dn.hp = 3; RU.startTurn(c.gs); yield* c.act(c.gs, MP.heart(c.B, c.gs, c.dn)); } },
    { id: 'group', who: 'goose', name: 'Group Hug', at: 1, kind: 'special', button: 'mp-group',
      words: function (L) { return 'He springs up and the glow comes down round him: every friend within ' + MP.groupR(L) + ' ft, himself and the down among them, heals ' + MP.groupDice(L) + ' + WIS' + (L >= 3 ? ' + ' + L + ' (Big Heart)' : '') + ' each (avg ' + Math.round((avg(MP.groupDice(L)) + statAt('goose', 'wis', L) + (L >= 3 ? L : 0)) * 10) / 10 + '). Here Denny, Beholda and Rascal at 2 HP round him, a goblin among them who gets nothing.'; },
      nums: function (l) { return MP.groupDice(l) + '+WIS' + (l >= 3 ? '+' + l : '') + ' each, ' + MP.groupR(l) + ' ft'; },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.dn, 2, 0], [c.bh, -2, 1], [c.rs, 0, 2], [c.gob[0], 3, 1]], c.gs); [c.dn, c.bh, c.rs].forEach(function (w) { w.hp = 2; }); c.gs.hp = c.gs.maxhp - 5; RU.startTurn(c.gs); yield* c.act(c.gs, MP.group(c.B, c.gs)); } },
    { id: 'honk', who: 'goose', name: 'Honk', at: 2, kind: 'free', button: 'mp-honk',
      words: function () { return 'HONK, free: a foe within 30 ft that can hear him -- its next attack roll before the end of its next turn has disadvantage (Vicious Mockery\'s own mark). Here the goblin by Rascal, then its swing at him with two d20s, the worse kept.'; },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.rs, 3, 0], [c.gob[0], 4, 0], [c.dn, -3, 3]], c.gs); RU.startTurn(c.gs); yield* c.act(c.gs, MP.honk(c.B, c.gs, c.gob[0])); yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.rs, MP.meleeOf(c.gob[0]).atk)); } },
    { id: 'bigheart', who: 'goose', name: 'Big Heart', at: 3, kind: 'passive',
      words: function (L) { return 'His heals add his level, ' + L + ', to each one they mend (the Life cleric\'s Disciple of Life). Here Heart to Heart on Denny at 3 HP, the +' + L + ' on the line.'; },
      nums: function (l) { return '+' + l + ' a heal'; },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.dn, 4, 0], [c.bh, -2, 2]], c.dn); c.dn.hp = 3; RU.startTurn(c.gs); yield* c.act(c.gs, MP.heart(c.B, c.gs, c.dn)); } },
    { id: 'fountain', who: 'goose', name: 'Fountain', at: 5, kind: 'special', button: 'mp-fountain',
      words: function (L) { return 'The glow wells up round him ("Cleanse as \'Fountain\'"): every friend within ' + MP.fountR(L) + ' ft, himself too, has its worst ailment ended (paralysis, disease, blindness, poison, deafness -- Lesser Restoration\'s) and heals ' + MP.fountDice(L) + ' + ' + L + ' (avg ' + Math.round((avg(MP.fountDice(L)) + L) * 10) / 10 + '). Here Denny poisoned, Rascal blinded, Beholda paralysed, each 20 HP down.'; },
      nums: function (l) { return MP.fountDice(l) + '+' + l + ', ' + MP.fountR(l) + ' ft'; },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.dn, 3, 0], [c.rs, -3, 1], [c.bh, 0, 3]], c.gs); c.dn.conds.poisoned = {}; c.rs.conds.blinded = {}; c.bh.conds.paralyzed = {}; [c.dn, c.rs, c.bh].forEach(function (w) { w.hp = w.maxhp - 20; }); RU.startTurn(c.gs); yield* c.act(c.gs, MP.fountain(c.B, c.gs)); } },
    { id: 'nottoday', who: 'goose', name: 'Not Today', at: 6, kind: 'reaction', pin: 'the goblin\'s d20 pinned to land',
      words: function () { return 'A blow that would drop a friend of his within 30 ft (not himself) leaves it at 1 instead -- his reaction, once a fight, on its own (Death Ward\'s shape, lent for the one blow). Here Beholda at 2 HP takes a goblin\'s blow, Goose 15 ft off.'; },
      nums: function () { return 'once a fight'; },
      run: function* (c) { c.stage([[c.bh, 0, 0], [c.gs, -3, 0], [c.gob[0], 1, 0]], c.bh); c.bh.hp = 2; yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.bh, MP.meleeOf(c.gob[0]).atk), 19); } },
    { id: 'lifeline', who: 'goose', name: 'Lifeline', at: 7, kind: 'special', button: 'mp-lifeline', pin: 'the goblin\'s d20 pinned to land',
      words: function (L) { return 'A friend he sees within ' + MP.lifeR(L) + ' ft is TIED, the fight long, to a second -- himself, or another friend ("can tie denny instead of self") -- and half of every blow on the one tied is taken by the other instead (Warding Bond). It lets go when either drops, when they part past ' + 2 * MP.lifeR(L) + ' ft, or when he ties another' + (MP.lifeWard(L) ? '; the one tied has +1 AC and +1 on its saves too' : '') + '. A green thread on the floor. Here Rascal tied to Denny, then a goblin\'s blow on Rascal.'; },
      nums: function (l) { return MP.lifeR(l) + ' ft' + (MP.lifeWard(l) ? ', +1 AC and saves' : ''); },
      run: function* (c) { c.stage([[c.gs, 0, 0], [c.rs, 3, 0], [c.dn, 0, 2], [c.gob[0], 4, 0]], c.gs); RU.startTurn(c.gs); yield* c.act(c.gs, MP.lifeline(c.B, c.gs, c.rs, c.dn)); yield* c.act(c.gob[0], c.B.attack(c.gob[0], c.rs, MP.meleeOf(c.gob[0]).atk), 19); } },
    // ---- THE HIVEMIND, 9th, the four
    { id: 'hivemind', who: null, name: 'The Hivemind', at: 9, kind: 'capstone',
      words: function () { return 'Once a fight, at the first turn its side takes in the first round, the 9th-level Mascots roll off -- a d20 each, no bonus; the highest gives every Mascot on its side its role\'s boon, and any other that rolled a natural 20 gives its own too ("fires first party member turn first round of fight, dice roll off, highests fires and any nat20 roll other than highest also fires"). The boons, a token for each one\'s next special: Denny\'s WARD (1d6 off every blow that lands on its user till the start of its next turn), Beholda\'s AIM (1d6 on the special\'s attack roll, or 1d6 off each save against it), Rascal\'s HEAT (1d6 more on its damage), Goose\'s LOVE (1d6 temporary hit points at once). Here the fight\'s first turn, Rascal\'s: the roll-off, then his Social Flame, taking the heat and the aim if they came.'; },
      run: function* (c) { c.stage([[c.rs, 0, 0], [c.dn, -3, 3], [c.bh, -3, -3], [c.gs, -4, 0], [c.gob[0], 5, 0], [c.gob[1], 6, 1]], c.rs); c.B.round = 1; c.B.mpHive = null; c.B.mpHiveDone = null; c.B.active = c.rs; D.magic.onStart(c.B, c.rs); yield c.W(90); RU.startTurn(c.rs); yield* c.act(c.rs, MP.flame(c.B, c.rs, c.gob[0])); } }
  ];
  MG.ENTRIES = ENTRIES;
  var BY_ID = {}; ENTRIES.forEach(function (e) { BY_ID[e.id] = e; });
  MG.ids = function (who, only) { // the entries asked for, in the register's order
    var ids = ENTRIES.filter(function (e) { return (!who || !who.length || (e.who ? who.indexOf(e.who) >= 0 : who.length === 4)) && (!only || !only.length || only.indexOf(e.id) >= 0); }).map(function (e) { return e.id; });
    return ids.length ? ids : ENTRIES.map(function (e) { return e.id; });
  };

  // ------------------------------------------------------------------ the machinery over a battle: the stage, the dice pins, the column, the loop
  // S: { ids, i, L, auto, fast, levels (up/down change the level), once (one pass, then the loop returns), M (the four by key), foes, home, rebuild(L), report, shown }
  function install(B, S) {
    var W = function (n) { return S.fast ? 1 : n; };
    S.report = S.report || {}; S.shown = 0; S.panel = { lines: [], scroll: 0, rows: 20 };

    // ---- the dice: a trigger pinned for a demonstration, and only while this battle is the one up (as js/mpshow.js pins its beats)
    var d0 = D.d, save0 = RU.save, inSave = 0, pin = { d20: null, save: null };
    RU.save = function () { inSave++; try { return save0.apply(this, arguments); } finally { inSave--; } };
    D.d = function (n) {
      if (D.battle === B && n === 20) {
        if (inSave && pin.save != null) return pin.save;
        if (!inSave && pin.d20 != null) { var v = typeof pin.d20 === 'function' ? pin.d20() : pin.d20; if (v != null) return v; }
      }
      return d0.apply(this, arguments);
    };
    // ---- the picture: the column down the left, the battle's own cards over the stage to its right (ui.js draws them centred on the whole screen,
    // under the column: here they are held back from its paint and drawn after, in the stage's width)
    var paint0 = B.paint;
    B.paint = function (ctx) {
      var cs = this.cards; this.cards = [];
      try { paint0.apply(this, arguments); } finally { this.cards = cs; }
      cardsRight(ctx, this); column(ctx);
    };
    // the column scrolls every frame, a demonstration running or not: the wheel over it, or a click on it (its top half up, its bottom half down);
    // both are spent here, so the floor's zoom and the show's own click list never see them
    var update0 = B.update;
    B.update = function () {
      var P = S.panel, m = I.mouse, over = !!(P && m.inside && m.x < COL);
      if (over && m.wheel) { P.scroll += m.wheel > 0 ? 3 : -3; m.wheel = 0; }
      if (over && m.click) { P.scroll += (m.y < D.H / 2 ? -1 : 1) * Math.max(1, (P.rows || 10) - 2); m.click = false; D.sfx('cursor'); }
      return update0.apply(this, arguments);
    };
    S.teardown = function () { D.d = d0; RU.save = save0; B.paint = paint0; B.update = update0; };

    function pool() { return WHO.map(function (k) { return S.M[k]; }).filter(Boolean).concat(S.foes); }
    // ---- the stage (the show's: who stands where, whole again, from the stage's middle)
    function fresh(u, hp) {
      u.maxhp = hp || u.gMax || u.maxhp; u.hp = u.maxhp; u.temp = 0; u.conds = {}; u.dead = false; u.ko = false; u.fled = false; u.left = false;
      ['tween', 'ready', 'conc', 'holding', 'proneLook', 'proneT', 'helpedRound'].forEach(function (k) { delete u[k]; });
      u.reaction = 1; u.anim = 'idle'; u.animT = B.t; u.flash = 0;
      if (u.mpmon) MP.refill(u);
    }
    function free(u, x, y) { return G.canStand(u, x, y) && !B.units.some(function (w) { return w !== u && !w.dead && w.x === x && w.y === y; }); }
    function spot(u, x, y) { for (var r = 0; r < 8; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (free(u, x + dx, y + dy)) return [x + dx, y + dy]; } return [x, y]; }
    function stage(list, focus) { // [unit, dx, dy, hp?] from the stage's middle; the floor cleared first (the show's find, 10-06 night)
      var keep = B.units.filter(function (u) { return pool().indexOf(u) < 0; }); // (the show's own people, out of the way but on the board: the tutorial's)
      B.units = keep.slice(); pool().forEach(function (u) { u.x = -99; u.y = -99; }); G.setup(G.map, B.units);
      ['grounds', 'auras', 'wards', 'spirits', 'darks', 'webs', 'zones', 'beads', 'walls', 'shells'].forEach(function (k) { if (B[k]) B[k] = []; }); B.wallMap = null; B.overgrown = null;
      list.forEach(function (e) { var u = e[0]; if (!u) return; fresh(u, e[3]); u.x = -99; u.y = -99; B.units.push(u); var q2 = spot(u, S.home.x + e[1], S.home.y + e[2]); u.x = q2[0]; u.y = q2[1]; u.facing = e[1] < 0 ? 0 : 4; });
      G.setup(G.map, B.units);
      B.round = 1; B.order = B.units.slice(); B.active = null;
      B.mpHive = B.round; // (the round's Hivemind marked as fired BEFORE the turns start: at 9th it fired on the staging itself and every demonstration carried its tokens -- found 10-07; the Hivemind entry fires it on purpose)
      B.units.forEach(function (u) { RU.startTurn(u); });
      if (B.readySnap) B.readySnap();
      var f = focus || list[0][0];
      if (B.focus) B.focus(f);
      D.iso.cam.x -= Math.round(COL / 2 / (D.iso.zoom || 1)); // (the stage's middle in the clear to the right of the column)
    }
    function beside(u, t) { // u to a free square within 5 ft of t (a Large one: the show's ogre fix)
      if (G.dist(u, t) <= 5) return;
      var near = null, cand = [];
      for (var y = t.y - 1; y <= t.y + (t.size || 1); y++) for (var x = t.x - 1; x <= t.x + (t.size || 1); x++) cand.push([x, y]);
      cand.some(function (q2) { if (free(u, q2[0], q2[1]) && G.dist(u, t, q2[0], q2[1]) <= 5) { near = q2; return true; } return false; });
      if (near) { u.x = near[0]; u.y = near[1]; G.setup(G.map, B.units); }
    }
    function* fire(gen) { var v; for (var k = 0; k < 20000; k++) { var r = gen.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) { v = y.prompt.opts[0].value; continue; } if (y && y.turn) { v = { do: 'end' }; continue; } v = yield y; } }
    // what a demonstration wrote: the log's entries that were not there before it (an attack's card carries an id and REPLACES its own earlier lines in the
    // log, so the log's length is no measure -- the feature gallery reads it the same way)
    function logSince(pre) { return (B.logEntries || []).filter(function (e) { return pre.indexOf(e) < 0; }).map(function (e) { return e.text; }).join(' | '); }
    function* act(u, gen, d20, sv) { B.active = u; pin.d20 = d20 == null ? null : d20; pin.save = sv == null ? null : sv; try { yield* fire(gen); } finally { pin.d20 = null; pin.save = null; } B.active = null; yield W(36); }
    function* turn(u) { B.active = u; RU.startTurn(u); yield* fire(D.ai.turn(B, u)); B.active = null; yield W(36); }
    function* swings(u, t) { // the Attack action: every swing the body has (Extra Attack from Denny's 5th), then the action spent
      RU.startTurn(u); var T = u.turn, n = u.attacksBase || 1;
      for (var i = 0; i < n && G.standing(t); i++) yield* act(u, B.attack(u, t, u.weapon));
      T.action = 0; T.attackAction = true;
    }
    function ctx() { return { B: B, L: S.L, dn: S.M.denny, bh: S.M.beholda, rs: S.M.rascal, gs: S.M.goose, gob: S.foes.filter(function (u) { return u.kind === 'goblin'; }), hob: S.foes.filter(function (u) { return u.kind === 'hobgoblin'; })[0], ogre: S.foes.filter(function (u) { return u.kind === 'ogre'; })[0], stage: stage, act: act, turn: turn, swings: swings, beside: beside, W: W }; }

    // ---- the column: the ability, its words at this level, the ring's rules line, BY LEVEL (a line a level), the trigger pinned; the keys in its foot
    function ringNote(u, bid) {
      if (!u || !bid) return '';
      try { RU.startTurn(u); var b = F.commands(B, u).filter(function (x) { return x.id === bid; })[0]; return b ? String(b.note || '').replace(/;\s*\d+ specials? left\s*$/, '') : ''; } catch (e) { return ''; }
    }
    function wrap(s, code) { return D.wrap(s, COL - 12).map(function (l) { return code ? '{' + code + '}' + l + '{/}' : l; }); }
    function ladder(e, c) {
      if (!e.nums) return [];
      var runs = [];
      for (var l = e.at; l <= 9; l++) { var s = e.nums(l, c); if (!s) continue; var last = runs[runs.length - 1]; if (last && last.s === s && last.b === l - 1) last.b = l; else runs.push({ a: l, b: l, s: s }); }
      var out = [];
      runs.forEach(function (r) {
        var now = S.L >= r.a && S.L <= r.b, tag = (r.a === r.b ? r.a : r.a + '-' + r.b) + ': ' + r.s;
        var ls = D.wrap(tag, COL - 22);
        ls.forEach(function (x, k) { out.push((k ? '    ' : now ? '{c}> ' : '  ') + (now ? '{c}' + x + '{/}' : x)); });
      });
      return out;
    }
    function header(e, c, ok) {
      var who = e.who ? NAME[e.who] + ', ' + ROLE[e.who] : 'the four', L = [];
      L = L.concat(wrap((S.i + 1) + '/' + S.ids.length + '  ' + e.name.toUpperCase(), 'y'));
      L = L.concat(wrap(who + ' · ' + (e.at > 1 ? 'from ' + nth(e.at) : 'from 1st') + ' · ' + KIND[e.kind], 'g'));
      L.push('');
      L = L.concat(wrap(ok ? e.words(S.L, c) : 'Not yet: it comes at ' + nth(e.at) + ' level (this is ' + nth(S.L) + '). Then: ' + e.words(e.at, c)));
      var rn = ok && e.button && e.who ? ringNote(c[SHORT[e.who]], e.button) : '';
      if (rn) { L.push(''); L = L.concat(wrap('THE RING: ' + rn, 'g')); }
      var lad = ladder(e, c);
      if (lad.length) { L.push(''); L.push('{c}BY LEVEL{/}'); L = L.concat(lad); }
      if (ok && e.pin) { L.push(''); L = L.concat(wrap('(' + e.pin + ')', 'g')); }
      S.panel.lines = L; S.panel.scroll = 0;
      B.clearCards();
    }
    function column(ctx) {
      var P = S.panel, H = D.H, top = 3, foot = 2 * LH + 5, inner = H - top - foot - 4, rows = Math.max(1, Math.floor(inner / LH)), n = P.lines.length, maxS = Math.max(0, n - rows);
      P.scroll = Math.max(0, Math.min(maxS, P.scroll)); P.rows = rows; P.maxS = maxS;
      ctx.save();
      ctx.fillStyle = 'rgba(10,8,16,.88)'; ctx.fillRect(0, 0, COL, H);
      ctx.strokeStyle = D.PAL.ramps.silver[3]; ctx.strokeRect(0.5, 0.5, COL - 1, H - 1);
      ctx.beginPath(); ctx.rect(0, top, COL, inner); ctx.clip();
      for (var k = 0; k < rows && P.scroll + k < n; k++) if (P.lines[P.scroll + k]) D.text(ctx, P.lines[P.scroll + k], 5, top + 2 + k * LH, D.PAL.ramps.bone[1]);
      ctx.restore();
      ctx.fillStyle = 'rgba(10,8,16,.96)'; ctx.fillRect(1, H - foot - 1, COL - 2, foot);
      ctx.strokeStyle = D.PAL.ramps.silver[3]; ctx.beginPath(); ctx.moveTo(1, H - foot - 0.5); ctx.lineTo(COL - 1, H - foot - 0.5); ctx.stroke();
      var last = S.once && S.i + 1 >= S.ids.length;
      D.text(ctx, (P.scroll > 0 ? '{y}^{/}' : ' ') + ' L/R next' + (S.levels ? ' · U/D level ' + S.L : '') + (P.scroll < maxS ? ' {y}v{/}' : ''), 4, H - foot + 1, D.PAL.ramps.bone[1]);
      D.text(ctx, S.once ? (last ? 'E again · R or X: on we go' : 'E again · X: skip the rest') : 'E/click: again · wheel: scroll', 4, H - foot + 1 + LH, D.PAL.ramps.bone[1]);
    }
    // the battle's own cards, in the stage's width (ui.js cards(), moved right of the column)
    function cardsRight(ctx, B) {
      var y = 15, X0 = COL + 4, Wd = D.W - COL - 8;
      (B.cards || []).forEach(function (c, i) {
        var lines = [], w = 0;
        c.lines.filter(function (l) { return l; }).forEach(function (l) { (D.textWidth(l) > Wd - 10 ? D.wrap(l, Wd - 10) : [l]).forEach(function (x) { lines.push(x); }); });
        lines.forEach(function (l) { w = Math.max(w, D.textWidth(l)); });
        w = Math.min(Wd, w + 10);
        var x = Math.round(X0 + (Wd - w) / 2), h = lines.length * LH + 5;
        var age = B.t - c.t0, fade = c.life - age < 30 ? (c.life - age) / 30 : 1;
        ctx.globalAlpha = (i === B.cards.length - 1 ? 1 : 0.6) * Math.max(0, fade);
        ctx.fillStyle = 'rgba(10,8,16,.86)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = D.PAL.ramps.silver[3]; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        lines.forEach(function (l, k) { D.text(ctx, l, x + 5, y + 3 + k * LH, D.PAL.ramps.bone[1]); });
        ctx.globalAlpha = 1;
        y += h + 2;
      });
    }

    // ---- the loop: show the entry at this level, then wait for a key -- the next, the level, or again; one pass and out when S.once
    function* loop() {
      for (;;) {
        var id = S.ids[S.i], e = BY_ID[id], c = ctx(), ok = S.L >= e.at, pre = (B.logEntries || []).slice(), key = id + '@' + S.L;
        B.clearCards();
        try {
          header(e, c, ok);
          if (ok) { yield W(20); yield* e.run(c); S.report[key] = { how: e.kind === 'sheet' ? 'shown' : 'fired', log: logSince(pre) }; }
          else { var w = e.who ? c[SHORT[e.who]] : c.dn; stage([[w, 0, 0]], w); yield W(20); S.report[key] = { how: 'not yet', log: '' }; }
        } catch (err) {
          S.report[key] = { how: 'error: ' + String(err && err.stack || err).slice(0, 400), log: logSince(pre) };
          if (window.console) console.error('mpgallery ' + id, err);
          B.card(['{r}' + e.name + ': something broke (' + String(err && err.message || err).slice(0, 90) + '){/}'], 1e9, 'gallery-why');
        }
        pin.d20 = null; pin.save = null;
        yield W(50);
        var v = S.auto ? 1 : yield { mpgallery: true };
        if (v === 'up' || v === 'down') {
          if (!S.levels || !S.rebuild) { D.sfx('error'); S.i = S.i; continue; }
          var L2 = Math.max(1, Math.min(9, S.L + (v === 'up' ? 1 : -1)));
          if (L2 === S.L) { D.sfx('error'); continue; }
          var old = WHO.map(function (k) { return S.M[k]; }).filter(Boolean); // (the old level's four off the floor first: stage() keeps whoever is not in the new pool -- 10-07, Griz: "up-downing levels doesn't despawn previous")
          B.units = B.units.filter(function (u) { return old.indexOf(u) < 0; }); G.setup(G.map, B.units);
          S.L = L2; S.M = S.rebuild(S.L); // (the same ability again, the four rebuilt at the new level)
          continue;
        }
        if (v === 'out') return; // (R: out of the walk, wherever it stands)
        if (S.auto) S.shown++;
        var next = S.i + (v == null ? 1 : v);
        if (S.once && next >= S.ids.length) return; // (the walk's last entry passed: back to the caller)
        if (S.once && next < 0) next = 0;
        S.i = ((next % S.ids.length) + S.ids.length) % S.ids.length;
      }
    }
    return { loop: loop, stage: stage, ctx: ctx };
  }

  // the stage's middle for a floor: the open square nearest the floor's middle with ground round it (the show's own finding, js/mpshow.js)
  function findHome(ref, w, h) {
    var cx = Math.floor(G.map.w / 2), cy = Math.floor(G.map.h / 2), best = null, hw = w || 6, hh = h || 3;
    G.setup(G.map, []);
    function open(x, y) { for (var dy = -hh; dy <= hh; dy++) for (var dx = -hw; dx <= hw + 4; dx++) if (!G.canStand(ref, x + dx, y + dy)) return false; return true; }
    for (var r = 0; r < 12 && !best; r++) for (var y = cy - r; y <= cy + r && !best; y++) for (var x = cx - r; x <= cx + r && !best; x++) if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) === r && open(x, y)) best = { x: x, y: y };
    return best || { x: cx, y: cy };
  }
  // the four at a level: built fresh (js/classes.js NPC.build on the named words)
  function buildFour(L) {
    var M = {};
    WHO.forEach(function (k) { var u = NPC.build(k + ':' + L, null, 'party', { id: 'g-' + k }); if (!u) throw new Error('the gallery could not build ' + k + ' at ' + L); u.x = -99; u.y = -99; u.gMax = u.maxhp; M[k] = u; });
    return M;
  }

  // ------------------------------------------------------------------ the door: ?mpgallery
  D.fxMascots = MG.make = function (q) {
    q = q || '';
    var get = function (k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : null; };
    var L0 = Math.max(1, Math.min(9, +(get('lvl') || 5)));
    var ids = MG.ids((get('who') || '').split(',').filter(Boolean), (get('only') || '').split(',').filter(Boolean));
    var B = D.npcFight('?npc=goblin,goblin,goblin,hobgoblin,ogre&vs=denny:' + L0 + ',beholda:' + L0 + ',rascal:' + L0 + ',goose:' + L0 + '&lvl=' + L0, {});
    var S = B.mpgallery = { i: Math.max(0, ids.indexOf(get('ability') || '')), ids: ids, L: L0, auto: /[?&]auto\b/.test(q), fast: /[?&]fast\b/.test(q), levels: true, once: false, M: null, foes: null, home: null, rebuild: buildFour };
    var R = install(B, S), enter0 = B.enter;
    B.enter = function () {
      enter0.apply(this, arguments);
      S.foes = B.units.filter(function (u) { return u.side === 'foe'; }).map(normie);
      S.M = buildFour(S.L); // (the fight's own four dropped: the gallery's are rebuilt on every level change)
      S.home = findHome(S.M.denny);
      B.units = []; G.setup(G.map, B.units);
      B.req = null;
      B.co = R.loop();
    };
    return B;
  };

  // ------------------------------------------------------------------ the walk inside another fight: the Game Show's tutorial (js/gameshow.js)
  //   yield* D.mpgallery.walk(B, { who: ['denny'], L: 1, home: [x, y], fast })
  // B's own Mascots (u.mpmon) are the walk's; five normie dummies are made for it and taken off the board after; B's other people stand where they
  // were, out of the stage's way. One pass through the entries, left/right, E again, R out; the column and the camera shift while it runs, then the
  // four stand where they stood
  MG.walk = function* (B, o) {
    o = o || {};
    var ids = MG.ids(o.who || ['denny'], o.only), M = {};
    WHO.forEach(function (k) { var u = B.units.filter(function (w) { return w.mpmon === k; })[0]; if (u) { u.gMax = u.gMax || u.maxhp; M[k] = u; } });
    if (!M.denny && !M.beholda && !M.rascal && !M.goose) return;
    var one = M.denny || M.beholda || M.rascal || M.goose, Lw = o.L || one.lvl || 1;
    if (o.upto !== false) ids = ids.filter(function (id) { return BY_ID[id].at <= Lw; }); // (the kit as it stands at this level: what is not yet come waits for its level)
    if (!ids.length) return;
    var was = B.units.map(function (u) { return { u: u, x: u.x, y: u.y, f: u.facing, hp: u.hp }; }), cam = { x: D.iso.cam.x, y: D.iso.cam.y, z: D.iso.zoom }, req0 = B.req;
    var foes = ['goblin', 'goblin', 'goblin', 'hobgoblin', 'ogre'].map(function (k, i) { var w = B.makeFoe({ id: 'tut' + i + '-' + k, kind: k }); w.x = -99; w.y = -99; return normie(w); });
    var S = { i: 0, ids: ids, L: Lw, auto: !!o.auto, fast: !!o.fast, levels: false, once: true, M: M, foes: foes, home: o.home ? { x: o.home[0], y: o.home[1] } : findHome(one, 4, 2), rebuild: null };
    var R = install(B, S), sv = B.mpgallery; B.mpgallery = S;
    try { yield* R.loop(); }
    finally {
      S.teardown(); B.mpgallery = sv; B.req = req0;
      B.units = was.map(function (h) { var u = h.u; u.x = h.x; u.y = h.y; u.facing = h.f; u.conds = {}; u.hp = u.maxhp = u.gMax || u.maxhp; u.temp = 0; u.dead = false; u.ko = false; u.anim = 'idle'; u.animT = B.t; delete u.tween; delete u.holding; if (u.mpmon) MP.refill(u); return u; });
      G.setup(G.map, B.units); B.clearCards(); B.active = null; B.order = [];
      D.iso.cam.x = cam.x; D.iso.cam.y = cam.y; D.iso.zoom = cam.z;
    }
    return S.report;
  };

  // the gallery waits between demonstrations on its own request; a prompt an ability asks goes as ever (js/gallery.js wraps the same way for the spells').
  // The wheel over the column scrolls it, a click on it too (its top half up, its bottom half down); a click on the floor is "again"
  var input0 = D.ui.input;
  D.ui.input = function (B, req) {
    if (!req.mpgallery) return input0(B, req);
    var S = B.mpgallery, m = I.mouse, over = !!(m.inside && m.x < COL); // (the column's own wheel and clicks were spent in the update above)
    if (!over) D.ui.camera(B);
    var v = I.repeat('right') ? 1 : I.repeat('left') ? -1 : I.repeat('up') ? 'up' : I.repeat('down') ? 'down' : I.pressed('a') ? 0 : I.pressed('b') ? 'out' : null; // (B is X or Esc on the keys: out of a walk)
    if (m.click && !over && v == null) v = 0;
    if (v === 'out' && !(S && S.once)) v = null;
    if (v != null) { D.sfx(v === 0 ? 'confirm' : 'cursor'); B.answer(v); }
  };
})();
