/* THE SNOOT -- the show (10-14 night, the Snoot mode seat). His notes after his first play: "isometric - animated combat" and "the
   resolution should be a show"; RULED the same night on the seat's three leans ("sounds great"): each fight zooms into a small isometric
   patch of its hex's ground, DEEP16-style -- the formations face off, the figures swing their attack rows, the dice tumble on screen, the
   killed fall, the morale result goes up as a banner, witnesses run across to the winner -- and back to the map, which stays flat; every
   fight gets the show, about five seconds; SPACE skips a fight, Esc the rest of the day. 10-15, his word: "Rather than launching an
   isometric combat view, isometric hex the main map and zoom in to animate the combat" -- the map is isometric now (js/view.js) and the show
   is the map's camera flown down into the fight's own hex, the units in their formations on the sides they came in through.
   The show plays the engine's beats (js/rules.js SN.beat: the fight as it began, the shock, the Fantasy table, the fire ball, every unit's
   dice, the casualties, the morale, who fell back, the witness, instability, nightfall, the grid's result, the head) -- nothing is rolled
   here; the dice on screen are the day's own. A scene is a pure function of its time (SN.Show.scene), so a skip is a jump to the end, and
   the probe draws it at any moment headless. The figures are DEEP16's sheets by their own frame maps, as js/view.js draws them. */
