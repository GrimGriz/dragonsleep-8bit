# The Game Show's supplies: the items, for your picks

The Game Show lane §3 C (seat 3). Two Sonnet runners drafted these on 10-07, from your tiers as written ("Tier 2 - Package (Greater Potion x3, one +1 'weapon slot items' (might have sonnet runners invent them...), higher AC no plus armor, batwing)" and the rest). **Nothing is built until you pick.** Answer by number and letter, e.g. "1a, 2c, 2f, 2g, 2j, 2k-2n, 20a, 21b, 22b, 23b, 24c, 25a". Every number is the SRD 5.1's (`srd/13-magic-items.md`, `srd/04-equipment.md`); "exists" means `content/items.json` has it today.

Where the Mascots stand at 1st (`deep16/js/mpmon.js`): all four DEX 14, proficiency +2, **AC 14** (natural armour, 12 + DEX).
- **Denny**: Monkey Fists, +5, 1d6+3 (1d8 two-handed). **Beholda**: Dice Slam on WIS, +5, 1d8+3, no hands. **Rascal**: Fire Bolt on CHA, +5, 1d10; Pinch +2, 1d6. **Goose**: Sling on WIS, +5, 1d4+3.

## Tier 1 (0.1 on the score)

| # | for whom | name | rule | SRD shape | flavour |
|---|---|---|---|---|---|
| 1a | Goose | Sling Bullets (x20) | One a shot. **Missing:** add `slingbullets`. Goose's sling uses no ammo today ("a stone off the floor"), so this does nothing until the sling is wired to it (Q3). | Sling bullets, srd/04 | "A pouch of smooth stones, courtesy of chat. Goose counts them. Twice." |
| 1b | anyone (held to Beholda) | Potion of Healing (x2) | **Exists** (`potion`): 2d4+2, an action, yourself or a friend within 5 ft. | Potion of Healing | "Red, glimmering, labelled DRINK ME (CHAT APPROVED)." |
| 1c | the three with hands | Torch (x3) | **Exists** (`torch`): bright 20 ft, dim 20 more, takes a hand. Third Lamp is a dark map, so torches matter there. | Torch, srd/04 | "Fire on a stick. The oldest overlay on the stream." |
| 1d | anyone (held to Beholda) | Elixir of Health (x1) | **Exists** (`elixir`): the condition item. It ends poisoned and paralysed on the grid. | Elixir of Health (DMG; not in srd/13) | "Cures what ails you, per the label. Tastes like a sponsor read." |

## Tier 2: the package (3 on the score)

Three potions, one +1 weapon (pick **one name of each pair**), one armour, one pie.

| # | for whom | name | rule | SRD shape | flavour |
|---|---|---|---|---|---|
| 2a | the package | Greater Potion x3 | **Exists** (`greaterpotion`): 4d4+4. | Potion of Healing, greater | "Three bottles from someone who watched the whole VOD." |
| 2b | one friend | Bat-Wing Pie | **Exists** (`batpie`), which is how the runner read "batwing". An action: +5 max and current HP and +1 to CON saves till the fight ends, once per creature. It can't raise the downed. | invented (Marta Venn's, your 09-24) | "Marta Venn's special, still warm, from a stranger with a gift sub." |
| 2c / 2d | Denny | Play-Button Knuckles +1 / Banhammer Mitts +1 | Monkey Fists made magic: +1 to hit and damage. | Weapon, +1 | "A creator award worn the wrong way round. It still says THANK YOU." / "Mods wear them. Denny just closes his hands." |
| 2e / 2f | Beholda | Loaded Dice +1 / Crit Monocle +1 | Dice Slam made magic: +1 to hit and damage. | Weapon, +1 | "Three dice, all weighted toward 'ow'." / "Through it, everything looks like a natural 20." |
| 2g | Rascal | Flame War Claw +1 | **+1 on the Pinch and on his Fire Bolt**: the bolt is his regular blow. Needs about three new lines (a spell-attack bonus from an item). | Weapon +1 with Wand of the War Mage +1 | "Lacquered in something that burns. The replies are all fire emoji." |
| 2h | Rascal | Clap-Back Claw +1 | The Pinch only. No new rule, but it serves his rare blow. | Weapon, +1 | "Pinches back, harder." |
| 2i / 2j | Goose | Honkshot +1 / Heartstring Sling +1 | The Sling made magic: +1 to hit and damage. | Weapon, +1 (Sling) | "The stone goes out with a HONK." / "Braided from the strings of one very large heart." |
| 2k-2n | one each | Double Denim (Denny) · Mod Mail (Beholda) · Thermidor Plate (Rascal) · Puffer Plate (Goose) | **AC 14 to 16**, no plus: the breastplate step (14 + DEX, max 2). Four new armour items. | Breastplate | "A Canadian tuxedo." · "Anything that hits it gets reported." · "Do not ask what it was before." · "It honks when hit." |

## Tier 3: the package (12 on the score)

Three items, three roll-offs. Each item is cut to whoever wins it.

