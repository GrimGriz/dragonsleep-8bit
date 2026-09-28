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
  var RESULT = { won: 'win', lost: 'lose', escaped: 'run', fled: 'fled', yielded: 'win', roost: 'lose' }; // (roost: the roof let go, RoostFail)

  DS.battle = function (o) { return o && o.deep16 ? deep(o) : base(o); };

  function deep(o) {
    return {
      start: function (script) {
        var self = this, prevSong = DS.audio.songId;
        DS.audio.sfx('encounter');
        DS.push(new DS.EncounterFlash(function () {
          open(o, function (d) {
            if (d.type === 'd16:refuse') { // (no sheet on the grid for one of these: the 8-bit battle, as ever)
              console.warn('DEEP16 refused ' + o.deep16 + ' (' + (d.missing || []).join(', ') + '): fought in the 8-bit game');
              var b8 = new DS.Battle(o);
              b8.onClose = function (r) { self.finished = true; self.result = r; if (o.after !== false && r !== 'lose' || o.lossOk) DS.audio.play(o.returnSong || prevSong, true); setTimeout(function () { script.resume(self, r); }, 0); };
              DS.push(b8); return;
            }
            var res = apply(d);
            // the rest of the party came out of the inn during the fight: no longer a lone fighter's battle, so the XP is split
            // among everyone standing, as the 8-bit's own joinParty leaves it (review 09-28 #2)
            if (d.joined && o.solo != null) o.solo = null;
            var b = new DS.Battle(o);
            // the 8-bit foes as DEEP16 left them: on a win all down (one who got away gives no XP), else as they stood. Each
            // DEEP16 foe knows its place in the 8-bit list (i8); a fight built without the list is matched by kind
            var back = (d.foes || []).slice();
            b.foes.forEach(function (f, n) {
              var k = -1;
              for (var i = 0; i < back.length; i++) if (back[i].i8 === n) { k = i; break; }
              if (k < 0) for (var j = 0; j < back.length; j++) if (back[j].i8 == null && back[j].kind === f.id) { k = j; break; }
              var r = k >= 0 ? back.splice(k, 1)[0] : null;
              if (res === 'win' || (r && (r.dead || r.fled))) { f.dead = true; f.fade = 0; if (r && r.fled) f.fled = true; }
              // he yielded (the cleric): the 8-bit battle's own yield, a win with him standing (no harvest off him)
              if (d.result === 'yielded' && r && !r.dead) f.surrendered = true;
              // one who ran carries his flag out with him, as the 8-bit foeBolt does (the wheelwright: wheelwrightRan)
              if (r && r.fled && f.m.traits && f.m.traits.flag) DS.G.flags[f.m.traits.flag] = 1;
            });
            b.over = d.result === 'roost' ? 'roost' : res; b.fromDeep = true; // (roost: finish() runs the swarm and RoostFail)
            if (d.result === 'roost') { b.usedFire = true; b.roostCause = d.roost === 'fire' ? 'fire' : 'light'; } // (Light, Daylight, the paladin's glow: bright light)
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
    // the guests the 8-bit battle would field (standing, and none for a lone fighter or a noGuests fight), each by its key
    // (two troopers are pinA and pinB, both 'trooper' underneath)
    var guests = o.solo == null && !o.noGuests ? (g.guests || []).filter(function (x) { return !x.h.ko && x.h.hp > 0; }) : [];
    var snap = JSON.parse(JSON.stringify({ party: g.party, guests: guests.map(function (x) { return Object.assign({}, x.h, { key: x.id }); }), inv: g.inv, flags: g.flags }));
    function onMsg(e) {
      var m = e.data;
      if (e.source !== fr.contentWindow || !m) return;
      // the lone investigator (the wagon night's INVESTIGATE): the 8-bit battle's `solo` (a party index) goes over as the hero's
      // id, with `join`, the round the rest come out of the inn
      var solo = o.solo != null && g.party[o.solo] ? g.party[o.solo].id : null;
      // the light already on them: the scene's `revealed`, or a hero carrying a weapon that reveals (the Sunshaft staff: the 8-bit
      // battle's `seer`, js/battle.js), so nothing on the grid starts hidden (review 09-28 #5)
      var seer = g.party.some(function (h) { if (h.ko) return false; var w = DS.R.item(h.equip && h.equip.weapon); return !!(w && w.weapon && w.weapon.reveals); });
      // the fight is the 8-bit scene's own foes (RULED 09-28, Griz: "8-bit's list"), and its opening: who was caught unaware
      // (`surprised`), whether the light was already on them (`revealed`), what a foe who yields says (`yieldText`)
      // torchdark (09-28): whether it is dark where the fight is (the 8-bit map's `dark`, the night's tint: EV.darkHere), and who
      // walked in holding a lit torch (the field's g.flags.torchBy)
      var dark = o.dark != null ? !!o.dark : (DS.EV.darkHere ? DS.EV.darkHere() : false);
      if (m.type === 'd16:ready') fr.contentWindow.postMessage({ type: 'ds8:fight', fight: o.deep16, save: snap, opts: {
        canRun: o.canRun !== false, solo: solo, join: o.join || 0, only: o.deep16Only || null, enemies: o.enemies || null,
        surprised: o.surprised || null, revealed: !!o.revealed || seer, yieldText: o.yieldText || null,
        dark: dark, torch: o.torch || g.flags.torchBy || null } }, '*');
      if (m.type === 'd16:done' || m.type === 'd16:refuse') {
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
    var g = DS.G, all = g.party.map(function (h) { return { id: h.id, h: h }; }).concat(g.guests || []); // (a guest by its key)
    (d.party || []).forEach(function (r) {
      var h = (all.filter(function (x) { return x.id === r.id; })[0] || {}).h;
      if (!h) return;
      h.conds = h.conds || {};
      // Aid cast in the fight: the 8-bit game's own Aid, lifted at the next long rest (EV.longRest)
      if (r.maxhp > h.maxhp) { h.conds.aid = (h.conds.aid || 0) + r.maxhp - h.maxhp; h.maxhp = r.maxhp; }
      h.hp = Math.max(0, Math.min(h.maxhp, r.hp)); h.ko = h.hp <= 0;
      if (r.slots && h.slots) h.slots = h.slots.map(function (n, i) { return r.slots[i] == null ? n : Math.min(n, r.slots[i]); });
      if (r.feats && h.feats) Object.keys(h.feats).forEach(function (k) { if (typeof h.feats[k] === 'number' && typeof r.feats[k] === 'number') h.feats[k] = Math.min(h.feats[k], r.feats[k]); });
      if (r.mageArmor) h.conds.mageArmor = true; // cast in the fight: it holds till the long rest, as the 8-bit game's does
      else if (h.conds.mageArmor && r.equip && DS.R.armored(Object.assign({}, h, { equip: r.equip }))) delete h.conds.mageArmor; // (armour put on in the fight ends it)
      // EQUIP in the fight (a weapon drawn, a shield on or off) crosses back (RULED 09-28: "all changes in 16 should cross back to 8bit")
      if (r.equip && h.equip) ['weapon', 'shield', 'armor'].forEach(function (k) { if (k in r.equip) h.equip[k] = r.equip[k]; });
      // torchdark: the day's Darkvision and a Continual Flame stay on him; a torch still burning in his hand burns on into the map
      if (r.darkvision) h.conds.darkvision = true;
      if (r.continualFlame && !h.conds.continualFlame) h.conds.continualFlame = h.equip.weapon || true;
      if (r.torch && DS.EV.darkHere && DS.EV.darkHere()) { g.flags.torchBy = h.id; h.equip.torch = 1; }
      else if (g.flags.torchBy === h.id) { delete g.flags.torchBy; delete h.equip.torch; } // (dropped, thrown, put out or spent in the fight)
      if (!r.torch) delete h.equip.torch;
    });
    // the pack: what the fight used is gone (a potion drunk, a bolt loosed), never below none. The party fights with only
    // what it brought (no crossbow lent here, Griz 09-27)
    var i0 = d.inv0 || {}, i1 = d.inv1 || {};
    Object.keys(i0).forEach(function (id) { var used = i0[id] - (i1[id] || 0), have = g.count(id); if (used > 0 && have > 0) g.take(id, Math.min(used, have)); });
    Object.keys(i1).forEach(function (id) { var got = (i1[id] || 0) - (i0[id] || 0); if (got > 0) g.give(id, got); }); // (a weapon stowed in the fight is back in the pack)
    if (d.result === 'fled') DS.fledIds = (d.away || []).slice();
    if (d.result === 'yielded') DS.battleYielded = true; // (his words were on DEEP16's card; the scene asks what you do with him)
    return RESULT[d.result] || 'run';
  }
})();