'use strict';
(function () {
  var SN = window.SN, SH = SN.Show = {}, imgs = {};
  var W0 = 960, H0 = 540, CX = 480; // (the screen's own size for the dice, the banners and the rosters; the canvas scales it)
  // how long each beat holds the screen, in seconds; a round's dice roll together (CHAINMAIL's melee is simultaneous, p.14), as do its casualties,
  // its fire balls and its duels -- one beat each -- and a later round goes quicker: about five seconds a fight (RULED 10-14 night)
  var DUR = { evade: 1.1, surp: 0.9, fight: 0.9, round: 0.3, shock: 1.0, ft: 0.9, fb: 0.75, atk: 1.2, cas: 0.6, herofall: 0.6, gone: 0.6, mor: 0.95, fall: 0.6, surrender: 0.6, wit: 1.1, inst: 0.8, grid: 1.2, night: 1.0, head: 3.4 };
  // a family plays as one beat: every band's shock with its falling back; the round's casualties with who fell and who is gone; the falls
  // after nightfall with the night; a run of instability rolls
  var FAM = { atk: 'atk', cas: 'toll', gone: 'toll', herofall: 'toll', surrender: 'toll', fb: 'fb', save: 'fb', ft: 'ft', shock: 'shock', fall: 'fall', inst: 'inst', night: 'night' };
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
    var segs = [], t = 0, round = 0, skipTo = 0, wit = [], F0 = B[start], oursIds = {};
    if (F0 && F0.ours) F0.ours.forEach(function (u) { oursIds[u.id] = 1; });
    // a round's casualties one side at a time, the side that lost the more first (his ask 10-15: "remove the casualties one side at a time? With a
    // clear victor, the losing units first"); each unit's falling back goes with its side
    var halves = function (list) {
      if (FAM[list[0].t] !== 'toll') return null;
      var parts = { ours: [], theirs: [] }, loss = { ours: 0, theirs: 0 };
      list.forEach(function (x) { var s = oursIds[x.u] ? 'ours' : 'theirs'; parts[s].push(x); loss[s] += x.t === 'cas' ? x.n : x.t === 'herofall' ? 4 : x.t === 'gone' || x.t === 'surrender' ? 1 : 0; });
      if (!parts.ours.length || !parts.theirs.length) return null;
      return loss.ours > loss.theirs ? [parts.ours, parts.theirs] : [parts.theirs, parts.ours];
    };
    for (var j = start; j < to; j++) {
      var b = B[j]; if (!b) continue;
      // the witness plays on the map after the camera is back out, the givers' figures running from their hexes (his ask 10-15: "can the witness
      // joinings trigger after the victory (zoomed back to see the other units feeding the witnessed)")
      if (b.t === 'wit') { if (j >= from) wit.push(b); if (j >= from - 1 && start < from && !skipTo && j < from) skipTo = t; continue; }
      if (b.t === 'round') round = b.n;
      var list = [b], fam = FAM[b.t];
      while (fam && j + 1 < to && B[j + 1] && (FAM[B[j + 1].t] === fam || (JOIN[fam] && JOIN[fam][B[j + 1].t]))) { j++; list.push(B[j]); } // (a family: one beat)
      var d = (DUR[b.t] || 0.6) * (round >= 2 && QUICK[b.t] ? 0.5 : 1);
      if (b.t === 'mor' && b.how === 'continue' && round >= 2) d = 0.45;
      if (b.t === 'round' && b.n === 1) d = 0;
      if (b.t === 'surp' && !b.side) d = 0.45; // (no one caught unready: the two dice, briefly)
      if (b.t === 'head' && b.around) d = 1.8; // (the grid has shown it: a banner only)
      var hv = halves(list);
      if (hv) hv.forEach(function (hl) { segs.push({ b: hl[0], list: hl, t0: t, d: d * 0.75 }); t += d * 0.75; });
      else { segs.push({ b: b, list: list, t0: t, d: d }); t += d; }
      if (j >= from - 1 && start < from && !skipTo && j < from) skipTo = t;
    }
    return { segs: segs, total: t, startT: start < from ? skipTo : 0, first: B[start], wit: wit };
  };

  // ---------------------------------------------------------------- the scene at a moment: who stands where, how many, what is on screen
  SH.scene = function (show, t) {
    var first = show.first, sc = { units: {}, order: { ours: [], theirs: [] }, ter: '.', road: false, place: '', banner: null, dice: [], fx: [], runners: [], dark: 0, head: null, t: t };
    if (first && first.t === 'fight') {
      sc.ter = first.ter; sc.road = first.road; sc.place = first.place;
      ['ours', 'theirs'].forEach(function (k) {
        first[k].forEach(function (u) { sc.units[u.id] = { u: u, k: k, figs: u.figs, heroes: u.heroes.map(function (h) { return { name: h.name, type: h.type, dead: false }; }), fall: null, alpha: 1, anim: null, gone: false, hurt: 0 }; sc.order[k].push(u.id); });
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
        case 'evade': if (now) sc.banner = { big: b.ok ? 'THEY SLIP AWAY' : 'CAUGHT', small: b.name + ' try to evade (Book III): ' + b.roll + ' against ' + b.chance + '%' + (b.room ? '' : ', nowhere to go'), p: p }; break;
        case 'surp': if (now) { [['ours', b.dO], ['theirs', b.dT]].forEach(function (x) { sc.dice.push({ side: x[0], u: null, dice: [x[1]], need: 3, sum: true, p: p, word: x[1] <= 2 ? 'UNREADY' : 'READY', title: 'A die for surprise (Book III): 1-2 unready' }); });
            if (b.side) sc.banner = { big: 'SURPRISE!', small: (b.side === 'ours' ? 'ours are' : 'they are') + ' caught unready: taken ' + (b.circle ? 'from the rear, in a circle,' : 'in the flank') + ' in the first round', p: p }; } break;
        case 'shock': if (now) { sc.dice.push({ side: U ? U.k : 'theirs', u: b.u, dice: b.dice, need: b.need, sum: true, p: p, word: b.ok ? 'THEY STAND' : 'THEY SHY FROM ' + String(b.byName).toUpperCase() }); if (U) U.shake = 1 - p; } break;
        case 'ft': if (now) { var A = sc.units[b.a]; sc.dice.push({ side: A ? A.k : 'ours', u: b.a, dice: b.dice, need: b.need, mod: b.mod, sum: true, p: p, word: { kill: b.bh + ' IS KILLED', back: b.bh + ' FALLS BACK', none: 'NO EFFECT', beaten: 'THE MIRROR TAKES HIM', spared: 'BEATEN BACK -- HE IS THE HARBINGER\'S' }[b.res], title: b.ah + ' against ' + b.bh }); if (A) A.anim = 'attack', A.animT = local; }
          if (b.res === 'kill' && p >= 1) { var Bt = sc.units[b.b]; if (Bt) Bt.heroes.forEach(function (h) { if (h.name === b.bh) h.dead = true; }); } break;
        case 'fb': if (now) { var light = b.kind === 'lightning', tl = b.tgs || [{ tg: b.tg, n: b.n }];
            tl.forEach(function (x) { var tg = sc.units[x.tg]; sc.fx.push({ kind: light ? 'bolt' : 'fire', u: x.tg, from: b.u, p: p }); if (tg) tg.hurt = 1 - p; });
            sc.banner = { big: light ? 'A LIGHTNING BOLT' : 'A FIRE BALL', small: b.w + ': ' + tl.map(function (x) { return x.n + (x.n > 1 ? ' figures' : ' figure'); }).join(' and ') + ' struck', p: p, quick: true }; } break;
        case 'save': if (now) sc.dice.push({ side: U ? U.k : 'ours', u: b.u, dice: b.dice, need: b.need, sum: true, p: p, word: b.ok ? b.name + ' SAVES' : b.name + ' IS STRUCK', title: 'Caught by the missile: two dice to save' }); break;
        case 'atk': if (now) { if (U) { U.anim = 'attack'; U.animT = local; } sc.dice.push({ side: U ? U.k : 'ours', u: b.u, dice: b.dice, need: b.need, k: b.k, p: p, title: (U ? (U.u.party ? 'the four' : U.u.name) : '') + (b.volley ? ', a volley' : b.imp ? ', charging (+1 die a figure)' : '') + (b.asp === 'rear' ? ', FROM THE REAR' : b.asp === 'flank' ? ', ON THE FLANK' : '') + ': ' + b.cls + ' v ' + b.dcls + ', ' + b.need + '+ kills' }); } break;
        case 'cas': if (U) { if (now) { U.hurt = 1 - p; sc.fx.push({ kind: 'minus', u: b.u, n: b.n, p: p }); } if (p >= 1 || !now) U.figs = b.figs; } break;
        case 'herofall': if (U) { if (now) sc.fx.push({ kind: 'word', u: b.u, text: b.name + ' falls', p: p }); if (p >= 1) U.heroes.forEach(function (h) { if (h.name === b.name) h.dead = true; }); } break;
        case 'gone': if (U) { U.alpha = 1 - p; if (p >= 1) U.gone = true; } break;
        case 'mor': if (now) sc.banner = { big: { 'continue': 'THE MELEE GOES ON', backoff: 'THEY BACK OFF', back: 'THEY FALL BACK', retreat: 'THEY RETREAT', rout: 'ROUT!', surrender: 'THEY SURRENDER' }[b.how] + (b.how === 'continue' ? '' : b.lo === 'ours' ? ' (OURS)' : ''), small: 'Morale: ours ' + b.sA + ' -- theirs ' + b.sB + (b.never ? ' (they never check)' : ''), p: p }; break;
        case 'fall': if (U) { U.fall = { dir: b.dir != null ? b.dir : -1, p: p * (b.how === 'rout' ? 1.3 : 1) }; U.anim = null; U.alpha = 1 - Math.max(0, p - 0.5) * 2; if (p >= 1) U.gone = true; if (now && b.how === 'rout') sc.fx.push({ kind: 'word', u: b.u, text: 'ROUT', p: p }); } break;
        case 'surrender': if (U) { if (b.heroesLeft) { if (now) sc.fx.push({ kind: 'word', u: b.u, text: 'THE MEN ARE TAKEN', p: p }); if (p >= 1 || !now) U.figs = 0; } else { if (now) sc.fx.push({ kind: 'word', u: b.u, text: 'TAKEN PRISONER', p: p }); U.alpha = 1 - p; if (p >= 1) U.gone = true; } } break;
        case 'wit': var W = sc.units[b.to]; if (now) { sc.runners.push({ to: b.to, n: b.n, sheets: b.sheets, p: p }); sc.banner = { big: 'WITNESS', small: b.fromName + ' saw it: ' + b.n + (b.n > 1 ? ' figures go' : ' figure goes') + ' over to the winner', p: p }; } if (W && (p >= 1 || !now)) W.figs += b.n; break;
        case 'inst': if (now) sc.dice.push({ side: U ? U.k : 'theirs', u: b.u, dice: b.dice, need: b.need, sum: true, p: p, word: b.ok ? 'THEY HOLD TOGETHER' : 'THEY BREAK APART', title: 'Lost too many: two dice to stay' }); break;
        case 'grid': if (now) sc.banner = { big: b.kind === 'harbinger' ? 'THE FOUR AND THE HARBINGER' : 'THE FOUR ON THE GRID', small: { won: 'won', yielded: 'won', fled: 'won', escaped: 'the four got out of it', lost: 'the four went down' }[b.res] + (b.kind === 'band' ? ' -- ' + Math.round(b.share * 100) + '% of the band down' : ''), p: p }; break;
        case 'night': if (now) { sc.dark = Math.min(1, p * 2) * 0.45; sc.banner = { big: 'NIGHT FALLS', small: 'no one ends the day on a shared hex: one side backs off', p: p }; } else sc.dark = 0; break;
        case 'head': sc.head = { b: b, p: p, local: local, now: now }; break;
      }
    }
    return sc;
  };

  // ---------------------------------------------------------------- drawing the scene: in the fight's own hex, the map's camera flown down onto it
  // (his word 10-15: "isometric hex the main map and zoom in to animate the combat"). The map (js/view.js V.render) is drawn through a camera
  // that flies from the whole map into the hex over the fight's opening beat; the stacks there give way to the fight's own figures, each unit in
  // its formation on the side it came in through (a line abreast, a column in file, a square in a ring), facing in; the dice, the banners and
  // the rosters are on the screen over it; after the last beat the camera flies back out
  var ZIN = 0.7, ZOUT = 0.5, off = null;
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function sheetDir(f) { var a = Math.atan2(f[1] * SN.V.SQ, f[0]), k = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return [6, 7, 0, 1, 2, 3, 4, 5][k]; } // (a world direction to the sheet's eight facings)
  // where each unit stands in the hex (the hex's own world units, its centre 0,0): one that came in stands just inside the side it came through,
  // facing in; one that stood there holds the middle, on the far side from the enemies that came in (facing as it faced: taken from behind, its back
  // to them -- found 10-15 in his play: the plains came in behind a band and both stood on one side); a side's units from one way stand abreast; two
  // sides in through one side, the second a little further in
  function layout(sc) {
    var V = SN.V, groups = {}, out = {}, came = { ours: [0, 0, 0], theirs: [0, 0, 0] }, used = {};
    Object.keys(sc.units).forEach(function (id) { var U = sc.units[id], key = U.k + ':' + (U.u.from >= 0 ? U.u.from : 'c'); (groups[key] = groups[key] || []).push(id);
      if (U.u.from >= 0) { var c = came[U.k]; c[0] += V.DIRV[U.u.from][0]; c[1] += V.DIRV[U.u.from][1]; c[2]++; } });
    Object.keys(groups).forEach(function (key) {
      var ids = groups[key], n = ids.length;
      ids.forEach(function (id, i) {
        var U = sc.units[id], from = U.u.from, face = from >= 0 ? (from + 3) % 6 : (U.u.face || 0), f = V.DIRV[face], r = [-f[1], f[0]];
        var foe = came[U.k === 'ours' ? 'theirs' : 'ours'], fl = Math.sqrt(foe[0] * foe[0] + foe[1] * foe[1]), deep = from >= 0 && used[from] && used[from] !== U.k ? 0.2 : 0.5, base;
        if (from >= 0) { base = [V.DIRV[from][0] * deep, V.DIRV[from][1] * deep]; if (!used[from]) used[from] = U.k; }
        else if (foe[2] && fl > 0.2) base = [-foe[0] / fl * 0.24, -foe[1] / fl * 0.24];
        else base = [-f[0] * 0.14, -f[1] * 0.14];
        var o = (i - (n - 1) / 2) * 0.36, ax = base[0] + r[0] * o, ay = base[1] + r[1] * o;
        if (from >= 0 && sc.enter > 0) { ax += V.DIRV[from][0] * 0.45 * sc.enter; ay += V.DIRV[from][1] * 0.45 * sc.enter; }
        if (U.fall) { var fd = V.DIRV[U.fall.dir >= 0 ? U.fall.dir : (face + 3) % 6]; ax += fd[0] * 1.1 * U.fall.p; ay += fd[1] * 1.1 * U.fall.p; }
        out[id] = { ax: ax, ay: ay, f: f, r: r, face: face };
      });
    });
    return out;
  }
  SH.layout = layout;
  // a unit's figures in its formation (CHAINMAIL p.10): a line two ranks abreast, a column in file two wide, a square in a ring; its heroes before it
  function figsOf(U, L) {
    var out = [], sh = U.u.sheets || [], heroes = U.heroes.filter(function (h) { return !h.dead; }), hs = heroes.length && !U.u.party ? 1 : 0;
    // (the spacing is the screen's: a rank running into the slant's depth is squashed to SQ, so it is spread the more in the world)
    var SQ = SN.V.SQ, sl = function (v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] * SQ * SQ) || 1; return [v[0] / l, v[1] / l]; };
    var n = U.u.party ? 0 : Math.min(9, Math.max(U.figs > 0 ? 1 : 0, U.figs)), f = sl(L.f), r = sl(L.r), sp = 0.1, pts = [], i;
    if (U.u.form === 'square' && n > 2) for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2; pts.push([Math.cos(a) * 0.16, Math.sin(a) * 0.16]); }
    else if (U.u.form === 'column') { var files = n > 2 ? 2 : 1, ranks = Math.ceil(n / files); for (i = 0; i < n; i++) { var u2 = ((ranks - 1) / 2 - Math.floor(i / files)) * sp, v2 = (i % files - (files - 1) / 2) * sp * 0.9; pts.push([f[0] * u2 + r[0] * v2, f[1] * u2 + r[1] * v2]); } }
    else { var fl = n > 4 ? Math.ceil(n / 2) : n; for (i = 0; i < n; i++) { var v3 = (i % fl - (fl - 1) / 2) * sp, u3 = -Math.floor(i / fl) * sp * 0.85; pts.push([f[0] * u3 + r[0] * v3, f[1] * u3 + r[1] * v3]); } }
    pts.forEach(function (q, j) { out.push({ lx: L.ax + q[0], ly: L.ay + q[1], sheet: sh[(hs + (j % Math.max(1, sh.length - hs))) % sh.length] || sh[0] }); });
    var H = U.u.party ? (U.u.sheets || []).map(function (s) { return { sheet: s }; }) : heroes.map(function () { return { sheet: sh[0] }; });
    H.forEach(function (h, m) { var v = (m - (H.length - 1) / 2) * 0.12, u = U.u.party || U.u.form === 'square' ? 0 : 0.11; out.push({ lx: L.ax + f[0] * u + r[0] * v, ly: L.ay + f[1] * u + r[1] * v, sheet: h.sheet, hero: true }); });
    return out;
  }
  function die(cx, x, y, s, v, hl, dim) {
    cx.fillStyle = hl ? '#ffd25a' : dim ? '#9a948a' : '#f4efe4'; cx.strokeStyle = '#2a2018'; cx.lineWidth = 1.5;
    cx.beginPath(); if (cx.roundRect) cx.roundRect(x - s / 2, y - s / 2, s, s, 4); else cx.rect(x - s / 2, y - s / 2, s, s); cx.fill(); cx.stroke();
    var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [];
    cx.fillStyle = '#1a1410'; P.forEach(function (q) { cx.beginPath(); cx.arc(x + q[0] * s * 0.26, y + q[1] * s * 0.26, s * 0.09, 0, Math.PI * 2); cx.fill(); });
  }
  function text(cx, t, x, y, size, col, align) { cx.font = 'bold ' + size + 'px Georgia, serif'; cx.textAlign = align || 'center'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,0.85)'; cx.strokeText(t, x, y); cx.fillStyle = col || '#f3e7c0'; cx.fillText(t, x, y); }
  // SH.draw(cx, W, H, show, t[, env]): without env (the probe, the tutorial) the camera is down on the hex already; with env (the page) it flies
  // from env.cam0 over the opening ZIN seconds and back out as env.out goes 0 to 1, the map's own units (env.st) under it
  SH.draw = function (cx, Wc, Hc, show, t, env) {
    var V = SN.V, sc = SH.scene(show, t), first = show.first || {}, at = first.at || [7, 5], camF = V.camTo(at, Wc, Hc), f = 1;
    if (env && env.cam0) { f = ease(Math.min(1, Math.max(0, (t - (env.t0 || 0)) / ZIN))); if (env.out != null) f = Math.min(f, 1 - ease(Math.min(1, env.out))); }
    var cam = f < 1 ? V.lerpCam(env.cam0, camF, f) : camF, mix = Math.max(0, Math.min(1, (f - 0.78) / 0.22)), ids = {};
    Object.keys(sc.units).forEach(function (id) { ids[id] = 1; }); if (first.t === 'head') { if (first.g) ids[first.g.id] = 1; if (first.h) ids[first.h.id] = 1; }
    cx.save();
    V.render(cx, Wc, Hc, cam, env ? env.st : null, env ? env.frame || 0 : 0, { hide: mix >= 1 ? ids : null, fade: { ids: ids, a: 1 - mix }, labels: f < 0.4 });
    if (mix >= 1) { scene(cx, Wc, Hc, cam, sc, at); overlay(cx, Wc, Hc, sc); }
    else if (mix > 0) {
      if (!off) off = document.createElement('canvas'); if (off.width !== Wc || off.height !== Hc) { off.width = Wc; off.height = Hc; }
      var ox = off.getContext('2d'); ox.clearRect(0, 0, Wc, Hc); ox.imageSmoothingEnabled = false; scene(ox, Wc, Hc, cam, sc, at); overlay(ox, Wc, Hc, sc);
      cx.globalAlpha = mix; cx.drawImage(off, 0, 0); cx.globalAlpha = 1;
    }
    cx.restore();
    return sc;
  };
  // the fight's figures and effects on the hex, in the canvas's own pixels
  function scene(cx, Wc, Hc, cam, sc, at) {
    var V = SN.V, pr = V.proj(cam, Wc, Hc), hw = V.world(at), he = V.elev(at), z = cam.z, figH = z * 0.17, kk = figH / 56, zs = z / 440, i;
    var P = function (lx, ly) { return pr(hw[0] + lx, hw[1] + ly, he); };
    cx.imageSmoothingEnabled = false;
    if (sc.head) { drawHead(cx, sc, P, kk); return; }
    var L = layout(sc), all = [];
    Object.keys(sc.units).forEach(function (id) {
      var U = sc.units[id], Lu = L[id]; if (!Lu || (U.gone && U.alpha <= 0)) return;
      var face = sheetDir(U.fall ? V.DIRV[U.fall.dir >= 0 ? U.fall.dir : (Lu.face + 3) % 6] : Lu.f), lunge = U.anim === 'attack' ? 0.035 * Math.sin(Math.min(1, (U.animT || 0) * 2) * Math.PI) : 0;
      figsOf(U, Lu).forEach(function (fg, j) {
        var q = P(fg.lx + Lu.f[0] * lunge, fg.ly + Lu.f[1] * lunge), shake = U.shake ? Math.sin(sc.t * 60 + j) * 4 * U.shake * zs : 0;
        all.push({ y: q[1], draw: function () {
          var anim = U.anim || (U.fall ? 'walk' : sc.enter > 0.02 && U.u.from >= 0 ? 'walk' : 'idle'), tt = U.anim ? U.animT : sc.t + j * 0.13;
          if (U.hurt > 0 && !U.anim) { anim = 'hurt'; tt = (1 - U.hurt) * 0.6; }
          figure(cx, fg.sheet, anim, face, q[0] + shake, q[1], kk * (fg.hero ? 1.12 : 1), tt + j * 0.05, anim === 'attack' || anim === 'hurt', U.alpha);
        } });
      });
    });
    all.sort(function (a, b) { return a.y - b.y; }).forEach(function (d) { d.draw(); });
    // the witness: figures running in from behind the winner
    sc.runners.forEach(function (rn) {
      var Lw = L[rn.to]; if (!Lw) return;
      for (i = 0; i < Math.min(4, rn.n * 2); i++) { var q = Math.min(1, rn.p * 1.4 - i * 0.08); if (q <= 0) continue; var d0 = 1.1 - 0.9 * q, o = (i - 1.5) * 0.08;
        var pt = P(Lw.ax - Lw.f[0] * d0 + Lw.r[0] * o, Lw.ay - Lw.f[1] * d0 + Lw.r[1] * o); figure(cx, rn.sheets[i % rn.sheets.length] || 'gnoll_p2', 'walk', sheetDir(Lw.f), pt[0], pt[1], kk, sc.t + i * 0.2, false, q < 0.95 ? 1 : 1 - (q - 0.95) * 20); }
    });
    // effects: fire, the bolt, the minus, words -- over the struck unit
    sc.fx.forEach(function (fx) {
      var Lt = L[fx.u]; if (!Lt) return; var q = P(Lt.ax, Lt.ay), x = q[0], y = q[1] - figH * 0.6;
      if (fx.kind === 'fire') { cx.globalAlpha = 1 - fx.p; for (var r = 0; r < 3; r++) { cx.fillStyle = ['#ffe08a', '#ff9a3a', '#d0401a'][r]; cx.beginPath(); cx.arc(x, y, Math.max(2, (30 + fx.p * 90 - r * 22) * zs), 0, Math.PI * 2); cx.fill(); } cx.globalAlpha = 1; }
      if (fx.kind === 'bolt') { var Lf = L[fx.from], pf = Lf ? P(Lf.ax, Lf.ay) : [Wc / 2, Hc / 2], x0 = pf[0], y0 = pf[1] - figH * 0.7;
        cx.globalAlpha = 1 - fx.p * 0.8; cx.strokeStyle = '#fff6a0'; cx.lineWidth = Math.max(2, 5 * zs); cx.shadowColor = '#ffe08a'; cx.shadowBlur = 14; cx.beginPath(); cx.moveTo(x0, y0);
        for (var zz = 1; zz <= 6; zz++) { var g = zz / 6; cx.lineTo(x0 + (x - x0) * g + (zz < 6 ? Math.sin(zz * 7.3 + sc.t * 30) * 14 * zs : 0), y0 + (y - y0) * g + (zz < 6 ? Math.cos(zz * 5.1) * 10 * zs : 0)); }
        cx.stroke(); cx.shadowBlur = 0; cx.globalAlpha = 1; }
      if (fx.kind === 'minus') text(cx, '-' + fx.n, x, y - figH * 0.9 - fx.p * 30 * zs, Math.max(16, Math.round(30 * zs)), '#ff6a5a');
      if (fx.kind === 'word') text(cx, fx.text, x, y - figH * 1.1, Math.max(14, Math.round(24 * zs)), '#ffd25a');
    });
  }
  // the head on the map, no one of ours there (his rule): GreyFang and the Harbinger on the hex's own ground, the Harbinger in from the side he came
  function drawHead(cx, sc, P, kk) {
    var h = sc.head, p = h.p, b = h.b, D = SN.V.DIRV, from = b.h && b.h.from >= 0 ? b.h.from : 3, d = D[from];
    if (b.around) return;
    var g = P(0.12, 0.04), s0 = 0.75 - Math.min(1, p * 2.5) * 0.55, hq = P(0.12 + d[0] * s0, 0.04 + d[1] * s0), toG = [-d[0], -d[1]];
    var fallen = p > 0.55, gA = fallen ? Math.max(0, 1 - (p - 0.75) * 4) : 1;
    figure(cx, 'greyfang_p1', fallen ? 'hurt' : 'idle', sheetDir(d), g[0], g[1], kk * 1.5, fallen ? (p - 0.55) * 3 : sc.t, fallen, gA);
    figure(cx, 'mirrorgnoll_p1', p > 0.4 && p < 0.7 ? 'attack' : p < 0.4 ? 'walk' : 'idle', sheetDir(toG), hq[0], hq[1], kk * 1.5, p > 0.4 ? (p - 0.4) * 3 : sc.t, p > 0.4 && p < 0.7, 1);
  }
  // on the screen over it: the night, the rosters, the dice, the banner
  function overlay(cx, Wc, Hc, sc) {
    if (sc.dark) { cx.fillStyle = 'rgba(10,10,40,' + sc.dark + ')'; cx.fillRect(0, 0, Wc, Hc); }
    var k = Math.min(Wc / W0, Hc / H0); cx.save(); cx.translate((Wc - W0 * k) / 2, (Hc - H0 * k) / 2); cx.scale(k, k);
    if (sc.head) { if (sc.head.p > 0.6 || sc.head.b.around) { cx.fillStyle = 'rgba(12,10,16,0.78)'; cx.fillRect(0, 26, W0, 66); text(cx, 'THE HEAD', W0 / 2, 58, 28, '#ff9a8a'); text(cx, '"The Mane is mine."', W0 / 2, 84, 17, '#f3e7c0'); } cx.restore(); return; }
    // the roster: each side's units and their figures, in its top corner (the one rolling now lit), with its formation
    var rolling = {}; sc.dice.forEach(function (dd) { rolling[dd.u] = 1; });
    ['ours', 'theirs'].forEach(function (side) {
      var ids = sc.order[side], y = 112, x = side === 'ours' ? 16 : W0 - 16, al = side === 'ours' ? 'left' : 'right';
      text(cx, side === 'ours' ? 'OURS' : 'THEIRS', x, y - 4, 13, side === 'ours' ? '#9ff0dc' : '#ffb898', al);
      ids.forEach(function (id, i) {
        var U = sc.units[id], nm = U.u.party ? 'the four' : U.u.name, hs = U.heroes.filter(function (h) { return !h.dead; }).length;
        cx.globalAlpha = U.gone ? 0.35 : 1;
        text(cx, nm + (U.u.party ? '' : ' -- ' + U.figs) + (hs && !U.u.party ? ' +' + hs + '★' : '') + (U.u.party ? '' : ' (' + (U.u.form || 'line') + ')'), x, y + 16 + i * 17, 12, rolling[id] ? '#ffe08a' : U.gone ? '#9a94a8' : '#f3e7c0', al);
        cx.globalAlpha = 1;
      });
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
    if (sc.banner) { var bp = sc.banner, a = bp.quick ? 1 : Math.min(1, bp.p * 5, (1 - bp.p) * 5 + 0.2); cx.globalAlpha = a; cx.fillStyle = 'rgba(12,10,16,0.78)'; cx.fillRect(0, 26, W0, bp.small ? 66 : 46); text(cx, bp.big, W0 / 2, 58, 26, '#ffe08a'); if (bp.small) text(cx, bp.small, W0 / 2, 82, 15, '#e8d8a0'); cx.globalAlpha = 1; }
    if (SH.hint !== false) text(cx, 'SPACE skips this fight  ·  Esc the rest of the day', W0 - 12, H0 - 10, 12, '#9a94a8', 'right');
    cx.restore();
  }

  // ---------------------------------------------------------------- the witness on the map, the camera back out: from each giver's hex its figures run
  // to the winner's, under the banner (p 0..1; the map's units as they now stand, the figures already moved)
  var WITD = 1.8;
  SH.drawWit = function (cx, Wc, Hc, show, p, env) {
    var V = SN.V, st = env.st, cam = env.cam0, pr = V.proj(cam, Wc, Hc), z = cam.z, kk = Math.min(84, z * 0.58) / 56;
    V.render(cx, Wc, Hc, cam, st, env.frame || 0, {});
    var lines = [];
    (show.wit || []).forEach(function (b, wi) {
      var G = SN.unit(st, b.from), Wn = SN.unit(st, b.to); if (!G || !Wn) return;
      var a = V.center0(pr, G.at), c = V.center0(pr, Wn.at), dx = c[0] - a[0], dy = c[1] - a[1], face = sheetDir([dx, dy / V.SQ]);
      lines.push(b.fromName + ' saw it: ' + b.n + (b.n > 1 ? ' figures go' : ' figure goes') + ' over to ' + Wn.name);
      for (var i = 0; i < Math.min(5, b.n * 2); i++) {
        var q = p * 1.6 - i * 0.12 - wi * 0.1; if (q <= 0 || q >= 1) continue; var j = (i % 3 - 1) * z * 0.18;
        figure(cx, (b.sheets || [])[i % Math.max(1, (b.sheets || []).length)] || 'gnoll_p2', 'walk', face, a[0] + dx * q - dy / (Math.abs(dx) + Math.abs(dy) + 1) * j, a[1] + dy * q + dx / (Math.abs(dx) + Math.abs(dy) + 1) * j * 0.6, kk, p * 3 + i * 0.2, false, q > 0.9 ? (1 - q) * 10 : 1);
      }
    });
    var k = Math.min(Wc / W0, Hc / H0); cx.save(); cx.translate((Wc - W0 * k) / 2, (Hc - H0 * k) / 2); cx.scale(k, k);
    cx.globalAlpha = Math.min(1, p * 6, (1 - p) * 6 + 0.3); cx.fillStyle = 'rgba(12,10,16,0.78)'; cx.fillRect(0, 26, W0, 46 + lines.length * 20);
    text(cx, 'WITNESS', W0 / 2, 58, 26, '#ffe08a'); lines.forEach(function (l, i) { text(cx, l, W0 / 2, 82 + i * 20, 15, '#e8d8a0'); }); cx.globalAlpha = 1; cx.restore();
  };

  // ---------------------------------------------------------------- playing a show on the page: the camera flies in, the fight, the camera flies out
  SH.skipDay = false;
  SH.play = function (st, from, to, at, done) {
    var show = SH.build(st, from, to, at);
    if (!show.segs.length || SH.skipDay || show.total - show.startT < 0.2) { done(); return; }
    var cv = document.getElementById('show'), map = document.getElementById('map'), V = SN.V;
    cv.width = map.width; cv.height = map.height; cv.style.left = map.style.left || '0px'; cv.style.top = map.offsetTop + 'px'; cv.style.display = 'block';
    var cx = cv.getContext('2d'), now = function () { return performance.now() / 1000; }, t0 = now() - show.startT, tEnd = null, tW = null, jump = false, ended = false, speed = /[?&]watch\b/.test(location.search) ? 1.6 : 1;
    var env = { st: st, cam0: { x: V.cam.x, y: V.cam.y, z: V.cam.z }, t0: show.startT, frame: 0, out: null };
    function end() { if (ended) return; ended = true; document.removeEventListener('keydown', key, true); cv.removeEventListener('click', click); cv.style.display = 'none'; done(); }
    function key(e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopImmediatePropagation(); t0 = -1e9; jump = tW != null; } else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); SH.skipDay = true; t0 = -1e9; } else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); } }
    function click() { t0 = -1e9; jump = tW != null; }
    document.addEventListener('keydown', key, true); cv.addEventListener('click', click);
    (function tick() {
      if (ended) return;
      var t = Math.min(show.total, (now() - t0) * speed);
      if (t >= show.total) { if (tEnd == null) tEnd = now(); env.out = (now() - tEnd) * speed / ZOUT; }
      env.frame++;
      try {
        if (env.out != null && env.out >= 1) { // (back out: the witness, if the fight drew one, then the day goes on)
          if (!show.wit.length || SH.skipDay || jump) return end();
          if (tW == null) tW = now(); var pw = (now() - tW) * speed / WITD;
          SH.drawWit(cx, cv.width, cv.height, show, Math.min(1, pw), env); if (pw >= 1) return end();
        } else SH.draw(cx, cv.width, cv.height, show, t, env);
      } catch (e) { console.error(e); return end(); }
      // the next frame, or a tenth of a second, whichever comes first: a window that is not painting (minimized, covered) gives no frames
      // though the page counts as shown, and the day must not stall mid-show (found 10-14 night in the pane)
      var fired = false, go = function () { if (!fired) { fired = true; tick(); } };
      requestAnimationFrame(go); setTimeout(go, 100);
    })();
  };
})();
