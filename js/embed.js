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

  // (10-03, the review's floor under the player: how long the 8-bit page waits for DEEP16 to say d16:ready before it takes the fight itself; a probe sets it small)
  if (DS.d16ReadyMs == null) DS.d16ReadyMs = 30000;
  // what the player is told when the grid fails and the 8-bit battle takes over (said over the field, before the battle comes up)
  var FALTERED = 'The grid faltered. The fight goes on here.';
  // the wet's three that stay dead once killed (deep16/js/wet.js FLAG8): killed in the 8-bit battle a wet fight fell back to, they are as dead as the grid
  // makes them, and their spots on the 8-bit map stop calling them up (10-03, Griz: "if for some reason the game starts crashing, they should be able to
  // finish off those 3 monsters in 8bit"). The southern ooze is the 8-bit's own fight, never a wet one, and is not counted
  var WET_DEAD = { otyugh: 'otyughDead', ochrejelly: 'jellyDead', grayooze: 'poolOozeDead' };

  function deep(o) {
    return {
      start: function (script) {
        var self = this, prevSong = DS.audio.songId;
        DS.audio.sfx('encounter');
        DS.push(new DS.EncounterFlash(function () {
          open(o, function (d) {
            if (d.type === 'd16:refuse' || d.type === 'd16:crash') { // (no sheet on the grid for one of these, or the grid threw or never came up: the 8-bit battle, as ever)
              var crashed = d.type === 'd16:crash';
              // (the report was never applied, so the party is as it walked in. DS.lastD16Crash is for probes: never in DS.G, never in the save)
              if (crashed) { console.warn('DEEP16 crashed in ' + o.deep16 + ' (' + d.msg + (d.at ? ' at ' + d.at : '') + '): fought in the 8-bit game'); DS.lastD16Crash = { fight: o.deep16, msg: d.msg, at: d.at }; }
              else console.warn('DEEP16 refused ' + o.deep16 + ' (' + (d.missing || []).join(', ') + '): fought in the 8-bit game');
              var b8 = new DS.Battle(o);
              b8.onClose = function (r) {
                if (o.deep16 === 'wet') b8.foes.forEach(function (f) { if (f.dead && !f.fled && WET_DEAD[f.id]) DS.G.flags[WET_DEAD[f.id]] = 1; });
                self.finished = true; self.result = r; if (o.after !== false && r !== 'lose' || o.lossOk) DS.audio.play(o.returnSong || prevSong, true); setTimeout(function () { script.resume(self, r); }, 0); };
              if (crashed) DS.run(function* () { yield DS.say(FALTERED); DS.push(b8); }); else DS.push(b8);
              return;
            }
            var res = apply(d);
            // (the Settling: up on the 8-bit square the one who walked off the grid left it by, before the ending runs -- js/events.js EV.wetLand, 09-30e)
            if (res !== 'lose' && DS.wetExit && DS.EV.wetLand) DS.EV.wetLand(DS.wetExit);
            // the rest of the party came out of the inn during the fight: no longer a lone fighter's battle, so the XP is split
            // among everyone standing, as the 8-bit's own joinParty leaves it (review 09-28 #2)
            if (d.joined && o.solo != null) o.solo = null;
            // (the light as the grid left it, not as the field had it: a lantern or the Ledger-Lamp put out or set down on the grid is in the pack, and the
            // 8-bit battle's own ending must not light a phantom torch for the one who walked in holding it -- 09-30)
            o.torch = DS.G.flags.torchBy || null; delete o.torchKind;
            // (the Settling, 09-30: the wet's grid holds more than the 8-bit scene sent -- the ending counts what it killed there)
            var b = new DS.Battle(d.enemies8 && d.enemies8.length ? Object.assign({}, o, { enemies: d.enemies8 }) : o);
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
    var g = DS.G, fr = document.createElement('iframe'), closed = false, readyTimer = null, readyMs = DS.d16ReadyMs != null ? DS.d16ReadyMs : 30000;
    // the grid is gone, whichever way: its own word (done, refuse, crash) or the timer below. Once only; the 8-bit game wakes, the listener and the timer go
    function close(m) {
      if (closed) return; closed = true;
      clearTimeout(readyTimer);
      window.removeEventListener('message', onMsg);
      if (fr.parentNode) fr.parentNode.removeChild(fr);
      DS.paused = false; DS.input.flush();
      if (DS.canvas) DS.canvas.focus();
      done(m);
    }
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
      if (m.type === 'd16:ready') clearTimeout(readyTimer); // (it came up: from here the grid answers for itself, by done, refuse or crash)
      if (m.type === 'd16:ready') fr.contentWindow.postMessage({ type: 'ds8:fight', fight: o.deep16, save: snap, opts: {
        canRun: o.canRun !== false, solo: solo, join: o.join || 0, only: o.deep16Only || null, enemies: o.enemies || null,
        at: o.at || null, wake: o.wake || null, // (the Settling: the lead's square, the trigger that fired -- deep16/js/wet.js)
        start: o.start || null, // (the way in by name: the Flooded Stair's 'ledge' (WADE IN) or 'rune' (a hand on the mark) -- js/events.js S.stair, S.mark; deep16/js/battle.js Battle.enter, 10-03)
        harness: o.harness || null, milker: o.milker || null, touched: !!o.touched, // (the deep rate roused: the cradle's square, who milked, whether the touch took -- 09-30g)
        surprised: o.surprised || null, revealed: !!o.revealed || seer, yieldText: o.yieldText || null,
        dark: dark, torch: o.torch || g.flags.torchBy || null, torchKind: g.flags.torchKind || 'torch' } }, '*');
      if (m.type === 'd16:done' || m.type === 'd16:refuse' || m.type === 'd16:crash') close(m);
    }
    window.addEventListener('message', onMsg);
    DS.audio.stop();
    fr.id = 'd16'; fr.title = 'DEEP16'; fr.allow = 'gamepad'; fr.src = 'deep16/index.html?embed' + (/[?&]nolog\b/.test(location.search) ? '&nolog' : /[?&]log\b/.test(location.search) ? '&log' : ''); // (the game pad reaches the fight: js/pad.js)
    fr.onload = function () { try { fr.contentWindow.focus(); } catch (e) { } };
    document.body.appendChild(fr);
    DS.paused = true;
    // (no d16:ready in time -- the page did not load, a script threw before it could say so: the same end as a crash, and the 8-bit game takes the fight)
    readyTimer = setTimeout(function () { close({ type: 'd16:crash', msg: 'no ready in ' + readyMs + 'ms' }); }, readyMs);
  }

  // what the fight did, onto the party: what was spent stays spent (no slot, use or potion comes back that the fight took)
  function apply(d) {
    var g = DS.G, all = g.party.map(function (h) { return { id: h.id, h: h }; }).concat(g.guests || []); // (a guest by its key)
    (d.party || []).forEach(function (r) {
      var h = (all.filter(function (x) { return x.id === r.id; })[0] || {}).h;
      if (!h) return;
      h.conds = h.conds || {};
      // Aid cast in the fight: the 8-bit game's own Aid, lifted at the next long rest (EV.longRest)
      if (r.drained) h.maxhp = Math.max(1, h.maxhp - r.drained); // (the Settling: the crawlers fed on him while he was down -- max HP, for good, 09-30b; the grid's maxhp is already the less)
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
      // (r.torch is 'torch', 'lantern' or a hooded light's pack id -- the Ledger-Lamp's 'ledgerlamp', 09-30 -- or false; the hooded ones are never spent)
      var lk = DS.R.hooded(r.torch) ? r.torch : (r.torch ? 'torch' : false), hoodedLit = lk && lk !== 'torch';
      // (a lantern or the lamp still lit in his hand stays there, dark here or not: it sticks -- RULED 09-30d)
      if (r.torch && (hoodedLit || (DS.EV.darkHere && DS.EV.darkHere()))) { g.flags.torchBy = h.id; g.flags.torchKind = lk; h.equip.torch = 1; }
      else if (g.flags.torchBy === h.id) { delete g.flags.torchBy; delete g.flags.torchKind; delete h.equip.torch; if (hoodedLit) g.give(lk, 1); } // (dropped, thrown, put out or spent in the fight: a torch is done)
      else if (hoodedLit) g.give(lk, 1);
      if (!r.torch) delete h.equip.torch;
    });
    // the wizard's familiar (Find Familiar, js/familiar.js): fallen on the grid, it is gone till the ritual calls it back
    if (d.familiar && g.flags.familiar) { if (d.familiar.gone) { g.flags.familiarGone = g.flags.familiar.kind; delete g.flags.familiar; } else g.flags.familiar.hp = d.familiar.hp; }
    // the pack: what the fight used is gone (a potion drunk, a bolt loosed), never below none. The party fights with only
    // what it brought (no crossbow lent here, Griz 09-27)
    var i0 = d.inv0 || {}, i1 = d.inv1 || {};
    Object.keys(i0).forEach(function (id) { var used = i0[id] - (i1[id] || 0), have = g.count(id); if (used > 0 && have > 0) g.take(id, Math.min(used, have)); });
    Object.keys(i1).forEach(function (id) { var got = (i1[id] || 0) - (i0[id] || 0); if (got > 0) g.give(id, got); }); // (a weapon stowed in the fight is back in the pack)
    // the flags the fight set (the Settling's, 09-30), and Pyro's measure (js/pyro.js reads DS.pyroBack as the 8-bit battle ends)
    if (d.flags) Object.keys(d.flags).forEach(function (k) { g.flags[k] = d.flags[k]; });
    DS.pyroBack = d.pyro || null;
    DS.wetExit = d.exit8 || null; // (the Settling's way out: the 8-bit square the party walked off the grid at -- EV.wetOut, 09-30d)
    if (d.result === 'fled') DS.fledIds = (d.away || []).slice();
    if (d.result === 'yielded') DS.battleYielded = true; // (his words were on DEEP16's card; the scene asks what you do with him)
    return RESULT[d.result] || 'run';
  }
})();
