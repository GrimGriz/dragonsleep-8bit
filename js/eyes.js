/* DRAGONSLEEP -- EYES: what is built and no person has seen on a screen yet, one row a thing, for situations.html (never loaded by the game).
   RULED 2026-10-06 (Griz: "Bulk processing is good, but do like 6 items per page by any priority they might have"): the eyes lane's list
   lives here, one list, and situations.html shows it six a page, most wanted first, ahead of the story situations (js/situations.js).
   A row: { pri, group, title, pt (the lane and section it came from), look (what to try, and what should happen), url (its door, from the
   site's root) }. pri 1 = first (a measure another lane waits on, or the way a player gets out); 2 = built this week; 3 = built before and
   never seen. TO ADD ONE: a seat that builds a thing he hasn't seen writes its row here (CLAUDE.md's close). WHEN HE SAVES: every eyes row
   with a verdict or a note is SEEN -- a `seen` line in PATCHLOG.md with his note verbatim, and the row cut from this file; broken or
   unclear also goes to the lane its `pt` names. Rows with no door stay in the eyes lane (..\..\handoff-2026-10-04-eyes-on-the-screen.md). */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var G1 = 'Eyes: first', G2 = 'Eyes: built this week', G3 = 'Eyes: built before, never seen';
  DS.EYES = {
    'eyes-trolloil': { pri: 1, group: G1, title: 'Oil on a troll, then fire (a beat on the Skylights show page)', pt: 'the menus §2.7 · eyes',
      url: 'deep16/?skyshow&only=oil',
      look: 'Your three flasks in the Edifice all missed (10-06: the throw is Strength alone, no proficiency, against AC 15, and a miss oils the ground as ruled 10-05), so the show has a beat for it: Barley\'s flask hits a troll on its feet (the dice pinned) -- it goes dark with a sheen; hover it: its card says oiled. Then Aurdin\'s Fire Bolt: the oil catches, 5 fire more, and it smoulders where it stands.' },
    'eyes-wetlamp': { pri: 2, group: G2, title: 'The Wet: the lamp at (3, 30)', pt: 'the bestiary · eyes',
      url: '?at=wet',
      look: 'The deep station\'s lamp moved where you asked, the grid\'s (3, 30), two squares from the crate; its light went with it. Does the bucket still read at a glance? (The three props\' flat look is on the art-wanted list.)' },
    'eyes-gatefloor': { pri: 3, group: G3, title: 'Your saved Pocket DM ladder, after the Gate Floor fix', pt: 'eyes §2.4',
      url: 'deep16/?pocket',
      look: 'If your saved ladder stood on the Gate Floor: LOAD it. It should draw a fresh floor with the rung\'s foes kept, not freeze.' },
    'eyes-ready': { pri: 3, group: G3, title: 'READY, a tendril, a held hero', pt: 'eyes §2.7',
      url: 'deep16/?npc=roper&lvl=6',
      look: 'READY a strike (WHEN?, then what you hold) and let it spring on the foe\'s turn. When the roper\'s tendril holds someone: BREAK THE TENDRIL, BREAK FREE. (READY on the ring is its own lane, with your hands; this is READY as it is.)' },
    'eyes-darts': { pri: 3, group: G3, title: 'The darts and the shield on the grid', pt: 'eyes §2.2',
      url: 'deep16/?npc=goblin,goblin,goblin&vs=wizard:5,wizard:5&lvl=5',
      look: 'Cast Magic Missile at the three: "dart 2 of 3 at whom?", X sends the rest at the last one. Then the goblins\' turn: when one of your wizards is hit, the SHIELD? prompt.' },
    'eyes-keeper-more': { pri: 3, group: G3, title: 'The Keeper from the rune, and the Keeper played', pt: 'eyes §2.3',
      url: 'deep16/?keeperfight&lvl=3&start=rune&log',
      look: 'The rune start. Then with &play=keeper on the address you are the Keeper: the four-square move pick, the second Slam, the thaw card and the water, a STALEMATE, the calm ripples after he falls.' },
    'eyes-gallery': { pri: 3, group: G3, title: 'The spell gallery, and a summons in a real fight', pt: 'eyes §2.5',
      url: 'deep16/?fxgallery',
      look: 'Click through at game speed with the sound on: what looks wrong, what looks great. A summoned or polymorphed creature should fetch its figure as it is cast (a moment of dots, then the figure).' },
    'eyes-phone': { pri: 3, group: G3, title: 'The figures arriving, on a phone', pt: 'eyes §2.5',
      url: 'deep16/?pocket',
      look: 'Open it on a phone over the phone\'s own connection: THE FIGURES ARE COMING and the gold pips; how long until a fight is ready.' },
    'eyes-ladder': { pri: 3, group: G3, title: 'The tester ladder\'s camp', pt: 'eyes §2.5',
      url: 'deep16/?ladder&party=ours',
      look: 'Between rungs: EQUIP, PREPARE, CAST AHEAD, A TORCH IN HAND; P and R.' },
    'eyes-show': { pri: 3, group: G3, title: 'The test ground: every row of a creature', pt: 'eyes §2.5',
      url: 'deep16/?show=grick',
      look: 'Every row of the grick\'s sheet, twice, in bright, dim and dark. Change the end of the address to roper or xorn for theirs.' },
    'eyes-react8': { pri: 3, group: G3, title: 'The 8-bit\'s reaction asks', pt: 'eyes §2.1',
      url: '?round6',
      look: 'No door sets these up yet; watch for them in any 8-bit fight: "begins to cast ..." then COUNTERSPELL?, a rebuke ask, the decline (LET IT LAND / LET IT GO), the Bandit Captain\'s Parry, a cloud ending with its caster\'s concentration. The ask\'s box wraps a long name.' },
    'eyes-road': { pri: 3, group: G3, title: 'The road\'s things in motion', pt: 'eyes §2.6',
      url: '?round6',
      look: 'Whenever they come up: the Globe\'s swell and fall; HELP on a friend; sleep\'s prone and the set-down lantern; the druid\'s smack; Kat\'s ink; a sheet greyed for who can\'t learn it; Gudrun\'s stores; Dace both ways and Wynn\'s send-home; the 8-bit\'s laughter, grease and images; arrows running out.' },
    'eyes-pads': { pri: 3, group: G3, title: 'A game pad', pt: 'eyes §2.9 · the Pocket DM and the races §2.15',
      url: 'deep16/?npc=goblin,goblin&lvl=3',
      look: 'With an Xbox or PlayStation pad: the right stick zooms, left-right brings up the wheel and runs it, the left stick moves the cursor; A confirm, B back, Y end turn. (A key or a click first: the browser won\'t start the sound for a pad press.)' }
  };
})();
