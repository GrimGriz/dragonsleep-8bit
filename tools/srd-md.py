"""The SRD 5.1 as markdown, a file a section, for reference (10-01, Griz: "I brought in a pdf of SRD in case it would be
beneficial to parse the pdf and make .md of different sections for more convenient reference"). Reads dev/SRD-OGL_V5.1.pdf
(his) and writes dev/srd/ (both gitignored: local reference for the seats on this PC, not for Pages):

  README.md                 what's where, and the game's own spells beside the SRD's
  01-races.md ... 20-npcs.md  the book's sections in its order (the classes one a file under classes/)
  spells/level-0.md .. level-9.md   every SRD spell by level, A to Z: its school line, its four fields, its words, and
                            (in the game: id) where content/spells.json carries it, with the game's own desc
  monsters/a.md .. z.md     the bestiary by letter (the misc creatures and the NPCs have their own files)

  python tools/srd-md.py

The PDF has no bookmarks, so the sections are cut by page (SECTIONS, read off the book 10-01). Body lines in it carry tabs and
heading lines don't; a monster's name is the short line above its size-and-type line; a spell's is the line above its
level-and-school line. Tables come out as run-on text in places (equipment, the class tables): the words are all there.
"""
import io, json, logging, os, re, sys
logging.disable(logging.CRITICAL)
from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, 'dev', 'SRD-OGL_V5.1.pdf')
OUT = os.path.join(ROOT, 'dev', 'srd')

# (file, title, first page, last page): the book's printed page numbers
SECTIONS = [
    ('00-legal.md', 'Legal information (the OGL 1.0a)', 1, 2),
    ('01-races.md', 'Races', 3, 7),
    ('classes/barbarian.md', 'Barbarian', 8, 10), ('classes/bard.md', 'Bard', 11, 14), ('classes/cleric.md', 'Cleric', 15, 18),
    ('classes/druid.md', 'Druid', 19, 23), ('classes/fighter.md', 'Fighter', 24, 25), ('classes/monk.md', 'Monk', 26, 29),
    ('classes/paladin.md', 'Paladin', 30, 34), ('classes/ranger.md', 'Ranger', 35, 38), ('classes/rogue.md', 'Rogue', 39, 41),
    ('classes/sorcerer.md', 'Sorcerer', 42, 45), ('classes/warlock.md', 'Warlock', 46, 51), ('classes/wizard.md', 'Wizard', 52, 55),
    ('03-beyond-1st-level.md', 'Beyond 1st level: multiclassing, levels, alignment, languages, inspiration, backgrounds', 56, 61),
    ('04-equipment.md', 'Equipment', 62, 74),
    ('05-feats.md', 'Feats', 75, 75),
    ('06-using-ability-scores.md', 'Using ability scores', 76, 83),
    ('07-adventuring.md', 'Adventuring: time, movement, the environment, resting, between adventures', 84, 89),
    ('08-combat.md', 'Combat', 90, 99),
    ('09-spellcasting.md', 'Spellcasting', 100, 104),
    ('10-spell-lists.md', 'Spell lists, by class', 105, 113),
    ('SPELLS', 'Spell descriptions', 114, 194),
    ('12-traps-diseases-madness-objects-poisons.md', 'Traps, diseases, madness, objects, poisons', 195, 205),
    ('13-magic-items.md', 'Magic items', 206, 253),
    ('14-monster-statistics.md', 'Monsters: the statistics explained', 254, 260),
    ('MONSTERS', 'Monsters', 261, 357),
    ('16-conditions.md', 'Appendix PH-A: conditions', 358, 359),
    ('17-pantheons.md', 'Appendix PH-B: fantasy-historical pantheons', 360, 362),
    ('18-planes.md', 'Appendix PH-C: the planes of existence', 363, 365),
    ('19-misc-creatures.md', 'Appendix MM-A: miscellaneous creatures', 366, 394),
    ('20-npcs.md', 'Appendix MM-B: nonplayer characters', 395, 403),
]
FIELDS_SPELL = ('Casting Time:', 'Range:', 'Components:', 'Duration:')
FIELDS_MON = ('Armor Class', 'Hit Points', 'Speed', 'Saving Throws', 'Skills', 'Damage Vulnerabilities', 'Damage Resistances',
              'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge')
SUBHEADS_MON = ('Actions', 'Reactions', 'Legendary Actions')
SIZE = re.compile(r'^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b[^.]*,')
LEVEL = re.compile(r'^(?:(\d)(?:st|nd|rd|th)-level (\w+)|(\w+) cantrip)', re.I)


def clean(s):
    s = re.sub(r'-?[\xad‐‑]+', '-', s)
    return re.sub(r'[\t\r\xa0 ]+', ' ', s).strip()


