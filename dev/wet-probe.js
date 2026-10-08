/* THE SETTLING on the grid (dev/wet-probe.py; 09-30b): the map, the sleepers and their squares, the landlord's patience, the bucket,
   the pictures, the herd, leaving, the quiet end, the won end, and whole fights run through from each trigger. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, G = D.grid, checks = [], errs = [];
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  function ok(name, v) { checks.push([name, !!v]); }
  function drain(g) { var v, n = 0, out; while (g && n++ < 200000) { var r = g.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.turn) v = { do: 'end' }; } }
  function battle(o) { var d = D.save.fixture(o.lvl || 5); d.flags = Object.assign({ lakeDone: 1 }, o.flags || {}); if (o.inv) d.inv = d.inv.concat(o.inv); var B = new D.Battle({ fight: 'wet', data: d, embed: o.embed || null, bench: true }); D.battle = B; B.enter(); return B; }
  function unit(B, id) { return B.units.filter(function (u) { return u.id === id || u.wet === id; })[0]; }
  var g8 = function (x, y, s) { return D.MAPS.wet.from8(x, y, s); }; // (the grid is turned: an 8-bit square to the grid's)
  function put(u, x, y) { var p = g8(x, y); u.x = p[0]; u.y = p[1]; }
  function at(u, x, y) { var p = g8(x, y); return u.x === p[0] && u.y === p[1]; }
  function ours(B) { return B.units.filter(function (u) { return u.side === 'party' && !u.familiar; }); }
  function run(B, cap) { // the whole fight, everyone run by the AI; when nothing is awake and nobody down, one of them walks out (09-30d: the wet keeps them till then)
    B.units.forEach(function (u) { if (u.side === 'party' && !u.familiar) u.classAI = true; });
    B.heroTurn = function* (u) { yield* D.ai.turn(this, u); };
    var v, g = 0, kept = '-'; while (B.co && g++ < (cap || 400000)) { var r; try { r = B.co.next(v); } catch (e) { errs.push(String(e && e.stack || e).slice(0, 600)); break; } v = undefined; if (r.done) break; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.turn) v = { do: 'end' }; if (B.round > 60) break;
      if (kept === '-' && !B.result && B.wet) { var awake = B.units.some(function (w) { return w.side === 'foe' && !w.dead && w.hp > 0 && !w.dormant; }), down = ours(B).some(function (w) { return !w.left && w.hp <= 0; }); if (!awake && !down) { kept = String(B.over()); var wk = ours(B).filter(function (w) { return w.hp > 0 && !w.left; })[0]; if (wk) { wk.left = true; wk.dead = true; } } } }
    return (B.result || 'none') + ' R' + B.round + ' (kept: ' + kept + '), crawlers ' + (B.wet ? B.wet.crawlers : '?') + ', killed ' + JSON.stringify(B.wet ? D.wet.killed(B) : []) + ', flags ' + JSON.stringify(B.flags8 || {}) + ', out at ' + JSON.stringify(B.exit8 || null);
  }
  // one of them onto an exit square, and LEAVE (the real command's generator)
  function walkOut(B, u, x8, y8) { put(u, x8, y8); D.rules.startTurn(u); var on = B.onExit(u); drain(B.leave(u)); return on; }
  function southSquare(B, u) { for (var ex = 12; ex <= 28; ex++) { var p = g8(ex, 18); if (G.canStand(u, p[0], p[1]) && !G.occupant(p[0], p[1])) return ex; } return null; }
  try {
    var m = D.MAPS.wet;
    ok('the map, turned: ' + m.rows[0].length + ' x ' + m.rows.length + ', every row the same width; the 8-bit (8, 0), the fall, is the grid\'s ' + JSON.stringify(g8(8, 0)) + ' = ' + m.rows[g8(8, 0)[1]][g8(8, 0)[0]], m.rows.every(function (r) { return r.length === 19; }) && m.rows.length === 44 && m.rows[g8(8, 0)[1]][g8(8, 0)[0]] === '~');

    // ---- in by the jelly's square (the lead on (23, 14)), the jelly awake
    var B = battle({ embed: { at: [23, 14], wake: 'jelly' } }), lead = ours(B)[0];
    ok('the lead on the jelly\'s square: ' + lead.name + ' at ' + lead.x + ',' + lead.y + ' (the 8-bit 23,14)', at(lead, 23, 14));
    var J = unit(B, 'jelly'), L = unit(B, 'landlord');
    ok('the jelly awake, in the pool, a swimmer: ' + (J && [J.x, J.y, !J.dormant, J.swims].join(',')), J && !J.dormant && J.swims && G.map.at(J.x, J.y).ch === '~');
    ok('the landlord under the fall, in sight and waiting, bound to its deep water: ' + (L && [L.x, L.y, L.dormant, L.bound].join(',')), L && L.dormant && L.bound === 'D' && G.map.at(L.x, L.y).ch === 'D' && JSON.stringify([L.x, L.y]) === JSON.stringify(g8(7, 3, 2)));
    ok('the pool ooze asleep in its puddle: not on the field', !unit(B, 'poolooze') && !!B.wet.sleepers.poolooze);
    ok('no start card: the fight\'s first beat is not the entry card (' + JSON.stringify(B.fight.noCards) + ')', B.fight.noCards === true);
    ok('a hero may not walk into the deep water, nor the pools: ' + G.canStand(lead, g8(6, 5)[0], g8(6, 5)[1]) + ', ' + G.canStand(lead, g8(20, 11)[0], g8(20, 11)[1]), !G.canStand(lead, g8(6, 5)[0], g8(6, 5)[1]) && !G.canStand(lead, g8(20, 11)[0], g8(20, 11)[1]));
    ok('the bucket on its square (the 8-bit 3, 7, by the stair since 10-08): ' + JSON.stringify(B.wet.bucket && B.wet.bucket.at), B.wet.bucket && JSON.stringify(B.wet.bucket.at) === JSON.stringify(g8(3, 7)));
    // 10-04 (Griz, the situations ear-file): the crate under the bucket and the lamp on it; the pool and its rim dressed stone
    var cq = g8(3, 7);
    var lq = g8(4, 7); // (10-08, Griz: "at the deepest pools edge could be the 7 row 39-40" -- the grid's (7, 40) the crate, (7, 39) the lamp)
    ok('the deep station\'s crate under it (a crate prop on (3, 7)), and its lamp on a post beside it at the pool\'s corner (a lamp prop on (4, 7), the grid\'s (7, 39) -- ' + JSON.stringify(lq) + ', the map light there bright 10 ft gold, none on the bucket: ' + (B.lights || []).filter(function (l) { return l.kind === 'map'; }).map(function (l) { return [l.x, l.y, l.bright, l.color].join('/'); }).join(' ') + ')',
      G.map.props.some(function (p) { return p.kind === 'crate' && p.sq === G.map.at(cq[0], cq[1]); }) && G.map.props.some(function (p) { return p.kind === 'lamp' && p.sq === G.map.at(lq[0], lq[1]); }) && (B.lights || []).some(function (l) { return l.kind === 'map' && l.x === lq[0] && l.y === lq[1] && l.bright === 10 && l.color === 'gold'; }) && !(B.lights || []).some(function (l) { return l.kind === 'map' && l.x === cq[0] && l.y === cq[1]; }));
    var sf = function (x, y) { var p = g8(x, y); return G.solidFloor(p[0], p[1]); };
    ok('the pool and its rim are solid stone (noBurrowAt), the cave floor past them is not: (10,3) ' + sf(10, 3) + ', (6,5) ' + sf(6, 5) + ', (3,7) ' + sf(3, 7) + '; (13,5) ' + sf(13, 5) + ', (2,7) ' + sf(2, 7) + ', (20,11) ' + sf(20, 11),
      sf(10, 3) && sf(6, 5) && sf(3, 7) && !sf(13, 5) && !sf(2, 7) && !sf(20, 11));
    ok('the ways out: the stair up and the south edge (' + B.exits.length + ' squares; the stair ' + B.exits.some(function (q) { return JSON.stringify(q) === JSON.stringify(g8(1, 12)); }) + ')', B.exits.some(function (q) { return JSON.stringify(q) === JSON.stringify(g8(1, 12)); }) && B.exits.some(function (q) { return q[0] === 18; }));
    // the pool ooze's ring, one of the nine round its puddle (29, 13)
    var h2 = ours(B)[1]; put(h2, 30, 14);
    drain(D.wet.stepped(B, h2, [g8(30, 14)]));
    var O = unit(B, 'poolooze');
    ok('a step into the pool ooze\'s ring wakes it: ' + (O && [O.x, O.y, !O.dormant, B.order.indexOf(O) >= 0].join(',')), O && !O.dormant && B.order.indexOf(O) >= 0);
    // the picture's squares
    var h3 = ours(B)[2]; put(h3, 8, 8);
    drain(D.wet.stepped(B, h3, [g8(8, 8)]));
    ok('the picture: spoke ' + B.wet.spoke + ', flag ' + B.flags8.landlordSpoke, B.wet.spoke && B.flags8.landlordSpoke);
    // the bucket, walked onto
    var h4 = ours(B)[3]; put(h4, 3, 7);
    drain(D.wet.stepped(B, h4, [g8(3, 7)]));
    var bs = B.inv.filter(function (s) { return s.id === 'bucket'; })[0];
    ok('walked onto, the bucket is in the pack: x' + (bs && bs.n) + ', the square empty ' + !B.wet.bucket, bs && bs.n === 1 && !B.wet.bucket);
    // the landlord's patience: one at the edge of its water, four of its turns
    put(h3, 8, 8); var calls = [];
    for (var i = 0; i < 4; i++) { D.rules.startTurn(L); calls.push(drain(D.traits.turn(B, L))); }
    ok('at the edge of its water four rounds (' + calls.join(',') + '): awake on the fourth ' + !L.dormant, calls[0] === true && calls[2] === true && calls[3] === false && !L.dormant);
    // the watching card: the camera on the landlord, and the beat held (09-30e: "a little bit longer pause")
    var WB = battle({ embed: { at: [23, 14], wake: 'jelly' } }), WL = unit(WB, 'landlord'), wh = ours(WB)[1]; put(wh, 8, 8); WB.wet.spoke = true;
    D.iso.cam.x = -999; D.rules.startTurn(WL); var wg = D.wet.landlordWaits(WB, WL), wr, held = 0; do { wr = wg.next(); if (typeof wr.value === 'number') held += wr.value; } while (!wr.done);
    var la = D.fx.at(WL), lc = D.iso.center(la.gx, la.gy, la.gz);
    ok('the landlord watching: the camera on it ' + (Math.abs(D.iso.cam.x - Math.round(lc.x)) <= 1) + ', held ' + held + ' frames, "' + WB.cards.map(function (c) { return c.lines.join(' '); }).slice(-1)[0] + '"', Math.abs(D.iso.cam.x - Math.round(lc.x)) <= 1 && held >= 60);
    // the clackers' picture clacks on the frames its claws snap shut
    var sfx0 = D.sfx, heard = []; D.sfx = function (id) { heard.push(id); };
    for (var tt = 1; tt <= 150; tt++) D.wet.SOUND.clackers(tt);
    D.sfx = sfx0;
    ok('the clackers\' picture: ' + heard.filter(function (s) { return s === 'clack'; }).length + ' clacks in its 150 frames; the other pictures silent (' + ['bucket', 'fall', 'crook', 'bats'].filter(function (k) { return D.wet.SOUND[k]; }).length + ')', heard.length === 10 && heard.every(function (s) { return s === 'clack'; }) && !['bucket', 'fall', 'crook', 'bats'].some(function (k) { return D.wet.SOUND[k]; }));

    // ---- in by the landlord (FIGHT IT), fed with the bucket: the quiet end
    var C = battle({ embed: { at: [9, 8], wake: 'landlord' }, inv: [{ id: 'bucket', n: 1 }] }), CL = unit(C, 'landlord'), cu = ours(C)[0];
    ok('in by the landlord: it is awake, the lead at ' + cu.x + ',' + cu.y + ', no bucket on the floor (the pack has it): ' + !C.wet.bucket, !CL.dormant && !C.wet.bucket && at(cu, 9, 8));
    D.rules.startTurn(cu); var it = C.itemList(cu).filter(function (e) { return e.id === 'bucket'; })[0];
    ok('the bucket on the wheel beside the water: ' + JSON.stringify(it && [it.ok, it.why]), it && it.ok);
    var far = ours(C)[1]; put(far, 30, 14); D.rules.startTurn(far);
    var it2 = C.itemList(far).filter(function (e) { return e.id === 'bucket'; })[0];
    ok('away from the water it is grey: ' + JSON.stringify(it2 && [it2.ok, it2.why]), it2 && !it2.ok);
    var scenes = 0, g0 = C.useItem(cu, 'bucket', cu), r0, v0; do { r0 = g0.next(v0); if (r0.value && r0.value.scene) { scenes++; try { r0.value.scene.draw(document.createElement('canvas').getContext('2d'), 30, 480, 270); } catch (e) { errs.push('picture: ' + e); } } } while (!r0.done);
    ok('fed: ' + [CL.fed, CL.dormant, C.flags8.otyughFed, C.flags8['heard:r-stream']].join(',') + '; the pictures played: ' + scenes, CL.fed && CL.dormant && C.flags8.otyughFed && scenes === 4);
    ok('fed, nothing else awake, nobody down: the wet keeps them (over() ' + C.over() + ')', C.over() === null);
    var cw = ours(C)[2], sx = southSquare(C, cw), cOn = walkOut(C, cw, sx, 18);
    ok('one walks off the south edge at the 8-bit (' + sx + ', 18) (an exit ' + cOn + '): over() ' + C.over(), cOn && C.over() === 'escaped');
    drain(C.finish(C.over()));
    ok('out as a run (nothing died): ' + C.result + ', no XP list ' + !C.enemies8 + ', the 8-bit square ' + JSON.stringify(C.exit8) + ', fed ' + C.flags8.otyughFed, C.result === 'escaped' && !C.enemies8 && JSON.stringify(C.exit8) === JSON.stringify([sx, 18]) && C.flags8.otyughFed);
    // the edge asks (09-30e: "an auto-pop-up 'leave the area? yes/no' when they hit the stairs or the south line"): NO keeps him, YES takes them out
    function stepOnto(B, u, from8, to8, answer) { put(u, from8[0], from8[1]); D.rules.startTurn(u); var t = g8(to8[0], to8[1]), path = G.path(G.reach(u, u.turn.move), t[0], t[1]), asked = null, gen = B.moveAlong(u, path, { spend: true }), r, v; do { r = gen.next(v); v = undefined; if (r.value && r.value.prompt) { asked = r.value.prompt; v = answer; } } while (!r.done); return asked; }
    var E1 = battle({ embed: { at: [23, 14], wake: 'jelly' } }), e1 = ours(E1)[1], esx = southSquare(E1, e1);
    var askNo = stepOnto(E1, e1, [esx, 17], [esx, 18], false);
    ok('onto the south line: asked "' + (askNo && askNo.title) + '" ' + JSON.stringify(askNo && askNo.opts.map(function (o) { return o.label; })) + ' -- "' + (askNo && askNo.lines[0]) + '"; NO: still in (' + !e1.left + ', over ' + E1.over() + ')', askNo && askNo.title === 'LEAVE THE AREA?' && askNo.opts[0].label === 'YES' && askNo.opts[1].label === 'NO' && !e1.left && E1.over() === null);
    var askYes = stepOnto(E1, e1, [esx, 17], [esx, 18], true);
    ok('YES: out (' + e1.left + '), over ' + E1.over() + ', no "out the way" card (' + E1.cards.map(function (c) { return c.lines.join(' '); }).filter(function (s) { return /out the way/.test(s); }).length + ')', askYes && e1.left && E1.over() === 'escaped' && !E1.cards.some(function (c) { return /out the way/.test(c.lines.join(' ')); }));
    var E2 = battle({ embed: { at: [23, 14], wake: 'jelly' } }), e2 = ours(E2)[2], askSt = stepOnto(E2, e2, [2, 12], [1, 12], true);
    ok('onto the stair: "' + (askSt && askSt.lines[0]) + '"; out ' + e2.left + ' (no pronoun: ' + !/\b(he|him|his|she|her|hers)\b/i.test(askSt && askSt.lines[0]) + ')', askSt && /^Up the stair: \w+ goes, and the party goes too\.$/.test(askSt.lines[0]) && !/\b(he|him|his|she|her|hers)\b/i.test(askSt.lines[0]) && e2.left);
    drain(E2.finish(E2.over()));
    ok('no card on the way out: ' + E2.cards.length + ' up (' + E2.result + ', ' + JSON.stringify(E2.exit8) + ')', E2.cards.length === 0 && E2.result === 'escaped' && JSON.stringify(E2.exit8) === '[1,12]');
    // the ring: the bucket used at once, no square to pick (09-30d: "bucket asks for self-or nearby target like a potion")
    var RB = battle({ embed: { at: [9, 8], wake: 'landlord' }, inv: [{ id: 'bucket', n: 1 }] }), ru = ours(RB)[0], got = null;
    D.rules.startTurn(ru);
    var li = RB.itemList(ru).map(function (e) { e.kind = 'item'; return e; }), bi = li.map(function (e) { return e.id; }).indexOf('bucket');
    RB.list = { kind: 'items', items: li, sel: bi }; RB.answer = function (c) { got = c; };
    var E0 = D.input.edge, cam0 = D.ui.camera; D.input.edge = { a: true }; D.ui.camera = function () {};
    try { D.ui.input(RB, { turn: ru }); } finally { D.input.edge = E0; D.ui.camera = cam0; }
    ok('on the ring the bucket is used at once, no square to pick: ' + JSON.stringify(got && { do: got.do, id: got.id, self: got.target === ru }) + ', tool after ' + RB.tool, got && got.do === 'item' && got.id === 'bucket' && got.target === ru && RB.tool !== 'item');

    // ---- the herd: one down a round, and the crawlers come
    var H = battle({ embed: { at: [23, 14], wake: 'jelly' } }), hs = ours(H);
    hs[1].hp = 0; hs[1].ko = true; put(hs[1], 21, 8);
    H.round = 1; drain(H.wave());
    ok('down this round: no crawler yet (' + H.wet.crawlers + ')', H.wet.crawlers === 0);
    hs.forEach(function (w) { w.perception0 = w.perception; w.perception = 40; }); H.cards = [];
    H.round = 2; drain(H.wave());
    var cr = H.units.filter(function (u) { return u.wetCrawler; }), ca = D.fx.at(cr[0]), cc = D.iso.center(ca.gx, ca.gy, ca.gz);
    ok('the herd noticed (passive 40 vs their Stealth ' + (H.wet.notice && H.wet.notice.roll) + '): "' + H.cards.map(function (c) { return c.lines.join(' '); }).join(' | ') + '", the camera on the crawler ' + (Math.abs(D.iso.cam.x - Math.round(cc.x)) <= 1 && Math.abs(D.iso.cam.y - Math.round(cc.y - 20)) <= 1), H.wet.notice && H.wet.notice.seen && H.cards.some(function (c) { return /Your comrade's fall has attracted the herd\./.test(c.lines.join(' ')); }) && Math.abs(D.iso.cam.x - Math.round(cc.x)) <= 1);
    hs.forEach(function (w) { w.perception = 0; }); H.cards = []; var n0 = H.units.filter(function (u) { return u.wetCrawler; }).length;
    H.round = 3; drain(H.wave());
    ok('the herd unnoticed (passive 0 vs ' + (H.wet.notice && H.wet.notice.roll) + '): ' + (H.units.filter(function (u) { return u.wetCrawler; }).length - n0) + ' more in, and nothing said (' + H.cards.length + ' cards: ' + H.cards.map(function (c) { return c.lines.join(' '); }).join(' | ') + ')', H.wet.notice && !H.wet.notice.seen && H.cards.length === 0 && H.units.filter(function (u) { return u.wetCrawler; }).length > n0);
    hs.forEach(function (w) { w.perception = w.perception0; });
    ok('the next round: ' + cr.length + ' crawler(s), 1-2, at full speed (' + (cr[0] && cr[0].speed) + '), in the order ' + (cr[0] && H.order.indexOf(cr[0]) >= 0) + ', in over the south edge (8-bit row ' + (cr[0] && (cr[0].x)) + ', from ' + JSON.stringify(cr[0] && cr[0].tween && [cr[0].tween.fx, cr[0].tween.fy]) + ')', cr.length >= 1 && cr.length <= 2 && cr[0].speed === 30 && H.order.indexOf(cr[0]) >= 0 && cr[0].x >= 16 && cr[0].tween && cr[0].tween.fx === 19);
    H.round = 4; drain(H.wave());
    var perRound = H.units.filter(function (u) { return u.wetCrawler; }).length;
    ok('never more than two a round (' + perRound + ' after three rounds)', perRound <= 6);
    // one feeds: stand it beside the downed
    var c0 = cr[0], G2 = D.grid, placed = false;
    for (var yy = hs[1].y - 3; yy <= hs[1].y + 1 && !placed; yy++) for (var xx = hs[1].x - 3; xx <= hs[1].x + 1 && !placed; xx++) if (G2.canStand(c0, xx, yy) && G2.dist(c0, hs[1], xx, yy) <= 5) { c0.x = xx; c0.y = yy; placed = true; }
    var mx0 = hs[1].maxhp; D.rules.startTurn(c0);
    var handled = drain(D.traits.turn(H, c0));
    ok('a crawler beside the downed feeds: max HP ' + mx0 + ' -> ' + hs[1].maxhp + ', drained ' + hs[1].drained + ' (placed ' + placed + ')', handled && hs[1].maxhp === mx0 - 2 && hs[1].drained === 2);
    H.hurt(c0, 3, 'slashing');
    D.rules.startTurn(c0);
    var h2r = drain(D.wet.crawlerTurn(H, c0));
    ok('struck, it forgets the downed: blooded ' + c0.blooded + ', its turn left to the brute ' + (h2r === false), c0.blooded && h2r === false);
    ok('a hero down: nothing is over (' + H.over() + ')', H.over() === null);
    hs[2].left = true; hs[2].dead = true;
    ok('one of them off the edge: over() says ' + H.over(), H.over() === 'escaped');

    // ---- in by the pool ooze's puddle, the ooze killed: won, its flag, its XP, and straight back (no end card)
    var back = null, K = battle({ embed: { at: [29, 13], wake: 'poolooze' } }), KO = unit(K, 'poolooze'), kl = ours(K)[0];
    K.o.onDone = function (r) { back = r; };
    ok('in by the pool ooze: the lead on its puddle (' + kl.x + ',' + kl.y + '), the ooze beside him (' + KO.x + ',' + KO.y + ')', at(kl, 29, 13) && D.grid.dist(kl, KO) <= 5 && !at(KO, 29, 13));
    K.hurt(KO, 999, 'bludgeoning');
    ok('the ooze dead, the landlord waiting, the jelly asleep: the wet keeps them (over() ' + K.over() + ')', K.over() === null);
    var ks = ours(K)[1], kOn = walkOut(K, ks, 1, 12);
    drain(K.finish(K.over()));
    ok('up the stair (an exit ' + kOn + '): ' + K.result + ', the flags ' + JSON.stringify(K.flags8) + ', the XP list ' + JSON.stringify(K.enemies8) + ', the 8-bit square ' + JSON.stringify(K.exit8) + '; back with no end card: ' + back, kOn && K.result === 'won' && K.flags8.poolOozeDead && !K.flags8.jellyDead && !K.flags8.oozeDead && JSON.stringify(K.enemies8) === '["grayooze"]' && JSON.stringify(K.exit8) === '[1,12]' && back === 'won');
    // the seam's report as the iframe sends it: the slots and uses (a note sat mid-line from 09-30b and cut them), the way out
    var sent = null, par0 = window.parent; window.parent = { postMessage: function (m) { sent = m; } };
    try { D.embed.done(K, K.result); } finally { window.parent = par0; }
    var p0 = sent && sent.party[0];
    ok('the report: ' + JSON.stringify(sent && { result: sent.result, exit8: sent.exit8, enemies8: sent.enemies8, slots: p0 && p0.slots, feats: p0 && Object.keys(p0.feats || {}).length, mageArmor: p0 && p0.mageArmor, left: sent.party.filter(function (r) { return r.left; }).length }), sent && sent.result === 'won' && JSON.stringify(sent.exit8) === '[1,12]' && Array.isArray(p0.slots) && p0.feats && 'mageArmor' in p0 && sent.party.some(function (r) { return r.left; }));

    // ---- 09-30g: the carrier's alone; the carrier falls and the bucket rolls; another takes it up
    var BK = battle({ embed: { at: [23, 14], wake: 'jelly' }, inv: [{ id: 'bucket', n: 1 }] }), bo = ours(BK), carrier = bo[0], other = bo[1];
    put(carrier, 9, 8); put(other, 10, 8); D.rules.startTurn(carrier); D.rules.startTurn(other);
    var bi1 = BK.itemList(carrier).filter(function (e) { return e.id === 'bucket'; })[0], bi2 = BK.itemList(other).filter(function (e) { return e.id === 'bucket'; })[0];
    ok('the bucket is ' + carrier.name + '\'s (' + BK.wet.bucketBy + '): open to ' + carrier.name + ' ' + (bi1 && bi1.ok) + ', to ' + other.name + ' "' + (bi2 && bi2.why) + '"', BK.wet.bucketBy === carrier.id && bi1 && bi1.ok && bi2 && !bi2.ok && /carries it/.test(bi2.why));
    BK.hurt(carrier, 999, 'bludgeoning');
    var bk1 = BK.wet.bucket, pk1 = BK.inv.filter(function (s) { return s.id === 'bucket'; })[0];
    ok(carrier.name + ' down: the bucket on the stone at ' + JSON.stringify(bk1 && bk1.at) + ' (' + (bk1 ? Math.max(Math.abs(bk1.at[0] - carrier.x), Math.abs(bk1.at[1] - carrier.y)) : '?') + ' away, ground ' + (bk1 && G.map.at(bk1.at[0], bk1.at[1]).walk) + '), the pack x' + (pk1 ? pk1.n : 0) + ', carried by ' + BK.wet.bucketBy, bk1 && Math.max(Math.abs(bk1.at[0] - carrier.x), Math.abs(bk1.at[1] - carrier.y)) <= 2 && G.map.at(bk1.at[0], bk1.at[1]).walk && (!pk1 || pk1.n === 0) && !BK.wet.bucketBy);
    other.x = bk1.at[0]; other.y = bk1.at[1]; drain(D.wet.stepped(BK, other, [bk1.at]));
    ok(other.name + ' walks onto it and takes it up: carried by ' + BK.wet.bucketBy + ', the pack x' + BK.inv.filter(function (s) { return s.id === 'bucket'; })[0].n, BK.wet.bucketBy === other.id && !BK.wet.bucket);
    // ---- 09-30g: fed, it sinks on its next turn and leaves the order; fed before, it is not on the grid at all
    var SK = battle({ embed: { at: [9, 8], wake: 'landlord' }, inv: [{ id: 'bucket', n: 1 }] }), SL = unit(SK, 'landlord'), su = ours(SK)[0];
    D.rules.startTurn(su); drain(SK.useItem(su, 'bucket', su));
    if (SK.order.indexOf(SL) < 0) SK.order.push(SL); // (the order is dealt when the fight starts; here by hand)
    D.rules.startTurn(SL); var sr = drain(D.traits.turn(SK, SL)), gone1 = SK.units.indexOf(SL) < 0, inOrd = SK.order.indexOf(SL) >= 0;
    drain(D.wet.first(SK));
    ok('fed, its next turn it sinks: off the grid ' + gone1 + ', in the order till the next turn starts ' + inOrd + ' then out ' + (SK.order.indexOf(SL) < 0) + ', "' + SK.cards.map(function (c) { return c.lines.join(' '); }).filter(function (s) { return /sinks/.test(s); })[0] + '"; not counted as killed ' + JSON.stringify(D.wet.killed(SK)) + '; over ' + SK.over(), gone1 && inOrd && SK.order.indexOf(SL) < 0 && D.wet.killed(SK).indexOf('otyugh') < 0 && SK.over() === null);
    var FD = battle({ embed: { at: [23, 14], wake: 'jelly' }, flags: { otyughFed: 1 } });
    ok('fed before: no landlord on the grid (' + FD.units.filter(function (u) { return u.side === 'foe'; }).map(function (u) { return u.id; }).join(',') + ')', !unit(FD, 'landlord'));
    // ---- 09-30g: in by the rim, the landlord asleep, its picture before anyone moves
    var RM = battle({ embed: { at: [8, 8], wake: 'rim' } }), RL = unit(RM, 'landlord'), rl = ours(RM)[0];
    var scn = 0, rg = D.wet.first(RM), rr; do { rr = rg.next(); if (rr.value && rr.value.scene) scn++; } while (!rr.done);
    ok('in by the rim: the lead at ' + at(rl, 8, 8) + ', the landlord asleep ' + (RL && RL.dormant) + ', the picture first (' + scn + ' scene, spoke ' + RM.wet.spoke + ')', at(rl, 8, 8) && RL && RL.dormant && scn === 1 && RM.wet.spoke);
    // ---- 09-30g: the deep rate roused -- the crawler loose at its cradle, the milker on the working square, stiff with the touch
    var HN = battle({ embed: { at: [16, 6], wake: 'harness', harness: [15, 6], milker: 'aurdin', touched: true } }), HC = unit(HN, 'harness'), mk = HN.units.filter(function (u) { return u.id === 'aurdin'; })[0];
    ok('roused at its cradle: a ' + (HC && HC.kind) + ' awake ' + (HC && !HC.dormant) + ', on the field ' + (HC && HN.units.indexOf(HC) >= 0) + ', ' + (HC && mk ? G.dist(HC, mk) : '?') + ' ft from ' + (mk && mk.name) + ' (on the working square ' + (mk && at(mk, 16, 6)) + ', paralyzed ' + !!(mk && mk.conds.paralyzed) + ', poisoned ' + !!(mk && mk.conds.poisoned) + '); "' + HN.cards.map(function (c) { return c.lines.join(' '); }).join(' | ').slice(0, 80) + '"', HC && HC.kind === 'crawler' && !HC.dormant && HN.units.indexOf(HC) >= 0 && mk && at(mk, 16, 6) && mk.conds.paralyzed && mk.conds.poisoned && G.dist(HC, mk) <= 10);
    HN.hurt(HC, 999, 'bludgeoning');
    ok('the roused crawler killed counts for the XP: ' + JSON.stringify(D.wet.killed(HN)), D.wet.killed(HN).indexOf('crawler') >= 0);

    // ---- 09-30g: awake, no one it can get at -- it sinks and waits; someone comes where it can reach, it rises, its wounds kept
    var SW = battle({ embed: { at: [23, 14], wake: 'landlord' } }), SWL = unit(SW, 'landlord');
    ours(SW).forEach(function (w, i) { put(w, 28 + i, 14); });
    SW.hurt(SWL, 20, 'piercing'); var hpW = SWL.hp; if (SW.order.indexOf(SWL) < 0) SW.order.push(SWL);
    D.rules.startTurn(SWL); drain(D.traits.turn(SW, SWL)); drain(D.wet.first(SW));
    ok('out of anyone\'s reach it sinks and waits: off the grid ' + (SW.units.indexOf(SWL) < 0) + ', out of the order ' + (SW.order.indexOf(SWL) < 0) + ', waiting ' + !!SW.wet.sleepers.landlord + ', not killed ' + JSON.stringify(D.wet.killed(SW)) + ', "' + (SW.cards.map(function (c) { return c.lines.join(' '); }).filter(function (s) { return /waits/.test(s); })[0] || '') + '"', SW.units.indexOf(SWL) < 0 && SW.order.indexOf(SWL) < 0 && SW.wet.sleepers.landlord === SWL && D.wet.killed(SW).indexOf('otyugh') < 0);
    var sw1 = ours(SW)[0]; put(sw1, 12, 6); drain(D.wet.stepped(SW, sw1, [g8(12, 6)]));
    ok('someone at the edge of its water where it can reach: it rises (' + (SW.units.indexOf(SWL) >= 0) + ', in the order ' + (SW.order.indexOf(SWL) >= 0) + ', HP ' + SWL.hp + ' of ' + hpW + ' kept)', SW.units.indexOf(SWL) >= 0 && SW.order.indexOf(SWL) >= 0 && SWL.hp === hpW && !SW.wet.sleepers.landlord);

    // ---- the dead stay dead
    var Z = battle({ embed: { at: [22, 9], wake: 'jelly' }, flags: { poolOozeDead: 1, otyughDead: 1, oozeDead: 1 } });
    ok('in by the jelly\'s north shore; the pool ooze and the landlord dead in the 8-bit flags: not on the grid (' + Z.units.filter(function (u) { return u.side === 'foe'; }).map(function (u) { return u.id; }).join(',') + '; sleepers ' + Object.keys(Z.wet.sleepers).join(',') + '; lead at ' + ours(Z)[0].x + ',' + ours(Z)[0].y + ')', !unit(Z, 'landlord') && !unit(Z, 'poolooze') && !Z.wet.sleepers.poolooze && at(ours(Z)[0], 22, 9));

    // ---- whole fights, the AI on both sides, from each trigger
    var runs = [];
    [['jelly', [23, 14]], ['poolooze', [29, 13]], ['landlord', [9, 8]]].forEach(function (w) { for (var k = 0; k < 2; k++) { var F = battle({ embed: { at: w[1], wake: w[0] }, lvl: 4 }); runs.push(w[0] + ': ' + run(F)); } });
    ok('six whole fights run through, nothing thrown:\n      ' + runs.join('\n      '), !errs.length && runs.length === 6);
    // ---- LEAVE THE FIGHT on the wheel wherever a fight allows running, greyed off a way out (10-04, Griz: "not on wheel")
    var Lb = battle({ embed: { at: [23, 14], wake: 'jelly' } }), lu = ours(Lb)[0]; D.rules.startTurn(lu);
    var lc = (Lb.commands(lu) || []).filter(function (c) { return c.id === 'leave'; })[0];
    ok('LEAVE THE FIGHT on the wheel off a way out, greyed with the why: ' + JSON.stringify(lc && [lc.ok, lc.why]), !!lc && !lc.ok && /pale squares/.test(lc.why || ''));
    var sx = southSquare(Lb, lu); put(lu, sx, 18); D.rules.startTurn(lu); lc = (Lb.commands(lu) || []).filter(function (c) { return c.id === 'leave'; })[0];
    ok('on the south edge (' + sx + ', 18) it is live: ' + JSON.stringify(lc && [lc.ok, lc.why]), !!lc && lc.ok === true);
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 900)); }
  var pre = document.createElement('pre'); pre.textContent = 'WETPROBE ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
