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

**Main:** `preview_start {name: "dragonsleep"}` (or `-2`), then `navigate` to the door. The checkout is shared: it shows every seat's uncommitted edits too.

**A cloud seat's branch** (never build or commit in this worktree; it is for looking):

```
git fetch origin <branch>
git worktree add --detach .claude/worktrees/branch origin/<branch>        # the first time
git -C .claude/worktrees/branch checkout --detach origin/<branch>        # after that: re-point it
```

then `preview_start {name: "dragonsleep-branch"}`. **Check it is the branch, not main**, before you show him anything: compare a changed file's stamp, e.g. `grep -o 'js/battle.js?v=[^"]*' .claude/worktrees/branch/deep16/index.html` against what the pane fetches (`fetch('/deep16/index.html?fresh=1')` in `javascript_tool`), or fetch a file only one side has. (10-03: the branch read `da673c4dd2`, main `06a1740b7a`; a file only on main came back 404.)

**The doors:** `URLS.md` has every one (`?at=<situation>`, `?lvl3`, `deep16/?ladder`, `?pocket`, `?npc=...`, `?show=<creature>`, `?fxgallery`). Also `deep16/?keeperfight&play=keeper|party`, `&watch&seed=N`, `&log`. **Add `&fresh=N`** (any new N) every time: the pane's browser caches `index.html` and serves the old scripts.

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
