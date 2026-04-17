"""
Export tours with actual POI/location names extracted from all text fields.
Pulls from: destinations, highlights, itinerary, fullDescription, description, title.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

# ---- Noise filtering ----
NOISE_WORDS = {
    'краснодар', 'краснодара', 'краснодаре', 'россия', 'россии', 'кубань', 'кубани',
    'выезд', 'прибытие', 'возвращение', 'вход', 'трансфер', 'размещение',
    'отель', 'гостиница', 'гид', 'автобус', 'маршрут', 'программа',
    'далее', 'затем', 'после', 'утро', 'вечер', 'день', 'ночь', 'отдых',
    'группа', 'обед', 'ужин', 'завтрак', 'заселение', 'отъезд',
    'панорама', 'виды', 'прогулка', 'фотостоп', 'продолжение', 'знакомство',
    'остановка', 'москвы', 'москву', 'москва', 'подъём', 'спуск',
}
NOISE_SUBSTRINGS = [
    'выезд', 'прибытие', 'возвращение', 'обратный путь', 'трансфер',
    'размещение', 'заселение', 'свободное время', 'свободный вечер',
    'по желанию', 'по дороге', 'фотостоп', 'обзорная экскурсия',
    'пешая прогулка', 'вечерняя прогулка', 'подходит детям',
    'подходит парам', 'без рюкзаков', 'малая группа', 'загранпаспорт',
    'комфорт', 'дегустация', 'мастер-класс', 'можно попробовать',
    'завтрак', 'питание', 'ночь в ', 'переезд в ', 'остановка на ',
    'вторая часть', 'первая часть', 'фирменный магазин',
    'смотровые площадки', 'панорамная смотровая', 'местную кухню',
    'эко-тропа вокруг', 'прогулка в парке', 'рассказ экскурсовода',
    'свободное утро', 'обратный путь', 'возвращение в', 'выезд из',
    'выезд утром', 'выезд ночью', 'выезд рано', 'обзорная',
    'после прогулки', 'завершение дня', 'финал дня', 'первая остановка',
    'по пути', 'в завершении', 'в конце', 'на обратном пути',
    'экскурсовод', 'сопровождение', 'инструктаж', 'рассказывает',
]

def is_noise(text):
    if not text or len(text) < 3:
        return True
    t = text.strip().rstrip('.,:;!?')
    if not t:
        return True
    tl = t.lower()
    if tl in NOISE_WORDS:
        return True
    for ns in NOISE_SUBSTRINGS:
        if ns in tl:
            return True
    if t[0].islower():
        return True
    # Single generic words
    if ' ' not in t and '-' not in t and len(t) < 6:
        return True
    return False


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


def extract_multiline_field(block, field):
    """Extract field that may span multiple lines (like fullDescription with \\n)."""
    m = re.search(rf"{field}:\s*'((?:[^'\\]|\\.)*)'", block, re.DOTALL)
    if m:
        return m.group(1).replace('\\n', '\n')
    return ''


def extract_int(block, field):
    m = re.search(rf"{field}:\s*(\d+)", block)
    return int(m.group(1)) if m else 0


def extract_list(block, field):
    m = re.search(rf"{field}:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))


def extract_pois_from_text(text):
    """
    Extract POI names from descriptive Russian text.
    Strategy: find capitalized phrases that look like named places/landmarks.
    """
    if not text:
        return []
    
    pois = []
    
    # Pattern 1: Named landmarks with qualifiers
    # e.g. "Хаджохская теснина", "Азишская пещера", "Голубое озеро"
    landmark_pats = [
        # Adjective + noun landmark
        r'[А-ЯЁ][а-яё]+(?:ская|ское|ский|ские|ская|ское|ский)\s+(?:теснина|пещера|ущелье|каньон|водопад|водопады|долина|гора|горы|крепость|монастырь|собор|мечеть|дворец|замок|храм|башня|музей|парк|озеро|река|бухта|площадь|мост|источник|источники|перевал|хребет|ледник|вершина|обсерватория|галерея|полка|тропа|роща|скала|мыс|маяк|плато|кордон)',
        # Noun + Name: "водопады Руфабго", "озеро Рица", "гора Утюг"
        r'(?:водопад|водопады|озеро|река|гора|крепость|монастырь|собор|мечеть|дворец|замок|храм|музей|парк|перевал|хребет|мыс|маяк|ущелье|каньон|тропа|долина|источник|источники|бухта|плато|село|посёлок|станица|город|аул)\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁа-яё]+)?',
        # "Name" standalone proper nouns often used as POIs 
        # Multi-word proper nouns: "Малая Земля", "Старый Парк", "Шато-Пино"
        r'(?:Малая|Старый|Новый|Большой|Большая|Верхняя|Верхний|Нижняя|Нижний|Золотая|Красная|Святой|Горячий)\s+[А-ЯЁ][а-яё]+(?:\s+[а-яё]+)?',
        # Compound names with hyphen: "Абрау-Дюрсо", "Шато-Пино", "Лаго-Наки"
        r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+',
        # Quoted/emphasized names: «Name» or "Name"
        r'[«"][А-ЯЁ][а-яё\s-]+[»"]',
    ]
    
    for pat in landmark_pats:
        for m in re.finditer(pat, text):
            p = m.group(0).strip().strip('«»""')
            if not is_noise(p) and p not in pois:
                pois.append(p)
    
    # Pattern 2: Sentences starting with proper nouns that are likely POI names
    # Split by . and \n, check first word
    sentences = re.split(r'[.\n]', text)
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        # Check if starts with a proper noun (not a verb/common word)
        m = re.match(r'^([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?)\s+[—\-]', s)
        if m:
            name = m.group(1)
            if not is_noise(name) and name not in pois and len(name) > 3:
                # Try to get the full name: "Гузерипль — кордон..." -> "Гузерипль"
                pois.append(name)
    
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
        short_desc = extract_field(block, 'shortDescription')
        desc = extract_field(block, 'description')
        full_desc = extract_multiline_field(block, 'fullDescription')
        
        destinations = extract_list(block, 'destinations')
        highlights = extract_list(block, 'highlights')
        
        # All itinerary descriptions
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        # All itinerary titles
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)
        
        # Collect clean POIs
        seen = set()
        points = []
        
        def add(p):
            if not p:
                return
            p = p.strip().rstrip('.,:;!?')
            if is_noise(p) or len(p) < 3:
                return
            key = p.lower()
            if key not in seen:
                seen.add(key)
                points.append(p)
        
        # 1. Destinations
        for d in destinations:
            add(d)
        
        # 2. Highlights (filter non-POI)
        skip_h = {'Подходит детям', 'Без рюкзаков', 'Подходит парам', 
                  'Загранпаспорт не нужен', 'Авиа', 'ЖД'}
        for h in highlights:
            if not any(s in h for s in skip_h):
                add(h)
        
        # 3. From fullDescription (richest source)
        full_pois = extract_pois_from_text(full_desc)
        for p in full_pois:
            add(p)
        
        # 4. From itinerary descriptions
        for id_text in itin_descs:
            for p in extract_pois_from_text(id_text):
                add(p)
        
        # 5. From itinerary titles (often location names)
        for it in itin_titles:
            # Skip generic titles like "День 1", "Прибытие"
            if re.match(r'^День\s+\d+', it):
                continue
            add(it)
        
        # 6. From shortDescription
        for p in extract_pois_from_text(short_desc):
            add(p)
        
        # 7. From description
        for p in extract_pois_from_text(desc):
            add(p)
        
        # 8. Title parts (split by separators)
        for tp in re.split(r'[\u2014:,+]', title):
            tp = tp.strip()
            # Remove duration suffixes
            tp = re.sub(r'\s*\d+\s*дн[а-я]*\s*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+\s*$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+\s*$', '', tp).strip()
            if tp and len(tp) > 3 and not is_noise(tp):
                add(tp)
        
        all_tours.append({
            'slug': slug,
            'title': title,
            'days': days,
            'source_url': source_url,
            'operator': source_op,
            'points': points,
        })

# Stats
print(f'Parsed {len(all_tours)} tours')
counts = [len(t['points']) for t in all_tours]
print(f'Min: {min(counts)}, Max: {max(counts)}, Avg: {sum(counts)/len(counts):.1f}')

under6 = [(t['title'], len(t['points']), t['points']) for t in all_tours if len(t['points']) < 6]
print(f'\nTours with <6 POIs: {len(under6)}')
for name, c, pts in under6:
    print(f'  [{c}] {name}: {pts}')

# Examples
print('\n--- SAMPLE ---')
for t in all_tours[:3]:
    print(f'\n{t["title"]} ({t["days"]}d):')
    for i, p in enumerate(t['points'], 1):
        print(f'  {i}. {p}')

for t in all_tours:
    if t['slug'] == 'lago-naki-1-den':
        print(f'\n{t["title"]} ({t["days"]}d):')
        for i, p in enumerate(t['points'], 1):
            print(f'  {i}. {p}')

for t in all_tours:
    if t['slug'] == 'abhazia-3-dnya':
        print(f'\n{t["title"]} ({t["days"]}d):')
        for i, p in enumerate(t['points'], 1):
            print(f'  {i}. {p}')

# Sort and export
all_tours.sort(key=lambda t: (t['operator'], t['title']))

out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')
code_counter = 1001

max_pts = max(len(t['points']) for t in all_tours)
max_cols = max(max_pts, 6)

with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    
    header = ['Kod', 'Nash tur', 'Slug', 'Dnej', 'Operator', 'Ssylka operatora']
    for i in range(1, max_cols + 1):
        header.append(f'Foto {i}')
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

print(f'\nExported {len(all_tours)} tours, {max_cols} photo columns')
print(f'File: {out}')
