/* The four's sheets in the Skylights at a level (dev/skylights-smart.py probe=1): what dev/skylights-party.js plans with. Off to the side. */
'use strict';
(function () {
  var D = window.D16, q = location.search;
  function get(k, d) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(q); return m ? decodeURIComponent(m[1]) : d; }
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  D.spr.offline = true;
  var out = { errors: [] };
  try {
    D.seed = 7919;
    var B = new D.Battle({ ladder: true, fight: 'edifice', bench: true, level: +get('flvl', 6) });
    D.battle = B; B.enter();
    var all = B.units.concat(B.arriving ? B.arriving.ours : []);
    var wp = function (w) { return w ? { name: w.name, dice: w.dice, ranged: !!w.ranged, range: w.range, reach: w.reach, thrown: w.thrown, props: w.props } : null; };
    out.party = all.filter(function (u) { return u.side === 'party' && !u.ally && !u.object; }).map(function (u) {
      return { id: u.id, key: u.key, name: u.name, cls: u.cls, sub: u.subclass, lvl: u.lvl, hp: u.hp, ac: D.rules.ac(u), speed: u.speed, weapon: wp(u.weapon), alt: wp(u.alt), offhand: wp(u.offhand),
        known: u.known, slots: u.slots, feats: u.feats, dc: u.spellDC, atk: u.spellAtk, attacksBase: u.attacksBase, torch: u.torch, ownFlask: u.ownFlask, ownRope: u.ownRope, x: u.x, y: u.y, script: u.script };
    });
    out.inv = B.inv;
    // the day each caster could prepare: the book or the class list (the pool), how many, and what the build's default took
    var fx = D.save.fixture(+get('flvl', 6));
    out.prep = fx.party.filter(function (h) { return D.save.prepCount(h); }).map(function (h) { return { id: h.id || h.key, count: D.save.prepCount(h), prepared: h.prepared, pool: D.save.prepPool(h) }; });
    out.foes = all.filter(function (u) { return u.side === 'foe'; }).map(function (u) { return { id: u.id, name: u.name, kind: u.kind, x: u.x, y: u.y, size: u.size, hp: u.hp, ac: D.rules.ac(u), climbs: u.climbs, mission: u.mission, missionOnly: u.missionOnly, guard: u.guard, roofGuard: u.roofGuard, streetFirst: u.streetFirst, rocks: u.rocks }; });
    out.ropes = B.ropes; out.ropeBucket = B.ropeBucket;
    var sky = B.units.filter(function (w) { return w.id === 'skylight'; })[0];
    out.sky = sky ? { x: sky.x, y: sky.y, size: sky.size, hp: sky.hp, z: D.grid.gzAt(sky, sky.x, sky.y) } : null;
    out.step = D.grid.map.def.step;
    out.z = { street: D.grid.map.gz(29, 19), roof: D.grid.map.gz(29, 10), rim: D.grid.map.gz(29, 15), face: D.grid.map.gz(29, 16) };
  } catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.id = 'out'; pre.textContent = 'BENCH16 ' + JSON.stringify(out);
  document.body.appendChild(pre);
})();
