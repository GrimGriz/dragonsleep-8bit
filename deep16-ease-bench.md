---
layer: the ease bench (dev/ease_runs.py). Why the fights on the grid come out easy: the same fight with one thing changed at a time. For the tuning seat (handoff-2026-09-28-class-npcs-built.md §5), beside deep16-class-bench.md.
written: 2026-09-28 22:2xZ by the Code tab (config claude-opus-5-5). Rerun from PowerShell (headless Edge answers nothing from the Bash tool's sandbox): python dev/ease_runs.py (N=40 by default; seed 3; level 5).
rerun: 2026-10-29 by the difficulty seat (config claude-opus-5-5): the section at the foot, beside the 09-28 table.
question: Griz 09-28g, after watching the four beat Talmok, Willem, Kat and Torvald on the Pocket DM: "is the ease a gear issue, AI issue, or 5v4 issue?"
---

# Why it's easy

Both sides always run the one class AI (`deep16/js/tactics.js`). "The four" are the ladder's fixture: Barley, Aurdin, Vivian and Lymen at level 5 by the 8-bit game's own rules -- a max hit die every level (RULED 09-25), their quest weapons (+1 from 5), Barley in splint (the ladder's, 09-27), Mage Armor cast that morning. `plain` takes the weapons back to the plain ones and the splint off; `avghp` gives the four the SRD's average HP, the class NPCs' own rule.

| the fight (40 each) | the four won | rounds | the four's HP left | the four down, a fight |
|---|---|---|---|---|
| **the watched one**: the four vs Talmok, Willem, Kat, Torvald | 40 | 4.3 | 83% | 0.15 |
| ... plain weapons, no splint | 39 | 4.3 | 82% | 0.17 |
| ... average HP | 36 | 4.5 | 74% | 0.53 |
| ... both | 38 | 4.4 | 72% | 0.42 |
| ... the same four classes as generic level-5 NPCs (barbarian, wizard, two clerics) | **16** | 5.3 | 17% | 2.75 |
| **the mirror**: the four vs their own classes as generic level-5 NPCs | 29 | 4.5 | 34% | 1.50 |
| ... plain weapons, no splint | 22 | 4.5 | 25% | 2.25 |
| ... average HP | 19 | 3.7 | 23% | 2.40 |
| ... both | 11 | 3.9 | 11% | 3.13 |
| the NPC mirror: generic hero classes on both sides (no hero sheets at all) | 20 of 40 | 3.9 | 25% | 2.42 |
| **numbers**: the four vs five (the mirror and a fighter) | 19 | 4.2 | 16% | 2.73 |
| ... plain and average HP | 5 | 3.4 | 2% | 3.75 |

## Reading

- **The watched fight was easy because of the other side, not the heroes' gear, the AI or the count.** It was four against four. Take the heroes' gear and max HP away and they still win 38 of 40. Put generic level-5 builds of the same four classes across from them and the heroes win 16 of 40. The named four are built from their register sheets: Talmok is a barbarian 3 with his fists (35 HP) against level 5; Willem, on the Pocket DM, has the generator's average 27 HP and no armour; Kat wears leather; Torvald is the SRD Priest's list at 43 HP. A named NPC's register level and kit are the knob for the Pocket DM and the story fights.
- **The AI is even-handed.** Generic against generic, the same classes both sides: 20 to 20.
- **The heroes' own edge is gear and HP, about equally.** In the mirror they win 29 of 40; plain weapons take that to 22, average HP to 19, both to 11. The max-die HP rule and the quest weapons are each worth about a quarter of the fights.
- **Numbers matter as much as either.** One more fighter across the table takes the mirror from 29 wins to 19.
- **The ladder is a separate case** (handoff-2026-09-28-class-npcs-built.md §3): its fights were sized against the old spell-less bench bot, and the real AI's Fireball clears a clustered rung in a round. Tune the ladder by its foes' numbers and spacing, against these heroes as they are, not by weakening the heroes.

## The rerun, 2026-10-29 (the difficulty lane §2.7: not rerun since the SRD's prone went engine-wide)

`python dev/ease_runs.py`, N=40, seed 3, level 5, by the difficulty seat (config claude-opus-5-5), on main at `2bf5011`. The same rows, 09-28 -> 10-29. A month of the engine moved between them (the SRD's prone, the class AI's turns, the features), so a change here is the sum of it, not the prone alone.

| the fight (40 each) | the four won | rounds | the four's HP left | the four down, a fight |
|---|---|---|---|---|
| **the watched one**: the four vs Talmok, Willem, Kat, Torvald | 40 -> 40 | 4.3 -> 3.8 | 83% -> 88% | 0.15 -> 0 |
| ... plain weapons, no splint | 39 -> 40 | 4.3 -> 4.4 | 82% -> 83% | 0.17 -> 0.05 |
| ... average HP | 36 -> 40 | 4.5 -> 3.9 | 74% -> 88% | 0.53 -> 0.03 |
| ... both | 38 -> 38 | 4.4 -> 4.4 | 72% -> 81% | 0.42 -> 0.25 |
| ... the same four classes as generic level-5 NPCs | 16 -> **21** | 5.3 -> 6.0 | 17% -> 29% | 2.75 -> 2.27 |
| **the mirror**: the four vs their own classes as generic level-5 NPCs | 29 -> **35** | 4.5 -> 6.1 | 34% -> 57% | 1.50 -> 0.65 |
| ... plain weapons, no splint | 22 -> 33 | 4.5 -> 7.6 | 25% -> 46% | 2.25 -> 1.05 |
| ... average HP | 19 -> 25 | 3.7 -> 5.5 | 23% -> 37% | 2.40 -> 1.77 |
| ... both | 11 -> **20** | 3.9 -> 6.0 | 11% -> 25% | 3.13 -> 2.35 |
| the NPC mirror: generic hero classes on both sides | 20 -> 17 of 40 | 3.9 -> 4.7 | 25% -> 22% | 2.42 -> 2.52 |
| **numbers**: the four vs five (the mirror and a fighter) | 19 -> 25 | 4.2 -> 6.3 | 16% -> 32% | 2.73 -> 1.88 |
| ... plain and average HP | 5 -> 4 | 3.4 -> 4.3 | 2% -> 8% | 3.75 -> 3.63 |

**Reading the rerun.** The AI is still even-handed (generic against generic, 17 to 23). What moved is the four's own sheets: every row where Barley, Aurdin, Vivian and Lymen play as themselves wins more and longer than on 09-28 -- the mirror 29 to 35, the mirror stripped of gear and HP 11 to 20 -- while the fights where both sides are generic stand still. The heroes' sheets have gained on the NPC builds since 09-28; the fights read against the difficulty sentence (RULED 10-28: about 75% won with a down or two, against the player's hand) should be tuned by their foes, not by the AI.
