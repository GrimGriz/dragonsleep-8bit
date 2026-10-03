/* DEEP16 spell-gallery stages for the wizard's spells (js/gallery.js applyStage documents the entry): each spell staged to show the way it is meant to be used. */
'use strict';
(function () {
  var S = (window.D16.SPELLSTAGE = window.D16.SPELLSTAGE || {});
  Object.assign(S, {
    // the hit-point pool is rolled and spent on the weakest first: three scouts (a pool of 5d8 puts two or three of them down), where a hardened veteran would not sleep at all
    sleep: { tip: 'Sleep rolls 5d8 hit points and puts the WEAKEST to sleep first: aim it at a crowd of low-HP foes (scouts, goblins) early in a fight; it never works on a veteran.',
      foes: [{ word: 'fighter:1', hp: 7, at: [0, 5] }, { word: 'fighter:1', hp: 9, at: [1, 5] }, { word: 'fighter:1', hp: 11, at: [-1, 5] }] }
  });
})();
