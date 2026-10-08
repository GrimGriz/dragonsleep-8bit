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

  // A big floor's bake is a pause of a second or more (10-04 night: a 60x46 2.3 s, a 90x70 5.3 s; Griz: "yes" to a baking frame): pushed, the fight says BAKING THE FLOOR for a
  // frame and enters on the next (core.js D.push reads `bakes`; update and draw carry the wait). Never on the bench, which calls enter itself; never without a screen
  Battle.BAKE_SQ = 1200;
  Battle.prototype.bakes = function () {
    if (this.o.bench || !D.ctx) return false;
    var F = this.o.fightDef || (typeof D.fight === 'function' ? D.fight(this.o.fight || 'gallery') : null), m = F && D.MAPS[F.map];
    return !!(m && m.rows && m.rows.length * m.rows[0].length >= Battle.BAKE_SQ);
  };
  Battle.prototype.bakingFrame = function (ctx) {
    var F = this.o.fightDef || (typeof D.fight === 'function' ? D.fight(this.o.fight || 'gallery') : null), m = F && D.MAPS[F.map];
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, 'BAKING THE FLOOR', D.W / 2, D.H / 2 - 10, '#e8d8a0', 'center');
    D.text(ctx, (m && m.name ? m.name.toUpperCase() + '  --  ' : '') + (m ? m.rows[0].length + ' by ' + m.rows.length + ' squares' : ''), D.W / 2, D.H / 2 + 4, '#9a94a8', 'center');
  };
  Battle.prototype.enter = function () {
    var F = this.fight = this.o.fightDef || D.fight(this.o.fight || 'gallery'), m = this.map = D.iso.load(D.MAPS[F.map]), self = this;
    // on the ladder: the four at the fight's level, by the 8-bit game's own rules (nothing read from a save).
    // Otherwise walk in from the save (the door's snapshot or the newest slot), or as the fixture: the entry card offers both
    // from the camp (js/camp.js): the four as the morning left them; copied, so RESTART starts from the camp again
    // inside the 8-bit game (js/embed.js, this.o.embed): the party it handed over, as it stood when the fight began
    if (this.o.data) this.from = { from: this.o.embed ? 'the 8-bit game' : 'the camp', when: null, data: JSON.parse(JSON.stringify(this.o.data)) };
    else if (this.o.ladder || this.o.npc) this.from = { from: this.o.pocket ? 'the Pocket DM' : this.o.npc ? 'the class floor' : 'the ladder', when: null, data: D.save.fixture(Math.min(9, this.o.level || F.level)) }; // (the four stop at 9: a druid 12 on the class floor meets them at 9) (o.level: a fight's door or bench at another level -- ?fight=edifice&lvl=7, 10-05)
    else this.from = this.o.fixture ? { from: 'the fixture', when: null, data: D.save.fixture() } : D.save.load();
    // a story fight's own guests, made as the 8-bit game makes them (js/deep.js EV.guestSheet), where the party walking in brings none of that name: the Edifice's Pyro (10-05, Griz:
    // "Have pyro come out followed by the party"). Inside the 8-bit game the scene sends its own
    if (F.guests && !this.o.embed && this.from && this.from.data) { var gd = this.from.data; gd.guests = (gd.guests || []).slice(); F.guests.forEach(function (gid) { if (!gd.guests.some(function (g) { return (g.key || g.id) === gid; })) gd.guests.push(D.save.guest(gid)); }); }
    this.canSwap = !this.o.ladder && !this.o.npc && !this.o.embed && (this.o.fixture || this.from.from !== 'the fixture');
    var party = D.save.units(this.from.data, this.o.climb ? Object.assign({}, F, { looks: null }) : F); // the climb: Barley is Barley
    // the class floor (js/classes.js): a band of class NPCs instead of the four when asked (class against class), and on the bench
    // everyone on the party's side is run by the class tactics too (js/tactics.js); so in a watch (09-28h: ?npc=...&watch, and the
    // tester ladder, ?ladder&party=ours: "AI now, buttons later")
    var NB = this.o.npc;
    // (a word -- 'talmok:5:grown' -- or a spec the camp made up for the morning, js/camp.js o.ours; its id is the camp's)
    if (NB && NB.party) party = NB.party.map(function (w, i) { return D.npc.build(w, F.level, 'party', { id: typeof w === 'string' ? 'p' + i + '-' + String(w).split(':')[0].split('.')[0].split('+')[0] : w.id || ('p' + i + '-' + String(w.word || 'x').split(':')[0].split('.')[0].split('+')[0]) }); }).filter(Boolean); // (a `~` code or a `+item` word keeps a short id: js/classes.js NPC.spec, 10-02)
    if ((NB && (this.o.bench || this.o.watch)) || (this.o.watch && this.o.ladder)) party.forEach(function (u) { u.guest = true; u.classAI = true; }); // (and a ladder fight's &watch, 10-08: its four as the bench runs them)
    // the wizard's familiar, if the save has one and he is here (Find Familiar: js/familiar.js)
    var famData = this.o.familiar ? { flags: { familiar: this.o.familiar } } : NB ? null : this.from.data; // (the camp's pick for our four: o.familiar)
    // a rung's own familiar (data/fights.js `familiar`) when the save brings none: the Bat Swarms' bat on the four's wizard (10-02, Griz: "slap a familiar bat on
    // Aurdin (this is just ladder, 8bit folks should be leveled by then)") -- its blindsight in the roost's dark
    if (F.familiar && !NB && !(famData && famData.flags && famData.flags.familiar)) { var fwz = party.filter(function (w) { return w.cls === 'wizard'; })[0], FRM = window.DS.R.FAMILIARS && window.DS.R.FAMILIARS[F.familiar]; if (fwz && FRM) famData = { flags: { familiar: { kind: F.familiar, by: fwz.id, hp: FRM.hp } } }; }
    var fam = D.familiar && famData && D.familiar.unit(this, famData, party); if (fam) party.push(fam);
    // a familiar to each of a band (the class floor's &fam=owl,bat,...: js/classes.js npcFight, 10-01): the first keeps the one id
    (this.o.familiars || []).forEach(function (f, i) { var fu = D.familiar && D.familiar.unit(self, { flags: { familiar: f } }, party); if (fu) { fu.id = 'familiar' + (i || ''); party.push(fu); if (fu.master) fu.master.name += ' (' + window.DS.R.FAMILIARS[f.kind].name + ')'; } }); // (seven Wizard 5s told apart by their familiars)
    // (the Settling, 09-30: the 8-bit trigger that fired puts the lead on its own square -- embed.at -- and the rest beside him)
    // (a way in by name, 10-03: the Flooded Stair's 'rune' -- a hand on the mark, the party by it, the map's entryRune -- or 'ledge', waded in, its entry. The 8-bit scene says which
    // (this.o.embed.start, js/events.js S.mark and S.stair); ?keeperfight&start= and the bench pass this.o.start. A map without that list keeps its entry)
    var start = (this.o.embed && this.o.embed.start) || this.o.start || null, byStart = start && start !== 'ledge' ? m.def['entry' + start.charAt(0).toUpperCase() + start.slice(1)] : null;
    this.startAt = byStart ? start : null; // (the named start the party came in by, or none: the map's entry -- the Keeper's log and the probe read it)
    var entry = (this.o.embed && this.o.embed.at ? [this.o.embed.at] : (byStart || F.entry || m.def.entry)).slice(); this.entrySq = entry;
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
    // (a fight with its own cast -- `ownCast`: the Skylights, named and scripted, its waves by id -- keeps it inside the 8-bit game too; the 8-bit's list pays the XP on a win
    // (js/embed.js marks the whole list dead). 10-05 night: the 8-bit's two stone giants found one spot of their kind, and Steinarr -- his own kind -- never came)
    var only = this.o.embed && this.o.embed.only, list = this.o.embed && !F.ownCast && this.o.embed.enemies;
    var foes = (list ? this.roster(F.foes || m.def.foes, list, m, party) : (F.foes || m.def.foes).filter(function (f) { return !only || only.indexOf(f.kind) >= 0; }))
      .map(function (f) { return self.makeFoe(f); });
    // (a word that names no class and no named one may name a creature of the bestiary, data/foes.js: ?npc=hyena,hyena,hyena&vs=bard&lvl=3 --
    // the Pocket DM's monsters dropped in, 09-30, first for Hideous Laughter's hyena)
    var missed = [], LURK = { grick: 1, roper: 1, darkmantle: 1, xorn: 1, grimlock: 1, cube: 1, gelatinouscube: 1 }; // (the natural lurkers: the ones the story fights start hidden -- Griz 10-04, the Pocket DM's did not)
    if (NB && NB.foes && NB.foes.length) foes = this.seatBand(NB.foes.map(function (w, i) { var fid = 'f' + i + '-' + String(w).split(':')[0]; var b = D.npc.build(w, F.level, 'foe', { id: fid }) || (typeof w === 'string' && D.FOES[w] ? self.makeFoe({ id: fid, kind: w, hidden: !!LURK[w] }) : null); if (!b) missed.push(String(w)); return b; }).filter(Boolean), m, party);
    if (missed.length) console.warn('DEEP16: not a class or a bestiary monster: ' + missed.join(', '));
    if (this.o.embed && this.o.embed.revealed) foes.forEach(function (u) { u.hidden0 = false; }); // (seen coming: the roper under the ledger-lamp)
    var lent = (F.allies || []).map(function (f) { return self.makeFoe(Object.assign({ side: 'party', ally: true }, f)); }); // (ours for the fight, the brute's to run: the Skylights' stable fighters up the south road, the garrison behind the hatch -- 10-05)
    this.units = party.concat(foes, lent);
    if (this.o.flyTest) party.forEach(function (u) { if (!u.familiar) u.flies = true; }); // (&fly: the testing room's wings for the party -- flight at a height, 10-08)
    // (&legend and &breath=cold|fire|lightning|stone: the testing room's first foe made legendary -- three actions, a blow and Detect, three Legendary Resistances -- or given a breath,
    // the winter wolf's, a red's, a blue's, the gorgon's numbers; the rules before the monsters that use them, js/traits.js, 10-08)
    var f0T = foes[0], brT = this.o.breathTest && { cold: { name: 'Cold Breath', shape: 'cone', ft: 15, ab: 'dex', dc: 12, dice: '4d8', type: 'cold', recharge: 5 }, fire: { name: 'Fire Breath', shape: 'cone', ft: 15, ab: 'dex', dc: 13, dice: '7d6', type: 'fire', recharge: 5 }, lightning: { name: 'Lightning Breath', shape: 'line', ft: 30, ab: 'dex', dc: 12, dice: '4d10', type: 'lightning', recharge: 5 }, stone: { name: 'Petrifying Breath', shape: 'cone', ft: 30, ab: 'con', dc: 13, stone: true, recharge: 5 } }[this.o.breathTest];
    if (f0T && brT) f0T.breath = brT;
    if (f0T && this.o.legendTest) { var mkT = Object.keys(f0T.attacks || {}).filter(function (k) { return !f0T.attacks[k].ranged; })[0]; f0T.legendary = { n: 3, acts: [{ name: 'A Swipe', cost: 1, atk: mkT }, { name: 'Detect', cost: 1, detect: true }] }; f0T.legendaryResist = 3; }
    // the pack: DEEP16 lends every ladder and climb party a crossbow and bolts (save.js armoury); inside the 8-bit game the party
    // carries only what it brought (Griz, 09-27: "unless the players bring crossbows/range, they shouldn't have one")
    var pack = JSON.parse(JSON.stringify(this.from.data.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    this.inv = this.o.embed ? pack : D.save.armoury(pack);
    // a class hero's second weapon in the pack too, so a player's hand has what the class turn swaps to -- the rogue's shortbow (10-01c, the rogue runner: "a human
    // rogue needs a ranged weapon: EQUIP offers only the Lt. Crossbow"; Griz: "yes")
    if (!this.o.embed) { var inv0 = this.inv; party.forEach(function (u) { var aid = u.alt && (typeof u.alt === 'string' ? u.alt : u.alt.id); if (u.side === 'party' && u.npc && aid && window.DS.DATA.items[aid] && !inv0.some(function (s) { return s.id === aid; })) inv0.push({ id: aid, n: 1 }); }); } // (the unit's alt is the weapon as the grid reads it: its id)
    this.units.forEach(function (u) { u.anim = 'idle'; u.animT = 0; u.flash = 0; u.reaction = 1; u.conds = u.conds || {}; if (u.hp <= 0 && u.side === 'party') u.ko = true; if (u.hidden0) u.conds.hidden = true; });    G.setup(m, this.units);
    this.ropes = ((m.def && m.def.ropes) || []).map(function (r) { return { at: [r[0], r[1]], foot: [r[2], r[3]], hp: 2, fixed: true }; }); // (a map's ropes; a Rope & Grapple adds its own: grid.js G.ropeOn, exec 'rope')
    this.torchBarrel = m.def && m.def.torchBarrel ? m.def.torchBarrel.slice() : null; // (the Edifice's barrel of torches behind the houses south of the street: a lit torch for anyone beside it with a hand for one, free, endless -- 10-05 night, Griz; exec 'barreltorch')
    this.ropeBucket = m.def && m.def.ropeBucket ? m.def.ropeBucket.slice() : null; // (Fountain Street's bucket: a Rope & Grapple for anyone beside it, free, one a turn, endless -- 10-04 night, Griz; exec 'bucketrope')
    this.passages = ((m.def && m.def.passages) || []).map(function (p) { return { at: [p[0], p[1]], to: [p[2], p[3]], name: p[4] || 'the door' }; }); // (a door and its far side: the Edifice's vault to the roof -- 10-04 night, Griz: "Front doors possible?"; exec 'passage')
    // shut unless the fight opens them (Griz, 10-04 night: "that works, but turned off by default"): the fight's `passages: true`, the battle's option, the 8-bit's embed, or `&doors` on the URL
    this.passagesOpen = !!(F.passages || this.o.passages || (this.o.embed && this.o.embed.passages) || /[?&]doors\b/.test(location.search));
    m.doorsOpen = this.passagesOpen; // (the doors drawn: shut unless the passages are open -- iso.js draws a door square's open canvas while this is set; Battle.arrive opens them as the party comes out)
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
      var wr = party.filter(function (u) { return u.hp > 0 && u.src && DS.R.wears(u.src, 'ringofbinding'); })[0]; // (either ring hand, 10-06)
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
    // the fight's own sheets before its first frame, and what it may call on later fetched behind (10-03, the lazy sheets: Battle.sheets);
    // the spell gallery wants every creature a spell may call, so it has them all coming
    var want = this.sheets();
    D.spr.gate(this, want.now);
    D.spr.prefetch(want.soon);
    if (this.o.gallery) D.spr.ensureAll();
    if (F.arrive) this.offstage(); // (they walk in after the entry card: Battle.arrive -- their sheets are already asked for)
  };
  // the sheets a fight draws (10-03): `now`, what stands on the field as it opens -- every unit's figure (those still in the inn too),
  // a rider's, the scenery's -- which its first frame waits for; `soon`, what it may bring on later: the figure a split or a win swaps
  // in, a druid's wild shapes, the creatures its casters' spells call (the summons' pools, Polymorph's beasts, a conjured elemental, the
  // familiars, Guardian of Faith's guard), fetched behind it at low priority. One missed here is fetched as it is first drawn (js/sprites.js S.draw)
  Battle.prototype.sheets = function () {
    var now = [], soon = [], kinds = [], add = function (to, n) { if (n && to.indexOf(n) < 0) to.push(n); };
    var all = this.units.concat(this.reserve || [], this.stayed || []);
    all.forEach(function (u) { add(now, u.sheet); add(now, u.rider); add(soon, u.small); });
    (this.riders || []).forEach(function (r) { add(now, r.sheet); add(soon, r.after); });
    var kind = function (k) { if (k && kinds.indexOf(k) < 0) kinds.push(k); };
    all.forEach(function (u) {
      if (u.cls === 'druid' && D.features && D.features.beastsFor) D.features.beastsFor(u).forEach(kind);
      (u.known || []).concat(u.prepared || []).forEach(function (id) {
        var SM = D.SUMMON && D.SUMMON[id];
        if (SM && SM.fixed) Object.keys(SM.fixed).forEach(kind);
        else if (SM && D.pool) D.pool(SM.type, Math.max.apply(null, SM.options.map(function (o) { return o[1]; }))).forEach(function (p) { kind(p.kind); });
        if (id === 'polymorph' && D.pool) D.pool('beast').forEach(function (p) { kind(p.kind); });
        if (id === 'conjureelemental' && D.walls && D.walls.elementals) D.walls.elementals().forEach(kind);
        if (id === 'guardianoffaith') kind('guard');
        if (id === 'findfamiliar') Object.keys(D.FOES).forEach(function (k) { if (/^fam_/.test(k)) kind(k); });
      });
    });
    kinds.forEach(function (k) { add(soon, D.FOES[k] && D.FOES[k].sheet); });
    return { now: now, soon: soon.filter(function (n) { return now.indexOf(n) < 0; }) };
  };

  // the 8-bit game's monster ids where DEEP16's kinds differ (its drow are DEEP16's drowlings; its blade-captain, DEEP16's drow)
  var KIND8 = { drow: 'drowling', drowcaptain: 'drow' };
  D.kind8 = function (id8) { return KIND8[id8] || id8; };
  D.id8 = function (kind) { var k = Object.keys(KIND8).filter(function (i) { return KIND8[i] === kind; })[0]; return k || (KIND8[kind] ? null : kind); }; // (and back: our kind's 8-bit id -- none for a kind that is only the 8-bit's name for another)
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
    // (a Large or Huge one needs its whole footprint on open ground, and none of it taken: the Pocket DM seats the bestiary here too -- 10-02)
    var fits = function (u, p, loose) {
      var s = u.size || 1;
      for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) { var q = m.at(p[0] + i, p[1] + j); if (!q || !q.walk || taken[(p[0] + i) + ',' + (p[1] + j)]) return false; }
      if (loose) return true;
      for (var jj = -1; jj <= s; jj++) for (var ii = -1; ii <= s; ii++) if (taken[(p[0] + ii) + ',' + (p[1] + jj)]) return false;
      return true;
    };
    band.forEach(function (u) {
      var at = pts.filter(function (p) { return fits(u, p, false); })[0] || pts.filter(function (p) { return fits(u, p, true); })[0] || pts.filter(function (p) { return !taken[p[0] + ',' + p[1]]; })[0];
      if (!at) return;
      u.x = at[0]; u.y = at[1]; u.facing = 1;
      var s = u.size || 1; for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) taken[(at[0] + i) + ',' + (at[1] + j)] = 1;
    });
    return band;
  };
  // a story fight: one the 8-bit game sent (this.o.embed), or a story fight's own (data/fights.js `story`) at its door or on the bench -- never the Pocket DM,
  // the class floor or the climb. (10-06, Griz: "Can we successfully differentiate between ... the game grid and the pocket DM grid?")
  Battle.prototype.isStory = function () { return !!(this.o.embed || (this.fight && this.fight.story && !this.o.pocket && !this.o.npc && !this.o.climb)); };
  Battle.prototype.makeFoe = function (f) {
    var d = D.FOES[f.kind];
    // a sheet's `srd`: the SRD's reading of it everywhere but the story, which keeps its own (the cloaker's grip, an egg -- RULED 10-06, Griz: "Story Cloaker is riding
    // as is for the time being, it's an easter egg one. Cloaker's that are used in the Pocket DM should match SRD")
    if (d && d.srd && !this.isStory()) d = Object.assign({}, d, d.srd);
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
      id: f.id, kind: f.kind, name: f.name || d.name, fname: !!f.name, i8: f.i8, side: f.side || 'foe', ally: !!f.ally, hatch: !!f.hatch, free: !!f.free, sheet: d.sheet, type: d.type || null, cr: d.cr, rider: d.rider || null, x: f.at ? f.at[0] : 0, y: f.at ? f.at[1] : 0, facing: 1, // (a fight's own name for it: the Skylights' giants, 10-05; side 'party' with `ally`: one of ours the brute runs -- the Hex's stable fighters, the garrison behind the hatch (`hatch`: held till it opens); `free`: no mission)
      hp: d.hp, maxhp: d.hp, baseAC: d.ac, speed: d.speed, size: d.size, reach: d.reach, abil: d.abil, saves: d.saves,
      // (athletics: the block's own skill -- the stone giant's +12 never reached the unit, so his Shove rolled STR's +6: 10-05 night, the Skylights show's find)
      init: d.init, perception: d.perception, athletics: d.athletics != null ? d.athletics : undefined, attacks: d.attacks, multi: d.multi, jaunt: d.jaunt, faerie: d.faerieFire ? JSON.parse(JSON.stringify(d.faerieFire)) : null,
      fey: !!d.fey, webWalker: !!d.webWalker, regen: d.regen || 0, conds: {}, lvl: 5, inorganic: !!d.inorganic, // (inorganic: stone, crystal or metal -- Shatter's save at disadvantage, js/magic.js; 10-06)
      climbs: d.climbs || 0, // (a climb speed, SRD 5.1: up and down a map's cliffs at no extra cost, no check -- grid.js G.climbsUp, 10-04)
      spiderClimb: !!d.spiderClimb, // (Spider Climb, SRD 5.1: it climbs "without needing to make an ability check" -- read as the hold no blow shakes off the face: hurt, below; a push still does. data/foes.js giantspider -- 10-05 night)
      // the bestiary's traits (09-27, the ladder): read by rules.js (packTactics), hurt() (resist/immune/vulnerable),
      // ai.js brute() (web, slam, bound, martial, surprise) and attack() (a grapple on a hit)
      packTactics: !!d.packTactics, resist: d.resist || null, immune: d.immune || null, vulnerable: d.vulnerable || null,
      // condition immunities cross from the 8-bit sheet (review 09-28 #9: the Keeper is not webbed, the pudding not put to sleep, the
      // roper not knocked down); a grid-only kind names its own. Light sensitivity (#7): bright light (the Light cantrip, Daylight)
      // costs it its next turn the first time and disadvantage while the light holds, as the 8-bit battle's dazzle does
      // (the 8-bit sheet by the 8-bit's own id: its drow is our drowling, its blade-captain our drow -- KIND8 read backwards; 10-06, it was looked up by our kind)
      condImmune: (d.condImmune || (window.DS.DATA.monsters[D.id8(f.kind)] || {}).condImmune || null),
      lightSensitive: !!(d.lightSensitive || ((window.DS.DATA.monsters[D.id8(f.kind)] || {}).traits || {}).lightSensitive),
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
      flees: !!d.flees && !(this.fight && (this.fight.noFlee || this.fight.runWhenHurt)), traces: !!f.traces, transfer: !!d.transfer, images: 0, named: !!d.named || !!f.name, swims: !!d.swims, swarm: !!d.swarm, noProne: !!d.noProne,
      moan: d.moan ? Object.assign({ ready: true }, d.moan) : null,
      gibber: d.gibber || null, aberrant: d.aberrant || null, spittle: d.spittle ? Object.assign({ ready: true }, d.spittle) : null, // (the gibbering mouther, SRD 5.1: js/traits.js, ai.js spit -- 10-06)
      leap: d.leap ? Object.assign({ ready: true }, d.leap) : null,
      phantasms: d.phantasms ? { when: d.phantasms, used: false } : null,
      darkness: d.darkness ? { r: d.darkness.r, range: d.darkness.range, chance: d.darkness.chance, used: false } : null, // (Amara's, once, the turn she runs; the drow's on the 8-bit's chance: magic.js castDarkness)
      hidden0: !!f.hidden,
      from0: f.from ? f.from.slice() : null, // (walks in from there to `at` before the first round: a fight's `arrive` -- the Edifice's foes down the north road, Battle.arrive, 10-05)
      then0: f.then ? f.then.slice() : null, // (a second leg of the walk-in, a wave's `move`: the Skylights' front trolls come on down the street -- 10-05)
      ownRope: f.rope != null ? f.rope : f.ally ? 0 : undefined, // (a lent ally's own Rope & Grapple -- the garrison's one each; never the party's pack: exec 'rope', ai.js ropeUp, 10-05)
      chase: f.chase ? { to: f.chase.to.slice(), till: f.chase.till || 1 } : null, // (a scripted run for its first rounds: the Skylights' first trolls after the street's people, ai.js brute, 10-05)
      keepLevel: !!f.keepLevel, // (holds its level: no step down 10 ft or more -- the garrison keeps the roof, grid.js stepCost, 10-05)
      climbAt: f.climbAt ? f.climbAt.slice() : null, // (the columns a roof guard goes up the face by: Hallvör's west bay, away from the vault doors -- ai.js brute, 10-05 night)
      missionOnly: !!f.only, guard: f.guard || null, rocks: f.rocks != null ? f.rocks : null,
      roofGuard: !!f.roofGuard, noGlass: !!f.roofGuard, streetFirst: !!f.streetFirst, huntsClimbers: !!f.huntsClimbers, // (huntsClimbers: any of ours on a rope or a face first -- the Skylights' spiders, ai.js brute, 10-05 evening) // (the roof first and never the glass -- Hallvör; the street first while anyone it can see stands on it -- the trolls: ai.js brute, 10-05) // (nothing but the mission's target; guarding the one with that id; the rocks it carried -- the Skylights' giants and trolls, ai.js brute, 10-05)
      // senses (SRD 5.1; torchdark 09-28): how far it sees in the dark, or by blindsight (and blind past it: the oozes, the darkmantle),
      // and what it does with the dark itself (the darkmantle's aura, the duergar's Invisibility: ai.js brute)
      darkvision: d.darkvision || 0, blindsight: d.blindsight || 0, tremor: !!d.tremor, blind: !!d.blind, truesight: d.truesight || 0, devilSight: !!d.devilSight,
      aura: d.darknessAura ? { used: false } : null, invis: d.invisibility ? { used: false, atWill: d.invisibility === 'atwill' } : null, glow: d.glow || null, // (glow: a creature that sheds light -- the will-o'-wisp; js/light.js L.carried)
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
    this.forced(u); // (set down by another's doing: the readied strikes are asked when the action is done -- readyForced, the grid's rules §2.5)
    if (host && !u.dead && u.hp > 0) this.card(['{g}The ' + shortName(u) + ' drops off ' + nameOf(host) + ' to the floor beside.{/}'], 220);
  };
  // a creature's size where a rule names one (SRD 5.1: Tiny 0, Small 1, Medium 2, Large 3, Huge 4, Gargantuan 5): its body's squares (one Medium, two Large, three Huge,
  // four Gargantuan); a one-square body Small by its race (a halfling, a gnome) or a split ooze's `sizeClass`, Tiny a familiar; a beast's shape its own size (Wild Shape and
  // Polymorph keep the druid's square on the grid: the giant spider is Large all the same -- the grid's rules §2.3, 10-06); Enlarge a size up, Reduce one down
  Battle.SIZE = { T: 0, S: 1, M: 2, L: 3, H: 4, G: 5 };
  // the size a grip takes: its sheet's `grapple.size`; the ladder's old Keeper's record is frozen as it stood at ed7be2a (RULED 10-03, "the ladder's fight is the old fight
  // unchanged": dev/keeper-probe.py diffs it field for field), so its Water Weird's "Medium or smaller" is kept here
  var GRIP_SIZE = { keeperold: 'M' };
  function gripSize(att, atk) { return (atk.grapple && atk.grapple.size) || GRIP_SIZE[att.kind] || null; }
  Battle.gripSize = gripSize;
  Battle.sizeCat = function (u) {
    var bf = u.beast && D.FOES && D.FOES[u.beast.kind], n = bf ? (bf.size || 1) : (u.size || 1);
    var c = n > 1 ? n + 1 : (bf ? 2 : u.sizeClass === 'S' || /halfling|gnome/i.test(u.race || '') ? 1 : u.familiar ? 0 : 2);
    var en = u.conds && u.conds.enlarged; if (en) c += en.down ? -1 : 1;
    return Math.max(0, Math.min(5, c));
  };
  // bigger than Medium: two squares and more, or a Medium (not a halfling's or a gnome's Small) Enlarged a size up (SRD 5.1 Enlarge: "from Medium to Large"), or in a Large beast's shape
  Battle.overMedium = function (u) { return Battle.sizeCat(u) > Battle.SIZE.M; };
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
  // the floor (10-03, Griz: "1 - yes", to: a fight that breaks mid-way goes back where it came from as it was): a fight with a way back -- the Pocket DM, the
  // ladder, the climb (o.onDone) -- that throws in its turn, or whose picture keeps failing (DRAW_BAD frames in a row; one bad frame is logged and it plays on),
  // ends there: the play record kept as 'broke', and the host told { broke, how } through onDone with no result. Inside the 8-bit game the 8-bit takes the fight
  // instead (js/embed.js d16:crash); a bench, a gallery or a bare URL keeps the throw where it can be seen
  Battle.DRAW_BAD = 30;
  Battle.prototype.floorable = function () { return !this.o.embed && !this.o.bench && typeof this.o.onDone === 'function'; };
  Battle.prototype.broke = function (e, how) {
    if (this.brokeHow) return;
    this.brokeHow = how;
    var msg = String(e && e.message || e || 'unknown error');
    if (window.console) console.error('DEEP16: the fight broke (' + how + '); back to where it came from', e);
    if (this.rec && D.rec && D.rec.finish) { try { (this.rec.errors = this.rec.errors || []).push(how + ': ' + msg); D.rec.finish(this, 'broke'); } catch (e2) { /* (the record as far as it went) */ } }
    this.co = null; this.req = null; this.menu = null;
    if (D.top() === this) D.pop();
    D.music('title');
    this.o.onDone(null, { broke: msg, how: how });
  };
  Battle.prototype.update = function () {
    if (this.baking) { if (++this.bakeT >= 2) { this.baking = false; this.enter(); } return; } // (the baking frame: Battle.prototype.bakes)
    if (!this.floorable()) return this.frame();
    if (this.paintBroke) return this.broke(this.paintBroke, 'drawing the field'); // (out of the draw loop first: the scenes are not changed under it)
    try { this.frame(); } catch (e) { this.broke(e, 'in a turn'); }
  };
  Battle.prototype.frame = function () {
    if (D.spr.held(this)) return; // (its figures still coming: the beat is drawn, and nothing moves -- js/sprites.js S.gate)
    this.t++;
    if (this.shakeT > 0) this.shakeT--;
    FX.update();
    this.units.forEach(function (u) { if (u.flash > 0) u.flash--; if (u.tween) { u.tween.t++; if (u.tween.t >= u.tween.dur) delete u.tween; } });
    this.flyCheck(); // (a flier aloft that can no longer stay up falls: flight at a height, 10-08)
    this.cards = this.cards.filter(function (c) { return this.t - c.t0 < c.life; }, this);
    if (D.magic.laughTick) { if (this.req && this.req.scene) D.magic.laughHold(this); else D.magic.laughTick(this); } // (a gnoll's fit and its laughs on their beats, js/grimoire.js M.LAUGH -- held still under a cutscene beat, the egg's: the fight pauses)
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
    if (D.STREAM) ls = RU.streamLines(ls); // (the stream, 10-07: names and numbers, no dice -- js/rules.js RU.streamLines; &stream or ?gameshow, js/core.js D.STREAM)
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
    // the skylight broken (a defend fight, 10-04 night): the Edifice is breached, and it is lost
    if (this.units.some(function (u) { return u.object && u.breachLoses && (u.dead || u.hp <= 0); })) return 'lost';
    // (a foe turned wholly to stone -- Flesh to Stone's third failed save -- holds no fight open: it had stalled one for good, 10-01)
    if (!this.alive('foe').filter(function (u) { return !u.summon && !u.dominated && !u.conds.petrified && !(u.conds.stoning && u.conds.stoning.done); }).length && !this.units.some(function (u) { return u.side === 'foe' && u.regenDown && !u.dead; }) && !(this.late || []).some(function (l) { return l.foes && l.foes.length && l.round !== Infinity; })) return 'won'; // (a troll down and knitting holds it open: 10-05) (so does a late wave of foes still to come: Battle.lateOut -- not one held for a call that never came, the Skylights' spiders, 10-05 evening)
    // one who yields when he is beaten (the cleric at Deepholm's door): at half his hit points, standing, it is over (the
    // 8-bit battle's `yields`: a blow that drops him from above half to nothing kills him instead)
    if (this.units.some(function (u) { return u.side === 'foe' && u.yields && u.hp > 0 && u.hp <= u.maxhp / 2; })) return 'yielded';
    // one whose fall ends it (a guest the party swore to bring back: Corwen Dace in the deep gallery -- RULED 10-01c, Griz: "game over if the kid falls")
    if (this.units.some(function (u) { return u.vital && u.side === 'party' && (u.dead || u.hp <= 0); })) return 'lost';
    // one of the party killed outright in a story fight (massive damage, Battle.hurt): the game is over (RULED 10-06)
    if (this.slainLost) return 'lost';
    // one out, all out (a fight's `oneLeavesAll`: the Wet since 09-30e, the Keeper 10-04 -- Griz: "can we do the 'pull the rest of the party' we do with the Wet escape?")
    if (this.fight && this.fight.oneLeavesAll && this.units.some(function (u) { return u.side === 'party' && u.left && !u.familiar && !u.summon && !u.ally; })) return 'escaped';
    // none of the party left on the field: lost, unless one of them got out (the climb's campfire; Griz, 09-27), or the rest
    // are still on their way out of the inn (this.reserve)
    // (a familiar left alone keeps no fight going, and one sent to its pocket of the world got nobody out)
    // (nor do summoned creatures: they go when their caster's concentration does)
    // (nor a hero turned to stone -- Flesh to Stone's third failed save, the foe side's test above: it never acts again; a party all stone is a lost fight, 10-01)
    if (!this.alive('party').filter(function (u) { return !u.object && !u.familiar && !u.summon && !u.ally && !u.dominated && !u.loose && !(u.conds && (u.conds.petrified || (u.conds.stoning && u.conds.stoning.done))); }).length) return this.reserve.length || (this.late || []).some(function (l) { return l.party; }) ? null : this.units.some(function (u) { return u.left && !u.familiar && !u.summon; }) ? 'escaped' : 'lost'; // (the party still behind the doors is no lost fight: Battle.lateOut, 10-05)
    return null;
  };
  // the rest of the party out of the inn (the lone investigator's round-two help): onto the free squares nearest the fight's
  // entry, each on its own initiative
  Battle.prototype.joinReserve = function* () {
    var self = this, come = this.reserve, e0 = (this.entrySq || this.fight.entry || this.map.def.entry)[0], names = []; // (this.entrySq: the squares the party came in on -- a named start's, Battle.enter)
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

  // the way from where it stands to a square, eight ways, round the walls (and round the others too, when `solid`), on the level it starts from (the street's ground; the roof's
  // glass for the garrison out of the hatch, 10-05): the steps, not the square it starts on
  Battle.route = function (u, to, solid) {
    var key = function (x, y) { return x + ',' + y; }, prev = {}, q = [[u.x, u.y]], seen = {}, z0 = G.gzAt(u, u.x, u.y); seen[key(u.x, u.y)] = 1;
    var ok = function (x, y) { return G.canStand(u, x, y, solid ? null : { ghost: true }) && Math.abs(G.gzAt(u, x, y) - z0) <= G.map.def.step; }; // (on its own level: a climber's big body may straddle any face, and the walk-in took the trolls over the top of the facade above the first fountain -- 10-05, Griz: "Monsters are walking on top of the wall over the first fountain on entry")
    while (q.length) {
      var c = q.shift(); if (c[0] === to[0] && c[1] === to[1]) break;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = c[0] + dx, ny = c[1] + dy; if ((!dx && !dy) || seen[key(nx, ny)]) continue;
        if (!ok(nx, ny) || (dx && dy && (!ok(c[0] + dx, c[1]) || !ok(c[0], c[1] + dy)))) continue; // (no corner cut past a wall)
        seen[key(nx, ny)] = 1; prev[key(nx, ny)] = c; q.push([nx, ny]);
      }
    }
    if (!seen[key(to[0], to[1])]) return null;
    var out = [], p = to; while (p && !(p[0] === u.x && p[1] === u.y)) { out.unshift(p); p = prev[key(p[0], p[1])]; }
    return out;
  };
  // walk a file of them in: each { u, from, to, face, froms? -- its own other ways in }, the next set down on its `from` once that is clear, a step each a beat (the Skylights' waves, Battle.arrive; the garrison
  // out of the hatch, Battle.hatchOut -- 10-05)
  Battle.prototype.walkIn = function* (file, look) {
    var self = this, U = this.units, pending = file.slice(), going = [], guard = 0;
    var froms = []; file.forEach(function (f) { if (!froms.some(function (q) { return q[0] === f.from[0] && q[1] === f.from[1]; })) froms.push(f.from); });
    // (a late wave walks onto a street already fought over -- 10-05, Griz: "seemed like i broke it when the dwarves came outside, but I think it came back": a trooper's square was taken,
    // it gave up on the vault's doorstep, and the next one out of that door waited the walk-in's whole guard, twenty seconds, before it was set down. Now a square taken is traded for the
    // nearest open one, never a door or a road's mouth the file comes in by; one waiting on a blocked way in takes another of the file's)
    var retarget = function (g) { if (G.canStand(g.u, g.to[0], g.to[1])) return false; var alt = Battle.nearSq(g.u, g.to, froms); if (!alt) return false; g.to = alt; return true; };
    while ((pending.length || going.length) && guard++ < 150) {
      var nx0 = pending[0];
      if (nx0) { var hx = nx0.u.x, hy = nx0.u.y; nx0.u.x = nx0.from[0]; nx0.u.y = nx0.from[1];
        // (its way in blocked: another of the file's -- its own `froms` when it has them, the nearest first. 10-08, Griz: "one of the rats in the game show (tier 1 wave 2/2) starts
        // from the north and runs past everyone to join the other 2": the file's first clear way in was the goblins' west road, and a rat walked the whole hall)
        if (!G.canStand(nx0.u, nx0.u.x, nx0.u.y)) { var f0 = nx0.from, frA = (nx0.froms || froms).filter(function (q) { return G.canStand(nx0.u, q[0], q[1]); }).sort(function (a, b) { return Math.hypot(a[0] - f0[0], a[1] - f0[1]) - Math.hypot(b[0] - f0[0], b[1] - f0[1]); })[0]; if (frA) { nx0.from = frA; nx0.u.x = frA[0]; nx0.u.y = frA[1]; } }
        if (G.canStand(nx0.u, nx0.u.x, nx0.u.y)) {
          pending.shift(); U.push(nx0.u); (nx0.riders || []).forEach(function (r) { U.push(r); });
          retarget(nx0); nx0.u.anim = 'idle'; nx0.u.animT = self.t; nx0.steps = Battle.route(nx0.u, nx0.to) || []; nx0.held = 0; going.push(nx0);
          if (nx0.spark) FX.sparkle(nx0.u, 'gold', 10);
        } else { nx0.u.x = hx; nx0.u.y = hy; }
      }
      going.forEach(function (g) {
        for (var sN = 0, nS = g.dash ? 2 : 1; sN < nS && g.steps.length; sN++) { // (`dash`: two squares a beat, the tween sliding both -- the Skylights' first trolls at a run, 10-05)
          var to = g.steps[0];
          if (!G.canStand(g.u, to[0], to[1])) { if (++g.held % 4 === 0) { if (retarget(g)) g.held = 0; var r2 = Battle.route(g.u, g.to, true); if (r2) g.steps = r2; else if (g.held >= 8) g.steps = []; } return; } // (another in the way: wait, then go round -- its own square taken, the nearest open one instead -- and with no way round, it stops where it is: 10-05, Griz: "is it freezing with the second troll still trying to walk?")
          g.held = 0; g.steps.shift();
          if (!sN) g.u.tween = { fx: g.u.x, fy: g.u.y, fz: G.gzAt(g.u, g.u.x, g.u.y), t: 0, dur: STEP_FRAMES, mode: null };
          g.u.facing = D.spr.facingFor(to[0] - g.u.x, to[1] - g.u.y); g.u.anim = 'walk'; g.u.x = to[0]; g.u.y = to[1];
        }
      });
      going = going.filter(function (g) { if (g.steps.length && guard < 149) return true; if (g.u.x !== g.to[0] && G.canStand(g.u, g.to[0], g.to[1])) { g.u.x = g.to[0]; g.u.y = g.to[1]; } g.u.anim = 'idle'; g.u.facing = g.face; return false; });
      if (look) look(going[0] || file[file.length - 1]);
      yield STEP_FRAMES;
    }
    pending.forEach(function (p) { var to = G.canStand(p.u, p.to[0], p.to[1]) ? p.to : Battle.nearSq(p.u, p.to); if (to) { p.u.x = to[0]; p.u.y = to[1]; U.push(p.u); (p.riders || []).forEach(function (r) { U.push(r); }); p.u.anim = 'idle'; p.u.facing = p.face; } }); // (one that never got its way in: set down where it was to stand -- or, that taken, the nearest open square on its level: a late wave comes in on a street already fought over, 10-05)
  };
  // the nearest square to `to` that u may stand on, on to's own level, a ring at a time (Battle.walkIn's last resort)
  Battle.nearSq = function (u, to, avoid) { // (avoid: squares not to settle on -- a walk-in's doors and road mouths, 10-05)
    var z0 = G.map.gz(to[0], to[1]), st = G.map.def.step;
    for (var r = 1; r <= 8; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var x = to[0] + dx, y = to[1] + dy, s = G.map.at(x, y);
      if ((avoid || []).some(function (q) { return q[0] === x && q[1] === y; })) continue;
      if (s && G.canStand(u, x, y) && Math.abs(G.map.gz(x, y) - z0) <= st) return [x, y];
    }
    return null;
  };
  // a fight's opening before the first round (a fight's `arrive`; the Edifice's, 10-05, Griz: "Have pyro come out followed by the party then the doors lock behind them. Have the
  // monsters come from the north road, the team pop out and then initiative" -- and the same day, the waves: "villagers that flee from the buildings to the south road as 2 trolls
  // come in, then a group of 4 from each of silverton's stables that will engage those trolls, with the two that come in with the giants and the party popping out after"): the
  // waves in their order (arrive.waves: each { foes: [ids], allies: [ids], flee: { from: [[x, y]], to: [[x, y]] }, card } -- with none, every foe with a `from` as one wave under
  // arrive.road): the foes walk in from their `from` to the squares they hold, in step, each setting off when its way in is clear, the townsfolk running for the south road beside the
  // first (made here, gone once they are down it), the lent allies up from theirs; then the doors (arrive.doors) stand open and the party comes out of them -- its guests first, then
  // the four in their order -- each to the square it was seated on; then the doors shut behind them (arrive.lock), and the fight rolls initiative. Before the fight: nothing spent, no
  // one provoked. A bench counts the beats (mode=skylights1005)
  Battle.prototype.arrive = function* () {
    var self = this, A = this.fight.arrive, U = this.units, m = this.map;
    var W8 = this.arriving || this.offstage(), foes = W8.foes, ours = W8.ours, riders = W8.riders, allies = W8.allies || []; this.arriving = null;
    var byId = function (ids, pool) { return (ids || []).map(function (id) { return pool.filter(function (u) { return u.id === id; })[0]; }).filter(Boolean); };
    var look = function (g) { if (g) self.keepInView(g.u); };
    var waves = A.waves || [{ foes: foes.map(function (u) { return u.id; }), card: A.road }];
    var late = this.late = this.late || []; // (a wave with a `round`, and the party when arrive.party has one: held off the field till the start of that round -- Battle.lateOut, 10-05)
    this.beats = 0;
    for (var w = 0; w < waves.length; w++) {
      if (waves[w].round || waves[w].king || waves[w].whistle) { late.push({ round: waves[w].round || Infinity, king: waves[w].king || 0, whistle: !!waves[w].whistle, wave: waves[w], foes: byId(waves[w].foes, foes), allies: byId(waves[w].allies, allies) }); continue; } // (`king`: held with no round till the king goes up his own way -- js/pyro.js S.toRoof gives it one; the Skylights' second garrison wave, 10-05 evening) (`whistle`: held till the fight's `whistler` calls it -- ai.js whistle; the Skylights' spiders, the same evening)
      var wv = waves[w], fs = byId(wv.foes, foes), als = byId(wv.allies, allies), mvs = byId(wv.move, U).filter(function (u) { return u.then0; }), file = [];
      if (fs.length) { this.focus({ x: fs[0].from0[0], y: fs[0].from0[1] + 4, size: fs[0].size }); D.sfx('encounter'); }
      else if (als.length) { this.focus({ x: als[0].from0[0], y: als[0].from0[1] - 4, size: 1 }); D.sfx('popup'); }
      else if (mvs.length) this.focus(mvs[0]);
      if (wv.card) this.card([wv.card], 360);
      fs.forEach(function (u) { file.push({ u: u, from: u.from0, to: [u.x, u.y], face: D.spr.facingFor(1, 0), dash: !!wv.dash }); });
      mvs.forEach(function (u) { file.push({ u: u, from: [u.x, u.y], to: u.then0.slice(), face: D.spr.facingFor(1, 0) }); }); // (a second leg for those already on the field, to each one's `then` -- 10-05, Griz: "give the front trolls another move before the troops arrive")
      var folk = wv.flee ? this.townsfolk(wv.flee) : [];
      folk.forEach(function (f) { file.push(f); });
      als.forEach(function (u) { file.push({ u: u, from: u.from0, to: [u.x, u.y], face: D.spr.facingFor(-1, 0) }); });
      if (file.length) { yield* this.walkIn(file, look); yield 30; }
      if (wv.flee && wv.flee.stay) self.folkStay = (self.folkStay || []).concat(folk.map(function (f) { return f.u; })); // (they wait at the road's foot till the next ones come up it -- Battle.lateOut; the Skylights' first trolls run at them, 10-05)
      else folk.forEach(function (f) { var k = U.indexOf(f.u); if (k >= 0) U.splice(k, 1); }); // (off down the south road and gone)
      this.beats++;
    }
    var lateU = []; late.forEach(function (l) { lateU = lateU.concat(l.foes || [], l.allies || []); });
    var left = foes.concat(allies).filter(function (u) { return U.indexOf(u) < 0 && lateU.indexOf(u) < 0; }); // (any the waves never named -- the bench's `plus` trolls -- come in last, down the road behind the rest)
    if (left.length) { yield* this.walkIn(left.map(function (u) { return { u: u, from: u.from0, to: [u.x, u.y], face: D.spr.facingFor(1, 0) }; }), look); yield 20; }
    if (ours.length && A.party && A.party.round) { late.push({ round: A.party.round, party: true, ours: ours, riders: riders }); return; } // (the party behind the doors till its round: Battle.lateOut)
    if (ours.length) yield* this.doorsOut(ours, riders);
  };
  // the party out of the doors (arrive.doors): its guests first (Pyro leads them out), then the four in their order, each to the square it was seated on; the doors shut behind them
  Battle.prototype.doorsOut = function* (ours, riders) {
    var self = this, A = this.fight.arrive, m = this.map, look = function (g) { if (g) self.keepInView(g.u); };
    var lead = function (u) { return (self.fight.guests || []).indexOf(u.id) >= 0 ? 1 : 0; }; // (the fight's own guests: the bench makes everyone a guest)
    ours.sort(function (a, b) { return lead(b) - lead(a); });
    m.doorsOpen = true; this.focus({ x: A.doors[0][0], y: A.doors[0][1] + 1, size: 1 }); if (A.open) this.card([A.open], 300); D.sfx('earth');
    yield 30;
    yield* this.walkIn(ours.map(function (u, i) { return { u: u, from: A.doors[i % A.doors.length], to: [u.x, u.y], face: D.spr.facingFor(-1, 0), spark: true, riders: (riders || []).filter(function (r) { return r.master === u; }) }; }), look);
    m.doorsOpen = this.passagesOpen;
    if (A.lock) { this.card(['{y}' + A.lock + '{/}'], 360); D.sfx('clack'); }
    yield 40;
  };
  // the late ones (10-05, Griz: "I'd also like to stall them another round (citizens go get them) and stall another round before the heroes show up (word went down the road quick and a
  // teleport is fast, but the action should be in play before they get there - potential lever)"): at the start of a wave's `round`, or arrive.party.round, they come in as they would
  // have before the first round -- a wave down its road under its card, the party out of the doors -- and are dealt into the order on their own rolls
  Battle.prototype.lateOut = function* () {
    var self = this, now = (this.late || []).filter(function (l) { return l.round <= self.round; }), look = function (g) { if (g) self.keepInView(g.u); };
    if (!now.length) return;
    this.late = this.late.filter(function (l) { return now.indexOf(l) < 0; });
    if (this.folkStay) { var U0 = this.units; this.folkStay.forEach(function (f) { var k = U0.indexOf(f); if (k >= 0) U0.splice(k, 1); }); this.folkStay = null; } // (the street's people at the road's foot, gone down it as the next ones come: a wave's flee.stay, 10-05)
    for (var i = 0; i < now.length; i++) {
      var l = now[i], before = this.units.slice();
      if (l.party) yield* this.doorsOut(l.ours, l.riders);
      else if (l.walk) { // (one on its way back onto the field -- Pyro out of the falls' curtain, js/pyro.js: its turn kept in the order)
        if (l.card) this.card(['{y}' + l.card + '{/}'], 320); this.focus({ x: l.walk[0].from[0], y: l.walk[0].from[1], size: 1 }); yield 20;
        yield* this.walkIn(l.walk.map(function (w) { return { u: w.u, from: w.from, to: w.to, face: w.face != null ? w.face : D.spr.facingFor(0, 1), spark: true }; }), look);
        l.walk.forEach(function (w) { delete w.u.away; });
      }
      else {
        var wv = l.wave, file = [];
        if (l.foes.length) { this.focus({ x: l.foes[0].from0[0], y: l.foes[0].from0[1] + 4, size: l.foes[0].size }); D.sfx('encounter'); }
        else if (l.allies.length) { this.focus({ x: l.allies[0].from0[0], y: l.allies[0].from0[1] - 4, size: 1 }); D.sfx('popup'); }
        if (wv.card) this.card([wv.card], 360);
        l.foes.forEach(function (u) { file.push({ u: u, from: u.from0, to: [u.x, u.y], face: D.spr.facingFor(1, 0), dash: !!wv.dash }); });
        l.allies.forEach(function (u) { file.push({ u: u, from: u.from0, to: [u.x, u.y], face: D.spr.facingFor(-1, 0) }); });
        if (file.length) { yield* this.walkIn(file, look); yield 20; }
        if (this.skylight) l.foes.forEach(function (u) { if (!u.free) u.mission = 'skylight'; });
      }
      var ordered = this.order; this.dealIn(this.units.filter(function (u) { return before.indexOf(u) < 0 && !u.familiar && !u.object && !u.look && ordered.indexOf(u) < 0; })); // (one back on the field keeps its place in the order)
      yield 30;
    }
  };
  // into the order on their own rolls, mid-fight (the garrison out of the hatch, the late waves)
  Battle.prototype.dealIn = function (came) {
    var self = this;
    came.forEach(function (u) {
      var d = D.d(20); if (u.initAdv) d = Math.max(d, D.d(20)); u.initRoll = d + u.init;
      var at = 0; while (at < self.order.length && (self.order[at].initRoll > u.initRoll || (self.order[at].initRoll === u.initRoll && self.order[at].abil.dex >= u.abil.dex))) at++;
      self.order.splice(at, 0, u);
    });
    if (came.length) this.card(['{y}INITIATIVE{/}  ' + came.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ')], 300);
  };
  // the street's people (a wave's `flee`, 10-05): townsfolk made for the look of it -- ours, no one's target, never in the order -- each at a door or an alley's mouth, running for a
  // square down the south road; walked with the wave by walkIn and taken off the field after. They wear the plain men's sheets for now (deep16-art-wanted.md)
  Battle.prototype.townsfolk = function (fl) {
    var self = this, kinds = ['crewman', 'thug', 'bandit', 'brawler'].filter(function (k) { return !!D.FOES[k]; }), out = [];
    (fl.from || []).forEach(function (fr, i) {
      var u = self.makeFoe({ id: 'folk' + i, kind: kinds[i % kinds.length], at: fr, side: 'party', ally: true });
      u.name = 'Townsfolk'; u.look = true; u.attacks = {}; u.multi = 1; u.hp = u.maxhp = 4; u.lvl = 1;
      var to = (fl.to || [])[i % Math.max(1, (fl.to || []).length)] || fr;
      out.push({ u: u, from: fr, to: to, face: D.spr.facingFor(0, 1) });
    });
    return out;
  };
  // the garrison out of the hatch (the fight's `hatch`: { from: [[x, y]], after: rounds, card }, its allies those marked `hatch`, held off the field; 10-05, Griz: "In the 8 bit
  // there's a solskaft guy 'drilling' soldiers (I think 4?) that group could come out the top door when the first bang hits the skylight (next round, maybe 2 after)"): `after` rounds
  // past the first blow that hurts the glass (Battle.hurt sets skyHit; 1, the seat's call between his "next round, maybe 2 after"), they walk out of the hatch's squares onto the roof
  // to the squares they hold, roll initiative and are dealt into the order
  Battle.prototype.hatchOut = function* () {
    var self = this, H = this.fight.hatch, held = this.held || []; this.held = [];
    if (!H || !held.length) return;
    if (H.doors) { this.map.doorsOpen = true; D.sfx('earth'); } // (out of the vault's doors, the leaves open while they come -- the Skylights since 10-05 late)
    this.focus({ x: H.from[0][0], y: H.from[0][1] + (H.doors ? 1 : 0), size: 1 }); D.sfx('clack'); if (H.card) this.card(['{y}' + H.card + '{/}'], 420); yield 30;
    yield* this.walkIn(held.map(function (u, i) { return { u: u, from: H.from[i % H.from.length], to: [u.x, u.y], face: D.spr.facingFor(0, H.doors ? 1 : -1), spark: true }; }), function (g) { if (g) self.keepInView(g.u); });
    if (H.doors) this.map.doorsOpen = this.passagesOpen;
    var dealt = held.filter(function (u) { return self.units.indexOf(u) >= 0; });
    dealt.forEach(function (u) {
      u.initRoll = D.d(20) + u.init;
      var at = 0; while (at < self.order.length && (self.order[at].initRoll > u.initRoll || (self.order[at].initRoll === u.initRoll && self.order[at].abil.dex >= u.abil.dex))) at++;
      self.order.splice(at, 0, u);
    });
    this.hatched = this.round;
    this.card(['{y}INITIATIVE{/}  ' + dealt.map(function (u) { return shortName(u) + ' ' + u.initRoll; }).join(' · ')], 300);
    yield 30;
  };
  // off the field until they arrive (Battle.enter, as soon as everyone is made, so the entry card shows an empty street): the foes on the road and everyone behind the doors, kept
  // on this.arriving with the squares they were seated on (a bench marks this.arriving.ours as it marks the units)
  Battle.prototype.offstage = function () {
    var U = this.units, A = this.fight.arrive || {};
    var foes = U.filter(function (u) { return u.side === 'foe' && u.from0; }), ours = A.doors ? U.filter(function (u) { return u.side === 'party' && !u.object && !u.riding && !u.ally; }) : [];
    var allies = U.filter(function (u) { return u.ally && u.from0 && !u.hatch; }), held = U.filter(function (u) { return u.ally && u.hatch; }); // (the lent ones that walk in with a wave; those held behind the hatch till it opens -- Battle.hatchOut, 10-05)
    var riders = U.filter(function (u) { return u.riding && ours.indexOf(u.master) >= 0; });
    foes.concat(ours, riders, allies, held).forEach(function (u) { U.splice(U.indexOf(u), 1); });
    this.held = held;
    return (this.arriving = { foes: foes, ours: ours, riders: riders, allies: allies });
  };
  // a line said the first time a foe goes up a face (a fight's `climbLine`, { who, line }; the Edifice's, 10-05, Griz: "Have pyro say 'they're going for the skylights' when the first one
  // climbs?"): after the turn it climbed in, 10 ft or more up or clinging to the face, by the one the fight names -- if that one is up to say it
  Battle.prototype.climbSay = function* () {
    var CL = this.fight.climbLine, st = this.map.def.step;
    if (!CL || this.climbSaid) return;
    var up =this.units.filter(function (w) { return w.side === 'foe' && G.standing(w) && ((w.hang && w.hang.face && G.hanging(w)) || G.gzAt(w, w.x, w.y) >= 4 * st); })[0];
    if (!up) return;
    var who = this.units.filter(function (w) { return (w.id === CL.who || w.kind === CL.who) && G.standing(w) && !w.left; })[0];
    if (!who) return; // (not out yet -- the party late behind the doors, 10-05: he says it when he is, if one is still up there)
    this.climbSaid = true;
    this.focus(up); D.sfx('popup');
    this.card(['{y}' + who.name + '{/}: "' + CL.line + '"'], 420);
    yield 50;
  };

  // the defend fight's glass on the field (run, below; and the Skylights show, js/skyshow.js, 10-05 night)
  Battle.prototype.skyUp = function () {
    // (spellProof: no spell aimed at it takes it, whatever its words say of objects -- Shatter's area alone reaches it, magic.js area. 10-05 night, Griz: "we got 1 thunder spell
    // that's AoE should damage - and as far as I know, we're not letting other ones impact it"; before, "SRD only shatter is even nicer")
    var skd = this.map.def.skylight, sky = { id: 'skylight', name: skd.name || 'the skylight', kind: 'object', object: true, spellProof: true, breachLoses: true, side: 'party', x: skd.at[0], y: skd.at[1], size: 1, hp: skd.hp || 120, maxhp: skd.hp || 120, ac: skd.ac || 13, threshold: skd.threshold || 0, resistAll: true, immune: ['poison', 'psychic'], condImmune: { all: true }, abil: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, saves: {}, conds: {}, attacks: {}, speed: 0, initRoll: -99, lvl: 1, prof: 0, sheet: null, facing: 0 };
    this.units.push(sky); this.skylight = sky;
    this.units.forEach(function (w) { if (w.side === 'foe' && !w.free) w.mission = 'skylight'; }); // (a foe marked `free` has no mission: the Skylights' first two trolls, met in the street -- 10-05)
    return sky;
  };
  // ------------------------------------------------------------------ the run: entry card, initiative, rounds
  Battle.prototype.run = function* () {
    var self = this;
    D.music(this.fight.music || 'battle'); // (it starts on the first key or click: browsers hold sound till then; a set piece's boss tune)
    if (!this.fight.noCards) yield { entry: true }; // (the wet has none: RULED 09-30c, "no press e, just go")
    if (this.fight.arrive) yield* this.arrive(); // (the foes walk in and the party comes out, before initiative: the Edifice's, 10-05)
    // initiative: d20 + DEX (and the fighter's Remarkable Athlete), rolled once
    var rolls = this.units.map(function (u) { var d = D.d(20); if (u.initAdv) d = Math.max(d, D.d(20)); u.initRoll = d + u.init + (u.kind === 'keeper' && D.keeper ? D.keeper.CFG.initBonus : 0); return { u: u, d: d }; }); // (initAdv: the barbarian's Feral Instinct, 7; the Keeper's initiative bonus: js/keeper.js K.CFG.initBonus, 0 -- so a fight can be scripted for it to go first)
    // (a familiar has no initiative: its turn comes right after its caster's -- RULED 09-30, js/familiar.js FM.after)
    // a defend fight (F.defend; 10-04 night, Griz: "make the glass above the hole their target with a high damage resist that they'd eventually beat through - like they're trying to make
    // entry into the dwarven place and this is a defend mission"): the map's `skylight` stands on the field as a thing of the party's side -- AC, hit points, a damage threshold, resistance
    // to everything (hurt) -- no turn of its own, no square to stand on; every foe's mission (ai.js brute); broken, the fight is lost (over)
    if (this.fight && this.fight.defend && this.map && this.map.def && this.map.def.skylight) this.skyUp();
    this.order = this.units.filter(function (u) { return !u.familiar && !u.object && !u.look; }).sort(function (a, b) { return b.initRoll - a.initRoll || b.abil.dex - a.abil.dex; }); // (!u.look: the street's people waiting at the road's foot take no turns -- 10-05)
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
      if (this.rec && D.rec && D.rec.checkpoint) D.rec.checkpoint(this); // (the play record kept as far as the fight has gone, each round: js/record.js, 10-02)
      if (this.reserve.length && this.round >= ((this.o.embed && this.o.embed.join) || 2)) yield* this.joinReserve();
      if (this.late && this.late.length) yield* this.lateOut(); // (a wave or the party held for its round: the Skylights' stables and heroes, 10-05)
      if (this.held && this.held.length && this.skyHit != null && this.round >= this.skyHit + ((this.fight.hatch && this.fight.hatch.after) || 1)) yield* this.hatchOut(); // (the garrison out of the hatch, the round after the first bang on the glass -- 10-05)
      for (var i = 0; i < this.order.length; i++) {
        var u = this.order[i];
        if (u.dead || u.away) continue; // (u.away: off the field on its way somewhere -- Pyro up the stair inside, js/pyro.js, 10-05)
        this.active = u;
        if (u.side === 'party' && !u.guest && !u.ally) yield* this.heroTurn(u);
        else if (this.show && u.show) yield* D.show.turn(this, u); // (the test ground's director, js/show.js: the AI's turn with its nudges about it)
        else { if (G.aloft(u) && !u.floats) yield* this.flyTo(u, G.groundAt(u, u.x, u.y), true); yield* D.ai.turn(this, u); } // (the AI keeps to the surface: one aloft comes down first -- flight at a height, 10-08)
        this.active = null;
        this.flyCheck();
        if (D.traits && D.traits.legendary && !this.over()) yield* D.traits.legendary(this, u); // (at the end of another creature's turn: a legendary action -- js/traits.js, 10-08)
        if (this.readyArmed()) yield* this.readyAfter({ turnOf: u }); // (one of us down by what no blow or spell of the turn told: a turn's-end save, the ring's spirits -- the readied healers, 10-02)
        if (D.familiar && !u.familiar) yield* D.familiar.after(this, u); // (his familiar's turn, right after his: js/familiar.js)
        yield* this.wave();
        if (this.fight.climbLine && !this.climbSaid) yield* this.climbSay(); // (the first foe up a face: the fight's line -- Pyro's on the Edifice, 10-05)
        this.sweep();
        var o = this.over();
        if (o) { yield* this.finish(o); return; }
        i = this.order.indexOf(u); // (a new foe may have been dealt in ahead of it)
      }
    }
  };
  function shortName(u) { return u.side === 'foe' && !u.fname ? ({ drow: 'Captain', phasespider: 'Spider', drider: 'Drider', spellweaver: 'Weaver', bugbearchief: 'Chief', hobsergeant: 'Sergeant', assassin: 'Blade', stonegiant: 'Giant', pudding: 'Pudding', giantspider: 'Spider', willem: 'Willem' }[u.kind] || u.name) : u.name; }

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
      var gone = s.dead || s.fled || s.left || s.hp <= 0, incap = gone || s.conds.paralyzed || s.conds.stunned || s.conds.asleep || s.conds.incapacitated; // (incapacitated itself: Hideous Laughter's, Hypnotic Pattern's -- a concentrating foe kept its spell under them till 10-03, the review)
      if (gone) self.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { if (w.conds[c] && w.conds[c].by === s.id && !(c === 'frightened' && w.conds.turned) && !(c === 'stunned' && w.conds[c].fresh === undefined && !w.conds[c].till)) delete w.conds[c]; }); }); // (a prayer's turning runs its minute out, whoever fell; nor does a spell's stun -- only the slam's and the moan's, laid with `fresh`, and a blow's, on a clock of its laying one's turns, go with the one who laid them)
      if (incap && s.conc) D.magic.endConc(self, s, gone ? 'gone' : 'incapacitated');
      if (incap && s.holding && s.holding.length) self.release(s);
      // a blinding hold (the darkmantle over the head, the cloaker's fold) ends with the grip, however the grip ended
      var bl = s.conds.blinded;
      if (bl && bl.held && !(s.conds.restrained && s.conds.restrained.by === bl.by && s.conds.restrained.grapple) && !(s.conds.attached && s.conds.attached.by === bl.by)) { delete s.conds.blinded; self.card(['{g}' + (s.side === 'foe' ? Battle.nm(s, true) : s.name) + ' can see again.{/}'], 200); }
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
    this.card([head, D.keys('{g}' + (this.o.embed ? 'E to go on' : this.o.onDone ? (this.o.climb ? 'E back to the climb' : this.o.pocket ? 'E back to the Pocket DM' : 'E back to the ladder') : 'E fight again') + ' · M the menu{/}')], 1e9);
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
    if (u.conds.dominated && D.mpmon && (yield* D.mpmon.dominatedTurn(this, u))) { yield 30; D.magic.endTurn(this, u); return; } // (Baleful Gaze, js/mpmon.js)
    // Fear's run (a foe's Fear, js/grimoire.js): the Dash away from it, and the turn is over
    if (D.magic.mustFlee && D.magic.mustFlee(u) && (yield* D.tactics.fleeFear(this, u))) { yield 30; D.magic.endTurn(this, u); return; } // (cornered: the turn is the player's, js/tactics.js TX.cornered)
    // a word of Command obeyed (a foe's Command, js/grimoire.js): the turn is the word's
    if (u.turn.lost) { if (u.turn.fleeFrom) yield* D.magic.flee(this, u); yield 40; D.magic.endTurn(this, u); return; }
    // Irresistible Dance (10-01, Griz: "agree, player choice, ai takes irresistible seriously ;)"): the player's dancer is asked -- SHAKE IT OFF (the WIS
    // save, the action spent) or FIGHT ON (no save, the action kept, no move): js/grimoire.js M.danceAsk. The AI's dancer saves in M.onStart
    if (u.turn.danceAsk && D.magic.danceAsk) yield* D.magic.danceAsk(this, u);
    if (u.turn.gazeAsk && D.magic.gazeAsk) yield* D.magic.gazeAsk(this, u); // (a gaze in reach at the turn's start -- LOOK AWAY or MEET IT: js/traits.js, 10-08)
    this.tool = 'move'; this.cursor = { x: u.x, y: u.y };
    while (true) {
      var cmd = yield { turn: u };
      // prone at END TURN with the half to stand: it stands, as any player would have (10-04 night, Griz: "if prone at end turn with movement left stand to stand from prone, stand?" --
      // the fighter fell off the arch sill six turns running and lay there with 15 ft unspent every time; SRD 5.1: standing is half the speed, from the turn's movement)
      if (cmd && cmd.do === 'end' && u.conds.prone && u.hp > 0 && RU.canRise(u) && u.turn.move >= RU.riseCost(u)) RU.rise(this, u);
      if (!cmd || cmd.do === 'end') break;
      yield* this.exec(u, cmd);
      yield* this.wave();
      if (this.over() || !RU.canAct(u) || u.turn.waits) break; // (waits: READY ends the turn -- exec 'ready', RULED 10-05)
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
    out.push({ id: 'attack', icon: (u.weapon && u.weapon.icon) || null, label: T.attacksLeft ? 'ATTACK (' + T.attacksLeft + ')' : 'ATTACK' + (u.attacks > 1 ? ' x' + u.attacks : ''), cost: 'A',ok: (T.attacksLeft > 0 || T.action > 0) && (foeNear || canWalk), why: foeNear || canWalk ? '' : 'no foe in reach, and no feet left', tool: 'attack' });
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
    if (u.cls === 'rogue') out.push({ id: 'hide', label: 'HIDE', cost: cun ? 'B' : 'A', ok: !u.conds.hidden && !(u.conds.restrained || u.conds.attached) && (cun || (T.action > 0 && !T.attacksLeft)), why: u.conds.hidden ? 'already hidden' : u.conds.restrained || u.conds.attached ? 'held fast: nowhere to hide' : 'the action is spent', note: (cun ? 'Cunning Action: ' : '') + 'Stealth against their eyes' });
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
      out.push({ id: 'throwtorch', label: 'THROW TORCH', cost: 'A', icon: 'torch', ok: T.action > 0 && !T.attacksLeft, why: 'the action is spent', tool: 'torch', note: 'to a square within 20 ft: it burns there -- at a foe, an improvised throw: 1 fire on a hit' });
      out.push({ id: 'dousetorch', label: 'DOUSE TORCH', cost: 'F', icon: 'torch', ok: !T.freeObj, why: freeWhy, note: 'out, and back in the pack' });
    } else if (floorLight) out.push({ id: 'pickuptorch', label: 'TAKE UP ' + Lt.tag(floorLight), cost: 'F', icon: floorLight.kind === 'lantern' ? 'lantern' : 'torch', ok: !T.freeObj && Lt.handForLight(u), why: T.freeObj ? freeWhy : Lt.handsWhy(u), note: 'the one burning at your feet' });
    // the weapon put away and drawn again (10-05, Griz: "Add 'put away'? ... Go ahead and build what you were planning on"; SRD 5.1, the free interaction with an object: "draw or sheathe a
    // sword"): put away, the hand is empty -- a torch taken up or lit, the lit flask (js/oil.js) -- and its blows are an unarmed strike till it is drawn; drawn, a hand to hold it
    if (!u.guest && u.src && u.src.equip) {
      if (u.sheathed) { var dHands = Lt.handsFree(u) > 0; out.push({ id: 'drawweapon', label: 'DRAW ' + u.sheathed.name.toUpperCase(), cost: 'F', icon: 'attack', ok: !T.freeObj && dHands, why: T.freeObj ? freeWhy : Lt.handsWhy(u), note: 'back in hand: ' + u.sheathed.name + ' ' + RU.sign(u.sheathed.atk) + ', ' + u.sheathed.dice + RU.sign(u.sheathed.mod) });
      } else if (u.weapon && u.weapon.id && u.weapon.id !== 'unarmed') out.push({ id: 'putaway', label: 'PUT AWAY ' + u.weapon.name.toUpperCase(), cost: 'F', icon: 'attack', ok: !T.freeObj, why: freeWhy, note: 'the hand free (a torch, the lit flask); an unarmed strike till it is drawn' });
    }
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
      if (G.aloft(u) && G.winged(u)) { var ftLd = G.feetUp(u.fz - G.groundAt(u, u.x, u.y)); out.push({ id: 'land', label: 'LAND (' + ftLd + ' FT)', cost: 'F', icon: 'move', ok: T.move >= ftLd, why: 'the move left is ' + T.move + ' ft: coming down ' + ftLd + ' ft costs ' + ftLd, note: 'straight down to the ground under you' }); } // (flight at a height: Griz, 10-08, "trouble landing in the square I'm above")
      out.push({ id: 'dash', label: 'DASH', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : 'the action is spent', note: '+' + u.speed + ' ft this turn' });
      out.push({ id: 'disengage', label: 'DISENGAGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !T.disengaged, note: 'leaving reach provokes nothing this turn' });
      // Expeditious Retreat (SRD 5.1: "as a bonus action on each of your turns until the spell ends, you can take the Dash action"): the mark
      // js/grimoire.js sets each turn (T.bonusDash) while the spell holds -- a second DASH, for the bonus action
      if (T.bonusDash && u.conds.retreat) out.push({ id: 'cdash', label: 'RETREAT DASH', cost: 'B', ok: T.bonus > 0 && !u.conds.restrained && !u.conds.dancing, why: u.conds.dancing ? 'dancing in place: no move to add a Dash to' : u.conds.restrained ? 'held fast: the speed is 0, and a Dash adds your speed' : 'the bonus action is spent', note: 'Expeditious Retreat: +' + u.speed + ' ft this turn', icon: 'dash' });
    }
    // out the way the party came in (the fight's entry squares): the tabletop's walking off the table (Griz, 09-27: the climb's escape)
    // (inside the 8-bit game, only where its own battle had RUN: this.o.embed.canRun)
    if (!(this.o.embed && this.o.embed.canRun === false) && (this.exits || []).length) {
      if (this.onExit(u)) out.push({ id: 'leave', label: 'LEAVE THE FIGHT', cost: 'M', icon: 'back', ok: T.move >= 5 && !u.conds.restrained, why: u.conds.restrained ? 'held fast' : 'no move left', note: 'out the way you came in' + (this.fight.oneLeavesAll ? ', and the party goes too' : '') + ': a foe beside you gets its swing' });
      // (10-04, Griz: "Keeper Fight lacks fight escape", and the Wet at level 3, "not on wheel": off a way out the command still shows, greyed, and says where to go)
      else out.push({ id: 'leave', label: 'LEAVE THE FIGHT', cost: 'M', icon: 'back', ok: false, why: 'not from here: walk to one of the pale squares at the edge first (' + this.exits.length + ' way' + (this.exits.length === 1 ? '' : 's') + ' out)', note: 'out the way you came in' });
    }
    out.push({ id: 'dodge', label: 'DODGE', cost: 'A', ok: T.action > 0 && !T.attacksLeft, note: 'attacks at you at disadvantage till your next turn' });
    out.push({ id: 'search', label: 'SEARCH', cost: 'A', ok: T.action > 0 && !T.attacksLeft, note: 'a Perception check against anyone hiding in sight, all round you' }); // (SRD 5.1 Search; 10-04)
    // TAKE THE ROPE (10-04 night, Griz: "if one clicks on a square where a grapple is they should be able to take it"): a rope fixed on this square or one beside it, up top, nobody on it -- coiled back into the pack for the action
    var rpN = Battle.ropeNear(this, u); if (rpN) { var tkN = Battle.canTakeRope(this, u, rpN); out.push({ id: 'takerope', label: 'TAKE THE ROPE', cost: 'A', ok: tkN.ok, why: tkN.why, icon: 'item', note: 'coil the rope and its grapple back into the pack (an object used: the action)' }); }
    if (this.torchBarrel && Battle.besideBarrel(this, u)) out.push({ id: 'barreltorch', label: 'TAKE A TORCH', cost: 'F', icon: 'torch', ok: !u.torch && !T.freeObj && Lt.handForLight(u) && !(u.hang && G.hanging(u)), why: u.torch ? 'a light in hand already' : T.freeObj ? 'the free hand on an object is spent this turn' : !Lt.handForLight(u) ? Lt.handsWhy(u) : 'not while hanging', note: 'a lit torch out of the barrel: free, and there is always another' }); // (10-05 night)
    if (this.ropeBucket && Battle.besideBucket(this, u)) out.push({ id: 'bucketrope', label: 'TAKE A ROPE', cost: 'F', ok: !T.tookRope && !u.guest, why: T.tookRope ? 'one a turn' : 'a guest keeps its hands to itself', icon: 'item', note: 'a Rope & Grapple out of the bucket: free, one a turn, and there is always another' }); // (10-04 night)
    var psgN = Battle.passageAt(this, u.x, u.y); if (psgN) { var occN = G.occupant(psgN.dest[0], psgN.dest[1]), halfN = Math.floor(u.speed / 2); out.push({ id: 'passage', label: psgN.inward ? 'GO IN' : 'COME OUT', cost: 'M', ok: T.move >= halfN && !occN && !u.conds.restrained && (u.size || 1) === 1, why: occN ? 'someone stands at the other end' : T.move < halfN ? 'half the speed at least (' + halfN + ' ft)' : u.conds.restrained ? 'held fast' : 'too big for the door', icon: 'move', note: 'through ' + psgN.name + (psgN.inward ? ' and up the stair inside, out onto the roof' : ' and down the stair, out onto the street') + ': the rest of this turn\'s movement' }); } // (a passage: Battle.passageAt, 10-04 night)
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
    // BREAK THE TENDRIL (SRD 5.1 Roper: "A tendril can also be broken if a creature takes an action and succeeds on a DC 15 Strength check against it"): the one it holds,
    // or a friend beside; the tendril is struck at with ATTACK on the held one's square (tendrilOn). 10-02, handoff-2026-10-01-the-tendrils-and-ready
    var brks = Battle.breakable(u, this.units);
    if (brks.length) { var bt0 = brks[0].conds.restrained.tendril; out.push({ id: 'breaktendril', label: 'BREAK THE TENDRIL', cost: 'A', icon: 'free', tool: 'breaktendril', ok: T.action > 0 && !T.attacksLeft, why: 'the action is spent', note: 'a STR check, DC ' + (bt0.breakDC || 15) + (u.conds.restrained && u.conds.restrained.weak ? ' (at disadvantage: held)' : '') + ': the tendril off ' + (brks[0] === u ? 'you' : brks[0].name) + ' (' + bt0.hp + '/' + bt0.max + ' HP to cut it instead)' }); }
    // READY (SRD 5.1: "you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn"): one of four triggers -- a foe
    // within reach (a bow, a spell: into sight), a foe's attack at one of us, one of us down, a foe's spell -- and the strike, the spell or the move held for it (exec 'ready',
    // readySpring). 10-02, handoff-2026-10-01-the-tendrils-and-ready §4.2; the triggers and the wheel the same evening, Griz
    out.push({ id: 'ready', label: 'READY', cost: 'A', ok: T.action > 0 && !T.attacksLeft && !u.ready, why: u.ready ? 'readied already' : 'the action is spent', note: 'pick a trigger, then what you hold for it -- a strike, a spell, a move: your turn ends, and your reaction springs it on another\'s turn, aimed then' });
    return out;
  };
  // the roper's tendril on w (SRD 5.1 Grasping Tendrils; 10-02): a grip that carries `tendril` -- w held by it, its holder standing and hostile to u, w not (or w is u). The thing u
  // strikes at or breaks: a target of its own (tendrilStub) on w's square, never a unit of the fight (grid.js knows nothing of it)
  Battle.tendrilOn = function (u, w, units) {
    var r = w && w.conds && w.conds.restrained; if (!r || !r.grapple || !r.tendril || (w !== u && G.hostile(u, w)) || !G.standing(w)) return null;
    var h = units.filter(function (x) { return x.id === r.by; })[0];
    return h && G.hostile(u, h) && G.standing(h) ? Battle.tendrilStub(w, h) : null;
  };
  Battle.tendrilStub = function (held, holder) {
    var t = held.conds.restrained.tendril, s = { tendril: true, held: held, by: holder, name: 'the tendril on ' + held.name, side: holder.side, size: 1, hp: t.hp, maxhp: t.max, ac: t.ac, conds: {}, abil: {}, blindsight: 999, immune: t.immune }; // (blindsight: a thing sees no one, and no one is an unseen attacker to it -- rules.js edges)
    Object.defineProperty(s, 'x', { get: function () { return held.x; }, enumerable: true }); Object.defineProperty(s, 'y', { get: function () { return held.y; }, enumerable: true });
    return s;
  };
  // the held ones u could break the tendril off (BREAK THE TENDRIL: the one held, or anyone beside it -- SRD 5.1, "a creature takes an action")
  Battle.breakable = function (u, units) { return units.filter(function (w) { return (w === u || (!G.hostile(u, w) && G.dist(u, w) <= 5)) && Battle.tendrilOn(u, w, units); }); };
  // a tendril cut through or broken: the grip ends with it, and its holder is one tendril short till its next turn (rules.js startTurn: tendrilsLost back to 0)
  Battle.prototype.tendrilGone = function (holder, held, how) {
    var blind0 = !!(held.conds.blinded && held.conds.blinded.held && held.conds.blinded.by === holder.id);
    holder.tendrilsLost = (holder.tendrilsLost || 0) + 1;
    this.release(holder, held);
    if (this.active === held && held.turn) { var T0 = held.turn; T0.move = held.conds.dancing ? 0 : Math.max(0, (T0.moveFull != null ? T0.moveFull : held.speed) - (T0.moved || 0)); } // (cut on its own turn: the walk the turn would have had, as breakFree gives it back)
    if (blind0 && !held.conds.blinded) this.card(['{g}' + held.name + ' can see again.{/}'], 200);
    FX.sparkle(held, 'bone', 10); D.sfx('hit');
    var ta = Object.keys(holder.attacks || {}).map(function (k) { return holder.attacks[k]; }).filter(function (a) { return a && a.tendril; })[0];
    var left = Math.max(0, (ta && ta.grapple && ta.grapple.max || 6) - (holder.holding || []).length - holder.tendrilsLost);
    this.card(['{n}The tendril is ' + how + ':{/} ' + nameOf(held) + ' is free.  {g}(the ' + shortName(holder) + ' has ' + left + ' tendril' + (left === 1 ? '' : 's') + ' to spare till its next turn){/}'], 280);
  };
  // a friend u may Help: beside it, asleep (shaken awake) or held in a web or a grip (advantage on its next check to get out)
  Battle.helpable = function (u, w) { return !!(w && w !== u && !G.hostile(u, w) && !w.dead && w.hp > 0 && !w.ethereal && G.dist(u, w) <= 5 && (w.conds.asleep || w.conds.restrained || w.conds.attached) && !w.conds.helpedCheck); }; // (attached: a darkmantle on -- the hand is on the STR check to pull it off)
  // the riders u could pull off a friend beside it (a darkmantle attached: PULL IT OFF)
  Battle.pullable = function (u, units) { return units.filter(function (w) { return w.attached && w.riding && w.master && !G.hostile(u, w.master) && G.hostile(u, w) && G.standing(w) && G.dist(u, w.master) <= 5; }); }; // (the one it rides, too: SRD 5.1, "a creature")
  // the rider on w that u may strike at through w's square (ui.js valid: the attack tool on a friend's square, or one's own)
  Battle.riderOn = function (u, w, units) { return w && !G.hostile(u, w) ? units.filter(function (r) { return r.attached && r.riding && r.master === w && G.hostile(u, r) && G.standing(r); })[0] || null : null; };
  // the dashes u has left this turn, 'a' and 'b' (10-04, Griz: "If she has dash and cunning dash should she be able to try the steepest climb?"): its action's, while the
  // Attack action is not begun, and a bonus action's -- Cunning Action, Expeditious Retreat; each is its speed more (ui.js reachCache: the squares a click dashes to; exec 'dashmove')
  Battle.dashes = function (u) { var T = u.turn || {}, n = []; if (u.conds.restrained || u.conds.dancing) return n; if (T.action && !T.attacksLeft) n.push('a'); if (T.bonus && ((u.cls === 'rogue' && u.lvl >= 2) || u.cunning || (T.bonusDash && u.conds.retreat))) n.push('b'); return n; };
  // A rope's square (10-04 night, Griz: "if one clicks on a square where a grapple is they should be able to take it (unless someone is on it - in which case I think
  // they'll attack it if that's not an ally)"): the uncut rope fixed at (x, y); who hangs on it; whether u can take it up (on its square or beside it at its height, nobody
  // on it, the action free -- an object used, as setting it was) or cut it (a foe hangs on it, and u's weapon reaches its top: melee within reach, a bow within its range
  // and in line; Battle.cutRope, the AI's own blow at it). The ui.js click and tooltip read these; the ring's TAKE THE ROPE (actions) the first
  Battle.ropeAt = function (B, x, y) { return ((B && B.ropes) || []).filter(function (r) { return !r.cut && r.at[0] === x && r.at[1] === y; })[0] || null; };
  Battle.ropeHanger = function (B, r) { return (B.units || []).filter(function (h) { return h.hang && h.hang.rope === r && G.hanging(h) && G.standing(h); })[0] || null; };
  Battle.ropeNear = function (B, u) { return ((B && B.ropes) || []).filter(function (r) { return !r.cut && Math.max(Math.abs(u.x - r.at[0]), Math.abs(u.y - r.at[1])) <= 1 && Math.abs(G.gzAt(u, u.x, u.y) - G.map.gz(r.at[0], r.at[1])) <= G.map.def.step; })[0] || null; };
  // the rope's 5 ft marks (10-05, Griz: "any reason not to do the climb in 5 ft increments instead of 2.5?" -- "1 yes"; the SRD 5.1 has no 2.5 ft, the half step is the maps' drawing unit):
  // a hang is on a mark every 5 ft (two steps) above the foot's ground, never a half step; each step along the rope is still 5 ft of movement (each foot climbed costs one more: 10 a mark).
  // Battle.ropeSteps: the steps a climber at height z0 goes toward the top (up) or the foot with `move` ft -- the whole way if the move pays it (unless `part`: part way only), else to the
  // farthest mark it reaches, an odd 5 ft of movement left unspent; 0 none. Battle.ropeMark: the mark nearest a height, the ends included (exec 'ropeclimb' with z; ui.js ropeRung's rungs)
  Battle.ropeSteps = function (r, z0, up, move, part) {
    var st = G.map.def.step, zf = G.map.gz(r.foot[0], r.foot[1]), n = Math.round((G.map.gz(r.at[0], r.at[1]) - zf) / st), h = Math.round((z0 - zf) / st), a = Math.floor(Math.max(0, move || 0) / 5), m;
    if (up) { if (!part && h + a >= n) return Math.max(0, n - h); m = Math.floor(Math.min(h + a, n - 1) / 2) * 2; return m > h ? m - h : 0; }
    if (!part && h - a <= 0) return Math.max(0, h); m = Math.ceil(Math.max(h - a, 1) / 2) * 2; return m < h ? h - m : 0;
  };
  Battle.ropeMark = function (r, z) { var st = G.map.def.step, zf = G.map.gz(r.foot[0], r.foot[1]), zt = G.map.gz(r.at[0], r.at[1]); return Math.max(zf, Math.min(zt, zf + Math.round((z - zf) / (2 * st)) * 2 * st)); };
  Battle.canTakeRope = function (B, u, r) {
    var T = u.turn || {}, h = Battle.ropeHanger(B, r), near = Math.max(Math.abs(u.x - r.at[0]), Math.abs(u.y - r.at[1])) <= 1 && Math.abs(G.gzAt(u, u.x, u.y) - G.map.gz(r.at[0], r.at[1])) <= G.map.def.step;
    if (h) return { ok: false, why: (h.side === 'party' || !G.hostile(u, h) ? h.name : Battle.nm(h)) + ' hangs on it' };
    if (!near) return { ok: false, why: 'not from here: stand on its square or beside it, up top' };
    if (u.hang && G.hanging(u)) return { ok: false, why: 'not while hanging on it' };
    if (!(T.action > 0) || T.attacksLeft) return { ok: false, why: 'the action is spent' };
    return { ok: true, why: '' };
  };
  Battle.canCutRope = function (B, u, r) {
    return canCut0(B, u, r);
  };
  // a passage (10-04 night, Griz: "Front doors possible?" -- and earlier, "might let players walk in them and come out up top for a movement cost"): a map's `passages: [[x, y, tx, ty, name]]`,
  // a door square and its far side (the Edifice's vault door on the street and the roof's hatch above it). Standing on either end, GO IN / COME OUT (the ring; a hand's walk that ends on
  // one asks): the rest of the turn's movement, half the speed at least, and the figure is at the other end. { p, from, dest, inward, name } or null
  Battle.passageAt = function (B, x, y) {
    var ps = (B && B.passagesOpen && B.passages) || []; // (shut by default: B.passagesOpen)
    for (var i = 0; i < ps.length; i++) { var p = ps[i]; if (p.at[0] === x && p.at[1] === y) return { p: p, from: p.at, dest: p.to, inward: true, name: p.name }; if (p.to[0] === x && p.to[1] === y) return { p: p, from: p.to, dest: p.at, inward: false, name: p.name }; }
    return null;
  };
  // the rope bucket (10-04 night, Griz: "there should be a bucket by one of the fountain street houses that is an endless supply of rope and grapple while on the map"): a map's
  // `ropeBucket: [x, y]` (its square a crate, 'k'); anyone of ours beside it takes a Rope & Grapple out of it for nothing -- an object interaction, one a turn -- and it is never empty
  // the torch barrel (10-05 night, Griz: "Should we add a torch barrel like the rope barrel?" -- "1 barrel yes 2 barrel yes", the barrel the answer to Pyro's "Torch him!"): a map's
  // `torchBarrel: [x, y]` (its square a crate, 'k'); anyone beside it with a hand for a light takes a torch out, lit -- the turn's free object (RULED 10-05 night: "no, that's good" to an action) -- and it is never empty
  Battle.besideBarrel = function (B, u) { var b = B && B.torchBarrel; return !!(b && Math.max(Math.abs(u.x - b[0]), Math.abs(u.y - b[1])) <= 1 && Math.abs(G.gzAt(u, u.x, u.y) - G.map.gz(b[0], b[1])) <= G.map.def.step); };
  Battle.besideBucket = function (B, u) { var b = B && B.ropeBucket; return !!(b && Math.max(Math.abs(u.x - b[0]), Math.abs(u.y - b[1])) <= 1 && Math.abs(G.gzAt(u, u.x, u.y) - G.map.gz(b[0], b[1])) <= G.map.def.step); };
  function canCut0(B, u, r) {
    var T = u.turn || {}, h = Battle.ropeHanger(B, r); if (!h || !G.hostile(u, h)) return null;
    var w = u.weapon, spot = { x: r.at[0], y: r.at[1], size: 1 }, d = G.dist(u, spot), reach = w && w.ranged ? ((w.range && (w.range[1] || w.range[0])) || 0) : G.reachOf(u);
    var inR = d <= reach && (!(w && w.ranged) || G.losPoint(u.x, u.y, r.at[0], r.at[1]));
    return { foe: h, ok: !!(w && inR && (T.attacksLeft || T.action > 0) && !u.conds.disarmed), why: !w ? 'no weapon' : !inR ? 'the rope\'s top is ' + d + ' ft off (' + (w.ranged ? 'range' : 'reach') + ' ' + reach + ')' : u.conds.disarmed ? 'the weapon is dropped' : 'no attack left this turn',
      ft: Math.round((h.hang.z - G.map.gz(h.x, h.y)) / G.map.def.step) * 2.5 };
  };
  // where a Rope & Grapple can be set (10-04, Griz: "as an item on the item wheel"): the top of a face -- an open square with one beside it two steps lower or more (open, or the
  // setter's own) and no rope there yet -- on a map whose cliffs can be climbed. From up there (on it, or beside it at its height) it is tied off with no roll; from below the
  // grapple is thrown up to it, as far as the rope is long and in sight (Battle.seesFrom, Battle.throwDC: 10-05; it was 30 ft at most), a Dexterity check, DC 10 to 30 ft (his lean and the seat's: the SRD 5.1 lists a grappling hook, 2 gp, 4 lb, and gives it no
  // rule). `foot`: the square it is to hang to (a climb's own); else the nearest, square-on before corner-wise. { at, foot, top } or null
  Battle.ropeSq = function (B, u, x, y, foot) {
    var d = G.map.def, top = G.map.at(x, y); if (!d.climb || !top || !top.walk || (u.size || 1) > 1) return null;
    if ((B.ropes || []).some(function (r) { return !r.cut && r.at[0] === x && r.at[1] === y; })) return null;
    var zt = G.map.gz(x, y), feet = [];
    [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q, i) { var fx = x + q[0], fy = y + q[1], s = G.map.at(fx, fy), w = G.occupant(fx, fy); if (s && s.walk && zt - G.map.gz(fx, fy) >= 2 * d.step && !(w && w.id !== u.id)) feet.push({ at: [fx, fy], diag: i > 3 ? 1 : 0 }); });
    if (foot) feet = feet.filter(function (f) { return f.at[0] === foot[0] && f.at[1] === foot[1]; });
    if (!feet.length) return null;
    feet.sort(function (a, b) { return (a.diag - b.diag) || (G.dist(u, { x: a.at[0], y: a.at[1], size: 1 }) - G.dist(u, { x: b.at[0], y: b.at[1], size: 1 })); }); // (square-on first, straight down the face; corner-wise only where nothing is square under it -- 10-05, Griz: "climbing shows left of rope, but when they get up they seem to step on tile right of rope first": Vivian's from the fountain rim hung corner-wise)
    var uz = G.gzAt(u, u.x, u.y);
    if (Math.max(Math.abs(u.x - x), Math.abs(u.y - y)) <= 1 && Math.abs(uz - zt) <= d.step) return { at: [x, y], foot: feet[0].at, top: true };
    // (the throw's reach is the straight line to the lip, across and up -- 10-05, Griz: "especially if that means throw from the bottom": a rim 45 ft up and 45 ft out is some 64 ft
    // off, past a 50 ft rope, where the grid's distance read 45; the DC by the line in whole 5s, rounded down: the 45 ft facade from its foot still 45 ft, DC 16)
    var hzF = Math.max(Math.abs(u.x - x), Math.abs(u.y - y)) * 5, vzF = Math.max(0, (zt - uz) / d.step * 2.5), lineF = Math.sqrt(hzF * hzF + vzF * vzF), tFt = Math.floor(lineF / 5 + 1e-9) * 5;
    if (uz < zt && lineF <= Battle.ROPE_FT + 1e-9 && (Battle.seesFrom(u, x, y, zt) || feet.some(function (f) { return Battle.seesFrom(u, f.at[0], f.at[1], G.map.gz(f.at[0], f.at[1])); }))) return { at: [x, y], foot: feet[0].at, top: false, ft: tFt, dc: Battle.throwDC(tFt) };
    return null;
  };
  // the throw's reach and its DC (10-05, Griz: "go with +2 DC per 5 beyond 30"): as far as the rope is long (fifty feet, content/items.json rope), DC 10 to 30 ft and 2 more for each
  // 5 ft past it -- 35 ft 12, 40 ft 14, 45 ft 16, 50 ft 18 (the Edifice's 45 ft facade from the street, 16)
  Battle.ROPE_FT = 50;
  Battle.throwDC = function (ft) { return 10 + 2 * Math.max(0, Math.ceil((ft - 30) / 5)); };
  // in sight for a throw, from where the thrower is -- a hanger's eye at its hang, not at the rope's foot -- to a square's floor at height z (10-05, Griz: "2 yes" to: sight read from the
  // thrower's own height, and the top edge of a face you stand under counts as seen). ropeSq asks it of the top and of the squares under it the rope would hang to: nothing overhangs a
  // face, so whoever sees its foot sees its lip
  // the edge a blow from `from` would knock `u` off (10-05, the male giant's rocks): the square 5 ft straight back from the thrower's middle, open, free, and 10 ft or more below where
  // u stands -- { at, ft } -- or nothing (no edge there: the rock only knocks prone, as the SRD has it). One square's body; one hanging on a rope or a face is not standing on an edge
  Battle.knockSq = function (from, u) {
    if ((u.size || 1) > 1 || (u.hang && G.hanging(u))) return null;
    var fs = from.size || 1, cx = from.x + (fs - 1) / 2, cy = from.y + (fs - 1) / 2, ddx = u.x - cx, ddy = u.y - cy, sx = Math.abs(ddx) < 0.5 ? 0 : Math.sign(ddx), sy = Math.abs(ddy) < 0.5 ? 0 : Math.sign(ddy);
    if (!sx && !sy) return null;
    var px = u.x + sx, py = u.y + sy, s = G.map.at(px, py), st = G.map.def.step, drop = G.map.gz(u.x, u.y) - G.map.gz(px, py);
    if (!s || !s.walk || G.occupant(px, py, u, { z: G.map.gz(px, py), h: G.bodyH(u) }) || drop < 4 * st) return null; // (one hanging high over the landing square is not on it -- 10-05)
    return { at: [px, py], ft: Math.floor(drop / st) * 2.5 };
  };
  // the camera's own beat (the dunking booth -- 10-05, Griz: "I mean zoom on the game map if possible, showing the rock throw and fall"): eased over `ticks` from where it is to a zoom
  // and a point -- a unit's, a square's ({ gx, gy, gz }), or a camera's own ({ cam, zoom }) -- so the map itself is the close-up. The UI clamps the camera to the map each frame as always
  Battle.prototype.camTo = function* (at, zoom, ticks) {
    var iso = D.iso, c = at.cam ? null : (at.gx != null ? at : FX.at(at)), p = c ? iso.center(c.gx, c.gy, c.gz || 0) : null, x1 = c ? Math.round(p.x) : at.cam.x, y1 = c ? Math.round(p.y - 20 - (at.sheet ? D.spr.unitTop(at) / 2 : 0)) : at.cam.y; // (a figure framed at its middle, not its feet: a Huge giant fills the frame at 3)
    var z0 = iso.zoom, x0 = iso.cam.x, y0 = iso.cam.y;
    for (var i = 1; i <= ticks; i++) { var q = i / ticks, e = q * q * (3 - 2 * q); iso.zoom = z0 + (zoom - z0) * e; iso.cam.x = x0 + (x1 - x0) * e; iso.cam.y = y0 + (y1 - y0) * e; yield 1; }
    iso.zoom = zoom; iso.cam.x = x1; iso.cam.y = y1;
  };
  // (`att`: who knocked it off. The rock's flight is on the field already when this runs -- the dice roll after it, battle.js attack -- so the booth's beats come before the fall, on the
  // map itself (10-05, Griz: "Zoom in for rock throw, pause, zoom in on target - target falls out of zoom, zoom in on fountain and show character landing in it, special water splash
  // effect - show egg"): the camera in on the giant and the throw again, a pause, in on the one hit, who drops out of the frame, then the fountain as it lands, the splash, the egg)
  Battle.prototype.knockOff = function* (u, sq, att) {
    var z0 = G.gzAt(u, u.x, u.y), tl = G.map.at(sq.at[0], sq.at[1]), dunk = !!(tl && tl.ch === '~' && u.side === 'party' && !u.guest && !u.ally && !u.summon && !u.familiar);
    var fd = D.roll(Math.max(1, Math.floor(sq.ft / (dunk ? 20 : 10))) + 'd6'), iso = D.iso, cam0 = { cam: { x: iso.cam.x, y: iso.cam.y }, zoom: iso.zoom };
    if (dunk) {
      var dT = this.pace(STEP_FRAMES + 14, true);
      if (att && att.sheet) { yield* this.camTo(att, 3, 26); att.anim = 'attack'; att.animT = this.t; this.card(['{y}' + nameOf(att) + '{/} lets fly.'], 220); yield 18; FX.projectile(att, u, 'bolt'); yield { fx: 1 }; att.anim = 'idle'; yield 14; }
      yield* this.camTo(u, 3, 22); yield 10;
      u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: dT, mode: 'drop' }; u.x = sq.at[0]; u.y = sq.at[1]; delete u.hang; this.forced(u);
      yield Math.floor(dT / 2); // (the camera holds on the edge: it drops out of the frame)
      yield* this.camTo({ gx: sq.at[0], gy: sq.at[1], gz: 0 }, 3, Math.max(1, Math.ceil(dT / 2))); // (and the fountain, as it lands)
      D.sfx('splash'); FX.ring(u, 'bone', 30); FX.sparkle(u, 'blue', 28); FX.float('SPLASH', u, D.PAL.ramps.blue[3]); yield 24;
    } else {
      u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(STEP_FRAMES + 6, true), mode: 'drop' };
      u.x = sq.at[0]; u.y = sq.at[1]; delete u.hang; this.keepInView(u);
      this.forced(u); // (knocked down off the edge: readyForced)
      yield STEP_FRAMES + 6;
    }
    // the dunking booth (10-05, Griz: "do similar (zoomed in) fall on whichever player character (only) that not only gets rocked off the ledge but also into a fountain - 'dunking booth'
    // blue egg"): one of the four, knocked off the edge and down into a fountain's water -- the splash, a close-up of the one in the water, the fall's dice halved (the water takes
    // the rest: the seat's call, his to overrule), and the blue egg once a save (js/grimoire.js M.EGGS dunk). A guest, an ally or a foe goes over as before
    this.card(['{o}' + nameOf(u) + (dunk ? ' goes over the edge and into the fountain with a splash: ' + sq.ft + ' ft, ' + fd.total + ' bludgeoning -- the water took the rest -- and sits up in it, prone.' : ' goes over the edge: ' + sq.ft + ' ft, ' + fd.total + ' bludgeoning, and lands prone.') + '{/}'], 240);
    this.hurt(u, fd.total, 'bludgeoning', {});
    yield 20;
    if (dunk) { yield 20; yield* this.camTo(cam0, cam0.zoom, 24); if (D.magic.egg) yield* D.magic.egg(this, 'dunk'); }
  };
  Battle.seesFrom = function (u, x, y, z) {
    var st = G.map.def.step, ez = G.gzAt(u, u.x, u.y) + 2 * st, L = G.line(u.x, u.y, x, y);
    if (!L.every(function (p) { var q = G.map.at(p[0], p[1]); return q && q.open; })) return false;
    return !(G.tall() && G.overFloor(u.x, u.y, ez, x, y, z + 2 * st));
  };
  // the first climb on a hand's path that takes a check, while the pack has a Rope & Grapple and the action is free: where the grapple could go instead (exec 'move' asks USE GRAPPLE)
  Battle.prototype.grappleAt = function (u, path) {
    var T = u.turn, s = (this.inv || []).filter(function (x) { return x.id === 'rope' && x.n > 0; })[0];
    if (!s || !T || !T.action || T.attacksLeft || !G.map.def.climb || (u.size || 1) > 1) return null;
    var x = u.x, y = u.y;
    for (var i = 0; i < path.length; i++) {
      var nx = path[i][0], ny = path[i][1], cs = G.climbsUp(u, x, y, nx, ny), dc = G.climbDC(cs, u, G.faceKind(nx, ny));
      if (dc) { var gq = Battle.ropeSq(this, Object.assign({}, u, { x: x, y: y }), nx, ny, [x, y]); return gq ? { i: i, at: [nx, ny], foot: [x, y], ft: cs * 2.5, dc: dc, tdc: gq.top ? 0 : gq.dc } : null; } // (tdc: the throw's own DC, 10-05)
      x = nx; y = ny;
    }
    return null;
  };
  // a rope struck at (10-04, Griz: "so long as they only bother to consider it as a target when someone is climbing it" -- ai.js brute): an object by the SRD 5.1, AC 11
  // (Statistics for Objects: rope), 2 hit points (Adventuring Gear: Rope), immune to poison and psychic damage. At 0 it parts, and whoever hangs on it falls to its foot
  // (Falling: 1d6 a 10 ft) and lands prone
  Battle.prototype.cutRope = function* (w, r, atk) {
    var T = w.turn; if (T) { T.action = 0; T.attacksLeft = 0; }
    w.facing = D.spr.facingFor(r.at[0] - w.x, r.at[1] - w.y); w.anim = 'attack'; w.animT = this.t; D.sfx('hit'); yield 12;
    var d20 = D.d(20), tot = d20 + (atk.atk || 0), hit = d20 === 20 || (d20 !== 1 && tot >= 11), dmg = hit && atk.type !== 'poison' && atk.type !== 'psychic' ? Math.max(1, D.roll(atk.dice).total + (atk.mod || 0)) : 0;
    r.hp -= dmg;
    this.card(['{r}' + nameOf(w) + '{/} goes for the rope: ' + (atk.name || 'a blow') + ' d20 ' + d20 + ' ' + RU.sign(atk.atk || 0) + ' = ' + tot + ' vs AC 11  ' + (!hit ? 'MISS' : r.hp <= 0 ? '{o}it parts!{/}' : '{o}' + dmg + '{/}, and it holds')], 220);
    w.anim = 'idle'; yield 20;
    if (r.hp > 0) return;
    r.cut = true;
    for (var i = 0; i < this.units.length; i++) {
      var h = this.units[i]; if (!(h.hang && h.hang.rope === r)) continue;
      var fz = h.hang.z, ft = Math.round((fz - G.map.gz(h.x, h.y)) / G.map.def.step) * 2.5; delete h.hang; this.forced(h); // (dropped down into reach, maybe: readyForced)
      h.tween = { fx: h.x, fy: h.y, fz: fz, t: 0, dur: this.pace(STEP_FRAMES + 6, true), mode: 'drop' }; yield STEP_FRAMES + 6;
      var onR = this.under(h), fd = ft >= 10 ? D.roll(Math.floor(ft / 10) + 'd6') : null; // (onto whoever stood at the rope's foot: the cushion, the dice split -- 10-05, landOn)
      this.card(['{o}' + nameOf(h) + ' falls ' + ft + ' ft' + (onR.length ? ' onto ' + onR.map(nameOf).join(' and ') + (fd ? ': ' + fd.total + ' bludgeoning, split,' : ',') + ' and lands prone.' :(fd ? ': ' + fd.total + ' bludgeoning,' : ',') + ' and lands prone.') + '{/}'], 220);
      if (onR.length) { this.landOn(h, ft, fd); continue; }
      if (fd) this.hurt(h, fd.total, 'bludgeoning', {}); h.conds.prone = true;
    }
  };
  // what a walk along `path` risks on a map whose cliffs can be climbed (10-04, Griz: "can we add 'Drop?' when a movement click results in fall damage (avoid
  // misclick fall damage)"): a line for every drop of 10 ft or more (SRD 5.1 Falling: 1d6 a 10 ft, and prone; moveAlong) and every climb over 10 ft (its miss
  // falls, moveAlong) -- none for a safe walk. exec asks a hand's move with them first, and the dash's question says them
  Battle.prototype.fallLines = function (u, path) {
    var d = G.map.def, out = [], x = u.x, y = u.y;
    if (!d.climb || u.flies || u.climbs) return out;
    for (var i = 0; i < path.length; i++) {
      var nx = path[i][0], ny = path[i][1], dz = (G.gzAt(u, nx, ny) - G.gzAt(u, x, y)) / d.step, ft = Math.abs(dz) * 2.5, cs = G.climbsUp(u, x, y, nx, ny);
      if (dz < 0 && ft >= 10) out.push('A drop of ' + ft + ' ft on the way: ' + Math.floor(ft / 10) + 'd6 bludgeoning, and prone.');
      else if (cs && ft > 10) out.push('A climb of ' + ft + ' ft' + (G.faceKind(nx, ny) ? ' up a ' + G.faceKind(nx, ny) + ' face' : '') + ': Athletics DC ' + G.climbDC(cs, u, G.faceKind(nx, ny)) + ', and a miss falls (' + Math.floor(ft / 10) + 'd6, prone).');
      x = nx; y = ny;
    }
    return out;
  };

  // ------------------------------------------------------------------ commands
  Battle.prototype.exec = function* (u, c) {
    var T = u.turn, self = this;
    switch (c.do) {
      case 'move': {
        if (c.fz != null && G.winged(u)) { yield* this.flyMove(u, c.x, c.y, c.fz); return; } // (at a layer: flight at a height, 10-08)
        var rm = G.reach(u, T.move), path = G.path(rm, c.x, c.y);
        if (!path || !path.length || !rm[c.x + ',' + c.y].stand) return;
        if (!byAI(u)) { // (a hand's click that would fall, or risk it: asked first -- fallLines; and a climb that takes a check, a Rope & Grapple in the pack: USE GRAPPLE -- 10-04, Griz)
          var fLs = this.fallLines(u, path), fDrop = fLs.some(function (s) { return /^A drop/.test(s); }), gA = this.grappleAt(u, path);
          if (gA && !fLs.some(function (s) { return /^A climb/.test(s); })) fLs.push('A climb of ' + gA.ft + ' ft: Athletics DC ' + gA.dc + ', and a miss slides back prone.');
          if (fLs.length) {
            var cdPath = null; // (a drop of 10 ft or more: CLIMB DOWN too, where the move can pay it -- the SRD's cost of a climb, a check over 5 ft, a miss a fall)
            if (fDrop) { u.cdown = true; try { var rmD = G.reach(u, T.move), pD = G.path(rmD, c.x, c.y); if (pD && pD.length && rmD[c.x + ',' + c.y].stand) cdPath = pD; } finally { delete u.cdown; } }
            var mOpts = [{ label: fDrop ? 'DROP' : 'CLIMB', value: 'go' }]; if (cdPath) mOpts.push({ label: 'CLIMB DOWN', value: 'down' }); if (gA) mOpts.push({ label: 'USE GRAPPLE (your action)', value: 'grapple' }); mOpts.push({ label: 'NOT THAT WAY', value: 0 });
            var mAns = yield { prompt: { who: u, title: u.name + (fDrop ? ': DROP?' : ': CLIMB?'), lines: fLs.concat(cdPath ? ['CLIMB DOWN: 5 ft of movement a step, a Strength (Athletics) check over 5 ft; a miss falls.'] : []).concat(gA ? ['USE GRAPPLE: ' + (gA.tdc ? 'throw it up first (DC ' + gA.tdc + ' DEX)' : 'tie it off first (no roll)') + ', then climb the rope with no check.'] : []), opts: mOpts } };
            if (!mAns) return;
            if (mAns === 'down') { u.cdown = true; try { yield* this.moveAlong(u, cdPath, { spend: true }); } finally { delete u.cdown; } return; }
            if (mAns === 'grapple') { // to the foot of the face, the grapple up, and on up the rope -- part way, if the move runs out
              if (gA.i) yield* this.moveAlong(u, path.slice(0, gA.i), { spend: true });
              if (u.x !== gA.foot[0] || u.y !== gA.foot[1] || u.hp <= 0 || u.dead) return;
              yield* this.exec(u, { do: 'rope', x: gA.at[0], y: gA.at[1], foot: gA.foot });
              if (!G.ropeOn(u, u.x, u.y, gA.at[0], gA.at[1])) return;
              yield* this.moveAlong(u, path.slice(gA.i), { spend: true, partial: true });
              return;
            }
          }
        }
        yield* this.moveAlong(u, path, { spend: true });
        if (!byAI(u) && Battle.passageAt(this, u.x, u.y) && T.move >= Math.floor(u.speed / 2)) yield* this.exec(u, { do: 'passage', ask: true }); // (the walk ended on a door: GO IN? / COME OUT? -- 10-04 night)
        return;
      }
      case 'rope': { // a Rope & Grapple set on a face (10-04, Griz: "as an item on the item wheel"; Battle.ropeSq): tied off from up there with no roll, or the grapple thrown up from below
        var rq = Battle.ropeSq(this, u, c.x, c.y, c.foot), rs0 = (this.inv || []).filter(function (x) { return x.id === 'rope' && x.n > 0; })[0];
        var ownR = u.ownRope != null; // (a lent ally's own Rope & Grapple, never the party's pack -- 10-05, Griz: "do the 'each trooper get one grappling hook' we did for the guests using party inventory - had to send barley back coz the troopers kept throwing them")
        if (!rq || (ownR ? !(u.ownRope > 0) : !rs0) || !T.action || T.attacksLeft) return;
        T.action = 0; u.facing = D.spr.facingFor(c.x - u.x, c.y - u.y); u.anim = 'attack'; u.animT = this.t; yield 10;
        if (!rq.top) {
          var re = RU.checkEdges(u, 'dex'), rr = re.dis.length && !re.adv.length ? Math.min(D.d(20), D.d(20)) : re.adv.length && !re.dis.length ? Math.max(D.d(20), D.d(20)) : D.d(20), rb = D.mod(u.abil ? u.abil.dex : 10), rt = rr + rb;
          var tdc = rq.dc || 10; // (10 to 30 ft, 2 more each 5 ft past: Battle.throwDC, 10-05)
          this.card(['{y}' + nameOf(u) + '{/} throws the grapple up ' + rq.ft + ' ft: DEX d20 ' + rr + ' ' + RU.sign(rb) + ' = ' + rt + ' against DC ' + tdc + '  ' + (rt >= tdc ? '{n}IT CATCHES{/}' : '{o}IT CLATTERS BACK{/}')], 200);
          yield 20; if (rt < tdc) { u.anim = 'idle'; return; }
        }
        if (ownR) u.ownRope--; else rs0.n--; this.ropes.push({ at: rq.at.slice(), foot: rq.foot.slice(), hp: 2, by: u.id }); D.sfx('confirm');
        var rFt = Math.round((G.map.gz(rq.at[0], rq.at[1]) - G.map.gz(rq.foot[0], rq.foot[1])) / G.map.def.step) * 2.5;
        this.card(['{y}' + nameOf(u) + '{/} ' + (rq.top ? 'ties the rope off and lets it down' : 'has the rope up') + ': ' + rFt + ' ft of it down the face.  {g}(climbed with no check; a climber may stop on it){/}'], 280);
        u.anim = 'idle'; yield 16; return;
      }
      case 'takerope': { // the rope's grapple taken up (10-04 night, Griz: "if one clicks on a square where a grapple is they should be able to take it"): from the ring, or a click on its square from beside it
        var rT = c.x != null ? Battle.ropeAt(this, c.x, c.y) : Battle.ropeNear(this, u); if (!rT) return;
        var tkT = Battle.canTakeRope(this, u, rT); if (!tkT.ok) { this.card(['{o}' + nameOf(u) + ' cannot take the rope up: ' + tkT.why + '.{/}'], 160); return; }
        if (!byAI(u) && c.x != null && (c.ask || !(u.x === rT.at[0] && u.y === rT.at[1]))) { // (c.ask: the self-click on the grapple's square -- Griz, 10-04 night: "standing on it makes me select character?") // (the click from beside it: take it, or only step onto its square)
          var rmT = G.reach(u, T.move), stepT = !(u.x === rT.at[0] && u.y === rT.at[1]) && !!(rmT[rT.at[0] + ',' + rT.at[1]] || {}).stand;
          var ansT = yield { prompt: { who: u, title: u.name + ': THE ROPE', lines: ['Take the rope and its grapple up and into the pack (the action)' + (stepT ? ', or just step onto its square.' : '.')], opts: [{ label: 'TAKE IT UP', value: 'take' }].concat(stepT ? [{ label: 'STEP THERE', value: 'step' }] : []).concat([{ label: 'NOT NOW', value: false }]) } };
          if (ansT === 'step') { var pT = G.path(rmT, rT.at[0], rT.at[1]); if (pT) yield* this.moveAlong(u, pT, { spend: true }); return; }
          if (ansT !== 'take') return;
        }
        T.action = 0; u.facing = D.spr.facingFor(rT.at[0] - u.x, rT.at[1] - u.y); u.anim = 'attack'; u.animT = this.t; yield 10;
        rT.cut = true; var iT = this.ropes.indexOf(rT); if (iT >= 0) this.ropes.splice(iT, 1);
        var rsT = (this.inv || []).filter(function (x) { return x.id === 'rope'; })[0]; if (rsT) rsT.n = (rsT.n || 0) + 1; else (this.inv = this.inv || []).push({ id: 'rope', n: 1 });
        D.sfx('confirm'); this.card(['{y}' + nameOf(u) + '{/} hauls the rope up and coils it, grapple and all, back into the pack.'], 240);
        u.anim = 'idle'; yield 16; return;
      }
      case 'stand': { // up off the floor by a click on your own square (10-04 night, Griz: "if prone with move left and click on tile your end stand"): half the speed, from the move (rules.js RU.rise)
        if (!u.conds.prone || !RU.rise(this, u)) return;
        u.anim = 'idle'; yield 8; return;
      }
      case 'passage': { // through the vault door and up the stair inside, out onto the roof -- and back down (10-04 night, Griz: "Front doors possible?"): Battle.passageAt; the rest of the turn's move, half the speed at least
        var ps = Battle.passageAt(this, u.x, u.y); if (!ps) return;
        var halfP = Math.floor(u.speed / 2), occP = G.occupant(ps.dest[0], ps.dest[1]);
        if (T.move < halfP || occP || u.conds.restrained || (u.size || 1) > 1 || (u.hang && G.hanging(u))) { this.card(['{o}' + nameOf(u) + ' cannot go through ' + ps.name + ': ' + (occP ? 'someone stands at the other end' : T.move < halfP ? 'it takes half the speed at least (' + halfP + ' ft)' : 'not like this') + '.{/}'], 180); return; }
        if (!byAI(u) && c.ask) { var ansP = yield { prompt: { who: u, title: u.name + ': ' + (ps.inward ? 'GO IN?' : 'COME OUT?'), lines: ['Through ' + ps.name + (ps.inward ? ' and up the stair inside, out onto the roof' : ' and down the stair, out onto the street') + ': the rest of this turn\'s movement (' + T.move + ' ft).'], opts: [{ label: ps.inward ? 'GO IN' : 'COME OUT', value: true }, { label: 'NOT NOW', value: false }] } }; if (!ansP) return; }
        u.facing = D.spr.facingFor(ps.dest[0] - u.x, ps.dest[1] - u.y); u.anim = 'walk'; yield 10;
        T.moved = (T.moved || 0) + T.move; T.move = 0;
        delete u.hang; u.x = ps.dest[0]; u.y = ps.dest[1]; u.tween = null; u.anim = 'idle';
        this.card(['{y}' + nameOf(u) + '{/} goes through ' + ps.name + (ps.inward ? ' and up the stair inside: out onto the roof.' : ' and down the stair inside: out onto the street.')], 240);
        this.keepInView(u); yield 12;
        if (u.hp > 0 && !u.dead) { this.lostCover(u); if (RU.canAct(u)) this.findsHidden(u); }
        return;
      }
      case 'barreltorch': { // a lit torch out of the barrel behind the houses (10-05 night, Griz: "barrel yes"; lit and free, "no, that's good"): the turn's free object, a hand for it, never the last
        if (!this.torchBarrel || !Battle.besideBarrel(this, u) || u.torch || T.freeObj || !D.light.handForLight(u) || (u.hang && G.hanging(u))) return;
        T.freeObj = true; u.facing = D.spr.facingFor(this.torchBarrel[0] - u.x, this.torchBarrel[1] - u.y); u.anim = 'attack'; u.animT = this.t; yield 8;
        u.torch = { lit: true }; D.light.regrip(u); D.sfx('fire');
        this.card(['{y}' + nameOf(u) + '{/} takes a torch from the barrel and strikes it alight.  {g}(there is always another){/}'], 220);
        u.anim = 'idle'; yield 12; return;
      }
      case 'bucketrope': { // a Rope & Grapple out of Fountain Street's bucket (10-04 night, Griz): free, one a turn, never the last
        if (!this.ropeBucket || !Battle.besideBucket(this, u) || T.tookRope || u.guest) return;
        T.tookRope = true; u.facing = D.spr.facingFor(this.ropeBucket[0] - u.x, this.ropeBucket[1] - u.y); u.anim = 'attack'; u.animT = this.t; yield 8;
        var rsB = (this.inv || []).filter(function (x) { return x.id === 'rope'; })[0]; if (u.ownRope != null) u.ownRope++; else if (rsB) rsB.n = (rsB.n || 0) + 1; else (this.inv = this.inv || []).push({ id: 'rope', n: 1 }); // (a lent ally's own: never the party's pack, 10-05)
        D.sfx('confirm'); this.card(['{y}' + nameOf(u) + '{/} takes a Rope & Grapple out of the bucket.  {g}(there is always another){/}'], 220);
        u.anim = 'idle'; yield 12; return;
      }
      case 'cutrope': { // a blow at a rope a foe hangs on, from its top (10-04 night, Griz: "unless someone is on it - in which case I think they'll attack it if that's not an ally"): Battle.cutRope, the AI's own
        var rC = Battle.ropeAt(this, c.x, c.y); if (!rC) return;
        var ctC = Battle.canCutRope(this, u, rC); if (!ctC || !ctC.ok) { if (ctC) this.card(['{o}' + nameOf(u) + ' cannot strike the rope: ' + ctC.why + '.{/}'], 160); return; }
        if (u.conds.hidden) { delete u.conds.hidden; delete u.hidTotal; } // (a blow struck from hiding gives it away, as any attack does)
        yield* this.cutRope(u, rC, u.weapon);
        return;
      }
      case 'ropeclimb': { // part way along a rope, and hang there (10-04, Griz: "a roped face is gonna be a movement stopping point"; ui.js: a rope's far end, past the move -- or, with c.z, a
        // rung the mouse picked (10-04 night, Griz: "I can't currently target half-way up the rope with a highlighted wall and choose that as my intentional move" -- "better than
        // half-way stop plz, these are 45 ft ropes i think"; ui.js ropeRung): to exactly that height, up or down, from an end or from where it hangs, and the ground if a hanger picked it
        var rr0 = (this.ropes || []).filter(function (r) { return !r.cut && ((r.at[0] === c.x && r.at[1] === c.y) || (r.foot[0] === c.x && r.foot[1] === c.y)); })[0];
        if (!rr0 || (u.size || 1) > 1) return;
        var hangR = !!(u.hang && G.hanging(u) && u.hang.rope === rr0), stZr = G.map.def.step;
        var near = hangR ? rr0.foot : rr0.at[0] === c.x && rr0.at[1] === c.y ? rr0.foot : rr0.at, rmR = G.reach(u, T.move), here = hangR || (u.x === near[0] && u.y === near[1]), pre = here ? [] : G.path(rmR, near[0], near[1]);
        if (!pre || (!here && !(rmR[near[0] + ',' + near[1]] || {}).stand)) return;
        var left = T.move - (here ? 0 : rmR[near[0] + ',' + near[1]].cost), zFrom = hangR ? u.hang.z : G.map.gz(near[0], near[1]);
        if (c.z != null) { // a rung picked: no question, the pick was the intent
          var zTo = Battle.ropeMark(rr0, c.z), stepsR = Math.round(Math.abs(zTo - zFrom) / stZr); // (on a 5 ft mark above the foot, or an end -- a height off the marks is taken to the nearest: 10-05)
          if (stepsR < 1 || left < stepsR * 5) return; // (5 ft of movement a step along the rope: 10 a 5 ft mark)
          if (hangR && zTo < zFrom) { // down the rope from where it hangs, to a lower rung or to its foot (the rope's found-not-built of 10-04: a hanger could go up or step off, never down part way)
            var ground = zTo <= G.map.gz(u.x, u.y) + 0.5, underR = ground ? G.occupant(u.x, u.y, u, { z: G.map.gz(u.x, u.y), h: G.bodyH(u) }) : null;
            if (underR) { this.card(['{o}' + nameOf(u) + ' cannot come down: ' + nameOf(underR) + ' stands at the foot of the rope.{/}'], 200); return; } // (one standing at the foot holds it; the hanger hangs on -- 10-05)
            u.tween = { fx: u.x, fy: u.y, fz: zFrom, t: 0, dur: this.pace(STEP_FRAMES + 2 * stepsR, true), mode: 'ropedown' };
            if (ground) delete u.hang; else u.hang.z = zTo;
            T.move -= stepsR * 5; T.moved = (T.moved || 0) + stepsR * 5;
            this.card(['{y}' + nameOf(u) + '{/} lets down ' + stepsR * 2.5 + ' ft of the rope and ' + (ground ? 'stands at its foot.' : 'hangs there, ' + Math.round((zTo - G.map.gz(u.x, u.y)) / stZr) * 2.5 + ' ft up.')], 260);
            this.keepInView(u); yield STEP_FRAMES + 2 * stepsR; u.anim = 'idle';
            if (ground && u.hp > 0 && !u.dead) { this.lostCover(u); if (RU.canAct(u)) this.findsHidden(u); }
            return;
          }
          var endR = zTo > zFrom ? rr0.at : rr0.foot;
          yield* this.moveAlong(u, pre.concat([[endR[0], endR[1]]]), { spend: true, stopZ: zTo });
          return;
        }
        var allFt = Math.round(Math.abs(G.map.gz(c.x, c.y) - zFrom) / stZr) * 2.5, gotFt = Battle.ropeSteps(rr0, zFrom, G.map.gz(c.x, c.y) > zFrom, left) * 2.5; // (to the farthest 5 ft mark the move pays, 10 ft of movement a mark: 10-05)
        if (gotFt <= 0) return;
        var ansR = yield { prompt: { who: u, title: u.name + ': CLIMB THE ROPE?', lines: ['The rope is ' + allFt + ' ft from here; the move left takes ' + nameOf(u) + ' ' + gotFt + ' ft along it, to hang there.', '(Or point at the face itself: the rung the mouse is on is where the climb stops.)'], opts: [{ label: 'CLIMB', value: true }, { label: 'NOT NOW', value: false }] } };
        if (!ansR) return;
        yield* this.moveAlong(u, pre.concat([[c.x, c.y]]), { spend: true, partial: true });
        return;
      }
      case 'attack': {
        if (!c.target || c.target.dead || c.target.hp <= 0) return; // (no target: nothing is spent -- a stray command burned Katarina's action 09-29)
        if (RU.charmedBy(u, c.target)) { this.card(['{o}' + u.name + ' is charmed: no raising a hand to ' + (c.target.side === 'foe' ? Battle.nm(c.target) : c.target.name) + '.{/}'], 200); return; }
        if (u.conds.disarmed) { this.card(['{o}' + u.name + ' has dropped the weapon (the turn is spent picking it up).{/}'], 200); return; }
        if (!T.attacksLeft) { if (!T.action) return; T.action = 0; T.attackAction = true; T.attacksLeft = T.slowed ? 1 : u.attacks + (T.hasteAction ? 1 : 0); } // (Haste's one more, Slow's one: js/grimoire.js)
        if (u.weapon.ammo && !this.ammoLeft(u)) { this.card(['{o}' + u.name + ' has no ' + this.itemName(u.weapon.ammo).toLowerCase() + ' left.{/}'], 120); return; }
        T.attacksLeft--;
        if (u.weapon.ammo) this.spendAmmo(u);
        if (c.target.tendril) yield* this.strikeTendril(u, c.target, u.weapon); // (the roper's tendril on a friend, or on you: tendrilOn, 10-02)
        else yield* this.attack(u, c.target, u.weapon);
        if (u.conds.hidden) delete u.conds.hidden;
        return;
      }
      case 'cast': {
        if (D.magic.data(c.id) && D.magic.data(c.id).kind !== 'buff') this.noteHeard(u); // (a spell at someone gives the square away too: 10-01c)
        yield* D.magic.cast(this, u, c.id, c.slot, c.target);
        if (u.conds.hidden && D.magic.data(c.id).kind !== 'buff') delete u.conds.hidden;
        if (this.units.some(function (w) { return w.ready && w.reaction > 0; })) yield* this.readyHook(u); // (a spell that brings a foe into sight -- a darkness ended, the invisible lit -- or moves one: the readied strikes, 10-02)
        if (!(c.id === 'dancinglights' && u.conc && u.conc.id === 'dancinglights' && u.turn.bonusSpell === false)) this.endInvis(u, 'the spell'); // (Invisibility, Mislead: a spell cast ends it)
        return;
      }
      case 'item': {
        // (a click on the hero's own square with an item aimed: asked first, nothing spent on NOT NOW -- 10-05 night, his play: the pie refused on Aurdin, down, then a click on Lymen's own
        // square ate it and his action; ui.js actAt sends askSelf)
        if (c.askSelf && !byAI(u)) { var itS = window.DS.DATA.items[c.id], okS = yield { prompt: { who: u, title: u.name + ': ' + (itS ? itS.name.toUpperCase() : 'THE ITEM') + '?', lines: ['On ' + u.name + '?'], opts: [{ label: 'USE IT ON ' + u.name.toUpperCase(), value: true }, { label: 'NOT NOW', value: 0 }] } }; if (!okS) return; }
        yield* this.useItem(u, c.id, c.target, c); return;
      } // (c: the oil flask's square, c.x/c.y, when it is thrown at the ground -- js/oil.js)
      case 'breakfree': { yield* D.magic.breakFree(this, u); return; }
      case 'droptorch': T.freeObj = true; D.light.dropTorch(this, u); return;
      case 'putaway': { // (the ring's PUT AWAY, 10-05: the weapon kept on u.sheathed, an unarmed strike in its place -- the save's equip untouched)
        if (u.sheathed || !u.weapon || !u.weapon.id || T.freeObj) return;
        T.freeObj = true; u.sheathed = u.weapon; u.weapon = D.save.weaponOf(Object.assign({}, u.src, { equip: Object.assign({}, u.src.equip, { weapon: null }) }));
        D.sfx('confirm'); this.card(['{y}' + u.name + '{/} puts the ' + u.sheathed.name + ' away: a hand free.  {g}(' + u.weapon.name + ' ' + RU.sign(u.weapon.atk) + ', ' + u.weapon.dice + RU.sign(u.weapon.mod) + ' till it is drawn){/}'], 220); return;
      }
      case 'drawweapon': { // (DRAW: back in hand -- a hand for it)
        if (!u.sheathed || T.freeObj || D.light.handsFree(u) <= 0) return;
        T.freeObj = true; u.weapon = u.sheathed; delete u.sheathed; D.light.regrip(u);
        D.sfx('confirm'); this.card(['{y}' + u.name + '{/} draws the ' + u.weapon.name + '.'], 180); return;
      }
      case 'dousetorch': T.freeObj = true; D.light.douseTorch(this, u); return;
      case 'pickuptorch': { // from the ring at its feet; or, as the rope's grapple, a click on its square from beside it -- take it up, or only step there, asked -- and the self-click on it asked (10-05, Griz: "torch pick up works like grapple hook")
        var lxP = c.x != null ? c.x : u.x, lyP = c.y != null ? c.y : u.y, tP = D.light.torchAt(this, lxP, lyP); if (!tP) return;
        var tkP = D.light.canTake(this, u, tP); if (!tkP.ok) { this.card(['{o}' + nameOf(u) + ' cannot take the ' + D.light.word(tP) + ' up: ' + tkP.why + '.{/}'], 160); return; }
        if (!byAI(u) && c.x != null && (c.ask || !(u.x === lxP && u.y === lyP))) {
          var rmP = G.reach(u, T.move), stepP = !(u.x === lxP && u.y === lyP) && !G.occupant(lxP, lyP) && !!(rmP[lxP + ',' + lyP] || {}).stand;
          var ansP = yield { prompt: { who: u, title: u.name + ': THE ' + D.light.tag(tP), lines: ['Take the ' + D.light.word(tP) + ' up (free: the hand on an object this turn)' + (stepP ? ', or just step onto its square.' : '.')], opts: [{ label: 'TAKE IT UP', value: 'take' }].concat(stepP ? [{ label: 'STEP THERE', value: 'step' }] : []).concat([{ label: 'NOT NOW', value: false }]) } };
          if (ansP === 'step') { var pP = G.path(rmP, lxP, lyP); if (pP) yield* this.moveAlong(u, pP, { spend: true }); return; }
          if (ansP !== 'take') return;
        }
        T.freeObj = true; D.light.pickUp(this, u, lxP, lyP); return;
      }
      case 'land': { if (!G.aloft(u)) return; var ftL = G.feetUp(u.fz - G.groundAt(u, u.x, u.y)); if (T.move < ftL) return; T.move -= ftL; yield* this.flyTo(u, G.groundAt(u, u.x, u.y), true); this.cache = null; return; } // (a flier straight down: flight at a height, 10-08)
      case 'throwtorch': { yield* D.light.throwTorch(this, u, c.x, c.y); return; }
      case 'hooddown': T.freeObj = true; yield* D.light.hood(this, u, true); return;
      case 'hoodup': T.freeObj = true; yield* D.light.hood(this, u, false); return;
      case 'dashmove': {
        var dsh = Battle.dashes(u), rmF = G.reach(u, T.move + u.speed * dsh.length), far = rmF[c.x + ',' + c.y], opts = [];
        if (!far || u.conds.restrained || u.conds.dancing) return;
        var fLsD = this.fallLines(u, G.path(rmF, c.x, c.y) || []); // (a drop or a tall climb on the way: said in the dash's own question -- NOT THAT FAR declines both)
        var bName = (u.cls === 'rogue' && u.lvl >= 2) || u.cunning ? 'CUNNING DASH' : 'RETREAT DASH', bWhy = bName === 'CUNNING DASH' ? 'Cunning Action' : 'Expeditious Retreat';
        if (far.cost > T.move + u.speed) { if (dsh.length > 1) opts.push({ label: 'DASH + ' + bName + ' (action and bonus)', value: 'ab' }); } // (it takes both: 10-04, Griz -- the rogue and the 30 ft face)
        else {
          if (dsh.indexOf('b') >= 0) opts.push({ label: bName + ' (bonus)', value: 'b' }); // (Cunning Action; Expeditious Retreat)
          if (dsh.indexOf('a') >= 0) opts.push({ label: 'DASH (your action)', value: 'a' });
        }
        if (!opts.length) { this.card(['{g}No dash left this turn.{/}']); return; }
        opts.push({ label: 'NOT THAT FAR', value: 0 });
        var how = yield { prompt: { who: u, title: u.name + ': DASH THERE?', lines: ['That square is ' + far.cost + ' ft away; ' + T.move + ' ft of move is left.'].concat(fLsD), opts: opts } };
        if (!how) return;
        if (how.indexOf('b') >= 0) T.bonus = 0; if (how.indexOf('a') >= 0) T.action = 0;
        T.move += u.speed * how.length;
        this.card(['{y}' + u.name + '{/}' + (how === 'ab' ? ' dashes twice (Dash and ' + bWhy + ')' : (how === 'b' ? ' (' + bWhy + ')' : '') + ' dashes') + ': {c}+' + u.speed * how.length + ' ft{/}.']);
        var rm2 = G.reach(u, T.move), path2 = G.path(rm2, c.x, c.y);
        if (path2 && path2.length) yield* this.moveAlong(u, path2, { spend: true });
        return;
      }
      case 'leave': { yield* this.leave(u); return; }
      case 'ignite': T.bonus = 0; u.conds.ablaze = true; D.sfx('fire'); FX.sparkle(u, 'fire', 18); this.card(['{y}' + u.name + '{/} speaks the word: the ' + u.weapon.name + ' {o}bursts into flame{/} (+' + u.weapon.flame + ' fire on a hit).']); return;
      case 'douse': T.bonus = 0; delete u.conds.ablaze; this.card(['{y}' + u.name + '{/} speaks the word again: the blade goes dark.']); return;
      case 'dash': if (u.conds.restrained || u.conds.dancing) return; D.sfx('run'); T.action = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} dashes: {c}+' + u.speed + ' ft{/}.']); return;
      case 'cdash': if (u.conds.restrained || u.conds.dancing) return; D.sfx('run'); T.bonus = 0; T.move += u.speed; this.card(['{y}' + u.name + '{/} (' + ((u.cls === 'rogue' && u.lvl >= 2) || u.cunning ? 'Cunning Action' : 'Expeditious Retreat') + ') dashes: {c}+' + u.speed + ' ft{/}.']); return;
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
      case 'breaktendril': { // BREAK THE TENDRIL (SRD 5.1 Roper: "A tendril can also be broken if a creature takes an action and succeeds on a DC 15 Strength check against it"):
        // the one it holds (at disadvantage on STR checks while held: `weak`) or anyone beside; Athletics, as breakFree and PULL IT OFF read it. 10-02
        var hw = c.target, st2 = hw && Battle.tendrilOn(u, hw, this.units); if (!st2) return;
        var tn = hw.conds.restrained.tendril, dc2 = tn.breakDC || 15, en2 = u.conds.enlarged, ce2 = RU.checkEdges(u, 'str');
        var adv2 = !!(en2 && !en2.down) || ce2.adv.length > 0, dis2 = !!(u.conds.poisoned || u.conds.frightened || (en2 && en2.down) || (u.conds.restrained && u.conds.restrained.weak)) || ce2.dis.length > 0;
        var b1 = D.d(20), b2 = D.d(20), bd20 = adv2 && !dis2 ? Math.max(b1, b2) : dis2 && !adv2 ? Math.min(b1, b2) : b1;
        var pb2 = D.mod(u.abil.str) + (u.cls === 'fighter' ? u.prof : 0), btot = bd20 + pb2;
        T.action = 0; RU.spendHelp(u); D.sfx('run'); if (hw !== u) this.turnTo(u, faceTo(u, hw));
        var luck2 = RU.darkLuck(u, dc2 - btot); if (luck2) btot += luck2;
        this.card(['{y}' + u.name + '{/} takes hold of the tendril' + (hw === u ? '' : ' on ' + hw.name) + ' and wrenches: STR d20 ' + bd20 + (adv2 !== dis2 ? (adv2 ? ' {n}(advantage){/}' : ' {o}(disadvantage){/}') : '') + ' ' + RU.sign(pb2) + (luck2 ? ' {y}+' + luck2 + ' dark one\'s own luck{/}' : '') + ' = ' + btot + ' vs DC ' + dc2 + '  ' + (btot >= dc2 ? '{n}BROKEN{/}' : '{g}it holds{/}')]);
        if (btot >= dc2) this.tendrilGone(st2.by, hw, 'broken');
        yield 30; return;
      }
      case 'ready': { // READY (SRD 5.1: "you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn" -- the trigger, then the
        // action): one trigger here, the first foe that comes within reach -- for a bow or a spell, into its sight and range -- a burrower up out of the ground, a phase spider
        // out of the Ethereal, one walking up, the invisible seen; and the action a single weapon attack, or an attack spell cast now and held ("When you ready a spell, you cast it
        // as normal but hold its energy ... holding onto the spell's magic requires concentration"). Sprung by readyHook; let go at the next turn (rules.js startTurn).
        // 10-02, handoff-2026-10-01-the-tendrils-and-ready §4.2; invented.json ready-one-trigger
        // THE TRIGGER, THEN THE WHEEL (10-02, Griz: "what if we use the menu you used to give 2 or 3 trigger conditions, then they navigate the wheel to what they're
        // readying - yes closer to SRD"; "go with 1&2 - let's make 3 'an ally goes down' for readied healers. foe casts a spell you can see, if you mean foe you can see
        // casts a spell"; "we'll just not have buttons they can't click"): a player's READY asks WHEN (Battle.READY_TRIGGERS, a numbered menu) and leaves B.readying for
        // the wheel (js/ui.js readyRing: the weapon, the spells that take an action -- the level tiers greyed where there's no slot -- or a move); its pick comes back
        // as { do: 'ready', trigger, what, id, slot }, and only then is the action spent. The AI's (c.pick: 'weapon', 'alt' or a spell's entry) is the first trigger.
        // SRD 5.1: "First, you decide what perceivable circumstance will trigger your reaction. Then, you choose the action you will take in response to that trigger,
        // or you choose to move up to your speed in response to it"
        if (!T.action || T.attacksLeft || u.ready) return;
        if (!c.trigger && !c.pick) {
          var tp = byAI(u) ? 0 : yield { prompt: { who: u, title: u.name + ': READY -- WHEN?', lines: ['Reach is sight for a bow or a spell. Readied, your turn ends.'], opts: Battle.READY_TRIGGERS.map(function (t) { return { label: t.label, value: t.id }; }).concat([{ label: 'NOT NOW', value: 0 }]) } };
          if (tp) this.readying = { who: u, trigger: tp }; // (nothing spent yet: the wheel takes it from here)
          return;
        }
        this.readying = null;
        var trig = c.trigger || 'near', pk = c.pick || c.what, rd = { trigger: trig };
        if (pk === 'weapon' || pk === 'alt') {
          var rw = pk === 'alt' ? u.alt : u.weapon; if (!rw || !rw.name || u.conds.disarmed) return;
          rd.what = 'weapon'; rd.name = rw.name; rd.wp = rw;
        } else if (pk === 'move') {
          if (!(u.speed > 0) || u.conds.restrained) return;
          rd.what = 'move'; rd.name = 'move';
        } else if (pk === 'cmd') { // a class feature or a plain action that takes the action (10-02, Griz: "1 - yes but not disengage"): Lay on Hands, a Channel Divinity, Help, Dodge, Hide ...
          var cm = this.commands(u).filter(function (x) { return x.id === c.cmd && (x.ok || x.ready) && x.cost === 'A'; })[0]; if (!cm) return; // (`ready`: a Mascot's special open to READY with no one in range yet -- js/mpmon.js, 10-08, Griz: "why can't I ready cannonball")
          rd.what = 'cmd'; rd.name = cm.label.toLowerCase(); rd.cmd = cm.id; rd.tool = cm.tool || null;
          if (cm.ready) { rd.range = cm.ready.range; rd.see = !!cm.ready.see; rd.self = !!cm.ready.self; } // (the trigger's reach is the special's own: readyTargets; `self`, one centred on its user -- Group Hug, the Fountain: the reach is the user's own, 10-08)
        } else if (pk === 'item') { // an item used (Griz: "Add usable items beyond potions as well")
          var itm = this.itemList(u).filter(function (x) { return x.id === c.item && x.ok; })[0]; if (!itm) return;
          rd.what = 'item'; rd.name = itm.name; rd.item = itm.id; rd.self = /^(bucket|light)$/.test(itm.use.effect);
        } else {
          if (T.bonusSpell) return; // (a bonus-action spell cast this turn: no spell readied, a cantrip neither -- RULED 10-05, Griz: "Casting a spell with a bonus action means you can't ready a spell (other actions still ready-able)")
          var sid = typeof pk === 'object' && pk ? pk.id : c.id, re = D.magic.list(this, u, { anyTarget: true }).filter(function (e) { return e.id === sid && e.ok && e.g && e.g.time === 'A'; })[0];
          if (!re) return;
          var rsl = (typeof pk === 'object' && pk && pk.slot) || c.slot || re.slot; if (re.level && re.levels && re.levels.indexOf(rsl) < 0) rsl = re.slot;
          rd.what = 'spell'; rd.name = re.name; rd.id = re.id; rd.slot = rsl; rd.level = re.level;
        }
        T.action = 0;
        if (rd.what === 'spell' && rd.level) u.slots[rd.slot - 1]--;
        if (rd.what === 'spell') T.spellAction = rd.level ? 'leveled' : 'cantrip'; // (cast now and held: the turn's action spell, as magic.js cast marks it)
        // READY ENDS THE TURN (RULED 10-05, Griz: "Making yourself ready and waiting to do it implies you've decided to wait for a trigger until your next turn and that you're
        // done moving and using bonus actions - but the action stored as reaction goes off if triggered on someone else's turn"): the move and the bonus action left go
        // with it (heroTurn breaks on T.waits), and it springs only on another's turn (readyHook, readyOn). The SRD's own order holds before it: move and the bonus action first
        T.move = 0; T.bonus = 0; T.waits = true;
        u.ready = rd;
        if (trig === 'near') rd.had = this.readyHad(u, rd);
        this.readySnap(); // (who stands now: "one of us goes down" is told from it)
        if (rd.what === 'spell') D.magic.concentrate(this, u, 'ready', 'a readied ' + rd.name, function () { if (u.ready && u.ready.what === 'spell') delete u.ready; }); // (concentration broken: the held magic dissipates, and the slot with it)
        D.sfx('buff'); FX.ring(u, 'silver', 20);
        this.card(['{y}' + u.name + '{/} readies ' + (rd.what === 'weapon' ? 'the ' + rd.name : rd.what === 'move' ? 'a move' : rd.what === 'cmd' ? rd.name.toUpperCase() : rd.what === 'item' ? 'the ' + rd.name.toLowerCase() : rd.name + (rd.level ? ' (L' + rd.slot + ')' : '')) + ': ' + Battle.readyWhen(rd) + '.  {g}(the turn ends: the reaction, on another\'s turn, before the next){/}']);
        yield 24; return;
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
      case 'search': { yield* this.search(u); return; }
      case 'lay': { yield* this.layOnHands(u, c.target, c.cure); return; }
      default: if (D.features && D.features.exec) yield* D.features.exec(this, u, c); // (a class feature's button: js/features.js)
    }
  };

  // ------------------------------------------------------------------ movement, square by square, provoking as it goes
  Battle.prototype.moveAlong = function* (u, path, o) {
    var T = u.turn;
    // the gait: a sheet with a `slither` row plays it for a move of three squares or more, its walk for less (the grick, 10-02, Griz: "can we
    // do the old one for 1-2 squares and the new if they're going 3 squares or more" -- coiled and swaying for a step or two, laid flat to go far)
    var gait = o && o.gait && D.spr.anim(u.sheet, o.gait) ? o.gait : path.length >= 3 && D.spr.anim(u.sheet, 'slither') ? 'slither' : 'walk'; // (o.gait: a step of a row's own -- the Grey Road's Give Ground plays `backstep`, 10-08)
    u.anim = gait;
    // flat when it sets off: it gets up for half its speed if the walk has it, else it crawls (grid.js G.prone, rules.js RU.rise; SRD 5.1)
    if (u.conds.prone && o && o.spend && !u.ethereal) RU.rise(this, u);
    var fell = false;
    for (var i = 0; i < path.length; i++) {
      var nx = path[i][0], ny = path[i][1], cost = G.stepCost(u, u.x, u.y, nx, ny, { ghost: u.ethereal });
      if (fell && o && o.spend && T.move < cost) { u.anim = 'idle'; return; } // (knocked down on the way and up again, or crawling: the walk runs out short of the square)
      // leaving a hostile's reach without Disengage provokes, right before the step
      if (!T.disengaged && !u.ethereal && !(o && o.noOA)) {
        var selfO = this, prov = this.units.filter(function (w) {
          return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.conds.turned && !w.ethereal && !w.riding && !(w.weapon && w.weapon.ranged) && !w.missionOnly // (nothing but the window takes no swing at anyone: 10-05) (a rider -- a darkmantle attached, "can attack no other creature except the target"; a familiar on its wizard -- takes none)
            && G.dist(w, u) <= G.reachOf(w) && G.dist(w, u, null, null, nx, ny) > G.reachOf(w) && !(w.conds.hidden && false)
            && (!u.conds.hidden || (u.hidTotal != null ? !!selfO.spots(w, u) : selfO.seenBy(w, u) === 2)) // (SRD 5.1: "a hostile creature that you can see" -- one it cannot see she leaves unseen; 10-04, Griz: fix)
            && D.magic.sees(D.battle, w, u) && !RU.charmedBy(w, u); // (a creature you can see: not into or out of darkness; and never at its charmer)
        });
        for (var k = 0; k < prov.length; k++) {
          var w = prov[k], take = true;
          if (w.side === 'party' && !w.guest && !w.ally) { // (a lent ally's opportunity attack is the AI's, never the hand's to approve -- 10-05, Griz after his play: "ai needs to approve opp attacks for NPCs")
            u.anim = 'idle';
            take = yield { prompt: { who: w, title: w.name + ': OPPORTUNITY ATTACK?', lines: [(u.side === 'foe' ? Battle.nm(u, true) : u.name) + ' is leaving ' + w.name + "'s reach." + (w.ready ? '  (the reaction is what the readied ' + w.ready.name + ' waits on)' : '')], opts: [{ label: 'STRIKE', value: true }, { label: 'LET IT GO', value: false }] } }; // (a readied strike waits on the same reaction: SRD 5.1, one a round -- 10-02)
            u.anim = gait;
          }
          if (take) {
            w.reaction = 0;
            if (w.kind === 'keeper' && D.keeper && D.keeper.CFG.oaWave) { // (the Keeper's opportunity attack as a wave toward the deep -- not ruled, behind D16.keeper.CFG.oaWave, off: js/keeper.js)
              var pushed = yield* D.keeper.oaWave(this, w, u);
              if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; }
              if (pushed) { u.anim = 'idle'; if (o && o.spend) T.move = 0; return; }
              continue;
            }
            this.card(['{o}' + w.name + '{/}: an opportunity attack on ' + (u.side === 'foe' ? (u.named ? '' : 'the ') + shortName(u) : u.name) + '.']);
            var atk = w.weapon || w.attacks.shortsword || w.attacks.longsword || w.attacks.bite
              || w.attacks[Object.keys(w.attacks).filter(function (k) { return !w.attacks[k].ranged; })[0]]; // any melee attack (the morningstar)
            if (!atk) continue;
            if (u.conds.hidden) { delete u.conds.hidden; delete u.hidTotal; this.card(['{o}' + nameOf(u) + ' gives the position away: no longer hidden.{/}  {g}(an opportunity attack breaks stealth){/}'], 200); } // (10-04, Griz)
            yield* this.attack(w, u, atk, { oa: true });
            if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; }
            // held by the blow (a grip on the hit: the darkmantle's crush, a tendril), or stunned or put down by it: no more walking -- its speed is 0
            // (10-01, Griz in the Fork: the darkmantle's opportunity attack took Barley and he walked on a square, held from 10 ft)
            if (u.conds.restrained || u.conds.paralyzed || u.conds.stunned || u.conds.asleep) { u.anim = 'idle'; if (o && o.spend) T.move = 0; return; }
            // knocked flat by it (the Keeper's Slam; 10-03, Griz after the stream: "prone too long?"): it stands for half its speed if the walk has that
            // much left (SRD 5.1), else it crawls on; the walk runs out where it runs out
            if (u.conds.prone && o && o.spend && !u.ethereal) { RU.rise(this, u); fell = true; cost = G.stepCost(u, u.x, u.y, nx, ny, { ghost: u.ethereal }); if (T.move < cost) { u.anim = 'idle'; return; } }
          }
        }
      }
      if (!(o && o.keepFacing)) u.facing = D.spr.facingFor(nx - u.x, ny - u.y); // (o.keepFacing: a step back that keeps its face to the foe -- Give Ground, 10-08)
      var wasIn = D.magic.webAt(this, u), stepFrom = { x: u.x, y: u.y }; // (stepFrom: the square it left -- the Keeper's readied wall asks which way it stepped along the stair; the tween is gone by then in the page's frame loop)
      var csN = G.climbsUp(u, u.x, u.y, nx, ny), kindN = G.faceKind(nx, ny), cDC = G.climbDC(csN, u, kindN), z0 = G.gzAt(u, u.x, u.y), z1 = G.gzAt(u, nx, ny), stZ = G.map.def.step;
      // up a face: up it first and then over the lip; off one: out over the edge and then down (10-04, Griz: "can we move them vertical"); a longer step for a taller face (ui.js unitPos)
      var cliffM = z1 - z0 > stZ ? 'climb' : z0 - z1 > stZ ? 'drop' : null, stF = STEP_FRAMES + (cliffM ? 2 * Math.round(Math.abs(z1 - z0) / stZ) : 0);
      // a rope (grid.js G.ropeOn): along it, no check and no fall, up the face or out over the edge and down it; off one part way up, down it first and then the step
      var rpS = G.ropeOn(u, u.x, u.y, nx, ny), hung0 = !!(u.hang && G.hanging(u));
      if (rpS) cliffM = z1 > z0 ? 'climb' : 'ropedown'; else if (hung0) cliffM = 'climb';
      // part way along it, as far as the move goes, and it hangs there (10-04, Griz: "a roped face is gonna be a movement stopping point"; exec 'ropeclimb' asks it)
      // ... or to the rung the hand picked (o.stopZ: exec 'ropeclimb' with z, 10-04 night), whether or not the move could have taken it the whole way
      var stopR = !!(rpS && o && o.spend && o.stopZ != null) && Math.round(Math.abs(o.stopZ - z0) / stZ) < Math.round(Math.abs(z1 - z0) / stZ);
      if (rpS && o && o.spend && (stopR || (o.partial && T.move < cost))) {
        var upR = z1 > z0, stpR = stopR ? Math.round(Math.abs(o.stopZ - z0) / stZ) : Battle.ropeSteps(rpS, z0, upR, T.move, true); if (stpR < 1 || T.move < stpR * 5) { u.anim = 'idle'; return; } // (to the farthest 5 ft mark the move pays, 10 ft of movement a mark; an odd 5 ft left unspent -- 10-05)
        var zH = z0 + (upR ? 1 : -1) * stpR * stZ, endZ = upR ? G.map.gz(rpS.at[0], rpS.at[1]) : G.map.gz(rpS.foot[0], rpS.foot[1]);
        u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(STEP_FRAMES + 2 * stpR, true), mode: upR ? 'climb' : 'ropedown' };
        u.x = rpS.foot[0]; u.y = rpS.foot[1]; u.hang = { rope: rpS, z: zH };
        if (o.spend) { T.move -= stpR * 5; T.moved = (T.moved || 0) + stpR * 5; }
        this.card(['{y}' + nameOf(u) + '{/} ' + (upR ? 'climbs' : 'lets down') + ' ' + stpR * 2.5 + ' ft of the rope and hangs there, ' + Math.round(Math.abs(endZ - zH) / stZ) * 2.5 + ' ft to go.'], 260);
        this.keepInView(u); yield STEP_FRAMES + 2 * stpR; u.anim = 'idle';
        if (this.readyArmed()) yield* this.readyHook(u, 'move'); // (part way up a rope is a move too -- 10-05)
        return;
      }
      // ... and down one (10-05 night, the spiders' handoff: "a `climbs` unit going down a face drops in one step today ... build the way down that clings too"): the turn's climb pays
      // the height (grid.js stepCost), and short of the ground it clings part way down -- its foot the square below, its face the square it left, `down` for the AI to let itself
      // down the rest next turn (ai.js climbRest) -- on a 5 ft mark above the ground, under no body already in that band of the column. No fall: a climb, by its climb speed
      if (u.climbs && !rpS && !hung0 && z0 - z1 > stZ && G.map.def.climb && !u.flies) {
        var needD = Math.round((z0 - z1) / stZ), budD = Math.floor(Math.min(T.move, T.climbLeft != null ? T.climbLeft : u.climbs) / 5) * 5, rawD = Math.floor(budD / 2.5), zB1 = 0;
        G.foot(u, nx, ny).forEach(function (p) { zB1 = Math.max(zB1, G.map.gz(p[0], p[1])); });
        if (rawD < needD) {
          var h0D = Math.round((z0 - zB1) / stZ), hD = Math.max(2, h0D - rawD); if (hD % 2) hD += 1;
          var hangersD = this.units.filter(function (w) { return w !== u && w.hang && G.hanging(w) && w.x === nx && w.y === ny; });
          while (hD < h0D && hangersD.some(function (w) { return G.sharesZ(w, { z: zB1 + hD * stZ, h: G.bodyH(u) }); })) hD += 2;
          var canD = h0D - hD; if (canD < 1) { u.anim = 'idle'; return; }
          var spentD = Math.ceil(canD * 2.5 / 5) * 5;
          u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(STEP_FRAMES + 2 * canD, true), mode: 'climb' };
          u.hang = { face: [u.x, u.y], foot: [nx, ny], z: zB1 + hD * stZ, down: true }; u.x = nx; u.y = ny;
          if (o && o.spend) { T.move -= spentD; T.moved = (T.moved || 0) + spentD; if (T.climbLeft != null) T.climbLeft = Math.max(0, T.climbLeft - spentD); }
          this.card(['{y}' + nameOf(u) + '{/} climbs ' + canD * 2.5 + ' ft down the face and clings there, ' + hD * 2.5 + ' ft above the ground.'], 260);
          this.keepInView(u); yield STEP_FRAMES + 2 * canD; u.anim = 'idle';
          if (this.readyArmed()) yield* this.readyHook(u, 'move');
          return;
        }
        if (o && o.spend && T.climbLeft != null) T.climbLeft = Math.max(0, T.climbLeft - Math.ceil(needD * 2.5 / 5) * 5); // (the whole face this turn: off the turn's climb)
      }
      // a climb speed up a face it cannot top this turn (10-04 night, Griz: "a slow climb speed, like they're forcefully digging their way into the walls"): as far as the turn's climb
      // allows (T.climbLeft, its climb speed in feet, and the move's feet), and it clings to the face there -- u.hang with `face` and `foot`, read as a rope's hang is (G.hanging, G.gzAt,
      // the drawing) -- and the AI takes the climb up again first thing next turn (ai.js AI.turn)
      if (u.climbs && !rpS && z1 > z0 && G.map.def.climb && !u.flies) {
        var needC = Math.round((z1 - z0) / stZ), budC = Math.floor(Math.min(T.move, T.climbLeft != null ? T.climbLeft : u.climbs) / 5) * 5, zB = 0;
        G.foot(u, u.x, u.y).forEach(function (p) { zB = Math.max(zB, G.map.gz(p[0], p[1])); }); // (the ground under it: the cling stops on a 5 ft mark above it, an even number of steps -- 10-05, Griz: "1 yes")
        var hB = Math.round((z0 - zB) / stZ), rawC = Math.floor(budC / 2.5), canC = rawC;
        if (rawC < needC) {
          canC = Math.floor((hB + rawC) / 2) * 2 - hB; // (short of the top: down to the mark)
          var hangersC = this.units.filter(function (w) { return w !== u && w.hang && G.hanging(w) && w.x === u.x && w.y === u.y; }); // (others clinging on this column of the face)
          while (canC >= 1 && hangersC.some(function (w) { return G.sharesZ(w, { z: z0 + canC * stZ, h: G.bodyH(u) }); })) canC -= 2; // (no two bodies in one band of the face: it stops under the one above, a file up the wall -- 10-05, the pane: two giants and a troll clinging on one square, the giants at one height, the troll under them unpickable)
          if (canC < 1) { u.anim = 'idle'; return; }
          var zC = z0 + canC * stZ, spentC = Math.ceil(canC * 2.5 / 5) * 5;
          u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(STEP_FRAMES + 2 * canC, true), mode: 'climb' };
          u.hang = { face: [nx, ny], foot: [u.x, u.y], z: zC };
          if (o && o.spend) { T.move -= spentC; T.moved = (T.moved || 0) + spentC; if (T.climbLeft != null) T.climbLeft = Math.max(0, T.climbLeft - spentC); }
          this.card(['{y}' + nameOf(u) + '{/} digs ' + canC * 2.5 + ' ft up the face and clings there, ' + (needC - canC) * 2.5 + ' ft to go.'], 260);
          this.keepInView(u); yield STEP_FRAMES + 2 * canC; u.anim = 'idle';
          if (this.readyArmed()) yield* this.readyHook(u, 'move'); // (a climb is a move: the readied bow or spell that sees it -- 10-05)
          return;
        }
        if (o && o.spend && T.climbLeft != null) T.climbLeft = Math.max(0, T.climbLeft - Math.ceil(needC * 2.5 / 5) * 5); // (the whole face this turn: off the turn's climb)
      }
      if (cDC) { // (a cliff over 5 ft: SRD 5.1, "climbing a slippery vertical surface or one with few handholds requires a successful Strength (Athletics) check" -- G.climbDC; a 5 ft ledge is pulled up onto)
        var ce0 = RU.checkEdges(u, 'str'), cr = ce0.dis.length && !ce0.adv.length ? Math.min(D.d(20), D.d(20)) : ce0.adv.length && !ce0.dis.length ? Math.max(D.d(20), D.d(20)) : D.d(20), cb = G.athletics(u), ct = cr + cb;
        this.card(['{y}' + nameOf(u) + '{/} climbs: Athletics d20 ' + cr + ' ' + RU.sign(cb) + ' = ' + ct + ' against DC ' + cDC + ' (' + csN * 2.5 + ' ft' + (kindN ? ', a ' + kindN + ' face' : '') + ')  ' + (ct >= cDC ? '{n}UP{/}' : '{o}SLIPS{/}')], 160);
        if (ct < cDC) {
          if (o && o.spend) { T.move -= cost; T.moved = (T.moved || 0) + cost; }
          // the slip, seen: up the face a way and back down to the foot of it, prone (10-04, Griz: "can we move them vertical and drop to prone on failed climb?"); over 10 ft it
          // is a fall (Griz: "climbs > 10 = str check or fall"; SRD 5.1 Falling: 1d6 bludgeoning for every 10 feet)
          u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(stF, true), mode: 'slip', peak: (z1 - z0) * 0.6 }; u.anim = 'idle';
          yield stF;
          var cFt = csN * 2.5;
          if (cFt > 10) { var cFd = D.roll(Math.floor(cFt / 10) + 'd6'); this.card(['{o}' + nameOf(u) + ' falls ' + cFt + ' ft from the face: ' + cFd.total + ' bludgeoning, and lands prone.{/}'], 200); this.hurt(u, cFd.total, 'bludgeoning', {}); }
          else this.card(['{o}' + nameOf(u) + ' slides back down the face and lands prone.{/}'], 200);
          u.conds.prone = true; u.anim = 'idle'; return;
        }
      }
      // down a face by climbing (u.cdown: the hand chose CLIMB DOWN, exec 'move'): the climb's own check over 5 ft; made, it is down with no fall, missed, it falls the height as a drop
      var csD = u.cdown ? G.climbsDown(u, u.x, u.y, nx, ny) : 0, cDCd = G.climbDC(csD, u, G.faceKind(u.x, u.y)), csDmiss = false;
      if (csD) cliffM = 'ropedown';
      if (cDCd) {
        var ce1 = RU.checkEdges(u, 'str'), cr1 = ce1.dis.length && !ce1.adv.length ? Math.min(D.d(20), D.d(20)) : ce1.adv.length && !ce1.dis.length ? Math.max(D.d(20), D.d(20)) : D.d(20), cb1 = G.athletics(u), ct1 = cr1 + cb1;
        this.card(['{y}' + nameOf(u) + '{/} climbs down: Athletics d20 ' + cr1 + ' ' + RU.sign(cb1) + ' = ' + ct1 + ' against DC ' + cDCd + ' (' + csD * 2.5 + ' ft)  ' + (ct1 >= cDCd ? '{n}DOWN{/}' : '{o}LOSES ITS HOLD{/}')], 160);
        csDmiss = ct1 < cDCd;
      }
      u.tween = { fx: u.x, fy: u.y, fz: z0, t: 0, dur: this.pace(stF, true), mode: cliffM }; // (an AI-run unit's step is paced with its wait, below, so the walk keeps to its beat)
      u.x = nx; u.y = ny;
      var dropFt = G.map.def.climb && !u.flies && !u.climbs && !rpS && !hung0 ? (z0 - z1) / stZ * 2.5 : 0; // (a drop down a cliff: SRD 5.1 Falling -- 1d6 bludgeoning for every 10 feet, and it lands prone; one with a climb speed climbs down, as one on a rope does)
      if (csD && !csDmiss) dropFt = 0; // (climbed down: no fall)
      if (u.hang && !G.hanging(u)) delete u.hang; // (off the rope: at its top, or stepped away from its foot)
      if (o && o.spend) { T.move -= cost; T.moved = (T.moved || 0) + cost; } // (moved: what it has walked this turn -- the Thief's Supreme Sneak asks)
      this.keepInView(u);
      yield stF;
      // the landing, once it is down: the walk ends there, flat (it gets up on its next move, for half its speed)
      if (dropFt >= 10) { var onD = this.under(u); if (onD.length) { var fdD = D.roll(Math.floor(dropFt / 10) + 'd6'); this.card(['{o}' + nameOf(u) + ' drops ' + dropFt + ' ft onto ' + onD.map(nameOf).join(' and ') + ': ' + fdD.total + ' bludgeoning, split, and lands prone.{/}'], 200); this.landOn(u, dropFt, fdD); u.anim = 'idle'; return; } var fd = D.roll(Math.floor(dropFt / 10) + 'd6'); this.card(['{o}' + nameOf(u) + ' drops ' + dropFt + ' ft: ' + fd.total + ' bludgeoning, and lands prone.{/}'], 200); this.hurt(u, fd.total, 'bludgeoning', {}); u.conds.prone = true; u.anim = 'idle'; if (u.hp > 0 && !u.dead) { this.lostCover(u); if (RU.canAct(u)) this.findsHidden(u); } return; }
      // hidden no more (SRD 5.1: "You can't hide from a creature that can see you clearly"): one hidden who steps where a foe sees it clearly is found, and
      // one hidden from the mover that the mover now sees clearly (10-01c, the rogue runner: she crossed 50 ft of lit floor hidden and struck with advantage)
      // (10-04, Griz's notion: a Stealth total holds outside every foe's 15 ft -- the square it stands in and the eight round it -- and inside, each square she moves
      // through or stops in is a contest of that total against the foe's passive Perception plus a bonus by which side of it she is on and the light: Battle.spots)
      this.lostCover(u);
      if (RU.canAct(u)) this.findsHidden(u);
      // into a spell's web (from outside it): the SRD's save for one who enters it during its turn; stuck, it stops there
      if (!u.ethereal && !wasIn && D.magic.webCatch(this, u, 'enters')) { if (o && o.spend) T.move = 0; yield 24; break; }
      // onto a Sleet Storm's ice (the first square of it this turn): DEX or down, and the move ends there
      if (!u.ethereal && D.magic.sleetCatch(this, u)) { if (o && o.spend) T.move = 0; yield 24; break; }
      // a spell's ground (09-28, js/grimoire.js): grease underfoot, spikes, the guardians' ring -- a fall ends the move there
      if (!u.ethereal && D.magic.stepInto) { var si = D.magic.stepInto(this, u); if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; } if (si) { if (o && o.spend) T.move = 0; yield 24; break; } }
      // out of a Globe of Invulnerability that held a spell off it (10-01c): a hold, a sleep, a web's grip, a dance takes hold again on the square it steps
      // out onto, and the walk ends there (filming it, the fighter walked on a square held)
      if (this.globes && D.magic.globeSync) { D.magic.globeSync(this); if (!RU.canAct(u) || u.conds.restrained || u.conds.dancing) { if (o && o.spend) T.move = 0; u.anim = 'idle'; yield 24; break; } }
      // the Keeper's readied Ice Wall (js/keeper.js, 10-03): one of ours stepping toward the exit springs it
      if (this.kp && this.kp.ready && D.keeper) yield* D.keeper.watch(this, u, stepFrom);
      // a readied strike (exec 'ready', 10-02): one that steps within a readier's reach, or into its sight, gets it -- and held, stunned or put down by it, walks no farther
      // GIVE GROUND (the Grey Road, 7; ours, 10-08): a Grey Road ranger this step brought within reach of steps 5 ft back, the reaction (js/features.js F.giveGround)
      if (D.features && D.features.giveGround && !u.ethereal && !(o && o.noGive)) { yield* D.features.giveGround(this, u, stepFrom); if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; } }
      if (this.units.some(function (w) { return w.ready && w.reaction > 0; })) { yield* this.readyHook(u, 'move'); if (u.hp <= 0 || u.dead) { u.anim = 'idle'; return; } if (u.conds.restrained || u.conds.paralyzed || u.conds.stunned || u.conds.asleep) { u.anim = 'idle'; if (o && o.spend) T.move = 0; return; } u.anim = gait; }
    }
    u.anim = 'idle';
  };
  // Invisibility and Mislead end for one who attacks or casts (SRD); the caster's concentration goes with them (Greater
  // Invisibility, the duergar's own, keep on: theirs has no `ends`)
  Battle.prototype.endInvis = function (u, why) {
    var iv = u.conds.invisible;
    if (!iv || !iv.ends) return;
    var caster = iv.by && this.units.filter(function (w) { return w.id === iv.by && w.conc && (w.conc.id === 'invisibility' || w.conc.id === 'mislead'); })[0];
    if (caster) D.magic.endConc(this, caster, why); else { delete u.conds.invisible; this.card(['{g}' + (u.side === 'foe' ? Battle.nm(u, true) : u.name) + ' is seen again (' + why + ').{/}'], 240); }
    if (u.conds.invisible && u.conds.invisible.ends) delete u.conds.invisible; // (the undo missed it: a foe's own)
  };

  // ------------------------------------------------------------------ an attack: the roll, the reactions, the damage
  // Sanctuary's new target (SRD 5.1: "must choose a new target or lose the attack or spell"): another foe of the one warded that the attack or spell can take (in reach, or in range and sight; not hidden,
  // not itself warded). `was` the warded one; `atk` the attack (or { spell, ranged, range } for a spell); `o.g` a spell's geometry. Returns it, or null (nothing else to take: the attack is lost, said on a card)
  Battle.prototype.sanctuaryNew = function* (att, was, atk, o) {
    o = o || {};
    if (o.oa) return null;
    var melee = !atk.ranged && (!atk.spell || atk.touch), self = this;
    var cand = this.units.filter(function (w) {
      if (w === was || w === att || !G.hostile(att, w) || !G.standing(w) || w.ethereal || w.dead || w.isWall || (w.conds && (w.conds.sanctuary || w.conds.hidden))) return false;
      if (o.g && D.magic.targetOK) return D.magic.targetOK(self, att, o.g, w) && (melee ? G.dist(att, w) <= G.reachOf(att, atk.reach || att.reach) : G.dist(att, w) <= ((atk.range && atk.range[1]) || 60));
      return melee ? G.dist(att, w) <= G.reachOf(att, atk.reach || att.reach) : G.dist(att, w) <= ((atk.range && atk.range[1]) || 60) && G.los(att, w).clear;
    });
    var human = att.side === 'foe' ? !!(D.keeperPlay && D.keeperPlay.human && D.keeperPlay.human(this, att)) : !(att.classAI || att.guest || att.ally || att.summon || att.familiar || att.ai);
    if (!cand.length) { this.card(['{g}' + nameOf(att) + ' has no other target: the ' + (atk.spell ? 'spell' : 'attack') + ' is lost.{/}'], 160); return null; }
    var pick = null;
    if (human && cand.length) {
      var opts = cand.map(function (w, i) { return { label: w.name.toUpperCase() + ' (' + G.dist(att, w) + ' FT)', value: i + 1 }; }); opts.push({ label: 'LOSE IT', value: 0 });
      var v = yield { prompt: { who: att, title: 'SANCTUARY: A NEW TARGET', lines: ['The ward turns the blow: a new target, or it is lost.'], opts: opts, pick: cand } };
      pick = v ? cand[v - 1] : null;
    } else pick = cand.slice().sort(function (a, b) { return a.hp - b.hp; })[0];
    this.card([pick ? '{y}' + nameOf(att) + '{/} turns on ' + nameOf(pick) + ' instead.' : '{g}' + nameOf(att) + ' lets it go: the ' + (atk.spell ? 'spell' : 'attack') + ' is lost.{/}'], 160);
    return pick;
  };
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    o = o || {};
    if (!o.oa) this.noteHeard(att); // (the blow gives the square away: SRD 5.1, Hiding -- every swing and shot, the player's or the AI's; 10-01c)
    if (!tgt || tgt.dead || tgt.ethereal) return;
    if (this.thrownLeft(att, atk) <= 0) { this.card(['{o}' + Battle.nm(att, true) + ' has no ' + atk.name.toLowerCase().replace(/^thrown /, '') + ' left to throw.{/}'], 120); return; } // (thrown weapons run out: spendThrow)
    // a two-handed weapon swung (or a bow drawn) with a torch in the other hand: the torch is let fall first, burning at the attacker's feet -- free, as letting go is (10-05, Griz:
    // "two handers holding a torch that drops when they attack"; light.js handsUsed: carried in one hand till then)
    if (att.torch && att.weapon && atk && !atk.spell && (atk === att.weapon || atk.name === att.weapon.name) && (att.weapon.props || []).indexOf('two-handed') >= 0) {
      var ltW = D.light.word(att.torch); D.light.dropTorch(this, att, true);
      this.card(['{y}' + nameOf(att) + '{/} lets the ' + ltW + ' fall to take the ' + att.weapon.name + ' in both hands.  {g}(it burns where it fell){/}'], 220);
    }
    // Sanctuary (SRD 5.1): "any creature who targets the warded creature with an attack ... must first make a Wisdom saving throw. On a failed save, the creature must choose a new target or lose the
    // attack" -- the save, then a new target (an AI picks the weakest other foe it can reach; a player's pick is asked) or the attack is lost (10-03; before, a failed save only lost it)
    if (tgt.conds && tgt.conds.sanctuary && G.hostile(att, tgt) && D.magic.sanctuary && !D.magic.sanctuary(this, att, tgt)) {
      var alt = yield* this.sanctuaryNew(att, tgt, atk, o);
      if (!alt) { yield o.oa ? 16 : 24; att.anim = 'idle'; return; }
      tgt = alt;
    }
    if (att.conds && att.conds.sanctuary && D.magic.unward) D.magic.unward(this, att, 'an attack'); // (SRD 5.1 Sanctuary: "If the warded creature makes an attack ... this spell ends" -- 10-03)
    if (att.turn) att.turn.attacked = (att.turn.attacked || 0) + 1; // (it struck at something this turn: a burrower dives after a bite, not after a turn of nothing -- ai.js diveAfter, 10-02)
    this.spendThrow(att, atk); // (out of the hand, hit or miss)
    var self = this, melee = !atk.ranged && (!atk.spell || atk.touch), cid = 'atk' + (++this.cardSeq || (this.cardSeq = 1));
    this.turnTo(att, faceTo(att, tgt));
    // a spell's shot leaves at the height of the cast pose (the spell animation pass, 09-28h): the pose the cast began runs on
    // (o.ride: a blow riding the one before it in one move -- the Grey Road's Sweep the Ring and Covering Volley, 10-08: the row plays once, its second and third blows land on it)
    var posing = !!o.ride || (atk.spell && (att.anim === 'attack' || att.anim === 'cast') && this.t - (att.animT || 0) < (D.spr.duration(att.sheet, att.anim) || 18));
    // (a spell's shot, or a floating weapon sent at its mark, from the cast pose where the sheet has one)
    if (!posing) { att.anim = atk.spell && (!melee || atk.spirit) && D.spr.anim(att.sheet, 'cast') ? 'cast' : 'attack'; att.animT = this.t; }
    // a row of its own for the blow, where the sheet has one (10-01d, the xorn first: Griz, "since this is prototype, go fancy"): the
    // attack's name (claw, bite), and its second and third use in a turn the numbered rows (claw2, claw3: a blow from each of its arms)
    if (!posing && att.anim === 'attack' && atk.name) {
      // (atk.row: a blow that names its row -- Sweep the Ring plays `whirlwind`, 10-08)
      var rk = atk.row || String(atk.name).toLowerCase().replace(/[^a-z]/g, ''), rt = att.turn || {}, rn = ((rt.rowN = rt.rowN || {})[rk] = (rt.rowN[rk] || 0) + 1);
      var rw = rn > 1 && D.spr.anim(att.sheet, rk + rn) ? rk + rn : rk;
      if (rk && D.spr.anim(att.sheet, rw)) att.anim = rw;
      // (Surprise Attack's blow: a foe with it, its first melee blow of round one, plays its ambush row -- the bugbears' sheets, 10-07)
      if (att.surprise && this.round === 1 && melee && rn === 1 && D.spr.anim(att.sheet, 'ambush')) att.anim = 'ambush';
      // (Martial Advantage's blow: the drilled lunge where the sheet has one, a melee blow while an ally who can act stands by the target and the
      // turn's Martial Advantage is unspent -- hit or miss, the drill shows either way; its dice are the hit's, below. The hobgoblins' sheets, 10-07)
      if (att.martial && melee && !(att.turn && att.turn.martialUsed) && D.spr.anim(att.sheet, 'martial') && this.units.some(function (w) { return w !== att && w.side === att.side && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5; })) att.anim = 'martial';
      // (the Harbinger's Pounce, 10-08: the first melee blow of a turn he has moved 20 ft or more is the leap -- his `pounce` row, the hit on its frame 6 (the row's `release`, below);
      // js/traits.js lands it; the mirror ripple runs over him as he leaves the ground)
      if (att.pounce && melee && att.turn && !att.turn.pounceTried && (att.turn.moved || 0) >= (att.pounce.min || 20) && D.spr.anim(att.sheet, 'pounce')) {
        att.turn.pounceTried = true; att.anim = 'pounce';
        if (D.ripple) D.ripple(att, { region: 'body' });
      }
    }
    // (a blow from a row that names its release frame -- the goblin's shortbow, 10-07: the arrow leaves as the bow hand opens, not 10 ticks in; and since 10-08 a melee row's too,
    // the Harbinger's pounce landing on its frame 6. A melee row with no release still strikes 10 ticks in)
    var rel = !atk.spell && D.spr.anim(att.sheet, att.anim), relT = rel && rel.release != null ? Math.ceil(rel.release * 60 / (rel.fps || 8)) : 0;
    if (o.ride) yield 4; // (riding the blow before it: no new wind-up)
    else if (!o.oa) yield atk.spell && !melee ? Math.max(4, Math.round((D.spr.duration(att.sheet, att.anim) || 18) * 0.55) - (this.t - att.animT)) : relT ? Math.max(4, relT - (this.t - att.animT)) : 10;
    if (!melee) { FX.projectile(att, tgt, atk.fx || 'bolt'); yield { fx: 1 }; }
    var los = G.los(att, tgt), cover = melee && G.dist(att, tgt) <= 5 ? 0 : los.cover;
    var ac = RU.ac(tgt) + cover, e = RU.edges(att, tgt, atk);
    // the Hunter's Defensive Tactics (ranger 7; js/classes.js u.hunterDef): Escape the Horde -- an opportunity attack against it is at
    // disadvantage; Multiattack Defense -- once a creature has hit it, that one's later attacks this turn meet AC +4
    if (o.oa && !o.answer && tgt.hunterDef === 'horde') { e.dis.push('escape the horde'); e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0; }
    // the Grey Road (ours, 10-08; js/features.js): GIVE GROUND's shot -- out of its reach, his next bow shot at that one before his next turn ends has advantage;
    // COVERING VOLLEY's arrow -- one it hit attacks at disadvantage, once, before the archer's next turn (conds.covered, gone at his turn's start)
    if (!melee && !atk.spell && att.gaveGround && att.gaveGround.on === tgt.id) { if (this.round <= att.gaveGround.till) { e.adv.push('gave ground'); e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0; } delete att.gaveGround; }
    if (att.conds.covered && !atk.save) { e.dis.push('covered'); e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0; delete att.conds.covered; }
    var madAC = tgt.hunterDef === 'multiattack' && tgt.madHit && tgt.madHit[att.id] === this.round + ':' + (this.active ? this.active.id : '-') ? 4 : 0;
    ac += madAC;
    // Fighting Style: Protection (SRD 5.1: "When a creature you can see attacks a target other than you that is within 5 feet of you, you can use
    // your reaction to impose disadvantage on the attack roll. You must be wielding a shield." -- 10-06, the Pocket DM's maker picks it)
    if (!atk.save && e.net >= 0) {
      // (or a Mascot Tank's BODYGUARD, 6th, the same without the shield: js/mpmon.js `bodyguard`, 10-06 night)
      var prot = this.units.filter(function (w) { return w !== tgt && w !== att && w.side === tgt.side && ((w.style === 'protection' && w.src && w.src.equip && w.src.equip.shield) || w.bodyguard) && w.reaction > 0 && G.standing(w) && RU.canAct(w) && G.dist(w, tgt) <= 5 && M16().sees(self, w, att); })[0];
      if (prot) {
        var pz = byAI(prot) ? true : yield { prompt: { who: prot, title: prot.name + ': ' + (prot.bodyguard ? 'BODYGUARD?' : 'PROTECTION?'), lines: [nameOf(att) + ' attacks ' + nameOf(tgt) + '. ' + (prot.bodyguard ? 'Step in the way' : 'The shield in the way') + ': the roll at disadvantage? (the reaction)'], opts: [{ label: prot.bodyguard ? 'STEP IN' : 'SHIELD THEM', value: true }, { label: 'NOT NOW', value: false }] } };
        if (pz) { prot.reaction = 0; D.sfx('bump'); FX.ring(tgt, 'silver', 18); e.dis.push('protection'); if (prot.bodyguard && D.spr.anim(prot.sheet, 'guard')) { prot.anim = 'guard'; prot.animT = this.t; } e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0; }
      }
    }
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
        // (both dice and the reasons, as the attack's own card shows them: a frightened roper's bite at one of Willem's images showed one d20 and no "dis", 10-02, Griz: "please fix card")
        var iwhy = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
        this.card(['{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name, 'd20 ' + id20 + ' vs ' + need + ': {p}a false image{/}  d20 ' + (ir.rolls.length > 1 ? RU.fmtRolls(ir.rolls) + '>' : '') + ir.pick + ' ' + RU.sign(atk.atk) + ' = ' + itot + ' vs AC ' + iac + '  ' + (ihit ? '{n}the image bursts{/} (' + tgt.images + ' left)' : '{g}MISS{/}') + iwhy], 300, cid);
        yield o.oa ? 16 : 26; att.anim = 'idle'; return;
      }
    }
    if (tgt.conds.helped && tgt.conds.helped.side === att.side) delete tgt.conds.helped; // help is spent on the first swing
    // the one-shot marks, spent by this roll: Guiding Bolt's glow on the target, Vicious Mockery on the attacker, True Strike
    if (tgt.conds.guided) delete tgt.conds.guided;
    if (att.conds.mocked) delete att.conds.mocked;
    if (att.conds.trueStrike && att.conds.trueStrike.ready && att.conds.trueStrike.at === tgt.id) { delete att.conds.trueStrike; if (att.conc && att.conc.id === 'truestrike') D.magic.endConc(this, att, 'the swing'); } // (True Strike: the first attack roll at it on the next turn -- advantage, and the spell is spent: rules.js edges, magic.js startTurn)
    var sacred = att.conds.sacred && !atk.spell ? att.conds.sacred.atk : 0; // (Sacred Weapon: the weapon he holds, a bow as well as a blade -- SRD 5.1; 10-06, it was melee only)
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
    var crit = hit && (nat >= critAt || (((tgt.hp <= 0 && !tgt.dead) || tgt.conds.paralyzed || tgt.conds.asleep) && G.dist(att, tgt) <= 5) // (SRD 5.1, paralyzed and unconscious: ANY attack that hits from within 5 ft -- a spell's, a bow's -- not the melee alone, 10-05: Aurdin's Scorching Ray beside a troll lying at 0)
      || (att.assassinate && tgt.conds.surprised) // Assassinate: any hit on one caught unaware is a critical
      || (att.subclass === 'Cutthroat' && this.round === 1 && !tgt.acted)); // Opening Cut (the game's Cutthroat): the same, in the first round
    var rivets = crit && tgt.critProof; if (rivets) crit = false; // (SRD 5.1, Adamantine Armor: "any critical hit against you becomes a normal hit" -- the Game Show's Rivet Job, deep16/js/supplies.js, 10-07)
    var head ='{y}' + nameOf(att) + '{/} > {r}' + nameOf(tgt) + '{/}  ' + atk.name + (o.ready ? ' {c}(readied){/}' : ''); // (readied: the Ready action's strike, sprung -- readyHook, 10-02)
    var line = 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + nat + ' ' + RU.sign(atk.atk) + (bless ? ' {y}+' + bless + ' bless{/}' : '') + (sacred ? ' {y}+' + sacred + ' sacred{/}' : '') + (pen ? ' {o}' + pen + ' ' + e.penWhy + '{/}' : '') + ' = ' + total + '  vs AC ' + RU.ac(tgt) + (cover ? ' {c}+' + cover + ' cover{/}' : '') + (madAC ? ' {c}+4 multiattack defense{/}' : '') + glass + (rivets ? '  {c}RIVETS: not a critical{/}' : '');
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
    // Parry (the Bandit Captain, SRD 5.1: "The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be
    // wielding a melee weapon." -- a reaction, taken when the +2 turns the blow: a natural 20 is not turned, AC does not make it a miss; 10-02)
    if (hit && nat !== 20 && melee && tgt.parry && tgt.reaction > 0 && RU.canAct(tgt) && !tgt.conds.disarmed && total < ac + tgt.parry && D.magic.seeWhy(this, tgt, att).ok && G.los(tgt, att).clear) {
      tgt.reaction = 0; FX.ring(tgt, 'silver', 26); D.sfx('bump');
      ac += tgt.parry; hit = false; crit = false;
      line += '  {c}PARRY +' + tgt.parry + '{/}';
    }
    // TURN IT ASIDE (the Grey Road, 3; ours, 10-08 -- Griz: "Turn it aside is good"): a Grey Road ranger within 5 ft of the one attacked, holding a
    // melee weapon and seeing the attacker, adds his WIS to its AC against the blow -- his reaction, taken when it turns the hit (js/features.js F.turnAside)
    if (hit && nat !== 20 && D.features && D.features.turnAside) {
      var ta = D.features.turnAside(this, att, tgt, atk, total, ac);
      if (ta && (byAI(ta.w) || (yield { prompt: { who: ta.w, title: ta.w.name + ': TURN IT ASIDE?', lines: [nameOf(att) + "'s " + total + ' would hit ' + nameOf(tgt) + ' (AC ' + ac + ').', '+' + ta.bonus + ' AC makes it ' + (ac + ta.bonus) + ': a miss. (the reaction)'], opts: [{ label: 'TURN IT', value: true }, { label: 'LET IT LAND', value: false }] } }))) {
        ta.w.reaction = 0; FX.ring(tgt, 'silver', 22); D.sfx('bump');
        if (D.spr.anim(ta.w.sheet, 'parry')) { ta.w.facing = D.spr.facingFor(att.x - ta.w.x, att.y - ta.w.y); ta.w.anim = 'parry'; ta.w.animT = this.t; }
        ac += ta.bonus; hit = false; crit = false;
        line += '  {c}' + shortName(ta.w).toUpperCase() + ' TURNS IT ASIDE +' + ta.bonus + '{/}';
      }
    }
    D.sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : hit ? '{n}HIT{/}' : '{g}MISS{/}') + why], 300, cid);
    if (hit && tgt.conds.hidden && tgt.hp > 0) { delete tgt.conds.hidden; delete tgt.hidTotal; this.card(['{o}' + nameOf(tgt) + ' is found by the blow: no longer hidden.{/}  {g}(a hit tells where you are; hiding is not invisibility -- RULED 10-04){/}'], 200); } // (10-04 night, Griz: "lose stealth on successful hit")
    if (!hit) {
      // a natural 1 at a darkmantle riding one of ours (10-01, RULED, Griz: "if SRD says nothing about hurting ally, only hurt ally on natural 1 (ignoring
      // bonuses)" -- the SRD says nothing): the blow lands on the one it rides instead -- the weapon's damage, no critical, no riders (invented.json)
      var host = tgt.riding && tgt.attached && tgt.master;
      if (nat === 1 && host && G.standing(host) && !G.hostile(att, host) && atk.dice) {
        var hd = RU.damage(atk.dice, atk.mod || 0, {});
        D.sfx('hit'); FX.float('OOF', host, D.PAL.ramps.fire[2]);
        this.card(['{o}A natural 1:{/} the blow meant for the ' + shortName(tgt) + ' lands on ' + nameOf(host) + '.  ' + atk.dice + RU.sign(atk.mod || 0) + ' ' + RU.fmtRolls(hd.rolls) + ' = {r}' + hd.total + '{/} ' + (atk.type || '')], 320);
        this.hurt(host, hd.total, atk.type, { magic: !!(atk.magic || atk.spell) });
        yield o.oa ? 16 : 30; att.anim = 'idle'; return;
      }
      if (o.onMiss) o.onMiss(tgt); FX.float('MISS', tgt, D.PAL.ramps.silver[5]);
      if (nat >= 15 && !atk.spell) this.doorWard(tgt); // (the Door-Shield: a miss it could have caused)
      yield o.oa ? 16 : 24; att.anim = 'idle';
      if (D.features && D.features.answerBack) yield* D.features.answerBack(this, att, tgt, atk, melee); // (the Path of the Sand, 6)
      return;
    }
    if (atk.noDamage) { if (o.onHit) o.onHit(tgt, crit); yield o.oa ? 18 : 26; att.anim = 'idle'; return; } // (a throw that only lands: the oil flask unlit coats, js/oil.js -- 10-05)
    // Rock Catching (the stone giant, SRD 5.1: "If a rock or similar object is hurled at the giant, the giant can, with a successful DC 10 Dexterity saving throw, catch the missile and take
    // no bludgeoning damage from it" -- a trait, not a reaction: every rock, as often as they come; data/foes.js `rockCatch`, the DC): a hurled rock (a giant's Rock, `hurled`) that hits one
    // who has it is caught on the save -- no damage, and nothing the blow carries (a caught rock knocks no one down: the seat's reading, 10-08); she turns to the thrower and her CATCH row
    // plays, the rock in her hand (built 10-08, Griz: "make the unnecessary rock catch animation"; the grid's rules §2.7 -- only a giant against a giant ever throws one at her). A miss
    // is not asked: it does nothing either way
    if (tgt.rockCatch && atk.hurled && !atk.spell && !tgt.dead && tgt.hp > 0) {
      var rcs = RU.save(tgt, 'dex', tgt.rockCatch);
      this.card(['{r}' + nameOf(tgt) + '{/}: DEX save  ' + RU.saveText(rcs) + ' vs DC ' + rcs.dc + '  ' + (rcs.ok ? '{n}CAUGHT{/}  {g}(Rock Catching: no damage){/}' : '{o}NOT CAUGHT{/}')], 300);
      if (rcs.ok) {
        this.turnTo(tgt, faceTo(tgt, att));
        if (D.spr.anim(tgt.sheet, 'catch')) { tgt.anim = 'catch'; tgt.animT = this.t; }
        D.sfx('bump'); FX.float('CAUGHT', tgt, D.PAL.ramps.silver[5]);
        yield o.oa ? 18 : Math.max(26, (D.spr.duration(tgt.sheet, 'catch') || 0) + 4); att.anim = 'idle';
        return;
      }
      yield 16;
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
      var opts = [], smUF = /^(undead|fiend)$/.test(tgt.type || ''), smN = function (lv) { return Math.min(5, 1 + lv) + (smUF ? 1 : 0); }; // (SRD 5.1: "The damage increases by 1d8 if the target is an undead or a fiend" -- 10-05, Griz: "yes, thought it was there")
      [1, 2, 3].forEach(function (lv) { if (att.slots[lv - 1] > 0) opts.push({ label: 'L' + lv + ' ' + smN(lv) + 'd8', value: lv }); });
      opts.push({ label: 'NO SMITE', value: 0 });
      this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why], 300, cid);
      // the AI's paladin (09-28): the best slot on a critical; else the lowest, on one the blow alone won't drop and worth the slot
      var lv = byAI(att) ? (crit ? opts[opts.length - 2].value : (tgt.hp > dmg + 4 && tgt.maxhp >= 15 ? opts[0].value : 0)) : yield { prompt: { who: att, title: att.name + ': DIVINE SMITE?', lines: ['The blow lands' + (crit ? ' -- a critical: the smite dice double.' : '.')], opts: opts } };
      if (lv) {
        att.slots[lv - 1]--; D.sfx('magic');
        var sm = D.roll(smN(lv) + 'd8', { crit: crit }); rad += sm.total;
        parts.push('{y}smite ' + smN(lv) + 'd8 ' + RU.fmtRolls(sm.rolls) + ' = ' + sm.total + ' radiant' + (smUF ? ' (+1d8: ' + tgt.type + ')' : '') + '{/}');
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
    // ('mundaneps': piercing and slashing only -- the xorn's, SRD 5.1 "piercing and slashing from nonmagical attacks that aren't adamantine"; a plain mace lands whole, 10-02)
    if (tgt.resist && (tgt.resist.indexOf('mundane') >= 0 || (tgt.resist.indexOf('mundaneps') >= 0 && /piercing|slashing/.test(atk.type))) && !atk.spell && !atk.magic && /bludgeoning|piercing|slashing/.test(atk.type)) {
      var cut = dmg - Math.floor(dmg / 2); dmg -= cut; parts.push('{g}-' + cut + ': it shrugs off plain steel{/}');
    }
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + (dmg + fire + rad + ext + xtra.reduce(function (a, x) { return a + x[0]; }, 0)) + '{/}'], 300, cid);
    if (melee) FX.slash(tgt, crit ? D.PAL.ramps.gold[4] : null);
    // (one blow, one concentration save on all it dealt: the fire, the smite, a mark's, the blade's, and a bite's poison on a failed save below -- B.blowEnd, the grid's rules §2.1)
    var bl = this.blow(); tgt.blowIn = bl; // (what rides the weapon's hit from js/features.js -- Colossus Slayer, Divine Strike -- banks here too: `blow: tgt.blowIn`)
    if (fire) { FX.sparkle(tgt, 'fire', 12); this.hurt(tgt, fire, 'fire', { blow: bl }); }
    if (rad && !tgt.dead) this.hurt(tgt, rad, 'radiant', { blow: bl });
    var blowSrc = { magic: !!(atk.magic || atk.spell), blow: bl }; // (the weapon's magic, or a spell attack's: Stoneskin reads it in hurt())
    if (ext && !tgt.dead) this.hurt(tgt, ext, atk.extraType || atk.type, blowSrc);
    for (var xi = 0; xi < xtra.length; xi++) if (!tgt.dead) this.hurt(tgt, xtra[xi][0], xtra[xi][1], { magic: true, blow: bl }); // (a mark's, a curse's: a spell's)
    if (!tgt.dead) this.hurt(tgt, dmg, atk.type, blowSrc);
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
    // a grapple on the hit (the otyugh's tentacles): while it has a tentacle free; grappled and restrained -- of the size its own sheet names, `grapple.size` (the otyugh's "Medium
    // or smaller" 'M', the chuul's "Large or smaller" 'L'), and of any size where it names none (the roper's tendril, the frog's bite): 10-06, the grid's rules §2.3, on the lane's
    // lean ("per grappler, by each SRD sheet"); before, every grappler took the otyugh's Medium or smaller, and a Large wild-shaped hero could not be held by a roper
    // (tendrilsLost: a roper's tendrils cut or broken this round are not there to grab with till its next turn -- SRD 5.1, "can extrude a replacement tendril on its next turn"; tendrilGone, rules.js startTurn)
    var grabbed = false;
    if (atk.grapple && !tgt.dead && tgt.hp > 0 && (!gripSize(att, atk) || Battle.sizeCat(tgt) <= Battle.SIZE[gripSize(att, atk)]) && !tgt.conds.restrained && !RU.immuneTo(tgt, 'grappled') && (att.holding || []).length + (att.tendrilsLost || 0) < (atk.grapple.max || 1)) {
      grabbed = true;
      tgt.conds.restrained = { dc: atk.grapple.dc, by: att.id, grapple: true, weak: !!atk.weakens, only: !!atk.grapple.only }; // (weak: the roper's tendril, disadvantage on STR: js/traits.js; only: grappled and no more -- the chuul's pincer, SRD 5.1, no restraint, rules.js edges, 10-06)
      // the roper's tendril is a thing on the grid (SRD 5.1 Grasping Tendrils: "Each tendril can be attacked (AC 20; 10 hit points; immunity to poison and psychic damage).
      // Destroying a tendril deals no damage to the roper ... A tendril can also be broken if a creature takes an action and succeeds on a DC 15 Strength check against it"):
      // it rides the grip -- struck at through the held one's square (tendrilOn, strikeTendril) or broken (exec breaktendril) -- and the grip ends with it (tendrilGone).
      // 10-02, handoff-2026-10-01-the-tendrils-and-ready
      if (atk.tendril) tgt.conds.restrained.tendril = { hp: atk.tendril.hp, max: atk.tendril.hp, ac: atk.tendril.ac, immune: atk.tendril.immune || [], breakDC: atk.tendril.breakDC || 15 };
      att.holding = (att.holding || []).concat([tgt]);
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} has ' + nameOf(tgt) + ': {o}GRAPPLED' + (atk.grapple.only ? '' : ' and RESTRAINED') + '{/}  {g}(escape DC ' + atk.grapple.dc + ', an action' + (atk.tendril ? '; the tendril AC ' + atk.tendril.ac + ', ' + atk.tendril.hp + ' HP -- strike it, or break it with a DC ' + (atk.tendril.breakDC || 15) + ' STR check' : '') + '){/}']);
      yield 30;
      // (pulled in: below)
    }
    // pulled into the water (10-02, Griz: "can we make the stair a stair and them be drawn underwater"; the Water Weird's own Constrict "pulls the target 5 feet
    // toward it"): a hit with `pull` on one it holds draws it a square toward the puller -- off the stair, into the water -- where it is drawn down under it (js/ui.js UI.wading)
    if (atk.pull && !tgt.dead && tgt.hp > 0 && tgt.conds.restrained && tgt.conds.restrained.by === att.id && G.dist(att, tgt) > 5) {
      var pbest = null, pd = G.dist(att, tgt);
      for (var pdy = -1; pdy <= 1; pdy++) for (var pdx = -1; pdx <= 1; pdx++) { var pnx = tgt.x + pdx, pny = tgt.y + pdy; if ((!pdx && !pdy) || !G.canStand(tgt, pnx, pny) || G.occupant(pnx, pny)) continue; var pnd = G.dist(att, tgt, null, null, pnx, pny); if (pnd < pd) { pd = pnd; pbest = [pnx, pny]; } }
      if (pbest) { tgt.tween = { fx: tgt.x, fy: tgt.y, fz: G.gzAt(tgt, tgt.x, tgt.y), t: 0, dur: this.pace(12, true) }; tgt.x = pbest[0]; tgt.y = pbest[1]; D.sfx('splash'); this.card(['{r}' + nameOf(att) + '{/} drags ' + nameOf(tgt) + ' toward it' + ((G.map.at(pbest[0], pbest[1]) || {}).ch === '~' ? ', down into the water.' : '.')], 220); yield 18; }
    }
    if (grabbed) { // (the rest of a fresh grip, as it was)
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
    var headOK = atk.attach && (atk.attach.large ? (tgt.size || 1) <= 2 : !Battle.overMedium(tgt)); // (attach.large: the cloaker takes a Large one's head too, SRD 5.1 -- 10-06)
    if (atk.attach && atNow && atNow.by === att.id && !atNow.head && !tgt.dead && tgt.hp > 0 && e.net > 0 && headOK) {
      atNow.head = true; att.perch = 'over'; if (!tgt.conds.blinded) tgt.conds.blinded = { by: att.id, held: true };
      this.card(['{r}' + nameOf(att) + '{/} gets ' + nameOf(tgt) + '\'s head: {o}BLINDED{/}, no breath to draw.']); yield 24;
    }
    if (atk.attach && !tgt.dead && tgt.hp > 0 && !att.riding && !tgt.conds.attached && !(atk.attach.large && (tgt.size || 1) > 2)) { // (the cloaker: Large or smaller, SRD 5.1)
      var onHead = !atk.stinger && headOK && e.net > 0; // (Medium or smaller: SRD 5.1 -- an Enlarged one is a size up, Large -- RULED 10-01, Griz: "only when he's Medium or smaller")
      tgt.conds.attached = { by: att.id, dc: atk.attach.dc, head: onHead, big: Battle.overMedium(tgt) }; // (big: Large already when it got on -- an Enlarge after throws it off, rideSync)
      if (onHead && !tgt.conds.blinded) tgt.conds.blinded = { by: att.id, held: true };
      D.sfx('poison'); FX.ring(tgt, 'bone', 26);
      this.card(['{r}' + nameOf(att) + '{/} attaches to ' + nameOf(tgt) + (onHead ? ': over ' + nameOf(tgt) + '\'s head -- {o}BLINDED{/}, no breath to draw' : '') + '.  {g}(DC ' + atk.attach.dc + ' STR to pull it off, an action: ' + nameOf(tgt) + ', or anyone beside){/}']);
      this.mount(att, tgt); if (atk.stinger) att.drained = 5; // (the stirge: the hit's average counts toward the 10 it drinks)
      yield 30;
    }
    // a knockdown (the wolf's bite, the worg's, Talmok's fists, the giant's rock): STR or prone
    // (atk.knockOff: the same save against being knocked back off the edge it stands on -- the Skylights' male giant's rocks, 10-05, Griz: "the male throws his two rocks at people on
    // the edge (once he's made it to the window) with a save vs knockback off the edge": failed, 5 ft straight back from the thrower and down, the fall's 1d6 a 10 ft, prone)
    var offSq = atk.knockOff && atk.prone && !tgt.dead && tgt.hp > 0 ? Battle.knockSq(att, tgt) : null;
    if (atk.prone && !tgt.dead && tgt.hp > 0 && !(atk.proneMax && (tgt.size || 1) > atk.proneMax) && (offSq || (!tgt.conds.prone && !tgt.noProne && !RU.immuneTo(tgt, 'prone')))) { // (proneMax: the largest it can knock down -- the mouther's bite, Medium or smaller, 10-06)
      var ks = RU.save(tgt, 'str', atk.prone);
      this.card(['{r}' + nameOf(tgt) + '{/}: STR save  ' + RU.saveText(ks) + ' vs DC ' + ks.dc + '  ' + (ks.ok ? (offSq ? '{n}HOLDS THE EDGE{/}' : '{n}STAYS UP{/}') : offSq ? '{o}KNOCKED OFF THE EDGE{/}' : '{o}KNOCKED PRONE{/} {g}(half the move to rise){/}')]);
      if (!ks.ok) { if (offSq) yield* this.knockOff(tgt, offSq, att); if (!tgt.noProne && !RU.immuneTo(tgt, 'prone')) tgt.conds.prone = true; D.sfx('hit'); }
      yield 24;
    }
    // a blow that begins the stone (atk.petrify: { dc } -- the cockatrice's bite, SRD 5.1: "against being magically petrified ... begins to turn to stone and is restrained";
    // the save again at the end of its next turn: js/grimoire.js M.stoneBegin, the grid's rules §2.7, 10-08)
    if (atk.petrify && !tgt.dead && tgt.hp > 0 && !tgt.conds.petrified && !tgt.conds.stoning && !RU.immuneTo(tgt, 'petrified')) {
      var pt = RU.save(tgt, 'con', atk.petrify.dc, false, 'petrified');
      this.card(['{r}' + nameOf(tgt) + '{/}: CON save  ' + RU.saveText(pt) + ' vs DC ' + pt.dc + '  ' + (pt.ok ? '{n}SAVED{/}' : '{o}BEGINS TO TURN TO STONE{/} {g}(restrained; the save again at the end of its next turn){/}')]);
      if (!pt.ok) D.magic.stoneBegin(this, tgt, { dc: atk.petrify.dc, by: att.id });
      yield 30;
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
      if (pd) this.hurt(tgt, pd, atk.save.type, { blow: bl });
      yield 30;
    }
    this.blowEnd(tgt, bl);
    att.anim = 'idle';
    if (!o.ready && !o.oa && this.units.some(function (w) { return w.ready && w.reaction > 0; })) yield* this.readyHook(att); // (a blow from hiding, or from the invisible, gives its maker away: the readied strikes, 10-02)
  };
  // a blow at the roper's tendril (SRD 5.1 Grasping Tendrils: "Each tendril can be attacked (AC 20; 10 hit points; immunity to poison and psychic damage). Destroying a tendril
  // deals no damage to the roper"; 10-02, handoff-2026-10-01-the-tendrils-and-ready): from wherever the held one could be struck from -- beside it with a blade, a shot at its
  // square -- the seat's call (invented.json tendril-struck-from). The weapon's own dice and a critical's double, a flaming blade's fire, a rage's +2; no Sneak Attack, no smite,
  // no mark (each is for "a creature": the tendril is a thing). At 0 the grip ends (tendrilGone). A natural 1 lands on the one it holds, as at a darkmantle on a friend's
  // head (RULED 10-01, Griz: "only hurt ally on natural 1")
  Battle.prototype.strikeTendril = function* (att, st, atk, o) {
    o = o || {};
    var held = st.held, holder = st.by, t = held.conds.restrained && held.conds.restrained.tendril;
    if (!t || !G.standing(held) || !G.standing(holder) || held.conds.restrained.by !== holder.id) return;
    if (this.thrownLeft(att, atk) <= 0) return;
    this.spendThrow(att, atk); // (a handaxe thrown at a tendril is thrown: spendThrow)
    if (!o.oa && !o.ready) this.noteHeard(att);
    var melee = !atk.ranged, cid = 'atk' + (++this.cardSeq || (this.cardSeq = 1));
    if (held !== att) this.turnTo(att, faceTo(att, held));
    att.anim = 'attack'; att.animT = this.t;
    if (!o.oa) yield 10;
    if (!melee) { FX.projectile(att, held, atk.fx || 'bolt'); yield { fx: 1 }; }
    var los = G.los(att, held), cover = melee && G.dist(att, held) <= 5 ? 0 : los.cover, ac = t.ac + cover;
    var e = RU.edges(att, st, atk); // (the attacker's own edges -- restrained, prone, blinded, the dark; a thing is never flanked, helped or prone: the stub has no conds)
    e.adv = e.adv.filter(function (a) { return !/flanking/.test(a); }); e.net = e.adv.length && !e.dis.length ? 1 : e.dis.length && !e.adv.length ? -1 : 0;
    var r = RU.d20(e.net), nat = r.pick, bless = att.conds.blessed ? D.d(4) : 0, sacred = att.conds.sacred && !atk.ranged ? att.conds.sacred.atk : 0, pen = e.pen || 0, total = nat + atk.atk + bless + sacred + pen;
    var hit = nat === 20 || (nat !== 1 && total >= ac), crit = hit && nat >= (att.crit || 20);
    var head = '{y}' + nameOf(att) + '{/} > {r}' + st.name + '{/}  ' + atk.name + (o.ready ? ' {c}(readied){/}' : '');
    var line = 'd20 ' + (r.rolls.length > 1 ? RU.fmtRolls(r.rolls) + '>' : '') + nat + ' ' + RU.sign(atk.atk) + (bless ? ' {y}+' + bless + ' bless{/}' : '') + (sacred ? ' {y}+' + sacred + ' sacred{/}' : '') + (pen ? ' {o}' + pen + ' ' + e.penWhy + '{/}' : '') + ' = ' + total + '  vs AC ' + t.ac + (cover ? ' {c}+' + cover + ' cover{/}' : '');
    var why = (e.adv.length ? '  {n}adv: ' + e.adv.join(', ') + '{/}' : '') + (e.dis.length ? '  {o}dis: ' + e.dis.join(', ') + '{/}' : '');
    D.sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : hit ? '{n}HIT{/}' : '{g}MISS{/}') + why], 300, cid);
    if (!hit) {
      if (nat === 1 && atk.dice && held !== att && !G.hostile(att, held)) {
        var hd = RU.damage(atk.dice, atk.mod || 0, {});
        D.sfx('hit'); FX.float('OOF', held, D.PAL.ramps.fire[2]);
        this.card(['{o}A natural 1:{/} the blow meant for the tendril lands on ' + nameOf(held) + '.  ' + atk.dice + RU.sign(atk.mod || 0) + ' ' + RU.fmtRolls(hd.rolls) + ' = {r}' + hd.total + '{/} ' + (atk.type || '')], 320);
        this.hurt(held, hd.total, atk.type, { magic: !!(atk.magic || atk.spell) });
      } else FX.float('MISS', held, D.PAL.ramps.silver[5]);
      yield o.oa ? 16 : 24; att.anim = 'idle'; return;
    }
    var dr = RU.damage(atk.dice, atk.mod, { crit: crit, gwf: atk.gwf }), dmg = dr.total, parts = [atk.dice + RU.sign(atk.mod) + ' ' + RU.fmtRolls(dr.rolls) + RU.sign(atk.mod) + ' = ' + dr.total + ' ' + atk.type];
    if (att.conds.raging && melee && !atk.finesse) { dmg += att.conds.raging.dmg || 2; parts.push('{o}rage +' + (att.conds.raging.dmg || 2) + '{/}'); }
    if (att.conds.enlarged && !atk.spell) { var en = D.roll('1d4', { crit: crit }); dmg += att.conds.enlarged.down ? -en.total : en.total; parts.push((att.conds.enlarged.down ? '{g}reduced -' : '{o}enlarged +') + en.total + '{/}'); dmg = Math.max(1, dmg); }
    var fire = 0;
    if (atk.flame && att.conds.ablaze) { var fl = D.roll(atk.flame, { crit: crit }); fire = fl.total; parts.push('{o}flame ' + atk.flame + ' ' + RU.fmtRolls(fl.rolls) + ' = ' + fl.total + ' fire{/}'); }
    if ((t.immune || []).indexOf(atk.type) >= 0) { parts.push('{g}immune to ' + atk.type + '{/}'); dmg = 0; }
    var all = dmg + fire;
    this.card([head, line + '  ' + (crit ? '{y}CRITICAL{/}' : '{n}HIT{/}') + why, parts.join('  ') + '  = {r}' + all + '{/}'], 300, cid);
    if (melee) FX.slash(held, crit ? D.PAL.ramps.gold[4] : null);
    t.hp = Math.max(0, t.hp - all);
    FX.float('-' + all, held, D.PAL.ramps.bone[2]);
    if (t.hp <= 0) this.tendrilGone(holder, held, 'cut through');
    else this.card(['{g}the tendril: ' + t.hp + ' of ' + t.max + ' left{/}'], 200);
    yield o.oa ? 18 : 26;
    att.anim = 'idle';
  };

  // ------------------------------------------------------------------ Ready (SRD 5.1; exec 'ready', 10-02): the readied strikes, sprung by what brings a foe to one
  // the foes u could strike now with what it readied (a weapon's reach; a bow's or a spell's range, and sight); a readied action springs for one that joins the list -- walks
  // within reach, comes up out of the ground, steps out of the Ethereal, comes into the light, out of a darkness, is seen again. Beside you it is felt: no sight asked of a blade
  Battle.prototype.readyTargets = function (u, rd) {
    var self = this, wp = rd && rd.wp, g = rd && rd.id ? D.magic.geo(rd.id) : null;
    return this.units.filter(function (w) {
      if (!G.hostile(u, w) || !G.standing(w) || w.ethereal || w.under || (w.riding && !w.attached) || RU.charmedBy(u, w)) return false;
      if (rd && rd.range) return G.dist(u, w) <= rd.range && (!rd.see || G.dist(u, w) <= 5 || (G.los(u, w).clear && D.magic.sees(self, u, w))); // (a readied special: its own reach, and sight where it aims by sight -- 10-08)
      if (g) return !!D.magic.targetOK(self, u, g, w);
      if (wp && wp.ranged) return G.dist(u, w) <= wp.range[1] && G.los(u, w).clear && (D.magic.sees(self, u, w) || G.dist(u, w) <= 5);
      return G.dist(u, w) <= G.reachOf(u, wp && wp.reach);
    });
  };
  Battle.prototype.readyHad = function (u, rd) { var h = {}; this.readyTargets(u, rd).forEach(function (w) { h[w.id] = 1; }); return h; };
  // asked of every event that could bring a foe to a readier: a step (moveAlong), a burrower up (ai.js rise), a phase spider out, a spell's end (exec cast), a blow from hiding
  // (attack). Each readier with its reaction looks at who it could strike now against who it could before: a new one springs it -- a player's hero asked, the AI's at once --
  // and the list is kept either way. `about`: the one whose doing it was, struck first when it is among the new
  // (how 'move': `about` took a step. For a bow or a spell, one already in sight moving springs it too -- 10-05, Griz: "just OR if there's already in sight": Aurdin's readied ray
  // let the male giant climb in plain view twice. Asked once a move: held, it is not asked again for the same one's same turn; a refused trigger waits for the next -- SRD 5.1,
  // "you can either take your reaction right after the trigger finishes or ignore the trigger", till the start of the readier's turn)
  // (never the readier's own turn: RULED 10-05, "the action stored as reaction goes off if triggered on someone else's turn" -- exec 'ready')
  Battle.prototype.readyHook = function* (about, how) {
    var self = this, rs = this.units.filter(function (w) { return w.ready && (w.ready.trigger || 'near') === 'near' && w.reaction > 0 && RU.canAct(w) && G.standing(w) && w !== self.active; });
    for (var i = 0; i < rs.length; i++) {
      var w = rs[i], rd = w.ready; if (!rd || w.reaction <= 0 || !RU.canAct(w)) continue; // (sprung already from inside another's strike -- a readied spell's own attack asks the hook again)
      var now = this.readyTargets(w, rd), fresh = now.filter(function (t) { return !(rd.had || {})[t.id]; });
      rd.had = {}; now.forEach(function (t) { rd.had[t.id] = 1; });
      var sight = rd.what === 'spell' || (rd.wp && rd.wp.ranged) || !!rd.see, mvKey = about ? about.id + '@' + this.round + ':' + (this.active ? this.active.id : '') : null;
      var mover = !fresh.length && how === 'move' && sight && about && now.indexOf(about) >= 0 && rd.heldFor !== mvKey ? about : null;
      if (!fresh.length && !mover) continue;
      var foe = mover || (about && fresh.indexOf(about) >= 0 ? about : fresh[0]);
      var sprung = yield* this.readySpring(w, rd, { foe: foe, why: Battle.nm(foe, true) + (mover ? ' moves.' : ' comes ' + (sight ? 'into sight' : 'within reach') + '.') });
      if (!sprung && w.ready && mover) w.ready.heldFor = mvKey;
      if (about && (about.dead || about.hp <= 0)) return;
    }
  };
  // the four triggers (10-02, Griz: 1 and 2 of the seat's draft, "let's make 3 'an ally goes down' for readied healers", and "foe you can see casts a spell").
  // 'near' is the old one (readyHook, above); the other three are told after the attack, the spell or the turn that made them (readyAfter) -- SRD 5.1: "When the
  // trigger occurs, you can either take your reaction right after the trigger finishes or ignore the trigger"
  // (short, so the prompt is one row of buttons under one line, as the others are -- 10-06, a pad player: "trigger renders text box above selection, unlike
  // other options (3 rows of text instead of 1 or 2)"; it stood three rows tall over the hero. The long words are Battle.readyWhen's, on the card after)
  Battle.READY_TRIGGERS = [
    { id: 'near', label: 'A FOE IN REACH' },
    { id: 'ally', label: 'A FOE ATTACKS US' },
    { id: 'down', label: 'ONE OF US DOWN' },
    { id: 'cast', label: 'A FOE CASTS' }
  ];
  Battle.readyWhen = function (rd) {
    if (rd.trigger === 'ally') return 'when a foe attacks one of us in sight';
    if (rd.trigger === 'down') return 'when one of us goes down';
    if (rd.trigger === 'cast') return 'when you see a foe cast a spell';
    return 'when a foe comes ' + (rd.what === 'spell' || (rd.wp && rd.wp.ranged) || rd.see ?'into sight, or one in sight moves' : 'within reach');
  };
  Battle.sawEffect = function (B, w, ef) { return !!(ef && ((ef.units || []).some(function (x) { return x === w || D.magic.sees(B, w, x); }) || (ef.sq || []).some(function (q) { return D.magic.seesSq(B, w, q[0], q[1]); }))); };
  Battle.nm = function (w, cap) { return w.side === 'foe' ? (w.named ? '' : cap ? 'The ' : 'the ') + shortName(w) : w.name; };
  // who stands now (the units up and about): "one of us goes down" is the one stood at the last look and down at this
  Battle.prototype.readySnap = function () { var s = this.upSeen = {}; this.units.forEach(function (w) { if (!w.dead && w.hp > 0) s[w.id] = 1; }); };
  Battle.prototype.readyArmed = function () { return this.units.some(function (w) { return w.ready && w.reaction > 0; }); };
  // after an attack (ctx.kind 'ally': ctx.foe struck at ctx.ally), a spell (ctx.kind 'cast': ctx.foe cast it), or a turn: the readied ones it springs
  // (ctx.turnOf: the one whose turn just ended -- its end's saves are still its turn: the turn loop; `own` is never sprung, RULED 10-05)
  Battle.prototype.readyAfter = function* (ctx) {
    if (!this.readyArmed() || this.over()) return;
    ctx = ctx || {};
    var self = this, seen = this.upSeen || {}, downs = this.units.filter(function (w) { return seen[w.id] && (w.dead || w.hp <= 0); }), own = ctx.turnOf || this.active;
    this.readySnap();
    if (ctx.kind === 'ally' && ctx.foe && ctx.ally) yield* this.readyOn('ally', { foe: ctx.foe, ally: ctx.ally, why: Battle.nm(ctx.foe, true) + ' attacks ' + Battle.nm(ctx.ally) + '.' }, own);
    if (ctx.kind === 'cast' && ctx.foe) yield* this.readyOn('cast', { foe: ctx.foe, effect: ctx.effect, why: Battle.nm(ctx.foe, true) + ' casts ' + (D.magic.data(ctx.spell) ? D.magic.data(ctx.spell).name : 'a spell') + '.' }, own);
    for (var i = 0; i < downs.length; i++) yield* this.readyOn('down', { ally: downs[i], foe: ctx.foe && G.hostile(ctx.foe, downs[i]) ? ctx.foe : null, why: Battle.nm(downs[i], true) + ' goes down.' }, own);
  };
  Battle.prototype.readyOn = function* (kind, ctx, own) {
    var self = this, rs = this.units.filter(function (w) { return w.ready && w.ready.trigger === kind && w.reaction > 0 && RU.canAct(w) && G.standing(w) && w !== (own || self.active); });
    for (var i = 0; i < rs.length; i++) {
      var w = rs[i]; if (!w.ready || w.ready.trigger !== kind || w.reaction <= 0 || !RU.canAct(w) || this.over()) continue;
      if (kind === 'ally' && (!G.hostile(w, ctx.foe) || G.hostile(w, ctx.ally) || !(ctx.ally === w || D.magic.sees(self, w, ctx.ally)))) continue; // (one of us: you too)
      if (kind === 'down' && (ctx.ally === w || G.hostile(w, ctx.ally))) continue; // (heard, if not seen: a cry, a fall)
      // (you see it cast: the caster in sight, or what it does -- a creature it lands on (you too), a square of what it lays. 10-02, Griz: "could we 'you see a spell cast'
      // then target based on readied action (i.e the spell effect if eligible, the caster for a bow shot)" -- "2 - yes")
      if (kind === 'cast' && (!G.hostile(w, ctx.foe) || !(D.magic.sees(self, w, ctx.foe) || Battle.sawEffect(self, w, ctx.effect)))) continue;
      yield* this.readySpring(w, w.ready, ctx);
    }
  };
  // the readied thing, sprung: a player's hero aims it now (a request of its own, { aim }: js/ui.js -- the cursor on the one that set it off, X or the right button
  // holds it; 10-02, Griz: "or were you letting them pick target when the trigger went off, that's probably better"), the AI's goes where the trigger points (readyAuto).
  // It is done on a turn of its own (one weapon attack, the spell, or a move up to the speed), and the readier's own turn put back after. Held, it waits for the next
  Battle.prototype.readySpring = function* (w, rd, ctx) {
    var g = rd.what === 'spell' ? D.magic.geo(rd.id) : null, keep = w.turn, wk = w.weapon, cmd = null;
    w.turn = { move: rd.what === 'move' ? w.speed : 0, action: rd.what === 'move' ? 0 : 1, bonus: 0, attacksLeft: rd.what === 'weapon' ? 1 : 0, attackAction: rd.what === 'weapon', sneakUsed: false, disengaged: false, spellAction: null, bonusSpell: false, moved: 0, freeObj: false, readied: true };
    if (rd.what === 'weapon') w.weapon = rd.wp; // (the other weapon readied: in hand for the strike)
    try {
      // (a readied special centred on its user -- Group Hug, the Fountain -- with no one it would mend now: held on for the next trigger, the reaction kept. 10-08, Griz: "Just checked
      // and Goose can't ready Group Hug"; sprung on a miss it would have spent the special on nobody)
      if (rd.what === 'cmd' && rd.self && !this.commands(w).some(function (x) { return x.id === rd.cmd && x.ok; })) return false;
      if (byAI(w)) cmd = this.readyAuto(w, rd, ctx);
      else if (g && g.shape === 'self') cmd = yield { prompt: { who: w, title: w.name + ': THE READIED ' + rd.name.toUpperCase() + '?', lines: [ctx.why], opts: [{ label: 'CAST', value: { do: 'cast', target: w } }, { label: 'HOLD', value: null }] } };
      else if ((rd.what === 'cmd' && !rd.tool) || (rd.what === 'item' && rd.self)) cmd = yield { prompt: { who: w, title: w.name + ': THE READIED ' + rd.name.toUpperCase() + '?', lines: [ctx.why], opts: [{ label: 'NOW', value: rd.what === 'item' ? { do: 'item', id: rd.item, target: w } : { do: rd.cmd, target: rd.range ? ctx.foe : undefined } }, { label: 'HOLD', value: null }] } }; // (a readied special goes at the one that sprang it)
      else cmd = yield { aim: { who: w, rd: rd, ctx: ctx } };
      var fit = cmd && (rd.what === 'weapon' ? cmd.do === 'attack' && cmd.target : rd.what === 'move' ? cmd.do === 'move' : rd.what === 'cmd' ? cmd.do === rd.cmd : rd.what === 'item' ? cmd.do === 'item' && cmd.id === rd.item : cmd.do === 'cast');
      if (!fit) { if (!byAI(w)) this.card(['{g}' + w.name + ' holds the readied ' + rd.name + '.{/}'], 120); return false; }
      w.reaction = 0; delete w.ready;
      if (w.conc && w.conc.id === 'ready') delete w.conc; // (the held magic is let go into the cast: no undo)
      var tn = cmd.target && cmd.target.id != null ? cmd.target : cmd.target && cmd.target.units && cmd.target.units[0];
      this.card(['{o}' + w.name + '{/}: the readied ' + (rd.what === 'move' ? 'move' : rd.what === 'cmd' ? rd.name.toUpperCase() : rd.name) + (tn && tn !== w ? ', at ' + Battle.nm(tn) : '') + '.  {g}(' + ctx.why + '){/}']);
      if (rd.what === 'weapon') {
        if (rd.wp.ammo) { var left = this.ammoLeft(w); if (left) this.spendAmmo(w); else { this.card(['{o}' + w.name + ' has no ' + this.itemName(rd.wp.ammo).toLowerCase() + ' left.{/}'], 120); return true; } }
        if (cmd.target.tendril) yield* this.strikeTendril(w, cmd.target, rd.wp); else yield* this.attack(w, cmd.target, rd.wp, { ready: true });
      } else if (rd.what === 'spell') {
        if (rd.level) w.slots[rd.slot - 1]++; // (spent at the readying; the cast spends it again)
        yield* D.magic.cast(this, w, rd.id, rd.slot, cmd.target);
      } else if (rd.what === 'cmd' || rd.what === 'item') {
        yield* this.exec(w, cmd); // (the feature, the action or the item, as on a turn: the readier's own turn for it, battle.js above)
      } else {
        var rm = G.reach(w, w.turn.move), path = G.path(rm, cmd.x, cmd.y);
        if (path && path.length && rm[cmd.x + ',' + cmd.y] && rm[cmd.x + ',' + cmd.y].stand) yield* this.moveAlong(w, path, { spend: true });
      }
      return true;
    } finally { w.turn = keep; w.weapon = wk; }
  };
  // the AI's readied thing, where the trigger points: a blade or a foe's spell at the one that set it off (or another in reach), a friend's spell on the one struck or
  // fallen (or itself), an area on the foe's square; a move back out of its reach, or to the side of the one who fell. null: nothing it can do with it now (held)
  Battle.prototype.readyAuto = function (w, rd, ctx) {
    var self = this, M = D.magic, foe = ctx.foe && G.hostile(w, ctx.foe) && G.standing(ctx.foe) ? ctx.foe : null, ally = ctx.ally && !G.hostile(w, ctx.ally) && !ctx.ally.dead ? ctx.ally : null;
    if (rd.what === 'weapon') {
      var t = foe && this.canHit(w, foe) ? foe : this.units.filter(function (x) { return G.hostile(w, x) && G.standing(x) && !x.ethereal && self.canHit(w, x); })[0];
      return t ? { do: 'attack', target: t } : null;
    }
    if (rd.what === 'spell') {
      var g = M.geo(rd.id), ok = function (x) { return !!(x && M.targetOK(self, w, g, x)); };
      if (g.shape === 'self') return { do: 'cast', target: w };
      if (g.effects && ctx.effect) { // (Dispel Magic readied against a spell: an empty square of what it laid, else the one of ours it marked -- the trigger's own target, 10-02)
        var sqs = (ctx.effect.sq || []).filter(function (q) { return !G.occupant(q[0], q[1]) && M.effectsAt(self, q[0], q[1]).length && Math.max(Math.abs(q[0] - w.x), Math.abs(q[1] - w.y)) * 5 <= (g.range || 0) && G.losPoint(w.x, w.y, q[0], q[1]); });
        if (sqs.length) return { do: 'cast', target: { x: sqs[0][0], y: sqs[0][1] } };
        var mk = (ctx.effect.units || []).filter(function (x) { return !G.hostile(w, x) && ok(x); })[0];
        if (mk) return { do: 'cast', target: mk };
      }
      if (/^(rays|darts)$/.test(g.shape)) { if (!ok(foe)) return null; var n = (g.n || 1) + Math.max(0, (rd.slot || 0) - (rd.level || 0)), us = []; for (var k = 0; k < n; k++) us.push(foe); return { do: 'cast', target: { units: us } }; }
      if (/^(sphere|cube)$/.test(g.shape)) return foe && M.inRange(w, g, foe.x, foe.y) ? { do: 'cast', target: { x: foe.x, y: foe.y } } : null;
      if (/^(cone|line|wave)$/.test(g.shape)) return foe && M.area(w, g, foe.x, foe.y).length ? { do: 'cast', target: { x: foe.x, y: foe.y } } : null;
      if (g.shape === 'allies') { var a = ok(ally) ? ally : ok(w) ? w : null; return a ? { do: 'cast', target: { units: [a] } } : null; }
      if (g.side === 'ally' || g.shape === 'touch') { var b = ok(ally) ? ally : ok(w) ? w : null; return b ? { do: 'cast', target: b } : null; }
      return ok(foe) ? { do: 'cast', target: foe } : null;
    }
    if (rd.what === 'cmd') { // (a feature or an action: at once, or -- one that takes a target -- Help at the foe beside it, Lay on Hands on the friend beside it)
      if (!rd.tool) return { do: rd.cmd };
      if (rd.cmd === 'help') return foe && G.dist(w, foe) <= 5 ? { do: 'help', target: foe } : null;
      if (rd.cmd === 'lay') return ally && G.dist(w, ally) <= 5 ? { do: 'lay', target: ally } : null;
      return null;
    }
    if (rd.what === 'item') { // (a potion on the friend who fell, a flask at the foe, or its own)
      if (rd.self) return { do: 'item', id: rd.item, target: w };
      var it = [ally, foe, w].filter(function (x) { return x && self.itemTargetOK(w, rd.item, x); })[0];
      return it ? { do: 'item', id: rd.item, target: it } : null;
    }
    var to = rd.trigger === 'down' ? ally : null, from = to ? null : foe;
    if (!to && !from) return null;
    var rm = G.reach(w, w.turn.move), best = null, bs = -1e9;
    Object.keys(rm).forEach(function (k) { var e = rm[k]; if (!e.stand) return; var s = (to ? -G.dist(to, w, null, null, e.x, e.y) : G.dist(from, w, null, null, e.x, e.y)) * 10 - e.cost / 10; if (s > bs) { bs = s; best = e; } });
    return best && (best.x !== w.x || best.y !== w.y) ? { do: 'move', x: best.x, y: best.y } : null;
  };
  // the seams the other three triggers are told at: after every attack (a foe's at one of us: 'ally'; one of us down by it: 'down'), and after every spell (a foe's in
  // sight: 'cast'; and the downs again). The readied ones go "right after the trigger finishes" (SRD 5.1)
  var attack0 = Battle.prototype.attack;
  Battle.prototype.attack = function* (att, tgt, atk, o) {
    var throws0 = this.thrownLeft(att, atk);
    yield* attack0.call(this, att, tgt, atk, o);
    if (throws0 > 0 && throws0 !== Infinity && !this.thrownLeft(att, atk)) this.card(['{g}(' + Battle.nm(att) + ' has thrown ' + (att.side === 'foe' && !att.named ? 'its' : 'the') + ' last ' + atk.name.toLowerCase().replace(/^thrown /, '') + '){/}'], 160); // (spendThrow)
    yield* this.readyForced();
    if (tgt && this.readyArmed()) yield* this.readyAfter({ kind: 'ally', foe: att, ally: tgt });
  };
  // forced moves (10-06, the grid's rules §2.5; SRD 5.1 Ready: "right after the trigger finishes"): a body set down by something not its own walk -- pushed (Thunderwave, Gust of
  // Wind, Repelling Blast, a shove: magic.js M.push), a rider pulled off or thrown off and dropped beside (dismount), a cushion shoved out from under a fall (landOn), one knocked over
  // a ledge (knockOff) -- goes on B.shoved where it lands, and the readied strikes are asked of it once the action that moved it is done: the end of every exec, of every attack, and
  // the AI's own shove (ai.js shoveOff). The Keeper's Wave asks the hook itself (keeper.js, the pattern this follows); asked twice, the second finds nothing new (readyHook's `had`)
  Battle.prototype.forced = function (w) { if (w && !w.dead) (this.shoved = this.shoved || []).push(w); };
  Battle.prototype.readyForced = function* () {
    var s = this.shoved; if (!s || !s.length) return;
    this.shoved = [];
    if (!this.readyArmed() || this.over()) return;
    for (var i = 0; i < s.length; i++) if (s.indexOf(s[i]) === i && G.standing(s[i])) yield* this.readyHook(s[i]);
  };
  var exec0 = Battle.prototype.exec;
  Battle.prototype.exec = function* (u, c) { var r = yield* exec0.apply(this, arguments); yield* this.readyForced(); return r; };
  var cast0 = D.magic.cast, ZK = ['grounds', 'zones', 'darks', 'webs', 'walls', 'auras', 'wards', 'beads', 'lights', 'spirits', 'shells'];
  D.magic.cast = function* (B, u, id, slot, t) {
    // (what the spell does, for "you see a foe cast a spell": the creatures it hurt or marked, the squares of what it laid -- told only with a ready armed)
    var pre = B && B.readyArmed && B.units && B.readyArmed() ? { z: {}, hp: {}, c: [] } : null;
    if (pre) { ZK.forEach(function (k) { pre.z[k] = (B[k] || []).slice(); }); B.units.forEach(function (w) { pre.hp[w.id] = w.hp; Object.keys(w.conds || {}).forEach(function (k) { var c = w.conds[k]; if (c && typeof c === 'object') pre.c.push(c); }); }); }
    // Sanctuary (SRD 5.1: "If the warded creature ... casts a spell that affects an enemy creature, this spell ends" -- 10-03, M.unward had no caller): a foe it was
    // aimed at, or one it hurt or laid something on (an area's catch), ends the caster's ward; a spell on friends keeps it
    var ward = u && u.conds && u.conds.sanctuary && B && B.units ? { hp: {}, c: {} } : null;
    if (ward) B.units.forEach(function (w) { if (!G.hostile(u, w)) return; ward.hp[w.id] = w.hp; ward.c[w.id] = Object.assign({}, w.conds); });
    var r = yield* cast0.apply(this, arguments);
    if (ward && u.conds.sanctuary && D.magic.unward) {
      var aimed = t && t.units ? t.units : t && t.hp != null ? [t] : [];
      var touched = aimed.some(function (w) { return w && w.hp != null && G.hostile(u, w); }) || B.units.some(function (w) { return ward.hp[w.id] != null && (w.hp < ward.hp[w.id] || w.dead || Object.keys(w.conds || {}).some(function (k) { return ward.c[w.id][k] !== w.conds[k]; })); });
      if (touched) D.magic.unward(B, u, 'a spell at a foe');
    }
    if (B && B.readyAfter && B.units && B.readyArmed()) {
      var ef = { units: [], sq: [] };
      if (pre) {
        ZK.forEach(function (k) { (B[k] || []).forEach(function (z) { if (pre.z[k].indexOf(z) < 0 && D.magic.effectSq) ef.sq = ef.sq.concat(D.magic.effectSq(B, k, z)); }); });
        B.units.forEach(function (w) { var hurt = pre.hp[w.id] != null && w.hp < pre.hp[w.id], marked = Object.keys(w.conds || {}).some(function (k) { var c = w.conds[k]; return c && typeof c === 'object' && pre.c.indexOf(c) < 0; }); if (hurt || marked) ef.units.push(w); });
      }
      yield* B.readyAfter({ kind: 'cast', foe: u, spell: id, effect: ef });
    }
    return r;
  };
  // leaving everyone's reach at once -- down into the ground, up into the air -- with no step to provoke on (moveAlong provokes square by square): the opportunity attacks of
  // those beside it that see it, each asked of a player's hero (SRD 5.1: "when a hostile creature that you can see moves out of your reach"). 10-02
  Battle.prototype.provoke = function* (u, why) {
    var T = u.turn || {}, self = this;
    if (T.disengaged || u.ethereal) return;
    var prov = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w) && w.reaction > 0 && !w.conds.turned && !w.ethereal && !w.riding && !(w.weapon && w.weapon.ranged) && G.dist(w, u) <= G.reachOf(w) && D.magic.sees(self, w, u) && !RU.charmedBy(w, u); });
    for (var k = 0; k < prov.length; k++) {
      var w = prov[k], take = true;
      if (w.side === 'party' && !w.guest && !w.ally) take = yield { prompt: { who: w, title: w.name + ': OPPORTUNITY ATTACK?', lines: [(u.side === 'foe' ? Battle.nm(u, true) : u.name) + ' is ' + (why || 'leaving') + ', out of ' + w.name + "'s reach." + (w.ready ? '  (the reaction is what the readied ' + w.ready.name + ' waits on)' : '')], opts: [{ label: 'STRIKE', value: true }, { label: 'LET IT GO', value: false }] } };
      if (!take) continue;
      w.reaction = 0;
      this.card(['{o}' + w.name + '{/}: an opportunity attack on ' + (u.side === 'foe' ? (u.named ? '' : 'the ') + shortName(u) : u.name) + ', ' + (why || 'leaving') + '.']);
      var atk = w.weapon || w.attacks.shortsword || w.attacks.longsword || w.attacks.bite || w.attacks[Object.keys(w.attacks).filter(function (k) { return !w.attacks[k].ranged; })[0]];
      if (!atk) continue;
      yield* this.attack(w, u, atk, { oa: true });
      if (u.hp <= 0 || u.dead) return;
    }
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
  // a unit turns (to a blow's target, a spell's, a friend it helps): its watch is on a new side, so it looks again at the hidden among its enemies (battle.js findsHidden;
  // 10-04, Griz: every turn of the model -- two foes flanking it, two blows, two looks -- and a step turns it too, moveAlong)
  Battle.prototype.turnTo = function (u, f) { if (u.facing === f) return; u.facing = f; if (RU.canAct(u) && u.hp > 0) this.findsHidden(u); };

  // one blow of several kinds, one concentration save (the grid's rules §2.1, RULED 10-06 on the lane's lean): `parts` [[n, type], ...] land in order on u, each
  // its own hurt (resistance by kind), their `blow` banking what u took; then one save, DC 10 or half the sum (SRD 5.1 Concentration: "you make a separate saving
  // throw for each source of damage"). A part after u is dead is not dealt (one down still takes it, as before)
  Battle.prototype.blow = function () { return { took: 0 }; };
  Battle.prototype.blowEnd = function (u, blow) { if (u.blowIn === blow) delete u.blowIn; if (blow && blow.took > 0 && !u.dead && u.hp > 0) D.magic.concCheck(this, u, blow.took); if (blow) blow.took = 0; };
  Battle.prototype.hurtAll = function (u, parts, src) {
    var bl = this.blow(), s = Object.assign({}, src || {}, { blow: bl });
    for (var i = 0; i < parts.length; i++) if (parts[i][0] > 0 && !u.dead) this.hurt(u, parts[i][0], parts[i][1], s);
    this.blowEnd(u, bl);
  };
  // damage lands: a flash, a number, and at 0 a hero goes down (and can be brought back), a foe dies
  Battle.prototype.hurt = function (u, n, type, src) { // (src: { magic: true } when the blow is magical -- a spell, a magic weapon, a monster's magical attacks)
    if (n <= 0) return;
    u.woken = true; // (the cloaker hangs as a cloak till it takes damage: ui.js unitObj)
    if (D.magic.preHurt) { n = D.magic.preHurt(this, u, n, type); if (n <= 0) return; } // (the Vigil's Keeper's Ward: js/features.js)
    // an object with a damage threshold (SRD 5.1 Objects: a blow under it is superficial) and resistance to everything (the skylight, 10-04 night)
    if (u.threshold && n < u.threshold) { FX.float('glances off', u, D.PAL.ramps.silver[5]); return; }
    if (u.object && u === this.skylight && this.skyHit == null) this.skyHit = this.round; // (the first bang on the glass: the garrison's hatch opens the round after -- Battle.hatchOut, 10-05)
    if (u.resistAll && !/^(poison|psychic)$/.test(type || '') && !(u.object && type === 'thunder')) /* (thunder shatters glass: the skylight's resistance to everything -- magically harder than glass -- stands against all but Shatter, the one area the SRD lets hurt an object; its threshold of 8 still holds. 10-05, Griz: "SRD only shatter is even nicer") */ { n = Math.floor(n / 2); if (n <= 0) return; }
    if (/fire|acid/.test(type || '')) u.burned = true; // a troll's regeneration reads this at its next turn
    if (type === 'fire' && D.magic.burnWebs) D.magic.burnWebs(this, G.foot(u)); // (fire on one standing in a web burns the web: magic.js)
    // Talmok rages when he is first hit: blades and fists do half from then on, his own blows +2
    if (u.rageOnHit && !u.raging && !u.dead) { u.raging = true; u.resist = ['bludgeoning', 'piercing', 'slashing']; FX.ring(u, 'red', 30); D.sfx('crit'); this.card(['{r}' + u.name + '{/} roars and rages!  {g}(half from blades and blows; +2 to his own){/}']); }
    // Split (the black pudding): slashing or lightning on one of Medium size or more with 10 HP or more halves it into two
    if (u.split && !u.dead && /slashing|lightning/.test(type || '') && u.hp >= 10 && (u.sizeClass || (u.size > 1 ? 'L' : 'M')) !== 'S' && this.alive('foe').length < 8) this.splitOff(u);
    // resistance halves a blow once, however many say so (SRD 5.1: "Multiple instances of resistance or vulnerability that affect the same
    // damage type count as only one instance" -- 10-03, the review seat's find: a raging barbarian under Warding Bond took a quarter)
    var resisted = false;
    if (u.immune || u.resist || u.vulnerable) {
      var ty = this.typed(u, n, type);
      if (ty.why) FX.float(ty.why === 'immune' ? 'immune: ' + type : ty.why, u, ty.why === 'vulnerable' ? D.PAL.ramps.gold[4] : D.PAL.ramps.silver[5]); // (says to what: the jelly and a blade)
      if (ty.why === 'resists') resisted = true;
      n = ty.n;
      if (n <= 0) return;
    }
    // Damage Transfer (the cloaker): while it has someone engulfed -- or rides one, attached (the SRD's cloaker, 10-06) -- half of what it takes goes to them
    if (u.transfer && ((u.holding && u.holding.length) || (u.attached && u.riding && u.master)) && n > 1) {
      var vic = (u.holding && u.holding[0]) || u.master, half = Math.floor(n / 2);
      if (vic && !vic.dead && vic.hp > 0) { n -= half; FX.float('transfer', vic, D.PAL.ramps.violet[4]); this.hurt(vic, half, type); }
    }
    // a statue (petrified, SRD 5.1: "resistance to all damage", "immune to poison" -- js/grimoire.js M.petrify, 10-08)
    if (u.conds.petrified) { if (type === 'poison') { FX.float('immune: poison', u, D.PAL.ramps.silver[5]); return; } if (!resisted) { n = Math.floor(n / 2); resisted = true; FX.float('stone', u, D.PAL.ramps.silver[5]); } if (n <= 0) return; }
    // Stoneskin (SRD 5.1: "resistance to nonmagical bludgeoning, piercing, and slashing damage" -- 10-03: a magic blade or a spell's hail lands whole)
    if (!resisted && u.conds.stoneskin && /bludgeoning|piercing|slashing/.test(type || '') && !(src && src.magic)) { n = Math.floor(n / 2); resisted = true; FX.float('stoneskin', u, D.PAL.ramps.silver[5]); }
    // the class NPCs' wards (09-28, js/grimoire.js): Protection from Energy (one element halved), Protection from Poison, Rage (blades and
    // blows halved), Warding Bond (all of it halved -- and the one who bound it takes as much)
    var ward = u.conds;
    if (!resisted && ((ward.energyWard && ward.energyWard.type === type) || (ward.poisonWard && type === 'poison') || (ward.raging && /bludgeoning|piercing|slashing/.test(type || '')))) { n = Math.floor(n / 2); resisted = true; FX.float('resists', u, D.PAL.ramps.silver[5]); }
    if (ward.wardingBond && n > 0) {
      if (!resisted) { n = Math.floor(n / 2); resisted = true; } // (the bond's resistance counts once too; the one who bound it still takes what the ward-bearer takes)
      var bondBy = this.units.filter(function (w) { return w.id === ward.wardingBond.by && !w.dead && w.hp > 0; })[0];
      if (bondBy && bondBy !== u && n > 0) { FX.float('bond', bondBy, D.PAL.ramps.gold[4]); this.hurt(bondBy, n, 'bond'); if (bondBy.hp <= 0) delete ward.wardingBond; }
    }
    // concentration reads the damage taken, temporary hit points and a beast's shape included (SRD 5.1: "Whenever you take damage while you
    // are concentrating"; the DC "half the damage you take") -- one save a blow: the rest a reverted druid carries into their own shape
    // comes back `carried` and rolls none (10-03, the review: a temp-HP soak and Wild Shape both returned before the save)
    // (a blow of two kinds -- Ice Storm's hail and cold, Flame Strike's fire and radiant, a blade and its fire or a bite and its poison -- is one source, one save on the sum:
    // its parts carry one `blow` record and bank what they took, and the caller asks once at the end, Battle.blowEnd -- the grid's rules §2.1, SRD 5.1 "half the damage you take")
    var took = n, conc = function (B) { if (took > 0 && !(src && src.carried)) { if (src && src.blow) src.blow.took += took; else D.magic.concCheck(B, u, took); } };
    if (u.temp > 0) { var soak = Math.min(u.temp, n); u.temp -= soak; n -= soak; }
    // Wild Shape (js/features.js): the beast's hit points take it first; at 0 the druid comes back with the rest
    if (u.beast && n > 0) { if (n < u.beast.hp) { u.beast.hp -= n; u.flash = 10; FX.float('-' + n, u, D.PAL.ramps.red[4]); conc(this); return; } var over = n - u.beast.hp; conc(this); D.features.unshape(this, u, over, false, type, src); return; } // (the rest lands as the blow's own kind, its magic with it: the grid's rules §2.2)
    if (u.conds.asleep) { delete u.conds.asleep; FX.float('awake!', u, D.PAL.ramps.bone[2]); }
    if (n <= 0) { conc(this); return; }
    // a troll down at 0 (u.regenDown, below): more blows change nothing but the burning -- fire or acid, and it is dead there and then (RULED 10-06, Griz: "if hp drops to
    // 0 while burning = true, trigger troll death"; his "troll HP = 0 AND fire/acid = True ... trigger troll death" -- ours, not the SRD's wait for the start of its turn)
    if (u.regenDown && !u.dead) {
      u.flash = 10; FX.float('-' + n, u, D.PAL.ramps.red[4]);
      if (/fire|acid/.test(type || '')) { delete u.regenDown; u.dead = true; u.deadT = this.t; D.sfx('die'); this.card(['{o}The ' + shortName(u) + ' burns where it lies. It is dead.{/}'], 260); }
      return;
    }
    var hp0 = u.hp; u.hp = Math.max(0, u.hp - n);
    if (u.traces) this.hitAtTraces = true; // (nothing shows now: from their next moves they run, or he turns to fight: ai.js turn)
    if (u.displacement) u.conds.displaceOff = true; // the cloak falters when a blow lands
    u.flash = 10;
    // a sheet with a hit row flinches (played once, ui.js unitObj) when the blow doesn't drop it and it isn't mid-swing or mid-stride
    if (u.hp > 0 && (!u.anim || u.anim === 'idle' || u.anim === 'flinch') && D.spr.anim(u.sheet, 'flinch')) { u.anim = 'flinch'; u.animT = this.t; }
    FX.float('-' + n, u, D.PAL.ramps.red[4]);
    if (u.conds.hidden) delete u.conds.hidden;
    // massive damage (SRD 5.1: "When damage reduces you to 0 hit points and there is damage remaining, you die if the remaining damage equals or exceeds your hit point maximum";
    // at 0 already, a blow of the maximum): one of the party -- a hero, a guest, the Pocket DM's own -- is dead, not down, and no Relentless holds it (it is for "not killed
    // outright"); Death Ward's 1 HP still does, below. In a story fight the game is over (RULED 10-06, Griz: "This should probably go in both, and force a game-over reload in
    // story fights"). Foes fall at 0 as ever
    var past = hp0 > 0 ? n - hp0 : n;
    if (u.hp <= 0 && u.side === 'party' && !u.object && !u.familiar && !u.summon && !u.ally && !u.conds.deathWard && !u.dead && past >= u.maxhp) {
      var story = this.isStory();
      u.hp = 0; u.dead = true; u.slain = true; u.ko = true; u.deadT = this.t; u.anim = 'hurt'; u.animT = this.t; delete u.conds.ablaze;
      D.sfx('ko'); FX.ring(u, 'red', 30); if (D.light && D.light.fell) D.light.fell(this, u);
      this.card(['{r}' + u.name + ' is killed outright.{/}  {g}(' + past + ' past 0, against ' + u.maxhp + ' hit points: massive damage' + (story ? ' -- the story cannot go on without them' : '') + '){/}'], 400);
      if (D.traits && D.traits.onDown) D.traits.onDown(this, this.active, u);
      if (u.holding && u.holding.length) this.release(u);
      this.rideSync();
      if (u.conc) D.magic.endConc(this, u, 'dead');
      if (story) this.slainLost = u;
      return;
    }
    if (u.hp <= 0 && (u.side === 'party' && !u.guest || u.npc) && u.feats && u.feats.relentless > 0) {
      // Relentless (the 8-bit game's own, js/battle.js: Lymen, once a day): the blow that would drop him leaves him at 1 (review 09-28 #3)
      // (a half-orc class NPC's Relentless Endurance too: js/classes.js)
      u.feats.relentless = 0; u.hp = 1; FX.ring(u, 'gold', 30); D.sfx('buff');
      this.card(['{y}' + u.name + ' refuses to fall!{/}  {g}(Relentless: once a day, at 1 HP){/}']);
      conc(this);
      return;
    }
    // Death Ward (js/grimoire.js): the first fall stops at 1 (Goose's NOT TODAY lends it for a blow and says so itself: js/mpmon.js)
    if (u.hp <= 0 && u.conds.deathWard) { var dw = u.conds.deathWard; delete u.conds.deathWard; u.hp = 1; if (!dw.notToday) { FX.ring(u, 'gold', 30); this.card(['{y}' + (u.side === 'foe' ? Battle.nm(u, true) : u.name) + ' does not fall: the death ward holds.{/}']); } conc(this); return; }
    // Relentless (the giant boar: js/traits.js): a small blow that would drop it leaves it at 1
    if (u.hp <= 0 && D.traits && D.traits.refuse && D.traits.refuse(this, u, n)) { conc(this); return; }
    if (u.hp <= 0) {
      u.anim = 'hurt'; u.animT = this.t;
      if (D.traits && D.traits.onDown) D.traits.onDown(this, this.active, u); // (the gnoll's Rampage)
      D.sfx(u.side === 'party' ? 'ko' : 'die');
      if (u.familiar && D.familiar && D.familiar.vanish) D.familiar.vanish(this, u); // (a familiar at 0 HP is gone, not down: SRD 5.1)
      else if (u.ally) { u.dead = true; u.deadT = this.t; delete u.conds.ablaze; if (u.holding && u.holding.length) this.release(u); this.card(['{r}' + u.name + ' is cut down.{/}']); } // (one of ours the fight lent -- the Hex's men, the garrison: it dies as a foe does, 10-05)
      else if (u.side === 'party' && !u.object) { u.ko = true; delete u.conds.ablaze; D.light.fell(this, u); this.card(['{r}' + u.name + ' goes down.{/}' + (D.light.torchAt(this, u.x, u.y) ? '  {g}The torch burns beside ' + u.name + '.{/}' : '')]); } // (the name, never "him")
      else if (u.object) { u.dead = true; u.deadT = this.t; this.breached = true; D.sfx('crit'); this.card(['{r}' + u.name.charAt(0).toUpperCase() + u.name.slice(1) + ' gives way!{/}  {g}(the Edifice is breached){/}'], 300); }
      // a troll at 0 is down, not dead (SRD 5.1 Regeneration: "The troll dies only if it starts its turn with 0 hit points and doesn't regenerate"; acid or fire stops it -- 10-05,
      // Griz: "i think the regen is there it's just turning off when they die"): it lies there, still a target, and gets up at its turn unless it burned (ai.js AI.turn)
      // (burned since the start of its last turn -- this blow's fire or acid, or an earlier one's: dead at once, RULED 10-06, Griz: "if hp drops to 0 while burning = true,
      // trigger troll death")
      else if (u.regen > 0 && u.burned) { u.dead = true; u.deadT = this.t; this.card(['{y}The ' + shortName(u) + ' falls, burning. It will not knit: it is dead.{/}'], 300); if (u.holding && u.holding.length) this.release(u); }
      else if (u.regen > 0) { u.regenDown = true; u.conds.prone = true; delete u.knit;this.card(['{y}The ' + shortName(u) + ' falls -- and starts to knit.{/}  {g}(fire or acid before its turn, and it is dead){/}'], 300); if (u.holding && u.holding.length) this.release(u); }
      else { u.dead = true; u.deadT = this.t; this.card(['{y}' + (u.named ? '' : 'The ') + shortName(u) + ' falls.{/}']); /* (a named foe -- The Keeper -- has its own article: "The The Keeper falls", 10-02) */ if (u.holding && u.holding.length) this.release(u); }
      // a darkmantle down off the one it rode, or off one who went down, now -- not at the coroutine's next step: the blow that ends the fight leaves no
      // next step, and the one it rode kept "attached" and "blinded" (10-01, the roper window's bench: Barley and Vivian, their darkmantles dead)
      this.rideSync();
      if (D.magic.onKill) D.magic.onKill(this, this.active, u); // (Dark One's Blessing: js/features.js)
      if (u.conc) D.magic.endConc(this, u, 'down');
      // one who runs the moment the one in charge is down (the wheelwright, when Hask falls): gone up the stair at once, before
      // anyone can cut him down -- the 8-bit's foeBolt, certain (review 09-28 #11: the wheelwright quest hangs on his getting away)
      if (u.side === 'foe') { var self = this; this.units.forEach(function (w) { if (w.side === 'foe' && w.bolts && w.bolts === u.kind && !w.dead && w.hp > 0) { w.dead = true; w.fled = true; w.deadT = self.t; if (w.holding && w.holding.length) self.release(w); D.sfx('run'); self.card(['{r}' + w.name + '{/} drops what he was holding and runs for the stair. He is gone.']); } }); }
    } else conc(this);
    if (D.magic.onHurt && u.hp > 0) D.magic.onHurt(this, u, n, type); // (a laughing one's save with advantage, a pattern broken: js/grimoire.js)
    if (u.hp > 0 && u.hang && u.hang.face && G.hanging(u) && !(src && src.fall) && took > 0 && !u.spiderClimb) this.clingSave(u, took); // (a clinging climber hit: the hold, or the fall -- 10-04 night; not one with Spider Climb, whose hold is no check's -- 10-05 night)
  };
  // FLIGHT AT A HEIGHT (the grid's rules §2.17; RULED 10-08, Griz: "Where the mousewheel becomes the vertical selection - yes"; js/grid.js u.fz, G.flyReach): the move to
  // (x, y) at the layer z -- up first, or down last, level between; a rise or a sink 5 ft of movement a 5 ft (SRD 5.1 Flying). On the ground under it again, it is on the surface
  Battle.prototype.flyMove = function* (u, x, y, z) {
    var T = u.turn, e = G.flyReach(u, z, T.move)[x + ',' + y];
    if (!e || !e.stand) return false;
    var cur = G.gzAt(u, u.x, u.y), tr = Math.max(cur, z), v = G.feetUp(z - cur), path = [];
    if (x !== u.x || y !== u.y) { var f0 = u.fz; u.fz = tr; try { path = G.path(G.reach(u, T.move - v), x, y); } finally { u.fz = f0; } if (!path || !path.length) return false; }
    if (z > cur) { T.move -= v; yield* this.flyTo(u, z); } else if (path.length) u.fz = tr;
    if (path.length) yield* this.moveAlong(u, path, { spend: true });
    if (z < cur && !u.dead && u.hp > 0 && G.winged(u) && T.move >= v) { T.move -= v; yield* this.flyTo(u, z); }
    if (u.fz != null && u.fz <= G.groundAt(u, u.x, u.y)) u.fz = null; // (down on the ground there: on the surface again)
    this.cache = null;
    return true;
  };
  // up or down in place to z, a frame at a time (`land`: to the ground under it, and on the surface)
  Battle.prototype.flyTo = function* (u, z, land) {
    var z0 = G.gzAt(u, u.x, u.y), n = Math.max(4, Math.round(Math.abs(z - z0) / 4));
    u.anim = 'walk'; u.animT = this.t;
    for (var i = 1; i <= n; i++) { u.fz = z0 + (z - z0) * i / n; yield 1; }
    u.fz = land || z <= G.groundAt(u, u.x, u.y) ? null : z; u.anim = 'idle'; u.animT = this.t;
  };
  // what brings a flier down (SRD 5.1 Flying Movement: "knocked prone, has its speed reduced to 0, or is otherwise deprived of the ability to move ... unless it has the ability to
  // hover"): down or dead, wingless (a Wild Shape's bat gone back to a druid), prone, held, unable to act, no speed. A floater hovers while it stands (RULED 10-06: it floats)
  Battle.flyWhy = function (u) {
    if (u.fz == null || !G.aloft(u)) return null;
    var c = u.conds || {};
    if (u.dead || u.hp <= 0) return u.dead ? 'dead' : 'down';
    if (u.floats) return null;
    if (!u.flies) return 'no wings';
    if (c.prone) return 'knocked prone';
    if (c.restrained) return 'held';
    if (c.paralyzed || c.stunned || c.asleep || c.incapacitated || c.petrified) return 'it cannot act';
    if (u.speed === 0 || (RU.speedNow && RU.speedNow(u) === 0)) return 'no speed';
    return null;
  };
  Battle.prototype.flyCheck = function () { var self = this; this.units.forEach(function (u) { if (u.fz == null) return; var why = Battle.flyWhy(u); if (why) self.flyFall(u, why); else if (!G.aloft(u) && !u.tween) u.fz = null; }); };
  // the fall (SRD 5.1 Falling: 1d6 bludgeoning a 10 ft, prone), as the cling's: down the tween, onto whoever stands under (the cushion: landOn)
  Battle.prototype.flyFall = function (u, why) {
    var fz = u.fz, ft = Math.round((fz - G.groundAt(u, u.x, u.y)) / G.map.def.step) * 2.5;
    u.fz = null; this.cache = null;
    u.tween = { fx: u.x, fy: u.y, fz: fz, t: 0, dur: this.pace(STEP_FRAMES + 6, true), mode: 'drop' };
    if (u.dead) return;
    this.forced(u);
    var onC = this.under(u), fd = ft >= 10 ? D.roll(Math.floor(ft / 10) + 'd6') : null;
    this.card(['{o}' + nameOf(u) + ' falls ' + ft + ' ft from the air (' + why + ')' + (onC.length ? ' onto ' + onC.map(nameOf).join(' and ') + (fd ? ': ' + fd.total + ' bludgeoning, split,' : ',') + ' and lands prone.' : (fd ? ': ' + fd.total + ' bludgeoning, and lands prone.' : ', and lands prone.')) + '{/}'], 260);
    if (onC.length) { this.landOn(u, ft, fd); return; }
    if (!u.noProne && !RU.immuneTo(u, 'prone')) u.conds.prone = true;
    if (fd) this.hurt(u, fd.total, 'bludgeoning', { fall: true });
  };
  // a clinging climber hit (10-04 night, Griz: "SRD say anything about clinging climbers, cause I think dex saving throws on damage..." -- the SRD 5.1 has nothing for a climber; a flier
  // knocked prone or held still falls, and concentration's save is the shape taken): a Dexterity save, DC 10 or half the damage, whichever is higher, or it loses its hold and falls
  // the height it had climbed (1d6 a 10 ft, prone). Ours, not the SRD's; the fall's own damage asks no second save
  // (`knocked`: the text of a forced fall -- a push -- in place of the save, which it does not get: magic.js M.push, 10-05)
  Battle.prototype.clingSave = function (u, dmg, knocked) {
    var dc = Math.max(10, Math.floor(dmg / 2)), sv = knocked ? null : RU.save(u, 'dex', dc), fz = u.hang.z, ft = Math.round((fz - G.map.gz(u.x, u.y)) / G.map.def.step) * 2.5;
    if (sv && sv.ok) { this.card(['{y}' + nameOf(u) + '{/} keeps its hold on the face: DEX ' + RU.saveText(sv) + ' against DC ' + dc + '  {n}HOLDS{/}'], 200); return; }
    delete u.hang; this.forced(u); u.tween = { fx: u.x, fy: u.y, fz: fz, t: 0, dur: this.pace(STEP_FRAMES + 6, true), mode: 'drop' }; // (a fall is a forced move: readyForced)
    var onC = this.under(u), fd = ft >= 10 ? D.roll(Math.floor(ft / 10) + 'd6') : null; // (onto whoever stood under it: the cushion, the dice split -- 10-05, landOn)
    this.card(['{o}' + nameOf(u) + (knocked || ' loses its hold: DEX ' + RU.saveText(sv) + ' against DC ' + dc) + ' -- falls ' + ft + ' ft' + (onC.length ? ' onto ' + onC.map(nameOf).join(' and ') + (fd ? ': ' + fd.total + ' bludgeoning, split,' : ',') + ' and lands prone.' : (fd ? ': ' + fd.total + ' bludgeoning,' : ',') + ' and lands prone.') + '{/}'], 240);
    if (onC.length) { this.landOn(u, ft, fd); return; }
    u.conds.prone = true;
    if (fd) this.hurt(u, fd.total, 'bludgeoning', { fall: true });
  };
  // one who falls onto a square another stands on (10-05, Griz: "see about being under climbing heroes (and a giant falling on someone)" -- "make a climbing giant fall on the idgit
  // who ran underneath him (which will shove him to the nearest available square)" -- then, the same day: "A fall is a lot more time for players to wail on him, and melee might get
  // under him before he climbs too high... I'm thinking softening his landing is good and is story battle so SRD deviation is less problematic" · "idgit as a cushion"): whoever stood
  // under it is the cushion -- it takes the fall's damage (SRD 5.1 Falling: 1d6 bludgeoning a 10 ft), is knocked flat, and is shoved out from under to the nearest open square along
  // the ground, the faller's far side first; the faller lands prone too, by the SRD's Falling, its fall damage only the dice's other half (the Cowork seat's lean of 10-05, on its feet, OVERRULED the same evening, Griz: "It kicks out the person she falls on to the side and splits damage, but I think the giant should still prone and it is not currently set like that"; the lost climb is its cost). No
  // save for the cushion: it ran under a giant. On stone, the full SRD fall (the callers). One hanging over the square is not under it. Battle.under lists the cushions; landOn does
  // it to them. Called where a fall lands: clingSave, cutRope, moveAlong's drop
  Battle.prototype.under = function (u) {
    var foot = G.foot(u);
    return this.units.filter(function (w) {
      if (w === u || !G.present(w) || w.riding || (w.hang && G.hanging(w)) || G.aloft(w)) return false;
      return G.foot(w).some(function (q) { return foot.some(function (p) { return p[0] === q[0] && p[1] === q[1]; }); });
    });
  };
  // (fd: the fall's dice, rolled once by the caller; split -- the cushion takes the half rounded up, the faller the rest, and the faller lands prone: Griz, 10-05, on the cushion taking it all,
  // "little harsh, split damage?"; then that evening "I think the giant should still prone")
  Battle.prototype.landOn = function (u, ft, fd) {
    var under = this.under(u), half = fd ? Math.ceil(fd.total / 2) : 0, rest = fd ? Math.floor(fd.total / 2) : 0;
    for (var i = 0; i < under.length; i++) {
      var w = under[i], to = Battle.shoveSq(w, u);
      this.card(['{o}' + nameOf(u) + ' comes down on ' + nameOf(w) + (fd ? ': ' + half + ' of the ' + fd.total + ' bludgeoning' : '') + ' -- ' + nameOf(w) + ' is shoved out from under, flat' + (to ? ', to the nearest open square.' : ', with nowhere to go.') + '{/}'], 260); D.sfx('hit');
      if (half) this.hurt(w, half, 'bludgeoning', { fall: true });
      if (!w.noProne && !RU.immuneTo(w, 'prone')) w.conds.prone = true;
      if (to) { w.tween = { fx: w.x, fy: w.y, fz: G.gzAt(w, w.x, w.y), t: 0, dur: this.pace(STEP_FRAMES + 4, true) }; w.x = to[0]; w.y = to[1]; w.anim = 'idle'; this.forced(w); }
    }
    if (under.length && rest > 0) this.hurt(u, rest, 'bludgeoning', { fall: true }); // (the faller's half)
    if (under.length && !u.noProne && !RU.immuneTo(u, 'prone')) u.conds.prone = true; // (and the faller lands prone too, by the SRD's Falling -- Griz, 10-05 evening: "the giant should still prone")
    return under;
  };
  // the nearest open square to w along the ground (a ring at a time), the far side of u first
  Battle.shoveSq = function (w, u) {
    var fs = u.size || 1, cx = u.x + (fs - 1) / 2, cy = u.y + (fs - 1) / 2, z0 = G.gzAt(w, w.x, w.y), st = G.map.def.step, best = null, bd = 1e9;
    for (var r = 1; r <= 6 && !best; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var x = w.x + dx, y = w.y + dy;
      if (!G.canStand(w, x, y) || Math.abs(G.gzAt(w, x, y) - z0) > st) continue; // (not over an edge, not up a face)
      var d = -Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = [x, y]; }
    }
    return best;
  };
  Battle.prototype.heal = function (u, n) {
    var was = u.hp;
    if (u.slain) { this.card(['{g}' + u.name + ' is dead: no healing reaches them.{/}'], 240); return 0; } // (killed outright, massive damage: 10-06)
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
  // thrown weapons run out (the grid's rules §2.16; RULED 10-06, Griz: "pickup is bound to be a headache (art), they'll not use up ammo in 8-bit - gotta do it for pocket DM, do it"):
  // a thrown attack's `count` -- a foe's sheet (the ogre's three javelins, data/foes.js), a class hero's kit (two handaxes, SRD 5.1: js/classes.js) -- is spent a throw and never
  // picked up; with none left it is gone from the choices: off the unit's own sheet (and its `twin`, the melee of the one weapon: the gnoll's one spear), the class hero's alt
  // put away. Spent in this fight only; the 8-bit battle spends none
  Battle.thrownLeft = function (u, atk) {
    if (!atk || atk.count == null || !atk.ranged || atk.spell) return Infinity;
    return Math.max(0, atk.count - ((u.thrown || {})[atk.name] || 0));
  };
  Battle.prototype.thrownLeft = function (u, atk) { return Battle.thrownLeft(u, atk); };
  Battle.prototype.spendThrow = function (u, atk) {
    if (this.thrownLeft(u, atk) === Infinity) return;
    u.thrown = u.thrown || {}; u.thrown[atk.name] = (u.thrown[atk.name] || 0) + 1;
    if (this.thrownLeft(u, atk) > 0) return;
    if (u.alt && u.alt.ranged && u.alt.name === atk.name) u.alt = null;
    if (u.attacks && typeof u.attacks === 'object') { // (its own copy: the sheet's attacks are every one of its kind's)
      var own = Object.assign({}, u.attacks);
      Object.keys(own).forEach(function (k) { var a = own[k]; if (a && a.ranged && a.name === atk.name) delete own[k]; });
      if (atk.twin) delete own[atk.twin];
      u.attacks = own;
    }
  };
  Battle.prototype.gearOptions = function (u) {
    var R = window.DS.R, h = u.src, T = u.turn, B = this, out = [];
    if (!h || u.guest || !T || !h.equip) return out;
    var busy = T.action > 0 && !T.attacksLeft ? '' : 'the action is spent', cur = R.item(h.equip.weapon);
    var curTwo = cur && cur.weapon && (cur.weapon.props || []).indexOf('two-handed') >= 0;
    this.inv.forEach(function (s) {
      var it = window.DS.DATA.items[s.id];
      if (!it || it.kind !== 'weapon' || s.n <= 0 || !R.canEquip(h, it)) return;
      var wd = it.weapon, two = (wd.props || []).indexOf('two-handed') >= 0, why = busy || (two && h.equip.shield ? 'two hands: the shield comes off first' : ''); // (with a torch it is carried in one hand, and the torch falls when it swings: battle.js attack, 10-05)
      var ammo = wd.ammo ? ', ' + (packOf(B, wd.ammo) ? packOf(B, wd.ammo).n : 0) + ' ' + B.itemName(wd.ammo).toLowerCase() : '';
      out.push({ kind: 'weapon', id: s.id, label: it.name, note: wd.dmg + ' ' + wd.type + (wd.range ? ', ' + wd.range.join('/') + ' ft' : ', melee') + ammo, ok: !why, why: why });
    });
    // armour: never in a fight (SRD 5.1, Getting Into and Out of Armor: a minute or more to don or doff, a shield an action -- RULED 10-07, Griz: "SRD everywhere",
    // "I suspect my ladder exception was prior to the camp or an oversight"; the ladder's ARMOUR OFF and WEAR of 09-27 cut, and with them the ?fight= doors' that
    // rode on its mark). The camp's EQUIP changes it before a rung, free
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
    delete u.sheathed; u.weapon = D.save.weaponOf(h); u.attacks = u.weapon.loading ? 1 : u.attacksBase; // (a swap takes the new one up in hand: no weapon put away after it -- 10-05)
    // Mage Armor ends when its wearer puts on armour (robes aren't armour to it)
    if (R.armored(h) && (u.conds.mageArmor || (h.conds && h.conds.mageArmor))) { delete u.conds.mageArmor; if (h.conds) delete h.conds.mageArmor; }
    var ac = R.ac(h); if (u.conds.mageArmor && !R.armored(h)) ac = Math.max(ac, 13 + D.mod(u.abil.dex)); // Mage Armor cast in this fight
    u.baseAC = ac; u.armored = R.armored(h);
    var did = { weapon: 'stows one weapon and takes up the ' + u.weapon.name, shieldoff: 'slings the shield', shieldon: 'takes up the shield' }[o.kind];
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
        this.card(['{o}' + (w.side === 'foe' ? Battle.nm(w, true) : w.name) + '{/}: an opportunity attack on ' + u.name + ', leaving.']);
        yield* this.attack(w, u, atk, { oa: true });
        if (u.hp <= 0) return;
      }
    }
    T.move = 0; u.left = true; u.dead = true; u.deadT = this.t; delete u.conds.ablaze;
    if (u.conc) D.magic.endConc(this, u, 'out of the fight');
    D.sfx('run');
    if (!this.fight.noCards) this.card(['{y}' + u.name + '{/} gets out the way the party came in' + (this.fight.oneLeavesAll ? ', and the party goes too' : '') + '.  {g}(out of the fight){/}']); // (the wet asked already: no card -- 09-30e)
    yield 30;
  };

  // ------------------------------------------------------------------ items: the save's own (a potion, a kit, an antitoxin, an oil flask)
  // fortify (09-28g): Marta's bat-wing pie, eaten in a fight -- +2 CON (+1 to CON saves) and +5 HP till it ends (the 8-bit battle's)
  var ITEM_OK = { heal: 1, revive: 1, antitoxin: 1, cure: 1, damage: 1, light: 1, fortify: 1, bucket: 1 }; // (bucket: the landlord's, js/wet.js)
  // a torch is lit as a bonus action by the Thief (Fast Hands), or by anyone if the seat's default is flipped (js/light.js LIGHT_COST)
  function torchFast(u) { return u.subclass === 'Thief' || D.light.LIGHT_COST === 'B'; }
  Battle.prototype.itemList = function (u) {
    var T = u.turn, roost = this.fight && this.fight.roost, self = this;
    // a story guest's one flask is its own (u.ownFlask, set where the guest is made -- save.js SV.units; 10-05, Griz: "must NOT spend the player's oil", "once ... not reduce party inventory"):
    // the pack's oil is not on its list, its own flask is
    var stacks = u.ownFlask != null ? (this.inv || []).filter(function (s) { return s.id !== 'oil'; }).concat([{ id: 'oil', n: u.ownFlask }]) : (this.inv || []);
    return stacks.map(function (s) {
      var it = window.DS.DATA.items[s.id];
      // the Rope & Grapple (the 8-bit game's rope; 10-04, Griz: "as an item on the item wheel"): set on a face, an action -- exec 'rope', the tool picks the face's top (ui.js)
      if (s.id === 'rope' && s.n > 0) { var cl0 = !!(G.map.def.climb && (u.size || 1) === 1); return { id: 'rope', name: (it && it.name) || 'Rope & Grapple', n: s.n, use: { effect: 'rope' }, ok: cl0 && T.action > 0 && !T.attacksLeft && !u.guest, why: !cl0 ? 'no face here to climb' : T.action > 0 ? '' : 'the action is spent' }; }
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
    if (use.effect === 'damage') return G.hostile(u, w) && (w.hp > 0 || !!w.regenDown) && G.dist(u, w) <= 20 && G.los(u, w).clear; // (a troll lying at 0 and knitting is a target for the flask: the oil runner's find, 10-05)
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
    if (D.rand() >= (window.DS.doorWardChance != null ? window.DS.doorWardChance : 0.03)) return;
    this.doorWardOn = t; D.sfx('buff'); FX.ring(t, 'glow', 60);
    this.units.forEach(function (w) { if (w.side === 'party' && w.hp > 0 && !w.dead) FX.sparkle(w, 'silver', 14); });
    this.card(['{c}The ' + sh.name + ' protects the party.{/}  {g}(+3 AC to all, till ' + t.name + '\'s next turn){/}'], 320);
  };
  Battle.prototype.useItem = function* (u, id, w) {
    if (id === 'rope') return; // (the Rope & Grapple is set with exec 'rope', on a face's top -- never as a target's item; a READY on it springs nothing)
    var it = window.DS.DATA.items[id], use = it.use, s = this.inv.filter(function (x) { return x.id === id; })[0];
    if (((use.effect === 'light' && torchFast(u)) || u.subclass === 'Thief') && u.turn.bonus > 0) u.turn.bonus = 0; else u.turn.action = 0; // Fast Hands
    if (use.effect === 'light') { yield* D.light.lightTorch(this, u, id); yield 20; return; } // (lightTorch takes it from the pack)
    if (id === 'oil' && u.ownFlask != null) u.ownFlask = Math.max(0, u.ownFlask - 1); else s.n--; // (a story guest throws its own flask, never the pack's: itemList)
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
    this.turnTo(u, faceTo(u, { x: cx, y: cy, size: 1 }));
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
  Battle.prototype.mistyTargets = function (u, range, see) { // (see: Misty Step's "an unoccupied space that you can see" -- data/spells.js `see`, 10-02)
    var out = [], n = Math.floor((range || 30) / 5);
    for (var y = u.y - n; y <= u.y + n; y++) for (var x = u.x - n; x <= u.x + n; x++) {
      if (x === u.x && y === u.y) continue;
      if (!G.canStand(u, x, y) || !G.losPoint(u.x, u.y, x, y)) continue;
      if (see && D.magic.seesSq && !D.magic.seesSq(this, u, x, y)) continue;
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
  Battle.prototype.seenBy = function (w, u, hide) {
    var s = D.magic.seeWhy(this, w, u), l = G.los(w, u, undefined, undefined, hide); if (!s.ok || !l.clear || l.cover) return 0;
    if (!this.dark || (w.blindsight && G.dist(w, u) <= w.blindsight && !(w.tremor && G.aloft(u))) || (w.truesight && G.dist(w, u) <= w.truesight)) return 2;
    return s.dv || (D.light && D.light.levelOf(this, u) < 2) ? 1 : 2;
  };
  // ---- the neighbourhood (10-04, Griz: "the stealth roll hides outside of 15 feet of each opponent, that 15' divided into front and back (squares 1-3 front,
  // 4 & 6 the sides, 7-9 the back) ... a hidden entering squares 1-3 would get a perception check +5 that had to beat the stealth roll, and 4 & 6 would be +3 (bright
  // light); dim +3 front, +1 sides; dark none except night vision, familiar vision; eyes in the back treat all squares as front; the facing is the one the sprite shows)
  var FACE_STEP = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]]; // (sprites.js STEP, inverted)
  var NEAR_BONUS = { front: [0, 7, 9], side: [0, 5, 7], back: [0, 1, 3] }; // (by Battle.seenBy: 0 unseen/dark, 1 dim or darkvision, 2 clear; Griz 10-04: cone +9, sides +7, rear three +3 in the bright; dim 2 down is the seat's)
  // w's watch over u: the 3x3 round it (front 1-3, the sides 4 and 6, the back 7-9) and, ahead of it, the cone widening a square a side each row (3, 5, 7 ... -- Griz 10-04:
  // "keep coning it out to their vision distance"), every front square at the front's bonus by the light; null if u is in neither, else { side, bonus, lvl }.
  // The reach is Battle.seenBy's -- a clear line, no cover, in light or by the seer's sense -- so the dark and the cover end the cone, not a number of squares
  Battle.prototype.nearOf = function (w, u) {
    var ring = G.foot(w).some(function (q) { return Math.max(Math.abs(q[0] - u.x), Math.abs(q[1] - u.y)) <= 1; });
    var c = ((w.size || 1) - 1) / 2, vx = u.x - (w.x + c), vy = u.y - (w.y + c), f = FACE_STEP[((w.facing || 0) % 8 + 8) % 8], fl = Math.hypot(f[0], f[1]), vl = Math.hypot(vx, vy) || 1;
    var fwd = (vx * f[0] + vy * f[1]) / fl, lat = Math.abs(vx * f[1] - vy * f[0]) / fl, cone = fwd > 0 && lat <= fwd + 1e-6, all = !!(w.twoHeads || w.allAround || (w.blindsight && G.dist(w, u) <= w.blindsight && !(w.tremor && G.aloft(u))));
    // (blindsight has no front: within its range every square is the front, as the ettin's two heads -- echolocation, a tremor in the stone. 10-06, Griz: "blindsight like the
    // ettin or blindsight like the echolocation, dealer's choice" -- the seat's pick, the echolocation's: all round, but only as far as the sense reaches; past it, its eyes if any)
    if (!ring && !cone && !all) return null;
    var side = all || cone ? 'front' : fwd / vl < -0.5 ? 'back' : 'side', lvl = this.seenBy(w, u, true);
    var base = NEAR_BONUS[side][lvl], wis = w.abil && w.abil.wis != null ? Math.floor((w.abil.wis - 10) / 2) : 0; // (Griz, 10-04: "try add wisdom bonuses to the cone", then "wisdom on the 9-square they're in (back and sides included)" -- the watcher's Wisdom modifier on top, in its cone and its 3x3)
    return { side: side, bonus: base && (ring || cone) ? base + Math.max(0, wis) : base, lvl: lvl };
  };
  // what u's Stealth check has to its side or against it (the one place it is read -- the roll below and the class AI's Hide estimate, tactics.js rogueCoverTurn, ask it): Supreme Sneak's
  // advantage only on her own turn, if she has walked no more than half her speed (`moved`: what she would have walked by then; the turn's own if none is given), RU.checkEdges, and what is worn
  // (SRD 5.1, the Boots of Elvenkind: "advantage on Dexterity (Stealth) checks that rely on moving silently" -- the grid's hide and held roll are the one Stealth, so all of it; js/rules.js
  // R.gear, only what works): its name on the card with the other edges. A foe has no sheet (u.src) and wears nothing
  Battle.prototype.stealthEdges = function (u, moved) {
    var T = u.turn || {}, supreme = u.subclass === 'Thief' && u.lvl >= 9 && (this.active === u || !this.active) && (moved == null ? (T.moved || 0) : moved) <= u.speed / 2, ce = RU.checkEdges(u, 'dex');
    var shod = u.src && DS.R.gear ? DS.R.gear(u.src).filter(function (g) { return (g.adv || []).indexOf('Stealth') >= 0; }).map(function (g) { return g.name.toLowerCase(); }) : [];
    if (shod.length) ce = { adv: ce.adv.concat(shod), dis: ce.dis };
    return { supreme: supreme, ce: ce, hadv: supreme || ce.adv.length > 0, hdis: ce.dis.length > 0 };
  };
  // a Stealth roll for u now: the d20 and the total
  Battle.prototype.stealthRoll = function (u) {
    var se = this.stealthEdges(u), supreme = se.supreme, ce = se.ce, hadv = se.hadv, hdis = se.hdis, ra = D.d(20);
    var r = hadv !== hdis ? (hadv ? Math.max(ra, D.d(20)) : Math.min(ra, D.d(20))) : ra;
    return { r: r, total: r + u.stealth + (u.conds.pwt ? 10 : 0), supreme: supreme, ce: ce, hadv: hadv, hdis: hdis };
  };
  // w finds u (hidden by B.hide): its passive Perception plus the bonus of where u stands beats the Stealth total u rolled when it hid (held -- Griz 10-04, "the existing
  // roll, not a fresh one at each step"; an active Search is the foe's own roll, Battle.search); the line for the card, or null
  Battle.prototype.spots = function (w, u) {
    var n = this.nearOf(w, u); if (!n || !n.bonus) return null;
    var pp = w.perception + (w.twoHeads ? 5 : 0) + n.bonus; if (pp <= u.hidTotal) return null;
    return 'Stealth ' + u.hidTotal + ' against ' + shortName(w) + "'s passive Perception " + w.perception + (w.twoHeads ? ' +5 (two heads)' : '') + ' +' + n.bonus + ' (' + n.side + (n.lvl === 1 ? ', dim' : '') + ') = ' + pp;
  };
  // the Search action (SRD 5.1: an action; "you devote your attention to finding something" -- a Wisdom (Perception) check, which is what contests a hider's Stealth, "any creature
  // that actively searches"): d20 + Perception against each hidden enemy it has a clear, lit look at, from where it stands and all round it (no facing: it looks about);
  // the bonus of its own watch (the 3x3, the cone) counts where the hider is in it. The hider rolls Stealth again against it (Griz, 10-04: an active search calls a re-roll; a pass through a watch is the held total against passive + bonus).
  Battle.prototype.search = function* (u) {
    var T = u.turn, self = this, any = false, f0 = u.facing || 0;
    T.action = 0; D.sfx('run');
    // the look about: the figure turns a step and two to one side, back past where it faced to the other, and home (the facing is set directly: a turn is not a look of its own here)
    var sweep = [1, 2, 1, 0, -1, -2, -1, 0];
    for (var si = 0; si < sweep.length; si++) { u.facing = ((f0 + sweep[si]) % 8 + 8) % 8; yield 9; }
    this.units.forEach(function (w) {
      // (in sight, cover or none: a hider behind a stalagmite is what a search is for -- seenBy asks for no cover, the watch's reach, and the search had asked it too. 10-08, the fix
      // session's probe on the AI lane's duel: Vivian, 25 ft off in the bright with a clear line, never rolled against Rascal hidden in a stalagmite's half cover, his or the AI's)
      var sw = D.magic.seeWhy(self, u, w), lw = G.los(u, w, undefined, undefined, true);
      if (!w.conds.hidden || !G.hostile(u, w) || !G.standing(w) || !sw.ok || !lw.clear) return;
      // (u.keenSenses: keen hearing and smell, GreyFang's, 10-08 -- advantage on the roll)
      var n = self.nearOf(u, w), bonus = n && n.bonus ? n.bonus : 0, held = self.stealthRoll(w).total, r = u.keenSenses ? Math.max(D.d(20), D.d(20)) : D.d(20), tot = r + (u.perception - 10) + bonus, got = tot > held;
      any = true;
      self.card(['{y}' + nameOf(u) + '{/} searches: Perception d20 ' + r + ' ' + RU.sign(u.perception - 10) + (bonus ? ' +' + bonus + ' (' + n.side + ')' : '') + ' = ' + tot + ' against ' + nameOf(w) + "'s Stealth " + held + '  ' + (got ? '{o}FOUND{/}' : '{n}nothing{/}')], 200);
      if (got) { delete w.conds.hidden; delete w.hidTotal; }
    });
    if (!any && u.side === 'party') this.card(['{g}' + nameOf(u) + ' searches: no one hidden in sight.{/}']);
    yield 30;
  };
  // u, hidden, is looked at where it stands (a hide with no held total -- a foe lying in wait -- keeps the plain rule: any foe that sees it clearly)
  Battle.prototype.lostCover = function (u) {
    if (!u.conds.hidden) return false;
    var self = this, why = null, rr = {};
    this.units.forEach(function (w) {
      if (why || !G.hostile(u, w) || !G.standing(w) || !RU.canAct(w)) return;
      if (u.hidTotal != null) { var t = self.spots(w, u, rr); if (t) why = t; } else if (self.seenBy(w, u) === 2) why = 'in plain sight';
    });
    if (!why) return false;
    delete u.conds.hidden; delete u.hidTotal; this.card(['{o}' + nameOf(u) + ' is found: no longer hidden.{/}  {g}(' + why + '){/}'], 200); return true;
  };
  // o looks at the hidden among its enemies: each in o's watch that o spots, and (no held total) each o sees clearly, is found
  Battle.prototype.findsHidden = function (o) {
    var self = this;
    this.units.forEach(function (w) {
      if (!w.conds.hidden || !G.hostile(o, w) || !G.standing(w)) return;
      var why = w.hidTotal != null ? self.spots(o, w, {}) : self.seenBy(o, w) === 2 ? 'plainly' : null; if (!why) return;
      delete w.conds.hidden; delete w.hidTotal; self.card(['{o}' + nameOf(o) + ' finds ' + nameOf(w) + '.{/}  {g}(' + why + '){/}'], 200);
    });
  };
  // (`bonus`: the Hide is this one's bonus action by a trait of its own -- the goblin's Nimble Escape, js/traits.js after: SRD 5.1, "the Disengage or Hide action as a bonus action
  // on each of its turns" -- and never reads its level for it. T.hid: one Hide to a turn, whichever action paid it -- 10-07, Griz: "4 yes")
  Battle.prototype.hide = function* (u, bonus) {
    var T = u.turn;
    if (T.bonus > 0 && (bonus || u.nimble || u.cunning || (u.cls === 'rogue' && u.lvl >= 2))) T.bonus = 0; else T.action = 0; // a rogue's Cunning Action from level 2 (or a stat block's: the Spy; the goblin's Nimble Escape); the Hide action before -- and for anyone else, whatever its level (every bestiary foe is made at 5, makeFoe0: its level is no Cunning Action -- 10-07, Griz: "4 please fix")
    T.hid = true;
    D.sfx('run');
    var foes = this.units.filter(function (w) { return G.hostile(u, w) && G.standing(w) && RU.canAct(w); }), self = this; // (whoever is against her: a rogue NPC hides from the four)
    var mirror = foes.filter(function (w) { return w.mirrorEye && G.los(w, u).clear && D.magic.inMirror(self, w, u); }); // (the Mirror's eye: no hiding before it, in light)
    // Supreme Sneak (the Thief's 9; SRD 5.1): advantage on the Stealth check if it moved no more than half its speed this turn -- what she has walked BEFORE the
    // roll (hide first and the whole move is hers after) -- and Enhance Ability on DEX, Heat Metal's burning armour against every check: rules.js checkEdges
    var q = this.stealthRoll(u), r = q.r, supreme = q.supreme, ce = q.ce, hadv = q.hadv, hdis = q.hdis;
    RU.spendHelp(u); // (a friend's Help, spent on the Stealth check -- 10-01c)
    var total = q.total;
    if (mirror.length) {
      this.card(['{y}' + u.name + '{/} tries to hide, but the mirror on ' + mirror.map(shortName).join(' and ') + ' has her: {p}nothing hides in front of the Mirror\'s eye{/}.', '{g}Get behind her, or out of its light.{/}']);
    } else {
      // the roll hides her outside every foe's watch (its 3x3 and the cone before it); inside, the foe's passive Perception plus its bonus must not beat it -- and each
      // square she moves into after, a fresh roll (Battle.spots)
      var worst = function () { return foes.map(function (w) { var n = self.nearOf(w, u); return n && n.bonus ? w.perception + (w.twoHeads ? 5 : 0) + n.bonus : 0; }).concat([0]).reduce(function (a, b) { return Math.max(a, b); }); };
      // Guidance (SRD 5.1: a d4 to one ability check, "before or after making the ability check"): spent after the roll, on a check the d4 could turn
      var gd = u.conds.guidance && !u.conds.faerie && total < worst() && total + 4 >= worst() && D.magic.spendGuidance ? D.magic.spendGuidance(this, u) : 0;
      total += gd; u.hidTotal = total;
      var rr = { t: total, r: r }, why = '';
      foes.forEach(function (w) { if (!why) why = self.spots(w, u, rr) || ''; });
      var ok = !why && !u.conds.faerie; // (faerie: outlined in violet light, nowhere to hide)
      this.card(['{y}' + u.name + '{/} hides: Stealth d20 ' + r + (supreme ? ' {n}(supreme sneak: advantage){/}' : '') + (!supreme && hadv !== hdis ? (hadv ? ' {n}(advantage: ' + ce.adv.join(', ') + '){/}' : ' {o}(disadvantage: ' + ce.dis.join(', ') + '){/}') : '') + ' ' + RU.sign(u.stealth) + (gd ? ' {c}+' + gd + ' guidance{/}' : '') + ' = ' + total + (ok ? '  {n}HIDDEN{/}' : '  {o}SEEN{/}'), ok ? '{g}Out of every foe\'s watch, or not seen in it; ' + u.name + '\'s next attack has advantage' + (u.cls === 'rogue' || u.sneak ? ' (and Sneak Attack)' : '') + '.{/}' : why ? '{g}' + why + '.{/}' : '']);
      if (ok) u.conds.hidden = true; else delete u.hidTotal;
    }
    // a sheet's own hide row (the goblin's crouch behind its shield, 10-07): played at the Hide, held while it stays hidden (js/ui.js) -- the row is the try, so a Hide that fails stands up again
    if (D.spr.anim(u.sheet, 'hide')) { u.anim = 'hide'; u.animT = this.t; }
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
  Battle.prototype.draw = function (ctx) {
    if (this.baking) return this.bakingFrame(ctx);
    if (!this.floorable()) return this.paint(ctx);
    try { this.paint(ctx); this.badFrames = 0; }
    catch (e) { // (the floor, above: whatever the broken piece left set is put back, so the next frame paints true)
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      this.badFrames = (this.badFrames || 0) + 1;
      if (this.badFrames === 1 && window.console) console.error('DEEP16: a frame failed to paint (the fight plays on)', e);
      if (this.badFrames >= Battle.DRAW_BAD) this.paintBroke = e;
    }
  };
  Battle.prototype.paint = function (ctx) { if (D.spr.held(this, true)) D.spr.beat(ctx, this); else D.ui.drawBattle(ctx, this); };
  Battle.prototype.onRequest = function (req) { D.ui.onRequest(this, req); };
})();