| # | slot | name | rule | SRD shape | attune | flavour |
|---|---|---|---|---|---|---|
| 20a | armour | FRESH FIT | The winner's own armour at +1 AC. | Armor, +1 | no | "Same coat as yesterday. Somehow it's giving main character." |
| 20b | armour | RIVET JOB | A critical hit on the wearer is a normal hit. No AC change. | Adamantine Armor | no | "Somebody in chat knows a dwarf." |
| 21a | ring | GACHA RING | Your click rolls 1d4 for the stat: 1 STR, 2 CON, 3 WIS, 4 CHA. That stat +1, max 20. | worn stat item | yes | "Pull it and see. Chat says the rates are fair." |
| 21b | ring | GAINS RING | Cut to the winner's key stat. Your click rolls 1d4, and the stat goes up by that much, max 20. | worn stat item | yes | "Cut to fit the winner. It does not stop talking about gains." |
| 22a | cloak | MOD CAPE | +1 AC and +1 to every save. | Cloak of Protection | yes | "Stitched by the chat mods, who have seen things." |
| 22b | cloak | LAG CLOAK | Attacks on the wearer have disadvantage until it takes damage; it comes back at the start of its turn. **Built already** (`cloakdisplacement`). | Cloak of Displacement | yes | "They swing at where you were." |

## Tier 4: one epic item (20 on the score)

An attack item OR an armour item.

| # | slot | name | rule | SRD shape | attune | suits |
|---|---|---|---|---|---|---|
| 23a | weapon | HARD CARRY | +3 to hit and damage with the winner's own blow. | Weapon, +3 | no | Denny, Beholda, Goose |
| 23b | weapon | BAN HAMMER | +3; it can be thrown 20/60 ft, +1d8 on a thrown hit (2d8 on a giant), and it flies back. | Dwarven Thrower | yes | Denny |
| 23c | weapon | HOT TAKE | +3 to spell attacks; ignores half cover. | Wand of the War Mage, +3 | yes | Rascal |
| 24a | armour | SPONSORED SKIN | The winner's own armour at +2 AC. | Armor, +2 | no | all four |
| 24b | armour | BOILED SHELL | +1 AC, resistance to one damage type (Rascal: fire), advantage against dragon fear and breath. | Dragon Scale Mail | yes | Rascal |
| 24c | armour | DWARVEN DENIM | +2 AC; the wearer's reaction cuts a shove by up to 10 ft. | Dwarven Plate | no | Denny |

## The epic amulet (ring slot, at 100 on the score: "check the chest!")

| # | name | rule | SRD shape | flavour |
|---|---|---|---|---|
| 25a | VIRTUALLY INVULNERABLE | Resistance to nonmagical bludgeoning, piercing and slashing. Once a long rest, immune to them for the rest of the fight. | Armor of Invulnerability | "'Virtually' is doing a lot of work." |
| 25b | THE VNA AMULET | The wearer and every friend within 10 ft get +2 to saves. | Holy Avenger's aura | "As long as the lamp stays lit, you're virtually not alone. This is how it stays lit." |

**The runners' leans:** 2g (Rascal's +1 serves his bolt), 20a, 21b, 22b (built already), 23a or 23b, 24a, 25a.

## Questions that change the build

1. **The armour in tier 2:** does it go by the roll-off like the rest, or do all four get it?
2. **The AC ladder:** natural 14, tier 2 16, tier 3 17, tier 4 18-19. Or tier 2 at 15 (the chain-shirt step), so a tier 3 +1 isn't stacked on a big jump?
3. **Ammo:** should Goose's sling run dry, so that 1a matters? Or is it a prop?
4. **Attunement:** the Mascots carry no bond list today, so the SRD's three-item cap doesn't apply. Should the show turn it on?
5. **The ring:** the runners lean 21b. A flat +1 (21a) never moves a modifier, because every Mascot score is even.

## For the build (seat 3; checked by reading and grep, none of it run)

- **Data only:** +N weapons and +N armour (`weapon.bonus`, `armor.bonus`), resistance, and Cloak of Displacement. A +1 natural weapon also counts as magic.
- **Small hooks:**
  - Rascal's spell-attack bonus from an item (2g, 23c): the attack wrap in mpmon.js.
  - A worn stat bonus (21a/21b): the d4 result lives per hero, and a CON change recomputes HP.
  - Adamantine's no-crit (20b): one flag where battle.js decides the crit.
  - A cloak's +1 AC and saves (22a): works today as a `ring: {...}` block, or two lines in R.ac and R.saveBonus.
  - The VNA Amulet's aura (25b): feeds RU.auraOf.
- **Not built:**
  - The thrown-and-returns hammer (23b).
  - Dwarven Denim's reaction (24c).
  - 25a's once-a-rest immunity.
  - 24b's advantage against dragons.
- **Equipping:** `R.CLASSES.mpmon` refuses the Mascots any armour or non-natural weapon, so the supplies set `equip` directly, onto the Mascot who won. A natural weapon left in the pack could be worn by any Mascot. Armour never changes mid-fight, so it goes on at the bed.
- **Beholda has no hands.** She drinks potions herself, and a friend beside her can give her the rest. Rings and cloaks go on an eyestalk.
