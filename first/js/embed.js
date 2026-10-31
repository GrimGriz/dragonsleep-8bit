/* DRAGONSLEEP — a story fight that has a grid twin. From 09-27 to 10-20 a battle with `deep16: '<fight id>'` (deep16/data/fights.js)
   laid DEEP16 over the window in an iframe, handed it the party and took back what the fight did; the 8-bit battle was the floor under it,
   for a grid that refused or crashed. Since 10-20 that floor is the only path: the first game hands nothing to DEEP16 (RULED, Griz: "the
   8-bit handoff (at the cradle and with light) are so jarring it made me want to call the 8-bit one finished"; "8 bit solely 8-bit after
   this"). Every such fight is the 8-bit battle, played at once. The `deep16` key stays on each call as the name of its grid twin, for the
   second game (THE SECOND GAME takes the Skylights, the Wet on the grid and the story fights on the grid); the 8-bit battle reads it in one
   place, the landlord's bucket (js/battle.js: the wet's fight). The Wet's roam (DS.roam8) went with the frame. Wraps DS.battle (the deep.js
   way): file order is call order, so this loads after battle.js. */
'use strict';
(function () {
  var DS = window.DS, base = DS.battle;
  // the wet's three that stay dead once killed (deep16/js/wet.js FLAG8): killed in a wet fight they are as dead as the grid made them, and their spots on the 8-bit map
  // stop calling them up (10-03, Griz: "if for some reason the game starts crashing, they should be able to finish off those 3 monsters in 8bit"). The southern ooze is
  // the 8-bit's own fight, never a wet one, and is not counted
  var WET_DEAD = { otyugh: 'otyughDead', ochrejelly: 'jellyDead', grayooze: 'poolOozeDead' };

  DS.battle = function (o) { return o && o.deep16 === 'wet' ? wet(o) : base(o); };

  // a wet fight: the 8-bit battle, as DS.battle runs it (js/battle.js), with the three's deaths kept as it closes
  function wet(o) {
    return {
      start: function (script) {
        var self = this, prevSong = DS.audio.songId;
        DS.audio.sfx('encounter');
        var b8 = new DS.Battle(o);
        b8.onClose = function (r) {
          b8.foes.forEach(function (f) { if (f.dead && !f.fled && WET_DEAD[f.id]) DS.G.flags[WET_DEAD[f.id]] = 1; });
          self.finished = true; self.result = r;
          if (o.after !== false && r !== 'lose' || o.lossOk) DS.audio.play(o.returnSong || prevSong, true);
          setTimeout(function () { script.resume(self, r); }, 0);
        };
        DS.push(new DS.EncounterFlash(function () { DS.push(b8); }));
      }
    };
  }
})();
