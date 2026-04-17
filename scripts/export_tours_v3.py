"""
Export tours to TSV with actual location names from itinerary/highlights/description.
Each tour gets a list of specific points-of-interest for the designer.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

def find_tour_blocks(code):
    """Split code into individual tour object blocks."""
    tours = []
    depth = 0
    start = None
    
    i = 0
    while i < len(code):
        if code[i] == '{':
            if depth == 0:
                start = i
            depth += 1
        elif code[i] == '}':
            depth -= 1
            if depth == 0 and start is not None:
                block = code[start:i+1]
                if "slug:" in block and "title:" in block:
                    tours.append(block)
                start = None
        i += 1
    return tours

def extract_field(block, field):
    m = re.search(rf"{field}:\s*['\"]([^'\"]*)['\"]", block)
    return m.group(1) if m else ''

def extract_int(block, field):
    m = re.search(rf"{field}:\s*(\d+)", block)
    return int(m.group(1)) if m else 0

def extract_list_strings(block, field):
    """Extract array of strings like highlights: ['a', 'b', 'c']"""
    m = re.search(rf"{field}:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    items = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))
    return items

def extract_itinerary_descriptions(block):
    """Extract all description texts from itinerary entries."""
    descriptions = []
    for m in re.finditer(r"description:\s*['\"]([^'\"]+)['\"]", block):
        descriptions.append(m.group(1))
    return descriptions

def extract_itinerary_titles(block):
    """Extract day titles from itinerary."""
    # Match title: '...' inside itinerary blocks
    m = re.search(r"itinerary:\s*\[(.+?)\](?:\s*,)", block, re.DOTALL)
    if not m:
        return []
    itin_text = m.group(1)
    titles = []
    for tm in re.finditer(r"title:\s*['\"]([^'\"]+)['\"]", itin_text):
        titles.append(tm.group(1))
    return titles

def extract_destinations(block):
    m = re.search(r"destinations:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))

def extract_locations_from_text(text):
    """Extract proper noun location names from itinerary description text."""
    # Known patterns for locations (capitalized multi-word or specific)
    # Split by common separators and look for capitalized words
    locations = []
    
    # Direct extraction of known location patterns
    # These are common POI patterns in Russian tour descriptions
    patterns = [
        r'[А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁ][а-яё]+)+',  # Multi-word capitalized
        r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+',  # Hyphenated names
    ]
    
    # More targeted: extract location-like phrases after prepositions or markers
    # "к/в/на + Capitalized"
    loc_patterns = [
        r'(?:в|на|к|до|от|из|через|по)\s+([А-ЯЁ][а-яё]+(?:[-\s]?[а-яё]*){0,3})',
        r'(?:посещение|экскурсия|прибытие|переезд|осмотр|подъём|спуск|прогулка)\s+(?:в\s+|на\s+|по\s+|к\s+)?([А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){0,3})',
    ]
    
    # Just extract all capitalized "interesting" words/phrases from description
    # Skip common non-location words
    skip_words = {
        'Выезд', 'Прибытие', 'Возвращение', 'Обратный', 'День', 'Сбор',
        'Свободное', 'Обед', 'Ужин', 'Завтрак', 'Трансфер', 'Размещение',
        'Фотостоп', 'Экскурсия', 'Прогулка', 'Подъём', 'Спуск', 'Переезд',
        'Выезжаем', 'Едем', 'Посещение', 'Осмотр', 'Прибытие', 'По',
        'Комфортабельный', 'Далее', 'Затем', 'После', 'Остановка',
        'Группа', 'Гид', 'Автобус', 'Маршрут', 'Программа',
        'Продолжение', 'Знакомство', 'Обзорная', 'Панорамные', 'Фото',
    }
    
    # Get capitalized phrases (likely location names)
    all_caps = re.findall(r'[А-ЯЁ][а-яё]+(?:\s+[а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+(?:\s+[а-яё]+)?)*', text)
    
    for phrase in all_caps:
        first_word = phrase.split()[0]
        if first_word in skip_words:
            continue
        if len(phrase) < 4:
            continue
        # Clean up
        phrase = phrase.strip()
        if phrase not in locations:
            locations.append(phrase)
    
    return locations


all_tours = []

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    blocks = find_tour_blocks(code)
    
    for block in blocks:
        slug = extract_field(block, 'slug')
        title = extract_field(block, 'title')
        if not slug or not title or title == '___':
            continue
        
        source_url = extract_field(block, 'sourceUrl')
        source_op = extract_field(block, 'sourceOperator')
        days = extract_int(block, 'durationDays')
        desc = extract_field(block, 'description')
        
        highlights = extract_list_strings(block, 'highlights')
        destinations = extract_destinations(block)
        itin_descs = extract_itinerary_descriptions(block)
        itin_titles = extract_itinerary_titles(block)
        
        # Collect all location names
        points = []
        
        # 1. Destinations first (always relevant)
        for d in destinations:
            if d not in points:
                points.append(d)
        
        # 2. From itinerary descriptions — extract proper nouns
        full_itin = ' '.join(itin_descs)
        itin_locs = extract_locations_from_text(full_itin)
        for loc in itin_locs:
            if loc not in points and len(loc) > 3:
                points.append(loc)
        
        # 3. From highlights (filter out non-location ones)
        non_loc_highlights = {'Подходит детям', 'Подходит', 'детям', 'Без рюкзаков'}
        for h in highlights:
            skip = False
            for nlh in non_loc_highlights:
                if nlh in h:
                    skip = True
                    break
            if not skip and h not in points:
                points.append(h)
        
        # 4. From itinerary titles
        for it in itin_titles:
            if it not in points and len(it) > 4:
                points.append(it)
        
        # 5. From description
        desc_locs = extract_locations_from_text(desc)
        for dl in desc_locs:
            if dl not in points and len(dl) > 3:
                points.append(dl)
        
        # 6. From title itself
        title_locs = extract_locations_from_text(title)
        for tl in title_locs:
            if tl not in points and len(tl) > 3:
                points.append(tl)
        
        all_tours.append({
            'slug': slug,
            'title': title,
            'days': days,
            'source_url': source_url,
            'operator': source_op,
            'points': points,
        })

print(f'Parsed {len(all_tours)} tours')

# Sort
all_tours.sort(key=lambda t: (t['operator'], t['title']))

# Write TSV
out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')
code_counter = 1001

with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    
    # Header: dynamic columns for locations
    max_points = max(len(t['points']) for t in all_tours)
    max_points = max(max_points, 6)
    
    header = ['Код', 'Наш тур', 'Slug', 'Дней', 'Оператор', 'Ссылка на тур оператора']
    for i in range(1, max_points + 1):
        header.append(f'Локация {i}')
    w.writerow(header)
    
    for t in all_tours:
        row = [
            code_counter,
            t['title'],
            t['slug'],
            t['days'],
            t['operator'],
            t['source_url'],
        ]
        # Add location columns
        for i in range(max_points):
            if i < len(t['points']):
                row.append(t['points'][i])
            else:
                row.append('')
        
        w.writerow(row)
        code_counter += 1

print(f'Exported {len(all_tours)} tours, codes 1001–{code_counter-1}')
print(f'Max locations per tour: {max_points}')
print(f'File: {out}')

# Stats
counts = [len(t['points']) for t in all_tours]
print(f'Tours with <6 locations: {sum(1 for c in counts if c < 6)}')
print(f'Tours with >=6 locations: {sum(1 for c in counts if c >= 6)}')
print(f'Average locations: {sum(counts)/len(counts):.1f}')
