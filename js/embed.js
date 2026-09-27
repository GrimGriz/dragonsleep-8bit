/* DRAGONSLEEP — a fight fought in DEEP16 (09-27. RULED, Griz: the ettercap, "replace it outright"; "what is spent in the
   fight gone on return to 8-bit"). A battle with `deep16: '<fight id>'` (deep16/data/fights.js) lays DEEP16 over the whole
   window in an iframe (the cradle's #fx is the precedent: one scene may step outside the 8-bit frame), hands it the party
   by postMessage, and takes back what the fight did: HP and KO, spell slots, feature uses, Mage Armor and Aid cast in it,
   potions and bolts used. Nothing is refunded. Then the 8-bit battle's own ending runs on the result (Victory!, XP,
   silver, drops, the harvest; GAME OVER on a loss), so the scene that yielded DS.battle carries on as ever. DEEP16 writes
   no 8-bit save: this page applies the result to its party, and the save changes only when the player saves.
   Wraps DS.battle (the deep.js way): file order is call order, so this loads after battle.js. */
'use strict';
(function () {
  var DS = window.DS, base = DS.battle;
  var RESULT = { won: 'win', lost: 'lose', escaped: 'run', fled: 'fled' };

  DS.battle = function (o) { return o && o.deep16 ? deep(o) : base(o); };

  function deep(o) {
    return {
      start: function (script) {
        var self = this, prevSong = DS.audio.songId;
        DS.audio.sfx('encounter');
        DS.push(new DS.EncounterFlash(function () {
          open(o, function (d) {
            var res = apply(d);
            var b = new DS.Battle(o);
            // the 8-bit foes as DEEP16 left them: on a win all down (one who got away gives no XP), else as they stood
            var back = (d.foes || []).slice();
            b.foes.forEach(function (f) {
              var k = -1;
              for (var i = 0; i < back.length; i++) if (back[i].kind === f.id) { k = i; break; }
              var r = k >= 0 ? back.splice(k, 1)[0] : null;
              if (res === 'win' || (r && (r.dead || r.fled))) { f.dead = true; f.fade = 0; if (r && r.fled) f.fled = true; }
            });
            b.over = res; b.fromDeep = true;
            b.onClose = function (r) {
              self.finished = true; self.result = r;
              if (o.after !== false && r !== 'lose' || o.lossOk) DS.audio.play(o.returnSong || prevSong, true);
              setTimeout(function () { script.resume(self, r); }, 0);
            };
            DS.push(b);
          });
        }));
      }
    };
  }

  // DEEP16 up over the screen; the 8-bit game holds still under it (DS.paused) until the fight comes back
  function open(o, done) {
    var g = DS.G, fr = document.createElement('iframe');
    var snap = JSON.parse(JSON.stringify({ party: g.party, guests: (g.guests || []).map(function (x) { return x.h; }), inv: g.inv, flags: g.flags }));
    function onMsg(e) {
      var m = e.data;
      if (e.source !== fr.contentWindow || !m) return;
      // the lone investigator (the wagon night's INVESTIGATE): the 8-bit battle's `solo` (a party index) goes over as the hero's
      // id, with `join`, the round the rest come out of the inn
      var solo = o.solo != null && g.party[o.solo] ? g.party[o.solo].id : null;
      if (m.type === 'd16:ready') fr.contentWindow.postMessage({ type: 'ds8:fight', fight: o.deep16, save: snap, opts: { canRun: o.canRun !== false, solo: solo, join: o.join || 0 } }, '*');
      if (m.type === 'd16:done') {
        window.removeEventListener('message', onMsg);
        fr.parentNode.removeChild(fr);
        DS.paused = false; DS.input.flush();
        if (DS.canvas) DS.canvas.focus();
        done(m);
      }
    }
    window.addEventListener('message', onMsg);
    DS.audio.stop();
    fr.id = 'd16'; fr.title = 'DEEP16'; fr.src = 'deep16/index.html?embed';
    fr.onload = function () { try { fr.contentWindow.focus(); } catch (e) { } };
    document.body.appendChild(fr);
    DS.paused = true;
  }

  // what the fight did, onto the party: what was spent stays spent (no slot, use or potion comes back that the fight took)
  function apply(d) {
    var g = DS.G, all = g.party.concat((g.guests || []).map(function (x) { return x.h; }));
    (d.party || []).forEach(function (r) {
      var h = all.filter(function (x) { return x.id === r.id; })[0];
      if (!h) return;
      h.conds = h.conds || {};
      // Aid cast in the fight: the 8-bit game's own Aid, lifted at the next long rest (EV.longRest)
      if (r.maxhp > h.maxhp) { h.conds.aid = (h.conds.aid || 0) + r.maxhp - h.maxhp; h.maxhp = r.maxhp; }
      h.hp = Math.max(0, Math.min(h.maxhp, r.hp)); h.ko = h.hp <= 0;
      if (r.slots && h.slots) h.slots = h.slots.map(function (n, i) { return r.slots[i] == null ? n : Math.min(n, r.slots[i]); });
      if (r.feats && h.feats) Object.keys(h.feats).forEach(function (k) { if (typeof h.feats[k] === 'number' && typeof r.feats[k] === 'number') h.feats[k] = Math.min(h.feats[k], r.feats[k]); });
      if (r.mageArmor) h.conds.mageArmor = true; // cast in the fight: it holds till the long rest, as the 8-bit game's does
    });
    // the pack: what the fight used is gone (a potion drunk, a bolt loosed), never below none. The party fights with only
    // what it brought (no crossbow lent here, Griz 09-27)
    var i0 = d.inv0 || {}, i1 = d.inv1 || {};
    Object.keys(i0).forEach(function (id) { var used = i0[id] - (i1[id] || 0), have = g.count(id); if (used > 0 && have > 0) g.take(id, Math.min(used, have)); });
    if (d.result === 'fled') DS.fledIds = (d.away || []).slice();
    return RESULT[d.result] || 'run';
  }
})();
