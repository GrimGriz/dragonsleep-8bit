/* DRAGONSLEEP — the battle screen. Initiative once per battle (d20+DEX), per-turn command
   menus, d20+mod vs AC, saves vs DC, conditions, grapples and ESCAPE, bonus actions.
   Enemies on the left, party on the right. */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, I = DS.input, W8 = DS.W8;

  // ------------------------------------------------------------------ helpers
  function isHero(u) { return u.side === 'hero'; }
  function hpOf(u) { return isHero(u) ? u.h.hp : u.hp; }
  function maxOf(u) { return isHero(u) ? u.h.maxhp : u.maxhp; }
  function down(u) { return isHero(u) ? (u.h.ko || u.h.hp <= 0) : u.dead; }
  function nameOf(u) { return isHero(u) ? '{y}' + u.h.name + '{/}' : '{o}' + u.name + '{/}'; }
  function plain(u) { return isHero(u) ? u.h.name : u.name; }
  function abil(u, a) { return isHero(u) ? u.h.abil[a] : (u.m.abil[a] || 10); }
  function incap(u) { return u.conds.paralyzed || u.conds.asleep || u.conds.stunned; }
  function tags(u) { return isHero(u) ? ['humanoid'] : (u.m.tags || []); }

  function Battle(o) {
    var self = this;
    this.kind = 'battle'; this.opaque = true; this.o = o;
    this.round = 1; this.msg = ''; this.fx = []; this.nums = []; this.bright = !!o.bright; this.over = null;
    this.flashT = 0; this.shake = 0; this.intro = 32;
    this.bg = DS.battleBg(o.bg || 'plains');
    var party = DS.G.party;
    var list = o.solo != null ? [party[o.solo]] : party;
    this.heroes = list.map(function (h, i) { return { side: 'hero', h: h, idx: i, conds: {}, buff: null, off: 0, pose: null, poseT: 0 }; });
    if (o.solo == null && !o.noGuests) (DS.G.guests || []).forEach(function (g, k) { // guests: AI-run allies behind the four (spec §6.2)
      if (!g.h.ko && g.h.hp > 0) self.heroes.push({ side: 'hero', h: g.h, idx: 4 + k, guest: true, conds: {}, buff: null, off: 0, pose: null, poseT: 0 });
    });
    this.foes = [];
    var counts = {}, seen = {};
    o.enemies.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
    o.enemies.forEach(function (id) {
      var m = DS.DATA.monsters[id];
      if (!m) { console.warn('no monster', id); return; }
      seen[id] = (seen[id] || 0) + 1;
      var nm = m.name + (counts[id] > 1 ? ' ' + String.fromCharCode(64 + seen[id]) : '');
      self.foes.push(self.makeFoe(m, nm));
    });
    this.layoutFoes();
    this.layoutHeroes();
    this.tauntWearer = null;
  }
  DS.Battle = Battle;
  Battle.prototype.makeFoe = function (m, nm) {
    return {
      side: 'foe', m: m, id: m.id, name: nm, hp: m.hp, maxhp: m.hp, conds: {}, buff: null, dead: false, art: DS.monsterArt(m.art || m.id, m.tint),
      x: 0, y: 0, flash: 0, fade: 0, off: 0, recharge: {}, used: {}, holding: []
    };
  };
  Battle.prototype.layoutFoes = function () {
    var live = this.foes.filter(function (f) { return !f.dead || f.fade > 0; });
    var colX = 170, cols = [], cur = null;
    // column-major flow from the party side leftwards
    live.slice().reverse().forEach(function (f) {
      if (!cur || cur.h + f.art.h + 4 > 118) { cur = { w: 0, h: 0, list: [] }; cols.push(cur); }
      cur.list.push(f); cur.h += f.art.h + 4; cur.w = Math.max(cur.w, f.art.w);
    });
    var totalW = cols.reduce(function (s, c) { return s + c.w + 6; }, 0);
    var x = Math.max(4, Math.min(colX, Math.round((180 + totalW) / 2))) ;
    cols.forEach(function (c) {
      x -= c.w + 6;
      var y = 30 + Math.round((118 - c.h) / 2);
      c.list.forEach(function (f) { f.x = Math.max(2, x + Math.round((c.w - f.art.w) / 2)); f.y = y; y += f.art.h + 4; });
    });
  };
  Battle.prototype.layoutHeroes = function () {
    var main = this.heroes.filter(function (u) { return !u.guest; }), gs = this.heroes.filter(function (u) { return u.guest; });
    var n = main.length, gap = n > 3 ? 26 : 30, top = 44 + Math.round((4 - n) * gap / 2);
    main.forEach(function (u, i) { u.x = 212 + (i % 2) * 6; u.y = top + i * gap; });
    gs.forEach(function (u, k) { u.x = 236; u.y = Math.min(124, Math.round(top + gap * 0.5 + k * gap * 2)); });
  };
  Battle.prototype.liveFoes = function () { return this.foes.filter(function (f) { return !f.dead; }); };
  Battle.prototype.liveHeroes = function () { return this.heroes.filter(function (u) { return !down(u); }); };
  Battle.prototype.allies = function (u) { return isHero(u) ? this.liveHeroes() : this.liveFoes(); };
  Battle.prototype.enemiesOf = function (u) { return isHero(u) ? this.liveFoes() : this.liveHeroes(); };

  // ------------------------------------------------------------------ scene plumbing
  Battle.prototype.enter = function () {
    var self = this;
    DS.audio.play(this.o.music || 'battle');
    DS.run(function* () { yield* self.flow(); });
  };
  Battle.prototype.update = function () { this.tick(); };
  Battle.prototype.tick = function () {
    if (this.intro > 0) this.intro--;
    if (this.flashT > 0) this.flashT--;
    if (this.shake > 0) this.shake--;
    this.fx = this.fx.filter(function (p) { p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; return --p.life > 0; });
    this.nums = this.nums.filter(function (n) { n.t++; return n.t < 50; });
    this.foes.forEach(function (f) { if (f.flash > 0) f.flash--; if (f.dead && f.fade > 0) f.fade--; });
    this.heroes.forEach(function (u) { if (u.poseT > 0 && --u.poseT === 0) u.pose = null; });
  };
  Battle.prototype.wait = function (n) { return W8.frames(n); };
  Battle.prototype.say = function* (t, frames) {
    this.msg = t; this.holding = false;
    var n = 0, lim = (frames || 44) + (DS.wrap(t, 240).length > 1 ? 24 : 0);
    yield W8.until(function () { n++; return n >= lim || (n > 8 && DS.top() && DS.top().kind === 'battle' && I.pressed('a')); });
  };
  // an effect line: held when it landed on one of ours, timed when on a foe
  Battle.prototype.note = function* (u, t, frames) {
    if (isHero(u)) yield* this.hold(t); else yield* this.say(t, frames);
  };
  // something that matters landed on the party (a grab, a poison, the ring's taunt, a fall): hold the line until Z
  Battle.prototype.hold = function* (t) {
    var self = this;
    this.msg = t; this.holding = true;
    var n = 0;
    yield W8.until(function () { n++; return (n > 20 && DS.top() && DS.top().kind === 'battle' && I.pressed('a')) || n > 420; });
    this.holding = false;
  };
  Battle.prototype.num = function (u, val, col) {
    var p = this.posOf(u);
    this.nums.push({ x: p.x, y: p.y - 4, v: val, col: col || '#F8F8F8', t: 0 });
  };
  Battle.prototype.posOf = function (u) {
    if (isHero(u)) return { x: u.x + 8, y: u.y + 4 };
    return { x: u.x + u.art.w / 2, y: u.y + u.art.h / 2 };
  };
  Battle.prototype.burst = function (u, col, n, spread, style) {
    var p = this.posOf(u);
    for (var i = 0; i < (n || 14); i++) {
      var a = Math.random() * Math.PI * 2, s = Math.random() * (spread || 1.6);
      var q = { x: p.x + (Math.random() - 0.5) * 10, y: p.y + (Math.random() - 0.5) * 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 16 + DS.rint(14), col: col, sz: 1 + DS.rint(2) };
      if (style === 'rise') { q.vx *= 0.3; q.vy = -0.6 - Math.random(); }
      if (style === 'fall') { q.vx *= 0.3; q.vy = 0.3 + Math.random(); q.y -= 12; }
      this.fx.push(q);
    }
  };
  Battle.prototype.bolt = function (from, to, col) {
    var a = this.posOf(from), b = this.posOf(to);
    for (var i = 0; i < 12; i++) {
      var t = i / 12;
      this.fx.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, vx: (b.x - a.x) / 40, vy: (b.y - a.y) / 40, life: 8 + i, col: col, sz: 2 });
    }
  };
  var ELEM = {
    fire: ['#F83800', '#FCA044', '#F8D878'], cold: ['#A4E4FC', '#F8F8F8', '#3CBCFC'], lightning: ['#F8F878', '#F8F8F8', '#FCE0A8'],
    force: ['#D8B8F8', '#F8F8F8', '#9878F8'], acid: ['#B8F818', '#58D854', '#D8F878'], radiant: ['#F8D878', '#F8F8F8', '#FCE0A8'],
    thunder: ['#B8B8F8', '#F8F8F8', '#6888FC'], poison: ['#9878F8', '#58D854', '#D800CC'], necrotic: ['#787878', '#503000', '#9878F8'],
    heal: ['#58F898', '#B8F8B8', '#F8F8F8'], buff: ['#F8F8F8', '#F8D878', '#B8F8D8'], sleep: ['#6888FC', '#B8B8F8', '#F8F8F8'],
    bludgeoning: ['#F8F8F8'], piercing: ['#F8F8F8'], slashing: ['#F8F8F8']
  };
  Battle.prototype.elemBurst = function (u, el, style) {
    var cols = ELEM[el] || ELEM.force, self = this;
    cols.forEach(function (c) { self.burst(u, c, 8, 1.8, style); });
  };

  // ------------------------------------------------------------------ core math
  Battle.prototype.acOf = function (u) {
    var ac = isHero(u) ? R.ac(u.h) : u.m.ac;
    if (u.buff && u.buff.ac) ac += u.buff.ac;
    if (u.conds.shielded) ac += 5;
    if (this.doorWardOn && isHero(u) && !down(u)) ac += 3; // the Door-Shield protects the party (RULED 09-26)
    return ac;
  };
  // Aura of Protection (paladin 6): while he stands, the party adds his CHA to saves
  Battle.prototype.aura = function () {
    var p = this.heroes.filter(function (x) { return !x.guest && x.h.cls === 'paladin' && x.h.lvl >= 6 && !down(x); })[0];
    return p ? Math.max(1, DS.mod(p.h.abil.cha)) : 0;
  };
  Battle.prototype.saveMod = function (u, ab) {
    if (isHero(u)) return R.saveBonus(u.h, ab) + (ab === 'con' && u.fortified ? 1 : 0) + this.aura(); // Marta's pie: +2 CON
    var s = u.m.saves && u.m.saves[ab];
    return s != null ? s : DS.mod(abil(u, ab));
  };
  // returns {total, nat, success}
  Battle.prototype.save = function (u, ab, dc, opt) {
    opt = opt || {};
    var adv = 0;
    if (opt.poison && u.conds.antitoxin) adv++;
    if (ab === 'dex' && (u.conds.restrained)) adv--;
    if ((ab === 'str' || ab === 'dex') && incap(u)) return { total: 0, nat: 1, success: false };
    var r1 = DS.d(20), r2 = DS.d(20), nat = adv > 0 ? Math.max(r1, r2) : adv < 0 ? Math.min(r1, r2) : r1;
    var tot = nat + this.saveMod(u, ab);
    if (u.buff && u.buff.id === 'bless') tot += DS.d(4);
    if (tot < dc && isHero(u) && u.h.cls === 'fighter' && u.h.lvl >= 9 && u.h.feats.indomitable) { // Indomitable: once a day, roll it again
      u.h.feats.indomitable = 0;
      var n2 = DS.d(20); tot = n2 + this.saveMod(u, ab) + (u.buff && u.buff.id === 'bless' ? DS.d(4) : 0); nat = n2;
      this.pendingMsg = plain(u) + (tot >= dc ? ' shakes it off.' : ' digs in, and it takes him anyway.');
    }
    return { total: tot, nat: nat, success: tot >= dc };
  };
  Battle.prototype.check = function (u, ab, skill) {
    var b = isHero(u) ? R.skill(u.h, skill, ab) : DS.mod(abil(u, ab)) + ((u.m.skills && u.m.skills[skill]) || 0);
    return DS.d(20) + b;
  };
  // advantage bookkeeping for an attack from a on t
  Battle.prototype.advantage = function (a, t, melee) {
    var adv = 0, dis = 0;
    if (a.conds.hidden) adv++;
    if (a.conds.invisible) adv++;
    if (t.conds.invisible) dis++;
    if (a.conds.reckless) adv++;
    if (t.conds.reckless) adv++;
    if (a.conds.poisoned || a.conds.frightened || a.conds.restrained || a.conds.blinded || a.conds.prone) dis++;
    if (t.conds.restrained || incap(t) || t.conds.blinded) adv++;
    if (t.conds.prone) { if (melee) adv++; else dis++; }
    if (!isHero(a) && a.m.traits && a.m.traits.packTactics && this.allies(a).length > 1) adv++;
    if (!isHero(a) && a.m.traits && a.m.traits.lightSensitive && this.bright) dis++;
    if (!isHero(t) && t.m.traits && t.m.traits.unseen && !t.conds.revealed) dis++;
    if (t.conds.engulfed && !isHero(a) && a.holding.indexOf(t) >= 0) adv++;
    return adv && !dis ? 1 : dis && !adv ? -1 : 0;
  };
  Battle.prototype.d20 = function (adv) {
    var r1 = DS.d(20), r2 = DS.d(20);
    return adv > 0 ? Math.max(r1, r2) : adv < 0 ? Math.min(r1, r2) : r1;
  };
  // apply typed damage; returns dealt amount
  Battle.prototype.hurt = function (u, n, type, from) {
    if (down(u)) return 0;
    n = Math.max(0, Math.round(n));
    if (!isHero(u)) {
      var m = u.m;
      if (m.immune && m.immune.indexOf(type) >= 0) {
        if (m.traits && m.traits.split && (type === 'slashing' || type === 'lightning') && u.hp >= 10 && this.foes.length < 8) this.splitFoe(u);
        return 0;
      }
      if (m.resist && (m.resist.indexOf(type) >= 0 || (m.resist.indexOf('mundane') >= 0 && /bludgeoning|piercing|slashing/.test(type) && !(from && from.magicWeapon)))) n = Math.floor(n / 2);
      if (m.vuln && m.vuln.indexOf(type) >= 0) n *= 2;
      if (u.conds.raging && /bludgeoning|piercing|slashing/.test(type)) n = Math.floor(n / 2);
      // the cloaker's damage transfer: half to the one it holds
      if (m.traits && m.traits.damageTransfer && u.holding.length && from && !from.fromHeld) {
        var held = u.holding[0], half = Math.floor(n / 2);
        n -= half;
        if (half > 0) this.hurt(held, half, type, { fromHeld: true });
      }
      u.hp -= n;
      if (u.conds.asleep && n > 0) delete u.conds.asleep;
      if (m.traits && m.traits.yields && !u.yielded && u.hp > 0 && u.hp <= u.maxhp / 2) { u.yielded = true; this.yielder = u; } // stops when he's beaten, if you do
      if (u.hp <= 0) { u.hp = 0; this.kill(u); }
      else if (m.traits && m.traits.split && type === 'slashing' && u.hp >= 10 && this.foes.length < 8) this.splitFoe(u);
      if (m.traits && m.traits.rageOnHit && !u.conds.raging && n > 0 && u.hp > 0) { u.conds.raging = { rounds: 10 }; this.pendingMsg = plain(u) + ' flies into a rage!'; }
      return n;
    }
    var h = u.h;
    if (h.resist && h.resist.indexOf(type) >= 0) n = Math.floor(n / 2);
    if (u.conds.stoneskin && /bludgeoning|piercing|slashing/.test(type) && !(from && from.magicWeapon)) n = Math.floor(n / 2);
    if (u.buff && u.buff.temp) { var soak = Math.min(u.buff.temp, n); u.buff.temp -= soak; n -= soak; u.soaked = (u.soaked || 0) + soak; }
    h.hp -= n;
    if (u.conds.asleep && n > 0) delete u.conds.asleep;
    if (h.hp <= 0) {
      if (h.feats.relentless && h.hp > -h.maxhp) { h.feats.relentless = 0; h.hp = 1; this.pendingMsg = h.name + ' refuses to fall!'; }
      else { h.hp = 0; h.ko = true; this.release(u); u.conds = {}; u.buff = null; DS.audio.sfx('ko'); }
    }
    return n;
  };
  Battle.prototype.heal = function (u, n) {
    if (down(u)) return 0;
    var h = u.h, before = h.hp;
    h.hp = Math.min(h.maxhp, h.hp + n);
    return h.hp - before;
  };
  Battle.prototype.kill = function (u) {
    u.dead = true; u.fade = 24; DS.audio.sfx('die');
    this.release(u);
    var self = this;
    // anyone this creature held goes free
    u.holding.forEach(function (t) { delete t.conds.grappled; delete t.conds.engulfed; delete t.conds.blinded; delete t.conds.restrained; });
    u.holding = [];
  };
  Battle.prototype.release = function (u) { // u stops being held by anyone
    this.foes.forEach(function (f) { var i = f.holding.indexOf(u); if (i >= 0) f.holding.splice(i, 1); });
    ['grappled', 'engulfed', 'attached'].forEach(function (k) { delete u.conds[k]; });
  };
  Battle.prototype.splitFoe = function (u) {
    var half = Math.floor(u.hp / 2);
    u.hp = u.hp - half; u.maxhp = Math.max(u.hp, Math.floor(u.maxhp / 2));
    var twin = this.makeFoe(u.m, u.name + "'");
    twin.hp = half; twin.maxhp = half; twin.init = u.init;
    this.foes.push(twin);
    var idx = this.order.indexOf(u);
    this.order.splice(idx + 1, 0, twin);
    this.layoutFoes();
    this.pendingMsg = plain(u) + ' splits in two!';
  };

  // ------------------------------------------------------------------ the flow
  Battle.prototype.flow = function* () {
    var self = this;
    yield this.wait(20);
    var names = {}, orderN = [];
    this.foes.forEach(function (f) { if (!names[f.m.name]) { names[f.m.name] = 0; orderN.push(f.m.name); } names[f.m.name]++; });
    yield* this.say(orderN.map(function (n) { return (names[n] > 1 ? names[n] + ' ' : '') + n; }).join(', ') + (this.foes.length > 1 ? ' appear!' : ' appears!'), 50);
    if (this.o.introText) yield* this.say(this.o.introText, 70);
    for (var hk = 0; hk < (DS.battleHooks || []).length; hk++) yield* DS.battleHooks[hk](this);
    if (this.o.roost) yield* this.say('Overhead, the roost: millions of sleeping wings. No fire. No bright light.', 60);
    // Sense Magic: the chuul feels a ring of binding coming
    var ringU = this.heroes.filter(function (u) { var r = R.item(u.h.equip.ring); return r && r.ring && r.ring.taunt; })[0];
    if (ringU) {
      var rg = R.item(ringU.h.equip.ring).ring.taunt;
      var bound = this.foes.filter(function (f) { return (f.m.tags || []).indexOf(rg.tag) >= 0; });
      if (bound.length) { this.tauntWearer = ringU; this.tauntRounds = rg.rounds; this.tauntTag = rg.tag; yield* this.say('Something in the deep feels the ring coming.', 60); }
    }
    // initiative, rolled once
    var all = this.heroes.concat(this.foes);
    all.forEach(function (u) { u.init = DS.d(20) + (isHero(u) ? R.initBonus(u.h) : DS.mod(abil(u, 'dex'))) + Math.random() * 0.1; });
    var seer = this.heroes.some(function (x) { var w = R.item(x.h.equip.weapon); return w && w.weapon && w.weapon.reveals; }); // the Sunshaft staff's light
    if (this.o.revealed || seer) this.foes.forEach(function (f) { f.conds.revealed = true; }); // seen coming: the light already on it
    this.order = all.slice().sort(function (a, b) { return b.init - a.init; });
    while (!this.over) {
      if (this.o.join && this.round === this.o.join && this.o.solo != null) yield* this.joinParty();
      if (this.tauntWearer && this.tauntRounds.indexOf(this.round) >= 0 && !down(this.tauntWearer)) {
        var bnd = this.liveFoes().filter(function (f) { return (f.m.tags || []).indexOf(self.tauntTag) >= 0; });
        if (bnd.length) {
          DS.audio.sfx('ring');
          this.burst(this.tauntWearer, '#F8D878', 16, 1.4, 'rise');
          yield* this.hold('The ring flares! The ' + bnd[0].m.name.toLowerCase() + ' turns on ' + nameOf(this.tauntWearer) + '!');
        }
      }
      if (this.round === 1 && this.o.surprised && !this.surpriseSaid) { this.surpriseSaid = true; yield* this.hold(this.o.surprised === 'party' ? 'Caught off guard! They have the first round.' : 'They never saw you coming. The first round is yours.'); }
      for (var k = 0; k < this.order.length && !this.over; k++) {
        var u = this.order[k];
        if (down(u)) continue;
        if (this.round === 1 && ((this.o.surprised === 'party' && isHero(u)) || (this.o.surprised === 'foes' && !isHero(u)))) continue;
        yield* this.turn(u);
        this.checkEnd();
      }
      this.round++;
    }
    yield* this.finish();
  };
  // a lone hero's fight that the rest of the party runs into (the wagon yard): they join at the top of a round
  Battle.prototype.joinParty = function* () {
    var self = this, here = this.heroes.map(function (u) { return u.h; });
    var more = DS.G.party.filter(function (h) { return here.indexOf(h) < 0 && !h.ko; });
    this.o.solo = null;
    if (!more.length) return;
    more.forEach(function (h) {
      var u = { side: 'hero', h: h, idx: 0, conds: {}, buff: null, off: 0, pose: null, poseT: 0 };
      u.init = DS.d(20) + R.initBonus(h) + Math.random() * 0.1;
      self.heroes.push(u); self.order.push(u);
    });
    this.heroes.sort(function (a, b) { return (a.guest ? 9 : DS.G.party.indexOf(a.h)) - (b.guest ? 9 : DS.G.party.indexOf(b.h)); });
    this.heroes.forEach(function (u) { if (!u.guest) u.idx = DS.G.party.indexOf(u.h); });
    this.order.sort(function (a, b) { return b.init - a.init; });
    this.layoutHeroes();
    DS.audio.sfx('confirm');
    yield* this.hold('The rest of the party comes pounding out of the inn!');
  };
  // foes that only fight to get away (Amara and Willem): each round one runs for it while the other covers
  Battle.prototype.runner = function () {
    if (this.o.noFlee) return null;
    var fl = this.liveFoes().filter(function (x) { return x.m.traits && x.m.traits.flees; });
    if (!fl.length) return null;
    return fl.length > 1 ? fl[(this.round - 1) % fl.length] : fl[0];
  };
  Battle.prototype.foeFlee = function* (f) {
    var self = this;
    if (!this.darknessUp && this.o.darkness) { // Amara's darkness over the yard (the beats hold for Z: playtest 09-25, too fast to read)
      this.darknessUp = true; this.bright = false; DS.audio.sfx('magic'); this.flashT = 6;
      yield* this.hold('Amara throws darkness over the yard!');
    }
    var best = 0; this.liveHeroes().forEach(function (u) { best = Math.max(best, DS.mod(u.h.abil.dex)); });
    var roll = DS.d(20) + DS.mod(abil(f, 'dex'));
    f.off = -10;
    yield* this.say(nameOf(f) + ' breaks for the horses...', 56);
    f.off = 0;
    if (roll >= 10 + best) {
      DS.audio.sfx('run');
      var away = this.liveFoes().filter(function (x) { return x.m.traits && x.m.traits.flees; });
      DS.fledIds = away.map(function (x) { return x.id; }); // who's still out there, for the chase
      yield* this.hold(away.length > 1 ? 'They get to the horses! Both of them are away into the dark.' : nameOf(f) + ' gets to a horse and is away into the dark!');
      this.over = 'fled';
    } else yield* this.hold('...and is cut off. (' + roll + ' vs ' + (10 + best) + ')');
  };
  // one who runs the moment the one in charge is down: gone up the stair, no fight left in him (the wheelwright)
  Battle.prototype.foeBolt = function* (f) {
    f.off = -10;
    DS.audio.sfx('run');
    yield* this.say(nameOf(f) + ' drops what he was holding and runs for the stair!', 50);
    f.off = 0; f.dead = true; f.fled = true; f.fade = 24; this.release(f);
    if (f.m.traits.flag) DS.G.flags[f.m.traits.flag] = 1;
    yield* this.say(nameOf(f) + ' is gone.', 30);
  };
  // the Door-Shield (RULED 09-26, Griz): 3% on a miss the shield could have caused; energy goes out from the shield and
  // comes down on the party with a sheen; +3 AC to all until the wearer's next turn. No rule text anywhere: a named item.
  Battle.prototype.doorWard = function* (t) {
    var sh = R.item(t.h.equip.shield), self = this;
    if (!sh || !sh.shield || !sh.shield.doorward || this.doorWardOn || down(t) || this.over) return;
    if (Math.random() >= (DS.doorWardChance != null ? DS.doorWardChance : 0.03)) return;
    var c = this.posOf(t);
    DS.audio.sfx('magic');
    for (var k = 0; k < 28; k++) { var a = k / 28 * Math.PI * 2; this.fx.push({ x: c.x, y: c.y, vx: Math.cos(a) * 1.7, vy: Math.sin(a) * 1.7, life: 20, col: k % 2 ? '#E8F0FF' : '#A4C8F8', sz: 2 }); }
    yield this.wait(18);
    this.liveHeroes().forEach(function (u) {
      var p = self.posOf(u);
      for (var k2 = 0; k2 < 12; k2++) { var a2 = k2 / 12 * Math.PI * 2, sx = p.x + Math.cos(a2) * 26, sy = p.y + Math.sin(a2) * 26; self.fx.push({ x: sx, y: sy, vx: (p.x - sx) / 14, vy: (p.y - sy) / 14, life: 14, col: '#F8F8F8', sz: 1 }); }
    });
    yield this.wait(14);
    this.doorWardOn = t; this.flashT = 4; DS.audio.sfx('buff');
    yield* this.say('The ' + sh.name + ' protects the party.', 60);
  };
  Battle.prototype.checkEnd = function () {
    if (this.over) return;
    if (this.yielder && !this.yielder.dead) { this.over = 'yield'; return; }
    if (!this.liveFoes().length) this.over = 'win';
    else if (!this.liveHeroes().length) {
      // a lone watcher down in the yard isn't the end while the others are on their way out of the inn
      var self = this, coming = this.o.join && this.o.solo != null && DS.G.party.some(function (h) { return !h.ko && self.heroes.every(function (u) { return u.h !== h; }); });
      if (coming) this.o.join = Math.max(this.o.join, this.round + 1); else this.over = 'lose';
    }
  };
  Battle.prototype.flushMsg = function* () {
    if (this.pendingMsg) { var m = this.pendingMsg; this.pendingMsg = null; yield* this.say(m, 44); }
  };
  Battle.prototype.turn = function* (u) {
    this.active = u;
    // start-of-turn
    if (u.buff && u.buff.id === 'heroism' && isHero(u)) { // temporary HP at the start of each of its turns (playtest 09-26: it was there, but nothing showed it)
      var gain = u.buff.tempEach - (u.buff.temp || 0);
      u.buff.temp = Math.max(u.buff.temp || 0, u.buff.tempEach);
      if (gain > 0) { this.num(u, '+' + gain, '#6CF0F8'); this.elemBurst(u, 'buff', 'rise'); }
    }
    if (this.doorWardOn === u) this.doorWardOn = null;
    delete u.conds.shielded;
    delete u.conds.dodged;
    if (u.conds.prone && !incap(u) && !u.conds.grappled) { delete u.conds.prone; yield* this.say(nameOf(u) + ' gets back up.', 30); }
    if (u.conds.attached && isHero(u)) {
      var src = u.conds.attached.src;
      if (src && !src.dead) {
        var dmg = this.hurt(u, DS.roll('1d4+3'), 'piercing', src);
        this.num(u, dmg, '#F85838'); DS.audio.sfx('hit');
        yield* this.say(nameOf(src) + ' drains ' + nameOf(u) + '. ' + dmg + ' damage.', 36);
        yield* this.flushMsg();
        if (down(u)) { yield* this.hold(nameOf(u) + ' falls!'); return; }
      } else delete u.conds.attached;
    }
    if (incap(u)) {
      var why = u.conds.paralyzed ? 'is paralyzed' : u.conds.asleep ? 'is asleep' : 'is stunned';
      yield* this.say(nameOf(u) + ' ' + why + '!', 34);
    } else if (isHero(u)) {
      yield* this.heroTurn(u);
    } else {
      yield* this.foeTurn(u);
    }
    if (!down(u)) yield* this.endTurn(u);
    this.checkEnd();
  };
  Battle.prototype.endTurn = function* (u) {
    var self = this, msgs = [];
    Object.keys(u.conds).forEach(function (k) {
      var c = u.conds[k];
      if (!c || typeof c !== 'object') return;
      if (c.save && !down(u)) {
        var s = self.save(u, c.save.ab, c.save.dc, { poison: k === 'poisoned' });
        if (s.success) { delete u.conds[k]; msgs.push(plain(u) + ' shakes off ' + k + '.'); return; }
      }
      if (c.rounds != null) { c.rounds--; if (c.rounds <= 0) { delete u.conds[k]; if (k !== 'hidden' && k !== 'blinded') msgs.push(plain(u) + ' is no longer ' + k + '.'); } }
    });
    // conditions that ride on another
    Object.keys(u.conds).forEach(function (k) { var c = u.conds[k]; if (c && c.linked && !u.conds[c.linked]) { delete u.conds[k]; msgs.push(plain(u) + ' can move again.'); } });
    if (u.buff && u.buff.rounds != null && --u.buff.rounds <= 0) { msgs.push(plain(u) + "'s " + u.buff.name + ' fades.'); u.buff = null; }
    for (var i = 0; i < msgs.length; i++) yield* this.say(msgs[i], 34);
  };

  // ------------------------------------------------------------------ hero turn
  // a guest's turn: at the nearest foe, with what it carries (never menu'd)
  Battle.prototype.guestTurn = function* (u) {
    var foes = this.liveFoes(), self = this;
    if (!foes.length) return;
    var hurt = this.liveHeroes().filter(function (x) { return x.h.hp < x.h.maxhp / 2; }).sort(function (a, b) { return a.h.hp / a.h.maxhp - b.h.hp / b.h.maxhp; })[0];
    if (u.h.healer && (u.h.feats.heals || 0) > 0 && hurt) { // a guest who heals (Ingrith): Rekknar balances the account
      u.h.feats.heals--; var hv = this.heal(hurt, DS.roll('2d8+3'));
      DS.audio.sfx('heal'); this.elemBurst(hurt, 'heal', 'rise'); this.num(hurt, hv, '#58F898');
      yield* this.say(nameOf(u) + ' lays a hand on ' + nameOf(hurt) + '. +' + hv + ' HP.', 40);
      return;
    }
    var t = foes.slice().sort(function (a, b) { return (b.x + b.art.w) - (a.x + a.art.w); })[0];
    u.off = 6;
    yield* this.heroAttack(u, t, { actions: 1, bonus: 0, surged: false, sneakUsed: true }, null);
    u.off = 0;
  };
  Battle.prototype.heroTurn = function* (u) {
    var h = u.h, self = this;
    if (u.guest) { yield* this.guestTurn(u); return; }
    var st = { actions: 1, bonus: 1, surged: false, sneakUsed: false };
    u.off = 6;
    while (st.actions > 0 && !this.over && !down(u) && !incap(u)) {
      var held = u.conds.grappled || u.conds.engulfed || (u.conds.restrained && u.conds.restrained.escape);
      var skills = this.skillList(u, st);
      var castable = R.spellList(h, 'battle').concat(h.cls === 'paladin' && R.maxSlotLevel(h) > 0 ? [DS.DATA.spells.smite] : []);
      var items = this.battleItems();
      var fastHands = h.subclass === 'Thief' && st.bonus > 0; // Thief: ITEM as a bonus action
      var cmds = [
        { label: 'FIGHT', value: 'fight' },
        { label: 'MAGIC', value: 'magic', disabled: !castable.length },
        { label: 'SKILL', value: 'skill', disabled: !skills.some(function (x) { return !x.disabled; }) },
        { label: 'ITEM', value: 'item', disabled: !items.length, right: fastHands ? 'bonus' : null },
        held ? { label: 'ESCAPE', value: 'escape' } : { label: 'RUN', value: 'run', disabled: this.o.canRun === false }
      ];
      this.msg = h.name + (st.surged ? ' surges!' : '') + (st.actions > 1 ? ' (2 actions)' : '');
      var cmd = yield DS.choose({ items: cmds, x: 0, y: 156, w: 90, h: 84, rowH: 12, pad: 8, cancelable: false, index: this.lastCmd && this.lastCmd[h.id] || 0 });
      this.lastCmd = this.lastCmd || {}; this.lastCmd[h.id] = ['fight', 'magic', 'skill', 'item', 'run', 'escape'].indexOf(cmd) % 5;
      var used = false;
      if (cmd === 'fight') {
        var t = yield* this.pickFoe();
        if (!t) continue;
        yield* this.heroAttack(u, t, st, null);
        used = true;
      } else if (cmd === 'magic') {
        var sp = yield* this.pickSpell(u, castable);
        if (!sp) continue;
        used = yield* this.castSpell(u, sp, st);
      } else if (cmd === 'skill') {
        var sk = yield DS.choose({ items: skills, x: 0, y: 156 - Math.max(0, skills.length * 11 - 50), w: 120, rowH: 11, pad: 7 });
        if (!sk) continue;
        var res = yield* this.useSkill(u, sk, st);
        if (res === 'cancel') continue;
        if (res === 'bonus') { st.bonus = 0; continue; }
        if (res === 'free') continue;
        used = true;
      } else if (cmd === 'item') {
        var it = yield DS.choose({ items: items, x: 0, y: 96, w: 150, rowH: 11, pad: 7, visible: 6 });
        if (!it) continue;
        used = yield* this.useItem(u, it);
        if (used && fastHands && !this.usedFire) { st.bonus = 0; used = false; } // Fast Hands: the action is still hers
      } else if (cmd === 'run') {
        yield* this.tryRun(u);
        used = true;
      } else if (cmd === 'escape') {
        yield* this.tryEscape(u);
        used = true;
      }
      if (used) st.actions--;
      if (this.usedFire && this.o.roost && !this.over) this.over = 'roost'; // the one law, broken
      this.checkEnd();
    }
    u.off = 0;
  };
  Battle.prototype.skillList = function (u, st) {
    var h = u.h, f = h.feats, L = [];
    if (h.cls === 'fighter') {
      if (f.secondWind) L.push({ label: 'SECOND WIND', value: 'secondWind', right: 'bonus', disabled: !st.bonus });
      if (f.actionSurge && !st.surged) L.push({ label: 'ACTION SURGE', value: 'actionSurge', right: 'free' });
    }
    if (h.cls === 'rogue') { // Cunning Action: the bonus-action hide goes before or after her attack
      L.push({ label: 'HIDE + ATTACK', value: 'hideAttack', right: 'bonus', disabled: !st.bonus });
      L.push({ label: 'ATTACK + HIDE', value: 'attackHide', right: 'bonus', disabled: !st.bonus });
    }
    if (h.cls === 'paladin') {
      if (f.lay > 0) L.push({ label: 'LAY ON HANDS', value: 'lay', right: f.lay });
      if (f.channel && h.lvl >= 3) L.push({ label: 'SACRED WEAPON', value: 'sacred', right: 'CD' });
    }
    return L;
  };
  Battle.prototype.battleItems = function () {
    return DS.G.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it && it.use && it.use.battle && s.n > 0; })
      .map(function (s) { var it = DS.DATA.items[s.id]; return { label: it.name, right: 'x' + s.n, value: s.id }; });
  };
  // target pickers ----------------------------------------------------------
  Battle.prototype.pickFoe = function* (filter) {
    var list = this.liveFoes().filter(filter || function () { return true; });
    if (!list.length) return null;
    return yield W8.scene(new TargetScene(this, list, 'foe'));
  };
  Battle.prototype.pickAlly = function* (filter) {
    var list = this.heroes.filter(filter || function (u) { return !down(u); });
    if (!list.length) return null;
    return yield W8.scene(new TargetScene(this, list, 'hero'));
  };
  Battle.prototype.pickSpell = function* (u, list) {
    var h = u.h, self = this;
    var roost = this.o.roost;
    var items = list.map(function (sp) {
      var lv = sp.id === 'smite' ? R.lowestSlot(h, 1) : sp.level ? R.lowestSlot(h, sp.level) : 0;
      // under a roost the fire and thunder spells are out (RULED 09-24): grayed. Light stays castable, and costs you.
      var banned = roost && (sp.el === 'fire' || sp.el === 'thunder');
      var dis = (sp.level > 0 && !lv) || banned;
      return { label: sp.name, value: sp, right: banned ? 'ROOST' : sp.level === 0 ? '—' : 'L' + (lv || sp.level), disabled: dis };
    });
    var slotTxt = (h.slots || []).map(function (n, i) { return 'L' + (i + 1) + ':' + n + '/' + h.slotsMax[i]; }).join(' ');
    return yield DS.choose({
      items: items, x: 0, y: 70, w: 150, rowH: 11, pad: 7, visible: 7, title: slotTxt || 'CANTRIPS',
      drawExtra: function (ctx, menu) { var sp = menu.current() && menu.current().value; if (sp) { DS.win(ctx, 0, 36, 256, 34); var ln = DS.wrap(sp.desc || '', 240); for (var i = 0; i < Math.min(2, ln.length); i++) DS.text(ctx, ln[i], 8, 44 + i * 11); } }
    });
  };

  // ------------------------------------------------------------------ attacks
  Battle.prototype.heroAttack = function* (u, t, st, smite) {
    var h = u.h, w = R.weaponOf(h), n = R.attacksPerTurn(h), self = this;
    u.pose = 'act'; u.poseT = 999;
    for (var a = 0; a < n && !this.over; a++) {
      if (down(t)) { var alt = this.liveFoes(); if (!alt.length) break; t = DS.pick(alt); }
      var melee = (w.weapon.props || []).indexOf('ranged') < 0;
      var adv = this.advantage(u, t, melee);
      // Cutthroat's Opening Cut: first round, a foe that hasn't moved yet
      var opening = h.subclass === 'Cutthroat' && this.round === 1 && !isHero(t) && !t.acted;
      if (opening) adv = adv < 0 ? 0 : 1;
      var nat = this.d20(adv);
      var bonus = R.attackBonus(h, w) + (u.buff && u.buff.atk ? u.buff.atk : 0) + (u.buff && u.buff.id === 'bless' ? DS.d(4) : 0);
      var total = nat + bonus, ac = this.acOf(t);
      var wasHidden = !!u.conds.hidden; delete u.conds.hidden;
      // the cloaker's phantasms: a hit may land on an image
      if (!isHero(t) && t.images > 0 && nat !== 20 && DS.d(t.images + 1) > 1 && total >= ac) {
        t.images--; DS.audio.sfx('miss');
        yield* this.say(nameOf(u) + ' strikes a phantasm! It bursts.', 36);
        continue;
      }
      if (nat === 1 || (nat !== 20 && total < ac)) {
        DS.audio.sfx('miss'); this.num(t, 'MISS', '#9C9C9C');
        yield* this.say(nameOf(u) + ' attacks ' + nameOf(t) + '... and misses.', 34);
        continue;
      }
      var crit = nat >= R.critRange(h) || (melee && incap(t)) || opening;
      var dx = R.damageExpr(h, w);
      var gwf = h.cls === 'fighter' && R.twoHanded(h, w) && h.id === 'barley';
      var dmg = (dx.dice === '0' ? 0 : DS.roll(dx.dice, { crit: crit, reroll12: gwf })) + dx.mod;
      if (crit && h.id === 'lymen' && melee) dmg += DS.roll('1' + dx.dice.replace(/^\d+/, ''), {}); // Savage Attacks
      var extra = opening ? ' Opening cut!' : '', rad = 0;
      var sneaked = false;
      if (h.cls === 'rogue' && !st.sneakUsed && (w.weapon.props || []).join().match(/finesse|ranged/) && adv >= 0 && (adv > 0 || wasHidden || this.liveHeroes().length > 1)) {
        var sn = DS.roll(R.sneakDice(h.lvl), { crit: crit }); dmg += sn; st.sneakUsed = true; extra += ' Sneak Attack!'; sneaked = true;
      }
      if (smite) {
        rad = DS.roll((1 + smite) + 'd8', { crit: crit });
        if (tags(t).indexOf('undead') >= 0 || tags(t).indexOf('fiend') >= 0) rad += DS.roll('1d8', { crit: crit });
        h.slots[smite - 1]--; smite = 0; extra += ' Divine Smite!';
        this.elemBurst(t, 'radiant');
      }
      if (u.buff && u.buff.id === 'divineFavor') rad += DS.d(4);
      var dealt = this.hurt(t, Math.max(1, dmg), dx.type, { magicWeapon: (w.weapon.bonus || 0) > 0 });
      if (rad) dealt += this.hurt(t, rad, 'radiant', {});
      var tImm = function (c) { return !isHero(t) && (t.m.condImmune || []).indexOf(c) >= 0; };
      if (crit && w.weapon.onCrit === 'prone' && !down(t) && !t.conds.prone && !tImm('prone')) { t.conds.prone = true; extra += ' Knocked flat!'; } // the Winnower threshes
      if (sneaked && w.weapon.sneakPoison && !down(t) && !tImm('poisoned')) { // the Greyseam knife
        if (!this.save(t, 'con', w.weapon.sneakPoison).success) { t.conds.poisoned = { rounds: 1 }; extra += ' Poisoned!'; }
      }
      t.flash = 14; DS.audio.sfx(crit ? 'crit' : 'hit');
      if (crit) { this.flashT = 6; this.shake = 6; }
      this.num(t, dealt, crit ? '#F8D878' : '#F8F8F8');
      var imm = dealt === 0 ? ' No effect!' : '';
      yield* this.say((crit ? 'Critical! ' : '') + nameOf(u) + ' hits ' + nameOf(t) + ' for ' + dealt + '.' + extra + imm, crit ? 48 : 38);
      yield* this.flushMsg();
      if (down(t)) yield* this.say(nameOf(t) + ' is defeated!', 30);
    }
    u.pose = null; u.poseT = 0;
  };
  Battle.prototype.tryRun = function* (u) {
    if (this.o.canRun === false) { yield* this.say('There is no running from this!', 40); return; }
    if (this.liveHeroes().some(function (x) { return x.conds.grappled || x.conds.engulfed; })) { yield* this.say('Someone is held fast. No one leaves.', 40); return; }
    var best = 0; this.liveFoes().forEach(function (f) { best = Math.max(best, DS.mod(f.m.abil.dex || 10)); });
    var roll = DS.d(20) + DS.mod(u.h.abil.dex);
    if (roll >= 10 + best) { DS.audio.sfx('run'); yield* this.say('The party slips away!', 36); this.over = 'run'; }
    else yield* this.say("Can't get away!", 34);
  };
  Battle.prototype.tryEscape = function* (u) {
    var c = u.conds.engulfed || u.conds.grappled || u.conds.restrained;
    var dc = c.escape || 14;
    var ath = this.check(u, 'str', 'Athletics'), acr = this.check(u, 'dex', 'Acrobatics'), best = Math.max(ath, acr);
    if (best >= dc) {
      this.release(u); delete u.conds.restrained; delete u.conds.blinded;
      DS.audio.sfx('confirm');
      yield* this.say(nameOf(u) + ' breaks free! (' + best + ' vs DC ' + dc + ')', 44);
    } else {
      DS.audio.sfx('error');
      yield* this.say(nameOf(u) + ' struggles, but is held. (' + best + ' vs DC ' + dc + ')', 44);
    }
  };

  // ------------------------------------------------------------------ skills
  Battle.prototype.useSkill = function* (u, sk, st) {
    var h = u.h, f = h.feats, self = this;
    if (sk === 'secondWind') {
      var n = this.heal(u, DS.roll('1d10') + h.lvl); f.secondWind = 0;
      DS.audio.sfx('heal'); this.elemBurst(u, 'heal', 'rise'); this.num(u, n, '#58F898');
      yield* this.say(nameOf(u) + ' catches a second breath. +' + n + ' HP.', 44);
      return 'bonus';
    }
    if (sk === 'actionSurge') {
      f.actionSurge = 0; st.actions++; st.surged = true;
      DS.audio.sfx('buff'); this.elemBurst(u, 'buff', 'rise');
      yield* this.say(nameOf(u) + ' surges! One more action this turn.', 44);
      return 'free';
    }
    if (sk === 'hideAttack' || sk === 'attackHide') {
      var tg = yield* this.pickFoe();
      if (!tg) return 'cancel';
      var hideR = h.lvl >= 9 ? 3 : 2;
      if (sk === 'hideAttack') { u.conds.hidden = { rounds: hideR }; DS.audio.sfx('run'); yield* this.say(nameOf(u) + ' melts into the shadows, then strikes from them.', 38); }
      yield* this.heroAttack(u, tg, st, null);
      if (sk === 'attackHide' && !this.over && !down(u)) { u.conds.hidden = { rounds: hideR }; DS.audio.sfx('run'); yield* this.say(nameOf(u) + ' slips back into the shadows. Harder to find; her next strike has advantage.', 44); }
      st.bonus = 0;
      return 'action';
    }
    if (sk === 'lay') {
      var t = yield* this.pickAlly();
      if (!t) return 'cancel';
      var hasPoison = t.conds.poisoned || t.conds.paralyzed;
      var opts = [{ label: 'HEAL', value: 'heal', disabled: t.h.hp >= t.h.maxhp }, { label: 'CURE POISON (5)', value: 'cure', disabled: f.lay < 5 || !hasPoison }];
      var mode = yield DS.choose({ items: opts, x: 60, y: 110, w: 130, rowH: 11, pad: 7 });
      if (!mode) return 'cancel';
      if (mode === 'heal') {
        var amt = Math.min(f.lay, t.h.maxhp - t.h.hp); f.lay -= amt; this.heal(t, amt);
        DS.audio.sfx('heal'); this.elemBurst(t, 'heal', 'rise'); this.num(t, amt, '#58F898');
        yield* this.say(nameOf(u) + ' lays on hands. ' + nameOf(t) + ' +' + amt + ' HP.', 44);
      } else {
        f.lay -= 5; delete t.conds.poisoned; delete t.conds.paralyzed;
        DS.audio.sfx('heal'); this.elemBurst(t, 'radiant', 'rise');
        yield* this.say(nameOf(u) + ' draws the poison out of ' + nameOf(t) + '.', 48);
      }
      return 'action';
    }
    if (sk === 'sacred') {
      f.channel = 0;
      u.buff = { id: 'sacred', name: 'Sacred Weapon', atk: Math.max(1, DS.mod(h.abil.cha)), rounds: 10 };
      DS.audio.sfx('buff'); this.elemBurst(u, 'radiant', 'rise');
      yield* this.say(nameOf(u) + "'s blade takes Kalindel's light. +" + u.buff.atk + ' to hit.', 48);
      return 'action';
    }
    return 'cancel';
  };

  // ------------------------------------------------------------------ magic
  Battle.prototype.castSpell = function* (u, sp, st) {
    var h = u.h, self = this;
    if (sp.id === 'smite') {
      var lv = R.lowestSlot(h, 1);
      if (!lv) { yield* this.say('No spell slots left.', 30); return false; }
      var choice = lv;
      if (R.lowestSlot(h, 2)) {
        var pick = yield DS.choose({ items: [{ label: 'SMITE (L1) 2d8', value: 1, disabled: !h.slots[0] }, { label: 'SMITE (L2) 3d8', value: 2, disabled: !h.slots[1] }], x: 40, y: 100, w: 140, rowH: 11, pad: 7 });
        if (!pick) return false; choice = pick;
      }
      var t = yield* this.pickFoe();
      if (!t) return false;
      yield* this.heroAttack(u, t, st, choice);
      return true;
    }
    var slot = sp.level ? R.lowestSlot(h, sp.level) : 0;
    if (sp.level && !slot) { yield* this.say('No spell slots left.', 30); return false; }
    // choose targets
    var targets = [];
    if (sp.target === 'enemy' || sp.target === 'cone' || sp.target === 'line') {
      var t0 = yield* this.pickFoe(sp.only ? function (f) { return (f.m.tags || []).indexOf(sp.only) >= 0; } : null);
      if (!t0) return false;
      targets = [t0];
      if (sp.target !== 'enemy') {
        var rest = this.liveFoes().filter(function (f) { return f !== t0; }), cnt = sp.max ? sp.max - 1 : sp.target === 'cone' ? 2 : 3;
        rest.sort(function (a, b) { return Math.abs(a.y - t0.y) + Math.abs(a.x - t0.x) - (Math.abs(b.y - t0.y) + Math.abs(b.x - t0.x)); });
        targets = targets.concat(rest.slice(0, cnt));
      }
    } else if (sp.target === 'enemies') targets = this.liveFoes();
    else if (sp.target === 'ally') {
      var unarmored = sp.buff === 'mageArmor' ? function (x) { return !down(x) && !R.armored(x.h); } : null; // Mage Armor: an unarmored ally only
      if (unarmored && !this.heroes.some(unarmored)) { yield* this.say('No one here goes unarmored. Mage Armor has no one to take it.', 40); return false; }
      var ta = yield* this.pickAlly(unarmored); if (!ta) return false; targets = [ta];
    }
    else if (sp.target === 'allies') targets = this.liveHeroes().slice(0, sp.max || 4);
    else if (sp.target === 'self') targets = [u];
    else if (sp.target === 'revive') { // Revivify: a diamond, and someone to bring back
      if (!DS.G.count('diamond')) { yield* this.say('Revivify needs a diamond worth 300 gp. There is none in the pack.', 44); return false; }
      if (!this.heroes.some(function (x) { return down(x) && !x.guest; })) { yield* this.say('No one is down.', 30); return false; }
      var tr = yield* this.pickAlly(function (x) { return down(x) && !x.guest; }); if (!tr) return false; targets = [tr];
    }
    if (slot) h.slots[slot - 1]--;
    u.pose = 'cast'; u.poseT = 60;
    DS.audio.sfx(sp.sfx || 'magic');
    yield* this.say(nameOf(u) + ' casts ' + sp.name + '!', 34);
    if (this.o.roost && (sp.kind === 'light' || sp.el === 'fire' || sp.el === 'thunder')) { // bright light (or fire) under the roost
      this.usedFire = true; this.roostCause = sp.kind === 'light' ? 'light' : 'fire'; u.pose = null; return true;
    }
    var up = slot ? slot - sp.level : 0, dc = R.spellDC(h), atk = R.spellAtk(h);
    var k = sp.kind;
    if (k === 'light') {
      this.flashT = 10;
      this.foes.forEach(function (f) { f.conds.revealed = true; });
      yield* this.dazzle(nameOf(u) + "'s light floods the dark.");
      return true;
    }
    for (var i = 0; i < targets.length && !this.over; i++) {
      var t = targets[i];
      if (k === 'revive') {
        DS.G.take('diamond', 1); t.h.ko = false; t.h.hp = 1; t.conds = {};
        DS.audio.sfx('heal'); this.elemBurst(t, 'radiant', 'rise'); this.num(t, '+1', '#58F898');
        yield* this.say('The diamond goes to dust in ' + nameOf(u) + "'s hand. " + nameOf(t) + ' breathes, and is up!', 50);
        continue;
      }
      if (down(t) && k !== 'buff') { if (sp.target === 'enemy') { var alts = this.liveFoes(); if (!alts.length) break; t = DS.pick(alts); } else continue; }
      if (k === 'attack') {
        var rays = (sp.rays || 1) + (sp.rayUp ? up : 0);
        for (var r = 0; r < rays && !down(t); r++) {
          var adv = this.advantage(u, t, false), nat = this.d20(adv);
          var dice = sp.level === 0 ? R.cantripDice(sp, h) : sp.dmg;
          this.bolt(u, t, (ELEM[sp.el] || ELEM.force)[0]);
          yield this.wait(10);
          if (nat === 1 || (nat !== 20 && nat + atk < this.acOf(t))) { DS.audio.sfx('miss'); this.num(t, 'MISS', '#9C9C9C'); yield* this.say('It misses ' + nameOf(t) + '.', 26); continue; }
          var d = this.hurt(t, DS.roll(dice, { crit: nat === 20 }), sp.el, { magicWeapon: true });
          if (sp.cond && !down(t)) t.conds[sp.cond] = { rounds: 1 };
          this.elemBurst(t, sp.el); t.flash = 12; DS.audio.sfx('hit'); this.num(t, d, '#F8D878');
          yield* this.say(nameOf(t) + ' takes ' + d + ' ' + sp.el + ' damage.' + (d === 0 ? ' No effect!' : ''), 34);
          yield* this.flushMsg();
        }
      } else if (k === 'auto') {
        var darts = (sp.darts || 3) + up, tot = 0;
        for (var q = 0; q < darts; q++) { this.bolt(u, t, '#D8B8F8'); tot += DS.roll(sp.dmg); }
        yield this.wait(14);
        var dd = this.hurt(t, tot, sp.el, { magicWeapon: true });
        this.elemBurst(t, sp.el); t.flash = 12; DS.audio.sfx('hit'); this.num(t, dd, '#F8D878');
        yield* this.say(darts + ' darts strike ' + nameOf(t) + ' for ' + dd + '.', 38);
        yield* this.flushMsg();
      } else if (k === 'save') {
        var s = this.save(t, sp.save, dc, { poison: sp.el === 'poison' });
        var potent = sp.level === 0 && h.cls === 'wizard' && h.lvl >= 6; // Potent Cantrip: a save still takes half
        var dexp = sp.level === 0 ? R.cantripDice(sp, h) : sp.dmg;
        var upd = function (e) { return e.replace(/^(\d+)d/, function (m0, nn) { return (parseInt(nn, 10) + up * (sp.upDice || 0)) + 'd'; }); };
        var dmgT = dexp ? DS.roll(upd(dexp)) : 0, dmg2 = sp.dmg2 ? DS.roll(sp.dmg2) : 0;
        if (s.success) { dmgT = sp.half || potent ? Math.floor(dmgT / 2) : 0; dmg2 = sp.half || potent ? Math.floor(dmg2 / 2) : 0; }
        var dealt = dmgT ? this.hurt(t, dmgT, sp.el, { magicWeapon: true }) : 0;
        if (dmg2 && !down(t)) dealt += this.hurt(t, dmg2, sp.el2, { magicWeapon: true });
        this.elemBurst(t, sp.el); if (dealt) { t.flash = 12; this.num(t, dealt, '#F8D878'); }
        var line = nameOf(t) + (s.success ? ' resists' : ' is caught') + (dealt ? '. ' + dealt + ' damage.' : '.');
        if (!s.success && sp.cond && !down(t) && !(t.m && (t.m.condImmune || []).indexOf(sp.cond) >= 0)) {
          if (sp.only && tags(t).indexOf(sp.only) < 0) line += ' It is not affected.';
          else { t.conds[sp.cond] = { rounds: sp.rounds || 10, save: sp.repeat ? { ab: sp.save, dc: dc } : null, escape: sp.cond === 'restrained' ? dc : null }; line += ' It is ' + sp.cond + '!'; }
        }
        yield* this.say(line, 36);
        yield* this.flushMsg();
      } else if (k === 'sleep') {
        var pool = DS.roll((5 + 2 * up) + 'd8'), slept = [];
        this.liveFoes().sort(function (a, b) { return a.hp - b.hp; }).forEach(function (f) {
          if (f.hp <= pool && (f.m.condImmune || []).indexOf('asleep') < 0 && (f.m.tags || []).indexOf('undead') < 0) { pool -= f.hp; f.conds.asleep = { rounds: 10 }; slept.push(f); self.elemBurst(f, 'sleep', 'rise'); }
        });
        yield* this.say(slept.length ? slept.map(plain).join(', ') + (slept.length > 1 ? ' fall' : ' falls') + ' asleep!' : 'Nothing sleeps.', 46);
        break;
      } else if (k === 'heal') {
        if (down(t)) { yield* this.say(nameOf(t) + ' is beyond a spell. A healer\'s kit, or the leech-house.', 44); continue; }
        var hv = this.heal(t, DS.roll(sp.dmg.replace(/^(\d+)d/, function (m0, nn) { return (parseInt(nn, 10) + up) + 'd'; })) + DS.mod(h.abil[R.CLASSES[h.cls].cast]));
        DS.audio.sfx('heal'); this.elemBurst(t, 'heal', 'rise'); this.num(t, hv, '#58F898');
        yield* this.say(nameOf(t) + ' recovers ' + hv + ' HP.', 36);
      } else if (k === 'buff') {
        if (down(t)) continue;
        if (sp.buff === 'shield') { t.conds.shielded = true; }
        else if (sp.buff === 'mageArmor') { t.h.conds.mageArmor = true; }
        else if (sp.buff === 'invisible') { t.conds.invisible = { rounds: 10 }; delete t.conds.hidden; }
        else if (sp.buff === 'stoneskin') { t.conds.stoneskin = { rounds: 10 }; }
        else if (sp.buff === 'aid') { t.h.maxhp += 5 * (1 + up); t.h.hp += 5 * (1 + up); t.h.conds.aid = (t.h.conds.aid || 0) + 5 * (1 + up); }
        else {
          var b = { id: sp.buff, name: sp.name, rounds: 10 };
          if (sp.buff === 'shieldOfFaith') b.ac = 2;
          if (sp.buff === 'heroism') { b.tempEach = Math.max(1, DS.mod(h.abil.cha)); b.temp = b.tempEach; delete t.conds.frightened; }
          t.buff = b;
        }
        this.elemBurst(t, 'buff', 'rise');
        yield this.wait(8);
      } else if (k === 'cure') {
        ['poisoned', 'paralyzed', 'blinded'].forEach(function (c) { delete t.conds[c]; });
        this.elemBurst(t, 'radiant', 'rise'); DS.audio.sfx('heal');
        yield* this.say(nameOf(t) + ' is cleansed.', 36);
      }
      if (this.liveFoes().length === 0) break;
    }
    if (k === 'buff') {
      var bt = targets.map(plain).join(', ');
      yield* this.say(bt + (sp.buff === 'shield' ? ' raises a shield of force. +5 AC.' : sp.buff === 'shieldOfFaith' ? ': +2 AC.' : sp.buff === 'bless' ? ': blessed.' : sp.buff === 'mageArmor' ? ': mage armor.' : sp.buff === 'aid' ? ': +' + 5 * (1 + up) + ' max HP.' : sp.buff === 'heroism' ? ': heroism. No fear, and +' + Math.max(1, DS.mod(h.abil.cha)) + ' temporary HP at the start of each turn.' : ': ' + sp.name + '.'), 40);
    }
    u.pose = null;
    return true;
  };

  // bright light: things that hate it lose their next turn the first time, then fight at disadvantage
  Battle.prototype.dazzle = function* (lead) {
    var first = !this.bright;
    this.bright = true;
    var shy = this.liveFoes().filter(function (f) { return f.m.traits && f.m.traits.lightSensitive; });
    if (!shy.length) { yield* this.say(lead + ' Bright light fills the place.', 44); return; }
    shy.forEach(function (f) { f.flash = 16; if (first) f.conds.recoiling = true; });
    if (!first) { yield* this.say(lead + ' The light holds. ' + nameOf(shy[0]) + ' is still dazzled.', 44); return; }
    this.shake = 4; DS.audio.sfx('magic');
    yield* this.say(lead + ' ' + nameOf(shy[0]) + ' recoils, shrinking up away from it! It loses its next turn, and attacks at disadvantage while the light holds.', 80);
  };

  // ------------------------------------------------------------------ items
  Battle.prototype.useItem = function* (u, id) {
    var it = DS.DATA.items[id], use = it.use, t = null, self = this;
    if (use.target === 'enemy') { t = yield* this.pickFoe(); if (!t) return false; }
    else if (use.target === 'ally' || use.target === 'revive') {
      t = yield* this.pickAlly(use.target === 'revive' ? function (x) { return down(x); } : null);
      if (!t) { if (use.target === 'revive') yield* this.say('No one is down.', 30); return false; }
    } else t = u;
    if (use.effect === 'heal' && t.h && t.h.hp >= t.h.maxhp) { yield* this.say(nameOf(t) + ' is unhurt.', 30); return false; }
    DS.G.take(id, 1);
    if (use.effect === 'heal') {
      var n = this.heal(t, DS.roll(use.dice));
      DS.audio.sfx('heal'); this.elemBurst(t, 'heal', 'rise'); this.num(t, n, '#58F898');
      yield* this.say(nameOf(u) + ' uses ' + it.name + '. ' + nameOf(t) + ' +' + n + ' HP.', 42);
    } else if (use.effect === 'revive') {
      t.h.ko = false; t.h.hp = Math.max(1, use.hp || 1); t.conds = {};
      DS.audio.sfx('heal'); this.elemBurst(t, 'heal', 'rise');
      yield* this.say(nameOf(u) + ' works the ' + it.name + '. ' + nameOf(t) + ' is back up!', 46);
    } else if (use.effect === 'antitoxin') {
      t.conds.antitoxin = { rounds: 999 };
      DS.audio.sfx('buff');
      yield* this.say(nameOf(t) + ' drinks the ' + it.name.toLowerCase() + '. Advantage against poison.', 46);
    } else if (use.effect === 'damage') {
      if (use.el === 'fire' && this.o.roost) { this.usedFire = true; this.roostCause = 'fire'; DS.audio.sfx('fire'); yield* this.say(nameOf(u) + ' throws ' + it.name + '. It catches, under the roost.', 40); return true; }
      var s = use.save ? this.save(t, use.save, use.dc || 10) : null;
      var dmg = DS.roll(use.dice); if (s && s.success) dmg = Math.floor(dmg / 2);
      if (use.only && tags(t).indexOf(use.only) < 0) dmg = 0;
      var d = this.hurt(t, dmg, use.el, { magicWeapon: true });
      this.elemBurst(t, use.el); t.flash = 12; DS.audio.sfx(use.el === 'fire' ? 'fire' : 'hit'); this.num(t, d, '#F8D878');
      if (use.el === 'fire') this.usedFire = true;
      yield* this.say(nameOf(u) + ' throws ' + it.name + '! ' + nameOf(t) + ' takes ' + d + '.', 42);
      yield* this.flushMsg();
    } else if (use.effect === 'light') {
      this.flashT = 8; this.usedFire = true; this.roostCause = 'light';
      if (this.o.roost) return true; // the torch is lit under the roost: that's the end of it
      yield* this.dazzle(nameOf(u) + ' lights a ' + it.name.toLowerCase() + '.');
    } else if (use.effect === 'fortify') { // Marta's bat-wing pie: +2 CON (a +1 to CON saves) and +5 HP for the fight
      if (t.fortified) { DS.G.give(id, 1); yield* this.say(nameOf(t) + ' has already eaten.', 30); return false; }
      t.fortified = true; t.h.maxhp += 5; t.h.hp += 5;
      DS.audio.sfx('heal'); this.elemBurst(t, 'heal', 'rise'); this.num(t, 5, '#58F898');
      yield* this.say(nameOf(t) + ' eats ' + it.name + '. +2 CON and +5 HP for the fight.', 46);
    } else if (use.effect === 'cure') {
      delete t.conds.poisoned; delete t.conds.paralyzed;
      DS.audio.sfx('heal');
      yield* this.say(nameOf(t) + ' is cured.', 36);
    }
    return true;
  };

  // ------------------------------------------------------------------ enemies
  Battle.prototype.pickHeroFor = function (f, needHeld) {
    var live = this.liveHeroes();
    if (needHeld) live = live.filter(function (u) { return f.holding.indexOf(u) >= 0; });
    if (!live.length) return null;
    if (this.tauntWearer && !down(this.tauntWearer) && (f.m.tags || []).indexOf(this.tauntTag) >= 0 && this.tauntRounds.indexOf(this.round) >= 0) {
      return live.indexOf(this.tauntWearer) >= 0 ? this.tauntWearer : 'none';
    }
    var engulfed = live.filter(function (u) { return f.holding.indexOf(u) >= 0 && u.conds.engulfed; });
    if (engulfed.length) return engulfed[0];
    var weights = live.map(function (u) { var w = [5, 4, 3, 2][u.idx] || 1; if (u.conds.hidden) w *= 0.3; return { u: u, w: w }; });
    return DS.weighted(weights).u;
  };
  Battle.prototype.foeTurn = function* (f) {
    var m = f.m, self = this;
    f.off = 0; f.martialUsed = 0;
    f.acted = true;
    if (f.conds.recoiling) { delete f.conds.recoiling; yield* this.say(nameOf(f) + ' writhes away from the light and does nothing.', 44); return; }
    if (this.runner() === f) { yield* this.foeFlee(f); return; }
    if (m.traits && m.traits.bolts && this.round >= 2 && this.foes.some(function (x) { return x.id === m.traits.bolts && x.dead; })) { yield* this.foeBolt(f); return; }
    if (f.conds.frightened && DS.d(2) === 1) { yield* this.say(nameOf(f) + ' cowers.', 30); return; }
    if (f.conds.restrained && f.conds.restrained.escape) {
      if (this.check(f, 'str', 'Athletics') >= f.conds.restrained.escape) { delete f.conds.restrained; yield* this.say(nameOf(f) + ' tears free of the web.', 32); }
      else { yield* this.say(nameOf(f) + ' strains against the web.', 30); }
      return;
    }
    // specials: recharge / once-per-battle
    var specials = (m.specials || []).filter(function (s) {
      if (s.once && f.used[s.id]) return false;
      if (s.recharge) { if (f.recharge[s.id] === false) { if (DS.d(6) >= s.recharge) f.recharge[s.id] = true; else return false; } }
      if (s.when === 'holding' && !f.holding.length) return false;
      if (s.when === 'notHolding' && f.holding.length) return false;
      if (s.when === 'bloodied' && f.hp > f.maxhp / 2) return false;
      return true;
    });
    var sp = specials.length && Math.random() < (specials[0].chance || 0.4) ? (m.pickSpecial ? DS.pick(specials) : specials[0]) : null;
    if (sp) { yield* this.special(f, sp); return; }
    var routine = m.multi || [Object.keys(m.attacks)[0]];
    if (m.choose) routine = DS.pick(m.choose);
    if (f.conds.raging && m.traits && m.traits.reckless) f.conds.reckless = { rounds: 1 };
    var target = null;
    for (var i = 0; i < routine.length && !this.over; i++) {
      var atk = m.attacks[routine[i]];
      if (!atk) continue;
      var t;
      if (atk.needsHeld) { t = this.pickHeroFor(f, true); if (!t || t === 'none') continue; }
      else { if (!target || down(target)) target = this.pickHeroFor(f); t = target; }
      if (!t || t === 'none') { continue; }
      if (atk.needsHeld === false && f.holding.indexOf(t) >= 0 && atk.grapple) { /* already held */ }
      yield* this.foeAttack(f, t, atk);
      if (!this.liveHeroes().length) break;
    }
  };
  Battle.prototype.foeAttack = function* (f, t, atk) {
    var self = this;
    f.off = 8; f.flash = 6;
    yield this.wait(8);
    f.off = 0;
    var melee = !atk.ranged;
    var adv = this.advantage(f, t, melee);
    if (atk.autoHitHeld && f.holding.indexOf(t) >= 0) adv = 1;
    var dazzle = this.bright && f.m.traits && f.m.traits.lightSensitive ? ' (dazzled: disadvantage)' : '';
    var nat = this.d20(adv), tot = nat + atk.hit, ac = this.acOf(t);
    if (atk.dmg === '0' && (nat === 20 || (nat !== 1 && tot >= ac))) { // a grab that does no harm by itself (the roper's tendrils)
      yield* this.say(nameOf(f) + ' ' + (atk.verb || 'reaches for') + ' ' + nameOf(t) + '.', 30);
      yield* this.applyRider(f, t, atk, true);
      return;
    }
    if (atk.save && !atk.hit) { // save-only attack (breath, gaze)
      yield* this.applyRider(f, t, atk, false);
      return;
    }
    if (nat === 1 || (nat !== 20 && tot < ac)) {
      DS.audio.sfx('miss'); this.num(t, 'MISS', '#9C9C9C');
      yield* this.say(nameOf(f) + ' ' + (atk.verb || 'attacks') + ' ' + nameOf(t) + '... miss.' + dazzle, 32);
      if (isHero(t) && nat >= 15) yield* this.doorWard(t);
      return;
    }
    var crit = nat === 20 || (melee && incap(t)) || (this.round === 1 && this.o.surprised === 'party' && f.m.traits && f.m.traits.assassinate);
    var dmg = DS.roll(f.enlarged && atk.big ? atk.big : atk.dmg, { crit: crit });
    if (atk.martial && !f.martialUsed && this.allies(f).length > 1) { dmg += DS.roll(atk.martial, { crit: crit }); f.martialUsed = this.round; } // martial advantage, once a turn
    if (atk.firstRound && this.round === 1) dmg += DS.roll(atk.firstRound, { crit: crit });
    if (f.conds.raging && atk.rage) dmg += atk.rage;
    if (atk.halfHP && f.hp <= f.maxhp / 2) dmg = DS.roll(atk.halfHP, { crit: crit });
    // Uncanny Dodge (rogue 5): the first hit each round is halved
    var dodge = '';
    if (isHero(t) && t.h.cls === 'rogue' && t.h.lvl >= 5 && !t.conds.dodged && !incap(t)) { dmg = Math.floor(dmg / 2); t.conds.dodged = true; dodge = ' (dodged: half)'; }
    t.soaked = 0;
    var dealt = this.hurt(t, dmg, atk.type, f);
    if (atk.extra) dealt += this.hurt(t, DS.roll(atk.extra, { crit: crit }), atk.extraType || atk.type, f);
    if (t.soaked) dodge += ' (heroism takes ' + t.soaked + ')';
    t.pose = 'hurt'; t.poseT = 24; this.shake = crit ? 10 : 5; if (crit) this.flashT = 8;
    DS.audio.sfx(crit ? 'crit' : 'hit');
    this.num(t, dealt, '#F85838');
    yield* this.say((crit ? 'Critical! ' : '') + nameOf(f) + ' ' + (atk.verb || 'hits') + ' ' + nameOf(t) + ' for ' + dealt + '.' + dodge + dazzle, crit ? 46 : 36);
    yield* this.flushMsg();
    if (down(t)) { yield* this.note(t, nameOf(t) + ' falls!', 38); return; }
    yield* this.applyRider(f, t, atk, true);
  };
  Battle.prototype.applyRider = function* (f, t, atk, hit) {
    var self = this;
    if (atk.grapple && hit && !down(t)) {
      if (f.holding.length < (atk.grapple.max || 1) && f.holding.indexOf(t) < 0) {
        f.holding.push(t);
        t.conds.grappled = { escape: atk.grapple.dc, src: f };
        if (atk.grapple.restrain) t.conds.restrained = { escape: atk.grapple.dc };
        DS.audio.sfx('grab');
        yield* this.note(t, nameOf(f) + ' seizes ' + nameOf(t) + '! Grappled: ESCAPE to break free (DC ' + atk.grapple.dc + ').', 44);
      }
    }
    if (atk.engulf && hit && !down(t) && f.holding.indexOf(t) < 0) {
      f.holding.push(t);
      t.conds.engulfed = { escape: atk.engulf, src: f }; t.conds.blinded = { rounds: 999 };
      DS.audio.sfx('grab');
      yield* this.note(t, nameOf(f) + ' wraps itself around ' + nameOf(t) + '! Blinded and held: ESCAPE (DC ' + atk.engulf + ').', 48);
    }
    if (atk.attach && hit && !down(t)) { t.conds.attached = { src: f }; yield* this.note(t, nameOf(f) + ' latches on to ' + nameOf(t) + '!', 32); }
    if (atk.blind && hit && !down(t)) { t.conds.blinded = { rounds: 1 }; }
    if (atk.prone && hit && !down(t)) {
      var ps = this.save(t, 'str', atk.prone);
      if (!ps.success) { t.conds.prone = true; yield* this.note(t, nameOf(t) + ' is knocked prone!', 34); }
    }
    if (atk.save) {
      var s = this.save(t, atk.save.ab, atk.save.dc, { poison: atk.save.poison });
      yield* this.flushMsg();
      if (atk.save.dmg) {
        var d0 = DS.roll(atk.save.dmg), d = d0; if (s.success) d = atk.save.half ? Math.floor(d / 2) : 0;
        if (this.evades(t, atk.save.ab, atk.save.half)) d = s.success ? 0 : Math.floor(d0 / 2);
        if (d) { var dd = this.hurt(t, d, atk.save.type || 'poison', f); this.num(t, dd, '#9878F8'); yield* this.say(nameOf(t) + (s.success ? ' resists some of the ' : ' takes the full ') + (atk.save.type || 'poison') + '. ' + dd + ' damage.', 40); }
        else if (s.success) yield* this.say(nameOf(t) + ' shrugs it off.', 30);
        if (down(t)) { yield* this.note(t, nameOf(t) + ' falls!', 38); return; }
      }
      if (atk.save.cond && !s.success && !down(t)) {
        var immune = isHero(t) ? false : (t.m.condImmune || []).indexOf(atk.save.cond) >= 0;
        if (!immune) {
          t.conds[atk.save.cond] = { rounds: atk.save.rounds || 10, save: atk.save.repeat ? { ab: atk.save.ab, dc: atk.save.dc } : null };
          if (atk.save.also) t.conds[atk.save.also] = { linked: atk.save.cond };
          DS.audio.sfx('poison'); this.elemBurst(t, 'poison', 'fall');
          var cure = isHero(t) && atk.save.cond === 'poisoned' ? ' (Lay on Hands or an elixir cures it.)' : '';
          yield* this.note(t, nameOf(t) + ' is ' + atk.save.cond + (atk.save.also ? ' — and ' + atk.save.also + '!' : '!') + cure, 44);
        }
      } else if (atk.save.cond && s.success && !atk.save.dmg) yield* this.say(nameOf(t) + ' resists. (' + s.total + ' vs DC ' + atk.save.dc + ')', 34);
    }
  };
  // Evasion (rogue 7): a DEX save for half takes none, and a failed one half
  Battle.prototype.evades = function (u, ab, half) { return !!(half && ab === 'dex' && isHero(u) && u.h.cls === 'rogue' && u.h.lvl >= 7 && !incap(u)); };
  Battle.prototype.special = function* (f, sp) {
    var self = this;
    if (sp.recharge) f.recharge[sp.id] = false;
    if (sp.once) f.used[sp.id] = true;
    f.flash = 10;
    if (sp.id === 'web') {
      var t = this.pickHeroFor(f); if (!t || t === 'none') return;
      yield* this.say(nameOf(f) + ' spits a web at ' + nameOf(t) + '!', 36);
      var s = this.save(t, 'dex', sp.dc);
      if (s.success) yield* this.say(nameOf(t) + ' dodges the web.', 30);
      else { t.conds.restrained = { escape: sp.dc + 1 }; yield* this.note(t, nameOf(t) + ' is caught in the web! Restrained: ESCAPE (DC ' + (sp.dc + 1) + ').', 40); }
      return;
    }
    if (sp.id === 'moan') {
      yield* this.say(nameOf(f) + ' moans. The sound gets inside you.', 44);
      var list = this.liveHeroes();
      for (var i = 0; i < list.length; i++) {
        var s2 = this.save(list[i], 'wis', sp.dc);
        if (!s2.success && !(list[i].buff && list[i].buff.id === 'heroism')) { list[i].conds.frightened = { rounds: 2, save: { ab: 'wis', dc: sp.dc } }; yield* this.hold(nameOf(list[i]) + ' is frightened! Disadvantage to attack.'); }
      }
      return;
    }
    if (sp.id === 'phantasms') {
      f.images = 3;
      yield* this.say(nameOf(f) + ' splits into shadows. Three false shapes wheel about it!', 50);
      return;
    }
    if (sp.id === 'rage') {
      f.conds.raging = { rounds: 10 };
      yield* this.say(nameOf(f) + ' roars and rages!', 38);
      return;
    }
    if (sp.id === 'darkness') {
      this.bright = false;
      yield* this.say(nameOf(f) + ' swallows the light.', 36);
      return;
    }
    if (sp.id === 'slam') { // the otyugh slams whatever it holds
      var held = f.holding.slice();
      yield* this.say(nameOf(f) + ' slams what it holds against the stone!', 40);
      for (var q = 0; q < held.length; q++) {
        var tq = held[q]; if (down(tq)) continue;
        var sq = this.save(tq, 'con', 14), dq = DS.roll('2d6+3');
        if (sq.success) dq = Math.floor(dq / 2); else tq.conds.stunned = { rounds: 1 };
        dq = this.hurt(tq, dq, 'bludgeoning', f); this.num(tq, dq, '#F85838'); DS.audio.sfx('crit'); this.shake = 8;
        if (sq.success) yield* this.say(nameOf(tq) + ' takes ' + dq + '.', 40);
        else yield* this.hold(nameOf(tq) + ' takes ' + dq + ' and is stunned!');
        if (down(tq)) yield* this.hold(nameOf(tq) + ' falls!');
      }
      return;
    }
    if (sp.id === 'bargain') { // the otyugh, fed: a picture of a bucket
      yield* this.say(sp.text || '...', 60);
      return;
    }
    if (sp.kind === 'blast') { // a save against something that hits several at once (lightning, a leap, a gibbering)
      yield* this.say(nameOf(f) + ' ' + sp.text, 44);
      if (sp.el) this.bright = this.bright || sp.el === 'lightning';
      var pool = this.liveHeroes().slice(); DS.shuffle(pool);
      var hit = sp.targets === 'all' ? pool : pool.slice(0, sp.targets || 3);
      for (var bi = 0; bi < hit.length && !this.over; bi++) {
        var tb = hit[bi]; if (down(tb)) continue;
        var sb = this.save(tb, sp.save, sp.dc, { poison: sp.type === 'poison' });
        yield* this.flushMsg();
        var line = nameOf(tb) + (sb.success ? ' resists' : ' is caught');
        if (sp.dmg) {
          var db0 = DS.roll(sp.dmg), db = sb.success ? (sp.half ? Math.floor(db0 / 2) : 0) : db0;
          if (this.evades(tb, sp.save, sp.half)) db = sb.success ? 0 : Math.floor(db0 / 2);
          if (db) { db = this.hurt(tb, db, sp.type || 'force', f); this.num(tb, db, '#F85838'); tb.pose = 'hurt'; tb.poseT = 20; this.elemBurst(tb, sp.type || 'force'); }
          line += db ? '. ' + db + ' damage.' : '.';
        } else line += '.';
        if (!sb.success && sp.cond && !down(tb)) { tb.conds[sp.cond] = sp.cond === 'prone' ? true : { rounds: sp.rounds || 1, save: sp.repeat ? { ab: sp.save, dc: sp.dc } : null }; line += ' ' + (sp.condText || (sp.cond.charAt(0).toUpperCase() + sp.cond.slice(1) + '!')); }
        this.shake = 4; DS.audio.sfx(db ? 'hit' : 'miss');
        yield* this.note(tb, line, 36);
        if (down(tb)) yield* this.note(tb, nameOf(tb) + ' falls!', 34);
      }
      return;
    }
    if (sp.kind === 'curse') { // one of the party, a save, a condition (a held breath, a blinding spit)
      var tc = this.pickHeroFor(f); if (!tc || tc === 'none') return;
      yield* this.say(nameOf(f) + ' ' + sp.text.replace('{t}', plain(tc)), 44);
      var sc = this.save(tc, sp.save, sp.dc);
      yield* this.flushMsg();
      if (sc.success) { yield* this.say(nameOf(tc) + ' resists. (' + sc.total + ' vs DC ' + sp.dc + ')', 34); return; }
      tc.conds[sp.cond] = { rounds: sp.rounds || 1, save: sp.repeat ? { ab: sp.save, dc: sp.dc } : null };
      DS.audio.sfx('poison');
      yield* this.note(tc, nameOf(tc) + ' is ' + sp.cond + '!', 40);
      return;
    }
    if (sp.kind === 'self') { // the creature changes: grown huge (the duergar), or gone from sight
      if (sp.enlarge) f.enlarged = true;
      if (sp.cond) f.conds[sp.cond] = { rounds: sp.rounds || 3 };
      f.flash = 16; DS.audio.sfx('magic');
      yield* this.say(nameOf(f) + ' ' + sp.text, 44);
      return;
    }
  };

  // ------------------------------------------------------------------ the end
  Battle.prototype.finish = function* () {
    var self = this, o = this.o;
    // clear battle-only state
    this.heroes.forEach(function (u) {
      u.conds = {}; u.buff = null;
      if (u.fortified) { u.h.maxhp -= 5; u.h.hp = Math.min(u.h.hp, u.h.maxhp); u.fortified = false; }
    });
    if (this.over === 'roost') { // the roof lets go: bats fill the screen, then the other kind of name
      yield* this.swarm();
      DS.audio.play('gameover');
      this.result = 'lose';
      DS.pop(this);
      DS.push(new DS.RoostFail());
      return;
    }
    if (this.over === 'yield') { // he stops: the fight is won, and what you do with him is yours
      yield* this.hold(this.o.yieldText || (nameOf(this.yielder) + ' lowers his hands.'));
      this.over = 'win'; this.yielded = true; DS.battleYielded = true;
      this.foes.forEach(function (f) { if (!f.dead) { f.dead = true; f.surrendered = true; f.fade = 0; } });
    }
    if (this.over === 'win') {
      DS.audio.play('victory');
      var xp = 0, silver = 0, drops = [];
      this.foes.forEach(function (f) {
        if (f.fled) return;
        xp += f.m.xp || 0;
        if (f.m.silver) silver += DS.roll(f.m.silver);
        (f.m.drops || []).forEach(function (d) { if (Math.random() < d.chance) drops.push(d.item); });
      });
      if (o.noXp) xp = 0;
      var K = DS.G.kills;
      this.foes.forEach(function (f) { if (f.fled) return; K[f.id] = (K[f.id] || 0) + 1; if (o.zone) K[o.zone + ':' + f.id] = (K[o.zone + ':' + f.id] || 0) + 1; });
      if (o.bonusXp) xp += o.bonusXp;
      var living = DS.G.party.filter(function (h) { return !h.ko; });
      if (o.solo != null) living = [DS.G.party[o.solo]];
      var each = living.length ? Math.floor(xp / living.length) : 0;
      var lines = ['Victory!'];
      if (each) lines.push('Each fighter standing gains ' + each + ' XP.');
      if (silver) { DS.G.silver += silver; lines.push('Found ' + silver + ' sp in coin and salvage.'); }
      drops.forEach(function (id) { DS.G.give(id, 1); lines.push('Found ' + DS.DATA.items[id].name + '!'); });
      // spell-component harvest: needs someone standing who has the skill for that part
      var hands = DS.G.party.filter(function (h) { return !h.ko; }), got = {}, gotOrder = [];
      this.foes.forEach(function (f) {
        if (f.surrendered || f.fled) return;
        (f.m.parts || []).forEach(function (pt) {
          var h = hands.filter(function (x) { return pt.skill.some(function (s) { return x.skills && x.skills[s] != null; }); })[0];
          if (!h) return;
          if (!got[pt.item]) { got[pt.item] = { n: 0, who: h.name }; gotOrder.push(pt.item); }
          got[pt.item].n++;
        });
      });
      gotOrder.forEach(function (id) { DS.G.give(id, got[id].n); lines.push(got[id].who + ' harvests ' + DS.DATA.items[id].name + (got[id].n > 1 ? ' x' + got[id].n : '') + '.'); });
      var ups = [];
      living.forEach(function (h) { ups = ups.concat(R.gainXP(h, each)); });
      yield W8.frames(30);
      yield DS.say(lines.join('\n'), { top: true });
      if (ups.length) { DS.audio.sfx('levelup'); yield DS.say(ups, { top: true }); }
      if (this.usedFire && o.roost) DS.G.flags.roostBroken = (DS.G.flags.roostBroken || 0) + 1;
    } else if (this.over === 'lose' && !o.lossOk) {
      DS.audio.play('gameover');
      yield W8.frames(40);
      this.result = 'lose';
      DS.pop(this);
      DS.push(new DS.GameOver());
      return;
    }
    this.result = this.over;
    DS.pop(this);
  };

  // the roost comes down: wings from the top of the screen until there's nothing else
  Battle.prototype.swarm = function* () {
    var self = this;
    this.bats = []; this.swarmT = 0;
    DS.audio.sfx('error'); this.shake = 20;
    yield* this.hold((this.roostCause === 'light' ? 'Bright light' : 'Fire') + ' under a roosted ceiling. The whole roof shifts at once: millions of wings.');
    this.msg = '';
    for (var t = 0; t < 160; t++) {
      this.swarmT = t;
      for (var k = 0; k < 3 + (t >> 3) && self.bats.length < 900; k++) self.bats.push(DS.newBat(true));
      if (t % 10 === 0) { DS.audio.sfx('miss'); this.shake = 6; }
      yield this.wait(1);
    }
    yield this.wait(30);
  };
  DS.newBat = function (top) {
    return { x: Math.random() * 256, y: top ? -8 - Math.random() * 30 : Math.random() * 240, vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 3.5, ph: DS.rint(8) };
  };
  DS.drawBats = function (ctx, bats) {
    for (var i = 0; i < bats.length; i++) {
      var b = bats[i];
      b.x += b.vx + Math.sin((DS.frame + b.ph * 7) / 5) * 0.8; b.y += b.vy;
      if (b.y > 250) { b.y = -8; b.x = Math.random() * 256; }
      var up = ((DS.frame + b.ph) >> 2) & 1, x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillStyle = ['#1a1418', '#3a2e30', '#5a4a48'][i % 3];
      ctx.fillRect(x - 1, y, 3, 3);
      if (up) { ctx.fillRect(x - 5, y - 2, 4, 2); ctx.fillRect(x + 2, y - 2, 4, 2); }
      else { ctx.fillRect(x - 5, y + 2, 4, 2); ctx.fillRect(x + 2, y + 2, 4, 2); }
    }
  };

  // ------------------------------------------------------------------ drawing
  Battle.prototype.draw = function (ctx) {
    var sx = this.shake ? (DS.rint(3) - 1) * 2 : 0;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 240);
    ctx.drawImage(this.bg, sx, 20);
    if (this.bright) { ctx.globalAlpha = 0.12; ctx.fillStyle = '#F8F0C0'; ctx.fillRect(0, 20, 256, 132); ctx.globalAlpha = 1; }
    var self = this, act = this.active;
    // foes
    this.foes.forEach(function (f) {
      if (f.dead && f.fade <= 0) return;
      var x = f.x + sx + (f.off || 0), y = f.y;
      if (f.dead) { // dissolve: drop rows
        var keep = f.fade / 24;
        ctx.globalAlpha = keep; ctx.drawImage(f.art.img, 0, 0, f.art.w, Math.ceil(f.art.h * keep), x, y + f.art.h * (1 - keep), f.art.w, Math.ceil(f.art.h * keep)); ctx.globalAlpha = 1;
        return;
      }
      if (f.images > 0) { ctx.globalAlpha = 0.35; for (var k = 0; k < f.images; k++) ctx.drawImage(f.art.img, x + [-10, 10, 0][k], y + [4, -4, 8][k]); ctx.globalAlpha = 1; }
      var img = (f.flash > 0 && (f.flash & 2)) ? f.art.flash : f.art.img;
      if (f.conds.asleep || f.conds.paralyzed) { ctx.globalAlpha = 0.7; }
      ctx.drawImage(img, x, y);
      ctx.globalAlpha = 1;
      if (f.conds.asleep && ((DS.frame >> 4) & 1)) DS.text(ctx, 'z', x + f.art.w - 4, y - 2, '#B8B8F8');
      if (self.bright && f.m.traits && f.m.traits.lightSensitive && ((DS.frame >> 4) & 1)) DS.textCenter(ctx, 'DAZZLED', x + f.art.w / 2, y - 18, '#F8D878');
      if (f.conds.restrained) { ctx.strokeStyle = '#E8E8F0'; ctx.beginPath(); ctx.moveTo(x, y + f.art.h * 0.3); ctx.lineTo(x + f.art.w, y + f.art.h * 0.7); ctx.moveTo(x + f.art.w, y + f.art.h * 0.3); ctx.lineTo(x, y + f.art.h * 0.7); ctx.stroke(); }
      if (act === f && ((DS.frame >> 3) & 1)) DS.text(ctx, '▼', x + f.art.w / 2 - 2, y - 9, '#F8D878');
    });
    // heroes
    var aura = this.aura() > 0;
    this.heroes.forEach(function (u) {
      var h = u.h, spr = DS.fighter(DS.LOOKS[h.look], h.weapon);
      var pose = down(u) ? 'ko' : u.pose ? u.pose : (h.hp < h.maxhp / 4 || incap(u)) ? 'hurt' : 'stand';
      var x = u.x - (act === u ? (u.off || 0) : 0) + sx, y = u.y;
      if (pose === 'ko') { ctx.drawImage(spr.ko, x - 4, y + 8); return; }
      if (u.conds.paralyzed) { ctx.drawImage(spr[pose], x, y); ctx.globalAlpha = 0.4; ctx.fillStyle = '#6888FC'; ctx.fillRect(x, y, 16, 24); ctx.globalAlpha = 1; }
      else ctx.drawImage(spr[pose], x, y);
      if (self.doorWardOn) { ctx.globalAlpha = 0.28 + 0.16 * Math.sin(DS.frame / 5 + u.idx); ctx.drawImage(sheenOf(spr[pose]), x, y); ctx.globalAlpha = 1; if (((DS.frame >> 2) + u.idx * 3) % 11 === 0) { ctx.fillStyle = '#F8F8F8'; ctx.fillRect(x + 3 + (DS.frame % 9), y + 4 + (DS.frame % 13), 1, 1); } }
      if (u.conds.engulfed) { ctx.fillStyle = '#1a1a24'; ctx.fillRect(x - 1, y - 1, 18, 14); }
      if (u.conds.grappled) { ctx.fillStyle = '#b85a3a'; ctx.fillRect(x - 3, y + 12, 3, 4); }
      if (u.conds.restrained && !u.conds.grappled) { ctx.strokeStyle = '#E8E8F0'; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 16, y + 18); ctx.moveTo(x + 16, y + 6); ctx.lineTo(x, y + 18); ctx.stroke(); }
      if (u.conds.hidden) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.fillRect(x, y, 16, 24); ctx.globalAlpha = 1; }
      if (u.conds.invisible) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#10123a'; ctx.fillRect(x, y, 16, 24); ctx.globalAlpha = 1; }
      if (u.conds.stoneskin && ((DS.frame >> 3) & 1)) { ctx.fillStyle = '#9a9aa8'; ctx.fillRect(x + 2, y + 12, 1, 1); ctx.fillRect(x + 12, y + 8, 1, 1); }
      if (aura && !down(u) && ((DS.frame + u.idx * 9) % 40) < 20) { ctx.fillStyle = '#F8E8A0'; ctx.fillRect(x + 1, y - 2, 1, 1); ctx.fillRect(x + 14, y - 2, 1, 1); }
      if (u.guest) { DS.bar(ctx, x, y + 25, 16, h.hp / h.maxhp, h.hp < h.maxhp / 4 ? '#F85838' : '#58D854'); }
      if (u.buff) { if ((DS.frame >> 3) & 1) ctx.fillStyle = '#F8D878', ctx.fillRect(x + 7, y - 3, 2, 2); }
      if (act === u) DS.text(ctx, '▼', x + 5, y - 10, '#F8D878');
    });
    // particles & numbers
    this.fx.forEach(function (p) { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.sz || 1, p.sz || 1); });
    this.nums.forEach(function (n) {
      var y = n.y - Math.min(12, n.t * 0.8) + (n.t > 12 ? 0 : 0);
      if (n.t < 44 || (n.t & 2)) DS.textCenter(ctx, String(n.v), n.x, y, n.col);
    });
    if (this.flashT > 0 && (this.flashT & 2)) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#F8F8F8'; ctx.fillRect(0, 20, 256, 132); ctx.globalAlpha = 1; }
    // message banner: two lines when it needs them; a held line blinks ▼ until Z
    var ml = this.msg ? DS.wrap(this.msg, 240).slice(0, 2) : [];
    DS.win(ctx, 0, 0, 256, ml.length > 1 ? 30 : 20, this.holding ? '#2a1440' : null);
    for (var li = 0; li < ml.length; li++) DS.text(ctx, ml[li], 8, 6 + li * 10, '#F8F8F8');
    if (this.holding && ((DS.frame >> 4) & 1)) DS.text(ctx, '▼', 244, ml.length > 1 ? 20 : 11, '#F8D878');
    // bottom panels
    DS.win(ctx, 0, 156, 90, 84);
    var groups = {}, gorder = [];
    this.liveFoes().forEach(function (f) { var nm = f.m.short || f.m.name; if (!groups[nm]) { groups[nm] = 0; gorder.push(nm); } groups[nm]++; });
    gorder.slice(0, 6).forEach(function (n, i) { DS.text(ctx, n.length > 11 ? n.slice(0, 11) : n, 8, 164 + i * 12, '#F8F8F8'); if (groups[n] > 1) DS.textRight(ctx, 'x' + groups[n], 84, 164 + i * 12, '#C8D0E8'); });
    DS.win(ctx, 90, 156, 166, 84);
    this.heroes.filter(function (u) { return !u.guest; }).forEach(function (u, i) {
      var h = u.h, y = 162 + i * 19, col = down(u) ? '#9C9C9C' : h.hp < h.maxhp / 4 ? '#F85838' : h.hp < h.maxhp / 2 ? '#F8D878' : '#F8F8F8';
      DS.text(ctx, h.name, 98, y, act === u ? '#F8D878' : '#F8F8F8');
      if (u.buff && u.buff.temp > 0 && !down(u)) DS.text(ctx, '+' + u.buff.temp, 102 + DS.textWidth(h.name), y, '#6CF0F8');
      DS.textRight(ctx, (down(u) ? 'KO ' : '') + h.hp + '/' + h.maxhp, 206, y, col);
      DS.bar(ctx, 98, y + 9, 108, h.hp / h.maxhp, col === '#F8F8F8' ? '#58D854' : col);
      var tags = Object.keys(u.conds).filter(function (k) { return R.CONDS[k]; }).map(function (k) { return R.CONDS[k]; });
      if (u.buff) tags.unshift('+' + (u.buff.id === 'shieldOfFaith' ? 'SOF' : u.buff.id.slice(0, 3).toUpperCase()));
      DS.text(ctx, tags.slice(0, 2).join(' '), 212, y, '#B8B8F8');
    });
    if (this.intro > 0) { // opening wipe
      var hgt = Math.round(120 * this.intro / 32);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, hgt); ctx.fillRect(0, 240 - hgt, 256, hgt);
    }
    if (this.bats) {
      ctx.globalAlpha = Math.min(0.7, this.swarmT / 200); ctx.fillStyle = '#0a0608'; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1;
      DS.drawBats(ctx, this.bats);
    }
  };

  // a pale silver copy of a figure, for the ward's sheen
  var sheenCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function sheenOf(img) {
    var c = sheenCache && sheenCache.get(img);
    if (c) return c;
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#E8F0FF'; x.fillRect(0, 0, c.width, c.height);
    if (sheenCache) sheenCache.set(img, c);
    return c;
  }

  // ------------------------------------------------------------------ target picking scene
  function TargetScene(B, list, side) {
    this.kind = 'target'; this.B = B; this.list = list; this.side = side; this.i = 0; this.result = null;
    if (side === 'foe') this.list = list.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
  }
  TargetScene.prototype.update = function () {
    var n = this.list.length, old = this.i;
    if (I.repeat('down') || I.repeat('right')) this.i = (this.i + 1) % n;
    if (I.repeat('up') || I.repeat('left')) this.i = (this.i - 1 + n) % n;
    if (old !== this.i) DS.audio.sfx('cursor');
    if (I.pressed('a')) { DS.audio.sfx('confirm'); this.result = this.list[this.i]; DS.pop(this); }
    else if (I.pressed('b')) { DS.audio.sfx('cancel'); this.result = null; DS.pop(this); }
  };
  TargetScene.prototype.draw = function (ctx) {
    var u = this.list[this.i]; if (!u) return;
    var x, y;
    if (u.side === 'hero') { x = u.x - 10; y = u.y + 8; }
    else { x = u.x - 9; y = u.y + Math.round(u.art.h / 2) - 4; }
    if ((DS.frame >> 3) & 1) DS.text(ctx, '▶', x, y, '#F8F8F8');
    DS.win(ctx, 0, 0, 256, 20);
    var nm = u.side === 'hero' ? u.h.name + '  ' + u.h.hp + '/' + u.h.maxhp : u.name;
    DS.text(ctx, 'Target: ' + nm, 8, 6, '#F8D878');
  };

  // ------------------------------------------------------------------ battle backdrops
  var bgCache = {};
  DS.battleBg = function (kind) {
    if (bgCache[kind]) return bgCache[kind];
    var p = new DS.Pix(256, 132), r = DS.mulberry32(DS.hash(kind));
    function band(y0, y1, c) { p.rect(0, y0, 256, y1 - y0, c); }
    var N = DS.N;
    if (kind === 'plains' || kind === 'road' || kind === 'hills') {
      band(0, 50, N(0x21)); band(0, 16, N(0x11));
      for (var i = 0; i < 5; i++) p.ellipse(20 + i * 60 + r() * 20, 12 + r() * 16, 14 + r() * 8, 4, N(0x30));
      for (var x = 0; x < 256; x += 1) { var hh = 40 + Math.sin(x / 23) * 6 + Math.sin(x / 7) * 2; p.rect(x, hh, 1, 60 - hh, kind === 'hills' ? N(0x18) : N(0x1A)); }
      band(56, 132, kind === 'road' ? N(0x37) : N(0x2A)); p.speckle(0, 56, 256, 76, kind === 'road' ? N(0x27) : N(0x1A), 0.06, r);
    } else if (kind === 'gnoll') {
      band(0, 56, '#e8b070'); band(0, 18, '#c87840');
      for (var x2 = 0; x2 < 256; x2++) { var h2 = 36 + Math.sin(x2 / 30) * 10 + Math.sin(x2 / 9) * 3; p.rect(x2, h2, 1, 60 - h2, '#a07040'); }
      band(56, 132, '#c8a060'); p.speckle(0, 56, 256, 76, '#906030', 0.08, r);
    } else if (kind === 'cave' || kind === 'wet' || kind === 'dwarf' || kind === 'guano' || kind === 'deep') {
      var wall = kind === 'dwarf' ? '#30303a' : kind === 'guano' ? '#5a4a40' : '#2c221e', wallL = kind === 'dwarf' ? '#44444e' : '#4a3c34';
      band(0, 132, '#120e0c');
      band(0, 52, wall);
      for (var s = 0; s < 22; s++) { var sx = r() * 256, sl = 8 + r() * 26; p.tri(sx - 5, 0, sx + 5, 0, sx, sl, wallL); }
      if (kind === 'dwarf') for (var yy = 4; yy < 52; yy += 8) { p.rect(0, yy, 256, 1, '#1e1e26'); }
      band(52, 132, kind === 'guano' ? '#8a7a66' : kind === 'dwarf' ? '#44444e' : '#3a2e28');
      p.speckle(0, 52, 256, 80, kind === 'guano' ? '#d8d0b8' : '#524238', kind === 'guano' ? 0.15 : 0.08, r);
      if (kind === 'wet' || kind === 'deep') { p.ellipse(60, 100, 40, 8, '#123040'); p.ellipse(200, 116, 50, 10, '#081820'); p.rect(80, 100, 16, 1, '#2a6a80'); }
      if (kind === 'guano') for (var b = 0; b < 30; b++) p.set(r() * 256, r() * 40, '#1a1418');
    } else if (kind === 'bog') {
      band(0, 132, '#0a1a10'); band(0, 60, '#08140c');
      for (var t = 0; t < 12; t++) { var tx = r() * 256; p.rect(tx, 10 + r() * 20, 3, 50, '#1a2a18'); p.ellipse(tx + 1, 12 + r() * 10, 8, 6, '#14301c'); }
      band(60, 132, '#123a1c'); p.speckle(0, 60, 256, 72, '#0a2a14', 0.2, r);
      for (var g = 0; g < 26; g++) p.set(r() * 256, 10 + r() * 110, g % 2 ? N(0x2B) : N(0x39));
    } else if (kind === 'gulch') {
      band(0, 132, '#8a7a66'); band(0, 60, '#6e604e');
      for (var w = 0; w < 7; w++) { var wx = 20 + w * 36; p.line(wx, 0, wx + 30, 50, '#e8e8f0'); p.line(wx + 30, 0, wx, 50, '#e8e8f0'); p.ring(wx + 15, 25, 8, 8, '#d8d8e0'); }
      band(60, 132, '#9a8a74'); p.speckle(0, 60, 256, 72, '#6e604e', 0.1, r);
    } else if (kind === 'lake') {
      band(0, 132, '#040810'); band(0, 44, '#0a1020');
      for (var st = 0; st < 40; st++) p.set(r() * 256, r() * 40, st % 3 ? '#8a8aa0' : '#f8f8f8');
      band(44, 132, '#081820');
      for (var wv = 0; wv < 30; wv++) p.rect(r() * 240, 50 + r() * 80, 6 + r() * 10, 1, '#123040');
      p.ellipse(220, 118, 40, 10, '#6a6a72'); p.ellipse(220, 116, 36, 8, '#8a8a92');
      p.rect(240, 60, 2, 50, '#3a2a1a'); p.rect(237, 56, 8, 6, '#F8D878');
    } else if (kind === 'arena') {
      band(0, 132, '#3a2a1a'); band(0, 50, '#1a1210');
      for (var c2 = 0; c2 < 140; c2++) { var cx = r() * 256, cy = 6 + r() * 38; p.rect(cx, cy, 3, 4, ['#8a6a4a', '#6a4a3a', '#aa8a6a', '#5a5a6a'][c2 % 4]); p.rect(cx, cy - 2, 3, 2, '#e0b088'); }
      band(48, 54, '#7a5a3a'); band(54, 132, N(0x38)); p.speckle(0, 54, 256, 78, N(0x28), 0.12, r);
    } else if (kind === 'town') {
      band(0, 60, '#50505e'); for (var bx = 0; bx < 256; bx += 16) p.rect(bx, 0, 1, 60, '#3a3a46');
      band(60, 132, N(0x10)); p.speckle(0, 60, 256, 72, N(0x00), 0.1, r);
    } else if (kind === 'highway') { // the dwarves' road: dressed stone down the middle, raw rock either side, a lamp far off
      band(0, 132, '#16161c'); band(0, 56, '#26262e');
      for (var sx2 = 0; sx2 < 256; sx2 += 16) { p.rect(sx2, 14, 14, 38, '#30303a'); p.rect(sx2 + 1, 15, 12, 1, '#44444e'); }
      [44, 124, 204].forEach(function (rx) { p.rect(rx, 20, 14, 24, '#3a3a46'); p.ring(rx + 7, 32, 4, 4, '#9aa8c8'); p.set(rx + 7, 27, '#9aa8c8'); p.set(rx + 7, 37, '#9aa8c8'); });
      p.ellipse(128, 40, 6, 5, '#3a2a14'); p.ellipse(128, 40, 3, 3, '#f8d878'); p.set(128, 34, '#fca044');
      band(56, 132, '#3a3a44');
      for (var ry = 60; ry < 132; ry += 8) { var inset = (132 - ry) * 0.6; p.rect(inset, ry, 256 - inset * 2, 1, '#2a2a32'); }
      p.speckle(0, 56, 256, 76, '#4a4a56', 0.05, r);
    } else if (kind === 'cavern') { // the big caverns the road crosses on a causeway; the dark either side is where things come from
      band(0, 132, '#08080c'); band(0, 40, '#14121a');
      for (var st2 = 0; st2 < 26; st2++) { var cxs = r() * 256, cl = 10 + r() * 30; p.tri(cxs - 4, 0, cxs + 4, 0, cxs, cl, '#2a2630'); }
      p.poly([[0, 132], [70, 64], [186, 64], [256, 132]], '#34323c'); p.poly([[70, 64], [186, 64], [180, 70], [76, 70]], '#4a4854');
      for (var cy2 = 72; cy2 < 132; cy2 += 10) { var w2 = 110 + (cy2 - 64) * 1.8; p.rect(128 - w2 / 2, cy2, w2, 1, '#2a2830'); }
      p.speckle(0, 40, 256, 30, '#1e1c24', 0.3, r);
    } else { band(0, 132, '#101018'); }
    var c = p.canvas();
    return (bgCache[kind] = c);
  };

  // ------------------------------------------------------------------ start helper for scripts
  DS.battle = function (o) {
    return {
      start: function (script) {
        var self = this;
        DS.audio.sfx('encounter');
        var b = new Battle(o);
        var prevSong = DS.audio.songId;
        b.onClose = function (res) {
          self.finished = true; self.result = res;
          if (o.after !== false && res !== 'lose' || o.lossOk) DS.audio.play(o.returnSong || prevSong, true);
          setTimeout(function () { script.resume(self, res); }, 0);
        };
        DS.push(new EncounterFlash(function () { DS.push(b); }));
      }
    };
  };
  function EncounterFlash(then) { this.kind = 'flash'; this.t = 0; this.then = then; }
  EncounterFlash.prototype.update = function () { this.tick(); };
  EncounterFlash.prototype.tick = function () { if (++this.t >= 28) { DS.pop(this); this.then(); } };
  EncounterFlash.prototype.draw = function (ctx) {
    var k = this.t;
    if ((k >> 2) & 1) { ctx.globalAlpha = 0.8; ctx.fillStyle = '#F8F8F8'; ctx.fillRect(0, 0, 256, 240); ctx.globalAlpha = 1; }
    if (k > 16) { var h = (k - 16) * 10; ctx.fillStyle = '#000'; ctx.fillRect(0, 120 - h, 256, h * 2); }
  };
})();
