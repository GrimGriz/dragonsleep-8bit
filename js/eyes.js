/* DRAGONSLEEP -- EYES: what is built and no person has seen on a screen yet, one row a thing, for situations.html (never loaded by the game).
   RULED 2026-10-06 (Griz: "Bulk processing is good, but do like 6 items per page by any priority they might have"): the eyes lane's list
   lives here, one list, and situations.html shows it six a page, most wanted first, ahead of the story situations (js/situations.js).
   A row: { pri, group, title, pt (the lane and section it came from), look (what to try, and what should happen), url (its door, from the
   site's root) }. pri 1 = first (a measure another lane waits on, or the way a player gets out); 2 = built this week; 3 = built before and
   never seen. TO ADD ONE: a seat that builds a thing he hasn't seen writes its row here (CLAUDE.md's close). ITS DOOR, A SHOW FIRST (10-06, Griz: "see if this
   showing method works as first consideration when creating URLs for things that need to be seen (vs tested)"): a thing to be SEEN -- a look, a moment the dice
   must bring -- gets a beat on a show page, staged and run by the engine with the dice pinned (deep16/js/skyshow.js's beats; ?fxgallery; ?show=<creature>); a
   live door only for a thing to be TESTED by his hands (a menu, a prompt, a pad). WHEN HE SAVES: every eyes row
   with a verdict or a note is SEEN -- a `seen` line in PATCHLOG.md with his note verbatim, and the row cut from this file, WHATEVER THE
   VERDICT (RULED 10-06, Griz: "you got that lean for me?" on the folder-reflection's loop OL-eyes-fold-rule-gaps): the fold is a rule with no
   judgement in it; a seat whose fix wants his eye again writes a FRESH row -- a new id, a show door, the date in its title -- and never keeps
   or re-notes the old one (the troll's oil of 10-06 was kept and rebuilt in place; it is the fresh row eyes-oil-show now). Broken or unclear
   also goes to the lane its `pt` names. Rows with no door stay in the eyes lane (..\..\handoff-2026-10-04-eyes-on-the-screen.md). */
