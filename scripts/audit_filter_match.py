"""
Check: for every city in the filter dropdown, which tours will appear?
And are there tours that won't appear for ANY city filter?
"""
import re

# Read all data files
FILES = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\bogema-tours.ts',
    r'c:\COD\FAMALY\data\bogema-tours-batch2.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
]

# Read official city slugs
with open(r'c:\COD\FAMALY\data\mock-tours.ts', encoding='utf-8') as f:
    mock = f.read()

official_slugs = set()
official_names = {}
for m in re.finditer(r"name: '([^']+)',\s*slug: '([^']+)',\s*region: '([^']+)'", mock):
    name, slug, region = m.group(1), m.group(2), m.group(3)
    # Only count departure cities (not destinations)
    # Destinations have region like 'Направления'
    official_slugs.add(slug)
    official_names[slug] = name

# Extract all tours from all files
all_tours = []

for filepath in FILES:
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    
    # Split into tour blocks by id pattern
    tour_pattern = r"id: '(\d+)'.*?slug: '([^']+)'.*?title: '([^']*)'.*?departureCities: \[(.*?)\]"
    for m in re.finditer(tour_pattern, content, re.DOTALL):
        tour_id = m.group(1)
        tour_slug = m.group(2)
        title = m.group(3)[:50]
        dep_block = m.group(4)
        
        city_slugs = re.findall(r"slug: '([^']+)'", dep_block)
        
        all_tours.append({
            'id': tour_id,
            'slug': tour_slug,
            'title': title,
            'city_slugs': city_slugs,
            'file': filepath.split('\\')[-1],
        })

print(f"Всего туров в системе: {len(all_tours)}\n")

# Check 1: tours with NO departure cities (they show for ALL filters)
no_cities = [t for t in all_tours if len(t['city_slugs']) == 0]
if no_cities:
    print(f"⚠ Туры БЕЗ городов отправления ({len(no_cities)}):")
    print(f"  (эти туры показываются при ЛЮБОМ фильтре)")
    for t in no_cities:
        print(f"  ID {t['id']}: {t['title']} [{t['file']}]")
    print()

# Check 2: tours with unknown city slugs
print("=== ПРОВЕРКА: slug городов в турах vs реестр ===")
issues = []
for t in all_tours:
    for cs in t['city_slugs']:
        if cs not in official_slugs:
            issues.append(f"ID {t['id']} ({t['title']}): slug '{cs}' не в реестре")

if issues:
    for iss in issues:
        print(f"  ❌ {iss}")
else:
    print("  Все slug-и корректны!")
print()

# Check 3: for each major city, how many tours visible?
print("=== ВИДИМОСТЬ ТУРОВ ПО ГОРОДАМ ===")
major_cities = ['krasnodar', 'novorossiysk', 'anapa', 'rostov-na-donu', 'stavropol', 
                'sochi', 'gelendzhik', 'goryachij-klyuch', 'armavir', 'majkop',
                'bataysk', 'kropotkin', 'tihoretsk']

for city_slug in major_cities:
    city_name = official_names.get(city_slug, city_slug)
    # Filter logic: tour shows if departureCities is empty OR has this slug
    visible = [t for t in all_tours 
               if len(t['city_slugs']) == 0 or city_slug in t['city_slugs']]
    has_slug = [t for t in all_tours if city_slug in t['city_slugs']]
    print(f"  {city_name:20s} ({city_slug:20s}): {len(visible):3d} туров видно ({len(has_slug)} прямых + {len(visible)-len(has_slug)} без городов)")

print()

# Check 4: tours that are ONLY visible in "all" (no city filter)
# = tours that have cities but none of them are in the major filter list
print("=== ТУРЫ, ДОСТУПНЫЕ ТОЛЬКО БЕЗ ФИЛЬТРА ===")
orphan = []
for t in all_tours:
    if len(t['city_slugs']) > 0:
        # Check if any of the tour's cities are in major list
        if not any(cs in major_cities for cs in t['city_slugs']):
            orphan.append(t)

if orphan:
    for t in orphan:
        print(f"  ❌ ID {t['id']}: {t['title']} — города: {t['city_slugs']}")
else:
    print("  Нет таких туров — все доступны через фильтры!")
print()

# Check 5: Bogema tours specifically — verify each is reachable from major cities
print("=== БОГЕМА ТУРЫ: проверка по основным городам ===")
bogema_tours = [t for t in all_tours if 'bogema' in t['file']]
for city_slug in ['krasnodar', 'novorossiysk', 'anapa']:
    city_name = official_names.get(city_slug, city_slug)
    visible = [t for t in bogema_tours if city_slug in t['city_slugs']]
    missing = [t for t in bogema_tours if city_slug not in t['city_slugs'] and len(t['city_slugs']) > 0]
    print(f"\n  {city_name}: {len(visible)}/{len(bogema_tours)} туров Богемы видно")
    if missing:
        print(f"    НЕ видно ({len(missing)}):")
        for t in missing:
            print(f"      ID {t['id']}: {t['title']} — города: {', '.join(t['city_slugs'])}")
