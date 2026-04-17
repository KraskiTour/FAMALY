import pathlib
import re

for fname in ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts']:
    f = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}')
    code = f.read_text(encoding='utf-8')

    id_positions = [m.start() for m in re.finditer(r'^\s{2,6}id:', code, re.MULTILINE)]

    for i, start in enumerate(id_positions):
        end = id_positions[i + 1] if i + 1 < len(id_positions) else len(code)
        block = code[start:end]

        slug_m = re.search(r"slug:\s*'([^']+)'", block)
        dur_m = re.search(r'durationDays:\s*(\d+)', block)
        src_m = re.search(r"sourceUrl:\s*'([^']*)'", block)

        if not slug_m or not dur_m:
            continue

        slug = slug_m.group(1)
        days = int(dur_m.group(1))
        has_src = bool(src_m)

        if not has_src:
            print(f'MISSING | {fname:<20} | {slug:<55} | {days}d')
