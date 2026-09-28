/* DEEP16 — a fight inside the 8-bit game (?embed). The 8-bit page lays this page over its own canvas in an iframe
   (js/embed.js there) and the two talk by postMessage: this page says 'd16:ready' once it has loaded, the 8-bit page
   answers with the fight and the party as they stand ('ds8:fight'), and when the fight is over this page sends back what
   it did ('d16:done'). RULED 09-27 (Griz): the ettercap is replaced outright, and "what is spent in the fight gone on
   return to 8-bit": HP, slots, uses, potions and bolts. DEEP16 still writes no 8-bit save; the 8-bit page applies the
   result to its own party, and the save changes when the player saves. */
'use strict';
(function () {
  var D = window.D16, E = D.embed = { on: /[?&]embed\b/.test(location.search) };
  function send(m) { if (window.parent && window.parent !== window) window.parent.postMessage(m, '*'); }
  function counts(inv) { var c = {}; (inv || []).forEach(function (s) { c[s.id] = (c[s.id] || 0) + s.n; }); return c; }

  E.boot = function () {
    window.addEventListener('message', function (e) {
      var m = e.data;
      if (e.source !== window.parent || !m || m.type !== 'ds8:fight' || E.B) return;
      E.start(m);
    });
    send({ type: 'd16:ready' });
  };
  E.start = function (m) {
    // an 8-bit list with a foe the grid has no sheet for (review 09-28 #13): say so, and the 8-bit game fights it itself
    var list = m.opts && m.opts.enemies, missing = (list || []).filter(function (id8) { return !D.FOES[D.kind8 ? D.kind8(id8) : id8]; });
    if (missing.length) { console.warn('DEEP16: no foe for the 8-bit game\'s ' + missing.join(', ') + ': the fight stays 8-bit'); send({ type: 'd16:refuse', missing: missing }); return; }
    var B = E.B = new D.Battle({ embed: m.opts || {}, fight: m.fight, data: m.save, onDone: function (res) { E.done(B, res); } });
    D.push(B);
    E.inv0 = counts(B.inv); // (the pack as the fight began: only what the party brought, no loan here)
    D.canvas.focus();
  };
  E.done = function (B, res) {
    var foes = B.units.filter(function (u) { return u.side === 'foe'; });
    send({
      type: 'd16:done', result: res || 'escaped',
      party: B.units.concat(B.reserve || [], B.stayed || []).filter(function (u) { return u.side === 'party'; }).map(function (u) { // (reserve: still in the inn when it ended)
        return { id: u.id, guest: !!u.guest, hp: Math.max(0, u.hp), maxhp: u.maxhp, slots: (u.slots || []).slice(), feats: u.feats || {}, mageArmor: !!u.conds.mageArmor, left: !!u.left,
          equip: u.src && u.src.equip ? JSON.parse(JSON.stringify(u.src.equip)) : null }; // (EQUIP in the fight crosses back: RULED 09-28)
      }),
      // the rest came out of the inn (the lone investigator's fight, Battle.joinReserve): the 8-bit battle's `solo` is over, and its
      // XP is split among everyone standing (review 09-28 #2)
      joined: !!(B.o.embed && B.o.embed.solo) && !(B.reserve || []).length,
      roost: B.roostBroken || null, // (bright light under the roost: the 8-bit's RoostFail runs on it)
      foes: foes.map(function (u) { return { id: u.id, kind: u.kind, i8: u.i8, dead: u.hp <= 0, fled: !!u.fled }; }), // (i8: its place in the 8-bit list)
      // who is still out there when the fight ends because one got away (fight.fledEnds: the 8-bit wagon yard): the chase's
      away: foes.filter(function (u) { return u.flees && u.hp > 0; }).map(function (u) { return u.kind; }),
      inv0: E.inv0, inv1: counts(B.inv)
    });
  };
})();
