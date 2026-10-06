---
title: The signature fight -- the recipe
made: 2026-10-03 (the oversight window), from the Keeper of the Flooded Stair: his design 10-02, built across two cloud seats and the desk 10-03, played by Griz in about forty records, shipped to main on his word (c8868ab). Sources: `handoffs-spent/handoff-2026-10-02-the-keeper.md`, `cloud-notes/deep16-keeper-notes.md`, `narrative-memory-2026.10.03-the-keeper-cloud-and-desk.md`, the bolt's 10-03 entry. Griz: *"what we went through (or a better version of it you come up with) as a 'signature fight' protocol/approach we may repeat on purpose."*
law: the pull rule is monster-driven and the SRD 5.1 is the finish line for everything ordinary; a signature fight is where the realm breaks the SRD **on purpose and says so**. One fight at a time; the next one cites this file in its brief.
---

# The signature fight

A signature fight is a story boss that is **sufficiently distinct**: bound to its place (the Keeper is water on a stair), with one or two rules of its own that no SRD block has, a look that reads from across the room, more than one way in, and a monster a human can play. The Keeper took one night from his design to main because each step below was walked in order and nothing was tuned to a bench nobody plays. Repeat the order; shorten nothing before step 7.

## 1. His design, in his words, before any spec

The fight starts as his paragraph, pasted verbatim at the top of a handoff (`handoff-<date>-<fight>.md`, `room:` line and a probed room block as the law says). The Keeper's: *"Pull them under as bonus action each round - it's a wave that goes over all 4 squares toward the player (save vs prone) that bounces off the front wall and sweeps any prone player toward the deep part of the pool. Anyone washed all the way deep gets restrained and double harsh suffocation rules ..."*. The seat reads it twice and writes **its hesitations as a numbered list** (seven for the Keeper: what the wave replaces, drowning's dice, which squares are the deep, the wall's HP, the free stand-up, the icing, the bench). He answers in a line each; his answers go in verbatim under his paragraph. Where a number is still open the spec says **(seat)** and the number it chose; the handoff ends with the open numbers as a list (five for the Keeper). Nothing below this section is his; everything in it is.

A rule that breaks the SRD is **named as signature in the handoff and in `invented.json`** (the Keeper's drowning, *"ours, not the SRD's"*; fire destroying the wall, *"probably not SRD compliant - signature"*). The SRD stays the finish line for everything else in the fight (concentration DC, the Whelm save, the elemental's numbers where they fit).

## 2. Accurate bench as build order

His rule, in those words (answer 7). Before the monster has its art, a probe exists: `dev/<fight>-probe.py` (`keeper-probe.py`, 178 checks at the end) with the **counterplay built beside the monster** (the party can hit the water, freeze it, break the hold, get out) and a few seeded fights a level (30 a level, seeds `(f+1)*7919+L`) in a table: won, rounds, downs, the fight's own counts (waves, floods, wall springs). The probe is the thing a cloud seat can run alone (Playwright's Chromium at `/opt/pw-browsers/chromium`, `DEEP16_BROWSER` and `--no-sandbox`), and the first table is **a proposal, his to veto** (the Keeper's HP went 58 to 100 to 175 to 160 across the day on tables and his hands).

Two warnings the Keeper paid for: a bench party that **idles until hit** is a different fight from the one he plays (*"The AI doesn't do anything with the players until I hit them - if the benches are doing that they'll be wrong"*), so the probe needs a party that fights, and a scripted AI for the monster (`ai=lure`, `ai=swirl`) so a tactic can be benched before it is the default; and the probe's own log in Downloads can pass for his record (read a record's `settings:` header and its path before drawing a finding from it).

## 3. The looks, one scene at a time

Every move the fight has is drawn once in a gallery before it is tuned: `deep16/?fxgallery&<fight>` (`&scene=slam|wave|pour|wall|fire|strike|ice|swirlfreeze|oa|freeze`, `&auto`, `&dark`, `&footprint`). The art comes by the monster pipelines (`deep16/blender-monsters.md`, or a Grok sheet sliced frame by frame so any pose from any sheet can be picked by hand: `keeper_p2`, `_p3`). He picks poses from the gallery, not from a fight. A monster that cannot be seen (the Keeper in dark water) is a fight nobody can play: it became **visible and glowing** on his word, and that is a rule of the fight, not a look.

## 4. The build: a cloud seat on a branch, the desk on the gate

