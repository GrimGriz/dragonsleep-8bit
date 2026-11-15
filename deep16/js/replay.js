/* THE MARKERS' REPLAY (the markers-replay seat, 2026-11-15; the clock lane's 2026-11-15 sections). His words, to the lanes desk: "there's the makings and the markers
   for the snoot hidden for the players that use rolls every dawn, can I get a replay that shows those markers based of the quest walk runs?". A seats' view and his, NEVER
   A PLAYER'S (his 11-12 "nothing player visible": the markers stay hidden in the game): deep16/?world&replay=<name> opens THE WORLD bare -- &far &fresh &noenc, no game's
   party, nothing walked, nothing saved -- and plays over it one run of the quest walk (dev/bench16.js mode=questwalk1114, its recorder RQ; the file walk-replays/<name>.json,
   written by dev/bench16.py beside the run's log). deep16/?world&replay alone lists the runs there (walk-replays/index.json).

   WHAT IS DRAWN, by the hour the replay stands at (the key on screen names each mark; 1-4 turn a look off and on):
   1 THE PARTY -- its track hex by hex on THE WORLD (gold, the hexes still to walk faint), a try lost and reloaded (red, dashed, its end crossed), and every fight on its
     hex: the road's (white; magenta when mirror-made), and the floors' and the Hex's (a small dot at the place, their count).
   2 THE MAKINGS -- each making's marker (a diamond, its day on it) where js/hunger.js says it stands since the last dawn, the ring its reach (the mirror-made entry's ground),
     its walk since he made it, withered dim, charged ringed yellow; a farm it fed on (a magenta square); Mr. Ripples himself (the debug view's cross, js/world.js W.drawVessel).
   3 THE SURVIVORS -- each band on its way (teal, a line to where it is going) and how many are in at Silverton, the inn and the Pit; a band the party met, ringed.
   4 THE SNOOT'S ROAD -- each snooting band (a triangle, how many are left of it; on fire at a farm), its road since it set out, every farm it burned (red), a band met, ringed.
   The frames are the recorder's, one at each roll hour (06:00, the dawn the makings feed and step; 10:00 and 14:00, the bands' other steps): between two the marks stand as
   the last left them, but for the survivors, who walk their straight road at a cart's pace. NOTHING IS ROLLED HERE: the file is read and drawn, and the walk's own world
   state (js/world.js S) is the bare door's, moved to the party's hex and the replay's hour so the land's banner and sky follow.

   ← → a dawn · , . an hour · SPACE plays (↑ ↓ the speed) · C the party · the wheel or - = zooms · a drag pans · 1-4 the looks · L folds the key · X the list. */
