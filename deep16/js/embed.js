/* DEEP16 — a fight inside the 8-bit game (?embed). The 8-bit page lays this page over its own canvas in an iframe
   (js/embed.js there) and the two talk by postMessage: this page says 'd16:ready' once it has loaded, the 8-bit page
   answers with the fight and the party as they stand ('ds8:fight'), and when the fight is over this page sends back what
   it did ('d16:done'). RULED 09-27 (Griz): the ettercap is replaced outright, and "what is spent in the fight gone on
   return to 8-bit": HP, slots, uses, potions and bolts. DEEP16 still writes no 8-bit save; the 8-bit page applies the
   result to its own party, and the save changes when the player saves. */
'use strict';
(function () {
  var D = window.D16, E = D.embed = { on: /[?&]embed\b/.test(location.search) };
  // (10-03, the review's floor under the player: a d16:crash goes up once, and never after the fight's own end -- d16:done or d16:refuse. Those two are not held to once:
  // the benches call E.done again and again on one page, and in play each fight is a page of its own)
  var ended = false;
  function send(m) {
    if (m.type === 'd16:crash' && ended) return;
    if (m.type === 'd16:done' || m.type === 'd16:refuse' || m.type === 'd16:crash') ended = true;
    if (window.parent && window.parent !== window) window.parent.postMessage(m, '*');
  }
  function counts(inv) { var c = {}; (inv || []).forEach(function (s) { c[s.id] = (c[s.id] || 0) + s.n; }); return c; }
  // where a throw came from, "file.js:line", when the browser says: an error event carries it, a rejection's stack has it (the ?v= stamp and the path cut)
  function whereFrom(file, line, stack) {
    var m = file ? [0, file, line] : /([\w.-]+\.js)(?:\?[^:\s)]*)?:(\d+)/.exec(String(stack || ''));
    return m ? String(m[1]).split('?')[0].split('/').pop() + ':' + m[2] : null;
  }
  // (an uncaught error or rejection on the grid kills the fight's generator and leaves the player in a fight that cannot end, the 8-bit game held under it: say so
  // to the 8-bit page, which takes the fight itself -- js/embed.js; the first one only. Resource errors do not bubble to the window, so a sheet that fails to load is no crash)
  function crashed(msg, at) { var m = { type: 'd16:crash', msg: String(msg || 'unknown error').slice(0, 300), at: at }; if (!ended) E.crashed = m; send(m); } // (E.crashed: what a probe reads)
  // a throw while the screen is painted is not a fight that cannot go on: the fight's own turn (D.update) is whole, a sprite or a tooltip broke. One bad frame is
  // logged and the fight plays on; only a draw that keeps throwing -- half a second of frames, the piece after it never painted (the command ring, as often as
  // not) -- goes to the 8-bit game as a crash. A throw in the fight's turn still goes at once (the window's error, above). (10-03, Griz: "yes, build it")
  E.DRAW_BAD = 30; // (frames in a row: half a second at 60)
  function guardDraw() {
    var draw0 = D.draw, bad = 0;
    D.draw = function () {
      try { draw0.apply(this, arguments); bad = 0; }
      catch (e) {
        var c = D.ctx; if (c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } // (whatever the broken piece left set, so the next frame paints true)
        if (++bad === 1) console.error('DEEP16: a frame failed to paint (the fight plays on)', e);
        if (bad === E.DRAW_BAD) crashed('the screen would not paint: ' + (e && e.message || e), whereFrom(null, null, e && e.stack));
      }
    };
  }

  E.boot = function () {
    guardDraw(); // (at boot: every script has loaded, so this is the outermost D.draw)
    window.addEventListener('error', function (e) { crashed(e.message || (e.error && e.error.message), whereFrom(e.filename, e.lineno, e.error && e.error.stack)); });
    window.addEventListener('unhandledrejection', function (e) { var r = e.reason; crashed(r && r.message ? r.message : r, whereFrom(null, null, r && r.stack)); });
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
    // the play record inside the 8-bit game too (10-05 night, Griz: "1 yeah sounds good" -- the Skylights he played there, Pyro missing, left no record): the frame is the
    // 8-bit page's own origin, so its fights keep in the same deep16.plays as the doors' and R on the tester ladder saves them (js/record.js; at the enter D.push makes)
    var fd8 = m.fight && D.FIGHTS.filter(function (f) { return f.id === m.fight; })[0], lv8 = 0;
    try { ((m.save && m.save.party) || []).forEach(function (h) { lv8 = Math.max(lv8, +(h && (h.lvl || h.level)) || 0); }); } catch (e) { lv8 = 0; } // (the units are dealt at the enter: the level from the save the 8-bit sent)
    B.o.record = { fight: m.fight || 'embed', name: (fd8 ? fd8.name : 'The 8-bit: ' + ((list || []).join(', ') || 'a fight')) + ' (inside the 8-bit)', level: lv8 || null };
    D.push(B);
    E.inv0 = counts(B.inv); // (the pack as the fight began: only what the party brought, no loan here)
    if (B.lampReturned) E.inv0[B.lampReturned] = Math.max(0, (E.inv0[B.lampReturned] || 0) - 1); // (a lantern nobody could take up went into the pack: the 8-bit game's pack does not have it yet, so the seam hands it over as a gain)
    D.canvas.focus();
  };
  // the 8-bit square the party walked off a grid at, where the grid is an 8-bit map turned or framed (its `to8`): the one who left by a way out. The Wet sets its own
  // (js/wet.js W.exitOf); the Keeper's stair since 10-06 (data/maps.js floodstair `to8` -- the grid's rules §2b.18, his note on ?at=stair: "Returns me to where I spawned in
  // (rather than the 8bit version of the exit square)"). The 8-bit page lands the party there before its ending runs (js/embed.js there, EV.wetLand: the stair's map, warrens_d)
  E.exit8 = function (B, res) {
    var to8 = B.map && B.map.def && B.map.def.to8; if (!to8 || res !== 'escaped') return null;
    var w = B.units.filter(function (u) { return u.side === 'party' && u.left && !u.summon && !u.familiar && B.onExit(u); })[0];
    return w ? to8(w.x, w.y) : null;
  };
  E.done = function (B, res) {
    var foes = B.units.filter(function (u) { return ((u.side === 'foe' && !(u.dominated && u.dominated.side0 === 'party')) || (u.dominated && u.dominated.side0 === 'foe')) && !u.summon && !u.loose; }); // (a beast dominated for a while is still the 8-bit's foe)
    send({
      type: 'd16:done', result: res || 'escaped',
      party: B.units.concat(B.reserve || [], B.stayed || []).filter(function (u) { return ((u.side === 'party' && !u.dominated) || (u.dominated && u.dominated.side0 === 'party')) && !u.summon && !u.loose; }).map(function (u) { // (one of ours dominated when it ended -- Dominate Person -- comes home as ours, 10-06) // (reserve: still in the inn when it ended; a summoned creature is the fight's alone)
        // (the bat-wing pie's +5 is the fight's alone, as the 8-bit battle's finish() takes it back: never read there as Aid)
        var mx = u.maxhp - (u.fortified ? 5 : 0);
        // (drained: max HP the herd took, for good -- js/wet.js. 09-30d: its note sat mid-line from 09-30b and cut slots, feats, mageArmor and left out of every report)
        return { id: u.id, guest: !!u.guest, hp: Math.max(0, Math.min(u.hp, mx)), maxhp: mx, drained: u.drained || 0, slots: (u.slots || []).slice(), feats: u.feats || {}, mageArmor: !!u.conds.mageArmor, left: !!u.left,
          equip: u.src && u.src.equip ? JSON.parse(JSON.stringify(u.src.equip)) : null, // (EQUIP in the fight crosses back: RULED 09-28)
          // torchdark (09-28): the day's Darkvision and a Continual Flame stay on him; a torch still burning in his hand walks out with him
          darkvision: !!u.conds.darkvision, continualFlame: !!(u.conds.continualFlame || (u.src && u.src.conds && u.src.conds.continualFlame)), torch: u.torch && u.torch.lit && u.hp > 0 ? (u.torch.kind === 'lantern' ? (u.torch.item || 'lantern') : 'torch') : false }; // (09-29: which light, so the field keeps a lantern as a lantern; 09-30: the Ledger-Lamp goes back as 'ledgerlamp', its pack id)
      }),
      // the rest came out of the inn (the lone investigator's fight, Battle.joinReserve): the 8-bit battle's `solo` is over, and its
      // XP is split among everyone standing (review 09-28 #2)
      joined: !!(B.o.embed && B.o.embed.solo) && !(B.reserve || []).length,
      roost: B.roostBroken || null, // (bright light under the roost: the 8-bit's RoostFail runs on it)
      foes: foes.map(function (u) { return { id: u.id, kind: u.kind, i8: u.i8, dead: u.hp <= 0, fled: !!u.fled }; }), // (i8: its place in the 8-bit list)
      // who is still out there when the fight ends because one got away (fight.fledEnds: the 8-bit wagon yard): the chase's
      away: foes.filter(function (u) { return u.flees && u.hp > 0; }).map(function (u) { return u.kind; }),
      inv0: E.inv0, inv1: (function () { // (a lantern or the Ledger-Lamp set down and left burning -- or dropped where its bearer fell -- is taken up as the fight ends: back in the pack, never lost)
        var c = counts(B.inv); (B.lights || []).forEach(function (l) { if (l.kind === 'lantern' && l.item) c[l.item] = (c[l.item] || 0) + 1; }); return c;
      })(),
      // the 8-bit flags the fight set (B.flags8: the Settling's dead and fed, 09-30), and Pyro's measure of the party (js/pyro.js:
      // the phase he reached, and whether he went down -- the 8-bit side takes the XP or loads the save)
      flags: B.flags8 || null, pyro: B.pyro || null,
      enemies8: B.enemies8 || null, // (the Settling: the 8-bit foes it killed, for the ending's XP -- js/wet.js)
      exit8: B.exit8 || E.exit8(B, res) || null, // (the Settling: the 8-bit square the party walked off the grid at -- js/wet.js W.exitOf, 09-30d; the Keeper's stair, E.exit8 above)
      // the wizard's familiar (Find Familiar): gone if it fell, else what it has left (a dismissed one is safe)
      familiar: (function () { var f = B.units.filter(function (u) { return u.familiar; })[0]; return f ? { gone: f.hp <= 0, hp: Math.max(0, f.hp) } : null; })()
    });
  };
})();
