"""
Full audit: compare city slugs in bogema tours vs project's city registry.
"""
import re

# 1. Read the project's official city list from mock-tours.ts
with open(r'c:\COD\FAMALY\data\mock-tours.ts', encoding='utf-8') as f:
    mock = f.read()

# Extract official city slugs from the cities array
official_slugs = set(re.findall(r"slug: '([^']+)'.*?region:", mock, re.DOTALL))
# Also get slug -> name mapping
official_map = {}
for m in re.finditer(r"name: '([^']+)',\s*slug: '([^']+)'", mock):
    official_map[m.group(2)] = m.group(1)

print("=== ОФИЦИАЛЬНЫЕ ГОРОДА ПРОЕКТА ===")
for slug, name in sorted(official_map.items(), key=lambda x: x[1]):
    print(f"  {slug:25s} → {name}")
print(f"  Итого: {len(official_map)} городов\n")

# 2. Read all bogema tour files
files = [
    (r'c:\COD\FAMALY\data\bogema-tours.ts', 'bogema-tours.ts (партия 1)'),
    (r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', 'bogema-tours-batch2.ts (партия 2)'),
]

all_issues = []

for filepath, label in files:
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    
    # Find all city slugs used in departureCities
    used_slugs = re.findall(r"slug: '([^']+)'", content)
    # Filter to only departureCities (not tour slugs)
    # Tour slugs are long with dashes, city slugs are short
    # Better: find within departureCities blocks
    dep_blocks = re.findall(r'departureCities: \[(.*?)\]', content, re.DOTALL)
    city_slugs_in_file = set()
    city_slug_counts = {}
    for block in dep_blocks:
        slugs = re.findall(r"slug: '([^']+)'", block)
        for s in slugs:
            city_slugs_in_file.add(s)
            city_slug_counts[s] = city_slug_counts.get(s, 0) + 1
    
    print(f"=== {label} ===")
    print(f"  Города в departureCities:")
    for slug in sorted(city_slugs_in_file):
        in_official = slug in official_map
        name = official_map.get(slug, '???')
        status = 'OK' if in_official else 'НЕ НАЙДЕН В РЕЕСТРЕ!'
        count = city_slug_counts[slug]
        marker = '  ' if in_official else '❌'
        print(f"  {marker} {slug:25s} ({count:2d} раз) → {name:20s} [{status}]")
        if not in_official:
            all_issues.append(f'{label}: slug "{slug}" ({count} раз) не найден в cities[]')
    print()

# 3. Check amra-tours too
with open(r'c:\COD\FAMALY\data\amra-tours.ts', encoding='utf-8') as f:
    amra = f.read()
dep_blocks = re.findall(r'departureCities: \[(.*?)\]', amra, re.DOTALL)
amra_slugs = set()
for block in dep_blocks:
    for s in re.findall(r"slug: '([^']+)'", block):
        amra_slugs.add(s)

print(f"=== amra-tours.ts ===")
for slug in sorted(amra_slugs):
    in_official = slug in official_map
    name = official_map.get(slug, '???')
    status = 'OK' if in_official else 'НЕ НАЙДЕН!'
    marker = '  ' if in_official else '❌'
    print(f"  {marker} {slug:25s} → {name:20s} [{status}]")
print()

# 4. Summary
print("=" * 60)
if all_issues:
    print(f"НАЙДЕНО ПРОБЛЕМ: {len(all_issues)}")
    for iss in all_issues:
        print(f"  ❌ {iss}")
else:
    print("ВСЕ SLUG-И КОРРЕКТНЫ!")
