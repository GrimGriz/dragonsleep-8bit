/* DRAGONSLEEP — the dwarven expansion: behind the fountains (handoff-2026-09-26 spec).
   Papa's hook, the drained stair, the Burial and its law, the night crew, the Cleric, Solskaft.
   Every line is looked up from content/text.json ('deep.*'), which cites its source per record. */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, W8 = DS.W8, EV = DS.EV, S = DS.SCRIPTS, I = DS.input;
  var L = DS.L;
  function G() { return DS.G; }
  function F() { return DS.field; }
  function who(n) { return { who: n }; }
  function spawn(def) { var n = new DS.Npc(Object.assign({ face: false, solid: false }, def), F().map); F().npcs.push(n); return n; }
  function arrived(list) { // an npc no longer on the field (the map changed under it) counts as arrived
    return W8.until(function () { var on = F() ? F().npcs : []; return list.every(function (n) { return on.indexOf(n) < 0 || (!n.moving && !n.path.length && !(n.pause > 0)); }); });
  }
  function faceTo(n, x, y) { n.dir = Math.abs(x - n.x) > Math.abs(y - n.y) ? (x < n.x ? 'left' : 'right') : (y < n.y ? 'up' : 'down'); }
  function playerFace(x, y) { var g = G(); g.dir = Math.abs(x - g.x) > Math.abs(y - g.y) ? (x < g.x ? 'left' : 'right') : (y < g.y ? 'up' : 'down'); }

  // ================================================================== checks, on screen (spec §11)
  // The skill and the DC, whose hand it is, the die tumbling and landing, the total. Failure always says something.
  function CheckScene(o) { this.kind = 'check'; this.o = o; this.t = 0; this.face = DS.d(20); }
  DS.CheckScene = CheckScene;
  CheckScene.prototype.update = function () {
    var o = this.o;
    this.t++;
    if (this.t < 40) { if (this.t % 3 === 0) { this.face = DS.d(20); DS.audio.sfx('cursor'); } return; }
    if (this.t === 40) { this.face = o.nat; DS.audio.sfx(o.ok ? 'confirm' : 'error'); }
    if (this.t > 56 && (I.pressed('a') || I.pressed('b') || this.t > 170)) DS.pop(this);
  };
  CheckScene.prototype.draw = function (ctx) {
    var o = this.o, landed = this.t >= 40, x = 48, y = 58, w = 160, h = 92;
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1;
    DS.win(ctx, x, y, w, h, '#161440');
    DS.textCenter(ctx, o.skill.toUpperCase() + '   DC ' + o.dc, 128, y + 8, '#F8D878');
    DS.textCenter(ctx, o.name + (o.adv ? '  (two dice, the higher)' : ''), 128, y + 20, '#C8D0E8');
    // the die: a d20 drawn as a gem, spinning till it lands
    var cx = 104, cy = y + 50, r = 15, spin = landed ? 0 : this.t * 0.5;
    ctx.fillStyle = landed ? (o.ok ? '#2a6a3a' : '#6a2a2a') : '#3a3a6a';
    ctx.beginPath();
    for (var k = 0; k < 6; k++) { var a = spin + k * Math.PI / 3 + Math.PI / 6, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8e8f4'; ctx.lineWidth = 1; ctx.stroke();
    DS.textCenter(ctx, String(this.face), cx, cy - 3, '#F8F8F8');
    if (landed) {
      DS.text(ctx, (o.mod >= 0 ? '+ ' : '- ') + Math.abs(o.mod), 128, cy - 9, '#C8D0E8');
      DS.text(ctx, '= ' + o.total, 128, cy + 3, '#F8F8F8');
      if (this.t > 48) DS.textCenter(ctx, o.ok ? 'SUCCESS' : 'NOT ENOUGH', 128, y + h - 14, o.ok ? '#58F898' : '#F87858');
    }
    if (o.note) DS.textCenter(ctx, o.note, 128, y + 67, '#B8F8D8'); // (a familiar lending a hand: js/familiar.js perks)
  };
  // roll it for the best hand in the party (or the one named), show it, return whether it held
  EV.check = function* (skill, ab, dc, o) {
    o = o || {};
    var g = G(), hands = o.hero ? [o.hero] : g.party.filter(function (h) { return !h.ko; });
    // the snake's caster has advantage on a Persuasion check (RULED 09-30; js/familiar.js DS.famPerk): worth about +3 to the hand that is best
    function snaked(x) { return skill === 'Persuasion' && !!x && !!DS.famPerk && DS.famPerk(x.id, 'persuasion') === 'adv'; }
    var sorted = hands.slice().sort(function (a, b) { return (R.skill(b, skill, ab) + (snaked(b) ? 3 : 0)) - (R.skill(a, skill, ab) + (snaked(a) ? 3 : 0)); });
    // a group check (all of you creeping up together) rides on the middle of the party, not its best
    var h = (o.group ? sorted[Math.floor((sorted.length - 1) / 2) + (sorted.length > 2 ? 1 : 0)] : sorted[0]) || g.main();
    var adv = !!o.adv || snaked(h), form = snaked(h) && R.FAMILIARS[g.flags.familiar.kind];
    var mod = R.skill(h, skill, ab), r1 = DS.d(20), r2 = DS.d(20), nat = adv ? Math.max(r1, r2) : r1, total = nat + mod, ok = total >= dc;
    yield W8.scene(new CheckScene({ skill: skill, dc: dc, name: o.group ? 'The party, at ' + h.name + "'s pace" : h.name, mod: mod, nat: nat, total: total, ok: ok, adv: adv, note: form ? L('fam.persuade', { name: h.name, form: form.name.replace(/^poisonous /, '') }) : null }));
    return ok;
  };

  // ================================================================== the hook (spec §3 beat 1): Papa comes out of his door
  S['enter:silverton'] = function* () {
    var g = G();
    if (!g.flags.lakeDone || g.flags.stairHook) return;
    yield* EV.papaHook();
  };
  EV.papaHook = function* () {
    var g = G(), f = F(), m = f.map, papa = EV.npc('papa');
    g.flags.stairHook = 1; g.flags.pin = 'onelaw';
    if (papa && Math.abs(papa.x - g.x) + Math.abs(papa.y - g.y) > 1) {
      // he walks in from off the edge of the screen: the man who stands in a door has left it
      var spots = [[g.x, g.y - 1], [g.x + 1, g.y], [g.x - 1, g.y], [g.x, g.y + 1]].filter(function (p) { return f.free(p[0], p[1], papa); });
      var to = spots[0], best = null;
      if (to) {
        for (var r = 9; r >= 5 && !best; r--) for (var dx = -r; dx <= r && !best; dx++) {
          [r - Math.abs(dx), -(r - Math.abs(dx))].forEach(function (dy) {
            if (best) return;
            var sx = g.x + dx, sy = g.y + dy;
            if (!f.free(sx, sy, papa)) return;
            var path = DS.pathTo(m, sx, sy, to[0], to[1]);
            if (path.length && path.length <= 14) best = { x: sx, y: sy, path: path };
          });
        }
      }
      if (best) {
        papa.x = best.x; papa.y = best.y; papa.px = best.x * 16; papa.py = best.y * 16;
        yield EV.npcWalk(papa, best.path, 1);
      }
    }
    if (papa) { faceTo(papa, g.x, g.y); playerFace(papa.x, papa.y); }
    yield DS.say(L('deep.papaCome'));
    yield DS.say(L('deep.papaHook'), who('Papa Urtusk'));
    if (g.hero('lymen')) yield DS.say(L('deep.papaLymen'));
    yield DS.say(L('deep.papaGo'), who('Papa Urtusk'));
    g.flags['heard:r-stairdry'] = 1;
    if (papa) papa.path = DS.pathTo(m, papa.x, papa.y, papa.hx, papa.hy).concat(['face:down']);
  };
  var basePapa = S.papa;
  S.papa = function* (npc, D) {
    var g = G(), P = who('Papa Urtusk');
    if (!g.flags.stairHook) { yield* basePapa(npc, D); return; }
    if (g.flags.crewDealt) { yield DS.say(L(g.flags.frontDoor ? 'deep.papaDoor' : 'deep.papaDone'), P); return; }
    if (g.flags.crewCut) { yield DS.say(L('deep.papaCut'), P); return; }
    yield DS.say(L(g.flags.crewLeft ? 'deep.papaSharper' : 'deep.papaAgain'), P);
  };

  // ================================================================== the drained stair (spec §5.3)
  S.dryStair = function* () {
    var g = G();
    g.flags.drySeen = 1;
    yield DS.say(L('deep.drySee'));
    if (!g.flags.fiveRecovered) { // the five's tokens, where the water left them
      g.flags.fiveRecovered = 1; g.give('fivetokens', 1); DS.audio.sfx('chest');
      yield DS.say([L('deep.dryFive'), L('g.got', { item: DS.DATA.items.fivetokens.name })]);
      if ((g.kills.crawler || 0) >= 6) g.flags.stockDead = 1;
    }
    yield DS.say(L(g.flags.keeperDone ? 'deep.puddleStill' : 'deep.puddle'));
    yield DS.say(L('deep.doorCut'));
  };

  // ================================================================== the Burial: the law made mechanic (spec §5.4)
  var FAM = [
    { id: 'geirmund', name: 'GEIRMUND' }, { id: 'audun', name: 'AUDUN', title: 'door-warden' }, { id: 'orri', name: 'ORRI' },
    { id: 'hallveig', name: 'HALLVEIG', her: true }, { id: 'kolbein', name: 'KOLBEIN' }, { id: 'asmund', name: 'ASMUND' }, { id: 'brandr', name: 'BRANDR' }
  ];
  var NAMES = ['ARI', 'BERA', 'DAGR', 'EIR', 'FINN', 'GUNNA', 'HALLR', 'INGI', 'JORA', 'KARI', 'LIV', 'MANI', 'NANNA', 'ODD', 'SIF', 'TOKI', 'UNA', 'VALI', 'YRSA', 'BJORN',
    'ESJA', 'GEIR', 'HILD', 'SVALA', 'THORA', 'ASA', 'BRYNJA', 'FRODE', 'GRIMA', 'HALLA', 'IVAR', 'LJOT', 'ROLF', 'SAGA', 'TOVE', 'VIGGA', 'OTTAR', 'RUNA', 'STEIN', 'DIS'];
  var LAMPS = ['the First Lamp', 'the Second Lamp', 'the Third Lamp'];
  var SEASON = [[1, 4], [5, 14], [15, 26], [27, 33]]; // base ring (patrons, the oldest) out to the top tier (the newest dead): [tier 3 .. tier 0] reversed below
  function stone(key, info) { // the stone reads: a name, a season-mark, and for the highway's dead the lamp they fell at
    var wi = info[0], ti = info[1], fam = FAM[wi], rng = DS.mulberry32(DS.hash('niche:' + key));
    var s = SEASON[3 - ti], season = s[0] + Math.floor(rng() * (s[1] - s[0] + 1));
    if (info[2] === 'gear' && fam.id === 'audun') return 'AUDUN, door-warden, of the Silversands. Season 21. Fell at the Third Lamp.';
    if (info[2] === 'gear' && fam.id === 'asmund') return 'ASMUND, of the Silversands. Season 3. Fell at the Second Lamp.';
    var nm = ti === 3 ? fam.name : NAMES[Math.floor(rng() * NAMES.length)];
    var line = ti === 3 ? nm + ', of the Silversands, first of ' + (fam.her ? 'her' : 'his') + ' line.' : nm + ', ' + (ti === 2 ? (rng() < 0.5 ? 'son of ' : 'daughter of ') + fam.name : 'of ' + fam.name + "'s line") + '.';
    line += ' Season ' + season + '.';
    if (rng() < (ti === 3 ? 0.3 : 0.45)) line += ' Fell at ' + LAMPS[Math.floor(rng() * 3)] + '.';
    return line;
  }
  function unlawful() { var g = G(); return g.flags.unlawful || (g.flags.unlawful = []); }
  function takeFromTheDead(id) { // no warrant: blasphemy (spec §5.4)
    var g = G();
    g.flags.blasphemy = (g.flags.blasphemy || 0) + 1; unlawful().push(id);
    g.give(id, 1); DS.audio.sfx('chest');
  }
  S.niche = function* () {
    var g = G(), f = F(), p = f.facing(), key = p[0] + ',' + p[1], info = (f.map.src.niches || {})[key];
    if (!info) return;
    var fam = FAM[info[0]], kind = info[2], line = stone(key, info);
    if (kind === 'pried') { // the night crew's work: the Geirmund wedge, the last of that line
      if (g.has('crewsack')) {
        var a = yield DS.ask([L('deep.priedNiche'), L('deep.sackAsk')], ['PUT IT BACK', 'NOT NOW']);
        if (a !== 0) return;
        g.take('crewsack', 1); g.flags.sackReturned = 1; g.flags.favor = (g.flags.favor || 0) + 1; DS.audio.sfx('confirm');
        yield DS.say(L('deep.sackBack'));
        return;
      }
      yield DS.say(g.flags.sackReturned ? [L('deep.geirmundNames'), L('deep.sackRests')] : [L('deep.priedNiche')]);
      return;
    }
    if (kind === 'gear' && fam.id === 'audun') { // the Door-Shield: released by Ingrith's warrant, or taken without one
      if (g.flags.shieldTaken) { yield DS.say([line, L('deep.shieldGone')]); return; }
      if (g.flags.warrantShield) {
        g.flags.shieldTaken = 1; g.give('doorshield', 1); DS.audio.sfx('chest');
        yield DS.say([line, L('deep.shieldWarrant'), L('g.got', { item: DS.DATA.items.doorshield.name })]);
        yield* offerShield();
        return;
      }
      var b = yield DS.ask([line, L('deep.shieldSeen')], ['LEAVE IT', 'TAKE IT']);
      if (b !== 1) return;
      takeFromTheDead('doorshield'); g.flags.shieldTaken = 1;
      yield DS.say([L('deep.tookIt'), L('g.got', { item: DS.DATA.items.doorshield.name })]);
      return;
    }
    if (kind === 'gear' && fam.id === 'asmund') { // the heir's wedge: a family that isn't dead yet (sidequest 9, M5)
      if (g.flags.asmundTaken) { yield DS.say([line, L('deep.asmundBare')]); return; }
      var c = yield DS.ask([line, L('deep.asmundGear')], ['LEAVE IT', 'TAKE IT']);
      if (c !== 1) return;
      takeFromTheDead('asmundhammer'); g.flags.asmundTaken = 1;
      yield DS.say([L('deep.tookIt'), L('g.got', { item: DS.DATA.items.asmundhammer.name })]);
      return;
    }
    yield DS.say([line, L('deep.nicheDead')]);
  };
  function* offerShield() { // Lymen's, if he's here to carry it (one item for each of the four: spec §8)
    var g = G(), h = g.hero('lymen') || g.party.filter(function (x) { return R.canEquip(x, DS.DATA.items.doorshield) && !R.twoHanded(x, R.weaponOf(x)); })[0];
    if (!h) return;
    var w = R.weaponOf(h);
    if ((w.weapon.props || []).indexOf('two-handed') >= 0) return;
    var eq = yield DS.ask(L('winters.equipAsk', { name: h.name }), ['YES', 'NO']);
    if (eq !== 0) return;
    if (h.equip.shield) g.give(h.equip.shield, 1);
    g.take('doorshield', 1); h.equip.shield = 'doorshield'; DS.audio.sfx('confirm');
  }
  S.bier = function* () { yield DS.say(L('deep.bier')); };
  S.dwarfStair = function* () { yield DS.say(L('deep.dwarfStairShut')); };

  // ================================================================== the night crew (spec §5.3): the catch is the scene's start
  function crewNpcs() { return F().npcs.filter(function (n) { return ['hask', 'wheelwright', 'crewA', 'crewB'].indexOf(n.id) >= 0; }); }
  function* crewGo(withSack) { // up the Warrens stair, along the hallway, out the cut door, and gone
    var f = F(), list = crewNpcs();
    list.forEach(function (n, k) { n.pathSpeed = 1; n.path = ['wait' + (k * 10)].concat(DS.pathTo(f.map, n.x, n.y, 2, 5), ['left', 'hide']); n.solid = false; });
    yield arrived(list);
    f.npcs = f.npcs.filter(function (n) { return list.indexOf(n) < 0; });
  }
  var CREW_AT = [12, 9], HALL_BACK = [9, 5]; // the head of the Warrens stair on the top tier; the hallway, back toward the cut door
  function* crewBackOff() { var g = G(); yield F().walk(DS.pathTo(F().map, g.x, g.y, HALL_BACK[0], HALL_BACK[1])); }
  S.crew = function* () {
    var g = G(), back = !!g.flags.crewBack, viv = g.hero('vivian');
    if (viv && viv.ko) viv = null;
    // the catch springs in the hallway at the stair head: down the stair onto the top tier, and there they are (re-cut §5)
    if (g.x !== CREW_AT[0] || g.y !== CREW_AT[1]) { yield F().walk(DS.pathTo(F().map, g.x, g.y, CREW_AT[0], CREW_AT[1])); }
    g.dir = 'left';
    crewNpcs().forEach(function (n) { faceTo(n, g.x, g.y); });
    if (!g.flags.crewMet) { g.flags.crewMet = 1; yield DS.say(L('deep.crewCatch')); }
    else yield DS.say(L(back ? 'deep.crewBack' : 'deep.crewAgain'));
    yield DS.say(L(back ? 'deep.haskBack' : 'deep.haskSees'), who('Hask'));
    while (true) {
      var opts = [['CHALLENGE THEM', 'fight']];
      if (viv && !g.flags.vivTried) opts.push(['VIVIAN KNOWS THEM', 'viv']);
      if (!back && !g.flags.cutTried) opts.push(['TAKE A CUT', 'cut']);
      opts.push(['LEAVE', 'leave']);
      var a = yield DS.ask(L('deep.crewAsk'), opts.map(function (o) { return o[0]; }));
      var pick = (opts[a] || opts[opts.length - 1])[1];
      if (pick === 'leave') {
        g.flags.crewLeft = 1;
        yield DS.say(L('deep.crewLeave'));
        yield* crewBackOff();
        return;
      }
      if (pick === 'viv') { // the candle-girl carries the crews' maps; they know her face (CANON)
        g.flags.vivTried = 1;
        yield DS.say(L('deep.vivSteps'), who('Vivian'));
        if (yield* EV.check('Persuasion', 'cha', 13, { hero: viv })) {
          yield DS.say(L('deep.vivWins'));
          g.flags.crewDealt = 1; g.flags.crewOwed = 1; delete g.flags.crewBack;
          yield* crewGo(false);
          g.give('crewsack', 1); DS.audio.sfx('chest');
          yield DS.say([L('deep.sackDropped'), L('g.got', { item: DS.DATA.items.crewsack.name })]);
          yield* EV.ingrithArrives();
          return;
        }
        yield DS.say(L('deep.vivFails'), who('Hask'));
        pick = 'fight';
      }
      if (pick === 'cut') {
        g.flags.cutTried = 1;
        yield DS.say(L('deep.cutName'));
        if (yield* EV.check('Intimidation', 'cha', 15)) {
          g.silver += 200; DS.audio.sfx('coin');
          yield DS.say([L('deep.cutTaken'), L('g.foundSilver', { n: 200 })], who('Hask'));
          g.flags.crewCut = 1; g.flags.cutRests = 0;
          g.renown = Math.max(0, g.renown - 1); DS.audio.sfx('error');
          yield DS.say(L('deep.renownDown'));
          yield* crewGo(true);
          yield* EV.ingrithArrives();
          return;
        }
        yield DS.say(L('deep.cutFails'), who('Hask'));
        continue;
      }
      if (pick === 'fight') {
        DS.G.flags.wheelwrightRan = 0;
        // fought in DEEP16 (deep16/data/fights.js crew): the wheelwright bolts when Hask falls, and carries wheelwrightRan out (js/embed.js)
        var res = yield* EV.fight(['hask', 'wheelwright', 'crewman', 'crewman'], { bg: 'dwarf', music: 'boss', canRun: true, introText: L('deep.crewFight'), deep16: 'crew' });
        if (res === 'win') {
          g.flags.crewDealt = 1; if (back) g.flags.noEscort = 1; delete g.flags.crewBack;
          F().refreshNpcs();
          g.give('crewsack', 1); DS.audio.sfx('chest');
          yield DS.say([L(g.flags.wheelwrightRan ? 'deep.crewDownRan' : 'deep.crewDown'), L('g.got', { item: DS.DATA.items.crewsack.name })]);
          yield* EV.ingrithArrives();
        } else if (res === 'run') { g.flags.crewLeft = 1; yield* crewBackOff(); }
        return;
      }
    }
  };
  // the second chance: they come back for the rest, greedy, three nights after a cut (spec §5.3)
  var baseLongRest = EV.longRest;
  EV.longRest = function () {
    baseLongRest();
    var g = G();
    if (g.flags.crewCut && !g.flags.crewDealt && !g.flags.crewBack) { g.flags.cutRests = (g.flags.cutRests || 0) + 1; if (g.flags.cutRests >= 3) g.flags.crewBack = 1; }
  };

  // ================================================================== the Cleric (spec §3 beat 3; §4.4): the ledger felt the seal go
  var DWARF_STAIR = [41, 5]; // the Burial's hallway, at the foot of the dwarves' own stair
  EV.ingrithArrives = function* () {
    var g = G(), f = F(), I2 = who('Ingrith Scalebeam'), m = f.map;
    // along the hallway from the dwarves' stair, down the Warrens stair, to stand beside you (re-cut §5: the Burial's hallway)
    var ing = spawn({ id: 'ingrithB', x: DWARF_STAIR[0], y: DWARF_STAIR[1], look: 'ingrith', dir: 'left', lantern: true });
    var t1 = spawn({ id: 'escortB1', x: DWARF_STAIR[0] - 1, y: DWARF_STAIR[1] + 1, look: 'dtrooper', dir: 'left' });
    var t2 = spawn({ id: 'escortB2', x: DWARF_STAIR[0] - 2, y: DWARF_STAIR[1], look: 'dtrooper2', dir: 'left' });
    yield DS.say(L('deep.ingrithLamp'));
    var spots = [[g.x + 1, g.y], [g.x + 2, g.y], [g.x + 1, g.y + 1], [g.x, g.y - 1], [g.x + 2, g.y + 1]].filter(function (p) { return f.free(p[0], p[1]); });
    [ing, t1, t2].forEach(function (n, k) { var s = spots[k] || spots[0]; n.pathSpeed = 2; n.path = ['wait' + (k * 8)].concat(DS.pathTo(m, n.x, n.y, s[0], s[1])); });
    yield arrived([ing, t1, t2]);
    faceTo(ing, g.x, g.y);
    playerFace(ing.x, ing.y);
    yield DS.say(L('deep.ingrithCome'));
    yield DS.say(L(g.flags.crewCut ? 'deep.ingrithLedger2' : 'deep.ingrithLedger'), I2);
    // anything taken off the dead without a warrant goes back first, and the ledger writes it down
    var bad = unlawful().filter(function (id) { return g.has(id); });
    if (bad.length) {
      bad.forEach(function (id) { unequip(id); g.take(id, 1); });
      g.flags.unlawful = []; g.flags.blasphemy = 0; restoreTaken(bad);
      g.renown = Math.max(0, g.renown - bad.length); DS.audio.sfx('error');
      yield DS.say(L('deep.ingrithTakesBack', { n: bad.length }), I2);
      yield DS.say(L('deep.renownDown'));
    }
    if (g.flags.crewCut && !g.flags.crewDealt) { // the offer withheld
      yield DS.say(L('deep.ingrithWithheld'), I2);
      yield* ingrithGoes([ing, t1, t2]);
      return;
    }
    yield DS.say(L('deep.ingrithStopped'), I2);
    yield DS.say(L('deep.ingrithName'), I2);
    yield DS.say(L('deep.ingrithTrade'), I2);
    // beat 1, minus the mission (re-cut F8/F10): the front door is the ledger's leave for these four, and nothing else
    yield DS.say(L('deep.ingrithDoor'), I2);
    g.flags.clericMet = 1; g.flags.frontDoor = 1; g.flags.hookDone = 1; g.flags.pin = 'theking';
    yield DS.say(L('deep.ingrithWarrant'), I2);
    g.flags.warrantShield = 1;
    if (g.has('crewsack')) yield DS.say(L('deep.ingrithSack'), I2);
    yield DS.say(L('deep.ingrithBars'));
    DS.audio.sfx('door');
    DS.applyFlagTiles(f.map);
    yield DS.say(L('deep.ingrithStair'), I2);
    yield* ingrithGoes([ing, t1, t2]);
  };
  function* ingrithGoes(list) { // back up the stair and along the hallway to their own stair; the player is free to move while they go
    var m = F().map;
    list.forEach(function (n, k) { n.pathSpeed = 2; n.path = ['wait' + (6 + k * 6)].concat(DS.pathTo(m, n.x, n.y, DWARF_STAIR[0], DWARF_STAIR[1]), ['hide']); });
    yield W8.frames(20);
  }
  function unequip(id) { G().party.forEach(function (h) { ['weapon', 'armor', 'shield', 'ring'].forEach(function (s) { if (h.equip[s] === id) { h.equip[s] = null; G().give(id, 1); } }); }); }
  function restoreTaken(ids) { // back on the bones: the niche shows it again
    var g = G();
    if (ids.indexOf('doorshield') >= 0) delete g.flags.shieldTaken;
    if (ids.indexOf('asmundhammer') >= 0) delete g.flags.asmundTaken;
  }

  // ================================================================== Solskaft (spec §4)
  S['enter:solskaft'] = function* () {
    var g = G();
    if (!g.flags.pyroMet && g.flags.frontDoor && g.y >= 44) yield* S.pyroMeet();
    if (g.flags.captainHome && !g.flags.halldorUp && EV.sidequestsDone() >= 2) { g.flags.halldorUp = 1; F().refreshNpcs(); } // beat 5: on his feet
  };
  // beat 2 (re-cut §2): Pyro, sympathetic. He ran with Winters and Tarlyn in the Orc War and likes adventurers; he sees his
  // own youth in them. He reads THEM (a party check, low DC, flavour), and the road is his to show
  S.pyroMeet = function* () {
    var g = G(), p = EV.npc('pyro'), P = who('Pyronimus');
    g.flags.pyroMet = 1;
    if (p) { faceTo(p, g.x, g.y); }
    yield DS.say(L('deep.pyroSees'));
    yield DS.say(L('deep.pyroFirst'), P);
    var a = yield DS.ask(L('deep.pyroReads'), ['LOOK HIM IN THE EYE', 'TAKE HIS HAND'], P);
    var ok;
    if (a === 0) ok = yield* EV.check('Persuasion', 'cha', 10); else ok = yield* EV.check('Athletics', 'str', 10);
    yield DS.say(L(a === 0 ? (ok ? 'deep.pyroEyeYes' : 'deep.pyroEyeNo') : (ok ? 'deep.pyroGripYes' : 'deep.pyroGripNo')), P);
    yield DS.say(L('deep.pyroRoad'), P);
    yield* pyroOffer();
  };
  function* pyroOffer() { // he walks the road with them when they say so; he never marches them out of the hall
    var g = G(), P = who('Pyronimus');
    var a = yield DS.ask(L('deep.pyroAsk'), ['WALK THE ROAD WITH HIM', 'NOT YET'], P);
    if (a !== 0) { g.flags.pin = 'theking'; yield DS.say(L('deep.pyroWait'), P); return; }
    yield DS.say(L('deep.pyroKetil'), P);
    yield DS.say(L('deep.pyroKetilAns'), who('Ketil Silversands'));
    EV.addGuest('pyro'); g.flags.pyroLeads = 1; g.flags.pin = 'kingsroad'; DS.audio.sfx('levelup');
    yield DS.say(L('deep.pyroJoins'));
    var me = EV.npc('pyro'); if (me) me.hidden = true;
  }
  S.pyro = function* (npc) {
    var g = G(), P = who('Pyronimus');
    if (!g.flags.pyroMet) { yield* S.pyroMeet(); return; }
    if (!g.flags.pyroLeads) { yield DS.say(L('deep.pyroAgain'), P); yield* pyroOffer(); return; }
    if (g.flags.highwaySecured && !g.flags.pyroConsent) { g.flags.pyroConsent = 1; g.flags.pin = 'thedoor'; yield DS.say(L('deep.pyroSecured'), P); return; } // the king's word
    if (g.flags.wordBelow && !g.flags.mustered) { yield DS.say(L('deep.pyroToGate'), P); return; }
    if (g.flags.petition && !g.flags.nestCrushed) { yield DS.say(L('deep.pyroNest'), P); return; }
    var k = 'pyroIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    var lines = ['deep.pyro1', 'deep.pyro2', 'deep.pyro3'];
    if (g.flags.shieldTaken && !unlawful().length && g.flags.warrantShield) lines.push('deep.pyroShield');
    if (g.flags.axeGiven) lines.push('deep.pyroAxeGiven'); if (g.flags.axeKept) lines.push('deep.pyroAxeKept');
    if (g.flags.wwLift) lines.push('deep.pyroWwLift'); if (g.flags.wwLedger) lines.push('deep.pyroWwLedger');
    if (lines.length > 3) { yield DS.say(L(lines[3 + (i % (lines.length - 3))]), P); return; } // the newest things first
    yield DS.say(L(lines[i % lines.length]), P);
  };
  S.ketilStop = function* () { // the door-second: "empty your packs" (spec §5.4). No fight; the law's weight is the point
    var g = G(), K = who('Ketil Silversands'), k = EV.npc('ketil');
    var bad = unlawful().filter(function (id) { return g.has(id); });
    if (!bad.length) { g.flags.blasphemy = 0; g.flags.unlawful = []; return; }
    if (k) faceTo(k, g.x, g.y);
    yield DS.say(L('deep.ketilStop'), K);
    bad.forEach(function (id) { unequip(id); g.take(id, 1); });
    g.flags.unlawful = []; g.flags.blasphemy = 0; restoreTaken(bad);
    g.renown = Math.max(0, g.renown - bad.length); DS.audio.sfx('error');
    yield DS.say([L('deep.ketilTakes', { n: bad.length }), L('deep.renownDown')]);
    yield F().walk(['up']);
  };
  S.ingrith = function* () {
    var g = G(), I2 = who('Ingrith Scalebeam');
    if (g.flags.pyroConsent && !g.flags.ingrithEscort) { // beat 9: she goes down, and you walk her
      yield DS.say(L('deep.ingrithConsult'), I2);
      var a = yield DS.ask(L('deep.ingrithWaits'), ['WALK HER DOWN', 'NOT YET'], I2);
      if (a !== 0) return;
      EV.addGuest('ingrith'); g.flags.ingrithEscort = 1; DS.audio.sfx('levelup');
      yield DS.say(L('deep.ingrithJoins'));
      var me = EV.npc('ingrith'); if (me) me.hidden = true;
      return;
    }
    // the things she has to say come before the reminders, and a reminder is said once, so no errand blocks another
    if (g.has('recordpage')) { g.take('recordpage', 1); g.flags.countDone = 1; DS.audio.sfx('confirm'); yield DS.say(L('deep.ingrithPage'), I2); return; }
    if (g.flags.heirFound && !g.flags.heirReady) { g.flags.heirReady = 1; yield DS.say(L('deep.ingrithHeir'), I2); return; }
    if (g.flags.idonyAsked && !g.flags.idonyAnswer) { g.flags.idonyAnswer = 1; yield DS.say(L('deep.ingrithAnswer'), I2); return; }
    // sidequest 1 (the assay weights) is RETIRED (Griz 09-26d: "retire it"); the count is the ledger's ask once Pyro trusts you
    if (g.flags.pyroTrusts && !g.flags.countAsked) { g.flags.countAsked = 1; yield DS.say(L('deep.ingrithCount'), I2); return; }
    if (g.flags.warrantShield && !g.flags.shieldTaken && !g.flags.shieldHinted) { g.flags.shieldHinted = 1; yield DS.say(L('deep.ingrithShieldHint'), I2); return; }
    if (g.has('crewsack') && !g.flags.sackHinted) { g.flags.sackHinted = 1; yield DS.say(L('deep.ingrithSack'), I2); return; }
    if (!g.flags.pyroTrusts) { yield DS.say(L('deep.ingrithSeeKing'), I2); return; }
    var k = 'ingrithIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    yield DS.say(L(['deep.ingrithOffice1', 'deep.ingrithOffice2', 'deep.ingrithOffice3'][i % 3]), I2);
  };
  S.quartermaster = function* () { yield DS.shop('qm'); };
  S.cot = function* () {
    yield DS.say(L('deep.cot'));
    yield* EV.rest('inn');
    yield* EV.morning();
  };
  // the Scalebeam house: the one lit door on the closed street (re-cut §5; CANON 09-26d/e). Asdis feeds you; her cot is a bed
  S.asdis = function* () {
    var g = G(), A = who('Asdis Scalebeam'), i = g.flags.asdisIdx || 0;
    g.flags.asdisIdx = i + 1;
    if (!i) { yield DS.say(L('deep.asdis0'), A); }
    else yield DS.say(L(['deep.asdis1', 'deep.asdis2', 'deep.asdis3'][(i - 1) % 3]), A);
    var a = yield DS.ask(L('deep.asdisAsk'), ['EAT AND SLEEP', 'NOT NOW'], A);
    if (a === 0) yield* S.asdisRest();
  };
  S.asdisRest = function* () {
    yield DS.say(L('deep.asdisRest'));
    yield* EV.rest('inn');
    yield* EV.morning();
  };
  S.sleeper = function* () { // the trooper in the lit barracks offers a bunk, and means it (re-cut F4)
    var a = yield DS.ask(L('deep.sleeperOffer'), ['SLEEP', 'NOT NOW'], who('Trooper'));
    if (a === 0) yield* S.cot();
  };
  S.treasury = function* () { yield DS.say(L('deep.treasury')); };

  // ================================================================== the highway (spec §6; re-cut 09-27): four days, three lamps and the door
  // guests: AI-run allies with a stat block and a leave-condition (spec §6.2). `key` lets one sheet walk as several (the troopers)
  EV.guestSheet = function (id, key, o) {
    var d = DS.DATA.heroes[id];
    key = key || id; o = o || {};
    var h = R.makeHero(id, d.level);
    h.attacks = d.attacks; h.resist = d.resist; h.guest = true; h.surgeAI = !!d.surgeAI;
    if (key !== id) h.name = o.name || h.name;
    if (d.healer) { h.healer = d.healer; h.feats.heals = d.healer; }
    if (o.wounded) { h.wounded = true; h.hp = Math.max(1, Math.round(h.maxhp / 3)); } // Halldor: a third of himself, and he won't sit out
    return h;
  };
  EV.addGuest = function (id, key, o) {
    var g = G();
    key = key || id;
    g.guests = g.guests || [];
    if (g.guests.some(function (x) { return x.id === key; })) return;
    g.guests.push({ id: key, h: EV.guestSheet(id, key, o) });
  };
  // a save made while a guest walked by an older sheet (Ingrith was a fighter with a heals counter till 09-28g, RULED: "she's meant
  // to be Cleric"): she walks on by the sheet as it stands now, as hurt as she was
  var baseStartFrom = DS.startFrom;
  DS.startFrom = function (data) {
    baseStartFrom(data);
    (G().guests || []).forEach(function (x) {
      var d = DS.DATA.heroes[x.h.id];
      if (!d || x.h.cls === d.cls) return;
      var nh = EV.guestSheet(x.h.id, x.id, { name: x.h.name, wounded: x.h.wounded });
      nh.ko = !!x.h.ko; nh.hp = nh.ko ? 0 : Math.max(1, Math.min(nh.hp, Math.round(nh.maxhp * x.h.hp / Math.max(1, x.h.maxhp))));
      x.h = nh;
    });
  };
  EV.dropGuests = function () { G().guests = []; };
  EV.dropGuest = function (key) { var g = G(); g.guests = (g.guests || []).filter(function (x) { return x.id !== key; }); };
  EV.hasGuest = function (key) { return (G().guests || []).some(function (x) { return x.id === key; }); };
  // every road fight is built for the four AND the guests walking with them (re-cut §3: "Pyro alone is worth two heroes;
  // a fight with Pyro, the captain and troopers must be built for a party of seven or it is a walk")
  var GUEST_WEIGHT = { pyro: 2, halldor: 1, brann: 1, hedda: 1, ingrith: 0.5, trooper: 0.5 };
  EV.guestWeight = function () {
    return (G().guests || []).reduce(function (s, x) { if (x.h.ko) return s; var w = GUEST_WEIGHT[x.h.id] || 0.5; return s + (x.h.wounded ? w / 2 : w); }, 0);
  };
  var basePick = EV.pickGroup;
  EV.pickGroup = function (zone) {
    var p = basePick(zone), w = EV.guestWeight();
    if (w > 0 && /^(hw\d|nest)$/.test(zone) && p.list.length) {
      var want = Math.round(p.list.length * (4 + w) / 4), base = p.list.slice();
      for (var i = 0; p.list.length < want; i++) p.list.push(base[i % base.length]);
    }
    return p;
  };
  // milestone XP: one stands, at the consult (re-cut §3: RULED 09-26d, "rewarding talk-through is good"); the road pays in fights
  EV.milestone = function* (xp, key) {
    var g = G(), ups = [];
    g.party.forEach(function (h) { if (!h.ko) ups = ups.concat(R.gainXP(h, xp)); });
    DS.audio.sfx('levelup');
    yield DS.say(L('deep.milestone', { n: xp, why: L(key) }));
    if (ups.length) yield DS.say(ups);
  };
  // the sidequests that can be done in the halls (spec §10; the petition waits on two of them)
  EV.sidequestsDone = function () {
    var f = G().flags;
    return [f.sackReturned || f.sackSold, f.countDone, f.keeperWater, f.heirDone, f.wwDone, f.tariffDone, f.curlDone, f.axeGiven || f.axeKept].filter(Boolean).length;
  };
  var LAMPS_AT = { 1: ['highway_1', 65, 10], 2: ['highway_2', 68, 11], 3: ['highway_3', 66, 11] };
  var LAMP_NAME = { 1: 'FIRST LAMP', 2: 'SECOND LAMP', 3: 'THIRD LAMP' };
  EV.lampWalk = function* (map, x, y, dir, key) { // "a walk back up the lamps": a fade, a line, and you're there
    yield DS.fade(1, 20);
    yield DS.say(L(key), { top: true, auto: 70 });
    DS.field.load(map, x, y, dir); DS.field.banner = 90;
    yield DS.fade(0, 20);
    var hook = S['enter:' + map];
    if (hook) yield* hook();
  };
  function lampWarpable(n) { // a held lamp is a warp point, once the king's escort is done (re-cut F8); Third Lamp not while it's taken
    var f = G().flags;
    return f.captainHome && f['lamp' + n] && !(n === 3 && f.wordBelow && !f.raidWon);
  }
  EV.roadMenu = function* (here) { // fast travel (spec §6.2) and, at a lamp, a night if you want one (re-cut F5)
    var g = G(), opts = [], vals = [];
    if (here !== 'gate') { opts.push('REST HERE'); vals.push('rest'); if (g.flags.captainHome) { opts.push('BACK UP TO SOLSKAFT'); vals.push('up'); } }
    [1, 2, 3].forEach(function (n) { if (lampWarpable(n) && n !== here) { opts.push('TO ' + LAMP_NAME[n]); vals.push(n); } });
    if (here === 'gate') { opts.unshift('WALK THE ROAD'); vals.unshift('walk'); }
    opts.push('NOT NOW'); vals.push('no');
    var a = vals[yield DS.ask(L(here === 'gate' ? 'deep.roadMenuGate' : 'deep.roadMenuLamp'), opts)];
    if (a === 'rest') yield* lampRest();
    else if (a === 'up') yield* EV.lampWalk('solskaft_deep', 36, 11, 'left', 'deep.walkUp');
    else if (typeof a === 'number') { var at = LAMPS_AT[a]; yield* EV.lampWalk(at[0], at[1], at[2], 'right', a > (here === 'gate' ? 0 : here) ? 'deep.walkDown' : 'deep.walkUp'); }
  };
  function* lampRest() {
    yield* EV.rest('inn');
    yield* EV.morning(); // (it asks nothing if the night's fight left nobody standing)
  }
  // the highway's mouth. The gate opens for the king (beat 2), shuts behind him when he takes the road back (beat 4),
  // opens again for Halldor's petition (beat 5), and the season musters at it when the word comes from below (beat 6)
  S.highwayGate = function* () {
    var g = G(), f = F(), GW = who('Gate watch');
    if (g.flags.wordBelow && !g.flags.mustered) { yield* S.muster(); return; }
    if (g.flags.roadOpen) { yield* EV.roadMenu('gate'); return; }
    if (g.flags.pyroLeads && !g.flags.captainHome) {
      yield DS.say(L('deep.gatePyro'), who('Pyronimus'));
      if (!g.has('ledgerlamp')) { g.give('ledgerlamp', 1); DS.audio.sfx('chest'); yield DS.say([L('deep.ledgerlampPyro'), L('g.got', { item: DS.DATA.items.ledgerlamp.name })]); }
      g.flags.roadOpen = 1; DS.audio.sfx('door'); DS.applyFlagTiles(f.map);
      yield DS.say(L('deep.gateOpens'));
      return;
    }
    if (!g.flags.pyroLeads) { yield DS.say(L('deep.gateShut'), GW); return; }
    yield DS.say(L('deep.gateKing'), GW);                   // after the escort, before the petition: the halls are yours, the road is his
  };
  // beat 6: the muster at the gate. Ingrith's ask lands here, and Pyro sends you with Brann and Hedda
  S.muster = function* () {
    var g = G(), f = F();
    g.flags.mustered = 1; g.flags.pin = 'solskaft';
    yield DS.say(L('deep.musterCome'));
    var ing = spawn({ id: 'ingrithMuster', x: 30, y: 11, look: 'ingrith', dir: 'right' }), py = spawn({ id: 'pyroMuster', x: 30, y: 10, look: 'pyro', dir: 'right' });
    ing.path = DS.pathTo(f.map, 30, 11, g.x - 1, g.y); py.path = DS.pathTo(f.map, 30, 10, g.x - 1, g.y - 1);
    yield arrived([ing, py]);
    faceTo(ing, g.x, g.y); faceTo(py, g.x, g.y);
    yield DS.say(L('deep.ingrithAsk'), who('Ingrith Scalebeam'));
    yield DS.say(L('deep.pyroSends'), who('Pyronimus'));
    if (!g.flags.noEscort) {
      var b = spawn({ id: 'brannMuster', x: 30, y: 12, look: 'brann', dir: 'right' }), hd = spawn({ id: 'heddaMuster', x: 31, y: 13, look: 'hedda', dir: 'right' });
      b.path = DS.pathTo(f.map, 30, 12, g.x, g.y + 1); hd.path = DS.pathTo(f.map, 31, 13, g.x - 1, g.y + 1);
      yield arrived([b, hd]);
      faceTo(b, g.x, g.y); faceTo(hd, g.x, g.y);
      yield DS.say(L('deep.heddaOrders'), who('Hedda Greyseam'));
      yield DS.say(L('deep.brannGo'), who('Brann Silversands'));
      EV.addGuest('brann'); EV.addGuest('hedda');
      DS.audio.sfx('levelup');
      yield DS.say(L('deep.guestsJoin'));
      b.hidden = true; hd.hidden = true;
      g.flags.escortsOut = 1;
    } else yield DS.say(L('deep.musterAlone'), who('Pyronimus'));
    [ing, py].forEach(function (n) { n.path = ['wait20'].concat(DS.pathTo(f.map, n.x, n.y, 2, 11), ['hide']); });
    g.flags.roadOpen = 1; DS.applyFlagTiles(f.map);
  };
  // a lamp reached: offered, never imposed (re-cut F5); no milestone (§3); the day-clock is the road walked, not the rest taken
  S.lampArrive = function* (n) {
    var g = G(), pyro = EV.hasGuest('pyro'), escorts = EV.hasGuest('brann');
    g.flags['lamp' + n] = 1;
    if (n === 1) {
      yield DS.say(L('deep.lamp1Arrive'));
      if (pyro) { yield DS.say(L('deep.ulfKing'), who('Ulf Silversands')); yield DS.say(L('deep.lamp1Pyro'), who('Pyronimus')); }
      else yield DS.say(L('deep.ulf1'), who('Ulf Silversands'));
      if (escorts) yield DS.say(L('deep.lamp1Brann'), who('Brann Silversands'));
    } else if (n === 2) {
      yield DS.say(L('deep.lamp2Arrive'));
      if (pyro && !g.flags.captainFound) { // beat 3: the word of Halldor's unit, pinned up the north cut
        yield DS.say(L('deep.thyraReport'), who('Thyra Silversands'));
        yield DS.say(L('deep.pyroPinned'), who('Pyronimus'));
        g.flags.heardPinned = 1; g.flags.pin = 'kingsroad';
      } else yield DS.say(L('deep.thyra1'), who('Thyra Silversands'));
      if (escorts) { yield DS.say(L('deep.lamp2Brann'), who('Brann Silversands')); yield DS.say(L('deep.lamp2Hedda'), who('Hedda Greyseam')); }
    } else {
      yield DS.say(L('deep.lamp3Arrive'));
      yield DS.say(L(pyro ? 'deep.geirKing' : 'deep.geir1'), who('Geir Silversands'));
    }
    var a = yield DS.ask(L('deep.lampStay'), ['STAY THE NIGHT', 'GO ON']);
    if (a === 0) yield* lampRest();
  };
  S.lampTower = function* (n) {
    yield DS.say(L('deep.lampLit'));
    yield* EV.roadMenu(n);
  };
  // Pyro on the road (beat 3): the burial law in his mouth; why he sealed the mint; what the road was for
  S.pyroRoad = function* (n) {
    var g = G();
    g.flags['pyroRoad' + n] = 1;
    if (!EV.hasGuest('pyro')) return;
    yield DS.say(L('deep.pyroRoad' + n), who('Pyronimus'));
  };
  // leg one: the cut seal and the camp behind it (the intrusions, retuned for five-to-six and the king); the truesilver in the cut
  S.cutSeal = function* () {
    var g = G();
    yield DS.say(L('deep.cutSeal'));
    // budgeted hard (DMG): four at 5 face six; with the king (worth two) the camp is eight
    var foes = ['bugbearchief', 'hobsergeant', 'hobgoblin', 'hobgoblin', 'hobgoblin', 'worg'];
    if (EV.guestWeight() >= 1.5) foes = foes.concat(['bugbear', 'worg']);
    var res = yield* EV.fight(foes, { bg: 'cavern', music: 'boss', canRun: true, introText: L('deep.cutSealIntro'), deep16: 'cutseal' }); // (DEEP16: this list, on the camp)
    if (res === 'win') { g.flags.sealCleared = 1; yield DS.say(L('deep.cutSealDone')); }
    else if (res === 'run') yield F().walk(['down', 'down']);
  };
  S.grickDen = function* () { // the open cavern south of the road: the dark in it is where things come from
    var g = G();
    yield DS.say(L('deep.grickDen'));
    var foes = ['grick', 'grick', 'grick'].concat(EV.guestWeight() >= 1.5 ? ['grick', 'grick'] : []);
    var res = yield* EV.fight(foes, { bg: 'cavern', music: 'boss', canRun: true, deep16: 'gricks' });
    if (res === 'win') { g.flags.grickDone = 1; yield DS.say(L('deep.grickDone')); }
    else if (res === 'run') yield F().walk(['up', 'up']);
  };
  S.vein = function* () {
    var g = G();
    if (g.flags.lumpTaken) { yield DS.say(L('deep.veinDone')); return; }
    if (!g.flags.sealCleared) { yield DS.say(L('deep.veinBusy')); return; }
    g.flags.lumpTaken = 1; g.give('truesilver', 1); DS.audio.sfx('chest');
    yield DS.say([L('deep.vein'), L('g.got', { item: DS.DATA.items.truesilver.name })]);
  };
  // leg two: the roper at the fork (the light shows it), the bulette's breach, the black pudding in the drainage cut
  S.roper = function* () {
    var g = G();
    var seen = g.flags.roperSeen;
    if (!seen) {
      yield DS.say(L('deep.roperCauseway'));
      if (g.has('ledgerlamp') && (yield* EV.check('Perception', 'wis', 12))) { seen = g.flags.roperSeen = 1; yield DS.say(L('deep.roperSeen')); }
    } else yield DS.say(L('deep.roperAgain'));
    var foes = ['roper'].concat(EV.guestWeight() >= 1.5 ? ['darkmantle', 'darkmantle', 'darkmantle', 'darkmantle', 'grick', 'grick'] : ['darkmantle', 'darkmantle']);
    if (seen) {
      var a = yield DS.ask(L('deep.roperAsk'), ['FIGHT IT', 'GO BACK']);
      if (a !== 0) { yield F().walk(['left', 'left']); return; }
      var r1 = yield* EV.fight(foes, { bg: 'cavern', music: 'boss', canRun: true, revealed: true, deep16: 'roper' }); // (DEEP16: seen, so nothing starts hidden)
      if (r1 === 'win') { g.flags.roperDead = 1; yield DS.say(L('deep.roperDone')); } else if (r1 === 'run') yield F().walk(['left', 'left']);
      return;
    }
    yield DS.say(L('deep.roperGrabs'));
    var r2 = yield* EV.fight(foes, { bg: 'cavern', music: 'boss', canRun: true, surprised: 'party', deep16: 'roper' });
    if (r2 === 'win') { g.flags.roperDead = 1; g.flags.roperSeen = 1; yield DS.say(L('deep.roperDone')); } else if (r2 === 'run') { g.flags.roperSeen = 1; yield F().walk(['left', 'left']); }
  };
  S.bulette = function* () {
    var g = G();
    yield DS.say(L('deep.bulette'));
    var res = yield* EV.fight(['bulette'].concat(EV.guestWeight() >= 1.5 ? ['bulette'] : []), { bg: 'cavern', music: 'boss', canRun: true, deep16: 'bulette' });
    if (res === 'win') { g.flags.buletteDead = 1; yield DS.say(L('deep.buletteDone')); if (EV.hasGuest('hedda')) yield DS.say(L('deep.buletteHedda'), who('Hedda Greyseam')); }
  };
  S.drainCut = function* () {
    var g = G();
    yield DS.say(L('deep.drain'));
    var a = yield DS.ask(L('deep.drainAsk'), ['FIGHT IT', 'BACK AWAY']);
    if (a !== 0) { yield F().walk(['up']); return; }
    var res = yield* EV.fight(['pudding', 'pudding'], { bg: 'cavern', music: 'boss', canRun: true, deep16: 'drain' });
    if (res === 'win') { g.flags.puddingDead = 1; yield DS.say(L('deep.drainDone')); } else if (res === 'run') yield F().walk(['up']);
  };
  // beat 3, off the highway: the north cut, and Halldor's unit holding the neck against a thing they cannot take
  S.pinned = function* () {
    var g = G(), f = F(), H2 = who('Halldor Silversands'), P = who('Pyronimus');
    var hd = EV.npc('halldorPin');
    yield DS.say(L('deep.pinnedSee'));
    if (hd) faceTo(hd, g.x, g.y);
    yield DS.say(L('deep.halldor1'), H2);
    if (EV.hasGuest('pyro')) yield DS.say(L('deep.pyroHalldor'), P);
    yield DS.say(L('deep.spidersCome'));
    // the fight: the party, the king, the captain at a third of himself who refuses to sit out, and his two on their feet
    EV.addGuest('halldor', 'halldor', { wounded: true });
    EV.addGuest('trooper', 'pinA', { name: 'Trooper' }); EV.addGuest('trooper', 'pinB', { name: 'Trooper' });
    var res = yield* EV.fight(['phasespider', 'phasespider', 'phasespider', 'phasespider', 'phasespider'], { bg: 'cavern', music: 'boss', canRun: false, introText: L('deep.spidersIntro'), deep16: 'pinned' });
    EV.dropGuest('pinA'); EV.dropGuest('pinB');
    if (res !== 'win') { EV.dropGuest('halldor'); return; }
    g.flags.captainFound = 1; g.flags.pin = 'escort';
    yield DS.say(L('deep.spidersGone'));
    yield DS.say(L('deep.halldor2'), H2);
    // a healer's kit or a paladin's hands on him: a talk option that matters (beat 4)
    var ly = g.hero('lymen'), opts = [], vals = [];
    if (g.has('kit')) { opts.push("TEND HIM (HEALER'S KIT)"); vals.push('kit'); }
    if (ly && !ly.ko && (ly.feats.lay || 0) >= 10) { opts.push('LAY ON HANDS (LYMEN)'); vals.push('lay'); }
    opts.push('LET HIM WALK'); vals.push('walk');
    var c = vals[yield DS.ask(L('deep.halldorTend'), opts)];
    var x = (g.guests || []).filter(function (q) { return q.id === 'halldor'; })[0];
    if (c === 'kit') { g.take('kit', 1); }
    if (c === 'lay') { ly.feats.lay -= 10; }
    if (x && c !== 'walk') { x.h.wounded = false; x.h.hp = Math.max(x.h.hp, Math.round(x.h.maxhp * 2 / 3)); g.flags.captainTended = c; DS.audio.sfx('heal'); yield DS.say(L(c === 'kit' ? 'deep.halldorKit' : 'deep.halldorLay')); }
    else yield DS.say(L('deep.halldorWalks'), H2);
    yield DS.say(L('deep.escortBegins'), P);
    f.refreshNpcs();
  };
  S.neck = function* () { // the dark past the neck: the nest is behind it, and it isn't fought now
    var g = G();
    yield DS.say(L(g.flags.captainHome ? 'deep.neckLater' : 'deep.neckNow'));
    yield F().walk(['down']);
  };
  // beat 4: the relief column passes the escort going down ("he sends reinforcements back down")
  S.relief = function* () {
    var g = G(), f = F(), m = f.map, list = [];
    g.flags.reliefSeen = 1;
    yield DS.say(L('deep.reliefCome'));
    var sx = Math.max(0, g.x - 10);
    for (var i = 0; i < 9; i++) {
      var n = spawn({ id: 'relief' + i, x: sx - Math.floor(i / 2), y: i % 2 ? 11 : 10, look: i === 0 ? 'dtrooper' : (i % 2 ? 'dtrooper2' : 'dtrooper'), dir: 'right' });
      n.pathSpeed = 1; list.push(n);
    }
    var sgt = list[0];
    list.forEach(function (n, k) { n.path = []; var stop = k === 0 ? g.x - 1 : n.x; for (var x = n.x; x < stop; x++) n.path.push('right'); });
    yield arrived([sgt]);
    faceTo(sgt, g.x, g.y); playerFace(sgt.x, sgt.y);
    yield DS.say(L('deep.reliefSgt'), who('Drill-sergeant'));
    if (EV.hasGuest('pyro')) yield DS.say(L('deep.reliefPyro'), who('Pyronimus'));
    list.forEach(function (n, k) { // past you on the far side of the road: whoever shares your row steps round you
      n.solid = false; n.pathSpeed = 2; n.path = ['wait' + (k * 4)];
      if (n.y === g.y) n.path.push(g.y <= 10 ? 'down' : 'up');
      for (var x = n.x; x < Math.min(m.w - 1, g.x + 14); x++) n.path.push('right');
      n.path.push('hide');
    });
    yield W8.frames(30);
  };
  // arriving back in the works: the escort home (beat 4), and the brood crushed (beat 5)
  S['enter:solskaft_deep'] = function* () {
    var g = G(), f = F(), P = who('Pyronimus');
    if (g.flags.captainFound && !g.flags.captainHome) {
      g.flags.captainHome = 1; g.flags.pyroTrusts = 1; g.flags.pin = 'halls';
      yield DS.say(L('deep.homeCome'));
      if (g.flags.captainTended) yield DS.say(L('deep.halldorHomeTended'), who('Halldor Silversands'));
      else yield DS.say(L('deep.halldorHome'), who('Halldor Silversands'));
      yield DS.say(L('deep.pyroTrusts'), P);
      EV.dropGuests(); delete g.flags.roadOpen; DS.applyFlagTiles(f.map); DS.audio.sfx('door');
      yield DS.say(L('deep.pyroGoesUp'));
      return;
    }
  };
  // beat 5: the captain's petition, in the muster yard, once he's on his feet (two sidequests on)
  S.halldor = function* () {
    var g = G(), H2 = who('Halldor Silversands');
    if (g.flags.nestCrushed) { yield DS.say(L('deep.halldorAfter'), H2); return; }
    if (g.flags.petition) { yield DS.say(L('deep.halldorGo'), H2); return; }
    yield DS.say(L(g.flags.captainTended ? 'deep.petitionTended' : 'deep.petition'), H2);
    var a = yield DS.ask(L('deep.petitionAsk'), ['WE COME', 'NOT YET'], H2);
    if (a !== 0) { yield DS.say(L('deep.petitionWait'), H2); return; }
    g.flags.petition = 1; g.flags.roadOpen = 1; g.flags.pin = 'nest';
    EV.addGuest('halldor');
    for (var i = 1; i <= 4; i++) EV.addGuest('trooper', 'nest' + i, { name: 'Trooper' });
    DS.audio.sfx('levelup');
    yield DS.say(L('deep.petitionJoin'));
    var me = EV.npc('halldor'); if (me) me.hidden = true;
  };
  S.halldorBunk = function* () { yield DS.say(L(EV.sidequestsDone() >= 1 ? 'deep.halldorBunk2' : 'deep.halldorBunk'), who('Halldor Silversands')); };
  // the nest: the brood and the one that bred it
  S.brood = function* () {
    var g = G();
    yield DS.say(L('deep.broodSee'));
    if (EV.hasGuest('halldor')) yield DS.say(L('deep.broodHalldor'), who('Halldor Silversands'));
    var res = yield* EV.fight(['broodmother', 'phasespider', 'phasespider', 'phasespider', 'phasespider'], { bg: 'cavern', music: 'boss', canRun: false, introText: L('deep.broodIntro'), deep16: 'brood' });
    if (res !== 'win') return;
    g.flags.nestCrushed = 1; g.flags.pin = 'halls';
    yield DS.say(L('deep.broodDone'));
    yield* EV.renown(1, 'renown.nest');
    if (EV.hasGuest('halldor')) { yield DS.say(L('deep.nestHome'), who('Halldor Silversands')); }
    EV.dropGuests(); g.flags.nestHome = 1;                 // his four go home with him by the short way; the cocoons are yours to open
  };
  var COCOON_LOOT = { '3,7': 'diamond', '19,8': 'greaterpotion', '16,3': 'dwarfplate' };
  S.cocoon = function* () {
    var g = G(), f = F(), p = f.facing(), key = p[0] + ',' + p[1];
    if (f.map.at(p[0], p[1]) !== 'cocoon') return;
    if (!g.flags.nestCrushed) { yield DS.say(L('deep.cocoonBusy')); return; }
    var k = 'cocoon:' + key;
    if (g.flags[k]) { yield DS.say(L('deep.cocoonDone')); return; }
    g.flags[k] = 1;
    var it = COCOON_LOOT[key];
    if (!it) { yield DS.say(L('deep.cocoonDead')); return; }
    g.give(it, 1); DS.audio.sfx('chest');
    yield DS.say([L('deep.cocoonGear'), L('g.got', { item: DS.DATA.items[it].name })]);
  };
  // beat 6: the word from below, at the first rest after the nest (Ulf's runner: the drow have taken Third Lamp)
  var baseRestW = EV.rest;
  EV.rest = function* (song) {
    yield* baseRestW(song);
    var g = G();
    if (!g.flags.nestCrushed || g.flags.wordBelow || !DS.field || g.party.every(function (h) { return h.ko; })) return;
    g.flags.wordBelow = 1; g.flags.pin = 'solskaft';
    var f = F(), spots = [[g.x + 1, g.y], [g.x - 1, g.y], [g.x, g.y + 1], [g.x, g.y - 1]].filter(function (q) { return f.free(q[0], q[1]); });
    var r = spots.length ? spawn({ id: 'runner', x: spots[0][0], y: spots[0][1], look: 'dtrooper2', dir: 'down' }) : null;
    if (r) { faceTo(r, g.x, g.y); playerFace(r.x, r.y); }
    yield DS.say(L('deep.runnerCome'));
    yield DS.say(L('deep.runner'), who("Ulf's runner"));
    if (r) r.path = ['wait20', 'hide'];
    if (f.map.id.indexOf('highway') === 0) DS.applyFlagTiles(f.map);
  };
  // leg three: the xorn in the wall; the duergar and their giant in the south cut; the raid on Third Lamp (beat 6)
  S.xorn = function* () {
    var g = G();
    yield DS.say(L('deep.xorn'));
    var res = yield* EV.fight(['xorn', 'xorn'], { bg: 'highway', music: 'boss', canRun: true, deep16: 'xorns' });
    if (res === 'win') { g.flags.xornDone = 1; yield DS.say(L('deep.xornDone')); }
  };
  S.giant = function* () {
    var g = G();
    yield DS.say(L('deep.giantSee'));
    var res = yield* EV.fight(['stonegiant', 'duergar', 'duergar', 'duergar'], { bg: 'highway', music: 'boss', canRun: true, deep16: 'giant' });
    if (res === 'win') { g.flags.giantDone = 1; g.silver += 300; DS.audio.sfx('coin'); yield DS.say([L('deep.giantDone'), L('g.foundSilver', { n: 300 })]); }
    else if (res === 'run') yield F().walk(['up', 'up']);
  };
  S.raid = function* () {
    var g = G(), guests = EV.hasGuest('brann');
    yield DS.say(L('deep.raidSee'));
    if (guests) { yield DS.say(L('deep.raidBrann'), who('Brann Silversands')); yield DS.say(L('deep.raidHedda'), who('Hedda Greyseam')); }
    var a = yield DS.ask(L('deep.raidAsk'), ['GO IN', 'CREEP UP FIRST']);
    var o = { bg: 'highway', music: 'boss', canRun: false, introText: L('deep.raidIntro'), deep16: 'raid' }; // (DEEP16: this list, at the station)
    if (a === 1) { if (yield* EV.check('Stealth', 'dex', 13, { group: true })) { o.surprised = 'foes'; yield DS.say(L('deep.raidCrept')); } else yield DS.say(L('deep.raidSpotted')); }
    var res = yield* EV.fight(['drowcaptain', 'spellweaver', 'drow', 'drow', 'drow', 'drow', 'drow', 'drow'], o); // hard for four at 7-8 with Brann and Hedda
    if (res !== 'win') return;
    g.flags.lamp3 = 1; g.flags.raidWon = 1;
    yield DS.say(L('deep.raidWon'));
    DS.audio.sfx('magic'); DS.applyFlagTiles(F().map);
    yield DS.say(L(guests ? 'deep.lamp3Lit' : 'deep.lamp3LitAlone'));
    if (guests) { yield DS.say(L('deep.escortsStay'), who('Hedda Greyseam')); EV.dropGuest('brann'); EV.dropGuest('hedda'); F().refreshNpcs(); }
    g.flags.pin = 'solskaft';
  };
  S.captain = function* () { // the Greyseam knife: a sect blade on a garrison captain's body (spec §8: shown, not told)
    var g = G();
    if (!g.flags.raidWon) return;
    if (g.flags.knifeTaken) { yield DS.say(L('deep.captainRest')); return; }
    yield DS.say(L('deep.captainSee'));
    if (EV.npc('heddaLamp')) yield DS.say(L('deep.heddaKnife'), who('Hedda Greyseam'));
    g.flags.knifeTaken = 1; g.give('greyseamknife', 1); DS.audio.sfx('chest');
    yield DS.say(L('g.got', { item: DS.DATA.items.greyseamknife.name }));
    var v = g.hero('vivian');
    if (v) {
      var eq = yield DS.ask(L('winters.equipAsk', { name: v.name }), ['YES', 'NO']);
      if (eq === 0) { if (v.equip.weapon && v.equip.weapon !== 'unarmed') g.give(v.equip.weapon, 1); g.take('greyseamknife', 1); v.equip.weapon = 'greyseamknife'; DS.audio.sfx('confirm'); }
    }
  };
  S.deepholmRoad = function* () { // past Third Lamp is Deepholm's road; nobody walks it this season without a reason (before beat 6)
    yield DS.say(L(EV.hasGuest('pyro') ? 'deep.deepRoadPyro' : 'deep.deepRoad'), EV.hasGuest('pyro') ? who('Pyronimus') : who('Geir Silversands'));
    yield F().walk(['left']);
  };
  // leg four (re-cut §4): the drow's fallback line; the deep water and what lives in it; the troll hole; the made road's cut
  function* legFour(flag, lineKey, introKey, foes, doneKey, back, d16) {
    var g = G();
    yield DS.say(L(lineKey));
    var res = yield* EV.fight(foes, { bg: 'highway', music: 'boss', canRun: true, introText: introKey ? L(introKey) : undefined, deep16: d16 }); // (DEEP16: each leg's own fight)
    if (res === 'win') { g.flags[flag] = 1; yield DS.say(L(doneKey)); }
    else if (res === 'run') yield F().walk(back);
  }
  S.fallback = function* () { yield* legFour('fallbackDone', 'deep.fallback', 'deep.fallbackIntro', ['drowcaptain', 'drow', 'drow', 'drow', 'drow'], 'deep.fallbackDone', ['left', 'left'], 'fallback'); };
  S.naga = function* () { yield* legFour('nagaDone', 'deep.naga', null, ['naga'], 'deep.nagaDone', ['left', 'left'], 'naga'); };
  S.trolls = function* () { yield* legFour('trollsDone', 'deep.trolls', null, ['troll', 'troll'], 'deep.trollsDone', ['up', 'up'], 'trolls'); };
  S.elemental = function* () { yield* legFour('elementalDone', 'deep.elemental', null, ['earthelemental', 'earthelemental'], 'deep.elementalDone', ['left', 'left'], 'elementals'); };
  // the smith re-hafts Barley's flail in truesilver (spec §8: the Winnower)
  S.dsmith = function* () {
    var g = G(), S2 = who('The Copperbottom smith');
    if (g.has('truesilver') && !g.flags.winnowerMade) {
      yield DS.say(L('deep.smithLump'), S2);
      var flails = ['threshingflail2', 'threshingflail1', 'threshingflail'], b = g.hero('barley');
      var fl = flails.filter(function (id) { return (b && b.equip.weapon === id) || g.count(id) > 0; })[0];
      if (!fl) { yield DS.say(L('deep.smithNoFlail'), S2); }
      else {
        var a = yield DS.ask(L('deep.smithAsk'), ['RE-HAFT IT', 'NOT YET']);
        if (a === 0) {
          if (b && b.equip.weapon === fl) b.equip.weapon = null; else g.take(fl, 1);
          g.take('truesilver', 1); g.flags.winnowerMade = 1;
          DS.audio.sfx('crit'); yield DS.say(L('deep.smithWorks'));
          if (b && !b.equip.weapon) { b.equip.weapon = 'winnower'; } else g.give('winnower', 1);
          DS.audio.sfx('chest');
          yield DS.say([L('deep.smithWinnower'), L('g.got', { item: DS.DATA.items.winnower.name })], S2);
          return;
        }
      }
    }
    yield DS.shop('copperbottom');
  };
  // guests sleep where the party sleeps: a long rest stands them up again (a KO'd guest sits out till the next lamp)
  var baseLongRest2 = EV.longRest;
  EV.longRest = function () {
    baseLongRest2();
    (G().guests || []).forEach(function (x) {
      x.h.ko = false; x.h.conds = {}; R.refresh(x.h, true); if (x.h.healer) x.h.feats.heals = x.h.healer;
      if (x.h.wounded) x.h.hp = Math.max(1, Math.round(x.h.maxhp / 3)); // a night on a cot doesn't mend Halldor; a kit or a paladin's hands does
    });
  };
  // Revivify in the field: a diamond, and a fallen friend
  var baseFieldCast = EV.fieldCast;
  EV.fieldCast = function* (h, sp) {
    if (sp.kind !== 'revive') { yield* baseFieldCast(h, sp); return; }
    var g = G(), slot = R.lowestSlot(h, sp.level);
    if (!slot) { yield DS.say(L('g.noSlots')); return; }
    if (!g.count('diamond')) { yield DS.say(L('deep.noDiamond')); return; }
    var items = g.party.map(function (x) { return { label: x.name, right: x.ko ? 'KO' : x.hp + '/' + x.maxhp, value: x, disabled: !x.ko }; });
    if (!items.some(function (it) { return !it.disabled; })) { yield DS.say(L('deep.noneDown')); return; }
    var t = yield DS.choose({ items: items, x: 60, y: 60, w: 136, title: 'WHO COMES BACK?' });
    if (!t) return;
    h.slots[slot - 1]--; g.take('diamond', 1); t.ko = false; t.hp = 1; DS.audio.sfx('heal');
    yield DS.say(L('deep.revived', { name: t.name }));
  };

  // ================================================================== Deepholm's door (spec §6.4) and the road's people (§7)
  S['enter:threshold'] = function* () {
    var g = G();
    if (!g.flags.deepholmSeen) { g.flags.deepholmSeen = 1; yield DS.say(L('deep.doorSee')); }
    if (g.flags.raidWon && !g.flags.highwaySecured) { g.flags.highwaySecured = 1; g.flags.pin = 'thedoor'; yield DS.say(L('deep.roadHeld'), { top: true }); } // four days, the road held to the door
    if (!g.flags.torvaldMet) yield* EV.torvald();
  };
  // a menu of checks, each once, each with the reason it might tell you something (spec §7: checks as dialog options)
  function* checkMenu(title, list, asked) {
    var items = list.filter(function (c) { return !asked[c.id] && (!c.cond || c.cond()); }).map(function (c) { return { label: c.label, value: c }; });
    items.push({ label: 'ENOUGH', value: 'back' });
    return yield DS.choose({ items: items, x: 70, y: 40, w: 180, title: title, rowH: 12,
      drawExtra: function (ctx, menu) { var c = menu.current() && menu.current().value; if (!c || c === 'back') return; DS.win(ctx, 4, 196, 248, 40); DS.wrap(L(c.hint), 236).slice(0, 3).forEach(function (l, i) { DS.text(ctx, l, 10, 203 + i * 10, '#E0C8A0'); }); } });
  }
  EV.torvald = function* () {
    var g = G(), f = F(), C = who('The cleric');
    g.flags.torvaldMet = 1;
    var tv = spawn({ id: 'torvaldNpc', x: 16, y: g.y, look: 'torvald', dir: 'left' });
    yield DS.say(L('deep.tvCome'));
    tv.path = []; for (var x = tv.x; x > g.x + 2; x--) tv.path.push('left');
    yield arrived([tv]);
    playerFace(tv.x, tv.y);
    yield DS.say(L('deep.tv1'), C);
    var asked = {}, anyOk = false, done = null, viv = g.hero('vivian');
    var CHECKS = [
      { id: 'insight', label: 'INSIGHT 13', hint: 'deep.tvHint.insight', skill: 'Insight', ab: 'wis', dc: 13 },
      { id: 'religion', label: 'RELIGION 12', hint: 'deep.tvHint.religion', skill: 'Religion', ab: 'int', dc: 12 },
      { id: 'medicine', label: 'MEDICINE 14', hint: 'deep.tvHint.medicine', skill: 'Medicine', ab: 'wis', dc: 14 },
      { id: 'persuade', label: 'PERSUASION 15', hint: 'deep.tvHint.persuade', skill: 'Persuasion', ab: 'cha', dc: 15, cond: function () { return anyOk; } },
      { id: 'lift', label: 'SLEIGHT OF HAND 15', hint: 'deep.tvHint.lift', skill: 'Sleight of Hand', ab: 'dex', dc: 15, cond: function () { return viv && !viv.ko; }, hero: viv }
    ];
    while (!done) {
      var a = yield DS.ask(L('deep.tvAsk'), ['LET HIM GO', 'ASK HIM', 'HOLD HIM'], C);
      if (a === 0) { done = g.flags.scrapingLifted ? 'robbed' : 'gone'; break; }
      if (a === 2) { done = 'fight'; break; }
      while (true) {
        var c = yield* checkMenu(L('deep.tvWatch'), CHECKS, asked);
        if (!c || c === 'back') break;
        asked[c.id] = 1;
        var ok = yield* EV.check(c.skill, c.ab, c.dc, { hero: c.hero });
        yield DS.say(L('deep.tv.' + c.id + (ok ? 'Yes' : 'No')), c.id === 'persuade' ? C : undefined);
        if (ok) anyOk = true;
        if (c.id === 'persuade' && ok) { g.flags.torvaldTold = 1; done = 'told'; break; }
        if (c.id === 'lift') { if (ok) { g.flags.scrapingLifted = 1; g.give('copperscraping', 1); } else { done = 'caught'; break; } }
      }
    }
    if (done === 'fight') {
      yield DS.say(L('deep.tvHold'));
      DS.battleYielded = false;
      // fought in DEEP16 (Griz 09-28: "given the weight of the scene ... redo it in 16"; deep16/data/fights.js torvald): he
      // yields at half, and js/embed.js hands it back as the 8-bit battle's own yield (DS.battleYielded)
      var res = yield* EV.fight(['torvald'], { bg: 'highway', music: 'boss', canRun: false, yieldText: L('deep.tvYield'), deep16: 'torvald' });
      if (res !== 'win') return;
      var kill = true;
      if (DS.battleYielded) { var y = yield DS.ask(L('deep.tvYieldAsk'), ['LET HIM GO', 'FINISH IT']); kill = y === 1; }
      if (!kill) { g.flags.torvaldFate = 'spared'; yield DS.say(L('deep.tvSpared')); tv.pathSpeed = 1; tv.path = DS.pathTo(f.map, tv.x, tv.y, 0, 8).concat(['hide']); return; }
      g.flags.torvaldFate = 'dead'; tv.hidden = true;
      ['copperscraping', 'kit', 'dvalsymbol'].forEach(function (id) { g.give(id, 1); }); g.silver += 40; DS.audio.sfx('chest');
      yield DS.say(L('deep.tvDead'));
      return;
    }
    if (done === 'caught') { g.flags.torvaldFate = 'gone'; yield DS.say(L('deep.tvCaught')); }
    else {
      g.flags.torvaldFate = done;
      g.party.forEach(function (h) { if (!h.ko) { h.hp = h.maxhp; delete h.conds.poisoned; delete h.conds.paralyzed; } });
      DS.audio.sfx('heal');
      yield DS.say(L('deep.tvHeal'));
      yield DS.say(L('deep.tvGo'), C);
    }
    tv.pathSpeed = 2; tv.path = DS.pathTo(f.map, tv.x, tv.y, 0, 8).concat(['hide']);
    yield DS.say(L('deep.tvGone'), { auto: 60 });
  };
  // the sect's blades, at the next rest of any kind after the cleric (spec §7.2)
  EV.assassinsDue = function () { var g = G(); return !!g.flags.torvaldMet && (!g.flags.assassinsMet || g.flags.assassinsCircle) && !g.flags.assassinsFate; };
  EV.assassins = function* () {
    var g = G(), f = F(), second = !!g.flags.assassinsCircle, H2 = who('A hooded dwarf');
    g.flags.assassinsMet = 1; delete g.flags.assassinsCircle;
    yield DS.say(L(second ? 'deep.asBack' : 'deep.asNight'));
    var party = g.party.filter(function (h) { return !h.ko; });
    var w = party.length === 1 ? party[0] : yield DS.choose({ items: party.map(function (h) { return { label: h.name, right: 'Perception ' + (10 + R.skill(h, 'Perception', 'wis')), value: h }; }), x: 60, y: 90, w: 156, title: L('deep.asWatch'), cancelable: false });
    w = w || party[0];
    var spotted = 10 + R.skill(w, 'Perception', 'wis') >= DS.d(20) + 9;
    var blades = [];
    [[g.x - 2, g.y], [g.x + 2, g.y], [g.x, g.y - 2], [g.x, g.y + 2]].forEach(function (p) { if (blades.length < 2 && f.free(p[0], p[1])) blades.push(spawn({ id: 'blade' + blades.length, x: p[0], y: p[1], look: 'sectblade', dir: 'down' })); });
    blades.forEach(function (n) { faceTo(n, g.x, g.y); });
    yield DS.say(L(spotted ? 'deep.asSpotted' : 'deep.asUnseen', { name: w.name }));
    yield DS.say(L('deep.as1'), H2);
    var carried = g.has('copperscraping') || g.flags.torvaldFate === 'dead', went = ['gone', 'told', 'robbed', 'spared'].indexOf(g.flags.torvaldFate) >= 0;
    var asked = {}, fate = null;
    var CHECKS = [
      { id: 'religion', label: 'RELIGION 12', hint: 'deep.asHint.religion', skill: 'Religion', ab: 'int', dc: 12 },
      { id: 'insight', label: 'INSIGHT 14', hint: 'deep.asHint.insight', skill: 'Insight', ab: 'wis', dc: 14 },
      { id: 'intimidate', label: 'INTIMIDATION 16', hint: 'deep.asHint.intimidate', skill: 'Intimidation', ab: 'cha', dc: 16 }
    ];
    while (!fate) {
      var a = yield DS.ask(L('deep.asAsk'), ['HE WENT UP', 'HE WENT DOWN', 'NOTHING TO SAY', 'ASK THEM', 'FIGHT'], H2);
      if (a === 3) {
        while (true) {
          var c = yield* checkMenu(L('deep.tvWatch'), CHECKS, asked);
          if (!c || c === 'back') break;
          asked[c.id] = 1;
          var ok = yield* EV.check(c.skill, c.ab, c.dc);
          yield DS.say(L('deep.as.' + c.id + (ok ? 'Yes' : 'No')), c.id === 'intimidate' && ok ? H2 : undefined);
          if (c.id === 'intimidate' && ok) g.flags.assassinsTold = 1;
        }
        continue;
      }
      if (a === 0 && went) { fate = 'sent'; yield DS.say(L('deep.asUp')); break; }
      if (a === 0 || a === 1) { // a lie either way: up when he never went up, or down
        if (yield* EV.check('Deception', 'cha', 15)) { fate = 'misled'; yield DS.say(L('deep.asLie')); break; }
        yield DS.say(L('deep.asLieNo'), H2); fate = 'fight'; spotted = false; break;
      }
      if (a === 2) {
        if (carried) {
          yield DS.say(L('deep.asCarry'), H2);
          var b = yield DS.ask(L('deep.asAsk'), g.has('copperscraping') ? ['GIVE IT', 'KEEP IT'] : ['STAND YOUR GROUND']);
          if (b === 0 && g.has('copperscraping')) { g.take('copperscraping', 1); fate = 'paid'; yield DS.say(L('deep.asPaid')); break; }
          fate = 'fight'; break;
        }
        yield DS.say(L('deep.asNoBusiness'), H2);
        fate = second ? 'gone' : 'circle';
        yield DS.say(L('deep.asGone'));
        break;
      }
      if (a === 4) { fate = 'fight'; break; }
    }
    if (fate === 'fight') {
      yield DS.say(L('deep.asFight'));
      var res = yield* EV.fight(['assassin', 'assassin'], { bg: f.map.bg || 'highway', music: 'boss', canRun: false, surprised: spotted ? null : 'party', deep16: 'blades' }); // (DEEP16: the watch's word stands, no roll there)
      f.npcs = f.npcs.filter(function (n) { return blades.indexOf(n) < 0; });
      if (res !== 'win') return;
      g.flags.assassinsFate = 'dead'; g.give('sectblade', 2); g.give('wardknot', 1); g.silver += 120; DS.audio.sfx('chest');
      yield DS.say(L('deep.asDead'));
      return;
    }
    blades.forEach(function (n) { n.path = ['wait20', 'hide']; });
    if (fate === 'circle') g.flags.assassinsCircle = 1; else g.flags.assassinsFate = fate;
  };
  var baseRest = EV.rest;
  EV.rest = function* (song) { if (EV.assassinsDue()) { yield* EV.assassins(); if (!DS.field || G().party.every(function (h) { return h.ko; })) return; } yield* baseRest(song); };
  var baseUse = EV.useFieldItem;
  EV.useFieldItem = function* (id, h) {
    var it = DS.DATA.items[id], src = F().map.src;
    if (it && it.use && it.use.effect === 'rest' && EV.assassinsDue() && !(src.tent === false || (!src.outside && !src.dark))) yield* EV.assassins();
    yield* baseUse(id, h);
  };
  // Dagny, at the grille; the door and its popup; the consult (spec §6.4, §3 beat 9)
  S.dagny = function* () {
    var g = G(), D2 = who('Dagny Scalebeam');
    var k = 'dagnyIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    yield DS.say(L(['deep.dagny1', 'deep.dagny2', 'deep.dagny3'][i % 3]), D2);
    yield DS.shop('dagny');
  };
  S.deepDoor = function* () {
    var g = G();
    if (g.flags.ingrithEscort && !g.flags.expansionDone && (g.guests || []).some(function (x) { return x.id === 'ingrith'; })) { yield* EV.consult(); return; }
    DS.audio.sfx('popup');
    yield DS.popup({
      title: 'DAGNY SCALEBEAM', text: L('deep.doorPopup'), foot: DS.DATA.config.kofi.replace(/^https?:\/\//, ''), buttons: ['\u2665 DONATE', 'BACK'],
      art: function (ctx, x, y) { ctx.drawImage(DS.walker(DS.LOOKS.dagny).down[(DS.frame >> 5) & 1], x - 12, y - 2, 24, 24); },
      onButton: function (b) { if (b === 0) DS.openKofi(); }
    });
  };
  EV.receiptKey = function () { // the credits' last card, chosen by the flags (spec §7.3)
    var g = G(), a = g.flags.assassinsFate;
    if (g.flags.torvaldFate === 'dead') return 'deep.rcDead';
    if (a === 'sent') return 'deep.rcSent';
    if (a === 'misled' || a === 'dead') return 'deep.rcReached';
    if (a === 'paid') return 'deep.rcPaid';
    return 'deep.rcDefault';
  };
  EV.consult = function* () {
    var g = G(), D2 = who('Dagny Scalebeam'), f = F();
    var sx = f.free(g.x, g.y + 1) ? g.x : g.x - 1, sy = f.free(g.x, g.y + 1) ? g.y + 1 : g.y;
    var ing = spawn({ id: 'ingrithDoor', x: sx, y: sy, look: 'ingrith', dir: 'right' });
    yield DS.say(L('deep.consult1'));
    if (g.flags.countDone) yield DS.say(L('deep.consultCount'), who('Ingrith Scalebeam'));
    ing.path = DS.pathTo(f.map, ing.x, ing.y, 16, 8).concat(['face:right']);
    yield arrived([ing]);
    DS.audio.sfx('door'); DS.flashColor = '#F8E0A0'; DS.flashAlpha = 0.25; yield W8.frames(10); DS.flashColor = null;
    yield DS.say(L('deep.consult2'));
    ing.hidden = true;
    g.guests = (g.guests || []).filter(function (x) { return x.id !== 'ingrith'; });
    yield DS.say(L('deep.consult3'), D2);
    yield DS.say(L('deep.dagnyStaff'), D2);
    g.give('sunshaftstaff', 1); DS.audio.sfx('chest');
    yield DS.say(L('g.got', { item: DS.DATA.items.sunshaftstaff.name }));
    var au = g.hero('aurdin');
    if (au) { var eq = yield DS.ask(L('winters.equipAsk', { name: au.name }), ['YES', 'NO']); if (eq === 0) { if (au.equip.weapon && au.equip.weapon !== 'unarmed') g.give(au.equip.weapon, 1); g.take('sunshaftstaff', 1); au.equip.weapon = 'sunshaftstaff'; DS.audio.sfx('confirm'); } }
    yield* EV.milestone(5000, 'deep.mileDoor'); // the one milestone that stands (re-cut §3, RULED 09-26d: 5,000)
    g.flags.expansionDone = 1;
    yield DS.say(L('deep.consultEnd'));
    yield* EV.expansionEnd();
  };
  EV.expansionEnd = function* () {
    var g2 = G(), base = DS.DATA.credits, lines = [{ t: 'DRAGONSLEEP', big: true }, { t: 'Behind the Fountains', c: '#C8D0E8', gap: 16 }];
    base.slice(2).forEach(function (l) {
      if (l.t === 'Thanks for playing.') {
        lines.push({ t: L(EV.receiptKey()), c: '#E0C8A0', gap: 20 });
        lines.push({ t: 'DEEPHOLM', c: '#F8D878' }); lines.push({ t: 'Coming in an expansion.', gap: 6 });
        lines.push({ t: 'Donate to support it: ' + DS.DATA.config.kofi.replace(/^https?:\/\//, ''), c: '#F8A4C0', gap: 24 });
      }
      lines.push(l);
    });
    DS.audio.play('ending', true);
    yield DS.fade(1, 40);
    DS.clearScenes(); DS.fadeLevel = 0;
    DS.push(new DS.Credits(true, { lines: lines, title: 'THE ROAD IS HELD', prompt: L('deep.afterPrompt'), onContinue: function* () {
      DS.clearScenes();
      var f2 = DS.field = new DS.Field(); DS.push(f2);
      // the Sunshaft floor (Solskaft widened ten columns west in the re-cut)
      f2.load('solskaft', 28, 20, 'down'); DS.fadeLevel = 0;
      yield DS.say(L('deep.afterMorning'));
    }, pastDoor: (g2.flags.expansionDone || g2.flags.highwaySecured) ? EV.pastTheDoor : null }));
  };
  // PAST THE DOOR (the DEEP16 POC's seam, handoff-2026-09-26-deep16-poc-spec.md §4): the save as it stands goes into
  // `deep16.handoff` (same origin, one localStorage) and the page goes to deep16/, which reads it. No slot is written.
  // The visual crossing (the frame gaining resolution) is a later handoff.
  EV.pastTheDoor = function () {
    var g3 = G();
    var snap = JSON.parse(JSON.stringify({ v: g3.v, lead: g3.lead, party: g3.party, inv: g3.inv, silver: g3.silver, flags: g3.flags, renown: g3.renown, map: g3.map, x: g3.x, y: g3.y, dir: g3.dir, steps: g3.steps, time: g3.time, kills: g3.kills, hired: g3.hired, guests: g3.guests || [] }));
    DS.store.set('deep16.handoff', { at: Date.now(), save: snap });
    window.location.href = 'deep16/';
  };

  // ================================================================== the smoke (spec §12): Tam Vere's couch on vice row
  S.tam = function* (npc, D) {
    var g = G(), T2 = who('Tam Vere');
    if (!g.flags.lakeDone) { yield* EV.dialog(D); return; }
    if (g.flags.smokeDreamt && !g.flags.tamAfterSaid) { g.flags.tamAfterSaid = 1; yield DS.say(L('deep.tamAfter'), T2); }
    else if (g.flags.torvaldMet && g.flags.torvaldFate !== 'dead' && !g.flags.tamDwarfSaid) { g.flags.tamDwarfSaid = 1; yield DS.say(L('deep.tamDwarf'), T2); }
    var a = yield DS.ask(L('deep.tamOffer'), ['THE COUCH (5 SP)', 'THE COMMON PIPE (1 SP)', 'NOT TONIGHT'], T2);
    if (a === 1) { // a short rest in town: the pipe's own use
      if (!EV.pay(1)) { yield DS.say(L('g.poor')); return; }
      yield DS.fade(1, 16); yield W8.frames(40);
      g.party.forEach(function (x) { if (!x.ko) x.hp = Math.min(x.maxhp, x.hp + Math.ceil(x.maxhp / 2)); R.refresh(x, false); });
      yield DS.fade(0, 16);
      yield DS.say(L('deep.tamPipe'));
      return;
    }
    if (a !== 0) return;
    if (!EV.pay(5)) { yield DS.say(L('g.poor')); return; }
    var again = !!g.flags.smokeDreamt;
    yield DS.say(L(again ? 'deep.tamCouchAgain' : 'deep.tamCouch'), T2);
    yield DS.fade(1, 30);
    DS.fadeLevel = 0;
    yield W8.scene(new DS.SmokeScene({ again: again }));
    g.flags.smokeDreamt = 1;
    DS.audio.play(F().map.music || 'town', true);
    yield DS.fade(0, 1);
  };

  // ================================================================== the sidequests (spec §10, the seat's order: 3 6 9 1 5 10 2 4 7 8)
  // 3. put it back: Brann knows whose they were; or the sack goes to Vera, and a rumor follows the party down the road
  DS.battleHooks = (DS.battleHooks || []).concat([function* (b) {
    var g = G();
    if (g.flags.sackReturned && !g.flags.brannSackSaid && b.heroes.some(function (u) { return u.guest && u.h.id === 'brann'; })) {
      g.flags.brannSackSaid = 1;
      yield* b.hold(L('deep.brannSack'));
    }
  }]);
  S.vera = function* (npc, D) {
    var g = G();
    if (g.has('crewsack')) {
      var a = yield DS.ask(L('deep.veraSack'), ['SELL IT (80 SP)', 'NO'], who('Vera'));
      if (a === 0) { g.take('crewsack', 1); g.silver += 80; g.flags.sackSold = 1; DS.audio.sfx('coin'); yield DS.say(L('deep.veraBought'), who('Vera')); return; }
    }
    yield* EV.dialog(D);
  };
  // 6. Brann's father's axe, under the drow's leavings at Third Lamp
  S.leavings = function* () {
    var g = G();
    if (g.flags.axeGiven || g.flags.axeKept || g.has('fatheraxe')) { yield DS.say(L('deep.leavingsDone')); return; }
    yield DS.say(L('deep.leavings'));
    var here = !!EV.npc('brannLamp');
    var a = yield DS.ask(L('deep.axeAsk'), [here ? 'GIVE IT TO BRANN' : 'TAKE IT UP TO BRANN', 'KEEP IT']);
    if (a === 0 && here) { g.flags.axeGiven = 1; DS.audio.sfx('confirm'); yield DS.say(L('deep.axeGiven'), who('Brann Silversands')); return; }
    g.give('fatheraxe', 1); DS.audio.sfx('chest');
    if (a === 0) { g.flags.axeCarried = 1; yield DS.say(L('g.got', { item: DS.DATA.items.fatheraxe.name })); return; }
    g.flags.axeKept = 1; yield DS.say([L('deep.axeKept'), L('g.got', { item: DS.DATA.items.fatheraxe.name })]);
  };
  S.brannYard = function* (npc, D) {
    var g = G();
    if (g.flags.axeCarried && g.has('fatheraxe')) { unequip('fatheraxe'); g.take('fatheraxe', 1); g.flags.axeGiven = 1; delete g.flags.axeCarried; DS.audio.sfx('confirm'); yield DS.say(L('deep.axeGiven'), who('Brann Silversands')); return; }
    if (g.flags.axeGiven) { yield DS.say(L('deep.brannAfter'), who('Brann Silversands')); return; }
    yield* EV.dialog(D);
  };
  // 9. the heir in the Stacks: a family that isn't dead yet
  var baseChapel = S.chapel;
  S.chapel = function* () {
    var g = G(), A2 = who('Aldwin');
    if (g.flags.pyroTrusts && !g.flags.heirAsked) { g.flags.heirAsked = 1; yield DS.say(L('deep.heirAldwin'), A2); }
    else if (g.flags.heirDone && !g.flags.aldwinAfter) { g.flags.aldwinAfter = 1; yield DS.say(L('deep.aldwinAfter'), A2); }
    yield* baseChapel();
  };
  S.hobHeir = function* (npc, D) {
    var g = G();
    if (g.flags.heirAsked && !g.flags.heirHint) { g.flags.heirHint = 1; yield DS.say(L('deep.heirHob'), who('Old Hob')); return; }
    yield* EV.dialog(D);
  };
  S.signy = function* () {
    var g = G(), SG = who('The rope-maker');
    if (!g.flags.heirAsked) { yield DS.say(L('deep.signy0'), SG); return; }
    if (g.flags.heirFound) { yield DS.say(L('deep.signyWaits'), who('Signy')); return; }
    if (!g.flags.heirHint && !(yield* EV.check('Investigation', 'int', 14))) { yield DS.say(L('deep.signyNo'), SG); return; }
    yield DS.say(L('deep.signyReveal'), who('Signy'));
    g.flags.heirFound = 1; g.flags.pin = 'heir';
  };
  EV.heirRite = function* () { // at Asmund's wedge: the ledger records an heir; the gear comes off the bodies lawfully
    var g = G(), f = F(), keeper = g.flags.ingrithEscort ? 'The ledger-clerk' : 'Ingrith Scalebeam';
    var sg = spawn({ id: 'signyRite', x: g.x - 1, y: g.y + 1, look: 'signy', dir: 'up' }), ig = spawn({ id: 'ingrithRite', x: g.x + 1, y: g.y + 1, look: g.flags.ingrithEscort ? 'dclerk' : 'ingrith', dir: 'up' });
    yield DS.say(L('deep.heirRite1'));
    yield DS.say(L('deep.heirRite2'), who(keeper));
    yield DS.say(L('deep.heirRite3'), who('Signy'));
    unlawful(); g.flags.unlawful = g.flags.unlawful.filter(function (id) { return id !== 'asmundhammer'; });
    if (!g.has('asmundhammer')) g.give('asmundhammer', 1);
    g.flags.asmundTaken = 1; g.flags.heirDone = 1; DS.audio.sfx('chest');
    yield DS.say(L('g.got', { item: DS.DATA.items.asmundhammer.name }));
    yield* EV.renown(1, 'renown.heir');
    sg.path = ['wait30', 'hide']; ig.path = ['wait30', 'hide'];
  };
  var baseNiche = S.niche;
  S.niche = function* () {
    var g = G(), f = F(), p = f.facing(), info = (f.map.src.niches || {})[p[0] + ',' + p[1]];
    if (info && info[2] === 'gear' && info[0] === 5 && g.flags.heirReady && !g.flags.heirDone) { yield* EV.heirRite(); return; }
    yield* baseNiche();
  };
  // 1. the standard weights: RETIRED 09-26d (Griz: "retire it"; the party gets passage, not communion with Silverton)
  // 10. the wheelwright, at Brennan's forge
  var baseKeeper = S.keeper;
  S.keeper = function* (id) {
    var g = G();
    if (id === 'brennan' && (g.flags.wheelwrightRan || g.flags.crewOwed) && g.flags.crewDealt && g.flags.pyroTrusts && !g.flags.wwDone) { yield* EV.wheelwright(); return; }
    if (id === 'androit' && g.flags.countAsked && !g.flags.countDone && !g.flags.androitSaid) { g.flags.androitSaid = 1; yield DS.say(L('deep.androitCount'), who('Aldwyn Androit')); return; }
    if (id === 'mical' && g.has('tariffcopy') && !g.flags.tariffDone) { g.take('tariffcopy', 1); g.flags.tariffDone = 1; yield DS.say(L('deep.micalTariff'), who('Mical')); return; }
    yield* baseKeeper(id);
  };
  EV.wheelwright = function* () {
    var g = G(), WW = who('The wheelwright');
    yield DS.say(L('deep.wwFound'));
    yield DS.say(L('deep.wwPlea'), WW);
    var opts = ['HAND HIM TO INGRITH', 'HAND HIM TO THE LEDGER'], vals = ['lift', 'ledger'];
    if (g.flags.crewOwed) { opts.push('LET HIM HIDE'); vals.push('hide'); }
    var a = vals[yield DS.ask(L('deep.wwAsk'), opts)];
    g.flags.wwDone = a;
    if (a === 'lift') { g.flags.wwLift = 1; yield DS.say(L('deep.wwLift')); }
    else if (a === 'ledger') { g.flags.wwLedger = 1; yield DS.say(L('deep.wwLedger')); yield* EV.renown(1, 'renown.wheelwright'); }
    else { g.flags.wwHidden = 1; yield DS.say(L('deep.wwHidden'), WW); }
  };
  // 2. the count: Idony copies one page, for a price that isn't silver
  S.idony = function* (npc, D) {
    var g = G(), ID = who('Idony Fell');
    if (g.flags.countAsked && !g.flags.idonyAsked) { g.flags.idonyAsked = 1; yield DS.say(L('deep.idonyPrice'), ID); return; }
    if (g.flags.idonyAnswer && !g.flags.countPage) {
      g.flags.countPage = 1; g.give('recordpage', 1); DS.audio.sfx('chest');
      yield DS.say([L('deep.idonyCopies'), L('g.got', { item: DS.DATA.items.recordpage.name })], ID);
      return;
    }
    yield* EV.dialog(D);
  };
  // 4. the keeper's water: Ragna reverses the siphon if you hold the stair
  S.ragna = function* (npc, D) {
    var g = G(), RG = who('Ragna Copperbottom');
    if (g.flags.pyroTrusts && !g.flags.waterAsked && !g.flags.keeperWater) { g.flags.waterAsked = 1; yield DS.say(L('deep.ragnaWater'), RG); return; }
    if (g.flags.keeperWater) { yield DS.say(L('deep.ragnaAfter'), RG); return; }
    yield* EV.dialog(D);
  };
  S.holdStair = function* () {
    var g = G();
    yield DS.say(L('deep.holdStair'));
    var res = yield* EV.fight(['crewboss', 'thug', 'thug', 'robber', 'robber'], { bg: 'dwarf', music: 'boss', canRun: true, deep16: 'stair' }); // (DEEP16: the siphon)
    if (res !== 'win') { if (res === 'run') yield F().walk(['right']); return; }
    yield DS.fade(1, 30);
    yield DS.say(L('deep.holdNights'), { top: true });
    g.flags.keeperWater = 1; DS.applyFlagTiles(F().map);
    yield DS.fade(0, 30);
    yield DS.say(L('deep.waterBack'));
  };
  var baseStair = S.stair;
  S.stair = function* () { if (G().flags.keeperWater) { yield DS.say(L('deep.stairFlooded')); return; } yield* baseStair(); };
  // 7. the tariff board's last lines, carried up to Mical; and a reason for Tobin to stay
  S.tariff = function* () {
    var g = G();
    yield DS.say(L('deep.tariffRead'));
    if (!g.has('tariffcopy') && !g.flags.tariffDone) { g.give('tariffcopy', 1); DS.audio.sfx('chest'); yield DS.say([L('deep.tariffCopy'), L('g.got', { item: DS.DATA.items.tariffcopy.name })]); }
  };
  // 8. the curl of copper: Winters pays; Lucia takes it
  var baseShop = S.shop;
  S.shop = function* (id) {
    var g = G();
    if (id === 'marko' && g.flags.tariffDone && !g.flags.tobinSaid) { g.flags.tobinSaid = 1; yield DS.say(L('deep.tobin'), who('Tobin Thorne')); }
    if (id === 'lucia' && g.has('copperscraping') && !g.flags.curlDone) {
      var a = yield DS.ask(L('deep.luciaCurl'), ['GIVE IT HER', 'NO'], who('Lucia'));
      if (a === 0) { g.take('copperscraping', 1); g.flags.curlDone = 'lucia'; yield DS.say(L('deep.luciaTook'), who('Lucia')); }
    }
    if (id === 'lucia' && g.flags.curlDone === 'lucia') { var def = JSON.parse(JSON.stringify(DS.DATA.shops.lucia)); def.prices = def.prices || {}; def.prices.antitoxin = 250; def.greeting = L('deep.luciaAtCost'); yield W8.scene(new DS.Shop(def)); return; }
    yield* baseShop(id);
  };
  var baseWinters = S.winters;
  S.winters = function* () {
    var g = G();
    if (g.has('copperscraping') && !g.flags.curlDone) {
      var a = yield DS.ask(L('deep.wintersCurl'), ['SELL IT (500 SP)', 'NOT THIS'], who('Ambrose Winters'));
      if (a === 0) { g.take('copperscraping', 1); g.silver += 500; g.flags.curlDone = 'winters'; DS.audio.sfx('coin'); yield DS.say(L('deep.wintersPaid'), who('Ambrose Winters')); return; }
    }
    yield* baseWinters();
  };

  // talk that comes first, once, when its condition holds (the town telling you what you did: spec §11 consequences as rumor)
  var baseTalk = EV.talk;
  EV.talk = function* (npc) {
    var g = G(), D = DS.DATA.npcs[npc.id];
    var pre = D && (D.before || []).filter(function (b) { return DS.cond(b['if']) && !g.flags['said:' + D.id + ':pre:' + b.key]; })[0];
    if (pre) { g.flags['said:' + D.id + ':pre:' + pre.key] = 1; yield DS.say(pre.say, who(pre.who || D.name)); return; }
    yield* baseTalk(npc);
  };
})();
