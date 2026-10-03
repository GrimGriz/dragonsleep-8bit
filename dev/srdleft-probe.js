/* The SRD pass's leftovers (dev/srdleft-probe.py; 10-02, the cloud seat): the Spy's Cunning Action (the Dash to close, the Disengage kite, the Hide, the bolt),
   the Bandit Captain's Parry, thrown weapons, Duergar Resilience on a running spell's saves. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, G = D.grid, checks = [], errs = [];
  D.sfx = function () {}; D.music = function () {}; D.clip = function (u, done) { if (done) done(); };
  function ok(name, v) { checks.push([name, !!v]); }
  function drain(g) { var v, n = 0; while (g && n++ < 200000) { var r = g.next(v); v = undefined; if (r.done) return r.value; var y = r.value; if (y && y.prompt) v = y.prompt.opts[0].value; if (y && y.turn) v = { do: 'end' }; } }
  function battle(fid, o) { var d = D.save.fixture((o && o.lvl) || 5); var B = new D.Battle(Object.assign({ fight: fid, data: d, bench: true }, o)); D.battle = B; B.enter(); return B; }
  function cardsOf(B) { var got = []; var c0 = B.card; B.card = function (lines) { got.push((lines || []).join(' | ')); return c0.apply(this, arguments); }; return got; }
  function foes(B) { return B.units.filter(function (u) { return u.side === 'foe'; }); }
  function party(B) { return B.units.filter(function (u) { return u.side === 'party' && !u.familiar; }); }
  function put(u, x, y) { u.x = x; u.y = y; }
  function sq(u, test) { for (var y = 0; y < 60; y++) for (var x = 0; x < 60; x++) { if (!G.canStand(u, x, y)) continue; var ox = u.x, oy = u.y; put(u, x, y); var r = false; try { r = test(x, y); } finally { put(u, ox, oy); } if (r) return [x, y]; } return null; }
  function say(cs, re) { return cs.some(function (c) { return re.test(c); }); }
  function short(cs) { return cs.map(function (c) { return c.slice(0, 70); }).join(' // ').slice(0, 320); }
  try {
    // ---------------------------------------------------------------- the Spy
    var B = battle('crew'), ww = foes(B).filter(function (u) { return u.kind === 'wheelwright'; })[0];
    ok('the Spy carries cunning, stealth ' + (ww && ww.stealth), ww && ww.cunning === true && ww.stealth === 6);
    foes(B).filter(function (u) { return u !== ww; }).forEach(function (u) { u.hp = 0; u.dead = true; }); ww.bolts = null; // (alone, and not running for the stair: Hask's fall would send him)
    var ps = party(B), hero = ps[0], hx = hero.x, hy = hero.y; ps.slice(1).forEach(function (u) { u.hp = 0; u.ko = true; });
    var cs;
    // Dash to close
    var sp = sq(ww, function () { var c = function (rm) { return Object.keys(rm).some(function (k) { var e = rm[k]; return e.stand && G.dist(ww, hero, e.x, e.y) <= 5; }); }; return G.dist(ww, hero) > 35 && !c(G.reach(ww, 30)) && c(G.reach(ww, 60)); });
    ok('a square for the Dash found: ' + sp, !!sp);
    if (sp) {
      put(ww, sp[0], sp[1]); cs = cardsOf(B); var d0 = G.dist(ww, hero);
      drain(D.ai.turn(B, ww));
      ok('Dash to close: ' + d0 + ' -> ' + G.dist(ww, hero) + ' ft, bonus ' + ww.turn.bonus + ' // ' + short(cs), say(cs, /\(Cunning Action\) dashes/) && G.dist(ww, hero) <= 5 && ww.turn.bonus === 0);
    }
    // pressed: beside one, hurt -> Disengage, step off, the crossbow
    var nx = null; for (var dx = -1; dx <= 1 && !nx; dx++) for (var dy = -1; dy <= 1 && !nx; dy++) if ((dx || dy) && G.canStand(ww, hx + dx, hy + dy)) nx = [hx + dx, hy + dy];
    put(hero, hx, hy); put(ww, nx[0], nx[1]); ww.hp = 8; cs = cardsOf(B);
    drain(D.ai.turn(B, ww));
    ok('pressed: Disengage, off the square (' + G.dist(ww, hero) + ' ft), a shot // ' + short(cs), say(cs, /\(Cunning Action\) disengages/) && G.dist(ww, hero) > 5 && say(cs, /Hand Crossbow/));
    // Hide: nobody sees him clearly
    ww.hp = ww.maxhp; B.units.forEach(function (u) { delete u.conds.hidden; });
    var hid = sq(ww, function (x, y) { return party(B).every(function (w) { return B.seenBy(w, ww) < 2; }) && !G.foesNear(ww, x, y, 5).length; });
    ok('a hiding square found: ' + hid, !!hid);
    if (hid) { put(ww, hid[0], hid[1]); cs = cardsOf(B); D.rules.startTurn(ww); drain(D.traits.after(B, ww)); ok('Hide: ' + short(cs), say(cs, /hides:/) && ww.turn.bonus === 0); }
    // the bolt: Hask down, the stair to run for
    var B2 = battle('crew'), w2 = foes(B2).filter(function (u) { return u.kind === 'wheelwright'; })[0], hk = foes(B2).filter(function (u) { return u.kind === 'hask'; })[0];
    hk.hp = 0; hk.dead = true; var h2 = party(B2)[0]; put(h2, w2.x + 1, w2.y); if (!G.canStand(h2, w2.x + 1, w2.y)) put(h2, w2.x, w2.y + 1);
    cs = cardsOf(B2); drain(D.ai.turn(B2, w2));
    ok('the bolt with a hero beside him: Disengage first // ' + short(cs), say(cs, /\(Cunning Action\) disengages/) && say(cs, /breaks and runs/));
    var B3 = battle('crew'), w3 = foes(B3).filter(function (u) { return u.kind === 'wheelwright'; })[0];
    foes(B3).filter(function (u) { return u.kind === 'hask'; })[0].dead = true; party(B3).forEach(function (u) { put(u, 1, 1); });
    cs = cardsOf(B3); drain(D.ai.turn(B3, w3));
    ok('the bolt with none near: the bonus Dash again, 90 ft // ' + short(cs), say(cs, /dashes again/));
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'SRDLEFT ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
