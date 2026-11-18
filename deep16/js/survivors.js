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
  SV.DC = { Insight: 12, Medicine: 12, Survival: 12, Arcana: 13, Perception: 12, History: 13, read: 13 }; // (the seat's numbers, the supper's band of them: a level-3 party's best makes them more often than not; Perception and History the Snoot's, 11-15)
  SV.AB = { Insight: 'wis', Medicine: 'wis', Survival: 'wis', Arcana: 'int', Perception: 'wis', History: 'int' };
  SV.TURNS = 4; SV.CAP = 5; SV.WALK = 'WALK ON';
  SV.MADE = { glowseep: ['wisp', 'stirge'], doors: ['wolf', 'worg'] }; // (js/world.js W.MADE: the two of each ground's table he makes over; the gnoll hills' hyenas send nobody)

  // ---------------------------------------------------------------- the band, by its kind: who speaks, who was stood over, how they are seen on the road
  // (sight: what the party sees as it comes up -- js/hunger.js HG.LINES[kind], the same words as the card that stands in where no game is up)
  SV.KINDS = {
    farm: { name: 'The farmer', sheet: 'pt_genman', who: 'his wife', obj: 'her', pos: 'her', Subj: 'She', over: 'over her bed', inside: true,
      opener: '"It came {when}. Our farm\'s {back} back. We\'re for {to}, all we own on the cart, and we don\'t stop."', back: '"Our farm\'s {back} back."',
      chose: '"It came in past the boy\'s cot. Past me. It went to her like it knew the way."',
      hands: '"She can\'t lift the boy. Since that morning she can\'t lift her own boy."',
      magic: '"Magic? She\'s a farmer\'s wife."' },
    hamlet: { name: 'A woman of the hamlet', sheet: 'pt_genwoman', who: 'the smith', obj: 'him', pos: 'his', Subj: 'He', over: 'over the smith\'s bed', inside: true,
      opener: '"It came {when}. The hamlet\'s {back} back, and nobody left in it. Every soul of us is on these carts, for {to}."', back: '"The hamlet\'s {back} back, and nobody left in it."',
      chose: '"It went down the row past every door to his. Not the first house, not the nearest. His."',
      hands: '"Our smith. He can\'t lift his own hammer. He walks at the back so nobody sees."',
      magic: '"Him? He shoes horses."' },
    road: { name: 'The drover', sheet: 'pt_genman', who: 'my brother', obj: 'him', pos: 'his', Subj: 'He', over: 'over my brother where he lay by the fire', inside: false,
      opener: '"It came {when}, at our fire, {back} back up the road. The beasts ran. We\'re for {to} on foot."', back: '"Our fire was {back} back up the road."',
      chose: '"Two of us at that fire, and it stepped over me to get to him."',
      hands: '"He can\'t carry his own pack. I carry both."',
      magic: '"Him? He can\'t read his own name."' },
    wild: { name: 'The trapper', sheet: 'pt_genman', who: 'me', obj: 'me', pos: 'my', Subj: 'I', self: true, over: 'over me where I lay', inside: false,
      opener: '"It came {when}, out where I set my lines, {back} back. I\'m for {to}. I don\'t know what else to do."', back: '"My lines are {back} back."',
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
  SV.NOTMADE = '"We\'re for {to}. Let us by."'; // (a band whose ground is no making's and is not the Snoot's: its road alone)

  // ---------------------------------------------------------------- THE SNOOT'S BURNT-OUT (11-15, Griz: "The 'snoot survivors' only get a 'talks frame'?", then "yes, it has landed" to
  // the lean to give them pieces of their own once js/snootroad.js was on main): a band of survivors off a farm or a hamlet a snooting band burned (SR.sim's ref, zone 'snoot').
  // What they can tell is the engine's: which band it was (its tribe), how many gnolls and hyenas were in it at that hour (SR.left), which way it came (its trail's step
  // before), how many farms it burned there, the hour; the tribes as the realm names them (TarlynsPit/wiki/gnoll-hills.md: the Wall-Laugh, "the tribe that laughs", the seat
  // facing the Castegut road; the Gray Keeping, "the king's tribe"; the Skull-Gate, "the border tribe", the young blood's tribe, the eastern seat); "young ones, laughing,
  // and no chief over them" the supper's heardFarmers and the clock seat's card (HG.LINES.said.snoot).
  // WHAT A FARMER SAW OF THEM (11-15, Griz on the seat's call 2: "it said the wiki didn't describe the tribe, but at least the death watch is visually distinct in game? some
  // other kind of sign?"; on its "above": "that line also says 'above' which implies north, but it does say moot ground"): the game's own looks, the farmer's to tell and
  // History's to read the tribe from -- the Hills' blue cloth (gnoll_p2, RULED 09-28), the Snoot's young blood in the Desert tribe's red (gloryseeker_p2, the same ruling),
  // the Gray Keeping's dark gray cloth and grayer fur (graykeeping_p2, his "D - the darker cloth and grayer fur", 10-15). The death-watch never leaves the Mane and raids no
  // farm, so no farmer saw it. The Wall-Laugh's (11-15, Griz: "The Wall-Laugh is the group Katarina visits in her book, read that section of it and decide what a good distinguisher might be"): serial-castegut installment 04 -- they meet you as a WALL, males shoulder to shoulder in a still line, and their laugh is "a rolling, passed-along laugh, one ring to the next"; the Hills' blue on them, none of the young blood's red. (The skull cairn at their seat is left out: skulls are the Skull-Gate's border sign too.)
  // The places by THE WORLD (deep16/data/world.js): the moot ground some 45 miles west of the Halfway Inn -- where the Gray Keeping's young blood set out from
  // (js/snootroad.js SR.start), not their home (his 11-14: "the Gray Keeping would withdraw to their home-place, which is south and closer in the hills near rhollor's ruins, the
  // moot was at special moot location"); the Skull-Gate's seat some ten miles west of Web Gulch (SR.SEATS.skull)
  SV.SNOOT = {
    KINDS: {
      farm: { name: 'The farmer', sheet: 'pt_genman', sight: 'A cart on the {where}, everything a farm owns roped onto it, and soot on all of it. A man leads the ox. A woman walks beside it with a boy by the hand.',
        opener: '"Gnolls came {when}. Our farm\'s {back} back, what\'s left of it. We\'re for {to}."', back: '"Our farm\'s {back} back, what\'s left of it."',
        burned: function (b) { return b.r.n > 1 ? '"Ours and the next farm over, the same hour. House, barn, the stacks. They threw fire on all of it and stood back to watch."' : '"The house. The barn. The stacks. They threw fire on all of it and stood back to watch."'; } },
      hamlet: { name: 'A woman of the hamlet', sheet: 'pt_genwoman', sight: 'Carts nose to tail on the {where}, black with smoke, and people walking beside them who do not talk. A whole hamlet, by the count of the children.',
        opener: '"Gnolls came {when}. The hamlet\'s {back} back, and burning yet. Every soul of us is on these carts, for {to}."', back: '"The hamlet\'s {back} back, and burning yet."',
        burned: function () { return '"Every roof in the place. They went from door to door with the fire, laughing."'; } }
    },
    TRIBES: {
      wall: '(history) The Hills\' blue; a line shoulder to shoulder, and the laugh passed down it one to the next: the Wall-Laugh\'s young blood. The tribe that laughs, whose seat faces the Castegut road.',
      gray: '(history) Gray cloth and gray fur: the Gray Keeping, the king\'s tribe. Its young blood, out from the moot ground west of the Halfway Inn.',
      skull: '(history) The Hills\' blue, and the big ones in red with them: a Skull-Gate band. The border tribe, the young blood\'s own, from the eastern seat by Web Gulch.'
    },
    // what the farmer saw on them, by the band as it was that hour (SR.left): the gray, the red, the blue
    look: function (b) {
      var L = b.left || {}, gray = (L.gnollgray || 0) + (L.gloryseekergray || 0) + (L.gnollgrayfemale || 0), red = L.gloryseeker || 0, blue = (L.gnoll || 0) + (L.gnollfemale || 0);
      if (gray) return '"Gray. Gray rags on them, and grayer in the fur than any gnoll I ever saw."';
      if (red && blue) return '"Blue rags on most of them. And the big ones in red, out in front."';
      if (red) return '"Big ones, in red."';
      return b.r.tribe === 'wall' ? '"Blue rags. They came across the field in a line, shoulder to shoulder, like a wall. And the laugh went down the line, one to the next."' : '"Blue rags, every one of them."';
    },
    PIECES: [
      { id: 'count', skill: 'Perception', ask: 'How many were there? Think. What did you see?',
        made: function (b) { return [{ by: '"' + b.gn + ' of them. I counted them at the barley\'s edge. And ' + (b.hy ? b.hy + ' of their hyenas' : 'no hyenas') + '."' }]; },
        missed: function () { return [{ by: '"Too many. We didn\'t stay to count them."' }]; } },
      { id: 'came', skill: 'Survival', ask: 'Which way did they come at you from?',
        made: function (b) { return [{ by: '"Out of the ' + b.came + '. Through the barley at a lope, all of them at once."' }]; },
        missed: function () { return [{ by: '"We didn\'t see them come. We heard them."' }]; } },
      { id: 'tribe', skill: 'History', ask: 'What were they wearing? Anything you\'d know them by again?',
        made: function (b) { return [{ by: SV.SNOOT.look(b) }, { narr: SV.SNOOT.TRIBES[b.r.tribe] || SV.SNOOT.TRIBES.skull }]; },
        missed: function (b) { return [{ by: SV.SNOOT.look(b) }, { narr: '(history) Gnolls of the hills. Which tribe, you cannot say.' }]; } },
      // (11-15, Griz on the seat's call 3: "they burned everything... and they were taking trophies, we ran as fast as we could..." -- his line, the farmer's; the narration
      // under it says nothing his line does not)
      { id: 'want', skill: 'Insight', ask: 'How did you get clear of them?',
        made: function () { return [{ by: '"They burned everything... and they were taking trophies, we ran as fast as we could..."' }, { narr: '(insight) They got clear while the gnolls were at the burning and the trophies.' }]; },
        missed: function () { return [{ by: '"I don\'t know. We ran."' }]; } }
    ],
    READ: { skill: 'Perception', text: function () { return '(perception) Soot on every one of them, and the smell of smoke in their clothes. None of them is hurt.'; } },
    OPENS: { id: 'burned', say: 'What did they burn?' }
  };
  SV.SNOOT.READ.opens = SV.SNOOT.OPENS;

  // ---------------------------------------------------------------- the band read off the engine
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  SV.creature = function (r) { var two = SV.MADE[r.zone]; return two ? two[hash(r.id + '@' + (r.hex0 || []).join(',')) % two.length] : null; }; // (which of its ground's two stood over this band: the band's own and the hex it happened in -- 11-15, his "add hex it happened in to 4" -- the same every time)
  // HOW FAR BACK IT HAPPENED (11-15, Griz: "have the survivors with a 'my 'farm'(whatever) x miles back'"): the miles from the hex it happened in (the band's `from`, its
  // middle) to where the band is on its road this hour, the cart's straight line (js/hunger.js HG.refugees)
  SV.milesBack = function (r) { var pt = r.pt; if (!pt) { var lv = HG.refugees().filter(function (x) { return x.id === r.id; })[0]; pt = lv ? lv.pt : r.from; } return r.from && pt ? Math.hypot(pt[0] - r.from[0], pt[1] - r.from[1]) : 0; };
  SV.miles = function (n) { return n < 1.5 ? 'a mile' : Math.round(n) + ' miles'; };
  SV.COMPASS = ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'];
  SV.dirOf = function (dx, dy) { var a = Math.atan2(-dy, dx); return SV.COMPASS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }; // (THE WORLD's y runs south: Silverton's is the smallest)
  SV.went = function (r) { // (the marker's step at the dawn it fed this band: from hex0 to the trail's hex that dawn)
    var MW = W.Mworld(), x = HG.sim(r.t0 + 1).by[r.day], dn = Math.floor((r.t0 - HG.DAWN) / 24), s = x && x.trail.filter(function (q) { return q.dn === dn; })[0];
    if (!MW || !s) return null; var w = MW.w, c0 = [w * (r.hex0[0] + r.hex0[1] / 2), w * Math.sqrt(3) / 2 * r.hex0[1]], c1 = [w * (s.hex[0] + s.hex[1] / 2), w * Math.sqrt(3) / 2 * s.hex[1]];
    return SV.dirOf(c1[0] - c0[0], c1[1] - c0[1]);
  };
  SV.when = function (r) { // (the day and the hour it happened: a made thing's at first light, the Snoot's at the hour of its step -- js/snootroad.js SR.HOURS)
    var d = W.day() - (Math.floor(r.t0 / 24) + 1), h = ((r.t0 % 24) + 24) % 24, part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    if (h <= HG.DAWN) return d <= 0 ? 'this morning, at first light' : d === 1 ? 'yesterday, at first light' : d + ' mornings back, at first light';
    return d <= 0 ? 'this ' + part : d === 1 ? 'yesterday ' + part : d + ' days back, in the ' + part;
  };
  SV.snoot = function (r) { // (a Snoot band's own facts: its tribe, its numbers at that hour, the way it came)
    var SR = D.snootroad; if (r.zone !== 'snoot' || !SR || !SR.BANDS) return null;
    var bd = SR.BANDS.filter(function (x) { return x.id === r.band; })[0]; if (!bd) return null;
    var left = SR.left(bd, r.t0), gn = 0, hy = left.hyena || 0; Object.keys(left).forEach(function (k) { if (k !== 'hyena') gn += left[k]; });
    var x = SR.sim(r.t0).by[r.band], tr = x ? x.trail : [], i = -1; tr.forEach(function (s, j) { if (s.T === r.t0) i = j; });
    var prev = i > 0 ? tr[i - 1].hex : SR.start(bd), MW = W.Mworld(), came = null;
    if (MW && prev && r.hex0 && (prev[0] !== r.hex0[0] || prev[1] !== r.hex0[1])) { var w = MW.w, c0 = [w * (r.hex0[0] + r.hex0[1] / 2), w * Math.sqrt(3) / 2 * r.hex0[1]], c1 = [w * (prev[0] + prev[1] / 2), w * Math.sqrt(3) / 2 * prev[1]]; came = SV.dirOf(c1[0] - c0[0], c1[1] - c0[1]); }
    return { gn: gn, hy: hy, came: came, left: left };
  };
  SV.band = function (r) {
    var sn = SV.snoot(r), cr = sn ? null : SV.creature(r), K = sn ? SV.SNOOT.KINDS[r.kind] || SV.SNOOT.KINDS.farm : SV.KINDS[r.kind] || SV.KINDS.farm;
    var b = { r: r, fam: sn ? 'snoot' : cr ? 'made' : null, kind: (sn ? SV.SNOOT.KINDS : SV.KINDS)[r.kind] ? r.kind : 'farm', K: K, cr: cr, dir: cr ? SV.went(r) : null, when: SV.when(r), to: r.toName, back: SV.miles(SV.milesBack(r)) };
    if (sn) { b.gn = sn.gn; b.hy = sn.hy; b.came = sn.came; b.left = sn.left; }
    return b;
  };
  SV.piecesOf = function (b) { return b.fam === 'made' ? SV.PIECES.filter(function (p) { return p.id !== 'went' || b.dir; }) : b.fam === 'snoot' ? SV.SNOOT.PIECES.filter(function (p) { return p.id !== 'came' || b.came; }) : []; };
  SV.readOf = function (b) { return b.fam === 'made' ? { skill: SV.READ.skill, text: SV.READ.text, opens: { id: 'hands', say: SV.ASKS.hands.say, back: function (bb) { return bb.K.hands; } } } : b.fam === 'snoot' ? { skill: SV.SNOOT.READ.skill, text: SV.SNOOT.READ.text, opens: { id: 'burned', say: SV.SNOOT.OPENS.say, back: function (bb) { return bb.K.burned(bb); } } } : null; };
  SV.fill = function (l, b) { return String(l).split('{back}').join(b.back).split('{to}').join(b.to).split('{when}').join(b.when).split('{over}').join(b.K.over).split('{obj}').join(b.K.obj).split('{in}').join(b.K.inside ? ' indoors' : ''); };
  SV.notMade = function (b) { var said = HG.LINES && HG.LINES.said && HG.LINES.said[b.r.zone]; return [said, b.K.back, SV.NOTMADE].filter(Boolean).join(' ').replace(/" "/g, ' '); }; // (a band off no making's ground -- the Snoot's burnt-out: js/snootroad.js gives HG.LINES.said.snoot, "Gnolls in the barley ..." -- its ground's line, the miles back, the road)
  SV.what = function (b) { var said = HG.LINES && HG.LINES.said && HG.LINES.said.snoot; return b.cr ? [SV.fill(SV.CREATURES[b.cr], b), SV.EYES] : b.fam === 'snoot' && said ? [said] : [SV.fill(SV.notMade(b), b)]; };
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
    var pieces = SV.piecesOf(b), owner = {}, RD = SV.readOf(b);
    pieces.forEach(function (p) { var bb = four.length ? SV.best(four, p.skill) : null; if (bb) owner[p.id] = bb.e.key; });
    // the read: the party's best passive Perception against its DC, once, shown above that hero's lines at the first opening
    if (RD && four.length) { var rb = SV.best(four, RD.skill), pv = 10 + rb.v; SV.trail('passive Perception ' + pv + ' (' + rb.e.hero.name + ') vs DC ' + SV.DC.read + (pv >= SV.DC.read ? ', read' : ', not read')); if (pv >= SV.DC.read) T.read = rb.e.key; }
    narr((b.fam === 'snoot' ? b.K.sight : (HG.LINES[b.kind] || HG.LINES.farm)[0]).split('{where}').join(SV.where(r)));
    var prompt = { by: SV.fill(b.fam ? b.K.opener : SV.notMade(b), b) }; // (a band off no making's ground: nothing of a made thing said)
    for (var i = 0; i < T.out.length; i++) yield wait(T.out[i]);
    var optsOf = function (e) {
      var out = [], shaded = 0, add = function (id, label, sk) { if (out.length >= SV.CAP) return; if (sk) { if (shaded) return; shaded++; } out.push({ id: id, label: label, shade: !!sk, tag: sk || null }); };
      if (RD && T.read === e.key && (T.turn === 1 || T.readSeen) && !T.asked[RD.opens.id]) add(RD.opens.id, typeof RD.opens.say === 'function' ? RD.opens.say(b) : RD.opens.say); // (what the read opens, at the head of the reader's list)
      pieces.forEach(function (p) { if (T.asked[p.id] || owner[p.id] !== e.key) return; add(p.id, typeof p.ask === 'function' ? p.ask(b) : p.ask, p.skill); });
      if (!T.asked.what && b.fam) add('what', SV.ASKS.what.say);
      if (!T.asked.bound) add('bound', SV.ASKS.bound.say);
      return out.concat([{ id: 'walk', label: SV.WALK, shade: false, tag: null }]);
    };
    var walked = false, k = 0;
    for (var turn = 1; turn <= SV.TURNS && four.length; turn++) {
      T.turn = turn; var list = four.map(function (e) { var ops = optsOf(e); return { e: e, hero: e.hero, side: e.side, key: e.key, reads: turn === 1 && T.read === e.key ? [RD.text(b)] : [], ops: ops,
        opts: ops.map(function (p) { return p.label; }), marks: ops.map(function (p) { return p.shade ? { shade: true, tag: p.tag } : null; }), ids: ops.map(function (p) { return p.id; }), shaded: ops.filter(function (p) { return p.shade; }).length }; });
      var pk = yield sc.flip(sp, [prompt.by], list, 0), x = list[pk && pk.at != null ? pk.at : 0] || list[0], p = x.ops[pk && pk.k != null ? pk.k : x.ops.length - 1] || x.ops[x.ops.length - 1];
      if (turn === 1 && T.read) ((pk && pk.seen) || [0]).forEach(function (j) { if (list[j] && list[j].key === T.read) T.readSeen = true; }); // (the read's follow-up only where the player looked: the supper's way)
      if (turn === 1 && T.read && !T.readSeen) T.read = null;
      if (p.id === 'walk') { walked = true; break; }
      var e = x.e; T.asked[p.id] = 1; T.out = []; sc.hero = e.hero; sc.heroSide = e.side;
      SV.trail(e.hero.name + ': ' + p.label);
      if (p.id === 'what') SV.what(b).forEach(function (l) { by(l); });
      else if (p.id === 'bound') by(SV.ASKS.bound.back);
      else if (RD && p.id === RD.opens.id) by(RD.opens.back(b));
      else { var pc = pieces.filter(function (q) { return q.id === p.id; })[0], ok = made(e, pc.skill); (ok ? pc.made(b) : pc.missed(b)).forEach(function (o) { if (o.by) by(o.by); else narr(o.narr); }); }
      var lo = T.out[T.out.length - 1], last = turn < SV.TURNS && lo && lo.by && lo.by.length <= 150 ? T.out.pop() : null; // (the last word the next opening's question, as the supper has it)
      for (i = 0; i < T.out.length; i++) yield wait(T.out[i]);
      prompt = last || { by: SV.MORE[k++ % SV.MORE.length] };
    }
    sc.echo = null; sc.hero = null;
    yield sc.narr([SV.fill(SV.GOING, b)]);
    // THE TRUE WORD (11-15, Griz: "each talk should count toward the true word quest, 75 xp"): a talk where the party asked anything is a telling Hessle writes down
    // (js/trueword.js TW.PIECES survivors: TW.SURVIVOR_XP to each one standing, a talk, paid at the scales)
    if (Object.keys(T.asked).length && st.flags) { st.flags.survivorsTalks = (st.flags.survivorsTalks || 0) + 1; SV.trail('a telling for the true word (' + st.flags.survivorsTalks + ' talks)'); if (W.save) W.save(); }
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
    { id: 'snoot', label: 'BURNED OUT BY THE SNOOT: a farm or a hamlet a snooting band burned', note: 'People a gnoll band burned out (js/snootroad.js): Perception (how many gnolls and hyenas), Survival (which way they came), History (which tribe: the Wall-Laugh, the Gray Keeping, the Skull-Gate), Insight (how they got clear: his line, the burning and the trophies); the Perception read (soot, nobody hurt) opens WHAT DID THEY BURN. The dice pinned high.', zone: 'snoot', kinds: ['farm', 'hamlet'], dice: [18, 18, 18, 18, 18, 18] },
    { id: 'inn', arrive: 'inn', label: 'A BAND IN AT THE HALFWAY INN WHILE YOU ARE THERE (11-18)', note: 'The four at level 3 in the common room, an hour after a band of survivors bound for the inn was due: they come in off the Pit road at the first free moment -- a card, then their talk over the inn, its lines "We came to", not "We\'re for". The dice pinned high.', dice: [18, 18, 18, 18, 18, 18] },
    { id: 'town', arrive: 'silverton', label: 'A BAND IN AT SILVERTON WHILE YOU ARE THERE (11-18)', note: 'The four at level 3 on Silverton\'s street by Cassia\'s door, a little after a band bound for Silverton was due: in at the gate, a card, then their talk over the street. The dice pinned high.', dice: [18, 18, 18, 18, 18, 18] },
    { id: 'missed', label: 'EVERY CHECK MISSED: the thinner answers (a marsh band)', note: 'The first marsh band again with the dice pinned at 1: every piece still answers, thinner and never false.', zone: 'glowseep', kinds: ['farm', 'hamlet', 'road', 'wild'], dice: [1, 1, 1, 1, 1, 1] }
  ];
  SV.LVL = 3;
  SV.find = function (zone, kinds, S) { // (a save's seed with a band of that ground and kind on the road: the first of 400)
    for (var sd = 1; sd <= 400; sd++) { S.seed = sd; var tF = (40 - 1) * 24 + 12, R = { ref: HG.sim(tF).ref.concat(HG.more ? HG.more(tF) : []) }, r = R.ref.filter(function (x) { return x.zone === zone && kinds.indexOf(x.kind) >= 0 && x.arrive - x.t0 > 6; })[0]; if (r) return { seed: sd, r: r }; }
    return null;
  };
  SV.play = function (bt) {
    if (bt.arrive) { SV.playArrive(bt); return; } // (THE BANDS' ARRIVAL TIMES, 11-18: staged on the place's floor, below)
    var H = D.house, In = D.inn, rec = H.fresh(); rec.at = { town: null }; rec.flags = { councilNotice: 1, councilSeen: 1 }; rec.silver = Math.max(rec.silver || 0, 60);
    var RL = DS.R; rec.party.forEach(function (h) { for (var g = 0; g < 20 && h.lvl < SV.LVL; g++) { RL.levelUp(h); RL.autoPicks(h); } if (RL.XP_LEVEL && RL.XP_LEVEL[h.lvl] != null) h.xp = Math.max(h.xp || 0, RL.XP_LEVEL[h.lvl]); h.hp = h.maxhp; if (h.slotsMax) h.slots = h.slotsMax.slice(); }); // (a level 3 party on every door: RULED 11-12, js/inn.js In.SHOW_LVL)
    H.begin(rec, 0, '?world');
    var S = W.state(), f = SV.find(bt.zone, bt.kinds, S); if (!f) { if (W.scene) W.scene.say('No band of that ground and kind in 400 saves.'); return; }
    S.seed = f.seed; S.metRef = []; S.madeFed = {}; S.t = f.r.t0 + 3; S.today = 0; S.todayHex = 0;
    var live = HG.refugees().filter(function (x) { return x.id === f.r.id; })[0] || f.r; S.at = live.hex.slice(); S.pos = null; S.from = null; S.rv = null;
    var pt = W.hc ? W.hc(S.at[0], S.at[1]) : null; // (the party stood in the band's hex, the camera on it: THE WORLD behind the talk is the place it happened -- js/wagon.js Wg.play's way)
    if (pt) { try { var sc0 = W.scene, lk = sc0.lookAt(pt[0], pt[1]); sc0.cam.cx = lk[0]; sc0.cam.cy = lk[1]; } catch (e) { /* (the camera only) */ } }
    W.save(); if (In) In.pinned = bt.dice ? bt.dice.slice() : null;
    HG.meet(W.scene, live);
  };
  // ---------------------------------------------------------------- THE BANDS' ARRIVAL TIMES (the clock-road seat, 2026-11-18; the clock lane's 11-16 section, RULED, Griz:
  // "bands should have an arrival time and arrive while the player is there", on the lanes order's find that a party inside a place rolls no road percent, so the bands
  // never reach the inn or Silverton while the party is in). Each band already has its hour (js/hunger.js r.arrive, a cart's pace; the Snoot's burnt-out the same,
  // js/snootroad.js). Now one whose hour falls while the party is on that place's floors -- the Halfway Inn's (In.KEY, In.UP) or Silverton's street, rooms and Hex
  // (H16.inSilverton) -- comes in there: at the first free moment after its hour (js/hours.js H16.BEATS asks SV.arriveDue each frame, as the Pit's word at its hour),
  // a card and the survivors' talk on the open screen over the floor, the band counted met (S.metRef). The party's coming to a place is kept in the save (S.svAt: the
  // place and the hour it came; THE WORLD's step clears it), so a band in before the party came, or one that came while it was out on THE WORLD, does not play. The
  // talk's lines for a band that has arrived say so (SV.ARRIVED): "We came to", not "We're for". The card's and the turned lines are the seat's drafts (invented.json
  // survivors-arrive-1118). The show: deep16/?survivorsshow&beat=inn / &beat=town. The bench: mode=arrive1118.
  SV.ARRIVE = {
    inn: { card: '{y}Into the yard{/}, {tod}: survivors, in off the Pit road.', at: 'Pit road, turning in at the yard', place: 'The Halfway Inn', what: 'in the yard' },
    silverton: { card: '{y}In at the gate{/}, {tod}: survivors, in off the road.', at: 'road in at the gate', place: 'Silverton', what: 'at the gate' }
  };
  SV.ARRIVED = [ // (the talk's own lines, turned for a band that has come where it was going)
    ['We\'re for {to}, all we own on the cart, and we don\'t stop.', 'We\'ve come to {to}, all we own on the cart.'],
    ['Every soul of us is on these carts, for {to}.', 'Every soul of us came on these carts, to {to}.'],
    ['We\'re for {to} on foot.', 'We came to {to} on foot.'],
    ['I\'m for {to}. I don\'t know what else to do.', 'I\'ve come to {to}. I don\'t know what else to do.'],
    ['We\'re for {to}.', 'We came to {to}.'],
    ['"{to}. There\'s people there. After that, I don\'t know."', '"Here, for now. There\'s people here. After that, I don\'t know."'],
    ['They are making for {to}. They do not stop.', 'They stay on at {to}, for now.']
  ];
  var fill0 = SV.fill;
  SV.fill = function (l, b) { if (b && b.r && b.r.arrivedAt) SV.ARRIVED.forEach(function (p) { l = String(l).split(p[0]).join(p[1]); }); return fill0(l, b); };
  var where0 = SV.where;
  SV.where = function (r) { return r && r.arrivedAt && SV.ARRIVE[r.arrivedAt] ? SV.ARRIVE[r.arrivedAt].at : where0(r); };
  SV.siteOf = function (def) { var In = D.inn, H6 = D.hours; if (!def) return null; if (In && (def.key === In.KEY || def.key === In.UP)) return 'inn'; return H6 && H6.inSilverton && H6.inSilverton(def) ? 'silverton' : null; };
  SV.arrivals = function (site, from, to) { // (the bands bound for the site whose hour falls after `from` and by `to`, not met: the earliest first)
    var S = W.state(); if (!HG.on || !S) return []; var met = S.metRef || [];
    return HG.sim(to).ref.concat(HG.more ? HG.more(to) : []).filter(function (r) { return r.to === site && r.arrive > from && r.arrive <= to && met.indexOf(r.id) < 0; }).sort(function (a, b) { return a.arrive - b.arrive; });
  };
  SV.arriveDue = function (B) {
    var R = D.roam, R0 = B && B.roam, S = W.state && W.state(); if (!R || !R.def || !R0 || !R.house || !R.house() || !S || S.t == null) return false;
    var site = SV.siteOf(R.def); if (!site) return false;
    if (!S.svAt || S.svAt.site !== site) { S.svAt = { site: site, since: S.t }; return false; } // (just come: the hour kept)
    if (R0.mode !== 'walk' || R0.path) return false;
    var r = SV.arrivals(site, S.svAt.since, S.t)[0]; if (!r) return false;
    SV.next = r; return true;
  };
  SV.arrivePlay = function* (B) {
    var r = SV.next, S = W.state(), site = SV.siteOf(D.roam.def), A = SV.ARRIVE[site]; SV.next = null; if (!r || !A) return;
    (S.metRef = S.metRef || []).push(r.id); W.save();
    var MW = W.Mworld(), sx = MW && MW.sites.filter(function (s) { return s.id === site; })[0];
    var live = Object.assign({}, r, { pt: r.toPt.slice(), hex: sx && sx.hex ? sx.hex.slice() : (r.hex0 || [0, 0]).slice(), there: true, arrivedAt: site });
    SV.trail('the ' + r.kind + ' band ' + r.id + ' in at ' + A.place + ' at ' + (D.house && D.house.clockAt ? D.house.clockAt(r.arrive) : r.arrive) + ', the party there (since ' + (D.house && D.house.clockAt ? D.house.clockAt(S.svAt.since) : S.svAt.since) + ')');
    if (DS.autoPicks || !D.ctx) { SV.lastArrive = { id: r.id, site: site }; return; } // (no one to watch: counted met, nothing played)
    D.sfx('confirm'); B.card(D.roam.wrap(A.card.split('{tod}').join(W.timeOfDay())), 140); yield 30;
    var C = D.counter, st = C && C.state(B); if (!C || !st || !st.party) return;
    var b = SV.band(live), shot = { draw: function (c) { if (D.ui && D.ui.drawBattle) D.ui.drawBattle(c, B); } };
    var sc = new C.Counter(null, { id: 'survivors', name: b.K.name, place: A.place, what: A.what + ', ' + W.timeOfDay(), open: true, bg: SV.worldShot(shot),
      script: function (s) { return (function* () { SV.lastArrive = { id: r.id, site: site, res: yield* SV.talk(s, live) }; })(); } });
    D.push(sc); SV.last = sc;
    while (!sc.done && D.scenes.indexOf(sc) >= 0) yield 1;
    B.focus(B.roam.token); yield 1;
  };
  SV.findArrive = function (site, S) { // (a save's seed with a band bound for the site whose hour falls by day 30, not in the first morning: the first of 400)
    for (var sd = 1; sd <= 400; sd++) { S.seed = sd; var tF = 30 * 24, r = HG.sim(tF).ref.concat(HG.more ? HG.more(tF) : []).filter(function (x) { return x.to === site && x.arrive > 30 && x.arrive < tF; }).sort(function (a, b) { return a.arrive - b.arrive; })[0]; if (r) return { seed: sd, r: r }; }
    return null;
  };
  SV.raise = function (party) { var RL = DS.R; party.forEach(function (h) { for (var g = 0; g < 20 && h.lvl < SV.LVL; g++) { RL.levelUp(h); RL.autoPicks(h); } if (RL.XP_LEVEL && RL.XP_LEVEL[h.lvl] != null) h.xp = Math.max(h.xp || 0, RL.XP_LEVEL[h.lvl]); h.hp = h.maxhp; if (h.slotsMax) h.slots = h.slotsMax.slice(); }); };
  SV.playArrive = function (bt) { // (the show's two: the place's floor a little after the band's hour, the party come an hour before it -- it plays at the first free moment)
    var H = D.house, In = D.inn, C = D.counter, rec = H.fresh(); rec.at = { town: null }; H.begin(rec, 0, '?world');
    var S0 = W.state(), f = SV.findArrive(bt.arrive, S0); if (!f) { if (W.scene) W.scene.say('No band bound there in 400 saves.'); return; }
    var t = f.r.arrive + (bt.arrive === 'inn' ? 1 : 0.5);
    if (bt.arrive === 'inn') In.play({ key: In.KEY, at: [24, 17], day: Math.floor(t / 24) + 1, hour: t % 24, inside: true, lvl: SV.LVL, flags: { reachedInn: 1, gennetNamed: 1, mealHad: 1 } });
    else { C.servicePlay({ hours: 1, door: 'inn:cassia', t: t, flags: { councilNotice: 1, councilSeen: 1 } }); if (H.cur) SV.raise(H.cur.party); }
    var S = W.state(); S.seed = f.seed; S.metRef = []; S.madeFed = {}; S.t = t; S.svAt = { site: bt.arrive, since: f.r.arrive - 1 }; W.save();
    if (In) In.pinned = bt.dice ? bt.dice.slice() : null;
  };
  var stepA0 = W.onStep;
  W.onStep = function (scene, st) { var S = W.state && W.state(); if (S && S.svAt) delete S.svAt; return stepA0 ? stepA0.apply(this, arguments) : false; }; // (out on THE WORLD: the place left)

  SV.show = function (q) { return new D.roam.WetShow(q, { kind: 'survivorsshow', beats: SV.BEATS, play: SV.play, title: '{y}THE SURVIVORS\' TALK, 11-14{/} -- a band met on THE WORLD, in portraits (a show)' }); };
})();
