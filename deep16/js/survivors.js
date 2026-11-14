/* THE SURVIVORS' TALK -- a band of survivors met on THE WORLD, in portraits (the survivors-talk seat, 2026-11-14, Opus; the clock lane's 2026-11-14 survivors-talk
   section). His words, typed to the clock seat, on the card the meeting showed: "portrait back and forth with generic npc portrait and party?"; then "Portrait talk -
   should be easy enough for an opus to do, write a primer and include to use the format from the inn supper where each party member might roll an insight, perception
   type check (compare proficiencies for best fit) - let the survivors have expository pieces a player can get to."

   THE SHAPE is the Halfway Inn's supper (js/inn.js In.meal) on the open counter screen (js/counter.js THE FLIP): the band's one speaking stands top right on the generic
   man's or woman's portrait (pt_genman, pt_genwoman: the unnamed's faces, C.GENERIC), the party bottom left, a hero at a time. At each opening the player flips through the
   four and picks ONE line of one hero's. A piece behind a skill is offered only to the hero best at that skill (In.best's comparison: the highest skill total of the
   party standing) and is SHADED with the skill's name -- one shaded a hero an opening, the rest held for the next; its check is rolled silently into the play record, as
   the supper's are (ruling 4 of the supper, his "quit showing die rolls and have the skill-influenced chat options shaded as such"). A made check opens the piece; a missed
   one gets a thinner answer, never a false one. One silent read (Perception, passive) as the supper has them, shown above its hero's lines. WALK ON is on every list.

   WHAT A SURVIVOR CAN TELL is only what the engine knows of the band (js/hunger.js HG.refugees): the making's ground (W.makingZone: the marsh's wisp and stirge, the
   mountains' wolf and worg -- which of the two stood over this band is the band's own, by its id), where it fed (the band's kind: a farm, a hamlet, a road, open
   country), the dawn it fed, which way the marker went on at that dawn (HG.sim's trail), and where the band is bound. What the made things do is sourced: they stand over
   a sleeper at first light and do not bite; the one stood over cannot lift a bucket after (the supper's heardMade, js/inn.js In.MEAL.bands); they feed on magic -- the one
   they stand over is the one with a little of it, who did not know (his 11-14, the clock lane section 11: "early morning attacks (during spell prep) on those that didn't
   know they had magic (survivor stories)"). A band whose ground is not a making's (the Snoot's burnt-out, the clock seat's next) gets the talk's frame and its road alone.
   Every line here is the seat's draft (RULED 09-24: the drafts stand; invented.json survivors-*). The show: deep16/?survivorsshow. The bench: mode=hunger1114, check 7. */
