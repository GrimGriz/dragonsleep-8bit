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
    // ---------------------------------------------------------------- the Bandit Captain's Parry
    var C = battle('captain'), bc = foes(C).filter(function (u) { return u.kind === 'banditcaptain'; })[0], att = party(C).filter(function (u) { return u.weapon && !u.weapon.ranged; })[0];
    ok('the Captain carries parry ' + (bc && bc.parry), bc && bc.parry === 2);
    bc.hp = bc.maxhp = 99999; var cx = null; for (var ex = -1; ex <= 1 && !cx; ex++) for (var ey = -1; ey <= 1 && !cx; ey++) if ((ex || ey) && G.canStand(att, bc.x + ex, bc.y + ey)) cx = [bc.x + ex, bc.y + ey];
    put(att, cx[0], cx[1]);
    var parried = 0, firstOnly = true, missedByParry = true, hits = 0, n = 0;
    for (var i = 0; i < 300; i++) {
      bc.reaction = 1; cs = cardsOf(C); var hp0 = bc.hp, ac0 = D.rules.ac(bc);
      drain(C.attack(att, bc, att.weapon)); drain(C.attack(att, bc, att.weapon)); n += 2;
      var pc = cs.filter(function (c) { return /PARRY \+2/.test(c); });
      if (pc.length > 1) firstOnly = false;
      if (pc.length) { parried++; if (/PARRY \+2.*HIT/.test(pc[0].replace(/PARRY \+2/, 'PARRY +2'))) missedByParry = missedByParry && /MISS/.test(pc[0]); }
    }
    ok('Parry turns a blow (' + parried + ' of 300 pairs of swings), never twice on one reaction: ' + firstOnly, parried > 10 && firstOnly);
    // not against a ranged attack, nor a natural 20: only the melee, the reaction spent once
    bc.reaction = 1; cs = cardsOf(C); var rg = { name: 'Shortbow', atk: 40, dice: '1d6', mod: 0, type: 'piercing', range: [80, 320], ranged: true }; put(att, bc.x + 4, bc.y); drain(C.attack(att, bc, rg));
    ok('no Parry against a ranged attack (reaction ' + bc.reaction + ')', bc.reaction === 1 && !cs.some(function (c) { return /PARRY/.test(c); }));
    // ---------------------------------------------------------------- the ettin's Two Heads on a Hide: advantage on Perception, +5 to the passive one
    var E = battle('ettins'), eh = party(E)[0]; party(E).slice(1).forEach(function (u) { u.hp = 0; u.ko = true; });
    var es = sq(eh, function () { return foes(E).every(function (w) { return E.seenBy(w, eh) < 2; }); });
    ok('a square for the ettins Hide found: ' + es, !!es);
    if (es) { put(eh, es[0], es[1]); cs = cardsOf(E); D.rules.startTurn(eh); drain(E.hide(eh)); ok('Hide against two heads: passive 14 + 5 // ' + short(cs), say(cs, /vs passive Perception 19/) && say(cs, /two heads/)); }
    // ---------------------------------------------------------------- thrown weapons
    function shooterAt(fid, kind, ft) {
      var X = battle(fid), s = foes(X).filter(function (u) { return u.kind === kind; })[0], h = party(X)[0]; party(X).slice(1).forEach(function (u) { u.hp = 0; u.ko = true; });
      foes(X).filter(function (u) { return u !== s; }).forEach(function (u) { u.hp = 0; u.dead = true; }); s.bolts = null; s.cunning = false; s.speed = 0;
      var at = sq(h, function (x, y) { return G.dist(s, h) === ft && G.los(s, h).clear && D.magic.sees(X, s, h); });
      if (!at) return null; put(h, at[0], at[1]); h.hp = h.maxhp = 9999;
      var swung = []; var a0 = X.attack; X.attack = function* (att, tgt, atk) { if (att === s) swung.push(atk.name); return yield* a0.apply(this, arguments); };
      drain(D.ai.turn(X, s)); return swung;
    }
    var g1 = shooterAt('snoot', 'gnoll', 15), g2 = shooterAt('snoot', 'gnoll', 40);
    ok('the gnoll at 15 ft throws its spear: ' + g1, g1 && g1.join() === 'Thrown Spear');
    ok('the gnoll at 40 ft looses the longbow: ' + g2, g2 && g2.join() === 'Longbow');
    var d1 = shooterAt('captain', 'banditcaptain', 15);
    ok('the Captain at 15 ft throws two daggers: ' + d1, d1 && d1.join() === 'Thrown Dagger,Thrown Dagger');
  } catch (e) { errs.push(String(e && e.stack || e).slice(0, 800)); }
  var pre = document.createElement('pre'); pre.textContent = 'SRDLEFT ' + JSON.stringify({ checks: checks, errors: errs });
  document.body.appendChild(pre);
})();
