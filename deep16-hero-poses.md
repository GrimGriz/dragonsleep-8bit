# DEEP16: the heroes' poses -- the master list

Started 2026-10-30 by the lanes desk on Griz's word: *"When leveling finishes we'll have to compile sprite lists for attacks and various armors for the main characters - i.e. symmetric weapons attacks. We'll want a master list started we can append for all those poses before the art ceiling reset"*.

**What it is:** every pose and look the four heroes need for what they can hold, wear and do in the second game. One line a pose. **Append, never rewrite.** A line's status changes in place: **DRAWN** (the row is on the sheet), **FALLS BACK** (no row yet: it plays the named one instead), **WANTED** (listed here, no ask yet), **ASKED** (a block in `deep16-art-wanted.md`, its section), **IN HAND** (cut, with its hash; the block moves to `deep16-art-in-hand.md` as ever). When the art budget resets, the art asks are written from the WANTED lines, most-played first.

**Who appends:** any seat that gives a hero something new to hold, wear or do (a weapon, an armor, a feat, a class feature, a spell with a pose of its own) adds its line here, under the hero and under EVERY HERO if it is shared, naming the row the engine will look for. A seat's close checks it did.

**How the engine picks a hero's row** (probed 10-30; read these before naming a row):
- A blow plays `attack`, or `cast` for a spell that is not a melee touch (`deep16/js/battle.js` ~2236; `deep16/js/magic.js` ~422, `castup` for a spell with no target).
- Over `attack`, a row named for the blow: `atk.row`, else the weapon's name in lower-case letters only ("Dagger +1" -> `dagger`), else the weapon's `kind` (~2241-2244). The second blow of a turn plays `<row>2` where drawn, else `attack2` (~2245-2248). A row the sheet lacks is never set, so `attack` stays.
- At draw time a held weapon's kind swaps whole rows: a quarterstaff plays the staff rows, a dagger `dagger` (`deep16/js/sprites.js` S.HELD, S.inHand ~225).
- A sheet with `grips` gets its weapon drawn in its hands by code (`sprites.js` S.wieldOf, S.wield ~246-272): only `barley_p3`, for the threshing flail and the flail, the battleaxe and the greataxe.
- Shots: no row of their own; a shot plays `attack`, the missile leaving on the row's `release` frame (`battle.js` ~2263).
- The look: `deep16/js/save.js` SV.LOOK / SV.mailed / SV.look (~184-193), picked when the unit is made.
- Views: five drawn, S, SE, E, NE, N; SW, W, NW mirrored (RULED 10-14).

**RULED 10-30** (his *"master list - agreed with weapon family and aiming for code-drawn weapon variability with strike pose by weapon type. Similar possibilities for armor and robes should be investigated."*): the weapon families stand, and the aim is the weapon drawn by code in the hero's hands, any weapon, with a strike pose a weapon TYPE (a slash, a thrust, an overhead, a shot, a throw...) -- so the art desk draws poses by type, empty-handed or gripping, and the code draws the weapon. **To investigate:** the same for armor and robes -- a look drawn by code over one body (a recolour, a layer, a tabard), so one sheet a hero serves every armor. *Was:* **A lean for the code, not the art (his word first):** one drawn row serving a family of weapons -- a `bow` row for the shortbow and longbow, `crossbow` for the light and hand crossbows, `polearm` for the glaive, halberd and pike -- by a small alias table beside S.HELD, so the art desk draws a pose a family, not a pose a weapon. And for Barley's mail look, which draws its weapon by code, more `grips` (the greatsword, the maul, the three polearms) may cover his two-handers with no new art.

## The four as they stand (10-30)

| hero | sheets | rows |
|---|---|---|
| Barley (fighter) | `barley_p2` coat, `barley_p3` mail (body armor medium or heavy, base AC 13+) -- the art desk's ART-75/76/77 and ART-109 | idle, walk, attack (flail sweep), attack2 (flail overhead), hurt, sit, flinch, prone, defend, getup, useitem, victory, interact, secondwind, actionsurge; p2 has the flail drawn in his hands, p3 is empty-handed (code draws it) |
| Aurdin (wizard) | `aurdin_p3` Red Mantle, `aurdin_p2` Ochre (in robes) -- ART-73 and ART-72 | idle, walk, attack (an empty hand), hurt, sit, cast, castup, flinch, prone, defend, getup, interact, useitem, victory, staffidle, staffwalk, staffcast, staffrest, staffstrike, dagger, wandcast (wired to nothing; no wand item) |
| Vivian (rogue) | `vivian_p0` only -- an LPC sheet; the art desk never drew her a grid package | idle, walk, attack (a dagger slash), hurt, sit |
| Lymen (paladin) | `lymen_p0` only -- an LPC sheet, the shield and mail baked in; no grid package | idle, walk, attack (a longsword slash), hurt, sit, cast |