def lines_of(pages, a, b):
    """The raw lines of pages a..b, the running header dropped; each (raw, text)."""
    out = []
    for t in pages[a - 1:b]:
        ls = t.split('\n')
        if ls and clean(ls[0]).startswith('Not for resale'):
            ls = ls[1:]
        out += [(l, clean(l)) for l in ls if clean(l)]
    return out


class Doc:
    """Joins the PDF's hard-wrapped lines back into paragraphs."""
    def __init__(self):
        self.out, self.para = [], []

    def flush(self):
        if self.para:
            t = ' '.join(self.para)
            if '•' in t:  # the conditions' bullets, run together by the PDF: one list item each
                bits = [b.strip() for b in t.split('•')]
                self.out += ([bits[0], ''] if bits[0] else []) + ['- ' + b for b in bits[1:] if b]
            else:
                self.out.append(t)
            self.out.append('')
            self.para = []

    def head(self, t, lvl=2):
        self.flush(); self.out += ['#' * lvl + ' ' + t, '']

    def line(self, t):
        self.flush(); self.out += [t, '']

    def add(self, t, new=False):
        if new:
            self.flush()
        if self.para and self.para[-1].endswith('-'):  # the PDF breaks lines only at a compound's own hyphen ("10-" / "foot"): keep it
            self.para[-1] = self.para[-1] + t
        else:
            self.para.append(t)

    def text(self):
        self.flush()
        return '\n'.join(self.out).rstrip() + '\n'


def is_head(raw, t):
    return '\t' not in raw and len(t) < 70 and not t.endswith(('.', ',')) and not re.match(r'^[\d(+−-]', t)


def render(lines, monsters=False):
    d, i, prev_head = Doc(), 0, None
    while i < len(lines):
        raw, t = lines[i]
        nxt = lines[i + 1][1] if i + 1 < len(lines) else ''
        # a stat block's name: the short line above its size-and-type line
        if monsters and SIZE.match(nxt) and len(t.split()) <= 6 and not t.endswith('.'):
            d.head(t, 2); d.line('*' + nxt + '*'); i += 2; prev_head = None; continue
        if monsters and t.startswith('STR DEX CON INT WIS CHA'):
            nums = re.findall(r'\d+ \([+−-]?\d+\)', nxt)
            if len(nums) == 6:
                d.flush(); d.out += ['| STR | DEX | CON | INT | WIS | CHA |', '|---|---|---|---|---|---|', '| ' + ' | '.join(nums) + ' |', '']
                i += 2; continue
        if monsters and t in SUBHEADS_MON:
            d.head(t, 4); i += 1; continue
        if monsters and t.startswith(FIELDS_MON):
            lab = next(f for f in FIELDS_MON if t.startswith(f))
            d.line('**' + lab + '** ' + t[len(lab):].strip()); i += 1
            # a field that wraps onto the next line (a long Senses, Damage Immunities)
            while i < len(lines) and '\t' in lines[i][0] and not lines[i][0].startswith('\t') and not lines[i][1].startswith(FIELDS_MON) \
                    and not lines[i][1].startswith('STR DEX') and re.match(r'^[a-z(]', lines[i][1]):
                d.out[-2] += ' ' + lines[i][1]; i += 1
            continue
        if t.startswith(FIELDS_SPELL):
            lab = next(f for f in FIELDS_SPELL if t.startswith(f))
            d.line('**' + lab + '** ' + t[len(lab):].strip()); i += 1
            while i < len(lines) and not lines[i][0].startswith('\t') and not lines[i][1].startswith(FIELDS_SPELL) and re.match(r'^[a-z(]', lines[i][1]):
                d.out[-2] += ' ' + lines[i][1]; i += 1
            continue
        if is_head(raw, t):
            # a heading broken over two lines ("Damage Resistance and" / "Vulnerability"; "Appendix PH-A:" / "Conditions")
            if prev_head is not None and d.out and d.out[-2:-1] and d.out[-2].startswith('#') and (prev_head.endswith((' and', ' of', ' the', ':')) or t[:1].islower()):
                d.out[-2] += ' ' + t; prev_head = t; i += 1; continue
            d.head(t, 3 if monsters else 2); prev_head = t; i += 1; continue
        prev_head = None
        # a bold run-in in a stat block: "Multiattack. The behir ...", "Bite. Melee Weapon Attack: ..."
        m = monsters and re.match(r'^([A-Z][\w’\'/-]*(?: [\w’\'()/+–-]+){0,6}?)\. (.*)$', t)
        if m and (not d.para or d.para[-1].endswith(('.', ')'))):
            d.flush(); d.add('***' + m.group(1) + '.*** ' + m.group(2), new=True); i += 1; continue
        d.add(t, new=raw.startswith('\t') or raw.startswith(' \t'))
        i += 1
    return d.text()


