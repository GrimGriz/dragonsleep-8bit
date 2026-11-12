"""DEEP16 pipeline 2 (generated art): Sólskaft's tiles and props -- the art desk's ART-134 to ART-138 (art-wanted sections 47 to 51, the ask
deep16/_src/art-desk/sent/ASK-2026-11-11-solskaft-tiles-and-props/), returned 2026-11-11 and sorted to deep16/_src/ART-<n>-SOLSKAFT/ (11-12, the Sólskaft cutter, on
Griz's "Think there's stuff for an opus cutter in Fresh").

    python -I tools/solskaft-sheet.py          (`check` also writes dev/visions/solskaft-check-<sheet>.png: every cell on the floor's grey, its anchor marked)

The cells came pre-cut, one PNG a cell, with each page's CELLS.json (crop, footprint, facing, anchor). Each is VERIFIED here before it goes on a sheet:
  - its PNG is the page's own pixels at the crop CELLS.json names (byte for byte in RGBA), and its size is the size it states;
  - its alpha is hard (0 or 255);
  - a wall module (a `wall_height_px`, or an anchor at a face's foot) is one square long: 32 px across, its foot rising 1 px per 2 across (the diamond's edge), its
    opaque height the wall's plus the 16 px of the run's slope, within a few px (a module with a lamp or a cap may stand a little proud);
  - a floor cell is the 64 x 32 diamond.
Then snapped to the game's 64 colours (tools/pixelate.py snap -- the cells use the packet's palette already, so this changes nothing on a cell that keeps to it, and
the count of pixels it moved is printed a page).

THE ANCHOR, one convention on every sheet (as js/innprops.js reads its atlas): a prop's anchor is the TOP (back) vertex of its footprint's first square on the ground;
a wall module's is its face's foot at its run-start (the left end of an `_x` face, the right end of a `_y` one) -- the art desk's own for walls. ART-134 drew its
floors and props by their footprint's CENTRE; those are moved to the top vertex here: top = centre - ((a - b) * 16, (a + b) * 8) for a footprint a x b.

Sheets (deep16/art/): skstone_p1 (ART-134, the stone: floors, walls one and two storeys, doors, the court and the temples; page 06, the temple pillar and its stub,
came 11-12 by its own top-vertex anchor -- sorted to _src/ART-134-SOLSKAFT/PAGE-06-TEMPLE-PILLAR/ by the ART-139 cutter), skstreet_p1 (ART-135: the ramps and
stairs, the tollhouse and the stable, the crown stretch), skcart_p1 (ART-136: the road and the drum, the works, the hand-cart and the gate), skfun_p1 (ART-137: the
niche walls, the name wall, the chamber, the chapel and the seals), sklodge_p1 (ART-138: Ásdís Scalebeam's room). Each tile's name is the cell's id in lower case,
'-' to '_'; its foot, facing, wall height and the page are in the sheet's `cells`.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
IP = _load('innprops', os.path.join(ROOT, 'tools', 'innprops-sheet.py'))
pix = IP.pix
# (deep16/_src is not in git and every worktree shares the main checkout's: read it there)
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROOT))) if '.claude' in ROOT.split(os.sep) else ROOT, 'deep16', '_src')
if not os.path.isdir(os.path.join(SRC, 'ART-134-SOLSKAFT')): SRC = pix.SRC
SHEETS = [('skstone_p1', 'ART-134-SOLSKAFT'), ('skstreet_p1', 'ART-135-SOLSKAFT'), ('skcart_p1', 'ART-136-SOLSKAFT'), ('skfun_p1', 'ART-137-SOLSKAFT'),
          ('sklodge_p1', 'ART-138-SOLSKAFT'), ('skassay_p1', 'ART-140-SOLSKAFT')]   # (ART-140, the assay house's props, art-wanted 53: one page, unpacked flat -- 11-12, the Solskaft seat of the reset)
HW, HH = 32, 16


def tname(cid):
    return cid.lower().replace('-', '_')


def is_wall(c):
    """a wall module (its anchor the face's foot at its run-start): its facing names the face the camera sees, or it is a turn of the drum -- not page 5 of
    ART-134, whose oathstone and throne say "face lower-left" for the side they show but are props on their footprint's centre"""
    f = (c.get('facing') or '').lower()
    if c.get('_art') == 'ART-140-SOLSKAFT': return c.get('wall_height_px') is not None   # (its floor props name a facing too -- "along y / face lower-right" -- and stand by their top vertex)
    if c.get('_art') == 'ART-134-SOLSKAFT' and c.get('_page', '').startswith('PAGE-05') and c.get('wall_height_px') is None: return False
    return 'face lower' in f or 'turn-' in f or c.get('wall_height_px') is not None


def foot_check(c, img):
    """a full wall module stands one square along its axis from its anchor: opaque px at its foot at both ends of the run (the run-start, and 32 across and 16
    down from it -- right for an _x face, left for a _y), within 4 px above the foot -> [] or what failed"""
    a = img[..., 3] > 0; h, w = a.shape
    ax, ay = c['ground_anchor_px']; ys = '-Y' in c['id'] or c['id'].endswith('Y') or '-Y-' in c['id']
    ends = [(ax + (-2 if ys else 1), ay), (ax + (-31 if ys else 30), ay + 15)]
    bad = []
    for ex, ey in ends:
        ex = min(max(ex, 0), w - 1)
        if not any(0 <= ey - k < h and a[ey - k, ex] for k in range(0, 6)): bad.append('no foot at (%d,%d)' % (ex, ey))
    return bad


def verify(page_img, c, img, notes):
    """every check on one cell -> a list of what failed (empty: VERIFIED)"""
    bad = []
    w, h = c['size_px']
    if img.shape[1] != w or img.shape[0] != h: bad.append('size %dx%d, CELLS.json says %dx%d' % (img.shape[1], img.shape[0], w, h))
    x, y, cw, ch = c['sheet_crop_xywh']
    crop = page_img[y:y + ch, x:x + cw]
    if crop.shape != img.shape or not np.array_equal(crop, img): bad.append('not the page\'s pixels at its crop')
    a = img[..., 3]
    if ((a > 0) & (a < 255)).any(): bad.append('soft alpha (%d px)' % int(((a > 0) & (a < 255)).sum()))
    if (c.get('size_px') == [64, 32]) and c.get('footprint') == [1, 1] and not is_wall(c):
        # (the diamond: every opaque pixel inside it)
        ys, xs = np.mgrid[0:32, 0:64]
        inside = np.abs(xs + 0.5 - 32) / 32.0 + np.abs(ys + 0.5 - 16) / 16.0 <= 1.0 + 1e-6
        out = int(((a > 0) & ~inside).sum())
        if out > 4: bad.append('%d px outside the diamond' % out)
    return bad


def wall_measure(c, img):
    """a wall module's measure: its width, its foot's slope (the lowest opaque px at its two ends), its opaque height"""
    a = img[..., 3] > 0
    cols = [np.where(a[:, x])[0] for x in range(img.shape[1])]
    have = [x for x in range(img.shape[1]) if len(cols[x])]
    if not have: return None
    x0, x1 = have[0], have[-1]
    foot0, foot1 = int(cols[x0].max()), int(cols[x1].max())
    top = min(int(cols[x].min()) for x in have)
    return {'w': x1 - x0 + 1, 'slope': (foot1 - foot0) / float(max(1, x1 - x0)), 'h': max(foot0, foot1) - top + 1}


def anchor(c):
    """the cell's anchor in the one convention: a prop's top vertex of its footprint, a wall's foot at its run-start"""
    ax, ay = c['ground_anchor_px']
    if is_wall(c): return ax, ay
    note = (c.get('notes') or '').lower()
    fa, fb = (c.get('footprint') or [1, 1])[:2]
    if c['_art'] == 'ART-134-SOLSKAFT' and not is_wall(c) and not (c.get('anchor_kind') or '').startswith('top vertex'):   # (ART-134 drew its floors and props by the footprint's centre; page 06, the temple pillar, came by the top vertex already -- its CELLS.json `anchor_kind`)
        return ax - (fa - fb) * HW // 2, ay - (fa + fb) * HH // 2
    return ax, ay


def main():
    report = []
    total = {'cells': 0, 'verified': 0, 'snapped_px': 0}
    for sheet_name, art in SHEETS:
        items, cells_meta, art_dir = [], {}, os.path.join(SRC, art)
        pages = sorted(d for d in os.listdir(art_dir) if d.startswith('PAGE-')) or ['PAGE-01']   # (a one-page answer may come flat: CELLS.json at the folder's root)
        for pg in pages:
            pdir = os.path.join(art_dir, pg) if os.path.isdir(os.path.join(art_dir, pg)) else art_dir
            cl = json.load(open(os.path.join(pdir, 'CELLS.json'), encoding='utf-8'))
            sheetpng = sorted(f for f in os.listdir(pdir) if f.startswith(art[:7]) and f.endswith('.png') and 'REVIEW' not in f)
            page_img = np.array(Image.open(os.path.join(pdir, sheetpng[0])).convert('RGBA'))
            moved = 0; nver = 0; fails = []
            for c in cl:
                c['_art'] = art; c['_page'] = pg
                img = np.array(Image.open(os.path.join(pdir, c['file'])).convert('RGBA'))
                bad = verify(page_img, c, img, None)
                full = is_wall(c) and 'STUB' not in c['id'] and c['ground_anchor_px'][1] >= 100 and (c.get('footprint') or [1, 1])[0] == 1 and 'TURN' not in c['id']                     and 'ARCH' not in c['id'] and max((c.get('footprint') or [1, 1])[:2]) == 1  # (an arch's ends and a two-square door are open at one end by design)
                if full: bad += foot_check(c, img)
                meas = wall_measure(c, img) if full else None
                wh = c.get('wall_height_px') or (120 if full else None)
                if meas and wh and 'PLAIN' in c['id'] and not (wh + 8 <= meas['h'] <= wh + 30): bad.append('opaque height %d for a %d px wall' % (meas['h'], wh))
                if bad: fails.append('%s: %s' % (c['id'], '; '.join(bad)))
                else: nver += 1
                rgb = img[..., :3].astype(np.float32) / 255.0
                sn = pix.snap(rgb)
                solid = img[..., 3] >= 128
                out = np.zeros_like(img); out[solid, :3] = sn[solid]; out[solid, 3] = 255
                moved += int((solid & (out[..., :3] != img[..., :3]).any(-1)).sum())
                ax, ay = anchor(c)
                nm = tname(c['id'])
                if nm in cells_meta: nm = tname(pg.split('-')[1]) + '_' + nm
                items.append((nm, dict(g=out, ax=int(ax), ay=int(ay), foot=list((c.get('footprint') or [1, 1])[:2]))))
                cells_meta[nm] = {'page': pg, 'id': c['id'], 'foot': (c.get('footprint') or [1, 1])[:2], 'facing': c.get('facing'), 'wall': c.get('wall_height_px'),
                                  'geometry': c.get('geometry')}
            total['cells'] += len(cl); total['verified'] += nver; total['snapped_px'] += moved
            report.append('%s %s: %d cells, %d VERIFIED, %d px moved to the palette%s' % (art, pg, len(cl), nver, moved, ''.join('\n    FAIL ' + f for f in fails)))
        sheet, tiles = IP.pack(items, width=1024)
        Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, sheet_name + '.png'), optimize=True)
        meta = {'_note': 'Sólskaft\'s tiles and props (tools/solskaft-sheet.py, the art desk\'s %s, art-wanted sections 47-51, 2026-11-11): each cell a box x,y,w,h and its '
                         'anchor ax,ay -- a prop\'s the top vertex of its footprint on the ground, a wall module\'s its face\'s foot at its run-start; `cells` names each '
                         'tile\'s page, footprint, facing and wall height.' % art,
                'image': 'art/%s.png' % sheet_name, 'fw': 64, 'fh': 64, 'ax': 32, 'ay': 48, 'prop': True, 'anims': {}, 'tiles': tiles, 'cells': cells_meta,
                'source': 'generated by the art desk (2026-11-11, %s: deep16/_src/%s), cut by tools/solskaft-sheet.py' % (art, art)}
        with open(os.path.join(pix.ART, sheet_name + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(meta, fh, indent=1)
        report.append('  -> %s: %d x %d, %d tiles' % (sheet_name, sheet.shape[1], sheet.shape[0], len(tiles)))
        if 'check' in sys.argv[1:]: IP.check(items, 'solskaft-check-%s.png' % sheet_name)
    print('\n'.join(report))
    print('ALL: %(cells)d cells, %(verified)d VERIFIED, %(snapped_px)d px moved to the palette' % total)


if __name__ == '__main__':
    main()
