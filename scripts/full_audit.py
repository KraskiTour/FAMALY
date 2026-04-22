"""
Full audit of all KRASKI.TRAVEL tour data.
Checks: cities/slugs, dates, required fields, uniqueness, filters, artifacts.
"""
import re, os, sys
from datetime import datetime, date

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
TODAY = date(2026, 4, 15)

# ─── Parse helpers ───

def read_file(name):
    path = os.path.join(DATA_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_cities_registry(text):
    """Extract city slugs from the cities[] array in mock-tours.ts."""
    cities = {}
    for m in re.finditer(r"name:\s*'([^']+)',\s*\n\s*slug:\s*'([^']+)'", text):
        cities[m.group(2)] = m.group(1)
    return cities

def extract_tour_blocks(text):
    """Extract individual tour object blocks from a TS file."""
    tours = []
    # Find each { id: 'xxx' ... } block
    # We'll use a state-machine approach to match balanced braces
    pattern = re.compile(r"\{\s*\n\s*id:\s*'(\d+)'")
    for m in pattern.finditer(text):
        start = m.start()
        depth = 0
        i = start
        while i < len(text):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    tours.append((m.group(1), text[start:i+1]))
                    break
            i += 1
    return tours

def extract_field_str(block, field):
    m = re.search(rf"{field}:\s*'([^']*)'", block)
    return m.group(1) if m else None

def extract_field_num(block, field):
    m = re.search(rf"{field}:\s*(\d+)", block)
    return int(m.group(1)) if m else None

def extract_field_array_str(block, field):
    m = re.search(rf"{field}:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    content = m.group(1)
    return [s.strip().strip("'\"") for s in re.findall(r"'([^']*)'", content)]

def extract_departure_cities(block):
    """Extract departureCities array with city, slug, departureTime, meetingPoint."""
    cities = []
    dc_match = re.search(r'departureCities:\s*\[', block)
    if not dc_match:
        return cities
    start = dc_match.end()
    depth = 1
    i = start
    while i < len(block) and depth > 0:
        if block[i] == '[':
            depth += 1
        elif block[i] == ']':
            depth -= 1
        i += 1
    dc_text = block[start:i-1]

    for obj_m in re.finditer(r'\{([^}]+)\}', dc_text):
        obj = obj_m.group(1)
        city = re.search(r"city:\s*'([^']*)'", obj)
        slug = re.search(r"slug:\s*'([^']*)'", obj)
        dept_time = re.search(r"departureTime:\s*'([^']*)'", obj)
        meeting = re.search(r"meetingPoint:\s*'([^']*)'", obj)
        cities.append({
            'city': city.group(1) if city else '',
            'slug': slug.group(1) if slug else '',
            'departureTime': dept_time.group(1) if dept_time else '',
            'meetingPoint': meeting.group(1) if meeting else '',
        })
    return cities

def extract_next_dates(block):
    """Extract nextDates array."""
    dates = []
    nd_match = re.search(r'nextDates:\s*\[', block)
    if not nd_match:
        return dates
    start = nd_match.end()
    depth = 1
    i = start
    while i < len(block) and depth > 0:
        if block[i] == '[':
            depth += 1
        elif block[i] == ']':
            depth -= 1
        i += 1
    nd_text = block[start:i-1]

    for obj_m in re.finditer(r'\{([^}]+)\}', nd_text):
        obj = obj_m.group(1)
        s = re.search(r"start:\s*'([^']*)'", obj)
        e = re.search(r"end:\s*'([^']*)'", obj)
        p = re.search(r"price:\s*(\d+)", obj)
        seats = re.search(r"seatsLeft:\s*(\d+|null)", obj)
        dates.append({
            'start': s.group(1) if s else '',
            'end': e.group(1) if e else '',
            'price': int(p.group(1)) if p else 0,
            'seatsLeft': seats.group(1) if seats else 'null',
        })
    return dates

def extract_gallery(block):
    """Extract gallery array of image URLs."""
    m = re.search(r'gallery:\s*\[', block)
    if not m:
        return []
    start = m.end()
    depth = 1
    i = start
    while i < len(block) and depth > 0:
        if block[i] == '[':
            depth += 1
        elif block[i] == ']':
            depth -= 1
        i += 1
    gal_text = block[start:i-1]
    return re.findall(r"'([^']+)'", gal_text)

def extract_itinerary_days(block):
    """Count itinerary day objects."""
    it_match = re.search(r'itinerary:\s*\[', block)
    if not it_match:
        return 0
    start = it_match.end()
    depth = 1
    i = start
    while i < len(block) and depth > 0:
        if block[i] == '[':
            depth += 1
        elif block[i] == ']':
            depth -= 1
        i += 1
    it_text = block[start:i-1]
    return len(re.findall(r"day:\s*\d+", it_text))

def check_artifacts(block, tour_id):
    """Check for HTML/parsing artifacts."""
    issues = []
    artifacts = ['<div', '<span', '<br', '<p>', '</div', '</span', 'undefined', 'NaN']
    for art in artifacts:
        if art in block and f"'{art}" not in block:
            # Check if it's inside a string value
            for m in re.finditer(re.escape(art), block):
                pos = m.start()
                line_start = block.rfind('\n', 0, pos)
                line = block[line_start:block.find('\n', pos)]
                if "'//" not in line and 'http' not in line:
                    issues.append(f"  Artifact '{art}' found near: {line.strip()[:80]}")
                    break
    return issues

# ─── Main audit ───

def main():
    print("=" * 70)
    print("KRASKI.TRAVEL — ПОЛНЫЙ АУДИТ ДАННЫХ ТУРОВ")
    print(f"Дата: {TODAY}")
    print("=" * 70)

    errors = []
    warnings = []

    # 1) Load cities registry
    mock_text = read_file('mock-tours.ts')
    cities_registry = extract_cities_registry(mock_text)
    print(f"\n📋 Реестр городов: {len(cities_registry)} городов")
    for slug, name in sorted(cities_registry.items()):
        print(f"   {slug} → {name}")

    # 2) Collect all tours from all files
    files = ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts',
             'bogema-tours.ts', 'bogema-tours-batch2.ts']

    all_tours = []
    for fname in files:
        text = read_file(fname)
        tours = extract_tour_blocks(text)
        print(f"\n📁 {fname}: {len(tours)} туров")
        for tid, block in tours:
            all_tours.append((tid, block, fname))

    print(f"\n🔢 ВСЕГО ТУРОВ: {len(all_tours)}")

    # 3) Check uniqueness
    print("\n" + "─" * 70)
    print("1. УНИКАЛЬНОСТЬ ID И SLUG")
    print("─" * 70)

    seen_ids = {}
    seen_slugs = {}
    for tid, block, fname in all_tours:
        if tid in seen_ids:
            errors.append(f"ДУБЛЬ ID '{tid}' в {fname} и {seen_ids[tid]}")
        seen_ids[tid] = fname

        slug = extract_field_str(block, 'slug')
        if slug:
            if slug in seen_slugs:
                errors.append(f"ДУБЛЬ SLUG '{slug}' (ID {tid} в {fname}, ID {seen_slugs[slug][0]} в {seen_slugs[slug][1]})")
            seen_slugs[slug] = (tid, fname)

    if not [e for e in errors if 'ДУБЛЬ' in e]:
        print("   ✅ Все ID уникальны")
        print("   ✅ Все slug уникальны")
    else:
        for e in errors:
            if 'ДУБЛЬ' in e:
                print(f"   ❌ {e}")

    # 4) Check each tour
    print("\n" + "─" * 70)
    print("2. ПРОВЕРКА КАЖДОГО ТУРА")
    print("─" * 70)

    tours_per_city = {}
    total_past_dates = 0
    total_date_mismatch = 0
    total_empty_gallery = 0
    total_empty_itinerary = 0
    total_missing_departure_time = 0
    total_missing_meeting_point = 0
    total_bad_slugs = 0
    total_duplicate_cities = 0
    total_price_mismatch = 0
    total_artifacts = 0

    for tid, block, fname in all_tours:
        tour_errors = []
        tour_warnings = []

        title = extract_field_str(block, 'title') or f"(no title, ID {tid})"
        slug = extract_field_str(block, 'slug') or ''
        duration = extract_field_num(block, 'durationDays') or 0
        price_from = extract_field_num(block, 'priceFrom') or 0

        # Required fields
        if not extract_field_str(block, 'title'):
            tour_errors.append("title пустой")
        if not slug:
            tour_errors.append("slug пустой")
        short_desc = extract_field_str(block, 'shortDescription')
        if not short_desc or len(short_desc) < 10:
            tour_warnings.append(f"shortDescription слишком короткий ({len(short_desc or '')} символов)")

        # Gallery
        gallery = extract_gallery(block)
        if len(gallery) == 0:
            tour_errors.append("gallery ПУСТАЯ")
            total_empty_gallery += 1

        # Itinerary vs durationDays
        itin_days = extract_itinerary_days(block)
        if itin_days > 0 and duration > 0 and itin_days != duration:
            tour_warnings.append(f"itinerary ({itin_days} дней) ≠ durationDays ({duration})")
            total_empty_itinerary += 1

        # Departure cities
        dep_cities = extract_departure_cities(block)
        city_slugs_in_tour = set()
        for dc in dep_cities:
            # Slug exists in registry
            if dc['slug'] and dc['slug'] not in cities_registry:
                tour_errors.append(f"slug '{dc['slug']}' ({dc['city']}) НЕ в реестре городов")
                total_bad_slugs += 1

            # Duplicate city
            if dc['slug'] in city_slugs_in_tour:
                tour_errors.append(f"дубль города '{dc['slug']}' в departureCities")
                total_duplicate_cities += 1
            city_slugs_in_tour.add(dc['slug'])

            # departureTime
            if not dc['departureTime']:
                tour_warnings.append(f"departureTime пуст для {dc['city']} ({dc['slug']})")
                total_missing_departure_time += 1

            # meetingPoint
            if not dc['meetingPoint']:
                tour_warnings.append(f"meetingPoint пуст для {dc['city']} ({dc['slug']})")
                total_missing_meeting_point += 1

            # Track for filter audit
            if dc['slug']:
                if dc['slug'] not in tours_per_city:
                    tours_per_city[dc['slug']] = []
                tours_per_city[dc['slug']].append(tid)

        # Dates
        next_dates = extract_next_dates(block)
        if next_dates:
            min_price = min(d['price'] for d in next_dates) if next_dates else 0
            if min_price > 0 and price_from > 0 and min_price != price_from:
                tour_warnings.append(f"priceFrom ({price_from}) ≠ min nextDates price ({min_price})")
                total_price_mismatch += 1

            for d in next_dates:
                # Date format
                try:
                    start_d = datetime.strptime(d['start'], '%Y-%m-%d').date()
                    end_d = datetime.strptime(d['end'], '%Y-%m-%d').date()

                    if end_d < start_d:
                        tour_errors.append(f"end < start: {d['start']}..{d['end']}")

                    if end_d < TODAY:
                        total_past_dates += 1

                    # Duration check
                    actual_days = (end_d - start_d).days + 1
                    if duration > 0 and actual_days != duration:
                        total_date_mismatch += 1

                except ValueError as ve:
                    tour_errors.append(f"Плохой формат даты: {d['start']} / {d['end']}: {ve}")

                if d['price'] <= 0:
                    tour_errors.append(f"price <= 0 для даты {d['start']}")

        # Artifacts
        art_issues = check_artifacts(block, tid)
        if art_issues:
            total_artifacts += len(art_issues)
            for a in art_issues:
                tour_errors.append(f"АРТЕФАКТ: {a.strip()}")

        # Print only tours with issues
        if tour_errors or tour_warnings:
            print(f"\n  ID {tid} | {title[:50]} ({fname})")
            for e in tour_errors:
                errors.append(f"ID {tid}: {e}")
                print(f"    ❌ {e}")
            for w in tour_warnings:
                warnings.append(f"ID {tid}: {w}")
                print(f"    ⚠️  {w}")

    # 5) Filter audit
    print("\n" + "─" * 70)
    print("3. ФИЛЬТРЫ: ГОРОДА → ТУРЫ")
    print("─" * 70)

    for slug, name in sorted(cities_registry.items()):
        count = len(tours_per_city.get(slug, []))
        if count == 0:
            warnings.append(f"Город {name} ({slug}) — 0 туров в фильтре")
            print(f"   ⚠️  {name} ({slug}): 0 туров")
        else:
            print(f"   ✅ {name} ({slug}): {count} туров")

    orphan_slugs = set(tours_per_city.keys()) - set(cities_registry.keys())
    if orphan_slugs:
        print(f"\n   ❌ Слаги в турах, но НЕ в реестре: {orphan_slugs}")
        for s in orphan_slugs:
            errors.append(f"Slug '{s}' используется в турах, но не определён в cities[]")

    # 6) Summary
    print("\n" + "=" * 70)
    print("ИТОГО")
    print("=" * 70)
    print(f"  Туров проверено:           {len(all_tours)}")
    print(f"  Городов в реестре:         {len(cities_registry)}")
    print(f"  ")
    print(f"  ❌ Ошибки (ERRORS):        {len(errors)}")
    print(f"  ⚠️  Предупреждения (WARN): {len(warnings)}")
    print(f"  ")
    print(f"  Прошедшие даты:            {total_past_dates}")
    print(f"  Несовпадение длительности: {total_date_mismatch}")
    print(f"  Пустые галереи:            {total_empty_gallery}")
    print(f"  Несовпадение itinerary:    {total_empty_itinerary}")
    print(f"  Пустые departureTime:      {total_missing_departure_time}")
    print(f"  Пустые meetingPoint:       {total_missing_meeting_point}")
    print(f"  Неизвестные slug городов:  {total_bad_slugs}")
    print(f"  Дубли городов:             {total_duplicate_cities}")
    print(f"  priceFrom ≠ min price:     {total_price_mismatch}")
    print(f"  HTML-артефакты:            {total_artifacts}")

    if errors:
        print(f"\n{'─' * 70}")
        print("ВСЕ ОШИБКИ:")
        print('─' * 70)
        for i, e in enumerate(errors, 1):
            print(f"  {i}. {e}")

    if warnings:
        print(f"\n{'─' * 70}")
        print(f"ВСЕ ПРЕДУПРЕЖДЕНИЯ (первые 50):")
        print('─' * 70)
        for i, w in enumerate(warnings[:50], 1):
            print(f"  {i}. {w}")
        if len(warnings) > 50:
            print(f"  ... и ещё {len(warnings) - 50}")

    return len(errors)

if __name__ == '__main__':
    sys.exit(main())
