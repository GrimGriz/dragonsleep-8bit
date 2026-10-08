---
title: The SRD's creatures not on the grid yet -- a creature a biome, scouted
updated: 2026-10-08 (Code tab) -- first written on Griz's ask: *"there's a bunch of monsters in the beastiary (SRD 2014's monster manual?) that we haven't added because they aren't in the game yet. There might be some cool ones that we should have for the pocket DM that will never be in the game, and there's probably some appropriate to the biomes in the game that I never thought of ... pick an interesting monster from SRD we don't have that would work in these biomes and from the Blue Dragon's desert biome. For each monster: Recall the monster description from the corpus, then go get what the internet describes it as and diff the two. Then write copypasta for the art department"*
room: a Claude Code desktop Code tab on ggpc (config echo claude-opus-5-5), door 2026-10-08T05:25Z, in the shared tree at 5b13bb6.
how: each creature is a recall written down before any lookup (the seat's own memory: `C:\Users\grimg\AppData\Local\Temp\claude\...\scratchpad\recall.md`, copied in below in short), then the SRD 5.1 text in `srd/`, then the web (four Sonnet runners, sources cited by URL; the Forgotten Realms wiki refuses a fetch, so its points are search-engine summaries), then the diff. The art asks are `deep16-art-wanted.md` §4. Nothing here is built and nothing here is canon: every "why here" is the seat's reading of the realm, his to keep or strike.
---

# The SRD's creatures not on the grid yet

## The count (his understanding holds)

The SRD 5.1 carries **317 stat blocks** (the monsters A-Z, Appendix MM-A's creatures, MM-B's people). **About 58 are on the grid** as foes (`deep16/data/foes.js` cites each by its SRD name), and five more only as familiar shapes (bat, frog, owl, rat, spider). **About 254 are not**: 68 beasts, 43 dragons, 30 monstrosities, 26 people, 23 fiends, 17 undead, 14 elementals, 9 constructs, 6 each of celestials, fey, giants and plants, 3 swarms, 1 aberration (the list by type is at the foot).

A reason they matter to the Pocket DM beyond fights: **the druid reads the bestiary.** Wild Shape offers only the beasts `foes.js` has (`deep16/js/features.js` F.SHAPES: wolf, wolf spider, axe beak, giant frog, giant spider, giant bat), and the summoning spells' pools are the bestiary by type and CR (`deep16/data/summons.js` D.pool). Every beast drawn in is a new shape and a new summon the day after.

## A creature a biome

The game's biomes are its battle backgrounds (`content/encounters.json` and the maps' `bg`). Town and arena left out; the Blue's desert added.

| biome (`bg`) | the place | the pick | CR, size | why there (the seat's reading) |
|---|---|---|---|---|
| plains | the road north and south, the Verge | **ankheg** | 2, Large | a burrower under rich soil; the burrow is the special move he ranks first |
| hills | the Doors' road | **winter wolf** | 3, Large | the SRD itself makes it the frost giants' hound, and the Doors' hub was a frost-giant hold |
| gnoll | the Gnoll Hills, the Snoot | **manticore** | 3, Large | a man-eater of the rocky wilds that sells itself to armies |
| bog | Glowseep | **shambling mound** | 5, Large | the swamp's own monster; lightning heals it |
| gulch | Web Gulch | **harpy** | 1, Medium | a song that walks a cutter off a ledge and into the webs |
| guano, deep | the Guano Galleries | **violet fungus** (and its shrieker) | 1/4, Medium | guano is a fungus's bed; a shrieker wakes the roost |
| cave, wet | the Warrens | **rust monster** | 1/2, Medium | a mine full of picks, rails and lamp-iron |
| highway, cavern | the four days to Deepholm | **basilisk** | 3, Medium | a highway lined with its statues; the grid's first petrifier |
| dwarf | Sólskaft and the Edifice | **gargoyle** | 2, Medium | carving that is not carving, on a carved facade |
| lake | Halfway Lake | **aboleth** | 10, Large | the realm already names one: the lake's chuul serves "the Mirror's aboleth chain" |
| (the desert) | the Blue's, between Newland and Roberia | **lamia** | 4, Large | the desert's ruined cities are its courts |

## The eleven

Each: **recall** (what the seat wrote before looking) · **SRD** (what `srd/` says) · **web** · **diff** · **the grid** (what it would need; probed 10-08).

### 1. The ankheg (plains: the road, the Verge)

- **Recall.** CR 2 Large; AC 14, 11 prone; 39 HP; 30 ft, burrow 10; darkvision and tremorsense 60; bite 2d6+3 + 1d6 acid, grapple DC 13; Acid Spray recharge 6, a 30x5 ft line, DEX 13, 3d6. A six-legged insect, brown to yellow-green chitin, long antennae, acid-dripping mandibles; waits under farmland and bursts up.
- **SRD.** Every number as recalled. No description at all.
- **Web.** 2e: worm-like, 10-20 ft, six hooked legs, a brown or yellow shell over a soft pink belly, shiny black eyes, a small mouth of tiny teeth behind mandibles that snap a sapling ([2e MM](https://discmaster.textfiles.com/file/30444/AD&D%20Core%20Rules%202.0%20Expansion.iso/webhelp/mm/dd03797.htm?html=true)). 5e's artist made it "beefier", with forelimbs built to tear through ground, studied from a mole cricket ([Christopher Burdett](http://christopherburdett.blogspot.com/2014/09/dungeon-dragons-monster-manual-ankheg.html)). It lies 5-10 ft down, feels footsteps, bursts up, crushes and dissolves; sprays only when desperate; solitary, no hoard. **The MM's blue dragons encourage ankhegs to live round their lairs as guards** (an MM mirror, unchecked against the book).
- **Diff.** The numbers held. **Missed:** the bite on the grappled one has advantage; the spray only while it holds nobody; the pink belly, the black eyes, the 5e digging forelimbs. Recall had no edition drift to fall into (2e worm, 5e insect).
- **The grid.** The bulette's `burrow`/`reveal` rows and the burrower AI; tremorsense waits on flight (the grid's rules §2.17); a line area (Lightning Bolt's); grapple and bite only the held one (the frog's grip); **AC 11 while prone** -- the first foe where knocking it down is worth a turn. It doubles for the desert.

### 2. The winter wolf (hills: the Doors' road)

- **Recall.** CR 3 Large; AC 13; 75 HP; 50 ft; Common, Giant, Winter Wolf; Keen Hearing and Smell, Pack Tactics, Snow Camouflage; bite 2d6+4, STR 14 or prone; Cold Breath recharge 5-6, 15 ft cone, DEX 12, 4d8; immune cold. Horse-sized, white, ice-blue eyes, frost on the muzzle; the frost giants' hounds.
- **SRD.** Every number as recalled, **and a paragraph of description** (Appendix MM-A's beasts carry one, glued to Cold Breath in our markdown): as large as a dire wolf, snow-white fur, pale blue eyes; frost giants use them as guards and hunting companions; they growl and bark, and speak Common and Giant well enough for simple talk.
- **Web.** About 8 ft long and 4.5 ft at the shoulder; white or silvery; small packs led by the cleverest; serves frost giants and white dragons ([FR wiki](https://forgottenrealms.fandom.com/wiki/Winter_wolf), via search); the frost rime on the muzzle is 3.x ([Pathfinder wiki](https://pathfinderwiki.com/wiki/Winter_wolf)).
- **Diff.** **Wrong:** "horse-sized" (the SRD says dire-wolf-sized); "the SRD has no description" (this one has). **From another edition:** the frost on the muzzle. **Missed:** it has no darkvision.
- **Why the Doors.** The road's table is worgs and wolves already; the Doors' hub is a frost-giant hold whose giants moved out on a seer's visions (CANON 08-27/28). Their hounds left behind is the seat's thought, not canon. A wolf that talks, in Giant, is a Pocket DM gift.
- **The grid.** A recharge breath (the grid has recharge: `foes.js`, `ai.js`); a cone; bite-or-prone (the wolf's own); Pack Tactics is read. Snow Camouflage waits for a snow map.

### 3. The manticore (gnoll: the Gnoll Hills, the Snoot)

- **Recall.** CR 3 Large; AC 14; 68 HP; 30 ft, fly 50; Common; 24 tail spikes that regrow on a long rest; bite and two claws, or three spikes at 100/200 ft. A lion's body, a bearded man's head with a wild mane and fangs, bat- or dragon-like wings, a spiked tail; cruel, bargains with prey, serves stronger evil.
- **SRD.** Every number as recalled. No description.
- **Web.** The 5e text: a vaguely human head, a lion's body, **a dragon's wings**, a spike-tipped tail ([D&D Beyond](https://www.dndbeyond.com/monsters/16951-manticore)). The 5e art as artists and readers describe it: a slender, striped feline, "not especially leonine", a creepy face with a triple row of teeth, a beard-like mane studded with quills ([jrevell](https://jrevell.blogspot.com/2021/01/d-monsters-manticores.html), [EN World](https://www.enworld.org/threads/preview-manticore.361978/)). 2e: tawny lion, a man's head with a heavy brown-black beard and mane, bat wings ([2e MM](https://discmaster.textfiles.com/file/30444/AD&D%20Core%20Rules%202.0%20Expansion.iso/webhelp/mm/dd03994.htm?html=true)). Cunning but cowardly: spikes from above, then dives in; can be bought off with tribute; flies air support for hobgoblin, orc and giant armies, **and allies with lamias**; rivals griffons, chimeras, wyverns; fears dragons ([D&D Beyond](https://www.dndbeyond.com/posts/375-how-to-play-a-manticore-like-a-cunning-beast)). The name is Persian for man-eater.
- **Diff.** The numbers held. **From another edition:** the bearded man's face and the bat wings are 2e; 5e is dragon wings, a quilled mane and three rows of teeth. **Right:** the bargaining and the serving.
- **Why the gnoll hills.** Rocky badlands, a war coming (the Snoot), a predator that sells its wings to armies. The seat's thought, not canon.
- **The grid.** Flight (one rule for the flyers, the grid's rules §2.17); a volley of three from a count of 24 (the same ledger as thrown weapons with a count, the grid's rules §2.16).

### 4. The shambling mound (bog: Glowseep)

- **Recall.** CR 5 Large; AC 15; 136 HP; 20 ft, swim 20; resists cold and fire, immune lightning; blindsight 60; Lightning Absorption; two slams 2d8+4, both on a Medium -> grappled and Engulfed (blinded, restrained, no air, CON 14 or 2d8+4 each turn, carried along). A heap of rotting vegetation, roughly man-shaped, no face; lightning makes it stronger.
- **SRD.** Every number as recalled; Stealth +2. No description.
- **Web.** The MM: a heap of rotting vegetation about half again a man's height, tapering to a faceless head, leaves and vines and roots, passing for undergrowth; born when lightning or fey magic wakes a swamp plant; eats anything organic; lizardfolk keep them as guardians ([D&D Beyond](https://www.dndbeyond.com/monsters/shambling-mound), MM text in a homebrew copy). Readers say an official picture shows a man caught inside it (edition unnamed). 2e: lightning makes it grow; 5e: lightning heals it.
- **Diff.** **From another edition:** "lightning makes it stronger" is 2e's growth; 5e heals. **Missed:** half again a man's height; its birth by lightning.
- **The grid.** Engulf is the cube's; Lightning Absorption is a heal-instead (a trap for the party's own Lightning Bolt); it swims.

### 5. The harpy (gulch: Web Gulch)

- **Recall.** CR 1 Medium; AC 11; 38 HP; 20 ft, fly 40; claws 2d4+1 and club 1d4+1; Luring Song, WIS 11, 300 ft, the charmed walk toward it, re-saves before harm and when hurt, 24 h immunity. A hideous woman's upper body on a vulture's; **unsure whether the arms are the wings.** Cliffs and ruins; lures travellers over edges; hoards shiny things.
- **SRD.** Every number and the whole song as recalled. (A runner reported our SRD copy drops the walk-toward rules; it doesn't -- `srd/monsters/h.md` has them whole. Probed.) No description.
- **Web.** The MM: the body, legs and wings of a vulture and **the torso, arms and head of a human woman** -- arms and wings both ([D&D Beyond](https://www.dndbeyond.com/monsters/16919-harpy)). 2e: a youthful but hideous face, frayed hair, rotten teeth; 3.5 a reptilian crone; 4e near-elfin; a5e wings for arms ([1d6chan](https://1d6chan.miraheze.org/wiki/Harpy)). Cowards that ambush the lone; lure victims off cliffs and into bogs, quicksand and pits; squabble over trinkets ([The Monsters Know](https://www.themonstersknow.com/harpy-tactics/)).
- **Diff.** The rules held. **Answered:** separate arms and wings. **Missed:** the bogs and pits as well as cliffs.
- **Why the gulch.** A gulch has walls and silk below; the silk-cutters work at noon with a drummer boy (CANON) -- what the drum is for is not ruled, and a harpy's song is not offered as the answer.
- **The grid.** A charm that walks a hero by the most direct route (the AI moving a hero, as Dominate Person does since 10-06), concentration, flight.

### 6. The violet fungus, and its shrieker (guano: the Guano Galleries)

- **Recall.** CR 1/4 Medium; AC 5; 18 HP; 5 ft; blindsight 30; False Appearance; 1d4 Rotting Touch, reach 10, 1d8 necrotic. A purple mushroom, waist to man high, thin tendrils from the stem. The shrieker: speed 0, no attack, shrieks at light or a creature.
- **SRD.** Every number as recalled; the shrieker: AC 5, 13 HP, speed 0, Shriek (a reaction: bright light or a creature within 30 ft, heard 300 ft, on until the disturbance leaves and 1d4 of its turns after). No description of either.
- **Web.** The MM has no look for either. 3.x: four tentacles; solid purple, dull grey, or violet spotted purple ([birthright.net](https://birthright.net/wiki/index.php/Violet_Fungus)); 3-5 ft tall. **Shriekers and violet fungi grow together: the shriek draws prey into the fungus's reach** ([Pathfinder wiki](https://pathfinderwiki.com/wiki/Violet_fungus)).
- **Diff.** The numbers held. **Missed:** four tentacles (3.x's count; 5e only rolls 1d4 touches); the pairing with the shrieker as a hunt.
- **Why the Galleries.** The guano is a fungus's bed, and the house's one law is no loud work under a nursery ceiling (RATIFIED 08-30): a shrieker patch in a gallery is a fight that wakes the roost. The seat's thought, not canon.
- **The grid.** False Appearance is a `still` with a reveal (the bugbear's Lurk); reach 10; a rolled count of attacks. The shrieker is an alarm the AI and the dark lane could use (light within 30 ft wakes it).

### 7. The rust monster (cave, wet: the Warrens)

- **Recall.** CR 1/2 Medium; AC 14; 27 HP; 40 ft; Iron Scent 30 ft; Rust Metal (a metal weapon -1 damage a hit, gone at -5; metal ammunition gone); bite 1d8+1; Antennae: DEX 11 for a carried thing, armour -1 AC a touch, gone at AC 10. An armadillo-backed insect, rust-red, two feathery antennae, a propeller tail; eats iron; a cheap-toy origin with the owlbear and the bulette.
- **SRD.** Every number as recalled, and: an unattended ferrous thing loses a 1-ft cube; a shield is gone at +0.
- **Web.** Pony-sized, humped, four insect legs, rust-red back, yellowish-tan belly, two long feathery antennae (one under each eye), a tail ending in a double paddle ([FR wiki](https://forgottenrealms.fandom.com/wiki/Rust_monster), via search). The body has drifted: a tick-like bony shell (1977), scales (1989), insect segments (1993) ([Wikipedia](https://en.wikipedia.org/wiki/Rust_monster)). Gygax took it from a bag of Hong Kong plastic "prehistoric" toys -- one like a lobster with a propeller tail ([DiTerlizzi](https://diterlizzi.com/essay/owlbears-rust-monsters-and-bulettes-oh-my/), [Black Gate](https://www.blackgate.com/2014/01/28/on-the-origins-of-the-rust-monster/)). Docile till it smells metal; drop a sword and it stops for it.
- **Diff.** The rules held, two small ones missed (the cube, the shield). The look held. **Loose:** the toy bag is credited with the carrion crawler, the umber hulk and the purple worm; the owlbear and the bulette are the essay's company.
- **The grid.** Rust Metal is already built: the gray ooze's Corrode Metal (`deep16/js/traits.js` onWeaponHit, -1 damage a hit for the fight) and its armour corrosion (`corrodedAC`). The rust monster is nearly free. Dropping a weapon to distract it is a new verb.

### 8. The basilisk (highway, cavern: the four days to Deepholm)

- **Recall.** CR 3 Medium; AC 15; 52 HP; 20 ft; darkvision 60; Petrifying Gaze (start of turn within 30 ft, CON 12, restrained, then petrified on a second fail; avert the eyes; its reflection in bright light turns it on itself); bite 2d6+3 + 2d6 poison. Eight legs, a low lizard, dull scales, a spiny ridge, glowing eyes; statues round its den; its gullet softens stone and cures it.
- **SRD.** Every number and the gaze as recalled. No description.
- **Web.** The 5e text says only "multilegged, reptilian horror" ([D&D Beyond](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/monster-stat-blocks-b)); eight legs in the Realms and elsewhere; dull brown with a yellowish belly (dark grey to dark orange), one row of bony spines, some a curved horn on the nose, **eyes glowing pale green**; about 6 ft of body and a 5-7 ft tail ([FR wiki via monstershuffler](https://www.monstershuffler.com/monsters/creature/basilisk-374.php)). It bites pieces off its statues, and its gullet's fluid turns stone back to flesh ([Walking Mind](https://walkingmind.evilhat.com/2014/08/28/5e-mm-basilisk-through-cyclops/)).
- **Diff.** All held, the eye colour included. **Missed:** the nose horn, the yellowish belly, the length.
- **Why the highway.** Four days of dark road with a statue garden; and the grid's rules §2.7 waits on "petrified on the monsters that lay them" -- this is the one.
- **The grid.** Flesh to Stone is already in the grimoire (restrained, then stone over saves) and Greater Restoration already ends it: the basilisk is that spell on a lizard, at the start of a hero's turn with no action spent. A creature stoned all the way is set aside as `banished` today, with no statue drawn (the art register's "not for the generator"). AVERT EYES is a new choice on the ring. A mirror is an item.

### 9. The gargoyle (dwarf: Sólskaft and the Edifice)

- **Recall.** CR 2 Medium elemental; AC 15; 52 HP; 30 ft, fly 60; resists nonmagical weapons not adamantine; immune poison, petrified, exhaustion; Terran; False Appearance; bite and claws 1d6+2. A horned, bat-winged stone fiend with a tail; still for ages; serves evil masters.
- **SRD.** Every number as recalled. No description beyond "statue".
- **Web.** The MM: malevolent creatures of elemental earth that look like grotesque fiendish statues, lurking in masonry and ruins, loving the terror when they break the pose ([D&D Beyond](https://www.dndbeyond.com/monsters/16868-gargoyle)); horned, winged, demon-like, thick stone hide; torture though they need no food; fond of gems ([FR wiki via monstershuffler](https://www.monstershuffler.com/monsters/creature/gargoyle-1814.php)). **The Realms' blue dragon Iymrith, "the Dragon of the Statues", turns stone into gargoyles in Anauroch, a desert** ([FR wiki](https://forgottenrealms.fandom.com/wiki/Gargoyle), via search).
- **Diff.** All held. **Missed:** the Blue's gargoyles.
- **Why Sólskaft.** A carved waterfall facade, a glass roof over an orchard, a town half sealed and dark (CANON 09-26); carving that moves. The seat's thought, not canon. It doubles for the desert.
- **The grid.** `still` and a reveal (the bugbear's Lurk); resist mundane is built (the earth elemental's `resist: ['mundane']`); flight; immune petrified (the basilisk's statues won't take it).

### 10. The aboleth (lake: Halfway Lake)

- **Recall.** CR 10 Large; AC 17; 135 HP; 10 ft, swim 40; telepathy 120; Amphibious, Mucous Cloud, Probing Telepathy; three tentacles 2d6+5 with a slime disease; tail 3d6+5; Enslave 3/day WIS 14; three legendary actions (Detect, Tail Swipe, Psychic Drain). A twenty-foot fish with four tentacles and three eyes stacked on its head, grey-green slime; older than the gods, remembers everything, enslaves, dreams of godhood.
- **SRD.** Every number as recalled. **Missed:** the disease waits a minute, stops healing out of water, and needs heal or a 6th-level cure; the enslaved can't take reactions; the lair and region are the MM's, not the SRD's.
- **Web.** 20 ft (25 in 3e), eel- or fish-bodied, **sea-green back and orange-pink belly**, three eyes stacked vertically, four tentacles behind the head (two above, two below), short tendrils under the head, fins ([Wikipedia 2007](https://wikipedia2007.classicistranieri.com/a/b/o/Aboleth.html)); the 5e art read as lamprey-like, a round toothed mouth ([Wargamer](https://www.wargamer.com/dnd/aboleth-5e)); 2024 redesigned it as a mass of tentacles. Lore as recalled, plus: **treated as a god in its waters**; its region within a mile **fouls the water** ([D&D Beyond](https://www.dndbeyond.com/monsters/aboleth)).
- **Diff.** The rules held but for three small riders. **Missed:** the colours, the tentacles' placement, the lamprey mouth of the 5e art.
- **Why the lake.** The lake's god is a chuul serving "the Mirror's aboleth chain" (CANON 08-26); a cult that thinks its lake is a god is the aboleth's own MM lore. **And a contrast the realm already holds:** Halfway Lake's water never fouls (CANON 08-26), and an aboleth fouls a mile round it -- so wherever the Mirror's aboleth lies, it is not in this lake. This sheet is the SRD's aboleth; nothing here rules what the Mirror's looks like. A Pocket DM boss.
- **The grid.** Bound to water (`bound: '~'`); legendary actions (none on the grid yet); a charm with commands (Dominate Person's machinery); a disease.

### 11. The lamia (the Blue's desert)

- **Recall.** CR 4 Large; AC 13; 97 HP; 30 ft; Abyssal, Common; innate: disguise self and major image at will, charm person, mirror image, scrying and suggestion 3/day, geas 1/day; claws 2d10+3, dagger 1d4+3, Intoxicating Touch (a curse: disadvantage on WIS saves and checks for an hour). A beautiful woman's upper body on a lion's -- **unsure: lion or goat**; desert ruins, decadent, slaves held by geas, jackalwere servants.
- **SRD.** Every number as recalled; the multiattack is claws plus dagger-or-touch; Deception +7. No description.
- **Web.** 5e (2014): **a lion's lower body**, a beautiful humanoid upper half, man or woman, about 8 ft tall ([The Monsters Know](https://www.themonstersknow.com/lamia-tactics/)). The goat is 2e's option and its sa'ir offspring; 2e and 3e nobles and the myth are serpent-bodied ([Planewalker](https://planewalker.com/encyclopedia/lamia_.html), [Wikipedia](https://en.wikipedia.org/wiki/Lamia)). The MM: ruined desert cities and the tombs of forgotten kings are its lairs; a hedonist ruling sycophants ([Keith Baker](https://keith-baker.com/lamias/)); manipulates before it fights; scrying as a bargaining chip; jackalweres and enthralled people as minions ([The Lore Bard](https://thelorebard.substack.com/p/the-lamia)).
- **Diff.** All held. **Answered:** lion. **Missed:** the male lamia; the tombs.
- **Why the desert.** A desert court in a ruin, under an awake Blue that "will rise" (CANON 09-16b): a power player the Blue rules, or courts. Manticores ally with lamias, so pick 3 shares its world.
- **The grid.** Charm Person and Mirror Image are in the grimoire; Suggestion, Major Image, Geas, Disguise Self and Scrying are not. Intoxicating Touch is a one-hour curse.

## The Blue's desert, from the MM's blue dragon (for the next desert picks)

From the runners ([D&D Beyond](https://www.dndbeyond.com/monsters/ancient-blue-dragon); the servants from MM mirrors, unchecked): it lairs in crystal-lined caverns under the sand, glazed by its own lightning, behind hidden sinkholes; within six miles, thunderstorms, dust devils (air elementals that do not fly) and sinkholes (DC 20 to spot); **ankhegs and giant scorpions are encouraged to live near the lair as guards**; its agents are bards, sages, artists, wizards and assassins; it raids caravans and fights brass dragons. The Realms' blue Iymrith makes gargoyles. **The runners-up for the desert:** the giant scorpion (3), the mummy (3), the dust mephit (1/2), the blue dragon wyrmling (3), the gynosphinx (11); the ankheg and the gargoyle above serve it too.

## The rest, by type (not on the grid, SRD 5.1, CR)

- **aberration:** Aboleth 10
- **beast (68):** Plesiosaurus 2, Triceratops 5, Tyrannosaurus Rex 8, Ape 1/2, Baboon 0, Badger 0, Black Bear 1/2, Blood Hawk 1/8, Boar 1/4, Brown Bear 1, Camel 1/8, Cat 0, Constrictor Snake 1/4, Crab 0, Crocodile 1/2, Deer 0, Dire Wolf 1, Draft Horse 1/4, Eagle 0, Elephant 4, Elk 1/4, Flying Snake 1/8, Giant Ape 7, Giant Badger 1/4, Giant Constrictor Snake 2, Giant Crab 1/8, Giant Crocodile 5, Giant Eagle 1, Giant Elk 2, Giant Goat 1/2, Giant Hyena 1, Giant Lizard 1/4, Giant Octopus 1, Giant Owl 1/4, Giant Poisonous Snake 1/4, Giant Scorpion 3, Giant Sea Horse 1/2, Giant Shark 5, Giant Toad 1, Giant Vulture 1, Giant Wasp 1/2, Giant Weasel 1/8, Goat 0, Hawk 0, Hunter Shark 2, Jackal 0, Killer Whale 3, Lion 1, Lizard 0, Mammoth 6, Mastiff 1/8, Mule 1/8, Octopus 0, Panther 1/4, Polar Bear 2, Pony 1/8, Quipper 0, Raven 0, Reef Shark 1/2, Rhinoceros 2, Riding Horse 1/4, Saber-Toothed Tiger 2, Scorpion 0, Sea Horse 0, Tiger 1, Vulture 0, Warhorse 1/2, Weasel 0 (the cat is also a familiar shape)
- **celestial (6):** Deva 10, Planetar 16, Solar 21, Couatl 4, Pegasus 2, Unicorn 5
- **construct (9):** Animated Armor 1, Flying Sword 1/4, Rug of Smothering 2, Clay Golem 9, Flesh Golem 5, Iron Golem 16, Stone Golem 10, Homunculus 0, Shield Guardian 7
- **dragon (43):** every age of the ten colours (black, blue, green, red, white; brass, bronze, copper, gold, silver), Dragon Turtle 17, Pseudodragon 1/4, Wyvern 6
- **elemental (14):** Azer 2, Air Elemental 5, Fire Elemental 5, Water Elemental 5 (ruled 10-04, a sheet asked), Gargoyle 2, Djinni 11, Efreeti 11, Invisible Stalker 6, Magmin 1/2, Dust Mephit 1/2, Ice Mephit 1/2, Magma Mephit 1/2, Steam Mephit 1/4, Salamander 5
- **fey (6):** Dryad 1, Green Hag 3, Sea Hag 2, Satyr 1/2, Sprite 1/4, Blink Dog 1/4
- **fiend (23):** Balor 19, Dretch 1/4, Glabrezu 9, Hezrou 8, Marilith 16, Nalfeshnee 13, Quasit 1, Vrock 6, Barbed Devil 5, Bearded Devil 3, Bone Devil 9, Chain Devil 8, Erinyes 12, Horned Devil 11, Ice Devil 14, Imp 1, Lemure 0, Pit Fiend 20, Night Hag 5, Hell Hound 3, Nightmare 3, Rakshasa 13, Succubus/Incubus 4
- **giant (6):** Cloud Giant 9, Fire Giant 9, Frost Giant 8, Hill Giant 5, Storm Giant 13, Oni 7
- **people (26):** Svirfneblin 1/2, Half-Red Dragon Veteran 5, Kobold 1/8, Lizardfolk 1/2, Werebear 5, Wereboar 4, Wererat 2, Weretiger 4, Werewolf 3, Merfolk 1/8, Orc 1/2, Sahuagin 1/2, Acolyte 1/4, Archmage 12, Commoner 0, Cultist 1/8, Cult Fanatic 2, Druid 2, Gladiator 5, Knight 3, Noble 1/8, Scout 1/2, Tribal Warrior 1/8 (the grid's classes cover the mage, the priest and the spy)
- **monstrosity (30):** Ankheg 2, Basilisk 3, Behir 11, Centaur 2, Chimera 6, Cockatrice 1/2, Death Dog 1, Doppelganger 3, Gorgon 5, Griffon 2, Guardian Naga 10, Harpy 1, Hippogriff 1, Hydra 8, Kraken 23, Lamia 4, Manticore 3, Medusa 6, Merrow 2, Mimic 2, Minotaur 3, Owlbear 3, Purple Worm 15, Remorhaz 11, Roc 11, Rust Monster 1/2, Androsphinx 17, Gynosphinx 11, Tarrasque 30, Winter Wolf 3
- **plant (6):** Shrieker 0, Violet Fungus 1/4, Shambling Mound 5, Treant 9, Awakened Shrub 0, Awakened Tree 2
- **swarm (3):** Swarm of Poisonous Snakes 2, Swarm of Quippers 1, Swarm of Ravens 1/4
- **undead (16):** Ghost 4, Ghast 2, Ghoul 1, Lich 21, Mummy 3, Mummy Lord 15, Shadow 1/2, Minotaur Skeleton 2, Warhorse Skeleton 1/2, Specter 1, Vampire 13, Vampire Spawn 5, Wight 3, Wraith 5, Zombie 1/4, Ogre Zombie 2
