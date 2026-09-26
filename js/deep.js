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
  };
  // roll it for the best hand in the party (or the one named), show it, return whether it held
  EV.check = function* (skill, ab, dc, o) {
    o = o || {};
    var g = G(), hands = o.hero ? [o.hero] : g.party.filter(function (h) { return !h.ko; });
    var sorted = hands.slice().sort(function (a, b) { return R.skill(b, skill, ab) - R.skill(a, skill, ab); });
    // a group check (all of you creeping up together) rides on the middle of the party, not its best
    var h = (o.group ? sorted[Math.floor((sorted.length - 1) / 2) + (sorted.length > 2 ? 1 : 0)] : sorted[0]) || g.main();
    var mod = R.skill(h, skill, ab), r1 = DS.d(20), r2 = DS.d(20), nat = o.adv ? Math.max(r1, r2) : r1, total = nat + mod, ok = total >= dc;
    yield W8.scene(new CheckScene({ skill: skill, dc: dc, name: o.group ? 'The party, at ' + h.name + "'s pace" : h.name, mod: mod, nat: nat, total: total, ok: ok, adv: o.adv }));
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
  function* crewGo(withSack) { // up the drained stair, and gone
    var f = F(), list = crewNpcs();
    list.forEach(function (n, k) { n.pathSpeed = 1; n.path = ['wait' + (k * 10)].concat(DS.pathTo(f.map, n.x, n.y, 2, 3), ['left', 'hide']); n.solid = false; });
    yield arrived(list);
    f.npcs = f.npcs.filter(function (n) { return list.indexOf(n) < 0; });
  }
  S.crew = function* () {
    var g = G(), back = !!g.flags.crewBack, viv = g.hero('vivian');
    if (viv && viv.ko) viv = null;
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
        yield F().walk(['left']);
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
        var res = yield* EV.fight(['hask', 'wheelwright', 'crewman', 'crewman'], { bg: 'dwarf', music: 'boss', canRun: true, introText: L('deep.crewFight') });
        if (res === 'win') {
          g.flags.crewDealt = 1; if (back) g.flags.noEscort = 1; delete g.flags.crewBack;
          F().refreshNpcs();
          g.give('crewsack', 1); DS.audio.sfx('chest');
          yield DS.say([L(g.flags.wheelwrightRan ? 'deep.crewDownRan' : 'deep.crewDown'), L('g.got', { item: DS.DATA.items.crewsack.name })]);
          yield* EV.ingrithArrives();
        } else if (res === 'run') { g.flags.crewLeft = 1; yield F().walk(['left']); }
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
  EV.ingrithArrives = function* () {
    var g = G(), f = F(), I2 = who('Ingrith Scalebeam');
    var y = g.y, sx = Math.min(37, g.x + 9);
    var ing = spawn({ id: 'ingrithB', x: sx, y: y, look: 'ingrith', dir: 'left', lantern: true });
    var t1 = spawn({ id: 'escortB1', x: Math.min(37, sx + 1), y: y === 3 ? 4 : 3, look: 'dtrooper', dir: 'left' });
    var t2 = spawn({ id: 'escortB2', x: Math.min(37, sx + 2), y: y, look: 'dtrooper2', dir: 'left' });
    yield DS.say(L('deep.ingrithLamp'));
    function run(n, stopX) { var p = []; for (var x = n.x; x > stopX; x--) p.push('left'); return p; }
    ing.path = run(ing, g.x + 1); t1.path = run(t1, g.x + 2); t2.path = run(t2, g.x + 3);
    yield arrived([ing, t1, t2]);
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
    yield DS.say(L(g.flags.noEscort ? 'deep.ingrithOfferAlone' : 'deep.ingrithOffer'), I2);
    g.flags.clericMet = 1; g.flags.frontDoor = 1; g.flags.pin = 'solskaft';
    yield DS.say(L('deep.ingrithWarrant'), I2);
    g.flags.warrantShield = 1;
    if (g.has('crewsack')) yield DS.say(L('deep.ingrithSack'), I2);
    yield DS.say(L('deep.ingrithBars'));
    DS.audio.sfx('door');
    DS.applyFlagTiles(f.map);
    yield DS.say(L('deep.ingrithStair'), I2);
    yield* ingrithGoes([ing, t1, t2]);
    yield* EV.milestone(2500, 'deep.mileCrew');
  };
  function* ingrithGoes(list) { // back along the tier to their stair; the player is free to move while they go
    list.forEach(function (n, k) { n.pathSpeed = 2; n.path = ['face:right', 'wait' + (6 + k * 6)]; for (var x = n.x; x < 37; x++) n.path.push('right'); n.path.push('hide'); });
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
  };
  S.pyroMeet = function* () { // the first meeting, through the open door, on Ingrith's warrant (spec §4.4)
    var g = G(), p = EV.npc('pyro');
    g.flags.pyroMet = 1;
    if (p) { faceTo(p, g.x, g.y); }
    yield DS.say(L('deep.pyroSees'));
    yield DS.say(L('deep.pyroFirst'), who('Pyronimus'));
  };
  S.pyro = function* (npc) {
    var g = G(), P = who('Pyronimus');
    if (!g.flags.pyroMet) { yield* S.pyroMeet(); return; }
    if (g.flags.highwaySecured && !g.flags.pyroConsent) { g.flags.pyroConsent = 1; yield DS.say(L('deep.pyroSecured'), P); return; } // beat 9: the king's word
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
    if (g.flags.warrantShield && !g.flags.shieldTaken) { yield DS.say(L('deep.ingrithShieldHint'), I2); return; }
    if (g.has('crewsack')) { yield DS.say(L('deep.ingrithSack'), I2); return; }
    if (g.has('recordpage')) { g.take('recordpage', 1); g.flags.countDone = 1; DS.audio.sfx('confirm'); yield DS.say(L('deep.ingrithPage'), I2); return; }
    if (g.flags.heirFound && !g.flags.heirReady) { g.flags.heirReady = 1; yield DS.say(L('deep.ingrithHeir'), I2); return; }
    if (g.flags.idonyAsked && !g.flags.idonyAnswer) { g.flags.idonyAnswer = 1; yield DS.say(L('deep.ingrithAnswer'), I2); return; }
    if (!g.flags.weightsGiven) { g.flags.weightsGiven = 1; g.give('weights', 1); DS.audio.sfx('chest'); yield DS.say([L('deep.ingrithWeights'), L('g.got', { item: DS.DATA.items.weights.name })], I2); return; }
    if (!g.flags.countAsked) { g.flags.countAsked = 1; yield DS.say(L('deep.ingrithCount'), I2); return; }
    var k = 'ingrithIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    yield DS.say(L(['deep.ingrithOffice1', 'deep.ingrithOffice2', 'deep.ingrithOffice3'][i % 3]), I2);
  };
  S.quartermaster = function* () { yield DS.shop('qm'); };
  S.cot = function* () {
    yield DS.say(L('deep.cot'));
    yield* EV.rest('inn');
    var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
    if (s === 0) yield W8.scene(new DS.SlotScene(true));
  };
  S.treasury = function* () { yield DS.say(L('deep.treasury')); };

  // ================================================================== the highway (spec §6): three days, three lamps
  // guests: AI-run allies with a stat block and a leave-condition (spec §6.2, RULED 09-26: general, the escorts first)
  EV.addGuest = function (id) {
    var g = G(), d = DS.DATA.heroes[id];
    g.guests = g.guests || [];
    if (g.guests.some(function (x) { return x.id === id; })) return;
    var h = R.makeHero(id, d.level);
    h.attacks = d.attacks; h.resist = d.resist; h.guest = true;
    if (d.healer) { h.healer = d.healer; h.feats.heals = d.healer; }
    g.guests.push({ id: id, h: h });
  };
  EV.dropGuests = function () { G().guests = []; };
  // milestone XP: the road pays at its lamps (spec §9)
  EV.milestone = function* (xp, key) {
    var g = G(), ups = [];
    g.party.forEach(function (h) { if (!h.ko) ups = ups.concat(R.gainXP(h, xp)); });
    DS.audio.sfx('levelup');
    yield DS.say(L('deep.milestone', { n: xp, why: L(key) }));
    if (ups.length) yield DS.say(ups);
  };
  var LAMPS_AT = { 1: ['highway_1', 65, 10], 2: ['highway_2', 68, 11], 3: ['highway_3', 66, 11] };
  var LAMP_NAME = { 1: 'THE FIRST LAMP', 2: 'THE SECOND LAMP', 3: 'THE THIRD LAMP' };
  EV.lampWalk = function* (map, x, y, dir, key) { // "a walk back up the lamps": a fade, a line, and you're there
    yield DS.fade(1, 20);
    yield DS.say(L(key), { top: true, auto: 70 });
    DS.field.load(map, x, y, dir); DS.field.banner = 90;
    yield DS.fade(0, 20);
  };
  EV.roadMenu = function* (here) { // fast travel: a held lamp is a warp point (spec §6.2)
    var g = G(), opts = [], vals = [];
    if (here !== 'gate') { opts.push('REST HERE'); vals.push('rest'); opts.push('BACK UP TO SOLSKAFT'); vals.push('up'); }
    [1, 2, 3].forEach(function (n) { if (g.flags['lamp' + n] && n !== here) { opts.push('TO ' + LAMP_NAME[n]); vals.push(n); } });
    if (here === 'gate') { opts.unshift('WALK THE ROAD'); vals.unshift('walk'); }
    opts.push('NOT NOW'); vals.push('no');
    var a = vals[yield DS.ask(L(here === 'gate' ? 'deep.roadMenuGate' : 'deep.roadMenuLamp'), opts)];
    if (a === 'rest') {
      yield* EV.rest('inn');
      var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
      if (s === 0) yield W8.scene(new DS.SlotScene(true));
    } else if (a === 'up') yield* EV.lampWalk('solskaft_deep', 36, 11, 'left', 'deep.walkUp');
    else if (typeof a === 'number') { var at = LAMPS_AT[a]; yield* EV.lampWalk(at[0], at[1], at[2], 'right', a > (here === 'gate' ? 0 : here) ? 'deep.walkDown' : 'deep.walkUp'); }
  };
  // the muster at the gate: the escort comes down, Ingrith's lamp, the gate opens (spec §3 beat 5)
  S.highwayGate = function* () {
    var g = G(), GW = who('Gate watch');
    if (!g.flags.clericMet) { yield DS.say(L('deep.gateShut'), GW); return; }
    if (g.flags.roadOpen) { yield* EV.roadMenu('gate'); return; }
    var f = F();
    yield DS.say(L('deep.musterCome'));
    if (!g.flags.noEscort) {
      var b = spawn({ id: 'brannMuster', x: 30, y: 10, look: 'brann', dir: 'right' }), hd = spawn({ id: 'heddaMuster', x: 30, y: 12, look: 'hedda', dir: 'right' });
      b.path = DS.pathTo(f.map, 30, 10, g.x - 1, g.y - 1); hd.path = DS.pathTo(f.map, 30, 12, g.x - 1, g.y + 1);
      yield arrived([b, hd]);
      faceTo(b, g.x, g.y); faceTo(hd, g.x, g.y);
      yield DS.say(L('deep.heddaOrders'), who('Hedda Greyseam'));
      yield DS.say(L('deep.brannGo'), who('Brann Silversands'));
      EV.addGuest('brann'); EV.addGuest('hedda');
      DS.audio.sfx('levelup');
      yield DS.say(L('deep.guestsJoin'));
      b.hidden = true; hd.hidden = true;
    } else yield DS.say(L('deep.musterAlone'), GW);
    g.give('ledgerlamp', 1); DS.audio.sfx('chest');
    yield DS.say([L('deep.ledgerlamp'), L('g.got', { item: DS.DATA.items.ledgerlamp.name })], GW);
    g.flags.roadOpen = 1; if (!g.flags.noEscort) g.flags.escortsOut = 1;
    DS.audio.sfx('door'); DS.applyFlagTiles(f.map);
    yield DS.say(L('deep.gateOpens'));
  };
  // a lamp reached ends the day (spec §6.2)
  S.lampArrive = function* (n) {
    var g = G(), guests = (g.guests || []).length > 0;
    g.flags['lamp' + n] = 1;
    if (n === 1) {
      yield DS.say(L('deep.lamp1Arrive'));
      yield DS.say(L('deep.ulf1'), who('Ulf Silversands'));
      if (guests) yield DS.say(L('deep.lamp1Brann'), who('Brann Silversands'));
    } else {
      yield DS.say(L('deep.lamp2Arrive'));
      if (guests) { yield DS.say(L('deep.lamp2Brann'), who('Brann Silversands')); yield DS.say(L('deep.lamp2Hedda'), who('Hedda Greyseam')); }
      yield DS.say(L('deep.lamp2Night'));
    }
    yield* EV.rest('inn');
    yield* EV.milestone(n === 1 ? 4000 : 7000, n === 1 ? 'deep.mileLamp1' : 'deep.mileLamp2');
    yield DS.say(L(n === 1 ? 'deep.day2' : 'deep.day3'), { top: true });
    var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
    if (s === 0) yield W8.scene(new DS.SlotScene(true));
  };
  S.lampTower = function* (n) {
    var g = G();
    if (n === 2 && !g.flags.lamp2Lit) {
      yield DS.say(L('deep.lamp2Dark'));
      var asked = g.flags.slatesAsked || {};
      while (true) {
        var opts = [], vals = [];
        if (!asked.read) { opts.push('READ THE SLATES (INVESTIGATION 12)'); vals.push('read'); }
        if (!asked.why) { opts.push('WHY IS IT DARK? (RELIGION 12)'); vals.push('why'); }
        if (g.has('ledgerlamp')) { opts.push('RELIGHT IT ANYWAY'); vals.push('light'); }
        opts.push('THE ROAD'); vals.push('road');
        var a = vals[yield DS.ask(L('deep.lamp2Ask'), opts)];
        if (a === 'read') { asked.read = 1; yield DS.say(L((yield* EV.check('Investigation', 'int', 12)) ? 'deep.slatesYes' : 'deep.slatesNo')); }
        else if (a === 'why') { asked.why = 1; yield DS.say(L((yield* EV.check('Religion', 'int', 12)) ? 'deep.whyYes' : 'deep.whyNo')); }
        else if (a === 'light') { g.flags.lamp2Lit = 1; g.flags.lampDebt = 1; DS.audio.sfx('magic'); yield DS.say(L('deep.lamp2Relit')); break; }
        else break;
        g.flags.slatesAsked = asked;
      }
    } else yield DS.say(L('deep.lampLit'));
    yield* EV.roadMenu(n);
  };
  // nobody sleeps well at a dark lamp: each wakes a hit die short (sidequest 5)
  var baseRest3 = EV.rest;
  EV.rest = function* (song) {
    yield* baseRest3(song);
    var g = G(), m = F() && F().map;
    if (m && m.id === 'highway_2' && !g.flags.lamp2Lit && G().x >= 64) {
      g.party.forEach(function (h) { if (!h.ko) h.hp = Math.max(1, h.maxhp - R.CLASSES[h.cls].hd); });
      yield DS.say(L('deep.darkRest'));
    }
  };
  // leg one: the cut seal and the goblins behind it; the truesilver in the cut
  S.cutSeal = function* () {
    var g = G();
    yield DS.say(L('deep.cutSeal'));
    var res = yield* EV.fight(['bugbearchief', 'hobsergeant', 'goblin', 'goblin', 'goblin', 'worg'], { bg: 'cavern', music: 'boss', canRun: true, introText: L('deep.cutSealIntro') });
    if (res === 'win') { g.flags.sealCleared = 1; yield DS.say(L('deep.cutSealDone')); }
    else if (res === 'run') yield F().walk(['down', 'down']);
  };
  S.vein = function* () {
    var g = G();
    if (g.flags.lumpTaken) { yield DS.say(L('deep.veinDone')); return; }
    if (!g.flags.sealCleared) { yield DS.say(L('deep.veinBusy')); return; }
    g.flags.lumpTaken = 1; g.give('truesilver', 1); DS.audio.sfx('chest');
    yield DS.say([L('deep.vein'), L('g.got', { item: DS.DATA.items.truesilver.name })]);
  };
  // leg two: the roper at the fork (the light shows it), the bulette's breach, the thing in the drainage cut
  S.roper = function* () {
    var g = G();
    var seen = g.flags.roperSeen;
    if (!seen) {
      yield DS.say(L('deep.roperCauseway'));
      if (g.has('ledgerlamp') && (yield* EV.check('Perception', 'wis', 12))) { seen = g.flags.roperSeen = 1; yield DS.say(L('deep.roperSeen')); }
    } else yield DS.say(L('deep.roperAgain'));
    if (seen) {
      var a = yield DS.ask(L('deep.roperAsk'), ['FIGHT IT', 'GO BACK']);
      if (a !== 0) { yield F().walk(['left', 'left']); return; }
      var r1 = yield* EV.fight(['roper'], { bg: 'cavern', music: 'boss', canRun: true, revealed: true });
      if (r1 === 'win') { g.flags.roperDead = 1; yield DS.say(L('deep.roperDone')); } else if (r1 === 'run') yield F().walk(['left', 'left']);
      return;
    }
    yield DS.say(L('deep.roperGrabs'));
    var r2 = yield* EV.fight(['roper'], { bg: 'cavern', music: 'boss', canRun: true, surprised: 'party' });
    if (r2 === 'win') { g.flags.roperDead = 1; g.flags.roperSeen = 1; yield DS.say(L('deep.roperDone')); } else if (r2 === 'run') { g.flags.roperSeen = 1; yield F().walk(['left', 'left']); }
  };
  S.bulette = function* () {
    var g = G();
    yield DS.say(L('deep.bulette'));
    var res = yield* EV.fight(['bulette'], { bg: 'cavern', music: 'boss', canRun: true });
    if (res === 'win') { g.flags.buletteDead = 1; yield DS.say(L('deep.buletteDone')); if ((g.guests || []).length) yield DS.say(L('deep.buletteHedda'), who('Hedda Greyseam')); }
  };
  S.drainCut = function* () {
    var g = G();
    yield DS.say(L('deep.drain'));
    var a = yield DS.ask(L('deep.drainAsk'), ['FIGHT IT', 'BACK AWAY']);
    if (a !== 0) { yield F().walk(['up']); return; }
    var res = yield* EV.fight(['pudding'], { bg: 'cavern', music: 'boss', canRun: true });
    if (res === 'win') { g.flags.puddingDead = 1; yield DS.say(L('deep.drainDone')); } else if (res === 'run') yield F().walk(['up']);
  };
  // leg three: the xorn in the wall, and the raid on Third Lamp (the capstone)
  S.xorn = function* () {
    var g = G();
    yield DS.say(L('deep.xorn'));
    var res = yield* EV.fight(['xorn'], { bg: 'highway', music: 'boss', canRun: true });
    if (res === 'win') { g.flags.xornDone = 1; yield DS.say(L('deep.xornDone')); }
  };
  S.raid = function* () {
    var g = G(), guests = (g.guests || []).length > 0;
    yield DS.say(L('deep.raidSee'));
    if (guests) { yield DS.say(L('deep.raidBrann'), who('Brann Silversands')); yield DS.say(L('deep.raidHedda'), who('Hedda Greyseam')); }
    var a = yield DS.ask(L('deep.raidAsk'), ['GO IN', 'CREEP UP FIRST']);
    var o = { bg: 'highway', music: 'boss', canRun: false, introText: L('deep.raidIntro') };
    if (a === 1) { if (yield* EV.check('Stealth', 'dex', 13, { group: true })) { o.surprised = 'foes'; yield DS.say(L('deep.raidCrept')); } else yield DS.say(L('deep.raidSpotted')); }
    var res = yield* EV.fight(['drowcaptain', 'spellweaver', 'drow', 'drow', 'drow', 'drow', 'drow'], o);
    if (res !== 'win') return;
    g.flags.lamp3 = 1; g.flags.highwaySecured = 1;
    yield DS.say(L('deep.raidWon'));
    DS.audio.sfx('magic'); DS.applyFlagTiles(F().map);
    yield DS.say(L(guests ? 'deep.lamp3Lit' : 'deep.lamp3LitAlone'));
    yield* EV.milestone(10000, 'deep.mileLamp3');
    if (guests) { yield DS.say(L('deep.escortsStay'), who('Hedda Greyseam')); EV.dropGuests(); F().refreshNpcs(); }
    g.flags.pin = 'thedoor';
    yield DS.say(L('deep.day3End'), { top: true });
  };
  S.captain = function* () { // the Greyseam knife: a sect blade on a garrison captain's body (spec §8: shown, not told)
    var g = G();
    if (!g.flags.lamp3) return;
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
  S.deepholmRoad = function* () { yield DS.say(L('deep.deepRoad')); yield F().walk(['left']); };
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
    (G().guests || []).forEach(function (x) { x.h.ko = false; x.h.conds = {}; R.refresh(x.h, true); if (x.h.healer) x.h.feats.heals = x.h.healer; });
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
      var res = yield* EV.fight(['torvald'], { bg: 'highway', music: 'boss', canRun: false, yieldText: L('deep.tvYield') });
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
      var res = yield* EV.fight(['assassin', 'assassin'], { bg: f.map.bg || 'highway', music: 'boss', canRun: false, surprised: spotted ? null : 'party' });
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
    yield* EV.milestone(13000, 'deep.mileDoor');
    g.flags.expansionDone = 1;
    yield DS.say(L('deep.consultEnd'));
    yield* EV.expansionEnd();
  };
  EV.expansionEnd = function* () {
    var g2 = G(), base = DS.DATA.credits, lines = [{ t: 'DRAGONSLEEP', big: true }, { t: 'Behind the Fountains', c: '#C8D0E8', gap: 16 }];
    base.slice(2).forEach(function (l) {
      if (l.t === 'Thanks for playing.') {
        lines.push({ t: L(EV.receiptKey()), c: '#E0C8A0', gap: g2.flags.lampDebt ? 8 : 20 });
        if (g2.flags.lampDebt) lines.push({ t: L('deep.rcDebt'), c: '#E0C8A0', gap: 20 });
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
      f2.load('solskaft', 18, 20, 'down'); DS.fadeLevel = 0;
      yield DS.say(L('deep.afterMorning'));
    } }));
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
    if (g.flags.frontDoor && !g.flags.heirAsked) { g.flags.heirAsked = 1; yield DS.say(L('deep.heirAldwin'), A2); }
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
  // 1. the standard weights: Hessle's scales, proved wrong in front of the board
  var baseHessle = S.hessle;
  S.hessle = function* (npc, D) {
    var g = G(), H3 = who('Hessle');
    if (g.has('weights') && !g.flags.weightsDone) {
      yield DS.say(L('deep.weights1'));
      yield DS.say(L('deep.weights2'), H3);
      var a = yield DS.ask(L('deep.weightsAsk'), ['EXPOSE HIM', 'WARN HIM', 'SELL IT TO FALSTAFF']);
      g.flags.weightsDone = a === 0 ? 'exposed' : a === 1 ? 'warned' : 'sold';
      if (a === 0) { yield DS.say(L('deep.weightsExpose')); yield* EV.renown(2, 'renown.weights'); }
      else if (a === 1) yield DS.say(L('deep.weightsWarn'), H3);
      else { g.silver += 150; DS.audio.sfx('coin'); yield DS.say(L('deep.weightsSold'), who('Falstaff')); }
      g.take('weights', 1); yield DS.say(L('deep.weightsBack'));
      return;
    }
    yield* baseHessle(npc, D);
  };
  // 10. the wheelwright, at Brennan's forge
  var baseKeeper = S.keeper;
  S.keeper = function* (id) {
    var g = G();
    if (id === 'brennan' && (g.flags.wheelwrightRan || g.flags.crewOwed) && g.flags.crewDealt && !g.flags.wwDone) { yield* EV.wheelwright(); return; }
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
    if (g.flags.frontDoor && !g.flags.waterAsked && !g.flags.keeperWater) { g.flags.waterAsked = 1; yield DS.say(L('deep.ragnaWater'), RG); return; }
    if (g.flags.keeperWater) { yield DS.say(L('deep.ragnaAfter'), RG); return; }
    yield* EV.dialog(D);
  };
  S.holdStair = function* () {
    var g = G();
    yield DS.say(L('deep.holdStair'));
    var res = yield* EV.fight(['crewboss', 'thug', 'thug', 'robber', 'robber'], { bg: 'dwarf', music: 'boss', canRun: true });
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
