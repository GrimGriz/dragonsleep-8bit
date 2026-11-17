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
  function members(B) { return ((B && B.roam && B.roam.members) || []).filter(function (u) { return u && u.x != null && !u.dead && !(u.hp <= 0); }); }
  EW.near = function (B, s) { return members(B).some(function (u) { return Math.max(Math.abs(u.x - s[1]), Math.abs(u.y - s[2])) <= 1; }); };
  // the step the arrow points at on this floor: the first not yet seen, in the row's order, that lies here
  EW.here = function (h, key) { var w = T.walk(h.id); for (var i = 0; i < h.r.steps.length; i++) if (w.done.indexOf(i) < 0 && h.r.steps[i][0] === key) return i; return -1; };
  // a frame on the floor: a step reached is seen; the last one seen pays the XP and brings her card up
  EW.tick = function (B) {
    var h = EW.row(), def = D.roam && D.roam.def; if (!h || !def || !B) return null;
    var w = T.walk(h.id), steps = h.r.steps, hit = [];
    steps.forEach(function (s, i) { if (w.done.indexOf(i) < 0 && s[0] === def.key && EW.near(B, s)) { w.done.push(i); hit.push(s); } });
    if (!hit.length && !(w.done.length >= steps.length && !w.xp)) return null;
    var lines = hit.map(function (s) { return '{y}SEEN{/}: ' + s[3] + '.'; });
    if (w.done.length >= steps.length && !w.xp) {
      w.xp = true;
      var st = C.state(B), standing = st ? st.party.filter(function (p) { return p.hp > 0 && !p.dead; }) : [], H = D.house;
      var bk = standing.length && H && H.bank ? H.bank(EW.XP * standing.length, standing) : null;
      lines.push('{y}EVERY STEP SEEN.{/} ' + (bk && bk.line ? String(bk.line).replace(/\.?$/, '.') : ''));
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
