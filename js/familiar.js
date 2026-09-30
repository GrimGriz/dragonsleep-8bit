/* DRAGONSLEEP — Find Familiar in the 8-bit game (SRD 5.1; REINSTATED 09-29, Griz: "familiars are pretty sweet - let's reinstate").
   The ritual is cast from the field menu's MAGIC, from the book (no slot), burning a bundle of Calling Herbs (500 sp, Mama's only:
   RULED 09-29), and the shape is picked from what lives on the ground you stand on (js/rules.js R.famForms: "select by biome").
   A new casting while it serves gives it a new shape. Canon: Aurdin's familiar is "undecided until he does the ritual in story"
   (wiki/aurdin.md, CANON 09-10) -- this is that ritual, and the player's pick is his.
   In an 8-bit fight it rides the wizard's shoulder (RULED 09-29): "First ally to attack after wizards turn if the wizard doesn't
   attack" has advantage -- and if he does attack, his own first attack roll that turn has it; no new choice in the combat menu. The
   foes never pick it, but a blast that catches the wizard catches it, "even if wizard saves". The grid's familiar (a figure of its
   own) is deep16/js/familiar.js. Lines are looked up from content/text.json ('fam.*'). */
'use strict';
(function () {
  var DS = window.DS, R = DS.R, W8 = DS.W8, EV = DS.EV, L = DS.L;
  function G() { return DS.G; }
  function F() { return DS.field; }
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }

  // the shapes a spirit may take here: the world map's ground under the party, else the caves or the town
  function formsHere() {
    var g = G(), f = F(), src = f && f.map && f.map.src;
    if (!src) return ['owl'];
    if (src.id === 'world') { var row = src.rows[g.y] || '', t = row.charAt(g.x); return R.famForms(t, 'world'); }
    return R.famForms(null, src.tileset === 'town' || src.tileset === 'inside' ? 'town' : 'cave');
  }

  var baseCast = EV.fieldCast;
  EV.fieldCast = function* (h, sp) {
    if (sp.kind !== 'familiar') { yield* baseCast(h, sp); return; }
    var g = G(), fl = g.flags.familiar, had = fl && fl.by === h.id ? fl : null;
    if (had) {
      yield DS.say(L('fam.keep', { name: h.name, form: R.FAMILIARS[had.kind].name }));
      var go = yield DS.choose({ items: [{ label: 'A NEW SHAPE', value: 'y' }, { label: 'LEAVE IT', value: 'n' }], x: 60, y: 60, w: 150, title: 'A NEW SHAPE?' });
      if (go !== 'y') return;
    }
    if (sp.component && g.count(sp.component) < 1) { yield DS.say(L('g.noComponent', { item: DS.DATA.items[sp.component].name })); return; }
    var forms = formsHere().filter(function (k) { return R.FAMILIARS[k]; });
    var items = forms.map(function (k) { return { label: R.FAMILIARS[k].name.toUpperCase(), right: R.FAMILIARS[k].hp + ' HP', value: k }; });
    var pick = yield DS.choose({ items: items, x: 60, y: 50, w: 150, title: 'WHAT SHAPE?',
      drawExtra: function (ctx, menu) { var c = menu.current() && menu.current().value; if (!c || !R.FAMILIARS[c]) return; DS.win(ctx, 4, 196, 248, 40); DS.wrap(R.FAMILIARS[c].gift, 236).slice(0, 3).forEach(function (l, i) { DS.text(ctx, l, 10, 203 + i * 10, '#E0C8A0'); }); } });
    if (!pick) return;
    if (sp.component) g.take(sp.component, 1);
    yield DS.say(L('fam.ritual'));
    yield DS.fade(1, 20); yield W8.frames(40); yield DS.fade(0, 20);
    g.flags.familiar = { kind: pick, by: h.id, hp: R.FAMILIARS[pick].hp };
    delete g.flags.familiarGone;
    DS.audio.sfx('magic');
    yield DS.say(had ? L('fam.change', { name: h.name, old: R.FAMILIARS[had.kind].name, a: an(R.FAMILIARS[pick].name) })
                     : L('fam.come', { name: h.name, a: an(R.FAMILIARS[pick].name) }));
  };

  // ---------------------------------------------------------------- the 8-bit fight: on the wizard's shoulder
  var B = DS.Battle.prototype;
  function famFor(u) { var f = G().flags.familiar; return f && u && u.h && !u.guest && u.h.id === f.by ? f : null; }
  function downed(u) { return u.h ? (u.h.ko || u.h.hp <= 0) : u.dead; }
  // the one question js/battle.js advantage() asks: does the familiar's help land on this roll?
  B.famHelps = function (a, t) {
    var f = G().flags.familiar; if (!f || !a || !a.h) return false;
    if (this.famTurn && a === this.famTurn) { if (this.famAttacked) return false; this.famAttacked = true; return true; } // (his own first attack)
    if (this.famPending && a.h.id !== f.by) { this.famPending = false; return true; }                                  // (the first ally after him)
    return false;
  };
  var baseHero = B.heroTurn;
  B.heroTurn = function* (u) {
    var f = famFor(u);
    if (f) { this.famTurn = u; this.famAttacked = false; this.famPending = false; } // (a help not taken lapses at his next turn: SRD Help)
    yield* baseHero.call(this, u);
    if (f && this.famTurn === u) {
      this.famTurn = null;
      if (!this.famAttacked && !downed(u) && !this.over && G().flags.familiar) {
        this.famPending = true;
        yield* this.say(L('fam.darts', { name: u.h.name, form: R.FAMILIARS[f.kind].name }), 34);
      }
    }
  };
  // a blast that catches the wizard catches it, whatever his save (js/battle.js asks this after each one caught)
  B.famSplash = function* (t, dmg) {
    var f = famFor(t); if (!f || !dmg) return;
    var form = R.FAMILIARS[f.kind].name;
    f.hp = (f.hp == null ? R.FAMILIARS[f.kind].hp : f.hp) - dmg;
    if (f.hp > 0) { yield* this.say(L('fam.buffeted', { name: t.h.name, form: form }), 30); return; }
    delete G().flags.familiar; G().flags.familiarGone = f.kind; this.famPending = false;
    yield* this.say(L('fam.caught', { name: t.h.name, form: form }), 40);
  };
})();
