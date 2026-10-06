# Playing a foe on DEEP16 (the Keeper's mode, as a recipe)

How `?keeperfight&play=keeper` lets a human play the Keeper against the class-AI party, written so a seat can build the same for another set-piece foe. The code is `js/keeperplay.js` (the hands) and `js/keeper.js` (the rules and the AI's turn); `js/keeperlog.js` is the combat log; the probe is `dev/keeper-probe.py` (+ `.js`). Built by a cloud seat on 10-03 from Griz's asks; this page is the desk's reading of it.

## The recipe

1. **A mode flag, not a new engine.** The URL sets `B.o.play`; one predicate says when the human is in charge: `human(B, u)` is true for the foe's kind and side in that mode. Everything else keeps the AI.
2. **The foe's turn is the game's own ring** (the Q wheel the heroes' turns use), not a prompt window. Wrap `D.Battle.prototype.commands`: when `human(B, u)`, return the foe's entries. Each entry is `{ id, label, cost: 'A'|'B'|'M'|'F', ok, why, note, icon }`; `ok: false` greys it and shows `why`, so an illegal choice explains itself and spends nothing. Add MOVE (the ring's own: click a square) and END TURN. Offer only what applies (no Suffocate with no one held, no Break Free unless frozen).
3. **The turn loop replaces the AI's turn for that unit:** `function* humanTurn(B, u) { upkeep; while (!over) { cmd = yield { turn: u }; if (!cmd || cmd.do === 'end') break; yield* B.exec(u, cmd); recheck state; } finish }`. The commands go through the same `B.exec` the keys use, so budgets, reactions and logs are one code path. Opportunity attacks stay automatic.
4. **Targets are gold squares** (a prompt's `pick`, as the Channel Divinities do). Give each choice a why-function (`moveWhy`, `slamWhy`, `swirlWhy`) that returns `''` if legal, else the reason for a card.
5. **A foe has no `u.weapon`.** The tooltip, the click-to-attack default, `canHit` and the opportunity previews read `u.weapon.ammo` / `.ranged` and crash (Griz's first click froze the page). Give the foe a weapon-shaped stand-in (`K.standIn`) when the fight enters, and make a default click on a hostile map to the foe's own best attack, spending exactly what the ring spends. `UI.valid` must read the multiattack budget, not only the action and the attack count, or the second attack of a multiattack is refused.
6. **A big body is a footprint.** Use `G.foot` in the move pick, show every square green (may stand) or red (may not), and refuse with a card that says why.
7. **A scripted party** (so a seat can play without a mouse): `D16.keeperPlay.state()` returns JSON (round, who is deciding, the units, the lane geometry, what is legal for the hero deciding); `act(plan)` / `actSync(plan)` play one turn through the same exec. `?keeperfight&play=party`.
8. **A combat log with a settings header** (`keeperlog.js`): every record names the build's settings, so a play record can be matched to the build that made it.
9. **The probe must click.** Driving the ring commands is not the click path. Put the real scene on the stack, step `D.update` and `D.draw` by hand with the cursor and the click set, and run: hover; click out of reach (a card, nothing spent); click in reach; click again ("action spent"); click the foe's own square (the ring opens); click empty; end turn. Assert no uncaught error and a live turn loop after each. With the fix removed it must fail.

## Gotchas

- A `//` put mid-line comments out the rest of the line (it silently killed three URL settings once).
- The probe's CFG leaks between fights: add every new key to its reset line.
- A probe hero is a human unless `guest` / `classAI` is set, so a readied strike waits on an aim prompt and looks like it never fired.
- The class-AI party idles until hit and is a poor model of a player: benches are regression checks, tune from play records.

## Serving it for a person to play (a desktop seat)

`.claude/launch.json` has three Python `http.server` entries (ports 8923 to 8925) that serve the folder the seat is working in. Use a worktree for the build you are testing and add `&fresh=N` to the URL to bust the pane's cache. The page needs no build step to run; rebuild with `python tools/deep16-build.py` after editing script files.