'use strict';
(function () {
  var D = window.D16, W = D.world, HG = D.hunger, SV = D.survivors = {};
  SV.DC = { Insight: 12, Medicine: 12, Survival: 12, Arcana: 13, read: 13 }; // (the seat's numbers, the supper's band of them: a level-3 party's best makes them more often than not)
  SV.AB = { Insight: 'wis', Medicine: 'wis', Survival: 'wis', Arcana: 'int', Perception: 'wis' };
  SV.TURNS = 4; SV.CAP = 5; SV.WALK = 'WALK ON';
  SV.MADE = { glowseep: ['wisp', 'stirge'], doors: ['wolf', 'worg'] }; // (js/world.js W.MADE: the two of each ground's table he makes over; the gnoll hills' hyenas send nobody)

  // ---------------------------------------------------------------- the band, by its kind: who speaks, who was stood over, how they are seen on the road
  // (sight: what the party sees as it comes up -- js/hunger.js HG.LINES[kind], the same words as the card that stands in where no game is up)
  SV.KINDS = {
    farm: { name: 'The farmer', sheet: 'pt_genman', who: 'his wife', obj: 'her', pos: 'her', Subj: 'She', over: 'over her bed', inside: true,
      opener: '"It came {when}. We\'re for {to}, all we own on the cart, and we don\'t stop."',
      chose: '"It came in past the boy\'s cot. Past me. It went to her like it knew the way."',
      hands: '"She can\'t lift the boy. Since that morning she can\'t lift her own boy."',
      magic: '"Magic? She\'s a farmer\'s wife."' },
    hamlet: { name: 'A woman of the hamlet', sheet: 'pt_genwoman', who: 'the smith', obj: 'him', pos: 'his', Subj: 'He', over: 'over the smith\'s bed', inside: true,
      opener: '"It came {when}. Every soul of us is on these carts, for {to}. Nobody stayed."',
      chose: '"It went down the row past every door to his. Not the first house, not the nearest. His."',
      hands: '"Our smith. He can\'t lift his own hammer. He walks at the back so nobody sees."',
      magic: '"Him? He shoes horses."' },
    road: { name: 'The drover', sheet: 'pt_genman', who: 'my brother', obj: 'him', pos: 'his', Subj: 'He', over: 'over my brother where he lay by the fire', inside: false,
      opener: '"It came {when}, at our fire on the road. The beasts ran. We\'re for {to} on foot."',
      chose: '"Two of us at that fire, and it stepped over me to get to him."',
      hands: '"He can\'t carry his own pack. I carry both."',
      magic: '"Him? He can\'t read his own name."' },
    wild: { name: 'The trapper', sheet: 'pt_genman', who: 'me', obj: 'me', pos: 'my', Subj: 'I', self: true, over: 'over me where I lay', inside: false,
      opener: '"It came {when}, out where I set my lines. I\'m for {to}. I don\'t know what else to do."',
      chose: '"I\'ve slept out thirty years. Nothing comes to a fire. This came to mine, and to me, like I was what it came for."',
      hands: '"I can\'t lift my own line. I\'ve wound it round my neck to carry it."',
      magic: '"Me? I trap rabbits."' }
  };
  // what stood over them, by the creature (the house look: the mirror eye, the ripple over its body; the wolves' coats with Mr. Ripples' starfield fixed in them --
  // data/foes.js THE MIRROR WISP, THE MIRROR STIRGE, THE MIRROR WOLF and THE MIRROR WORG); the eyes that give your own face are the supper's word (heardMade)
  SV.CREATURES = {
    wisp: '"A light. It came in like the lights on the bog, only the wrong colour, violet, and it grew. It stood {over} till first light. It never touched {obj}."',
    stirge: '"A stirge, we took it for. Off the bog. Only it never drank. It hung {over} with its beak down and never touched {obj}, till the sun was up."',
    wolf: '"A wolf{in}, and its coat full of stars like a clear night. It didn\'t bite. It stood {over} and waited for the light."',
    worg: '"Bigger than any wolf has a right to be. It stood {over} till first light, and it never bit."'
  };
  SV.EYES = '"And its eyes. You looked in them and it was your own face looking back."';
  // the pieces behind a skill: `ask` the hero's line (shaded with the skill), `made` and `missed` what comes back -- each list of { by: 'them' | narr } in order
  SV.PIECES = [
    { id: 'chose', skill: 'Insight', ask: function (b) { return b.K.self ? 'There\'s more to it than that. Why you?' : 'There\'s more to it than that. Why ' + b.K.obj + '?'; },
      made: function (b) { return [{ by: b.K.chose }]; }, missed: function () { return [{ by: '"There\'s nothing more to it. It came, and we went."' }]; } },
    { id: 'look', skill: 'Medicine', ask: function (b) { return b.K.self ? 'Hold still. Let me look at you.' : 'Let me look at ' + b.K.obj + '.'; },
      made: function (b) { return [{ narr: '(medicine) No wound on ' + b.K.obj + ', no fever, nothing broken. Only the strength gone out of ' + b.K.pos + ' arms, the way it goes out of the very old.' }]; },
      missed: function (b) { return [{ narr: '(medicine) ' + b.K.Subj + (b.K.self ? ' am' : ' is') + ' weak. More than that you cannot tell on the road.' }]; } },
    { id: 'went', skill: 'Survival', ask: 'When it left you, which way did it go, and how?',
      made: function (b) { return [{ by: '"' + b.dir.charAt(0).toUpperCase() + b.dir.slice(1) + ', at first light. Not running. Walking, like it knew where it was going."' }]; },
      missed: function () { return [{ by: '"Off with the light. Nobody watched which way."' }]; } },
    { id: 'why', skill: 'Arcana', ask: function (b) { return b.K.self ? 'Have you ever had a knack you couldn\'t explain?' : 'Has ' + b.K.Subj.toLowerCase() + ' ever had a knack nobody could explain?'; },
      made: function (b) { return [{ by: b.K.magic }, { narr: '(arcana) A thing that feeds on magic would pass every sleeper with none in them. The one it stood over had a little, and never knew it.' }]; },
      missed: function (b) { return [{ by: b.K.magic }, { narr: '(arcana) Why that one and not another, you cannot say.' }]; } }
  ];
  // the plain asks (no check): what drove them out; where they will go; and what the read opens
  SV.ASKS = {
    what: { say: 'What drove you out?' },
    bound: { say: 'Where will you go?', back: '"{to}. There\'s people there. After that, I don\'t know."' },
    hands: { say: function (b) { return b.K.self ? 'What\'s wrong with your hands?' : 'What\'s wrong with ' + b.K.pos + ' hands?'; } }
  };
  SV.READ = { skill: 'Perception', text: function (b) { return b.K.self ? '(perception) The trapper has not once used his hands since you came up. The snare-line is wound round his neck.' : '(perception) ' + (b.kind === 'farm' ? 'The woman on the cart' : b.kind === 'hamlet' ? 'The big man at the back' : 'The other drover') + ' has not once used ' + b.K.pos + ' hands since you came up. They hang.'; } };
  SV.MORE = ['"Ask, if you\'re asking. We\'re not stopping."', '"Walk with us, then, if you want more."', '"Is that all?"'];
  SV.GOING = 'They are making for {to}. They do not stop.';
  SV.NOTMADE = '"We\'re for {to}. Let us by."'; // (a band whose ground is no making's: the Snoot's own, the clock seat's next)

  // ---------------------------------------------------------------- the band read off the engine
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  SV.creature = function (r) { var two = SV.MADE[r.zone]; return two ? two[hash(r.id) % two.length] : null; }; // (which of its ground's two stood over this band: the band's own, the same every time)
  SV.COMPASS = ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'];
  SV.dirOf = function (dx, dy) { var a = Math.atan2(-dy, dx); return SV.COMPASS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }; // (THE WORLD's y runs south: Silverton's is the smallest)
  SV.went = function (r) { // (the marker's step at the dawn it fed this band: from hex0 to the trail's hex that dawn)
    var MW = W.Mworld(), x = HG.sim(r.t0 + 1).by[r.day], dn = Math.floor((r.t0 - HG.DAWN) / 24), s = x && x.trail.filter(function (q) { return q.dn === dn; })[0];
    if (!MW || !s) return null; var w = MW.w, c0 = [w * (r.hex0[0] + r.hex0[1] / 2), w * Math.sqrt(3) / 2 * r.hex0[1]], c1 = [w * (s.hex[0] + s.hex[1] / 2), w * Math.sqrt(3) / 2 * s.hex[1]];
    return SV.dirOf(c1[0] - c0[0], c1[1] - c0[1]);
  };
  SV.when = function (r) { var d = W.day() - (Math.floor(r.t0 / 24) + 1); return d <= 0 ? 'this morning, at first light' : d === 1 ? 'yesterday, at first light' : d + ' mornings back, at first light'; };
  SV.band = function (r) {
    var K = SV.KINDS[r.kind] || SV.KINDS.farm, cr = SV.creature(r);
    return { r: r, kind: SV.KINDS[r.kind] ? r.kind : 'farm', K: K, cr: cr, dir: cr ? SV.went(r) : null, when: SV.when(r), to: r.toName };
  };
  SV.fill = function (l, b) { return String(l).split('{to}').join(b.to).split('{when}').join(b.when).split('{over}').join(b.K.over).split('{obj}').join(b.K.obj).split('{in}').join(b.K.inside ? ' indoors' : ''); };
  SV.what = function (b) { return b.cr ? [SV.fill(SV.CREATURES[b.cr], b), SV.EYES] : [SV.fill(SV.NOTMADE, b)]; };
  SV.trail = function (s) { if (D.house && D.house.trail) D.house.trail('check', 'THE SURVIVORS: ' + s); };
  SV.d20 = function () { var In = D.inn; return In && In.d20 ? In.d20() : D.roll('1d20').total; }; // (the supper's die: a show's In.pinned pins it)
  SV.skill = function (h, sk) { return DS.R.skill(h, sk, SV.AB[sk]); };
  SV.best = function (four, sk) { var b = null; four.forEach(function (e) { var v = SV.skill(e.h, sk); if (!b || v > b.v) b = { e: e, v: v }; }); return b; }; // (js/inn.js In.best's comparison, over the four standing)

  // ---------------------------------------------------------------- the talk (the shape of js/inn.js In.meal: the flip, one line an opening, the shaded one a hero)
  SV.talk = function* (sc, r) {
    var st = sc.st, b = SV.band(r), sp = { name: b.K.name, sheet: b.K.sheet, side: 'right' };
    var four = st.party.filter(function (h) { return h && !h.dead && !h.ko && h.hp > 0 && !h.guest; }).map(function (h) { var k = h.key || h.id; return { h: h, key: k, hero: { id: k, key: k, name: h.name }, side: 'left' }; });
    var T = { b: b, asked: {}, rolls: {}, out: [], read: null, readSeen: false };
    var by = function (line) { T.out.push({ by: SV.fill(line, b) }); }, narr = function (line) { T.out.push({ narr: SV.fill(line, b) }); };
    var made = function (e, sk) { var k = e.key + ':' + sk; if (T.rolls[k] == null) { var d = SV.d20(), v = SV.skill(e.h, sk), need = SV.DC[sk]; T.rolls[k] = d + v >= need; SV.trail(e.hero.name + ' ' + sk + ' ' + d + (v >= 0 ? ' + ' : ' - ') + Math.abs(v) + ' = ' + (d + v) + ' vs DC ' + need + (T.rolls[k] ? ', made' : ', missed') + ' (silent)'); } return T.rolls[k]; };
    var wait = function (o) { return o.narr ? sc.narr([o.narr]) : sc.by(sp, [o.by], 'concerned'); };
    SV.trail('the ' + b.kind + ' band of the day-' + r.day + ' making (' + (r.zone || 'no making') + ', ' + (b.cr || 'none') + '), bound for ' + r.toName + '; it went ' + (b.dir || '?') + ' at the dawn it fed');
    // the pieces this band has, each to the hero best at its skill
    var pieces = b.cr ? SV.PIECES.filter(function (p) { return p.id !== 'went' || b.dir; }) : [], owner = {};
    pieces.forEach(function (p) { var bb = four.length ? SV.best(four, p.skill) : null; if (bb) owner[p.id] = bb.e.key; });
    // the read: the party's best passive Perception against its DC, once, shown above that hero's lines at the first opening
    if (b.cr && four.length) { var rb = SV.best(four, SV.READ.skill), pv = 10 + rb.v; SV.trail('passive Perception ' + pv + ' (' + rb.e.hero.name + ') vs DC ' + SV.DC.read + (pv >= SV.DC.read ? ', read' : ', not read')); if (pv >= SV.DC.read) T.read = rb.e.key; }
    narr((HG.LINES[b.kind] || HG.LINES.farm)[0].split('{where}').join(SV.where(r)));
    var prompt = { by: SV.fill(b.cr ? b.K.opener : SV.NOTMADE, b) }; // (a band off no making's ground: nothing of a made thing said)
    for (var i = 0; i < T.out.length; i++) yield wait(T.out[i]);
    var optsOf = function (e) {
      var out = [], shaded = 0, add = function (id, label, sk) { if (out.length >= SV.CAP) return; if (sk) { if (shaded) return; shaded++; } out.push({ id: id, label: label, shade: !!sk, tag: sk || null }); };
      if (b.cr && T.read === e.key && (T.turn === 1 || T.readSeen) && !T.asked.hands) add('hands', typeof SV.ASKS.hands.say === 'function' ? SV.ASKS.hands.say(b) : SV.ASKS.hands.say); // (what the read opens, at the head of the reader's list)
      pieces.forEach(function (p) { if (T.asked[p.id] || owner[p.id] !== e.key) return; add(p.id, typeof p.ask === 'function' ? p.ask(b) : p.ask, p.skill); });
      if (!T.asked.what && b.cr) add('what', SV.ASKS.what.say);
      if (!T.asked.bound) add('bound', SV.ASKS.bound.say);
      return out.concat([{ id: 'walk', label: SV.WALK, shade: false, tag: null }]);
    };
    var walked = false, k = 0;
    for (var turn = 1; turn <= SV.TURNS && four.length; turn++) {
      T.turn = turn; var list = four.map(function (e) { var ops = optsOf(e); return { e: e, hero: e.hero, side: e.side, key: e.key, reads: turn === 1 && T.read === e.key ? [SV.READ.text(b)] : [], ops: ops,
        opts: ops.map(function (p) { return p.label; }), marks: ops.map(function (p) { return p.shade ? { shade: true, tag: p.tag } : null; }), ids: ops.map(function (p) { return p.id; }), shaded: ops.filter(function (p) { return p.shade; }).length }; });
      var pk = yield sc.flip(sp, [prompt.by], list, 0), x = list[pk && pk.at != null ? pk.at : 0] || list[0], p = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      if (turn === 1 && T.read) ((pk && pk.seen) || [0]).forEach(function (j) { if (list[j] && list[j].key === T.read) T.readSeen = true; }); // (the read's follow-up only where the player looked: the supper's way)
      if (turn === 1 && T.read && !T.readSeen) T.read = null;
      if (p.id === 'walk') { walked = true; break; }
      var e = x.e; T.asked[p.id] = 1; T.out = []; sc.hero = e.hero; sc.heroSide = e.side;
      SV.trail(e.hero.name + ': ' + p.label);
      if (p.id === 'what') SV.what(b).forEach(function (l) { by(l); });
      else if (p.id === 'bound') by(SV.ASKS.bound.back);
      else if (p.id === 'hands') by(b.K.hands);
      else { var pc = pieces.filter(function (q) { return q.id === p.id; })[0], ok = made(e, pc.skill); (ok ? pc.made(b) : pc.missed(b)).forEach(function (o) { if (o.by) by(o.by); else narr(o.narr); }); }
      var lo = T.out[T.out.length - 1], last = turn < SV.TURNS && lo && lo.by && lo.by.length <= 150 ? T.out.pop() : null; // (the last word the next opening's question, as the supper has it)
      for (i = 0; i < T.out.length; i++) yield wait(T.out[i]);
      prompt = last || { by: SV.MORE[k++ % SV.MORE.length] };
    }
    sc.echo = null; sc.hero = null;
    yield sc.narr([SV.fill(SV.GOING, b)]);
    return { walked: walked, asked: Object.keys(T.asked) };
  };
  SV.where = function (r) { var MW = W.Mworld(), k = r.hex[0] + ',' + r.hex[1], e = MW.hex[k]; return MW.road[k] ? 'road' : (e && MW.terr[e.t] ? MW.terr[e.t].name.replace(/^the /i, '').replace(/ \(.*\)$/, '').replace(/ \/ .*$/, '') : 'track'); }; // (js/hunger.js HG.card's reading of the ground)

  // THE WORLD UNDER THE TALK (11-14, Griz to this seat, on the talk in the pane: "let the world map it pops over serve as background"): THE WORLD's scene drawn live
  // under the open screen and dimmed, as the inn's room is under its supper (js/inn.js In.roomShot, js/hours.js H16.streetShot's way)
  SV.DIM = 'rgba(8,10,28,0.35)';
  SV.worldShot = function (scene) {
    if (!scene || !scene.draw) return null;
    return function (ctx, x, y, w, h, behind) {
      if (behind) return false;
      ctx.save(); try { scene.draw(ctx); } catch (e) { ctx.restore(); return false; } ctx.restore();
      ctx.fillStyle = SV.DIM; ctx.fillRect(0, 0, D.W, D.H); return true;
    };
  };
  // the meeting: the talk on the open counter screen over THE WORLD (js/wagon.js Wg.meet's way), the world's line after it. No game up (a bench's bare world): false, the card
  SV.open = function (scene, r) {
    var C = D.counter, st = C && C.state(null); if (!C || !st || !st.party) return false;
    var b = SV.band(r), res = null;
    if (scene) { scene.walk = null; scene.plan = null; }
    var sc = new C.Counter(null, { id: 'survivors', name: b.K.name, place: 'On the way', what: SV.where(r) === 'road' ? 'on the road, ' + W.timeOfDay() : 'on the ' + SV.where(r) + ', ' + W.timeOfDay(), open: true, bg: SV.worldShot(scene),
      script: function (s) { return (function* () { res = yield* SV.talk(s, r); })(); } });
    D.push(sc); SV.last = sc;
    if (scene && D.wagon && D.wagon.then) D.wagon.then(scene, function () { if (scene.say) scene.say('The survivors go on toward ' + r.toName + ', ' + W.timeOfDay() + '.'); });
    return true;
  };

  // ---------------------------------------------------------------- THE SURVIVORS' TALK, shown (deep16/?survivorsshow -- the eyes row's door): a NEW GAME's four at level 3 on THE WORLD in the hex of a
  // band of the beat's ground and kind, three hours after the dawn it fled; the talk opens at once. The dice pinned: every check made, or (the last beat) every one missed
  SV.BEATS = [
    { id: 'marshfarm', label: 'THE MARSH, A FARM: a farm\'s family off the bog\'s edge (the wisp or the stirge)', note: 'A farm fed on by a making on the marsh. Flip the four (left and right): each piece is on the hero best at its skill, shaded with the skill\'s name -- Insight (why that bed), Medicine (look at the one stood over), Survival (which way it went), Arcana (why that one). The dice pinned high: every check made. The Perception read shows above the best reader\'s lines on the first opening, and opens a line of theirs.', zone: 'glowseep', kinds: ['farm', 'hamlet'], dice: [18, 18, 18, 18, 18, 18] },
    { id: 'marshroad', label: 'THE MARSH, THE ROAD OR OPEN COUNTRY: drovers off a road, or a trapper alone', note: 'A making on the marsh fed at a road\'s fire or a trapper\'s camp. The dice pinned high.', zone: 'glowseep', kinds: ['road', 'wild'], dice: [18, 18, 18, 18, 18, 18] },
    { id: 'mountfarm', label: 'THE MOUNTAINS, A FARM: the wolf or the worg at a farm under the Coldridge', note: 'A making in the mountains (the wolf or the worg, the coat full of stars). The dice pinned high.', zone: 'doors', kinds: ['farm', 'hamlet'], dice: [18, 18, 18, 18, 18, 18] },
    { id: 'mountroad', label: 'THE MOUNTAINS, THE ROAD OR OPEN COUNTRY', note: 'A making in the mountains fed on the road or in the open. The dice pinned high.', zone: 'doors', kinds: ['road', 'wild'], dice: [18, 18, 18, 18, 18, 18] },
    { id: 'missed', label: 'EVERY CHECK MISSED: the thinner answers (a marsh band)', note: 'The first marsh band again with the dice pinned at 1: every piece still answers, thinner and never false.', zone: 'glowseep', kinds: ['farm', 'hamlet', 'road', 'wild'], dice: [1, 1, 1, 1, 1, 1] }
  ];
  SV.LVL = 3;
  SV.find = function (zone, kinds, S) { // (a save's seed with a band of that ground and kind on the road: the first of 400)
    for (var sd = 1; sd <= 400; sd++) { S.seed = sd; var R = HG.sim((40 - 1) * 24 + 12), r = R.ref.filter(function (x) { return x.zone === zone && kinds.indexOf(x.kind) >= 0 && x.arrive - x.t0 > 6; })[0]; if (r) return { seed: sd, r: r }; }
    return null;
  };
  SV.play = function (bt) {
    var H = D.house, In = D.inn, rec = H.fresh(); rec.at = { town: null }; rec.flags = { councilNotice: 1, councilSeen: 1 }; rec.silver = Math.max(rec.silver || 0, 60);
    var RL = DS.R; rec.party.forEach(function (h) { for (var g = 0; g < 20 && h.lvl < SV.LVL; g++) { RL.levelUp(h); RL.autoPicks(h); } if (RL.XP_LEVEL && RL.XP_LEVEL[h.lvl] != null) h.xp = Math.max(h.xp || 0, RL.XP_LEVEL[h.lvl]); h.hp = h.maxhp; if (h.slotsMax) h.slots = h.slotsMax.slice(); }); // (a level 3 party on every door: RULED 11-12, js/inn.js In.SHOW_LVL)
    H.begin(rec, 0, '?world');
    var S = W.state(), f = SV.find(bt.zone, bt.kinds, S); if (!f) { if (W.scene) W.scene.say('No band of that ground and kind in 400 saves.'); return; }
    S.seed = f.seed; S.metRef = []; S.madeFed = {}; S.t = f.r.t0 + 3; S.today = 0; S.todayHex = 0;
    var live = HG.refugees().filter(function (x) { return x.id === f.r.id; })[0] || f.r; S.at = live.hex.slice(); S.pos = null; S.from = null; S.rv = null;
    if (W.scene && W.scene.onMap) { try { W.scene.onMap(); } catch (e) { /* (the camera only) */ } }
    W.save(); if (In) In.pinned = bt.dice ? bt.dice.slice() : null;
    HG.meet(W.scene, live);
  };
  SV.show = function (q) { return new D.roam.WetShow(q, { kind: 'survivorsshow', beats: SV.BEATS, play: SV.play, title: '{y}THE SURVIVORS\' TALK, 11-14{/} -- a band met on THE WORLD, in portraits (a show)' }); };
})();
