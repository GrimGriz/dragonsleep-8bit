---
name: spin-up
description: Put DRAGONSLEEP or DEEP16 in front of Griz (or a seat's own eyes) in a browser -- main or a cloud seat's branch. Use when he says "spin it up", "run it in the browser", "show me", "let me play it", or when nobody has played or seen a change in a browser yet. Covers the desk's pane, a cloud branch in a worktree, the doors (URLs), a human-played foe, and what a cloud seat says instead.
---

# Spin it up

Griz, 10-03: *"'spin it up in the browser' should be a thing pointed to in the 8bit claude.md I think"*. Built by the desk 10-03 from the review seat's spec (`cloud-notes/dev-review-notes.md`, "the spin-up handoff").

## On the desk (a seat with the Browser pane)

The pane reads `.claude/launch.json` **from the folder the session was opened in** (probed 10-03): a seat opened at `C:\Users\grimg` uses `C:\Users\grimg\.claude\launch.json` (absolute `--directory` paths); a seat opened in `dragonsleep-8bit` uses the repo's `.claude/launch.json`. Both carry the same names:

| name | port | serves |
|---|---|---|
| `dragonsleep` | 8923 | the checkout (main, as it stands on disk) |
| `dragonsleep-2` | 8924 | the same, when another chat holds 8923 |
| `dragonsleep-3` / `dragonsleep-keeper` | 8925 | repo file: the checkout; home file: the Keeper's `scratch-merge` worktree |
| `dragonsleep-branch` | 8926 | `.claude/worktrees/branch` -- whatever branch you put there |
| `dragonsleep-3` (home file only) | 8927 | the checkout, when other chats hold 8923 and 8924 (added 10-04, the climbing seat: the troll window held both) |
| `dragonsleep-4` (home file only) | 8928 | the checkout, when other chats hold all three (added 10-04 night, the huge-maps seat: three windows held 8923, 8924 and 8927) |
| `dragonsleep-5` (home file only) | 8929 | the checkout, when other chats hold all four (added 10-05, the spout seat) |

**Main:** `preview_start {name: "dragonsleep"}` (or `-2`, or the home file's `-3`), then `navigate` to the door. The checkout is shared: it shows every seat's uncommitted edits too.

**Music off, every time** (Griz, 10-04: *"I'd like to add y'all turn the music off for me in those"*): once the page has loaded, in `javascript_tool` --
`DS.audio.musicVol = 0; DS.audio.setVolumes(); DS.audio.savePrefs();` -- the 8-bit synth's own volume (`ds8-audio` in that origin's storage, the effects left as they were). It is kept per port, so a new port needs it again; DEEP16 and the 8-bit game share it.

**A cloud seat's branch** (never build or commit in this worktree; it is for looking):

```
git fetch origin <branch>
git worktree add --detach .claude/worktrees/branch origin/<branch>        # the first time
git -C .claude/worktrees/branch checkout --detach origin/<branch>        # after that: re-point it
```

then `preview_start {name: "dragonsleep-branch"}`. **Check it is the branch, not main**, before you show him anything: compare a changed file's stamp, e.g. `grep -o 'js/battle.js?v=[^"]*' .claude/worktrees/branch/deep16/index.html` against what the pane fetches (`fetch('/deep16/index.html?fresh=1')` in `javascript_tool`), or fetch a file only one side has. (10-03: the branch read `da673c4dd2`, main `06a1740b7a`; a file only on main came back 404.)

**The doors:** `URLS.md` has every one (`?at=<situation>`, `?lvl3`, `deep16/?ladder`, `?pocket`, `?npc=...`, `?show=<creature>`, **`deep16/?gallery`** -- the one gallery since 10-08: spells, features, the Mascots and every creature's rows as four shelves on one key map, N to the next thing waiting on his eye, V to mark it; `?fxgallery`, `?mpgallery` and `?rows=<creature>` open their shelf). Also `deep16/?keeperfight&play=keeper|party`, `&watch&seed=N`, `&log`. **Add `&fresh=N`** (any new N) every time: the pane's browser caches `index.html` and serves the old scripts.

**A foe played by a human:** `deep16/play-as-foe.md` (the Keeper's mode, as a recipe).

**When the pane misbehaves:**
- A screenshot that times out usually means Griz is clicking in the pane. Read it with `read_page` / `javascript_tool` instead; don't retry the screenshot.
- A hidden pane or a background tab runs no frames: step `D16.update(); D16.draw()` by hand from `javascript_tool` (the 8-bit's object is `DS`), and set `D16.paused = true` to hold a frame for a screenshot.
- Two chats can't share a port: take the next name, don't kill another chat's server.

## In a cloud seat (no pane)

Say so in one line and hand him the desk's line, ready to paste:

> A cloud seat can't show you the game in a pane. On the desk: `git fetch origin <branch>; git worktree add --detach .claude/worktrees/branch origin/<branch>` (or re-point it), then spin up `dragonsleep-branch` and open `http://localhost:8926/<door>&fresh=1`.

**For the seat's own eyes** (not his): serve with `python3 -m http.server <port> --bind 127.0.0.1` in the background, then

```
NODE_PATH=/opt/node22/lib/node_modules node .claude/skills/spin-up/eyes.js "<path?query>" out.png <seconds> <port>
```

`eyes.js` (beside this file) launches `/opt/pw-browsers/chromium --no-sandbox`, prints every `pageerror` and console error, waits, and screenshots. Read the PNG yourself; send it to him only if he should see it. Tested 10-03 by the review seat: `deep16/index.html?keeperfight&lvl=3&watch&seed=31679` loaded with one 404 (likely the favicon) and no page error; `index.html` loaded clean. Chromium's own `--screenshot` / `--dump-dom` never advances the game loop; a Playwright page does, but a probe that must click has to click (the signature-fight recipe's rule).

**The gate in a cloud seat:** until the five probes take `bench16.EXTRA`, run it with `DEEP16_BROWSER` pointed at a wrapper -- `printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' > chrome-ns; chmod +x chrome-ns` -- or they print `no result` and the gate reads ok.

## After a merge

The live link is the spun-up one: **https://grimgriz.github.io/dragonsleep-8bit/** + the door. Pages redeploys from `main` a minute or two after the push; add `&fresh=N` there too.

## A story fight watched in the pane (10-05, the Skylights case study)

The `?fight=<id>` door has no `&watch`; the class AI takes the four only on the bench. To watch a story fight play itself in the pane -- a bench seed replayed, line for line (the FX draw on `Math.random`, the fight on `D16.rand`): load the door with a fresh `&fresh=N`, then in `javascript_tool`

```
D16.pop(); D16.seed = 7919 + i * 104729;   // the bench's fight i of seed 1 (dev/bench16.js)
var B = new D16.Battle({ ladder: true, fight: 'edifice', level: 6, record: { fight: 'edifice', name: 'The Skylights (watched: the class AI, seed N)', level: 6 } });
var e0 = B.enter; B.enter = function () { var r = e0.apply(this, arguments); this.units.concat(this.arriving ? this.arriving.ours : []).forEach(function (u) { if (u.side === 'party' && !u.ally && !u.object) { u.guest = true; u.classAI = true; } }); return r; };
D16.push(B);
```

The four are marked at `enter` (before the walk-in holds them offstage), as the bench marks them. Poll `D16.battle.log` as it runs; at the end `D16.rec.finish(D16.battle, D16.battle.result)` writes the record, since an AI-played fight takes no steps and the per-round checkpoint writes only after a step. Name the record `watched` so his own plays stay his. A background tab runs no frames: step `D16.update()` by hand there, and `tabs_create` gives the seat a tab of its own while he plays in his.
