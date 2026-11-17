/* DEEP16 -- THE EYES ROWS WALKED (11-16 night, the lanes desk, on Griz: "like clicking the card loads me into the place where the stuff to look at is like now, but
   when I'm there I have step by step 'walk and look' locations that complete like Winters errand deliveries", then "2 - card takes you to place, you complete all the
   arrows, 50 xp and next card"; a row's steps since CLAUDE.md's close of c0a6b960: steps: [['<floor key>', x, y, '<what to look at>'], ...]).
   On a page Sylvia's bar is on (../../js/tour.js T.bar, &tour=<card>) and a floor in walk, a row with steps:
   - THE ARROW: Sylvia's blue arrow with an eye over the next step on this floor -- the next in the row's order that lies here -- held at the screen's edge, pointing,
     when it is off it (the pen's arrow's shape, js/hours.js), so it reads as an eyes thing and not the JOURNAL's gold pin.
   - SEEN: one of the party on its square or beside it (the floor's members, js/counter.js C.state's), and its words on a card; her bar counts the steps (T.walk).
   - EVERY STEP SEEN: 50 XP to each one standing, banked for the long rest as the true word's is (js/house.js H.bank), once a row on this browser; her card comes up
     with E: the next card (a note "(walked every step, no note)" -- his 11-13 rule's walked-past, so the fold cuts the row) or any answer as ever.
   Progress is per browser, as her deck is. Through her bar only: a player never meets it. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, T = DS && DS.TOUR, C = D && D.counter; if (!D || !T || !C || !C.paintPin || !T.walk) return;
  var EW = D.eyeswalk = {};
  EW.XP = 50;
  EW.BLUE = '#6fb7e0'; EW.DARK = '#0c1a24';
  // the row on her bar, when it has steps
  EW.row = function () { var b = T.bar, h = b && b.row && b.row(); return h && h.r && Array.isArray(h.r.steps) && h.r.steps.length ? h : null; };
  // where the party stands: the party's token where the floor walks one (a town and its rooms: js/town.js T.goIn moves the token, the members keep the street's squares --
  // his "broke when I entered a building"), else the members themselves
  function members(B) {
    var R0 = B && B.roam, t = R0 && R0.token; if (t && t.x != null) return [t];
    return ((R0 && R0.members) || []).filter(function (u) { return u && u.x != null && !u.dead && !(u.hp <= 0); });
  }
  EW.near = function (B, s) { return members(B).some(function (u) { return Math.max(Math.abs(u.x - s[1]), Math.abs(u.y - s[2])) <= 1; }); };
  // the step the arrow points at on this floor: the first not yet seen, in the row's order, that lies here
  EW.here = function (h, key) { var w = T.walk(h.id); for (var i = 0; i < h.r.steps.length; i++) if (w.done.indexOf(i) < 0 && h.r.steps[i][0] === key) return i; return -1; };
  // the XP seen paid (11-16 night, Griz: "is there any visual indication of the 50 xp award?", then "Yes, add it" to a gold float over the party): "+50 XP" floating up in
  // gold over the party -- its token where the floor walks one, else the first standing -- and a gold ring at their feet, as READY! does (js/battle.js readySpring)
  EW.float = function (B) {
    var R0 = B && B.roam, fu = R0 && R0.token && R0.token.x != null ? R0.token : members(B)[0]; EW.floated = null; if (!fu || !D.fx || !D.fx.float) return;
    try { var txt = '+' + EW.XP + ' XP'; D.fx.float(txt, fu, (D.PAL && D.PAL.ramps && D.PAL.ramps.gold && D.PAL.ramps.gold[4]) || '#ffd76a', true); if (D.fx.ring) D.fx.ring(fu, 'gold', 30); EW.floated = txt; } catch (e) { /* (no figure to float over) */ }
  };
  // BACK IN THE GAME (his "the 'leave' sylvias table didn't hand off or notice of xp and hand off back to the game i talked to her with"): her table's LEAVE takes up the game
  // that came to her booth (deep16/?resume=<slot>, js/main.js; deep16/js/swann.js), and the first thing on screen says what the cards earned it
  EW.welcome = function () {
    var e = T.walkTakeEarned ? T.walkTakeEarned() : null; EW.welcomed = e; if (!e) return null;
    var lines = ['{y}SYLVIA\'S CARDS{/}: ' + e.cards + ' card' + (e.cards === 1 ? '' : 's') + ' walked.', 'Each one standing gained ' + e.each + ' XP.'];
    setTimeout(function () { var s = D.top(); if (s && s.card) { s.card(lines, 360); if (D.sfx) D.sfx('chest'); } }, 700);
    return lines;
  };
  // a frame on the floor: a step reached is seen; the last one seen pays the XP and brings her card up
  EW.tick = function (B) {
    var h = EW.row(), def = D.roam && D.roam.def; if (!h || !def || !B) return null;
    var w = T.walk(h.id), steps = h.r.steps, hit = [];
    steps.forEach(function (s, i) { if (w.done.indexOf(i) < 0 && s[0] === def.key && EW.near(B, s)) { w.done.push(i); hit.push(s); } });
    if (!hit.length && !(w.done.length >= steps.length && !w.xp)) return null;
    var lines = hit.map(function (s) { return '{y}SEEN{/}: ' + s[3] + '.'; });
    if (w.done.length >= steps.length && !w.xp) {
      w.xp = true;
      // the XP to the game that came to her booth, written into that save and nothing else -- never to the card's own staged party (his "the only thing that should carry
      // back to the game for the player who enters via sylvia is the xp")
      var H = D.house, slot = T.walkFrom ? T.walkFrom() : null, rec = slot != null && H && H.read ? H.read(slot) : null, said = '';
      if (rec) {
        var standing = rec.party.filter(function (p) { return p.hp > 0 && !p.dead; }), bk = standing.length && H.bank ? H.bank(EW.XP * standing.length, standing) : null;
        if (bk) { D.store.set(H.key(slot), rec); said = String(bk.line || '').replace(/\.?$/, '') + ' in your game.'; EW.paid = { slot: slot, each: bk.each }; EW.float(B); if (T.walkEarn) T.walkEarn(bk.each); }
      } else said = '{g}(No game came to her booth: the XP goes to one that does.){/}';
      lines.push('{y}EVERY STEP SEEN.{/} ' + said);
      if (D.sfx) D.sfx('chest');
    } else if (D.sfx) D.sfx('confirm');
    T.walkPut(h.id, w);
    if (B.card) B.card(lines, 240);
    if (w.xp && T.walked) T.walked();
    return { seen: hit.length, done: w.done.length, of: steps.length, xp: !!w.xp };
  };
  function arrow(ctx, B, x, y) {
    var iso = D.iso, c = iso.center(x, y, (B.map && B.map.gz ? B.map.gz(x, y) : 0) + 30), p = iso.toScreen(c.x, c.y);
    var m = 14, sx = Math.max(m, Math.min(D.W - m, p.x)), sy = Math.max(m + 26, Math.min(D.H - 40, p.y)), off = sx !== p.x || sy !== p.y, bob = Math.sin(B.t / 10) * 2;
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy + (off ? 0 : bob))); if (off) ctx.rotate(Math.atan2(p.y - sy, p.x - sx) - Math.PI / 2);
    ctx.fillStyle = EW.DARK; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = EW.BLUE; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
    if (!off && D.icon) { try { ctx.drawImage(D.icon('eye'), -6, -22, 12, 12); } catch (e) { /* (no glyph: the arrow alone) */ } }
    ctx.restore();
    EW.marked = [x, y];
  }
  // THE CARD IN THE JOURNAL (his "can we put it in the journal with what the next thing we're looking at visible as the current step of the mission?"): while her bar is on
  // a row with steps, SYLVIA'S CARD heads the JOURNAL's missions -- the card's headline, its current step the next thing to look at (where, and which of how many); every
  // step seen, done. Nothing is written to the save: it is there while the card is.
  EW.where = function (s) { return s[3] + ' -- ' + (s[0] === 'room' ? 'inside' : s[0]) + ', ' + s[1] + ',' + s[2]; };
  var q0 = C.quests;
  C.quests = function (st) {
    var out = q0.apply(this, arguments), h = EW.row(); if (!h) return out;
    var w = T.walk(h.id), steps = h.r.steps, i = -1; for (var k = 0; k < steps.length; k++) if (w.done.indexOf(k) < 0) { i = k; break; }
    var s = i >= 0 ? steps[i] : null, step = s ? { where: EW.where(s) + ' (step ' + (i + 1) + ' of ' + steps.length + ')', eyes: true } : null;
    return [{ id: 'swanncard', name: 'SYLVIA\'S CARD', text: T.head(h.r), doneText: 'Every step seen.' + (T.walkFrom() != null ? ' 50 XP to each one standing in your game.' : ''), done: !!w.xp, where: step && step.where, step: step }].concat(out);
  };
  var pp0 = C.paintPin;
  C.paintPin = function (ctx, B) {
    pp0.apply(this, arguments);
    EW.marked = null;
    var R0 = B && B.roam, def = D.roam && D.roam.def; if (!R0 || !def || B.menu || R0.mode !== 'walk' || !EW.row()) return;
    EW.tick(B);
    var h = EW.row(), i = h ? EW.here(h, def.key) : -1; if (i < 0) return;
    var s = h.r.steps[i]; arrow(ctx, B, s[1], s[2]);
  };
})();
