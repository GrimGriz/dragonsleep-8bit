"""LPC half of the DEEP16 sprite comparison.

Fetches individual layer PNGs + sheet/palette definitions from the Universal LPC Spritesheet Character
Generator repo (github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator, branch master,
raw.githubusercontent.com only -- never the whole repo), recolours them the way the generator does
(exact palette match, +-1 per channel, source palette -> target palette), stacks them by zPos, and writes
per-figure, per-animation sheets in LPC layout (frames left->right, rows up/left/down/right; hurt = 1 row).
The phase spider comes from the already-downloaded LPC_Spiders.zip (Redshrike), hue-shifted to violet.

Everything lives under deep16/_src/lpc/ (gitignored):
  layers/<path under spritesheets/>   cached layer PNGs (re-runs skip what is already there)
  defs/sheet_definitions/..., defs/palette_definitions/...   cached JSON definitions
  fetch-log.json                      every repo file fetched + its byte size (and known 404s)
  composed/<id>/{idle,walk,attack,hurt}.png + meta.json, composed/CREDITS.md, composed/_contact.png

Run: python tools/lpc-compose.py            (compose all six)
     python tools/lpc-compose.py barley drow (just those)
"""
import colorsys
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile

from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LPC = os.path.join(ROOT, 'deep16', '_src', 'lpc')
LAYERS = os.path.join(LPC, 'layers')
DEFS = os.path.join(LPC, 'defs')
OUT = os.path.join(LPC, 'composed')
FETCH_LOG = os.path.join(LPC, 'fetch-log.json')
SPIDER_ZIP = os.path.join(LPC, 'LPC_Spiders.zip')
REPO = 'LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator'
RAW = 'https://raw.githubusercontent.com/%s/master/' % REPO

F = 64                                   # standard LPC frame
DIRS = ['up', 'left', 'down', 'right']   # LPC row order
ANIM_DEFAULTS = ['spellcast', 'thrust', 'walk', 'slash', 'shoot', 'hurt', 'watering']  # generator's constants.ts
CUSTOM_ANIMS = {  # from the generator's sources/custom-animations.ts (the ones we use)
    'slash_oversize': {'frame': 192, 'base': 'slash'},
    'thrust_oversize': {'frame': 192, 'base': 'thrust'},
}
MATERIALS = ('body', 'hair', 'cloth', 'metal', 'wood', 'eye', 'all')


