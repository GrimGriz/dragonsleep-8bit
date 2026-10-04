---
room: a seat with PowerShell 5.1 and headless Edge (Windows 11), cwd `C:\Users\grimg\they live\dragonsleep-8bit`; Python 3.12, no node. Probed 2026-10-04 (the stealth session). A cloud seat sets `DEEP16_BROWSER` / `DEEP16_BROWSER_ARGS` as in the CLAUDE.md's bench paragraph.
written: 2026-10-04, the stealth session (Griz: "run the show on suspicious bench specimens -- a recipe please")
---

# Trace a suspicious bench cell

When the class matrix (`dev/bench_matrix.py`) prints a number that looks wrong -- a band's average of 3250 rounds, a win rate that jumped from 8% to 70% -- do not guess from the table. Pick one fight out of that cell and read it. The cell is thousands of fights; one of them is usually the whole story.

## 1. Find the specimens (the seeds)

A band cell's fights are seeded `5000 + classIndex*131 + k*7919` for k = 0..n-1 (classIndex counts `barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, warlock, wizard` from 0). `mode=bandtrace` without a seed runs them all and lists each seed's round and result:

```powershell
python -c "import sys; sys.path.insert(0,'dev'); import bench16; r=bench16.run({'mode':'bandtrace','lvl':'2','cls':'rogue','rounds':'40','n':'10'}, timeout=900); print(r.get('rows') or r)"
```

A row like `29805 round 41 none` is the specimen: past the cap (`rounds`), no result. A `lost`/`won` at a high round is a slow one worth the same look.

## 2. Trace one (the first 30 rounds)

Same call with `seed=` -- it returns the whole log to the cap and where each unit stands (square, facing, HP, hidden and the held Stealth total, Perception):

```powershell
python -c "import sys; sys.path.insert(0,'dev'); import bench16; r=bench16.run({'mode':'bandtrace','lvl':'2','cls':'rogue','rounds':'30','seed':'29805'}, timeout=900); open(r'<scratchpad>\stall.txt','w',encoding='utf-8').write('\n'.join(r['units'])+'\n----\n'+'\n'.join(r['log']))"
```

Write it to a file and read it with `Read` or `grep -n "^R"`: the log is a few hundred lines.

## 3. Read it

- **Units first.** Who is alive on each side, who is hidden, where. A stall is usually two or three units left.
- **Then the last round, repeated.** If rounds N, N+1, N+2 are the same lines, that is the loop. Name it by the lines (`Barley dashes / Rogue 2 disengages / Rogue 2 dashes: +30 ft` is a kite chased by a dasher).
- **Then rounds 1-3 for how it began** (who hid, who was found, the first Search).
- Cards say why: a found line carries the numbers (`Stealth 24 against Vivian's passive Perception 16 +11 (front) = 27`).

## 4. Fix, then re-aim at the same cell

Edit, then `python dev/check.py` (GREEN before a push), then step 1 again -- the seeds do not change, so the same cell shows whether the loop is gone. Expect another seed to stall behind the first (10-04: 29805 ended, 45643 began to): check the whole list, not the one you fixed.

## 5. Seeing it in the pane (the "show me")

`deep16/?npc=rogue:2,rogue:2,rogue:2,rogue:2&lvl=2&watch` runs the same kind of fight on screen (`watch` hands his side to the class AI). It is not seeded, so it will not reproduce a specimen; use it to see what the setup looks like. Serve with `preview_start dragonsleep-2` (see `.claude/skills/spin-up/SKILL.md`); a background tab runs no frames -- step `D16.update()` / `D16.draw()` by hand.

## Limits

- **A duel cell** works the same way: add `vs=<class>` (`'cls':'rogue','vs':'sorcerer'` is the rogue as the party against the sorcerer as the foe; the matrix runs each pair once, with the earlier class in the list as `cls`). The seeds are `1000 + i*97 + j*13 + k*7919` (i, j the two classes' places in the list), 10-04. A rogue-vs-sorcerer specimen: seed 1893, a loss in three rounds.
- `cls=` on `mode=matrix` runs one class's duels and band only (`dev/bench16.js`): the rerun of a broken row without the whole table.
- Do not let `bench_matrix.py` overwrite `deep16-class-bench.md` while chasing a number: copy the file out first (10-04 it was overwritten with a mid-change run).
