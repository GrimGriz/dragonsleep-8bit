/* DEEP16 — the ladder (?ladder): the leveling simulator. Griz, 09-27: "win this fight, level up, and we slowly fill
   out the bestiary" -- DEEP16 as the combat engine for every fight, built here apart from the 8-bit game and slotted
   back into it later. One rung a level, 1 to 9: the four from the 8-bit game at that level (its own rules build them),
   against that level's fight. Win, and the level-up card says what each of them gains; the next rung is the next
   level. Rungs without a fight yet stand on the list, greyed. Progress is kept per browser (deep16.ladder). */
'use strict';
(function () {
  var D = window.D16, I = D.input, DS = window.DS;
  var P = function (r, i) { return D.PAL.ramps[r][i]; };
  var KEY = 'deep16.ladder';
  // the four start the 8-bit game at level 2, and its rules build them from there. The ladder has a rung 1 all the same
  // (Griz, 09-27: "might as well add level 1, we'll want it eventually"): the level-1 sheets are drawn back from the
  // level-2 starts (js/save.js SV.levelOne), so rung 1 is fought at 1
  function low() { return 1; }

  // o.party 'ours' (?ladder&party=ours): the tester ladder (09-28h, Griz: "can we do the levels for the original classes up to nine
  // and do a tester version of the ladder with them as the party?" -- "the off SRD ones we made to 9"; "AI now, buttons later"):
  // Talmok, Willem, Katarina and Torvald built at the rung's level (js/classes.js NPC.ours), a camp of their own first (camp.js o.ours), and every
  // unit on both sides run by the class AI (a watch: battle.js o.watch). Its progress is kept apart (deep16.ladder.ours); no climb
  // P on it (or &play): YOU PLAY -- our four are yours to run, and every move is recorded (js/record.js); R saves the record to a file,
  // and after a save C (or CLEAR RECORD, top right) clears the fights that file holds from the browser (10-04, Griz: "add a 'clear record' after you save")
  function Ladder(o) { this.t = 0; this.o = o || {}; this.ours = this.o.party === 'ours'; }
  D.Ladder = Ladder;
  Ladder.prototype.key = function () { return this.ours ? KEY + '.ours' : KEY; };
  Ladder.prototype.enter = function () {
    var st = D.store.get(this.key()) || {};
    this.won = st.won || {};              // level -> true
    this.wonF = st.wonF || {};            // fight id -> true
    this.pick = st.pick || {};            // level -> which of the rung's fights (a rung may hold several: left/right)
    this.lo = 1; this.start = low();
    this.sel = Math.min(9, Math.max(this.lo, st.at || this.lo));
    this.card = null;                     // the level-up card, after a win
    this.play = this.ours && (!!this.o.play || !!st.play); // the tester ladder: you play our four (recorded), or watch the AI run them
    this.saved = null;                    // the file R last saved
    this.clearing = false;                // CLEAR RECORD's question is up (after a save: C)
    this.cleared = null;                  // what the last clear took, { gone, kept }
    D.music('title');
  };
  Ladder.prototype.save = function () { D.store.set(this.key(), { won: this.won, wonF: this.wonF, pick: this.pick, at: this.sel, play: this.play || undefined }); };
  // the rung's chosen fight (the set piece first; the others by left/right)
  Ladder.prototype.cur = function (L) { var fs = D.fightsAt(L); return fs.length ? fs[((this.pick[L] || 0) % fs.length + fs.length) % fs.length] : null; };

  // what each of the four gains going from level L to L+1, in the 8-bit game's own words (R.levelUp's messages)
  function gains(L, F) {
    var R = DS.R;
    return ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) {
      var h = L < DS.DATA.heroes[id].level ? D.save.levelOne(R.makeHero(id)) : R.makeHero(id, L), look = D.save.look(id, F), hp0 = h.maxhp;
      var msgs = (R.levelUp(h) || []).map(function (m) { return window.DS.stripCodes ? window.DS.stripCodes(String(m)) : String(m); });
      return { name: look.name || h.name, cls: h.cls, lvl: h.lvl, hp: h.maxhp - hp0, msgs: msgs };
    });
  }
  // the tester ladder's card: what each of our four gains going from L to L+1 -- the features (their own and the class's), the
  // scores, the slots, the spells new to the list (js/classes.js builds both sheets)
  var OURS_AT = {
    talmok: { 2: 'Reckless Attack, Danger Sense', 3: 'the Path of the Sand: First Blood, Down in the Sand, Pit Fists (1d4)', 5: 'Extra Attack, Fast Movement', 6: 'Answer Back; Pit Fists 1d6; a fourth rage', 7: 'Feral Instinct', 9: 'Brutal Critical; rage +3' },
    willem: { 2: 'the Rimeglass: Rime Doubles', 6: 'Rime Step' },
    katarina: { 2: 'Channel Divinity: the Doubling, Turn Undead', 5: 'Destroy Undead (CR 1/2)', 6: 'the Showing; a second Channel Divinity', 8: 'Divine Strike (1d8 psychic); Destroy Undead (CR 1)' },
    torvald: { 2: 'Channel Divinity: Hold the Door, Turn Undead', 5: 'Destroy Undead (CR 1/2)', 6: 'Wakeful; a second Channel Divinity', 8: 'Divine Strike (1d8 radiant); Destroy Undead (CR 1)' }
  };
  function oursGains(L) {
    var N = D.npc, R = DS.R;
    return N.OURS.map(function (k) {
      var a = N.sheet(N.spec(k + ':' + L + ':grown')), b = N.sheet(N.spec(k + ':' + (L + 1) + ':grown')), msgs = []; // (the grown builds: 09-28h)
      if (OURS_AT[k][L + 1]) msgs.push(OURS_AT[k][L + 1] + '.');
      var up = R.ABIL.filter(function (s) { return b.abil[s] > a.abil[s]; }).map(function (s) { return s.toUpperCase() + ' +' + (b.abil[s] - a.abil[s]); });
      if (up.length) msgs.push(up.join(', ') + '.');
      var nw = (b.known || []).filter(function (id) { return (a.known || []).indexOf(id) < 0 && D.magic.data(id); }).map(function (id) { return D.magic.data(id).name; });
      if (nw.length) msgs.push('New: ' + nw.join(', ') + '.');
      if ((b.slotsMax || []).join() !== (a.slotsMax || []).join()) msgs.push('Slots ' + b.slotsMax.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') + '.');
      return { name: b.name, cls: b.cls, lvl: b.lvl, hp: b.maxhp - a.maxhp, msgs: msgs };
    });
  }

  Ladder.prototype.fight = function (L) {
    var F = this.cur(L), self = this;
    if (!F) { D.sfx('error'); return; }
    D.sfx('confirm');
    // the tester ladder: our four at L, straight into the fight; you watch, or you play them and it is recorded (js/record.js).
    // (the record is finished off D.battle: a RESTART's new fight is the one that ends)
    // the camp first (js/camp.js): the gear, the day's spells, what's cast before the fight; then the fight. The tester ladder's camp is
    // our four's (o.ours, 09-29: the fight builds them from the morning's specs; you watch it, or play it and it is recorded)
    D.push(new D.Camp(L, F, function (res, info) { self.done(L, res, F, info); }, this.ours ? { ours: { party: D.npc.ours(L, F), play: this.play } } : null));
  };
  Ladder.prototype.done = function (L, res, F, info) {
    D.music('title');
    if (info && info.broke) { this.card = { broke: info.broke, how: info.how }; D.sfx('error'); return; } // (the floor, js/battle.js Battle.broke: nothing written)
    if (res !== 'won') return;
    this.won[L] = true; if (F) this.wonF[F.id] = true;
    if (L < 9) { this.card = { from: L, rows: this.ours ? oursGains(L) : gains(L, this.cur(L + 1)) }; this.sel = L + 1; D.sfx('levelup'); }
    else this.card = { top: true };
    this.save();
  };

  // the chosen rung's figures, fetched behind once it has been the chosen one a third of a second (10-03, the lazy seat's question 3, Griz:
  // "yes"): the four as its camp draws them, the fight's foes and scenery, a rung's own familiar -- so the camp opens without the beat. A
  // rung the mouse only runs over fetches nothing (js/sprites.js S.prefetch)
  Ladder.prototype.rungSheets = function (L) {
    var F = this.cur(L); if (!F) return [];
    var mapDef = D.MAPS[F.map] || {}, fam = F.familiar && D.FOES['fam_' + F.familiar];
    var four = this.ours ? D.npc.ours(L, F).map(function (k) { return D.npc.lookOf(D.npc.spec(k)); })
      : ['barley', 'aurdin', 'vivian', 'lymen'].map(function (id) { return D.save.look(id, F).sheet || id + '_p0'; });
    return four.concat((F.foes || mapDef.foes || []).map(function (f) { return D.FOES[f.kind] && D.FOES[f.kind].sheet; }), (F.riders || []).map(function (r) { return r.sheet; }), fam ? [fam.sheet] : []);
  };
  Ladder.prototype.update = function () {
    this.t++;
    var F0 = this.cur(this.sel), want = this.sel + ':' + (F0 ? F0.id : '');
    if (want !== this.wantKey) { this.wantKey = want; this.wantT = 0; } else if (++this.wantT === 20) D.spr.prefetch(this.rungSheets(this.sel));
    if (this.leaving) return this.leaveInput();
    if (this.clearing) return this.clearInput();
    // C, or the button top right: the climb (js/climb.js), one party from 1 to 9
    var cb = this.climbBtn, mm = I.mouse;
    if (!this.card && !this.ours && (I.pressed('center') || (mm.click && cb && mm.x >= cb.x && mm.x < cb.x + cb.w && mm.y >= cb.y && mm.y < cb.y + cb.h))) { D.sfx('confirm'); D.pop(); D.push(new D.Climb()); return; }
    if (this.card) {
      if (I.pressed('a') || I.pressed('b') || I.mouse.click) { D.sfx('confirm'); this.card = null; }
      return;
    }
    var inBtn = function (b) { return mm.click && b && mm.x >= b.x && mm.x < b.x + b.w && mm.y >= b.y && mm.y < b.y + b.h; };
    // VILLAINS on the combat ladder, HEROES on the tester ladder (10-09, Griz: "Do 'Villains' button on combat ladder page and 'heroes' button on playtester ladder page"):
    // each the other's door, top left -- the 8-bit title's PLAYTESTER LADDER row is OPTIONS now
    if (inBtn(this.swapBtn)) { D.sfx('confirm'); this.save(); location.href = this.ours ? '?ladder' : '?ladder&party=ours'; return; }
    if (this.ours && (I.pressed('play') || inBtn(this.playBtn))) { this.play = !this.play; D.sfx('confirm'); this.save(); return; }
    // R: the record to a file, on both ladders since 10-09 (his "add the download and clear fight history stuff from playtester ladder to the combat ladder")
    if (I.pressed('rec') || inBtn(this.recBtn)) { this.saved = D.rec.save(); this.cleared = null; D.sfx(this.saved ? 'confirm' : 'error'); return; }
    // C, or the CLEAR RECORD button, once a save has been made (on the combat ladder C is the climb's: the button only), after a question
    if (D.rec.clearable() && ((this.ours && I.pressed('center')) || inBtn(this.clrBtn))) { D.sfx('popup'); this.clearing = true; return; }
    var s0 = this.sel;
    if (I.repeat('up')) this.sel = Math.min(9, this.sel + 1);
    if (I.repeat('down')) this.sel = Math.max(this.lo, this.sel - 1);
    var nf = D.fightsAt(this.sel).length;
    if (nf > 1 && (I.repeat('left') || I.repeat('right'))) { this.pick[this.sel] = ((this.pick[this.sel] || 0) + (I.repeat('left') ? -1 : 1) + nf) % nf; D.sfx('cursor'); this.save(); }
    for (var k = this.lo; k <= 9; k++) if (I.pressed('n' + k)) this.sel = k;
    if (I.mouse.moved && I.mouse.inside && this.rows) this.rows.forEach(function (r) { if (I.mouse.x >= r.x && I.mouse.x < r.x + r.w && I.mouse.y >= r.y && I.mouse.y < r.y + r.h) this.sel = r.L; }, this);
    if (this.sel !== s0) { D.sfx('cursor'); this.save(); }
    if (I.pressed('a') || (I.mouse.click && this.rows && this.rows.some(function (r) { return r.L === this.sel && I.mouse.x >= r.x && I.mouse.x < r.x + r.w && I.mouse.y >= r.y && I.mouse.y < r.y + r.h; }, this))) this.fight(this.sel);
    // X or M asks first (09-27: M on the ladder threw the player out to the proof of concept's fight, whose menu has no
    // way back): E goes, X stays
    if (I.pressed('b') || I.pressed('menu')) { D.sfx('popup'); this.leaving = true; }
  };
  Ladder.prototype.leaveInput = function () {
    // to the 8-bit game's title, whose menu has both ladders (Griz, 09-29: the proof of concept's page came up blank)
    if (I.pressed('a')) { D.sfx('confirm'); location.href = '../'; return; }
    if (I.pressed('b') || I.pressed('menu') || I.mouse.click) { D.sfx('cancel'); this.leaving = false; }
  };

  // CLEAR RECORD's question (10-04): E clears the fights the last save holds, X (or M, or a click away) keeps them; each a click too, for a tap
  Ladder.prototype.clearInput = function () {
    var mm = I.mouse, hit = function (b) { return mm.click && b && mm.x >= b.x && mm.x < b.x + b.w && mm.y >= b.y && mm.y < b.y + b.h; };
    if (I.pressed('a') || hit(this.clrYes)) {
      var r = D.rec.clear();
      this.clearing = false; this.cleared = r || null; if (r) this.saved = null;
      D.sfx(r ? 'confirm' : 'error'); return;
    }
    if (I.pressed('b') || I.pressed('menu') || mm.click) { D.sfx('cancel'); this.clearing = false; }
  };

  function box(ctx, x, y, w, h) { D.win8(ctx, x, y, w, h); } // (the 8-bit game's window, as every DEEP16 menu: js/core.js D.win8, 10-01)
  Ladder.prototype.draw = function (ctx) {
    ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, D.W, D.H);
    // a faint rope of rungs up the left, for the look of it
    ctx.fillStyle = P('stone', 1); for (var y = 30; y < 250; y += 4) { ctx.fillRect(10, y, 1, 2); ctx.fillRect(22, y, 1, 2); }
    ctx.save(); ctx.translate(D.W / 2, 8); ctx.scale(2, 2); D.text(ctx, this.ours ? 'THE LADDER: OURS' : 'THE LADDER', 0, 0, P('gold', 4), 'center'); ctx.restore();
    D.text(ctx, this.ours ? 'Talmok, Willem, Katarina and Torvald at each level -- ' + (this.play ? 'YOU play them, every move recorded' : 'the class AI runs both sides, you watch') : 'win the fight, go up a level -- the four from the 8-bit game, built at each level by its own rules', D.W / 2, 26, P('silver', 5), 'center');
    this.rows = [];
    var x = 32, w = 250;
    for (var L = 9; L >= this.lo; L--) {
      var F = this.cur(L), nF = D.fightsAt(L).length, yy = 40 + (9 - L) * 24, on = L === this.sel, r = { x: x, y: yy, w: w, h: 21, L: L };
      this.rows.push(r);
      ctx.fillStyle = on ? P('gold', 1) : 'rgba(20,16,30,.9)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = on ? P('gold', 4) : F ? P('stone', 3) : P('stone', 2); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.fillStyle = this.won[L] ? P('gold', 3) : P('stone', 2); ctx.fillRect(8, yy + 8, 17, 3); // the rung
      D.text(ctx, 'L' + L, r.x + 5, r.y + 3, on ? P('gold', 4) : P('silver', 5));
      D.text(ctx, F ? F.name : '(a fight to build)', r.x + 24, r.y + 3, F ? (on ? P('bone', 2) : P('bone', 1)) : P('stone', 4));
      D.text(ctx, F ? F.sub : '', r.x + 24, r.y + 11, P('stone', 5));
      if (F && this.wonF[F.id]) D.text(ctx, 'WON', r.x + r.w - 5, r.y + 3, P('moss', 2), 'right');
      else if (this.won[L]) D.text(ctx, 'won', r.x + r.w - 5, r.y + 3, P('stone', 5), 'right');
      if (nF > 1) D.text(ctx, '< ' + (((this.pick[L] || 0) % nF + nF) % nF + 1) + '/' + nF + ' >', r.x + r.w - 5, r.y + 11, on ? P('gold', 4) : P('stone', 5), 'right');
    }
    // the chosen rung: its fight, and the four at that level
    var F2 = this.cur(this.sel), bx = 292, bw = D.W - bx - 6;
    box(ctx, bx, 40, bw, 196, F2 ? P('gold', 3) : P('stone', 3));
    D.text(ctx, 'LEVEL ' + this.sel, bx + 6, 45, P('gold', 4));
    var ty = 57; // the rung's words stack down the panel, each wrapped to it
    var put = function (txt, col) { D.wrap(txt, bw - 12).forEach(function (l) { D.text(ctx, l, bx + 6, ty, col); ty += 9; }); };
    if (F2) {
      put(F2.intro || '', P('bone', 1)); ty += 3;
      put('{g}' + (F2.from || '') + '{/}', P('accent', 2));
      var foes = (F2.foes || D.MAPS[F2.map].foes).map(function (f) { return D.FOES[f.kind] ? D.FOES[f.kind].name : f.kind; });
      var cnt = {}; foes.forEach(function (n) { cnt[n] = (cnt[n] || 0) + 1; });
      put('foes: ' + Object.keys(cnt).map(function (n) { return (cnt[n] > 1 ? cnt[n] + ' ' : '') + n; }).join(', '), P('red', 4));
    } else put('{g}no fight on this rung yet{/}', P('accent', 2));
    if (this.sel < this.start && !this.ours) put('{o}level-' + this.sel + ' sheets owed: they fight it at ' + this.start + '{/}', P('accent', 2));
    var party = this.partyAt(this.sel);
    var p0 = Math.max(112, ty + 4), ph = Math.min(28, Math.floor((232 - p0) / 4)); // the four close up when the rung's words run long
    party.forEach(function (h, i) {
      var yy = p0 + i * ph;
      D.text(ctx, '{y}' + h.name + '{/}  ' + D.clsLabel(h.cls) + ' ' + h.lvl, bx + 6, yy, P('bone', 1));
      D.text(ctx, 'HP ' + h.hp + '  AC ' + h.ac + '  ' + h.weapon, bx + 6, yy + 9, P('silver', 5));
      if (h.slots) D.text(ctx, h.slots, bx + 6, yy + 18, P('accent', 2));
    });
    D.hint(ctx, 'up/down or ' + this.lo + '-9 choose  ·  left/right: a rung with more fights  ·  E ' + (this.ours ? (this.play ? 'play' : 'watch') : 'fight') + '  ·  X back', D.W / 2, D.H - 12, P('stone', 5), 'center');
    // P (the tester ladder: play or watch) and R, the record to a file (both ladders since 10-09) -- each a click or a tap too: a tester on a phone has no keys
    var n = D.rec.count(), x0 = bx + 6, x1 = x0, w1 = 0;
    this.playBtn = null;
    if (this.ours) { w1 = D.text(ctx, '{y}P{/} ' + (this.play ? '{y}YOU PLAY{/}' : 'you watch'), x0, 240, P('silver', 5)); x1 = x0 + w1 + 14; this.playBtn = { x: x0 - 3, y: 237, w: w1 + 6, h: 12 }; }
    var w2 = D.text(ctx, '{y}R{/} save ' + n + ' recorded fight' + (n === 1 ? '' : 's'), x1, 240, P('silver', 5));
    this.recBtn = { x: x1 - 3, y: 237, w: w2 + 6, h: 12 };
    ctx.strokeStyle = P('stone', 3); if (this.playBtn) ctx.strokeRect(this.playBtn.x + 0.5, this.playBtn.y + 0.5, this.playBtn.w - 1, this.playBtn.h - 1); ctx.strokeRect(this.recBtn.x + 0.5, this.recBtn.y + 0.5, this.recBtn.w - 1, this.recBtn.h - 1);
    if (this.saved) D.text(ctx, '{g}saved: ' + String(this.saved).replace(/^deep16-play-record-/, '') + '{/}', bx + 6, 249, P('accent', 2)); // (the name's front dropped: the whole of it ran off the screen's edge)
    else if (this.cleared) D.text(ctx, '{g}' + (this.cleared.kept ? 'cleared ' + this.cleared.gone + ', kept ' + this.cleared.kept + ' newer' : 'record cleared: ' + this.cleared.gone + ' fight' + (this.cleared.gone === 1 ? '' : 's')) + '{/}', bx + 6, 249, P('accent', 2)); // (short: the line ends at the screen's edge)
    // the other ladder, top left: VILLAINS (our four, the tester ladder) from the heroes', HEROES back
    var sb = this.swapBtn = { x: 32, y: 4, w: 98, h: 20 };
    ctx.fillStyle = this.ours ? P('gold', 1) : P('red', 1); ctx.fillRect(sb.x, sb.y, sb.w, sb.h); ctx.strokeStyle = this.ours ? P('gold', 4) : P('red', 4); ctx.strokeRect(sb.x + 0.5, sb.y + 0.5, sb.w - 1, sb.h - 1);
    D.hint(ctx, this.ours ? '{y}HEROES{/}' : '{r}VILLAINS{/}', sb.x + sb.w / 2, sb.y + 2, P('bone', 1), 'center');
    D.text(ctx, this.ours ? 'the four heroes\' ladder' : 'our four: the tester ladder', sb.x + sb.w / 2, sb.y + 11, P('stone', 5), 'center');
    var nc = D.rec.clearable(); this.clrBtn = null;
    if (this.ours) {
      // (no climb: the climb is the four heroes'; its slot top right holds CLEAR RECORD once a save is made)
      this.climbBtn = null;
      if (nc && !this.card) {
        var kb = this.clrBtn = { x: D.W - 104, y: 4, w: 98, h: 20 };
        ctx.fillStyle = P('red', 1); ctx.fillRect(kb.x, kb.y, kb.w, kb.h); ctx.strokeStyle = P('red', 4); ctx.strokeRect(kb.x + 0.5, kb.y + 0.5, kb.w - 1, kb.h - 1);
        D.hint(ctx, '{r}CLEAR RECORD{/}  (C)', kb.x + kb.w / 2, kb.y + 2, P('bone', 1), 'center');
        D.text(ctx, nc + ' saved fight' + (nc === 1 ? '' : 's'), kb.x + kb.w / 2, kb.y + 11, P('stone', 5), 'center');
      }
      if (this.card) this.drawCard(ctx); if (this.leaving) this.drawLeave(ctx); if (this.clearing) this.drawClear(ctx); return;
    }
    var cb = this.climbBtn = { x: D.W - 104, y: 4, w: 98, h: 17 }, cl = D.climb && D.climb.load();
    ctx.fillStyle = P('violet', 1); ctx.fillRect(cb.x, cb.y, cb.w, cb.h); ctx.strokeStyle = P('violet', 4); ctx.strokeRect(cb.x + 0.5, cb.y + 0.5, cb.w - 1, cb.h - 1);
    D.hint(ctx, '{p}THE CLIMB{/}  (C)', cb.x + cb.w / 2, cb.y + 2, P('bone', 1), 'center');
    D.text(ctx, cl ? 'level ' + cl.level + ', run ' + cl.run : 'one party, 1 to 9', cb.x + cb.w / 2, cb.y + 10, P('stone', 5), 'center');
    // CLEAR RECORD beside the climb once a save is made (C is the climb's here: the button only)
    if (nc && !this.card) {
      var kc = this.clrBtn = { x: cb.x - 84, y: 4, w: 80, h: 20 };
      ctx.fillStyle = P('red', 1); ctx.fillRect(kc.x, kc.y, kc.w, kc.h); ctx.strokeStyle = P('red', 4); ctx.strokeRect(kc.x + 0.5, kc.y + 0.5, kc.w - 1, kc.h - 1);
      D.hint(ctx, '{r}CLEAR RECORD{/}', kc.x + kc.w / 2, kc.y + 2, P('bone', 1), 'center');
      D.text(ctx, nc + ' saved fight' + (nc === 1 ? '' : 's'), kc.x + kc.w / 2, kc.y + 11, P('stone', 5), 'center');
    }
    if (this.card) this.drawCard(ctx);
    if (this.leaving) this.drawLeave(ctx);
    if (this.clearing) this.drawClear(ctx);
  };
  Ladder.prototype.drawLeave = function (ctx) {
    var lw = 300, lx = (D.W - lw) / 2;
    box(ctx, lx, 104, lw, 46);
    D.text(ctx, '{y}LEAVE THE LADDER?{/}', D.W / 2, 112, P('gold', 4), 'center');
    D.text(ctx, 'back to the 8-bit game\'s title', D.W / 2, 124, P('bone', 1), 'center'); // (its title has the combat ladder; this page's VILLAINS / HEROES the other, 10-09)
    D.hint(ctx, '{g}E leave  ·  X stay{/}', D.W / 2, 137, P('accent', 2), 'center');
  };
  Ladder.prototype.drawClear = function (ctx) {
    var lw = 320, lx = (D.W - lw) / 2, nc = D.rec.clearable(), since = D.rec.count() - nc;
    var ls = D.wrap('The ' + nc + ' fight' + (nc === 1 ? '' : 's') + ' in ' + (D.rec.lastFile() || 'the file') + ' leave this browser; the file keeps ' + (nc === 1 ? 'it' : 'them') + '.' + (since > 0 ? ' ' + since + ' played since ' + (since === 1 ? 'stays' : 'stay') + '.' : ''), lw - 20);
    var h = 48 + ls.length * 9, y = 96;
    box(ctx, lx, y, lw, h);
    D.text(ctx, '{y}CLEAR THE RECORD?{/}', D.W / 2, y + 8, P('gold', 4), 'center');
    ls.forEach(function (l, i) { D.text(ctx, l, D.W / 2, y + 22 + i * 9, P('bone', 1), 'center'); });
    var by = y + h - 16, w1 = 74, w2 = 74, bx1 = D.W / 2 - w1 - 8, bx2 = D.W / 2 + 8;
    this.clrYes = { x: bx1, y: by, w: w1, h: 12 }; this.clrNo = { x: bx2, y: by, w: w2, h: 12 };
    ctx.strokeStyle = P('stone', 3); ctx.strokeRect(bx1 + 0.5, by + 0.5, w1 - 1, 11); ctx.strokeRect(bx2 + 0.5, by + 0.5, w2 - 1, 11);
    D.text(ctx, '{y}E{/} clear', bx1 + w1 / 2, by + 3, P('accent', 2), 'center');
    D.text(ctx, '{y}X{/} keep', bx2 + w2 / 2, by + 3, P('silver', 5), 'center');
  };
  // a light read of the four at a level (cached per level and fight: a fight may give them its own looks)
  Ladder.prototype.partyAt = function (L) {
    this.cache = this.cache || {};
    var F = this.cur(L), key = L + ':' + (F ? F.id : '');
    if (this.cache[key]) return this.cache[key];
    var R = DS.R;
    // the tester ladder: our four as js/classes.js builds them at L
    if (this.ours) return (this.cache[key] = D.npc.ours(L, F).map(function (k) {
      var h = D.npc.sheet(D.npc.spec(k)), w = R.weaponOf(h);
      return { name: h.name, cls: h.cls, lvl: h.lvl + (h.subclass ? ' (' + h.subclass + ')' : ''), hp: h.maxhp, ac: R.ac(h), weapon: w ? w.name : '', slots: h.slotsMax && h.slotsMax.length ? 'slots ' + h.slotsMax.map(function (n, i) { return (i + 1) + ':' + n; }).join(' ') : '' };
    }));
    var data = D.save.fixture(L);
    return (this.cache[key] = data.party.map(function (h) {
      var look = D.save.look(h.id, F), w = R.weaponOf(h);
      return { name: look.name || h.name, cls: h.cls, lvl: h.lvl, hp: h.maxhp, ac: R.ac(h), weapon: w ? w.name : '', slots: h.slotsMax && h.slotsMax.length ? 'slots ' + h.slotsMax.map(function (n, k) { return (k + 1) + ':' + n; }).join(' ') : '' };
    }));
  };
  Ladder.prototype.drawCard = function (ctx) {
    var c = this.card, w = 420, x = (D.W - w) / 2;
    if (c.broke) {
      var bl = D.wrap('It broke ' + (c.how || 'mid-way') + ': ' + c.broke, w - 30);
      box(ctx, x, 84, w, 52 + bl.length * 9);
      D.text(ctx, '{r}THE FIGHT BROKE.{/}', D.W / 2, 94, P('gold', 4), 'center');
      bl.forEach(function (l, i) { D.text(ctx, l, D.W / 2, 110 + i * 9, P('bone', 1), 'center'); });
      D.text(ctx, 'No result was written: the rung stands as it was.', D.W / 2, 114 + bl.length * 9, P('silver', 5), 'center');
      D.hint(ctx, '{g}E{/}', D.W / 2, 126 + bl.length * 9, P('accent', 2), 'center');
      return;
    }
    if (c.top) {
      box(ctx, x, 90, w, 60);
      D.text(ctx, '{y}THE TOP OF THE LADDER{/}', D.W / 2, 100, P('gold', 4), 'center');
      D.text(ctx, 'Level 9 won. The ladder goes no higher -- yet.', D.W / 2, 116, P('bone', 1), 'center');
      D.hint(ctx, '{g}E{/}', D.W / 2, 134, P('accent', 2), 'center');
      return;
    }
    var lines = [];
    c.rows.forEach(function (r) {
      lines.push('{y}' + r.name + '{/} is a ' + r.cls + ' of level ' + r.lvl + '  {n}+' + r.hp + ' HP{/}');
      r.msgs.filter(function (m) { return !/level \d|reaches level|HP/i.test(m); }).slice(0, 3).forEach(function (m) { D.wrap(m, w - 30).forEach(function (l) { lines.push('   ' + l); }); });
    });
    var h = lines.length * 9 + 34, y = Math.max(8, (D.H - h) / 2);
    box(ctx, x, y, w, h);
    D.text(ctx, '{y}LEVEL UP: ' + c.from + ' -> ' + (c.from + 1) + '{/}', D.W / 2, y + 6, P('gold', 4), 'center');
    lines.forEach(function (l, i) { D.text(ctx, l, x + 8, y + 20 + i * 9, P('bone', 1)); });
    D.hint(ctx, '{g}E{/}', D.W / 2, y + h - 10, P('accent', 2), 'center');
  };
})();
