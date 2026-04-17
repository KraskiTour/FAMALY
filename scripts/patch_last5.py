import pathlib

mapping = {
    # КМВ-туры — ближайший аналог у Кондагар
    'pyatigorsk-kislovodsk-1-den': ('https://kondagar.com/tours', 'Кондагар'),
    'kavminvody-5-gorodov': ('https://kondagar.com/tours', 'Кондагар'),
    'bermamyt-dzhily-su': ('https://kondagar.com/tours', 'Кондагар'),
    # Парк Лога — нет оператора, привяжем к общей страниц
    'park-loga-1-den': ('https://parklogo.ru/', 'Парк Лога'),
}

f = pathlib.Path(r'c:\COD\FAMALY\data\mock-tours.ts')
code = f.read_text(encoding='utf-8')
count = 0
for slug, (url, operator) in mapping.items():
    old = f"slug: '{slug}',"
    if old in code:
        pos = code.index(old)
        nearby = code[pos:pos+200]
        if 'sourceUrl:' not in nearby:
            new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: '{operator}',"
            code = code.replace(old, new, 1)
            count += 1
f.write_text(code, encoding='utf-8')
print(f'Patched {count} remaining tours')
