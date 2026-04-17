import pathlib
import re

for fname in ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts']:
    f = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}')
    code = f.read_text(encoding='utf-8')

    # Split by tour object boundaries: "  {" at start of line followed by id/slug
    # Find all id: lines and use them as anchors
    id_positions = [m.start() for m in re.finditer(r"^\s{2,6}id:\s*'", code, re.MULTILINE)]

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

        if days == 1:
            if src_m:
                print(f'OK      | {fname:<20} | {slug:<55} | {src_m.group(1)[:80]}')
            else:
                print(f'MISSING | {fname:<20} | {slug}')
