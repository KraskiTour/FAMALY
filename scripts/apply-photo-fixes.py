import csv
import json
import pathlib
import re

csv_path = pathlib.Path(r"c:\Users\pavel\Downloads\Новая таблица - tours-from-tours1-all.csv")
json_path = pathlib.Path(r"c:\Users\pavel\Documents\GitHub\FAMALY23\data\tours.json")

for enc in ("utf-8-sig", "utf-8", "cp1251"):
    try:
        txt = csv_path.read_text(encoding=enc)
        break
    except Exception:
        pass

rows = list(csv.reader(txt.splitlines()))


def parse_actions(comment: str):
    c = f" {comment.lower()} "
    remove_idx = set()
    all_bad = False

    if re.search(r"все\s+фото[^\n\r]*не\s+подход", c) or re.search(r"все\s+фотки[^\n\r]*не\s+те", c):
        all_bad = True

    for a, b in re.findall(r"с\s*(\d{1,2})\s*по\s*(\d{1,2})", c):
        a, b = int(a), int(b)
        if a <= b:
            for n in range(a, b + 1):
                remove_idx.add(n - 1)

    for g in re.finditer(r"фото[^\d]{0,10}((?:\d{1,2}[\s,и]+)+\d{1,2}|\d{1,2})", c):
        for n in re.findall(r"\d{1,2}", g.group(1)):
            remove_idx.add(int(n) - 1)

    for n in re.findall(r"(\d{1,2})\s*(?:я|й|е)?\s*фото", c):
        remove_idx.add(int(n) - 1)

    remove_last = ("последнее фото" in c) or ("последняя фото" in c)

    # "все фото, кроме X" не разбираем автоматически по индексам.
    if "кроме" in c and "все фото" in c:
        remove_idx.clear()

    return all_bad, remove_idx, remove_last


photo_notes = {}
for r in rows[1:]:
    r = r + [""] * (11 - len(r))
    slug = (r[1] or "").strip()
    notes = " | ".join([(r[8] or ""), (r[9] or ""), (r[10] or "")])
    low = notes.lower()
    if slug and any(k in low for k in ["фото", "фотки", "лишн", "не подходят", "не подходит", "не те"]):
        photo_notes[slug] = notes

tours = json.loads(json_path.read_text(encoding="utf-8"))
by_slug = {t.get("slug"): t for t in tours}

removed = []
on_request_all_bad = []
on_request_empty = []

for slug, notes in photo_notes.items():
    t = by_slug.get(slug)
    if not t:
        continue
    gallery = t.get("gallery") or []
    if not gallery:
        continue

    all_bad, idxs, remove_last = parse_actions(notes)

    if all_bad:
        t["onRequestOnly"] = True
        t["isPublished"] = True
        t["nextDates"] = []
        t["onRequestReason"] = (
            "Фотогалерея по туру обновляется. "
            "Менеджер уточнит актуальные детали и пришлет свежие материалы."
        )
        on_request_all_bad.append(slug)
        continue

    before = len(gallery)
    keep = [u for i, u in enumerate(gallery) if i not in idxs]
    if remove_last and keep:
        keep = keep[:-1]

    if len(keep) != before:
        t["gallery"] = keep
        removed.append((slug, before, len(keep)))

    if len(keep) == 0:
        t["onRequestOnly"] = True
        t["isPublished"] = True
        t["nextDates"] = []
        t["onRequestReason"] = (
            "Фотогалерея по туру обновляется. "
            "Менеджер уточнит актуальные детали и пришлет свежие материалы."
        )
        on_request_empty.append(slug)

json_path.write_text(json.dumps(tours, ensure_ascii=False, indent=2), encoding="utf-8")

print("photo_note_slugs", len(photo_notes))
print("galleries_changed", len(removed))
print("on_request_all_bad", len(on_request_all_bad))
print("on_request_empty_gallery", len(on_request_empty))
for s, b, a in removed[:60]:
    print(f"GALLERY {s}: {b}->{a}")
print("ALL_BAD", ",".join(on_request_all_bad[:60]))