**The biggest gap is not a weapon:** Vivian and Lymen have no grid package at all -- no defend, flinch, prone, getup, useitem, victory, interact, and Vivian no cast -- where Barley and Aurdin have the whole set. Their packages (as ART-75 and ART-72 were) come before any weapon row of theirs.

## EVERY HERO

- **Ranged, bow** (shortbow, longbow; GreyFang's Bow +1): FALLS BACK `attack` -- a shot plays the melee swing. WANTED.
- **Ranged, crossbow** (light crossbow in every pack; hand crossbow, Vivian): FALLS BACK `attack`. WANTED.
- **Thrown** (dagger, handaxe, spear, light hammer -- thrown by class NPCs only today, `deep16/js/classes.js` NPC.THROWN): no hero throws yet; WANTED when one does.
- **Two weapons** (the off hand; Symmetric Fighting): FALLS BACK -- the off-hand blow replays the same row (`battle.js` ~1651). WANTED: an off-hand blow, and for Symmetric Fighting both hands.
- **Unarmed** (a punch, a shove, a grapple): FALLS BACK `attack` (the weapon swing). WANTED.

## Barley

- One-handed melee (longsword, mace, warhammer...): FALLS BACK `attack` (the flail sweep; p3 shows empty hands). WANTED, or by code (`grips`).
- Greatsword, maul (heavy two-handers; Follow-Through's WIDE SWING wants a heavy weapon): FALLS BACK to the flail pose. WANTED, or by code.
- Glaive, halberd, pike (reach 10 ft since `7dd4adcd`; Long Guard's KEEP BACK and SET AGAINST THE CHARGE): FALLS BACK `attack`. WANTED -- a thrust at 10 ft.
- Whip: FALLS BACK `attack`. WANTED.
- Shield: no shield drawn on either look. WANTED with a shield in hand.
- Armor: coat (none, light, hide) and mail (medium or heavy 13+; one look for chain, splint and plate). DRAWN.

## Aurdin

- Dagger: DRAWN `dagger`. Quarterstaff: DRAWN (the staff rows).
- Light crossbow: FALLS BACK `attack` (an empty hand). WANTED (or the EVERY HERO crossbow row).
- The staff in hand through defend, flinch, fall, prone, getup, useitem, victory and castup: not drawn (ART-72/73's open item). WANTED.
- `wandcast`: DRAWN, used by nothing -- for a wand when one is in the game.
- `aurdin_p4`, the star mantle drawn by code (idle, walk, cast, attack): worn by nothing yet.
- Armor: robes (Ochre) or none (Red). DRAWN.

## Vivian

- The grid package (cast, defend, flinch, prone, getup, useitem, victory, interact). WANTED first.
- Dagger, shortsword, rapier, scimitar (finesse, one hand): FALLS BACK `attack` (a dagger slash). WANTED.
- Hand crossbow, shortbow: FALLS BACK `attack`. WANTED.
- Two weapons (a rogue's off-hand blow): FALLS BACK. WANTED.
- Armor: one look for all (light armor: padded, leather, studded -- studded at 4 on the ladder). WANTED, if the light armors are to show.

## Lymen

- The grid package (defend, flinch, prone, getup, useitem, victory, interact). WANTED first.
- Longsword (his start), other one-handed: FALLS BACK `attack` (the sword slash). DRAWN for the longsword.
- Two-handed (greatsword, maul) and the polearms (glaive, halberd, pike, reach 10 ft): FALLS BACK `attack` (a one-hand slash). WANTED.
- Shield: DRAWN, always (baked into the sheet). Without it: WANTED, if he is to set it down.
- Spells: `cast` DRAWN. Divine Smite, Lay on Hands, Channel Divinity: FALL BACK (`attack`, `cast`). WANTED if each is to have its own.
- Armor: one look for all (chain baked in). WANTED, if his armor is to show.
- His talking portrait: ASKED, art-wanted §33 (`pt_lymen`, cut mirrored to sit bottom left).

## Others the heroes' pick can make (the Pocket DM's maker; not the four)

- The Circle of the Pelt's druid wearing claws, hide or haunches: FALLS BACK (the plain figure). His *"we'll need claw attack animations for this"* (10-30): WANTED -- the bestiary lane's section 48.
