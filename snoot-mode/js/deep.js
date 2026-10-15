/* THE SNOOT -- the party's fights on the grid (10-14, the Snoot mode seat). RULED 10-13 ("Chef's dice"): DEEP16 only where the party
   stands. Through DEEP16's own embed door, the way the 8-bit game opens its story fights (js/embed.js there; deep16/js/embed.js): this
   page lays deep16/index.html?embed over itself in an iframe, answers its 'd16:ready' with 'ds8:fight' (the fight's id, the four as
   they stand, the war-band as the 8-bit's own list), and takes back 'd16:done' -- what the four spent stays spent (HP, slots, uses,
   potions), and what fell of the band says how hard the unit breaks. DEEP16 is not changed for this. A grid that will not come up
   ('d16:refuse', 'd16:crash', no 'd16:ready' in 30 s) leaves the fight to the tables (SN.standIn), and the log says so.
   The fights: a gnoll band is the road's glory-seekers fight (`snoot`) with the band's list; the Dominion's soldiers the road north's
   chase (`roadcatch1`: "You run them down where the road climbs"); the Harbinger met away from GreyFang is `harbinger`; the
   collision with the four around is `greyfang`, GreyFang's Pit as built (10-08), its trophy ending taking the head. */
'use strict';
(function () {
  var SN = window.SN, DP = SN.Deep = {};
  DP.READY_MS = 30000;
  DP.fight = function (st, req, done) {
    if (/[?&]bench\b/.test(location.search) || !st.party8) { done(SN.standIn(st, req)); return; }
    var fight = req.dominion ? 'roadcatch1' : req.fight, fr = document.createElement('iframe'), closed = false, timer = null;
    // the men of ours beside the four (RULED 10-15): DEEP16's trooper, one a man, by its key ('ally-<unit>-<n>': two troopers are two)
    var guests = (req.allies || []).map(function (a) { return Object.assign(JSON.parse(JSON.stringify(SN.TROOPER8)), { key: a.key }); });
    var snap = JSON.parse(JSON.stringify({ party: st.party8.party, guests: guests, inv: st.party8.inv || [], flags: st.party8.flags || {} }));
    function close(m) {
      if (closed) return; closed = true; clearTimeout(timer); window.removeEventListener('message', onMsg);
      if (fr.parentNode) fr.parentNode.removeChild(fr);
      if (!m || m.type !== 'd16:done') { SN.say(st, 'The grid would not come up (' + (m && (m.msg || m.type) || 'no answer') + '): the four\'s part goes on the tables.', 'party', req.at); done(SN.standIn(st, req)); return; }
      var foes = m.foes || [], down = foes.filter(function (f) { return f.dead || f.fled; }).length;
      // the pack: what the fight used is gone (a potion drunk, a bolt loosed) -- the 8-bit's own rule (js/embed.js apply)
      if (st.party8.inv && m.inv0) { var i0 = m.inv0, i1 = m.inv1 || {}; Object.keys(i0).forEach(function (id) { var used = i0[id] - (i1[id] || 0); if (used <= 0) return; st.party8.inv.forEach(function (sl) { var sid = Array.isArray(sl) ? sl[0] : sl.id; if (sid !== id || used <= 0) return; var n = Array.isArray(sl) ? sl[1] : sl.n, k = Math.min(n, used); used -= k; if (Array.isArray(sl)) sl[1] -= k; else sl.n -= k; }); }); }
      var dead = foes.filter(function (f) { return f.dead; }).length, allyDead = {};
      (m.party || []).forEach(function (p) { var mm = /^ally-(.+)-\d+$/.exec(p.id || ''); if (mm && p.hp <= 0) allyDead[mm[1]] = (allyDead[mm[1]] || 0) + 1; });
      done({ result: m.result, share: foes.length ? down / foes.length : (m.result === 'won' ? 1 : 0), party: m.party, foes: foes, dead: dead, allyDead: allyDead });
    }
    function onMsg(e) {
      if (e.source !== fr.contentWindow || !e.data) return;
      var m = e.data;
      if (m.type === 'd16:ready') {
        clearTimeout(timer);
        fr.contentWindow.postMessage({ type: 'ds8:fight', fight: fight, save: snap, opts: { canRun: true, enemies: req.enemies || null, revealed: true, dark: false } }, '*');
      }
      if (m.type === 'd16:done' || m.type === 'd16:refuse' || m.type === 'd16:crash') close(m);
    }
    window.addEventListener('message', onMsg);
    fr.id = 'd16'; fr.title = 'DEEP16'; fr.allow = 'gamepad';
    fr.src = (SN.DEEP16 || '../deep16/') + 'index.html?embed';
    fr.onload = function () { try { fr.contentWindow.focus(); } catch (e) { } };
    document.getElementById('app').appendChild(fr);
    timer = setTimeout(function () { close({ type: 'd16:crash', msg: 'no ready in ' + DP.READY_MS / 1000 + ' s' }); }, DP.READY_MS);
  };
})();
