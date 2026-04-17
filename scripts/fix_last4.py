import pathlib
import re

fixes = {
    'pyatigorsk-kislovodsk-1-den': ('https://www.kandagar.com/region/kavminvody/', 'Кандагар'),
    'bermamyt-dzhily-su': ('https://www.kandagar.com/region/kavminvody/', 'Кандагар'),
    'kavminvody-5-gorodov': ('https://www.kandagar.com/region/kavminvody/', 'Кандагар'),
    'park-loga-1-den': ('https://logapark.ru/', 'Парк Лога'),
}

f = pathlib.Path(r'c:\COD\FAMALY\data\mock-tours.ts')
code = f.read_text(encoding='utf-8')
count = 0

for slug, (new_url, new_op) in fixes.items():
    # Fix sourceUrl
    pattern_url = re.compile(
        rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*')([^']*?)(')"
    )
    if pattern_url.search(code):
        code = pattern_url.sub(rf"\g<1>{new_url}\3", code)
        count += 1

    # Fix sourceOperator
    pattern_op = re.compile(
        rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*'[^']*',\s*\n\s*sourceOperator:\s*')([^']*?)(')"
    )
    if pattern_op.search(code):
        code = pattern_op.sub(rf"\g<1>{new_op}\3", code)

f.write_text(code, encoding='utf-8')
print(f'Fixed {count} URLs')
