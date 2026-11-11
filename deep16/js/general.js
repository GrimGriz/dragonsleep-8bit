/* DEEP16 — General Grimlock Grim's monologue (11-11, the story build's item M, its scene alone -- the cutter of 11-10 on the lanes desk's 11-11 queue, Griz: "make the
   monologue outside the box like outside for the lymen/urtusk and make sure the gestures show"). His pour of 10-18 (the story review lane §7.1): past First Lamp, over
   the clacker colony on a bridge, the party steps too far into a room and a giant screen snaps on; they stand paralyzed and entranced while the General speaks -- a
   predator further east drove his colony west into the clacker colony, they are only passing through the dwarven road, the heroes see a grimlock and go murder-hobo,
   and now they pay. Beholda comes out of the screen and the grimlocks join the fight.

     deep16/?grimshow                    the show: its beat, a NEW GAME's four staged on a cave floor, the monologue played over it
     deep16/?grimshow&beat=monologue     straight in

   Played as the company scene is (js/hours.js H16.papaScene, 500fb7b6): the counter's OPEN screen (js/counter.js o.open) -- no panel, no frames; the one speaking top
   right over the edge of a wide, short words' box, the floor as its camera stands dimmed behind (H16.streetShot), each line typed out. His talking portrait is
   pt_generalgrim (tools/portrait-sheet.py, 7496907e): a close bust 247 px wide with his head 151 px in, so the open hand of his Order and the clawed finger of his
   Accusation reach well to screen left of it -- the keeper's panel clipped them at its edge; the open screen draws the whole frame, every pixel of it on the screen,
   the words' box ending short of its left edge (benched: mode=grimmono1111).
   The beats are the art desk's A3 addendum's (GENERAL-GRIM-PORTRAITS-A3-MONOLOGUE): the party pinned (Stern), the crossing (Crossing), the turn (Speaking), the
   accusation (Accusation), the fight starts (Order, held). A one-frame cue is held through its line (GG.cue), not the counter's two and a half seconds.
   NOT BUILT, waiting on his answers (the story review lane §7.4: Beholda's side, the egg, Pyro at the mouth): the screen room, its line on the floor, the trance as a
   rule, the fight and the reward. The show ends where the fight would open, and says so.
   The words are the seat's draft (the 09-24 law: drafts stand, his to replace -- invented.json #general-grim-monologue); the predator unnamed, a hook. */
'use strict';
(function () {
  var D = window.D16, C = D.counter, GG = D.general = {};
  GG.WHO = 'generalgrim';                                                                   // (js/counter.js C.VENDORS.generalgrim: his name, pt_generalgrim)
  GG.HOLD = 100000;                                                                          // (a cue held through its line: the next line sets the next)
  // THE WORDS (the seat's draft, 11-11): his beats in his order, a page or two each
  GG.WORDS = {
    pinned: 'Past the bridge the cave opens wide and black. One step too far -- and a great screen snaps on in the dark, bright as noon. A face fills it. Your feet will not move. Your eyes will not leave it.',
    stern: ['There. Stand still. You are good at that, when someone makes you.', 'I am General Grimlock Grim. And you have been cutting your way through my people.'],
    crossing: ['Something woke in the east. I will not name it. It came up through our deep halls hungry, and it did not stop.',
               'So we went west -- the old, the young, all of us -- down through the clackers\' den and onto the dwarves\' dead road. Passing through. That is all we were doing.'],
    turn: ['Passing through. Then you came down the road.'],
    accusation: ['You see a grimlock and you draw. You never asked where we were going. You never asked anything.', 'My scouts at the mouth. My carriers in the passage. I counted every one.'],
    order: ['Now you pay.']
  };
  // the cue: his face for a line, held through it (C.frameAt holds a one-frame row for face.hold -- the counter's own is C.HOLD, 150); a row of frames plays through
  GG.cue = function (s, w, anim) { s.face = { anim: anim, t0: s.t, hold: GG.HOLD }; return w; };
  GG.counter = function (B) {
    var W = GG.WORDS, H16 = D.hours;
    return new C.Counter(B, { id: GG.WHO, name: 'General Grimlock Grim', place: 'Past the bridge', what: 'on the great screen', room: true, open: true, bg: B && H16 && H16.streetShot ? H16.streetShot(B) : null, script: function (s) {
      return (function* () {
        yield s.narr([W.pinned]);                                     // (the party pinned: the narration in the middle, no one standing)
        yield GG.cue(s, s.say(W.stern), 'stern');
        yield GG.cue(s, s.say(W.crossing), 'crossing');
        yield GG.cue(s, s.say(W.turn), 'speaking');                   // (the turn: his Speaking, played through and held)
        yield GG.cue(s, s.say(W.accusation), 'accusation');
        yield GG.cue(s, s.say(W.order), 'order');                     // (and here the fight -- not built: his 7.4)
      })();
    } });
  };
  GG.scene = function* (B) {
    var sc = GG.counter(B); D.sfx('popup'); D.push(sc);
    while (!sc.done) yield 1;
    B.card(['{c}THE SHOW{/}: here the fight would open -- Beholda out of the screen, the grimlocks in. Not built yet: the screen room, the fight and its reward wait on the story review\'s 7.4 (her side, the egg, Pyro at the mouth).'], 600);
  };

  // ---------------------------------------------------------------- THE SHOW (deep16/?grimshow): a NEW GAME's four (js/house.js H.fresh) on the deep gallery's bare rock -- no floor
  // of his room is drawn yet; a cave the screen can snap on in -- a torch lit, then the monologue over it; &beat=<id> opens one; X back to the title
  GG.BEATS = [
    { id: 'monologue', label: 'THE GENERAL\'S MONOLOGUE: the great screen in the dark', note: 'A NEW GAME\'s four in a cave past the bridge (the deep gallery\'s bare rock stands in for his room). The screen snaps on: the General speaks, top right over the floor -- Stern, the Crossing, the turn, the Accusation\'s claw, the Order\'s palm. Then where the fight would open.', key: 'galleries_g4', at: [9, 3] }
  ];
  GG.play = function (bt) {
    var H = D.house, R = D.roam, L = D.light, rec = H.fresh(); rec.at = { town: null }; rec.flags = {};
    H.add(rec.inv, 'torch', 2); H.begin(rec, 0);
    var nb = R.make('?roam=' + bt.key, { save: H.living(H.cur), opts: { at8: bt.at.slice() }, house: true }), en = nb.enter;
    nb.enter = function () {
      en.apply(this, arguments);
      var B = this, t = this.roam.token, s = (this.inv || []).filter(function (x) { return x.id === 'torch' && x.n > 0; })[0];
      if (this.dark && s && !t.torch && L && L.handForLight(t)) { s.n--; t.torch = { lit: true, kind: 'torch' }; L.regrip(t); } // (a torch in the lead's hand: the show is to be seen)
      var co0 = this.co; this.co = (function* () { yield 40; yield* GG.scene(B); yield* co0; })();
    };
    D.push(nb);
  };
  GG.show = function (q) { return new D.roam.WetShow(q, { kind: 'grimshow', beats: GG.BEATS, play: GG.play, title: '{y}GENERAL GRIMLOCK GRIM, 11-11{/} -- his monologue on the open screen (a show; the fight not built)' }); };
})();