def game_spells():
    try:
        sp = json.load(io.open(os.path.join(ROOT, 'content', 'spells.json'), encoding='utf-8'))
    except Exception:
        return {}
    return {v['name'].lower(): (k, v) for k, v in sp.items() if isinstance(v, dict) and v.get('name')}


def spells(lines):
    """Cut the spell descriptions into spells: a heading line, then its level-and-school line."""
    out, cur = [], None
    for j, (raw, t) in enumerate(lines):
        nxt = lines[j + 1][1] if j + 1 < len(lines) else ''
        if '\t' not in raw and LEVEL.match(nxt) and len(t) < 50 and t != 'Spell Descriptions':
            cur = {'name': t, 'lines': []}; out.append(cur); continue
        if cur:
            cur['lines'].append((raw, t))
    for s in out:
        m = LEVEL.match(s['lines'][0][1]) if s['lines'] else None
        s['level'] = int(m.group(1)) if m and m.group(1) else 0
        s['school'] = s['lines'][0][1] if s['lines'] else ''
    return out


def write(rel, text):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(text)


def main():
    pages = [p.extract_text() or '' for p in PdfReader(PDF).pages]
    made, gs = [], game_spells()
    head = lambda title, a, b: '# %s\n\n*SRD 5.1, pages %d-%d (from dev/SRD-OGL_V5.1.pdf by tools/srd-md.py)*\n\n' % (title, a, b)
    for f, title, a, b in SECTIONS:
        L = lines_of(pages, a, b)
        if f == 'SPELLS':
            S = spells(L)
            by = {}
            for s in S:
                by.setdefault(s['level'], []).append(s)
            idx = ['# Spells, by level', '', '*SRD 5.1, pages 114-194. One file a level; (in the game: id) where content/spells.json has it.*', '']
            for lv in sorted(by):
                body = [head('Spells: %s' % ('cantrips' if not lv else 'level %d' % lv), a, b)]
                idx.append('- [%s](level-%d.md): %d spells' % ('Cantrips' if not lv else 'Level %d' % lv, lv, len(by[lv])))
                for s in sorted(by[lv], key=lambda s: s['name']):
                    g = gs.get(s['name'].lower())
                    body.append('## %s%s\n\n*%s*\n\n' % (s['name'], ' (in the game: `%s`)' % g[0] if g else '', s['school']))
                    if g and g[1].get('desc'):
                        body.append('> **The game:** %s\n\n' % g[1]['desc'])
                    body.append(render(s['lines'][1:]) + '\n')
                write('spells/level-%d.md' % lv, ''.join(body)); made.append('spells/level-%d.md' % lv)
            write('spells/README.md', '\n'.join(idx) + '\n')
            print('spells: %d (%s)' % (len(S), ', '.join('%d:%d' % (k, len(v)) for k, v in sorted(by.items()))))
            continue
        if f == 'MONSTERS':
            cuts, cur = {}, None
            for raw, t in L:
                m = re.match(r'^Monsters \(([A-Z])\)', t)
                if m:
                    cur = m.group(1).lower(); cuts.setdefault(cur, []); continue
                if cur:
                    cuts[cur].append((raw, t))
            for k in sorted(cuts):
                write('monsters/%s.md' % k, head('Monsters (%s)' % k.upper(), a, b) + render(cuts[k], monsters=True)); made.append('monsters/%s.md' % k)
            continue
        write(f, head(title, a, b) + render(L, monsters=f in ('19-misc-creatures.md', '20-npcs.md')))
        made.append(f)
    readme = ['# The SRD 5.1, as markdown', '',
              'Made by `tools/srd-md.py` from `dev/SRD-OGL_V5.1.pdf` (Griz brought it in 10-01). Local reference, gitignored with the PDF. '
              'The PDF has no bookmarks: the sections are cut by its printed pages. Tables come out as run-on text in places; '
              'for spells, `dev/srd-spells/srd-spells-detail.json` has the same text as structured data.', '',
              '- Spells by level: [spells/README.md](spells/README.md) (each marks the ones the game carries, with the game\'s own words)',
              '- Monsters by letter: ' + ' '.join('[%s](monsters/%s.md)' % (os.path.basename(m)[0].upper(), os.path.basename(m)[:-3]) for m in made if m.startswith('monsters/')), '']
    for f, title, a, b in SECTIONS:
        if f in ('SPELLS', 'MONSTERS'):
            continue
        readme.append('- [%s](%s) (pages %d-%d)' % (title, f, a, b))
    write('README.md', '\n'.join(readme) + '\n')
    print('ok: %d files in %s' % (len(made) + 2, OUT))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
