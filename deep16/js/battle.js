/* DEEP16 — the fight (proof 2): four heroes (+ a guest if the save has one) against two drow and a phase spider, on
   the grid, with the fuller rules: movement you can split round your action, one action, one bonus action if a
   feature gives one, one reaction a round, opportunity attacks, cover, flanking, one area spell, and END TURN one press
   away with anything unspent -- no prompt, no nag (Griz: "people end up with bonus actions available they end their
   turn without using"). The fight runs as a generator: it yields a number to wait, {fx} to let effects land, or an
   input request (the hero's turn, a reaction prompt) that the player answers. */
'use strict';
(function () {
  var D = window.D16, I = D.input, G = D.grid, RU = D.rules, FX = D.fx;
  var STEP_FRAMES = 8;

  function Battle(o) { this.o = o || {}; }
  D.Battle = Battle;

  Battle.prototype.enter = function () {
    var F = this.fight = this.o.fightDef || D.fight(this.o.fight || 'gallery'), m = this.map = D.iso.load(D.MAPS[F.map]), self = this;
    // on the ladder: the four at the fight's level, by the 8-bit game's own rules (nothing read from a save).
    // Otherwise walk in from the save (the door's snapshot or the newest slot), or as the fixture: the entry card offers both
    // from the camp (js/camp.js): the four as the morning left them; copied, so RESTART starts from the camp again
    // inside the 8-bit game (js/embed.js, this.o.embed): the party it handed over, as it stood when the fight began
    if (this.o.data) this.from = { from: this.o.embed ? 'the 8-bit game' : 'the camp', when: null, data: JSON.parse(JSON.stringify(this.o.data)) };
    else if (this.o.ladder || this.o.npc) this.from = { from: this.o.npc ? 'the class floor' : 'the ladder', when: null, data: D.save.fixture(Math.min(9, F.level)) }; // (the four stop at 9: a druid 12 on the class floor meets them at 9)
    else this.from = this.o.fixture ? { from: 'the fixture', when: null, data: D.save.fixture() } : D.save.load();
    this.canSwap = !this.o.ladder && !this.o.npc && !this.o.embed && (this.o.fixture || this.from.from !== 'the fixture');
    var party = D.save.units(this.from.data, this.o.climb ? Object.assign({}, F, { looks: null }) : F); // the climb: Barley is Barley
    // the class floor (js/classes.js): a band of class NPCs instead of the four when asked (class against class), and on the bench
    // everyone on the party's side is run by the class tactics too (js/tactics.js); so in a watch (09-28h: ?npc=...&watch, and the
    // tester ladder, ?ladder&party=ours: "AI now, buttons later")
    var NB = this.o.npc;
    // (a word -- 'talmok:5:grown' -- or a spec the camp made up for the morning, js/camp.js o.ours; its id is the camp's)
    if (NB && NB.party) party = NB.party.map(function (w, i) { return D.npc.build(w, F.level, 'party', { id: typeof w === 'string' ? 'p' + i + '-' + String(w).split(':')[0] : w.id }); }).filter(Boolean);
    if (NB && (this.o.bench || this.o.watch)) party.forEach(function (u) { u.guest = true; u.classAI = true; });
    // the wizard's familiar, if the save has one and he is here (Find Familiar: js/familiar.js)
    var famData = this.o.familiar ? { flags: { familiar: this.o.familiar } } : NB ? null : this.from.data; // (the camp's pick for our four: o.familiar)
    var fam = D.familiar && famData && D.familiar.unit(this, famData, party); if (fam) party.push(fam);
    // a familiar to each of a band (the class floor's &fam=owl,bat,...: js/classes.js npcFight, 10-01): the first keeps the one id
    (this.o.familiars || []).forEach(function (f, i) { var fu = D.familiar && D.familiar.unit(self, { flags: { familiar: f } }, party); if (fu) { fu.id = 'familiar' + (i || ''); party.push(fu); if (fu.master) fu.master.name += ' (' + window.DS.R.FAMILIARS[f.kind].name + ')'; } }); // (seven Wizard 5s told apart by their familiars)
    // (the Settling, 09-30: the 8-bit trigger that fired puts the lead on its own square -- embed.at -- and the rest beside him)
    var entry = (this.o.embed && this.o.embed.at ? [this.o.embed.at] : (F.entry || m.def.entry)).slice();
    // the ways out (LEAVE THE FIGHT): every square on an open edge of the map you can stand on (a road running on, the mouth
    // the party came in by), and a map's named doors (`doors`: the inn's); a map closed all round keeps the way in
    // riders (a fight's scenery figures: the wagon's glamoured children, the team in its traces): drawn where they stand,
    // never in the fight. `foot` [w, h] for a big one (a horse is 2 x 1), `blocks` holds its squares, `team` startles when the run begins
    this.riders = (F.riders || []).map(function (r) { return { x: r.at[0], y: r.at[1], sheet: r.sheet, after: r.after, facing: r.facing || 0, gz: r.gz || 0, foot: r.foot || [1, 1], team: !!r.team, anim: 'idle', animT: 0 }; });
    (F.riders || []).forEach(function (r) { if (!r.blocks) return; var f = r.foot || [1, 1]; for (var j = 0; j < f[1]; j++) for (var i = 0; i < f[0]; i++) { var s = m.at(r.at[0] + i, r.at[1] + j); if (s) s.walk = false; } });
    // the lone investigator (the 8-bit wagon night's INVESTIGATE, this.o.embed.solo): one hero in the yard; the rest come out
    // of the inn at round this.o.embed.join (the 8-bit battle's `join`), onto the squares by the door
    var solo = this.o.embed && this.o.embed.solo;
    var out = solo && party.some(function (u) { return u.id === solo; }) ? party.filter(function (u) { return u.id !== solo; }) : [];
    this.reserve = out.filter(function (u) { return u.hp > 0; });
    this.stayed = out.filter(function (u) { return u.hp <= 0; }); // (one already down stays in the inn: embed.js still reports them)
    party = party.filter(function (u) { return out.indexOf(u) < 0; });
    this.exits = [];
    for (var ey = 0; ey < m.h; ey++) for (var ex = 0; ex < m.w; ex++) { var es = m.at(ex, ey); if (es && es.walk && (ex === 0 || ey === 0 || ex === m.w - 1 || ey === m.h - 1)) this.exits.push([ex, ey]); }
    (m.def.doors || []).forEach(function (q) { self.exits.push(q); });
    if (!this.exits.length) this.exits = entry.slice();
    // more of them than the map has entry squares (the 8-bit game's guests: the nest's Halldor and his four) stand on the
    // nearest free squares behind the first
    var seat = {};
    party.forEach(function (u, i) {
      if (u.riding) return; // (the familiar rides its wizard: js/familiar.js)
      var e = entry[i];
      if (!e || seat[e[0] + ',' + e[1]]) {
        var bd = Infinity, e0 = entry[0];
        for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
          var q = m.at(x, y); if (!q || !q.walk || seat[x + ',' + y]) continue;
          var dd = Math.max(Math.abs(x - e0[0]), Math.abs(y - e0[1])) + (y < e0[1] ? 0.5 : 0) + 0.01 * Math.hypot(x - e0[0], y - e0[1]);
          if (dd < bd) { bd = dd; e = [x, y]; }
        }
      }
      seat[e[0] + ',' + e[1]] = 1; u.x = e[0]; u.y = e[1]; u.facing = 5;
    });
    // inside the 8-bit game, the 8-bit scene's own foes (this.o.embed.enemies, Battle.roster), or only those still out there
    // (this.o.embed.only: the chase's road fights)
    var only = this.o.embed && this.o.embed.only, list = this.o.embed && this.o.embed.enemies;
    var foes = (list ? this.roster(F.foes || m.def.foes, list, m, party) : (F.foes || m.def.foes).filter(function (f) { return !only || only.indexOf(f.kind) >= 0; }))
      .map(function (f) { return self.makeFoe(f); });
    // (a word that names no class and no named one may name a creature of the bestiary, data/foes.js: ?npc=hyena,hyena,hyena&vs=bard&lvl=3 --
    // the Pocket DM's monsters dropped in, 09-30, first for Hideous Laughter's hyena)
    if (NB && NB.foes && NB.foes.length) foes = this.seatBand(NB.foes.map(function (w, i) { var fid = 'f' + i + '-' + String(w).split(':')[0]; return D.npc.build(w, F.level, 'foe', { id: fid }) || (typeof w === 'string' && D.FOES[w] ? self.makeFoe({ id: fid, kind: w }) : null); }).filter(Boolean), m, party);
    if (this.o.embed && this.o.embed.revealed) foes.forEach(function (u) { u.hidden0 = false; }); // (seen coming: the roper under the ledger-lamp)
    this.units = party.concat(foes);
    // the pack: DEEP16 lends every ladder and climb party a crossbow and bolts (save.js armoury); inside the 8-bit game the party
    // carries only what it brought (Griz, 09-27: "unless the players bring crossbows/range, they shouldn't have one")
    var pack = JSON.parse(JSON.stringify(this.from.data.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    this.inv = this.o.embed ? pack : D.save.armoury(pack);
    // a class hero's second weapon in the pack too, so a player's hand has what the class turn swaps to -- the rogue's shortbow (10-01c, the rogue runner: "a human
    // rogue needs a ranged weapon: EQUIP offers only the Lt. Crossbow"; Griz: "yes")
    if (!this.o.embed) { var inv0 = this.inv; party.forEach(function (u) { var aid = u.alt && (typeof u.alt === 'string' ? u.alt : u.alt.id); if (u.side === 'party' && u.npc && aid && window.DS.DATA.items[aid] && !inv0.some(function (s) { return s.id === aid; })) inv0.push({ id: aid, n: 1 }); }); } // (the unit's alt is the weapon as the grid reads it: its id)
    this.units.forEach(function (u) { u.anim = 'idle'; u.animT = 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; if (u.hp <= 0 && u.side === 'party') u.ko = true; if (u.hidden0) u.conds.hidden = true; });    G.setup(m, this.units);
    if (D.walls && D.walls.seatConjured) D.walls.seatConjured(this); // (an elemental conjured at the camp walks in beside its caster: js/walls.js)
    // torchdark (09-28): dark ground -- the fight's own word, else the 8-bit map's `dark` when the fight is fought from there
    // (js/embed.js), else the grid map's -- and the lights the place keeps (a lamp, a fire, a glow: [x, y, r, color, dimOnly]);
    // a torch the party walked in holding (the 8-bit field's, or the camp's A TORCH IN HAND) is in that hero's hand from the first round
    this.dark = F.dark != null ? !!F.dark : (this.o.embed && this.o.embed.dark != null) ? !!this.o.embed.dark : !!m.def.dark;
    this.lights = (F.lights || m.def.lights || []).map(function (l, i) { return { id: 'map' + i, kind: 'map', x: l[0], y: l[1], bright: l[4] ? 0 : l[2], dim: l[2], color: l[3] || 'gold', flame: !l[3] || l[3] === 'gold' || l[3] === 'fire' }; });
    var torchBy = (this.o.embed && this.o.embed.torch) || this.o.torch, torchKind = (this.o.embed && this.o.embed.torchKind) || this.o.torchKind || 'torch';
    // (a lantern walked in under a roost has its hood down: dim 5 ft, and the roof sleeps -- RULED 09-29)
    // (the Ledger-Lamp, 09-30, walks in as a lantern with its own id: torchKind 'ledgerlamp'. If nobody can take it up -- the bearer is down, or his hands are full -- it is
    // put in the pack, and the seam hands it back to the 8-bit game's: a lantern is never lost)
    if (torchBy) {
      var torchHeld = false;
      this.units.forEach(function (u) { if (u.id === torchBy && u.side === 'party' && u.hp > 0 && D.light.handsFree(u) > 0) { u.torch = D.light.isLantern(torchKind) ? D.light.make(torchKind, !!F.roost) : { lit: true }; D.light.regrip(u); torchHeld = true; } });
      if (!torchHeld && D.light.isLantern(torchKind)) { var lp = this.inv.filter(function (s) { return s.id === torchKind; })[0]; if (lp) lp.n++; else this.inv.push({ id: torchKind, n: 1 }); this.lampReturned = torchKind; }
    }
    // strung webs a fight starts with (Web Gulch, the nest): difficult ground for all but the web-walkers, and a hazard (RULED 09-30,
    // Griz: "for purposes of Pocket GM Horizon goal best to use the hazard people will expect"): entering them the first time in a
    // turn, or starting a turn in them, DEX or restrained; an action's STR check tears free -- the SRD Web spell's shape (magic.js
    // webCatch, breakFree), at the DC of whatever spun them (the map's webDC: the ettercap's 11, a giant spider's 12). Fire burns them
    var webs = F.webs || m.def.webs;
    this.webs = webs ? [{ by: 'the ground', sq: webs.slice(), dc: F.webDC || m.def.webDC || 11, ground: true }] : [];
    // a Ring of Binding (the lake: fight.ring { hero, rounds, con }): its wearer saves CON better, and on the named rounds
    // the thing in the water must turn on them (ai.js brute)
    this.taunt = null; this.intro = (this.o.embed && this.o.embed.revealed && F.introSeen) || F.intro;
    var ring = F.ring;
    // inside the 8-bit game the ring is whoever wears it, standing (its S.lakeFight), and its +3 is already in their saves
    // (the 8-bit R.saveBonus); nobody wearing it, no taunt, and the card says so (fight.introNoRing)
    if (ring && this.o.embed) {
      var wr = party.filter(function (u) { return u.hp > 0 && u.src && u.src.equip && u.src.equip.ring === 'ringofbinding'; })[0];
      ring = wr ? Object.assign({}, ring, { hero: wr.id, con: 0 }) : null;
      this.intro = wr ? (F.introRing || F.intro).replace('{ring}', wr.name) : F.introNoRing || F.intro;
    }
    if (ring) { var rw = party.filter(function (u) { return u.id === ring.hero; })[0]; if (rw) { rw.saves = Object.assign({}, rw.saves); rw.saves.con += ring.con || 0; rw.ring = true; this.taunt = { u: rw, rounds: ring.rounds }; } }
    FX.clear();
    this.t = 0; this.cards = []; this.round = 0; this.order = []; this.active = null;
    this.tool = 'move'; this.cursor = { x: 5, y: 10 }; this.req = null; this.wait = 0; this.waitFx = false; this.result = null;
    D.iso.lookAt(5, 10);
    this.co = this.run();
    D.battle = this;
  };

  // the 8-bit game's monster ids where DEEP16's kinds differ (its drow are DEEP16's drowlings; its blade-captain, DEEP16's drow)
  var KIND8 = { drow: 'drowling', drowcaptain: 'drow' };
  D.kind8 = function (id8) { return KIND8[id8] || id8; };
  // the fight inside the 8-bit game (RULED 09-28, Griz: the 8-bit's list): the foes the 8-bit scene sends, sized there for
  // the party and its guests (EV.guestWeight: Pyro is worth two), each on the fight's own spot for its kind; one the fight
  // has no spot for is set down on the nearest free square beside one of its kind (hidden or in the rock as that one is),
  // else beside the fight's first foe. Spots nobody takes stay empty. Each carries its place in the 8-bit list (i8), so
  // js/embed.js knows which 8-bit foe died or got away
  Battle.prototype.roster = function (spots, list, m, party) {
    var used = [], taken = {}, out = [], extra = [];
    function mark(x, y, s) { for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) taken[(x + i) + ',' + (y + j)] = 1; }
    party.forEach(function (u) { mark(u.x, u.y, 1); });
    list.forEach(function (id8, n) {
      var kind = D.kind8(id8);
      if (!D.FOES[kind]) { console.warn('DEEP16: no foe for the 8-bit game\'s ' + id8); return; }
      for (var j = 0; j < spots.length; j++) if (used.indexOf(j) < 0 && spots[j].kind === kind) { used.push(j); out.push(Object.assign({}, spots[j], { i8: n })); mark(spots[j].at[0], spots[j].at[1], D.FOES[kind].size || 1); return; }
      extra.push({ kind: kind, i8: n });
    });
    var nth = {};
    extra.forEach(function (e) {
      // (beside each spot of its kind in turn: five phase spiders out of three walls, not two out of one)
      var d = D.FOES[e.kind], s = d.size || 1, likes = spots.filter(function (p) { return p.kind === e.kind; });
      var like = likes.length ? likes[(nth[e.kind] = (nth[e.kind] || 0) + 1) % likes.length] : null;
      var at = (like || spots[0] || { at: [Math.floor(m.w / 2), 2] }).at, best = null, bd = Infinity;
      for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
        var ok = true;
        for (var j = 0; j < s && ok; j++) for (var i = 0; i < s && ok; i++) { var q = m.at(x + i, y + j); ok = !!(q && q.walk && !taken[(x + i) + ',' + (y + j)] && (!d.bound || q.ch === d.bound)); }
        if (!ok) continue;
        var dd = Math.max(Math.abs(x - at[0]), Math.abs(y - at[1])) + 0.01 * Math.hypot(x - at[0], y - at[1]);
        // (not in the party's lap: a square beside a hero costs as if it were three further off)
        if (party.some(function (u) { return Math.abs(u.x - x) <= s && Math.abs(u.y - y) <= s; })) dd += 3;
        if (dd < bd) { bd = dd; best = [x, y]; }
      }
      if (!best) { console.warn('DEEP16: no room for the 8-bit game\'s ' + e.kind); return; }
      mark(best[0], best[1], s);
      var hidden = like ? like.hidden : spots.length && spots.every(function (p) { return p.hidden; });
      out.push({ id: e.kind + '-' + e.i8, kind: e.kind, at: best, hidden: !!hidden, ethereal: !!(like && like.ethereal), under: !!(like && like.under), i8: e.i8 });
    });
    return out.sort(function (a, b) { return a.i8 - b.i8; });
  };

  // a band of class NPCs across the floor from the party: the free squares farthest north, spread a square apart
  Battle.prototype.seatBand = function (band, m, party) {
    var taken = {}, pts = [];
    party.forEach(function (u) { taken[u.x + ',' + u.y] = 1; });
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) { var q = m.at(x, y); if (q && q.walk) pts.push([x, y]); }
    var cx = (m.w - 1) / 2;
    pts.sort(function (a, b) { return a[1] - b[1] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx); });
    band.forEach(function (u) {
      var at = pts.filter(function (p) { for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if (taken[(p[0] + i) + ',' + (p[1] + j)]) return false; return true; })[0] || pts.filter(function (p) { return !taken[p[0] + ',' + p[1]]; })[0];
      if (!at) return;
      u.x = at[0]; u.y = at[1]; u.facing = 1; taken[at[0] + ',' + at[1]] = 1;
    });
    return band;
  };
  Battle.prototype.makeFoe = function (f) {
    var d = D.FOES[f.kind];
    if (d.build && D.npc && D.npc.NAMED[d.build]) return D.npc.fromFoe(this, f, d); // (a named caster built by its class: js/classes.js)
    var u = this.makeFoe0(f, d);
    // the bestiary's traits (js/traits.js): the sheet's own, carried on the unit
    if (D.traits) D.traits.FIELDS.forEach(function (k) { if (d[k] != null) u[k] = JSON.parse(JSON.stringify(d[k])); });
    // a stat block's spells (the SRD Mage, the Spirit Naga: data/foes.js `caster`), cast for real by the class tactics (js/tactics.js)
    if (d.caster) { var cs = d.caster; u.known = cs.known.slice(); u.slots = cs.slots.slice(); u.slotsMax = cs.slots.slice(); u.spellDC = cs.dc; u.spellAtk = cs.atk; u.castAb = cs.ab; u.lvl = cs.lvl; u.prof = Math.ceil(1 + cs.lvl / 4); u.classAI = true; u.weave = null; }
    return u;
  };
  Battle.prototype.makeFoe0 = function (f, d) {
    return {
      // the creature type (RULED 09-28: on every sheet) and the challenge rating (Turn Undead's destroying reads it)
      id: f.id, kind: f.kind, name: d.name, i8: f.i8, side: 'foe', sheet: d.sheet, type: d.type || null, cr: d.cr, rider: d.rider || null, x: f.at ? f.at[0] : 0, y: f.at ? f.at[1] : 0, facing: 1,
      hp: d.hp, maxhp: d.hp, baseAC: d.ac, speed: d.speed, size: d.size, reach: d.reach, abil: d.abil, saves: d.saves,
      init: d.init, perception: d.perception, attacks: d.attacks, multi: d.multi, jaunt: d.jaunt, faerie: d.faerieFire ? JSON.parse(JSON.stringify(d.faerieFire)) : null,
      fey: !!d.fey, webWalker: !!d.webWalker, regen: d.regen || 0, conds: {}, lvl: 5,
      // the bestiary's traits (09-27, the ladder): read by rules.js (packTactics), hurt() (resist/immune/vulnerable),
      // ai.js brute() (web, slam, bound, martial, surprise) and attack() (a grapple on a hit)
      packTactics: !!d.packTactics, resist: d.resist || null, immune: d.immune || null, vulnerable: d.vulnerable || null,
      // condition immunities cross from the 8-bit sheet (review 09-28 #9: the Keeper is not webbed, the pudding not put to sleep, the
      // roper not knocked down); a grid-only kind names its own. Light sensitivity (#7): bright light (the Light cantrip, Daylight)
      // costs it its next turn the first time and disadvantage while the light holds, as the 8-bit battle's dazzle does
      condImmune: (d.condImmune || (window.DS.DATA.monsters[f.kind] || {}).condImmune || null),
      lightSensitive: !!(d.lightSensitive || ((window.DS.DATA.monsters[f.kind] || {}).traits || {}).lightSensitive),
      // a soldier's own second wind and action surge (the Dominion line, review 09-28 #16): ai.js brute()
      secondWind: d.secondWind || null, actionSurge: !!d.actionSurge,
      web: d.web ? { atk: d.web.atk, range: d.web.range, dc: d.web.dc, recharge: d.web.recharge, ready: true } : null,
      slam: d.slam || null, bound: d.bound || null, martial: d.martial || null, surprise: d.surprise || null, holding: [],
      ethereal: !!f.ethereal || !!f.under, // a phase spider may start in the rock (the north cut: "They come out of the walls")
      // a burrower (SRD 5.1 burrow; the bulette, 10-01d: js/ai.js burrower): under the ground it is out of reach the way an ethereal one is
      // (ethereal too, for every rule that asks), drawn as its mound (js/ui.js); a fight may start it there (fights.js `under`)
      burrow: d.burrow || 0, under: !!f.under, walkWithin: d.walkWithin || 0,
      weave: d.weave ? JSON.parse(JSON.stringify(d.weave)) : null, sneak: d.sneak || null, assassinate: !!d.assassinate, stealth: d.stealth || 0,
      enlarge: d.enlarge ? { dice: d.enlarge.dice, used: false } : null, split: !!d.split, small: d.small || null,
      bolts: d.bolts || null, // runs for the map's exit when the named one falls (the wheelwright, when Hask does)
      reckless: !!d.reckless, rageOnHit: !!d.rageOnHit, raging: false,
      // (the 8-bit wagon yard, fight.runWhenHurt: nobody runs until the one at the traces is hit -- then both do, Battle.startRun)
      yields: !!d.yields, // (stops at half his hit points: Battle.over's 'yielded', the 8-bit game's yield)
      flees: !!d.flees && !(this.fight && (this.fight.noFlee || this.fight.runWhenHurt)), traces: !!f.traces, transfer: !!d.transfer, images: 0, named: !!d.named, swims: !!d.swims, swarm: !!d.swarm, noProne: !!d.noProne,
      moan: d.moan ? Object.assign({ ready: true }, d.moan) : null,
      leap: d.leap ? Object.assign({ ready: true }, d.leap) : null,
      phantasms: d.phantasms ? { when: d.phantasms, used: false } : null,
      darkness: d.darkness ? { r: d.darkness.r, range: d.darkness.range, chance: d.darkness.chance, used: false } : null, // (Amara's, once, the turn she runs; the drow's on the 8-bit's chance: magic.js castDarkness)
      hidden0: !!f.hidden,
      // senses (SRD 5.1; torchdark 09-28): how far it sees in the dark, or by blindsight (and blind past it: the oozes, the darkmantle),
      // and what it does with the dark itself (the darkmantle's aura, the duergar's Invisibility: ai.js brute)
      darkvision: d.darkvision || 0, blindsight: d.blindsight || 0, blind: !!d.blind, truesight: d.truesight || 0, devilSight: !!d.devilSight,
      aura: d.darknessAura ? { used: false } : null, invis: d.invisibility ? { used: false } : null,
      mirrorEye: !!d.mirrorEye // the Mirror's warlocks (RULED 09-28): no hiding or invisibility before her, in light (magic.js inMirror)
    };
  };
  // a damage type against a foe's resistances, immunities and vulnerabilities (SRD: immune 0, resist half, vulnerable x2)
  Battle.prototype.typed = function (u, n, type) {
    var t = type || '', has = function (l) { return l && l.some(function (k) { return t.indexOf(k) >= 0; }); };
    if (has(u.immune)) return { n: 0, why: 'immune' };
    if (has(u.resist)) return { n: Math.floor(n / 2), why: 'resists' };
    if (has(u.vulnerable)) return { n: n * 2, why: 'vulnerable' };
    return { n: n, why: '' };
  };
  // the pudding splits: each half has half its hit points and is one size smaller (Large -> Medium -> Small, and a Small
  // one does not split); the new one takes the nearest free square and acts right after it in the order
  Battle.prototype.splitOff = function (u) {
    var cls = u.sizeClass || (u.size > 1 ? 'L' : 'M'), next = cls === 'L' ? 'M' : 'S', half = Math.floor(u.hp / 2);
    var n = this.makeFoe({ id: u.id + '-' + (this.splitSeq = (this.splitSeq || 0) + 1), kind: u.kind });
    n.size = 1; if (u.small) n.sheet = u.small;
    var best = null, bd = Infinity, ux = u.x + ((u.size || 1) - 1) / 2, uy = u.y + ((u.size || 1) - 1) / 2;
    var wasSize = u.size; u.size = 1; // (its own footprint shrinks first, so the half can take a square it held)
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if ((x === u.x && y === u.y) || !G.canStand(n, x, y)) continue;
      var d = Math.hypot(x - ux, y - uy); if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) { u.size = wasSize; return; } // no room: it does not split
    u.hp = u.maxhp = half; u.sizeClass = next; if (u.small) u.sheet = u.small;
    n.hp = n.maxhp = half; n.sizeClass = next; n.x = best[0]; n.y = best[1]; n.facing = u.facing;
    n.anim = 'idle'; n.animT = this.t; n.flash = 10; n.reaction = 1; n.initRoll = u.initRoll;
    this.units.push(n);
    this.order.splice(this.order.indexOf(u) + 1, 0, n);
    FX.sparkle(n, 'stone', 16); FX.sparkle(u, 'stone', 16); D.sfx('poison');
    this.card(['{r}The ' + shortName(u) + ' splits in two!{/}  {g}(' + half + ' HP each, one size smaller){/}'], 360);
  };
  // let go of whatever u holds (it fell, or its grip was out of reach)
  Battle.prototype.release = function (u, only) {
    this.units.forEach(function (w) {
      var r = w.conds.restrained;
      if (r && r.by === u.id && r.grapple && (!only || only === w)) delete w.conds.restrained;
      if (w.conds.stunned && w.conds.stunned.by === u.id && (w.conds.stunned.fresh !== undefined || w.conds.stunned.till) && !only) delete w.conds.stunned; // (a foe's slam or moan -- laid with `fresh` -- or a blow's, on its laying one's turns' clock; a spell's stun holds without its caster: Power Word Stun, Divine Word, Symbol)
      if (w.conds.blinded && w.conds.blinded.by === u.id && w.conds.blinded.held && (!only || only === w)) delete w.conds.blinded; // (the darkmantle off the head, the cloaker's fold)
      if (w.conds.attached && w.conds.attached.by === u.id && (!only || only === w)) delete w.conds.attached; // (a darkmantle that was attached: SRD 5.1)
    });
    u.holding = (u.holding || []).filter(function (w) { return only && w !== only && w.conds.restrained && w.conds.restrained.by === u.id; });
  };
  // attached (the darkmantle: SRD 5.1 Crush, "it moves with the target"; 10-01, Griz in the Fork: "it looks like it's on his head, but it's actually in
  // the square straight in front him... so when a mouse fella is trying to target it they have to find the square it's actually in"): it rides the one
  // it holds -- on that one's square, holding none of its own (grid.js occupant), drawn over the head (ui.js perch 'over') or at the shoulder when it
  // did not get the head. Struck at through that square (ui.js valid: the attack tool on a friend's square); a natural 1 lands on the friend (attack)
  Battle.prototype.mount = function (u, host) {
    if (!u.rideXY) { // (its square follows the one it rides, as a familiar's does: js/familiar.js)
      var mx = u.x, my = u.y; u.rideXY = true;
      Object.defineProperty(u, 'x', { get: function () { return u.riding && u.master ? u.master.x : mx; }, set: function (v) { mx = v; }, enumerable: true, configurable: true });
      Object.defineProperty(u, 'y', { get: function () { return u.riding && u.master ? u.master.y : my; }, set: function (v) { my = v; }, enumerable: true, configurable: true });
    }
    u.tween = { fx: u.x, fy: u.y, fz: 0, t: 0, dur: this.pace(10, true) };
    var at = host.conds.attached; u.riding = true; u.attached = true; u.master = host; u.perch = at && at.by === u.id && at.head ? 'over' : 'shoulder';
    u.facing = host.facing;
  };
  // off the one it rode, however the grip ended -- broken, pulled off, let go, either of them down (10-01, Griz: "we might be best moving it off his square
  // when he breaks free. He normally couldn't occupy the same square"): it drops to the nearest open square beside, as a creature does that is pushed out
  // of a space it cannot share (the SRD names no square: invented.json)
  // pulled off by a friend (`by`: RULED 10-01, Griz: "pull off should land 'nearest available square to puller and victim' - (closer to Ly in this instance)"):
  // the open square nearest the two of them together, and of those the one nearer the puller
  Battle.prototype.dismount = function (u, by) {
    var host = u.master, hx = u.x, hy = u.y, best = null, bd = Infinity, bp = Infinity;
    var hb = host && host.conds.blinded, sawNot = !!(hb && hb.held && hb.by === u.id);
    if (host) this.release(u, host); // (what it laid on the one it rode goes with it: the attachment, the blindness over the head)
    if (sawNot && !host.conds.blinded && G.standing(host)) this.card(['{g}' + nameOf(host) + ' can see again.{/}'], 200);
    u.riding = false; u.attached = false; u.master = null; u.perch = null;
    for (var r = 1; r <= 4 && !best; r++) for (var y = hy - r; y <= hy + r; y++) for (var x = hx - r; x <= hx + r; x++) {
      if (Math.max(Math.abs(x - hx), Math.abs(y - hy)) !== r || !G.canStand(u, x, y)) continue;
      var dp = by ? Math.hypot(x - by.x, y - by.y) : 0, d = Math.hypot(x - hx, y - hy) + dp;
      if (d < bd - 1e-9 || (Math.abs(d - bd) < 1e-9 && dp < bp)) { bd = d; bp = dp; best = [x, y]; }
    }
    u.x = best ? best[0] : hx; u.y = best ? best[1] : hy;
    u.tween = { fx: hx, fy: hy, fz: 18, t: 0, dur: this.pace(12, true) };
    if (host && !u.dead && u.hp > 0) this.card(['{g}The ' + shortName(u) + ' drops off ' + nameOf(host) + ' to the floor beside.{/}'], 220);
  };
  // bigger than Medium: two squares and more, or a Medium (not a halfling's or a gnome's Small) Enlarged a size up (SRD 5.1 Enlarge: "from Medium to Large")
  Battle.overMedium = function (u) {
    if ((u.size || 1) > 1) return true;
    var en = u.conds && u.conds.enlarged, small = u.sizeClass === 'S' || /halfling|gnome/i.test(u.race || '');
    return !!(en && !en.down && !small);
  };
  // each step of the coroutine (step, below): a rider whose hold is gone comes off -- its host or itself down, gone off the plane, banished, turned, asleep on the
  // floor (prone) -- and one whose host has grown past Medium since it got on (Enlarge) is thrown off, as if pulled off, to the nearest open square (RULED 10-01,
  // Griz: "only when he's Medium or smaller"; then "treat if 'victim enlarge' = pull it off to nearby square")
  Battle.prototype.rideSync = function () {
    for (var i = 0; i < this.units.length; i++) {
      var u = this.units[i]; if (!u.attached || !u.riding) continue;
      var h = u.master, at = h && h.conds.attached;
      if (!h || u.dead || u.hp <= 0 || h.dead || h.hp <= 0 || !at || at.by !== u.id || h.ethereal || u.ethereal || h.conds.banished || u.conds.banished || u.conds.prone || !G.hostile(u, h)) { this.dismount(u); continue; }
      if (!at.big && Battle.overMedium(h)) { this.card(['{g}' + nameOf(h) + ' swells past it: the ' + shortName(u) + ' is thrown off.{/}'], 240); this.dismount(u); }
    }
  };

  // ------------------------------------------------------------------ the coroutine
  Battle.prototype.step = function (v) {
    for (var guard = 0; guard < 200; guard++) {
      if (this.globes && D.magic.globeSync) D.magic.globeSync(this); // (a Globe of Invulnerability: what it holds off a creature that has stepped in, set aside; what it no longer does, put back -- js/grimoire.js, 10-01c)
      this.rideSync(); // (a darkmantle off the one it rode, its grip gone: dismount)
      var r = this.co.next(v); v = undefined;
      if (r.done) { this.co = null; return; }
      var y = r.value;
      if (typeof y === 'number') { if (y > 0) { this.wait = this.pace(y, true); return; } continue; }
      if (y && y.fx) { this.waitFx = true; return; }
      if (y) { this.req = y; this.onRequest(y); return; }
    }
  };
  // the pace (10-01, Griz: "if adjustable, slow down the ai-turn and message display times by 25%"): D.PACE (js/ui.js: 1.25 by default; the M menu's PACE row,
  // 1 / 1.25 / 1.5) stretches the generator's waits while an AI-run unit has the turn -- a foe, a guest, a hero the class tactics run -- so what the AI does is
  // easier to follow. A player's own steps and swings keep their time (his hero should feel the same), as does everything between turns. Rounded, never 0.
  // Only the frames a person watches go through here (step: a wait; card: a message's life; moveAlong: a step's tween): the benches drive the coroutine
  // and never wait, so they run at one speed whatever it is
  Battle.prototype.pace = function (n, wait) {
    var P = D.PACE;
    if (!(P > 0) || P === 1 || !(n > 0)) return n;
    if (wait && !(this.active && byAI(this.active))) return n; // (a wait is the AI's only while an AI-run unit has the turn; a message's life is the pace's whoever's turn)
    return Math.max(1, Math.round(n * P));
  };
  Battle.prototype.answer = function (v) { this.req = null; this.step(v); };
  Battle.prototype.update = function () {
    this.t++;
    if (this.shakeT > 0) this.shakeT--;
    FX.update();
    this.units.forEach(function (u) { if (u.flash > 0) u.flash--; if (u.tween) { u.tween.t++; if (u.tween.t >= u.tween.dur) delete u.tween; } });
    this.cards = this.cards.filter(function (c) { return this.t - c.t0 < c.life; }, this);
    if (this.menu) { D.ui.menuInput(this); return; }
    if (I.pressed('menu')) { D.ui.openMenu(this); return; }
    if (this.req) { D.ui.input(this, this.req); return; }
    D.ui.camera(this);
    if (this.waitFx) { if (FX.busy()) return; this.waitFx = false; }
    if (this.wait > 0) { this.wait--; return; }
    if (this.co) this.step();
    else if (this.result) D.ui.resultInput(this);
  };

  // ------------------------------------------------------------------ cards: every roll on screen, the 8-bit game's CheckScene in small
  // a card with an id updates in place (an attack's card grows as the reactions and the damage come in), in the log too:
  // the log keeps { id, text } so an update replaces its own lines even after the screen's cards were cleared
  Battle.prototype.card = function (lines, life, id) {
    var round = this.round, ls = [].concat(lines), last = this.cards[this.cards.length - 1];
    this.logEntries = (this.logEntries || []).filter(function (e) { return !id || e.id !== id; });
    ls.forEach(function (l) { if (l) this.logEntries.push({ id: id, text: 'R' + round + ' ' + window.DS.stripCodes(l) }); }, this);
    this.log = this.logEntries.map(function (e) { return e.text; });
    if (id && last && last.id === id) { last.lines = ls; last.t0 = this.t; return; }
    this.cards.push({ lines: ls, t0: this.t, life: this.pace(life || 300), id: id }); // (the message's time: D.PACE, whoever's turn -- Battle.prototype.pace)
    if (this.cards.length > 3) this.cards.shift();
  };
  Battle.prototype.clearCards = function () { this.cards = []; };

  Battle.prototype.alive = function (side) { return this.units.filter(function (u) { return u.side === side && !u.dead && u.hp > 0; }); };
  Battle.prototype.over = function () {
    // a fight that must not let them go (the wagon yard: fight.noEscape): one got away, and it is lost
    if (this.fight.noEscape && !this.alive('foe').length && this.units.some(function (u) { return u.fled; })) return 'lost';
    // a fight that ends the moment one gets away (the 8-bit wagon yard, fight.fledEnds: either of the pair on the road is the chase)
    if (this.fight.fledEnds && this.units.some(function (u) { return u.side === 'foe' && u.fled; })) return 'fled';
    // bright light under the roost (the Light cantrip, Daylight): the roof lets go -- the 8-bit game's RoostFail runs on it
    // (RULED 09-28: the roost law is canon; fire and thunder stay greyed, the one thing to remember is not to cast light)
    if (this.roostBroken) return 'roost';
    // (a foe turned wholly to stone -- Flesh to Stone's third failed save -- holds no fight open: it had stalled one for good, 10-01)
    if (!this.alive('foe').filter(function (u) { return !u.summon && !u.dominated && !(u.conds.stoning && u.conds.stoning.done); }).length) return 'won';
    // one who yields when he is beaten (the cleric at Deepholm's door): at half his hit points, standing, it is over (the
    // 8-bit battle's `yields`: a blow that drops him from above half to nothing kills him instead)
    if (this.units.some(function (u) { return u.side === 'foe' && u.yields && u.hp > 0 && u.hp <= u.maxhp / 2; })) return 'yielded';
    // one whose fall ends it (a guest the party swore to bring back: Corwen Dace in the deep gallery -- RULED 10-01c, Griz: "game over if the kid falls")
    if (this.units.some(function (u) { return u.vital && u.side === 'party' && (u.dead || u.hp <= 0); })) return 'lost';
    // none of the party left on the field: lost, unless one of them got out (the climb's campfire; Griz, 09-27), or the rest
    // are still on their way out of the inn (this.reserve)
    // (a familiar left alone keeps no fight going, and one sent to its pocket of the world got nobody out)
    // (nor do summoned creatures: they go when their caster's concentration does)
    // (nor a hero turned to stone -- Flesh to Stone's third failed save, the foe side's test above: it never acts again; a party all stone is a lost fight, 10-01)
    if (!this.alive('party').filter(function (u) { return !u.familiar && !u.summon && !u.dominated && !u.loose && !(u.conds && u.conds.stoning && u.conds.stoning.done); }).length) return this.reserve.length ? null : this.units.some(function (u) { return u.left && !u.familiar && !u.summon; }) ? 'escaped' : 'lost';
    return null;
  };
  // the rest of the party out of the inn (the lone investigator's round-two help): onto the free squares nearest the fight's
  // entry, each on its own initiative
  Battle.prototype.joinReserve = function* () {
    var self = this, come = this.reserve, e0 = (this.fight.entry || this.map.def.entry)[0], names = [];
    this.reserve = [];
    come.forEach(function (u) {
      if (u.familiar) { self.units.push(u); return; } // (a familiar comes riding its wizard, and has no initiative of its own)
      var at = null, bd = Infinity;
      for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) { if (!G.canStand(u, x, y)) continue; var d = Math.hypot(x - e0[0], y - e0[1]); if (d < bd) { bd = d; at = [x, y]; } }
      if (!at) return;
      u.x = at[0]; u.y = at[1]; u.facing = 5; u.anim = 'idle'; u.animT = self.t; u.flash = 0; u.reaction = 1; u.conds = u.conds || {};
      if (u.hp <= 0) u.ko = true;
      self.units.push(u); names.push(u.name);
      u.initRoll = D.d(20) + u.init;
      var k = 0; while (k < self.order.length && self.order[k].initRoll >= u.initRoll) k++;
      self.order.splice(k, 0, u);
      FX.sparkle(u, 'gold', 10);
    });
    if (!names.length) return;
    this.focus(come[0]); D.sfx('popup');
    this.card(['{y}' + names.join(', ') + '{/} ' + (names.length > 1 ? 'come' : 'comes') + ' out of the inn!  {g}(' + come.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ') + '){/}'], 360);
    yield 50;
  };

  // ------------------------------------------------------------------ the run: entry card, initiative, rounds
  Battle.prototype.run = function* () {
    var self = this;
    D.music(this.fight.music || 'battle'); // (it starts on the first key or click: browsers hold sound till then; a set piece's boss tune)
    if (!this.fight.noCards) yield { entry: true }; // (the wet has none: RULED 09-30c, "no press e, just go")
    // initiative: d20 + DEX (and the fighter's Remarkable Athlete), rolled once
    var rolls = this.units.map(function (u) { var d = D.d(20); if (u.initAdv) d = Math.max(d, D.d(20)); u.initRoll = d + u.init; return { u: u, d: d }; }); // (initAdv: the barbarian's Feral Instinct, 7)
    // (a familiar has no initiative: its turn comes right after its caster's -- RULED 09-30, js/familiar.js FM.after)
    this.order = this.units.filter(function (u) { return !u.familiar; }).sort(function (a, b) { return b.initRoll - a.initRoll || b.abil.dex - a.abil.dex; });
    this.card(['{y}INITIATIVE{/}  ' + this.order.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ')], 360);
    yield 50;
    // an ambush (the sect blades at the rest): the foes' Stealth, rolled once, against each hero's passive Perception;
    // whoever does not notice is caught unaware -- no turn in the first round, no reactions till then
    // inside the 8-bit game its scene has already said who saw whom (the 8-bit battle's `surprised`: the watch that missed
    // the blades, the roper's grab, the crept-up raid), so that side loses the first round and nothing is rolled here
    var sur = this.o.embed && this.o.embed.surprised;
    if (sur === 'party' || sur === 'foes') {
      var side = sur === 'party' ? 'party' : 'foe';
      this.units.forEach(function (w) { if (w.side === side && w.hp > 0) w.conds.surprised = true; });
      this.card([sur === 'party' ? '{r}CAUGHT OFF GUARD{/}: they have the first round.' : '{y}THEY NEVER SAW YOU COMING{/}: the first round is yours.'], 360);
      D.sfx(sur === 'party' ? 'encounter' : 'popup');
      yield 60;
    } else if (this.fight.ambush && !this.o.embed) {
      var sk = Math.max.apply(null, this.units.filter(function (w) { return w.side === 'foe'; }).map(function (w) { return w.stealth || 0; }));
      var sr = D.d(20), st = sr + sk, caught = [], lines = ['{r}AMBUSH{/}: their Stealth d20 ' + sr + ' ' + RU.sign(sk) + ' = ' + st + ' against each passive Perception'];
      this.units.forEach(function (w) {
        if (w.side !== 'party' || w.hp <= 0) return;
        var ok = (w.perception || 10) >= st;
        lines.push('  ' + w.name + ' ' + (w.perception || 10) + ': ' + (ok ? '{n}sees them coming{/}' : '{o}caught unaware{/}'));
        if (!ok) { w.conds.surprised = true; caught.push(w); }
      });
      this.card(lines, 480);
      D.sfx(caught.length ? 'encounter' : 'popup');
      yield 70;
    }
    if (D.familiar && D.familiar.alarm) yield* D.familiar.alarm(this); // (the frog familiar's croak: its caster is never caught off guard)
    while (true) {
      this.round++;
      if (this.reserve.length && this.round >= ((this.o.embed && this.o.embed.join) || 2)) yield* this.joinReserve();
      for (var i = 0; i < this.order.length; i++) {
        var u = this.order[i];
        if (u.dead) continue;
        this.active = u;
        if (u.side === 'party' && !u.guest) yield* this.heroTurn(u);
        else if (this.show && u.show) yield* D.show.turn(this, u); // (the test ground's director, js/show.js: the AI's turn with its nudges about it)
        else yield* D.ai.turn(this, u);
        this.active = null;
        if (D.familiar && !u.familiar) yield* D.familiar.after(this, u); // (his familiar's turn, right after his: js/familiar.js)
        yield* this.wave();
        this.sweep();
        var o = this.over();
        if (o) { yield* this.finish(o); return; }
        i = this.order.indexOf(u); // (a new foe may have been dealt in ahead of it)
      }
    }
  };
  function shortName(u) { return u.side === 'foe' ? ({ drow: 'Captain', phasespider: 'Spider', drider: 'Drider', spellweaver: 'Weaver', bugbearchief: 'Chief', hobsergeant: 'Sergeant', assassin: 'Blade', stonegiant: 'Giant', pudding: 'Pudding', giantspider: 'Spider', willem: 'Willem' }[u.kind] || u.name) : u.name; }

  // the second wave: when the gallery goes still, the cocoon on the far wall splits and what was in it drops out,
  // dealt into the initiative on its own roll. The hero whose blow did it keeps the rest of the turn.
  Battle.prototype.wave = function* () {
    var w = this.fight.wave !== undefined ? this.fight.wave : this.map.def.wave;
    if (!w || this.waved || this.over() !== 'won') return;
    this.waved = true;
    var u = this.makeFoe(w), best = null, bd = Infinity;
    for (var y = 0; y < G.map.h; y++) for (var x = 0; x < G.map.w; x++) {
      if (!G.canStand(u, x, y)) continue;
      var d = Math.hypot(x + (u.size - 1) / 2 - w.from[0], y + (u.size - 1) / 2 - w.from[1]);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return;
    u.x = best[0]; u.y = best[1]; u.facing = 0;
    u.anim = 'idle'; u.animT = this.t; u.flash = 0; u.reaction = 1;
    u.tween = { fx: w.from[0] - (u.size - 1) / 2, fy: w.from[1] - (u.size - 1) / 2, fz: 46, t: 0, dur: this.pace(26, true) }; // the drop from the wall (paced on an AI's turn, as a step is: the pace runner's found list, 10-01c)
    this.units.push(u);
    // the split cocoon stays on the wall as a husk
    this.map.props.forEach(function (p) { if (p.kind === 'cocoon' && p.sq.x === w.from[0] && p.sq.y === w.from[1]) p.alpha = 0.3; });
    u.initRoll = D.d(20) + u.init;
    var at = 0;
    while (at < this.order.length && (this.order[at].initRoll > u.initRoll || (this.order[at].initRoll === u.initRoll && this.order[at].abil.dex >= u.abil.dex))) at++;
    this.order.splice(at, 0, u);
    this.focus(u);
    FX.sparkle(u, 'bone', 24);
    D.sfx('encounter'); D.music('boss');
    this.card(['{r}A cocoon on the far wall splits.{/} Something drops out of it on eight legs.', '{r}A DRIDER{/}: a drow above, a spider below.  {g}initiative ' + u.initRoll + '{/}'], 420);
    yield 70;
  };
  Battle.prototype.shortName = shortName;

  // the conditions' housekeeping after every turn (09-27, Griz: "check the rest of the status effects for the similar issue
  // poison and restrained were having"): what a creature holds ends with it. A stun or a fright it laid (the slam's, the
  // Moan's: till the end of its next turn) ends when it is gone, since that turn never comes; its concentration ends when it
  // is incapacitated (paralyzed, stunned, asleep: SRD), and so does a grip it holds (a grapple ends when the grappler is)
  Battle.prototype.sweep = function () {
    var self = this;
    this.units.forEach(function (s) {
      // a summoned creature at 0 HP is gone (SRD: "it disappears when it drops to 0 hit points")
      if (s.summon && s.hp <= 0 && !s.dead) { s.dead = true; s.left = true; s.deadT = self.t; FX.sparkle(s, 'moss', 8); }
      if (s.familiar && s.hp <= 0 && !s.dead && D.familiar && D.familiar.vanish) D.familiar.vanish(self, s); // (and a familiar: SRD 5.1, "it disappears")
      var gone = s.dead || s.fled || s.left || s.hp <= 0, incap = gone || s.conds.paralyzed || s.conds.stunned || s.conds.asleep;
      if (gone) self.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { if (w.conds[c] && w.conds[c].by === s.id && !(c === 'frightened' && w.conds.turned) && !(c === 'stunned' && w.conds[c].fresh === undefined && !w.conds[c].till)) delete w.conds[c]; }); }); // (a prayer's turning runs its minute out, whoever fell; nor does a spell's stun -- only the slam's and the moan's, laid with `fresh`, and a blow's, on a clock of its laying one's turns, go with the one who laid them)
      if (incap && s.conc) D.magic.endConc(self, s, gone ? 'gone' : 'incapacitated');
      if (incap && s.holding && s.holding.length) self.release(s);
      // a blinding hold (the darkmantle over the head, the cloaker's fold) ends with the grip, however the grip ended
      var bl = s.conds.blinded;
      if (bl && bl.held && !(s.conds.restrained && s.conds.restrained.by === bl.by && s.conds.restrained.grapple) && !(s.conds.attached && s.conds.attached.by === bl.by)) { delete s.conds.blinded; self.card(['{g}' + (s.side === 'foe' ? 'The ' + shortName(s) : s.name) + ' can see again.{/}'], 200); }
    });
  };

  // the pair run (the 8-bit wagon yard, fight.runWhenHurt; Griz 09-27: "willem try to unhook them for the first part of the
  // fight (until he takes damage) - then amara and willem will try to make the escape on foot"; and "him getting hit should
  // not [do anything] in the fight - but start them both running for the escape tile on their next move"): the blow only
  // marks it (hurt: this.hitAtTraces); each of the pair breaks for the road at the start of its own next turn (ai.js turn)
  Battle.prototype.startRun = function (u) {
    u.flees = true;
    D.sfx('run');
    if (u.traces) {
      u.traces = false;
      this.riders.forEach(function (r) { if (r.team) { r.anim = 'hurt'; r.animT = this.t; } }, this); // (the team flinches in its harness; it stays hitched)
      this.card(['{r}' + shortName(u) + ' lets go of the traces.{/}  "Leave them!"  He breaks for the road, on foot.'], 400);
    } else this.card(['{r}' + shortName(u) + ' breaks for the road, on foot.{/}'], 400);
  };

  Battle.prototype.finish = function* (o) {
    this.result = o;
    this.rideSync(); // (a rider whose hold ended on the last blow comes off before the fight is read: what the 8-bit's sheet saves after sees no darkmantle's blindness)
    if (D.magic && D.magic.globeLift) D.magic.globeLift(this); // (what a Globe of Invulnerability held off anyone is put back on, the globes gone: what the 8-bit's sheet saves after sees the creature whole -- js/grimoire.js, 10-01c)
    // the glamour broken: the riders are what they were all along (the wagon yard's children)
    if (o === 'won') this.riders.forEach(function (r) { if (r.after) { r.sheet = r.after; FX.sparkle({ x: r.x, y: r.y, size: 1 }, 'gold', 14); } });
    if (o !== 'fled' && o !== 'yielded') D.music(o === 'won' ? 'victory' : 'gameover'); // (one got away: the boss tune runs on into the chase)
    // the roost coming down as a picture on the grid (torchdark 09-28; the 8-bit's swarm() the model): the ceiling lets go over the
    // iso map, the shake every ten frames, then the hand-off to the 8-bit game's RoostFail as before
    if (o === 'roost') { D.sfx('encounter'); this.card(['{r}' + (this.roostBroken === 'daylight' ? 'Daylight' : 'Bright light') + ' under a roosted ceiling. The whole roof shifts at once: millions of wings.{/}'], 1e9); FX.swarm(); this.shakeT = 170; for (var sk = 0; sk < 17; sk++) { D.sfx('miss'); yield 10; } yield 30; }
    yield 30;
    var F = this.fight, gone = this.units.some(function (u) { return u.fled; }) && this.alive('party').length;
    var head = o === 'roost' ? '{r}THE ROOST COMES DOWN.{/}' : o === 'yielded' ? '{y}' + ((this.o.embed && this.o.embed.yieldText) || F.yielded || 'HE LOWERS HIS HANDS.') + '{/}' : o === 'won' ? '{y}' + (F.won || 'THE GALLERY IS STILL.') + '{/}' : o === 'escaped' ? '{y}OUT THE WAY THEY CAME IN.{/}' : '{r}' + (gone ? (F.escaped || 'THEY GOT AWAY.') : (F.lost || 'THE DARK KEEPS THEM.')) + '{/}';
    this.card([head, D.keys('{g}' + (this.o.embed ? 'E to go on' : this.o.onDone ? (this.o.climb ? 'E back to the climb' : 'E back to the ladder') : 'E fight again') + ' · M the menu{/}')], 1e9);
  };

  // ------------------------------------------------------------------ a hero's turn: the player acts until END TURN
  Battle.prototype.heroTurn = function* (u) {
    RU.startTurn(u);
    this.focus(u);
    if (u.conds.surprised && D.features && D.features.feral && (yield* D.features.feral(this, u))) delete u.conds.surprised; // (Feral Instinct: he rages, and acts)
    if (u.conds.surprised) { delete u.conds.surprised; this.card(['{g}' + u.name + ' is caught unaware: no turn this round.{/}']); yield 40; return; }
    if (RU.canAct(u)) D.sfx('popup'); // your turn
    if (!RU.canAct(u)) {
      this.card(['{g}' + u.name + (u.hp <= 0 ? ' is down.' : u.conds.paralyzed ? ' is held fast.' : u.conds.stunned ? ' is stunned.' : ' cannot act.') + '{/}']);
      yield 40;
      if (u.hp > 0) D.magic.endTurn(this, u); // a held hero still gets the save at the end of the turn (the weaver's Hold, the chuul)
      return;
    }
    // banished or sealed in a sphere; confused (js/grimoire.js)
    if (u.conds.banished) { this.card(['{g}' + u.name + ' is not here.{/}']); yield 40; D.magic.endTurn(this, u); return; }
    if (u.conds.confused && D.magic.confusedTurn && (yield* D.magic.confusedTurn(this, u))) { yield 30; D.magic.endTurn(this, u); return; }
    // Fear's run (a foe's Fear, js/grimoire.js): the Dash away from it, and the turn is over
    if (D.magic.mustFlee && D.magic.mustFlee(u)) { yield* D.tactics.fleeFear(this, u); yield 30; D.magic.endTurn(this, u); return; }
    // a word of Command obeyed (a foe's Command, js/grimoire.js): the turn is the word's
    if (u.turn.lost) { if (u.turn.fleeFrom) yield* D.magic.flee(this, u); yield 40; D.magic.endTurn(this, u); return; }
    // Irresistible Dance (10-01, Griz: "agree, player choice, ai takes irresistible seriously ;)"): the player's dancer is asked -- SHAKE IT OFF (the WIS
    // save, the action spent) or FIGHT ON (no save, the action kept, no move): js/grimoire.js M.danceAsk. The AI's dancer saves in M.onStart
    if (u.turn.danceAsk && D.magic.danceAsk) yield* D.magic.danceAsk(this, u);
    this.tool = 'move'; this.cursor = { x: u.x, y: u.y };
    while (true) {
      var cmd = yield { turn: u };
      if (!cmd || cmd.do === 'end') break;
      yield* this.exec(u, cmd);
      yield* this.wave();
      if (this.over() || !RU.canAct(u)) break;
      this.keepInView(u);
    }
    D.magic.endTurn(this, u);
    this.tool = 'move';
  };

  // what a hero can do right now (the bar's buttons, and the harness's)
  Battle.prototype.commands = function (u) {
    var T = u.turn, out = [], has = function (id) { return u.known && u.known.indexOf(id) >= 0; };
    var slot = function (min) { for (var i = min - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) return i + 1; return 0; };
    // a swing is only there to take with a foe in reach, or the feet left to walk to one (Lymen's second attack, 09-27)
    var foeNear = this.foeInReach(u), canWalk = T.move > 0 && !u.conds.restrained;
    out.push({ id: 'attack', label: T.attacksLeft ? 'ATTACK (' + T.attacksLeft + ')' : 'ATTACK' + (u.attacks > 1 ? ' x' + u.attacks : ''), cost: 'A', ok: (T.attacksLeft > 0 || T.action > 0) && (foeNear || canWalk), why: foeNear || canWalk ? '' : 'no foe in reach, and no feet left', tool: 'attack' });
    if (u.conds.restrained) out.push({ id: 'breakfree', label: 'BREAK FREE', cost: 'A', ok: T.action > 0 && !T.attacksLeft, icon: 'free' });
    var spells = D.magic.list(this, u);
    if (spells.length) out.push({ id: 'spells', label: 'SPELLS', cost: 'A', ok: spells.some(function (e) { return e.ok; }), sub: 'spells', icon: 'spell' });
    var items = this.itemList(u);
    var fast = u.subclass === 'Thief' && T.bonus > 0; // Fast Hands: the Thief uses an item with her bonus action
    if (items.length) out.push({ id: 'items', label: 'ITEM', cost: fast ? 'B' : 'A', ok: fast || (T.action > 0 && !T.attacksLeft), sub: 'items', icon: 'item' });
    if (u.cls === 'fighter') {
      out.push({ id: 'secondwind', label: '2ND WIND', cost: 'B', ok: T.bonus > 0 && u.feats.secondWind > 0, why: u.feats.secondWind > 0 ? '' : 'spent (a short rest brings it back)', note: '1d10+' + u.lvl + ' HP, ' + (u.feats.secondWind > 0 ? '1 use' : 'spent') + ' (short rest)' });
      if (u.lvl >= 2) out.push({ id: 'surge', label: 'SURGE', cost: 'F', ok: u.feats.actionSurge > 0 && !T.action && !T.attacksLeft, why: u.feats.actionSurge > 0 ? 'after your action' : 'spent (a short rest brings it back)', note: 'one more action, ' + (u.feats.actionSurge > 0 ? '1 use' : 'spent') + ' (short rest)' });
    }
    // HIDE sits on the rogue's first ring (Griz, 09-27: "Rogues gonna hide allatime"): Cunning Action's bonus action from
    // level 2, and the action when the bonus is gone (or before level 2, as the tabletop's Hide action)
    var cun = u.cls === 'rogue' && u.lvl >= 2 && T.bonus > 0;
    if (u.cls === 'rogue') out.push({ id: 'hide', label: 'HIDE', cost: cun ? 'B' : 'A', ok: cun || (T.action > 0 && !T.attacksLeft), note: (cun ? 'Cunning Action: ' : '') + 'Stealth against their eyes' });
    // Flame Tongue: a bonus action lights it or puts it out (not under the roost: its one law is no fire)
    if (u.weapon && u.weapon.flame) {
      var roostF = this.fight && this.fight.roost && !u.conds.ablaze;
      out.push({ id: u.conds.ablaze ? 'douse' : 'ignite', label: u.conds.ablaze ? 'DOUSE' : 'IGNITE', cost: 'B', icon: 'sacred', ok: T.bonus > 0 && !roostF, why: roostF ? 'the roost overhead: no fire' : 'the bonus action is spent', note: u.conds.ablaze ? 'the blade goes dark' : u.weapon.name + ': +' + u.weapon.flame + ' fire on a hit, light 40 ft' });
    }
    // torches are hands (torchdark, 09-28; the lighting is ITEM: a torch out of the pack, an action): the lit one in his hand may be
    // dropped (the turn's free hand on an object: it burns where it falls), thrown to a square within 20 ft (an action), or put out
    // (free, back in the pack); one burning at his feet is taken up (free, a free hand)
    var Lt = D.light, freeWhy = 'the free hand on an object is spent this turn';
    var floorLight = !u.torch && !u.guest && Lt.torchAt(this, u.x, u.y);
    if (u.torch && !u.guest && Lt.kindOf(u.torch) === 'lantern') {
      // the hooded lantern (RULED 09-29): the hood is the free hand on an object; up is bright light (under a roost, the one law: refused)
      // (the Ledger-Lamp, 09-30, is the same law at its own radii: the wheel reads them off the light, and calls it a LAMP)
      var roostL = this.fight && this.fight.roost, upR = Lt.radii(Lt.make(u.torch.item, false)), lampTag = Lt.tag(u.torch);
      if (u.torch.hood) out.push({ id: 'hoodup', label: 'HOOD UP', cost: 'F', icon: 'lantern', ok: !T.freeObj && !roostL, why: roostL ? 'the roost overhead: bright light would wake it' : freeWhy, note: 'bright ' + upR.bright + ' ft and dim ' + upR.dim + ' more' + (roostL ? ' -- {r}BRIGHT LIGHT, UNDER THE ROOST{/}' : '') });
      else out.push({ id: 'hooddown', label: 'HOOD DOWN', cost: 'F', icon: 'lantern', ok: !T.freeObj, why: freeWhy, note: 'dim light 5 ft only: nothing is dazzled, and a roost sleeps' });
      out.push({ id: 'droptorch', label: 'SET DOWN ' + lampTag, cost: 'F', icon: 'lantern', ok: !T.freeObj, why: freeWhy, note: 'it burns where it stands' });
      out.push({ id: 'dousetorch', label: 'DOUSE ' + lampTag, cost: 'F', icon: 'lantern', ok: !T.freeObj, why: freeWhy, note: 'out, and back in the pack' });
    } else if (u.torch && !u.guest) {
      out.push({ id: 'droptorch', label: 'DROP TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj, why: freeWhy, note: 'it burns where it falls' });
      out.push({ id: 'throwtorch', label: 'THROW TORCH', cost: 'A', icon: 'torch', ok: T.action > 0 && !T.attacksLeft, why: 'the action is spent', tool: 'torch', note: 'to a square within 20 ft: it burns there' });
      out.push({ id: 'dousetorch', label: 'DOUSE TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj, why: freeWhy, note: 'out, and back in the pack' });
    } else if (floorLight) out.push({ id: 'pickuptorch', label: 'TAKE UP ' + Lt.tag(floorLight), cost: 'F', icon: floorLight.kind === 'lantern' ? 'lantern' : 'torch', ok: !T.freeObj && Lt.handsFree(u) > 0, why: T.freeObj ? freeWhy : Lt.handsWhy(u), note: 'the one burning at your feet' });
    if (u.cls === 'paladin') out.push({ id: 'lay', label: 'LAY HANDS', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.lay > 0, tool: 'lay', note: 'a pool of ' + (u.feats.lay || 0) + ' HP (long rest), touch' });
    // Sacred Weapon (Channel Divinity, Oath of Devotion): the 8-bit game's SKILL beside Lay on Hands, an action there as here
    if (u.cls === 'paladin' && u.lvl >= 3) out.push({ id: 'sacred', label: 'SACRED WEAPON', cost: 'A', ok: T.action > 0 && !T.attacksLeft && u.feats.channel > 0 && !u.conds.sacred, why: u.conds.sacred ? 'it is shining already' : u.feats.channel > 0 ? '' : 'Channel Divinity is spent (a short rest brings it back)', note: '+' + Math.max(1, D.mod(u.abil.cha)) + ' to hit for a minute; Channel Divinity ' + (u.feats.channel > 0 ? '1/1' : '0/1') + ' (short rest)' + (this.fight && this.fight.roost ? ' -- {r}BRIGHT LIGHT, UNDER THE ROOST{/}' : '') });
    // the class features the AI runs for itself, as buttons when the player runs one (js/features.js F.commands; SKILLS)
    if (D.features && D.features.commands) out = out.concat(D.features.commands(this, u));
    // DASH, DISENGAGE, DODGE, HELP: the same ACTIONS for all four (Griz, 09-27: "uniform like the paladin"). The rogue's
    // Dash and Disengage are Cunning Action's (the bonus action) while she has the bonus, the plain actions after
    if (cun) {
      out.push({ id: 'cdash', label: 'DASH', cost: 'B', ok: !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : 'held fast: her speed is 0, and a Dash adds her speed', note: 'Cunning Action: +' + u.speed + ' ft this turn', icon: 'dash' });
      out.push({ id: 'cdisengage', label: 'DISENGAGE', cost: 'B', ok: !T.disengaged, note: 'Cunning Action: leaving reach provokes nothing', icon: 'disengage' });
    } else {
      out.push({ id: 'dash', label: 'DASH', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : 'the action is spent', note: '+' + u.speed + ' ft this turn' });
      out.push({ id: 'disengage', label: 'DISENGAGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !T.disengaged, note: 'leaving reach provokes nothing this turn' });
      // Expeditious Retreat (SRD 5.1: "as a bonus action on each of your turns until the spell ends, you can take the Dash action"): the mark
      // js/grimoire.js sets each turn (T.bonusDash) while the spell holds -- a second DASH, for the bonus action
      if (T.bonusDash && u.conds.retreat) out.push({ id: 'cdash', label: 'RETREAT DASH', cost: 'B', ok: T.bonus > 0 && !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : 'the bonus action is spent', note: 'Expeditious Retreat: +' + u.speed + ' ft this turn', icon: 'dash' });
    }
    // out the way the party came in (the fight's entry squares): the tabletop's walking off the table (Griz, 09-27: the climb's escape)
    // (inside the 8-bit game, only where its own battle had RUN: this.o.embed.canRun)
    if (this.onExit(u) && !(this.o.embed && this.o.embed.canRun === false)) out.push({ id: 'leave', label: 'LEAVE THE FIGHT', cost: 'M', icon: 'back', ok: T.move >= 5 && !u.conds.restrained, why: u.conds.restrained ? 'held fast' : 'no move left', note: 'out the way you came in: a foe beside you gets its swing' });
    out.push({ id: 'dodge', label: 'DODGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft, note: 'attacks at you at disadvantage till your next turn' });
    // Help (the attack kind) only with a foe beside you (Griz, 09-27) -- and on a friend beside you who needs a hand (10-01c, Griz: "repurpose the help action to
    // conditionally target allies as well as current target enemy"): a sleeper shaken awake (SRD 5.1 Sleep: "someone uses an action to shake or slap the sleeper
    // awake"), one held in a web or a grip given advantage on its next check to get out (SRD 5.1 Help: "advantage on the next ability check it makes")
    var helpFoe = this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && G.dist(u, w) <= 5; }), helpMate = this.units.some(function (w) { return Battle.helpable(u, w); });
    if (helpFoe || helpMate)
      out.push({ id: 'help', label: 'HELP', cost: 'A', ok: T.action > 0 && !T.attacksLeft, tool: 'help', note: helpFoe && helpMate ? 'a foe beside you: the next ally to swing at it has advantage; a friend beside you: wake a sleeper, a hand out of a web or a grip' : helpFoe ? 'the next ally to swing at a foe beside you has advantage' : 'a friend beside you: wake a sleeper, a hand out of a web or a grip' });
    // PULL IT OFF (SRD 5.1 Darkmantle: "A creature can detach the darkmantle by making a successful DC 13 Strength check as an action" -- any creature, not only
    // the one it rides; 10-01, Griz: "allies can strength check detach per SRD, I could only find the 'help' part"): a friend beside you with one riding on
    var pulls = Battle.pullable(u, this.units);
    if (pulls.length) out.push({ id: 'detach', label: 'PULL IT OFF', cost: 'A', icon: 'free', tool: 'detach', ok: T.action > 0 && !T.attacksLeft && !u.conds.restrained, why: u.conds.restrained ? 'held fast yourself' : 'the action is spent', note: 'a STR check, DC ' + ((pulls[0].master.conds.attached || {}).dc || 13) + ': the ' + shortName(pulls[0]) + ' off ' + (pulls[0].master === u ? 'you' : pulls[0].master.name) });
    return out;
  };
  // a friend u may Help: beside it, asleep (shaken awake) or held in a web or a grip (advantage on its next check to get out)
  Battle.helpable = function (u, w) { return !!(w && w !== u && !G.hostile(u, w) && !w.dead && w.hp > 0 && !w.ethereal && G.dist(u, w) <= 5 && (w.conds.asleep || w.conds.restrained || w.conds.attached) && !w.conds.helpedCheck); }; // (attached: a darkmantle on -- the hand is on the STR check to pull it off)
  // the riders u could pull off a friend beside it (a darkmantle attached: PULL IT OFF)
  Battle.pullable = function (u, units) { return units.filter(function (w) { return w.attached && w.riding && w.master && !G.hostile(u, w.master) && G.hostile(u, w) && G.standing(w) && G.dist(u, w.master) <= 5; }); }; // (the one it rides, too: SRD 5.1, "a creature")
  // the rider on w that u may strike at through w's square (ui.js valid: the attack tool on a friend's square, or one's own)
  Battle.riderOn = function (u, w, units) { return w && !G.hostile(u, w) ? units.filter(function (r) { return r.attached && r.riding && r.master === w && G.hostile(u, r) && G.standing(r); })[0] || null : null; };

  // ------------------------------------------------------------------ commands
  Battle.prototype.exec = function* (u, c) {
    var T = u.turn, self = this;
    switch (c.do) {
      case 'move': {
        var rm = G.reach(u, T.move), path = G.path(rm, c.x, c.y);
        if (!path || !path.length || !rm[c.x + ',' + c.y].stand) return;
        yield* this.moveAlong(u, path, { spend: true });
        return;
      }
      case 'attack': {
        if (!c.target || c.target.dead || c.target.hp <= 0) return; // (no target: nothing is spent -- a stray command burned Katarina's action 09-29)
        if (RU.charmedBy(u, c.target)) { this.card(['{o}' + u.name + ' is charmed: no raising a hand to ' + (c.target.side === 'foe' ? 'the ' + shortName(c.target) : c.target.name) + '.{/}'], 200); return; }
        if (u.conds.disarmed) { this.card(['{o}' + u.name + ' has dropped the weapon (the turn is spent picking it up).{/}'], 200); return; }
        if (!T.attacksLeft) { if (!T.action) return; T.action = 0; T.attackAction = true; T.attacksLeft = T.slowed ? 1 : u.attacks + (T.hasteAction ? 1 : 0); } // (Haste's one more, Slow's one: js/grimoire.js)
        if (u.weapon.ammo && !this.ammoLeft(u)) { this.card(['{o}' + u.name + ' has no ' + this.itemName(u.weapon.ammo).toLowerCase() + ' left.{/}'], 120); return; }
        T.attacksLeft--;
        if (u.weapon.ammo) this.spendAmmo(u);
        yield* this.attack(u, c.target, u.weapon);
        if (u.conds.hidden) delete u.conds.hidden;
        return;
      }
      case 'cast': {
        if (D.magic.data(c.id) && D.magic.data(c.id).kind !== 'buff') this.noteHeard(u); // (a spell at someone gives the square away too: 10-01c)
        yield* D.magic.cast(this, u, c.id, c.slot, c.target);
        if (u.conds.hidden && D.magic.data(c.id).kind !== 'buff') delete u.conds.hidden;
        if (!(c.id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights' && u.turn.bonusSpell === false)) this.endInvis(u, 'the spell'); // (Invisibility, Mislead: a spell cast ends it)
        return;
      }
      case 'item': { yield* this.useItem(u, c.id, c.target); return; }
      case 'breakfree': { yield* D.magic.breakFree(this, u); return; }
      case 'droptorch': T.freeObj = true; D.light.dropTorch(this, u); return;
      case 'dousetorch': T.freeObj = true; D.light.douseTorch(this, u); return;
      case 'pickuptorch': T.freeObj = true; D.light.pickUp(this, u); return;
      case 'throwtorch': { yield* D.light.throwTorch(this, u, c.x, c.y); return; }
      case 'hooddown': T.freeObj = true; yield* D.light.hood(this, u, true); return;
      case 'hoodup': T.freeObj = true; yield* D.light.hood(this, u, false); return;
      case 'dashmove': {
        var far = G.reach(u, T.move + u.speed)[c.x + ',' + c.y], opts = [];
        if (!far || u.conds.restrained || u.conds.dancing) return;
        if (u.cls === 'rogue' && u.lvl >= 2 && T.bonus) opts.push({ label: 'CUNNING DASH (bonus)', value: 'b' });
        else if (T.bonusDash && u.conds.retreat && T.bonus) opts.push({ label: 'RETREAT DASH (bonus)', value: 'b' }); // (Expeditious Retreat)
        if (T.action && !T.attacksLeft) opts.push({ label: 'DASH (your action)', value: 'a' });
        if (!opts.length) { this.card(['{g}No dash left this turn.{/}']); return; }
        opts.push({ label: 'NOT THAT FAR', value: 0 });
        var how = yield { prompt: { who: u, title: u.name + ': DASH THERE?', lines: ['That square is ' + far.cost + ' ft away; ' + T.move + ' ft of move is left.'], opts: opts } };
        if (!how) return;
        if (how === 'b') T.bonus = 0; else T.action = 0;
        T.move += u.speed;
        this.card(['{y}' + u.name + '{/}' + (how === 'b' ? (u.cls === 'rogue' && u.lvl >= 2 ? ' (Cunning Action)' : ' (Expeditious Retreat)') : '') + ' dashes: {c}+' + u.speed + ' ft{/}.']);
        var rm2 = G.reach(u, T.move), path2 = G.path(rm2, c.x, c.y);
        if (path2 && path2.length) yield* this.moveAlong(u, path2, { spend: true });
        return;
      }
      case 'leave': { yield* this.leave(u); return; }
      case 'ignite': T.bonus = 0; u.conds.ablaze = true; D.sfx('fire'); FX.sparkle(u, 'fire', 18); this.card(['{y}' + u.name + '{/} speaks the word: the ' + u.weapon.name + ' {o}bursts into flame{/} (+' + u.weapon.flame + ' fire on a hit).']); return;
      case 'douse': T.bonus = 0; delete u.conds.ablaze; this.card(['{y}' + u.name + '{/} speaks the word again: the blade goes dark.']); return;
      case 'dash': if (u.conds.restrained || u.conds.dancing) return; D.sfx('run'); T.action = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'cdash': if (u.conds.restrained || u.conds.dancing) return; D.sfx('run'); T.bonus = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} (' + (u.cls === 'rogue' && u.lvl >= 2 ? 'Cunning Action' : 'Expeditious Retreat') + ') dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'disengage': D.sfx('run'); T.action = 0; T.disengaged = true; this.card(['{y}' + u.name + '{/} disengages: leaving reach provokes nothing this turn.']); return;
      case 'cdisengage': D.sfx('run'); T.bonus = 0; T.disengaged = true; this.card(['{y}' + u.name + '{/} (Cunning Action) disengages.']); return;
      case 'sacred': {
        D.sfx('buff');
        T.action = 0; u.feats.channel = 0;
        var sb = Math.max(1, D.mod(u.abil.cha));
        u.conds.sacred = { atk: sb, rounds: 10 };
        FX.ring(u, 'gold', 40); FX.sparkle(u, 'gold', 16);
        var sacredLines = ['{y}' + u.name + '{/}: SACRED WEAPON. The blade takes Kalindel\'s light: +' + sb + ' to hit with it for a minute (Channel Divinity).'];
        // its glow is bright light (SRD: 20 ft): under the roost the one law broken, as the Light cantrip (RULED 09-28: "paladin
        // weapon glows and such should probably roost too"); the fight ends 'roost' and the 8-bit game's RoostFail runs
        if (this.fight && this.fight.roost && !this.roostBroken) { this.roostBroken = 'sacred'; sacredLines.push('{r}Bright light under a roosted ceiling.{/}'); D.sfx('encounter'); }
        this.card(sacredLines);
        return;
      }
      case 'dodge': D.sfx('bump'); T.action = 0; u.conds.dodge = true; this.card(['{y}' + u.name + '{/} dodges: attacks against at disadvantage till the next turn.']); return;
      case 'help': {
        if (!c.target) return;
        D.sfx('buff');
        T.action = 0;
        if (!G.hostile(u, c.target)) { // (a friend: 10-01c)
          if (c.target.conds.asleep) { delete c.target.conds.asleep; FX.float('awake!', c.target, D.PAL.ramps.bone[2]); this.card(['{y}' + u.name + '{/} shakes ' + c.target.name + ' awake' + (c.target.conds.prone ? ' (still down: getting up costs half the move)' : '') + '.']); }
          else { c.target.conds.helpedCheck = { by: u.id }; this.card(['{y}' + u.name + '{/} lends ' + c.target.name + ' a hand: advantage on the next check to get free.']); }
          FX.sparkle(c.target, 'bone', 8);
          return;
        }
        c.target.conds.helped = { by: u.id, side: u.side };
        this.card(['{y}' + u.name + '{/} helps: the next ally to swing at the ' + shortName(c.target) + ' does it with advantage.']);
        FX.sparkle(c.target, 'bone', 8);
        return;
      }
      case 'detach': { // PULL IT OFF: a darkmantle off a friend (SRD 5.1: "a successful DC 13 Strength check as an action"; Athletics, as breakFree reads it)
        var rd = c.target, host = rd && rd.riding && rd.master; if (!host) return;
        var hr = host.conds.attached, dc = (hr && hr.dc) || 13, en1 = u.conds.enlarged, ce1 = RU.checkEdges(u, 'str');
        var adv1 = !!(en1 && !en1.down) || ce1.adv.length > 0, dis1 = !!(u.conds.poisoned || u.conds.frightened || (en1 && en1.down)) || ce1.dis.length > 0;
        var a1 = D.d(20), a2 = D.d(20), d20 = adv1 && !dis1 ? Math.max(a1, a2) : dis1 && !adv1 ? Math.min(a1, a2) : a1;
        var pb = D.mod(u.abil.str) + (u.cls === 'fighter' ? u.prof : 0), ptot = d20 + pb, blind0 = !!(host.conds.blinded && host.conds.blinded.held && host.conds.blinded.by === rd.id);
        T.action = 0; RU.spendHelp(u); D.sfx('run');
        this.card(['{y}' + u.name + '{/} gets hold of the ' + shortName(rd) + (host === u ? '' : ' on ' + host.name) + ' and pulls: STR d20 ' + d20 + (adv1 !== dis1 ? (adv1 ? ' {n}(advantage){/}' : ' {o}(disadvantage){/}') : '') + ' ' + RU.sign(pb) + ' = ' + ptot + ' vs DC ' + dc + '  ' + (ptot >= dc ? '{n}OFF{/}' : '{g}it holds on{/}')]);
        if (ptot >= dc) { this.release(rd, host); if (blind0 && !host.conds.blinded) this.card(['{g}' + host.name + ' can see again.{/}'], 200); this.dismount(rd, u); } // (to the square nearest the puller and the one it rode)
        yield 30; return;
      }
      case 'secondwind': {
        T.bonus = 0; u.feats.secondWind = 0;
        var r = D.roll('1d10+' + u.lvl), n = Math.min(u.maxhp - u.hp, r.total);
        u.hp += n; FX.float('+' + n, u, D.PAL.ramps.moss[2]); FX.sparkle(u, 'moss', 10);
        this.card(['{y}' + u.name + '{/}: SECOND WIND  1d10+' + u.lvl + ' ' + RU.fmtRolls(r.rolls) + ' = {n}' + r.total + '{/}' + (n < r.total ? ' (' + n + ' to full)' : '')]);
        yield 20; return;
      }
      case 'surge': {
        D.sfx('buff');
        u.feats.actionSurge = 0; T.action = 1;
        this.card(['{y}' + u.name + '{/}: ACTION SURGE -- a second action.']); FX.ring(u, 'gold', 30);
        yield 20; return;
      }
      case 'hide': { yield* this.hide(u); return; }
      case 'lay': { yield* this.layOnHands(u, c.target, c.cure); return; }
      default: if (D.features && D.features.exec) yield* D.features.exec(this, u, c); // (a class feature's button: js/features.js)
    }
  };

  // ------------------------------------------------------------------ movement, square by square, provoking as it goes
  Battle.prototype.moveAlong = function* (u, path, o) {
    var T = u.turn;
    u.anim = 'walk';
    for (var i = 0; i < path.length; i++) {
      var nx = path[i][0], ny = path[i][1], cost = G.stepCost(u, u.x, u.y, nx, ny, { ghost: u.ethereal });
      // leaving a hostile's reach without Disengage provokes, right before the step
      if (!T.disengaged && !u.ethereal && !(o && o.noOA)) {
        var prov = this.units.filter(function (w) {
          return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.conds.turned && !w.ethereal && !w.riding && !(w.weapon && w.weapon.ranged) // (a rider -- a darkmantle attached, "can attack no other creature except the target"; a familiar on its wizard -- takes none)
            && G.dist(w, u) <= G.reachOf(w) && G.dist(w, u, null, null, nx, ny) > G.reachOf(w) && !(w.conds.hidden && false)
            && D.magic.sees(D.battle, w, u) && !RU.charmedBy(w, u); // (a creature you can see: not into or out of darkness; and never at its charmer)
        });
        for (var k = 0; k < prov.length; k++) {
          var w = prov[k], take = true;
          if (w.side === 'party' && !w.guest) {
            u.anim = 'idle';
            take = yield { prompt: { who: w, title: w.name + ': OPPORTUNITY ATTACK?', lines: [(u.side === 'foe' ? 'The ' + shortName(u) : u.name) + ' is leaving ' + w.name + "'s reach."], opts: [{ label: 'STRIKE', value: true }, { label: 'LET IT GO', value: false }] } };
            u.anim = 'walk';
          }
          if (take) {
            w.reaction = 0;
            this.card(['{o}' + w.name + '{/}: an opportunity attack on ' + (u.side === 'foe' ? 'the ' + shortName(u) : u.name) + '.']);
            var atk = w.weapon || w.attacks.shortsword || w.attacks.longsword || w.attacks.bite
              || w.attacks[Object.keys(w.attacks).filter(function (k) { return !w.attacks[k].ranged; })[0]]; // any melee attack (the morningstar)
            if (!atk) continue;
            yield* this.attack(w, u, atk, { oa: true });
            if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; }
            // held by the blow (a grip on the hit: the darkmantle's crush, a tendril), or stunned or put down by it: no more walking -- its speed is 0
            // (10-01, Griz in the Fork: the darkmantle's opportunity attack took Barley and he walked on a square, held from 10 ft)
            if (u.conds.restrained || u.conds.paralyzed || u.conds.stunned || u.conds.asleep) { u.anim = 'idle'; if (o && o.spend) T.move = 0; return; }
          }
        }
      }
      u.facing = D.spr.facingFor(nx - u.x, ny - u.y);
      var wasIn = D.magic.webAt(this, u);
      u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: this.pace(STEP_FRAMES, true) }; // (an AI-run unit's step is paced with its wait, below, so the walk keeps to its beat)
      u.x = nx; u.y = ny;
      if (o && o.spend) { T.move -= cost; T.moved = (T.moved || 0) + cost; } // (moved: what it has walked this turn -- the Thief's Supreme Sneak asks)
      this.keepInView(u);
      yield STEP_FRAMES;
      // hidden no more (SRD 5.1: "You can't hide from a creature that can see you clearly"): one hidden who steps where a foe sees it clearly is found, and
      // one hidden from the mover that the mover now sees clearly (10-01c, the rogue runner: she crossed 50 ft of lit floor hidden and struck with advantage)
      var selfH = this;
      if (u.conds.hidden && this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && selfH.seenBy(w, u) === 2; })) { delete u.conds.hidden; this.card(['{o}' + nameOf(u) + ' is in plain sight: no longer hidden.{/}'], 200); }
      if (RU.canAct(u)) this.units.forEach(function (w) { if (w.conds.hidden && G.hostile(u, w) && G.standing(w) && selfH.seenBy(u, w) === 2) { delete w.conds.hidden; selfH.card(['{o}' + nameOf(u) + ' sees ' + nameOf(w) + ' plainly: found.{/}'], 200); } });
      // into a spell's web (from outside it): the SRD's save for one who enters it during its turn; stuck, it stops there
      if (!u.ethereal && !wasIn && D.magic.webCatch(this, u, 'enters')) { if (o && o.spend) T.move = 0; yield 24; break; }
      // onto a Sleet Storm's ice (the first square of it this turn): DEX or down, and the move ends there
      if (!u.ethereal && D.magic.sleetCatch(this, u)) { if (o && o.spend) T.move = 0; yield 24; break; }
      // a spell's ground (09-28, js/grimoire.js): grease underfoot, spikes, the guardians' ring -- a fall ends the move there
      if (!u.ethereal && D.magic.stepInto) { var si = D.magic.stepInto(this, u); if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; } if (si) { if (o && o.spend) T.move = 0; yield 24; break; } }
      // out of a Globe of Invulnerability that held a spell off it (10-01c): a hold, a sleep, a web's grip, a dance takes hold again on the square it steps
      // out onto, and the walk ends there (filming it, the fighter walked on a square held)
      if (this.globes && D.magic.globeSync) { D.magic.globeSync(this); if (!RU.canAct(u) || u.conds.restrained || u.conds.dancing) { if (o && o.spend) T.move = 0; u.anim = 'idle'; yield 24; break; } }
    }
    u.anim = 'idle';
  };
  // Invisibility and Mislead end for one who attacks or casts (SRD); the caster's concentration goes with them (Greater
  // Invisibility, the duergar's own, keep on: theirs has no `ends`)
  Battle.prototype.endInvis = function (u, why) {
    var iv = u.conds.invisible;
    if (!iv || !iv.ends) return;
    var caster = iv.by && this.units.filter(function (w) { return w.id === iv.by && w.conc && (w.conc.id === 'invisibility' || w.conc.id === 'mislead'); })[0];
    if (caster) D.magic.endConc(this, caster, why); else { delete u.conds.invisible; this.card(['{g}' + (u.side === 'foe' ? 'The ' + shortName(u) : u.name) + ' is seen again (' + why + ').{/}'], 240); }
    if (u.conds.invisible && u.conds.invisible.ends) delete u.conds.invisible; // (the undo missed it: a foe's own)
  };

  // ------------------------------------------------------------------ an attack: the roll, the reactions, the damage
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    o = o || {};
    if (!o.oa) this.noteHeard(att); // (the blow gives the square away: SRD 5.1, Hiding -- every swing and shot, the player's or the AI's; 10-01c)
    if (!tgt || tgt.dead || tgt.ethereal) return;
    var self = this, melee = !atk.ranged && (!atk.spell || atk.touch), cid = 'atk' + (++this.cardSeq || (this.cardSeq = 1));
    att.facing = faceTo(att, tgt);
    // a spell's shot leaves at the height of the cast pose (the spell animation pass, 09-28h): the pose the cast began runs on
    var posing = atk.spell && (att.anim === 'attack' || att.anim === 'cast') && this.t - (att.animT || 0) < (D.spr.duration(att.sheet, att.anim) || 18);
    // (a spell's shot, or a floating weapon sent at its mark, from the cast pose where the sheet has one)
    if (!posing) { att.anim = atk.spell && (!melee || atk.spirit) && D.spr.anim(att.sheet, 'cast') ? 'cast' : 'attack'; att.animT = this.t; }
    // a row of its own for the blow, where the sheet has one (10-01d, the xorn first: Griz, "since this is prototype, go fancy"): the
    // attack's name (claw, bite), and its second and third use in a turn the numbered rows (claw2, claw3: a blow from each of its arms)
    if (!posing && att.anim === 'attack' && atk.name) {
      var rk = String(atk.name).toLowerCase().replace(/[^a-z]/g, ''), rt = att.turn || {}, rn = ((rt.rowN = rt.rowN || {})[rk] = (rt.rowN[rk] || 0) + 1);
      var rw = rn > 1 && D.spr.anim(att.sheet, rk + rn) ? rk + rn : rk;
      if (rk && D.spr.anim(att.sheet, rw)) att.anim = rw;
    }
    if (!o.oa) yield atk.spell && !melee ? Math.max(4, Math.round((D.spr.duration(att.sheet, att.anim) || 18) * 0.55) - (this.t - att.animT)) : 10;
    if (!melee) { FX.projectile(att, tgt, atk.fx || 'bolt'); yield { fx: 1 }; }
    var los = G.los(att, tgt), cover = melee && G.dist(att, tgt) <= 5 ? 0 : los.cover;
    var ac = RU.ac(tgt) + cover, e = RU.edges(att, tgt, atk);
    // the Hunter's Defensive Tactics (ranger 7; js/classes.js u.hunterDef): Escape the Horde -- an opportunity attack against it is at
    // disadvantage; Multiattack Defense -- once a creature has hit it, that one's later attacks this turn meet AC +4
    if (o.oa && !o.answer && tgt.hunterDef === 'horde') { e.dis.push('escape the horde'); e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0; }
    var madAC = tgt.hunterDef === 'multiattack' && tgt.madHit && tgt.madHit[att.id] === this.round + ':' + (this.active ? this.active.id : '-') ? 4 : 0;
    ac += madAC;
    // a Wind Wall between them (js/walls.js): an arrow, a bolt, a thrown weapon is torn upward and misses
    if (D.walls && D.walls.shellTurns(this, att, tgt, atk)) { this.card([(att.side === 'foe' ? '{r}' + shortName(att) + '{/}' : '{y}' + att.name + '{/}') + ': the blow meets the Antilife Shell and goes nowhere.']); D.sfx('bump'); yield 20; att.anim = 'idle'; return; }
    if (D.walls && D.walls.windStops(this, att, tgt, atk)) { this.card([(att.side === 'foe' ? '{r}' + shortName(att) + '{/}' : '{y}' + att.name + '{/}') + ': ' + (atk.name || 'the shot') + ' -- the wind wall tears it upward.  {g}MISS{/}']); D.sfx('miss'); yield 20; att.anim = 'idle'; return; }
    // a Globe of Invulnerability (SRD 5.1, js/grimoire.js M.globed): a spell of its level or lower, cast from outside it, "can target creatures and
    // objects within the barrier, but the spell has no effect on them" -- a spell attack at one inside it goes nowhere (no roll, no damage, no rider)
    if (atk.spell && D.magic.globed && D.magic.globed(this, att, tgt, atk.level)) { this.card([(att.side === 'foe' ? '{r}' + shortName(att) + '{/}' : '{y}' + att.name + '{/}') + ': ' + (atk.name || 'the spell') + ' -- it breaks on the globe about ' + nameOf(tgt) + ' and does nothing.  {c}NO EFFECT{/}']); D.sfx('bump'); yield 20; att.anim = 'idle'; return; }
    if (att.side === 'foe' && att.conds.hidden) delete att.conds.hidden; // a foe that strikes from hiding is seen (the gricks)
    this.endInvis(att, 'the attack'); // (Invisibility: the swing has its advantage, then the spell is gone)
    // false images (the cloaker's phantasms, Willem's): a d20 says whether the blow goes at an image (3: 6+, 2: 8+, 1: 11+)
    if (tgt.images > 0 && !atk.save) {
      var need = [0, 11, 8, 6][Math.min(3, tgt.images)], id20 = D.d(20);
      if (id20 >= need) {
        var ir = RU.d20(e.net), itot = ir.pick + atk.atk, iac = 10 + D.mod(tgt.abil.dex), ihit = ir.pick === 20 || (ir.pick !== 1 && itot >= iac);
        if (ihit) tgt.images--;
        if (ihit && D.features && D.features.rimeDouble) D.features.rimeDouble(this, att, tgt); // (the Rimeglass: the double breaks to rime)
        D.sfx(ihit ? 'hit' : 'miss'); FX.sparkle(tgt, 'violet', 14);
        this.card(['{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name, 'd20 ' + id20 + ' vs ' + need + ': {p}a false image{/}  d20 ' + ir.pick + ' ' + RU.sign(atk.atk) + ' = ' + itot + ' vs AC ' + iac + '  ' + (ihit ? '{n}the image bursts{/} (' + tgt.images + ' left)' : '{g}MISS{/}')], 300, cid);
        yield o.oa ? 16 : 26; att.anim = 'idle'; return;
      }
    }
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) delete tgt.conds.helped; // help is spent on the first swing
    // Sanctuary (SRD 5.1; 09-28, js/grimoire.js): whoever would strike the warded makes a WIS save first, or the blow is lost
    if (tgt.conds.sanctuary && G.hostile(att, tgt) && D.magic.sanctuary && !D.magic.sanctuary(this, att, tgt)) { yield o.oa ? 16 : 24; att.anim = 'idle'; return; }
    // the one-shot marks, spent by this roll: Guiding Bolt's glow on the target, Vicious Mockery on the attacker, True Strike
    if (tgt.conds.guided) delete tgt.conds.guided;
    if (att.conds.mocked) delete att.conds.mocked;
    if (att.conds.trueStrike && att.conds.trueStrike.ready && att.conds.trueStrike.at === tgt.id) { delete att.conds.trueStrike; if (att.conc && att.conc.id === 'truestrike') D.magic.endConc(this, att, 'the swing'); } // (True Strike: the first attack roll at it on the next turn -- advantage, and the spell is spent: rules.js edges, magic.js startTurn)
    var sacred = att.conds.sacred && !atk.spell && !atk.ranged ? att.conds.sacred.atk : 0;
    var baneR = att.conds.baned ? D.d(4) : 0;
    var r = RU.d20(e.net), nat = r.pick, bless = att.conds.blessed ? D.d(4) : 0, pen = (e.pen || 0) - baneR, total = nat + atk.atk + bless + sacred + pen;
    if (baneR && !e.pen) e.penWhy = 'bane';
    var critAt = att.crit || 20;
    var hit = nat === 20 || (nat !== 1 && total >= ac)
      || !!(atk.autoHitHeld && tgt.conds.restrained && tgt.conds.restrained.by === att.id) // the cloaker's bite on the one it has engulfed
      || !!(this.show && (att.show || tgt.show)); // the show (js/show.js, the test ground): every blow at or from the creature on show lands, so every row plays
    // a bard's dice (js/features.js): Bardic Inspiration turns a miss, Cutting Words a hit
    if (!hit && nat !== 1 && att.conds.inspired && D.features) { var bi = D.features.inspire(att, ac - total); if (bi) { total += bi; pen += bi; hit = total >= ac; } }
    if (hit && nat !== 20 && D.features) { var cw = D.features.cutting(this, att, tgt, total - ac); if (cw) { total -= cw; pen -= cw; hit = total >= ac; } }
    // the Hand on the Neck (the Window, Kat's domain: js/features.js): the glass takes the first blow that would land -- rolled again,
    // and the second roll stands
    var glass = '';
    if (hit && tgt.conds.glassHand && G.hostile(att, tgt)) {
      delete tgt.conds.glassHand;
      var r2 = RU.d20(e.net); nat = r2.pick; total = nat + atk.atk + bless + sacred + pen;
      hit = nat === 20 || (nat !== 1 && total >= ac);
      glass = '  {p}the glass takes it: again, d20 ' + nat + ' = ' + total + '{/}';
    }
    var crit = hit && (nat >= critAt || (melee && ((tgt.hp <= 0 && !tgt.dead) || tgt.conds.paralyzed || tgt.conds.asleep) && G.dist(att, tgt) <= 5)
      || (att.assassinate && tgt.conds.surprised) // Assassinate: any hit on one caught unaware is a critical
      || (att.subclass === 'Cutthroat' && this.round === 1 && !tgt.acted)); // Opening Cut (the game's Cutthroat): the same, in the first round
    var head = '{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name;
    var line = 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + nat + ' ' + RU.sign(atk.atk) + (bless ? ' {y}+' + bless + ' bless{/}' : '') + (sacred ? ' {y}+' + sacred + ' sacred{/}' : '') + (pen ? ' {o}' + pen + ' ' + e.penWhy + '{/}' : '') + ' = ' + total + '  vs AC ' + RU.ac(tgt) + (cover ? ' {c}+' + cover + ' cover{/}' : '') + (madAC ? ' {c}+4 multiattack defense{/}' : '') + glass;
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
    // Shield: Aurdin's reaction, +5 AC against this and every attack till his turn (a class NPC's too, 09-28: it takes it whenever
    // the +5 turns the blow; one run by the AI never asks)
    if (hit && nat !== 20 && tgt.reaction > 0 && !tgt.conds.shield && RU.canAct(tgt) && (tgt.known || []).indexOf('shield') >= 0 && slotFor(tgt, 1) && total < ac + 5 && (!tgt.guest || tgt.classAI)) {
      this.card([head, line + why], 300, cid);
      var yes = byAI(tgt) ? true : yield { prompt: { who: tgt, title: tgt.name + ': SHIELD?', lines: ['The ' + total + ' would hit AC ' + ac + '.', '+5 AC makes it ' + (ac + 5) + ': a miss. (a level-' + slotFor(tgt, 1) + ' slot, the reaction)'], opts: [{ label: 'CAST SHIELD', value: true }, { label: 'TAKE IT', value: false }] } };
      if (yes) {
        var sl = slotFor(tgt, 1); tgt.slots[sl - 1]--; tgt.reaction = 0; tgt.conds.shield = true;
        FX.ring(tgt, 'glow', 50); D.sfx('buff');
        ac += 5; hit = false; crit = false;
        line += '  {c}SHIELD +5{/}';
      }
    }
    D.sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : hit ? '{n}HIT{/}' : '{g}MISS{/}') + why], 300, cid);
    if (!hit) {
      // a natural 1 at a darkmantle riding one of ours (10-01, RULED, Griz: "if SRD says nothing about hurting ally, only hurt ally on natural 1 (ignoring
      // bonuses)" -- the SRD says nothing): the blow lands on the one it rides instead -- the weapon's damage, no critical, no riders (invented.json)
      var host = tgt.riding && tgt.attached && tgt.master;
      if (nat === 1 && host && G.standing(host) && !G.hostile(att, host) && atk.dice) {
        var hd = RU.damage(atk.dice, atk.mod || 0, {});
        D.sfx('hit'); FX.float('OOF', host, D.PAL.ramps.fire[2]);
        this.card(['{o}A natural 1:{/} the blow meant for the ' + shortName(tgt) + ' lands on ' + nameOf(host) + '.  ' + atk.dice + RU.sign(atk.mod || 0) + ' ' + RU.fmtRolls(hd.rolls) + ' = {r}' + hd.total + '{/} ' + (atk.type || '')], 320);
        this.hurt(host, hd.total, atk.type);
        yield o.oa ? 16 : 30; att.anim = 'idle'; return;
      }
      if (o.onMiss) o.onMiss(tgt); FX.float('MISS', tgt, D.PAL.ramps.silver[5]);
      if (nat >= 15 && !atk.spell) this.doorWard(tgt); // (the Door-Shield: a miss it could have caused)
      yield o.oa ? 16 : 24; att.anim = 'idle';
      if (D.features && D.features.answerBack) yield* D.features.answerBack(this, att, tgt, atk, melee); // (the Path of the Sand, 6)
      return;
    }
    // damage
    if (tgt.hunterDef === 'multiattack') { (tgt.madHit = tgt.madHit || {})[att.id] = this.round + ':' + (this.active ? this.active.id : '-'); } // (Multiattack Defense: that one meets +4 AC for the rest of the turn)
    var dice = att.swarm && atk.halfHP && att.hp <= att.maxhp / 2 ? atk.halfHP : atk.dice; // a swarm at half its hit points bites for less
    var dr = RU.damage(dice, atk.mod, { crit: crit, gwf: atk.gwf }), dmg = dr.total, parts = [dice + RU.sign(atk.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(atk.mod) + ' = ' + dr.total + ' ' + atk.type];
    // Savage Attacks (the half-orc, SRD 5.1): a melee critical rolls one of the weapon's dice once more
    if (crit && melee && att.savage && /d/.test(dice)) { var sv0 = D.roll('1' + String(dice).replace(/^\d*/, '')); dmg += sv0.total; parts.push('{o}savage +' + sv0.total + '{/}'); }
    // Brutal Critical (the barbarian, 9; SRD 5.1): the same, once more (two at 13, three at 17). Fists have no die: nothing to add
    if (crit && melee && att.cls === 'barbarian' && att.lvl >= 9 && /d/.test(dice)) { var bc9 = D.roll((att.lvl >= 17 ? 3 : att.lvl >= 13 ? 2 : 1) + String(dice).replace(/^\d*/, '')); dmg += bc9.total; parts.push('{o}brutal +' + bc9.total + '{/}'); }
    // the class NPCs' riders (09-28): Rage's +2 on a STR blow; Enlarge's +1d4 (Reduce's -1d4); Ray of Enfeeblement halves a STR weapon's
    var strBlow = melee && !atk.finesse || (atk.finesse && att.abil && att.abil.str >= att.abil.dex && melee);
    if (att.conds.raging && strBlow) { dmg += att.conds.raging.dmg || 2; parts.push('{o}rage +' + (att.conds.raging.dmg || 2) + '{/}'); }
    if (att.conds.enlarged && !atk.spell) { var en = D.roll('1d4', { crit: crit }); dmg += att.conds.enlarged.down ? -en.total : en.total; parts.push((att.conds.enlarged.down ? '{g}reduced -' : '{o}enlarged +') + en.total + '{/}'); dmg = Math.max(1, dmg); }
    if (att.conds.enfeebled && strBlow && !atk.spell) { var cut0 = Math.ceil(dmg / 2); dmg -= cut0; parts.push('{g}enfeebled -' + cut0 + '{/}'); }
    // Sneak Attack: once a turn, a finesse or ranged weapon, with advantage or an ally at the target's side
    var sneaked = false;
    if (att.cls === 'rogue' && att.turn && !att.turn.sneakUsed && (atk.finesse || atk.ranged) && e.net >= 0) {
      var ally = this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; });
      if (e.net > 0 || ally) {
        att.turn.sneakUsed = true; sneaked = true;
        var sn = D.roll(RU.sneakDice(att), { crit: crit }); dmg += sn.total;
        parts.push('{p}sneak ' + RU.sneakDice(att) + ' ' + RU.fmtRolls(sn.rolls) + ' = ' + sn.total + '{/}');
      }
    }
    // Flame Tongue (SRD 5.1): while it burns, +2d6 fire on a hit, dealt as fire (a troll's knitting reads it; fire resistance halves it)
    // the riders land as their own kind of damage (09-28: the ochre jelly is immune to slashing, not to a smite): fire, radiant, a foe's extra
    var fire = 0, rad = 0, ext = 0, xtra = []; // (xtra: [n, type] riders of their own kind: a mark's psychic, a curse's necrotic)
    if (atk.flame && att.conds.ablaze && !atk.spell) { var fl = D.roll(atk.flame, { crit: crit }); fire = fl.total; parts.push('{o}flame ' + atk.flame + ' ' + RU.fmtRolls(fl.rolls) + ' = ' + fl.total + ' fire{/}'); }
    // the Mace of Disruption (SRD 5.1; Pyro's, 09-30): a fiend or undead takes 2d6 radiant more (and after the blow, the save below)
    var dis = atk.disrupt && !atk.spell && atk.disrupt.vs.indexOf(tgt.type || '') >= 0 ? atk.disrupt : null;
    if (dis) { var dr = D.roll(dis.dice, { crit: crit }); rad += dr.total; parts.push('{y}disruption ' + dis.dice + ' ' + RU.fmtRolls(dr.rolls) + ' = ' + dr.total + ' radiant{/}'); }
    if (att.conds.divineFavor && !atk.spell) { var df = D.roll('1d4', { crit: crit }); rad += df.total; parts.push('{y}favor 1d4 [' + df.rolls.join(',') + '] radiant{/}'); }
    // the marks (09-28, js/grimoire.js): Hunter's Mark (+1d6 on a weapon's hit), Mirror's Gaze (+1d6 psychic on any of her hits), Bestow
    // Curse's +1d8 necrotic, Branding Smite's +2d6 radiant on the next weapon hit (and the struck one glows, seen)
    // (the Globe of Invulnerability, SRD 5.1: a mark or a curse is an effect on the creature of a spell cast from where it was cast -- if that was outside a globe the creature
    // now stands in, "the spell has no effect on them": no extra die, and the card says so; D.magic.zoneGlobed reads where from and the spell's level off the record)
    var mk = tgt.conds.marked, mkGl = mk && mk.by === att.id && (mk.any || !atk.spell) && D.magic.zoneGlobed && D.magic.zoneGlobed(this, mk, tgt);
    if (mk && mk.by === att.id && (mk.any || !atk.spell) && !mkGl) { var hm = D.roll('1d6', { crit: crit }); if (mk.type) xtra.push([hm.total, mk.type]); else dmg += hm.total; parts.push('{p}' + (mk.name || 'mark') + ' 1d6 [' + hm.rolls.join(',') + ']' + (mk.type ? ' ' + mk.type : '') + '{/}'); }
    else if (mkGl) parts.push('{c}' + (mk.name || 'mark') + ': inside the globe, untouched{/}');
    var cuGl = tgt.conds.cursed && tgt.conds.cursed.by === att.id && tgt.conds.cursed.dmg && D.magic.zoneGlobed && D.magic.zoneGlobed(this, tgt.conds.cursed, tgt);
    if (tgt.conds.cursed && tgt.conds.cursed.by === att.id && tgt.conds.cursed.dmg && !cuGl) { var bc = D.roll('1d8', { crit: crit }); xtra.push([bc.total, 'necrotic']); parts.push('{p}curse 1d8 [' + bc.rolls.join(',') + '] necrotic{/}'); }
    else if (cuGl) parts.push('{c}the curse: inside the globe, untouched{/}');
    if (att.conds.branding && !atk.spell) { var bs = D.roll(att.conds.branding.dice || '2d6', { crit: crit }); rad += bs.total; parts.push('{y}branding ' + (att.conds.branding.dice || '2d6') + ' [' + bs.rolls.join(',') + '] radiant{/}'); delete att.conds.branding; tgt.conds.branded = { by: att.id }; if (tgt.conds.invisible) delete tgt.conds.invisible; }
    // a foe's poisoned blade
    if (atk.extra) { var ex = D.roll(atk.extra, { crit: crit }); ext += ex.total; parts.push(atk.extra + ' ' + RU.fmtRolls(ex.rolls) + ' ' + atk.extraType); }
    // Martial Advantage (the hobgoblins): once a turn, +2d6 while an ally who can act stands within 5 ft of the target
    if (att.martial && att.turn && !att.turn.martialUsed && this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) {
      att.turn.martialUsed = true; var ma = D.roll(att.martial, { crit: crit }); dmg += ma.total; parts.push('{o}martial ' + att.martial + ' ' + RU.fmtRolls(ma.rolls) + '{/}');
    }
    // a foe's Sneak Attack (the sect blades): once a turn, with advantage or an ally beside the target, and not at disadvantage
    if (att.sneak && att.turn && !att.turn.sneakUsed && e.net >= 0 && (e.net > 0 || this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; }))) {
      att.turn.sneakUsed = true; var fs = D.roll(att.sneak, { crit: crit }); dmg += fs.total; parts.push('{p}sneak ' + att.sneak + ' ' + RU.fmtRolls(fs.rolls) + ' = ' + fs.total + '{/}');
    }
    // Surprise Attack (the bugbears; the 8-bit game's reading): the first round's hits bite harder
    if (att.raging && atk.rage) { dmg += atk.rage; parts.push('{o}rage +' + atk.rage + '{/}'); }
    if (att.surprise && this.round === 1) { var sa = D.roll(att.surprise, { crit: crit }); dmg += sa.total; parts.push('{o}first blow ' + att.surprise + ' ' + RU.fmtRolls(sa.rolls) + '{/}'); }
    // Divine Smite: after the hit, spend a slot
    if (att.cls === 'paladin' && melee && (!att.guest || att.classAI) && (att.slots || []).some(function (n) { return n > 0; })) {
      var opts = [];
      [1, 2, 3].forEach(function (lv) { if (att.slots[lv - 1] > 0) opts.push({ label: 'L' + lv + ' ' + Math.min(5, 1 + lv) + 'd8', value: lv }); });
      opts.push({ label: 'NO SMITE', value: 0 });
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why], 300, cid);
      // the AI's paladin (09-28): the best slot on a critical; else the lowest, on one the blow alone won't drop and worth the slot
      var lv = byAI(att) ? (crit ? opts[opts.length - 2].value : (tgt.hp > dmg + 4 && tgt.maxhp >= 15 ? opts[0].value : 0)) : yield { prompt: { who: att, title: att.name + ': DIVINE SMITE?', lines: ['The blow lands' + (crit ? ' -- a critical: the smite dice double.' : '.')], opts: opts } };
      if (lv) {
        att.slots[lv - 1]--; D.sfx('magic');
        var sm = D.roll(Math.min(5, 1 + lv) + 'd8', { crit: crit }); rad += sm.total;
        parts.push('{y}smite ' + Math.min(5, 1 + lv) + 'd8 ' + RU.fmtRolls(sm.rolls) + ' = ' + sm.total + ' radiant{/}');
        FX.ring(tgt, 'gold', 30); FX.sparkle(tgt, 'gold', 16);
      }
    }
    // Uncanny Dodge: Vivian's reaction halves a hit from an attacker she can see
    if (tgt.cls === 'rogue' && tgt.lvl >= 5 && tgt.reaction > 0 && RU.canAct(tgt) && (!tgt.guest || tgt.classAI) && M16().sees(this, tgt, att)) {
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ')], 300, cid);
      var ud = byAI(tgt) ? (dmg + fire + rad + ext >= 6) : yield { prompt: { who: tgt, title: tgt.name + ': UNCANNY DODGE?', lines: ['The blow would deal ' + (dmg + fire + rad + ext) + '. Halve it to ' + (Math.floor(dmg / 2) + Math.floor(fire / 2) + Math.floor(rad / 2) + Math.floor(ext / 2)) + '? (the reaction)'], opts: [{ label: 'DODGE IT', value: true }, { label: 'TAKE IT', value: false }] } };
      if (ud) { D.sfx('run'); tgt.reaction = 0; dmg = Math.floor(dmg / 2); fire = Math.floor(fire / 2); rad = Math.floor(rad / 2); ext = Math.floor(ext / 2); parts.push('{c}uncanny dodge: halved to ' + (dmg + fire + rad + ext) + '{/}'); }
    }
    // Deflect Missiles (the monk, js/features.js): the reaction that catches it
    if (D.magic.deflect && atk.ranged && !atk.spell) { var dfl = D.magic.deflect(this, tgt, atk, dmg); if (dfl) { dmg -= dfl; parts.push('{c}deflected -' + dfl + '{/}'); } }
    // resistance to non-magical weapons (the grick): the weapon's own damage halved unless the weapon is magic
    // (the whole of it: the dice, the sneak, the martial advantage -- resistance halves the damage of that type, SRD; review 09-28 #10)
    if (tgt.resist && tgt.resist.indexOf('mundane') >= 0 && !atk.spell && !atk.magic && /bludgeoning|piercing|slashing/.test(atk.type)) {
      var cut = dmg - Math.floor(dmg / 2); dmg -= cut; parts.push('{g}-' + cut + ': it shrugs off plain steel{/}');
    }
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + (dmg + fire + rad + ext + xtra.reduce(function (a, x) { return a + x[0]; }, 0)) + '{/}'], 300, cid);
    if (melee) FX.slash(tgt, crit ? D.PAL.ramps.gold[4] : null);
    if (fire) { FX.sparkle(tgt, 'fire', 12); this.hurt(tgt, fire, 'fire'); }
    if (rad && !tgt.dead) this.hurt(tgt, rad, 'radiant');
    if (ext && !tgt.dead) this.hurt(tgt, ext, atk.extraType || atk.type);
    for (var xi = 0; xi < xtra.length; xi++) if (!tgt.dead) this.hurt(tgt, xtra[xi][0], xtra[xi][1]);
    if (!tgt.dead) this.hurt(tgt, dmg, atk.type);
    // disruption: one left at 25 HP or fewer saves WIS DC 15 or is destroyed; on a success it is frightened of the wielder till the
    // end of his next turn (`fresh`: the Slam's idiom -- ai.js's end-of-turn sweep spares it once)
    if (dis && !tgt.dead && tgt.hp > 0 && tgt.hp <= dis.hp) {
      var dsv = RU.save(tgt, 'wis', dis.dc, false, 'frightened');
      this.card(['  {y}the mace of disruption{/}: ' + nameOf(tgt) + ' WIS ' + RU.saveText(dsv) + ' vs DC ' + dis.dc + '  ' + (dsv.ok ? '{o}FRIGHTENED{/}' : '{y}DESTROYED{/}')], 260);
      FX.ring(tgt, 'gold', 30); FX.sparkle(tgt, 'gold', 18);
      if (!dsv.ok) this.hurt(tgt, tgt.hp, 'radiant');
      else if (!RU.immuneTo(tgt, 'frightened')) tgt.conds.frightened = { by: att.id, fresh: true };
    }
    // the 8-bit game's named weapons (09-28g): the Winnower threshes one flat on a critical; the Greyseam knife's Sneak Attack
    // poisons, CON 13, till the end of its next turn (the 8-bit battle's own reading, js/battle.js heroAttack)
    if (crit && atk.onCrit === 'prone' && !atk.spell && !tgt.dead && tgt.hp > 0 && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone')) {
      tgt.conds.prone = true; this.card(['  {o}' + nameOf(tgt) + ' is threshed flat: PRONE{/}'], 220);
    }
    if (sneaked && atk.sneakPoison && !tgt.dead && tgt.hp > 0 && !tgt.conds.poisoned && !RU.immuneTo(tgt, 'poisoned')) {
      var gsv = RU.save(tgt, 'con', atk.sneakPoison, false, 'poisoned'); // (against being poisoned: Protection from Poison)
      this.card(['  {p}the greyseam{/}: ' + nameOf(tgt) + ' CON ' + RU.saveText(gsv) + ' vs DC ' + atk.sneakPoison + '  ' + (gsv.ok ? '{n}SAVED{/}' : '{o}POISONED{/}')], 240);
      if (!gsv.ok) { D.sfx('poison'); tgt.conds.poisoned = { till: { who: tgt.id, at: 'end', n: 1 } }; FX.sparkle(tgt, 'moss', 10); }
    }
    if (o.onHit) o.onHit(tgt, crit); // (a spell attack's rider: js/grimoire.js)
    if (D.magic.onWeaponHit && !atk.spell && !tgt.dead) yield* D.magic.onWeaponHit(this, att, tgt, atk, crit); // (Stunning Strike, Open Hand, Colossus Slayer: js/features.js)
    yield o.oa ? 18 : 26;
    // a reaction to the blow (09-28, js/grimoire.js): Hellish Rebuke from one who took it and can see who gave it
    if (D.magic.rebuke && !tgt.dead && tgt.hp > 0 && !att.dead) yield* D.magic.rebuke(this, tgt, att);
    // riders: the drow's poisoned bolt, the spider's venom
    if (!tgt.dead && tgt.hp > 0 && atk.poison && !tgt.conds.poisoned && !RU.immuneTo(tgt, 'poisoned')) {
      var sv = RU.save(tgt, 'con', atk.poison.dc, false, 'poisoned');
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save vs poison  ' + RU.saveText(sv) + ' vs DC ' + sv.dc + '  ' + (sv.ok ? '{n}SAVED{/}' : '{o}POISONED{/}')]);
      // (a poison that wears off, the ettercap's: a CON save at the end of each of its turns, magic.js endTurn; the drow's lasts the fight)
      if (!sv.ok) { D.sfx('poison'); tgt.conds.poisoned = atk.poison.repeat ? { save: 'con', dc: atk.poison.dc } : true; FX.sparkle(tgt, 'moss', 10); }
      yield 30;
    }
    // a grapple on the hit (the otyugh's tentacles): Medium or smaller, while it has a tentacle free; grappled and restrained
    if (atk.grapple && !tgt.dead && tgt.hp > 0 && (tgt.size || 1) <= 1 && !tgt.conds.restrained && !RU.immuneTo(tgt, 'grappled') && (att.holding || []).length < (atk.grapple.max || 1)) {
      tgt.conds.restrained = { dc: atk.grapple.dc, by: att.id, grapple: true, weak: !!atk.weakens }; // (weak: the roper's tendril, disadvantage on STR: js/traits.js)
      att.holding = (att.holding || []).concat([tgt]);
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} has ' + nameOf(tgt) + ': {o}GRAPPLED and RESTRAINED{/}  {g}(escape DC ' + atk.grapple.dc + ', an action){/}']);
      yield 30;
      // a hold over the eyes (torchdark 09-28: the sheet todos): the cloaker's fold blinds the one it engulfs; the darkmantle's
      // crush blinds when it had advantage on the roll (SRD: it engulfs the head). Blind till the grip is broken (release)
      if (atk.blindHeld && !tgt.conds.blinded && (atk.blindHeld === 'always' || e.net > 0)) {
        tgt.conds.blinded = { by: att.id, held: true };
        this.card(['{r}' + nameOf(tgt) + '{/} is {o}BLINDED{/}: ' + (atk.blindHeld === 'always' ? 'folded inside it' : 'it is over ' + nameOf(tgt) + '\'s head') + ' -- nothing seen till the grip is broken.']); // (the name, never "his": 10-01, Vivian read "over his head")
        yield 24;
      }
      // Reel (the roper's tendril): the one it holds is dragged in to its side
      if (atk.reel && G.dist(att, tgt) > 5) {
        var rs = null, rd = Infinity, S = att.size || 1;
        for (var ry = att.y - 1; ry <= att.y + S; ry++) for (var rx = att.x - 1; rx <= att.x + S; rx++) {
          if (!G.canStand(tgt, rx, ry) || G.dist(att, tgt, null, null, rx, ry) > 5) continue;
          var dd = Math.hypot(rx - tgt.x, ry - tgt.y); if (dd < rd) { rd = dd; rs = [rx, ry]; }
        }
        if (rs) { if (D.spr.anim(att.sheet, 'reel')) { att.anim = 'reel'; att.animT = this.t; } tgt.tween = { fx: tgt.x, fy: tgt.y, fz: 0, t: 0, dur: this.pace(18, true) }; tgt.x = rs[0]; tgt.y = rs[1]; this.card(['{r}' + nameOf(att) + '{/} reels ' + nameOf(tgt) + ' in.']); D.sfx('run'); yield 24; } // (its Reel row where the sheet has one: the tendrils hauling in -- 10-01e)
      }
    }
    // attached (the darkmantle's Crush: SRD 5.1, "the darkmantle attaches to the target"; RULED 10-01, Griz: "go SRD"): no grapple, no restraint -- the one it is
    // on still walks, and it goes along, riding (mount, above). Over the head when the target is Medium or smaller and it had advantage on the roll: blinded
    // (and unable to breathe) while it is on. Off with a DC 13 STR check as an action, by the one it is on or anyone beside (exec 'detach': PULL IT OFF)
    // (on already, at the shoulder, and the one it rides Medium or smaller again -- an Enlarge ended -- a hit with advantage takes the head: the SRD's "attaches by
    // engulfing the target's head", read on every hit)
    var atNow = tgt.conds.attached;
    if (atk.attach && atNow && atNow.by === att.id && !atNow.head && !tgt.dead && tgt.hp > 0 && e.net > 0 && !Battle.overMedium(tgt)) {
      atNow.head = true; att.perch = 'over'; if (!tgt.conds.blinded) tgt.conds.blinded = { by: att.id, held: true };
      this.card(['{r}' + nameOf(att) + '{/} gets ' + nameOf(tgt) + '\'s head: {o}BLINDED{/}, no breath to draw.']); yield 24;
    }
    if (atk.attach && !tgt.dead && tgt.hp > 0 && !att.riding && !tgt.conds.attached) {
      var onHead = !Battle.overMedium(tgt) && e.net > 0; // (Medium or smaller: SRD 5.1 -- an Enlarged one is a size up, Large -- RULED 10-01, Griz: "only when he's Medium or smaller")
      tgt.conds.attached = { by: att.id, dc: atk.attach.dc, head: onHead, big: Battle.overMedium(tgt) }; // (big: Large already when it got on -- an Enlarge after throws it off, rideSync)
      if (onHead && !tgt.conds.blinded) tgt.conds.blinded = { by: att.id, held: true };
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} attaches to ' + nameOf(tgt) + (onHead ? ': over ' + nameOf(tgt) + '\'s head -- {o}BLINDED{/}, no breath to draw' : '') + '.  {g}(DC ' + atk.attach.dc + ' STR to pull it off, an action: ' + nameOf(tgt) + ', or anyone beside){/}']);
      this.mount(att, tgt);
      yield 30;
    }
    // a knockdown (the wolf's bite, the worg's, Talmok's fists, the giant's rock): STR or prone
    if (atk.prone && !tgt.dead && tgt.hp > 0 && !tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone')) {
      var ks = RU.save(tgt, 'str', atk.prone);
      this.card(['{r}' + nameOf(tgt) + '{/}: STR save  ' + RU.saveText(ks) + ' vs DC ' + ks.dc + '  ' + (ks.ok ? '{n}STAYS UP{/}' : '{o}KNOCKED PRONE{/} {g}(half the move to rise){/}')]);
      if (!ks.ok) { tgt.conds.prone = true; D.sfx('hit'); }
      yield 24;
    }
    // the chuul's tentacles on one it holds: CON or poisoned, and paralyzed while the poison lasts (a CON save each turn)
    if (atk.paralyze && !tgt.dead && tgt.hp > 0 && !tgt.conds.paralyzed && !RU.immuneTo(tgt, 'paralyzed') && !RU.immuneTo(tgt, 'poisoned')) {
      var ps = RU.save(tgt, 'con', atk.paralyze.dc, false, 'poisoned'); // (the chuul's poison: paralyzed while it lasts -- the save is against being poisoned)
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save  ' + RU.saveText(ps) + ' vs DC ' + ps.dc + '  ' + (ps.ok ? '{n}SAVED{/}' : '{p}POISONED and PARALYZED{/} {g}(a CON save at the end of each turn){/}')]);
      if (!ps.ok) { D.sfx('poison'); tgt.conds.poisoned = { paralysis: true }; tgt.conds.paralyzed = { save: 'con', dc: atk.paralyze.dc, by: att.id, poison: true }; FX.sparkle(tgt, 'moss', 12); }
      yield 30;
    }
    if (!tgt.dead && atk.save && tgt.hp > 0) {
      var pr = D.roll(atk.save.dice), s2 = RU.save(tgt, atk.save.ab, atk.save.dc, atk.save.type === 'poison' && RU.vsPoison(tgt), null, pr.total), ev2 = atk.save.half && atk.save.ab === 'dex' && RU.evasion(tgt); // (Evasion: none on a success, half on a failure -- the breath weapons too)
      var pd = ev2 ? (s2.ok ? 0 : Math.floor(pr.total / 2)) : s2.ok && atk.save.half ? Math.floor(pr.total / 2) : s2.ok ? 0 : pr.total;
      this.card(['{r}' + nameOf(tgt) + '{/}: ' + atk.save.ab.toUpperCase() + ' save  ' + RU.saveText(s2) + ' vs DC ' + s2.dc + '  ' + (s2.ok ? '{n}SAVED{/} (half)' : '{o}FAILED{/}'), atk.save.dice + ' ' + RU.fmtRolls(pr.rolls) + ' = ' + pr.total + ' ' + atk.save.type + '  = {r}' + pd + '{/}']);
      if (pd) this.hurt(tgt, pd, atk.save.type);
      yield 30;
    }
    att.anim = 'idle';
  };
  function nameOf(u) { return u.side === 'foe' ? u.name : u.name; }
  // a unit the AI runs (a foe, a guest, a hero on the bench): its reactions are decided, never asked (09-28, the class NPCs)
  function byAI(u) { return u.side !== 'party' || !!u.guest; }
  function M16() { return D.magic; }
  function slotFor(u, min) { for (var i = min - 1; i < (u.slots || []).length; i++) if (u.slots[i] > 0) return i + 1; return 0; }
  function faceTo(a, b) {
    var ax = a.x + ((a.size || 1) - 1) / 2, ay = a.y + ((a.size || 1) - 1) / 2, bx = b.x + ((b.size || 1) - 1) / 2, by = b.y + ((b.size || 1) - 1) / 2;
    var dx = bx - ax, dy = by - ay, m = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
    return D.spr.facingFor(Math.round(dx / m), Math.round(dy / m));
  }
  Battle.prototype.faceTo = faceTo;

  // damage lands: a flash, a number, and at 0 a hero goes down (and can be brought back), a foe dies
  Battle.prototype.hurt = function (u, n, type) {
    if (n <= 0) return;
    u.woken = true; // (the cloaker hangs as a cloak till it takes damage: ui.js unitObj)
    if (D.magic.preHurt) { n = D.magic.preHurt(this, u, n, type); if (n <= 0) return; } // (the Vigil's Keeper's Ward: js/features.js)
    if (/fire|acid/.test(type || '')) u.burned = true; // a troll's regeneration reads this at its next turn
    if (type === 'fire' && D.magic.burnWebs) D.magic.burnWebs(this, G.foot(u)); // (fire on one standing in a web burns the web: magic.js)
    // Talmok rages when he is first hit: blades and fists do half from then on, his own blows +2
    if (u.rageOnHit && !u.raging && !u.dead) { u.raging = true; u.resist = ['bludgeoning', 'piercing', 'slashing']; FX.ring(u, 'red', 30); D.sfx('crit'); this.card(['{r}' + u.name + '{/} roars and rages!  {g}(half from blades and blows; +2 to his own){/}']); }
    // Split (the black pudding): slashing or lightning on one of Medium size or more with 10 HP or more halves it into two
    if (u.split && !u.dead && /slashing|lightning/.test(type || '') && u.hp >= 10 && (u.sizeClass || (u.size > 1 ? 'L' : 'M')) !== 'S' && this.alive('foe').length < 8) this.splitOff(u);
    if (u.immune || u.resist || u.vulnerable) {
      var ty = this.typed(u, n, type);
      if (ty.why) FX.float(ty.why === 'immune' ? 'immune: ' + type : ty.why, u, ty.why === 'vulnerable' ? D.PAL.ramps.gold[4] : D.PAL.ramps.silver[5]); // (says to what: the jelly and a blade)
      n = ty.n;
      if (n <= 0) return;
    }
    // Damage Transfer (the cloaker): while it has someone engulfed, half of what it takes goes to them
    if (u.transfer && u.holding && u.holding.length && n > 1) {
      var vic = u.holding[0], half = Math.floor(n / 2);
      if (vic && !vic.dead && vic.hp > 0) { n -= half; FX.float('transfer', vic, D.PAL.ramps.violet[4]); this.hurt(vic, half, type); }
    }
    if (u.conds.stoneskin && /bludgeoning|piercing|slashing/.test(type || '')) { n = Math.floor(n / 2); FX.float('stoneskin', u, D.PAL.ramps.silver[5]); }
    // the class NPCs' wards (09-28, js/grimoire.js): Protection from Energy (one element halved), Protection from Poison, Rage (blades and
    // blows halved), Warding Bond (all of it halved -- and the one who bound it takes as much)
    var ward = u.conds;
    if ((ward.energyWard && ward.energyWard.type === type) || (ward.poisonWard && type === 'poison') || (ward.raging && /bludgeoning|piercing|slashing/.test(type || ''))) { n = Math.floor(n / 2); FX.float('resists', u, D.PAL.ramps.silver[5]); }
    if (ward.wardingBond && n > 0) {
      n = Math.floor(n / 2);
      var bondBy = this.units.filter(function (w) { return w.id === ward.wardingBond.by && !w.dead && w.hp > 0; })[0];
      if (bondBy && bondBy !== u && n > 0) { FX.float('bond', bondBy, D.PAL.ramps.gold[4]); this.hurt(bondBy, n, 'bond'); if (bondBy.hp <= 0) delete ward.wardingBond; }
    }
    if (u.temp > 0) { var soak = Math.min(u.temp, n); u.temp -= soak; n -= soak; }
    // Wild Shape (js/features.js): the beast's hit points take it first; at 0 the druid comes back with the rest
    if (u.beast && n > 0) { if (n < u.beast.hp) { u.beast.hp -= n; u.flash = 10; FX.float('-' + n, u, D.PAL.ramps.red[4]); return; } var over = n - u.beast.hp; D.features.unshape(this, u, over); return; }
    if (u.conds.asleep) { delete u.conds.asleep; FX.float('awake!', u, D.PAL.ramps.bone[2]); }
    if (n <= 0) return;
    u.hp = Math.max(0, u.hp - n);
    if (u.traces) this.hitAtTraces = true; // (nothing shows now: from their next moves they run, or he turns to fight: ai.js turn)
    if (u.displacement) u.conds.displaceOff = true; // the cloak falters when a blow lands
    u.flash = 10;
    // a sheet with a hit row flinches (played once, ui.js unitObj) when the blow doesn't drop it and it isn't mid-swing or mid-stride
    if (u.hp > 0 && (!u.anim || u.anim === 'idle' || u.anim === 'flinch') && D.spr.anim(u.sheet, 'flinch')) { u.anim = 'flinch'; u.animT = this.t; }
    FX.float('-' + n, u, D.PAL.ramps.red[4]);
    if (u.conds.hidden) delete u.conds.hidden;
    if (u.hp <= 0 && (u.side === 'party' && !u.guest || u.npc) && u.feats && u.feats.relentless > 0) {
      // Relentless (the 8-bit game's own, js/battle.js: Lymen, once a day): the blow that would drop him leaves him at 1 (review 09-28 #3)
      // (a half-orc class NPC's Relentless Endurance too: js/classes.js)
      u.feats.relentless = 0; u.hp = 1; FX.ring(u, 'gold', 30); D.sfx('buff');
      this.card(['{y}' + u.name + ' refuses to fall!{/}  {g}(Relentless: once a day, at 1 HP){/}']);
      D.magic.concCheck(this, u, n);
      return;
    }
    // Death Ward (js/grimoire.js): the first fall stops at 1
    if (u.hp <= 0 && u.conds.deathWard) { delete u.conds.deathWard; u.hp = 1; FX.ring(u, 'gold', 30); this.card(['{y}' + (u.side === 'foe' ? 'The ' + shortName(u) : u.name) + ' does not fall: the death ward holds.{/}']); D.magic.concCheck(this, u, n); return; }
    // Relentless (the giant boar: js/traits.js): a small blow that would drop it leaves it at 1
    if (u.hp <= 0 && D.traits && D.traits.refuse && D.traits.refuse(this, u, n)) { D.magic.concCheck(this, u, n); return; }
    if (u.hp <= 0) {
      u.anim = 'hurt'; u.animT = this.t;
      if (D.traits && D.traits.onDown) D.traits.onDown(this, this.active, u); // (the gnoll's Rampage)
      D.sfx(u.side === 'party' ? 'ko' : 'die');
      if (u.familiar && D.familiar && D.familiar.vanish) D.familiar.vanish(this, u); // (a familiar at 0 HP is gone, not down: SRD 5.1)
      else if (u.side === 'party') { u.ko = true; delete u.conds.ablaze; D.light.fell(this, u); this.card(['{r}' + u.name + ' goes down.{/}' + (D.light.torchAt(this, u.x, u.y) ? '  {g}The torch burns beside ' + u.name + '.{/}' : '')]); } // (the name, never "him")
      else { u.dead = true; u.deadT = this.t; this.card(['{y}The ' + shortName(u) + ' falls.{/}']); if (u.holding && u.holding.length) this.release(u); }
      // a darkmantle down off the one it rode, or off one who went down, now -- not at the coroutine's next step: the blow that ends the fight leaves no
      // next step, and the one it rode kept "attached" and "blinded" (10-01, the roper window's bench: Barley and Vivian, their darkmantles dead)
      this.rideSync();
      if (D.magic.onKill) D.magic.onKill(this, this.active, u); // (Dark One's Blessing: js/features.js)
      if (u.conc) D.magic.endConc(this, u, 'down');
      // one who runs the moment the one in charge is down (the wheelwright, when Hask falls): gone up the stair at once, before
      // anyone can cut him down -- the 8-bit's foeBolt, certain (review 09-28 #11: the wheelwright quest hangs on his getting away)
      if (u.side === 'foe') { var self = this; this.units.forEach(function (w) { if (w.side === 'foe' && w.bolts && w.bolts === u.kind && !w.dead && w.hp > 0) { w.dead = true; w.fled = true; w.deadT = self.t; if (w.holding && w.holding.length) self.release(w); D.sfx('run'); self.card(['{r}' + w.name + '{/} drops what he was holding and runs for the stair. He is gone.']); } }); }
    } else D.magic.concCheck(this, u, n);
    if (D.magic.onHurt && u.hp > 0) D.magic.onHurt(this, u, n, type); // (a laughing one's save with advantage, a pattern broken: js/grimoire.js)
  };
  Battle.prototype.heal = function (u, n) {
    var was = u.hp;
    // Chill Touch (SRD 5.1): no hit points come back till the caster's next turn
    if (u.conds.noHeal) { FX.float('no healing', u, D.PAL.ramps.violet[4]); this.card(['{p}' + u.name + ' cannot be healed: the grave\'s hand is on them.{/}'], 240); return 0; }
    // Beacon of Hope (SRD 5.1): a heal on one under it is the most it could be (the caster's heal says so: o.max)
    if (u.conds.beacon && arguments[2] && arguments[2].max) n = arguments[2].max;
    u.hp = Math.min(u.maxhp, u.hp + n);
    if (was <= 0 && u.hp > 0) { u.ko = false; u.anim = 'idle'; }
    FX.float('+' + (u.hp - was), u, D.PAL.ramps.moss[2]);
    if (u.hp > was) D.sfx('heal');
    return u.hp - was;
  };

  // ------------------------------------------------------------------ gear in the fight: the MENU's EQUIP, not a ring button (Griz, 09-27: "Don't add
  // a button for gear swapping, but ... apply the action cost for weapon swaps"). A swap is stowing one weapon and drawing
  // another: the turn's one free object interaction and a second one, which takes the action (SRD 5.1, Use an Object),
  // so a swap costs the action. A shield on or off is an action too; armour doesn't change in a fight.
  Battle.prototype.itemName = function (id) { var it = window.DS.DATA.items[id]; return it ? it.name : id; };
  function packOf(B, id) { return B.inv.filter(function (x) { return x.id === id; })[0]; }
  Battle.prototype.ammoLeft = function (u) { var s = packOf(this, u.weapon.ammo); return s ? s.n : 0; };
  Battle.prototype.spendAmmo = function (u) { var s = packOf(this, u.weapon.ammo); if (s && s.n > 0) s.n--; };
  Battle.prototype.gearOptions = function (u) {
    var R = window.DS.R, h = u.src, T = u.turn, B = this, out = [];
    if (!h || u.guest || !T || !h.equip) return out;
    var busy = T.action > 0 && !T.attacksLeft ? '' : 'the action is spent', cur = R.item(h.equip.weapon);
    var curTwo = cur && cur.weapon && (cur.weapon.props || []).indexOf('two-handed') >= 0;
    this.inv.forEach(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || it.kind !== 'weapon' || s.n <= 0 || !R.canEquip(h, it)) return;
      var wd = it.weapon, two = (wd.props || []).indexOf('two-handed') >= 0, why = busy || (two && h.equip.shield ? 'two hands: the shield comes off first' : two && u.torch ? 'two hands: the torch goes down first' : '');
      var ammo = wd.ammo ? ', ' + (packOf(B, wd.ammo) ? packOf(B, wd.ammo).n : 0) + ' ' + B.itemName(wd.ammo).toLowerCase() : '';
      out.push({ kind: 'weapon', id: s.id, label: it.name, note: wd.dmg + ' ' + wd.type + (wd.range ? ', ' + wd.range.join('/') + ' ft' : ', melee') + ammo, ok: !why, why: why });
    });
    // armour: not in a fight on the tabletop (it takes minutes), but the ladder's test bench allows it, for the action
    // (Griz, 09-27: "Allow for in-combat armor swapping on the non-climbing ladder"); a climb (this.o.climb) will not
    if (this.o.ladder && !this.o.climb) {
      var worn = R.item(h.equip.armor);
      if (worn) out.push({ kind: 'armoroff', label: 'ARMOUR OFF: ' + worn.name, note: 'into the pack (the ladder only)', ok: !busy, why: busy });
      this.inv.forEach(function (s) {
        var it = window.DS.DATA.items[s.id];
        if (!it || it.kind !== 'armor' || s.n <= 0 || !R.canEquip(h, it)) return;
        out.push({ kind: 'armor', id: s.id, label: 'WEAR: ' + it.name, note: it.desc ? it.desc.split('.')[0] : '', ok: !busy, why: busy });
      });
    }
    if (h.equip.shield) out.push({ kind: 'shieldoff', label: 'SHIELD OFF', note: 'into the pack: -' + ((R.item(h.equip.shield).shield || {}).ac || 2) + ' AC', ok: !busy, why: busy });
    else {
      var sh = this.inv.filter(function (s) { var it = window.DS.DATA.items[s.id]; return it && it.kind === 'shield' && s.n > 0 && R.canEquip(h, it); })[0];
      if (sh) out.push({ kind: 'shieldon', id: sh.id, label: 'SHIELD ON: ' + this.itemName(sh.id), note: '', ok: !busy && !curTwo && !u.torch, why: busy || (curTwo ? 'the weapon takes both hands' : u.torch ? 'the torch is in that hand' : '') });
    }
    return out;
  };
  Battle.prototype.swapGear = function (u, o) {
    var R = window.DS.R, h = u.src, B = this;
    function give(id) { if (!id) return; var s = packOf(B, id); if (s) s.n++; else B.inv.push({ id: id, n: 1 }); }
    function take(id) { var s = packOf(B, id); if (s) s.n--; }
    u.turn.action = 0; D.sfx('confirm');
    if (o.kind === 'weapon') { give(h.equip.weapon); take(o.id); h.equip.weapon = o.id; delete u.conds.ablaze; } // sheathed: the flame goes out
    if (o.kind === 'shieldoff') { give(h.equip.shield); h.equip.shield = null; }
    if (o.kind === 'shieldon') { take(o.id); h.equip.shield = o.id; }
    if (o.kind === 'armoroff') { give(h.equip.armor); h.equip.armor = null; }
    if (o.kind === 'armor') { give(h.equip.armor); take(o.id); h.equip.armor = o.id; }
    u.weapon = D.save.weaponOf(h); u.attacks = u.weapon.loading ? 1 : u.attacksBase;
    // Mage Armor ends when its wearer puts on armour (robes aren't armour to it)
    if (R.armored(h) && (u.conds.mageArmor || (h.conds && h.conds.mageArmor))) { delete u.conds.mageArmor; if (h.conds) delete h.conds.mageArmor; }
    var ac = R.ac(h); if (u.conds.mageArmor && !R.armored(h)) ac = Math.max(ac, 13 + D.mod(u.abil.dex)); // Mage Armor cast in this fight
    u.baseAC = ac; u.armored = R.armored(h);
    var did = { weapon: 'stows one weapon and takes up the ' + u.weapon.name, shieldoff: 'slings the shield', shieldon: 'takes up the shield',
      armoroff: 'sheds the armour', armor: 'buckles on the ' + this.itemName(o.id) }[o.kind];
    this.card(['{y}' + u.name + '{/} ' + did + ' (the action).  AC ' + RU.ac(u) + '  ' + u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + (u.weapon.ranged ? '  ' + u.weapon.range.join('/') + ' ft' : '')], 240);
  };

  // ------------------------------------------------------------------ leaving: out the way the party came in. Stepping off the map leaves any foe's reach,
  // so its opportunity attack comes first (unless the hero disengaged); then the hero is out of the fight, not dead
  Battle.prototype.onExit = function (u) { return (this.exits || []).some(function (q) { return q[0] === u.x && q[1] === u.y; }); };
  Battle.prototype.leave = function* (u) {
    var T = u.turn;
    if (!T.disengaged) {
      var prov = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.ethereal && G.dist(w, u) <= G.reachOf(w) && !(w.weapon && w.weapon.ranged); });
      for (var k = 0; k < prov.length; k++) {
        var w = prov[k], keys = Object.keys(w.attacks || {}).filter(function (key) { return !w.attacks[key].ranged; }), atk = w.weapon || (keys.length ? w.attacks[keys[0]] : null);
        if (!atk) continue;
        w.reaction = 0;
        this.card(['{o}' + (w.side === 'foe' ? 'The ' + shortName(w) : w.name) + '{/}: an opportunity attack on ' + u.name + ', leaving.']);
        yield* this.attack(w, u, atk, { oa: true });
        if (u.hp <= 0) return;
      }
    }
    T.move = 0; u.left = true; u.dead = true; u.deadT = this.t; delete u.conds.ablaze;
    if (u.conc) D.magic.endConc(this, u, 'out of the fight');
    D.sfx('run');
    if (!this.fight.noCards) this.card(['{y}' + u.name + '{/} gets out the way the party came in.  {g}(out of the fight){/}']); // (the wet asked already: no card -- 09-30e)
    yield 30;
  };

  // ------------------------------------------------------------------ items: the save's own (a potion, a kit, an antitoxin, an oil flask)
  // fortify (09-28g): Marta's bat-wing pie, eaten in a fight -- +2 CON (+1 to CON saves) and +5 HP till it ends (the 8-bit battle's)
  var ITEM_OK = { heal: 1, revive: 1, antitoxin: 1, cure: 1, damage: 1, light: 1, fortify: 1, bucket: 1 }; // (bucket: the landlord's, js/wet.js)
  // a torch is lit as a bonus action by the Thief (Fast Hands), or by anyone if the seat's default is flipped (js/light.js LIGHT_COST)
  function torchFast(u) { return u.subclass === 'Thief' || D.light.LIGHT_COST === 'B'; }
  Battle.prototype.itemList = function (u) {
    var T = u.turn, roost = this.fight && this.fight.roost, self = this;
    return (this.inv || []).map(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || !it.use || !it.use.battle || !ITEM_OK[it.use.effect] || s.n <= 0) return null;
      if (roost && (it.use.effect === 'damage' || (it.use.effect === 'light' && !D.light.isLantern(s.id)))) return { id: s.id, name: it.name, n: s.n, use: it.use, ok: false, why: 'the roost overhead: no fire' };
      if (it.use.effect === 'light') { // a torch (torchdark 09-28), or a lantern (09-29; under a roost it is lit hood down): a free hand, and the action (or the Thief's bonus)
        var cl = D.light.canLight(self, u, s.id), can = (torchFast(u) && T.bonus > 0) || (T.action > 0 && !T.attacksLeft);
        return { id: s.id, name: it.name, n: s.n, use: it.use, ok: cl.ok && can && !u.guest, why: !cl.ok ? cl.why : can ? '' : 'the action is spent', cost: torchFast(u) && T.bonus > 0 ? 'B' : 'A' };
      }
      return { id: s.id, name: it.name, n: s.n, use: it.use, ok: (u.subclass === 'Thief' && T.bonus > 0) || (T.action > 0 && !T.attacksLeft), why: T.action > 0 ? '' : 'the action is spent' };
    }).filter(Boolean);
  };
  Battle.prototype.itemTargetOK = function (u, id, w) {
    var use = window.DS.DATA.items[id].use;
    if (!w || w.dead) return false;
    if (use.effect === 'damage') return G.hostile(u, w) && w.hp > 0 && G.dist(u, w) <= 20 && G.los(u, w).clear;
    if (use.effect === 'light') return w === u;
    if (w.side !== u.side || (w !== u && G.dist(u, w) > 5)) return false;
    if (use.effect === 'revive') return w.hp <= 0;
    if (use.effect === 'heal') return w.hp < w.maxhp;
    if (use.effect === 'fortify') return w.hp > 0 && !w.fortified;
    return true;
  };
  // the Door-Shield (the 8-bit game's, RULED 09-26 by Griz: "no rule text, just the named item"; invented.json #door-shield): on a
  // miss at its bearer that rolled a natural 15 or more, a 3% chance -- energy out from the shield and down onto the party, +3 AC
  // to all of them till the bearer's next turn (rules.js RU.ac; cleared in RU.startTurn). On the grid since 09-28g
  Battle.prototype.doorWard = function (t) {
    var R = window.DS.R, sh = t.src && t.src.equip && R.item(t.src.equip.shield), self = this;
    if (!sh || !sh.shield || !sh.shield.doorward || this.doorWardOn || t.side !== 'party' || t.hp <= 0) return;
    if (Math.random() >= (window.DS.doorWardChance != null ? window.DS.doorWardChance : 0.03)) return;
    this.doorWardOn = t; D.sfx('buff'); FX.ring(t, 'glow', 60);
    this.units.forEach(function (w) { if (w.side === 'party' && w.hp > 0 && !w.dead) FX.sparkle(w, 'silver', 14); });
    this.card(['{c}The ' + sh.name + ' protects the party.{/}  {g}(+3 AC to all, till ' + t.name + '\'s next turn){/}'], 320);
  };
  Battle.prototype.useItem = function* (u, id, w) {
    var it = window.DS.DATA.items[id], use = it.use, s = this.inv.filter(function (x) { return x.id === id; })[0];
    if (((use.effect === 'light' && torchFast(u)) || u.subclass === 'Thief') && u.turn.bonus > 0) u.turn.bonus = 0; else u.turn.action = 0; // Fast Hands
    if (use.effect === 'light') { yield* D.light.lightTorch(this, u, id); yield 20; return; } // (lightTorch takes it from the pack)
    s.n--;
    var who = w === u ? 'drinks' : 'gives ' + w.name;
    if (use.effect === 'heal') { var r = D.roll(use.dice), got = this.heal(w, r.total); this.card(['{y}' + u.name + '{/} ' + who + ' a ' + it.name + ': ' + use.dice + ' ' + RU.fmtRolls(r.rolls) + ' = {n}' + r.total + '{/}' + (got < r.total ? ' (' + got + ' to full)' : '')]); FX.sparkle(w, 'moss', 12); }
    if (use.effect === 'revive') { this.heal(w, use.hp || 1); this.card(['{y}' + u.name + '{/} works the ' + it.name + ' on ' + w.name + ': up, on ' + w.hp + ' HP.']); }
    if (use.effect === 'antitoxin' || use.effect === 'cure') {
      // the elixir cures paralysis too, as the 8-bit battle's does (09-28g)
      var had = !!w.conds.poisoned, stiff = use.effect === 'cure' && !!w.conds.paralyzed;
      delete w.conds.poisoned; if (stiff) delete w.conds.paralyzed;
      this.card(['{y}' + u.name + '{/} ' + who + ' the ' + it.name + (had || stiff ? ': the ' + (had && stiff ? 'poison and the paralysis go' : had ? 'poison goes' : 'paralysis goes') + ' out.' : ': nothing to cure.')]); FX.sparkle(w, 'moss', 10);
    }
    if (use.effect === 'fortify') {
      w.fortified = true; w.maxhp += 5; w.hp += 5; if (w.saves) w.saves.con += 1;
      this.card(['{y}' + (w === u ? u.name + '{/} eats' : u.name + '{/} gives ' + w.name) + ' a ' + it.name + ': {n}+5 HP{/} and +2 CON {g}(+1 to CON saves) for the fight{/}']); FX.sparkle(w, 'moss', 12);
    }
    if (use.effect === 'damage') {
      D.sfx('fire');
      FX.projectile(u, w, 'fire'); yield { fx: 1 };
      var sv = RU.save(w, use.save || 'dex', use.dc || 10), dmg = sv.ok ? 0 : D.roll(String(use.dice)).total;
      this.card(['{y}' + u.name + '{/} throws the ' + it.name + ' at the ' + shortName(w) + ': DEX ' + RU.saveText(sv) + ' vs DC ' + (use.dc || 10) + '  ' + (sv.ok ? '{n}dodged{/}' : '{o}burning: ' + dmg + ' fire{/}')]);
      if (dmg) this.hurt(w, dmg, 'fire');
    }
    yield 30;
  };

  // ------------------------------------------------------------------ Fireball: the area proof (DEX save for half; Evasion; the aura)
  Battle.prototype.fireball = function* (u, cx, cy) {
    var T = u.turn, sl = slotFor(u, 3), self = this;
    T.action = 0; T.spell = 'leveled'; u.slots[sl - 1]--;
    var sq = G.sphere(cx, cy, 20), dice = (8 + sl - 3) + 'd6';
    u.facing = faceTo(u, { x: cx, y: cy, size: 1 });
    u.anim = 'attack'; u.animT = this.t;
    yield 12;
    FX.projectile(u, { x: cx, y: cy, size: 1 }, 'fire'); yield { fx: 1 };
    FX.bloom(cx, cy, sq);
    var r = D.roll(dice), caught = this.units.filter(function (w) { return G.present(w) && G.inArea(w, sq); });
    var lines = ['{y}' + u.name + '{/}: FIREBALL (L' + sl + ')  ' + dice + ' ' + RU.fmtRolls(r.rolls) + ' = {o}' + r.total + '{/} fire  DEX DC ' + u.spellDC];
    var hits = [];
    caught.forEach(function (w) {
      var sv = RU.save(w, 'dex', u.spellDC, false, null, r.total), evade = RU.evasion(w);
      var d = sv.ok ? (evade ? 0 : Math.floor(r.total / 2)) : (evade ? Math.floor(r.total / 2) : r.total);
      lines.push('  ' + nameOf(w) + ': ' + RU.saveText(sv) + ' ' + (sv.ok ? '{n}saved{/}' : '{o}failed{/}') + (evade ? ' {c}evasion{/}' : '') + ' -> {r}' + d + '{/}');
      hits.push([w, d]);
    });
    if (!caught.length) lines.push('  {g}no one in it.{/}');
    this.card(lines.slice(0, 6), 420);
    yield { fx: 1 };
    hits.forEach(function (h) { self.hurt(h[0], h[1], 'fire'); });
    u.anim = 'idle';
    yield 30;
  };

  // ------------------------------------------------------------------ Misty Step: a bonus action, 30 ft to a square you can see
  // the squares a teleport reaches (Misty Step's 30 ft; Dimension Door's 500, js/grimoire.js): free, and seen
  Battle.prototype.mistyTargets = function (u, range) {
    var out = [], n = Math.floor((range || 30) / 5);
    for (var y = u.y - n; y <= u.y + n; y++) for (var x = u.x - n; x <= u.x + n; x++) {
      if (x === u.x && y === u.y) continue;
      if (!G.canStand(u, x, y) || !G.losPoint(u.x, u.y, x, y)) continue;
      out.push([x, y]);
    }
    return out;
  };
  Battle.prototype.misty = function* (u, x, y) {
    var T = u.turn, sl = slotFor(u, 2);
    T.bonus = 0; T.bonusSpell = true; u.slots[sl - 1]--;
    D.sfx('magic');
    if (u.conds.hidden) delete u.conds.hidden;
    FX.sparkle(u, 'silver', 16);
    this.card(['{y}' + u.name + '{/}: MISTY STEP (L' + sl + ') -- silver mist, and he is ' + (Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) * 5) + ' ft away.']);
    yield 16;
    u.x = x; u.y = y; delete u.tween;
    FX.sparkle(u, 'silver', 16);
    this.keepInView(u);
    yield 16;
  };

  // ------------------------------------------------------------------ Hide (Cunning Action): Stealth against each foe's passive Perception;
  // a foe with a clear, coverless look at her sees her anyway
  // how well w sees u for hiding (above): 2 clearly, 1 dimly (its darkvision, or dim light), 0 not at all or behind cover. u may be a stand-in
  // for her on another square (ui.js: the places to try hiding, tinted) -- one question for the tint and the roll, so they cannot disagree
  // where a blow or a spell came from (SRD 5.1, Hiding: "you give away your location when the attack hits or misses") -- the square, by its maker,
  // and the round; a foe that sees no one goes for the newest such square of its enemies, this round's or the last (ai.js brute, tactics.js TX.turn).
  // 10-01c, the rogue runner: a foe that could see no one did nothing, so a rogue who shot and hid again was never answered (a troll at 9, thirty
  // fights in thirty, at full health)
  Battle.prototype.noteHeard = function (u) { if (u && u.id) (this.heard = this.heard || {})[u.id] = { x: u.x, y: u.y, round: this.round }; };
  Battle.prototype.heardOf = function (u) {
    var self = this, best = null;
    Object.keys(this.heard || {}).forEach(function (id) {
      var h = self.heard[id], w = self.units.filter(function (x) { return x.id === id; })[0];
      if (!w || !G.standing(w) || !G.hostile(u, w) || self.round - h.round > 1) return;
      if (!best || h.round > best.round) best = { x: h.x, y: h.y, size: 1, round: h.round, who: w };
    });
    return best;
  };
  Battle.prototype.seenBy = function (w, u) {
    var s = D.magic.seeWhy(this, w, u), l = G.los(w, u); if (!s.ok || !l.clear || l.cover) return 0;
    if (!this.dark || (w.blindsight && G.dist(w, u) <= w.blindsight) || (w.truesight && G.dist(w, u) <= w.truesight)) return 2;
    return s.dv || (D.light && D.light.levelOf(this, u) < 2) ? 1 : 2;
  };
  Battle.prototype.hide = function* (u) {
    var T = u.turn;
    if (T.bonus > 0 && u.lvl >= 2) T.bonus = 0; else T.action = 0; // Cunning Action from level 2; the Hide action before
    D.sfx('run');
    var foes = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }), self = this; // (whoever is against her: a rogue NPC hides from the four)
    // who sees her clearly (SRD 5.1 Hiding: "You can't hide from a creature that can see you clearly"; darkvision sees darkness "as if the
    // darkness were dim light", and dim light is lightly obscured -- not clearly. 10-01b, Griz: "I think I'm getting conflicting rogue-hiding
    // hints": she was refused by anyone with a clear line, in the pitch dark too): 2, a clear line with no cover and she in bright light or
    // within its blindsight or truesight -- no hiding from it; 1, the same line but by its darkvision or in dim light -- she may try, and its
    // passive Perception is 5 down (lightly obscured: disadvantage on sight); 0, behind cover or not seen at all -- she may try
    var seen = function (w) { return self.seenBy(w, u); };
    var plain = foes.filter(function (w) { return seen(w) === 2; });
    var mirror = foes.filter(function (w) { return w.mirrorEye && G.los(w, u).clear && D.magic.inMirror(self, w, u); }); // (the Mirror's eye: no hiding before it, in light)
    // Supreme Sneak (the Thief's 9; SRD 5.1): advantage on the Stealth check if it moved no more than half its speed this turn
    // (and Enhance Ability on DEX, Heat Metal's burning armour against every check: rules.js checkEdges)
    var supreme = u.subclass === 'Thief' && u.lvl >= 9 && (T.moved || 0) <= u.speed / 2, ce = RU.checkEdges(u, 'dex'), hadv = supreme || ce.adv.length > 0, hdis = ce.dis.length > 0, ra = D.d(20), r = hadv !== hdis ? (hadv ? Math.max(ra, D.d(20)) : Math.min(ra, D.d(20))) : ra;
    RU.spendHelp(u); // (a friend's Help, spent on the Stealth check -- 10-01c)
    var total = r + u.stealth + (u.conds.pwt ? 10 : 0), pp = function (w) { return w.perception - (seen(w) === 1 ? 5 : 0); }, top = Math.max.apply(null, foes.map(pp).concat([0]));
    var dimTop = foes.some(function (w) { return pp(w) === top && seen(w) === 1; }); // (the sharpest of them sees her only dimly: say so)
    if (mirror.length) {
      this.card(['{y}' + u.name + '{/} tries to hide, but the mirror on ' + mirror.map(shortName).join(' and ') + ' has her: {p}nothing hides in front of the Mirror\'s eye{/}.', '{g}Get behind her, or into the dark.{/}']);
    } else if (plain.length) {
      var bsw = plain.filter(function (w) { return w.blindsight && G.dist(w, u) <= w.blindsight; })[0];
      this.card(['{y}' + u.name + '{/} tries to hide, but the ' + plain.map(shortName).join(' and the ') + ' can see her plainly (' + (bsw ? 'blindsight ' + bsw.blindsight + ' ft: it needs no light' : this.dark ? 'in the light' : 'no cover') + ').', '{g}Put a stalagmite or a body between you first' + (bsw ? ', or get past its ' + bsw.blindsight + ' ft' : this.dark ? ', or get out of the light' : '') + '.{/}']);
    } else {
      // Guidance (SRD 5.1: a d4 to one ability check, "before or after making the ability check"): spent after the roll, on a check the d4 could turn
      var gd = u.conds.guidance && !u.conds.faerie && total < top && total + 4 >= top && D.magic.spendGuidance ? D.magic.spendGuidance(this, u) : 0;
      total += gd;
      var ok = total >= top && !u.conds.faerie; // (outlined in violet light: nowhere to hide)
      this.card(['{y}' + u.name + '{/} hides: Stealth d20 ' + r + (supreme ? ' {n}(supreme sneak: advantage)' + '{/}' : '') + (!supreme && hadv !== hdis ? (hadv ? ' {n}(advantage: ' + ce.adv.join(', ') + '){/}' : ' {o}(disadvantage: ' + ce.dis.join(', ') + '){/}') : '') + ' ' + RU.sign(u.stealth) + (gd ? ' {c}+' + gd + ' guidance{/}' : '') + ' = ' + total + ' vs passive Perception ' + top + (dimTop ? ' {g}(5 down: it sees her only dimly){/}' : '') + '  ' + (ok ? '{n}HIDDEN{/}' : '{o}SEEN{/}'), ok ? '{g}Her next attack has advantage (and Sneak Attack).{/}' : '']);
      if (ok) u.conds.hidden = true;
    }
    yield 30;
  };

  // ------------------------------------------------------------------ Lay on Hands: an action, touch -- the target must be adjacent (or himself)
  Battle.prototype.layOnHands = function* (u, tgt, cure) {
    var T = u.turn;
    if (tgt !== u && G.dist(u, tgt) > 5) { this.card(['{o}Lay on Hands is touch: ' + tgt.name + ' is ' + G.dist(u, tgt) + ' ft away.{/}']); return; }
    var pool = u.feats.lay;
    if (cure === undefined && tgt.conds.poisoned && pool >= 5) {
      cure = yield { prompt: { who: u, title: u.name + ': LAY ON HANDS', lines: [tgt.name + ' is poisoned. Pool: ' + pool + '.'], opts: [{ label: 'HEAL', value: false }, { label: 'CURE POISON (5)', value: true }] } };
    }
    T.action = 0;
    if (cure) {
      u.feats.lay -= 5; delete tgt.conds.poisoned;
      this.card(['{y}' + u.name + '{/} lays on hands: the poison goes out of ' + tgt.name + '. {g}(pool ' + u.feats.lay + '){/}']);
    } else {
      var want = Math.min(tgt.maxhp - tgt.hp, pool);
      u.feats.lay -= want;
      var got = this.heal(tgt, want);
      this.card(['{y}' + u.name + '{/} lays on hands: {n}+' + got + '{/} to ' + tgt.name + '. {g}(pool ' + u.feats.lay + '){/}']);
    }
    FX.sparkle(tgt, 'gold', 18);
    yield 30;
  };

  // ------------------------------------------------------------------ the camera: snap to a unit; recentre only when it nears the edge
  Battle.prototype.foeInReach = function (u) {
    var self = this;
    return this.units.some(function (w) { return G.hostile(u, w) && G.standing(w) && !w.dead && w.hp > 0 && self.canHit(u, w); });
  };
  // can u's weapon reach w from where u stands? A ranged one (a hero's crossbow) out to its long range, if it can see w
  Battle.prototype.canHit = function (u, w) {
    if (RU.charmedBy(u, w)) return false; // (charmed: never its charmer)
    var wp = u.weapon;
    if (wp && wp.ranged) return G.dist(u, w) <= wp.range[1] && G.los(u, w).clear;
    return G.dist(u, w) <= G.reachOf(u);
  };
  Battle.prototype.focus = function (u) { var c = FX.at(u); D.iso.lookAt(c.gx, c.gy, c.gz); };
  Battle.prototype.keepInView = function (u) {
    var c = FX.at(u), w = D.iso.center(c.gx, c.gy, c.gz), s = D.iso.toScreen(w.x, w.y);
    if (s.x < 110 || s.x > D.W - 110 || s.y < 70 || s.y > D.H - 90) this.focus(u);
  };

  Battle.prototype.opaque = true; // (the ladder under it needn't draw)
  Battle.prototype.draw = function (ctx) { D.ui.drawBattle(ctx, this); };
  Battle.prototype.onRequest = function (req) { D.ui.onRequest(this, req); };
})();
