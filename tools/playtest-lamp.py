#!/usr/bin/env python3
"""Build playtest-lamp.html from PLAYTEST.md — the ear-lamp for the playtest.

The checklist is the register; the lamp is a compile. Edit PLAYTEST.md, rerun:
    python3 tools/playtest-lamp.py
Item ids are s<section>-<n>; a saved verdict re-attaches to its id on load,
and is flagged "text changed" if the item's wording has moved since.
Written 2026-09-23 by the Cowork seat (config echo claude-opus-5-5).
"""
import json, re, html, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "PLAYTEST.md", ROOT / "playtest-lamp.html"

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    t = re.sub(r"(https?://[^\s<)]+)", r'<a href="\1" target="_blank" rel="noopener">\1</a>', t)
    return t

def parse(md):
    d = {"title": "", "intro": [], "sections": []}
    sec = None
    for line in md.splitlines():
        s = line.rstrip()
        if s.startswith("# "): d["title"] = s[2:].strip(); continue
        m = re.match(r"^## (?:(\d+)\.\s*)?(.+)$", s)
        if m:
            if m.group(2).strip().lower() == "notes": sec = None; continue
            sec = {"n": m.group(1) or str(len(d["sections"]) + 1), "title": m.group(2).strip(), "items": []}
            d["sections"].append(sec); continue
        m = re.match(r"^- \[[ xX]\] (.+)$", s)
        if m and sec is not None:
            txt = m.group(1).strip()
            sec["items"].append({"id": f"s{sec['n']}-{len(sec['items'])+1}", "text": txt,
                                 "h": hashlib.sha1(txt.encode()).hexdigest()[:8], "html": inline(txt)})
            continue
        if sec is None and s and not s.startswith("(") and not d["sections"]:
            d["intro"].append(inline(s))
    return d

data = parse(SRC.read_text(encoding="utf-8"))
data["src_sha1"] = hashlib.sha1(SRC.read_bytes()).hexdigest()[:8]
tpl = (Path(__file__).resolve().parent / "playtest-lamp.template.html").read_text(encoding="utf-8")
OUT.write_text(tpl.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False)), encoding="utf-8")
n = sum(len(s["items"]) for s in data["sections"])
print(f"wrote {OUT.name}: {len(data['sections'])} sections, {n} items, PLAYTEST.md sha1 {data['src_sha1']}")