# ----------------------------------------------------------------------------------------------- fetching
class Fetcher:
    def __init__(self):
        self.log = {'files': {}, 'missing': []}
        if os.path.exists(FETCH_LOG):
            self.log = json.load(open(FETCH_LOG, encoding='utf-8'))
        self.new_bytes = 0
        self.new_files = 0

    @staticmethod
    def local(repo_path):
        if repo_path.startswith('spritesheets/'):
            return os.path.join(LAYERS, *repo_path[len('spritesheets/'):].split('/'))
        return os.path.join(DEFS, *repo_path.split('/'))

    def get(self, repo_path):
        """Local path of a repo file, downloading it once. None if the repo has no such file."""
        dst = self.local(repo_path)
        if os.path.exists(dst) and os.path.getsize(dst) > 0:
            self.log['files'].setdefault(repo_path, os.path.getsize(dst))
            return dst
        if repo_path in self.log['missing']:
            return None
        url = RAW + urllib.parse.quote(repo_path)
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                self.log['missing'].append(repo_path)
                return None
            raise
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'wb') as f:
            f.write(data)
        self.log['files'][repo_path] = len(data)
        self.new_bytes += len(data)
        self.new_files += 1
        print('  fetched %-90s %7d B' % (repo_path, len(data)))
        return dst

    def json(self, repo_path):
        p = self.get(repo_path)
        if not p:
            raise FileNotFoundError(repo_path)
        return json.load(open(p, encoding='utf-8'))

    def save(self):
        self.log['missing'] = sorted(set(self.log['missing']))
        self.log['total_bytes'] = sum(self.log['files'].values())
        with open(FETCH_LOG, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(self.log, f, indent=1, sort_keys=True)


FX = Fetcher()


# ----------------------------------------------------------------------------------------------- palettes
def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def material_meta(mat):
    return FX.json('palette_definitions/%s/meta_%s.json' % (mat, mat))


def palette_colors(material, key):
    """Colours for a recolor key in the generator's forms: 'color', 'version.color', 'material.version.color',
    'material.color' (see sources/state/palettes.ts parseRecolorKey)."""
    parts = key.split('.')
    color = parts[-1]
    version = parts[-2] if len(parts) >= 2 else None
    mat = parts[-3] if len(parts) >= 3 else None
    if mat is None and version in MATERIALS:
        mat, version = version, None
    mat = mat or material
    version = version or material_meta(mat)['default']
    pal = FX.json('palette_definitions/%s/%s_%s.json' % (mat, mat, version))
    if color not in pal:
        raise KeyError('no colour %r in %s.%s palette' % (color, mat, version))
    return pal[color]


def recolor(img, mappings):
    """Generator's CPU recolor: flatten (source,target) pairs; first source within +-1 per channel wins."""
    pairs = []
    for src, dst in mappings:
        for s, d in zip(src, dst):
            pairs.append((hex_rgb(s), hex_rgb(d)))
    if all(s == d for s, d in pairs):
        return img
    lut = {}
    for _, (r, g, b, a) in img.getcolors(1 << 20):
        if a == 0 or (r, g, b) in lut:
            continue
        for s, d in pairs:
            if abs(r - s[0]) <= 1 and abs(g - s[1]) <= 1 and abs(b - s[2]) <= 1:
                lut[(r, g, b)] = d
                break
    if not lut:
        return img
    out = img.copy()
    out.putdata([(lut[p[:3]] + (p[3],)) if p[3] and p[:3] in lut else p for p in img.getdata()])
    return out


# ----------------------------------------------------------------------------------------------- items
class Item:
    """One selection in the generator: a sheet definition + its colour choice (or fixed variant)."""

    def __init__(self, fig, def_path, color=None, variant=None, sub=None, idle_from=None, despeckle=0):
        self.fig = fig
        self.def_path = def_path
        self.d = FX.json('sheet_definitions/' + def_path)
        self.type_name = self.d.get('type_name')
        self.variant = variant
        self.anims = self.d.get('animations') or ANIM_DEFAULTS
        self.idle_from = idle_from          # e.g. ('walk', 0): synthesize idle from that frame if no idle sheet
        self.despeckle = despeckle          # drop detached specks of <= N px from that borrowed idle frame
        self.notes = []
        self.used_paths = set()
        # colour targets keyed by type_name
        targets = dict(sub or {})
        if color:
            targets[self.type_name] = color
        if self.d.get('match_body_color'):
            targets[self.type_name] = fig['skin']
        if 'eyes' not in targets:
            targets['eyes'] = fig.get('eyes', 'blue')
        self.mappings = []
        rc = self.d.get('recolors')
        specs = []
        if rc:
            if 'material' in rc:
                specs.append((self.type_name, rc))
            else:
                for k in sorted(rc):
                    specs.append((rc[k].get('type_name') or self.type_name, rc[k]))
        self.has_recolors = bool(specs)
        self.color_desc = {}
        for tname, spec in specs:
            mat = spec['material']
            meta = material_meta(mat)
            base = spec.get('base') or meta['base']
            src = spec.get('source') or palette_colors(mat, base)
            tgt_key = targets.get(tname)
            if not tgt_key:
                self.color_desc[tname] = '%s.%s (base, unchanged)' % (mat, base)
                continue  # stays in its base colours
            self.color_desc[tname] = '%s:%s' % (mat, tgt_key)
            self.mappings.append((src, palette_colors(mat, tgt_key)))
        if not self.has_recolors and not self.variant:
            raise ValueError('%s needs a variant (one of %s)' % (def_path, self.d.get('variants')))

    def label(self):
        bits = [self.def_path.rsplit('.', 1)[0]]
        if self.variant:
            bits.append('variant=' + self.variant)
        return ' '.join(bits)

    def layers(self):
        bt = self.fig['body']
        for n in range(1, 10):
            L = self.d.get('layer_%d' % n)
            if not L:
                break
            base = L.get(bt)
            if not base:
                note = '%s layer_%d has no %s sheets (skipped)' % (self.label(), n, bt)
                if note not in self.notes:
                    self.notes.append(note)
                continue
            yield n, L.get('zPos', 100), base, L.get('custom_animation')

    def _load(self, repo_path):
        p = FX.get(repo_path)
        if not p:
            return None
        self.used_paths.add(repo_path)
        img = Image.open(p).convert('RGBA')
        return recolor(img, self.mappings) if self.mappings else img

    def std_sheet(self, anim, base):
        """The layer's sheet for a standard animation (or None)."""
        if anim not in self.anims:
            return None
        if self.has_recolors:
            path = 'spritesheets/%s%s.png' % (base, anim)
        else:
            path = 'spritesheets/%s%s/%s.png' % (base, anim, self.variant.replace(' ', '_'))
        return self._load(path)

    def custom_sheet(self, base):
        v = (self.variant or '').replace(' ', '_')
        return self._load('spritesheets/%s%s.png' % (base, v))


# ----------------------------------------------------------------------------------------------- composing
def despeckle(fr, maxpx):
    """Clear 8-connected opaque islands of <= maxpx pixels (returns the frame and how many pixels were cleared)."""
    a = fr.getchannel('A')
    seen, drop = set(), []
    for y in range(fr.height):
        for x in range(fr.width):
            if (x, y) in seen or not a.getpixel((x, y)):
                continue
            comp, stack = [], [(x, y)]
            seen.add((x, y))
            while stack:
                px, py = stack.pop()
                comp.append((px, py))
                for nx in (px - 1, px, px + 1):
                    for ny in (py - 1, py, py + 1):
                        if 0 <= nx < fr.width and 0 <= ny < fr.height and (nx, ny) not in seen and a.getpixel((nx, ny)):
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            if len(comp) <= maxpx:
                drop += comp
    if drop:
        fr = fr.copy()
        for p in drop:
            fr.putpixel(p, (0, 0, 0, 0))
    return fr, len(drop)


def frames_from(sheet, col, ncols, nrows, shifts=None, speck=0):
    """A sheet of ncols x nrows frames, each a copy of column `col` of the source row, nudged by shifts[(row, c)]."""
    out = Image.new('RGBA', (ncols * F, nrows * F))
    cleared = 0
    for r in range(nrows):
        fr = sheet.crop((col * F, r * F, col * F + F, r * F + F))
        if speck:
            fr, n = despeckle(fr, speck)
            cleared += n
        for c in range(ncols):
            dx, dy = (shifts or {}).get((r, c), (0, 0))
            cell = Image.new('RGBA', (F, F))
            cell.paste(fr, (dx, dy))
            out.paste(cell, (c * F, r * F))
    return out, cleared


_IDLE_SHIFTS = {}


def idle_shifts(body_item, src_anim='walk', src_col=0):
    """Where the hands sit in each idle frame relative to the walk frame a weapon borrows: best (dx, dy) that maps
    the body's walk frame onto its idle frame over the hands band (y 38..55). The generator ships no idle sheet for
    most weapons/shields, so their idle is that walk frame, nudged to follow the body (e.g. the up-facing idle sits
    1px lower than walk frame 0)."""
    key = (body_item.fig['body'], src_anim, src_col)
    if key in _IDLE_SHIFTS:
        return _IDLE_SHIFTS[key]
    base = next(b for n, z, b, c in body_item.layers() if not c)
    idle, walk = body_item.std_sheet('idle', base), body_item.std_sheet(src_anim, base)
    res = {}
    for r in range(idle.height // F):
        w = walk.crop((src_col * F, r * F, src_col * F + F, r * F + F))
        for c in range(idle.width // F):
            a = idle.crop((c * F, r * F + 38, c * F + F, r * F + 56))
            best = None
            for dy in (0, 1, -1, 2, -2):
                for dx in (0, 1, -1):
                    cell = Image.new('RGBA', (F, F))
                    cell.paste(w, (dx, dy))
                    diff = ImageChops.difference(a, cell.crop((0, 38, F, 56)))
                    n = sum(1 for p in diff.getdata() if p[3] or p[0] or p[1] or p[2])
                    if best is None or n < best[0]:
                        best = (n, dx, dy)
            res[(r, c)] = (best[1], best[2])
    _IDLE_SHIFTS[key] = res
    return res


def compose_std(fig, items, anim):
    """Stack every item's layer for a standard 64px animation in zPos order."""
    body = items[0]
    ref = None
    for n, z, base, custom in body.layers():
        ref = body.std_sheet(anim, base)
    if ref is None:
        raise RuntimeError('body has no %s sheet' % anim)
    W, H = ref.size
    ncols, nrows = W // F, H // F
    draws = []
    for i, it in enumerate(items):
        for n, z, base, custom in it.layers():
            if custom:
                continue
            sh = it.std_sheet(anim, base)
            if sh is None and anim == 'idle' and it.idle_from:
                src_anim, col = it.idle_from
                src = it.std_sheet(src_anim, base)
                if src is not None:
                    shifts = idle_shifts(body, src_anim, col)
                    sh, cleared = frames_from(src, col, ncols, nrows, shifts, it.despeckle)
                    moved = sorted('%s/f%d%+d,%+d' % (DIRS[r], c, dx, dy) for (r, c), (dx, dy) in shifts.items() if dx or dy)
                    note = '%s layer_%d: no idle sheet -> idle uses its %s frame %d (nudged to follow the body: %s)' % (
                        it.label(), n, src_anim, col, ', '.join(moved) or 'none')
                    if cleared:
                        note += ', with %d px of detached speck removed from that borrowed frame' % cleared
                    if note not in it.notes:
                        it.notes.append(note)
            if sh is None:
                if anim in ('idle', 'walk') or anim == fig['attack'][0]:
                    note = '%s layer_%d has no %s sheet (absent from that animation)' % (it.label(), n, anim)
                    if note not in it.notes and not (anim == 'idle' and it.idle_from):
                        it.notes.append(note)
                continue
            draws.append((z, i, n, sh))
    draws.sort(key=lambda t: (t[0], t[1], t[2]))
    out = Image.new('RGBA', (W, H))
    for z, i, n, sh in draws:
        if sh.size != (W, H):
            layer = Image.new('RGBA', (W, H))
            layer.paste(sh.crop((0, 0, min(W, sh.width), min(H, sh.height))), (0, 0))
            sh = layer
        out.alpha_composite(sh)
    return out, {'frames': ncols, 'rows': DIRS if nrows == 4 else ['down'] * nrows}, [(z, items[i].label(), n) for z, i, n, _ in draws]


def compose_custom(fig, items, cname):
    """An oversize attack (generator's custom_animation): weapon sheets are already on the big frame; every other
    layer's standard frames are centred in it, exactly like sources/canvas/draw-frames.ts."""
    spec = CUSTOM_ANIMS[cname]
    BF, base_anim = spec['frame'], spec['base']
    off = (BF - F) // 2
    body = items[0]
    ref = None
    for n, z, base, custom in body.layers():
        ref = body.std_sheet(base_anim, base)
    ncols, nrows = ref.width // F, ref.height // F
    W, H = ncols * BF, nrows * BF
    draws = []
    for i, it in enumerate(items):
        for n, z, base, custom in it.layers():
            if custom == cname:
                sh = it.custom_sheet(base)
                if sh is None:
                    it.notes.append('%s layer_%d: oversize sheet missing' % (it.label(), n))
                    continue
            elif custom:
                continue
            else:
                small = it.std_sheet(base_anim, base)
                if small is None:
                    continue
                sh = Image.new('RGBA', (W, H))
                for r in range(nrows):
                    for c in range(ncols):
                        sh.paste(small.crop((c * F, r * F, c * F + F, r * F + F)), (c * BF + off, r * BF + off))
            draws.append((z, i, n, sh))
    draws.sort(key=lambda t: (t[0], t[1], t[2]))
    out = Image.new('RGBA', (W, H))
    for z, i, n, sh in draws:
        if sh.size != (W, H):
            layer = Image.new('RGBA', (W, H))
            layer.paste(sh, (0, 0))
            sh = layer
        out.alpha_composite(sh)
    meta = {'frames': ncols, 'rows': DIRS, 'frame_w': BF, 'frame_h': BF, 'origin': [off, off],
            'source_anim': base_anim, 'generator_anim': cname}
    return out, meta, [(z, items[i].label(), n) for z, i, n, _ in draws]


def measure_foot(img, col, row, fw=F, fh=F):
    """Lowest opaque row in a frame, and the x centre of the opaque pixels on the bottom 2 opaque rows."""
    fr = img.crop((col * fw, row * fh, col * fw + fw, row * fh + fh))
    a = fr.getchannel('A')
    bbox = a.getbbox()
    if not bbox:
        return None
    y = bbox[3] - 1
    xs = [x for yy in (y - 1, y) for x in range(fw) if a.getpixel((x, yy)) > 0]
    return [int(round((min(xs) + max(xs)) / 2.0)), y]


def layer_desc(it):
    """'<sprite base path(s)> | <sheet definition> | <colours or variant>' for meta.json."""
    bases = []
    for n, z, b, c in it.layers():
        bases.append(b + ('  (%s, z%s)' % (c, z) if c else '  (z%s)' % z))
    col = ', '.join('%s=%s' % kv for kv in it.color_desc.items()) if it.color_desc else 'variant ' + it.variant
    return '%s | sheet_definitions/%s | %s' % (' + '.join(bases), it.def_path, col)


def build_figure(fid, fig):
    items = []
    for spec in fig['items']:
        spec = dict(spec)
        d = spec.pop('def')
        items.append(Item(fig, d, **spec))
    odir = os.path.join(OUT, fid)
    os.makedirs(odir, exist_ok=True)
    meta = {'frame_w': F, 'frame_h': F, 'anims': {}, 'foot': None, 'layers': [], 'notes': ''}
    stacks = {}
    # (a figure's `extra` animations ride along: the four heroes sit at the campfire -- Griz 09-28, the camp's backdrop)
    for anim, src in (('idle', 'idle'), ('walk', 'walk'), ('attack', fig['attack']), ('hurt', 'hurt')) + tuple((x, x) for x in fig.get('extra', [])):
        if isinstance(src, tuple):
            src_anim, custom = src
        else:
            src_anim, custom = src, None
        if custom:
            img, am, stack = compose_custom(fig, items, custom)
        else:
            img, am, stack = compose_std(fig, items, src_anim)
            if anim == 'attack':
                am['source_anim'] = src_anim
        if anim == 'hurt':
            am['rows'] = ['down']
        img.save(os.path.join(odir, anim + '.png'))
        meta['anims'][anim] = am
        stacks[anim] = stack
    # foot: body + footwear only (weapons can hang lower than the soles), down-facing idle frame 0
    ground = [it for it in items if it.def_path.startswith(('body/', 'feet/', 'legs/'))]
    gimg, _, _ = compose_std(fig, ground, 'idle')
    meta['foot'] = measure_foot(gimg, 0, 2)
    ov = meta['anims']['attack'].get('origin')
    if ov:
        meta['anims']['attack']['foot'] = [meta['foot'][0] + ov[0], meta['foot'][1] + ov[1]]
    meta['layers'] = [layer_desc(it) for it in items]
    meta['draw_order'] = {k: ['z%s %s L%d' % (z, lab, n) for z, lab, n in v] for k, v in stacks.items()}
    notes = list(fig.get('notes', []))
    for it in items:
        notes += it.notes
    meta['notes'] = '; '.join(notes)
    with open(os.path.join(odir, 'meta.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(meta, f, indent=1)
    print('%-12s foot=%s  %s' % (fid, meta['foot'], {k: (v['frames'], v.get('frame_w', F)) for k, v in meta['anims'].items()}))
    return items, meta


# ----------------------------------------------------------------------------------------------- spider
def build_spider(fid, fig):
    """Redshrike's LPC spider sheet: 640x320 = 10 cols x 5 rows of 64px.
    Rows 0-3 = up, left, down, right; row 4 = death (4 frames, facing down).
    Cols (per the OGA page): 1st = standing, 1st-4th = attacking, 5th-10th = walking."""
    z = zipfile.ZipFile(SPIDER_ZIP)
    src = Image.open(z.open('LPC_Spiders/%s.png' % fig['sheet'])).convert('RGBA')
    src = hue_to_violet(src, fig['hue'], fig.get('grey_tint'))
    odir = os.path.join(OUT, fid)
    os.makedirs(odir, exist_ok=True)

    def cut(cols, rows):
        out = Image.new('RGBA', (len(cols) * F, len(rows) * F))
        for ri, r in enumerate(rows):
            for ci, c in enumerate(cols):
                out.paste(src.crop((c * F, r * F, c * F + F, r * F + F)), (ci * F, ri * F))
        return out

    parts = {'idle': ([0], [0, 1, 2, 3]), 'walk': (list(range(4, 10)), [0, 1, 2, 3]),
             'attack': ([0, 1, 2, 3], [0, 1, 2, 3]), 'hurt': ([0, 1, 2, 3], [4])}
    meta = {'frame_w': F, 'frame_h': F, 'anims': {}, 'foot': None,
            'layers': ['LPC_Spiders.zip:LPC_Spiders/%s.png (Redshrike) hue-shifted to violet' % fig['sheet']],
            'notes': ''}
    for anim, (cols, rows) in parts.items():
        img = cut(cols, rows)
        img.save(os.path.join(odir, anim + '.png'))
        meta['anims'][anim] = {'frames': len(cols), 'rows': DIRS if len(rows) == 4 else ['down'],
                               'source_cols': cols, 'source_rows': rows}
    meta['foot'] = measure_foot(cut([0], [2]), 0, 0)
    meta['notes'] = '; '.join(fig['notes'])
    with open(os.path.join(odir, 'meta.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(meta, f, indent=1)
    print('%-12s foot=%s  %s' % (fid, meta['foot'], {k: v['frames'] for k, v in meta['anims'].items()}))
    return meta


def hue_to_violet(img, hue, grey_tint=None):
    """Set every chromatic colour's hue to `hue` (degrees), keeping its lightness (the shading ramp) and
    saturation; near-greys get a faint tint (grey_tint = (hue, sat)) so markings shimmer instead of staying neutral."""
    lut = {}
    for _, (r, g, b, a) in img.getcolors(1 << 20):
        if a == 0 or (r, g, b) in lut:
            continue
        h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
        if s < 0.08 or max(r, g, b) - min(r, g, b) < 6:
            if grey_tint:
                h, s = grey_tint[0] / 360.0, grey_tint[1]
        else:
            h = hue / 360.0
        rr, gg, bb = colorsys.hls_to_rgb(h, l, s)
        lut[(r, g, b)] = (int(round(rr * 255)), int(round(gg * 255)), int(round(bb * 255)))
    out = img.copy()
    out.putdata([(lut[p[:3]] + (p[3],)) if p[3] else p for p in img.getdata()])
    return out


# ----------------------------------------------------------------------------------------------- the six
IDLE_FROM_WALK = ('walk', 0)
FIGURES = {
    # skin/hair/cloth keys are the generator's palette keys: 'colour' (default version of that material, ulpc),
    # 'version.colour' (e.g. lpcr.tan) or 'material.version.colour' (e.g. all.lpcr.purple).
    'barley': {
        'extra': ['sit'],
        'body': 'male', 'skin': 'lpcr.tan', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'brown'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'leather'},
            {'def': 'torso/shirts/longsleeve/torso_clothes_longsleeve.json', 'color': 'all.lpcr.pearl'},
            {'def': 'hair/short/hair_messy1.json', 'color': 'lpcr.chestnut'},
            {'def': 'weapons/blunt/weapon_blunt_flail.json', 'variant': 'flail', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['shirt = longsleeve in all.lpcr.pearl (undyed-linen grey-beige)',
                  'attack = the flail\'s oversize slash (generator custom animation slash_oversize): 192px frames, '
                  'every 64px layer centred in them (origin [64,64]); the flail\'s walk/hurt layers are not drawn there, '
                  'exactly as in the generator'],
    },
    'aurdin': {
        'extra': ['sit'],
        'body': 'teen', 'skin': 'light', 'eyes': 'blue', 'attack': 'spellcast',
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/skirts/legs_skirts_plain.json', 'color': 'blue'},
            {'def': 'feet/shoes/feet_shoes_basic.json', 'color': 'brown'},
            {'def': 'torso/shirts/longsleeve/torso_clothes_longsleeve.json', 'color': 'blue'},
            {'def': 'torso/waist/belt_robe.json', 'variant': 'white', 'idle_from': IDLE_FROM_WALK},
            {'def': 'hair/short/hair_messy2.json', 'color': 'dark_brown'},
            {'def': 'weapons/magic/weapon_magic_simple.json', 'variant': 'simple', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['robe substitute: the generator\'s Robe (torso_clothes_robe) exists for the female body only and not '
                  'for teen, so the robe is built from a blue longsleeve (teen) + a blue ankle-length plain skirt '
                  '(teen) + the white rope Robe Belt; (tried: the female robe forced onto the teen body fits but its '
                  '"blue" is near-navy; blue kimono also works)',
                  'body = teen (the generator\'s youth body); head = human male (the generator maps teen to it)',
                  'attack = spellcast (7 frames), the simple staff\'s own spellcast sheets'],
    },
    # the wagon's children (09-27, Griz: "we need NPC goblin or children in that wagon"): Aurdin's own cached layers
    # (the teen body, the plain skirt as a smock, the longsleeve), in farm colours; scaled down to a child's height after
    'kid1': {
        'body': 'teen', 'skin': 'light', 'eyes': 'brown', 'attack': 'spellcast',
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/skirts/legs_skirts_plain.json', 'color': 'walnut'},
            {'def': 'feet/shoes/feet_shoes_basic.json', 'color': 'brown'},
            {'def': 'torso/shirts/longsleeve/torso_clothes_longsleeve.json', 'color': 'tan'},
            {'def': 'hair/short/hair_messy2.json', 'color': 'sandy'},
        ],
        'notes': ['a child from the wagon: Aurdin\'s layers only (nothing new fetched), smock = longsleeve + plain skirt'],
    },
    'kid2': {
        'body': 'teen', 'skin': 'olive', 'eyes': 'green', 'attack': 'spellcast',
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/skirts/legs_skirts_plain.json', 'color': 'brown'},
            {'def': 'feet/shoes/feet_shoes_basic.json', 'color': 'brown'},
            {'def': 'torso/shirts/longsleeve/torso_clothes_longsleeve.json', 'color': 'maroon'},
            {'def': 'hair/short/hair_messy2.json', 'color': 'redhead'},
        ],
        'notes': ['a child from the wagon: Aurdin\'s layers only (nothing new fetched), smock = longsleeve + plain skirt'],
    },
    'vivian': {
        'extra': ['sit'],
        'body': 'female', 'skin': 'light', 'eyes': 'green', 'attack': 'slash',
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_female.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'charcoal'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'leather'},
            {'def': 'torso/armour/torso_armour_leather.json', 'sub': {'leather_armor_belt': 'brass'}},
            {'def': 'hair/long/hair_long.json', 'color': 'dark_brown'},
            {'def': 'weapons/sword/weapon_sword_dagger.json', 'variant': 'dagger', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['leather armour kept in its native leather-brown; belt buckle recoloured brass',
                  'attack = slash (6 frames, 64px) with the dagger\'s own slash sheets'],
    },
    'lymen': {
        'extra': ['sit'],
        'body': 'male', 'skin': 'pale_green', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/fantasy/heads_orc_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'brown'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/torso_chainmail.json', 'color': 'steel'},
            {'def': 'hair/short/hair_messy2.json', 'color': 'black'},
            {'def': 'weapons/shields/shield_round.json', 'variant': 'brown', 'idle_from': IDLE_FROM_WALK},
            {'def': 'weapons/sword/weapon_sword_longsword.json', 'variant': 'longsword', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['half-orc = orc male head (tusks) + the whole body in the ulpc pale_green skin palette (lighter than '
                  'the orc head\'s native green, to read as half-blood)',
                  'attack = the longsword\'s oversize slash (slash_oversize): 192px frames, 64px layers centred at '
                  'origin [64,64]; the round shield\'s 64px slash frames ride along',
                  'the round shield has no hurt sheet in the generator, so it is absent from hurt.png'],
    },
    'drow': {
        'body': 'female', 'skin': 'all.lpcr.purple', 'eyes': 'red', 'attack': 'thrust',
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_female.json'},
            {'def': 'head/ears/head_ears_elven.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'black'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/armour/torso_armour_leather.json', 'color': 'charcoal', 'sub': {'leather_armor_belt': 'silver'}},
            {'def': 'hair/xlong/hair_xlong.json', 'color': 'white'},
            {'def': 'weapons/ranged/weapon_ranged_crossbow.json', 'variant': 'crossbow', 'idle_from': IDLE_FROM_WALK,
             'despeckle': 6},
        ],
        'notes': ['drow = female body, skin all.lpcr.purple (dark grey-violet), elven ears, white xlong hair, '
                  'charcoal leather armour + black pants/boots, red eyes',
                  'attack = thrust (8 frames): the generator\'s crossbow only animates walk/thrust/hurt (no shoot '
                  'sheet); thrust is its aim-and-fire pose'],
    },
    # ------------------------------------------------------------------------------------------ the 8-bit game's dwarves
    # (09-28, Griz: guest art by "LPC compose"): the guests who walk the king's road with the four in DEEP16's story fights,
    # and the cleric at Deepholm's door. Each is composed full-size here as <id>_full, then squashed to a dwarf's build by
    # tools/lpc-squash.py into <id> (shorter, a little broader), then pixelated as <id>_p0. Colours after js/sprites.js LOOKS.
    # Warhammers are drawn as the generator's mace (it has no warhammer); Brann's battleaxe is its war axe.
    'pyro_full': {  # Pyronimus, King of Solskaft: white hair and beard, dwarf-plate, a gold crown, the mace
        'body': 'male', 'skin': 'lpcr.tan', 'eyes': 'gray', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'charcoal'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/armour/torso_armour_plate.json', 'color': 'silver'},
            {'def': 'arms/arms_armour.json', 'color': 'silver'},
            {'def': 'hair/short/hair_messy1.json', 'color': 'white'},
            {'def': 'hair/beards/beards_winter.json', 'color': 'white'},
            {'def': 'headwear/hats/formal/hat_formal_crown.json', 'variant': 'crown_gold'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the king: dwarf-plate as the generator\'s plate (torso and arms) in silver, the gold crown, a white winter beard'],
    },
    'halldor_full': {  # Halldor Silversands, the garrison captain: iron-grey, splint (plate), the warhammer
        'body': 'male', 'skin': 'lpcr.tan', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'charcoal'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/armour/torso_armour_plate.json', 'color': 'iron'},
            {'def': 'arms/arms_armour.json', 'color': 'iron'},
            {'def': 'hair/short/hair_messy2.json', 'color': 'gray'},
            {'def': 'hair/beards/beards_beard.json', 'color': 'gray'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['splint as the generator\'s plate in iron; the warhammer as its mace'],
    },
    'trooper_full': {  # a garrison trooper: nasal helm, chainmail, a brown beard, the warhammer
        'body': 'male', 'skin': 'lpcr.tan', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'charcoal'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/torso_chainmail.json', 'color': 'steel'},
            {'def': 'hair/beards/beards_medium.json', 'color': 'chestnut'},
            {'def': 'headwear/helmets/helmets/hat_helmet_nasal.json', 'color': 'iron'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the 8-bit dtrooper look: a hat (the nasal helm), a beard'],
    },
    'brann_full': {  # Brann Silversands: a red beard, splint (plate), the battleaxe
        'body': 'male', 'skin': 'light', 'eyes': 'blue', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'brown'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'leather'},
            {'def': 'torso/armour/torso_armour_plate.json', 'color': 'steel'},
            {'def': 'arms/arms_armour.json', 'color': 'steel'},
            {'def': 'hair/short/hair_messy1.json', 'color': 'ginger'},
            {'def': 'hair/beards/beards_beard.json', 'color': 'ginger'},
            {'def': 'weapons/blunt/weapon_blunt_waraxe.json', 'variant': 'waraxe', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the battleaxe as the generator\'s war axe'],
    },
    'hedda_full': {  # Hedda Greyseam: long grey hair, chainmail, the warhammer
        'body': 'female', 'skin': 'lpcr.tan', 'eyes': 'gray', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_female.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'charcoal'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'black'},
            {'def': 'torso/torso_chainmail.json', 'color': 'steel'},
            {'def': 'hair/long/hair_long.json', 'color': 'gray'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the warhammer as the generator\'s mace'],
    },
    'ingrith_full': {  # Ingrith Scalebeam, a cleric of Rekknar: a grey robe over mail, dark hair, the mace
        'body': 'female', 'skin': 'light', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_female.json'},
            {'def': 'feet/shoes/feet_shoes_basic.json', 'color': 'brown'},
            {'def': 'torso/shirts/torso_clothes_robe.json', 'variant': 'white'},
            {'def': 'hair/long/hair_long.json', 'color': 'dark_brown'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the robe (the generator\'s, female body) in white (its light gray is near-black); her chainmail under it is not drawn'],
    },
    'torvald_full': {  # the cleric at Deepholm's door: a cleric's coat under a traveling cloak, a hood, a beard, the mace
        'body': 'male', 'skin': 'lpcr.tan', 'eyes': 'brown', 'attack': ('slash', 'slash_oversize'),
        'items': [
            {'def': 'body/body.json'},
            {'def': 'head/heads/human/heads_human_male.json'},
            {'def': 'legs/pants/legs_pants.json', 'color': 'brown'},
            {'def': 'feet/boots/feet_boots_basic.json', 'color': 'leather'},
            {'def': 'torso/jacket/torso_jacket_frock.json', 'variant': 'walnut'},
            {'def': 'torso/cape/cape_solid.json', 'color': 'brown'},
            {'def': 'hair/beards/beards_beard.json', 'color': 'ash'},
            {'def': 'headwear/coverings/hoods/hat_hood_cloth.json', 'color': 'brown'},
            {'def': 'weapons/blunt/weapon_blunt_mace.json', 'variant': 'mace', 'idle_from': IDLE_FROM_WALK},
        ],
        'notes': ['the 8-bit torvald look: beard, hood, robe (a frock coat), a traveling cloak (the solid cape)'],
    },
}
SPIDER = {
    'phasespider': {
        'sheet': 'spider07', 'hue': 272, 'grey_tint': (290, 0.30),
        'notes': ['source LPC_Spiders/spider07.png (blue spider with pale markings); every blue hue set to 272 deg '
                  '(violet) keeping each colour\'s lightness + saturation, the grey/white markings tinted pale lilac',
                  'sheet layout 10x5 frames of 64: rows up/left/down/right + a death row (down only); per the OGA '
                  'page col 0 = standing, cols 0-3 = attacking (stand, rear, lunge, recover), cols 4-9 = walking (6)',
                  'idle = the single stand frame (1 frame); hurt.png = the 4-frame death row (down only)'],
    },
}


def contact_sheet(ids, path, scale=3):
    """Per figure: the down-facing idle frame 0, a gap, then the down-facing walk frames; nearest-neighbour x3."""
    rows = []
    for fid in ids:
        d = os.path.join(OUT, fid)
        meta = json.load(open(os.path.join(d, 'meta.json'), encoding='utf-8'))
        idle = Image.open(os.path.join(d, 'idle.png')).convert('RGBA')
        walk = Image.open(os.path.join(d, 'walk.png')).convert('RGBA')
        r = meta['anims']['walk']['rows'].index('down')
        ri = meta['anims']['idle']['rows'].index('down')
        frames = [idle.crop((0, ri * F, F, ri * F + F)), None]
        frames += [walk.crop((c * F, r * F, c * F + F, r * F + F)) for c in range(meta['anims']['walk']['frames'])]
        rows.append((fid, frames, meta['foot']))
    label_w, cell = 110, F * scale
    ncols = max(len(fr) for _, fr, _ in rows)
    sheet = Image.new('RGBA', (label_w + ncols * cell, len(rows) * cell), (0, 0, 0, 0))
    dr = ImageDraw.Draw(sheet)
    for i, (fid, frames, foot) in enumerate(rows):
        y = i * cell
        dr.rectangle([0, y, sheet.width, y + cell - 1], fill=(118, 128, 112, 255) if i % 2 else (104, 114, 100, 255))
        dr.text((8, y + cell // 2 - 12), fid, fill=(255, 255, 255, 255))
        dr.text((8, y + cell // 2 + 2), 'idle0 | walk', fill=(225, 230, 220, 255))
        for c, fr in enumerate(frames):
            if fr is None:
                continue
            x = label_w + c * cell
            dr.rectangle([x, y, x + cell - 1, y + cell - 1], outline=(80, 88, 76, 255))
            big = fr.resize((cell, cell), Image.NEAREST)
            sheet.alpha_composite(big, (x, y))
            if c == 0 and foot:  # foot marker: a 3x3-scaled red pixel outline under the idle frame's foot point
                fx, fy = x + foot[0] * scale, y + foot[1] * scale
                dr.rectangle([fx - 1, fy - 1, fx + scale, fy + scale], outline=(255, 40, 40, 255))
    sheet.save(path)
    return path


def write_credits(built, path):
    """Attribution for every layer used, straight from each sheet definition's `credits` (filtered to the
    credit entries whose `file` covers a sprite path we actually used), plus the spider."""
    by_def = {}
    for fid, (items, meta) in built.items():
        if items is None:
            continue
        for it in items:
            e = by_def.setdefault(it.def_path, {'item': it, 'figs': [], 'paths': set()})
            e['figs'].append(fid)
            e['paths'] |= it.used_paths
    L = ['# Credits -- LPC figures for the DEEP16 sprite comparison', '',
         'Composed by `tools/lpc-compose.py` from layers of the Universal LPC Spritesheet Character Generator '
         '(https://github.com/%s, branch master). Attribution below is copied from each layer\'s sheet definition '
         '(`sheet_definitions/**.json` -> `credits`). This art is licensed CC-BY-SA / GPL / OGA-BY / CC-BY '
         '(per entry): **crediting the authors listed is mandatory** wherever these sprites are shown or shipped; '
         'CC-BY-SA / GPL entries also require derivatives to stay under the same licence.' % REPO, '',
         'Licence texts: CC-BY-SA 3.0 https://creativecommons.org/licenses/by-sa/3.0/ , '
         'CC-BY 3.0 https://creativecommons.org/licenses/by/3.0/ , '
         'OGA-BY 3.0 https://static.opengameart.org/OGA-BY-3.0.txt , '
         'GPL 3.0 https://www.gnu.org/licenses/gpl-3.0.html', '']
    for dp in sorted(by_def):
        e = by_def[dp]
        it = e['item']
        used = sorted(p[len('spritesheets/'):] for p in e['paths'])
        creds = it.d.get('credits', [])
        keep = [c for c in creds if any(u.startswith(c.get('file', '').rstrip('/') + '/') or u == c.get('file') for u in used)]
        if not keep:
            keep = creds
        L.append('## %s -- "%s"' % (dp, it.d.get('name', '')))
        L.append('')
        L.append('Used by: %s' % ', '.join(sorted(set(e['figs']))))
        L.append('')
        for c in keep:
            L.append('- **file** `%s`' % c.get('file', ''))
            L.append('  - authors: %s' % ', '.join(c.get('authors', [])))
            L.append('  - licences: %s' % ', '.join(c.get('licenses', [])))
            for u in c.get('urls', []):
                L.append('  - %s' % u)
            if c.get('notes'):
                L.append('  - notes: %s' % c['notes'])
        L.append('')
    L += ['## phasespider -- LPC Spider (LPC_Spiders.zip)', '',
          'Used by: phasespider (sheet `%s`, hue-shifted to violet by tools/lpc-compose.py)' % SPIDER['phasespider']['sheet'], '',
          '- graphic artist: Stephen "Redshrike" Challener; contributor: William.Thompsonj (OGA submitter)',
          '- licences (as listed on the OGA page, checked 2026-09-26): CC-BY 4.0, CC-BY 3.0, GPL 3.0, GPL 2.0, OGA-BY 3.0',
          '- the page asks: "Attribute Stephen \'Redshrike\' Challener as graphic artist and William.Thompsonj as '
          'contributor. If reasonable link to this page or the OGA homepage."',
          '- https://opengameart.org/content/lpc-spider', '']
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(L))


def main(argv):
    want = set(argv) or (set(FIGURES) | set(SPIDER))
    os.makedirs(OUT, exist_ok=True)
    built = {}
    for fid, fig in FIGURES.items():
        if fid in want:
            built[fid] = build_figure(fid, fig)
    for fid, fig in SPIDER.items():
        if fid in want:
            built[fid] = (None, build_spider(fid, fig))
    FX.save()
    if want >= (set(FIGURES) | set(SPIDER)):
        write_credits(built, os.path.join(OUT, 'CREDITS.md'))
        contact_sheet(list(FIGURES) + list(SPIDER), os.path.join(OUT, '_contact.png'))
        print('wrote', os.path.join(OUT, '_contact.png'))
    print('fetched this run: %d files, %d bytes; fetch-log total %d bytes over %d files'
          % (FX.new_files, FX.new_bytes, FX.log['total_bytes'], len(FX.log['files'])))


if __name__ == '__main__':
    main(sys.argv[1:])