'use strict';
(function () {
  var D = window.D16, W = D.world, I = D.input, SQ3 = Math.sqrt(3);
  if (!W) return;
  var RP = D.replay = { on: false, scene: null, data: null, name: null, list: null, err: null, t: 0, play: false, rate: 0.05, fold: false, looks: [true, true, true, true], hovers: [], ui: [] };
  RP.DIRS = ['../walk-replays/', '/walk-replays/']; // (the page's folder up, then the server's root: a worktree's page on 8923 finds the shared checkout's files)
  RP.LOOKS = ['THE PARTY', 'THE MAKINGS', 'THE SURVIVORS', 'THE SNOOT\'S ROAD'];
  var C = RP.COL = { party: '#f8d878', partyFar: 'rgba(248,216,120,.22)', lost: '#e8503c', made: '#ee58d0', madeDim: '#9a4c8c', charged: '#fff04a', ripples: '#ff60e0', hit: '#b03ca0',
    sv: '#4ee0d4', snoot: '#ff8c30', burned: '#e0301c', road: '#ffffff', mirror: '#ff78ec', fight: '#c8c4b8', gone: '#8a8a96' };

  // ---------------------------------------------------------------- THE RECORDING'S FRAME (dev/bench16.js's recorder calls this at each roll hour; the gate's mode=replay1115 too)
  // what js/hunger.js and js/snootroad.js say stands where at the hour T: read only -- HG.sim and SR.sim are hashes of the save's seed and draw nothing of D.rand; no W.save
  function R2(x) { return Math.round(x * 100) / 100; }
  RP.memo = function () { return { farms: null, used: {}, hitBy: {}, refs: {} }; };
  function farmOf(mo, id) {
    if (!mo.farms) { mo.farms = {}; var FM = D.hunger && D.hunger.farms ? D.hunger.farms() : {}; Object.keys(FM).forEach(function (k) { var q = k.split(',').map(Number); FM[k].forEach(function (f) { mo.farms[f.id] = [q[0], q[1], f.kind]; }); }); }
    mo.used[id] = 1; return mo.farms[id] || null;
  }
  function refOf(mo, r) { if (!r || mo.refs[r.id]) return; mo.refs[r.id] = { from: [R2(r.from[0]), R2(r.from[1])], to: [R2(r.toPt[0]), R2(r.toPt[1])], t0: R2(r.t0), arr: R2(r.arrive), site: r.to, kind: r.kind, zone: r.zone, of: r.band || (r.day != null ? 'day ' + r.day : '?') }; }
  RP.snap = function (T, mo) {
    var HG = D.hunger, SR = D.snootroad, MW = W.Mworld(), f = { t: R2(T) };
    if (HG && HG.on && HG.sim) {
      var R = HG.sim(T), dn = Math.floor((T - HG.DAWN) / 24), T0 = dn * 24 + HG.DAWN, dawn = Math.abs(T - T0) < 1e-6;
      f.made = W.makings(T).map(function (m) {
        var x = R.by[m.day] || {}, tr = x.trail || [], last = tr[tr.length - 1], o = { d: m.day, hex: m.hex, at: m.hex0 || m.hex, st: m.state, reach: Math.round(m.reach * 10) / 10, zone: W.makingZone(m) };
        if (m.charged) o.charged = 1;
        if (x.fed != null && x.fed > m.t) o.fedAt = R2(x.fed); // (the hour its count runs from: a dawn's feeding, or a fight's -- W.madeFed)
        if (dawn && last && last.dn === dn && last.fed) { // (it fed at this dawn, in the hex it stood in before its step on)
          var fh = tr.length > 1 ? tr[tr.length - 2].hex : (m.hex0 || m.hex), hit = Object.keys(R.hit).filter(function (id) { var fm = farmOf(mo, id); return R.hit[id] === T0 && fm && fm[0] === fh[0] && fm[1] === fh[1]; })[0];
          o.fed = { hex: fh, on: hit ? farmOf(mo, hit)[2] : MW.road[W.K(fh[0], fh[1])] ? 'road' : 'wild' }; if (hit) { o.fed.farm = hit; mo.hitBy[hit] = m.day; }
        }
        return o;
      });
      f.hit = Object.keys(R.hit).map(function (id) { farmOf(mo, id); return [id, R2(R.hit[id]), mo.hitBy[id] || 0]; });
      var v = W.vesselAt(T), tk = W.vesselTaking ? W.vesselTaking(T) : null; if (v) { f.ripples = { hex: v.hex, pt: [R2(v.pt[0]), R2(v.pt[1])] }; if (v.held) f.ripples.held = 1; if (tk && !tk.over) f.ripples.taking = 1; }
      R.ref.forEach(function (r) { refOf(mo, r); });
      f.sv = HG.refugees(T).map(function (r) { refOf(mo, r); return r.there ? [r.id, 1] : [r.id]; }); // (on the way, or in at the refuge: HG.refugees, the Snoot's burnt-out with them)
    }
    if (SR && SR.on && SR.sim) {
      var RS = SR.sim(T); RS.ref.forEach(function (r) { refOf(mo, r); });
      f.snoot = SR.bands(T).map(function (x) { var o = { id: x.id, hex: x.hex, n: x.n }; if (x.gone) o.gone = 1; if (x.busy) o.busy = 1; if (x.moving) o.moving = 1; if (x.burned) o.burned = x.burned; return o; });
      f.burned = Object.keys(RS.burned).filter(function (id) { return RS.burned[id] <= T; }).map(function (id) {
        var fm = farmOf(mo, id), by = 0; Object.keys(RS.by).some(function (bid) { return (RS.by[bid].trail || []).some(function (s) { if (s.T === RS.burned[id] && s.found && fm && s.hex[0] === fm[0] && s.hex[1] === fm[1]) { by = bid; return true; } return false; }); });
        return [id, R2(RS.burned[id]), by];
      });
    }
    return f;
  };
  RP.farmsUsed = function (mo) { var out = {}; Object.keys(mo.used).forEach(function (id) { if (mo.farms && mo.farms[id]) out[id] = mo.farms[id]; }); return out; };

  // ---------------------------------------------------------------- THE DOOR
  RP.make = function (q, data) { // (data: a replay in hand -- the gate's -- else the file named by &replay=)
    var m = /[?&]replay=([^&]*)/.exec(q || ''); RP.name = m && m[1] ? decodeURIComponent(m[1]) : null;
    var sc = W.make(String(q || '') + '&far&fresh&noenc'); RP.scene = sc; RP.on = true; RP.data = null; RP.err = null; RP.list = null; RP.play = false;
    if (data) RP.set(data, RP.name || data.name); else if (RP.name) RP.load(RP.name); else RP.loadList();
    return sc;
  };
  function fetchJSON(paths, ok, bad) {
    var i = 0; (function next() {
      if (i >= paths.length) { bad(); return; } var p = paths[i++], x = new XMLHttpRequest();
      try { x.open('GET', p + (p.indexOf('?') < 0 ? '?' : '&') + 'n=' + Date.now()); } catch (e) { next(); return; }
      x.onload = function () { if (x.status === 200 || (x.status === 0 && x.responseText)) { var j = null; try { j = JSON.parse(x.responseText); } catch (e) { RP.err = 'Not a replay: ' + p; return; } ok(j, p); } else next(); };
      x.onerror = next; x.send();
    })();
  }
  RP.load = function (name) {
    var file = /\.json$/.test(name) ? name : name + '.json', paths = /\//.test(name) ? [file] : RP.DIRS.map(function (d) { return d + file; });
    RP.err = null; RP.loading = name; RP.data = null;
    fetchJSON(paths, function (j) { RP.loading = null; RP.set(j, name); }, function () { RP.loading = null; RP.err = 'No replay "' + name + '" in walk-replays/.'; });
  };
  RP.loadList = function () {
    RP.err = null; RP.loading = 'the list';
    fetchJSON(RP.DIRS.map(function (d) { return d + 'index.json'; }), function (j) { RP.loading = null; RP.list = { items: j || [], sel: 0, top: 0 }; }, function () { RP.loading = null; RP.err = 'No walk-replays/index.json yet: a quest walk writes it (dev/bench16.py, mode=questwalk1114).'; });
  };

  // ---------------------------------------------------------------- the file, indexed
  function hexPt(q, r) { var w = RP.w || 5; return [w * (q + r / 2), w * SQ3 / 2 * r]; }
  function clockOf(t) { var h = ((t % 24) + 24) % 24, hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return ('0' + (hh % 24)).slice(-2) + ':' + ('0' + mm).slice(-2); }
  function dayOf(t) { return Math.floor(t / 24) + 1; }
  function stamp(t) { return 'D' + dayOf(t) + ' ' + clockOf(t); }
  RP.stamp = stamp;
  function hexS(h) { return h ? h[0] + ',' + h[1] : '?'; }
  function ptOf(e) { return e[5] != null ? [e[5], e[6]] : hexPt(e[1], e[2]); } // (a track entry's point in miles: where the party stood, the area's finer hexes kept)
  function lastAt(list, t, key) { var lo = 0, hi = list.length - 1, best = -1; while (lo <= hi) { var mid = (lo + hi) >> 1; if (key(list[mid]) <= t + 1e-6) { best = mid; lo = mid + 1; } else hi = mid - 1; } return best; }
  RP.set = function (j, name) {
    var d = RP.data = j; RP.name = name || j.name || '?'; RP.list = null; RP.err = null; RP.w = j.hexMi || 5;
    var byT = function (a, b) { return a[0] - b[0]; };
    d.canon = (d.track || []).filter(function (e) { return e[4] == null; }).map(function (e, i) { return [e[0], e[1], e[2], e[3], i, e[5], e[6]]; }).sort(function (a, b) { return a[0] - b[0] || a[4] - b[4]; }); // ([hour, q, r, where, its order, x, y])
    d.lostBr = {}; (d.track || []).forEach(function (e) { if (e[4] != null) (d.lostBr[e[4]] = d.lostBr[e[4]] || []).push(e); });
    d.frames = (d.frames || []).slice().sort(function (a, b) { return a.t - b.t; });
    d.meets = (d.meets || []).filter(function (m, i, all) { var p = all[i - 1]; return !(p && p.k === m.k && Math.abs(p.t - m.t) < 0.02 && String(p.hex) === String(m.hex) && p.s === m.s); }); d.refs = d.refs || {}; // (a game lost written twice at one minute, once) d.farms = d.farms || {}; d.bands = d.bands || []; d.rewinds = d.rewinds || [];
    d.bandOf = {}; d.bands.forEach(function (b) { d.bandOf[b.id] = b; });
    var ts = [d.canon.length ? d.canon[0][0] : null, d.frames.length ? d.frames[0].t : null].filter(function (x) { return x != null; });
    d.t0 = ts.length ? Math.min.apply(null, ts) : 0;
    d.t1 = Math.max(d.t0, d.canon.length ? d.canon[d.canon.length - 1][0] : 0, d.frames.length ? d.frames[d.frames.length - 1].t : 0);
    // the makings' and the bands' roads, frame by frame
    d.madeTr = {}; d.bandTr = {};
    d.frames.forEach(function (f) {
      (f.made || []).forEach(function (m) { var tr = d.madeTr[m.d] = d.madeTr[m.d] || [[f.t, m.at]]; var l = tr[tr.length - 1][1]; if (l[0] !== m.hex[0] || l[1] !== m.hex[1]) tr.push([f.t, m.hex]); });
      (f.snoot || []).forEach(function (b) { var tr = d.bandTr[b.id] = d.bandTr[b.id] || []; var l = tr.length ? tr[tr.length - 1][1] : null; if (!l || l[0] !== b.hex[0] || l[1] !== b.hex[1]) tr.push([f.t, b.hex]); });
    });
    // the feed: what the markers did at each roll hour, every meeting, and the walk's own log (the lost tries' lines left out)
    var ev = [], prev = null, nm = function (bid) { var b = d.bandOf[bid]; return b ? b.name : bid; };
    d.frames.forEach(function (f) {
      var pm = {}; ((prev && prev.made) || []).forEach(function (m) { pm[m.d] = m; });
      (f.made || []).forEach(function (m) {
        if (m.fed) ev.push({ t: f.t, c: C.made, look: 1, s: 'the day-' + m.d + ' making fed on ' + ({ farm: 'a farm', hamlet: 'a hamlet', road: 'the road', wild: 'the wild' }[m.fed.on] || m.fed.on) + ' at ' + hexS(m.fed.hex) + (m.charged ? ', and is charged' : '') });
        var p = pm[m.d]; if (!p && f !== d.frames[0]) ev.push({ t: f.t, c: C.made, look: 1, s: 'Mr. Ripples makes: the day-' + m.d + ' making at ' + hexS(m.at) + ' (' + (m.zone || '?') + ')' });
        if (p && p.st !== m.st && m.st !== 'normal') ev.push({ t: f.t, c: C.madeDim, look: 1, s: 'the day-' + m.d + ' making is ' + (m.st === 'gone' ? 'gone, four days unfed' : m.st) });
      });
      var pb = {}, nb = {}; ((prev && prev.burned) || []).forEach(function (b) { pb[b[0]] = 1; });
      (f.burned || []).forEach(function (b) { if (!pb[b[0]]) { var fm = d.farms[b[0]], k = b[2] + '|' + (fm ? hexS(fm) : '?'); nb[k] = (nb[k] || 0) + 1; } });
      Object.keys(nb).forEach(function (k) { var p2 = k.split('|'); ev.push({ t: f.t, c: C.burned, look: 3, s: nm(p2[0]) + ' burned ' + (nb[k] > 1 ? nb[k] + ' farms' : 'a farm') + ' at ' + p2[1] }); });
      (f.snoot || []).forEach(function (b) { var q = ((prev && prev.snoot) || []).filter(function (x) { return x.id === b.id; })[0]; if (!q && f !== d.frames[0]) ev.push({ t: f.t, c: C.snoot, look: 3, s: nm(b.id) + ' is out, at ' + hexS(b.hex) }); });
      prev = f;
    });
    Object.keys(d.refs).forEach(function (id) { var r = d.refs[id]; if (!d.frames.some(function (f) { return (f.sv || []).some(function (x) { return x[0] === id; }); })) return; ev.push({ t: r.t0, c: C.sv, look: 2, s: 'survivors set out (' + (r.kind || '?') + ', ' + (r.zone === 'snoot' ? 'burnt out' : 'the ' + String(r.of).replace('day ', 'day-') + ' making') + ') for ' + ({ inn: 'the inn', pit: 'the Pit', silverton: 'Silverton' }[r.site] || r.site) }); });
    var MK = { road: ['met on the road', C.road, 0], mirror: ['MET MIRROR-MADE', C.mirror, 0], survivors: ['SURVIVORS MET', C.sv, 2], snoot: ['A SNOOTING BAND MET', C.snoot, 3], lost: ['THE GAME LOST', C.lost, 0], fight: ['a fight', C.fight, 0] };
    d.meets.forEach(function (m) { if (m.lost != null && m.k !== 'lost') return; var mk = MK[m.k] || [m.k, C.fight, 0]; if (m.k === 'fight') return; ev.push({ t: m.t, c: mk[1], look: mk[2], s: m.k === 'lost' ? 'THE GAME LOST at ' + hexS(m.hex) + ', ' + RP.place(String(m.s).replace(/^THE GAME IS LOST on /, '').replace(/^THE WORLD .*/, 'THE WORLD')) + ': the last save loaded' : mk[0] + ' at ' + hexS(m.hex) + ': ' + m.s + (m.res ? ' -> ' + String(m.res).toUpperCase() : '') }); });
    (d.log || []).forEach(function (l, i) {
      var mm = /^D(\d+) (\d\d):(\d\d) (.*)$/.exec(l) || /^DAY (\d+) -- D\d+ (\d\d):(\d\d)(.*)$/.exec(l); if (!mm) return;
      var t = (+mm[1] - 1) * 24 + +mm[2] + +mm[3] / 60, rest = mm[4];
      if (d.rewinds.some(function (rw) { return i < rw.ql && t > rw.t + 1e-6; })) return; // (a lost try's line)
      if (/^(MET on THE WORLD|SURVIVORS met|A SNOOTING BAND|FIGHT|THE GAME IS LOST)/.test(rest.trim())) return; // (the meetings above say these)
      ev.push({ t: t, c: '#a8a4b8', look: -1, s: (/^DAY /.test(l) ? 'DAY ' + mm[1] + ':' : '') + rest.trim() });
    });
    ev.forEach(function (e, i) { e.i = i; }); ev.sort(function (a, b) { return a.t - b.t || a.i - b.i; }); d.events = ev;
    RP.t = d.t0; RP.play = false; RP.fit();
    return d;
  };

  // ---------------------------------------------------------------- the state at the hour
  RP.frameAt = function (t) { var d = RP.data, i = lastAt(d.frames, t, function (f) { return f.t; }); return d.frames[Math.max(0, i)] || null; };
  RP.partyAt = function (t) { var d = RP.data, i = lastAt(d.canon, t, function (e) { return e[0]; }); return d.canon[Math.max(0, i)] || null; };
  RP.PLACES = { silverton: 'Silverton', hex: 'the Hex', warrens: 'the Crawler Warrens', galleries: 'the Guano Galleries', glowseep: 'the Glowseep', webgulch: 'Web Gulch', halfway: 'the Halfway Inn', inn: 'the Halfway Inn', camp: 'a camp' };
  RP.place = function (w) { // (the walk's floor key as a place's name: galleries_g3 the Guano Galleries, room:shop:marko Marko's in town)
    if (!w) return '?'; if (w === 'THE WORLD') return 'on THE WORLD'; if (/^the Hex/.test(w)) return w;
    var rm = /^room:([a-z]+)(?::([a-z]+))?/.exec(w); if (rm) return (rm[2] ? rm[2].charAt(0).toUpperCase() + rm[2].slice(1) + '\'s' : rm[1]) + ', in town';
    var k = String(w).split(/[_ ]/)[0]; return RP.PLACES[k] || String(w).replace(/_/g, ' ');
  };
  RP.whereAt = function (t) { var d = RP.data, i = lastAt(d.canon, t, function (e) { return e[0]; }), e0 = d.canon[Math.max(0, i)]; for (; i >= 0; i--) if (d.canon[i][3]) return RP.place(d.canon[i][3]) + (e0 ? ', ' + hexS([e0[1], e0[2]]) : ''); return '?'; };
  RP.svAt = function (t) { // (every band of survivors out at the hour: its point on its road, in at its refuge or not)
    var d = RP.data, f = RP.frameAt(t), out = [], stay = d.stay || 48; if (!f) return out;
    (f.sv || []).forEach(function (x) { var r = d.refs[x[0]]; if (!r || t < r.t0 - 1e-6 || t >= r.arr + stay) return; var u = Math.max(0, Math.min(1, (t - r.t0) / Math.max(1e-6, r.arr - r.t0))); out.push({ id: x[0], r: r, pt: [r.from[0] + (r.to[0] - r.from[0]) * u, r.from[1] + (r.to[1] - r.from[1]) * u], there: t >= r.arr }); });
    return out;
  };
  RP.seek = function (t) { var d = RP.data; if (!d) return; RP.t = Math.max(d.t0, Math.min(d.t1, t)); };
  RP.dawnStep = function (k) { // (to the next dawn, or back to the last before the hour)
    var t = RP.t, DW = 6, n = Math.floor((t - DW) / 24); if (k > 0) RP.seek((n + 1) * 24 + DW); else RP.seek(Math.abs(t - (n * 24 + DW)) < 1e-6 ? (n - 1) * 24 + DW : n * 24 + DW);
  };
  RP.apply = function () { // (the bare door's world state on the replay's hour: the sky follows; its own banner stood off the map, the replay draws the party's at its point; never saved)
    var S = W.state(); if (!S) return; S.t = RP.t; S.at = [-999, -999];
  };
  RP.fit = function () { // (the camera on everything the run drew, at the closest zoom whose drawing of it -- the land's height lifting the hills -- fits between the title, the key and the feed)
    var sc = RP.scene, d = RP.data; if (!sc || !d || !sc.cam) return;
    var pts = []; (d.track || []).forEach(function (e) { pts.push(ptOf(e)); });
    d.frames.forEach(function (f) { (f.made || []).forEach(function (m) { if (m.st !== 'gone') pts.push(hexPt(m.hex[0], m.hex[1])); }); (f.snoot || []).forEach(function (b) { pts.push(hexPt(b.hex[0], b.hex[1])); }); });
    var MW = W.Mworld(); (MW ? MW.sites : []).forEach(function (s) { if (/^(silverton|inn|pit)$/.test(s.id)) pts.push([s.x, s.y]); });
    if (!pts.length) return;
    var ZS = sc.zooms(), TL = W.TILT || 0.62, A = [10, 34, D.W - 162, D.H - 78], xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    sc.cam.cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2; sc.cam.cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var box = function (zi) { sc.zi = zi; var cam = sc.camObj(), b = [1e9, 1e9, -1e9, -1e9]; pts.forEach(function (p) { var q = W.groundAt(cam, p[0], p[1]); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1] - 16); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; }; // (16: a banner's height)
    var zi = 0; for (var i = 0; i < ZS.length; i++) { var b = box(i); if (b[2] - b[0] <= A[2] - A[0] && b[3] - b[1] <= A[3] - A[1]) zi = i; }
    var bb = box(zi), z = ZS[zi]; sc.cam.cx -= ((A[0] + A[2]) / 2 - (bb[0] + bb[2]) / 2) / z; sc.cam.cy -= ((A[1] + A[3]) / 2 - (bb[1] + bb[3]) / 2) / (z * TL); d.fitted = true;
  };
  RP.center = function () { var sc = RP.scene, e = RP.data && RP.partyAt(RP.t); if (!sc || !e) return; var p = ptOf(e), z = sc.zooms()[sc.zi], TL = W.TILT || 0.62; sc.cam.cx = p[0] + 80 / z; sc.cam.cy = p[1]; };

  // ---------------------------------------------------------------- the hands: the keys, the buttons, the timeline, a drag
  function inR(m, b) { return m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h; }
  RP.update = function (sc) {
    var m = I.mouse, d = RP.data;
    if (RP.list) { // (the runs in walk-replays/)
      var L = RP.list, n = L.items.length;
      if (I.repeat('down')) L.sel = Math.min(n - 1, L.sel + 1); if (I.repeat('up')) L.sel = Math.max(0, L.sel - 1);
      if (m.click) RP.ui.forEach(function (b) { if (b.row != null && inR(m, b)) { if (L.sel === b.row) RP.load(L.items[b.row].name); L.sel = b.row; } });
      if ((I.pressed('a') || I.pressed('end')) && L.items[L.sel]) RP.load(L.items[L.sel].name);
      return;
    }
    if (!d) { if (I.pressed('b') && !RP.loading) RP.loadList(); return; }
    if (!d.fitted) RP.fit(); // (a replay handed in before THE WORLD laid its camera: the gate's)
    if (I.pressed('b')) { RP.loadList(); return; }
    if (I.pressed('end') || I.pressed('play') || I.pressed('a')) { if (RP.t >= d.t1 - 1e-6) RP.t = d.t0; RP.play = !RP.play; }
    if (I.repeat('right')) { RP.play = false; RP.dawnStep(1); } if (I.repeat('left')) { RP.play = false; RP.dawnStep(-1); }
    if (I.repeat('turnr')) { RP.play = false; RP.seek(RP.t + 1); } if (I.repeat('turnl')) { RP.play = false; RP.seek(RP.t - 1); }
    if (I.pressed('up')) RP.rate = Math.min(0.8, RP.rate * 2); if (I.pressed('down')) RP.rate = Math.max(0.0125, RP.rate / 2);
    ['n1', 'n2', 'n3', 'n4'].forEach(function (k, i) { if (I.pressed(k)) RP.looks[i] = !RP.looks[i]; });
    if (I.pressed('list')) RP.fold = !RP.fold;
    if (I.pressed('center')) RP.center();
    if (sc.fineDoor && W.FINE && I.pressed('dice')) { W.FINE.flip(); sc.zi = Math.min(sc.zi, sc.zooms().length - 1); } // (F: the land raised, or the hex tops -- THE WORLD's own)
    var ZS = sc.zooms(), zi0 = sc.zi; if (m.wheel) sc.zi = Math.max(0, Math.min(ZS.length - 1, sc.zi - m.wheel)); if (I.pressed('zoomin')) sc.zi = Math.min(ZS.length - 1, sc.zi + 1); if (I.pressed('zoomout')) sc.zi = Math.max(0, sc.zi - 1);
    var z = ZS[sc.zi], TL = W.TILT || 0.62;
    if (sc.zi !== zi0 && m.inside) { var z0 = ZS[zi0]; sc.cam.cx += (m.x - D.W / 2) * (1 / z0 - 1 / z); sc.cam.cy += (m.y - D.H / 2) * (1 / (z0 * TL) - 1 / (z * TL)); } // (zoomed about the mouse)
    if (m.panX || m.panY) { sc.cam.cx -= (m.panX || 0) / z; sc.cam.cy -= (m.panY || 0) / (z * TL); m.panX = m.panY = 0; } // (the middle button's drag, js/core.js)
    var onUI = m.inside && RP.ui.some(function (b) { return inR(m, b); });
    if (m.click && m.inside) {
      var hit = RP.ui.filter(function (b) { return inR(m, b); })[0];
      if (hit) { if (hit.go) hit.go(m); RP.drag = null; } else RP.drag = { x: m.x, y: m.y };
    }
    if (RP.drag && m.down && !onUI) { sc.cam.cx -= (m.x - RP.drag.x) / z; sc.cam.cy -= (m.y - RP.drag.y) / (z * TL); RP.drag = { x: m.x, y: m.y }; } else if (!m.down) RP.drag = null;
    if (RP.scrub && m.down) { RP.seek(d.t0 + (d.t1 - d.t0) * Math.max(0, Math.min(1, (m.x - RP.scrub.x) / RP.scrub.w))); } else RP.scrub = null;
    if (RP.play) { RP.t += RP.rate; if (RP.t >= d.t1) { RP.t = d.t1; RP.play = false; } }
    RP.apply();
  };

  // ---------------------------------------------------------------- the drawing (after THE WORLD's land, its places and its sky: the marks stay bright at night)
  function diamond(g, x, y, r, fill, edge) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (edge) { g.strokeStyle = edge; g.lineWidth = 1; g.stroke(); } }
  function tri(g, x, y, r, fill, edge) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (edge) { g.strokeStyle = edge; g.lineWidth = 1; g.stroke(); } }
  function cross(g, x, y, r, col, lw) { g.strokeStyle = col; g.lineWidth = lw || 2; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); g.lineWidth = 1; }
  function ring(g, x, y, r, col, lw) { g.strokeStyle = col; g.lineWidth = lw || 1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function swords(g, x, y, col) { g.strokeStyle = '#05040a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); g.lineWidth = 1; }
  function banner(g, tx, ty0, bob) { var ty = ty0 - bob; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(tx, ty0, 5, 2, 0, 0, 7); g.fill(); g.fillStyle = '#3a2410'; g.fillRect(tx - 1, ty - 15, 2, 15); g.fillStyle = '#d8402c'; g.beginPath(); g.moveTo(tx + 1, ty - 15); g.lineTo(tx + 10, ty - 12); g.lineTo(tx + 1, ty - 8); g.closePath(); g.fill(); g.fillStyle = '#f8d878'; g.fillRect(tx + 2, ty - 13, 2, 2); } // (THE WORLD's own party banner, js/world.js World.draw)
  function square(g, x, y, r, col) { g.fillStyle = '#05040a'; g.fillRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2); g.fillStyle = col; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  RP.glyph = function (g, kind, x, y) { // (the key's marks, drawn as the map's)
    var c = C;
    if (kind === 'track') { g.strokeStyle = c.party; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 6, y + 2); g.lineTo(x - 1, y - 2); g.lineTo(x + 6, y + 1); g.stroke(); g.lineWidth = 1; }
    else if (kind === 'lost') { g.strokeStyle = c.lost; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 2, y); g.stroke(); g.setLineDash([]); cross(g, x + 4, y, 2.5, c.lost, 1.5); }
    else if (kind === 'road') swords(g, x, y, c.road); else if (kind === 'mirror') swords(g, x, y, c.mirror); else if (kind === 'fight') dot(g, x, y, 2, c.fight);
    else if (kind === 'made') { diamond(g, x, y, 5, c.made, '#05040a'); }
    else if (kind === 'reach') { g.strokeStyle = c.made; g.fillStyle = 'rgba(238,88,208,.15)'; g.beginPath(); g.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    else if (kind === 'hit') square(g, x, y, 2, c.hit); else if (kind === 'ripples') cross(g, x, y, 3.5, c.ripples, 2);
    else if (kind === 'sv') { dot(g, x, y, 3, c.sv); } else if (kind === 'met') { ring(g, x, y, 5, '#ffffff', 1.5); }
    else if (kind === 'snoot') tri(g, x, y, 5, c.snoot, '#05040a'); else if (kind === 'burned') square(g, x, y, 2, c.burned);
  };
  RP.KEY = [ // (the key on screen: a look's head, then its marks -- 1-4 or a click turns a look off and on)
    [0, null, 'THE PARTY'], [0, 'track', 'its track'], [0, 'lost', 'a try lost, reloaded'], [0, 'road', 'a fight on the road'], [0, 'mirror', 'one mirror-made'], [0, 'fight', 'fights in a place'],
    [1, null, 'THE MAKINGS'], [1, 'made', 'a marker: its day'], [1, 'reach', 'its reach'], [1, 'hit', 'a farm it fed on'], [1, 'ripples', 'Mr. Ripples'],
    [2, null, 'THE SURVIVORS'], [2, 'sv', 'a band on its way'], [2, 'met', 'a band met'],
    [3, null, 'THE SNOOT\'S ROAD'], [3, 'snoot', 'a band: gnolls left'], [3, 'burned', 'a farm burned'], [3, 'met', 'a band met']];

  RP.draw = function (g, sc) {
    RP.ui = []; RP.hovers = [];
    if (RP.list || !RP.data) { RP.drawList(g); return; }
    var d = RP.data, cam = sc.camObj(), t = RP.t, f = RP.frameAt(t), MW = W.Mworld(), on = RP.looks;
    var P = function (x, y) { var p = W.groundAt(cam, x, y); return [Math.round(p[0]), Math.round(p[1])]; }, PH = function (h) { var c = hexPt(h[0], h[1]); return P(c[0], c[1]); };
    var hov = function (p, r, lines) { RP.hovers.push({ x: p[0], y: p[1], r: r, lines: lines }); };
    var path = function (pts, col, lw, dash) { if (pts.length < 2) return; g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash || []); g.beginPath(); pts.forEach(function (p, i) { if (!i) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); g.stroke(); g.setLineDash([]); g.lineWidth = 1; };
    // 2. the makings' farms, reach, roads, markers; Mr. Ripples
    if (on[1] && f) {
      var hitHex = {}; (f.hit || []).forEach(function (h) { var fm = d.farms[h[0]]; if (!fm) return; var k = fm[0] + ',' + fm[1]; (hitHex[k] = hitHex[k] || { h: fm, n: 0, by: {} }).n++; if (h[2]) hitHex[k].by[h[2]] = 1; });
      Object.keys(hitHex).forEach(function (k) { var o = hitHex[k], p = PH(o.h); square(g, p[0] + 4, p[1] - 4, 2, C.hit); hov([p[0] + 4, p[1] - 4], 5, ['{p}' + o.n + ' farm' + (o.n > 1 ? 's' : '') + ' fed on{/} at ' + k, Object.keys(o.by).length ? 'by the day-' + Object.keys(o.by).join(', day-') + ' making' : '']); });
      (f.made || []).forEach(function (m) {
        if (m.st === 'gone') return; var c = hexPt(m.hex[0], m.hex[1]), dim = m.st === 'withered';
        g.strokeStyle = dim ? 'rgba(154,76,140,.7)' : 'rgba(238,88,208,.75)'; g.fillStyle = dim ? 'rgba(154,76,140,.08)' : 'rgba(238,88,208,.10)'; g.beginPath();
        for (var k = 0; k <= 36; k++) { var an = k / 36 * Math.PI * 2, q = P(c[0] + Math.cos(an) * m.reach, c[1] + Math.sin(an) * m.reach); if (!k) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }
        g.fill(); g.stroke();
      });
      (f.made || []).forEach(function (m) {
        var tr = (d.madeTr[m.d] || []).filter(function (s) { return s[0] <= f.t + 1e-6; }).map(function (s) { return PH(s[1]); }); if (m.st !== 'gone') path(tr, 'rgba(238,88,208,.6)', 1, [2, 2]);
        var at = PH(m.at); if (m.st !== 'gone') { g.fillStyle = 'rgba(238,88,208,.5)'; g.fillRect(at[0] - 1, at[1] - 1, 3, 3); }
        var p = PH(m.hex); if (m.st === 'gone') { cross(g, p[0], p[1], 2, C.gone, 1); return; }
        if (m.fed && Math.abs(f.t - t) < 4) { var fp = PH(m.fed.hex); ring(g, fp[0], fp[1], 6 + (t - f.t) * 2, C.made, 1.5); }
        if (m.charged) ring(g, p[0], p[1], 8, C.charged, 1.5);
        diamond(g, p[0], p[1], 6, m.st === 'withered' ? C.madeDim : C.made, '#05040a'); D.text(g, '' + m.d, p[0] - (m.d > 9 ? 4 : 2), p[1] - 3, '#05040a');
        hov(p, 7, ['{p}THE DAY-' + m.d + ' MAKING{/} (' + (m.zone || '?') + ') at ' + hexS(m.hex), 'made at ' + hexS(m.at) + '; ' + m.st + (m.charged ? ', charged' : '') + '; its reach ' + m.reach + ' mi', m.fedAt ? 'last fed ' + stamp(m.fedAt) : 'unfed since he made it', m.fed && f.t === RP.frameAt(t).t ? 'at this dawn it fed on ' + m.fed.on + ' at ' + hexS(m.fed.hex) : '']);
      });
      if (f.ripples) { var rp = f.ripples.pt ? P(f.ripples.pt[0], f.ripples.pt[1]) : PH(f.ripples.hex); cross(g, rp[0], rp[1], 4, C.ripples, 2); hov(rp, 6, ['{p}MR. RIPPLES{/} at ' + hexS(f.ripples.hex) + (f.ripples.held ? ', held at the Warded Fort' : f.ripples.taking ? ', at his taking of Steinarr' : ', walking his road')]); }
    }
    // 4. the Snoot's road: the farms burned, each band's road and the band
    if (on[3] && f) {
      var bh = {}; (f.burned || []).forEach(function (b) { var fm = d.farms[b[0]]; if (!fm) return; var k = fm[0] + ',' + fm[1]; (bh[k] = bh[k] || { h: fm, n: 0, by: {}, t: b[1] }).n++; if (b[2]) bh[k].by[b[2]] = 1; bh[k].t = Math.max(bh[k].t, b[1]); });
      Object.keys(bh).forEach(function (k) { var o = bh[k], p = PH(o.h); square(g, p[0] - 4, p[1] + 3, 2, C.burned); if (o.n > 1) D.text(g, '' + o.n, p[0] - 1, p[1] + 1, '#ffb090'); hov([p[0] - 4, p[1] + 3], 5, ['{r}' + o.n + ' farm' + (o.n > 1 ? 's' : '') + ' burned{/} at ' + k + ', ' + stamp(o.t), Object.keys(o.by).map(function (id) { return (d.bandOf[id] || {}).name || id; }).join(', ')]); });
      (f.snoot || []).forEach(function (b) {
        var tr = (d.bandTr[b.id] || []).filter(function (s) { return s[0] <= f.t + 1e-6; }).map(function (s) { return PH(s[1]); }); path(tr, b.gone ? 'rgba(138,138,150,.5)' : 'rgba(255,140,48,.7)', 1.5, [3, 2]);
        var p = PH(b.hex), bd = d.bandOf[b.id] || {}; if (b.gone) { cross(g, p[0], p[1], 3, C.gone, 1.5); return; }
        if (b.busy) { var fl = Math.sin((sc.t || 0) / 4); dot(g, p[0], p[1] - 7 - fl, 2.5, '#ffd040'); dot(g, p[0] + 2, p[1] - 5, 2, C.burned); }
        tri(g, p[0], p[1], 6, C.snoot, '#05040a'); D.text(g, '' + b.n, p[0] - (b.n > 9 ? 4 : 2), p[1] - 2, '#05040a');
        hov(p, 7, ['{o}' + (bd.name || b.id).toUpperCase() + '{/} (' + b.id + ') at ' + hexS(b.hex), b.n + ' of ' + (bd.of || '?') + ' left; ' + (b.busy ? 'at a farm, burning it' : b.moving ? 'on the move' : 'standing') + (b.burned ? '; ' + b.burned + ' farm' + (b.burned > 1 ? 's' : '') + ' burned' : '')]);
      });
    }
    // 3. the survivors on their way, and in at the refuges
    if (on[2] && f) {
      var inAt = {};
      RP.svAt(t).forEach(function (s) {
        var r = s.r; if (s.there) { (inAt[r.site] = inAt[r.site] || []).push(s); return; }
        var p = P(s.pt[0], s.pt[1]), q = P(r.to[0], r.to[1]); g.strokeStyle = 'rgba(78,224,212,.35)'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
        dot(g, p[0], p[1], 3, C.sv); g.strokeStyle = '#05040a'; g.beginPath(); g.arc(p[0], p[1], 3, 0, Math.PI * 2); g.stroke();
        hov(p, 5, ['{c}SURVIVORS{/} (' + (r.kind || '?') + ', ' + (r.zone === 'snoot' ? 'burnt out by ' + ((d.bandOf[r.of] || {}).name || r.of) : 'the ' + String(r.of).replace('day ', 'day-') + ' making, ' + r.zone) + ')', 'set out ' + stamp(r.t0) + ' for ' + r.site + ', in ' + stamp(r.arr)]);
      });
      Object.keys(inAt).forEach(function (site) { var s = (MW.sites || []).filter(function (x) { return x.id === site; })[0]; if (!s) return; var p = P(s.x, s.y), n = inAt[site].length, lb = n + ' in'; D.win8(g, p[0] + 6, p[1] - 18, D.textWidth(lb) + 10, 13, '#0c3a3a'); D.text(g, lb, p[0] + 11, p[1] - 15, C.sv); hov([p[0] + 10, p[1] - 12], 8, ['{c}' + n + ' band' + (n > 1 ? 's' : '') + ' of survivors in at ' + s.name + '{/}'].concat(inAt[site].slice(0, 4).map(function (x) { return x.r.kind + ', in ' + stamp(x.r.arr); }))); });
    }
    // 1. the party: the road still to walk faint, the road walked, the lost tries, its fights; the hex it stands in
    var meetsNow = d.meets.filter(function (m) { return m.t <= t + 1e-6 && m.hex; });
    if (on[0]) {
      var PE = function (e) { var q = ptOf(e); return P(q[0], q[1]); };
      path(d.canon.filter(function (e) { return e[0] > t; }).map(PE), C.partyFar, 1);
      Object.keys(d.lostBr).forEach(function (n) { var br = d.lostBr[n].filter(function (e) { return e[0] <= t + 1e-6; }); if (!br.length) return; var rw = d.rewinds[+n - 1], st = rw ? RP.partyAt(rw.t) : null; path((st ? [PE(st)] : []).concat(br.map(PE)), 'rgba(232,80,60,.75)', 1.5, [3, 2]); });
      path(d.canon.filter(function (e) { return e[0] <= t + 1e-6; }).map(PE), C.party, 2);
      var fh = {}; meetsNow.forEach(function (m) { if (m.k !== 'fight') return; var k = hexS(m.hex); (fh[k] = fh[k] || { h: m.hex, n: 0, last: m }).n++; fh[k].last = m; });
      Object.keys(fh).forEach(function (k) { var o = fh[k], p = PH(o.h); dot(g, p[0] + 5, p[1] + 4, 2.5, C.fight); D.text(g, '' + o.n, p[0] + 9, p[1] + 1, C.fight); hov([p[0] + 5, p[1] + 4], 6, [o.n + ' fight' + (o.n > 1 ? 's' : '') + ' in a place at ' + k, 'the last: ' + stamp(o.last.t) + ' ' + String(o.last.s).slice(0, 60)]); });
    }
    meetsNow.forEach(function (m) {
      if (m.k === 'fight') return; var p = PH(m.hex), fresh = t - m.t < 24, look = { road: 0, mirror: 0, lost: 0, survivors: 2, snoot: 3 }[m.k]; if (look != null && !on[look]) return;
      if (m.k === 'road' || m.k === 'mirror') swords(g, p[0], p[1] - 9, m.k === 'mirror' ? C.mirror : fresh ? C.road : 'rgba(255,255,255,.6)');
      else if (m.k === 'survivors') ring(g, p[0], p[1], 7, C.sv, fresh ? 2 : 1);
      else if (m.k === 'snoot') ring(g, p[0], p[1], 9, C.snoot, fresh ? 2 : 1);
      else if (m.k === 'lost') cross(g, p[0], p[1], 5, C.lost, 2.5);
      hov(m.k === 'road' || m.k === 'mirror' ? [p[0], p[1] - 9] : p, 7, [(m.lost != null ? '(a lost try) ' : '') + stamp(m.t) + ' ' + ({ road: 'MET ON THE ROAD', mirror: '{p}MET MIRROR-MADE{/}', survivors: '{c}SURVIVORS MET{/}', snoot: '{o}A SNOOTING BAND MET{/}', lost: '{r}THE GAME LOST{/}' }[m.k] || m.k) + ' at ' + hexS(m.hex), String(m.s).slice(0, 70) + (m.res ? ' -> ' + String(m.res).toUpperCase() : '') + (m.pct ? ' (' + m.pct + '% a hex)' : '')]);
    });
    if (on[0]) { var pe = RP.partyAt(t); if (pe) { var pp = PE(pe); ring(g, pp[0], pp[1] - 6, 11, 'rgba(248,216,120,.9)', 1.5); banner(g, pp[0], pp[1], RP.play ? Math.round(Math.abs(Math.sin((sc.t || 0) / 4)) * 2) : 0); hov([pp[0], pp[1] - 6], 11, ['{y}THE PARTY{/} at ' + hexS([pe[1], pe[2]]), RP.whereAt(t)]); } }
    RP.panels(g, sc, f);
  };

  // ---------------------------------------------------------------- the panels: the run and the hour, the key, the feed, the timeline and its buttons, a tooltip
  var COLS = { p: C.made, c: C.sv, o: C.snoot, r: C.lost, y: C.party };
  function said(g, s, x, y, col) { // (D.text with the replay's own colour words {p} {c} {o} as well as the house's)
    var parts = String(s).split(/(\{[pco]\}|\{\/\})/), cur = col; parts.forEach(function (q) { if (/^\{[pco]\}$/.test(q)) { cur = COLS[q.charAt(1)]; return; } if (q === '{/}') { cur = col; return; } if (!q) return; x += D.text(g, q, x, y, cur); });
    return x;
  }
  function wid(s) { return D.textWidth(String(s).replace(/\{[pco]\}/g, '')); }
  RP.panels = function (g, sc, f) {
    var d = RP.data, t = RP.t, m = I.mouse;
    // the run and the hour
    var t1 = 'THE MARKERS\' REPLAY  {g}' + (d.mode || 'walk') + ', ' + (d.order === 'cull' ? 'the Cull first' : d.order === 'five' ? 'the Five first' : (d.order || '')) + ', seed ' + d.seed + '{/}';
    var tod = W.todAt ? W.todAt(((t % 24) + 24) % 24) : '', t2 = '{y}DAY ' + dayOf(t) + ', ' + clockOf(t) + '{/} ' + tod + (RP.play ? '  {g}playing x' + Math.round(RP.rate / 0.05 * 10) / 10 + '{/}' : '') + '   the party: ' + RP.whereAt(t);
    var bw = Math.min(D.W - 178, Math.max(wid(t1), wid(t2)) + 12); D.win8(g, 4, 4, bw, 26); D.text(g, t1, 10, 8, D.WIN8.text); D.text(g, t2, 10, 18, '#e8e4d8');
    // the key
    var rows = RP.KEY.filter(function (r) { return !RP.fold || r[1] == null; }), kw = 150, kh = 8 + rows.length * 9 + 10, kx = D.W - kw - 4, ky = 4;
    D.win8(g, kx, ky, kw, kh); D.text(g, 'THE KEY  {g}1-4 on/off, L{/}', kx + 6, ky + 4, D.WIN8.gold);
    rows.forEach(function (r, i) {
      var y = ky + 14 + i * 9, off = !RP.looks[r[0]];
      if (r[1] == null) { D.text(g, (r[0] + 1) + ' ' + r[2] + (off ? '  {g}(off){/}' : ''), kx + 6, y, off ? '#6c6c84' : '#f0e8c8'); RP.ui.push({ x: kx, y: y - 1, w: kw, h: 9, go: function () { RP.looks[r[0]] = !RP.looks[r[0]]; } }); }
      else { if (!off) RP.glyph(g, r[1], kx + 16, y + 3); D.text(g, r[2], kx + 26, y, off ? '#6c6c84' : '#c8c4b8'); }
    });
    // the feed: the last of what happened by this hour
    var ev = d.events.filter(function (e) { return e.t <= t + 1e-6 && (e.look < 0 || RP.looks[e.look]); }).slice(-4), fy = D.H - 74;
    g.fillStyle = 'rgba(8,8,20,.78)'; g.fillRect(4, fy - 2, D.W - 8, 4 * 9 + 3);
    ev.forEach(function (e, i) { var s = stamp(e.t) + '  ' + e.s; while (wid(s) > D.W - 16 && s.length > 8) s = s.slice(0, -4) + '...'; D.text(g, s, 8, fy + i * 9, i === ev.length - 1 ? e.c : e.c === '#a8a4b8' ? '#7c788c' : e.c); });
    // the timeline: the days, the meetings, the hour
    var tx = 8, tw = D.W - 16, ty = D.H - 26, span = Math.max(1e-6, d.t1 - d.t0), X = function (tt) { return tx + (tt - d.t0) / span * tw; };
    g.fillStyle = '#20223a'; g.fillRect(tx, ty, tw, 5); g.fillStyle = 'rgba(248,216,120,.55)'; g.fillRect(tx, ty, Math.max(0, X(t) - tx), 5);
    for (var dd = dayOf(d.t0); (dd - 1) * 24 <= d.t1; dd++) { var x = Math.round(X((dd - 1) * 24 + 6)); if (x < tx || x > tx + tw) continue; g.fillStyle = '#8888a8'; g.fillRect(x, ty - 2, 1, 9); if (dd % 2 === 0 || span < 24 * 9) D.text(g, '' + dd, x - 2, ty - 10, '#8888a8'); }
    d.meets.forEach(function (mm) { if (mm.k === 'fight' || (mm.lost != null && mm.k !== 'lost')) return; var x = Math.round(X(mm.t)); g.fillStyle = { road: C.road, mirror: C.mirror, survivors: C.sv, snoot: C.snoot, lost: C.lost }[mm.k] || C.fight; g.fillRect(x, ty + 1, 1, 3); });
    var cx = Math.round(X(t)); g.fillStyle = C.party; g.beginPath(); g.moveTo(cx - 3, ty + 8); g.lineTo(cx + 3, ty + 8); g.lineTo(cx, ty + 5); g.closePath(); g.fill();
    RP.ui.push({ x: tx, y: ty - 3, w: tw, h: 11, go: function (mo) { RP.play = false; RP.scrub = { x: tx, w: tw }; RP.seek(d.t0 + span * Math.max(0, Math.min(1, (mo.x - tx) / tw))); } });
    // the buttons (his "playable by mouse only")
    var bs = [['< DAWN', function () { RP.play = false; RP.dawnStep(-1); }], ['< HOUR', function () { RP.play = false; RP.seek(RP.t - 1); }], [RP.play ? 'PAUSE' : 'PLAY', function () { if (RP.t >= d.t1 - 1e-6) RP.t = d.t0; RP.play = !RP.play; }], ['HOUR >', function () { RP.play = false; RP.seek(RP.t + 1); }], ['DAWN >', function () { RP.play = false; RP.dawnStep(1); }], ['SPEED x' + Math.round(RP.rate / 0.05 * 10) / 10, function () { RP.rate = RP.rate >= 0.8 ? 0.0125 : RP.rate * 2; }], ['RUNS', function () { RP.loadList(); }]];
    var bwid = 54, gap = 4, bx = Math.round(D.W / 2 - (bs.length * bwid + (bs.length - 1) * gap) / 2);
    bs.forEach(function (b, i) { var bb = { x: bx + i * (bwid + gap), y: D.H - 15, w: bwid, h: 13, label: b[0], go: b[1] }; W.button(g, bb); RP.ui.push(bb); });
    // a tooltip: the mark under the mouse
    if (m.inside && !RP.ui.some(function (b) { return inR(m, b); })) {
      var best = null, bd = 1e9; RP.hovers.forEach(function (h) { var dd2 = Math.hypot(h.x - m.x, h.y - m.y); if (dd2 <= h.r && dd2 < bd) { bd = dd2; best = h; } });
      if (best) { var ls = best.lines.filter(function (l) { return l; }), ww = 8 + Math.max.apply(null, ls.map(wid)), hx = Math.min(D.W - ww - 4, m.x + 10), hy = Math.min(D.H - 80 - ls.length * 9, m.y + 8); g.fillStyle = 'rgba(8,8,20,.9)'; g.fillRect(hx, hy, ww, 5 + ls.length * 9); ls.forEach(function (l, i) { said(g, l, hx + 4, hy + 3 + i * 9, '#e8e4d8'); }); }
    }
  };
  RP.drawList = function (g) { // (the runs in walk-replays/, newest first)
    g.fillStyle = 'rgba(4,3,10,.55)'; g.fillRect(0, 0, D.W, D.H);
    var w = 360, x = (D.W - w) / 2, L = RP.list, items = L ? L.items : [], h = 44 + Math.min(14, Math.max(1, items.length)) * 11, y = Math.max(8, (D.H - h) / 2);
    D.win8(g, x, y, w, h); D.text(g, 'THE MARKERS\' REPLAY  {g}the quest walk\'s runs{/}', x + 8, y + 6, D.WIN8.gold);
    if (!L) { D.text(g, RP.loading ? 'Loading ' + RP.loading + '...' : RP.err || '', x + 8, y + 20, RP.err ? '#ff9a8a' : '#e8e4d8'); return; }
    if (!items.length) { D.text(g, 'No runs in walk-replays/ yet.', x + 8, y + 20, '#e8e4d8'); return; }
    if (L.sel < L.top) L.top = L.sel; if (L.sel >= L.top + 14) L.top = L.sel - 13;
    items.slice(L.top, L.top + 14).forEach(function (it, i) {
      var k = L.top + i, yy = y + 20 + i * 11, sel = k === L.sel; if (sel) { g.fillStyle = D.WIN8.sel; g.fillRect(x + 4, yy - 2, w - 8, 11); }
      D.text(g, it.name, x + 10, yy, sel ? D.WIN8.gold : D.WIN8.text); D.text(g, 'days ' + it.days + ', ' + it.meets + ' met' + (it.lost ? ', ' + it.lost + ' lost' : ''), x + w - 10, yy, '#9a96a8', 'right');
      RP.ui.push({ x: x + 4, y: yy - 2, w: w - 8, h: 11, row: k });
    });
    D.text(g, 'up/down and E, or a click twice: open', x + 8, y + h - 12, '#9a96a8');
    if (RP.err) D.text(g, RP.err, x + 8, y + h + 4, '#ff9a8a');
  };

  // ---------------------------------------------------------------- THE WORLD in replay: its land, places and sky drawn as ever; its hands and its HUD the replay's
  var up0 = W.World.prototype.update, hud0 = W.World.prototype.hud, ex0 = W.World.prototype.exit;
  W.World.prototype.update = function () { if (!RP.on || this !== RP.scene) return up0.apply(this, arguments); this.t++; RP.update(this); };
  W.World.prototype.hud = function (g) { if (!RP.on || this !== RP.scene) return hud0.apply(this, arguments); RP.draw(g, this); };
  W.World.prototype.exit = function () { if (this === RP.scene) RP.on = false; return ex0.apply(this, arguments); };
})();
