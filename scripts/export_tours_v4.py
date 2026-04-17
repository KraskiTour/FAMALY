"""
Export tours with clean location/POI names from itinerary.
Filter out noise, keep only meaningful points of interest.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

NOISE = {
    'Краснодар', 'Краснодара', 'Краснодаре',
    'Россия', 'России', 'Кубани', 'Кубань',
    'Выезд', 'Прибытие', 'Возвращение', 'Вход', 'Трансфер',
    'Драм театр', 'Драматического театра',
    'Фирменный магазин', 'Смотровые площадки',
    'Весной парк', 'Весной', 'Фотостоп', 'Свободное время',
    'Завод шампанских', 'Завод', 'Обед', 'Ужин', 'Завтрак',
    'Размещение', 'Отель', 'Гостиница',
    'Группа', 'Автобус', 'Комфортабельный',
    'Маршрут', 'Программа', 'Продолжение', 'Далее',
    'Знакомство', 'Обзорная', 'Панорамные', 'Фото',
    'Вечерняя прогулка', 'Дегустация шампанского',
    'Александра Алексеева', 'Дюрсо',
}

def find_tour_blocks(code):
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

def extract_list(block, field):
    m = re.search(rf"{field}:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))

def extract_itin_descriptions(block):
    descs = []
    for m in re.finditer(r"description:\s*['\"]([^'\"]+)['\"]", block):
        descs.append(m.group(1))
    return descs

def clean_point(p):
    """Clean and validate a POI name."""
    p = p.strip().rstrip('.,:;')
    if len(p) < 4:
        return None
    if p in NOISE:
        return None
    if p.lower() in {n.lower() for n in NOISE}:
        return None
    # Skip generic phrases
    generics = ['по желанию', 'обратный путь', 'прибытие ~', 'выезд в', 
                'возвращение в', 'свободное время', 'ночь в', 'заселение',
                'переезд в', 'остановка на', 'фотостоп', 'обзорная экскурсия',
                'пешая прогулка', 'свободный вечер', 'выезд рано',
                'дегустация', 'мастер-класс', 'ужин', 'обед', 'завтрак']
    for g in generics:
        if g in p.lower():
            return None
    # Skip if starts with lowercase
    if p[0].islower():
        return None
    # Skip single generic words
    singles = {'Далее', 'Затем', 'После', 'Панорама', 'Виды', 'Вечер',
               'Утро', 'День', 'Ночь', 'Отдых', 'Прогулка'}
    if p in singles:
        return None
    return p

def extract_pois_from_itin(text):
    """Extract specific POI names from itinerary description text."""
    pois = []
    
    # Split by periods and common separators
    parts = re.split(r'[.;]', text)
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Look for named locations: capitalized multi-word names
        # Pattern: "Название Чего-то" or "Что-то имени Кого-то"
        named = re.findall(
            r'([А-ЯЁ][а-яё]+(?:[\s-]+[А-ЯЁа-яё]+){1,5})',
            part
        )
        for n in named:
            n = clean_point(n)
            if n and n not in pois:
                pois.append(n)
    
    return pois


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
        
        destinations = extract_list(block, 'destinations')
        highlights = extract_list(block, 'highlights')
        itin_descs = extract_itin_descriptions(block)
        
        # Collect POIs in priority order
        seen = set()
        points = []
        
        def add(p):
            p = clean_point(p) if p else None
            if p and p.lower() not in seen:
                seen.add(p.lower())
                points.append(p)
        
        # 1. Destinations
        for d in destinations:
            add(d)
        
        # 2. Highlights (filter non-POI ones)
        non_poi = {'Подходит детям', 'Без рюкзаков', 'Комфорт', 'Авиа', 'ЖД'}
        for h in highlights:
            skip = any(np in h for np in non_poi)
            if not skip:
                add(h)
        
        # 3. POIs from itinerary descriptions
        full_itin = ' '.join(itin_descs)
        itin_pois = extract_pois_from_itin(full_itin)
        for p in itin_pois:
            add(p)
        
        # 4. From title — extract location names
        title_parts = re.split(r'[—:,+]', title)
        for tp in title_parts:
            tp = tp.strip()
            if len(tp) > 3 and tp[0].isupper():
                add(tp)
        
        # If still < 6, try broader extraction from description
        if len(points) < 6:
            desc = extract_field(block, 'description')
            desc_pois = extract_pois_from_itin(desc)
            for p in desc_pois:
                add(p)
        
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

# Stats
counts = [len(t['points']) for t in all_tours]
under6 = [(t['title'], len(t['points'])) for t in all_tours if len(t['points']) < 6]
print(f'Tours with <6 POIs: {len(under6)}')
for name, c in under6[:10]:
    print(f'  [{c}] {name}')

# Write TSV
out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')
code_counter = 1001

max_pts = max(len(t['points']) for t in all_tours)
max_cols = max(max_pts, 6)

with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    
    header = ['Код', 'Наш тур', 'Slug', 'Дней', 'Оператор', 'Ссылка оператора']
    for i in range(1, max_cols + 1):
        header.append(f'Фото {i}')
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
        for i in range(max_cols):
            row.append(t['points'][i] if i < len(t['points']) else '')
        w.writerow(row)
        code_counter += 1

print(f'\nExported {len(all_tours)} tours, codes 1001–{code_counter-1}')
print(f'Max POIs: {max_pts}, columns: {max_cols}')
print(f'File: {out}')
