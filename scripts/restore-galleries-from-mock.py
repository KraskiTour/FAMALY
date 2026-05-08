import json
import pathlib
import re

mock_path = pathlib.Path(r"c:\Users\pavel\Documents\GitHub\FAMALY23\data\mock-tours.ts")
json_path = pathlib.Path(r"c:\Users\pavel\Documents\GitHub\FAMALY23\data\tours.json")

text = mock_path.read_text(encoding="utf-8")
lines = text.splitlines()

slug_to_gallery = {}
current_slug = None
i = 0
while i < len(lines):
    line = lines[i]
    m = re.search(r"slug:\s*'([^']+)'", line)
    if m:
        current_slug = m.group(1)

    if current_slug and re.search(r"\bgallery:\s*\[", line):
        gallery = []
        i += 1
        while i < len(lines):
            l = lines[i]
            if re.search(r"\],\s*$", l):
                break
            um = re.search(r"'([^']+)'", l)
            if um:
                gallery.append(um.group(1))
            i += 1
        if gallery:
            slug_to_gallery[current_slug] = gallery
    i += 1

tours = json.loads(json_path.read_text(encoding="utf-8"))
updated = 0
for tour in tours:
    slug = tour.get("slug")
    if slug in slug_to_gallery:
        new_gallery = slug_to_gallery[slug]
        if (tour.get("gallery") or []) != new_gallery:
            tour["gallery"] = new_gallery
            updated += 1

json_path.write_text(json.dumps(tours, ensure_ascii=False, indent=2), encoding="utf-8")

print("parsed galleries from mock:", len(slug_to_gallery))
print("tours galleries restored:", updated)
