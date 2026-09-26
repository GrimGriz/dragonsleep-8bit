#!/usr/bin/env python3
"""Seed the next round's ear-file from the last one Griz marked.

    python tools/seed-ear-file.py <marked-ear-file.json> <out.json> "<round note>" "<fold commits>"

Every checklist line in PLAYTEST.md gets an entry (so loading it into the lamp overwrites any stale
marks kept on the device). Lines that passed keep "works" (their notes marked with the round, e.g.
"R4:"); lines marked broken, unclear, too hard, too easy or not tested come back blank with the
tester's words attached and "re-test"; lines new since the last round are blank.
Written 2026-09-26 by the code tab (the 09-25 seat's seed script lived in a scratchpad and was lost).
"""
import json, re, sys, hashlib, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LABEL = {"works": "works", "broken": "✗ broken", "hard": "too hard", "easy": "too easy", "unclear": "? unclear", "skip": "— not tested"}


def parse(md):
    secs, sec = [], None
    for line in md.splitlines():
        s = line.rstrip()
        m = re.match(r"^## (?:(\d+)\.\s*)?(.+)$", s)
        if m:
            if m.group(2).strip().lower() == "notes": sec = None; continue
            sec = {"n": m.group(1) or str(len(secs) + 1), "title": m.group(2).strip(), "items": []}; secs.append(sec); continue
        m = re.match(r"^- \[[ xX]\] (.+)$", s)
        if m and sec is not None:
            sec["items"].append({"id": "s%s-%d" % (sec["n"], len(sec["items"]) + 1), "text": m.group(1).strip()})
    return secs


def main():
    src, out, round_note, folds = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    prev = {x["id"]: x for x in json.load(open(src, encoding="utf-8"))["items"]}
    rn = re.search(r"R(\d+)", round_note)
    tag = "R%s" % (int(rn.group(1)) - 1) if rn else "R"
    md = (ROOT / "PLAYTEST.md").read_bytes()
    items, counts = [], {"lines": 0, "marked": 0}
    for sec in parse(md.decode("utf-8")):
        for it in sec["items"]:
            counts["lines"] += 1
            p = prev.get(it["id"])
            v, note = "", ""
            if p and p.get("verdict") == "works":
                v = "works"
                note = p.get("note", "")
                if note and not re.match(r"^R\d", note): note = tag + ": " + note
            elif p and p.get("verdict"):
                note = "%s %s: %s — re-test (folded in %s)" % (tag, LABEL.get(p["verdict"], p["verdict"]), p.get("note", ""), folds)
            elif p and p.get("note"):
                note = p["note"]
            if v: counts["marked"] += 1; counts[v] = counts.get(v, 0) + 1
            items.append({"id": it["id"], "section": "%s. %s" % (sec["n"], sec["title"]), "claim": it["text"], "verdict": v, "note": note,
                          "at": (p or {}).get("at", "") if v else "", "text_changed": bool(p and p.get("claim") != it["text"])})
    doc = {"_readme": {"what": "Playtest feedback — the DRAGONSLEEP playtest lamp, one verdict per checklist line.",
                       "fold_back": "Whoever takes this (Cowork seat or code tab): broken and unclear lines become the fix list; too hard / too easy are tuning; notes are the tester's words, verbatim. Load this file back into the lamp to keep going.",
                       "verdicts": {"works": "✓ works", "broken": "✗ broken", "hard": "too hard", "easy": "too easy", "unclear": "? unclear", "skip": "— not tested"},
                       "round": round_note},
           "lamp": "playtest-lamp", "checklist_sha1": hashlib.sha1(md).hexdigest()[:8], "tester": "GrimGriz",
           "saved_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "counts": counts, "items": items}
    Path(out).write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("seeded %s: %d lines, %d carried as works" % (out, counts["lines"], counts["marked"]))


if __name__ == "__main__":
    main()
