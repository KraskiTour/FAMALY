"""
Final3: Export tours with CLEAN location names.
Aggressive post-processing to remove noise and fragments.
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
    tours, depth, start = [], 0, None
    for i, ch in enumerate(code):
        if ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                b = code[start:i+1]
                if "slug:" in b and "title:" in b:
                    tours.append(b)
                start = None
    return tours

def sf(b, f):
    m = re.search(rf"{f}:\s*['\"]([^'\"]*)['\"]", b); return m.group(1) if m else ''
def smf(b, f):
    m = re.search(rf"{f}:\s*'((?:[^'\\]|\\.)*)'", b, re.DOTALL)
    return m.group(1).replace('\\n', '\n') if m else ''
def si(b, f):
    m = re.search(rf"{f}:\s*(\d+)", b); return int(m.group(1)) if m else 0
def sl(b, f):
    m = re.search(rf"{f}:\s*\[(.*?)\]", b, re.DOTALL)
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)) if m else []

# ---- Landmark patterns ----
LANDMARK_NOUNS = (
    'теснина|пещера|пещеры|ущелье|каньон|водопад|водопады|долина|гора|горы|крепость|'
    'монастырь|собор|мечеть|дворец|замок|храм|башня|музей|парк|озеро|река|бухта|'
    'площадь|мост|источник|источники|перевал|хребет|ледник|вершина|обсерватория|'
    'галерея|полка|тропа|роща|скала|скалы|мыс|маяк|плато|кордон|базар|минарет|'
    'ворота|сад|сады|поляна|пик|аллея|набережная|лавра|цитадель|кремль|беседка|'
    'курган|мемориал|памятник|дольмен|дольмены|остров|залив|фонтан|заповедник|'
    'проспект|улица|бульвар|церковь|базилика|село|аул|ферма|комплекс'
)

COMMON_ADJ_STEMS = [
    'живописн', 'красив', 'огромн', 'маленьк', 'старин', 'древн', 'уникальн',
    'невероятн', 'потрясающ', 'знаменит', 'известн', 'популярн', 'подземн',
    'рукотворн', 'природн', 'горн', 'морск', 'высокогорн', 'крупнейш', 'длинн',
    'белоснежн', 'частн', 'местн', 'авторск', 'городск', 'классическ', 'современн',
    'главн', 'центральн', 'одноимённ', 'одноименн', 'мемориальн', 'пешеходн',
    'первый', 'второй', 'третий', 'ледников', 'новый', 'старый',
]

FIXED_FIRST = (
    'Малая|Старый|Новый|Большой|Большая|Верхняя|Верхний|Нижняя|Нижний|'
    'Золотая|Золотое|Красная|Святой|Горячий|Голубое|Голубая|Зелёная|'
    'Орлиная|Водная|Южный|Северный|Девичьи|Мужские|Белая|Чёрное|'
    'Мёртвое|Янтарная|Царское|Зимний|Летний|Михайловский'
)

REJECT_LOWER = {
    'краснодар', 'россия', 'европа', 'москва', 'автобус', 'маршрут',
    'программа', 'отель', 'обед', 'ужин', 'завтрак', 'размещение',
    'заселение', 'отдых', 'группа', 'панорама', 'виды', 'утро', 'вечер',
    'день', 'ночь', 'вход', 'купание', 'бассейны', 'прогулка', 'выезд',
    'прибытие', 'возвращение', 'трансфер', 'фотостоп', 'далее', 'затем',
    'после', 'отъезд', 'остановка', 'гостиница', 'государственный',
    'россий', 'европы', 'европе', 'москвы', 'москву', 'краснодара',
}

REJECT_SUBS = [
    'подходит', 'загранпаспорт', 'круглый год', 'бассейн', 'дегустация',
    'мастер-класс', 'свободное время', 'свободный', 'свободное утро',
    'по желанию', 'можно', 'за 1 день', 'за один', 'компактно',
    'без суеты', 'без рюкзак', 'малая группа', 'рассказ', 'экскурсовод',
    'завершение', 'финал дня', 'переезд в', 'два города', 'маршрут',
    'всё главное', 'панорамн', 'от 3 лет', 'от 5 лет', 'комфорт',
    'обзорная экскурсия', 'обзорная ', 'и отъезд', 'и возвращение',
    'на высоте', 'со скалами', 'на горе с', 'за спиной',
    'увидите', 'особенно', 'сужается', 'находится', 'расположен',
    'открывается', 'является', 'считается', 'называется', 'ведёт',
    'хорош', 'зрелище', 'ощущение', 'впечатлен', 'вид на эльбрус',
    'узкоколейная', 'горы за', 'и подземн', 'и прогулк', 'вечерний',
    'горы мезмая', 'пешая тропа', 'авиа', 'жд ',
]


def is_ok(p):
    if not p or len(p) < 4: return False
    pl = p.lower().strip()
    if pl in REJECT_LOWER: return False
    for rs in REJECT_SUBS:
        if rs in pl: return False
    if p[0].islower(): return False
    if len(p) > 55: return False
    return True


def clean_poi(p):
    """Post-process a POI: trim fragments, fix case issues."""
    p = p.strip().rstrip('.,:;!?')
    # Trim trailing prepositions
    p = re.sub(r'\s+(?:в|на|с|и|к|у|по|за|из|от|до|для|со)$', '', p).strip()
    # Trim "и + lowercase_word" at end: "Водопады Руфабго и подземная" -> "Водопады Руфабго"
    p = re.sub(r'\s+и\s+[а-яё].*$', '', p).strip()
    # Trim "— description" if too long
    if ' \u2014 ' in p and len(p) > 40:
        p = p.split(' \u2014 ')[0].strip()
    # Trim "- description" if long
    if ' - ' in p and len(p) > 40:
        p = p.split(' - ')[0].strip()
    return p


def normalize_for_dedup(p):
    """Normalize a POI string for deduplication: strip case endings, lowercase."""
    n = p.lower().strip()
    # Remove common case suffixes to catch "пещера/пещеры/пещеру", "монастырь/монастыря"
    n = re.sub(r'(ой|ая|ое|ые|ого|ому|ым|ых|ий|ей|ью|ем|ам|ам|ях|ями)$', '', n)
    n = re.sub(r'(ов|ев|ей|ях|ами|ями|ом|ем|ам|ий|ая|ое|ые|ого|ому|ым|ых)$', '', n)
    return n


def extract_pois(text):
    if not text: return []
    pois = []
    
    def try_add(p):
        p = clean_poi(p)
        if is_ok(p) and p not in pois:
            pois.append(p)
    
    # 1. "LandmarkNoun + ProperName"
    pat1 = re.compile(rf'({LANDMARK_NOUNS})\s+([А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){{0,2}})', re.I)
    for m in pat1.finditer(text):
        full = m.group(0).strip()
        full = full[0].upper() + full[1:]
        try_add(full)
    
    # 2. «Quoted»
    for m in re.finditer(r'[«]([^»]{3,40})[»]', text):
        try_add(m.group(1))
    
    # 3. Hyphenated proper nouns
    for m in re.finditer(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+', text):
        try_add(m.group(0))
    
    # 4. "ProperName —" paragraph starters
    for m in re.finditer(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+)?)\s*[\u2014\u2013]', text):
        try_add(m.group(1))
    
    # 5. "ProperName:" sentence start
    for m in re.finditer(r'(?:^|\.\s+)([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\s*:', text):
        try_add(m.group(1))
    
    # 6. ProperAdj + LandmarkNoun (only proper adjectives)
    pat6 = re.compile(
        rf'([А-ЯЁ][а-яё]+(?:ская|ский|ское|ские|ской|ском|скую|ских|ским|'
        rf'нная|нный|нное|нные|нной|нном|нную|нных|нным))\s+({LANDMARK_NOUNS})', re.I
    )
    for m in pat6.finditer(text):
        adj = m.group(1)
        if any(adj.lower().startswith(ca) for ca in COMMON_ADJ_STEMS):
            continue
        try_add(f'{adj} {m.group(2)}')
    
    # 7. Fixed multi-word names
    pat7 = re.compile(rf'({FIXED_FIRST})\s+([А-ЯЁ][а-яё]+)')
    for m in pat7.finditer(text):
        try_add(f'{m.group(1)} {m.group(2)}')
    
    # 8. "в/на + ProperNoun" for cities
    for m in re.finditer(r'(?:в|на)\s+([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\b', text):
        name = m.group(1)
        if name.lower() not in REJECT_LOWER and len(name) > 4:
            try_add(name)
    
    return pois


# ---- Main ----
all_tours = []

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    for block in find_tour_blocks(code):
        slug = sf(block, 'slug')
        title = sf(block, 'title')
        if not slug or not title or title == '___': continue

        source_url = sf(block, 'sourceUrl')
        source_op = sf(block, 'sourceOperator')
        days = si(block, 'durationDays')
        full_desc = smf(block, 'fullDescription')
        short_desc = sf(block, 'shortDescription')
        desc = sf(block, 'description')
        destination = sf(block, 'destination')
        destinations = sl(block, 'destinations')
        highlights = sl(block, 'highlights')
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)

        seen_norm = {}  # norm -> (original, idx)
        points = []

        def add(p):
            if not p: return
            p = clean_poi(p)
            if not is_ok(p): return
            # Don't add if it's the full tour title
            if p == title: return
            norm = normalize_for_dedup(p)
            if norm in seen_norm:
                existing = seen_norm[norm]
                if len(p) > len(existing):
                    idx = points.index(existing)
                    points[idx] = p
                    seen_norm[norm] = p
                return
            # Check substring dedup
            for enorm, ep in list(seen_norm.items()):
                if norm in enorm and norm != enorm:
                    return  # shorter version already in longer form
                if enorm in norm and enorm != norm:
                    # Replace shorter with longer
                    if ep in points:
                        points.remove(ep)
                    del seen_norm[enorm]
            seen_norm[norm] = p
            points.append(p)

        # 1. Destinations
        for d in destinations:
            add(d)
        if destination:
            add(destination)

        # 2. Highlights
        for h in highlights:
            if is_ok(h):
                add(h)

        # 3. POIs from text
        for src in [full_desc] + itin_descs + [short_desc, desc]:
            for p in extract_pois(src):
                add(p)

        # 4. Itinerary titles
        for it in itin_titles:
            it = it.strip()
            if re.match(r'^День\s+\d+', it): continue
            it = re.sub(r'\s+за\s+\d+\s+де.*$', '', it).strip()
            # Split compound titles by "и" if both parts are proper nouns
            parts = re.split(r'\s+и\s+', it)
            for part in parts:
                part = part.strip()
                if part and len(part) > 4 and is_ok(part) and part != title:
                    add(part)

        # 5. Title parts
        for tp in re.split(r'[\u2014:,+]', title):
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*\s*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+\s*$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+\s*$', '', tp).strip()
            if tp and tp != title and len(tp) > 3 and is_ok(tp):
                add(tp)

        all_tours.append({
            'slug': slug, 'title': title, 'days': days,
            'source_url': source_url, 'operator': source_op,
            'points': points,
        })

# ---- Stats ----
print(f'Parsed {len(all_tours)} tours')
counts = [len(t['points']) for t in all_tours]
print(f'Min: {min(counts)}, Max: {max(counts)}, Avg: {sum(counts)/len(counts):.1f}')

under6 = [(t['title'], len(t['points']), t['points']) for t in all_tours if len(t['points']) < 6]
print(f'\nTours with <6 POIs: {len(under6)}')
for name, c, pts in under6:
    print(f'  [{c}] {name}: {pts}')

# Samples
print('\n--- SAMPLES ---')
for s in ['lago-naki-1-den', 'pyatigorsk-kislovodsk-1-den', 'abrau-dyurso-vinnyj-den',
          'abhazia-3-dnya', 'abrau-novorossijsk-gelendzhik-1-den',
          'peterburg-na-vyhodnye', 'verkhnyaya-balkariya-chegem',
          'gelendzhik-more-i-skaly', 'goryachij-klyuch-kapibary-alpaki',
          'termalnye-istochniki-adygeya']:
    for t in all_tours:
        if t['slug'] == s:
            print(f'\n{t["title"]} ({t["days"]}d, {len(t["points"])} pts):')
            for i, p in enumerate(t['points'], 1):
                print(f'  {i}. {p}')

# ---- Export ----
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
        row = [code_counter, t['title'], t['slug'], t['days'],
               t['operator'], t['source_url']]
        for i in range(max_cols):
            row.append(t['points'][i] if i < len(t['points']) else '')
        w.writerow(row)
        code_counter += 1

print(f'\nExported {len(all_tours)} tours, {max_cols} photo columns')
