/* DEEP16 -- THE SECOND GAME's house (10-21, the lanes desk as the house seat; ..\handoff-2026-10-21-the-second-games-house.md). RULED 10-21, Griz, on the desk's
   eight leans: "2 sounds problematic - the rest sound good"; "we may have to make silverton before we finish the world map, but if we're calling from the pocket
   DM it'd overwrite the game ones". So: one save of its own in three slots (deep16.game.1..3), and nothing of the Pocket DM's read or written -- the four's sheets
   as the first game keeps them (the shape the grid takes a party in: a Battle's o.data, js/save.js SV.units), their pack, purse, flags and kill tally, THE
   WORLD's clock and hex, and where they stand. The title at deep16/ with no query: NEW GAME (the first game's lead pick, the lead alone at Silverton's west gate and the rest hired in town: js/company.js),
   CONTINUE, OPTIONS, the Pocket DM, the first game. A road fight takes the party and gives it back, wounds and all (H.afterFight); XP banks, and a level comes at
   the long rest (H.longRest: camp on THE WORLD, js/world.js W.camp). SAVE on THE WORLD (M: the party's menu) and in a town (the floor's M menu), never on a
   dungeon floor. Held till their floor is the second game's: the cradles, the drained stair's scenes. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, I = D.input, H = D.house = {};
  H.SLOTS = 3; H.V = 1; H.HEROES = ['barley', 'aurdin', 'vivian', 'lymen'];
  H.key = function (n) { return 'deep16.game.' + n; };
  H.cur = null; H.slot = 0; H.playing = false;
  H.read = function (n) { var d = D.store.get(H.key(n)); return d && d.v && Array.isArray(d.party) && d.party.length ? d : null; };
  function add(inv, id, n) { var s = inv.filter(function (x) { return x.id === id; })[0]; if (s) s.n += n; else if (n > 0) inv.push({ id: id, n: n }); for (var i = inv.length - 1; i >= 0; i--) if (inv[i].n <= 0) inv.splice(i, 1); }
  H.add = add;
  // THE TRAIL (10-28, the lanes desk; Griz: "build the notes button in"): the last H.TRAIL things that happened -- a fight and how it ended, a town gone into, a talk,
  // a rest, a save -- kept in the save (rec.trail) so his NOTES come with what led to them. RULED 10-28, Griz: "when we're prepping to port it into downloadable form
  // we change what we're keeping in the debug saves" -- so what the debug keeps is decided here (H.TRAIL) and in H.notesFile, one place each
  H.TRAIL = 40;
  H.clock = function (rec) { var W = D.world, S = W && W.state ? W.state() : null; return S && S.t != null ? S.t : (rec && rec.world && rec.world.t != null ? rec.world.t : null); }; // (THE WORLD's hours, live)
  H.trail = function (k, s) {
    var rec = H.cur; if (!rec || !H.TRAIL) return;
    (rec.trail = rec.trail || []).push({ k: k, s: String(s || ''), t: H.clock(rec), at: new Date().toISOString() });
    if (rec.trail.length > H.TRAIL) rec.trail.splice(0, rec.trail.length - H.TRAIL);
  };

  // NEW GAME: the heroes as the first game starts them (content/heroes.json: each at its own level and kit), the first game's purse and pack (content/config.json).
  // The save keeps what the first game's does (js/scenes.js's save: RULED 10-21, Griz: "not sure why the second game isn't tracking everything the first one was"):
  // its renown, its lead (the one who leads) and who is hired; THE WORLD's clock and hex stand for its time and map. H.fresh(lead): the first game's start, the
  // lead alone and the other three to be found in Silverton and hired (js/company.js, 10-28, Griz: "we need to add the select character part to 'new game' and
  // restore the 8 bit missions to form the party") -- the title's NEW GAME; H.fresh() with no lead: the four together, as every show's and door's NEW GAME stages them
  H.fresh = function (lead) {
    var R = DS.R, C = DS.DATA.config || {}, ids = lead && H.HEROES.indexOf(lead) >= 0 ? [lead] : H.HEROES.slice();
    return { v: H.V, lead: ids[0], hired: ids.slice(), party: ids.map(function (id) { return H.start(R.makeHero(id)); }), guests: [], inv: (C.startItems || []).map(function (s) { return { id: s[0], n: s[1] }; }),
      silver: C.startSilver || 10, renown: 0, steps: 0, flags: {}, kills: {}, world: null, at: { town: 'silverton', gate: 'west', sq: null, dir: null }, made: Date.now(), saved: 0 };
  };
  // a hero as the second game starts them: the first game's (content/heroes.json, untouched -- the first game keeps it) less what the second game makes a page found in
  // the world -- Aurdin's Find Familiar, Ned's page (RULED 10-21 night, the house lane's "Ned and Find Familiar" item 11; his 10-06: "Aurdin has it for familiar testing
  // at present, gonna be a story page he gets from Ned"). A save made before keeps what its Aurdin has
  H.PAGES = { aurdin: ['findfamiliar'] };
  H.start = function (h) {
    var out = H.PAGES[h.id] || [];
    if (out.length) { h.known = (h.known || []).filter(function (s) { return out.indexOf(s) < 0; }); if (Array.isArray(h.prepared)) h.prepared = h.prepared.filter(function (s) { return out.indexOf(s) < 0; }); }
    return h;
  };
  // a save made before the house kept them: the renown none yet, the lead its first hero, hired the four it holds, no steps counted
  // (steps: every square walked on a floor, banked as the floor hands back -- H.fromFloor. RULED 10-21, Griz: "I don't see any harm in counting steps, and we might use it to
  // measure and pass time on some roam maps later and it'll be good to already have it")
  H.fill = function (rec) {
    var ids = (rec.party || []).map(function (h) { return h.key || h.id; });
    if (rec.renown == null) rec.renown = 0;
    if (rec.steps == null) rec.steps = 0;
    if (!rec.lead) rec.lead = ids[0] || H.HEROES[0];
    if (!Array.isArray(rec.hired)) rec.hired = ids.slice();
    return rec;
  };
  // a game begun or loaded: THE WORLD under it (its clock and hex the save's), and the town on top if that is where they stood
  H.begin = function (rec, slot, q) { // (q: the door's own words for THE WORLD -- &at=, &tiles, &noenc, &tops: H.worldDoor)
    H.cur = H.fill(rec); H.slot = slot || 0; H.playing = true;
    DS.G = { flags: rec.flags }; // (the rules read the save's flags: js/rules.js R.cap)
    D.scenes.length = 0;
    D.push(D.world.make('?house' + (q ? '&' + String(q).replace(/^\?/, '') : '')));
    if (rec.at && rec.at.town) H.toTown(rec.at.town, rec.at.gate || 'west', rec.at.sq, rec.at.dir);
  };
  // THE WORLD's door (10-22, his "M - menu isn't available", played on deep16/?world -- a door with no party, so no menu, its walk camping on its own): deep16/?world is
  // a NEW GAME's four standing on THE WORLD at Silverton's hex, not saved till SAVE -- M, CAMP, the day's march and the night as the game has them; &bare is the old door
  H.worldDoor = function (q) { var rec = H.fresh(); rec.at = { town: null }; H.begin(rec, 0, q); };
  H.siteOf = function (id) { var M = D.world.M(); return M ? M.sites.filter(function (s) { return s.id === id; })[0] || null : null; };
  // into a town by a gate (or onto the square it was saved on): the floor takes the save's party, pack and flags as the 8-bit's party walked in (js/roam.js R.make's emb)
  H.toTown = function (id, gate, sq, dir) {
    var W = D.world, dr = W.DOORS[id]; if (!dr) return;
    H.trail('town', id + (gate ? ' by the ' + gate + ' gate' : ''));
    W.inDoor = { site: H.siteOf(id), gate: gate };
    H.cur.at = { town: id, gate: gate, sq: null, dir: null };
    D.push(D.roam.make('?roam=' + dr.roam + '&gate=' + gate, { save: H.living(H.cur), opts: sq ? { at8: sq.slice(), dir: dir || null } : {}, house: true }));
  };
  // the floor's party back into the save (js/roam.js R.handMsg: each sheet with its hurt, slots, uses and what lasts; the pack as the floor holds it, a lantern in hand
  // counted back; the flags, the kills, the purse)
  H.fromFloor = function (B) {
    if (!H.playing || !B || !B.roam || !D.roam.handMsg) return;
    var m = D.roam.handMsg(B, 'house', null, null), byId = {};
    m.party.forEach(function (p) { byId[p.id] = p.sheet; });
    H.cur.party = H.cur.party.map(function (h) { return byId[h.key || h.id] || h; });
    if (m.order && m.order.length) H.cur.party.sort(function (a, b) { return m.order.indexOf(a.key || a.id) - m.order.indexOf(b.key || b.id); });
    H.cur.inv = Object.keys(m.inv1 || {}).filter(function (id) { return m.inv1[id] > 0; }).map(function (id) { return { id: id, n: m.inv1[id] }; });
    H.cur.flags = m.flags || H.cur.flags; H.cur.kills = m.kills || H.cur.kills; if (m.silver != null) H.cur.silver = m.silver;
    var R0 = B.roam, nS = (R0.steps || 0) - (R0.banked || 0); if (nS > 0) { H.cur.steps = (H.cur.steps || 0) + nS; R0.banked = R0.steps; } // (the floor's squares walked since it last handed back: a SAVE in town and the way out both bank, never twice)
    DS.G = { flags: H.cur.flags };
  };
  // a fight's party back into the save: each hero's sheet as the fight left it (its hurt, slots, uses; what lasts -- js/roam.js R.LASTING), the pack as the fight left it
  H.takeBack = function (B) {
    var byId = {}, last = D.roam && D.roam.lasting ? D.roam.lasting : function () { return {}; };
    B.units.filter(function (u) { return u.side === 'party' && u.src && !u.summon && !u.familiar && !u.object; }).forEach(function (u) {
      var h = JSON.parse(JSON.stringify(u.src));
      h.hp = Math.max(0, Math.min(h.maxhp, u.hp)); h.ko = h.hp <= 0; h.slots = (u.slots || []).slice(); h.feats = JSON.parse(JSON.stringify(u.feats || {}));
      h.conds = Object.assign({}, h.conds || {}, last(u.conds)); if (!(u.conds && u.conds.mageArmor)) delete h.conds.mageArmor; if (!(u.conds && u.conds.light)) delete h.conds.light; // (a Light that ended in the fight -- cast again on another -- off the sheet too: 10-28)
      var ue = (u.conds && u.conds.exhaustion && u.conds.exhaustion.n) || 0; if (ue > exh(h)) H.exhaust(h, ue - exh(h)); // (a level the fight laid on, kept on the sheet: js/rules.js RU.exhaust)
      byId[h.key || h.id] = h;
    });
    H.cur.party = H.cur.party.map(function (h) { return byId[h.key || h.id] || h; });
    var inv = JSON.parse(JSON.stringify(B.inv || [])).map(function (s) { return Array.isArray(s) ? { id: s[0], n: s[1] } : s; });
    (B.lights || []).forEach(function (l) { if (l.kind === 'lantern' && l.item && byId[l.by]) add(inv, l.item, 1); }); // (a lantern in a hand: the pack's still)
    H.cur.inv = inv.filter(function (s) { return s.n > 0; });
  };
  // the XP of the fallen, banked by those standing -- no level till the long rest (RULED 10-21, lean 3: "the rest sound good"); at the cap nothing banks (js/rules.js
  // R.gainXP's rule). Returns { each, line }
  H.bank = function (xp, standing) {
    var R = DS.R, cap = R.XP_LEVEL[R.cap()], each = standing.length ? Math.floor(xp / standing.length) : 0;
    standing.forEach(function (h) { h.xp = Math.min(cap, (h.xp || 0) + each); });
    return { each: each, line: each ? 'Each one standing gains ' + each + ' XP' + (standing.some(function (h) { return R.XP_LEVEL[h.lvl + 1] != null && h.xp >= R.XP_LEVEL[h.lvl + 1] && h.lvl < R.cap(); }) ? ' -- a level at the next long rest.' : '.') : '' };
  };
  H.xpOf = function (kind) {
    var id8 = D.id8 ? D.id8(kind) : kind, m = DS.DATA.monsters[id8], f = D.FOES && D.FOES[kind], cx = DS.R.CR_XP || {};
    return { m: m || null, xp: (m && m.xp) || (f && f.cr != null && cx[String(f.cr)]) || 0 };
  };
  // after a road fight (js/world.js World.fight): the party back, the fallen's XP banked, the spoils into the pack and the purse. A loss is the first game's game over:
  // the title, and the last save stands. Returns the lines to say, or null for a loss
  H.afterFight = function (B, res) {
    H.trail('fight', (res || 'ended') + ' in ' + (B.round || '?') + ' rounds: ' + B.units.filter(function (u) { return u.side === 'foe' && !u.summon; }).map(function (u) { return u.name || u.kind; }).join(', '));
    H.takeBack(B);
    if (res !== 'won' && res !== 'escaped' && res != null) { H.lost(); return null; }
    if (res !== 'won') return [];
    var R = DS.R, xp = 0, fell = [];
    B.units.forEach(function (u) { if (u.side !== 'foe' || u.summon || u.fled || u.left || !(u.dead || u.hp <= 0)) return; var x = H.xpOf(u.kind); xp += x.xp; if (x.m) { fell.push({ m: x.m, surrendered: !!(u.surrendered || u.yielded) }); R.tally(H.cur.kills, [D.id8 ? D.id8(u.kind) : u.kind]); } });
    var standing = H.cur.party.filter(function (h) { return h.hp > 0; }), lines = [], bk = H.bank(xp, standing);
    if (bk.line) lines.push(bk.line);
    if (fell.length) { var sp = R.spoils(fell, standing, { roll: function (e) { return D.roll(e).total; }, rng: D.rand }, function (id, n) { add(H.cur.inv, id, n); }); H.cur.silver += sp.silver; lines = lines.concat(sp.lines); }
    return lines;
  };
  // no level cap (RULED 10-21, Griz: "we won't have a level cap, these guys will be going against a clock"): in the house the cap is the XP table's top (js/rules.js
  // R.XP_LEVEL); the first game's own cap stands wherever the house is not being played (this file loads only in deep16/)
  var cap0 = DS.R.cap; DS.R.cap = function () { return H.playing ? DS.R.XP_LEVEL.length - 1 : cap0.apply(this, arguments); };

  // ---------------------------------------------------------------- THE MARCH (RULED 10-21, Griz: "we'd do be hexes traveled instead of hours - pacing may be a bit much",
  // then "yes - build the forced march by hexes, no paces"): a day's march is H.DAYHEX hexes (the SRD's 24 miles; a hex of difficult going counts 2); before a hex past it
  // THE WORLD asks -- PUSH ON, MAKE CAMP, STAY; each hex pushed past it, everyone up makes a CON save, DC 10 + 1 for each hex past (the SRD's forced march, by the hex), a
  // failure a level of exhaustion kept on the sheet (H.exhaust: the SRD's six -- a fight reads conds.exhaustion, js/rules.js RU.exhaust). A long rest takes a level off.
  // Exhausted 2, the march goes at half speed (the slowest sets it); 5, not at all; 6 is death
  H.DAYHEX = 5;
  H.EXH = ['', 'disadvantage on ability checks', 'speed halved', 'disadvantage on attacks and saves', 'hit point maximum halved', 'speed 0', 'dead'];
  function exh(h) { return (h && h.conds && h.conds.exhaustion && h.conds.exhaustion.n) || 0; }
  H.exh = exh;
  // a sheet's exhaustion up or down k levels: the fourth halves the HP maximum (given back below it), the sixth kills. Returns the change
  H.exhaust = function (h, k) {
    var c = h.conds = h.conds || {}, was = exh(h), now = Math.min(6, Math.max(0, was + k)), cut = (c.exhaustion && c.exhaustion.cut) || 0;
    if (now === was) return 0;
    if (now >= 4 && !cut) { cut = Math.floor(h.maxhp / 2); h.maxhp -= cut; if (h.hp > h.maxhp) h.hp = h.maxhp; }
    if (now < 4 && cut) { h.maxhp += cut; cut = 0; }
    if (now <= 0) delete c.exhaustion; else c.exhaustion = { n: now, cut: cut };
    if (now >= 6) { h.hp = 0; h.ko = true; h.dead = true; }
    return now - was;
  };
  H.living = function (rec) { return Object.assign({}, rec, { party: rec.party.filter(function (h) { return !h.dead; }) }); }; // (the party a fight or a floor takes: the dead stay behind)
  H.hexCost = function (st) { return Math.max(1, Math.round(st.going || 1)); };
  // a step's share of the day's march: a hex its cost, a top-down tile its share of a hex (st.share: its miles and going over the hex's 5 -- js/overworld.js; till 10-22
  // the top-down walk kept hours and camped on its own past 8, the night's watches skipped: his "moving seems to be auto-camping")
  H.marchCost = function (st) { return st.share != null ? st.share : H.hexCost(st); };
  H.hexes = function (n) { return Math.round((n || 0) * 10) / 10; }; // (the day's count as said: a tile's tenths)
  H.pace = function () { var x = 0; H.cur.party.forEach(function (h) { if (!h.dead) x = Math.max(x, exh(h)); }); return x >= 5 ? 0 : x >= 2 ? 0.5 : 1; };
  // before a step (js/world.js World.stepWalk): true if the walk stops here -- too worn to walk, or the day's march walked and no word yet to push on
  H.marchAsk = function (scene, st, w, resume) { // (resume(path): the walk taken up again on PUSH ON -- the hex view's by default, the top-down view's its own)
    var W = D.world, S = W.state(); resume = resume || function (p) { scene.walk = { path: p, f: 0 }; };
    if (!H.pace()) { scene.walk = null; scene.say('Exhausted past walking: the party can go no further till it rests.'); return true; }
    if ((S.todayHex || 0) + H.marchCost(st) <= H.DAYHEX + 1e-9 || S.pushing) return false;
    var path = w.path.slice(); scene.walk = null;
    scene.card(['{y}THE DAY\'S MARCH IS WALKED{/} (' + H.hexes(S.todayHex) + ' hexes), ' + W.timeOfDay() + '.', 'Push on: each hex past ' + H.DAYHEX + ', a CON save for everyone (DC 10 + 1 a hex past);', 'a failure, a level of exhaustion.', '', D.keys('{g}E{/}: push on    {g}R{/}: make camp    {g}X{/}: stay')], null,
      [['a', function () { S.pushing = true; resume(path); }, 'PUSH ON'], ['rec', function () { H.night(scene); }, 'MAKE CAMP'], ['b', function () { scene.say('The party stands where it is, ' + W.timeOfDay() + '.'); }, 'STAY']]);
    return true;
  };
  H.marchHours = function (st) { return st.h / (H.pace() || 1); };
  // after a step: the day's hexes counted, the forced march's saves for each hex past. Returns the lines, or null if the march killed them all (the title)
  H.marchStep = function (st) {
    var R = DS.R, S = D.world.state(), before = S.todayHex || 0, cost = H.marchCost(st), lines = [];
    S.todayHex = before + cost;
    for (var n = Math.floor(before + 1e-9) + 1; n <= Math.floor(before + cost + 1e-9); n++) { // (each whole hex the step completes: a tile's tenths add up to one)
      var past = n - H.DAYHEX; if (past <= 0) continue;
      var dc = 10 + past;
      H.cur.party.forEach(function (h) {
        if (h.dead || down(h)) return; // (the fallen are carried)
        var r = D.roll('1d20').total + R.saveBonus(h, 'con');
        if (r < dc && H.exhaust(h, 1)) lines.push(h.name + ' fails the march (' + r + ' vs DC ' + dc + '): exhausted ' + exh(h) + (exh(h) >= 6 ? ' -- dead.' : ', ' + H.EXH[exh(h)] + '.'));
      });
    }
    if (H.cur.party.every(function (h) { return h.dead; })) { H.lost(); return null; }
    return lines;
  };
  // the card THE WORLD stops the walk on when a save is lost (js/world.js stepWalk): each failure on two lines, its roll, then the level and what it does
  H.marchCard = function (lines) {
    var out = ['{r}THE FORCED MARCH{/} (' + H.hexes(D.world.state().todayHex) + ' hexes today)', ''];
    lines.forEach(function (l) { var i = l.indexOf('): '); if (i < 0) out.push(l); else out.push(l.slice(0, i + 2), '{y}' + l.slice(i + 3) + '{/}'); });
    return out;
  };

  // ---------------------------------------------------------------- THE NIGHT (RULED 10-21, Griz: "when not rope-trick or tiny hut, they'll have to assign 3 watches for a
  // long rest. Each watch will roll an encounter check - less than if traveling, but on encounter party members not on that watch will be out of armor for that combat
  // (discuss exception for wizard and thief light armor sleeping)"): the camp's night on THE WORLD -- three watches, each standing hero on one; each watch an encounter check
  // on the night's tables (js/world.js W.pick, night) at W.WATCHX of the road's going for its hours; a fight wakes the rest with their medium and heavy armor off -- RULED
  // 10-21, his "go with the sleeping in light and robes, let them have the shield on the way to watch-interrupt combat": light armor and robes are slept in (H.SLEEP_IN), a
  // shield is taken up on the way; then the long rest (W.camp -> H.longRest). Rope Trick and the Tiny Hut keep the night with no watch (js/house.js H.field)
  H.WATCHES = 3; H.WATCHX = 0.5; H.SLEEP_IN = ['light', 'robe'];
  H.watchDefault = function (party) { var up = party.filter(function (h) { return !down(h); }); var a = {}; up.forEach(function (h, i) { a[h.key || h.id] = (i % H.WATCHES) + 1; }); return a; };
  // the sleepers' armor off (a copy of the save for the fight): what they wore, kept to put back after
  H.sleepersOff = function (rec, on) {
    var d = JSON.parse(JSON.stringify(rec)), off = {};
    d.party.forEach(function (h) {
      var id = h.key || h.id; if (on.indexOf(id) >= 0) return;
      var ar = h.equip && h.equip.armor && DS.DATA.items[h.equip.armor];
      if (!ar || (ar.armor && H.SLEEP_IN.indexOf(ar.armor.type) >= 0)) return; // (no armor, light armor or robes: slept in)
      off[id] = { armor: h.equip.armor }; h.equip.armor = null; // (the shield stays: taken up on the way)
    });
    return { data: d, off: off };
  };
  H.night = function (scene) { if (!H.playing) return; D.push(new Watches(scene)); };
  H.runNight = function (scene, asg) {
    var W = D.world, k = 0, ids = Object.keys(asg);
    var next = function () {
      if (!H.playing) return;
      k++;
      if (k > H.WATCHES) { var ups = W.camp(); scene.say('Dawn: the night\'s rest is had, ' + W.timeOfDay() + '.' + (ups && ups.length ? ' ' + ups.join(' ') : '')); return; }
      var on = ids.filter(function (id) { return asg[id] === k; }), S = W.state(), e = W.M().hex[W.K(S.at[0], S.at[1])], zone = W.zoneOf(e);
      if (S.zone !== zone || S.count == null) W.resetCount(zone);
      S.count -= W.DAYHOURS / H.WATCHES * W.PACE * W.NIGHTX * H.WATCHX;
      var p = S.count <= 0 ? (W.resetCount(zone), W.pick(zone, true)) : null;
      if (!p || !p.list.length) { next(); return; }
      var names = on.map(function (id) { var h = H.cur.party.filter(function (x) { return (x.key || x.id) === id; })[0]; return h ? h.name : id; });
      var so = H.sleepersOff(H.living(H.cur), on), who = p.list.length + ' come out of the dark';
      D.sfx('encounter');
      // FIGHT the way OPTIONS says, or the other way for this fight alone (RULED 10-21, Griz: "yes to the simple fight leans" -- js/simple.js); at the camp's fire either way
      // (his "add a campfire when the party encounters during a camp": js/world.js W.CAMP)
      var simple = !D.simple || D.simple.on(), other = simple ? 'ON THE GRID' : 'SIMPLE';
      var go = function (how) {
          scene.fight(p, e, { simple: how, camp: true, data: so.data, dark: true, intro: 'In the ' + ['first', 'second', 'third'][k - 1] + ' watch, out of the dark: ' + (names.length ? names.join(' and ') + ' standing it, the rest up from their blankets.' : 'no one standing it.'),
            after: function (res, b) {
              try { D.music('corridor'); } catch (e2) { }
              var ln = H.afterFight(b, res); if (ln === null) return;
              H.cur.party.forEach(function (h) { var o = so.off[h.key || h.id]; if (o) h.equip.armor = o.armor; }); // (their armor back on for the morning)
              scene.say((res === 'won' ? 'The watch holds. ' : 'The party got clear of them. ') + ln.join(' '));
              next();
            } });
      };
      scene.card(['{r}THE ' + ['FIRST', 'SECOND', 'THIRD'][k - 1] + ' WATCH{/}: ' + who + '.', (names.length ? names.join(' and ') + ' on watch' : 'no one on watch') + '; the rest wake with their armor off.', '', D.keys('{g}E{/}: fight' + (D.simple ? '    {g}R{/}: ' + other.toLowerCase() : ''))], null,
        [['a', function () { go(simple); }, 'FIGHT']].concat(D.simple ? [['rec', function () { go(!simple); }, other]] : []));
    };
    next();
  };
  function Watches(scene) { this.kind = 'housewatches'; this.opaque = false; this.scene = scene; this.party = H.cur.party.filter(function (h) { return !down(h); }); this.asg = H.watchDefault(this.party); this.i = 0; this.t = 0; }
  Watches.prototype.box = function () { var w = 300, h = 34 + this.party.length * 15 + 26, x = (D.W - w) / 2, y = (D.H - h) / 2 - 10; return { x: x, y: y, w: w, h: h }; };
  Watches.prototype.rects = function () {
    var b = this.box(), self = this, out = [];
    this.party.forEach(function (h, r) { for (var k = 1; k <= H.WATCHES; k++) out.push({ x: b.x + 150 + (k - 1) * 46, y: b.y + 28 + r * 15, w: 42, h: 12, label: ['FIRST', 'SECOND', 'THIRD'][k - 1], id: h.key || h.id, k: k, row: r }); });
    out.push({ x: b.x + b.w / 2 - 110, y: b.y + b.h - 20, w: 120, h: 14, label: 'BEGIN THE NIGHT', go: 'begin' }, { x: b.x + b.w / 2 + 16, y: b.y + b.h - 20, w: 90, h: 14, label: 'BACK', go: 'back' });
    return out;
  };
  Watches.prototype.go = function (what) {
    D.pop();
    if (what === 'begin') { D.sfx('confirm'); H.runNight(this.scene, this.asg); } else D.sfx('cancel');
  };
  Watches.prototype.update = function () {
    this.t++;
    var m = I.mouse, n = this.party.length, self = this;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; D.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; D.sfx('cursor'); }
    var h0 = this.party[this.i], id0 = h0 && (h0.key || h0.id);
    if (h0 && I.repeat('left')) { this.asg[id0] = (this.asg[id0] + H.WATCHES - 2) % H.WATCHES + 1; D.sfx('cursor'); }
    if (h0 && I.repeat('right')) { this.asg[id0] = this.asg[id0] % H.WATCHES + 1; D.sfx('cursor'); }
    if (m.click && m.inside) { var hit = this.rects().filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0]; if (hit) { if (hit.go) { this.go(hit.go); return; } this.asg[hit.id] = hit.k; this.i = hit.row; D.sfx('cursor'); } }
    if (I.pressed('a')) { this.go('begin'); return; }
    if (I.pressed('b') || m.rclick) this.go('back');
  };
  Watches.prototype.draw = function (ctx) {
    var b = this.box(), self = this, W = D.world;
    ctx.fillStyle = 'rgba(4,3,10,.55)'; ctx.fillRect(0, 0, D.W, D.H);
    D.win8(ctx, b.x, b.y, b.w, b.h);
    D.text(ctx, '{y}THE NIGHT\'S WATCHES{/}', b.x + 10, b.y + 7, D.WIN8.text);
    D.text(ctx, 'who stands which watch', b.x + 10, b.y + 17, '#9c9cb4');
    this.party.forEach(function (h, r) { var y = b.y + 30 + r * 15, on = r === self.i; if (on) { ctx.fillStyle = D.WIN8.sel; ctx.fillRect(b.x + 4, y - 3, 142, 13); } D.text(ctx, (on ? '> ' : '  ') + h.name + ' ' + Math.max(0, h.hp) + '/' + h.maxhp, b.x + 8, y, D.WIN8.text); });
    this.rects().forEach(function (q) { var lit = q.go || self.asg[q.id] === q.k; W.button(ctx, { x: q.x, y: q.y, w: q.w, h: q.h, label: lit || q.go ? q.label : '' }); if (!q.go && lit) { ctx.strokeStyle = D.WIN8.gold; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1); } });
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 17, D.W, 17); // (its own line over the screen's)
    D.hint(ctx, 'click a watch · up/down a hero, left/right the watch · E begin · X back', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  H.Watches = Watches;
  H.lost = function () { H.playing = false; H.cur = null; D.scenes.length = 0; D.push(new Title({ lost: true })); };
  H.toTitle = function () { H.playing = false; H.cur = null; D.scenes.length = 0; D.push(new Title()); }; // (EXIT on a floor or in a fight: what is unsaved is left -- deep16/js/ui.js gridHost's exits)
  // the long rest (THE WORLD's camp; js/events.js EV.longRest, the first game's): Aid's and Mage Armor's hours over, each sheet whole again (js/rules.js R.refresh),
  // then the levels banked come (R.gainXP with nothing new: every level the XP reaches). With a scene (THE WORLD's camp, its night's watches, the Tiny Hut) the
  // morning follows (H.morning: the picks, the night's bonds, the day's spells, the save); with none the caller wakes the party itself (H.sleepOnFloor, js/mines.js)
  H.restSheets = function (party) {
    var R = DS.R, lines = [];
    party.forEach(function (h) {
      if (h.dead) return; // (the dead stay dead: exhaustion's sixth level, H.exhaust)
      h.conds = h.conds || {}; var ex = h.conds.exhaustion ? JSON.parse(JSON.stringify(h.conds.exhaustion)) : null;
      if (h.conds.aid) { h.maxhp -= h.conds.aid; delete h.conds.aid; } delete h.conds.mageArmor;
      h.bondsBefore = (h.attuned || []).slice(); R.refresh(h, true); // (bondsBefore: the morning's sheet says what the night bonded -- the first game's EV.longRest, EV.bonds)
      if (ex) { h.conds.exhaustion = ex; H.exhaust(h, -1); h.hp = h.maxhp; lines.push(h.name + (exh(h) ? ' is less worn (exhausted ' + exh(h) + ').' : ' is rested out of the exhaustion.')); } // (the SRD: a long rest takes a level off -- with food and drink, not counted yet)
      h.hdLeft = Math.min(h.lvl, (h.hdLeft != null ? h.hdLeft : h.lvl) + Math.max(1, Math.floor(h.lvl / 2))); // (the SRD: a long rest gives back half the hit dice spent, at least one)
    });
    party.forEach(function (h) { if (!h.dead) lines = lines.concat(R.gainXP(h, 0)); });
    return lines;
  };
  H.longRest = function (scene) {
    if (!H.playing) return [];
    H.trail('rest', 'long rest');
    var R = DS.R;
    DS.G = { flags: H.cur.flags };
    var lines = H.restSheets(H.cur.party);
    if (scene) { H.morning({ party: H.cur.party, lines: lines, save: true }); return lines; } // (the morning opens the picks: Morning)
    var who = H.cur.party.filter(function (h) { return R.picksDue(h); });
    if (who.length && scene) {
      if (DS.autoPicks || !D.ctx || !DS.MENU) who.forEach(R.autoPicks);
      else { D.sfx('levelup'); scene.pm = DS.MENU.openPicks({ party: function () { return who; }, close: function () { scene.pm = null; } }, who, { pages: true }, function () { scene.pm = null; }); }
    } else if (lines.length) D.sfx('levelup');
    return lines;
  };
  // ---------------------------------------------------------------- THE MORNING (10-22, the services seat, started by the lanes desk on his word: "Start a seat on Silverton's
  // services: Cassia's rooms, Aldwin's chapel sleep, Davos's leech-house, Hessle's board, Merrick's sendings, from the first game's scenes"; and his 10-22 note on the house:
  // "camping the night with no encounter doesn't prompt the same as 'you just stayed at inn' - can't tell it's morning, no bond-report or morning castings routines ran").
  // Every long rest in the house wakes to the first game's morning (js/events.js EV.rest, EV.morning): the night (the screen dark, the inn's tune), MORNING and what the
  // night did, the level picks, THE NIGHT'S BONDS (EV.bonds), THE DAY'S SPELLS (EV.prepare: each caster's day, and Mage Armor and Aid cast ahead) and "Write down the day?
  // (Save)". THE WORLD's camp, its night's watches and the Tiny Hut (H.longRest), Cassia's rooms and Aldwin's floor (H.sleepOnFloor, js/counter.js). Its words are the
  // first game's (content/text.json g.*, EV.bonds's own); every row a click (his aim: "playable by mouse only as well as our other options"), the arrows and E, X back.
  // o: { party: the sheets, lines: what the rest said, line: the place's own morning, music: the night's tune, save: SAVE asked, floor: the floor's Battle, after(): its
  // figures brought to the sheets, saveAt(): where a save stands them, done() }
  H.NIGHT = 110;
  function worn(h) { var R = DS.R, out = []; Object.keys(h.equip || {}).forEach(function (s) { var id = h.equip[s], it = R.item(id); if (s !== 'torch' && it && it.attune && out.indexOf(id) < 0) out.push(id); }); return out; }
  function Morning(o) {
    this.kind = 'housemorning'; this.opaque = false; this.o = o; this.t = 0; this.tp = 0; this.phase = 'night'; this.i = 0; this.scroll = 0; this.msg = null; this.pm = null; this.sub = null; this.over = false;
    var R = DS.R; this.party = (o.party || []).filter(function (h) { return !h.dead; });
    this.due = this.party.filter(function (h) { return R.picksDue(h); });
    if (this.due.length && (DS.autoPicks || !D.ctx || !DS.MENU)) { this.due.forEach(R.autoPicks); this.due = []; } // (no one to ask -- a bench: the build's picks at once)
    this.was = (DS.audio && DS.audio.songId) || null;
  }
  H.Morning = Morning;
  H.morning = function (o) { var m = new Morning(o || {}); D.push(m); return m; };
  Morning.prototype.enter = function () { try { D.music(this.o.music || 'inn'); } catch (e) { } }; // (the first game's EV.rest: the inn's tune through the night)
  Morning.prototype.ORDER = ['night', 'dawn', 'picks', 'bonds', 'spells', 'save'];
  Morning.prototype.wants = function (p) {
    var R = DS.R;
    if (p === 'dawn') return true;
    if (p === 'picks') return this.due.length > 0;
    if (p === 'bonds') return this.party.some(function (h) { return worn(h).length || (h.bondsBefore || []).length; }); // (EV.bonds: nothing worn that wants a bond, no page)
    if (p === 'spells') return this.party.some(function (h) { return R.prepCount(h) > 0; });
    if (p === 'save') return !!this.o.save && H.playing;
    return false;
  };
  Morning.prototype.next = function () {
    var k = this.ORDER.indexOf(this.phase); this.i = 0; this.scroll = 0; this.sub = null; this.msg = null; this.tp = 0;
    while (++k < this.ORDER.length) { var p = this.ORDER[k]; if (this.wants(p)) { this.phase = p; this.start(p); return; } }
    this.finish();
  };
  Morning.prototype.start = function (p) {
    var self = this, R = DS.R;
    if (p === 'dawn') { if (this.was) { try { D.music(this.was); } catch (e) { } } D.sfx('confirm'); } // (the place's own tune again, as the first game's fade up)
    if (p === 'picks') { D.sfx('levelup'); this.pm = DS.MENU.openPicks({ party: function () { return self.due; }, close: function () { self.pm = null; } }, this.due, { pages: true }, function () { self.pm = null; }); }
    if (p === 'spells') this.party.forEach(function (h) { if (R.prepCount(h) > 0) h.prepared = R.prepFill(h); }); // (on waking: yesterday's choices stand, and a day grown by a level fills with the build's next picks -- EV.prepare)
    if (p === 'save') this.settle();
  };
  Morning.prototype.settle = function () { if (this.settled) return; this.settled = true; this.party.forEach(function (h) { delete h.bondsBefore; }); if (this.o.after) this.o.after(); }; // (the floor's figures to their sheets before a SAVE)
  Morning.prototype.finish = function () {
    if (this.over) return; this.over = true; this.settle();
    if (D.top() === this) D.pop();
    if (this.o.done) this.o.done();
  };
  // the field's casts here: Mage Armor on the one chosen, Aid on three (aidOut: the one who goes without) -- H.field's rules
  Morning.prototype.env = function (aidOut) { return { where: this.o.floor ? 'floor' : 'world', party: this.party, tent: false, has: function () { return false; }, take: function () { }, ward: function () { }, longRest: function () { return []; }, aidOut: aidOut || null }; };
  // the rows on the screen now: { title, rows: [{ label, right, rightColor, color, value, disabled, desc }] }
  Morning.prototype.list = function () {
    var R = DS.R, P = this.party, s = this.sub;
    if (this.phase === 'bonds') { // (EV.bonds: every bond-wanting thing the four wear, what the night did with it -- BONDED, NEW, WAITING -- and what was set down and let go)
      var rows = [{ label: 'DONE', value: 'done', desc: 'On to the day\'s spells. A bond lasts while the thing is worn; take it off, and the next rest lets it go.' }], MAX = R.ATTUNE_MAX || 3;
      P.forEach(function (h) {
        var was = h.bondsBefore || [], now = h.attuned || [];
        worn(h).forEach(function (id) {
          var it = R.item(id), on = now.indexOf(id) >= 0;
          rows.push({ label: h.name.toUpperCase() + ': ' + it.name, right: on ? (was.indexOf(id) >= 0 ? 'BONDED' : 'NEW') : 'WAITING', rightColor: on ? (was.indexOf(id) >= 0 ? '#C8D0E8' : '#B8F8B8') : '#6C6C84',
            value: { h: h, id: id }, desc: (it.desc || '') + (on ? '  E: let it go.' : now.length >= MAX ? '  Three bonds held: let one go first.' : '  E: bond with it.') });
        });
        was.filter(function (id) { return now.indexOf(id) < 0 && worn(h).indexOf(id) < 0; }).forEach(function (id) { var it = R.item(id); if (it) rows.push({ label: h.name.toUpperCase() + ': ' + it.name, right: 'LET GO', value: null, disabled: true, desc: 'Set down, and let go in the night.' }); });
      });
      return { title: 'THE NIGHT\'S BONDS', rows: rows };
    }
    if (this.phase === 'spells' && s && s.prep) { // (prepHero: a spell in or out; the oath's and the book's rituals listed, always ready, uncounted)
      var h = s.prep, n = R.prepCount(h), pool = R.prepPool(h);
      var pr = pool.map(function (id) { var sp = DS.DATA.spells[id], on = h.prepared.indexOf(id) >= 0; return { label: (on ? '■ ' : '□ ') + (sp.short || sp.name), right: 'L' + sp.level, value: id, color: on ? null : '#C8D0E8', desc: sp.desc }; });
      R.oathSpells(h).forEach(function (id) { var sp = DS.DATA.spells[id]; pr.push({ label: '◆ ' + sp.name, right: 'OATH', value: id, disabled: true, desc: say('g.prepOath', { spell: sp.name }) }); });
      R.ritualsOf(h).forEach(function (id) { var sp = DS.DATA.spells[id]; pr.push({ label: '◆ ' + sp.name, right: 'RITUAL', value: id, disabled: true, desc: say('g.prepRitual', { spell: sp.name }) }); });
      return { title: h.name.toUpperCase() + ': ' + h.prepared.length + ' OF ' + n + ' PREPARED', rows: pr };
    }
    if (this.phase === 'spells' && s && s.whom) { var ma = s.sp.buff === 'mageArmor'; return { title: 'ON WHOM?', rows: P.map(function (x) { return { label: x.name, right: ma && R.armored(x) ? 'ARMORED' : (x.ko ? 'KO ' : '') + x.hp + '/' + x.maxhp, value: x, disabled: x.ko || x.hp <= 0 || (ma && R.armored(x)), desc: s.sp.desc }; }) }; }
    if (this.phase === 'spells' && s && s.without) return { title: 'WHO GOES WITHOUT?', rows: P.map(function (x) { return { label: x.name, right: (x.ko ? 'KO ' : '') + x.hp + '/' + x.maxhp, value: x, desc: s.sp.desc }; }) };
    if (this.phase === 'spells') { // (EV.prepare: DONE, each caster's day, and the cast-ahead -- by whoever prepared it and has the slot; Aid on those who have it already would be a slot for nothing)
      var casters = P.filter(function (x) { return R.prepCount(x) > 0; }), rs = [{ label: 'DONE', value: 'done', desc: say('g.prepDone') }];
      casters.forEach(function (x) { rs.push({ label: 'PREPARE ' + x.name.toUpperCase(), right: x.prepared.length + '/' + R.prepCount(x), value: { prep: x }, desc: say(x.cls === 'wizard' ? 'g.prepWizard' : 'g.prepPaladin', { name: x.name, n: R.prepCount(x) }) }); });
      casters.forEach(function (x) {
        ['mageArmor', 'aid'].forEach(function (id) {
          if (R.castable(x, 'field').indexOf(id) < 0) return;
          var sp = DS.DATA.spells[id], slot = R.lowestSlot(x, sp.level), on = P.filter(function (y) { return y.conds && y.conds[id]; });
          rs.push({ label: 'CAST ' + sp.name.toUpperCase(), right: on.length ? 'ON ' + (on.length === 1 ? on[0].name.toUpperCase() : on.length) : slot ? 'L' + slot : 'NO SLOT', value: { cast: sp, h: x }, disabled: !slot || (id === 'aid' && on.length > 0), desc: sp.desc });
        });
      });
      return { title: 'THE DAY\'S SPELLS', rows: rs };
    }
    if (this.phase === 'save') return { title: say('g.saveAsk'), rows: [{ label: 'SAVE', value: 'save' }, { label: 'NO', value: 'no' }] };
    return { title: '', rows: [] };
  };
  Morning.prototype.pick = function (r) {
    if (!r || r.disabled) { D.sfx('error'); return; }
    var R = DS.R, v = r.value, s = this.sub, self = this; this.msg = null;
    if (this.phase === 'bonds') {
      if (v === 'done') { D.sfx('confirm'); this.next(); return; }
      var hh = v.h, a = hh.attuned = (hh.attuned || []).slice(), i = a.indexOf(v.id), MAX = R.ATTUNE_MAX || 3;
      // (a bond let go here stays let go while the thing is worn -- R.attune reads h.noBond -- and bonding it again clears that)
      if (i >= 0) { a.splice(i, 1); hh.noBond = (hh.noBond || []).concat([v.id]); D.sfx('cancel'); }
      else if (a.length >= MAX) { D.sfx('error'); this.msg = [hh.name + ' holds three bonds already. Let one go first.']; }
      else { a.push(v.id); if (hh.noBond) { hh.noBond = hh.noBond.filter(function (x) { return x !== v.id; }); if (!hh.noBond.length) delete hh.noBond; } D.sfx('magic'); }
      return;
    }
    if (this.phase === 'spells' && s && s.prep) {
      var h = s.prep, n = R.prepCount(h), k = h.prepared.indexOf(v);
      if (k >= 0) { h.prepared.splice(k, 1); D.sfx('cursor'); }
      else if (h.prepared.length >= n) { D.sfx('error'); this.msg = [say('g.prepFull', { name: h.name, n: n })]; }
      else { h.prepared.push(v); D.sfx('cursor'); }
      return;
    }
    if (this.phase === 'spells' && s && (s.whom || s.without)) { var ln = H.field.cast(s.c, s.sp, s.whom ? v : null, this.env(s.without ? v : null)); this.back(true); this.msg = ln; return; }
    if (this.phase === 'spells') {
      if (v === 'done') { D.sfx('confirm'); this.next(); return; }
      if (v.prep) { var pool = R.prepPool(v.prep); v.prep.prepared = (v.prep.prepared || []).filter(function (id) { return pool.indexOf(id) >= 0; }).slice(0, R.prepCount(v.prep)); D.sfx('confirm'); this.sub = { prep: v.prep, at: this.i }; this.i = 0; this.scroll = 0; return; }
      if (v.cast && v.cast.buff === 'aid') { // (up to three: four in the party, one goes without -- EV.fieldCast's WHO GOES WITHOUT?)
        if (this.party.length > 3) { D.sfx('confirm'); this.sub = { without: true, c: v.h, sp: v.cast, at: this.i }; this.i = 0; this.scroll = 0; return; }
        this.msg = H.field.cast(v.h, v.cast, null, this.env(null)); return;
      }
      if (v.cast) {
        if (v.cast.buff === 'mageArmor' && this.party.every(function (x) { return R.armored(x) || x.ko || x.hp <= 0; })) { D.sfx('error'); this.msg = [say('g.mageArmorNone')]; return; }
        D.sfx('confirm'); this.sub = { whom: true, c: v.h, sp: v.cast, at: this.i }; this.i = 0; this.scroll = 0; return;
      }
    }
    if (this.phase === 'save') {
      if (v === 'save') { D.sfx('confirm'); this.settle(); if (this.o.saveAt) this.o.saveAt(); D.push(new Slots('save', function () { self.finish(); })); return; }
      D.sfx('cancel'); this.finish();
    }
  };
  Morning.prototype.back = function (quiet) { if (!this.sub) return; this.i = this.sub.at || 0; this.sub = null; this.scroll = 0; if (!quiet) D.sfx('cancel'); };
  // X (or a right click): back out of a list within, else the first game's -- the morning's lists end on X as on DONE, the save's on NO
  Morning.prototype.cancel = function () {
    if (this.phase === 'dawn') { this.next(); return; }
    if (this.sub) { this.back(); return; }
    var L = this.list(), last = this.phase === 'save' ? L.rows[L.rows.length - 1] : L.rows[0];
    this.pick(last);
  };
  Morning.prototype.box = function (n) { var vis = Math.min(12, Math.max(2, n)), w = 340; return { x: (D.W - w) / 2, y: 18, w: w, h: 30 + vis * 12, vis: vis }; };
  Morning.prototype.dawnLines = function () {
    var W = D.world, when = W && W.house && W.house() && W.state ? 'day ' + (Math.floor(W.state().t / 24) + 1) + ', ' + W.timeOfDay() : '';
    var out = ['{y}' + (this.o.title || 'MORNING') + '{/}' + (when ? ' -- ' + when + '.' : '')].concat(this.o.line ? [this.o.line] : [], [say('g.rested')], this.o.lines || []), w = 320, ls = [];
    out.forEach(function (l, k) { if (k) ls.push(''); ls = ls.concat(D.wrap(l, w - 20)); });
    return ls;
  };
  // the buttons on the screen now: the rows in sight (k: the row), or the dawn's OK
  Morning.prototype.buttons = function () {
    if (this.phase === 'dawn') { var ls = this.dawnLines(), h = 30 + ls.length * 10, y = Math.max(8, (D.H - h) / 2 - 10); return [{ x: D.W / 2 - 30, y: y + h - 20, w: 60, h: 14, go: 'ok', label: 'OK', card: { x: (D.W - 320) / 2, y: y, w: 320, h: h, lines: ls } }]; }
    if (this.phase === 'night' || this.pm) return [];
    var L = this.list(), b = this.box(L.rows.length), out = [];
    this.scroll = Math.max(0, Math.min(this.scroll, L.rows.length - b.vis));
    if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + b.vis) this.scroll = this.i - b.vis + 1;
    for (var r = 0; r < b.vis; r++) { var k = this.scroll + r; if (!L.rows[k]) break; out.push({ x: b.x + 4, y: b.y + 22 + r * 12, w: b.w - 8, h: 12, k: k }); }
    return out;
  };
  Morning.prototype.update = function () {
    this.t++; this.tp++;
    if (this.phase === 'picks') { if (this.pm) { this.pm.update(D.ui.menuKeys()); if (this.pm && this.pm.closed) this.pm = null; } if (!this.pm) this.next(); return; } // (the page shut: on to the bonds)
    var m = I.mouse;
    if (this.phase === 'night') { if (this.tp >= H.NIGHT || I.pressed('a') || (m.click && m.inside)) this.next(); return; } // (a click or E: on to the morning)
    var bs = this.buttons(), hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (hit && hit.k != null && (m.moved || m.click)) this.i = hit.k;
    if (m.click && m.inside && hit) { if (hit.go === 'ok') { D.sfx('confirm'); this.next(); } else this.pick(this.list().rows[hit.k]); return; }
    if (I.pressed('b') || m.rclick) { this.cancel(); return; }
    if (this.phase === 'dawn') { if (I.pressed('a')) { D.sfx('confirm'); this.next(); } return; }
    var L = this.list(), n = L.rows.length;
    if (m.wheel && m.inside) { this.scroll = Math.max(0, Math.min(n - this.box(n).vis, this.scroll + (m.wheel > 0 ? 1 : -1))); this.i = Math.max(this.scroll, Math.min(this.scroll + this.box(n).vis - 1, this.i)); m.wheel = 0; }
    if (n && I.repeat('down')) { this.i = (this.i + 1) % n; D.sfx('cursor'); }
    if (n && I.repeat('up')) { this.i = (this.i + n - 1) % n; D.sfx('cursor'); }
    if (I.pressed('a')) this.pick(L.rows[this.i]);
  };
  Morning.prototype.draw = function (ctx) {
    var W8 = D.WIN8, self = this;
    if (this.phase === 'night') { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, this.tp / 20) + ')'; ctx.fillRect(0, 0, D.W, D.H); D.hint(ctx, 'click or E: on to the morning', D.W / 2, D.H - 12, '#4a4a5c', 'center'); return; }
    ctx.fillStyle = 'rgba(4,3,10,' + (this.phase === 'dawn' ? Math.max(0.5, 1 - this.tp / 30) : 0.55) + ')'; ctx.fillRect(0, 0, D.W, D.H); // (up out of the dark: the first game's fade)
    if (this.pm) { D.ui.drawMenu(ctx, this.pm); return; }
    var bs = this.buttons();
    if (this.phase === 'dawn') {
      var q = bs[0], c = q.card; D.win8(ctx, c.x, c.y, c.w, c.h);
      c.lines.forEach(function (l, i) { D.text(ctx, l, c.x + 10, c.y + 8 + i * 10, W8.text); });
      var hov = I.mouse.inside && I.mouse.x >= q.x && I.mouse.x < q.x + q.w && I.mouse.y >= q.y && I.mouse.y < q.y + q.h;
      ctx.fillStyle = hov ? W8.sel : 'rgba(16,18,58,.92)'; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.strokeStyle = W8.gold; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      D.text(ctx, 'OK', q.x + q.w / 2, q.y + 3, hov ? W8.gold : W8.text, 'center');
      ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 17, D.W, 17); D.hint(ctx, 'click OK · E on', D.W / 2, D.H - 12, '#9a96a8', 'center');
      return;
    }
    var L = this.list(), b = this.box(L.rows.length);
    D.win8(ctx, b.x, b.y, b.w, b.h);
    D.text(ctx, '{y}' + L.title + '{/}', b.x + 10, b.y + 7, W8.text);
    bs.forEach(function (q) {
      var r = L.rows[q.k], on = q.k === self.i;
      if (on) { ctx.fillStyle = W8.sel; ctx.fillRect(q.x, q.y - 1, q.w, q.h); }
      D.text(ctx, (on ? '> ' : '  ') + r.label, q.x + 4, q.y + 1, r.disabled ? '#6c6c84' : on ? W8.gold : r.color || W8.text);
      if (r.right != null) D.text(ctx, r.right, q.x + q.w - 6, q.y + 1, r.disabled ? '#6c6c84' : r.rightColor || '#c8d0e8', 'right');
    });
    if (this.scroll > 0) D.text(ctx, '▲', b.x + b.w - 12, b.y + 8, '#c8d0e8');
    if (this.scroll + b.vis < L.rows.length) D.text(ctx, '▼', b.x + b.w - 12, b.y + b.h - 10, '#c8d0e8');
    var cur = L.rows[this.i], tx = this.msg ? this.msg.join(' ') : cur && cur.desc || '', dy = b.y + b.h + 6;
    if (tx) { D.win8(ctx, b.x, dy, b.w, 44); D.wrap(tx, b.w - 20).slice(0, 3).forEach(function (l, i) { D.text(ctx, l, b.x + 10, dy + 7 + i * 10, self.msg ? '#b8f8b8' : '#e0c8a0'); }); }
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 17, D.W, 17);
    D.hint(ctx, 'click a row · arrows choose · E pick · X ' + (this.sub ? 'back' : this.phase === 'save' ? 'no' : 'done'), D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  // a night slept on a floor (Cassia's rooms, Aldwin's floor -- js/counter.js): in the house, the floor's party into the save, THE WORLD's clock to the morning and the long
  // rest on the save (H.longRest with no scene: the picks are this morning's, over the floor), the morning, then the rested sheets back on the figures; on a test door, the
  // floor's four rested in place. A SAVE in the morning stands them at the door they came in by (H.atOf). o.hours: the clock that many hours on instead of to the morning, a
  // long rest by the clock (the Glowseep's fire, js/mines.js M.seepFire -- 10-27, his "I can't repeatedly sleep to get back to night time"); o.title: the morning card's word
  H.sleepOnFloor = function* (B, o) {
    o = o || {};
    var R = D.roam, R0 = B.roam, W = D.world, house = !!(R.house() && H.playing), lines = [], sheets, done = false;
    R0.slept = (R0.slept || 0) + 1; // (a night slept on this floor: outside the house THE WORLD's march starts fresh when the party goes out -- js/mines.js M.carryClock)
    if (house) {
      H.fromFloor(B);
      if (o.hours) { var S = W.state(); S.t += o.hours; S.today = 0; S.todayHex = 0; S.pushing = false; W.save(); lines = H.longRest(null) || []; } // (W.camp's day reset, the clock by the hours)
      else { var sc0 = W.scene; W.scene = null; try { lines = W.camp() || []; } finally { W.scene = sc0; } }
      sheets = H.cur.party.filter(function (h) { return !h.dead; });
    } else {
      sheets = R0.members.filter(function (u) { return u.src; }).map(function (u) { var sh = JSON.parse(JSON.stringify(u.src)); sh.hp = Math.max(0, u.hp); sh.slots = (u.slots || sh.slots || []).slice(); return sh; });
      lines = H.restSheets(sheets);
    }
    var byKey = {}; sheets.forEach(function (h) { byKey[h.key || h.id] = h; });
    H.morning({ party: sheets, lines: lines, line: o.line || null, title: o.title || null, music: o.music, save: house && R.def.save !== false, floor: B, // (the save asked where the floor keeps one: js/roam.js R.canSave's rule)
      after: function () { R0.members.forEach(function (u) { var sh = u.src && byKey[u.src.key || u.src.id]; if (sh) { u.src.conds = JSON.parse(JSON.stringify(sh.conds || {})); R.resheet(B, u, sh); } }); R.regear(B); },
      saveAt: function () { H.cur.at = H.atOf(B); },
      done: function () { done = true; } });
    while (!done) yield 1;
  };
  // where a SAVE on a floor stands the party: the token's square -- or, in a room behind a door (js/town.js T.goIn), the square on the street they went in from, facing out
  H.atOf = function (B) {
    var R = D.roam, R0 = B.roam, o = B.townAway, def = o ? o.def : R.def, t = R0.token, sq = o ? o.at : [t.x, t.y], fw = o ? [-o.fw[0], -o.fw[1]] : R0.fw;
    return { town: def.door || def.key, gate: def.gate || 'west', sq: sq.slice(), dir: R.DIR8[fw[0] + ',' + fw[1]] || null };
  };
  // SAVE: the game into a slot, from where they stand (the town's square, or the world's hex)
  H.saveTo = function (n) {
    if (!H.playing) return false;
    H.trail('save', 'slot ' + n); H.slot = n; H.cur.saved = Date.now(); H.cur.v = H.V;
    return D.store.set(H.key(n), H.cur);
  };
  H.where = function (rec) {
    var W = D.world, M = W.M(), at = rec.at || {}, s = at.town && H.siteOf(at.town);
    if (s) return s.name;
    var w = rec.world, Mw = W.map((w && w.map) || 'world') || M, e = Mw && w && w.at ? Mw.hex[W.K(w.at[0], w.at[1])] : null; // (the hex on the map the save stands on: THE WORLD's or the Silverton area's)
    return e ? M.terr[e.t].name : 'the road';
  };
  H.line = function (n, rec) {
    if (!rec) return { n: n, l: 'SLOT ' + n + '   -- empty --', r: '' };
    var lead = rec.party[0] || {}, d = rec.world && rec.world.t != null ? Math.floor(rec.world.t / 24) + 1 : 1, when = rec.saved ? new Date(rec.saved) : null;
    return { n: n, l: 'SLOT ' + n + '   ' + lead.name + ' L' + lead.lvl + '   ' + H.where(rec), r: 'day ' + d + (when ? '  ' + (when.getMonth() + 1) + '/' + when.getDate() + ' ' + ('0' + when.getHours()).slice(-2) + ':' + ('0' + when.getMinutes()).slice(-2) : '') };
  };

  // ---------------------------------------------------------------- THE FIELD (RULED 10-21, lean 4, his "the rest sound good"): the first game's field menu -- js/events.js
  // EV.fieldCast, EV.fieldSkill, EV.useFieldItem, their rules and their words (content/text.json g.*) -- on the second game's own bodies: a save's sheet on THE WORLD,
  // a floor's figure in a town (its sheet behind it, u.src). Nothing hands back to the 8-bit. env: { where: 'world' | 'floor', party: the bodies, tent: a rest may be
  // had here, has(id), take(id), ward(steps): the chalk's 60 of the 8-bit's steps, longRest() }. Each returns the lines to say
  var FD = H.field = {};
  function say(k, o) { var r = (DS.DATA.text || {})[k], s = r ? (typeof r === 'string' ? r : r.t) : k; Object.keys(o || {}).forEach(function (n) { s = s.split('{' + n + '}').join(o[n]); }); return s; }
  function gearOf(x) { return x.equip || (x.src && x.src.equip) || {}; }
  function sheetOf(x) { return x.src || x; }
  function down(x) { return !!x.ko || x.hp <= 0; }
  FD.heal = function (t, amt) { var before = Math.max(0, t.hp), n = Math.max(0, Math.min(t.maxhp - before, amt)), woke = down(t) && n > 0; t.hp = before + n; if (woke) t.ko = false; return { n: n, woke: woke }; };
  function healed(t, hf) { return [say('g.healed', { name: t.name, n: hf.n })].concat(hf.woke ? [say('g.comesRound', { name: t.name })] : []); }
  var ILLS = ['poisoned', 'paralyzed', 'blinded', 'deafened'];
  function cure(t) { var cc = t.conds || {}, ills = ILLS.filter(function (k) { return cc[k]; }); ills.forEach(function (k) { delete cc[k]; }); Object.keys(cc).forEach(function (k) { var v = cc[k]; if (v && typeof v === 'object' && v.linked === 'poisoned') delete cc[k]; }); return ills.length; }
  FD.cast = function (c, sp, t, env) {
    var R = DS.R, slot = sp.level && !sp.ritual ? R.lowestSlot(c, sp.level) : 0, spend = function () { if (slot) c.slots[slot - 1]--; };
    if (sp.level && !sp.ritual && !slot) return [say('g.noSlots')];
    if (sp.kind === 'rest') { // (Rope Trick a short rest, the Tiny Hut a long one: only where a tent could go, each spending its component -- the first game's rule)
      if (!env.tent) return [say('g.noRestHere')];
      if (sp.component && !env.has(sp.component)) return [say('g.noComponent', { item: DS.DATA.items[sp.component].name })];
      if (sp.component) env.take(sp.component); spend(); D.sfx('magic');
      if (sp.rest === 'long') return [say('g.tinyHut')].concat(env.longRest() || []);
      env.party.forEach(function (x) { if (!down(x)) x.hp = Math.min(x.maxhp, x.hp + Math.ceil(x.maxhp / 2)); R.refresh(x, false); });
      return [say('g.ropeTrick'), say('g.tentRest')];
    }
    if (sp.kind === 'heal' || sp.kind === 'cure' || (sp.kind === 'buff' && sp.target !== 'allies')) {
      var ma = sp.buff === 'mageArmor', armored = function (x) { return R.armored(sheetOf(x)); };
      t = t || (sp.target === 'self' ? c : null); if (!t) return ['On whom?'];
      if (t.dead) return [t.name + ' is dead.'];
      if (sp.kind === 'heal' && t.hp >= t.maxhp) return [say('g.fullHP', { name: t.name })];
      if (ma && armored(t)) return [env.party.every(function (x) { return armored(x) || down(x); }) ? say('g.mageArmorNone') : t.name + ' wears armor: Mage Armor will not take.'];
      if (sp.buff === 'continualFlame' && !gearOf(t).weapon) return [say('g.flameNothing')];
      if (sp.kind !== 'heal' && sp.kind !== 'cure' && down(t)) return [say('g.notDown', { name: t.name }).replace('still standing', 'down')];
      spend(); D.sfx('heal');
      if (sp.kind === 'heal') { var cm = (R.CLASSES[c.cls] || {}).cast || 'cha'; return healed(t, FD.heal(t, D.roll(sp.dmg.replace(/^(\d+)d/, function (m, k) { return (+k + (slot - sp.level)) + 'd'; })).total + DS.mod(c.abil[cm]))); }
      t.conds = t.conds || {};
      if (sp.kind === 'cure') { cure(t); return [say('g.cured', { name: t.name })]; } // (what it cures, as the Elixir out of a fight: the first game's cast only said so)
      if (ma) { t.conds.mageArmor = true; return [say('g.mageArmor', { name: t.name, ac: R.ac(Object.assign({}, sheetOf(t), { conds: t.conds })) })]; }
      if (sp.buff === 'darkvision') { t.conds.darkvision = true; return [say('g.darkvision', { name: t.name })]; }
      if (sp.buff === 'continualFlame') { t.conds.continualFlame = gearOf(t).weapon; return [say('g.continualFlame', { name: t.name })]; }
      return [say('g.nothingHappens')];
    }
    if (sp.buff === 'aid') { // (up to three: the three worst hurt, the caster's choice the first game asks -- the seat's, his to overrule; the higher Aid stands, the fallen come round)
      // (env.aidOut: the one who goes without, asked as the first game asks it -- the morning's WHO GOES WITHOUT?, H.morning)
      var up3 = (env.aidOut ? env.party.filter(function (x) { return x !== env.aidOut; }) : env.party.slice().sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })).slice(0, 3), aN = 5 * Math.max(1, (slot || sp.level) - 1), woke = [];
      spend();
      up3.forEach(function (x) { x.conds = x.conds || {}; var had = x.conds.aid || 0, more = Math.max(0, aN - had); x.maxhp += more; x.hp = Math.max(0, x.hp) + more; x.conds.aid = Math.max(had, aN); if (x.ko && x.hp > 0) { x.ko = false; woke.push(x); } });
      D.sfx('buff');
      return [say('g.aid', { who: up3.map(function (x) { return x.name; }).join(', '), n: aN })].concat(woke.map(function (x) { return say('g.comesRound', { name: x.name }); }));
    }
    if (sp.kind === 'light') { // (the Light on the one chosen, carried -- RULED 10-20, his "that seems aligned with SRD"; it lights a floor: js/light.js reads conds.light)
      // (10-28, Griz: "it doesn't seem to choose a target or impact entering the guano mines": SRD 5.1 -- "You touch one object", the one the menu asks for (js/menu.js MagicPage);
      // "Duration: 1 hour", on THE WORLD's clock (H.lightsOut; the long rest still ends it, R.refresh); "The spell ends if you cast it again": the caster's other Light let go)
      t = t || c; var by = c.key || c.id, now = H.clock(H.cur);
      env.party.forEach(function (x) { [x, x.src].forEach(function (y) { if (y && y.conds && y.conds.light && y.conds.light.by === by) delete y.conds.light; }); });
      t.conds = t.conds || {}; t.conds.light = { by: by }; if (now != null) t.conds.light.until = now + H.LIGHT_HOURS; D.sfx('magic');
      return [c.name + '\'s Light on ' + (t === c ? c.name + '\'s own gear' : t.name + '\'s gear') + ': bright 20 ft and dim 20 more, for an hour.', say('g.light')];
    }
    if (sp.kind === 'detect') { D.sfx('magic'); return [say('g.detectNo')]; }
    return [say('g.nothingHappens')];
  };
  FD.skill = function (c, s, t) {
    if (s === 'lay') { t = t || c; if (t.hp >= t.maxhp) return [say('g.fullHP', { name: t.name })]; var lh = FD.heal(t, c.feats.lay || 0); c.feats.lay -= lh.n; D.sfx('heal'); return healed(t, lh); }
    if (s === 'arcane') {
      var budget = Math.ceil(c.lvl / 2), got = 0;
      for (var lv = Math.min(5, budget); lv >= 1; lv--) while (budget >= lv && c.slots[lv - 1] < c.slotsMax[lv - 1]) { c.slots[lv - 1]++; budget -= lv; got++; }
      c.feats.arcaneRecovery = 0; D.sfx('magic');
      return [say('g.arcane', { name: c.name, n: got })];
    }
    if (s === 'wind') { var w = Math.min(c.maxhp - c.hp, D.roll('1d10').total + c.lvl); c.hp += w; c.feats.secondWind = 0; D.sfx('heal'); return [say('g.healed', { name: c.name, n: w })]; }
    return [say('g.nothingHappens')];
  };
  // a sheet learned from (the first game's js/events.js EV.learnWhy): '' if this one can, else why not
  FD.learnWhy = function (id, h, party) {
    var use = DS.DATA.items[id].use, sp = DS.DATA.spells[use.spell], cls = use.cls || 'wizard', lvl = sp.level || 0, x = sheetOf(h);
    if (x.cls !== cls) return h.name + ' can make nothing of it: it wants a ' + cls + '.';
    if ((x.known || []).indexOf(use.spell) >= 0) return h.name + ' knows ' + sp.name + ' already.';
    if (lvl && !((h.slotsMax || x.slotsMax || [])[lvl - 1] > 0)) return h.name + ' cannot cast spells of its level yet.';
    return '';
  };
  // an item from the pack (null: not the field's -- a light on THE WORLD, Katarina's book)
  FD.item = function (id, h, env) {
    var it = DS.DATA.items[id], use = it && it.use; if (!use) return null;
    var R = DS.R;
    if (h.dead && (use.effect === 'heal' || use.effect === 'revive' || use.effect === 'cure')) return [h.name + ' is dead: beyond any of that.'];
    if (use.effect === 'heal') { if (h.hp >= h.maxhp) return [say('g.fullHP', { name: h.name })]; env.take(id); D.sfx('heal'); return healed(h, FD.heal(h, D.roll(use.dice).total)); }
    if (use.effect === 'cure') { if (!ILLS.some(function (k) { return (h.conds || {})[k]; })) return [say('g.nothingToCure', { name: h.name })]; env.take(id); cure(h); D.sfx('heal'); return [say('g.cured', { name: h.name })]; }
    if (use.effect === 'revive') { if (!down(h)) return [say('g.notDown', { name: h.name })]; env.take(id); h.ko = false; h.hp = use.hp || 1; D.sfx('heal'); return [say('g.revived', { name: h.name })]; }
    if (use.effect === 'rest') { if (!env.tent) return [say('g.noTentHere')]; env.take(id); env.party.forEach(function (x) { if (!down(x)) x.hp = Math.min(x.maxhp, x.hp + Math.ceil(x.maxhp / 2)); R.refresh(x, false); }); return [say('g.tentRest')]; }
    if (use.effect === 'ward') { env.take(id); env.ward(60); D.sfx('magic'); return [say('g.chalk')]; }
    if (use.effect === 'learn') {
      var why = FD.learnWhy(id, h, env.party); if (why) return [why];
      var sp0 = DS.DATA.spells[use.spell], x = sheetOf(h); x.known = x.known || []; x.known.push(use.spell); if (h !== x && Array.isArray(h.known) && h.known.indexOf(use.spell) < 0) h.known.push(use.spell);
      env.take(id); D.sfx('magic');
      return [h.name + ' copies ' + sp0.name + ' into the spellbook. The sheet is spent.'].concat(x.prepared ? ['New spells are prepared after a long rest.'] : []);
    }
    return null;
  };
  // a short rest (RULED 10-21, lean 3: "the SRD's hit dice"): an hour; the fallen up at 1 HP, then each spends hit dice -- a die of the class and the CON modifier
  // -- till whole or out; the short rest's own uses back (js/rules.js R.refresh). A long rest gives back half the dice (H.longRest). h.hdLeft: the dice not yet spent
  H.shortRest = function (party) {
    var R = DS.R, lines = [];
    H.trail('rest', 'short rest');
    party.forEach(function (h) {
      if (h.dead) return;
      var hd = (R.CLASSES[h.cls] || {}).hd || 8, left = h.hdLeft != null ? h.hdLeft : h.lvl, got = 0, n = 0;
      if (down(h)) { h.hp = 1; h.ko = false; }
      while (h.hp < h.maxhp && left > 0) { var r = Math.max(0, D.roll('1d' + hd).total + DS.mod(h.abil.con)); h.hp = Math.min(h.maxhp, h.hp + r); got += r; left--; n++; }
      h.hdLeft = left; R.refresh(h, false);
      if (n) lines.push(h.name + ' spends ' + n + ' hit ' + (n > 1 ? 'dice' : 'die') + ' (+' + got + ' HP, ' + left + ' left)');
    });
    D.sfx('heal');
    return ['A short rest: an hour.' + (lines.length ? ' ' + lines.join('; ') + '.' : ' No one needs a die.')];
  };
  // the Light's hour (SRD 5.1: "Duration: 1 hour" -- 10-28, the grid seat on his "check how we're doing the out-of-combat casting of light": the long rest stood in for the
  // hour while the game had no clock, RULED 10-20): a Light carries `until` on THE WORLD's clock (FD.cast; one cast in a fight as it comes back, js/roam.js R.lasting), and as
  // the clock passes it, it goes out -- on the save's sheets, and on a floor's figures (B) and their sheets. The lines to say
  H.LIGHT_HOURS = 1;
  H.lightsOut = function (B) {
    var now = H.playing && H.cur ? H.clock(H.cur) : null, gone = []; if (now == null) return [];
    function out(x, name) { var l = x && x.conds && x.conds.light; if (!l || l.until == null || now < l.until - 1e-9) return; delete x.conds.light; if (name && gone.indexOf(name) < 0) gone.push(name); }
    H.cur.party.forEach(function (h) { out(h, h.name); });
    if (B && B.roam) B.roam.members.forEach(function (u) { out(u.src, u.name); out(u, u.name); });
    return gone.map(function (n) { return n + '\'s Light goes out: its hour is up.'; });
  };
  function worldEnv(scene) {
    var rec = H.cur, W = D.world;
    return { where: 'world', party: rec.party, tent: true, has: function (id) { return rec.inv.some(function (s) { return s.id === id && s.n > 0; }); }, take: function (id) { add(rec.inv, id, -1); },
      ward: function (steps) { var S = W.state(); if (S.count != null) S.count += steps / W.HEXSTEPS * 5; }, longRest: function () { return W.camp(); } };
  }
  // the field on a town floor (js/roam.js R.menuAct, in the house): the menu's sheets to the floor's figures (unitOf), the same rules
  H.fieldOnFloor = function (B, kind, a, unitOf) {
    var R0 = B.roam, RR = D.roam, c = a.h ? unitOf(a.h) || null : null, t = a.t ? unitOf(a.t) || null : null;
    var env = { where: 'floor', party: R0.members, tent: false, has: function (id) { return (B.inv || []).some(function (s) { return s.id === id && s.n > 0; }); },
      take: function (id) { var s = (B.inv || []).filter(function (x) { return x.id === id; })[0]; if (s) s.n--; }, ward: function (steps) { R0.encIn += steps * RR.RATE; }, longRest: function () { return []; } };
    if (kind === 'cast' && c && a.sp) return FD.cast(c, a.sp, t, env);
    if (kind === 'skill' && c) return FD.skill(c, a.s, t);
    if (kind === 'item' && a.id) return FD.item(a.id, c || R0.token, env);
    return null;
  };

  // the party's menu on THE WORLD (M): the one menu over the save's own sheets and pack -- ITEMS, MAGIC, SKILLS, EQUIP, STATUS and SAVE (js/menu.js; the host as the
  // Pocket DM's camp hands one, its own state), the field's rules (H.field)
  H.openMenu = function (scene) {
    var rec = H.cur, R = DS.R, figs = {};
    function figure(h, w, hh) { // (the grid's own figure in the panel and STATUS, as deep16/js/ui.js gridHost draws it; the sheet fetched the first time it is asked for)
      var lk = D.save.look ? D.save.look(h.id, null, h) : null, name = (lk && lk.sheet) || h.id + '_p0';
      if (!D.spr.has(name)) { if (D.spr.prefetch && !figs['?' + name]) { figs['?' + name] = 1; D.spr.prefetch([name]); } return null; }
      var k = name + ':' + w; if (figs[k]) return figs[k];
      var cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
      D.spr.draw(cv.getContext('2d'), name, 'idle', 0, 0, w / 2, hh < 40 ? D.spr.drawnTop(name) + 2 : D.spr.portraitY(name, 0, hh), { frame: 0 });
      return (figs[k] = cv);
    }
    scene.pm = DS.MENU.open({
      party: function () { return rec.party; },
      walker: function (h) { return figure(h, 20, 32); }, portrait: function (h) { return figure(h, 32, 48); },
      guests: function () { return []; },
      pack: function () { return rec.inv.filter(function (s) { return s.n > 0 && DS.DATA.items[s.id]; }); },
      give: function (id, n) { add(rec.inv, id, n || 1); },
      take: function (id, n) { add(rec.inv, id, -(n || 1)); },
      info: function () { var jn = D.counter && D.counter.journal(null), pq = jn && jn.quests.filter(function (q) { return q.id === jn.pin && !q.done; })[0]; return { silver: rec.silver, renown: rec.renown || 0, place: H.where(rec), time: D.world.timeOfDay(), pin: pq ? pq.name : null }; },
      journal: D.counter ? function () { return D.counter.journal(null); } : null, // (the house's JOURNAL: Winters' Errands -- js/counter.js, 10-21)
      canSave: function () { return true; },
      touch: true, // (the Light on the one it touches, asked: js/menu.js MagicPage, FD.cast)
      notes: function () { scene.pm = null; H.notes(); },
      run: function (kind, a, done) {
        var env = worldEnv(scene), lines = null;
        if (kind === 'save') { scene.pm = null; D.push(new Slots('save')); }
        else if (kind === 'cast' && a.h && a.sp) lines = FD.cast(a.h, a.sp, a.t || null, env);
        else if (kind === 'skill' && a.h) lines = FD.skill(a.h, a.s, a.t || null);
        else if (kind === 'item' && a.id) lines = FD.item(a.id, a.h || rec.party[0], env) || ['On the road a light waits for the dark: it is lit on a floor, or in a fight.'];
        if (lines && lines.length) { scene.say(lines.join(' ')); if (scene.pm && scene.pm.say) scene.pm.say(lines); }
        if (done) done();
      },
      close: function () { scene.pm = null; }
    });
  };

  // ---------------------------------------------------------------- NOTES (10-28, Griz: "build the notes button in"): the M menu's NOTES -- the Pocket DM's SITUATIONS box
  // inside the second game, so a note is written where it happened. The draft keeps across slots and loads (H.NKEY); each opening stamps a line with the day, the hour
  // and the place; SAVE writes hero_situations_feedback-<UTC>.json with the game as it stands -- a summary on top, the whole save under it (the trail in it)
  H.NKEY = 'deep16.game.notes';
  H.day = function (rec) { var t = H.clock(rec); return t != null ? Math.floor(t / 24) + 1 : 1; };
  H.atNow = function (rec) { var B = D.scenes.filter(function (s) { return s.roam && s.roam.token; })[0]; try { return B && D.roam.def ? H.atOf(B) : rec.at || {}; } catch (e) { return rec.at || {}; } }; // (where they stand now: the floor's token, else the save's)
  H.stamp = function () {
    var rec = H.cur, W = D.world, at = H.atNow(rec), sq = at.town && at.sq ? ' ' + at.sq.join(',') : '', hx = !at.town && rec.world && rec.world.at ? ' hex ' + rec.world.at.join(',') : '';
    var hr = W && W.hour ? W.hour() : null;
    return '-- day ' + H.day(rec) + (hr != null ? ' · ' + ('0' + Math.floor(hr)).slice(-2) + ':' + ('0' + Math.round((hr % 1) * 60)).slice(-2) : '') + (W && W.timeOfDay ? ' ' + W.timeOfDay() : '') + ' · ' + H.where(rec) + sq + hx + ' --';
  };
  H.summary = function (rec) {
    var W = D.world, w = rec.world || {}, jn = D.counter && D.counter.journal ? D.counter.journal(null) : null;
    return {
      slot: H.slot || null, where: H.where(rec), at: H.atNow(rec), world: { map: w.map || null, hex: w.at || null, t: H.clock(rec) },
      day: H.day(rec), hour: W && W.hour ? W.hour() : null, time: W && W.timeOfDay ? W.timeOfDay() : null, lead: rec.lead, hired: rec.hired, silver: rec.silver, renown: rec.renown || 0, steps: rec.steps || 0,
      party: rec.party.map(function (h) { return { name: h.name, cls: h.cls, lvl: h.lvl, hp: h.hp + '/' + h.maxhp, ko: !!h.ko, dead: !!h.dead, exhaustion: typeof exh === 'function' ? exh(h) : null, conds: Object.keys(h.conds || {}), slots: (h.slots || []).join('/') + ((h.slotsMax || []).length ? ' of ' + h.slotsMax.join('/') : '') }; }),
      quests: jn && jn.quests ? jn.quests.map(function (q) { return q.name + (q.done ? ' (done)' : q.id === jn.pin ? ' (pinned)' : ''); }) : null,
      screens: D.scenes.map(function (s) { return s.kind || (s.constructor && s.constructor.name) || '?'; })
    };
  };
  H.notesName = function (d) { d = d || new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return 'hero_situations_feedback-' + d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + '-' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + 'Z.json'; };
  H.notesFile = function (text) {
    var rec = H.cur;
    return { game: 'DRAGONSLEEP', kind: 'hero-situations-feedback', v: 2, from: 'the second game', at: new Date().toISOString(), notes: String(text || ''), page: location.origin + location.pathname + location.search,
      game2: rec ? H.summary(rec) : null, trail: rec ? (rec.trail || []) : [], save: rec ? JSON.parse(JSON.stringify(rec)) : null };
  };
  H.notes = function () { if (H.cur) D.push(new Notes()); };
  function Notes() {
    this.kind = 'housenotes'; this.opaque = false; this.t = 0; this.msg = null; this.el = null;
    var d = D.store.get(H.NKEY), text = d && typeof d.draft === 'string' ? d.draft : '', st = H.stamp();
    if (text.indexOf(st) < 0) text = (text.replace(/\s+$/, '') + (text.trim() ? '\n\n' : '') + st + '\n'); // (each opening its own stamp; the same place and minute, once)
    this.text = text; this.keep();
  }
  Notes.prototype.keep = function () { D.store.set(H.NKEY, { draft: this.text }); };
  Notes.prototype.box = function () { return { x: 12, y: 10, w: D.W - 24, h: D.H - 20 }; };
  Notes.prototype.btns = function () { var b = this.box(), y = b.y + b.h - 20; return [{ id: 'back', l: 'BACK', x: b.x + 8, y: y, w: 56, h: 14 }, { id: 'save', l: 'SAVE', x: b.x + b.w - 72, y: y, w: 64, h: 14 }]; };
  Notes.prototype.field = function () {
    var self = this;
    if (!this.el) {
      var el = this.el = document.createElement('textarea'), s = el.style;
      s.position = 'fixed'; s.zIndex = 30; s.font = '14px system-ui, sans-serif'; s.background = '#10123a'; s.color = '#f8f8f8'; s.border = '1px solid #6e6e98'; s.padding = '2px 4px'; s.resize = 'none'; s.boxSizing = 'border-box'; s.outline = 'none';
      el.value = this.text;
      el.addEventListener('focus', function () { D.typing = true; });
      el.addEventListener('blur', function () { D.typing = false; });
      el.addEventListener('input', function () { self.text = el.value; self.keep(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape') el.blur(); e.stopPropagation(); });
      document.body.appendChild(el);
      setTimeout(function () { try { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; el.scrollTop = el.scrollHeight; } catch (e) { /* (nothing) */ } }, 0);
    }
    var cv = D.canvas || document.querySelector('canvas'); if (!cv) return;
    var b = this.box(), r = cv.getBoundingClientRect(), k = r.width / D.W, x = b.x + 6, y = b.y + 22, w = b.w - 12, h = b.h - 48;
    this.el.style.left = Math.round(r.left + x * k) + 'px'; this.el.style.top = Math.round(r.top + y * k) + 'px'; this.el.style.width = Math.round(w * k) + 'px'; this.el.style.height = Math.round(h * k) + 'px';
  };
  Notes.prototype.drop = function () { if (this.el) { try { this.el.remove(); } catch (e) { /* (gone) */ } this.el = null; D.typing = false; } };
  Notes.prototype.exit = function () { this.drop(); };
  Notes.prototype.close = function () { this.drop(); D.sfx('cancel'); D.pop(); };
  Notes.prototype.save = function () {
    if (!this.text.replace(/^--.*--$/gm, '').trim()) { D.sfx('error'); this.msg = 'Nothing written yet: type what you noticed, then SAVE.'; return null; }
    var name = H.notesName();
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(H.notesFile(this.text), null, 1)], { type: 'application/json' }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) { D.sfx('error'); this.msg = 'Could not write the file: ' + e; return null; }
    D.sfx('confirm'); this.msg = 'Saved ' + name + ' where your browser puts downloads.';
    return name;
  };
  Notes.prototype.update = function () {
    this.t++;
    var m = I.mouse, self = this, hit = null;
    if (m.inside) this.btns().forEach(function (b) { if (m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h) hit = b; });
    this.hot = hit ? hit.id : null;
    if (m.click && hit) { if (hit.id === 'save') self.save(); else { self.close(); } return; }
    if (D.typing) return;
    if (I.pressed('b') || m.rclick) this.close();
  };
  Notes.prototype.draw = function (ctx) {
    var b = this.box(), self = this;
    ctx.fillStyle = 'rgba(4,3,10,.7)'; ctx.fillRect(0, 0, D.W, D.H);
    D.win8(ctx, b.x, b.y, b.w, b.h);
    D.text(ctx, '{y}NOTES{/}  what did you notice? the day, the hour and the place go with it', b.x + 8, b.y + 8, D.WIN8.text);
    this.btns().forEach(function (k) {
      if (self.hot === k.id) { ctx.fillStyle = D.WIN8.sel; ctx.fillRect(k.x, k.y, k.w, k.h); }
      ctx.strokeStyle = '#6e6e98'; ctx.strokeRect(k.x + 0.5, k.y + 0.5, k.w - 1, k.h - 1);
      D.text(ctx, (k.id === 'save' ? '{y}' : '') + k.l + (k.id === 'save' ? '{/}' : ''), k.x + k.w / 2, k.y + 4, D.WIN8.text, 'center');
    });
    if (this.msg) D.text(ctx, this.msg, D.W / 2, b.y + b.h - 34, '#c8d0e8', 'center');
    this.field();
  };
  H.Notes = Notes;

  // ---------------------------------------------------------------- SLOTS: three, to save into or load from
  function Slots(mode, done) { this.kind = 'houseslots'; this.mode = mode; this.done = done || null; this.i = Math.max(0, (H.slot || 1) - 1); this.msg = null; this.t = 0; this.opaque = false; }
  Slots.prototype.rows = function () { var out = []; for (var n = 1; n <= H.SLOTS; n++) out.push(H.line(n, H.read(n))); return out; };
  Slots.prototype.box = function () { var w = 300, h = 22 + H.SLOTS * 16 + 16, x = (D.W - w) / 2, y = (D.H - h) / 2; return { x: x, y: y, w: w, h: h }; };
  Slots.prototype.pick = function (i) {
    var n = i + 1, rec = H.read(n);
    if (this.mode === 'save') { var ok = H.saveTo(n); D.sfx(ok ? 'confirm' : 'error'); this.msg = ok ? 'Saved to slot ' + n + '.' : 'The save would not keep (the browser is full?).'; this.closeIn = ok ? 50 : 0; return; }
    if (!rec) { D.sfx('error'); this.msg = 'Slot ' + n + ' is empty.'; return; }
    D.sfx('confirm'); H.begin(rec, n);
  };
  Slots.prototype.update = function () {
    this.t++;
    if (this.closeIn) { if (--this.closeIn === 0) { D.pop(); if (this.done) this.done(); } return; }
    var m = I.mouse, b = this.box();
    if (I.repeat('up')) { this.i = (this.i + H.SLOTS - 1) % H.SLOTS; D.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % H.SLOTS; D.sfx('cursor'); }
    if (m.inside) for (var k = 0; k < H.SLOTS; k++) { var ry = b.y + 20 + k * 16; if (m.x >= b.x && m.x < b.x + b.w && m.y >= ry - 2 && m.y < ry + 13) { if (m.moved) this.i = k; if (m.click) { this.i = k; this.pick(k); return; } } }
    if (I.pressed('a')) { this.pick(this.i); return; }
    if (I.pressed('b') || m.rclick) { D.sfx('cancel'); D.pop(); if (this.done) this.done(); }
  };
  Slots.prototype.draw = function (ctx) {
    var b = this.box(), rows = this.rows(), self = this;
    ctx.fillStyle = 'rgba(4,3,10,.55)'; ctx.fillRect(0, 0, D.W, D.H);
    D.win8(ctx, b.x, b.y, b.w, b.h);
    D.text(ctx, '{y}' + (this.mode === 'save' ? 'SAVE WHERE?' : 'CONTINUE FROM') + '{/}', b.x + 10, b.y + 7, D.WIN8.text);
    rows.forEach(function (r, k) {
      var y = b.y + 20 + k * 16, on = k === self.i;
      if (on) { ctx.fillStyle = D.WIN8.sel; ctx.fillRect(b.x + 4, y - 2, b.w - 8, 14); }
      D.text(ctx, (on ? '> ' : '  ') + r.l, b.x + 8, y, H.read(r.n) ? D.WIN8.text : '#9c9cb4');
      if (r.r) D.text(ctx, r.r, b.x + b.w - 8, y, '#c8d0e8', 'right');
    });
    if (this.msg) D.text(ctx, '{y}' + this.msg + '{/}', D.W / 2, b.y + b.h - 12, D.WIN8.text, 'center');
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 17, D.W, 17); // (its own line over the screen's)
    D.hint(ctx, 'up/down choose · E ' + (this.mode === 'save' ? 'save here' : 'load') + ' · X back', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  H.Slots = Slots;

  // ---------------------------------------------------------------- the title (deep16/ with no query: js/main.js)
  var ROWS = [['NEW GAME', 'new'], ['CONTINUE', 'load'], ['OPTIONS', 'options'], ['THE POCKET DM', 'pocket'], ['THE FIRST GAME', 'first']];
  function Title(o) { this.kind = 'housetitle'; this.opaque = true; this.t = 0; this.i = 0; this.pm = null; this.lost = !!(o && o.lost); this.stars = []; for (var k = 0; k < 90; k++) this.stars.push([D.rint(D.W), D.rint(150), D.rint(3)]); }
  Title.prototype.enter = function () { try { D.music('title'); } catch (e) { } H.playing = false; this.any = [1, 2, 3].some(function (n) { return !!H.read(n); }); if (!this.any && this.i === 1) this.i = 0; };
  Title.prototype.go = function (v) {
    var self = this;
    if (v === 'new') { D.sfx('confirm'); if (D.company) { D.scenes.length = 0; D.push(D.company.pick()); } else H.begin(H.fresh(), 0); } // (CHOOSE WHO YOU ARE, the first game's lead pick: js/company.js)
    else if (v === 'load') { if (!this.any) { D.sfx('error'); return; } D.sfx('confirm'); D.push(new Slots('load')); }
    else if (v === 'options') { if (!DS.MENU || !DS.MENU.openOptions) return; D.sfx('confirm'); this.pm = DS.MENU.openOptions({ close: function () { self.pm = null; } }); }
    else if (v === 'pocket') location.href = '?pocket';
    else if (v === 'first') location.href = '../';
  };
  Title.prototype.update = function () {
    this.t++;
    if (this.pm) { this.pm.update(D.ui.menuKeys()); if (this.pm && this.pm.closed) this.pm = null; return; }
    var m = I.mouse;
    if (I.repeat('up')) { this.i = (this.i + ROWS.length - 1) % ROWS.length; D.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % ROWS.length; D.sfx('cursor'); }
    if (m.inside) for (var k = 0; k < ROWS.length; k++) { var ry = 150 + k * 16; if (m.x >= D.W / 2 - 70 && m.x < D.W / 2 + 70 && m.y >= ry - 3 && m.y < ry + 12) { if (m.moved) this.i = k; if (m.click) { this.i = k; this.go(ROWS[k][1]); return; } } }
    if (I.pressed('a')) this.go(ROWS[this.i][1]);
  };
  Title.prototype.draw = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#05061a'); g.addColorStop(0.62, '#1b2240'); g.addColorStop(1, '#3a2a30'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    var t = this.t; this.stars.forEach(function (s) { ctx.fillStyle = (t + s[0]) % (60 + s[2] * 20) < 4 ? '#ffffff' : s[2] ? '#8890c0' : '#c8d0f0'; ctx.fillRect(s[0], s[1], 1, 1); });
    ctx.fillStyle = '#0c0d18'; ctx.beginPath(); ctx.moveTo(0, D.H); ctx.lineTo(0, 205); ctx.lineTo(70, 182); ctx.lineTo(130, 198); ctx.lineTo(210, 170); ctx.lineTo(290, 192); ctx.lineTo(360, 176); ctx.lineTo(430, 196); ctx.lineTo(D.W, 186); ctx.lineTo(D.W, D.H); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(D.W / 2, 36); ctx.scale(4, 4); D.text(ctx, 'DRAGONSLEEP', 0, 0, '#f8d878', 'center'); ctx.restore();
    D.text(ctx, '16-BIT', D.W / 2, 82, '#c8d0e8', 'center');
    if (this.lost) D.text(ctx, '{r}The road took them. The last save stands.{/}', D.W / 2, 104, '#f8f8f8', 'center');
    var self = this;
    ROWS.forEach(function (r, k) {
      var y = 150 + k * 16, on = k === self.i, dim = r[1] === 'load' && !self.any;
      if (on) { ctx.fillStyle = 'rgba(38,32,106,.85)'; ctx.fillRect(D.W / 2 - 70, y - 3, 140, 14); }
      D.text(ctx, (on ? '> ' : '') + r[0], D.W / 2, y, dim ? '#6c6c84' : on ? '#f8d878' : '#f8f8f8', 'center');
    });
    D.hint(ctx, 'up/down choose · E go', D.W / 2, D.H - 12, '#9a96a8', 'center');
    if (this.pm) { ctx.fillStyle = 'rgba(4,3,10,.6)'; ctx.fillRect(0, 0, D.W, D.H); D.ui.drawMenu(ctx, this.pm); }
  };
  H.Title = Title;
})();
