"""
Export tours with CLEAN location/POI names only.
Aggressively filter out noise, keep real named places and landmarks.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

# Noise phrases and words to ALWAYS skip
NOISE_EXACT = {
    'Краснодар', 'Краснодара', 'Краснодаре', 'Россия', 'России',
    'Кубань', 'Кубани', 'Москва', 'Москвы', 'Москву',
    'Выезд', 'Прибытие', 'Возвращение', 'Вход', 'Трансфер',
    'Размещение', 'Отель', 'Гостиница', 'Гид', 'Автобус',
    'Маршрут', 'Программа', 'Далее', 'Затем', 'После',
    'Утро', 'Вечер', 'День', 'Ночь', 'Отдых', 'Группа',
    'Обед', 'Ужин', 'Завтрак', 'Заселение', 'Отъезд',
    'Панорама', 'Виды', 'Прогулка', 'Фотостоп',
    'Продолжение', 'Знакомство', 'Остановка',
}

# Substring patterns that indicate noise
NOISE_PATTERNS = [
    'выезд', 'прибытие', 'возвращение', 'обратный путь', 'трансфер',
    'размещение', 'заселение', 'свободное время', 'свободный',
    'по желанию', 'по дороге', 'фотостоп', 'обзорная экскурсия',
    'пешая прогулка', 'прогулка по', 'вечерняя прогулка',
    'подходит детям', 'подходит парам', 'без рюкзаков', 'малая группа',
    'загранпаспорт', 'комфорт', 'авиа',
    'дегустация', 'мастер-класс', 'можно попробовать',
    'ужин', 'обед', 'завтрак', 'питание',
    'ночь в', 'переезд в', 'остановка на', 'над городом',
    'вторая часть', 'первая часть', 'путь к', 'поездка в',
    'территория с', 'выезд из', 'выезд утром', 'выезд ночью',
    'выезд рано', 'само озеро', 'живописн', 'невероятн',
    'завод шампанских', 'фирменный магазин', 'смотровые площадки',
    'весной парк', 'панорамная смотровая', 'местную кухню',
    'набережная', 'пляж', 'отель у моря',
    'эко-тропа вокруг озера', 'прогулка в парке',
    'вокруг озера', 'дорога проходит',
]


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


def is_noise(text):
    """Check if text is noise (not a real POI)."""
    t = text.strip()
    if not t or len(t) < 4:
        return True
    if t in NOISE_EXACT:
        return True
    tl = t.lower()
    for p in NOISE_PATTERNS:
        if p in tl:
            return True
    if t[0].islower():
        return True
    # Single generic word
    if ' ' not in t and '-' not in t and t in NOISE_EXACT:
        return True
    return False


def extract_named_places_from_text(text):
    """
    Extract named places from itinerary text.
    Look for patterns like:
      - "Name Something" (capitalized multi-word)  
      - Specific landmark patterns: "Xская пещера", "Xский каньон", etc.
    """
    places = []
    
    # Known place/landmark suffixes in Russian
    landmark_patterns = [
        r'[А-ЯЁ][а-яё]+(?:ская|ское|ский|ская|ское|ская)\s+(?:пещера|ущелье|каньон|водопад|долина|гора|крепость|монастырь|собор|мечеть|дворец|замок|храм|башня|музей|парк|озеро|река|бухта|площадь|проспект|мост|набережная|источник|перевал|хребет|ледник|вершина|обсерватория|галерея)',
        r'(?:гора|озеро|река|водопад|ущелье|крепость|монастырь|собор|мечеть|дворец|замок|храм|музей|парк|перевал|хребет)\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁа-яё]+)?',
        r'[А-ЯЁ][а-яё]+\s+(?:им\.|имени)\s+[А-ЯЁ][а-яё]+',
    ]
    
    for pat in landmark_patterns:
        for m in re.finditer(pat, text):
            p = m.group(0).strip()
            if not is_noise(p):
                places.append(p)
    
    return places


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
        
        destinations = extract_list(block, 'destinations')
        highlights = extract_list(block, 'highlights')
        
        # Get all itinerary description text
        itin_descs = []
        for m in re.finditer(r"description:\s*'([^']*)'", block):
            itin_descs.append(m.group(1))
        
        # Collect clean POIs
        seen = set()
        points = []
        
        def add(p):
            if not p or is_noise(p):
                return
            p = p.strip().rstrip('.,:;')
            if len(p) < 3:
                return
            key = p.lower()
            if key not in seen:
                seen.add(key)
                points.append(p)
        
        # 1. Destinations (always real places)
        for d in destinations:
            add(d)
        
        # 2. Highlights (filter)
        for h in highlights:
            add(h)
        
        # 3. Named places from itinerary descriptions  
        full_itin = '. '.join(itin_descs)
        for p in extract_named_places_from_text(full_itin):
            add(p)
        
        # 4. Named places from description
        for p in extract_named_places_from_text(desc):
            add(p)
        
        # 5. Title parts (split by — : ,)
        for tp in re.split(r'[—:,+]', title):
            tp = tp.strip()
            # Only add if it's a real place name (not generic)
            if tp and not is_noise(tp) and len(tp) > 3:
                add(tp)
        
        all_tours.append({
            'slug': slug,
            'title': title,
            'days': days,
            'source_url': source_url,
            'operator': source_op,
            'points': points,
        })

# Print stats
print(f'Parsed {len(all_tours)} tours')
counts = [len(t['points']) for t in all_tours]
print(f'Min points: {min(counts)}, Max: {max(counts)}, Avg: {sum(counts)/len(counts):.1f}')

under6 = [(t['title'], len(t['points']), t['points']) for t in all_tours if len(t['points']) < 6]
print(f'\nTours with <6 POIs: {len(under6)}')
for name, c, pts in under6[:20]:
    print(f'  [{c}] {name}: {pts}')

# Show a few examples
print('\n--- EXAMPLES ---')
for t in all_tours[:5]:
    print(f'{t["title"]} ({t["days"]}d): {t["points"]}')
print('...')
for t in all_tours[70:73]:
    print(f'{t["title"]} ({t["days"]}d): {t["points"]}')

# Sort
all_tours.sort(key=lambda t: (t['operator'], t['title']))

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

print(f'\nExported {len(all_tours)} tours → {out}')
print(f'Columns: {max_cols} photo slots')