'use strict';
(function () {
  var DS = window.DS = window.DS || {};
  var G1 = 'Eyes: first', G2 = 'Eyes: built this week', G3 = 'Eyes: built before, never seen';
  DS.EYES = {
    'eyes-mpgallery-1007': { pri: 1, group: G1, title: 'The Mascot gallery: the four kits one ability at a time, up/down the level (10-07)', pt: 'MPMon lane §6e item 1 (deep16/js/mpgallery.js) · eyes',
      url: 'deep16/?mpgallery&lvl=5',
      look: 'Your "gallery view of lobstamonkee abilities like the spell effect one", the card your "left adjusted scrollable column". 37 entries: each Mascot\'s sheet (the body at this level), its blow, then its abilities in the order they come, the Hivemind last. Left/right the next; UP/DOWN THE LEVEL 1-9 -- the four are rebuilt at it and the column\'s words, THE RING line and BY LEVEL (a line a level from the one it comes at to 9th, this one marked) recompute; E or a click on the floor runs the same one again on fresh dice; the wheel over the column, or a click on it, scrolls it. The foes are the spell gallery\'s normies (every score 8, AC 10, 100 HP), so a blow lands and a save fails as the ability means it to; a foe\'s trigger is pinned only where a reaction needs one (said in the column). Judge: does each column say enough to argue a number; does each look read in the clear to its right (Cannonball\'s leap and dust, the Big Screen\'s cone, the green of every heal, the Hivemind\'s tokens at 9); is the ladder the right shape for the balance pass.' },
    'eyes-tutorial-1007': { pri: 1, group: G1, title: 'The Game Show\'s TUTORIAL toggle: Denny\'s kit walked on the lighthouse floor before the jump in (10-07)', pt: 'MPMon lane §6f · the Game Show lane §3 A · eyes',
      url: 'deep16/?gameshow',
      look: 'Your "front page toggle for \'tutorial\'" and "build for denny as test". On the title, TUTORIAL OFF between the group\'s name and HIGH SCORES: click it ON (it stays on, this browser\'s), then click the circle\'s centre. Before the circle wakes, THE TUTORIAL: Denny\'s kit as it stands at 1st (his sheet, Monkey Fists, Taunt, Denim Damage), each walked by the Mascot gallery\'s machinery on this floor round the circle -- the column down the left, five normie dummies for him to hit, left/right the next, E again, X skips the rest -- then "That\'s the kit" and the jump in as ever, the four back on their squares. Judge: does it read as a tutorial for a player who has never seen Denny; is the column\'s voice right for the stream; should the other three follow (GS.TUTORIAL_WHO).' },
    'eyes-rascal-size-1007': { pri: 2, group: G2, title: 'Rascal at 80% of Denny, his walk from sheet 2 (10-07)', pt: 'MPMon lane §4c (tools/rascal-sheet-p2.py) · eyes',
      url: 'deep16/?mpshow&lvl=7&only=sharing,flame,distancing,spicy,hottake,viral',
      look: 'Your "a little large for the squishy DPS" and "80% of Denny Height": he stands about 42 at rest to Denny\'s 53 (63 before), about Goose\'s height, wider; about 36 in the rows. Six beats, the dice pinned, Rascal on each of his rows: the bow (sheet 3), the dance, the ring of air, Fire Bolt\'s spark, Hot Take\'s sparks, Going Viral\'s buzz. His walk is sheet 2\'s now. At this size the hat, the eyes, the claw and the whiskers read; the yellow rings round his eyes run into the red of his face. The sheet beside Denny: tools/sheet-play.html?sheet=rascal_p2&ref=denny_p3. p1 is gone.' },
    'eyes-gameshow-end-1007': { pri: 2, group: G2, title: 'The Game Show\'s end: the lamp out, GAME OVER, the high scores (10-07)', pt: 'the Game Show lane §5 (deep16/js/gameshow.js GS.gameOver) · eyes',
      url: 'deep16/?gameshow&at=lamp',
      look: 'Third Lamp\'s arrival plays (Ingrith holds up the Ledger-Lamp, the circle out counter-clockwise, the four onto its corners, Pyro\'s charge, both jump in, the circle sinks), then the stand-in for seat 2\'s waves. Click the lantern on the tower: the lamp goes dark, the screen fades to black, a pause, GAME OVER over the group\'s name in gold, then the HIGH SCORES with this run in gold and BACK TO THE LIGHTHOUSE. With no waves yet there is no villain to walk to the lamp first; seat 2 brings one. (Clicking the circle instead runs the token walk you saw.) The run is written to this browser\'s scores; the title\'s HIGH SCORES button shows them.' },
    'eyes-menu8-1007': { pri: 2, group: G2, title: 'The one menu in an 8-bit fight: ITEMS, MAGIC and SKILLS act, lit by cost (10-07)', pt: 'the menus (spent 10-07) · eyes',
      url: '?at=menu8',
      look: 'An 8-bit fight by your hands (two gnolls). X on a hero\'s commands opens the menu: ITEMS, MAGIC and SKILLS are the fight\'s own lists, lit yellow (the action), blue (the bonus) or white (free), the rest grey with its why, and the box under the entries says which is which. A pick closes the menu and is the turn\'s command, the battle\'s own target picker after it (Lymen\'s SACRED WEAPON from SKILLS lit his sword at once). Barley\'s SECOND WIND blue; a Channel Divinity\'s options on the SKILLS list itself. &rogue=cutthroat: Vivian\'s ITEMS yellow; a Thief\'s blue (Fast Hands).' },
    'eyes-trollbar-1007': { pri: 2, group: G2, title: 'A smouldering troll\'s HP bar over its flames, not across them (10-07)', pt: 'the menus lane §2.6 (a runner\'s; deep16/js/looks.js LK.flameTop) · eyes',
      url: 'deep16/?skyshow&only=oil',
      look: 'The oil beat: Barley\'s flask, Aurdin\'s Fire Bolt, and the troll smoulders on its feet, held. Its HP bar and the marks over its head sit above the tips of the flames off its hair -- about 12 px higher than over a troll not burning -- whichever way it faces (the bench checked facing the eye and facing north on a stand-in sheet; the real troll\'s crown never measured).' },
    'eyes-campbonds-1007': { pri: 2, group: G2, title: 'The grid camp\'s THE NIGHT\'S BONDS (10-07)', pt: 'the menus lane §2.4 (deep16/js/camp.js) · eyes',
      url: 'deep16/?ladder',
      look: 'A rung of 6 or more, to its camp. EQUIP Barley with the Flame Tongue, the Ring of Prot., the Fire Resist Ring and the Cloak of Displacement. Back at the camp\'s list a row THE NIGHT\'S BONDS stands before PREPARE SPELLS ("3 bonded, 1 waiting"): three BONDED, the cloak WAITING. E on a bonded one lets it go (LET GO) and the cloak bonds; E on the let-go one takes it up again, and it waits (three held); E on a waiting one says so. In the fight that follows, what was let go does not work. The camp\'s cloak list says what each cloak does.' },
    'eyes-mascot-show-1006': { pri: 2, group: G2, title: 'The Mascots, shown: every move to 9th (10-06 night)', pt: 'MPMon lane §6 (deep16/README.md "THE MASCOT") · eyes',
      url: 'deep16/?mpshow&lvl=9',
      look: 'Twenty-two beats, the dice pinned, each checked, at their 9th-level numbers: the nine specials as they grow now (Taunt a bonus action of no swing, 6 foes in 30 ft; Denim Damage\'s knock; Social Distancing the ring round Rascal cleared, the two beside him shoved out), then Monkey Flurry, Stand Firm, Eye On It, Lucky Dice, Spicy, Scuttle, Bodyguard, Eye Contact, Hot Take, the Lobstah Hug and its squeeze, Spotlight, Going Viral (fire jumping goblin to goblin) and the Hivemind\'s three tokens. ?mpshow alone shows the 5th-level fifteen. The rows the new moves want are not cut yet: they play stand-ins (deep16-art-wanted.md, the Mascot\'s new rows).' },
    'eyes-mascot-play-1006': { pri: 2, group: G2, title: 'The Mascots by your hands: aimed like spells, no popups (10-06 night)', pt: 'MPMon lane §6 · eyes',
      url: 'deep16/?npc=goblin,goblin,hobgoblin,hobgoblin,ogre&vs=denny:7,beholda:7,rascal:7&lvl=7',
      look: 'The ring\'s SKILLS aim as a spell does -- the cursor, the reach or the area on the floor, a click: Denim Damage, the Cannonball, the Hug at a foe; the Big Screen\'s cone; Social Flame at a point; Sharing and Spotlight at friends (click them, then CAST). No name-list popups. The setup specials are bonus actions (TAUNT, VNA BUBBLE, SOCIAL SHARING), the free moves cost no special (MONKEY FLURRY after a swing, EYE ON IT, SCUTTLE), and Bodyguard and Hot Take ask you when they could fire.' },
    'eyes-mascot-lock-1006': { pri: 2, group: G2, title: 'The Pocket DM: the Mascots locked, and the door that opens them (10-06 night)', pt: 'MPMon lane §6 · eyes',
      url: 'deep16/?pocket&mascots',
      look: 'With &mascots the roster offers Denny, Beholda and Rascal (as a Mascot each: Tank, Buffs, DPS); without it, on the plain Pocket DM, none of the three is there at all -- hidden till its easter egg, not greyed.' },
    'eyes-keeper-landing-1006b': { pri: 1, group: G1, title: 'The Keeper\'s way out: the landing, and the hover line whole (10-06, after your note)', pt: 'the grid\'s rules §2.15, §2c · eyes',
      url: '?at=stair',
      look: 'WADE IN. Put the mouse on the pale square at the corridor\'s east end: the line at the bottom right reads whole now, "a way out: LEAVE THE FIGHT from here (the party goes too)" (your "Hoverline cropping left side in pane": a line wider than the screen wraps). Stand there and LEAVE THE FIGHT: back in the 8-bit you stand in the corridor two squares east of the landing, not where the fight began.' },
    'eyes-xorn-dive-1006': { pri: 2, group: G2, title: 'The xorns under the floor: up, the claws, and under again (10-06)', pt: 'the grid\'s rules §2c · eyes',
      url: 'deep16/?fight=xorns',
      look: 'The Seam at level 8. A xorn digs to whoever is out of its reach (no walking to anyone within 15 ft now), comes up beside them, claws three times and bites, then goes under again with the move it has left -- those beside it that see it get their swing as it goes. The bench lost 2 of 10 here (it won 10 of 10 before); your "8/10 is improvement".' },
    'eyes-leap-ready-1006': { pri: 3, group: G2, title: 'The bulette\'s Leap and a readied blade (10-06)', pt: 'the grid\'s rules §2c · eyes',
      url: 'deep16/?fight=bulette',
      look: 'With a hero beside the one the bulette will leap at, READY a blade (A FOE IN REACH). When it leaps, the readied strike comes as it comes down, before the landing\'s card (the SRD: the jump is its movement, the landing its action); struck down in the air, it lands on no one.' },
    'eyes-firebolt-tendril-1006': { pri: 2, group: G2, title: 'Fire Bolt at a roper\'s tendril (10-06)', pt: 'the grid\'s rules §2.4 · eyes',
      url: 'deep16/?npc=roper&vs=fighter:5,wizard:5&lvl=5',
      look: 'When the roper\'s tendril holds the fighter, aim the wizard\'s Fire Bolt at the fighter\'s square: it takes the tendril, not the fighter (the card: "the tendril on Fighter 5", AC 20, 10 HP); a hit that cuts it through frees the fighter. Ray of Frost there takes nothing (its SRD words say "a creature"; Fire Bolt\'s "a creature or object"). A readied Fire Bolt aims the same way when it springs.' },
    'eyes-dominate-1006': { pri: 2, group: G2, title: 'Dominate Person, shown (10-06)', pt: 'the grid\'s rules §2.7 · eyes',
      url: 'deep16/?fxgallery&spell=dominateperson',
      look: 'The wizard casts it at a foe fighter: WIS with advantage (it is being fought); failed, the card says it "goes over to" the wizard, a violet sparkle, and it stands with your side. The arrow to the next spell and it is its own again. In a fight, one of the party dominated by a foe (the spirit naga has it now) fights for the foe by its class till a blow lets it save free.' },
    'eyes-oil-show': { pri: 1, group: G1, title: 'Oil on a troll, then fire -- redrawn by your eye 10-06 (a beat on the Skylights show page)', pt: 'the menus §2.7 · eyes',
      url: 'deep16/?skyshow&only=oil,oildown',
      look: 'Your three flasks in the Edifice all missed (10-06: the throw is Strength alone, no proficiency, against AC 15, and a miss oils the ground as ruled 10-05), so the show has two beats: Barley\'s flask hits a troll on its feet (the dice pinned) -- a brown coat, a thick amber band sliding down the body (your "thicker", 10-06; the bright edge gone), drips to a pool at its feet; then Fire Bolt: the oil catches, 5 more, and it smoulders standing. The second: the same oil on a troll lying at 0, then fire, and it dies.' },
    'eyes-prone8': { pri: 2, group: G2, title: 'The 8-bit prone cue, shown (your placeholder, 10-06)', pt: 'the 8-bit battle §2.2 · eyes',
      url: '?at=prone8',
      look: 'NEW GAME, any lead: a fight that plays itself, sleet over two ogres and a worg. Each one drops on its side away from you with a thud, pops up to swing from the ice and drops back, and stands at its next turn; the worg\'s bite knocks one of yours over toward the edge. The sprite turned, no new art; the thud is the 8-bit\'s bump (it has no hurt sound). Two lying side by side overlap: a body on its side is as wide as it stood tall. Does it read as fallen?' },
    'eyes-guests': { pri: 2, group: G2, title: 'Your guests\' new hands (your "1 lean", 10-06)', pt: 'the 8-bit battle §2.1 · eyes',
      url: '?at=raid',
      look: 'Brann and Hedda walk with you to Third Lamp. In an 8-bit fight on the road, let one of the four fall: on a guest\'s turn the pack\'s plain potion wakes them ("Brann uses Potion of Healing"); one merely hurt is left to you, and no kit is used after the fight. (A guest with an area spell casts it at two or more; none walks with you yet. Dace sleeps a group in the deep gallery.)' },
    'eyes-brokecard': { pri: 2, group: G2, title: 'THE FIGHT BROKE on a bare door, and the way back (your "4 lean", 10-06)', pt: 'the 8-bit battle §2.5 · eyes',
      url: 'deep16/?broke',
      look: 'The card a bare door shows when it breaks -- a ?npc= fight, ?keeperfight, ?fight=, ?show=, a gallery, a show page: after a second of failed frames (or a door that will not open at all), THE FIGHT BROKE with its error, and E (or a click) takes you to the 8-bit title. This door shows the card with a sample error; nothing broke. Does it read, and is the title the right way back?' },
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
    'eyes-pads': { pri: 3, group: G3, title: 'A game pad', pt: 'eyes §2.9 · the Pocket DM and the races §2.15',
      url: 'deep16/?npc=goblin,goblin&lvl=3',
      look: 'With an Xbox or PlayStation pad: the right stick zooms, left-right brings up the wheel and runs it, the left stick moves the cursor; A confirm, B back, Y end turn. (A key or a click first: the browser won\'t start the sound for a pad press.)' }
  };
})();
