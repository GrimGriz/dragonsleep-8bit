/* DRAGONSLEEP — events: warps, encounters, talk, chests, triggers, and the scripted scenes.
   Every line of story text is looked up from DS.DATA.text (content/text.json), which cites
   its source page per record. */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, W8 = DS.W8;
  var EV = DS.EV = {};
  var S = DS.SCRIPTS = {};
  function G() { return DS.G; }
  function F() { return DS.field; }
  // text lookup with {main} {lead} substitutions; arrays return arrays
  function L(key, vars) {
    var rec = DS.DATA.text[key];
    if (!rec) { console.warn('missing text', key); return '[' + key + ']'; }
    var t = rec.t;
    function sub(s) {
      return s.replace(/\{(\w+)\}/g, function (m, k) {
        if (vars && vars[k] != null) return vars[k];
        if (k === 'main') return G().main().name;
        if (k === 'kofi') return DS.DATA.config.kofi;
        return m;
      });
    }
    return Array.isArray(t) ? t.map(sub) : sub(t);
  }
  DS.L = L;
  function say(key, o, vars) { return DS.say(L(key, vars), o); }
  function sayT(t, o) { return DS.say(t, o); }
  function who(n) { return { who: n }; }

  // ------------------------------------------------------------------ movement & maps
  EV.warp = function* (to, tx, ty, dir, w) {
    var prev = F().map ? F().map.src.name : null;
    yield DS.fade(1, 12);
    F().load(to, tx, ty, dir);
    var nm = F().map.src.name;
    F().banner = (nm !== prev && to !== 'world') ? 100 : 0;
    yield DS.fade(0, 12);
    if (w && w.slide) { DS.audio.sfx('miss'); yield DS.say(L('g.slide')); }
    var hook = S['enter:' + to];
    if (hook) yield* hook();
  };
  EV.onEnter = function (mapId, F) { };
  EV.stepBack = function* (dir) {
    var d = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir] || dir;
    var g = G(), nx = g.x + DS.DIRS[d][0], ny = g.y + DS.DIRS[d][1];
    if (F().free(nx, ny, 'player')) yield F().walk([d]);
  };
  EV.walkPlayer = function (path) { return F().walk(path); };
  EV.npc = function (id) { return F().npcs.filter(function (n) { return n.id === id; })[0]; };
  EV.npcWalk = function (n, path, speed) {
    return { start: function () { n.path = n.path.concat(path); n.pathSpeed = speed || 1; }, update: function () { return !n.moving && !n.path.length; } };
  };

  // ------------------------------------------------------------------ encounters
  EV.pickGroup = function (zone) {
    var Z = DS.DATA.encounters[zone];
    var grp = DS.weighted(Z.groups.filter(function (g) { return DS.cond(g.cond); }));
    var list = [];
    grp.e.forEach(function (e) { var n = e[1] + DS.rint(e[2] - e[1] + 1); for (var i = 0; i < n; i++) list.push(e[0]); });
    return { list: list, grp: grp, Z: Z };
  };
  EV.encounter = function* (zone) {
    var p = EV.pickGroup(zone), m = F().map.src;
    if (!p.list.length) return;
    if (p.grp.flee && Math.random() < p.grp.flee) { yield DS.say(L(p.grp.fleeText || 'w.nightcrewGone')); return; }
    var res = yield DS.battle({ enemies: p.list, bg: p.Z.bg || m.bg, music: p.Z.music, roost: !!m.roost, zone: zone });
    if (res === 'lose') return;
    yield* EV.afterBattle();
  };
  EV.afterBattle = function* () {
    var g = G();
    if (g.flags.roostBroken && !g.flags.roostTold) {
      g.flags.roostTold = 1;
      DS.audio.sfx('error');
      yield DS.say(L('g.roostBroken'));
    }
  };
  EV.fight = function* (enemies, o) {
    var m = F().map.src;
    o = Object.assign({ enemies: enemies, bg: m.bg, roost: !!m.roost }, o || {});
    var res = yield DS.battle(o);
    if (res !== 'lose' && !o.lossOk) yield* EV.afterBattle();
    return res;
  };

  // ------------------------------------------------------------------ talk
  EV.talk = function* (npc) {
    var D = DS.DATA.npcs[npc.id];
    if (!D) { yield DS.say('...'); return; }
    if (D.script && S[D.script]) { yield* S[D.script](npc, D); return; }
    yield* EV.dialog(D);
  };
  EV.dialog = function* (D, nameOverride) {
    var g = G(), name = nameOverride || D.name;
    if (D.rumors && D.rumors.length) {
      var k = 'rumorIdx:' + D.id, i = g.flags[k] || 0;
      var rid = D.rumors[i % D.rumors.length], r = DS.DATA.rumorMap[rid];
      g.flags[k] = i + 1;
      if (D.greet && i === 0) yield DS.say(D.greet, who(name));
      if (r) { g.flags['heard:' + rid] = 1; if (r.flag) g.flags[r.flag] = 1; yield DS.say(r.t, who(name)); }
      return;
    }
    var branches = D.talk || [];
    for (var b = 0; b < branches.length; b++) {
      var br = branches[b];
      if (!DS.cond(br['if'])) continue;
      if (br.once && g.flags['said:' + D.id + ':' + b]) continue;
      g.flags['said:' + D.id + ':' + b] = 1;
      var lines = br.say || [];
      if (lines.length) yield DS.say(lines, who(br.who || name));
      [].concat(br.set || []).forEach(function (f) { g.flags[f] = 1; });
      [].concat(br.rumor || []).forEach(function (rid) { g.flags['heard:' + rid] = 1; var rr = DS.DATA.rumorMap[rid]; if (rr && rr.flag) g.flags[rr.flag] = 1; });
      if (br.give) { g.give(br.give, 1); DS.audio.sfx('chest'); yield DS.say(L('g.got', { item: DS.DATA.items[br.give].name })); }
      if (br.renown) yield* EV.renown(br.renown, br.renownWhy);
      return;
    }
  };
  EV.chest = function* (c) {
    var g = G(), key = 'chest:' + F().map.id + ':' + c.x + ',' + c.y;
    if (g.flags[key]) { yield DS.say(L('g.empty')); return; }
    g.flags[key] = 1; DS.audio.sfx('chest');
    if (c.item) { g.give(c.item, c.n || 1); yield DS.say(L('g.found', { item: DS.DATA.items[c.item].name + ((c.n || 1) > 1 ? ' x' + c.n : '') })); }
    if (c.silver) { g.silver += c.silver; yield DS.say(L('g.foundSilver', { n: c.silver })); }
  };
  EV.sign = function* (s) { yield DS.say(s.text); };
  EV.trigger = function* (t) {
    var g = G();
    if (t.script === 'warp') { DS.audio.sfx('door'); yield* EV.warp(t.to, t.tx, t.ty, 'up'); return; }
    var fn = S[t.script];
    if (!fn) { console.warn('no script', t.script); return; }
    yield* fn(t.arg, t);
    var tr = t.rect || [t.x, t.y];
    if (t.back && DS.field && g.x === tr[0] && g.y === tr[1]) yield* EV.stepBack('up');
  };

  // ------------------------------------------------------------------ party & progress
  EV.renown = function* (n, why) {
    var g = G(); g.renown += n;
    DS.audio.sfx('levelup');
    var title = DS.DATA.config.renownTitles[Math.min(g.renown, DS.DATA.config.renownTitles.length - 1)];
    yield DS.say(L('g.renown', { n: n, why: why ? L(why) : '', title: title }));
    // milestone XP: each point of renown is worth 250 XP to everyone standing
    var xp = 250 * n, ups = [];
    g.party.forEach(function (h) { if (!h.ko) ups = ups.concat(R.gainXP(h, xp)); });
    yield DS.say(L('g.milestone', { n: xp }));
    if (ups.length) { DS.audio.sfx('levelup'); yield DS.say(ups); }
    if (MAJOR.indexOf(why) >= 0) yield* EV.questWeapons();
  };
  // major quests pay in kind: a magic weapon for the main, and one for a hired companion in the party
  var MAJOR = ['renown.five', 'renown.rescue', 'renown.cloaker', 'renown.ettercap', 'renown.talmok', 'renown.snoot'];
  function weaponBonus(h) { var w = R.item(h.equip.weapon); return (w && w.weapon && w.weapon.bonus) || 0; }
  function ownsBonus(h, b) { var ids = DS.DATA.heroes[h.id].rewardWeapons || []; return ids.slice(b - 1).some(function (id) { return G().count(id) > 0 || h.equip.weapon === id; }); }
  EV.questWeapons = function* () {
    var g = G(); g.flags.majors = (g.flags.majors || 0) + 1;
    var tier = g.flags.majors <= 2 ? 1 : 2, lines = [];
    function give(h) {
      var id = (DS.DATA.heroes[h.id].rewardWeapons || [])[tier - 1];
      if (!id || weaponBonus(h) >= tier || ownsBonus(h, tier)) return false;
      var it = DS.DATA.items[id];
      if (h.equip.weapon && h.equip.weapon !== 'unarmed') g.give(h.equip.weapon, 1);
      if ((it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { g.give(h.equip.shield, 1); h.equip.shield = null; }
      h.equip.weapon = id; lines.push(L('g.rewardWeapon', { name: h.name, item: it.name }));
      return true;
    }
    var main = g.main(), gotMain = give(main);
    var hires = g.party.filter(function (h) { return h !== main; }).sort(function (a, b) { return weaponBonus(a) - weaponBonus(b); });
    for (var i = 0; i < hires.length; i++) if (give(hires[i])) break;
    if (!gotMain) for (var j = 0; j < hires.length; j++) if (lines.length < 2 && give(hires[j])) break;
    if (lines.length) { DS.audio.sfx('chest'); yield DS.say([L('g.rewardKind')].concat(lines)); }
  };
  EV.hire = function* (id) {
    var g = G();
    if (g.party.length >= 4) { yield DS.say(L('g.partyFull')); return false; }
    var d = DS.DATA.heroes[id], lvl = Math.max(d.level, Math.min(R.CAP, g.main().lvl - 1));
    var h = R.makeHero(id, lvl);
    g.party.push(h); g.hired.push(id);
    DS.audio.sfx('levelup');
    F().refreshNpcs();
    yield DS.say(L('g.joins', { name: h.name, lvl: h.lvl }));
    return true;
  };
  EV.rest = function* (song) {
    var g = G();
    yield DS.fade(1, 24);
    DS.audio.play(song || 'inn', true);
    yield W8.frames(150);
    g.party.forEach(function (h) {
      if (h.conds.aid) { h.maxhp -= h.conds.aid; delete h.conds.aid; }
      delete h.conds.mageArmor;
      R.refresh(h, true);
    });
    yield DS.fade(0, 24);
    DS.audio.play(F().map.music, true);
    yield DS.say(L('g.rested'));
  };
  EV.pay = function (n) { var g = G(); if (g.silver < n) return false; g.silver -= n; DS.audio.sfx('coin'); return true; };

  // ------------------------------------------------------------------ field use of items / magic / skills
  EV.useFieldItem = function* (id, h) {
    var it = DS.DATA.items[id], use = it.use, g = G();
    if (use.effect === 'heal') {
      if (h.ko) { yield DS.say(L('g.needKit')); return; }
      if (h.hp >= h.maxhp) { yield DS.say(L('g.fullHP', { name: h.name })); return; }
      g.take(id, 1); var n = Math.min(h.maxhp - h.hp, DS.roll(use.dice)); h.hp += n; DS.audio.sfx('heal');
      yield DS.say(L('g.healed', { name: h.name, n: n }));
    } else if (use.effect === 'revive') {
      if (!h.ko) { yield DS.say(L('g.notDown', { name: h.name })); return; }
      g.take(id, 1); h.ko = false; h.hp = use.hp || 1; DS.audio.sfx('heal');
      yield DS.say(L('g.revived', { name: h.name }));
    } else if (use.effect === 'rest') {
      if (F().map.src.tent === false || !F().map.src.outside && !F().map.src.dark) { yield DS.say(L('g.noTentHere')); return; }
      g.take(id, 1);
      yield DS.fade(1, 20); yield W8.frames(60);
      g.party.forEach(function (x) {
        if (!x.ko) x.hp = Math.min(x.maxhp, x.hp + Math.ceil(x.maxhp / 2));
        R.refresh(x, false);
      });
      yield DS.fade(0, 20);
      yield DS.say(L('g.tentRest'));
    } else if (use.effect === 'ward') {
      g.take(id, 1); F().encounterIn += 60; DS.audio.sfx('magic');
      yield DS.say(L('g.chalk'));
    }
  };
  EV.fieldCast = function* (h, sp) {
    var g = G();
    var slot = sp.level && !sp.ritual ? R.lowestSlot(h, sp.level) : 0;
    if (sp.level && !sp.ritual && !slot) { yield DS.say(L('g.noSlots')); return; }
    if (sp.kind === 'heal' || sp.kind === 'cure' || (sp.kind === 'buff' && sp.target !== 'allies')) {
      var items = g.party.map(function (x) { return { label: x.name, right: (x.ko ? 'KO ' : '') + x.hp + '/' + x.maxhp, value: x, disabled: x.ko }; });
      var t = yield DS.choose({ items: items, x: 60, y: 60, w: 136, title: 'ON WHOM?' });
      if (!t) return;
      if (slot) h.slots[slot - 1]--;
      DS.audio.sfx('heal');
      if (sp.kind === 'heal') { var n = Math.min(t.maxhp - t.hp, DS.roll(sp.dmg.replace(/^(\d+)d/, function (m, k) { return (+k + (slot - sp.level)) + 'd'; })) + DS.mod(h.abil.cha)); t.hp += n; yield DS.say(L('g.healed', { name: t.name, n: n })); }
      else if (sp.kind === 'cure') yield DS.say(L('g.cured', { name: t.name }));
      else if (sp.buff === 'mageArmor') { t.conds.mageArmor = true; yield DS.say(L('g.mageArmor', { name: t.name, ac: R.ac(t) })); }
      return;
    }
    if (sp.buff === 'aid') {
      if (slot) h.slots[slot - 1]--;
      g.party.slice(0, 3).forEach(function (x) { if (!x.ko) { x.maxhp += 5; x.hp += 5; x.conds.aid = (x.conds.aid || 0) + 5; } });
      DS.audio.sfx('buff'); yield DS.say(L('g.aid')); return;
    }
    if (sp.kind === 'light' || sp.kind === 'flavor') { DS.audio.sfx('magic'); yield DS.say(L(sp.kind === 'light' ? 'g.light' : 'g.dancing')); return; }
    if (sp.kind === 'detect') {
      DS.audio.sfx('magic');
      var magic = (F().chests || []).filter(function (c) { var it = c.item && DS.DATA.items[c.item]; return it && /\+1|Ring of|Potion/.test(it.name) && !g.flags['chest:' + F().map.id + ':' + c.x + ',' + c.y]; });
      yield DS.say(L(magic.length ? 'g.detectYes' : 'g.detectNo')); return;
    }
    if (sp.kind === 'familiar') { yield DS.say(L('g.familiar')); return; }
    yield DS.say(L('g.nothingHappens'));
  };
  EV.fieldSkill = function* (h, s) {
    var g = G();
    if (s === 'lay') {
      var items = g.party.map(function (x) { return { label: x.name, right: (x.ko ? 'KO ' : '') + x.hp + '/' + x.maxhp, value: x, disabled: x.ko || x.hp >= x.maxhp }; });
      var t = yield DS.choose({ items: items, x: 60, y: 60, w: 136, title: 'LAY ON HANDS (' + h.feats.lay + ')' });
      if (!t) return;
      var n = Math.min(h.feats.lay, t.maxhp - t.hp); h.feats.lay -= n; t.hp += n; DS.audio.sfx('heal');
      yield DS.say(L('g.healed', { name: t.name, n: n }));
    }
    if (s === 'arcane') {
      var budget = Math.ceil(h.lvl / 2), got = 0;
      for (var lv = Math.min(5, budget); lv >= 1; lv--) while (budget >= lv && h.slots[lv - 1] < h.slotsMax[lv - 1]) { h.slots[lv - 1]++; budget -= lv; got++; }
      h.feats.arcaneRecovery = 0; DS.audio.sfx('magic');
      yield DS.say(L('g.arcane', { name: h.name, n: got }));
    }
    if (s === 'wind') {
      var w = Math.min(h.maxhp - h.hp, DS.roll('1d10') + h.lvl); h.hp += w; h.feats.secondWind = 0; DS.audio.sfx('heal');
      yield DS.say(L('g.healed', { name: h.name, n: w }));
    }
  };

  // ------------------------------------------------------------------ the opening
  EV.intro = function* (lead) {
    yield DS.say(L('intro.world'));
    yield DS.say(L('intro.' + lead));
    yield DS.say(L('intro.motive'));
    yield DS.say(L('intro.controls'));
  };

  // ================================================================== SCRIPTS
  // --- expansion walls (spec §5): pop a modal, then put the party back one tile
  S.expansion = function* (dir) {
    var north = dir === 'north';
    DS.audio.sfx('popup');
    yield DS.popup({
      title: north ? 'UP TO THE DOORS' : 'DOWN TO THE PIT',
      text: L('wall.text'), foot: DS.DATA.config.kofi.replace(/^https?:\/\//, ''), buttons: ['♥ DONATE', 'BACK'],
      onButton: function (i) { if (i === 0) DS.openKofi(); }
    });
    yield F().walk([north ? 'down' : 'up']);
  };
  // --- keeper doors, shops, inns, the chapel, the leech-house
  S.keeper = function* (id) {
    var D = DS.DATA.npcs[id];
    if (!D) return;
    if (D.script && S[D.script]) { yield* S[D.script](null, D); return; }
    yield* EV.dialog(D);
  };
  S.shop = function* (id) {
    var sh = DS.DATA.shops[id];
    if (sh.cond && !DS.cond(sh.cond)) { yield DS.say(L(sh.closedText || 'g.closed')); return; }
    yield DS.shop(id);
  };
  S.inn = function* (id) {
    var inn = DS.DATA.shops[id], g = G(), cost = inn.price * g.party.length;
    var a = yield DS.ask(inn.greeting + ' ' + L('g.innAsk', { n: cost }), ['STAY', 'LEAVE'], who(inn.keeper));
    if (a !== 0) return;
    if (!EV.pay(cost)) { yield DS.say(L('g.poor')); return; }
    yield* EV.rest();
    var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
    if (s === 0) yield W8.scene(new DS.SlotScene(true));
  };
  S.chapel = function* () {
    var g = G(), D = DS.DATA.npcs.aldwin;
    yield* EV.dialog(D);
    var a = yield DS.ask(L('chapel.ask'), ['SLEEP', 'LEAVE'], who('Aldwin'));
    if (a === 0) {
      yield* EV.rest('inn');
      var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
      if (s === 0) yield W8.scene(new DS.SlotScene(true));
    }
  };
  S.leech = function* () {
    var g = G(), down = g.party.filter(function (h) { return h.ko; });
    yield DS.say(L('leech.greet'), who('Davos Kren'));
    if (!down.length) { yield DS.say(L('leech.none'), who('Davos Kren')); return; }
    var cost = 5 * down.length;
    var a = yield DS.ask(L('leech.ask', { n: cost, names: down.map(function (h) { return h.name; }).join(', ') }), ['PAY', 'LEAVE'], who('Davos Kren'));
    if (a !== 0) return;
    if (!EV.pay(cost)) { yield DS.say(L('g.poor')); return; }
    down.forEach(function (h) { h.ko = false; h.hp = Math.max(1, Math.floor(h.maxhp / 2)); });
    DS.audio.sfx('heal');
    yield DS.say(L('leech.done'), who('Davos Kren'));
  };

  // --- the Weigh-House board: Hessle pays bounties
  S.hessle = function* (npc, D) {
    var g = G();
    yield DS.say(L('hessle.greet'), who('Hessle'));
    g.flags.heardEttercap = 1; g.flags.heardCloaker = 1; g.flags['heard:r-ettercap'] = 1; g.flags['heard:r-cloaker'] = 1;
    if (g.count('ettercapfangs') > 0) {
      g.take('ettercapfangs', 1); g.silver += 500; g.flags.ettercapDone = 1; DS.audio.sfx('coin');
      yield DS.say(L('hessle.ettercapPaid'), who('Hessle'));
      yield* EV.renown(1, 'renown.ettercap');
    }
    if (g.count('cloakertail') > 0) {
      g.take('cloakertail', 1); g.flags.cloakerDone = 1;
      yield DS.say(L('hessle.cloakerDrawer'), who('Hessle'));
      yield* EV.renown(1, 'renown.cloaker');
    }
    if (!g.flags.ettercapDone || !g.flags.cloakerDone) yield DS.say(L('hessle.board'), who('Hessle'));
    if (g.flags.fiveDone && !g.flags.fiveNotice) { g.flags.fiveNotice = 1; yield DS.say(L(g.flags.stockDead ? 'hessle.fiveDead' : 'hessle.fiveAlive'), who('Hessle')); }
  };

  // --- Winters and the Ring of Binding (RULED 09-23: given when the main reaches level 4)
  S.winters = function* () {
    var g = G(), main = g.main();
    if (g.has('ringofbinding')) { yield DS.say(L('winters.after')); return; }
    if (!g.flags.wintersMet) { g.flags.wintersMet = 1; yield DS.say(L('winters.first')); }
    yield DS.say(L('winters.griz'), who('Ambrose Winters'));
    if (main.lvl < 4) { yield DS.say(L('winters.notReady', { lvl: main.lvl })); return; }
    yield DS.say(L('winters.ready'));
    DS.audio.sfx('ring');
    g.give('ringofbinding', 1);
    yield DS.say(L('winters.ring'));
    var who2 = g.party.filter(function (h) { return !h.equip.ring; })[0] || main;
    var eq = yield DS.ask(L('winters.equipAsk', { name: who2.name }), ['YES', 'NO']);
    if (eq === 0) { if (who2.equip.ring) g.give(who2.equip.ring, 1); who2.equip.ring = 'ringofbinding'; g.take('ringofbinding', 1); DS.audio.sfx('confirm'); }
  };

  // --- hires (spec §3: pick one lead; the others hireable in play). Terms PROPOSED.
  S.hireBarley = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
    var a = yield DS.ask(L('hire.barleyAsk'), ['FRONT 5 SP', 'NOT NOW'], who('Barley'));
    if (a !== 0) return;
    if (!EV.pay(5)) { yield DS.say(L('g.poor')); return; }
    yield DS.say(L('hire.barleyYes'), who('Barley'));
    yield* EV.hire('barley');
  };
  S.hireAurdin = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
    var a = yield DS.ask(L('hire.aurdinAsk'), ['PAY 20 SP', 'NOT NOW'], who('Aurdin'));
    if (a !== 0) return;
    if (!EV.pay(20)) { yield DS.say(L('g.poor')); return; }
    yield DS.say(L('hire.aurdinYes'), who('Aurdin'));
    yield* EV.hire('aurdin');
  };
  S.hireVivian = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
    var a = yield DS.ask(L('hire.vivianAsk'), ['BUY A CANDLE (1 SP)', 'NOT NOW'], who('Vivian'));
    if (a !== 0) return;
    if (!EV.pay(1)) { yield DS.say(L('g.poor')); return; }
    g.give('candle', 1);
    var b = yield DS.ask(L('hire.vivianAsk2'), ['COME ALONG?', 'JUST THE CANDLE'], who('Vivian'));
    if (b !== 0) { yield DS.say(L('hire.vivianNo'), who('Vivian')); return; }
    yield DS.say(L('hire.vivianYes'), who('Vivian'));
    yield* EV.hire('vivian');
  };
  S.hireLymen = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
    if (g.renown < 1) { yield DS.say(L('hire.lymenWait'), who('Lymen')); return; }
    var a = yield DS.ask(L('hire.lymenAsk'), ['STAND WITH US', 'NOT NOW'], who('Lymen'));
    if (a !== 0) return;
    yield DS.say(L('hire.lymenYes'), who('Lymen'));
    yield* EV.hire('lymen');
  };

  // --- the Hex: Korvin's slate, the fight card (5 silver to fight, winner keeps ten)
  var CARD = [
    { id: 'brawl', label: 'BRAWL IN THE SMALL SAND', foe: 'brawler', stake: 0, win: 4, need: null },
    { id: 'freeman', label: 'FREEMAN CHALLENGE', foe: 'stablefighter', stake: 5, win: 10, need: 'hex:brawl' },
    { id: 'card', label: 'THE CARD: A HIRED BLADE', foe: 'merc', stake: 5, win: 10, need: 'hex:freeman' },
    { id: 'talmok', label: 'TALMOK, THE CHAMPION', foe: 'talmok', stake: 5, win: 10, need: 'hex:card' },
    { id: 'festival', label: 'FESTIVAL: A VISITING BARBARIAN', foe: 'berserker', stake: 5, win: 10, need: 'hex:talmok' }
  ];
  S.hexCard = function* () {
    var g = G();
    g.flags.heardHex = 1;
    yield DS.say(L('hex.korvin'), who('Korvin'));
    var items = CARD.map(function (c) {
      var done = g.flags['hex:' + c.id], open = !c.need || g.flags[c.need];
      return { label: (done ? '★ ' : '') + c.label, right: c.stake ? c.stake + ' in' : 'floor', value: c, disabled: !open };
    });
    var c = yield DS.choose({ items: items, x: 8, y: 40, w: 240, title: 'THE SLATE', rowH: 13 });
    if (!c) return;
    var able = g.party.filter(function (h) { return !h.ko; });
    if (!able.length) { yield DS.say(L('hex.nobody'), who('Korvin')); return; }
    var fighter = able.length === 1 ? able[0] : yield DS.choose({ items: able.map(function (h) { return { label: h.name, right: 'L' + h.lvl + ' ' + h.hp + '/' + h.maxhp, value: h }; }), x: 60, y: 90, w: 140, title: 'WHO TAKES THE SAND?' });
    if (!fighter) return;
    var fronted = false;
    if (c.stake) {
      if (g.silver >= c.stake) g.silver -= c.stake;
      else { fronted = true; yield DS.say(L('hex.fronted'), who('Korvin')); }
    }
    yield DS.say(L('hex.intro.' + c.id, { name: fighter.name }));
    var res = yield DS.battle({ enemies: [c.foe], bg: 'arena', music: c.id === 'talmok' ? 'boss' : 'hex', solo: g.party.indexOf(fighter), lossOk: true, canRun: false, returnSong: 'hex' });
    if (fighter.ko || fighter.hp <= 0) { fighter.ko = false; fighter.hp = 1; }
    if (res === 'win') {
      g.silver += c.win; DS.audio.sfx('coin');
      var first = !g.flags['hex:' + c.id];
      g.flags['hex:' + c.id] = 1;
      yield DS.say(L('hex.won', { name: fighter.name, n: c.win }), who('Korvin'));
      if (c.id === 'talmok' && first) { g.flags.talmokBeaten = 1; yield DS.say(L('hex.talmokDown')); yield* EV.renown(1, 'renown.talmok'); }
      else if (c.id === 'card' && first) yield* EV.renown(1, 'renown.card');
    } else {
      yield DS.say(L(fronted ? 'hex.lostFronted' : 'hex.lost', { name: fighter.name }), who('Korvin'));
      yield DS.say(L('hex.stitched', { name: fighter.name }));
    }
  };

  // --- the Warrens: the pens (milking), Skarn's gate, the wet, the landlord, the mark, the stair
  S.pen = function* (n) {
    var g = G();
    if (!g.flags.tallyMet) { yield DS.say(L('w.penNoBook')); return; }
    var a = yield DS.ask(L('w.penAsk'), ['WORK A SHIFT', 'LEAVE']);
    if (a !== 0) return;
    var h = g.party.length === 1 ? g.party[0] : yield DS.choose({ items: g.party.filter(function (x) { return !x.ko; }).map(function (x) { return { label: x.name, value: x }; }), x: 60, y: 80, w: 136, title: 'WHO MILKS?' });
    if (!h) return;
    var draught = g.count('draught') > 0; if (draught) g.take('draught', 1);
    var got = 0, touched = false, lines = [];
    var best = Math.max(R.skill(h, 'Animal Handling', 'wis'), R.skill(h, 'Nature', 'int'));
    for (var i = 0; i < 6 && !touched; i++) {
      var r = DS.d(20) + best;
      if (r >= 12) got++;
      else if (r <= 7) {
        var sv = DS.d(20) + R.saveBonus(h, 'con'); if (draught) sv = Math.max(sv, DS.d(20) + R.saveBonus(h, 'con'));
        if (sv < 13) touched = true; else lines.push(L('w.touchShrug'));
      }
    }
    if (touched) lines.push(L('w.touched', { name: h.name }));
    g.silver += got; if (got) DS.audio.sfx('coin');
    g.flags.shifts = (g.flags.shifts || 0) + 1;
    lines.push(L('w.shiftPaid', { n: got }));
    yield DS.say(lines);
    if (g.flags.shifts === 1) { g.flags.hobMet = 1; yield DS.say(L('w.hobAtCradle'), who('Old Hob')); g.flags['heard:r-promised'] = 1; }
  };
  S.skarnGate = function* () {
    var g = G();
    if (!g.flags.skarnOk) { yield DS.say(L('w.gateShut'), who('Skarn')); return; }
    DS.audio.sfx('door');
    var north = g.y > 19;
    yield DS.fade(1, 8);
    g.y = north ? 18 : 20; F().py = g.y * 16; g.dir = north ? 'up' : 'down';
    yield DS.fade(0, 8);
  };
  S.skarn = function* (npc, D) {
    var g = G();
    if (g.flags.fiveDone && !g.flags.skarnPaid) {
      g.flags.skarnPaid = 1;
      yield DS.say(L(g.flags.stockDead ? 'w.skarnAfterDead' : 'w.skarnAfter'), who('Skarn'));
      if (!g.flags.stockDead) { g.silver += 60; DS.audio.sfx('coin'); yield DS.say(L('g.foundSilver', { n: 60 })); }
      return;
    }
    if (!g.flags.skarnOk) {
      yield DS.say(L('w.skarnFirst'), who('Skarn'));
      var a = yield DS.ask(L('w.skarnHow'), [L('w.skarnAsMan'), L('w.skarnAsSlave')], who('Skarn'));
      if (a === 1) { yield DS.say(L('w.skarnChampion'), who('Skarn')); return; }
      g.flags.skarnOk = 1; g.flags.heardPete = 1;
      yield DS.say(L('w.skarnQuestion'), who('Skarn'));
      return;
    }
    yield DS.say(L('w.skarnAgain'), who('Skarn'));
  };
  S.edric = function* (npc, D) {
    var g = G();
    g.flags.tallyMet = 1;
    if (g.count('fivetokens') > 0) {
      g.take('fivetokens', 1); g.flags.fiveDone = 1;
      yield DS.say(L('w.edricFive'), who('Edric Pellam'));
      g.silver += 50; DS.audio.sfx('coin'); yield DS.say(L('g.foundSilver', { n: 50 }));
      yield* EV.renown(1, 'renown.five');
      return;
    }
    yield DS.say(L(g.flags.fiveKnown ? 'w.edricAgain' : 'w.edricFirst'), who('Edric Pellam'));
    if (!g.flags.fiveKnown) {
      var a = yield DS.ask(L('w.edricPage'), ['PAY 5 SP', 'NO'], who('Edric Pellam'));
      if (a === 0 && EV.pay(5)) { g.flags.fiveKnown = 1; g.flags.heardPete = 1; yield DS.say(L('w.edricSold'), who('Edric Pellam')); }
    }
  };
  S.bucket = function* () {
    var g = G();
    if (g.has('bucket')) { yield DS.say(L('w.bucketHave')); return; }
    if (g.flags.otyughFed) { yield DS.say(L('w.bucketEmpty')); return; }
    g.give('bucket', 1); DS.audio.sfx('chest');
    yield DS.say(L('w.bucketTake'));
  };
  S.landlordNear = function* () {
    var g = G();
    if (g.flags.landlordSpoke || g.flags.otyughDead) return;
    g.flags.landlordSpoke = 1;
    yield DS.say(L('w.landlordPicture'));
  };
  S.landlord = function* () {
    var g = G();
    if (g.flags.otyughDead) { yield DS.say(L('w.poolQuiet')); return; }
    if (g.flags.otyughFed) { yield DS.say(L('w.landlordFed')); return; }
    var opts = [g.has('bucket') ? 'LOWER THE BUCKET' : 'WAIT', 'FIGHT IT', 'STEP BACK'];
    var a = yield DS.ask(L('w.landlordAsk'), opts);
    if (a === 0 && g.has('bucket')) {
      g.take('bucket', 1); g.flags.otyughFed = 1; DS.audio.sfx('splash');
      yield DS.say(L('w.landlordFeed'));
      g.flags['heard:r-stream'] = 1;
      return;
    }
    if (a === 1) {
      var res = yield* EV.fight(['otyugh'], { bg: 'wet', music: 'boss', canRun: true, introText: L('w.landlordRises') });
      if (res === 'win') g.flags.otyughDead = 1;
    }
  };
  S.jelly = function* () { yield DS.say(L('w.jelly')); yield* EV.fight(['ochrejelly'], { bg: 'wet' }); };
  S.oozeFight = function* () { yield DS.say(L('w.ooze')); yield* EV.fight(['grayooze'], { bg: 'wet' }); };
  S.mark = function* () {
    var g = G();
    yield DS.say(L('w.markSee'));
    var arc = g.party.some(function (h) { return DS.d(20) + Math.max(R.skill(h, 'Arcana', 'int'), R.skill(h, 'Religion', 'int')) >= 12; });
    if (arc || g.flags.hobMet) { g.flags.markRead = 1; yield DS.say(L('w.markRead')); }
    if (g.flags.keeperDone) return;
    var a = yield DS.ask(L('w.markAsk'), ['LEAVE IT', 'PUT A HAND ON IT']);
    if (a === 1) { g.flags.keeperAwake = 1; DS.audio.sfx('splash'); yield DS.say(L('w.markWake')); }
  };
  S.stair = function* () {
    var g = G();
    if (g.flags.fiveRecovered) { yield DS.say(L('w.stairDone')); return; }
    yield DS.say(L('w.stairSee'));
    var opts = ['ROPE THEM OUT', 'WADE IN', 'LEAVE'];
    var a = yield DS.ask(L('w.stairAsk'), opts);
    if (a === 0) {
      if (!g.has('rope')) { yield DS.say(L('w.noRope')); return; }
      if (g.flags.keeperAwake) {
        yield DS.say(L('w.ropeAwake'));
        var r1 = yield* EV.fight(['keeper'], { bg: 'dwarf', music: 'boss', canRun: false });
        if (r1 !== 'win') return;
        g.flags.keeperDone = 1;
      }
      yield DS.say(L('w.ropeOut'));
    } else if (a === 1) {
      yield DS.say(L('w.wade'));
      var r2 = yield* EV.fight(['keeper'], { bg: 'dwarf', music: 'boss', canRun: false });
      if (r2 !== 'win') return;
      g.flags.keeperDone = 1;
      yield DS.say(L('w.keeperGone'));
    } else return;
    g.flags.fiveRecovered = 1; g.give('fivetokens', 1); DS.audio.sfx('chest');
    yield DS.say(L('w.fiveRecovered'));
    yield DS.say(L('w.threshold'));
    // the quota clock's fork: the stock (Griz 09-17e)
    if ((g.kills.crawler || 0) >= 6) g.flags.stockDead = 1;
  };
  S['enter:warrens_a'] = function* () {
    var g = G();
    if (g.flags.stockDead && g.flags.fiveRecovered && !g.flags.lineBroken) {
      yield DS.say(L('w.lineHolds'));
      var res = yield* EV.fight(['guard', 'guard', 'guard', 'guard', 'guard', 'veteran'], { bg: 'plains', canRun: true });
      if (res === 'win') { g.flags.lineBroken = 1; F().refreshNpcs(); yield DS.say(L('w.lineBroken')); }
    }
  };

  // --- the guano mine: the cull, the one law, the rescue, the cloaker
  S.sabeth = function* (npc, D) {
    var g = G();
    if (g.flags.roostBroken) { yield DS.say(L('g1.sabethFired'), who('Sabeth Pollard')); return; }
    if (!g.flags.cullHired) {
      yield DS.say(L('g1.sabethHire'), who('Sabeth Pollard'));
      var a = yield DS.ask(L('g1.sabethAsk'), ['TAKE THE WORK', 'NOT NOW'], who('Sabeth Pollard'));
      if (a === 0) { g.flags.cullHired = 1; g.flags.paidBats = g.kills['g3:giantbat'] || 0; g.flags.paidMantles = (g.kills['g3:darkmantle'] || 0); yield DS.say(L('g1.sabethLaw'), who('Sabeth Pollard')); }
      return;
    }
    var bats = (g.kills['g3:giantbat'] || 0) - (g.flags.paidBats || 0), mantles = (g.kills['g3:darkmantle'] || 0) - (g.flags.paidMantles || 0);
    if (bats > 0 || mantles > 0) {
      var pay = bats * 3 + mantles * 10;
      g.flags.paidBats = (g.flags.paidBats || 0) + bats; g.flags.paidMantles = (g.flags.paidMantles || 0) + mantles;
      g.silver += pay; DS.audio.sfx('coin');
      yield DS.say(L('g1.sabethPay', { b: bats, m: mantles, n: pay }), who('Sabeth Pollard'));
    } else yield DS.say(L('g1.sabethNothing'), who('Sabeth Pollard'));
  };
  S.ottilie = function* () {
    var g = G();
    if (g.flags.roostBroken) { yield DS.say(L('g1.ottilieCold')); return; }
    yield DS.say(L(g.flags.rescued ? 'g1.ottilieRespect' : 'g1.ottilie'), who('Ottilie Skerrow'));
  };
  S.rescue = function* () {
    var g = G();
    yield DS.say(L('g3.rescue1'));
    var res = yield* EV.fight(['giantbat', 'giantbat', 'giantbat', 'giantbat'], { bg: 'guano', introText: L('g3.rescueIntro') });
    if (res !== 'win') return;
    g.flags.rescued = 1; g.flags.cullDone = 1;
    yield DS.say(L('g3.rescue2'));
    yield* EV.renown(1, 'renown.rescue');
  };
  S.pit = function* () {
    var g = G();
    DS.audio.sfx('miss');
    yield DS.say(L('g3.pit'));
    g.party.forEach(function (h) { if (!h.ko) h.hp = Math.max(1, h.hp - DS.roll('1d6')); });
    yield* EV.warp('galleries_g4', 18, 12, 'down');
  };
  S.badAir = function* () {
    var g = G();
    if (g.flags.badAirStep && G().steps - g.flags.badAirStep < 3) return;
    g.flags.badAirStep = G().steps;
    var hurt = [];
    g.party.forEach(function (h) { if (!h.ko && DS.d(20) + R.saveBonus(h, 'con') < 12) { h.hp = Math.max(1, h.hp - DS.roll('1d4')); hurt.push(h.name); } });
    if (hurt.length) { DS.audio.sfx('poison'); yield DS.say(L('g3.badAir', { names: hurt.join(', ') })); }
  };
  S.cloaker = function* () {
    var g = G();
    if (g.flags.cloakerDone || g.has('cloakertail')) return;
    yield DS.say(L('g4.cloaker'));
    var res = yield* EV.fight(['cloaker'], { bg: 'deep', music: 'boss', canRun: true });
    if (res === 'win') { g.give('cloakertail', 1); DS.audio.sfx('chest'); yield DS.say(L('g4.tail')); }
    else if (res === 'run') { yield DS.say(L('g4.ranUp')); yield* EV.warp('galleries_g3', 50, 9, 'left'); }
  };
  S.dace = function* (npc, D) {
    var g = G();
    g.flags.daceLight = 1;
    yield* EV.dialog(D);
  };

  // --- Web Gulch
  S.snared = function* () {
    yield DS.say(L('gulch.snared'));
    var res = yield* EV.fight(['wolfspider', 'wolfspider', 'giantspider'], { bg: 'gulch' });
    if (res === 'win') { yield DS.say(L('gulch.snaredFree')); G().silver += 12; DS.audio.sfx('coin'); }
  };
  S.ettercap = function* () {
    var g = G();
    if (g.flags.ettercapDone || g.has('ettercapfangs')) return;
    yield DS.say(L('gulch.ettercap'));
    var res = yield* EV.fight(['ettercap', 'giantspider'], { bg: 'gulch', music: 'boss', canRun: true });
    if (res === 'win') { g.give('ettercapfangs', 1); DS.audio.sfx('chest'); yield DS.say(L('gulch.fangs')); }
  };

  // --- the road south: the Snoot overlay's challenge by day
  S.snoot = function* () {
    var g = G();
    if (g.flags.snootDone) return;
    yield DS.say(L('road.snoot'));
    var res = yield* EV.fight(['gloryseeker', 'gnoll', 'gnoll', 'hyena', 'hyena'], { bg: 'gnoll', music: 'boss', canRun: true });
    if (res === 'win') { g.flags.snootDone = 1; yield DS.say(L('road.snootDone')); yield* EV.renown(1, 'renown.snoot'); }
    else if (res === 'run') yield F().walk(['up']);
  };

  // --- the Halfway Inn and the thing in the lake
  S['enter:halfway'] = function* () {
    var g = G();
    if (!g.flags.reachedInn) { g.flags.reachedInn = 1; yield DS.say(L('inn.arrive')); }
  };
  S.gennet = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
    var cost = 5 * g.party.length;
    var a = yield DS.ask(L('inn.stayAsk', { n: cost }), ['STAY THE NIGHT', 'NO'], who('The inn lady'));
    if (a !== 0) return;
    if (!EV.pay(cost)) { yield DS.say(L('g.poor')); return; }
    if (g.has('ringofbinding') && !g.flags.dueSeen) { yield* S.theDue(); return; }
    yield* EV.rest();
    var s = yield DS.ask(L('g.saveAsk'), ['SAVE', 'NO']);
    if (s === 0) yield W8.scene(new DS.SlotScene(true));
  };
  S.elsbeth = function* (npc, D) {
    var g = G();
    if (g.flags.lakeDone) { yield DS.say(L('inn.elsbethAfter'), who('Elsbeth')); return; }
    if (!g.flags.dishes) {
      var a = yield DS.ask(L('inn.elsbethDishes'), ['HELP WITH THE DISHES', 'LEAVE HER BE']);
      if (a !== 0) return;
      g.flags.dishes = 1;
      yield DS.say(L('inn.elsbeth1'), who('Elsbeth'));
      return;
    }
    if (!g.flags.elsbethTold) {
      g.flags.elsbethTold = 1;
      yield DS.say(L('inn.elsbeth2'), who('Elsbeth'));
      return;
    }
    yield DS.say(L(g.has('ringofbinding') ? 'inn.elsbethTonight' : 'inn.elsbeth3'), who('Elsbeth'));
  };
  // RULED 09-23 (Griz): show the inn lady and the kid go to the lake, and only the inn lady come back.
  S.theDue = function* () {
    var g = G(), f = F();
    g.flags.reachedInn = 1;
    yield DS.fade(1, 30);
    DS.audio.play('lake', true);
    yield* EV.warp('halfway', 20, 13, 'down');
    f = F();
    f.hidePlayer = true;
    var n1 = makeNpc('dueLady', 20, 12, 'innlady', true), n2 = makeNpc('dueKid', 20, 11, 'kid', false);
    f.npcs.push(n1, n2);
    f.npcs = f.npcs.filter(function (n) { return n.id !== 'orrin' && n.id !== 'pell'; });
    yield DS.say(L('due.night'), { top: true });
    yield DS.say(L('due.wagon'), { top: true });
    yield W8.frames(30);
    yield DS.say(L('due.walk'), { top: true, auto: 90 });
    n1.path = ['down', 'down', 'right', 'right', 'right', 'right', 'right', 'up', 'right', 'face:right'];
    n2.path = ['wait20', 'down', 'down', 'down', 'right', 'right', 'right', 'right', 'right', 'right', 'face:right'];
    yield W8.until(function () { return !n1.moving && !n1.path.length && !n2.moving && !n2.path.length && !(n2.pause > 0); });
    yield W8.frames(70);
    yield DS.say(L('due.water'), { top: true, auto: 120 });
    DS.audio.sfx('splash');
    DS.flashColor = '#000'; DS.flashAlpha = 0.6; yield W8.frames(40); DS.flashColor = null;
    n2.hidden = true;
    yield W8.frames(60);
    yield EV.npcWalk(n1, ['face:left', 'wait40', 'left', 'down', 'left', 'left', 'left', 'left', 'left', 'up', 'up', 'up'], 1);
    n1.hidden = true;
    yield DS.say(L('due.back'), { top: true });
    f.npcs = f.npcs.filter(function (n) { return n !== n1 && n !== n2; });
    f.hidePlayer = false;
    g.flags.dueSeen = 1;
    yield DS.say(L('due.after'));
    g.party.forEach(function (h) { R.refresh(h, true); });
  };
  function makeNpc(id, x, y, look, lantern) {
    var F0 = F();
    var def = { id: id, x: x, y: y, look: look, lantern: lantern, face: false, solid: false };
    return new DS.Npc(def, F0.map);
  }
  S.pointStep = function* () {
    var g = G();
    if (g.flags.lakeDone) { yield DS.say(L('lake.quiet')); return; }
    if (g.flags.dueSeen) { yield* S.lakeFight(); return; }
    if (!g.flags.pointSeen) { g.flags.pointSeen = 1; yield DS.say(L('lake.pointDay')); }
  };
  S.point = function* () {
    var g = G();
    if (g.flags.lakeDone) { yield DS.say(L('lake.quiet')); return; }
    yield DS.say(L('lake.deep'));
  };
  S.rowboat = function* () {
    var g = G();
    if (g.flags.lakeDone) { yield DS.say(L('lake.quiet')); return; }
    var a = yield DS.ask(L('lake.boatAsk'), ['LEAVE IT', 'PUSH OUT AND SOUND THE DEEP']);
    if (a !== 1) return;
    yield DS.say(L('lake.woken'));
    yield* S.lakeFight(true);
  };
  S.lakeFight = function* (poked) {
    var g = G();
    var ring = g.party.some(function (h) { return h.equip.ring === 'ringofbinding' && !h.ko; });
    yield DS.say(L(ring ? 'lake.rises' : 'lake.risesNoRing'));
    var res = yield* EV.fight(['chuul'], { bg: 'lake', music: 'boss', canRun: false, introText: ring ? L('lake.senseMagic') : null });
    if (res !== 'win') return;
    g.flags.lakeDone = 1;
    yield DS.say(L('lake.after'));
    yield* EV.renown(2, 'renown.lake');
    yield DS.say(L('lake.ending'));
    DS.audio.play('ending', true);
    yield DS.fade(1, 40);
    DS.clearScenes();
    DS.fadeLevel = 0;
    DS.push(new DS.Credits(true));
  };

  // --- misc NPC scripts
  S.papa = function* () { yield DS.say(L('hex.papa')); };
  S.warda = function* () { yield DS.say(L('hex.warda')); };
  S.lucia = function* () { yield DS.say(L('lucia.card')); };
  S.vairseat = function* () { yield DS.say(L('hex.vairseat')); };
  S.talmokTalk = function* (npc, D) {
    var g = G();
    yield* EV.dialog(D);
  };
  S.dunmoreLine = function* () { yield DS.say(L('w.lineHolds')); };
})();
