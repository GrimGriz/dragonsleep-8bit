/* THE SNOOT -- the show (10-14 night, the Snoot mode seat). His notes after his first play: "isometric - animated combat" and "the
   resolution should be a show"; RULED the same night on the seat's three leans ("sounds great"): each fight zooms into a small isometric
   patch of its hex's ground, DEEP16-style -- the formations face off, the figures swing their attack rows, the dice tumble on screen, the
   killed fall, the morale result goes up as a banner, witnesses run across to the winner -- and back to the map, which stays flat; every
   fight gets the show, about five seconds; SPACE skips a fight, Esc the rest of the day.
   The show plays the engine's beats (js/rules.js SN.beat: the fight as it began, the shock, the Fantasy table, the fire ball, every unit's
   dice, the casualties, the morale, who fell back, the witness, instability, nightfall, the grid's result, the head) -- nothing is rolled
   here; the dice on screen are the day's own. A scene is a pure function of its time (SN.Show.scene), so a skip is a jump to the end, and
   the probe draws it at any moment headless. The figures are DEEP16's sheets by their own frame maps, as js/view.js draws them. */
'use strict';
(function () {
  var SN = window.SN, SH = SN.Show = {}, imgs = {};
  var W0 = 960, H0 = 540, CX = 480, GY = 330; // (the scene's own size; the canvas scales it to the map's place)
  var SIDE = { ours: '#3aa38e', gnoll: '#d0623c', dominion: '#9a6ad6' };
  var GROUND = { '.': ['#7a8a48', '#71803f'], v: ['#8c9a50', '#829048'], h: ['#8a6a40', '#7c5e38'], g: ['#6c5838', '#62502f'], P: ['#6a5a46', '#5e4f3d'], i: ['#7a8a48', '#71803f'], m: ['#8a6a40', '#7c5e38'], s: ['#8a6a40', '#7c5e38'], l: ['#8a6a40', '#7c5e38'], w: ['#7a8a48', '#71803f'] };
  // how long each beat holds the screen, in seconds; a round's dice roll together (CHAINMAIL's melee is simultaneous, p.14), as do its casualties,
  // its fire balls and its duels -- one beat each -- and a later round goes quicker: about five seconds a fight (RULED 10-14 night)
  var DUR = { fight: 0.9, round: 0.3, shock: 1.0, ft: 0.9, fb: 0.75, atk: 1.2, cas: 0.6, herofall: 0.6, gone: 0.6, mor: 0.95, fall: 0.6, surrender: 0.6, wit: 1.1, inst: 0.8, grid: 1.2, night: 1.0, head: 3.4 };
  // a family plays as one beat: every band's shock with its falling back; the round's casualties with who fell and who is gone; the falls
  // after nightfall with the night; a run of instability rolls
  var FAM = { atk: 'atk', cas: 'toll', gone: 'toll', herofall: 'toll', surrender: 'toll', fb: 'fb', ft: 'ft', shock: 'shock', fall: 'fall', inst: 'inst', night: 'night' };
  var JOIN = { shock: { fall: 1 }, night: { fall: 1 }, toll: { fall: 1 } }, QUICK = { atk: 1, cas: 1, gone: 1, herofall: 1, mor: 1, ft: 1, round: 1 };

  // ---------------------------------------------------------------- the sheets
  function sheet(name) {
    var sh = window.D16 && window.D16.SHEETS && window.D16.SHEETS[name]; if (!sh) return null;
    var im = imgs[name]; if (!im) { im = imgs[name] = new Image(); im.src = (SN.DEEP16 || '../deep16/') + sh.image; }
    return im.complete && im.naturalWidth ? { sh: sh, im: im } : null;
  }
  // one figure at its foot: anim ('idle', 'walk', 'attack', 'hurt', 'prone'), facing (S SW W NW N NE E SE: 0..7), k the scale, f the time in s
  function figure(cx, name, anim, facing, x, y, k, f, once, alpha) {
    var S = sheet(name); if (!S) return;
    var sh = S.sh, a = sh.anims[anim] || sh.anims.idle || sh.anims[Object.keys(sh.anims)[0]];
    var fw = a.fw || sh.fw, fh = a.fh || sh.fh, ax = a.ax != null ? a.ax : sh.ax, ay = a.ay != null ? a.ay : sh.ay, n = a.frames || 1;
    var fr = Math.floor(f * (a.fps || 8)); fr = once ? Math.min(n - 1, fr) : fr % n;
    var sy = (a.y != null ? a.y : (a.row || 0) * sh.fh) + (facing % 8) * fh;
    if (alpha != null) cx.globalAlpha = Math.max(0, Math.min(1, alpha));
    cx.drawImage(S.im, fr * fw, sy, fw, fh, Math.round(x - ax * k), Math.round(y - ay * k), Math.round(fw * k), Math.round(fh * k));
    cx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the beats into a timeline
  // a show for st.beats[from..to): if it does not open on its fight (the part after the grid), the fight it belongs to is found before it and
  // replayed at once, so the scene opens as the field stood
  SH.build = function (st, from, to, at) {
    var B = st.beats || [], start = from;
    if (B[from] && B[from].t !== 'fight' && B[from].t !== 'head') { for (var i = from - 1; i >= 0; i--) { if (B[i].t === 'fight' && (!at || SN.same(B[i].at, at))) { start = i; break; } if (B[i].day !== st.day) break; } }
    var segs = [], t = 0, round = 0, skipTo = 0;
    for (var j = start; j < to; j++) {
      var b = B[j]; if (!b) continue;
      if (b.t === 'round') round = b.n;
      var list = [b], fam = FAM[b.t];
      while (fam && j + 1 < to && B[j + 1] && (FAM[B[j + 1].t] === fam || (JOIN[fam] && JOIN[fam][B[j + 1].t]))) { j++; list.push(B[j]); } // (a family: one beat)
      var d = (DUR[b.t] || 0.6) * (round >= 2 && QUICK[b.t] ? 0.5 : 1);
      if (b.t === 'mor' && b.how === 'continue' && round >= 2) d = 0.45;
      if (b.t === 'round' && b.n === 1) d = 0;
      if (b.t === 'head' && b.around) d = 1.8; // (the grid has shown it: a banner only)
      segs.push({ b: b, list: list, t0: t, d: d }); t += d;
      if (j >= from - 1 && start < from && !skipTo && j < from) skipTo = t;
    }
    return { segs: segs, total: t, startT: start < from ? skipTo : 0, first: B[start] };
  };

  // ---------------------------------------------------------------- the scene at a moment: who stands where, how many, what is on screen
  SH.scene = function (show, t) {
    var first = show.first, sc = { units: {}, order: { ours: [], theirs: [] }, ter: '.', road: false, place: '', banner: null, dice: [], fx: [], runners: [], dark: 0, head: null, t: t };
    if (first && first.t === 'fight') {
      sc.ter = first.ter; sc.road = first.road; sc.place = first.place;
      ['ours', 'theirs'].forEach(function (k) {
        first[k].forEach(function (u) { sc.units[u.id] = { u: u, k: k, figs: u.figs, heroes: u.heroes.map(function (h) { return { name: h.name, type: h.type, dead: false }; }), off: 0, alpha: 1, anim: null, gone: false, hurt: 0 }; sc.order[k].push(u.id); });
      });
    }
    show.segs.forEach(function (s) {
      if (t < s.t0) return;
      var p = s.d ? Math.min(1, (t - s.t0) / s.d) : 1, now = t < s.t0 + s.d, local = t - s.t0;
      s.list.forEach(function (b) { one(b, p, now, local); });
    });
    function one(b, p, now, local) {
      var U = sc.units[b.u];
      switch (b.t) {
        case 'fight': if (now) sc.banner = { big: 'A FIGHT AT ' + String(b.place).toUpperCase(), small: 'Day ' + b.day, p: p }; sc.enter = 1 - p; break;
        case 'round': if (now) sc.banner = { big: 'ROUND ' + b.n, small: '', p: p, quick: true }; break;
        case 'shock': if (now) { sc.dice.push({ side: U ? U.k : 'theirs', u: b.u, dice: b.dice, need: b.need, sum: true, p: p, word: b.ok ? 'THEY STAND' : 'THEY SHY FROM ' + String(b.byName).toUpperCase() }); if (U) U.shake = 1 - p; } break;
        case 'ft': if (now) { var A = sc.units[b.a]; sc.dice.push({ side: A ? A.k : 'ours', u: b.a, dice: b.dice, need: b.need, mod: b.mod, sum: true, p: p, word: { kill: b.bh + ' IS KILLED', back: b.bh + ' FALLS BACK', none: 'NO EFFECT', beaten: 'THE MIRROR TAKES HIM', spared: 'BEATEN BACK -- HE IS THE HARBINGER\'S' }[b.res], title: b.ah + ' against ' + b.bh }); if (A) A.anim = 'attack', A.animT = local; }
          if (b.res === 'kill' && p >= 1) { var Bt = sc.units[b.b]; if (Bt) Bt.heroes.forEach(function (h) { if (h.name === b.bh) h.dead = true; }); } break;
        case 'fb': if (now) { var tg = sc.units[b.tg]; sc.fx.push({ kind: 'fire', u: b.tg, p: p }); if (tg) tg.hurt = 1 - p; sc.banner = { big: 'A FIRE BALL', small: b.w + ': ' + b.n + (b.n > 1 ? ' figures burn' : ' figure burns'), p: p, quick: true }; } break;
        case 'atk': if (now) { if (U) { U.anim = 'attack'; U.animT = local; } sc.dice.push({ side: U ? U.k : 'ours', u: b.u, dice: b.dice, need: b.need, k: b.k, p: p, title: (U ? (U.u.party ? 'the four' : U.u.name) : '') + (b.volley ? ', a volley' : b.imp ? ', charging (+1 die a figure)' : '') + ': ' + b.cls + ' v ' + b.dcls + ', ' + b.need + '+ kills' }); } break;
        case 'cas': if (U) { if (now) { U.hurt = 1 - p; sc.fx.push({ kind: 'minus', u: b.u, n: b.n, p: p }); } if (p >= 1 || !now) U.figs = b.figs; } break;
        case 'herofall': if (U) { if (now) sc.fx.push({ kind: 'word', u: b.u, text: b.name + ' falls', p: p }); if (p >= 1) U.heroes.forEach(function (h) { if (h.name === b.name) h.dead = true; }); } break;
        case 'gone': if (U) { U.alpha = 1 - p; if (p >= 1) U.gone = true; } break;
        case 'mor': if (now) sc.banner = { big: { 'continue': 'THE MELEE GOES ON', backoff: 'THEY BACK OFF', back: 'THEY FALL BACK', retreat: 'THEY RETREAT', rout: 'ROUT!', surrender: 'THEY SURRENDER' }[b.how] + (b.how === 'continue' ? '' : b.lo === 'ours' ? ' (OURS)' : ''), small: 'Morale: ours ' + b.sA + ' -- theirs ' + b.sB + (b.never ? ' (they never check)' : ''), p: p }; break;
        case 'fall': if (U) { var dir = U.k === 'ours' ? -1 : 1, far = b.how === 'rout' ? 520 : 380; U.off = dir * far * p; U.anim = 'walk'; U.animT = local; U.alpha = 1 - Math.max(0, p - 0.5) * 2; U.facing = U.k === 'ours' ? 2 : 6; if (p >= 1) U.gone = true; if (now && b.how === 'rout') sc.fx.push({ kind: 'word', u: b.u, text: 'ROUT', p: p }); } break;
        case 'surrender': if (U) { if (now) sc.fx.push({ kind: 'word', u: b.u, text: 'TAKEN PRISONER', p: p }); U.alpha = 1 - p; if (p >= 1) U.gone = true; } break;
        case 'wit': var W = sc.units[b.to]; if (now) { sc.runners.push({ to: b.to, n: b.n, sheets: b.sheets, p: p }); sc.banner = { big: 'WITNESS', small: b.fromName + ' saw it: ' + b.n + (b.n > 1 ? ' figures go' : ' figure goes') + ' over to the winner', p: p }; } if (W && (p >= 1 || !now)) W.figs += b.n; break;
        case 'inst': if (now) sc.dice.push({ side: U ? U.k : 'theirs', u: b.u, dice: b.dice, need: b.need, sum: true, p: p, word: b.ok ? 'THEY HOLD TOGETHER' : 'THEY BREAK APART', title: 'Lost too many: two dice to stay' }); break;
        case 'grid': if (now) sc.banner = { big: b.kind === 'harbinger' ? 'THE FOUR AND THE HARBINGER' : 'THE FOUR ON THE GRID', small: { won: 'won', yielded: 'won', fled: 'won', escaped: 'the four got out of it', lost: 'the four went down' }[b.res] + (b.kind === 'band' ? ' -- ' + Math.round(b.share * 100) + '% of the band down' : ''), p: p }; break;
        case 'night': if (now) { sc.dark = Math.min(1, p * 2) * 0.45; sc.banner = { big: 'NIGHT FALLS', small: 'no one ends the day on a shared hex: one side backs off', p: p }; } else sc.dark = 0; break;
        case 'head': sc.head = { b: b, p: p, local: local, now: now }; break;
      }
    }
    return sc;
  };

  // ---------------------------------------------------------------- drawing the scene
  var TW = 60, TH = 30, NT = 11; // (the patch of ground: 11 x 11 iso tiles, filling the frame)
  function iso(cx, i, j) { return [CX + (i - j) * TW / 2, GY - 175 + (i + j) * TH / 2]; }
  function ground(cx, sc) {
    var g = GROUND[sc.ter] || GROUND['.'], hill = sc.ter === 'h' || sc.ter === 'm' || sc.ter === 's' || sc.ter === 'l';
    for (var j = 0; j < NT; j++) for (var i = 0; i < NT; i++) {
      var p = iso(cx, i, j);
      cx.beginPath(); cx.moveTo(p[0], p[1] - TH / 2); cx.lineTo(p[0] + TW / 2, p[1]); cx.lineTo(p[0], p[1] + TH / 2); cx.lineTo(p[0] - TW / 2, p[1]); cx.closePath();
      cx.fillStyle = g[(i + j) & 1]; cx.fill(); cx.strokeStyle = 'rgba(0,0,0,0.12)'; cx.stroke();
      if (hill && ((i * 7 + j * 3) % 5 === 0)) { cx.strokeStyle = 'rgba(40,26,12,0.5)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(p[0], p[1] + 6, 12, Math.PI * 1.1, Math.PI * 1.9); cx.stroke(); cx.lineWidth = 1; }
      if (!hill && ((i * 5 + j * 11) % 7 === 0)) { cx.strokeStyle = 'rgba(30,50,10,0.45)'; cx.beginPath(); cx.moveTo(p[0], p[1]); cx.lineTo(p[0] - 3, p[1] - 7); cx.moveTo(p[0], p[1]); cx.lineTo(p[0] + 3, p[1] - 7); cx.stroke(); }
    }
    if (sc.road) for (var r = 0; r < NT; r++) { var q = iso(cx, 5, r); cx.fillStyle = 'rgba(201,169,106,0.75)'; cx.beginPath(); cx.moveTo(q[0], q[1] - TH / 2); cx.lineTo(q[0] + TW * 0.3, q[1] - TH * 0.2); cx.lineTo(q[0], q[1] + TH / 2); cx.lineTo(q[0] - TW * 0.3, q[1] + TH * 0.2); cx.closePath(); cx.fill(); }
    if (sc.ter === 'P') { var c0 = iso(cx, 7, 1); cx.fillStyle = '#2a2018'; cx.beginPath(); cx.ellipse(c0[0], c0[1], 120, 50, 0, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = '#a08a68'; cx.lineWidth = 4; cx.stroke(); cx.lineWidth = 1; for (var w = 0; w < 4; w++) { var wp = iso(cx, 1 + w * 2, 0); cx.fillStyle = '#8d7a5c'; cx.fillRect(wp[0] - 18, wp[1] - 60, 36, 48); cx.fillStyle = '#5e4f3d'; cx.fillRect(wp[0] - 18, wp[1] - 60, 36, 6); } }
    if (sc.ter === 'm') for (var m = 0; m < 10; m++) { var a = m / 10 * Math.PI * 2, mp = [CX + Math.cos(a) * 260, GY - 20 + Math.sin(a) * 110]; if (Math.sin(a) > 0.3) continue; cx.fillStyle = '#c9c0a8'; cx.fillRect(mp[0] - 7, mp[1] - 26, 14, 26); }
    if (sc.ter === 'g') { cx.strokeStyle = '#2a1e10'; cx.lineWidth = 6; cx.beginPath(); var g0 = iso(cx, 0, 6), g1 = iso(cx, 3, 4), g2 = iso(cx, 6, 6), g3 = iso(cx, 8, 3); cx.moveTo(g0[0], g0[1]); cx.lineTo(g1[0], g1[1]); cx.lineTo(g2[0], g2[1]); cx.lineTo(g3[0], g3[1]); cx.stroke(); cx.lineWidth = 1; }
  }
  // where a unit's figures stand: ours on the left facing east, theirs on the right facing west; a side's units one behind another
  function places(sc, id) {
    var U = sc.units[id], list = sc.order[U.k].filter(function (x) { return !sc.units[x].gone || x === id; }), i = list.indexOf(id), n = Math.max(1, list.length);
    var cols = n > 2 ? 2 : 1, rows = Math.ceil(n / cols), c = i % cols, r = Math.floor(i / cols), rowH = n > 4 ? 56 : n > 2 ? 80 : 104;
    var dir = U.k === 'ours' ? -1 : 1, enter = (sc.enter || 0) * 300, shake = U.shake ? Math.sin(sc.t * 60) * 5 * U.shake : 0;
    var bx = CX + dir * (130 + c * 130 + enter) + U.off + shake, by = GY - (n > 2 ? 64 : 30) + (r - (rows - 1) / 2) * rowH + c * 22;
    var k = n > 4 ? 0.95 : n > 2 ? 1.15 : n > 1 ? 1.4 : 1.7, troops = U.u.party ? 0 : Math.min(n > 4 ? 3 : n > 2 ? 4 : 6, Math.max(U.figs > 0 ? 1 : 0, Math.ceil(U.figs / 2))), heroes = U.heroes.filter(function (h) { return !h.dead; });
    var out = [], sh = U.u.sheets || [], hs = heroes.length && !U.u.party ? 1 : 0;
    if (U.u.party) U.u.sheets.forEach(function (s, m) { out.push({ sheet: s, x: bx - dir * (m % 2) * 34 + dir * 10, y: by - 34 + m * 22, hero: true }); });
    else {
      heroes.forEach(function (h, m) { out.push({ sheet: sh[0], x: bx - dir * 8, y: by + 10 + m * 26, hero: true }); });
      for (var j = 0; j < troops; j++) { var cc = j % 3, rr = Math.floor(j / 3); out.push({ sheet: sh[(hs + (j % Math.max(1, sh.length - hs))) % sh.length] || sh[0], x: bx + dir * (30 + cc * 24 * k + rr * 14 * k), y: by - 18 * k + cc * 12 * k - rr * 16 * k }); }
    }
    out.sort(function (a, b) { return a.y - b.y; });
    return { k: k, figs: out, bx: bx, by: by, dir: dir, n: n };
  }
  function die(cx, x, y, s, v, hl, dim) {
    cx.fillStyle = hl ? '#ffd25a' : dim ? '#9a948a' : '#f4efe4'; cx.strokeStyle = '#2a2018'; cx.lineWidth = 1.5;
    cx.beginPath(); if (cx.roundRect) cx.roundRect(x - s / 2, y - s / 2, s, s, 4); else cx.rect(x - s / 2, y - s / 2, s, s); cx.fill(); cx.stroke();
    var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [];
    cx.fillStyle = '#1a1410'; P.forEach(function (q) { cx.beginPath(); cx.arc(x + q[0] * s * 0.26, y + q[1] * s * 0.26, s * 0.09, 0, Math.PI * 2); cx.fill(); });
  }
  function text(cx, t, x, y, size, col, align) { cx.font = 'bold ' + size + 'px Georgia, serif'; cx.textAlign = align || 'center'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,0.85)'; cx.strokeText(t, x, y); cx.fillStyle = col || '#f3e7c0'; cx.fillText(t, x, y); }
  SH.draw = function (cx, Wc, Hc, show, t) {
    var sc = SH.scene(show, t), k = Math.min(Wc / W0, Hc / H0);
    cx.save(); cx.imageSmoothingEnabled = false;
    cx.fillStyle = 'rgba(8,6,12,0.88)'; cx.fillRect(0, 0, Wc, Hc);
    cx.translate((Wc - W0 * k) / 2, (Hc - H0 * k) / 2); cx.scale(k, k);
    cx.beginPath(); cx.rect(0, 0, W0, H0); cx.clip();
    if (sc.head) { drawHead(cx, sc); cx.restore(); return sc; }
    ground(cx, sc);
    // the figures, back to front
    var all = [];
    Object.keys(sc.units).forEach(function (id) {
      var U = sc.units[id]; if (U.gone && U.alpha <= 0) return;
      var pl = places(sc, id), face = U.facing != null ? U.facing : U.k === 'ours' ? 6 : 2;
      pl.figs.forEach(function (f, i) { all.push({ y: f.y, draw: function () {
        var anim = U.anim || (sc.enter > 0.02 ? 'walk' : 'idle'), at = U.anim ? U.animT : sc.t + i * 0.13;
        if (U.hurt > 0 && !U.anim) { anim = 'hurt'; at = (1 - U.hurt) * 0.6; }
        figure(cx, f.sheet, anim, face, f.x, f.y, pl.k * (f.hero ? 1.12 : 1), at + i * 0.05, anim === 'attack' || anim === 'hurt', U.alpha);
      } }); });
    });
    all.sort(function (a, b) { return a.y - b.y; }).forEach(function (d) { d.draw(); });
    // the roster: each side's units and their figures, in its top corner (the one rolling now lit)
    var rolling = {}; sc.dice.forEach(function (dd) { rolling[dd.u] = 1; });
    ['ours', 'theirs'].forEach(function (side) {
      var ids = sc.order[side], y = 112, x = side === 'ours' ? 16 : W0 - 16, al = side === 'ours' ? 'left' : 'right';
      text(cx, side === 'ours' ? 'OURS' : 'THEIRS', x, y - 4, 13, side === 'ours' ? '#9ff0dc' : '#ffb898', al);
      ids.forEach(function (id, i) {
        var U = sc.units[id], nm = U.u.party ? 'the four' : U.u.name, hs = U.heroes.filter(function (h) { return !h.dead; }).length;
        cx.globalAlpha = U.gone ? 0.35 : 1;
        text(cx, nm + (U.u.party ? '' : ' -- ' + U.figs) + (hs && !U.u.party ? ' +' + hs + '★' : ''), x, y + 16 + i * 17, 12, rolling[id] ? '#ffe08a' : U.gone ? '#9a94a8' : '#f3e7c0', al);
        cx.globalAlpha = 1;
      });
    });
    // the witness: figures running in from the far side to the winner
    sc.runners.forEach(function (rn) {
      var W = sc.units[rn.to]; if (!W) return; var pl = places(sc, rn.to), x0 = pl.dir > 0 ? W0 + 40 : -40;
      for (var i = 0; i < Math.min(4, rn.n * 2); i++) { var q = Math.min(1, rn.p * 1.4 - i * 0.08); if (q <= 0) continue; figure(cx, rn.sheets[i % rn.sheets.length] || 'gnoll_p2', 'walk', pl.dir > 0 ? 2 : 6, x0 + (pl.bx + pl.dir * 60 - x0) * q, pl.by - 20 + i * 14, pl.k, sc.t + i * 0.2, false, q < 0.95 ? 1 : 1 - (q - 0.95) * 20); }
    });
    // effects: fire, the minus, words
    sc.fx.forEach(function (fx) {
      var U = sc.units[fx.u]; if (!U) return; var pl = places(sc, fx.u), x = pl.bx + pl.dir * 60, y = pl.by - 30;
      if (fx.kind === 'fire') { cx.globalAlpha = 1 - fx.p; for (var r = 0; r < 3; r++) { cx.fillStyle = ['#ffe08a', '#ff9a3a', '#d0401a'][r]; cx.beginPath(); cx.arc(x, y, 30 + fx.p * 90 - r * 22, 0, Math.PI * 2); cx.fill(); } cx.globalAlpha = 1; }
      if (fx.kind === 'minus') text(cx, '-' + fx.n, x, y - 70 - fx.p * 30, 30, '#ff6a5a');
      if (fx.kind === 'word') text(cx, fx.text, x, y - 80, 24, '#ffd25a');
    });
    // the dice: under the side that rolled them, a row each -- the round's dice all at once, on a dark band at the foot of the scene
    if (sc.dice.length) { var rowsMax = Math.max(sc.dice.filter(function (dd) { return (sc.units[dd.u] ? sc.units[dd.u].k : dd.side) === 'ours'; }).length, sc.dice.filter(function (dd) { return (sc.units[dd.u] ? sc.units[dd.u].k : dd.side) === 'theirs'; }).length);
      var band = rowsMax > 2 ? rowsMax * 23 + 30 : rowsMax > 1 ? 110 : 120; cx.fillStyle = 'rgba(10,8,14,0.72)'; cx.fillRect(0, H0 - band - 20, W0, band + 20); }
    ['ours', 'theirs'].forEach(function (side) {
      var mine = sc.dice.filter(function (dd) { return (sc.units[dd.u] ? sc.units[dd.u].k : dd.side) === side; }); if (!mine.length) return;
      var tight = mine.length > 2, s = tight ? 11 : mine.length > 1 ? 18 : 24, gap = s + 3, per = tight ? 16 : mine.length > 1 ? 14 : 12, rowH = tight ? s + 12 : mine.length > 1 ? s + 22 : s * 2 + 40;
      var xC = side === 'ours' ? CX - 230 : CX + 230, y0 = H0 - 34 - mine.length * rowH + (tight ? 10 : 18);
      mine.forEach(function (dd, r) {
        var n = dd.dice.length, shown = Math.min(n, per * (mine.length > 1 ? 1 : 3)), roll = dd.p < 0.3, y = y0 + r * rowH, x0 = xC - (Math.min(shown, per) - 1) * gap / 2;
        if (dd.title && !tight) text(cx, dd.title, xC, y - s / 2 - 5, mine.length > 1 ? 11 : 13, '#e8d8a0');
        if (dd.title && tight) { var nm2 = String(dd.title).split(':')[0].replace(/,.*$/, ''); text(cx, nm2, side === 'ours' ? x0 - 8 : x0 + Math.min(shown, per) * gap + 40, y + 4, 11, '#e8d8a0', side === 'ours' ? 'right' : 'left'); }
        for (var i = 0; i < shown; i++) {
          var v = dd.dice[i], x = x0 + (i % per) * gap, yy = y + Math.floor(i / per) * gap;
          var face = roll ? 1 + Math.floor(((sc.t * 23 + i * 7) % 6)) : v, hl = !roll && !dd.sum && v >= dd.need;
          die(cx, x + (roll ? Math.sin(sc.t * 40 + i) * 2 : 0), yy + (roll ? Math.cos(sc.t * 37 + i) * 2 : 0), s, face, hl, !roll && !dd.sum && v < dd.need);
        }
        var xe = x0 + (Math.min(shown, per) - 1) * gap + s;
        if (n > shown) text(cx, '+' + (n - shown), xe + 4, y + 5, 12, '#c9c2d6', 'left');
        if (!roll) {
          var wordX = side === 'ours' ? x0 - s : xe + (n > shown ? 30 : 6), al = side === 'ours' ? 'right' : 'left';
          if (dd.sum) { var sum = dd.dice.reduce(function (a, b) { return a + b; }, 0) + (dd.mod || 0); text(cx, '= ' + sum + ' (needs ' + dd.need + ')', xC, y + s + 16, 14, '#f3e7c0'); if (dd.word) text(cx, dd.word, xC, y + s + 38, 18, '#ffd25a'); }
          else if (tight) text(cx, String(dd.k), side === 'ours' ? xe + 14 : x0 - 14, y + 5, 13, dd.k ? '#ffd25a' : '#c9c2d6');
          else text(cx, dd.k + (dd.k === 1 ? ' kill' : ' kills'), wordX, y + 5, mine.length > 1 ? 14 : 18, dd.k ? '#ffd25a' : '#c9c2d6', al);
        }
      });
    });
    if (sc.dark) { cx.fillStyle = 'rgba(10,10,40,' + sc.dark + ')'; cx.fillRect(0, 0, W0, H0); }
    if (sc.banner) { var bp = sc.banner, a = bp.quick ? 1 : Math.min(1, bp.p * 5, (1 - bp.p) * 5 + 0.2); cx.globalAlpha = a; cx.fillStyle = 'rgba(12,10,16,0.78)'; cx.fillRect(0, 26, W0, bp.small ? 66 : 46); text(cx, bp.big, W0 / 2, 58, 26, '#ffe08a'); if (bp.small) text(cx, bp.small, W0 / 2, 82, 15, '#e8d8a0'); cx.globalAlpha = 1; }
    if (SH.hint !== false) text(cx, 'SPACE skips this fight  ·  Esc the rest of the day', W0 - 12, H0 - 10, 12, '#9a94a8', 'right');
    cx.restore();
    return sc;
  };
  // the head on the map, no one of ours there (his rule): GreyFang and the Harbinger at the Pit's own ground
  function drawHead(cx, sc) {
    var h = sc.head, p = h.p, b = h.b;
    ground(cx, { ter: SN.ter(b.at[0], b.at[1]), road: SN.road(b.at) });
    var gx = CX + 110, hx = CX - 130 + Math.min(1, p * 2.5) * 120;
    if (!b.around) {
      var fallen = p > 0.55, gA = fallen ? Math.max(0, 1 - (p - 0.75) * 4) : 1;
      figure(cx, 'greyfang_p1', fallen ? 'hurt' : 'idle', 2, gx, GY + 30, 2.0, fallen ? (p - 0.55) * 3 : sc.t, fallen, gA);
      figure(cx, 'mirrorgnoll_p1', p > 0.4 && p < 0.7 ? 'attack' : 'idle', 6, hx, GY + 34, 2.0, p > 0.4 ? (p - 0.4) * 3 : sc.t, p > 0.4 && p < 0.7, 1);
    }
    if (p > 0.6 || b.around) { cx.fillStyle = 'rgba(12,10,16,0.78)'; cx.fillRect(0, 26, W0, 66); text(cx, 'THE HEAD', W0 / 2, 58, 28, '#ff9a8a'); text(cx, '"The Mane is mine."', W0 / 2, 84, 17, '#f3e7c0'); }
  }

  // ---------------------------------------------------------------- playing a show on the page
  SH.skipDay = false;
  SH.play = function (st, from, to, at, done) {
    var show = SH.build(st, from, to, at);
    if (!show.segs.length || SH.skipDay || show.total - show.startT < 0.2) { done(); return; }
    var cv = document.getElementById('show'), map = document.getElementById('map');
    cv.width = map.width; cv.height = map.height; cv.style.left = map.style.left || '0px'; cv.style.top = map.offsetTop + 'px'; cv.style.display = 'block';
    var cx = cv.getContext('2d'), t0 = performance.now() / 1000 - show.startT, ended = false, speed = /[?&]watch\b/.test(location.search) ? 1.6 : 1;
    function end() { if (ended) return; ended = true; document.removeEventListener('keydown', key, true); cv.removeEventListener('click', click); cv.style.display = 'none'; done(); }
    function key(e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopImmediatePropagation(); t0 = -1e9; } else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); SH.skipDay = true; t0 = -1e9; } else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); } }
    function click() { t0 = -1e9; }
    document.addEventListener('keydown', key, true); cv.addEventListener('click', click);
    (function tick() {
      if (ended) return;
      var t = Math.min(show.total, (performance.now() / 1000 - t0) * speed);
      try { SH.draw(cx, cv.width, cv.height, show, t); } catch (e) { console.error(e); return end(); }
      if (t >= show.total) { setTimeout(end, 250); return; }
      // the next frame, or a tenth of a second, whichever comes first: a window that is not painting (minimized, covered) gives no frames
      // though the page counts as shown, and the day must not stall mid-show (found 10-14 night in the pane)
      var fired = false, go = function () { if (!fired) { fired = true; tick(); } };
      requestAnimationFrame(go); setTimeout(go, 100);
    })();
  };
})();
