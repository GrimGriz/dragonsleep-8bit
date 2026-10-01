/* DEEP16 bench (dev/, gitignored; handoff-2026-09-28-npc-classes-to-six.md §3D): fights class NPCs off-screen, many times, and
   writes a table. Loaded by dev/bench16.html (made by dev/bench16.py with DEEP16's own script list) in headless Edge:
   the whole fight runs as the coroutine, every wait skipped, nothing drawn. Query: foes=cleric:5,fighter:5 (words as
   js/classes.js NPC.spec reads them) · vs=wizard:5 (a band instead of the four) · lvl=5 · n=20 · seed=1 · log=1 (one
   fight's log) */
'use strict';
(function () {
  var D = window.D16, q = location.search;
  function get(k, d) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : d; }
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  D.PACE = +get('pace', 1); // (10-01: the pace is for people watching -- the AI's waits and message times, battle.js Battle.prototype.pace; this drives the coroutine and never waits, so it is unaffected either way: pace=1.5 in the query proves it; 1 by default)
  var L = +get('lvl', 5), n = +get('n', 10), seed0 = +get('seed', 1), foes = get('foes', 'fighter').split(','), vs = get('vs', ''), wantLog = get('log', '');
  var errs = [], stats = { won: 0, lost: 0, other: 0, rounds: 0, dealt: {}, taken: {}, casts: {}, down: {}, fights: [] };
  var M = D.magic, B0 = D.Battle.prototype, hurt0 = B0.hurt, cast0 = M.cast;
  // who dealt it: the unit whose turn it is (an opportunity attack or a reaction counts to the one acting: near enough)
  B0.hurt = function (u, amt, type) {
    var before = u.hp + (u.temp || 0), r = hurt0.apply(this, arguments), got = Math.max(0, before - (u.hp + (u.temp || 0)));
    var a = this.active;
    if (a && got) stats.dealt[a.name] = (stats.dealt[a.name] || 0) + got;
    if (got) stats.taken[u.name] = (stats.taken[u.name] || 0) + got;
    if (u.hp <= 0 && before > 0) stats.down[u.name] = (stats.down[u.name] || 0) + 1;
    return r;
  };
  M.cast = function (B, u, id, slot, t) { var k = u.name + ' ' + id; stats.casts[k] = (stats.casts[k] || 0) + 1; return cast0.apply(this, arguments); };
  function drive(B) {
    var v, guard = 0;
    while (B.co && guard++ < 400000) {
      var r;
      try { r = B.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 600)); return 'error'; }
      v = undefined;
      if (r.done) break;
      var y = r.value;
      if (typeof y === 'number' || !y) continue;
      if (y.fx || y.entry || y.scene) continue;
      if (y.prompt) { var o = y.prompt.opts; v = o[0].value; continue; }
      if (y.turn) { v = { do: 'end' }; continue; }
    }
    if (B.round > 200) return 'stalled';
    return B.result || (guard >= 400000 ? 'stalled' : 'none');
  }
  // the factors (09-28g, Griz: "is the ease a gear issue, AI issue, or 5v4 issue?"): plain=1 takes the four's quest weapons back to
  // their plain ones and Barley's splint off; avghp=1 gives them the SRD's average HP (the NPCs' rule) in place of a max die a level
  if (get('plain', '') || get('avghp', '')) {
    var fxp = D.save.fixture;
    D.save.fixture = function (L3, o3) {
      var d3 = fxp(L3, o3), R3 = window.DS.R, BASE = { barley: 'threshingflail', aurdin: 'quarterstaff', vivian: 'candleknife', lymen: 'longsword' };
      d3.party.forEach(function (h) {
        if (get('plain', '')) { h.equip.weapon = BASE[h.id] || h.equip.weapon; if (h.id === 'barley') h.equip.armor = null; }
        if (get('avghp', '')) { var c3 = R3.CLASSES[h.cls], con = window.DS.mod(h.abil.con), avg = c3.hd + con + (h.lvl - 1) * (c3.hd / 2 + 1 + con); h.maxhp = h.hp = avg; }
      });
      return d3;
    };
  }
  // guests as the 8-bit game makes them (js/deep.js EV.addGuest): guests=ingrith,pyro
  var gl = get('guests', '');
  if (gl) { var fx0 = D.save.fixture; D.save.fixture = function (L2, o2) { var d0 = fx0(L2, o2); d0.guests = gl.split(',').map(function (id) { var R = window.DS.R, dd = window.DS.DATA.heroes[id], h = R.makeHero(id, dd.level); h.attacks = dd.attacks; h.resist = dd.resist; h.guest = true; h.surgeAI = !!dd.surgeAI; if (dd.healer) { h.healer = dd.healer; h.feats.heals = dd.healer; } h.key = id; return h; }); return d0; }; }
  // the matrix (mode=matrix&lvl=3&n=10): every class against every class, one on one, and every class as a band of four against the
  // four, at one level, in one page (thousands of fights off-screen): the table the handoff asked for (§3D)
  if (get('mode', '') === 'matrix') {
    var CL = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
    var res = { lvl: L, n: n, duel: {}, band: {}, rounds: {}, errors: [] };
    function one(o, seed) {
      D.seed = seed; D.lastError = null;
      var B2 = new D.Battle(Object.assign({ bench: true, fightDef: D.classFight(L) }, o));
      D.battle = B2; B2.enter();
      var r2 = drive(B2);
      if (D.lastError && res.errors.length < 5) res.errors.push(String(D.lastError.stack || D.lastError).slice(0, 300));
      return { r: r2, rounds: B2.round };
    }
    CL.forEach(function (a, i) {
      CL.forEach(function (b, j) {
        if (j <= i) return;
        var aw = 0, bw = 0, rr = 0;
        for (var k = 0; k < n; k++) { var x = one({ npc: { party: [a + ':' + L], foes: [b + ':' + L] } }, 1000 + i * 97 + j * 13 + k * 7919); if (x.r === 'won') aw++; else if (x.r === 'lost') bw++; rr += x.rounds; }
        res.duel[a + '>' + b] = [aw, bw]; res.rounds[a + '>' + b] = +(rr / n).toFixed(1);
      });
      var bw2 = 0, br = 0;
      for (var k2 = 0; k2 < n; k2++) { var y = one({ npc: { foes: [a + ':' + L, a + ':' + L, a + ':' + L, a + ':' + L] } }, 5000 + i * 131 + k2 * 7919); if (y.r === 'lost') bw2++; br += y.rounds; }
      res.band[a] = [bw2, n - bw2, +(br / n).toFixed(1)];
    });
    var pre0 = document.createElement('pre'); pre0.id = 'out'; pre0.textContent = 'BENCH16 ' + JSON.stringify(res);
    document.body.appendChild(pre0);
    return;
  }
  // every spell once (mode=spells): a caster that knows only it, full slots, at the target its own weighing picks (or a plain one for its
  // shape); anything thrown is reported. The proof a spell runs, not that it is chosen
  if (get('mode', '') === 'spells') {
    var rep = { ok: [], none: [], errors: [] }, ids = Object.keys(D.SPELLS);
    ids.forEach(function (id, ix) {
      var g = D.magic.geo(id), sp = D.magic.data(id);
      if (!sp || g.shape === 'none' || g.shape === 'reaction') { rep.none.push(id); return; }
      D.seed = 77 + ix; D.lastError = null;
      // (10-01b: the list greys a spell with no creature it may take -- magic.js M.noTarget -- so a touch attack stands its caster beside
      // the foe, and a spell for beasts alone gets one to take it; before, they were cast at a fighter 10 ft off and never asked)
      var near = /^(attack|single)$/.test(g.shape) && (g.range || 5) <= 5, beast = g.only === 'beast';
      var B3 = new D.Battle({ bench: true, npc: { party: ['wizard:9', 'fighter:9'], foes: beast ? ['wolf', 'cleric:9'] : ['fighter:9', 'cleric:9'] }, fightDef: D.classFight(9) });
      try {
        D.battle = B3; B3.enter();
        var r0 = B3.co.next(); // (the entry card)
        B3.round = 1;
        var u = B3.units.filter(function (w) { return w.side === 'party'; })[0], mate = B3.units.filter(function (w) { return w.side === 'party' && w !== u; })[0];
        var foes3 = B3.units.filter(function (w) { return w.side === 'foe'; });
        u.known = [id]; u.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; u.slotsMax = u.slots.slice(); u.cls = sp.level === 0 && /sacred|guidance|resistance/.test(id) ? 'cleric' : u.cls;
        // stand them close: the caster two squares from the first foe, the mate beside him
        u.x = foes3[0].x; u.y = foes3[0].y + (near ? 1 : 2); if (!D.grid.canStand(u, u.x, u.y)) u.y += near ? 0 : 1; mate.x = u.x + 1; mate.y = u.y; mate.hp = Math.floor(mate.maxhp / 3);
        D.rules.startTurn(u);
        var e = D.magic.list(B3, u)[0];
        if (!e || !e.ok) { rep.errors.push(id + ': not castable (' + (e ? e.why : 'no entry') + ')'); return; }
        var ev = (D.magic.EFFECT[id] && D.magic.EFFECT[id].ai) || D.tactics.EVAL[id] || D.tactics.EVAL['shape:' + e.g.shape], t = null;
        var fs3 = D.tactics.foesOf(B3, u), al3 = D.tactics.alliesOf(B3, u);
        var pick = ev ? ev(B3, u, e, e.slot, fs3, al3) : null;
        t = pick && pick.t;
        if (!t) t = e.g.shape === 'self' ? u : /touch|allies/.test(e.g.shape) || e.g.side === 'ally' ? (e.g.shape === 'allies' ? { units: [u, mate] } : mate.x ? (D.grid.dist(u, mate) <= 5 ? mate : u) : u) : /sphere|cube|cone|line|wave|teleport/.test(e.g.shape) ? { x: foes3[0].x, y: foes3[0].y } : /rays|darts/.test(e.g.shape) ? { units: [foes3[0]] } : foes3[0];
        var n0 = (B3.log || []).length;
        B3.co = (function* () { yield* B3.exec(u, { do: 'cast', id: id, slot: e.slot, target: t }); })();
        var guard = 0, v;
        while (B3.co && guard++ < 2000) { var rr = B3.co.next(v); v = undefined; if (rr.done) break; var y0 = rr.value; if (y0 && y0.prompt) v = y0.prompt.opts[0].value; }
        if (D.lastError) rep.errors.push(id + ': ' + String(D.lastError.stack || D.lastError).slice(0, 300));
        else rep.ok.push(id + ' :: ' + ((B3.log || []).slice(n0).join(' / ') || '(nothing said)').slice(0, 160));
      } catch (err) { rep.errors.push(id + ': ' + String(err && err.stack || err).slice(0, 400)); }
    });
    var pre1 = document.createElement('pre'); pre1.id = 'out'; pre1.textContent = 'BENCH16 ' + JSON.stringify(rep);
    document.body.appendChild(pre1);
    return;
  }
  // the 8-bit game's pack and gear on the grid (mode=items; 09-28g, Griz: "make sure items are being loaded into the 16bit fights"):
  // the four walk in as the seam hands them (the Winnower, the Greyseam knife, the Door-Shield, the Sunshaft staff; a pack of the
  // pie, the elixir, potions, oil, torches), the Door-Shield's chance forced to 1; the AI fights n fights and the log is counted
  if (get('mode', '') === 'items') {
    var R = window.DS.R, rep2 = { checks: [], counts: {}, errors: [] };
    window.DS.doorWardChance = +get('ward', 1);
    function chk(what, ok) { rep2.checks.push((ok ? 'ok   ' : 'FAIL ') + what); }
    for (var k2 = 0; k2 < n; k2++) {
      D.seed = seed0 * 7919 + k2 * 104729; D.lastError = null;
      var data = D.save.fixture(L);
      data.party.forEach(function (h) { if (h.id === 'barley') h.equip.weapon = 'winnower'; if (h.id === 'vivian') h.equip.weapon = 'greyseamknife'; if (h.id === 'lymen') h.equip.shield = 'doorshield'; if (h.id === 'aurdin') h.equip.weapon = 'sunshaftstaff'; });
      data.inv = [{ id: 'batpie', n: 2 }, { id: 'elixir', n: 1 }, { id: 'potion', n: 3 }, { id: 'oil', n: 2 }, { id: 'torch', n: 2 }];
      var B4;
      try { B4 = new D.Battle({ embed: { canRun: true }, data: data, npc: { foes: foes }, fightDef: D.classFight(L) }); D.battle = B4; B4.enter(); }
      catch (e4) { rep2.errors.push('enter: ' + String(e4 && e4.stack || e4).slice(0, 500)); break; }
      var P = {}; B4.units.forEach(function (u) { if (u.side === 'party') { P[u.id] = u; u.guest = true; u.classAI = true; } });
      if (k2 === 0) {
        chk('the pack came in: ' + B4.inv.map(function (s) { return s.id + ' ' + s.n; }).join(', '), B4.inv.length === 5 && !B4.inv.some(function (s) { return s.id === 'bolts'; }));
        chk('Barley swings the ' + P.barley.weapon.name + ' (onCrit ' + P.barley.weapon.onCrit + ', +' + (P.barley.weapon.atk) + ')', P.barley.weapon.onCrit === 'prone');
        chk('Vivian\'s ' + P.vivian.weapon.name + ' poisons at DC ' + P.vivian.weapon.sneakPoison, P.vivian.weapon.sneakPoison === 13);
        chk('Aurdin\'s staff: spell DC ' + P.aurdin.spellDC + ' (the +1)', P.aurdin.spellDC === R.spellDC(data.party[1]));
        D.rules.startTurn(P.barley);
        var il = B4.itemList(P.barley).map(function (x) { return x.id + (x.ok ? '' : '(no)'); });
        chk('Barley\'s ITEM list: ' + il.join(', '), il.indexOf('batpie') >= 0 && il.indexOf('elixir') >= 0 && il.indexOf('potion') >= 0);
        var mx0 = P.barley.maxhp, it = B4.useItem(P.barley, 'batpie', P.barley), g0 = 0; while (!it.next().done && g0++ < 50) { }
        chk('the pie: max HP ' + mx0 + ' -> ' + P.barley.maxhp + ', fortified ' + !!P.barley.fortified, P.barley.maxhp === mx0 + 5 && P.barley.fortified);
        P.vivian.conds.paralyzed = true; P.vivian.conds.poisoned = true; D.rules.startTurn(P.lymen);
        var it2 = B4.useItem(P.lymen, 'elixir', P.vivian); g0 = 0; while (!it2.next().done && g0++ < 50) { }
        chk('the elixir: paralyzed ' + !!P.vivian.conds.paralyzed + ', poisoned ' + !!P.vivian.conds.poisoned, !P.vivian.conds.paralyzed && !P.vivian.conds.poisoned);
        // the Door-Shield's ward, called as a miss at Lymen calls it: +3 on the party's AC till Lymen's turn
        var ac0 = D.rules.ac(P.aurdin); B4.doorWard(P.lymen); var ac1 = D.rules.ac(P.aurdin); D.rules.startTurn(P.lymen); var ac2 = D.rules.ac(P.aurdin);
        chk('the Door-Shield: Aurdin AC ' + ac0 + ' -> ' + ac1 + ' -> ' + ac2 + ' at Lymen\'s turn', ac1 === ac0 + 3 && ac2 === ac0);
        // the Greyseam knife: Vivian beside a foe with Barley on its other side (Sneak Attack), swinging till a hit lands
        var f0 = B4.units.filter(function (w) { return w.side === 'foe'; })[0], seen = false;
        P.vivian.x = f0.x - 1; P.vivian.y = f0.y; P.barley.x = f0.x + 1; P.barley.y = f0.y;
        for (var tries = 0; tries < 40 && !seen && f0.hp > 0; tries++) {
          D.rules.startTurn(P.vivian); delete f0.conds.poisoned; f0.hp = f0.maxhp; var n0 = (B4.log || []).length;
          var ag = B4.attack(P.vivian, f0, P.vivian.weapon, {}), gg = 0, vv; while (gg++ < 200) { var st = ag.next(vv); vv = undefined; if (st.done) break; if (st.value && st.value.prompt) vv = st.value.prompt.opts[0].value; }
          seen = (B4.log || []).slice(n0).some(function (l) { return String(l).indexOf('the greyseam') >= 0; });
        }
        chk('the Greyseam knife\'s sneak attack asked for the CON save (' + tries + ' swings)', seen);
        P.vivian.hp = P.vivian.maxhp; P.barley.hp = P.barley.maxhp;
      }
      var res4 = drive(B4);
      if (D.lastError) rep2.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
      (B4.log || []).forEach(function (l) { [['protects the party', 'door ward'], ['threshed flat', 'winnower prone'], ['the greyseam', 'greyseam save'], ['POISONED', 'poisoned']].forEach(function (p) { if (String(l).indexOf(p[0]) >= 0) rep2.counts[p[1]] = (rep2.counts[p[1]] || 0) + 1; }); });
      rep2.counts[res4] = (rep2.counts[res4] || 0) + 1;
      if (k2 === 0 && get('log', '')) rep2.log = (B4.log || []).map(String).filter(function (l) { return /Lymen|Vivian/.test(l); }).slice(0, 80);
    }
    rep2.errors = rep2.errors.concat(errs);
    var pre2 = document.createElement('pre'); pre2.id = 'out'; pre2.textContent = 'BENCH16 ' + JSON.stringify(rep2);
    document.body.appendChild(pre2);
    return;
  }
  // the hooded lantern (mode=lantern; 09-29): walked in on a dark fight, hood down and up, set down, taken up, doused and relit from the
  // pack; then under the roost: hooded on entry, HOOD UP refused, a torch refused, a lantern lit hood down, the hood forced up breaks it
  if (get('mode', '') === 'lantern') {
    var rep4 = { checks: [], errors: [] }, Lt = D.light;
    function ok4(what, v) { rep4.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function run4(g) { var v, k = 0; while (g && k++ < 500) { var st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    var OURS = ['talmok:8', 'willem:8', 'katarina:8', 'torvald:8'];
    function mk(fid, o) { var Bx = new D.Battle(Object.assign({ ladder: true, fight: fid, bench: true, npc: { party: OURS, foes: [] } }, o)); D.battle = Bx; Bx.enter(); Bx.units.forEach(function (u) { if (u.side === 'party') u.guest = false; }); return Bx; }
    function who(Bx, re) { return Bx.units.filter(function (u) { return u.side === 'party' && re.test(u.id); })[0]; }
    try {
      // (Talmok: his fists leave both hands free; Torvald's mace and shield leave none, as the camp says)
      var B6 = mk(get('fight', 'trolls'), { torch: 'p0-talmok', torchKind: 'lantern' }), tv = who(B6, /talmok/);
      ok4('a dark fight (' + B6.fight.name + '): ' + B6.dark, B6.dark);
      ok4('Talmok walks in with a lantern: ' + JSON.stringify(tv.torch), !!(tv.torch && tv.torch.kind === 'lantern' && !tv.torch.hood));
      var c0 = Lt.carried(tv)[0]; ok4('its light: bright ' + c0.bright + ', dim ' + c0.dim + ', kind ' + c0.kind, c0.bright === 30 && c0.dim === 30 && c0.kind === 'lantern');
      ok4('bright where he stands: ' + Lt.name(Lt.levelAt(B6, tv.x, tv.y)), Lt.levelAt(B6, tv.x, tv.y) === 2);
      D.rules.startTurn(tv); var ids = B6.commands(tv).map(function (c) { return c.id; });
      ok4('the wheel: ' + ids.filter(function (i) { return /hood|torch/.test(i); }).join(','), ids.indexOf('hooddown') >= 0 && ids.indexOf('droptorch') >= 0 && ids.indexOf('dousetorch') >= 0 && ids.indexOf('throwtorch') < 0 && ids.indexOf('hoodup') < 0);
      run4(B6.exec(tv, { do: 'hooddown' })); var c1 = Lt.carried(tv)[0];
      ok4('HOOD DOWN: bright ' + c1.bright + ', dim ' + c1.dim + ', ' + Lt.name(Lt.levelAt(B6, tv.x, tv.y)) + ' where he stands; the free object spent ' + tv.turn.freeObj, c1.bright === 0 && c1.dim === 5 && Lt.levelAt(B6, tv.x, tv.y) === 1 && tv.turn.freeObj);
      ok4('a square 10 ft off is dark: ' + Lt.name(Lt.levelAt(B6, tv.x, tv.y - 2)), Lt.levelAt(B6, tv.x, tv.y - 2) === 0);
      D.rules.startTurn(tv); var ids2 = B6.commands(tv).map(function (c) { return c.id; });
      ok4('hooded, the wheel offers HOOD UP not HOOD DOWN', ids2.indexOf('hoodup') >= 0 && ids2.indexOf('hooddown') < 0);
      run4(B6.exec(tv, { do: 'hoodup' })); ok4('HOOD UP: bright ' + Lt.carried(tv)[0].bright + ' again', Lt.carried(tv)[0].bright === 30);
      D.rules.startTurn(tv); run4(B6.exec(tv, { do: 'droptorch' })); var fl = Lt.torchAt(B6, tv.x, tv.y);
      ok4('SET DOWN: on the floor a ' + (fl && fl.kind) + ' (bright ' + (fl && fl.bright) + '), the hand empty ' + !tv.torch, !!(fl && fl.kind === 'lantern' && fl.bright === 30 && !tv.torch));
      D.rules.startTurn(tv); var ids3 = B6.commands(tv).filter(function (c) { return c.id === 'pickuptorch'; })[0];
      ok4('the wheel offers ' + (ids3 && ids3.label), !!(ids3 && /LANTERN/.test(ids3.label)));
      run4(B6.exec(tv, { do: 'pickuptorch' })); ok4('TAKE UP: ' + JSON.stringify(tv.torch) + ', the floor clear ' + !Lt.torchAt(B6, tv.x, tv.y), !!(tv.torch && tv.torch.kind === 'lantern' && !Lt.torchAt(B6, tv.x, tv.y)));
      D.rules.startTurn(tv); run4(B6.exec(tv, { do: 'dousetorch' })); var pk = (B6.inv || []).filter(function (s) { return s.id === 'lantern'; })[0];
      ok4('DOUSE: back in the pack x' + (pk ? pk.n : 0) + ', the hand empty ' + !tv.torch, !!(pk && pk.n >= 1 && !tv.torch));
      D.rules.startTurn(tv); var il = B6.itemList(tv).filter(function (x) { return x.id === 'lantern'; })[0];
      ok4('ITEM lists the lantern: ' + (il ? (il.ok ? 'ok, cost ' + il.cost : il.why) : 'missing'), !!(il && il.ok));
      run4(B6.useItem(tv, 'lantern')); ok4('lit again from the pack: ' + JSON.stringify(tv.torch) + ', the action spent ' + !tv.turn.action, !!(tv.torch && tv.torch.kind === 'lantern' && !tv.torch.hood && !tv.turn.action));
      var sleet = Lt.douseIn(B6, D.grid.foot(tv)); ok4('sleet over him puts out: ' + (sleet.join(', ') || 'nothing') + ' (a lantern burns on)', !sleet.length && !!tv.torch);
      // under the roost
      var B7 = mk('rescue', { torch: 'p0-talmok', torchKind: 'lantern' }), tv7 = who(B7, /talmok/), tk7 = who(B7, /willem/);
      ok4('the roost fight: ' + !!(B7.fight && B7.fight.roost) + ', dark ' + B7.dark, !!(B7.fight && B7.fight.roost));
      ok4('walked in hooded: ' + JSON.stringify(tv7.torch) + ', the roost unbroken ' + !B7.roostBroken, !!(tv7.torch && tv7.torch.hood && !B7.roostBroken));
      D.rules.startTurn(tv7); var hu = B7.commands(tv7).filter(function (c) { return c.id === 'hoodup'; })[0];
      ok4('HOOD UP refused: ' + (hu ? hu.ok + ' (' + hu.why + ')' : 'no row'), !!(hu && !hu.ok));
      var ct = Lt.canLight(B7, tk7, 'torch'); ok4('Willem may not light a torch: ' + ct.why, !ct.ok);
      B7.inv = (B7.inv || []).concat([{ id: 'lantern', n: 1 }]); var cl = Lt.canLight(B7, tk7, 'lantern'); ok4('but may light a lantern: ' + cl.ok + ' ' + cl.why, cl.ok);
      D.rules.startTurn(tk7); var il7 = B7.itemList(tk7).filter(function (x) { return x.id === 'lantern'; })[0];
      ok4('ITEM under the roost: the lantern ' + (il7 ? (il7.ok ? 'ok' : il7.why) : 'missing'), !!(il7 && il7.ok));
      run4(B7.useItem(tk7, 'lantern')); ok4('Willem lights it hood down: ' + JSON.stringify(tk7.torch) + ', the roost still asleep ' + !B7.roostBroken + ', ' + Lt.name(Lt.levelAt(B7, tk7.x, tk7.y)) + ' at his feet', !!(tk7.torch && tk7.torch.hood && !B7.roostBroken && Lt.levelAt(B7, tk7.x, tk7.y) === 1));
      run4(Lt.hood(B7, tk7, false)); ok4('the hood forced up under the roost: roostBroken=' + B7.roostBroken, !!B7.roostBroken);
    } catch (e6) { rep4.errors.push(String(e6 && e6.stack || e6).slice(0, 700)); }
    if (D.lastError) rep4.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var pre4 = document.createElement('pre'); pre4.id = 'out'; pre4.textContent = 'BENCH16 ' + JSON.stringify(rep4);
    document.body.appendChild(pre4);
    return;
  }
  // the Ledger-Lamp as a lantern, but better (mode=ledgerlamp; RULED 09-30, Griz: "now should function like a lantern but better" -- "3 perfect"):
  // the lantern's twin at bright 40 and dim 40 -- walked in, hood down and up, set down, taken up, doused into the pack, lit from the pack, under
  // the roost; then the seam (embed.js says 'ledgerlamp'; a lamp set down and left is handed back), a bearer who cannot take it up, and the camp
  if (get('mode', '') === 'ledgerlamp') {
    var repP = { checks: [], errors: [] }, LtP = D.light;
    function okP(what, v) { repP.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runP(g) { var v, k = 0; while (g && k++ < 500) { var st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    var OURSP = ['talmok:8', 'willem:8', 'katarina:8', 'torvald:8'];
    function mkP(fid, o) { var Bx = new D.Battle(Object.assign({ ladder: true, fight: fid, bench: true, npc: { party: OURSP, foes: [] } }, o)); D.battle = Bx; Bx.enter(); Bx.units.forEach(function (u) { if (u.side === 'party') u.guest = false; }); return Bx; }
    function whoP(Bx, re) { return Bx.units.filter(function (u) { return u.side === 'party' && re.test(u.id); })[0]; }
    function packP(Bx, id) { var s = (Bx.inv || []).filter(function (x) { return x.id === id; })[0]; return s ? s.n : 0; }
    // the seam's report: D.embed.done sends to window.parent; catch it there
    function seamP(Bx) {
      var got = null, real = Object.getOwnPropertyDescriptor(window, 'parent');
      try { Object.defineProperty(window, 'parent', { value: { postMessage: function (m) { got = m; } }, configurable: true }); } catch (eS) { return { fail: 'cannot catch the seam: ' + eS }; }
      try { D.embed.done(Bx, 'won'); } finally { if (real) Object.defineProperty(window, 'parent', real); else delete window.parent; }
      return got || { fail: 'nothing sent' };
    }
    try {
      var PACKS = window.DS.DATA.items;
      okP('the record: ' + JSON.stringify(PACKS.ledgerlamp.light) + ', use ' + PACKS.ledgerlamp.use.effect + ' battle ' + PACKS.ledgerlamp.use.battle + ', kind ' + PACKS.ledgerlamp.kind, PACKS.ledgerlamp.light.bright === 40 && PACKS.ledgerlamp.light.dim === 40 && PACKS.ledgerlamp.light.hood.dim === 5 && PACKS.ledgerlamp.use.battle === true);
      okP('a hooded light by the data: lantern ' + LtP.isLantern('lantern') + ', ledgerlamp ' + LtP.isLantern('ledgerlamp') + ', torch ' + LtP.isLantern('torch') + ', potion ' + LtP.isLantern('potion'), LtP.isLantern('lantern') && LtP.isLantern('ledgerlamp') && !LtP.isLantern('torch') && !LtP.isLantern('potion'));
      var wLan = D.textWidth(LtP.blurb('lantern')), wLamp = D.textWidth(LtP.blurb('ledgerlamp'));
      okP('the ITEM list\'s line under the lamp fits as the lantern\'s does: ' + wLamp + ' px against ' + wLan + ' (the panel is ' + (D.W - 12) + ' wide): "' + LtP.blurb('ledgerlamp') + '"', wLamp <= Math.max(wLan, D.W - 12));
      // (Talmok: his fists leave both hands free)
      var BP = mkP(get('fight', 'trolls'), { torch: 'p0-talmok', torchKind: 'ledgerlamp' }), tp = whoP(BP, /talmok/);
      okP('a dark fight (' + BP.fight.name + '): ' + BP.dark, BP.dark);
      okP('Talmok walks in with the Ledger-Lamp: ' + JSON.stringify(tp.torch), !!(tp.torch && tp.torch.kind === 'lantern' && tp.torch.item === 'ledgerlamp' && !tp.torch.hood));
      var cP = LtP.carried(tp)[0]; okP('its light: bright ' + cP.bright + ', dim ' + cP.dim + ', kind ' + cP.kind, cP.bright === 40 && cP.dim === 40 && cP.kind === 'lantern');
      okP('bright where he stands: ' + LtP.name(LtP.levelAt(BP, tp.x, tp.y)), LtP.levelAt(BP, tp.x, tp.y) === 2);
      // a square between 30 and 40 ft off, in his sight: bright under the lamp, only dim under the lantern
      var far = null; for (var dy = -8; dy <= 8 && !far; dy++) for (var dx = -8; dx <= 8 && !far; dx++) { var dd = Math.hypot(dx, dy) * 5, sq = BP.map.at(tp.x + dx, tp.y + dy); if (dd > 31 && dd <= 40 && sq && sq.open && D.grid.losPoint(tp.x, tp.y, tp.x + dx, tp.y + dy)) far = [tp.x + dx, tp.y + dy, dd]; }
      okP('a square ' + (far ? far[2].toFixed(1) : '?') + ' ft off (past the lantern\'s 30): ' + (far ? LtP.name(LtP.levelAt(BP, far[0], far[1])) : 'none open in sight'), !!far && LtP.levelAt(BP, far[0], far[1]) === 2);
      D.rules.startTurn(tp); var idsP = BP.commands(tp), idP = idsP.map(function (c) { return c.id; });
      okP('the wheel: ' + idsP.filter(function (c) { return /hood|torch/.test(c.id); }).map(function (c) { return c.label; }).join(', '), idP.indexOf('hooddown') >= 0 && idP.indexOf('droptorch') >= 0 && idP.indexOf('dousetorch') >= 0 && idP.indexOf('throwtorch') < 0 && idP.indexOf('hoodup') < 0 && idsP.some(function (c) { return c.label === 'SET DOWN LAMP'; }) && idsP.some(function (c) { return c.label === 'DOUSE LAMP'; }));
      runP(BP.exec(tp, { do: 'hooddown' })); var c1P = LtP.carried(tp)[0];
      okP('HOOD DOWN: bright ' + c1P.bright + ', dim ' + c1P.dim + ', ' + LtP.name(LtP.levelAt(BP, tp.x, tp.y)) + ' where he stands; the free object spent ' + tp.turn.freeObj, c1P.bright === 0 && c1P.dim === 5 && LtP.levelAt(BP, tp.x, tp.y) === 1 && tp.turn.freeObj);
      okP('a square 10 ft off is dark: ' + LtP.name(LtP.levelAt(BP, tp.x, tp.y - 2)), LtP.levelAt(BP, tp.x, tp.y - 2) === 0);
      D.rules.startTurn(tp); var hu2 = BP.commands(tp).filter(function (c) { return c.id === 'hoodup'; })[0];
      okP('hooded, the wheel offers HOOD UP: ' + (hu2 && hu2.note), !!hu2 && /bright 40 ft and dim 40 more/.test(hu2.note) && !BP.commands(tp).some(function (c) { return c.id === 'hooddown'; }));
      runP(BP.exec(tp, { do: 'hoodup' })); okP('HOOD UP: bright ' + LtP.carried(tp)[0].bright + ' again, dim ' + LtP.carried(tp)[0].dim, LtP.carried(tp)[0].bright === 40 && LtP.carried(tp)[0].dim === 40);
      D.rules.startTurn(tp); runP(BP.exec(tp, { do: 'droptorch' })); var flP = LtP.torchAt(BP, tp.x, tp.y);
      okP('SET DOWN: on the floor a ' + (flP && flP.kind) + ' (bright ' + (flP && flP.bright) + ', dim ' + (flP && flP.dim) + ', item ' + (flP && flP.item) + '), the hand empty ' + !tp.torch, !!(flP && flP.kind === 'lantern' && flP.bright === 40 && flP.dim === 40 && flP.item === 'ledgerlamp' && !tp.torch));
      okP('a floor light of 40 ft lights the square 35 ft off: ' + (far ? LtP.name(LtP.levelAt(BP, far[0], far[1])) : '-'), !far || LtP.levelAt(BP, far[0], far[1]) === 2);
      // the seam with the lamp down on the floor: not in a hand, but in the report's pack -- back in the 8-bit pack as the fight ends
      D.embed.inv0 = {}; var sd = seamP(BP), tk = sd.party && sd.party.filter(function (r) { return /talmok/.test(r.id); })[0];
      okP('the seam, lamp set down and left: Talmok torch ' + (tk && tk.torch) + ', inv1 ledgerlamp ' + (sd.inv1 && sd.inv1.ledgerlamp) + (sd.fail ? ' (' + sd.fail + ')' : ''), !!tk && tk.torch === false && !!sd.inv1 && sd.inv1.ledgerlamp === 1);
      D.rules.startTurn(tp); var pkP = BP.commands(tp).filter(function (c) { return c.id === 'pickuptorch'; })[0];
      okP('the wheel offers ' + (pkP && pkP.label), !!(pkP && pkP.label === 'TAKE UP LAMP'));
      runP(BP.exec(tp, { do: 'pickuptorch' })); okP('TAKE UP: ' + JSON.stringify(tp.torch) + ', the floor clear ' + !LtP.torchAt(BP, tp.x, tp.y), !!(tp.torch && tp.torch.kind === 'lantern' && tp.torch.item === 'ledgerlamp' && !LtP.torchAt(BP, tp.x, tp.y)));
      D.embed.inv0 = {}; var sh = seamP(BP), tk2 = sh.party && sh.party.filter(function (r) { return /talmok/.test(r.id); })[0];
      okP("the seam, lamp in his hand: the report says '" + (tk2 && tk2.torch) + "', the floor clear so inv1 ledgerlamp " + (sh.inv1 && sh.inv1.ledgerlamp), !!tk2 && tk2.torch === 'ledgerlamp' && !(sh.inv1 && sh.inv1.ledgerlamp));
      D.rules.startTurn(tp); runP(BP.exec(tp, { do: 'dousetorch' })); var pk1 = packP(BP, 'ledgerlamp');
      okP('DOUSE: back in the pack as ledgerlamp x' + pk1 + ' (no lantern in it: ' + packP(BP, 'lantern') + '), the hand empty ' + !tp.torch, pk1 === 1 && !packP(BP, 'lantern') && !tp.torch);
      D.rules.startTurn(tp); var ilP = BP.itemList(tp).filter(function (x) { return x.id === 'ledgerlamp'; })[0];
      okP('ITEM lists the Ledger-Lamp (a key item with a use): ' + (ilP ? (ilP.ok ? 'ok, cost ' + ilP.cost + ', "' + ilP.name + '"' : ilP.why) : 'missing'), !!(ilP && ilP.ok && ilP.name === 'Ledger-Lamp'));
      runP(BP.useItem(tp, 'ledgerlamp')); okP('lit again from the pack: ' + JSON.stringify(tp.torch) + ', the action spent ' + !tp.turn.action + ', the pack x' + packP(BP, 'ledgerlamp'), !!(tp.torch && tp.torch.kind === 'lantern' && tp.torch.item === 'ledgerlamp' && !tp.torch.hood && !tp.turn.action && packP(BP, 'ledgerlamp') === 0));
      var sleetP = LtP.douseIn(BP, D.grid.foot(tp)); okP('sleet over him puts out: ' + (sleetP.join(', ') || 'nothing') + ' (a lantern burns on)', !sleetP.length && !!tp.torch);
      // a fall: the lamp goes down with him and burns on the floor; the seam hands it back
      var bodyHP = tp.hp; tp.hp = 0; LtP.fell(BP, tp); tp.hp = bodyHP;
      D.embed.inv0 = {}; var sf = seamP(BP);
      okP('he falls with it: on the floor ' + !!LtP.torchAt(BP, tp.x, tp.y) + ', in hand ' + !!tp.torch + '; the seam hands it back (inv1 ledgerlamp ' + (sf.inv1 && sf.inv1.ledgerlamp) + ')', !!LtP.torchAt(BP, tp.x, tp.y) && !tp.torch && !!sf.inv1 && sf.inv1.ledgerlamp === 1);
      // the plain lantern's floor record keeps its own id too (never lost either)
      var BL = mkP(get('fight', 'trolls'), { torch: 'p0-talmok', torchKind: 'lantern' }), tl = whoP(BL, /talmok/);
      D.rules.startTurn(tl); runP(BL.exec(tl, { do: 'droptorch' })); D.embed.inv0 = {}; var sl = seamP(BL);
      okP('the lantern set down and left is handed back as well: inv1 lantern ' + (sl.inv1 && sl.inv1.lantern) + ', ledgerlamp ' + (sl.inv1 && sl.inv1.ledgerlamp), !!sl.inv1 && sl.inv1.lantern === 1 && !sl.inv1.ledgerlamp);
      // under the roost
      var BR = mkP('rescue', { torch: 'p0-talmok', torchKind: 'ledgerlamp' }), tr = whoP(BR, /talmok/), tw = whoP(BR, /willem/);
      okP('the roost fight: ' + !!(BR.fight && BR.fight.roost) + ', dark ' + BR.dark, !!(BR.fight && BR.fight.roost));
      okP('walked in hooded: ' + JSON.stringify(tr.torch) + ', the roost unbroken ' + !BR.roostBroken, !!(tr.torch && tr.torch.hood && tr.torch.item === 'ledgerlamp' && !BR.roostBroken));
      D.rules.startTurn(tr); var huR = BR.commands(tr).filter(function (c) { return c.id === 'hoodup'; })[0];
      okP('HOOD UP refused: ' + (huR ? huR.ok + ' (' + huR.why + ')' : 'no row'), !!(huR && !huR.ok));
      var ctP = LtP.canLight(BR, tw, 'torch'); okP('Willem may not light a torch: ' + ctP.why, !ctP.ok);
      BR.inv = (BR.inv || []).concat([{ id: 'ledgerlamp', n: 1 }]); var clP = LtP.canLight(BR, tw, 'ledgerlamp'); okP('but may light the Ledger-Lamp: ' + clP.ok + ' ' + clP.why, clP.ok);
      D.rules.startTurn(tw); var ilR = BR.itemList(tw).filter(function (x) { return x.id === 'ledgerlamp'; })[0];
      okP('ITEM under the roost: the Ledger-Lamp ' + (ilR ? (ilR.ok ? 'ok' : ilR.why) : 'missing'), !!(ilR && ilR.ok));
      runP(BR.useItem(tw, 'ledgerlamp')); okP('Willem lights it hood down: ' + JSON.stringify(tw.torch) + ', the roost still asleep ' + !BR.roostBroken + ', ' + LtP.name(LtP.levelAt(BR, tw.x, tw.y)) + ' at his feet', !!(tw.torch && tw.torch.hood && tw.torch.item === 'ledgerlamp' && !BR.roostBroken && LtP.levelAt(BR, tw.x, tw.y) === 1));
      runP(LtP.hood(BR, tw, false)); okP('the hood forced up under the roost: roostBroken=' + BR.roostBroken, !!BR.roostBroken);
      // a bearer who cannot take it up (Torvald's mace and shield leave no hand): it goes into the pack, and the seam hands it over
      var BT = mkP(get('fight', 'trolls'), { torch: 'p0-torvald', torchKind: 'ledgerlamp' }), tt = whoP(BT, /torvald/);
      D.embed.inv0 = {}; D.embed.inv0.ledgerlamp = packP(BT, 'ledgerlamp'); if (BT.lampReturned) D.embed.inv0.ledgerlamp = Math.max(0, D.embed.inv0.ledgerlamp - 1);
      var sT = seamP(BT);
      okP('a full-handed bearer: in hand ' + !!tt.torch + ', in the pack x' + packP(BT, 'ledgerlamp') + ' (lampReturned ' + BT.lampReturned + '); the seam: inv0 ' + D.embed.inv0.ledgerlamp + ' inv1 ' + (sT.inv1 && sT.inv1.ledgerlamp), !tt.torch && packP(BT, 'ledgerlamp') === 1 && BT.lampReturned === 'ledgerlamp' && !!sT.inv1 && sT.inv1.ledgerlamp === 1 && D.embed.inv0.ledgerlamp === 0);
      // the camp (the story's, with the pack): A LIGHT IN HAND offers it when the pack has it, and only then
      function campP(L2) { var F2 = D.FIGHTS.filter(function (f) { return f.level === L2; })[0] || D.FIGHTS[0]; var C2 = new D.Camp(L2, F2, function () { }, null); C2.enter(); return C2; }
      var C0 = campP(9), k0 = C0.info.torch.kinds.slice();
      okP('the camp with no lamp in the pack: light kinds ' + k0.join(','), k0.indexOf('ledgerlamp') < 0);
      C0.base.inv.push({ id: 'ledgerlamp', n: 1 }); C0.rebuild();
      var k1 = C0.info.torch.kinds.slice(); okP('the camp with the Ledger-Lamp in the pack: light kinds ' + k1.join(','), k1.indexOf('ledgerlamp') >= 0);
      var guardP = 0; while (guardP++ < 30 && !(C0.st.torch && C0.st.torchKind === 'ledgerlamp')) C0.cycleTorch(1);
      var rowP = C0.list().rows.filter(function (r) { return r && r.label === 'A LIGHT IN HAND'; })[0];
      okP('A LIGHT IN HAND reads "' + (rowP && rowP.right) + '" (torch ' + C0.st.torch + ', kind ' + C0.st.torchKind + ', ' + (C0.info.torch.why || 'ok') + ')', !!rowP && /Ledger-Lamp/.test(rowP.right) && C0.info.torch.on);
      var push0P = D.push, pushedP = null; D.push = function (s) { pushedP = s; }; C0.fight(); D.push = push0P;
      if (pushedP && pushedP.enter) { D.battle = pushedP; pushedP.enter(); }
      var holder = pushedP && pushedP.units.filter(function (u) { return u.side === 'party' && u.id === C0.st.torch; })[0];
      okP('the fight from the camp: ' + (holder ? holder.name + ' holds ' + JSON.stringify(holder.torch) : 'no fight') + ', the pack x' + (pushedP ? packP(pushedP, 'ledgerlamp') : '?'), !!holder && !!holder.torch && holder.torch.item === 'ledgerlamp' && packP(pushedP, 'ledgerlamp') === 0);
    } catch (eP) { repP.errors.push(String(eP && eP.stack || eP).slice(0, 900)); }
    if (D.lastError) repP.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var preP = document.createElement('pre'); preP.id = 'out'; preP.textContent = 'BENCH16 ' + JSON.stringify(repP);
    document.body.appendChild(preP);
    return;
  }
  // the zones that move, Wild Shape's pick and the circle spells (mode=zones; 09-29, the druid to nine)
  // the druid to twelve (mode=druid12; 09-30): the sheet at 10, 11 and 12 read against the SRD 5.1's table, Land's Stride and Nature's
  // Ward, the bat among the shapes at 8, and a druid 12 on the class floor against the four (who stop at 9)
  if (get('mode', '') === 'druid12') {
    var rep12 = { checks: [], errors: [] };
    function ok12(what, v) { rep12.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    try {
      [9, 10, 11, 12].forEach(function (L) {
        var u = D.npc.build('druid:' + L, L, 'foe', { id: 'd' + L }), sl = (u.slots || []).join(','), cant = u.known.filter(function (id) { return (DS.DATA.spells[id] || {}).level === 0; });
        var want = { 9: '4,3,3,3,1', 10: '4,3,3,3,2', 11: '4,3,3,3,2,1', 12: '4,3,3,3,2,1' }[L];
        ok12('druid ' + L + ': lvl ' + u.lvl + ', slots ' + sl + ' (SRD ' + want + '), cantrips ' + cant.length + ' (' + cant.join(' ') + '), known ' + u.known.length + ', WIS ' + u.abil.wis + ' CON ' + u.abil.con + ', prof ' + u.prof, u.lvl === L && sl === want && cant.length === (L >= 10 ? 5 : 4));
      });
      var d12 = D.npc.build('druid:12', 12, 'foe', { id: 'd12' }), lv = function (id) { return (DS.DATA.spells[id] || (D.EXTRA_SPELLS || {})[id] || {}).level || 0; };
      var prep = d12.known.filter(function (id) { return lv(id) >= 1; });
      ok12('druid 12 prepares ' + prep.length + ' (' + prep.join(' ') + '): Heal ' + (d12.known.indexOf('heal') >= 0) + ', Sunbeam ' + (d12.known.indexOf('sunbeam') >= 0), d12.known.indexOf('heal') >= 0 && d12.known.indexOf('sunbeam') >= 0);
      ok12('druid 12: ASIs at 4 8 12 -- WIS ' + d12.abil.wis + ', CON ' + d12.abil.con + ' (the 12th +2 to CON)', d12.abil.wis === 20 && d12.abil.con >= 16);
      ok12("druid 12: Land's Stride " + d12.landsStride + ", Nature's Ward " + d12.natureWard + ' (immune ' + (d12.immune || []).join() + '; poisoned ' + D.rules.immuneTo(d12, 'poisoned') + '; a fey charm ' + D.rules.immuneTo(d12, 'charmed', { type: 'fey' }) + ', a humanoid charm ' + D.rules.immuneTo(d12, 'charmed', { type: 'humanoid' }) + ')', d12.landsStride && d12.natureWard && D.rules.immuneTo(d12, 'poisoned') && D.rules.immuneTo(d12, 'charmed', { type: 'fey' }) && !D.rules.immuneTo(d12, 'charmed', { type: 'humanoid' }));
      var d5 = D.npc.build('druid:5', 5, 'foe', { id: 'd5' });
      ok12("druid 5: no Land's Stride (" + !!d5.landsStride + "), no Nature's Ward (" + !!d5.natureWard + ')', !d5.landsStride && !d5.natureWard);
      ok12('the other classes stop at 9: wizard:12 is ' + D.npc.build('wizard:12', 12, 'foe', { id: 'w12' }).lvl + ', cleric:11 is ' + D.npc.build('cleric:11', 11, 'foe', { id: 'c11' }).lvl, D.npc.build('wizard:12', 12, 'foe', { id: 'w12b' }).lvl === 9);
      var shapes = D.features.beastsFor(d12);
      ok12('the shapes at 12: ' + shapes.join(' ') + ' (a flier among them: giantbat)', shapes.indexOf('giantbat') >= 0);
      // Wild Shape into the bat: it flies, hears by blindsight, saves as the beast; back again, all restored
      var Bw = D.npcFight('?npc=druid:12&lvl=12', { bench: true }); D.battle = Bw; Bw.enter();
      var dz = Bw.units.filter(function (u) { return u.side === 'foe'; })[0], sv0 = JSON.stringify(dz.saves), fl0 = !!dz.flies;
      D.rules.startTurn(dz); var g = D.features.wildShape(Bw, dz, 'giantbat'), st; do { st = g.next(); } while (!st.done);
      var inBat = dz.flies + ' blindsight ' + dz.blindsight + ' DEX save ' + dz.saves.dex + ' WIS save ' + dz.saves.wis;
      D.features.unshape(Bw, dz, 0, true);
      ok12('Wild Shape, the bat: flies ' + inBat + '; back: flies ' + !!dz.flies + ', saves restored ' + (JSON.stringify(dz.saves) === sv0), /^true blindsight 60/.test(inBat) && !!dz.flies === fl0 && JSON.stringify(dz.saves) === sv0);
      ok12('the four on the class floor at 12 stand at ' + Bw.units.filter(function (u) { return u.side === 'party'; }).map(function (u) { return u.name + ' ' + u.lvl; }).join(', '), Bw.units.filter(function (u) { return u.side === 'party'; }).every(function (u) { return u.lvl === 9; }));
      // the summons (step 1, 09-30): the pool read off the bestiary, the pick, one initiative for the lot, the AI's blows, gone with concentration
      var P3 = D.summonPool('conjureanimals', 3), P5 = D.summonPool('conjureanimals', 5);
      ok12('the pool at 3rd: ' + P3.map(function (p) { return p.n + ' ' + p.kind; }).join(', ') + '; at 5th the wolves are ' + (P5.filter(function (p) { return p.kind === 'wolf'; })[0] || {}).n, P3.length >= 5 && (P3.filter(function (p) { return p.kind === 'wolf'; })[0] || {}).n === 8 && (P5.filter(function (p) { return p.kind === 'wolf'; })[0] || {}).n === 16 && (P3.filter(function (p) { return p.kind === 'giantboar'; })[0] || {}).n === 1);
      D.FOES.benchbeast = { name: 'Bench Beast', type: 'beast', sheet: 'wolf_p1', cr: '1/2', ac: 12, hp: 10, speed: 30, size: 1, reach: 5, abil: D.FOES.wolf.abil, saves: D.FOES.wolf.saves, init: 2, perception: 10, attacks: D.FOES.wolf.attacks, multi: 1 };
      var grew = D.summonPool('conjureanimals', 3).filter(function (p) { return p.kind === 'benchbeast'; })[0];
      D.FOES.benchbeast.summon = false; var kept = D.summonPool('conjureanimals', 3).some(function (p) { return p.kind === 'benchbeast'; }); delete D.FOES.benchbeast;
      ok12('a beast drawn into the bestiary joins the pool (' + (grew ? grew.n + ' of CR ' + grew.cr : 'no') + '); summon: false keeps it out (' + !kept + ')', grew && grew.n === 4 && !kept);
      ok12('Conjure Woodland Beings waits greyed: pool ' + D.summonPool('conjurewoodlandbeings', 4).length + ', why "' + ((D.magic.EFFECT.conjurewoodlandbeings.list(null, null, { slot: 4, level: 4 }) || {}).why || '') + '"', !D.summonPool('conjurewoodlandbeings', 4).length && !!D.magic.EFFECT.conjurewoodlandbeings.list(null, null, { slot: 4, level: 4 }));
      var Bs = D.npcFight('?npc=druid:5&lvl=5', { bench: true }); D.battle = Bs; Bs.enter();
      var st0 = Bs.co.next(); while (!Bs.order.length) st0 = Bs.co.next(); // (past the entry and the initiative roll)
      var dr = Bs.units.filter(function (u) { return u.side === 'foe'; })[0], n0u = Bs.units.length, ord0 = Bs.order.length;
      D.rules.startTurn(dr); var tgt = Bs.units.filter(function (u) { return u.side === 'party'; })[0];
      var gc = D.magic.cast(Bs, dr, 'conjureanimals', 3, { x: tgt.x, y: tgt.y }), sc; do { sc = gc.next(); } while (!sc.done);
      var made = Bs.units.slice(n0u), idx = made.map(function (w) { return Bs.order.indexOf(w); });
      var together = idx.every(function (v, i) { return i === 0 || v === idx[i - 1] + 1; }), oneRoll = made.every(function (w) { return w.initRoll === made[0].initRoll; });
      ok12('the AI druid 5 calls ' + made.length + ' ' + (made[0] && made[0].kind) + ' on its side (' + (made[0] && made[0].side) + '), all within 60 ft ' + made.every(function (w) { return D.grid.dist(dr, w) <= 60; }) + ', dealt in together ' + together + ' on one roll ' + oneRoll + ', concentrating ' + (dr.conc && dr.conc.id), made.length >= 4 && made.every(function (w) { return w.side === 'foe' && w.summon && w.summon.by === dr.id; }) && together && oneRoll && dr.conc && dr.conc.id === 'conjureanimals');
      var wv = made[0], hp0 = Bs.units.filter(function (u) { return u.side === 'party'; }).reduce(function (a, u) { return a + u.hp; }, 0), log0 = (Bs.log || []).length;
      made.forEach(function (w) { if (w.dead) return; D.rules.startTurn(w); var ga = D.ai.turn(Bs, w), sa, v; do { sa = ga.next(v); v = sa.value && sa.value.prompt ? sa.value.prompt.opts[0].value : undefined; } while (!sa.done); });
      var swings = (Bs.log || []).slice(log0).filter(function (l) { return new RegExp(made[0].d ? '' : wv.name.split(' ')[0]).test(l) && /hits|misses|Bite|bite/.test(l); }).length;
      ok12('they fight as if commanded: ' + swings + ' blows logged by them this round', swings > 0);
      var wolfA = made[0]; wolfA.hp = 0; Bs.sweep();
      ok12('one at 0 HP is gone: dead ' + wolfA.dead + ', left ' + wolfA.left, wolfA.dead && wolfA.left);
      D.magic.endConc(Bs, dr, 'the bench');
      ok12('his concentration ends: all gone (' + made.filter(function (w) { return !w.dead; }).length + ' left); the fight is not won while he stands (' + Bs.over() + ')', made.every(function (w) { return w.dead && w.left; }) && Bs.over() !== 'won');
      // the player's own druid picks (the class floor's vs=druid:5, his to run): the prompt, and the second choice taken
      var Bp = D.npcFight('?npc=fighter&lvl=5&vs=druid:5', {}); D.battle = Bp; Bp.enter(); while (!Bp.order.length) Bp.co.next();
      var pd = Bp.units.filter(function (u) { return u.side === 'party' && u.cls === 'druid'; })[0], pf = Bp.units.filter(function (u) { return u.side === 'foe'; })[0], asked = null, n1 = Bp.units.length;
      D.rules.startTurn(pd); var gp = D.magic.cast(Bp, pd, 'conjureanimals', 3, { x: pf.x, y: pf.y }), sp2, v2; do { sp2 = gp.next(v2); v2 = undefined; if (sp2.value && sp2.value.prompt) { asked = sp2.value.prompt; v2 = 2; } } while (!sp2.done);
      var came = Bp.units.slice(n1), want2 = D.summonPool('conjureanimals', 3)[1];
      ok12('his own druid is asked (' + (asked ? asked.opts.length + ' choices: ' + asked.opts.slice(0, 3).map(function (o) { return o.label.split('  ')[0]; }).join(' / ') : 'not asked') + '); the second answers: ' + came.length + ' ' + (came[0] && came[0].kind), !!asked && came.length === want2.n && came[0].kind === want2.kind && came[0].side === 'party');
      // a whole fight or three: the druid 12 against the four at 9, both run by the AI
      var tally = { won: 0, lost: 0, other: 0 }, casts = {};
      for (var k = 0; k < 3; k++) {
        var Bf = D.npcFight('?npc=druid:12&lvl=12', { bench: true }); D.battle = Bf; Bf.enter();
        Bf.units.forEach(function (u) { if (u.side === 'party') { u.guest = true; u.classAI = true; } });
        var n0 = (Bf.log || []).length, rs = drive(Bf); tally[rs === 'won' || rs === 'lost' ? rs : 'other']++;
        (Bf.log || []).slice(n0).forEach(function (l) { var m = /Druid 12: ([A-Z' ]{3,})/.exec(String(l)); if (m) casts[m[1]] = (casts[m[1]] || 0) + 1; });
      }
      ok12('three fights, druid 12 against the four at 9: ' + JSON.stringify(tally) + '; its casts ' + JSON.stringify(casts), tally.other === 0);
    } catch (e12) { rep12.errors.push(String(e12 && e12.stack || e12).slice(0, 900)); }
    if (errs.length) rep12.errors = rep12.errors.concat(errs);
    var pre12 = document.createElement('pre'); pre12.id = 'out'; pre12.textContent = 'BENCH16 ' + JSON.stringify(rep12);
    document.body.appendChild(pre12);
    return;
  }
  // the lone rogue, played (mode=rogue4; 10-01c, Griz: "can we send a runner with a goal 'play a level 4 rogue and win a fight - explore tactics' type runner?"):
  // the rogue alone against a brute (the bugbear) and a pack (two wolves and a goblin) at levels 3, 4, 5 on the Hex floor, the class turn as it was (pol=ai) against the
  // rogue's cover play (pol=hide, js/tactics.js TX.rogueCover: shoot from a square where no foe sees her clearly, then Hide again with Cunning Action -- a foe that cannot
  // see its target does nothing, js/ai.js heroes), her kite (pol=kite, TX.rogueKite: shoot, then run out of reach of the melee foes) and both (pol=new, as it ships).
  // &set=brute,pack,gobs,rats,chief,hobs,troll,ogres,asfoe  &lv=3,4,5  &n=30  &pol=ai,new  &seed=1  &log=lost|won|all (&logn=2 of them, their logs)  &map=  &dark=1  &party=
  if (get('mode', '') === 'rogue4') {
    var repQ = { checks: [], errors: [], table: {}, logs: [] };
    var SETQ = { brute: 'bugbear', pack: 'wolf,wolf,goblin', gobs: 'goblin,goblin', rats: 'giantrat,giantrat,giantrat', chief: 'bugbearchief', hobs: 'hobgoblin,hobgoblin,gnoll', troll: 'troll', ogres: 'ogre,bugbear,bugbear' }, LVQ = get('lv', '3,4,5').split(',').map(Number), NQ = +get('n', 30), POLQ = get('pol', 'ai,new').split(','), WHQ = get('set', 'brute,pack').split(',');
    var TXQ = D.tactics;
    // (the policies are js/tactics.js's own, its two switches: ai -- both off, the class turn as it was; hide -- TX.rogueCover alone; kite -- TX.rogueKite alone; new -- both,
    // as it ships. &dbg=1 is not kept: the log of a lost fight, &log=lost, tells the turns)
    var POLS = { ai: [false, false], hide: [true, false], kite: [false, true], 'new': [true, true] };
    try {
      WHQ.forEach(function (wh) {
        LVQ.forEach(function (lv) {
          POLQ.forEach(function (pol) {
            var row = { won: 0, lost: 0, other: 0, rounds: 0, hpLeft: 0, fights: 0 };
            for (var k = 0; k < NQ; k++) {
              D.seed = seed0 * 7919 + k * 104729 + lv * 31 + (wh === 'pack' ? 1000003 : 0); D.lastError = null;
              // (&set=asfoe: she is the foe, the four of the 8-bit game the party, run by their class tactics -- "won" is then the four's; &map=<a map of data/maps.js> &dark=1: the
              // same fights elsewhere; &party=fighter:4,cleric:4 beside her)
              var Bf = D.npcFight(wh === 'asfoe' ? '?npc=rogue:' + lv + '&lvl=' + lv : '?npc=' + SETQ[wh] + '&lvl=' + lv + '&vs=rogue:' + lv + (get('party', '') ? ',' + get('party', '') : '') + (get('map', '') ? '&map=' + get('map', '') : '') + (get('dark', '') ? '&dark' : ''), { bench: true }); D.battle = Bf; Bf.enter();
              var me = Bf.units.filter(function (u) { return u.side === (wh === 'asfoe' ? 'foe' : 'party'); })[0]; if (!me) continue;
              Bf.units.forEach(function (u) { if (u.side === 'party') { u.guest = true; u.classAI = true; } });
              if (get('noalt', '')) me.alt = null; // (&noalt=1: no bow in her hand, the rapier alone -- she hides, and the class turn strikes from hiding)
              TXQ.rogueCover = POLS[pol][0]; TXQ.rogueKite = POLS[pol][1];
              var rs = drive(Bf); row[rs === 'won' || rs === 'lost' ? rs : 'other']++; row.rounds += Bf.round; row.hpLeft += Math.max(0, me.hp) / me.maxhp; row.fights++;
              if (get('log', '') && repQ.logs.length < +get('logn', 2) && (get('log', '') === 'all' || rs === get('log', ''))) repQ.logs.push(wh + ' ' + lv + ' ' + pol + ' seed#' + k + ' ' + rs + '\n' + (Bf.log || []).join('\n'));
            }
            row.rounds = +(row.rounds / Math.max(1, row.fights)).toFixed(1); row.hpLeft = Math.round(100 * row.hpLeft / Math.max(1, row.fights));
            repQ.table[wh + ' ' + lv + ' ' + pol] = row;
          });
        });
      });
    } catch (eQ) { repQ.errors.push(String(eQ && eQ.stack || eQ).slice(0, 900)); }
    TXQ.rogueCover = true; TXQ.rogueKite = true;
    if (errs.length) repQ.errors = repQ.errors.concat(errs.slice(0, 5));
    var preQ = document.createElement('pre'); preQ.id = 'out'; preQ.textContent = 'BENCH16 ' + JSON.stringify(repQ);
    document.body.appendChild(preQ);
    return;
  }
  // the bread and butter (mode=ringsurvey; 10-01c, Griz: "For classes other than rogue (hide) and wizard (fire bolt) we should do like we did for them and have
  // the bread & butter go-to on the first ring ... warlocks probably their attack cantrip, etc) - test like warlock bugbear help reveal what should be on the
  // ring"): each class alone, run by its tactics, against a brute and against a pack at levels 1, 3, 5, 9; every command it gives tallied (B.exec: the
  // weapon, each spell -- a bonus action's marked -- each feature), and its turns, and the fights won. &cls=warlock,cleric keeps to those; &lv=5; &n=5
  if (get('mode', '') === 'ringsurvey') {
    var repS = { checks: [], errors: [], table: {} };
    var CLS = get('cls', 'barbarian,bard,cleric,druid,fighter,monk,paladin,ranger,rogue,sorcerer,warlock,wizard').split(','), LVS = get('lv', '1,3,5,9').split(',').map(Number), NS = +get('n', 5);
    var FOE_SETS = { 1: ['goblin,goblin', 'giantrat,giantrat,giantrat'], 3: ['bugbear', 'wolf,wolf,goblin'], 5: ['bugbearchief', 'hobgoblin,hobgoblin,gnoll'], 9: ['troll', 'ogre,bugbear,bugbear'] };
    var exec0 = B0.exec, start0 = D.rules.startTurn, cur = null;
    B0.exec = function (u, c) { if (cur && u === cur.u && c && c.do && c.do !== 'move' && c.do !== 'end') { var k = c.do === 'attack' ? 'attack: ' + ((u.weapon && (u.weapon.name || u.weapon.id)) || 'weapon') : c.do === 'cast' ? c.id + ((M.geo(c.id) || {}).time === 'B' ? ' (bonus)' : '') : c.do; cur.keys[k] = (cur.keys[k] || 0) + 1; } return exec0.apply(this, arguments); };
    D.rules.startTurn = function (u) { if (cur && u === cur.u) { cur.turns++; cur.seen = {}; } return start0.apply(this, arguments); };
    // the class tactics swing and use their features without B.exec: a weapon's swing (once a turn, not an opportunity attack, not a spell's roll) and each
    // feature function called on it (once a turn each) are tallied too
    function once(k) { if (!cur.seen[k]) { cur.seen[k] = 1; cur.keys[k] = (cur.keys[k] || 0) + 1; } }
    var attack0 = B0.attack;
    B0.attack = function (att, tgt, atk, o) { if (cur && att === cur.u && !(o && o.oa) && atk && !atk.spell) once('swing: ' + (atk.name || atk.id || 'weapon')); return attack0.apply(this, arguments); };
    var FW = {}; Object.keys(D.features).forEach(function (nm) { var f0 = D.features[nm]; if (typeof f0 !== 'function') return; FW[nm] = f0; D.features[nm] = function (a, b) { if (cur && b === cur.u && a instanceof D.Battle) once('feat: ' + nm); return f0.apply(this, arguments); }; });
    try {
      CLS.forEach(function (cl) {
        LVS.forEach(function (lv) {
          var row = { turns: 0, keys: {}, won: 0, lost: 0, other: 0 };
          (FOE_SETS[lv] || FOE_SETS[5]).forEach(function (fs) {
            for (var k = 0; k < NS; k++) {
              D.seed = seed0 + k * 31 + lv;
              var Bf = D.npcFight('?npc=' + fs + '&lvl=' + lv + '&vs=' + cl + ':' + lv, { bench: true }); D.battle = Bf; Bf.enter();
              var me = Bf.units.filter(function (u) { return u.side === 'party'; })[0]; if (!me) continue;
              me.guest = true; me.classAI = true;
              cur = { u: me, keys: row.keys, turns: 0 };
              var rs = drive(Bf); row.turns += cur.turns; row[rs === 'won' || rs === 'lost' ? rs : 'other']++;
              cur = null;
            }
          });
          repS.table[cl + ' ' + lv] = row;
        });
      });
    } catch (eS) { repS.errors.push(String(eS && eS.stack || eS).slice(0, 900)); }
    B0.exec = exec0; D.rules.startTurn = start0; B0.attack = attack0; Object.keys(FW).forEach(function (nm) { D.features[nm] = FW[nm]; });
    if (errs.length) repS.errors = repS.errors.concat(errs.slice(0, 5));
    var preS = document.createElement('pre'); preS.id = 'out'; preS.textContent = 'BENCH16 ' + JSON.stringify(repS);
    document.body.appendChild(preS);
    return;
  }
  // sleep as the SRD's Unconscious and Help on a friend (mode=sleep1001c; RULED 10-01c, Griz: "2 agree with lean, approved" / "3 repurpose the help action to
  // conditionally target allies" / "let a slept lantern be set down in current hood state"): Sleep lays a record, prone, the lantern set down hooded; HELP on the
  // sleeper wakes it, still prone; HELP on a webbed friend gives its break-free advantage, spent; the class AI wakes a sleeping friend; a Sleep from outside a
  // globe is held off; the cleric's Spiritual Weapon swing on the first ring once it is up
  if (get('mode', '') === 'sleep1001c') {
    var repZ = { checks: [], errors: [] }, MZ = D.magic;
    function okZ(what, v) { repZ.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runZ(g) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mkZ(q) { var Bx = D.npcFight(q, {}); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next(); return Bx; }
    try {
      var B1 = mkZ('?npc=wizard:5&lvl=5&vs=fighter,cleric'), ps = B1.units.filter(function (u) { return u.side === 'party'; }), ft = ps.filter(function (u) { return u.cls === 'fighter'; })[0], cl = ps.filter(function (u) { return u.cls === 'cleric'; })[0], wz = B1.units.filter(function (u) { return u.side === 'foe'; })[0];
      wz.x = 9; wz.y = 3; ft.x = 9; ft.y = 8; cl.x = 10; cl.y = 8; ft.hp = 5;
      ft.torch = D.light.make('lantern', true); var hood0 = ft.torch.hood;
      D.rules.startTurn(wz); runZ(MZ.cast(B1, wz, 'sleep', 1, { x: 9, y: 8 }));
      var lamp = (B1.lights || []).filter(function (l) { return l.x === 9 && l.y === 8; })[0];
      okZ('Sleep: asleep a record ' + (typeof ft.conds.asleep) + ' (from ' + !!(ft.conds.asleep && ft.conds.asleep.from) + '), prone ' + !!ft.conds.prone + ', the lantern set down ' + !!lamp + ' hooded ' + (lamp && lamp.hood) + ' (was ' + hood0 + '), in hand ' + !!ft.torch, ft.conds.asleep && typeof ft.conds.asleep === 'object' && ft.conds.asleep.from && ft.conds.prone && lamp && !!lamp.hood === !!hood0 && !ft.torch);
      D.rules.startTurn(cl); var cmC = B1.commands(cl).filter(function (x) { return x.id === 'help'; })[0];
      okZ('HELP offered the cleric with only a sleeping friend beside it: ' + !!cmC + ' (' + (cmC && cmC.note) + ')', !!cmC && cmC.ok);
      var plan = D.tactics.plans(B1, cl)[0];
      okZ('the class AI\'s best plan beside a sleeping friend: ' + (plan && plan.kind + ' ' + plan.why + ' ' + plan.score.toFixed(1)), plan && plan.kind === 'help');
      runZ(B1.exec(cl, { do: 'help', target: ft }));
      okZ('HELP wakes it: asleep ' + !!ft.conds.asleep + ', still prone ' + !!ft.conds.prone + ', the action spent ' + (cl.turn.action === 0), !ft.conds.asleep && ft.conds.prone && cl.turn.action === 0);
      D.rules.startTurn(ft); okZ('its turn: up for half the move (' + ft.turn.move + ' of ' + ft.speed + '), prone ' + !!ft.conds.prone, !ft.conds.prone && ft.turn.move === Math.floor(ft.speed / 2));
      // a webbed friend: the hand, spent on the break-free
      ft.conds.restrained = { dc: 30, by: wz.id }; D.rules.startTurn(cl); runZ(B1.exec(cl, { do: 'help', target: ft }));
      var ceH = D.rules.checkEdges(ft, 'str'); D.rules.startTurn(ft); var n0 = (B1.log || []).length; runZ(MZ.breakFree(B1, ft));
      var bl = (B1.log || []).slice(n0).join(' | ').replace(/\{\/?[a-z]*\}/g, '');
      okZ('a hand to a webbed friend: advantage (' + ceH.adv.join(',') + '), the card "' + bl.slice(0, 90) + '", spent ' + !ft.conds.helpedCheck, ceH.adv.indexOf('help') >= 0 && /advantage: help/.test(bl) && !ft.conds.helpedCheck);
      delete ft.conds.restrained;
      // a Sleep from outside a globe: held off inside it
      var B2 = mkZ('?npc=wizard:9&lvl=9&vs=fighter,wizard'), p2 = B2.units.filter(function (u) { return u.side === 'party'; }), f2 = p2.filter(function (u) { return u.cls === 'fighter'; })[0], w2 = p2.filter(function (u) { return u.cls === 'wizard'; })[0], z2 = B2.units.filter(function (u) { return u.side === 'foe'; })[0];
      z2.x = 9; z2.y = 2; w2.x = 9; w2.y = 8; f2.x = 10; f2.y = 8; f2.hp = 5;
      D.rules.startTurn(z2); runZ(MZ.cast(B2, z2, 'sleep', 1, { x: 10, y: 8 })); var sl2 = !!f2.conds.asleep;
      D.rules.startTurn(w2); delete w2.conc; runZ(MZ.cast(B2, w2, 'globeofinvulnerability', 6, w2));
      okZ('a Sleep from outside, then the globe: asleep ' + sl2 + ' -> ' + !!f2.conds.asleep + ' (idle: ' + !!(MZ.shelved(f2) || {}).asleep + '), can act ' + D.rules.canAct(f2), sl2 && !f2.conds.asleep && (MZ.shelved(f2) || {}).asleep && D.rules.canAct(f2));
      // the cleric's Spiritual Weapon: its swing on the first ring once it is up
      var B3 = mkZ('?npc=goblin,goblin&lvl=5&vs=cleric:5'), c3 = B3.units.filter(function (u) { return u.side === 'party'; })[0], g3 = B3.units.filter(function (u) { return u.side === 'foe'; })[0];
      D.rules.startTurn(c3); var r0 = D.ui.cmds(B3, c3).map(function (x) { return x.label; });
      runZ(MZ.cast(B3, c3, 'spiritualweapon', 2, g3)); D.rules.startTurn(c3);
      var r1 = D.ui.cmds(B3, c3).map(function (x) { return x.label; });
      okZ('the cleric\'s ring before: ' + r0.join(' / ') + '; with the weapon up: ' + r1.join(' / ') + ' (' + r1.length + ')', r1.length === r0.length + 1 && /SPIRITUAL|WEAPON|SWING/.test(r1[3]));
      // Corwen Dace in the deep gallery (RULED 10-01c, Griz: "game over if the kid falls, cloaker focuses on kid if they bring him to that fight"): the cloaker
      // goes past the fighter beside it for the one marked vital; the vital one down, the fight is lost
      var B4 = mkZ('?npc=cloaker&lvl=5&vs=fighter,wizard'), f4 = B4.units.filter(function (u) { return u.cls === 'fighter'; })[0], d4 = B4.units.filter(function (u) { return u.cls === 'wizard'; })[0], c4 = B4.units.filter(function (u) { return u.side === 'foe'; })[0];
      d4.vital = true; c4.woken = true; d4.hp = d4.maxhp = 60;
      // (a) both in its reach: the fighter the weaker, the wizard the one it hunts
      var fr = D.grid.foot(c4); f4.x = c4.x - 1; f4.y = c4.y; d4.x = c4.x + 2; d4.y = c4.y + 1;
      var n4 = (B4.log || []).length; D.rules.startTurn(c4); runZ(D.ai.turn(B4, c4));
      var l4 = (B4.log || []).slice(n4).join(' | ').replace(/\{\/?[a-z]*\}/g, '');
      okZ('both in reach (fighter ' + f4.hp + ', wizard ' + d4.hp + ' HP): the cloaker bites ' + (/> Wizard/.test(l4) ? 'the vital wizard' : /> Fighter/.test(l4) ? 'the fighter' : 'no one') + ' -- ' + l4.slice(0, 120), /> Wizard/.test(l4) && !/> Fighter/.test(l4));
      // (b) the wizard out of reach, the fighter beside it: it goes for the wizard
      var B5 = mkZ('?npc=cloaker&lvl=5&vs=fighter,wizard'), f5 = B5.units.filter(function (u) { return u.cls === 'fighter'; })[0], d5 = B5.units.filter(function (u) { return u.cls === 'wizard'; })[0], c5 = B5.units.filter(function (u) { return u.side === 'foe'; })[0];
      d5.vital = true; c5.woken = true; d5.hp = d5.maxhp = 60; f5.x = c5.x - 1; f5.y = c5.y;
      var dist0 = D.grid.dist(c5, d5); D.rules.startTurn(c5); var n5 = (B5.log || []).length; runZ(D.ai.turn(B5, c5)); var l5 = (B5.log || []).slice(n5).join(' | ').replace(/\{\/?[a-z]*\}/g, '');
      okZ('the wizard ' + dist0 + ' ft off: the cloaker ' + (D.grid.dist(c5, d5) < dist0 ? 'closed to ' + D.grid.dist(c5, d5) + ' ft' : 'stayed') + ', bit ' + (/> Wizard/.test(l5) ? 'the wizard' : /> Fighter/.test(l5) ? 'the fighter' : 'no one'), D.grid.dist(c5, d5) < dist0 || /> Wizard/.test(l5));
      d4.hp = 0; okZ('the vital one down: ' + B4.over(), B4.over() === 'lost');
    } catch (eZ) { repZ.errors.push(String(eZ && eZ.stack || eZ).slice(0, 900)); }
    if (errs.length) repZ.errors = repZ.errors.concat(errs);
    var preZ = document.createElement('pre'); preZ.id = 'out'; preZ.textContent = 'BENCH16 ' + JSON.stringify(repZ);
    document.body.appendChild(preZ);
    return;
  }
  // the first ring, each class's (mode=ring1001c; 10-01c, the ring survey's picks -- js/ui.js QUICK, BESIDE, FRONT): a player's hero of each class at 5, its
  // commands in order, the go-to where it should stand and its weapon not lost
  if (get('mode', '') === 'ring1001c') {
    var repR1 = { checks: [], errors: [] };
    var WANT = { warlock: ['ELDRITCH BLAST', 'q'], sorcerer: ['FIRE BOLT', 'q'], druid: ['PRODUCE FLAME', 'b'], wizard: ['FIRE BOLT', 'q'], cleric: ['SACRED FLAME', 'b'], bard: ['VICIOUS MOCKERY', 'b'], ranger: ["HUNTER'S MARK", 'b'], barbarian: ['RAGE', 'b'], monk: ['FLURRY OF BLOWS|BONUS STRIKE', 'b'], rogue: ['HIDE', 'b'], fighter: [null, 'a'], paladin: [null, 'a'] };
    try {
      Object.keys(WANT).forEach(function (cl) {
        var Br = D.npcFight('?npc=goblin&lvl=5&vs=' + cl + ':5', {}); D.battle = Br; Br.enter(); while (!Br.order.length) Br.co.next();
        var me = Br.units.filter(function (u) { return u.side === 'party'; })[0]; D.rules.startTurn(me);
        var cm = D.ui.cmds(Br, me), labels = cm.map(function (x) { return x.label; }), w = WANT[cl], acts = (cm.filter(function (x) { return x.id === 'actions'; })[0] || { items: [] }).items.map(function (x) { return x.id; });
        var sw = /^ATTACK/.test(labels[1]), ok = w[1] === 'q' ? labels[1] === w[0] && acts.indexOf('attack') >= 0 : w[1] === 'b' ? sw && new RegExp('^(' + w[0] + ')$').test(labels[2]) : sw;
        repR1.checks.push((ok ? 'ok   ' : 'FAIL ') + cl + ': ' + labels.slice(0, 5).join(' / ') + (w[1] === 'q' ? '  (the swing in ACTIONS: ' + (acts.indexOf('attack') >= 0) + ')' : ''));
      });
    } catch (eR1) { repR1.errors.push(String(eR1 && eR1.stack || eR1).slice(0, 900)); }
    if (errs.length) repR1.errors = repR1.errors.concat(errs);
    var preR1 = document.createElement('pre'); preR1.id = 'out'; preR1.textContent = 'BENCH16 ' + JSON.stringify(repR1);
    document.body.appendChild(preR1);
    return;
  }
  // the Globe of Invulnerability and what is already on a creature (mode=globe1001c; RULED 10-01c, Griz: "1 it does if we can get the animation right" /
  // "2 everything cast before the globe has a 'where' of 'outside' ... bob recasts mage armor after putting up the globe (from inside) then leaves to give his
  // friend a potion and goes back into the globe"): a hold from outside lies idle inside and takes hold again outside; it ends for good if its caster lets go
  // while it is shelved; a camp's Mage Armor (no record of where) is outside; Bob's recast inside stands in and out; Longstrider's +10 ft; Dispel from inside;
  // the globe falling; the swell; the AI's worth
  if (get('mode', '') === 'globe1001c') {
    var repG = { checks: [], errors: [] }, MG = D.magic;
    function okG(what, v) { repG.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runG(g) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mkG(q) { var Bx = D.npcFight(q, {}); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next(); return Bx; }
    function syncG(B) { MG.globeSync(B); }
    function runS(B, g) { var v, k = 0, st; while (g && k++ < 4000) { MG.globeSync(B); st = g.next(v); v = undefined; if (st.done) return; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    try {
      var B1 = mkG('?npc=wizard:11&lvl=11&vs=fighter,wizard'), ps = B1.units.filter(function (u) { return u.side === 'party'; });
      var ftr = ps.filter(function (u) { return u.cls === 'fighter'; })[0], bob = ps.filter(function (u) { return u.cls === 'wizard'; })[0], wz = B1.units.filter(function (u) { return u.side === 'foe'; })[0];
      wz.x = 9; wz.y = 2; bob.x = 9; bob.y = 7; ftr.x = 10; ftr.y = 7;
      ftr.saves = Object.assign({}, ftr.saves, { wis: -30 });
      // the camp's Mage Armor on Bob, no record of where it was cast (a `1`, as camp.js lays it)
      delete bob.conds.mageArmor; var bare = bob.baseAC; bob.conds.mageArmor = 1; bob.baseAC = Math.max(bare, 13 + D.mod(bob.abil.dex)); var armored = bob.baseAC;
      // Longstrider on the fighter, by Bob, before the globe
      D.rules.startTurn(bob); var sp0 = ftr.speed; runG(MG.cast(B1, bob, 'longstrider', 1, ftr));
      okG('Longstrider before the globe: speed ' + sp0 + ' -> ' + ftr.speed, ftr.speed === sp0 + 10 && ftr.conds.longstrider && ftr.conds.longstrider.from);
      // 1. Hold Person from the foe, outside
      D.rules.startTurn(wz); runG(MG.cast(B1, wz, 'holdperson', 2, ftr));
      okG('Hold Person from outside: held ' + !!ftr.conds.paralyzed + ', can act ' + D.rules.canAct(ftr) + ' (the foe concentrating: ' + (wz.conc && wz.conc.id) + ')', !!ftr.conds.paralyzed && !D.rules.canAct(ftr) && wz.conc && wz.conc.id === 'holdperson');
      // 2. the globe, Bob's, beside the fighter: the swell, and what goes idle
      D.rules.startTurn(bob); delete bob.conc;
      var g0 = MG.cast(B1, bob, 'globeofinvulnerability', 6, bob), stG, kG = 0, seenGrow = [], heldAt = -1;
      while (kG++ < 400) { stG = g0.next(); if (stG.done) break; var gl = (B1.globes || [])[0]; if (gl && gl.grow != null) { seenGrow.push(gl.grow); if (heldAt < 0 && !ftr.conds.paralyzed) heldAt = gl.grow; } }
      var G1 = (B1.globes || [])[0];
      okG('the swell: ' + seenGrow.length + ' frames, the fighter (one square off) let go at grow ' + (heldAt >= 0 ? heldAt.toFixed(2) : 'never') + ', done ' + (G1 && G1.grow == null) + ', numbered ' + (G1 && G1.n), seenGrow.length >= 20 && heldAt > 0 && heldAt < 1 && G1 && G1.grow == null && G1.n >= 1);
      var shF = MG.shelved(ftr) || {};
      okG('inside: the hold idle (' + Object.keys(shF).join(',') + '), can act ' + D.rules.canAct(ftr) + ', speed ' + ftr.speed + ' (Longstrider idle)', !ftr.conds.paralyzed && shF.paralyzed && D.rules.canAct(ftr) && ftr.speed === sp0 && shF.longstrider);
      okG('Bob\'s camp Mage Armor (cast before the globe): idle, AC ' + D.rules.ac(bob) + ' (armored ' + armored + ', bare ' + bob.baseAC + ')', !bob.conds.mageArmor && (MG.shelved(bob) || {}).mageArmor && bob.baseAC < armored);
      // 3. a fresh Hold Person from outside at the fighter inside: untouched
      MG.endConc(B1, wz, 'test'); syncG(B1);
      okG('the foe let go while the hold lay idle: the record ended for good (shelf ' + JSON.stringify(Object.keys(MG.shelved(ftr) || {})) + ', held ' + !!ftr.conds.paralyzed + ')', !(MG.shelved(ftr) || {}).paralyzed && !ftr.conds.paralyzed);
      D.rules.startTurn(wz); var log0 = (B1.log || []).length; runG(MG.cast(B1, wz, 'holdperson', 2, ftr));
      okG('a new Hold Person from outside at one inside: untouched (held ' + !!ftr.conds.paralyzed + ') -- ' + (B1.log || []).slice(log0).join(' | ').replace(/\{\/?[a-z]*\}/g, '').slice(0, 120), !ftr.conds.paralyzed);
      // 4. out, and back: Longstrider takes hold again outside, idle inside
      ftr.x = 14; syncG(B1);
      okG('the fighter steps out: speed ' + ftr.speed + ', the shelf ' + JSON.stringify(Object.keys(MG.shelved(ftr) || {})), ftr.speed === sp0 + 10 && !MG.shelved(ftr));
      ftr.x = 10; syncG(B1);
      okG('and back in: speed ' + ftr.speed, ftr.speed === sp0);
      // 5. Bob recasts Mage Armor inside the globe, steps out to give his friend a potion, steps back in
      D.rules.startTurn(bob); var conc0 = bob.conc; runS(B1, MG.cast(B1, bob, 'mageArmor', 1, bob)); // (with the globe's frames between the cast's steps, as battle.js step runs it: filmed 10-01c, the recast went idle mid-cast)
      var ma = bob.conds.mageArmor;
      okG('Bob\'s Mage Armor recast inside: AC ' + D.rules.ac(bob) + ', cast inside globe ' + JSON.stringify(ma && ma.from && ma.from.gin) + ', the globe still his (' + (bob.conc && bob.conc.id) + ')', ma && ma.from && ma.from.gin.indexOf(G1.n) >= 0 && bob.baseAC === armored && bob.conc === conc0);
      bob.x = 9; bob.y = 12; syncG(B1);
      okG('Bob steps out (the potion): AC ' + D.rules.ac(bob) + ', Mage Armor the new one ' + (bob.conds.mageArmor === ma) + ', nothing shelved ' + !MG.shelved(bob) + ', the globe stays (' + (B1.globes || []).length + ')', bob.conds.mageArmor === ma && bob.baseAC === armored && !MG.shelved(bob) && (B1.globes || []).length === 1);
      bob.x = 9; bob.y = 7; syncG(B1);
      okG('Bob steps back in: AC ' + D.rules.ac(bob) + ', Mage Armor stands ' + (bob.conds.mageArmor === ma), bob.conds.mageArmor === ma && bob.baseAC === armored);
      // 6. a mark laid from outside, then carried in; Dispel from inside ends it (and Longstrider with it: Dispel's list -- so it is put back after, for 7)
      ftr.x = 14; syncG(B1); ftr.conds.marked = { by: wz.id, from: { x: 9, y: 2, gin: [] }, lv: 1, castId: 'huntersmark' }; ftr.x = 10; syncG(B1);
      okG('a mark from outside carried in: idle (' + JSON.stringify(Object.keys(MG.shelved(ftr) || {})) + ')', !ftr.conds.marked && (MG.shelved(ftr) || {}).marked);
      var ls0 = (MG.shelved(ftr) || {}).longstrider;
      D.rules.startTurn(bob); runG(MG.cast(B1, bob, 'dispelmagic', 3, ftr)); syncG(B1);
      okG('Dispel Magic from inside on it: the mark and Longstrider ended, shelf ' + JSON.stringify(Object.keys(MG.shelved(ftr) || {})) + ', speed ' + ftr.speed, !MG.shelved(ftr) && !ftr.conds.marked && !ftr.conds.longstrider && ftr.speed === sp0);
      ftr.x = 14; syncG(B1); ftr.conds.longstrider = ls0; ftr.speed += 10; ftr.x = 10; syncG(B1); // (Longstrider again, from where it first was)
      // 7. the globe falls: Bob's camp Mage Armor -- discarded when the new one stood -- stays the new; the fighter's Longstrider takes hold
      MG.endConc(B1, bob, 'test'); syncG(B1);
      okG('the globe falls: globes ' + (B1.globes || []).length + ', the fighter\'s speed ' + ftr.speed + ', shelves ' + !!MG.shelved(ftr) + '/' + !!MG.shelved(bob) + ', gone drawn ' + (B1.globesGone || []).length, !(B1.globes || []).length && ftr.speed === sp0 + 10 && !MG.shelved(ftr) && !MG.shelved(bob) && (B1.globesGone || []).length === 1);
      // 8. the AI weighs it: a wizard beside a held friend raises it for that
      var B2 = mkG('?npc=wizard:11,fighter:11&lvl=11&vs=wizard'), p2 = B2.units.filter(function (u) { return u.side === 'party'; })[0], fz = B2.units.filter(function (u) { return u.side === 'foe'; }), fw = fz.filter(function (u) { return u.cls === 'wizard'; })[0], ff = fz.filter(function (u) { return u.cls === 'fighter'; })[0];
      fw.x = 9; fw.y = 7; ff.x = 10; ff.y = 7; p2.x = 9; p2.y = 2; delete fw.conc;
      var E = MG.EFFECT.globeofinvulnerability, s0 = E.ai(B2, fw, { g: MG.geo('globeofinvulnerability') }, 6, [p2]);
      ff.conds.paralyzed = { by: p2.id, from: { x: 9, y: 2, gin: [] }, lv: 2, castId: 'holdperson' };
      var s1 = E.ai(B2, fw, { g: MG.geo('globeofinvulnerability') }, 6, [p2]);
      okG('the AI: the globe worth ' + (s0 ? s0.score.toFixed(1) : 0) + ' alone, ' + (s1 ? s1.score.toFixed(1) : 0) + ' with its fighter held from outside beside it; the probe left no globe (' + (B2.globes || []).length + ')', s1 && (!s0 || s1.score > s0.score + 5) && !(B2.globes || []).length);
      // 9. the fight's end puts everything back
      var B3 = mkG('?npc=wizard:11&lvl=11&vs=fighter,wizard'), b3 = B3.units.filter(function (u) { return u.cls === 'wizard' && u.side === 'party'; })[0];
      b3.conds.mageArmor = 1; D.rules.startTurn(b3); delete b3.conc; runG(MG.cast(B3, b3, 'globeofinvulnerability', 6, b3));
      var shelved3 = !!(MG.shelved(b3) || {}).mageArmor; runG(B3.finish('won'));
      okG('the fight ends: Mage Armor ' + (shelved3 ? 'idle, then ' : 'not idle?, then ') + 'back ' + b3.conds.mageArmor + ', globes ' + (B3.globes || []).length, shelved3 && b3.conds.mageArmor === 1 && !(B3.globes || []).length);
    } catch (eG) { repG.errors.push(String(eG && eG.stack || eG).slice(0, 900)); }
    if (errs.length) repG.errors = repG.errors.concat(errs);
    var preG = document.createElement('pre'); preG.id = 'out'; preG.textContent = 'BENCH16 ' + JSON.stringify(repG);
    document.body.appendChild(preG);
    return;
  }
  // his rulings of 09-30 (mode=rulings0930): Fear bites (the sweep keeps a spell's fright), a charm holds a hero the player runs, CHANNEL
  // DIVINITY is a list of its own, Preserve Life's button, Lisbet's charm (hidden)
  if (get('mode', '') === 'rulings0930') {
    var repU = { checks: [], errors: [] }, GU = D.grid;
    function okU(what, v) { repU.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runU(g) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mkU(q) { var Bx = D.npcFight(q, {}); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next(); return Bx; }
    try {
      // 1. Fear from an AI wizard: still frightened after its turn ends, so the hero flees
      var B1 = mkU('?npc=wizard:5&lvl=5&vs=fighter,rogue'), wz = B1.units.filter(function (u) { return u.side === 'foe'; })[0], ps = B1.units.filter(function (u) { return u.side === 'party'; });
      ps.forEach(function (w) { w.saves = Object.assign({}, w.saves, { wis: -30 }); });
      wz.x = 9; wz.y = 3; ps[0].x = 9; ps[0].y = 7; ps[1].x = 10; ps[1].y = 7;
      D.rules.startTurn(wz); runU(D.magic.cast(B1, wz, 'fear', 3, { x: 9, y: 7 }));
      var hit1 = ps.filter(function (w) { return w.conds.feared && w.conds.frightened; }).length;
      // the end of the wizard's turn: the sweep in ai.js turn (run a whole AI turn with nothing else worth doing)
      var sweep = B1.units.forEach; B1.units.forEach(function (w) { ['stunned', 'frightened'].forEach(function (c) { var s = w.conds[c]; if (s && s.by === wz.id && !(c === 'frightened' && (w.conds.turned || (w.conds.feared && w.conds.feared.by === wz.id) || (w.conds.killer && w.conds.killer.by === wz.id)))) { if (s.fresh) s.fresh = false; else delete w.conds[c]; } }); });
      var src = String(D.ai.turn); // (the rule as the AI's turn has it)
      okU('Fear: ' + hit1 + ' of 2 frightened; the AI turn keeps a spell\'s fright (' + /feared && w.conds.feared.by === u.id/.test(src) + '); after the sweep still frightened ' + ps.filter(function (w) { return w.conds.frightened; }).length + ', must flee ' + D.magic.mustFlee(ps[0]), hit1 === 2 && /feared && w.conds.feared.by === u.id/.test(src) && ps.every(function (w) { return w.conds.frightened; }) && D.magic.mustFlee(ps[0]));
      // 2. charmed by the foe: the player's hero cannot swing at it, nor aim a harmful spell at it; others yes
      var B2 = mkU('?npc=fighter,fighter&lvl=5&vs=wizard:5'), me = B2.units.filter(function (u) { return u.side === 'party'; })[0], f2 = B2.units.filter(function (u) { return u.side === 'foe'; });
      me.x = 9; me.y = 8; f2[0].x = 9; f2[0].y = 7; f2[1].x = 10; f2[1].y = 7; me.weapon = Object.assign({}, me.weapon, { ranged: false, reach: 5 });
      me.conds.charmed = { by: f2[0].id, breaks: true };
      var mm = D.magic.geo('magicmissile'), fb = D.magic.geo('firebolt');
      D.rules.startTurn(me);
      okU('charmed by ' + f2[0].name + ': canHit it ' + B2.canHit(me, f2[0]) + ', the other ' + B2.canHit(me, f2[1]) + '; Fire Bolt at it ' + D.magic.targetOK(B2, me, fb, f2[0]) + ' (' + D.magic.targetWhy(me, fb, f2[0]) + '), at the other ' + D.magic.targetOK(B2, me, fb, f2[1]), !B2.canHit(me, f2[0]) && B2.canHit(me, f2[1]) && !D.magic.targetOK(B2, me, fb, f2[0]) && D.magic.targetOK(B2, me, fb, f2[1]));
      var hp2 = f2[0].hp, n2 = (B2.log || []).length; runU(B2.exec(me, { do: 'attack', target: f2[0] }));
      okU('an attack at the charmer is refused, nothing spent: its HP ' + hp2 + ' -> ' + f2[0].hp + ', action ' + me.turn.action + '; the card: ' + (B2.log || []).slice(n2).join(' | ').slice(0, 90), f2[0].hp === hp2 && me.turn.action === 1);
      // 3. CHANNEL DIVINITY on the ring: a cleric and a paladin
      var B3 = mkU('?npc=fighter&lvl=5&vs=cleric:5,paladin:5'), cl = B3.units.filter(function (u) { return u.cls === 'cleric'; })[0], pl = B3.units.filter(function (u) { return u.cls === 'paladin'; })[0];
      D.rules.startTurn(cl); D.rules.startTurn(pl);
      var rc = D.ui.cmds(B3, cl), rp = D.ui.cmds(B3, pl);
      var gc = rc.filter(function (x) { return x.id === 'channel'; })[0], gp = rp.filter(function (x) { return x.id === 'channel'; })[0];
      var inSk = rc.concat(rp).filter(function (x) { return x.id === 'skills'; }).some(function (x) { return x.items.some(function (y) { return /turnundead|preservelife|sacred|turnunholy/.test(y.id); }); });
      okU('the ring: the cleric\'s ' + (gc ? gc.label + ' [' + gc.items.map(function (x) { return x.label; }).join(', ') + ']' : 'none') + '; the paladin\'s ' + (gp ? gp.label + ' [' + gp.items.map(function (x) { return x.label; }).join(', ') + ']' : 'none') + '; left in SKILLS: ' + inSk, gc && gp && gc.items.some(function (x) { return x.id === 'preservelife'; }) && gp.items.some(function (x) { return x.id === 'sacred'; }) && !inSk);
      // Preserve Life: two friends low
      var f3 = B3.units.filter(function (u) { return u.side === 'party' && u !== cl; }); f3.forEach(function (w) { w.hp = 2; w.x = cl.x + 1; }); cl.hp = 3;
      runU(D.features.exec(B3, cl, { do: 'preservelife' }));
      okU('Preserve Life: ' + f3.map(function (w) { return w.name + ' ' + w.hp + '/' + w.maxhp; }).join(', ') + ', herself ' + cl.hp + '/' + cl.maxhp + '; the use spent (' + cl.feats.channel + ')', f3.every(function (w) { return w.hp > 2 && w.hp <= Math.floor(w.maxhp / 2); }) && cl.feats.channel === 0);
      // 4. Lisbet's charm: a failed save against a fright holds, and the line never names it
      var B4 = mkU('?npc=cloaker&lvl=5&vs=fighter,rogue'), p4 = B4.units.filter(function (u) { return u.side === 'party'; });
      p4[0].src.equip.ring = 'charm'; p4.forEach(function (w) { w.saves = Object.assign({}, w.saves, { wis: -30 }); });
      var s4a = D.rules.save(p4[0], 'wis', 25, false, 'frightened'), s4b = D.rules.save(p4[1], 'wis', 25, false, 'frightened'), s4c = D.rules.save(p4[0], 'wis', 25, false, 'charmed');
      okU('the charm: ' + p4[0].name + ' against a fright ' + s4a.ok + ' (rolled ' + s4a.total + ' vs 25), ' + p4[1].name + ' ' + s4b.ok + '; against a charm ' + s4c.ok + '; the save text names nothing: "' + D.rules.saveText(s4a).replace(/\{\/?[a-z]*\}/g, '') + '"', s4a.ok && !s4b.ok && !s4c.ok && !/charm|lisbet/i.test(D.rules.saveText(s4a)));
    } catch (eU) { repU.errors.push(String(eU && eU.stack || eU).slice(0, 900)); }
    if (errs.length) repU.errors = repU.errors.concat(errs);
    var preU = document.createElement('pre'); preU.id = 'out'; preU.textContent = 'BENCH16 ' + JSON.stringify(repU);
    document.body.appendChild(preU);
    return;
  }
  // the ring's new buttons (mode=ring0930; RULED 09-30): Lymen's Turn the Unholy; the player's monk: FLURRY OF BLOWS / BONUS STRIKE,
  // WHOLENESS OF BODY, and Stunning Strike asked on a hit
  // the feature walk (mode=featurewalk; 09-30): every feature in the register (deep16/data/features.js) stepped through the feature gallery
  // (?fxgallery&features, js/gallery.js D.fxFeatures) -- a button built at its level and fired through the battle's exec, a passive with
  // its demonstration where it has one, the rest its card -- and per feature: fired / demo / card / blocked (the ring would not offer the
  // button on the stage) / error. The register is read in by a synchronous XHR when index.html does not load it yet (the seat adds the
  // script line); &only=a,b keeps to those
  if (get('mode', '') === 'featurewalk') {
    var EXPECT_W = { sneakattack: /sneak 1d6/, colossusslayer: /colossus slayer/, divinesmite: /smite \d/, stunningstrike: /stunning strike/, openhandtechnique: /open hand/, uncannydodge: /uncanny dodge/,
      deflectmissiles: /deflects the missile/, evasion_monk: /evasion/, evasion_rogue: /evasion/, firstblood: /FIRST BLOOD/, answerback: /answers back/, downinthesand: /down in the sand/, rimedoubles: /breaks to rime/,
      rimestep: /Rime Step/, sculptspells: /sculpted/, potentcantrip: /potent/, elementalaffinity: /affinity/, discipleoflife: /CURE WOUNDS/, blessedhealer: /blessed healer/, destroyundead: /DESTROYED/,
      darkonesblessing: /Dark One's Blessing/, agonizingblast: /1d10\+\d/, pactoftheblade: /\(pact\)/, pactofthetome: /SACRED FLAME/, auraofprotection: /aura \+/, auraofdevotion: /proof against/,
      steelwill: /steel will/, mindlessrage: /fearless/, wakeful: /vigil keeps/, supremesneak: /supreme sneak/, pitfists: /Fists/, fightingstyle_archery: /Shortbow/, fightingstyle_gwf: /Greatsword/, repellingblast: /Eldritch Blast/ };
    var repW ={ total: 0, fired: [], demo: [], card: [], blocked: [], silent: [], errors: [], byClass: {} };
    try {
      if (!D.FEATURES) { var xhrW = new XMLHttpRequest(); xhrW.open('GET', '../deep16/data/features.js', false); xhrW.send(); (0, eval)(xhrW.responseText); repW.loaded = 'by xhr'; }
      else repW.loaded = 'by index.html';
      D.seed = seed0; D.lastError = null;
      var Bw = D.fxGallery('?fxgallery&features' + (get('only', '') ? '&only=' + get('only', '') : '')); D.battle = Bw; Bw.enter();
      var Sw = Bw.gallery, guardW = 0, vW, doneW = 0;
      repW.total = Sw.ids.length;
      if (get('log', '')) repW.order = Sw.ids.slice();
      while (Bw.co && doneW < Sw.ids.length && guardW++ < 3000000) {
        var rW = Bw.co.next(vW); vW = undefined;
        if (rW.done) break;
        var yW = rW.value;
        if (typeof yW === 'number' || !yW) continue;
        if (yW.fx || yW.entry || yW.scene) continue;
        if (yW.prompt) { vW = yW.prompt.opts[0].value; continue; }
        if (yW.gallery) {
          var idW = Sw.ids[Sw.i], fW = D.FEATURES[idW], rp = Sw.report[idW] || { how: 'no report', cards: 0 }, tagW = fW.cls + ' ' + fW.lvl + ' ' + idW;
          repW.byClass[fW.cls] = (repW.byClass[fW.cls] || 0) + 1;
          if (get('log', '')) { (repW.logs = repW.logs || {})[idW] = (rp.tail || []).filter(function (l) { return !/^R\d+ (\d+ \/ \d+ |left\/right)/.test(l); }).slice(-14).map(function (l) { return l.slice(0, 200); }); }
          if (/^error/.test(rp.how)) repW.errors.push(tagW + ': ' + rp.how.replace(/\s+/g, ' '));
          else if (/^blocked/.test(rp.how)) repW.blocked.push(tagW + ': ' + rp.how);
          else if (rp.how === 'fired') { repW.fired.push(tagW); if (!rp.cards) repW.silent.push(tagW); }
          else if (rp.how === 'demo') {
            repW.demo.push(tagW); if (!rp.cards) repW.silent.push(tagW);
            // (did the demonstration show its feature? a phrase the log should carry, per feature; a miss on a random roll is listed, not failed)
            var exW = EXPECT_W[idW] || (/^extraattack_/.test(idW) ? 'TWO' : /^divinestrike_/.test(idW) ? /divine strike/ : null), txtW = (rp.tail || []).join('\n');
            if (exW === 'TWO' ? (txtW.match(/ > /g) || []).length < 2 : exW && !exW.test(txtW)) (repW.unconfirmed = repW.unconfirmed || []).push(tagW);
          }
          else repW.card.push(tagW);
          doneW++; vW = 1;
        }
      }
      if (doneW < Sw.ids.length) repW.errors.push('the walk stopped at ' + doneW + ' of ' + Sw.ids.length);
    } catch (eW) { repW.errors.push('walk: ' + String(eW && eW.stack || eW).slice(0, 700)); }
    if (errs.length) repW.errors = repW.errors.concat(errs);
    if (D.lastError) repW.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 300));
    var preW = document.createElement('pre'); preW.id = 'out'; preW.textContent = 'BENCH16 ' + JSON.stringify(repW);
    document.body.appendChild(preW);
    return;
  }
  if (get('mode', '') === 'ring0930') {
    var repR = { checks: [], errors: [] }, GR = D.grid;
    function okR(what, v) { repR.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runR(g, answer) { var v, k = 0, st, asked = []; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return asked; if (st.value && st.value.prompt) { asked.push(st.value.prompt.title); v = answer ? answer(st.value.prompt) : st.value.prompt.opts[0].value; } } return asked; }
    try {
      // Lymen, the ladder's paladin at 5
      var data = D.save.fixture(5), BL = new D.Battle({ ladder: true, fight: 'snoot', data: data }); D.battle = BL; BL.enter(); while (!BL.order.length) BL.co.next();
      var ly = BL.units.filter(function (u) { return u.id === 'lymen'; })[0]; D.rules.startTurn(ly);
      var sk = D.features.commands(BL, ly).map(function (c) { return c.label; });
      okR('Lymen at 5 (a hero, Devotion): ' + sk.join(', '), sk.indexOf('TURN THE UNHOLY') >= 0);
      // the player's monk 7 (Open Hand) beside two fighters
      var BM = D.npcFight('?npc=fighter,fighter&lvl=7&vs=monk:7', {}); D.battle = BM; BM.enter(); while (!BM.order.length) BM.co.next();
      var mk = BM.units.filter(function (u) { return u.cls === 'monk'; })[0], fs = BM.units.filter(function (u) { return u.side === 'foe'; });
      mk.x = 8; mk.y = 8; fs[0].x = 8; fs[0].y = 7; fs[1].x = 9; fs[1].y = 7; fs.forEach(function (f) { f.hp = f.maxhp = 500; f.baseAC = 1; });
      D.rules.startTurn(mk);
      var c0 = D.features.commands(BM, mk).filter(function (c) { return c.id === 'flurry'; })[0];
      okR('before the Attack action: ' + c0.label + ' greyed (' + !c0.ok + ': ' + c0.why + ')', !c0.ok);
      mk.turn.attackAction = true; mk.turn.action = 0;
      var c1 = D.features.commands(BM, mk).filter(function (c) { return c.id === 'flurry'; })[0], ki0 = mk.feats.ki, n0 = (BM.log || []).length;
      var asked = runR(D.features.exec(BM, mk, { do: 'flurry' }), function (p) { return /STUNNING/.test(p.title) ? false : p.opts[0].value; });
      var strikes = (BM.log || []).slice(n0).filter(function (l) { return /Unarmed Strike/.test(l); }).length;
      okR('after it: ' + c1.label + ' (' + c1.ok + '); used: ki ' + ki0 + ' -> ' + mk.feats.ki + ', ' + strikes + ' strikes logged; asked: ' + asked.join(' / '), c1.ok && mk.feats.ki === ki0 - 1 && strikes >= 2 && asked.some(function (t) { return /FLURRY/.test(t); }));
      okR('the bonus action is spent: ' + (mk.turn.bonus === 0), mk.turn.bonus === 0);
      // Stunning Strike, asked on a hit and taken
      D.rules.startTurn(mk); mk.turn.attackAction = true; mk.turn.action = 0; fs[0].saves = Object.assign({}, fs[0].saves, { con: -30 }); delete fs[0].conds.stunned; delete fs[1].conds.stunned;
      var ki1 = mk.feats.ki, st2 = runR(D.features.exec(BM, mk, { do: 'flurry' }), function (p) { return /STUNNING/.test(p.title) ? true : 1; });
      okR('Stunning Strike asked on a hit (' + st2.filter(function (t) { return /STUNNING/.test(t); }).length + 'x), taken: ki ' + ki1 + ' -> ' + mk.feats.ki + ', ' + fs[0].name + ' stunned ' + !!fs[0].conds.stunned, st2.some(function (t) { return /STUNNING/.test(t); }) && mk.feats.ki <= ki1 - 2 && !!fs[0].conds.stunned);
      // Wholeness of Body, hurt
      D.rules.startTurn(mk); mk.hp = 10; var cw = D.features.commands(BM, mk).filter(function (c) { return c.id === 'wholeness'; })[0];
      runR(D.features.exec(BM, mk, { do: 'wholeness' }));
      okR('Wholeness of Body: offered (' + !!(cw && cw.ok) + '), 10 -> ' + mk.hp + ' HP (3 x 7 = 21), spent (' + !mk.feats.wholeness + ')', cw && cw.ok && mk.hp === 31 && !mk.feats.wholeness);
      // a monk of 1: the bonus strike without ki
      var B1 = D.npcFight('?npc=fighter&lvl=1&vs=monk:1', {}); D.battle = B1; B1.enter(); while (!B1.order.length) B1.co.next();
      var m1 = B1.units.filter(function (u) { return u.cls === 'monk'; })[0], f1 = B1.units.filter(function (u) { return u.side === 'foe'; })[0];
      m1.x = 8; m1.y = 8; f1.x = 8; f1.y = 7; D.rules.startTurn(m1); m1.turn.attackAction = true; m1.turn.action = 0;
      var cb = D.features.commands(B1, m1).filter(function (c) { return c.id === 'flurry'; })[0];
      okR('a monk of 1: ' + (cb && cb.label) + ' (' + (cb && cb.ok) + ')', cb && cb.label === 'BONUS STRIKE' && cb.ok);
    } catch (eR) { repR.errors.push(String(eR && eR.stack || eR).slice(0, 900)); }
    if (errs.length) repR.errors = repR.errors.concat(errs);
    var preR = document.createElement('pre'); preR.id = 'out'; preR.textContent = 'BENCH16 ' + JSON.stringify(repR);
    document.body.appendChild(preR);
    return;
  }
  // the camp's CAST AHEAD (mode=campcast; RULED 09-30: "what's in there should be dependent on party members"; the earth elemental)
  if (get('mode', '') === 'campcast') {
    var repK = { checks: [], errors: [] }, GK = D.grid;
    function okK(what, v) { repK.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function camp(L, o) { var F = D.FIGHTS.filter(function (f) { return f.level === L; })[0] || D.FIGHTS[0]; var C = new D.Camp(L, F, function () { }, o); C.enter(); return C; }
    function rowsOf(C, mode) { C.mode = mode; var r = C.list().rows.map(function (x) { return x.label; }); C.mode = 'menu'; return r; }
    try {
      var C1 = camp(1, null), m1 = rowsOf(C1, 'menu');
      okK("the ladder's four at 1: CAST AHEAD " + (m1.indexOf('CAST AHEAD') >= 0 ? 'shown' : 'not shown') + ' (Mage Armor in Aurdin\'s book from the start: the SRD wizard\'s count, 10-01c)', m1.indexOf('CAST AHEAD') >= 0);
      var C5 = camp(5, null), m5 = rowsOf(C5, 'menu'), c5 = rowsOf(C5, 'cast');
      okK("the ladder's four at 5: " + c5.filter(function (l) { return /^\[/.test(l); }).join(' / '), m5.indexOf('CAST AHEAD') >= 0 && c5.some(function (l) { return /MAGE ARMOR/.test(l); }) && c5.some(function (l) { return /AID/.test(l); }) && !c5.some(function (l) { return /ELEMENTAL/.test(l); }));
      var F9 = D.FIGHTS.filter(function (f) { return f.level === 9; })[0], C9 = camp(9, { ours: { party: D.npc.ours(9, F9), play: false } }), c9 = rowsOf(C9, 'cast');
      var ei = C9.info.elemental;
      okK('our four at 9: ' + c9.filter(function (l) { return /^\[/.test(l); }).join(' / ') + '; the elemental: caster ' + (ei.caster ? ei.caster.name : '-') + ', ' + (ei.why || 'ready') + ', kinds ' + ei.kinds.join(','), ei.has && c9.some(function (l) { return /CONJURE ELEMENTAL/.test(l); }) && ei.kinds[0] === 'earthelemental');
      // prepare it, cast it, and fight
      var wz = C9.data.party.filter(function (h) { return h.cls === 'wizard'; })[0], pi = C9.pinfo[wz.id], cur = wz.prepared.slice();
      if (cur.indexOf('conjureelemental') < 0) { cur = cur.slice(0, Math.max(0, pi.n - 1)); cur.push('conjureelemental'); }
      C9.st.prep[wz.id] = cur; C9.st.cast.elemental.on = true; C9.save(); C9.rebuild();
      var e2 = C9.info.elemental;
      okK('cast ahead: on ' + e2.on + ' (' + (e2.why || 'a 5th-level slot spent') + '), the menu says "' + rowsOf(C9, 'menu').filter(function () { return true; }).length + ' rows"; ' + (C9.data.party.filter(function (h) { return h.cls === 'wizard'; })[0].slots || []).join(','), e2.on);
      var push0 = D.push, pushed = null; D.push = function (s) { pushed = s; }; C9.fight(); D.push = push0;
      if (pushed && pushed.enter) { D.battle = pushed; pushed.enter(); }
      var B = pushed, el = B && B.units.filter(function (u) { return u.summon && u.summon.id === 'conjureelemental'; })[0], wu = B && B.units.filter(function (u) { return u.cls === 'wizard' && u.side === 'party'; })[0];
      okK('the fight: ' + (el ? el.name + ' on the ' + el.side + "'s side, " + GK.dist(el, wu) + ' ft from him' : 'no elemental') + '; his concentration ' + (wu && wu.conc && wu.conc.id), !!el && el.side === 'party' && GK.dist(el, wu) <= 10 && wu.conc && wu.conc.id === 'conjureelemental');
      while (!B.order.length) B.co.next();
      okK('it has an initiative of its own: ' + (B.order.indexOf(el) >= 0) + ' (' + el.initRoll + ')', B.order.indexOf(el) >= 0);
      D.magic.endConc(B, wu, 'the bench');
      okK('his concentration breaks: ' + el.name + ' is on the ' + el.side + "'s side now, loose " + !!el.loose + '; the fight goes on while it stands (' + B.over() + ')', el.side === 'foe' && el.loose && !el.dead && B.over() === null);
    } catch (eK) { repK.errors.push(String(eK && eK.stack || eK).slice(0, 900)); }
    if (errs.length) repK.errors = repK.errors.concat(errs);
    var preK = document.createElement('pre'); preK.id = 'out'; preK.textContent = 'BENCH16 ' + JSON.stringify(repK);
    document.body.appendChild(preK);
    return;
  }
  // the druid's last (mode=druidlast; 09-30): Antilife Shell, Plant Growth, Cloudkill, Giant Insect
  if (get('mode', '') === 'druidlast') {
    var repL = { checks: [], errors: [] }, GL = D.grid;
    function okL(what, v) { repL.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runL(g) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mkL(fight) {
      var data = D.save.fixture(9); var Bx = new D.Battle({ ladder: true, fight: fight, bench: true, data: data }); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next();
      var dr = D.npc.build('druid:12', 12, 'party', { id: 'dr' }); dr.guest = true; dr.initRoll = 10; Bx.units.push(dr); Bx.order.push(dr);
      return Bx;
    }
    function freeSq(B, near, avoid) { for (var r = 0; r < 12; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { var x = near[0] + dx, y = near[1] + dy, s = GL.map.at(x, y); if (s && s.walk && !GL.occupant(x, y) && !(avoid && avoid(x, y))) return [x, y]; } return null; }
    try {
      // Antilife Shell on the snoot road
      var B1 = mkL('snoot'), dr = B1.units.filter(function (u) { return u.id === 'dr'; })[0], fo = B1.units.filter(function (u) { return u.side === 'foe'; });
      var c0 = freeSq(B1, [9, 8]); dr.x = c0[0]; dr.y = c0[1];
      B1.units.forEach(function (w) { if (w !== dr && GL.dist(dr, w) <= 15) { var q = freeSq(B1, [2, 2]); w.x = q[0]; w.y = q[1]; } });
      var f0 = fo[0], fq = freeSq(B1, [dr.x, dr.y - 3], function (x, y) { return GL.dist(dr, { x: x, y: y, size: f0.size || 1 }) <= 10; }); f0.x = fq[0]; f0.y = fq[1];
      D.rules.startTurn(dr); runL(D.magic.cast(B1, dr, 'antilifeshell', 5, dr));
      var rm = GL.reach(f0, 60), inside = Object.keys(rm).filter(function (k) { var q = rm[k]; return GL.dist(dr, { x: q.x, y: q.y, size: f0.size || 1 }) <= 10; }).length;
      okL('Antilife Shell: the ' + f0.kind + ' ' + GL.dist(dr, f0) + ' ft off can reach ' + inside + ' squares inside the 10 ft; his concentration ' + (dr.conc && dr.conc.id), inside === 0 && dr.conc && dr.conc.id === 'antilifeshell');
      var ally = B1.units.filter(function (u) { return u.id === 'barley'; })[0], aq = freeSq(B1, [dr.x + 1, dr.y]); ally.x = aq[0]; ally.y = aq[1]; B1.shells[0].inside = 'barley';
      var fq2 = freeSq(B1, [ally.x + 2, ally.y], function (x, y) { return GL.dist(dr, { x: x, y: y, size: f0.size || 1 }) <= 10 || GL.dist(ally, { x: x, y: y, size: f0.size || 1 }) > 5; });
      if (fq2) { f0.x = fq2[0]; f0.y = fq2[1]; }
      var atk = f0.attacks && f0.attacks[Object.keys(f0.attacks)[0]] || f0.weapon;
      okL('a blow across it is turned: ' + D.walls.shellTurns(B1, f0, ally, atk) + ' (the ' + f0.kind + ' ' + GL.dist(f0, ally) + ' ft from Barley inside); an arrow is not (' + D.walls.shellTurns(B1, f0, ally, { ranged: true }) + ')', D.walls.shellTurns(B1, f0, ally, atk) && !D.walls.shellTurns(B1, f0, ally, { ranged: true }));
      // he walks off and leaves Barley outside: forced through, the shell is gone
      var away = freeSq(B1, [dr.x - 3, dr.y], function (x, y) { return GL.dist(ally, { x: x, y: y, size: 1 }) <= 10; });
      var path = away ? GL.path(GL.reach(dr, 60), away[0], away[1]) : null;
      if (path) runL(B1.moveAlong(dr, path, { spend: false }));
      okL('he moves so Barley is forced through: the shell ends (' + !dr.conc + ')', !!path && !dr.conc);
      // Plant Growth on the north road (grass)
      var B2 = mkL('roadcatch1'), d2 = B2.units.filter(function (u) { return u.id === 'dr'; })[0], gq = null;
      for (var y = 0; y < GL.map.h && !gq; y++) for (var x = 0; x < GL.map.w && !gq; x++) { var s = GL.map.at(x, y); if (s && s.ch === 'g') gq = [x, y]; }
      var nb = null; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var s = GL.map.at(gq[0] + d[0], gq[1] + d[1]); if (!nb && s && s.walk) nb = [gq[0] + d[0], gq[1] + d[1]]; });
      var walker = B2.units.filter(function (u) { return u.id === 'vivian'; })[0], c1 = GL.stepCost(walker, nb[0], nb[1], gq[0], gq[1]);
      D.rules.startTurn(d2); runL(D.magic.cast(B2, d2, 'plantgrowth', 3, { x: gq[0], y: gq[1] }));
      var c2 = GL.stepCost(walker, nb[0], nb[1], gq[0], gq[1]);
      okL('Plant Growth: ' + Object.keys(B2.overgrown || {}).length + ' squares of grass grown; a step onto one costs ' + c1 + ' -> ' + c2 + ' ft; greyed in a cave (' + ((D.magic.EFFECT.plantgrowth.list() || {}).why || 'not greyed') + ' there: checked below)', Object.keys(B2.overgrown || {}).length > 10 && c2 === c1 + 15); // (10-01: 4 ft a foot -- a square 20 ft in all, 15 over its own 5)
      // Cloudkill: a foe starting its turn in it is poisoned; it drifts from him; it blinds the line; a Wind Wall scatters it
      var B3 = mkL('snoot'), d3 = B3.units.filter(function (u) { return u.id === 'dr'; })[0], f3 = B3.units.filter(function (u) { return u.side === 'foe'; })[0];
      var p3 = freeSq(B3, [9, 11]); d3.x = p3[0]; d3.y = p3[1]; f3.hp = f3.maxhp = 999; f3.x = d3.x; f3.y = d3.y - 5; var fx0 = [f3.x, f3.y];
      D.rules.startTurn(d3); runL(D.magic.cast(B3, d3, 'cloudkill', 5, { x: f3.x, y: f3.y }));
      var cl = (B3.darks || []).filter(function (d) { return d.kind === 'kill'; })[0], hpS = f3.hp;
      D.rules.startTurn(f3); // (its turn's start runs M.onStart: magic.js)
      okL('Cloudkill: the ' + f3.kind + ' starts its turn in it: ' + (hpS - f3.hp) + ' poison; sight across it: ' + D.magic.seeWhy(B3, d3, f3).why, hpS > f3.hp && D.magic.seeWhy(B3, d3, f3).why === 'the cloud');
      var cy0 = cl.cy; D.rules.startTurn(d3);
      okL('at his turn it rolls 10 ft away from him: centre row ' + cy0 + ' -> ' + cl.cy, Math.abs(cl.cy - cy0) === 2 && Math.abs(cl.cy - d3.y) > Math.abs(cy0 - d3.y));
      d3.conc = null; runL(D.magic.cast(B3, d3, 'windwall', 3, { x: cl.cx, y: cl.cy }));
      okL('a Wind Wall through it scatters it: ' + !(B3.darks || []).some(function (d) { return d.kind === 'kill'; }), !(B3.darks || []).some(function (d) { return d.kind === 'kill'; }));
      // Giant Insect: three giant spiders, on his turn
      var B4 = mkL('snoot'), d4 = B4.units.filter(function (u) { return u.id === 'dr'; })[0], n4 = B4.units.length;
      var p4 = freeSq(B4, [9, 10]); d4.x = p4[0]; d4.y = p4[1]; D.rules.startTurn(d4);
      runL(D.magic.cast(B4, d4, 'giantinsect', 4, { x: d4.x, y: d4.y - 2 }));
      var bugs = B4.units.slice(n4), at = B4.order.indexOf(d4);
      okL('Giant Insect: ' + bugs.length + ' ' + (bugs[0] && bugs[0].kind) + ', right after him in the order (' + bugs.map(function (w) { return B4.order.indexOf(w) - at; }).join(',') + '), on his roll (' + bugs.every(function (w) { return w.initRoll === d4.initRoll; }) + ')', bugs.length === 3 && bugs[0].kind === 'giantspider' && bugs.every(function (w, i) { return B4.order.indexOf(w) === at + 1 + i && w.initRoll === d4.initRoll; }));
    } catch (eL) { repL.errors.push(String(eL && eL.stack || eL).slice(0, 900)); }
    if (errs.length) repL.errors = repL.errors.concat(errs);
    var preL = document.createElement('pre'); preL.id = 'out'; preL.textContent = 'BENCH16 ' + JSON.stringify(repL);
    document.body.appendChild(preL);
    return;
  }
  // shapes and charms (mode=charms; 09-30, the druid to twelve steps 3 and 4): Polymorph on a foe and on a friend, its pool, the blow through
  // it, concentration's end; Dominate Beast's side, its save when hurt, its end; Charm Person's filter and its breaking; Animal Friendship
  if (get('mode', '') === 'charms') {
    var repC = { checks: [], errors: [] }, GC = D.grid;
    function okC(what, v) { repC.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runC(g, pick) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = pick || st.value.prompt.opts[0].value; } }
    function mkC() {
      var data = D.save.fixture(9); var Bx = new D.Battle({ ladder: true, fight: 'snoot', bench: true, data: data }); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next();
      var dr = D.npc.build('druid:12', 12, 'party', { id: 'dr' }); dr.x = 10; dr.y = 12; dr.guest = true; Bx.units.push(dr); Bx.order.push(dr);
      return Bx;
    }
    function winC(u, dc) { u.saves = Object.assign({}, u.saves || {}); u.saves.wis = dc ? -30 : 30; } // (a sure fail or a sure save on WIS)
    try {
      // Polymorph on a foe: the gnoll becomes the weakest beast; its HP kept behind the beast's
      var B1 = mkC(), dr = B1.units.filter(function (u) { return u.id === 'dr'; })[0], gn = B1.units.filter(function (u) { return u.side === 'foe' && u.type !== 'beast'; })[0];
      gn.x = 10; gn.y = 8; winC(gn, true); var hp0 = gn.hp, kind0 = gn.sheet; D.rules.startTurn(dr);
      runC(D.magic.cast(B1, dr, 'polymorph', 4, gn));
      okC('Polymorph a ' + gn.kind + ' (CR ' + gn.cr + '): now ' + (gn.beast && gn.beast.kind) + ' (' + (gn.beast && gn.beast.hp) + ' HP, AC ' + gn.baseAC + ', type ' + gn.type + ', known ' + (gn.known || []).length + '); its own ' + gn.hp + ' kept; his concentration ' + (dr.conc && dr.conc.id), !!gn.beast && gn.beast.morph && gn.type === 'beast' && gn.hp === hp0 && dr.conc && dr.conc.id === 'polymorph');
      var bh = gn.beast.hp; B1.hurt(gn, 1, 'slashing');
      okC('a blow smaller than the beast: the beast ' + bh + ' -> ' + (gn.beast && gn.beast.hp) + ', its own ' + gn.hp, gn.beast && gn.beast.hp === bh - 1 && gn.hp === hp0);
      B1.hurt(gn, gn.beast.hp + 3, 'slashing');
      okC('a blow through it: back in its own shape (' + !gn.beast + ', sheet ' + (gn.sheet === kind0) + '), 3 over (' + (hp0 - gn.hp) + '), his concentration gone (' + !dr.conc + ')', !gn.beast && gn.sheet === kind0 && hp0 - gn.hp === 3 && !dr.conc);
      // on a friend (the player's own caster: asked), the strongest beast of her level; and gone with concentration
      var B2 = mkC(), dr2 = B2.units.filter(function (u) { return u.id === 'dr'; })[0], bar = B2.units.filter(function (u) { return u.id === 'barley'; })[0];
      dr2.guest = false; D.rules.startTurn(dr2); var asked = null;
      var g2 = D.magic.cast(B2, dr2, 'polymorph', 4, bar), st2, v2; do { st2 = g2.next(v2); v2 = undefined; if (st2.value && st2.value.prompt) { asked = st2.value.prompt; v2 = 1; } } while (!st2.done);
      okC('Polymorph a friend: asked (' + (asked ? asked.opts.slice(0, 3).map(function (o) { return o.label.split('  ')[0]; }).join(' / ') : 'no') + '); Barley is ' + (bar.beast && bar.beast.kind) + ', his weapon ' + (bar.weapon && bar.weapon.name), !!asked && !!bar.beast && !!bar.weapon);
      D.magic.endConc(B2, dr2, 'the bench');
      okC('concentration ends: Barley himself again (' + !bar.beast + ', ' + (bar.weapon && bar.weapon.name) + ')', !bar.beast);
      // Dominate Beast: a hyena fights for the druid; hurt, it saves; free, its side again
      var B3 = mkC(), dr3 = B3.units.filter(function (u) { return u.id === 'dr'; })[0], hy = B3.units.filter(function (u) { return u.side === 'foe' && u.type === 'beast'; })[0];
      hy.x = 10; hy.y = 9; winC(hy, true); D.rules.startTurn(dr3);
      runC(D.magic.cast(B3, dr3, 'dominatebeast', 4, hy));
      okC('Dominate Beast: the ' + hy.kind + ' is on the ' + hy.side + "'s side (" + !!hy.dominated + '), run by the fight (guest ' + hy.guest + ')', hy.side === 'party' && !!hy.dominated && hy.guest);
      var gnolls = B3.units.filter(function (u) { return u.side === 'foe' && G3(u); }); function G3(u) { return GC.standing(u); }
      var tg = gnolls[0]; tg.x = 10; tg.y = 8; tg.hp = tg.maxhp = 500; var h0 = tg.hp, n3 = (B3.log || []).length; D.rules.startTurn(hy); runC(D.ai.turn(B3, hy));
      var said3 = (B3.log || []).slice(n3).filter(function (l) { return /Hyena/.test(l); });
      okC('it goes for its old pack: ' + (h0 - tg.hp) + ' dealt to the ' + tg.kind + ' (' + said3.join(' | ').slice(0, 140) + ')', said3.length > 0);
      winC(hy, false); B3.active = tg; B3.hurt(hy, 1, 'slashing');
      okC('hurt, it saves and is free: side ' + hy.side + ', dominated ' + !!hy.dominated + ', his concentration ' + (dr3.conc ? dr3.conc.id : 'gone'), hy.side === 'foe' && !hy.dominated && !dr3.conc);
      var over4 = (function () { var B4 = mkC(), d4 = B4.units.filter(function (u) { return u.id === 'dr'; })[0], h4 = B4.units.filter(function (u) { return u.side === 'foe' && u.type === 'beast'; })[0]; winC(h4, true); D.rules.startTurn(d4); runC(D.magic.cast(B4, d4, 'dominatebeast', 4, h4)); B4.units.forEach(function (u) { if (u.side === 'party' && !u.dominated) { u.hp = 0; u.dead = true; } }); return B4.over(); })();
      okC('a dominated beast keeps no fight going for them: over with it alone on our side is ' + over4, over4 === 'lost');
      // Charm Person: a gnoll will not pick the druid; her friend's blow breaks it
      var B5 = mkC(), dr5 = B5.units.filter(function (u) { return u.id === 'dr'; })[0], g5 = B5.units.filter(function (u) { return u.side === 'foe' && u.type === 'humanoid'; })[0], lym = B5.units.filter(function (u) { return u.id === 'lymen'; })[0];
      if (!g5) okC('no humanoid foe in the snoot fight to charm', false);
      else {
        g5.x = 10; g5.y = 11; winC(g5, true); D.rules.startTurn(dr5);
        runC(D.magic.cast(B5, dr5, 'charmperson', 1, g5));
        var picks = D.ai.heroes(B5, g5).map(function (w) { return w.id; });
        okC('Charm Person on the ' + g5.kind + ': charmed by ' + (g5.conds.charmed && g5.conds.charmed.by) + '; it knows of ' + picks.join(',') + ' -- not the druid (' + (picks.indexOf('dr') < 0) + ')', g5.conds.charmed && picks.indexOf('dr') < 0);
        B5.active = lym; B5.hurt(g5, 1, 'slashing');
        okC("her friend's blow breaks it: charmed " + !!g5.conds.charmed, !g5.conds.charmed);
      }
      // Animal Friendship: a hyena (INT 2) charmed; a humanoid is no target
      var B6 = mkC(), dr6 = B6.units.filter(function (u) { return u.id === 'dr'; })[0], h6 = B6.units.filter(function (u) { return u.side === 'foe' && u.type === 'beast'; })[0], g6 = B6.units.filter(function (u) { return u.side === 'foe' && u.type === 'humanoid'; })[0];
      winC(h6, true); D.rules.startTurn(dr6); runC(D.magic.cast(B6, dr6, 'animalfriendship', 1, h6));
      var gAF = D.magic.geo('animalfriendship');
      okC('Animal Friendship: the ' + h6.kind + ' charmed (' + !!h6.conds.charmed + '); a ' + (g6 && g6.kind) + ' no target (' + (g6 ? !D.magic.targetOK(B6, dr6, gAF, g6) : true) + ')', !!h6.conds.charmed && (!g6 || !D.magic.targetOK(B6, dr6, gAF, g6)));
    } catch (eC) { repC.errors.push(String(eC && eC.stack || eC).slice(0, 900)); }
    if (errs.length) repC.errors = repC.errors.concat(errs);
    var preC = document.createElement('pre'); preC.id = 'out'; preC.textContent = 'BENCH16 ' + JSON.stringify(repC);
    document.body.appendChild(preC);
    return;
  }
  // the walls (mode=walls; 09-30, the druid to twelve step 2): stone bars the way and the eye and shoves; fire burns in it and on its far
  // side, opaque, lit; thorns cost 20 ft a square and rake; the wind throws arrows up and bars a small flier; concentration takes them.
  // On the class floor (hexfloor, 18 x 14): column 14 is open from row 2 to row 11; the wall rises on row 6, the caster stands on row 11
  if (get('mode', '') === 'walls') {
    var repW = { checks: [], errors: [] }, GW = D.grid, X = 14;
    function okW(what, v) { repW.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runW(g) { var v, k = 0, st; while (g && k++ < 4000) { st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mkW() { var Bx = D.npcFight('?npc=druid:12&lvl=12', { bench: true }); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next(); return Bx; }
    function putW(B, w, x, y) { w.x = x; w.y = y; }
    function sideW(B) { return [B.units.filter(function (u) { return u.side === 'foe'; })[0], B.units.filter(function (u) { return u.side === 'party'; })]; }
    try {
      // stone
      var B1 = mkW(), s1 = sideW(B1), dz = s1[0], ps = s1[1];
      ps.forEach(function (w, i) { putW(B1, w, 2 + i, 3); });
      putW(B1, dz, X, 11); var bar = ps[0]; putW(B1, bar, X, 6); var ally = ps[1]; ally.side = 'foe'; putW(B1, ally, X + 1, 6); // (one of his own stands in it too)
      var g1 = D.magic.geo('wallofstone'); D.rules.startTurn(dz);
      var sq1 = D.magic.area(dz, g1, X, 6);
      runW(D.magic.cast(B1, dz, 'wallofstone', 5, { x: X, y: 6 }));
      var w1 = (B1.walls || [])[0];
      okW('stone: ' + sq1.length + ' squares across his line (' + sq1.map(function (q) { return q.join(','); }).join(' ') + '), all on row 6 ' + sq1.every(function (q) { return q[1] === 6; }), sq1.length >= 6 && sq1.every(function (q) { return q[1] === 6; }) && !!w1);
      okW('stone pushes out: the foe of his to the far side (' + bar.x + ',' + bar.y + '), his own to his (' + ally.x + ',' + ally.y + ')', bar.y < 6 && ally.y > 6);
      var losBefore = true;
      okW('stone bars the way (canPass ' + GW.canPass(bar, X, 6) + ') and the eye (los ' + GW.los(bar, dz).clear + ', losPoint ' + GW.losPoint(X, 4, X, 11) + ')', !GW.canPass(bar, X, 6) && !GW.los(bar, dz).clear && !GW.losPoint(X, 4, X, 11));
      D.magic.endConc(B1, dz, 'the bench');
      okW('his concentration goes: the stone is gone (' + (B1.walls || []).length + ' walls), the way open (' + GW.canPass(bar, X, 6) + '), the eye clear (' + GW.losPoint(X, 4, X, 11) + ')', !(B1.walls || []).length && GW.canPass(bar, X, 6) && GW.losPoint(X, 4, X, 11));
      // fire: three of the party in a row where it rises, one on its far side
      var B2 = mkW(), s2 = sideW(B2), d2 = s2[0], p2 = s2[1];
      putW(B2, d2, X, 11); putW(B2, p2[0], X - 1, 6); putW(B2, p2[1], X, 6); putW(B2, p2[2], X + 1, 6); putW(B2, p2[3], X, 4);
      p2.forEach(function (w) { w.hp = w.maxhp = 999; });
      var hp0 = p2.map(function (w) { return w.hp; }); D.rules.startTurn(d2);
      var lights0 = (B2.lights || []).length, los2 = GW.los(p2[3], d2).clear;
      runW(D.magic.cast(B2, d2, 'walloffire', 4, { x: X, y: 6 }));
      var w2 = (B2.walls || [])[0], burnt = p2.slice(0, 3).filter(function (w, i) { return w.hp < hp0[i]; }).length;
      okW('fire rises: ' + burnt + ' of the three in it burnt; opaque (los ' + GW.los(p2[3], d2).clear + ', before ' + los2 + '); ' + ((B2.lights || []).length - lights0) + ' lights along it; the burning side is the far one (row 4 ' + !!(w2 && w2.band[X + ',4']) + ', row 8 ' + !!(w2 && w2.band[X + ',8']) + ')', burnt >= 1 && los2 && !GW.los(p2[3], d2).clear && (B2.lights || []).length > lights0 && w2.band[X + ',4'] && !w2.band[X + ',8']);
      var hpA = p2[3].hp; D.rules.startTurn(p2[3]); D.magic.endTurn(B2, p2[3]);
      okW('ending a turn within 10 ft of its far side: ' + (hpA - p2[3].hp) + ' fire', p2[3].hp < hpA);
      var wk = p2[3]; putW(B2, wk, X + 2, 5); D.rules.startTurn(wk); var hpB = wk.hp;
      runW(B2.moveAlong(wk, [[X + 2, 6], [X + 2, 7]], { spend: true }));
      var once = hpB - wk.hp; runW(B2.moveAlong(wk, [[X + 2, 6]], { spend: true }));
      okW('walking into it: ' + once + ' fire, and not again the same turn (' + (hpB - wk.hp - once) + ')', once > 0 && hpB - wk.hp === once);
      D.magic.endConc(B2, d2, 'the bench');
      okW('fire gone with his concentration, and its lights (' + (B2.lights || []).length + ' = ' + lights0 + ')', !(B2.walls || []).length && (B2.lights || []).length === lights0);
      // thorns
      var B3 = mkW(), s3 = sideW(B3), d3 = s3[0], p3 = s3[1];
      p3.forEach(function (w, i) { putW(B3, w, 2 + i, 3); w.hp = w.maxhp = 999; }); putW(B3, d3, X, 11); putW(B3, p3[1], X, 3); D.rules.startTurn(d3);
      var los3 = GW.los(p3[1], d3).clear;
      runW(D.magic.cast(B3, d3, 'wallofthorns', 6, { x: X, y: 6 }));
      var cost = GW.stepCost(p3[0], X, 5, X, 6);
      putW(B3, p3[0], X, 5); D.rules.startTurn(p3[0]); var hpC = p3[0].hp; runW(B3.moveAlong(p3[0], [[X, 6]], { spend: true }));
      okW('thorns: a square of it costs ' + cost + ' ft; stepping in rakes ' + (hpC - p3[0].hp) + '; it blocks sight (los ' + GW.los(p3[1], d3).clear + ', before ' + los3 + ')', cost === 20 && p3[0].hp < hpC && los3 && !GW.los(p3[1], d3).clear);
      // wind
      var B4 = mkW(), s4 = sideW(B4), d4 = s4[0], p4 = s4[1];
      p4.forEach(function (w, i) { putW(B4, w, 2 + i, 3); }); putW(B4, d4, X, 11); putW(B4, p4[0], X, 2); D.rules.startTurn(d4);
      var los4 = GW.los(p4[0], d4).clear;
      runW(D.magic.cast(B4, d4, 'windwall', 3, { x: X, y: 6 }));
      var bow = { name: 'Longbow', ranged: true, dice: '1d8' }, bolt = { name: 'Fire Bolt', ranged: true, spell: true };
      var owl = { flies: true, size: 1, conds: {}, x: X, y: 5 };
      okW('wind: an arrow across it stops (' + D.walls.windStops(B4, p4[0], d4, bow) + '), a spell does not (' + D.walls.windStops(B4, p4[0], d4, bolt) + '); a small flier cannot cross (' + !GW.canPass(owl, X, 6) + '); sight passes (los ' + GW.los(p4[0], d4).clear + ', before ' + los4 + ')', D.walls.windStops(B4, p4[0], d4, bow) && !D.walls.windStops(B4, p4[0], d4, bolt) && !GW.canPass(owl, X, 6) && los4 && GW.los(p4[0], d4).clear);
      // the AI raises fire where the most of them stand
      var B5 = mkW(), s5 = sideW(B5), d5 = s5[0], p5 = s5[1];
      putW(B5, d5, X, 11); p5.forEach(function (w, i) { putW(B5, w, X - 3 + i, 5); }); D.rules.startTurn(d5);
      var e5 = D.magic.list(B5, d5).filter(function (e) { return e.id === 'walloffire'; })[0];
      var plan = e5 && D.magic.EFFECT.walloffire.ai(B5, d5, e5, 4, p5, []);
      okW('the AI would raise fire on the four in a row: ' + (plan ? 'score ' + Math.round(plan.score) + ' at ' + plan.t.x + ',' + plan.t.y : 'no plan'), !!plan && plan.score > 0);
    } catch (eW) { repW.errors.push(String(eW && eW.stack || eW).slice(0, 900)); }
    if (errs.length) repW.errors = repW.errors.concat(errs);
    var preW = document.createElement('pre'); preW.id = 'out'; preW.textContent = 'BENCH16 ' + JSON.stringify(repW);
    document.body.appendChild(preW);
    return;
  }
  if (get('mode', '') === 'zones') {
    var rep5 = { checks: [], errors: [] }, M5 = D.magic, G5 = D.grid, F5 = D.features;
    function ok5(what, v) { rep5.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function run5(g, ans) { var v, k = 0; while (g && k++ < 500) { var st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = ans != null ? ans : st.value.prompt.opts[0].value; } }
    function entry(B, u, id) { return M5.list(B, u).filter(function (e) { return e.id === id; })[0]; }
    try {
      var B8 = new D.Battle({ npc: { party: ['druid:5'], foes: ['fighter:5', 'fighter:5'] }, bench: true, fightDef: D.classFight(5) });
      D.battle = B8; B8.enter(); B8.units.forEach(function (u) { if (u.side === 'party') u.guest = false; });
      var dr = B8.units.filter(function (u) { return u.side === 'party'; })[0], f8 = B8.units.filter(function (u) { return u.side === 'foe'; }), fa = f8[0], fb = f8[1];
      dr.known = ['moonbeam', 'flamingsphere', 'produceflame']; dr.slots = [4, 3, 2]; dr.slotsMax = dr.slots.slice();
      fa.x = dr.x; fa.y = dr.y - 4; fb.x = dr.x + 5; fb.y = dr.y - 4; fa.saves = Object.assign({}, fa.saves, { con: -30, dex: -30 }); fb.saves = Object.assign({}, fb.saves, { con: -30, dex: -30 });
      ok5('the druid knows ' + dr.known.join(','), true);
      // Moonbeam at the first foe
      B8.round = 1; B8.active = dr; D.rules.startTurn(dr); var e1 = entry(B8, dr, 'moonbeam');
      ok5('Moonbeam listed: ' + (e1 ? (e1.ok ? 'ok' : e1.why) + ', slot ' + e1.slot : 'missing'), !!(e1 && e1.ok));
      var hp0 = fa.hp; run5(B8.exec(dr, { do: 'cast', id: 'moonbeam', slot: e1.slot, target: { x: fa.x, y: fa.y } }));
      var z1 = (B8.zones || []).filter(function (z) { return z.id === 'moonbeam'; })[0];
      ok5('the beam stands at ' + (z1 && z1.x + ',' + z1.y) + ', the slot spent (' + dr.slots.join('/') + '), concentrating on ' + (dr.conc && dr.conc.id) + '; the foe under it took ' + (hp0 - fa.hp), !!(z1 && z1.x === fa.x && dr.slots[1] === 2 && dr.conc && dr.conc.id === 'moonbeam' && fa.hp < hp0));
      // its turn starts in the beam: hurt again; a second start in the same turn is not
      var hp1 = fa.hp; B8.active = fa; B8.round = 2; D.rules.startTurn(fa); var hp2 = fa.hp; M5.onStart(B8, fa); var hp3 = fa.hp;
      ok5('starting a turn in the beam: ' + (hp1 - hp2) + ' taken; asked again the same turn, ' + (hp2 - hp3) + ' more', hp2 < hp1 && hp3 === hp2);
      // the caster moves it (an action, no slot) onto the second foe
      B8.active = dr; B8.round = 3; D.rules.startTurn(dr); var e2 = entry(B8, dr, 'moonbeam');
      ok5('the beam up: the list says ' + (e2 ? (e2.g.again ? 'again, free' : 'a new cast') + (e2.ok ? '' : ' (' + e2.why + ')') : 'missing'), !!(e2 && e2.ok && e2.g.again && e2.g.free));
      var hpb = fb.hp, s0 = dr.slots.join('/'); run5(B8.exec(dr, { do: 'cast', id: 'moonbeam', slot: e2.slot, target: { x: fb.x, y: fb.y } }));
      ok5('moved to ' + z1.x + ',' + z1.y + ' (the second foe at ' + fb.x + ',' + fb.y + '), slots ' + s0 + ' -> ' + dr.slots.join('/') + ', the action spent ' + !dr.turn.action + ', the foe took ' + (hpb - fb.hp), z1.x === fb.x && z1.y === fb.y && dr.slots.join('/') === s0 && !dr.turn.action && fb.hp < hpb);
      // too far: 60 ft of the way
      B8.round = 4; D.rules.startTurn(dr); run5(B8.exec(dr, { do: 'cast', id: 'moonbeam', slot: e2.slot, target: { x: fb.x + 20, y: fb.y } }));
      ok5('asked 100 ft off, it goes 60: now at ' + z1.x + ',' + z1.y, z1.x === fb.x + 12 || z1.x === fb.x + 12 - 1);
      // concentration ends: the zone goes
      M5.endConc(B8, dr, 'the check'); ok5('concentration dropped: zones left ' + (B8.zones || []).length, !(B8.zones || []).length);
      // Flaming Sphere beside the first foe, then rolled into the second
      B8.round = 5; D.rules.startTurn(dr); var e3 = entry(B8, dr, 'flamingsphere');
      ok5('Flaming Sphere listed: ' + (e3 ? (e3.ok ? 'ok' : e3.why) : 'missing'), !!(e3 && e3.ok));
      run5(B8.exec(dr, { do: 'cast', id: 'flamingsphere', slot: e3.slot, target: { x: fa.x, y: fa.y } }));
      var z2 = (B8.zones || []).filter(function (z) { return z.id === 'flamingsphere'; })[0], lt = (B8.lights || []).filter(function (l) { return l.kind === 'sphere'; })[0];
      ok5('the sphere at ' + (z2 && z2.x + ',' + z2.y) + ' (the foe at ' + fa.x + ',' + fa.y + ': a free square beside it), its light ' + (lt ? lt.bright + '/' + lt.dim : 'none') + ', concentrating on ' + (dr.conc && dr.conc.id), !!(z2 && !(z2.x === fa.x && z2.y === fa.y) && G5.dist(fa, { x: z2.x, y: z2.y, size: 1 }) <= 5 && lt && lt.bright === 20 && dr.conc.id === 'flamingsphere'));
      var hpa = fa.hp; B8.active = fa; M5.onEnd(B8, fa); ok5('the foe ends its turn beside it: took ' + (hpa - fa.hp), fa.hp < hpa);
      B8.active = dr; B8.round = 6; D.rules.startTurn(dr); var e4 = entry(B8, dr, 'flamingsphere');
      ok5('the sphere up: ' + (e4 ? (e4.g.again ? 'again, a bonus action (' + e4.g.time + ')' : 'a new cast') + (e4.ok ? '' : ' -- ' + e4.why) : 'missing'), !!(e4 && e4.ok && e4.g.again && e4.g.time === 'B'));
      var hpb2 = fb.hp, zx = z2.x; run5(B8.exec(dr, { do: 'cast', id: 'flamingsphere', slot: e4.slot, target: { x: fb.x, y: fb.y } }));
      ok5('rolled from ' + zx + ' to ' + z2.x + ',' + z2.y + ' and rammed the second foe (took ' + (hpb2 - fb.hp) + '); the bonus spent ' + !dr.turn.bonus + ', the action kept ' + !!dr.turn.action + ', the light moved ' + (lt.x === z2.x), fb.hp < hpb2 && G5.dist(fb, { x: z2.x, y: z2.y, size: 1 }) <= 5 && !dr.turn.bonus && !!dr.turn.action && lt.x === z2.x);
      ok5('the AI weighs the roll: ' + JSON.stringify((M5.EFFECT.flamingsphere.ai(B8, dr, e4, e4.slot, f8) || {}).t), true);
      // Wild Shape: the button, the pick, the way back
      B8.round = 7; D.rules.startTurn(dr); var cmds = F5.commands(B8, dr).map(function (c) { return c.id + (c.ok ? '' : '(no)'); });
      ok5('the druid\'s buttons: ' + cmds.join(','), cmds.indexOf('wildshape') >= 0);
      run5(F5.exec(B8, dr, { do: 'wildshape' }), 2); // (the second shape offered: the wolf spider)
      ok5('WILD SHAPE, the second on offer: ' + (dr.beast && dr.beast.kind) + ' (' + (dr.beast && dr.beast.hp) + ' HP of its own), bites for ' + (dr.weapon && dr.weapon.dice) + ', poison ' + !!(dr.weapon && dr.weapon.save) + ', no spells (' + dr.known.length + ')', !!(dr.beast && dr.beast.kind === 'wolfspider' && dr.weapon.save && !dr.known.length));
      var cmds2 = F5.commands(B8, dr).map(function (c) { return c.id; });
      ok5('in the shape, the button is OWN SHAPE: ' + cmds2.join(','), cmds2.indexOf('unshape') >= 0 && cmds2.indexOf('wildshape') < 0);
      run5(F5.exec(B8, dr, { do: 'unshape' }));
      ok5('OWN SHAPE (a bonus action): the druid again, spells back (' + dr.known.length + '), the bonus spent ' + !dr.turn.bonus, !dr.beast && dr.known.length === 3 && !dr.turn.bonus);
      // the circle spells: Higertha's mountain at 9, a generic druid's Underdark
      var hg = D.npc.build('higertha:9', 9, 'party', { id: 'hg' }), gd = D.npc.build('druid:9', 9, 'foe', { id: 'gd' }), hk = hg.known, gk = gd.known;
      ok5('Higertha at 9 (the mountain): ' + hk.join(','), ['spikegrowth', 'lightningbolt', 'stoneskin'].every(function (id) { return hk.indexOf(id) >= 0; }) && hk.indexOf('web') < 0);
      ok5('a druid at 9 (the Underdark): ' + gk.join(','), ['web', 'stinkingcloud', 'greaterinvisibility', 'insectplague'].every(function (id) { return gk.indexOf(id) >= 0; }) && gk.indexOf('stoneskin') < 0);
    } catch (e8) { rep5.errors.push(String(e8 && e8.stack || e8).slice(0, 900)); }
    if (D.lastError) rep5.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var pre5 = document.createElement('pre'); pre5.id = 'out'; pre5.textContent = 'BENCH16 ' + JSON.stringify(rep5);
    document.body.appendChild(pre5);
    return;
  }
  // our own subclasses (mode=subs; 09-28g): each feature called as the fight calls it, the dice held where a save would hide it
  if (get('mode', '') === 'subs') {
    var rep3 = { checks: [], errors: [] };
    function ok3(what, v) { rep3.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function run3(g) { var v, k = 0; while (k++ < 500) { var st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    try {
      var B5 = new D.Battle({ npc: { foes: ['fighter:6', 'fighter:6'], party: ['talmok:6', 'willem:6', 'katarina:6', 'torvald:6'] }, bench: true, fightDef: D.classFight(6) });
      D.battle = B5; B5.enter();
      var U = {}; B5.units.forEach(function (u) { U[u.side === 'foe' ? u.id : u.id.replace(/^p\d-/, '')] = u; });
      var T5 = U.talmok, W5 = U.willem, K5 = U.katarina, V5 = U.torvald, F0 = B5.units.filter(function (u) { return u.side === 'foe'; })[0], F1 = B5.units.filter(function (u) { return u.side === 'foe'; })[1];
      ok3('the four: ' + [T5, W5, K5, V5].map(function (u) { return u.name + ' ' + u.cls + ' ' + u.lvl + ' (' + u.subclass + ')'; }).join(', '), T5.subclass === 'Path of the Sand' && W5.subclass === 'the Rimeglass' && K5.subclass === 'the Window' && V5.subclass === 'the Vigil');
      ok3('Talmok fights with his fists, no handaxes: ' + T5.weapon.name + ', alt ' + (T5.alt ? T5.alt.name : 'none'), !T5.alt);
      ok3('the Window\'s list: ' + K5.known.join(','), ['blur', 'hypnoticpattern', 'disguiseself'].every(function (id) { return K5.known.indexOf(id) >= 0; }));
      ok3('the Vigil\'s list on Torvald\'s own: ' + V5.known.join(','), ['protectionfromevilandgood', 'wardingbond', 'spiritguardians', 'sacredflame'].every(function (id) { return V5.known.indexOf(id) >= 0; }));
      ok3('the uses: hand ' + K5.feats.handOnNeck + ', ward ' + V5.feats.keepersWard + ', channel ' + K5.feats.channel + '/' + V5.feats.channel, K5.feats.handOnNeck >= 1 && V5.feats.keepersWard >= 1);
      [F0, F1].forEach(function (f) { f.saves = Object.assign({}, f.saves, { str: -30, wis: -30 }); });
      // stand a foe beside one of ours: the first free square next to it
      function beside(f, u) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { if ((dx || dy) && G2.canStand(f, u.x + dx, u.y + dy)) { f.x = u.x + dx; f.y = u.y + dy; return true; } } return false; }
      var G2 = D.grid;
      // the Path of the Sand
      D.rules.startTurn(T5); delete T5.conds.raging; T5.reaction = 1; B5.hurt(T5, 3, 'slashing');
      ok3('FIRST BLOOD: hurt and not raging, he rages (the reaction)', !!T5.conds.raging && T5.reaction === 0);
      beside(F0, T5); D.rules.startTurn(T5); run3(D.magic.onWeaponHit(B5, T5, F0, T5.weapon, false));
      ok3('DOWN IN THE SAND: raging, a hit, STR failed -> prone ' + !!F0.conds.prone, !!F0.conds.prone);
      delete F0.conds.prone; T5.lvl = 6; T5.reaction = 1; var n5 = (B5.log || []).length; run3(D.features.answerBack(B5, F0, T5, F0.weapon, true));
      ok3('ANSWER BACK: missed in melee, raging, he swings back', T5.reaction === 0 && (B5.log || []).slice(n5).some(function (l) { return /answers back/.test(l); }));
      // the Rimeglass
      D.features.rimeDouble(B5, F0, W5);
      ok3('RIME DOUBLES: the one who broke a double is frosted', !!F0.conds.frosted);
      W5.lvl = 6; beside(F1, W5); var wx = W5.x, wy = W5.y; D.rules.startTurn(W5); run3(D.magic.cast(B5, W5, 'mirrorimage', 2, W5));
      ok3('RIME STEP: Mirror Image cast, he is off his square (' + wx + ',' + wy + ' -> ' + W5.x + ',' + W5.y + '), images ' + W5.images, (W5.x !== wx || W5.y !== wy) && W5.images === 3);
      // the Window
      var fs5 = B5.units.filter(function (u) { return u.side === 'foe'; }), al5 = B5.units.filter(function (u) { return u.side === 'party'; });
      D.rules.startTurn(K5);
      function planOf(u, why) { var out = null; D.tactics.ACTIONS.forEach(function (f) { var p = f(B5, u, fs5, al5); [].concat(p || []).forEach(function (q) { if (q && q.why && q.why.indexOf(why) === 0) out = q; }); }); return out; }
      var pd = planOf(K5, 'the Doubling'); if (pd) run3(pd.go());
      ok3('THE DOUBLING: two doubles, a channel spent (' + K5.images + ' images, channel ' + K5.feats.channel + ')', K5.images === 2 && K5.feats.channel === 1);
      D.rules.startTurn(K5); var ps = planOf(K5, 'the Showing');
      if (ps) run3(ps.go());
      var shown = fs5.filter(function (f) { return f.conds.incapacitated; });
      ok3('THE SHOWING: WIS failed -> incapacitated (' + (ps ? ps.why : 'no plan') + ')', shown.length === 1);
      var glassSeen = 0;
      for (var g5 = 0; g5 < 30 && !glassSeen; g5++) { V5.conds.glassHand = { by: K5.id }; V5.hp = V5.maxhp; beside(F1, V5); D.rules.startTurn(F1); var n6 = (B5.log || []).length; run3(B5.attack(F1, V5, F1.weapon, {})); glassSeen = (B5.log || []).slice(n6).join(' ').indexOf('the glass takes it') >= 0 ? 1 : 0; }
      ok3('THE HAND ON THE NECK: a blow that would land is rolled again', !!glassSeen);
      // the Vigil
      W5.hp = W5.maxhp; W5.conds.keeperWard = { by: V5.id, n: 6 }; var h0 = W5.hp; B5.hurt(W5, 8, 'slashing');
      ok3('KEEPER\'S WARD: 8 damage on ' + h0 + ' HP -> ' + W5.hp + ' (cut by 1d8+6)', W5.hp >= h0 - 1 && !W5.conds.keeperWard);
      V5.feats.channel = 1; delete F0.conds.incapacitated; delete F1.conds.incapacitated; F0.hp = F0.maxhp; F1.hp = F1.maxhp;
      beside(F0, V5); beside(F1, V5); var d0 = [G2.dist(V5, F0), G2.dist(V5, F1)]; D.rules.startTurn(V5);
      var ph = planOf(V5, 'Hold the Door'); if (ph) run3(ph.go());
      ok3('HOLD THE DOOR: STR failed, shoved (' + d0.join(',') + ' ft -> ' + [G2.dist(V5, F0), G2.dist(V5, F1)].join(',') + ' ft)', !!ph && (G2.dist(V5, F0) > d0[0] || G2.dist(V5, F1) > d0[1]));
      V5.lvl = 6; W5.x = V5.x; W5.y = V5.y; beside(W5, V5);
      ok3('WAKEFUL: one of his within 10 ft cannot be slept', D.magic.wakeful(B5, W5));
    } catch (e5) { rep3.errors.push(String(e5 && e5.stack || e5).slice(0, 700)); }
    if (D.lastError) rep3.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var pre3 = document.createElement('pre'); pre3.id = 'out'; pre3.textContent = 'BENCH16 ' + JSON.stringify(rep3);
    document.body.appendChild(pre3);
    return;
  }
  // the paladin's auras (mode=auras; 09-29): Protection's CHA to saves and Devotion's no-charm, inside 10 ft and not past it, his side
  // only, gone when he drops; Lymen's Devotion from 7; the 8-bit's own check in js/battle.js is benched by dev/bench8.py
  if (get('mode', '') === 'auras') {
    var rep9 = { checks: [], errors: [] }, RU9 = D.rules, G9 = D.grid;
    function ok9(what, v) { rep9.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    try {
      var B9 = new D.Battle({ npc: { party: ['paladin:7', 'fighter:7'], foes: ['fighter:7'] }, bench: true, fightDef: D.classFight(7) }); D.battle = B9; B9.enter();
      var pal = B9.units.filter(function (u) { return u.cls === 'paladin'; })[0], ally = B9.units.filter(function (u) { return u.side === 'party' && u !== pal; })[0], foe = B9.units.filter(function (u) { return u.side === 'foe'; })[0];
      var free = function (x, y) { return !B9.units.some(function (w) { return w.x === x && w.y === y; }); };
      var put = function (w, dx) { var tx = pal.x + dx; w.x = -99; for (var dy = 0; dy < 12; dy++) { for (var s = -1; s <= 1; s += 2) { var ty = pal.y + dy * s; if (G9.inside ? G9.inside(tx, ty) : true) { if (free(tx, ty)) { w.x = tx; w.y = ty; return; } } } } w.x = tx; };
      var a = RU9.auraOf(pal);
      ok9('paladin 7 (' + pal.subclass + '): ' + JSON.stringify(a), !!a && a.protect >= 1 && a.devotion === true);
      ally.x = pal.x + 1; ally.y = pal.y; if (!free(ally.x, ally.y) && ally.x !== pal.x + 1) put(ally, 1);
      ok9('ally ' + G9.dist(pal, ally) + ' ft away: immune to charm ' + RU9.immuneTo(ally, 'charmed') + ', save aura +' + RU9.aura(ally), RU9.immuneTo(ally, 'charmed') && RU9.aura(ally) === a.protect && G9.dist(pal, ally) <= 10);
      ok9('the paladin himself: immune ' + RU9.immuneTo(pal, 'charmed') + ', aura +' + RU9.aura(pal), RU9.immuneTo(pal, 'charmed') && RU9.aura(pal) === a.protect);
      put(ally, 4);
      ok9('ally ' + G9.dist(pal, ally) + ' ft away: immune ' + RU9.immuneTo(ally, 'charmed') + ', aura +' + RU9.aura(ally), G9.dist(pal, ally) > 10 && !RU9.immuneTo(ally, 'charmed') && RU9.aura(ally) === 0);
      foe.x = pal.x - 1; foe.y = pal.y; if (!free(foe.x, foe.y)) put(foe, -1);
      ok9('a foe ' + G9.dist(pal, foe) + ' ft away: immune ' + RU9.immuneTo(foe, 'charmed') + ', aura +' + RU9.aura(foe), !RU9.immuneTo(foe, 'charmed') && RU9.aura(foe) === 0);
      ally.x = pal.x + 1; ally.y = pal.y;
      pal.lvl = 6; var a6 = RU9.auraOf(pal);
      ok9('paladin 6: ' + JSON.stringify(a6) + ', ally immune ' + RU9.immuneTo(ally, 'charmed'), !!a6 && !a6.devotion && !RU9.immuneTo(ally, 'charmed') && RU9.aura(ally) === a6.protect);
      pal.lvl = 7; var hp0 = pal.hp; pal.hp = 0;
      ok9('paladin down: aura ' + JSON.stringify(RU9.auraOf(pal)) + ', ally immune ' + RU9.immuneTo(ally, 'charmed'), !RU9.auraOf(pal) && !RU9.immuneTo(ally, 'charmed'));
      pal.hp = hp0;
      // Hypnotic Pattern on both: the one in the aura is skipped
      var hp = D.magic.EFFECT && D.magic.EFFECT.hypnoticpattern;
      ok9('Hypnotic Pattern is on the grid: ' + !!hp, !!hp);
      // Lymen, the ladder's four
      var BL = new D.Battle({ ladder: true, fight: 'ettercap', bench: true }); D.battle = BL; BL.enter();
      var ly = BL.units.filter(function (u) { return /lymen/i.test(u.id) || u.name === 'Lymen'; })[0];
      if (ly) { ly.lvl = 7; var al = RU9.auraOf(ly); ok9('Lymen (id ' + ly.id + ', ' + ly.subclass + ') at 7: ' + JSON.stringify(al), !!al && al.devotion === true); ly.lvl = 6; ok9('Lymen at 6: ' + JSON.stringify(RU9.auraOf(ly)), !!RU9.auraOf(ly) && !RU9.auraOf(ly).devotion); }
      else ok9('Lymen found on the ladder: ' + BL.units.map(function (u) { return u.id; }).join(','), false);
    } catch (e9) { rep9.errors.push(String(e9 && e9.stack || e9).slice(0, 700)); }
    if (D.lastError) rep9.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var pre9 = document.createElement('pre'); pre9.id = 'out'; pre9.textContent = 'BENCH16 ' + JSON.stringify(rep9);
    document.body.appendChild(pre9);
    return;
  }
  // Find Familiar on the grid (mode=familiar; 09-29): seated beside its wizard from the save's flags; its turn is the Help action and
  // the owl flies back out without an opportunity attack; a bat stays; a touch spell carried by a bat, not the owl, not after a help;
  // dismiss and call; a familiar alone keeps no fight going
  if (get('mode', '') === 'familiar') {
    var rep10 = { checks: [], errors: [] }, G10 = D.grid;
    function ok10(what, v) { rep10.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function run10(g) { var v, k = 0; while (g && k++ < 800) { var st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = st.value.prompt.opts[0].value; } }
    function mk10(kind) { var data = D.save.fixture(5); data.flags = { familiar: { kind: kind, by: 'aurdin', hp: 1 } }; var Bx = new D.Battle({ ladder: true, fight: 'snoot', bench: true, data: data }); D.battle = Bx; Bx.enter(); return Bx; }
    function put(w, x, y) { w.x = x; w.y = y; G10.setup(G10.map, D.battle.units); }
    try {
      var Bo = mk10('owl'), fam = Bo.units.filter(function (u) { return u.familiar; })[0], au = Bo.units.filter(function (u) { return u.id === 'aurdin'; })[0];
      var bar = Bo.units.filter(function (u) { return u.id === 'barley'; })[0], fo = Bo.units.filter(function (u) { return u.side === 'foe'; });
      ok10('seated: ' + (fam && [fam.name, fam.sheet, fam.side, 'flies ' + fam.flies, 'flyby ' + fam.flyby, fam.hp + '/' + fam.maxhp, 'riding ' + fam.riding + ' (' + fam.perch + ')', 'on ' + fam.x + ',' + fam.y + ' = his ' + au.x + ',' + au.y].join(', ')), !!fam && fam.sheet === 'owl_p2' && fam.side === 'party' && fam.flyby && fam.familiar === 'aurdin' && fam.riding && fam.x === au.x && fam.y === au.y);
      // stage: the first foe beside Barley, the rest far off; the owl beside Aurdin, 20-odd ft back
      fo.forEach(function (f, i) { if (i) put(f, 1 + i, 1); });
      put(bar, 10, 8); put(fo[0], 10, 7); put(au, 10, 13); put(fam, 11, 13);
      ok10('riding: no foe picks it (' + D.ai.heroes(Bo, fo[0]).some(function (w) { return w === fam; }) + '), no square of its own (' + (G10.occupant(au.x, au.y) === au) + '), an area on him catches it (' + G10.inArea(fam, [[au.x, au.y]]) + ')', !D.ai.heroes(Bo, fo[0]).some(function (w) { return w === fam; }) && G10.occupant(au.x, au.y) === au && G10.inArea(fam, [[au.x, au.y]]));
      var hp0 = fam.hp; D.rules.startTurn(fam);
      run10(D.ai.turn(Bo, fam));
      var near = fo.filter(function (f) { return G10.standing(f) && G10.dist(fam, f) <= 5; }).length;
      ok10('the owl helped: ' + JSON.stringify(fo[0].conds.helped) + '; back on his shoulder ' + fam.riding + ', ' + near + ' foes beside it, HP ' + fam.hp + '/' + hp0, !!(fo[0].conds.helped && fo[0].conds.helped.side === 'party') && near === 0 && fam.hp === hp0 && fam.riding);
      // the rework (RULED 09-30): no initiative; a touch spell carried within the familiar's movement, not when ordered to Help; the owl
      // carries too; the bat never helps; the others help on his order; home again, short of him only when its movement runs out
      ok10('no initiative: the order has no familiar (' + Bo.order.filter(function (u) { return u.familiar; }).length + ')', (function () { Bo.order = Bo.units.filter(function (u) { return !u.familiar; }); return !Bo.order.some(function (u) { return u.familiar; }); })());
      var sg = D.magic.geo('shockinggrasp');
      var Bb = mk10('bat'), bat = Bb.units.filter(function (u) { return u.familiar; })[0], au2 = Bb.units.filter(function (u) { return u.id === 'aurdin'; })[0], bar2 = Bb.units.filter(function (u) { return u.id === 'barley'; })[0], fb = Bb.units.filter(function (u) { return u.side === 'foe'; });
      fb.forEach(function (f, i) { if (i) put(f, 1 + i, 1); });
      au2.known = (au2.known || []).concat(['shockinggrasp']);
      put(bar2, 4, 12); put(au2, 10, 13); put(fb[0], 10, 9);
      ok10('the bat (fly 30) carries Shocking Grasp to a foe ' + G10.dist(au2, fb[0]) + ' ft off: ' + D.magic.targetOK(Bb, au2, sg, fb[0]), D.magic.targetOK(Bb, au2, sg, fb[0]));
      put(fb[0], 10, 3);
      ok10('not to one ' + G10.dist(au2, fb[0]) + ' ft off (past its 30 ft): ' + D.magic.targetOK(Bb, au2, sg, fb[0]), !D.magic.targetOK(Bb, au2, sg, fb[0]));
      put(fb[0], 10, 9); bat.order = 'help';
      ok10('not when he has ordered it to Help: ' + D.magic.targetOK(Bb, au2, sg, fb[0]), !D.magic.targetOK(Bb, au2, sg, fb[0]));
      delete bat.order;
      put(au, 10, 13); put(fo[0], 10, 7);
      ok10('the owl carries one now (RULED 09-30): ' + D.magic.targetOK(Bo, au, sg, fo[0]), D.magic.targetOK(Bo, au, sg, fo[0]));
      put(fb[0], 10, 11); D.rules.startTurn(bat); run10(D.ai.turn(Bb, bat));
      var batIdle = !fb[0].conds.helped && bat.riding;
      bat.order = 'help'; D.rules.startTurn(bat); run10(D.ai.turn(Bb, bat));
      ok10('the bat (RULED 09-30: orderable): unordered it stays about his head (' + batIdle + ', ' + bat.perch + '); ordered, it helped: ' + JSON.stringify(fb[0].conds.helped || null), batIdle && bat.perch === 'head' && !!fb[0].conds.helped);
      // a rat (walks 20): the carry out, the spell, its turn after his spent getting home -- short of him, it holds a square and may be struck
      var Br = mk10('rat'), rat = Br.units.filter(function (u) { return u.familiar; })[0], au3 = Br.units.filter(function (u) { return u.id === 'aurdin'; })[0], fr = Br.units.filter(function (u) { return u.side === 'foe'; });
      fr.forEach(function (f, i) { if (i) put(f, 1 + i, 1); });
      Br.units.forEach(function (u) { if (u.side === 'party' && !u.familiar && u !== au3) put(u, 2 + Br.units.indexOf(u), 14); });
      au3.known = (au3.known || []).concat(['shockinggrasp']); put(au3, 10, 13); put(fr[0], 10, 9); fr[0].hp = fr[0].maxhp = 999;
      D.rules.startTurn(au3); Br.round = 1;
      run10(D.magic.cast(Br, au3, 'shockinggrasp', 0, fr[0]));
      var outAt = rat.x + ',' + rat.y, besideIt = G10.dist(rat, fr[0]) <= 5, spent = rat.carried && rat.carried.spent;
      fr[0].reaction = 0; // (no blow at it as it leaves: the walk home is what is tested)
      run10(D.familiar.after(Br, au3));
      var picks = D.ai.heroes(Br, fr[0]).some(function (w) { return w === rat; });
      ok10('the rat carried it out to ' + outAt + ' (beside the foe ' + besideIt + ', ' + spent + ' ft), then home with the rest: ' + rat.x + ',' + rat.y + ', riding ' + rat.riding + ', the foe may pick it ' + picks, besideIt && spent === 15 && !rat.riding && picks && G10.dist(rat, au3) > 0);
      // ordered to Help, the rat goes, helps and heads home
      Br.units.forEach(function (u) { delete u.conds.helped; }); put(fr[0], 10, 11); put(rat, 10, 13); rat.riding = true;
      D.rules.startTurn(au3); run10(D.features.exec(Br, au3, { do: 'famhelp' }));
      var ordered = rat.order;
      run10(D.familiar.after(Br, au3));
      ok10('ordered (' + ordered + '), the rat helped: ' + JSON.stringify(fr[0].conds.helped || null) + '; then riding ' + rat.riding, ordered === 'help' && !!fr[0].conds.helped);
      // unordered, a rat stays with him
      delete fr[0].conds.helped; rat.riding = true; run10(D.familiar.after(Br, au3));
      ok10('unordered, the rat stays: helped ' + JSON.stringify(fr[0].conds.helped || null) + ', riding ' + rat.riding, !fr[0].conds.helped && rat.riding);
      // what each lends its caster (RULED 09-30), and not once it is sent away
      var dv0 = au3.darkvision;
      run10(D.features.exec(Br, au3, { do: 'dismissfam' }));
      ok10('the rat lends darkvision ' + dv0 + ' ft; sent away: ' + au3.darkvision, dv0 >= 30 && ((au3.darkvision || 0) < 30 || (dv0 > 30 && au3.darkvision === dv0)));
      var Bs = mk10('snake'), au4 = Bs.units.filter(function (u) { return u.id === 'aurdin'; })[0], fs4 = Bs.units.filter(function (u) { return u.side === 'foe'; })[0];
      put(au4, 10, 13); put(fs4, 10, 11); fs4.conds.invisible = { by: 'x' };
      var sn1 = D.magic.sees(Bs, au4, fs4); put(fs4, 10, 5); var sn2 = D.magic.sees(Bs, au4, fs4);
      ok10('the snake: its caster sees the invisible at 10 ft (' + sn1 + '), not at 40 (' + sn2 + '); charms +' + au4.famPerk('charmDC'), sn1 && !sn2 && au4.famPerk('charmDC') === 1);
      var Bw = mk10('spider'), au5 = Bw.units.filter(function (u) { return u.id === 'aurdin'; })[0];
      ok10('the spider: Web Walker ' + au5.webWalker + ', Web +' + au5.famPerk('webDC'), au5.webWalker === true && au5.famPerk('webDC') === 1);
      var Bt = mk10('bat'), au6 = Bt.units.filter(function (u) { return u.id === 'aurdin'; })[0];
      ok10('the bat: sonar (blindsight) ' + au6.blindsight + ' ft', au6.blindsight >= 15);
      var Bf2 = mk10('frog'), au7 = Bf2.units.filter(function (u) { return u.id === 'aurdin'; })[0];
      au7.conds.surprised = true; run10(D.familiar.alarm(Bf2));
      ok10('the frog croaks: its caster caught off guard ' + !!au7.conds.surprised, !au7.conds.surprised);
      var Bb2 = Bb;
      // dismiss and call
      D.battle = Bb; D.rules.startTurn(au2);
      var cm = D.features.commands(Bb, au2).filter(function (c) { return /familiar/i.test(c.label); }).map(function (c) { return c.label; });
      run10(D.features.exec(Bb, au2, { do: 'dismissfam' }));
      var away = bat.away && bat.left; D.rules.startTurn(au2);
      var cm2 = D.features.commands(Bb, au2).filter(function (c) { return /familiar/i.test(c.label); }).map(function (c) { return c.label; });
      run10(D.features.exec(Bb, au2, { do: 'callfam' }));
      ok10('commands ' + cm.join() + ' then ' + cm2.join() + '; away ' + away + '; back ' + !bat.away + ', riding ' + bat.riding, cm.indexOf('DISMISS FAMILIAR') >= 0 && cm.indexOf('FAMILIAR: HELP') >= 0 && away && cm2.indexOf('CALL FAMILIAR') >= 0 && !bat.away && !bat.dead && bat.riding);
      // everyone down but the familiar: lost
      Bb.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.hp = 0; u.dead = true; } });
      ok10('the familiar alone keeps no fight going: ' + Bb.over(), Bb.over() === 'lost');
      // the camp's A FAMILIAR (09-29): the ladder's four (Aurdin) and ours (Willem); the pick goes into the fight
      var Fs = D.FIGHTS.filter(function (f) { return f.id === 'snoot'; })[0], push0 = D.push, pushed = null;
      [['the ladder\'s four', null, 'owl'], ['our four', { ours: { party: D.npc.ours(5, Fs), play: false } }, 'bat']].forEach(function (cs) {
        var C = new D.Camp(5, Fs, function () { }, cs[1]); C.enter();
        var wz = C.famWiz(), rowsBefore = C.rows ? '' : '';
        C.st.familiar = null; while (C.st.familiar !== cs[2]) C.cycleFamiliar(1);
        D.push = function (s) { pushed = s; }; C.fight(); D.push = push0;
        if (pushed && pushed.enter) { D.battle = pushed; pushed.enter(); }
        var fu = pushed && pushed.units.filter(function (u) { return u.familiar; })[0];
        ok10(cs[0] + ': the wizard ' + (wz && wz.name) + ', A FAMILIAR ' + cs[2] + ' -> the fight seats ' + (fu ? fu.name + ' (riding ' + fu.riding + ')' : 'none'), !!wz && !!fu && fu.kind === 'fam_' + cs[2] && fu.familiar === wz.id);
      });
      D.battle = Bb;
      // two whole fights with the owl and with the bat in the order, the four run by the class tactics
      ['owl', 'bat'].forEach(function (kd) {
        var Bf = mk10(kd), ff = Bf.units.filter(function (u) { return u.familiar; })[0];
        Bf.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) { u.guest = true; u.classAI = true; } });
        var n0 = (Bf.log || []).length, rs = drive(Bf), helps = (Bf.log || []).slice(n0).filter(function (l) { return /helps: the next ally/.test(String(l)); }).length;
        ok10('a whole fight with the ' + kd + ': ' + rs + ' in ' + Bf.round + ' rounds; it helped ' + helps + 'x; ended ' + (ff.hp > 0 ? 'standing ' + ff.hp + '/' + ff.maxhp : 'gone'), rs === 'won' || rs === 'lost');
      });
    } catch (e10) { rep10.errors.push(String(e10 && e10.stack || e10).slice(0, 900)); }
    if (D.lastError) rep10.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    var pre10 = document.createElement('pre'); pre10.id = 'out'; pre10.textContent = 'BENCH16 ' + JSON.stringify(rep10);
    document.body.appendChild(pre10);
    return;
  }
  // the class feature gaps (mode=features; 09-30, "Class feature gap proceed"): Patient Defense, the Step of the Wind and Evasion (the monk),
  // Turn the Unholy (the paladin), Countercharm (the bard), Twinned, Careful and Heightened Spell (the sorcerer), the warlock's Pact Boon and
  // Dark One's Own Luck, Mindless Rage (the Berserker), the Hunter's Defensive Tactics, Supreme Sneak (the Thief) -- each on a built NPC, the AI's
  // use and the player's button; and the two old faults found on the way (a laid fright swept at its caster's turn's end; Evasion for the rogue alone)
  if (get('mode', '') === 'features') {
    var repF = { checks: [], errors: [] }, GF = D.grid, RUF = D.rules, FF = D.features, MF = D.magic, TXF = D.tactics;
    function okF(what, v) { repF.checks.push((v ? 'ok   ' : 'FAIL ') + what); }
    function runF(g, pick) { var v, k = 0, st; while (g && k++ < 8000) { st = g.next(v); v = undefined; if (st.done) return st.value; if (st.value && st.value.prompt) v = pick != null ? pick : st.value.prompt.opts[0].value; } }
    var mkN = 0; // (each battle its own seed: the run is the same run every time -- add seed=N for another)
    function mkF(party, foes, L) {
      D.seed = seed0 * 7919 + (++mkN) * 104729; D.lastError = null;
      var Bx = new D.Battle({ npc: { party: party, foes: foes }, bench: true, fightDef: D.classFight(L || 7) }); D.battle = Bx; Bx.enter(); while (!Bx.order.length) Bx.co.next(); Bx.round = 1;
      return Bx;
    }
    function sideF(B, s) { return B.units.filter(function (u) { return u.side === s; }); }
    function spotF(B, u, x, y) {
      for (var r = 0; r < 9; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var px = x + dx, py = y + dy, occ = B.units.some(function (w) { return w !== u && !w.dead && w.x === px && w.y === py; });
        if (px >= 0 && py >= 0 && !occ && GF.canStand(u, px, py)) { u.x = px; u.y = py; return true; }
      }
      return false;
    }
    function addFoeF(B, kind, x, y) {
      var f = B.makeFoe({ id: kind + B.units.length, kind: kind, at: [x, y] }); f.side = 'foe'; f.anim = 'idle'; f.animT = 0; f.flash = 0; f.reaction = 1; f.conds = f.conds || {};
      B.units.push(f); B.order.push(f); spotF(B, f, x, y); return f;
    }
    function playerF(u) { u.guest = false; u.classAI = false; return u; } // (run by the player: F.commands lists its buttons)
    function saveWis(u, v) { u.saves = Object.assign({}, u.saves || {}, { wis: v }); }
    function cntF(B, n0, re) { return (B.log || []).slice(n0).filter(function (l) { return re.test(l); }).length; }
    function nlog(B) { return (B.log || []).length; }
    var d0F = D.d;
    // the monk: Patient Defense, the Step of the Wind, Evasion
    try {
      var Bm = mkF(['monk:7'], ['fighter:7', 'fighter:7'], 7), mk = sideF(Bm, 'party')[0], fm = sideF(Bm, 'foe');
      var mk6 = D.npc.build('monk:6', 6, 'party', { id: 'm6' }), rg7 = D.npc.build('rogue:7', 7, 'party', { id: 'r7' }), fg7 = D.npc.build('fighter:7', 7, 'party', { id: 'f7' });
      okF('monk 7 (' + mk.speed + ' ft, ' + mk.feats.ki + ' ki), monk 6, rogue 7, fighter 7: RU.evasion ' + [RUF.evasion(mk), RUF.evasion(mk6), RUF.evasion(rg7), RUF.evasion(fg7)].join('/') + ' (want true/false/true/false)', RUF.evasion(mk) === true && RUF.evasion(mk6) === false && RUF.evasion(rg7) === true && RUF.evasion(fg7) === false);
      mk.conds.stunned = true; var evS = RUF.evasion(mk); delete mk.conds.stunned;
      okF('Evasion goes when the monk is stunned (' + evS + '), comes back (' + RUF.evasion(mk) + ')', evS === false && RUF.evasion(mk) === true);
      spotF(Bm, mk, 9, 8); spotF(Bm, fm[0], mk.x + 1, mk.y); spotF(Bm, fm[1], mk.x - 1, mk.y);
      mk.hp = Math.floor(mk.maxhp * 0.3); RUF.startTurn(mk); mk.turn.attackAction = true;
      var pk2 = FF.monkPick(Bm, mk);
      fm[1].dead = true; fm[1].hp = 0; var pk1 = FF.monkPick(Bm, mk);
      mk.hp = mk.maxhp; var pk0 = FF.monkPick(Bm, mk);
      okF('the monk\'s bonus action after the attack: hurt (30%) with two big foes beside -> ' + pk2 + ', with one -> ' + pk1 + ', whole -> ' + pk0 + ' (want step / patient / flurry)', pk2 === 'step' && pk1 === 'patient' && pk0 === 'flurry');
      var ki0 = mk.feats.ki; RUF.startTurn(mk); runF(FF.patient(Bm, mk));
      okF('Patient Defense: dodging ' + !!mk.conds.dodge + ', the bonus action ' + mk.turn.bonus + ', ki ' + ki0 + ' -> ' + mk.feats.ki, mk.conds.dodge && mk.turn.bonus === 0 && mk.feats.ki === ki0 - 1);
      RUF.startTurn(mk); var mv0 = mk.turn.move; runF(FF.stepWind(Bm, mk, 'dash')); var mvD = mk.turn.move; RUF.startTurn(mk); runF(FF.stepWind(Bm, mk, 'disengage'));
      okF('Step of the Wind: Dash ' + mv0 + ' -> ' + mvD + ' ft; Disengage: disengaged ' + mk.turn.disengaged, mvD === mv0 + mk.speed && mk.turn.disengaged === true);
      // the AI's whole turn, hurt and pressed by two: the log names the bonus action it took
      var Bm2 = mkF(['monk:7'], ['fighter:7', 'fighter:7'], 7), mk2 = sideF(Bm2, 'party')[0], fm2 = sideF(Bm2, 'foe');
      spotF(Bm2, mk2, 9, 8); spotF(Bm2, fm2[0], mk2.x + 1, mk2.y); spotF(Bm2, fm2[1], mk2.x - 1, mk2.y); mk2.hp = Math.floor(mk2.maxhp * 0.3); mk2.feats.wholeness = 0; fm2.forEach(function (f) { f.reaction = 0; }); // (Wholeness of Body would take the action first; the AI's swing may step off a square first, and a foe's reaction would drop the hurt monk on the way)
      var n2 = nlog(Bm2); runF(D.ai.turn(Bm2, mk2)); var l2 = (Bm2.log || []).slice(n2);
      okF('the AI monk at 30%, two foes beside: ' + (l2.filter(function (l) { return /PATIENT DEFENSE|STEP OF THE WIND|FLURRY/.test(l); })[0] || 'none of the three').slice(0, 90), l2.some(function (l) { return /PATIENT DEFENSE|STEP OF THE WIND/.test(l); }) && !l2.some(function (l) { return /FLURRY/.test(l); }));
      // the Dash: a foe 75 ft off, the monk's 45 ft and the Dash 45 more
      var Bm3 = mkF(['monk:7'], ['fighter:7'], 7), mk3 = sideF(Bm3, 'party')[0], fm3 = sideF(Bm3, 'foe')[0];
      spotF(Bm3, mk3, 1, 11); spotF(Bm3, fm3, 16, 11); var dagger = mk3.alt; mk3.alt = null; // (no thrown dagger: a swing is the fist's, at the foe's side)
      var far0 = GF.dist(mk3, fm3), n3 = nlog(Bm3); runF(D.ai.turn(Bm3, mk3)); var l3 = (Bm3.log || []).slice(n3);
      okF('the AI monk with no thrown weapon, a foe ' + far0 + ' ft off: ' + (l3.filter(function (l) { return /STEP OF THE WIND/.test(l); })[0] || 'no Step of the Wind').slice(0, 80) + '; now ' + GF.dist(mk3, fm3) + ' ft', far0 >= 60 && l3.some(function (l) { return /STEP OF THE WIND.*Dash/.test(l); }) && GF.dist(mk3, fm3) <= 5 && l3.some(function (l) { return /Monk 7 > /.test(l); }));
      var Bm5 = mkF(['monk:7'], ['fighter:7'], 7), mk5 = sideF(Bm5, 'party')[0], fm5 = sideF(Bm5, 'foe')[0]; spotF(Bm5, mk5, 1, 11); spotF(Bm5, fm5, 16, 11); n3 = nlog(Bm5); runF(D.ai.turn(Bm5, mk5));
      okF('and with the dagger to throw (60 ft) the ki stays: ' + cntF(Bm5, n3, /STEP OF THE WIND/) + ' Steps, ki ' + mk5.feats.ki, cntF(Bm5, n3, /STEP OF THE WIND/) === 0 && mk5.feats.ki >= 6);
      // the buttons of a monk the player runs
      var Bm4 = mkF(['monk:7'], ['fighter:7'], 7), mk4 = playerF(sideF(Bm4, 'party')[0]); spotF(Bm4, mk4, 9, 8); spotF(Bm4, sideF(Bm4, 'foe')[0], 9, 9); RUF.startTurn(mk4);
      var c4 = FF.commands(Bm4, mk4), ids4 = ['patient', 'stepdisengage', 'stepdash'], have4 = ids4.filter(function (id) { return c4.filter(function (c) { return c.id === id && c.ok; }).length; });
      runF(FF.exec(Bm4, mk4, { do: 'stepdash' })); var afterBtn = FF.commands(Bm4, mk4).filter(function (c) { return ids4.indexOf(c.id) >= 0 && c.ok; }).length;
      okF('the player\'s monk: buttons ' + have4.join(', ') + '; STEP: DASH pressed (move ' + mk4.turn.move + ' ft, ki ' + mk4.feats.ki + '), the three then grey (' + afterBtn + ' still on)', have4.length === 3 && mk4.turn.move === 90 && mk4.feats.ki === 6 && afterBtn === 0);
    } catch (eM) { repF.errors.push('monk: ' + String(eM && eM.stack || eM).slice(0, 700)); }
    // Evasion at the spells' saves: a Fireball (magic.js area) and a Chain Lightning (grimoire.js saveAll), the monk against a fighter
    try {
      var Be = mkF(['sorcerer:9', 'monk:7', 'fighter:7'], ['fighter:5'], 9), sr = sideF(Be, 'party')[0], mo = sideF(Be, 'party')[1], ft = sideF(Be, 'party')[2];
      spotF(Be, mo, 9, 5); spotF(Be, ft, 10, 5); spotF(Be, sr, 9, 12); sr.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; sr.slotsMax = sr.slots.slice();
      var setDex = function (v) { mo.saves = Object.assign({}, mo.saves, { dex: v }); ft.saves = Object.assign({}, ft.saves, { dex: v }); };
      function hpOf(u) { return u.hp + (u.temp || 0); }
      RUF.startTurn(sr); setDex(-30); var m0 = hpOf(mo), f0 = hpOf(ft); runF(MF.cast(Be, sr, 'fireball', 3, { x: mo.x, y: mo.y })); var lm = m0 - hpOf(mo), lf = f0 - hpOf(ft);
      okF('Fireball, both fail: the fighter takes ' + lf + ', the monk (Evasion) ' + lm + ' -- half', lf > 0 && (lf === 2 * lm || lf === 2 * lm + 1));
      mo.hp = mo.maxhp; ft.hp = ft.maxhp; RUF.startTurn(sr); sr.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; setDex(30); m0 = hpOf(mo); f0 = hpOf(ft); runF(MF.cast(Be, sr, 'fireball', 3, { x: mo.x, y: mo.y })); lm = m0 - hpOf(mo); lf = f0 - hpOf(ft);
      okF('Fireball, both save: the fighter takes ' + lf + ' (half), the monk ' + lm + ' (none)', lf > 0 && lm === 0);
      mo.hp = mo.maxhp; RUF.startTurn(sr); sr.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; setDex(-30); m0 = hpOf(mo); var nE = nlog(Be); runF(MF.cast(Be, sr, 'chainlightning', 6, mo)); lm = m0 - hpOf(mo);
      var totE = +(((Be.log || []).slice(nE).join(' ').match(/= (\d+) lightning/) || [0, 0])[1]);
      okF('Chain Lightning (the spell-list path): the monk fails and takes ' + lm + ' of ' + totE + ' (half: ' + Math.floor(totE / 2) + ')', totE > 0 && lm === Math.floor(totE / 2));
    } catch (eE) { repF.errors.push('evasion: ' + String(eE && eE.stack || eE).slice(0, 700)); }
    // Turn the Unholy (and the turned who now stay turned: the sweep at the caster's turn's end took their fright)
    try {
      var Bt = mkF(['paladin:5'], ['fighter:5'], 5), pal = sideF(Bt, 'party')[0], hum = sideF(Bt, 'foe')[0];
      spotF(Bt, pal, 9, 10); spotF(Bt, hum, 9, 6);
      var sk1 = addFoeF(Bt, 'skeleton', 8, 8), sk2 = addFoeF(Bt, 'skeleton', 10, 8), sk3 = addFoeF(Bt, 'skeleton', 11, 9);
      sk2.type = 'fiend'; sk2.name = 'Fiend'; saveWis(sk1, -30); saveWis(sk2, -30); saveWis(sk3, 30); saveWis(hum, -30);
      var near = FF.unholyNear(Bt, pal);
      okF('paladin 5 (' + pal.subclass + ', Channel Divinity ' + pal.feats.channel + '): fiends and undead within 30 ft: ' + near.map(function (w) { return w.type; }).join(', ') + '; the human fighter is not one', near.length === 3 && near.indexOf(hum) < 0 && FF.unholy(pal));
      playerF(pal); RUF.startTurn(pal);
      var cT = FF.commands(Bt, pal).filter(function (c) { return c.id === 'turnunholy'; })[0];
      var dT = GF.dist(pal, sk1); runF(FF.exec(Bt, pal, { do: 'turnunholy' }));
      okF('TURN THE UNHOLY button (' + (cT && cT.ok) + '): the undead and the fiend fail and are turned (' + [!!sk1.conds.turned, !!sk2.conds.turned].join('/') + '), the third stands (' + !sk3.conds.turned + '), the human is untouched (' + !hum.conds.turned + '); Channel Divinity ' + pal.feats.channel + ', action ' + pal.turn.action, cT && cT.ok && sk1.conds.turned && sk2.conds.turned && !sk3.conds.turned && !hum.conds.turned && pal.feats.channel === 0 && pal.turn.action === 0);
      okF('the turned take no reactions (' + sk1.reaction + '), carry frightened and feared, and must flee (' + MF.mustFlee(sk1) + ')', sk1.reaction === 0 && !!sk1.conds.frightened && !!sk1.conds.feared && MF.mustFlee(sk1) === true);
      var hp0 = pal.hp; runF(D.ai.turn(Bt, sk1));
      okF('its turn: it goes ' + dT + ' -> ' + GF.dist(pal, sk1) + ' ft from the paladin and strikes no one (hp ' + hp0 + ' -> ' + pal.hp + ')', GF.dist(pal, sk1) > dT && pal.hp === hp0 && !!sk1.conds.turned);
      var tn = sk1.conds.turned.till.n; Bt.active = pal; Bt.hurt(sk1, 1, 'slashing');
      okF('a blow ends it: turned ' + !!sk1.conds.turned + ', frightened ' + !!sk1.conds.frightened + ', feared ' + !!sk1.conds.feared + ' (its clock was ' + tn + ' turns)', !sk1.conds.turned && !sk1.conds.frightened && !sk1.conds.feared && tn === 9);
      // a minute: ten of its turns and the turning is over
      sk2.conds.turned.till.n = 1; MF.tick(Bt, sk2, 'start');
      okF('ten turns and it ends (turned ' + !!sk2.conds.turned + ', frightened ' + !!sk2.conds.frightened + ')', !sk2.conds.turned && !sk2.conds.frightened && !sk2.conds.feared);
      // the AI paladin: three of the dead about him, the prayer and not the sword; and they stay turned after his turn is over
      var Bt2 = mkF(['paladin:5'], ['fighter:5'], 5), pal2 = sideF(Bt2, 'party')[0]; spotF(Bt2, pal2, 9, 10); spotF(Bt2, sideF(Bt2, 'foe')[0], 1, 1);
      var ska = addFoeF(Bt2, 'skeleton', 8, 8), skb = addFoeF(Bt2, 'skeleton', 10, 8), skc = addFoeF(Bt2, 'skeleton', 9, 7); [ska, skb, skc].forEach(function (s) { saveWis(s, -30); }); pal2.known = [];
      var nT = nlog(Bt2); runF(D.ai.turn(Bt2, pal2)); var lT = (Bt2.log || []).slice(nT);
      okF('the AI paladin, three skeletons near: ' + (lT.filter(function (l) { return /TURN THE UNHOLY/.test(l); })[0] || 'no Turn the Unholy').slice(0, 70) + '; after his turn all three still flee (' + [ska, skb, skc].map(function (s) { return MF.mustFlee(s); }).join('/') + ')', lT.some(function (l) { return /TURN THE UNHOLY/.test(l); }) && [ska, skb, skc].every(function (s) { return MF.mustFlee(s) === true; }));
      // the cleric's Turn Undead, the same fault
      var Bt3 = mkF(['cleric:5'], ['fighter:5'], 5), cl3 = sideF(Bt3, 'party')[0]; spotF(Bt3, cl3, 9, 10); spotF(Bt3, sideF(Bt3, 'foe')[0], 1, 1);
      var sca = addFoeF(Bt3, 'skeleton', 8, 8), scb = addFoeF(Bt3, 'skeleton', 10, 8); saveWis(sca, -30); saveWis(scb, -30); cl3.known = []; sca.cr = '2'; scb.cr = '2'; // (a cleric 5 destroys the dead of CR 1/2 or less outright: these are past it)
      var nC = nlog(Bt3); runF(D.ai.turn(Bt3, cl3)); var lC = (Bt3.log || []).slice(nC);
      okF('the AI cleric\'s Turn Undead: ' + (lC.filter(function (l) { return /TURN UNDEAD/.test(l); })[0] || 'no Turn Undead').slice(0, 60) + '; after her turn they still flee (' + [sca, scb].map(function (s) { return MF.mustFlee(s); }).join('/') + ')', lC.some(function (l) { return /TURN UNDEAD/.test(l); }) && MF.mustFlee(sca) === true && MF.mustFlee(scb) === true);
      // Lymen, the 8-bit game's own paladin, is not given the button (his sheet is that game's)
      var Bl = new D.Battle({ ladder: true, fight: 'snoot', bench: true }); D.battle = Bl; Bl.enter(); while (!Bl.order.length) Bl.co.next();
      var ly = Bl.units.filter(function (u) { return u.id === 'lymen'; })[0]; if (ly) { RUF.startTurn(ly); okF('Lymen (a hero, ' + ly.cls + ' ' + ly.lvl + '): his Turn the Unholy button (RULED 09-30: he has it) ' + FF.commands(Bl, ly).some(function (c) { return c.id === 'turnunholy'; }), FF.commands(Bl, ly).some(function (c) { return c.id === 'turnunholy'; }) && FF.unholy(ly)); }
    } catch (eT) { repF.errors.push('turn: ' + String(eT && eT.stack || eT).slice(0, 700)); }
    // Countercharm
    try {
      var Bc = mkF(['bard:6', 'fighter:6', 'fighter:6'], ['wizard:5'], 6), bd = sideF(Bc, 'party')[0], bf1 = sideF(Bc, 'party')[1], bf2 = sideF(Bc, 'party')[2], fw = sideF(Bc, 'foe')[0];
      spotF(Bc, bd, 9, 8); spotF(Bc, bf1, 10, 8); spotF(Bc, bf2, 9 + 8, 8); spotF(Bc, fw, 9, 2); RUF.startTurn(bd);
      okF('bard 6, before the song: no one is countercharmed', !RUF.countercharmed(bd) && !RUF.countercharmed(bf1));
      runF(FF.countercharm(Bc, bd));
      okF('the song: on the bard (' + JSON.stringify(bd.conds.countercharm.till) + '); a friend 5 ft off ' + RUF.countercharmed(bf1) + ', 40 ft off ' + RUF.countercharmed(bf2) + ', a foe ' + RUF.countercharmed(fw), RUF.countercharmed(bd) && RUF.countercharmed(bf1) && !RUF.countercharmed(bf2) && !RUF.countercharmed(fw) && bd.conds.countercharm.till.n === 2);
      var s1 = RUF.save(bf1, 'wis', 30, false, 'frightened'), s2 = RUF.save(bf1, 'wis', 30, false, 'charmed'), s3 = RUF.save(bf1, 'wis', 30), s4 = RUF.save(bf1, 'wis', 30, false, 'poisoned'), s5 = RUF.save(bf2, 'wis', 30, false, 'frightened');
      okF('saves: frightened ' + s1.rolls.length + ' dice, charmed ' + s2.rolls.length + ', plain ' + s3.rolls.length + ', poisoned ' + s4.rolls.length + ', the friend out of hearing ' + s5.rolls.length + ' (want 2/2/1/1/1)', s1.rolls.length === 2 && s2.rolls.length === 2 && s3.rolls.length === 1 && s4.rolls.length === 1 && s5.rolls.length === 1 && s1.counter === 1);
      bd.conds.incapacitated = true; var incap = RUF.countercharmed(bf1); delete bd.conds.incapacitated;
      okF('the song ends if the bard is incapacitated (' + !incap + ')', !incap);
      // a Fear at the pair: the card names the advantage for those in the song
      fw.known = ['fear']; fw.slots = [4, 3, 3]; fw.slotsMax = fw.slots.slice(); RUF.startTurn(fw); spotF(Bc, fw, 9, 3); saveWis(bd, 30);
      var nF = nlog(Bc); runF(MF.cast(Bc, fw, 'fear', 3, { x: bd.x, y: bd.y })); var lF = (Bc.log || []).slice(nF);
      okF('a Fear at them: ' + lF.filter(function (l) { return /countercharm/.test(l); }).length + ' saves say advantage: countercharm', lF.filter(function (l) { return /advantage: countercharm/.test(l); }).length >= 1);
      // the AI bard: the song when the foe's Fear is up, and nothing else to do; it lasts to the end of its NEXT turn
      var Bc2 = mkF(['bard:6', 'fighter:6', 'fighter:6', 'fighter:6'], ['wizard:5'], 6), bd2 = sideF(Bc2, 'party')[0], wz2 = sideF(Bc2, 'foe')[0];
      spotF(Bc2, bd2, 9, 10); sideF(Bc2, 'party').slice(1).forEach(function (u, i) { spotF(Bc2, u, 8 + i, 11); }); spotF(Bc2, wz2, 9, 1); wz2.known = ['fear', 'hypnoticpattern']; wz2.slots = [4, 3, 3]; bd2.known = [];
      RUF.startTurn(bd2); var pl = TXF.plans(Bc2, bd2).filter(function (p) { return p.why === 'Countercharm'; })[0];
      okF('the AI bard weighs Countercharm against a foe with Fear: ' + (pl ? pl.score.toFixed(1) : 'no plan'), !!pl && pl.score > 3);
      var nB = nlog(Bc2); runF(D.ai.turn(Bc2, bd2)); var t1 = bd2.conds.countercharm && bd2.conds.countercharm.till.n;
      runF(D.ai.turn(Bc2, bd2)); var t2 = !!bd2.conds.countercharm;
      okF('it sings (' + (Bc2.log || []).slice(nB).some(function (l) { return /COUNTERCHARM/.test(l); }) + '), the clock ' + t1 + ' after its turn, gone after the next (' + !t2 + ')', (Bc2.log || []).slice(nB).some(function (l) { return /COUNTERCHARM/.test(l); }) && t1 === 1 && !t2);
      // the player's button
      var Bc3 = mkF(['bard:6'], ['fighter:6'], 6), bd3 = playerF(sideF(Bc3, 'party')[0]); spotF(Bc3, bd3, 9, 8); RUF.startTurn(bd3);
      var cc3 = FF.commands(Bc3, bd3).filter(function (c) { return c.id === 'countercharm'; })[0]; runF(FF.exec(Bc3, bd3, { do: 'countercharm' }));
      okF('the player\'s bard: a COUNTERCHARM button (' + (cc3 && cc3.ok) + '), pressed: the song is up (' + !!bd3.conds.countercharm + '), the action ' + bd3.turn.action, cc3 && cc3.ok && bd3.conds.countercharm && bd3.turn.action === 0);
    } catch (eC2) { repF.errors.push('countercharm: ' + String(eC2 && eC2.stack || eC2).slice(0, 700)); }
    // the sorcerer's metamagic
    try {
      var Bs = mkF(['sorcerer:5'], ['fighter:5', 'fighter:5'], 5), sc = playerF(sideF(Bs, 'party')[0]), fa = sideF(Bs, 'foe')[0], fb = sideF(Bs, 'foe')[1];
      spotF(Bs, sc, 9, 12); spotF(Bs, fa, 8, 5); spotF(Bs, fb, 11, 5); RUF.startTurn(sc);
      var pts0 = sc.feats.sorcery, slots0 = sc.slots.slice();
      var ids5 = FF.commands(Bs, sc).filter(function (c) { return /^meta-/.test(c.id); }).map(function (c) { return c.id; });
      okF('sorcerer 5 (' + pts0 + ' sorcery points): the generic one knows ' + (sc.metamagic || []).join(', ') + '; buttons ' + ids5.join(', '), (sc.metamagic || []).join() === 'quickened,twinned' && ids5.join() === 'meta-quickened,meta-twinned');
      runF(FF.exec(Bs, sc, { do: 'meta-twinned' })); var on1 = sc.turn.meta && sc.turn.meta.name;
      var nS = nlog(Bs); runF(MF.cast(Bs, sc, 'firebolt', 0, fa)); var lS = (Bs.log || []).slice(nS);
      okF('TWINNED on the button (' + on1 + '): Fire Bolt at two foes (' + lS.filter(function (l) { return /> .*Fire Bolt/.test(l); }).length + ' shots), points ' + pts0 + ' -> ' + sc.feats.sorcery + ', the action ' + sc.turn.action + ', the option cleared (' + !sc.turn.meta + ')', on1 === 'twinned' && lS.filter(function (l) { return /> .*Fire Bolt/.test(l); }).length === 2 && sc.feats.sorcery === pts0 - 1 && sc.turn.action === 0 && !sc.turn.meta);
      var Bs2 = mkF(['sorcerer:9'], ['fighter:5', 'fighter:5'], 9), sc2 = playerF(sideF(Bs2, 'party')[0]), fa2 = sideF(Bs2, 'foe')[0], fb2 = sideF(Bs2, 'foe')[1];
      spotF(Bs2, sc2, 9, 12); spotF(Bs2, fa2, 8, 6); spotF(Bs2, fb2, 11, 6); RUF.startTurn(sc2); sc2.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; sc2.slotsMax = sc2.slots.slice(); var p20 = sc2.feats.sorcery;
      runF(FF.exec(Bs2, sc2, { do: 'meta-twinned' })); var nS2 = nlog(Bs2); runF(MF.cast(Bs2, sc2, 'blight', 4, fa2)); var lS2 = (Bs2.log || []).slice(nS2);
      okF('TWINNED Blight (level 4): two casts (' + lS2.filter(function (l) { return /BLIGHT \(L4\)/.test(l); }).length + '), points ' + p20 + ' -> ' + sc2.feats.sorcery + ' (4), the 4th-level slots ' + 3 + ' -> ' + sc2.slots[3] + ' (one spent)', lS2.filter(function (l) { return /BLIGHT \(L4\)/.test(l); }).length === 2 && sc2.feats.sorcery === p20 - 4 && sc2.slots[3] === 2);
      RUF.startTurn(sc2); sc2.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; var p21 = sc2.feats.sorcery; runF(FF.exec(Bs2, sc2, { do: 'meta-twinned' })); var nS3 = nlog(Bs2); runF(MF.cast(Bs2, sc2, 'holdmonster', 5, fa2)); var lS3 = (Bs2.log || []).slice(nS3);
      okF('TWINNED on Hold Monster (concentration): refused, cast as it is (' + lS3.filter(function (l) { return /HOLD MONSTER/.test(l); }).length + ' cast, points ' + p21 + ' -> ' + sc2.feats.sorcery + ')', lS3.some(function (l) { return /does nothing here/.test(l); }) && lS3.filter(function (l) { return /HOLD MONSTER/.test(l); }).length === 1 && sc2.feats.sorcery === p21);
      // Quickened on the button: the action's spell as the bonus action
      RUF.startTurn(sc2); sc2.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; var p22 = sc2.feats.sorcery; runF(FF.exec(Bs2, sc2, { do: 'meta-quickened' })); runF(MF.cast(Bs2, sc2, 'magicmissile', 1, { units: [fa2, fa2, fb2] }));
      okF('QUICKENED on the button: Magic Missile takes the bonus action (bonus ' + sc2.turn.bonus + ', action ' + sc2.turn.action + '), points ' + p22 + ' -> ' + sc2.feats.sorcery, sc2.turn.bonus === 0 && sc2.turn.action === 1 && sc2.feats.sorcery === p22 - 2);
      // Careful and Heightened, for a sorcerer whose spec lists them
      var Bs3 = mkF([{ id: 'scx', cls: 'sorcerer', lvl: 9, metamagic: ['careful', 'heightened'] }, 'fighter:9', 'fighter:9'], ['fighter:9'], 9), sc3 = playerF(sideF(Bs3, 'party')[0]), al1 = sideF(Bs3, 'party')[1], al2 = sideF(Bs3, 'party')[2], fo3 = sideF(Bs3, 'foe')[0];
      spotF(Bs3, sc3, 9, 12); spotF(Bs3, fo3, 9, 5); spotF(Bs3, al1, 8, 5); spotF(Bs3, al2, 10, 5); RUF.startTurn(sc3); sc3.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; var p30 = sc3.feats.sorcery;
      okF('a spec\'s own list: ' + sc3.metamagic.join(', ') + ' (no Quickened, no Twinned); buttons ' + FF.commands(Bs3, sc3).filter(function (c) { return /^meta-/.test(c.id); }).map(function (c) { return c.id; }).join(', '), sc3.metamagic.join() === 'careful,heightened');
      runF(FF.exec(Bs3, sc3, { do: 'meta-careful' })); var nS4 = nlog(Bs3); runF(MF.cast(Bs3, sc3, 'fireball', 3, { x: fo3.x, y: fo3.y })); var lS4 = (Bs3.log || []).slice(nS4);
      okF('CAREFUL Fireball with two friends beside the foe: ' + lS4.filter(function (l) { return /spared/.test(l); }).length + ' spared, points ' + p30 + ' -> ' + sc3.feats.sorcery + ', B.meta cleared (' + !Bs3.meta + ')', lS4.filter(function (l) { return /spared/.test(l); }).length === 2 && sc3.feats.sorcery === p30 - 1 && !Bs3.meta);
      RUF.startTurn(sc3); sc3.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; var p31 = sc3.feats.sorcery; runF(FF.exec(Bs3, sc3, { do: 'meta-heightened' })); var nS5 = nlog(Bs3); runF(MF.cast(Bs3, sc3, 'blindnessdeafness', 2, fo3)); var lS5 = (Bs3.log || []).slice(nS5);
      okF('HEIGHTENED Blindness/Deafness: the foe saves with disadvantage (' + lS5.filter(function (l) { return /disadvantage: heightened/.test(l); }).length + '), points ' + p31 + ' -> ' + sc3.feats.sorcery, lS5.some(function (l) { return /disadvantage: heightened/.test(l); }) && sc3.feats.sorcery === p31 - 3);
      var hs1 = RUF.save(fo3, 'con', 99), hs2 = RUF.save(fo3, 'con', 99); // (no B.meta now: an ordinary save, one die)
      okF('and it does not leak: the next save is plain (' + hs1.rolls.length + ' die)', hs1.rolls.length === 1 && hs2.rolls.length === 1);
      // the AI: Twinned on two foes (cantrips only), and Careful on the plan whose area holds its friend
      var Ba = mkF(['sorcerer:5'], ['fighter:5', 'fighter:5'], 5), sa = sideF(Ba, 'party')[0]; spotF(Ba, sa, 9, 12); spotF(Ba, sideF(Ba, 'foe')[0], 8, 5); spotF(Ba, sideF(Ba, 'foe')[1], 11, 5); sa.known = ['firebolt', 'rayoffrost'];
      var nA = nlog(Ba); for (var ti = 0; ti < 3; ti++) runF(D.ai.turn(Ba, sa));
      okF('the AI sorcerer with two foes in range and cantrips: TWINNED SPELL ' + cntF(Ba, nA, /TWINNED SPELL/) + ' times in three turns, points ' + 5 + ' -> ' + sa.feats.sorcery, cntF(Ba, nA, /TWINNED SPELL/) >= 1);
      var Bb = mkF([{ id: 'scy', cls: 'sorcerer', lvl: 9, metamagic: ['careful', 'heightened'] }, 'fighter:9'], ['fighter:9', 'fighter:9'], 9), sb = sideF(Bb, 'party')[0], fr = sideF(Bb, 'party')[1], fo1 = sideF(Bb, 'foe')[0], fo2 = sideF(Bb, 'foe')[1];
      spotF(Bb, sb, 9, 12); spotF(Bb, fo1, 8, 5); spotF(Bb, fo2, 10, 5); spotF(Bb, fr, 9, 5); sb.known = ['fireball']; sb.slots = [4, 3, 3, 3, 2, 1, 1, 1, 1]; sb.slotsMax = sb.slots.slice(); RUF.startTurn(sb);
      var fbp = TXF.spellPlansFor(Bb, sb).filter(function (p) { return p.id === 'fireball'; })[0];
      okF('the AI sorcerer\'s Fireball with its friend between the foes: plan ' + (fbp ? fbp.why + ' ' + fbp.score.toFixed(1) : 'none'), !!fbp && !!fbp.meta && fbp.meta.name === 'careful');
      if (fbp) { var nB2 = nlog(Bb); runF(fbp.go()); okF('and cast: ' + cntF(Bb, nB2, /CAREFUL SPELL/) + ' Careful Spell card, ' + cntF(Bb, nB2, /spared/) + ' spared', cntF(Bb, nB2, /CAREFUL SPELL/) === 1 && cntF(Bb, nB2, /spared/) >= 1); }
    } catch (eS) { repF.errors.push('sorcerer: ' + String(eS && eS.stack || eS).slice(0, 900)); }
    // the warlock: the pact boon, Dark One's Own Luck
    try {
      var wl5 = D.npc.build('warlock:5', 5, 'foe', { id: 'w5' }), wl2 = D.npc.build('warlock:2', 2, 'foe', { id: 'w2' }), wlb = D.npc.build({ id: 'wb', cls: 'warlock', lvl: 5, pact: 'blade' }, 5, 'foe'), am = D.npc.build('amara', 5, 'foe', { id: 'am' });
      var tome = ['firebolt', 'sacredflame', 'viciousmockery'];
      okF('warlock 5, the generic one: pact ' + wl5.pact + ', the tome\'s cantrips ' + tome.map(function (id) { return wl5.known.indexOf(id) >= 0; }).join('/') + ' (' + wl5.known.filter(function (id) { var s = MF.data(id); return s && !s.level; }).length + ' cantrips, the class\'s three and the Book\'s three)', wl5.pact === 'tome' && tome.every(function (id) { return wl5.known.indexOf(id) >= 0; }));
      okF('warlock 2 has no pact yet (' + wl2.pact + '); Amara (a named warlock) has none: pact ' + am.pact + ', Fire Bolt ' + (am.known.indexOf('firebolt') >= 0), !wl2.pact && wl2.known.indexOf('firebolt') < 0 && !am.pact && am.known.indexOf('firebolt') < 0);
      var prof5 = 3, dexm = D.mod(wlb.abil.dex), strm = D.mod(wlb.abil.str);
      okF('pact of the blade: ' + wlb.weapon.name + ', magical ' + wlb.weapon.magic + ', attack ' + wlb.weapon.atk + ' (ability ' + Math.max(dexm, strm) + ' + proficiency ' + prof5 + '), the crossbow second (' + (wlb.alt && wlb.alt.name) + ')', wlb.pact === 'blade' && wlb.weapon.magic === true && wlb.weapon.atk === Math.max(dexm, strm) + prof5 && wlb.alt && /crossbow/i.test(wlb.alt.name));
      var Bw = mkF([{ id: 'wbl', cls: 'warlock', lvl: 5, pact: 'blade' }], ['fighter:5'], 5), wbl = sideF(Bw, 'party')[0], gr = sideF(Bw, 'foe')[0]; spotF(Bw, wbl, 9, 8); spotF(Bw, gr, 9, 9); gr.resist = ['mundane']; gr.baseAC = 1; gr.hp = gr.maxhp = 500; RUF.startTurn(wbl);
      D.d = function (nn) { return nn === 20 ? 15 : d0F(nn); }; var nW = nlog(Bw); runF(Bw.attack(wbl, gr, wbl.weapon)); var plainW = Object.assign({}, wbl.weapon, { magic: false }); runF(Bw.attack(wbl, gr, plainW)); D.d = d0F;
      var lW = (Bw.log || []).slice(nW);
      okF('the pact blade against a creature that shrugs off plain steel: the pact weapon ' + (cntF(Bw, nW, /shrugs off plain steel/) === 1 ? 'is not halved and the plain copy is' : 'no distinction (' + cntF(Bw, nW, /shrugs off plain steel/) + ' halvings)'), cntF(Bw, nW, /shrugs off plain steel/) === 1);
      // Dark One's Own Luck, the d20 pinned to 5 and the d10 to 7
      var wl6 = D.npc.build('warlock:6', 6, 'foe', { id: 'w6' }), wl5b = D.npc.build('warlock:5', 5, 'foe', { id: 'w5b' }), fg6 = D.npc.build('fighter:6', 6, 'foe', { id: 'f6' });
      D.d = function (nn) { return nn === 20 ? 5 : nn === 10 ? 7 : d0F(nn); };
      var bw = wl6.saves.wis, res = {};
      res.a = RUF.save(wl6, 'wis', 5 + bw + 6, false, 'frightened'); var used = wl6.feats.darkLuck;
      res.b = RUF.save(wl6, 'wis', 5 + bw + 6, false, 'frightened');
      wl6.feats.darkLuck = 1; res.c = RUF.save(wl6, 'wis', 5 + bw + 11, false, 'frightened'); var keptC = wl6.feats.darkLuck;
      res.d = RUF.save(wl6, 'wis', 5 + bw + 6); var keptD = wl6.feats.darkLuck;
      res.e = RUF.save(wl6, 'wis', 5 + bw + 6, false, null, 5); var keptE = wl6.feats.darkLuck;
      res.f = RUF.save(wl6, 'wis', 5 + bw + 6, false, null, 40); var usedF = wl6.feats.darkLuck;
      D.d = d0F;
      okF('Dark One\'s Own Luck (warlock 6, the Fiend: ' + wl6.subclass + '): a fright, short by 6: luck +' + res.a.luck + ' makes ' + res.a.total + ' vs ' + res.a.dc + ' (' + res.a.ok + '), the use spent (' + used + '); a second is not saved (' + !res.b.ok + ')', res.a.ok === true && res.a.luck === 7 && used === 0 && res.b.ok === false && !res.b.luck);
      okF('short by 11: no luck (' + !res.c.luck + ', still ' + keptC + '); nothing at stake: none (' + !res.d.luck + ', still ' + keptD + '); a blow of 5: none (' + !res.e.luck + '); a blow of 40: luck (' + res.f.luck + ', spent ' + (usedF === 0) + ')', !res.c.luck && keptC === 1 && !res.d.luck && keptD === 1 && !res.e.luck && keptE === 1 && res.f.luck === 7 && usedF === 0);
      okF('and only the Fiend\'s 6th: warlock 5 has ' + wl5b.feats.darkLuck + ', a fighter 6 ' + fg6.feats.darkLuck + '; the warlock 6 has ' + (D.npc.build('warlock:6', 6, 'foe', { id: 'w6b' }).feats.darkLuck), !wl5b.feats.darkLuck && !fg6.feats.darkLuck);
    } catch (eW) { D.d = d0F; repF.errors.push('warlock: ' + String(eW && eW.stack || eW).slice(0, 700)); }
    // Mindless Rage
    try {
      var Br = mkF(['barbarian:6'], ['wizard:5'], 6), bb = sideF(Br, 'party')[0], wzr = sideF(Br, 'foe')[0];
      spotF(Br, bb, 9, 8); spotF(Br, wzr, 9, 3); wzr.slots = [4, 3, 3]; wzr.slotsMax = wzr.slots.slice(); RUF.startTurn(bb);
      bb.conds.frightened = { by: wzr.id }; bb.conds.feared = { by: wzr.id, dc: 14 }; bb.conds.charmed = { by: wzr.id, breaks: true }; wzr.conc = { id: 'fear', name: 'Fear', undo: function () {} };
      var b5 = D.npc.build('barbarian:5', 5, 'party', { id: 'b5' });
      FF.rage(Br, bb);
      okF('barbarian 6 (' + bb.subclass + ') rages with a fright and a charm on him: they are put by (' + [!bb.conds.frightened, !bb.conds.feared, !bb.conds.charmed].join('/') + ', ' + (bb.suspended || []).length + ' held)', bb.subclass === 'Path of the Berserker' && !bb.conds.frightened && !bb.conds.feared && !bb.conds.charmed && (bb.suspended || []).length === 3);
      okF('raging: proof against frightened and charmed (' + [RUF.immuneTo(bb, 'frightened'), RUF.immuneTo(bb, 'charmed')].join('/') + '); before the rage or at level 5 it is not (' + RUF.immuneTo(b5, 'frightened') + ')', RUF.immuneTo(bb, 'frightened') && RUF.immuneTo(bb, 'charmed') && !RUF.immuneTo(b5, 'frightened'));
      spotF(Br, wzr, 9, 4); RUF.startTurn(wzr); var nR = nlog(Br); runF(MF.cast(Br, wzr, 'fear', 3, { x: bb.x, y: bb.y })); var lR = (Br.log || []).slice(nR);
      okF('a Fear cast at him: ' + (lR.filter(function (l) { return /fearless|proof against/.test(l); }).length ? 'fearless, no save asked' : 'the save was asked') + ', no fright laid (' + !bb.conds.frightened + ')', lR.some(function (l) { return /fearless|proof against/.test(l); }) && !bb.conds.frightened);
      wzr.conc = { id: 'fear', name: 'Fear', undo: function () {} }; bb.conds.raging.till.n = 1; MF.tick(Br, bb, 'start');
      okF('the rage ends, the wizard still holding his Fear: the fright and the charm come back (' + [!!bb.conds.frightened, !!bb.conds.feared, !!bb.conds.charmed].join('/') + ')', !bb.conds.raging && bb.conds.frightened && bb.conds.feared && bb.conds.charmed);
      // once more, the Fear let go meanwhile: the charm returns, the terror does not
      RUF.startTurn(bb); FF.rage(Br, bb, true); bb.feats.rage = 3; wzr.conc = null; bb.conds.raging.till.n = 1; MF.tick(Br, bb, 'start');
      okF('and with the Fear let go meanwhile: the charm back (' + !!bb.conds.charmed + '), the terror not (' + !bb.conds.frightened + '/' + !bb.conds.feared + ')', bb.conds.charmed && !bb.conds.frightened && !bb.conds.feared);
    } catch (eR) { repF.errors.push('rage: ' + String(eR && eR.stack || eR).slice(0, 700)); }
    // the Hunter's Defensive Tactics
    try {
      var Bh = mkF(['ranger:7'], ['fighter:7', 'fighter:7'], 7), rg = sideF(Bh, 'party')[0], hf = sideF(Bh, 'foe')[0], hf2 = sideF(Bh, 'foe')[1];
      var rgM = D.npc.build({ id: 'rgm', cls: 'ranger', lvl: 7, hunterDefense: 'multiattack' }, 7, 'party'), rgS = D.npc.build({ id: 'rgs', cls: 'ranger', lvl: 7, hunterDefense: 'steelwill' }, 7, 'party'), rg6 = D.npc.build('ranger:6', 6, 'party', { id: 'r6' });
      okF('ranger 7 (' + rg.subclass + '): the generic Hunter takes ' + rg.hunterDef + '; a spec: ' + rgM.hunterDef + ', ' + rgS.hunterDef + '; ranger 6: ' + rg6.hunterDef, rg.hunterDef === 'horde' && rgM.hunterDef === 'multiattack' && rgS.hunterDef === 'steelwill' && !rg6.hunterDef);
      spotF(Bh, rg, 9, 8); spotF(Bh, hf, 9, 7); spotF(Bh, hf2, 1, 1); RUF.startTurn(rg); hf.reaction = 1;
      var nH = nlog(Bh); runF(Bh.moveAlong(rg, [[9, 9]], { spend: true })); var lH = (Bh.log || []).slice(nH);
      okF('walking out of a foe\'s reach: its opportunity attack at disadvantage (' + lH.filter(function (l) { return /opportunity attack/.test(l); }).length + ' OA, ' + lH.filter(function (l) { return /escape the horde/.test(l); }).length + ' say escape the horde)', lH.some(function (l) { return /opportunity attack/.test(l); }) && lH.some(function (l) { return /dis: escape the horde/.test(l); }));
      rg.hunterDef = null; spotF(Bh, rg, 9, 8); RUF.startTurn(rg); hf.reaction = 1; nH = nlog(Bh); runF(Bh.moveAlong(rg, [[9, 9]], { spend: true })); lH = (Bh.log || []).slice(nH);
      okF('the same walk without it: an OA and no such reason (' + lH.filter(function (l) { return /opportunity attack/.test(l); }).length + ' OA, ' + lH.filter(function (l) { return /escape the horde/.test(l); }).length + ')', lH.some(function (l) { return /opportunity attack/.test(l); }) && !lH.some(function (l) { return /escape the horde/.test(l); }));
      // Multiattack Defense: a hit, then +4 to that one for the turn
      var Bh2 = mkF([{ id: 'rgm2', cls: 'ranger', lvl: 7, hunterDefense: 'multiattack' }], ['fighter:7', 'fighter:7'], 7), rm = sideF(Bh2, 'party')[0], ha = sideF(Bh2, 'foe')[0], hb = sideF(Bh2, 'foe')[1];
      spotF(Bh2, rm, 9, 8); spotF(Bh2, ha, 9, 7); spotF(Bh2, hb, 8, 7); RUF.startTurn(rm);
      D.d = function (nn) { return nn === 20 ? 15 : d0F(nn); }; var nM = nlog(Bh2);
      Bh2.round = 3; Bh2.active = ha; runF(Bh2.attack(ha, rm, ha.weapon)); var lM1 = (Bh2.log || []).slice(nM).filter(function (l) { return /multiattack defense/.test(l); }).length;
      runF(Bh2.attack(ha, rm, ha.weapon)); var lM2 = (Bh2.log || []).slice(nM).filter(function (l) { return /multiattack defense/.test(l); }).length;
      Bh2.active = hb; runF(Bh2.attack(hb, rm, hb.weapon)); var lM3 = (Bh2.log || []).slice(nM).filter(function (l) { return /multiattack defense/.test(l); }).length;
      Bh2.round = 4; Bh2.active = ha; runF(Bh2.attack(ha, rm, ha.weapon)); var lM4 = (Bh2.log || []).slice(nM).filter(function (l) { return /multiattack defense/.test(l); }).length;
      D.d = d0F;
      okF('Multiattack Defense: the first blow from a foe ' + lM1 + ' mentions of +4, its second ' + lM2 + ', another foe\'s ' + lM3 + ', the foe\'s next turn ' + lM4 + ' (want 0/1/1/1 running)', lM1 === 0 && lM2 === 1 && lM3 === 1 && lM4 === 1);
      var st1 = RUF.save(rgS, 'wis', 30, false, 'frightened'), st2 = RUF.save(rgS, 'wis', 30, false, 'charmed');
      okF('Steel Will (a spec): advantage against being frightened (' + st1.rolls.length + ' dice, ' + st1.counter + '), not against charm (' + st2.rolls.length + ')', st1.rolls.length === 2 && st1.counter === 2 && st2.rolls.length === 1);
    } catch (eH) { D.d = d0F; repF.errors.push('hunter: ' + String(eH && eH.stack || eH).slice(0, 700)); }
    // Supreme Sneak
    try {
      var Bx = mkF(['rogue:9', 'rogue:8'], ['fighter:7'], 9), rq = sideF(Bx, 'party')[0], rq8 = sideF(Bx, 'party')[1], fx = sideF(Bx, 'foe')[0];
      spotF(Bx, rq, 9, 8); spotF(Bx, rq8, 10, 8); fx.hp = 0; fx.dead = true; // (no eyes on them: the roll is the only thing)
      RUF.startTurn(rq); var nX = nlog(Bx); runF(Bx.hide(rq)); var hidStill = cntF(Bx, nX, /supreme sneak/);
      RUF.startTurn(rq); var tgt3 = { x: rq.x, y: rq.y + 3 };
      var path3 = GF.path(GF.reach(rq, rq.turn.move), tgt3.x, tgt3.y); runF(Bx.moveAlong(rq, path3, { spend: true })); var mv3 = rq.turn.moved; nX = nlog(Bx); runF(Bx.hide(rq)); var hid15 = cntF(Bx, nX, /supreme sneak/);
      RUF.startTurn(rq); var path4 = GF.path(GF.reach(rq, rq.turn.move), rq.x, rq.y - 4); runF(Bx.moveAlong(rq, path4, { spend: true })); var mv4 = rq.turn.moved; nX = nlog(Bx); runF(Bx.hide(rq)); var hid20 = cntF(Bx, nX, /supreme sneak/);
      RUF.startTurn(rq8); nX = nlog(Bx); runF(Bx.hide(rq8)); var hid8 = cntF(Bx, nX, /supreme sneak/);
      okF('Supreme Sneak (rogue 9, ' + rq.subclass + ', speed ' + rq.speed + '): standing still ' + hidStill + ', moved ' + mv3 + ' ft ' + hid15 + ', moved ' + mv4 + ' ft ' + hid20 + '; a rogue 8 ' + hid8 + ' (want 1/1/0/0)', hidStill === 1 && mv3 === 15 && hid15 === 1 && mv4 === 20 && hid20 === 0 && hid8 === 0);
    } catch (eX) { repF.errors.push('sneak: ' + String(eX && eX.stack || eX).slice(0, 700)); }
    // the fault found on the way: a Fear cast by an AI caster kept past the end of its turn
    try {
      var Bf = mkF(['wizard:5'], ['fighter:7', 'fighter:7'], 5), wzf = sideF(Bf, 'party')[0], ffs = sideF(Bf, 'foe'); spotF(Bf, wzf, 9, 10); spotF(Bf, ffs[0], 8, 5); spotF(Bf, ffs[1], 10, 5);
      wzf.known = ['fear']; wzf.slots = [4, 3, 2]; wzf.slotsMax = wzf.slots.slice(); ffs.forEach(function (w) { saveWis(w, -30); });
      var nFe = nlog(Bf); runF(D.ai.turn(Bf, wzf));
      // (a note, not a test: the AI's end-of-turn sweep of a laid fright (ai.js) takes the `frightened` half of a Fear its caster laid; the turned are exempt, Fear is not -- 09-30, found, left for the seat)
      okF('NOTE (found, left alone): after an AI wizard\'s Fear (' + cntF(Bf, nFe, /FEAR/) + ' cast) its victims are feared/frightened/must-flee: ' + ffs.map(function (w) { return !!w.conds.feared + '/' + !!w.conds.frightened + '/' + MF.mustFlee(w); }).join(' and '), cntF(Bf, nFe, /FEAR/) >= 1);
    } catch (eFe) { repF.errors.push('fear: ' + String(eFe && eFe.stack || eFe).slice(0, 700)); }
    // the party panel's class line: does it fit the row (x + 42 to x + 434: 392)?
    try {
      var widths = [];
      var sw = D.npc.build('sorcerer:9', 9, 'party', { id: 'd' }); sw.metamagic = ['quickened', 'twinned', 'careful', 'heightened']; // (the class NPCs stop at 9; a sorcerer of 17 would know four)
      [D.npc.build('monk:7', 7, 'party', { id: 'a' }), D.npc.build('paladin:5', 5, 'party', { id: 'b' }), D.npc.build('bard:6', 6, 'party', { id: 'c' }), sw, D.npc.build('warlock:6', 6, 'party', { id: 'e' }), D.npc.build('barbarian:6', 6, 'party', { id: 'f' }), D.npc.build('ranger:7', 7, 'party', { id: 'g' }), D.npc.build('rogue:9', 9, 'party', { id: 'h' })].forEach(function (u) {
        var f = u.feats || {}, res = [];
        if (u.slots && u.slots.length) res.push('slots ' + u.slots.map(function (nn, k) { return (k + 1) + ':' + nn + '/' + u.slotsMax[k]; }).join(' '));
        if (u.cls === 'paladin') res.push('lay on hands ' + (f.lay || 0));
        if (u.cls === 'rogue') res.push('sneak ' + RUF.sneakDice(u) + ', cunning action, uncanny dodge, evasion');
        var fl = FF.classLine(u); if (fl) res.push(fl);
        widths.push(u.cls + ' ' + u.lvl + ' ' + D.textWidth(res.join('   ')) + 'px: ' + fl);
      });
      okF('the party panel\'s class line, widths against 392 px: ' + widths.join(' | '), widths.every(function (w) { return +w.match(/ (\d+)px/)[1] <= 392; }));
    } catch (eL) { repF.errors.push('line: ' + String(eL && eL.stack || eL).slice(0, 500)); }
    D.d = d0F;
    if (errs.length) repF.errors = repF.errors.concat(errs);
    if (D.lastError) repF.errors.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 500));
    var preF = document.createElement('pre'); preF.id = 'out'; preF.textContent = 'BENCH16 ' + JSON.stringify(repF);
    document.body.appendChild(preF);
    return;
  }
  var log = null;
  for (var i = 0; i < n; i++) {
    D.seed = seed0 * 7919 + i * 104729;
    D.lastError = null;
    var B;
    try {
      var fid = get('fight', '');
      B = fid ? new D.Battle({ ladder: true, fight: fid, bench: true, npc: vs ? { party: vs.split(','), foes: [] } : null }) : new D.Battle({ npc: { foes: foes, party: vs ? vs.split(',') : null }, bench: true, fightDef: D.classFight(L) });
      D.battle = B; B.enter();
      if (fid) B.units.forEach(function (u) { if (u.side === 'party') { u.guest = true; u.classAI = true; } });
    } catch (e) { errs.push('enter: ' + String(e && e.stack || e).slice(0, 600)); break; }
    var res = drive(B);
    if (D.lastError) errs.push('lastError: ' + String(D.lastError.stack || D.lastError).slice(0, 400));
    if (res === 'won') stats.won++; else if (res === 'lost') stats.lost++; else stats.other++;
    stats.rounds += B.round;
    stats.fights.push(res + ' R' + B.round + ' ' + B.units.map(function (u) { return u.name + ' ' + Math.max(0, u.hp) + '/' + u.maxhp; }).join(', '));
    var pty = B.units.filter(function (u) { return u.side === 'party'; });
    stats.left = (stats.left || 0) + pty.reduce(function (s, u) { return s + Math.max(0, u.hp); }, 0) / Math.max(1, pty.reduce(function (s, u) { return s + u.maxhp; }, 0));
    stats.downs = (stats.downs || 0) + pty.filter(function (u) { return u.hp <= 0; }).length;
    if (wantLog && !log) log = (B.log || []).concat(['--- decisions ---'], B.benchLog || []);
  }
  var out = { lvl: L, foes: get('fight', '') ? ['fight:' + get('fight', '')] : foes, vs: vs || 'the four', n: n, won: stats.won, lost: stats.lost, other: stats.other, avgRounds: +(stats.rounds / Math.max(1, n)).toFixed(1),
    dealt: stats.dealt, taken: stats.taken, down: stats.down, casts: stats.casts, fights: stats.fights, errors: errs.slice(0, 5), log: log,
    partyLeft: Math.round(100 * (stats.left || 0) / Math.max(1, n)), partyDowns: +((stats.downs || 0) / Math.max(1, n)).toFixed(2) };
  var pre = document.createElement('pre'); pre.id = 'out'; pre.textContent = 'BENCH16 ' + JSON.stringify(out);
  document.body.appendChild(pre);
})();
