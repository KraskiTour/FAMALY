import pathlib
import re

f = pathlib.Path(r'c:\COD\FAMALY\data\mock-tours.ts')
code = f.read_text(encoding='utf-8')

id_positions = [m.start() for m in re.finditer(r'^\s{2,6}id:', code, re.MULTILINE)]

for i, start in enumerate(id_positions):
    end = id_positions[i + 1] if i + 1 < len(id_positions) else len(code)
    block = code[start:end]
    slug_m = re.search(r"slug:\s*'([^']+)'", block)
    dur_m = re.search(r'durationDays:\s*(\d+)', block)
    title_m = re.search(r"title:\s*'([^']+)'", block)
    if slug_m and dur_m and int(dur_m.group(1)) == 1:
        print(f"{slug_m.group(1):<45} | {title_m.group(1) if title_m else '?'}")
