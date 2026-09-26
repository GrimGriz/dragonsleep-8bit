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
    var h = hands.slice().sort(function (a, b) { return R.skill(b, skill, ab) - R.skill(a, skill, ab); })[0] || g.main();
    var mod = R.skill(h, skill, ab), r1 = DS.d(20), r2 = DS.d(20), nat = o.adv ? Math.max(r1, r2) : r1, total = nat + mod, ok = total >= dc;
    yield W8.scene(new CheckScene({ skill: skill, dc: dc, name: h.name, mod: mod, nat: nat, total: total, ok: ok, adv: o.adv }));
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
    var k = 'pyroIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    var lines = ['deep.pyro1', 'deep.pyro2', 'deep.pyro3'];
    if (g.flags.shieldTaken && !unlawful().length && g.flags.warrantShield) lines.push('deep.pyroShield');
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
    if (g.flags.warrantShield && !g.flags.shieldTaken) { yield DS.say(L('deep.ingrithShieldHint'), I2); return; }
    if (g.has('crewsack')) { yield DS.say(L('deep.ingrithSack'), I2); return; }
    var k = 'ingrithIdx', i = g.flags[k] || 0; g.flags[k] = i + 1;
    yield DS.say(L(['deep.ingrithOffice1', 'deep.ingrithOffice2', 'deep.ingrithOffice3'][i % 3]), I2);
  };
  S.quartermaster = function* () { yield DS.shop('qm'); };
  S.dsmith = function* () { yield DS.shop('copperbottom'); };
  S.cot = function* () {
    yield DS.say(L('deep.cot'));
    yield* EV.rest('inn');
    var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
    if (s === 0) yield W8.scene(new DS.SlotScene(true));
  };
  S.treasury = function* () { yield DS.say(L('deep.treasury')); };
  S.highwayGate = function* () { yield DS.say(L('deep.gateShut'), who('Gate watch')); };

  // talk that comes first, once, when its condition holds (the town telling you what you did: spec §11 consequences as rumor)
  var baseTalk = EV.talk;
  EV.talk = function* (npc) {
    var g = G(), D = DS.DATA.npcs[npc.id];
    var pre = D && (D.before || []).filter(function (b) { return DS.cond(b['if']) && !g.flags['said:' + D.id + ':pre:' + b.key]; })[0];
    if (pre) { g.flags['said:' + D.id + ':pre:' + pre.key] = 1; yield DS.say(pre.say, who(pre.who || D.name)); return; }
    yield* baseTalk(npc);
  };
})();
