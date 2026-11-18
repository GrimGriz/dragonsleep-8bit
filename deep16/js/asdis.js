/* DEEP16 -- ASDIS SCALEBEAM'S THREE MEALS (2026-11-18, the asdis-meals seat, started by the lanes desk; the story build lane's 11-18 sections). His words, verbatim:
   "script for dwarven exposition meal/s (like the inn but friendly)"; "dwarven exposition meals - these are just Ingrith's elder meals I think, so about the dwarves going
   down to deepholm with various layers on player insight and history question rolls, etc. Mainly about why she stayed with Ingrith and those driving values as filler, some
   about the water burning (regretful necessary call)"; "1 - yes, Asdis"; "2 - 3 potential variants, just the Asdis ones ... the one's at the road's lamps we'll get to as we
   make the road"; on what the clans went down to keep, "let's call it a vigil, and it's the fight amount of 'far'"; on gating the Water Burning, "burning is town NPC, if
   they're reading this they should have heard of it by now"; and "Silent rolls on Asdis supper, go ahead and start a seat to build our first version".
     WHERE: her table over the west store (js/solskaft.js SK.ASDIS, SK.asdisTalk). She offers EAT AND SLEEP, one rest a day; a meal plays between the yes and the sleep.
       THREE MEALS, one a night, in order (f.asdisMeals counts them); after the third her rotating lines as before, and the rest with no meal.
     THE THREE: (1) THE STREET -- why the clans went back down; (2) WHY SHE STAYED -- the house, Ingrith, the post; (3) THE WATER BURNING. Each in three layers: PLAIN, which
       she tells as the meal opens, so every party has it; HISTORY, a hero's sharper question; INSIGHT, a hero's silent read and what it lets that hero say.
     THE VIGIL'S CEILING: she calls it a vigil and says NO more -- nothing of what the vigil is over, at any layer. A.CEILING is the bench's list of words no line here may hold.
     THE ROLLS ARE THE INN SUPPER'S LAW, SILENT (js/inn.js THE SUPPER AS RULED, 11-11; that file's In.meal is the Waterbys' own -- its state, its table, its warmth -- and does
       not lift without a rewrite of it, so this is the smallest engine that keeps the same law, on the same screen: js/counter.js THE OPEN SCREEN, THE FLIP, THE LOOK):
       ONE silent passive read a hero an opening, the best passive's alone, shown to that hero as that hero's own line; ONE skill-shaded answer a hero an opening, rolled
       silently once a hero a meal; no die on the screen -- every check into the play record (A.trail); a miss is never a dead end: the plain layer is told to everyone, and a
       missed History asks the blunt question, which she answers.
     WHAT IS KEPT: a flag a layer heard (each named in content's flags registry) for the lamp meals to come, and a JOURNAL line a meal (content/rumors.json r-asdis-*, js/counter.js C.heard).
     HER FACE: she speaks on `pt_asdis` when that sheet exists (asked of the art desk 11-18, not cut yet) and on her figure's face till then (js/counter.js C.spSheet): the
       cut needs no change here.
   Every line of hers here is the seat's DRAFT (invented.json asdis-meals-1118), his to re-word; her voice as her first lines have it (content/text.json deep.asdis0-3). */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, SK = D.solskaft, A = D.asdis = {};
  A.AB = { History: 'int', Insight: 'wis', Perception: 'wis' };
  A.TURNS = 3; A.BED = 'TO BED'; A.NAME = 'Asdis Scalebeam'; A.SHEET = 'pt_asdis';
  A.CEILING = /dragon|\begg|wyrm|sleeps|sleeping|Dvalgarda|\bsect\b|druid|\bthe Silver\b/i; // (what no line of hers may hold: the vigil is a word and nothing more)
  A.pinned = null; // (a show's or a bench's dice)
  A.d20 = function () { return A.pinned && A.pinned.length ? A.pinned.shift() : D.roll('1d20').total; };
  A.trail = function (s) { if (D.house && D.house.trail) D.house.trail('check', 'ASDIS\'S TABLE: ' + s); };
  A.passive = function (h, skill) { return 10 + DS.R.skill(h, skill, A.AB[skill]); };
  A.had = function (f) { return (f && f.asdisMeals) || 0; };
  A.due = function (f) { return A.had(f) < A.MEALS.length; };
  var QUIET = [`Spoons. The fire ticks.`, `Nobody talks for a while. The bread goes round.`, `Asdis fills a bowl that had not asked.`];
  var eat = { id: 'eat', all: true, again: true, last: true, say: function () { return `(Eat quietly.)`; }, run: function (S) { S.narr(QUIET[(S.quiet = (S.quiet || 0) + 1) % QUIET.length]); } };
  // a meal's filler, one a hero: `f` the hero's key to [the question, her answer]; one not of the four thanks her
  var fill = function (by) {
    return ['lymen', 'aurdin', 'vivian', 'barley'].map(function (k) { return { id: 'f_' + k, who: [k], say: function () { return by[k][0]; }, run: function (S) { S.by(by[k][1]); } }; })
      .concat([{ id: 'f_any', any: true, say: function () { return `Thank you for the supper.`; }, run: function (S) { S.by(`"Thank it by finishing it."`); } }]);
  };
  // the History question: every hero rolls it silently, once; made, the sharper question, SHADED; missed, the blunt one, which she still answers
  var deep = function (dc, sharp, blunt, run, miss) {
    return [{ id: 'deep', ok: function (S, e) { return S.made(e, 'History', dc); }, skill: function () { return 'History'; }, say: function () { return sharp; }, run: run },
            { id: 'blunt', ok: function (S, e) { return !S.asked.deep && !S.made(e, 'History', dc); }, say: function () { return blunt; }, run: miss }];
  };
  A.MEALS = [
    // ---- MEAL ONE, THE STREET: why the clans went back down. PLAIN: the mines called dead, forty families gone deep, she keeps the lamp. HISTORY: the seams were never
    // worked out; "dead" was a story. INSIGHT: she is not grieving a failed mine -- they went down to keep a vigil, and that word is all of it
    { id: 'street', flag: 'asdisStreet', rumor: 'r-asdis-street',
      open: function (S) {
        S.narr(`Soup and bread at the table by the hearth. Asdis ladles, and sits last.`);
        S.by(`"You came up a street of barred doors and did not ask. That's manners, or it's nerves."`);
        S.by(`"The mines were called dead. Forty families barred their doors and went back deep. I keep the lamp."`);
        S.by(`"Ask. I'd sooner be asked than wondered at."`);
      },
      reads: { duty: { skill: 'Insight', dc: 13, opens: 'kept', text: `(insight) She tells it without grief. Nobody mourns a mine like that.` } },
      ask: fill({ lymen: [`Why keep a lamp for a shut street?`, `"So it stays a street. A dark one is only a tunnel."`],
                  barley: [`Forty families. Who feeds the garrison now?`, `"The orchard, the dark, and me, when they'll sit down for it."`],
                  vivian: [`Barred from the outside. Nobody meant to hurry back.`, `"Nobody barred them in anger. They swept first."`],
                  aurdin: [`When did they go?`, `"Before your town had a wall worth the name. I stopped counting it in years."`] })
        .concat(deep(12, `Called dead. The seams under this mountain were never worked out. Who called them dead?`, `Dead how? Flooded? Fallen in?`,
          function (S) { S.f.asdisSeams = 1; S.by(`"We did."`); S.look(`Asdis breaks her bread in two and hands the bigger half across.`); S.by(`"A dead mine is one nobody asks after. The ore is where it always was."`); },
          function (S) { S.by(`"Called dead, I said. Mind the word."`); }))
        .concat([
          { id: 'kept', read: 'kept', say: function () { return `You don't sound like someone who lost anything.`; },
            run: function (S) { S.f.asdisVigil = 1; S.by(`"I didn't. Nothing failed."`); S.look(`Asdis looks at the lamp in her window, and back.`); S.by(`"They went down to keep a vigil. That's the word, and it's the only one of it you'll have from me."`); } },
          { id: 'over', all: true, needs: function (S) { return !!S.asked.kept; }, say: function () { return `A vigil over what?`; }, run: function (S) { S.by(`"Eat your soup."`); } } // (the ceiling: asked outright, she says no more)
        ]),
      close: `The pot is scraped. Asdis banks the fire and takes up her mending.` },
    // ---- MEAL TWO, WHY SHE STAYED: PLAIN: her brother's house, his daughter's, then Ingrith's; Ingrith would not leave her post. HISTORY: the warrant and a season.
    // INSIGHT: she stayed for Ingrith, not the street -- a post is kept, and so is kin
    { id: 'stayed', flag: 'asdisStayed', rumor: 'r-asdis-stayed',
      open: function (S) {
        S.narr(`Supper at her table again. The bread was cut before anyone sat.`);
        S.by(`"Ingrith came up for a loaf this morning and ate it standing. Ours. She keeps the garrison's ledger."`);
        S.by(`"The house below was my brother's, then his daughter's, then Ingrith's. They went down. Ingrith would not leave her post."`);
        S.by(`"And somebody should keep a lamp lit on the street. Go on. You've been counting chairs."`);
      },
      reads: { door: { skill: 'Insight', dc: 12, opens: 'forher', text: `(insight) She says "the street". The warmest place at the table is laid nearest the door, and nobody has been sat in it.` } },
      ask: fill({ lymen: [`Does she come up to eat?`, `"When the columns balance. So, not often."`],
                  barley: [`Good bread.`, `"It's bread. Somebody has to bake it."`],
                  vivian: [`What was she like, small?`, `"Exact. She would count the stairs and tell you if one was missing."`],
                  aurdin: [`What does a ledger keep, with the doors shut?`, `"Everything. That's the trouble with her."`] })
        .concat(deep(12, `A ledger post is sworn under warrant, a season at a time. How many has she sworn?`, `Couldn't she keep a ledger in Deepholm?`,
          function (S) { S.f.asdisWarrant = 1; S.by(`"One, she told them. One season under warrant, and then she'd follow the house down."`); S.look(`Asdis sets a covered bowl by the hearth to keep warm.`); S.by(`"She has sworn the next one every time, the day the last ran out. I stopped airing her room."`); },
          function (S) { S.by(`"She could keep one anywhere. She swore to keep this one."`); }))
        .concat([
          { id: 'forher', read: 'forher', say: function () { return `It isn't the street you stayed for.`; },
            run: function (S) { S.f.asdisForIngrith = 1; S.by(`"The street is stone. It keeps."`); S.by(`"She was six under this table. A clan can vote where it lives. It can't vote who I feed."`); S.by(`"A post is kept. So is kin. She keeps hers. I keep mine."`); } }
        ]),
      close: `Asdis covers what is left of the loaf, for the morning and for whoever comes up for it.` },
    // ---- MEAL THREE, THE WATER BURNING (no gate: "burning is town NPC, if they're reading this they should have heard of it by now"). PLAIN: the water went bad and the
    // dwarves answered it. HISTORY: Silverton remembers the fire and not the cistern; she gives the other half (TarlynsPit/wiki/deepholm-and-the-edifice.md, the clock, ~60).
    // INSIGHT: she does not defend it -- a regretful, necessary call
    { id: 'burning', flag: 'asdisBurning', rumor: 'r-asdis-burning',
      open: function (S) {
        S.narr(`The third night at her table. Asdis is slower with the ladle.`);
        S.by(`"You're Silverton people, or near enough. You had the Water Burning with your milk."`);
        S.by(`"The water went bad, and the king brought us out to answer it. One winter. That much your town tells true."`);
        S.by(`"You'll want the rest of it, or you'll want your beds. I'd not blame either."`);
      },
      reads: { right: { skill: 'Insight', dc: 14, opens: 'right', text: `(insight) She has not once said the dwarves were right.` } },
      ask: fill({ lymen: [`Papa says nobody bothers the dwarves, since.`, `"No. That was what it bought."`],
                  barley: [`A winter is a long time to be burned out.`, `"It is. I've been cold. I don't recommend it."`],
                  vivian: [`Do they still talk of it, down here?`, `"The garrison's too young. I talk of it. To the soup, mostly."`],
                  aurdin: [`And the cut? Is it still open?`, `"Bricked, with a red mark across it. Over the stable. Go and look."`] })
        .concat(deep(13, `Silverton keeps the fire. It never says what was in the water. What was?`, `Who fouled it?`,
          function (S) { S.f.asdisCistern = 1; S.by(`"Tannery runoff."`); S.by(`"A shaft crew broke through into an old cut of ours, one that fed a cistern. Nobody meant it."`); S.by(`"Your town kept the fire and lost the cistern. That's the half I can give back."`); },
          function (S) { S.by(`"Nobody you could hang. That was the worst of it."`); }))
        .concat([
          { id: 'right', read: 'right', say: function () { return `Was it right?`; },
            run: function (S) { S.f.asdisRegret = 1; S.look(`Asdis puts her spoon down.`); S.by(`"It was necessary. Water is the one thing down here nobody may be careless with, and they had to be made to know it."`); S.by(`"I have never once called it right. And if it came again I would not stop them. Sit with that. I do."`); } }
        ]),
      close: `Asdis banks the fire. She does not take up her mending tonight.` }
  ];
  A.speaker = function (u) { return { name: A.NAME, unit: u || null, side: 'right', sheet: A.SHEET }; };
  A.roomShot = function (B) { // (her room as the camera has it, live under the screen and dimmed -- js/inn.js In.roomShot's way)
    return function (ctx, x, y, w, h, behind) {
      if (behind || !D.ui || !D.ui.drawBattle) return false;
      var cards0 = B.cards; B.cards = [];
      ctx.save(); try { D.ui.drawBattle(ctx, B); } catch (e) { ctx.restore(); B.cards = cards0; return false; } ctx.restore(); B.cards = cards0;
      ctx.fillStyle = (D.hours && D.hours.SHOT && D.hours.SHOT.dim) || 'rgba(8,10,28,0.2)'; ctx.fillRect(0, 0, D.W, D.H); return true;
    };
  };
  // the meal on the open screen: `n` which (0-2), `u` her figure
  A.meal = function* (sc, B, u, n) {
    var C = D.counter, st = C.state(B), f = st.flags, ML = A.MEALS[n], she = A.speaker(u);
    var four = (B.roam.members || []).filter(function (m) { return m.src && !m.src.guest && !m.src.dead && !m.src.ko; }).slice(0, 4).map(function (m) { var k = m.src.key || m.src.id; return { u: m, h: m.src, key: k, hero: { id: k, key: k, name: m.name } }; });
    var S = { f: f, n: n, asked: {}, opened: {}, q: Object.keys(ML.reads), cur: {}, seen: {}, out: [], rolls: {}, turn: 0 };
    S.by = function (line) { S.out.push({ by: 1, line: line }); }; S.narr = function (line) { S.out.push({ narr: line }); }; S.look = function (line) { S.out.push({ look: 1, line: line }); };
    // a check, rolled once a hero a skill a meal, silently: the play record has it, the screen never
    S.made = function (e, skill, dc) { var k = e.key + ':' + skill; if (S.rolls[k] == null) { var r = A.d20(), v = DS.R.skill(e.h, skill, A.AB[skill]); S.rolls[k] = r + v >= dc; A.trail(e.hero.name + ' ' + skill + ' ' + r + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + (r + v) + ' vs DC ' + dc + (S.rolls[k] ? ', made' : ', missed') + ' (silent)'); } return S.rolls[k]; };
    var wait = function (o) { return o.narr ? sc.narr([o.narr]) : o.look ? sc.lookAt(she, [o.line], null) : sc.by(she, [o.line]); };
    A.trail('meal ' + (n + 1) + ' of ' + A.MEALS.length + ': ' + ML.id);
    f[ML.flag] = 1; if (C.heard) C.heard(st, ML.rumor); // (the plain layer is told as the meal opens: every party has it, and its JOURNAL line)
    ML.open(S);
    var prompt = S.out.pop(), i; for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
    var reach = function (e, id) { return A.passive(e.h, ML.reads[id].skill) >= ML.reads[id].dc; };
    var optsOf = function (e) { // (the hero's answers this opening: what a read opened first; ONE skill-shaded)
      var ok = ML.ask.concat([eat]).filter(function (o) {
        if (S.asked[o.id] && !o.again) return false;
        if (!o.all && (o.any ? ['lymen', 'aurdin', 'vivian', 'barley'].indexOf(e.key) >= 0 : o.who && o.who.indexOf(e.key) < 0)) return false;
        if (o.read && !(S.opened[e.key] || {})[o.read]) return false;
        if (o.ok && !o.ok(S, e)) return false; if (o.needs && !o.needs(S, e)) return false;
        return true;
      });
      var lead = ok.filter(function (o) { return o.read; }), tail = ok.filter(function (o) { return o.last; }), rest = ok.filter(function (o) { return !o.read && !o.last; }), out = [], shaded = 0;
      lead.concat(rest).forEach(function (o) { var sk = o.skill ? o.skill(S, e) : null; if (sk) { if (shaded) return; shaded++; } out.push({ o: o, label: o.say(S, e), shade: !!sk, tag: sk || null }); });
      return out.concat(tail.map(function (o) { return { o: o, label: o.say(S, e), shade: false, tag: null }; }), [{ o: null, label: A.BED }]);
    };
    var more = [`"There's more in the pot."`, `"Bread, if the soup's done."`], fillN = 0;
    for (S.turn = 1; S.turn <= A.TURNS && four.length; S.turn++) {
      // ONE read a hero an opening: the best passive that reaches it, and that hero's alone; a read nobody reaches is dropped into the record
      S.q = S.q.filter(function (id) { var any = four.some(function (e) { return reach(e, id); }); if (!any) A.trail('passive ' + ML.reads[id].skill + ' vs DC ' + ML.reads[id].dc + ', not read by anyone: ' + id); return any; }); S.cur = {};
      S.q.forEach(function (id) { var r = ML.reads[id], best = null; four.forEach(function (e) { if (S.cur[e.key] || !reach(e, id)) return; var pv = A.passive(e.h, r.skill); if (!best || pv > best.pv) best = { e: e, pv: pv }; }); if (!best) return;
        S.cur[best.e.key] = id; (S.opened[best.e.key] = S.opened[best.e.key] || {})[r.opens] = 1; A.trail(best.e.hero.name + ' passive ' + r.skill + ' ' + best.pv + ' vs DC ' + r.dc + ', read: ' + id); });
      var list = four.map(function (e) { var id = S.cur[e.key], r = id && ML.reads[id], ops = optsOf(e); return { e: e, hero: e.hero, side: 'left', key: e.key, rid: id || null, reads: r ? [r.text] : [], ops: ops,
        opts: ops.map(function (p) { return p.label; }), marks: ops.map(function (p) { return p.shade ? { shade: true, tag: p.tag } : null; }), ids: ops.map(function (p) { return p.o ? p.o.id : 'bed'; }), shaded: ops.filter(function (p) { return p.shade; }).length }; });
      var at0 = Math.max(0, list.map(function (x) { return x.key; }).indexOf(S.lastKey));
      var pk = yield sc.flip(she, [prompt.line], list, at0), x = list[pk && pk.at != null ? pk.at : at0] || list[0], p = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      Object.keys(S.cur).forEach(function (k) { var id = S.cur[k]; S.q = S.q.filter(function (y) { return y !== id; }); });
      S.lastKey = x.key;
      if (!p.o) break; // (TO BED: the openings left are lost)
      S.asked[p.o.id] = 1; S.out = []; sc.hero = x.hero; sc.heroSide = 'left';
      A.trail(x.hero.name + ': ' + p.label);
      p.o.run(S, x.e);
      var lo = S.out[S.out.length - 1], last = S.turn < A.TURNS && lo && lo.by ? S.out.pop() : null; // (her last word the next opening's question)
      for (i = 0; i < S.out.length; i++) yield wait(S.out[i]);
      prompt = last || { by: 1, line: more[fillN++ % more.length] };
    }
    sc.echo = null; sc.hero = null;
    f.asdisMeals = n + 1;
    yield sc.narr([ML.close]);
  };
  // between the yes and the sleep (js/solskaft.js SK.asdisTalk): tonight's meal, if one of the three is still to come
  A.supper = function* (B, u) {
    var C = D.counter, f = B.roam.flags, n = A.had(f); if (!C || !A.due(f)) return false;
    if (D.house && D.house.trail) D.house.trail('talk', 'asdis meal ' + (n + 1));
    var sc = new C.Counter(B, { id: 'asdismeal', name: A.NAME, place: 'Sólskaft', what: 'supper at her table', room: true, open: true, bg: A.roomShot(B), script: function (s) { return A.meal(s, B, u, n); } });
    D.push(sc); while (!sc.done) yield 1;
    return true;
  };
  // ---------------------------------------------------------------- shown (deep16/?solskaft&beat=asdismeal1|2|3&lvl=3): a NEW GAME's four in her room at dusk, the meals
  // before tonight's already had, the dice pinned high so the History question is the sharp one; E on her, EAT AND SLEEP
  if (SK && SK.BEATS) {
    [['THE STREET: why the clans went back down', 'her first meal'], ['WHY SHE STAYED: the house, Ingrith, the post', 'her second meal, the first had'], ['THE WATER BURNING', 'her third meal, two had']].forEach(function (b, n) {
      SK.BEATS.push({ id: 'asdismeal' + (n + 1), key: SK.ASDIS, label: 'ASDIS\'S TABLE, MEAL ' + (n + 1) + ' -- ' + b[0], at: [4, 3], hour: 18, flags: n ? { asdisMeals: n, asdisIdx: n } : {}, asdisPins: [18, 18, 18, 18],
        note: 'In her room over the west store at dusk, ' + b[1] + '. E on her, then EAT AND SLEEP: the meal plays before the cot. She tells the plain of it as it opens; flip through the four (the names at the bubble\'s head) -- one has a read in the insight colour and what it lets that hero say, and the shaded answer is the History question (the dice pinned high here: every hero has the sharp one). No die shows. Three openings, or TO BED; then the night.' });
    });
    var play0 = SK.play; SK.play = function (bt) { A.pinned = bt && bt.asdisPins ? bt.asdisPins.slice() : null; return play0.apply(this, arguments); };
  }
})();