The cloud seat builds on `claude/<fight>` (its files: `deep16/js/<fight>.js` for the rules, `<fight>play.js` for the human's menus, `<fight>log.js` for the record; the foe in `data/foes.js`, the map's own fields in `data/maps.js`, the hooks in `ai.js`, `battle.js`, `walls.js`), benches in its Chromium, writes `deep16-<fight>-notes.md` as it goes (every round of his a dated section: what he said, what changed, the tables), and never touches `main`. The desk merges each round into a **scratch worktree**, rebuilds (`tools/deep16-build.py`; `index.html`'s hash line conflicts on every merge, and the wrong side drops a script tag -- compare the script-tag sets before resolving), runs `python dev/check.py` and the probes **on Edge**, shows the pane, and holds the push. `cloud-jobs.md` carries the job; the cloud-seat protocol is in the oversight window's brief.

## 5. The playtest doors, before the first playtest

A fight is not ready to be played until it can be reached three ways by URL, each with a `settings:` header in its log:

- **play the party:** `?<fight>fight` (`&lvl=`, the fight's own knobs: `&wall=`, `&hp=`, `&deep=`, `&lit`);
- **play the monster:** `?<fight>fight&play=<monster>` -- the monster's own ring with only what applies on it (MOVE, SLAM, WAVE, POUR, WALL, SWIRL), so he can be the Keeper against the AI party and feel what it should want;
- **watch:** `?<fight>fight&watch&seed=N` -- the AI both sides, a seeded fight that replays roll for roll in the probe's harness, so a fight he saw can be rerun drained.

Plus a scripted party surface (`D16.keeperPlay`, one call a turn from the console) for a bench or a seat to play the party's turns by hand, and the **combat log** with a download (`<fight>log.js`): the record he hands back is the one source of a finding. His records go in `play-records/`; a `settings:` header that lacks the day's defaults means the pane is on an older build.

## 6. The playtest loop: his hands change the rules

He plays. Each batch of records (the Keeper's came in fives; about forty in all) yields findings, and findings yield **rules, not numbers**: the Ice Wall got a three-round thaw because Vivian was trapped behind it in a stalemate; the swirl became worth two Slams because the Keeper never chose it; the lure became the default AI because the party would not come to the water; the party's retreat after the first hold breaks because his party stood in it. Each ruling goes into the notes as a dated section with his words verbatim, into `invented.json` as a line, and into the probe as a check **the same round**. A rule he approves by inference (the script's auto-swirl) is written down as approved the day he says so, or it is missed (*"There was an inferred approval it missed"*).

What the desk must do between batches: read the record's header and path; rerun the probe at the new defaults (the tables per level, per AI, with `retreat=0` beside); show him the pane with the new build (`?fresh=N` beats the cache); and keep the ladder off this fight.

## 7. The levers, named

A signature fight has a short list of levers, each with a table: **HP** (175 to 160), **the big hit's dice** (Slam 3d4, doubled), **the signature's dice** (drowning 1d8+1 less CON, floored at 1), **the monster's AI** (current, swirl, lure), **the party's counterplay** (the retreat, the ready on the ledge), **the place's clock** (the wall's three rounds, the deep's two steps). Tune one at a time, same seeds, and update the tables in the notes. A lever he has not pulled is the seat's call and is written as unruled (`retreatRounds` 3; the Ready hook only on the Wave's push).

## 8. The seams: the story's doors and the ladder's

A signature fight is the story's. **The ladder keeps the old fight** (`keeper-ladder` on `keeperold`, `floodstair-old`, pinned to a commit) because the ladders are not for it (his word) and a levelling simulator must not change under a player. The 8-bit gets its **ways in**, each a scene with its own words: WADE IN from the ledge, PUT A HAND ON IT at the rune; the quest path that avoids the fight still passes (the rope). The 8-bit's own text for each way in (`w.stairSee`, `w.markWake`) is matched to its spawn before the ship, or it is on the queue (it is).

## 9. Ship on his word

A last playtest on the final defaults, `python dev/check.py` GREEN and both probes passing on Edge, the branch merged by the desk, Pages deployed, and his word. The notes' last section is **For the next seat** (the gotchas, who said what, what to rerun); the handoff is marked SPENT and moved; the daily and the bolt entry are the desk's. The testing doors stay live on Pages (`?keeperfight`, `&play=keeper`): they are how the next tune starts.

## The ills, so the next one skips them

- Dividing the work by a room nobody probed (the benches were "desktop-only" until the cloud seat found its Chromium).
- Tuning to a bench of an idle party.
- Reading a probe's record as his.
- Resolving the `index.html` hash conflict by taking a side without comparing the script tags.
- Shipping without seeing the 8-bit's ways in and the ladder's screen by eye (still on the queue for the Keeper).
- A rule approved by inference and not written the same day.

## The next one

Pick the fight by the pull rule (the story's next boss that wants a rule of its own), write his paragraph at the top of its handoff, number the hesitations, and start the probe before the art. One cloud seat builds; the desk gates; he plays; the notes carry his words; the ladder keeps the old fight. This file is the brief's first citation.
