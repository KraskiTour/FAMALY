"""
Export tours with CLEAN location names only.
Conservative extraction: structured data + careful NER from text.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

# ---- Block-level parsing ----

def find_tour_blocks(code):
    tours = []
    depth = 0
    start = None
    for i, ch in enumerate(code):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                block = code[start:i+1]
                if "slug:" in block and "title:" in block:
                    tours.append(block)
                start = None
    return tours

def sf(b, f):
    m = re.search(rf"{f}:\s*['\"]([^'\"]*)['\"]", b)
    return m.group(1) if m else ''

def smf(b, f):
    m = re.search(rf"{f}:\s*'((?:[^'\\]|\\.)*)'", b, re.DOTALL)
    return m.group(1).replace('\\n', '\n') if m else ''

def si(b, f):
    m = re.search(rf"{f}:\s*(\d+)", b)
    return int(m.group(1)) if m else 0

def sl(b, f):
    m = re.search(rf"{f}:\s*\[(.*?)\]", b, re.DOTALL)
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)) if m else []


# ---- POI extraction ----

LANDMARK_NOUNS = {
    'теснина', 'пещера', 'пещеры', 'ущелье', 'каньон', 'водопад', 'водопады',
    'долина', 'гора', 'горы', 'крепость', 'монастырь', 'собор', 'мечеть',
    'дворец', 'замок', 'храм', 'башня', 'музей', 'парк', 'озеро', 'река',
    'бухта', 'площадь', 'мост', 'источник', 'источники', 'перевал', 'хребет',
    'ледник', 'вершина', 'обсерватория', 'галерея', 'полка', 'тропа', 'роща',
    'скала', 'скалы', 'мыс', 'маяк', 'плато', 'кордон', 'базар', 'минарет',
    'ворота', 'сад', 'сады', 'поляна', 'пик', 'аллея', 'набережная', 'лавра',
    'цитадель', 'кремль', 'беседка', 'курган', 'мемориал', 'памятник',
    'дольмен', 'дольмены', 'остров', 'залив', 'пролив', 'фонтан', 'заповедник',
    'проспект', 'улица', 'село', 'аул', 'ступени', 'терраса',
}

# These are COMMON adjectives — we DON'T want them in "Adj+Noun" matches
COMMON_ADJS = {
    'живописн', 'красив', 'огромн', 'большой', 'маленьк', 'старин', 'древн',
    'уникальн', 'невероятн', 'потрясающ', 'знаменит', 'известн', 'популярн',
    'подземн', 'рукотворн', 'природн', 'горн', 'морск', 'высокогорн',
    'крупнейш', 'длинн', 'белоснежн', 'частн', 'местн', 'авторск',
    'городск', 'классическ', 'современн', 'главн', 'центральн',
    'одноимённ', 'одноименн', 'мемориальн', 'пешеходн', 'первый', 'второй',
    'третий', 'новый', 'старый',
}

REJECT_LOWER = {
    'краснодар', 'россия', 'россий', 'европа', 'европы', 'европе',
    'москва', 'москвы', 'автобус', 'маршрут', 'программа', 'отель',
    'обед', 'ужин', 'завтрак', 'размещение', 'заселение', 'отдых',
    'группа', 'панорама', 'виды', 'утро', 'вечер', 'день', 'ночь',
    'вход', 'купание', 'бассейны', 'дополнительно', 'прогулка',
    'выезд', 'прибытие', 'возвращение', 'трансфер', 'фотостоп',
    'далее', 'затем', 'после', 'отъезд', 'остановка', 'гостиница',
    'амры', 'государственный', 'леонардо', 'павлин',
}

REJECT_SUBS = [
    'подходит', 'загранпаспорт', 'круглый год', 'бассейн',
    'дегустация', 'мастер-класс', 'свободное время', 'свободный',
    'по желанию', 'можно', 'за 1 день', 'за один', 'компактно',
    'без суеты', 'без рюкзак', 'малая группа',
    'рассказ', 'экскурсовод', 'завершение', 'финал дня',
    'переезд в', 'два города', 'два курортн', 'маршрут',
    'всё главное', 'панорамн', 'от 3 лет', 'от 5 лет',
    'комфорт', 'авиа', 'жд ',
]


def is_ok(p):
    """Check if a POI name is acceptable (not noise)."""
    if not p or len(p) < 4:
        return False
    pl = p.lower().strip()
    if pl in REJECT_LOWER:
        return False
    for rs in REJECT_SUBS:
        if rs in pl:
            return False
    # Reject if all words are lowercase (except short prepositions inside)
    words = p.split()
    if words and words[0][0].islower():
        return False
    # Reject sentence fragments (contain verbs or long phrases)
    if len(p) > 60:
        return False
    # Reject entries with "и увидите", "особенно", "сужается" etc.
    bad_words = ['увидите', 'особенно', 'сужается', 'находится', 'расположен',
                 'открывается', 'проходит', 'появляется', 'является', 'считается',
                 'называется', 'стоит', 'ведёт', 'ведет', 'можно', 'нужно',
                 'хорош', 'красиво', 'зрелище', 'ощущение', 'впечатлен']
    for bw in bad_words:
        if bw in pl:
            return False
    return True


def extract_pois_conservative(text):
    """
    Extract only clear, named POIs from Russian text.
    Very conservative — prefers precision over recall.
    """
    if not text:
        return []
    pois = []
    
    def try_add(p):
        p = p.strip().rstrip('.,:;!?')
        # Trim trailing prepositions/articles
        p = re.sub(r'\s+(?:в|на|с|и|к|у|по|за|из|от|до|для)$', '', p).strip()
        if is_ok(p) and p not in pois:
            pois.append(p)
    
    # 1. "LandmarkNoun + ProperName" — most reliable pattern
    noun_alt = '|'.join(LANDMARK_NOUNS)
    pat1 = re.compile(
        rf'(?:{noun_alt})\s+([А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){{0,2}})',
        re.IGNORECASE
    )
    for m in pat1.finditer(text):
        full = m.group(0).strip()
        # Capitalize the noun: "озеро Рица" -> "Озеро Рица"
        try_add(full[0].upper() + full[1:])
    
    # 2. «Quoted names»
    for m in re.finditer(r'[«]([^»]{3,40})[»]', text):
        try_add(m.group(1).strip())
    
    # 3. Hyphenated proper nouns: "Абрау-Дюрсо", "Лаго-Наки"
    for m in re.finditer(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+', text):
        try_add(m.group(0))
    
    # 4. "ProperName — description" paragraph starter (take only the name)
    for m in re.finditer(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+)?)\s*[\u2014\u2013]', text):
        name = m.group(1).strip()
        if len(name) > 3:
            try_add(name)
    
    # 5. "ProperName:" (like "Пятигорск: озеро Провал")
    for m in re.finditer(r'(?:^|\.\s+)([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\s*:', text):
        try_add(m.group(1))
    
    # 6. "ProperAdj + LandmarkNoun" — only when adj looks proper (contains -ск-, -нн-, etc. from place names)
    # E.g. "Хаджохская теснина", "Нарзанная галерея", "Исаакиевская площадь"
    # Reject common descriptive adjectives
    pat6 = re.compile(
        rf'([А-ЯЁ][а-яё]+(?:ская|ский|ское|ские|ская|ской|ском|скую|ских|ским|'
        rf'нная|нный|нное|нные|нной|нном|нную|нных|нным))\s+({noun_alt})',
        re.IGNORECASE
    )
    for m in pat6.finditer(text):
        adj = m.group(1)
        # Check it's not a common adjective
        adj_lower = adj.lower()
        if any(adj_lower.startswith(ca) for ca in COMMON_ADJS):
            continue
        full = f'{adj} {m.group(2)}'
        try_add(full)
    
    # 7. Multi-word fixed names: "Малая Земля", "Старый Парк", etc.
    fixed_first = ['Малая', 'Старый', 'Новый', 'Большой', 'Большая', 'Верхняя',
                   'Верхний', 'Нижняя', 'Нижний', 'Золотая', 'Золотое',
                   'Красная', 'Святой', 'Горячий', 'Голубое', 'Голубая',
                   'Зелёная', 'Орлиная', 'Водная', 'Южный', 'Северный',
                   'Девичьи', 'Мужские', 'Белая', 'Чёрное', 'Мёртвое',
                   'Янтарная', 'Царское', 'Зимний', 'Летний', 'Михайловский']
    first_alt = '|'.join(fixed_first)
    pat7 = re.compile(rf'({first_alt})\s+([А-ЯЁ][а-яё]+)')
    for m in pat7.finditer(text):
        try_add(f'{m.group(1)} {m.group(2)}')
    
    return pois


# ---- Main processing ----

all_tours = []

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    blocks = find_tour_blocks(code)

    for block in blocks:
        slug = sf(block, 'slug')
        title = sf(block, 'title')
        if not slug or not title or title == '___':
            continue

        source_url = sf(block, 'sourceUrl')
        source_op = sf(block, 'sourceOperator')
        days = si(block, 'durationDays')
        short_desc = sf(block, 'shortDescription')
        desc = sf(block, 'description')
        full_desc = smf(block, 'fullDescription')
        destination = sf(block, 'destination')
        
        destinations = sl(block, 'destinations')
        highlights = sl(block, 'highlights')
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)

        seen_lower = set()
        points = []

        def add(p):
            if not p:
                return
            p = p.strip().rstrip('.,:;!?')
            p = re.sub(r'\s+(?:в|на|с|и|к|у|по|за|из|от|до|для)$', '', p).strip()
            if not is_ok(p):
                return
            pl = p.lower()
            # Dedup: skip if already have this or a longer version
            for ek in list(seen_lower):
                if pl == ek or (len(pl) < len(ek) and pl in ek):
                    return
            # Remove shorter version if we have a longer one
            to_remove = [ek for ek in seen_lower if ek in pl and ek != pl]
            for ek in to_remove:
                seen_lower.discard(ek)
                points[:] = [pt for pt in points if pt.lower() != ek]
            seen_lower.add(pl)
            points.append(p)

        # 1. Structured: destinations array
        for d in destinations:
            add(d)

        # 2. Structured: destination field  
        if destination:
            add(destination)

        # 3. Highlights (filter non-location ones)
        for h in highlights:
            if is_ok(h):
                add(h)

        # 4. Text extraction from richest source first
        all_text_sources = [full_desc] + itin_descs + [short_desc, desc]
        for src in all_text_sources:
            for p in extract_pois_conservative(src):
                add(p)

        # 5. Itinerary titles (usually location names)
        for it in itin_titles:
            it = it.strip()
            if re.match(r'^День\s+\d+', it):
                continue
            it = re.sub(r'\s+за\s+\d+\s+де.*$', '', it).strip()
            if it and len(it) > 4 and is_ok(it):
                add(it)

        # 6. Title parts (but never the full title itself)
        for tp in re.split(r'[\u2014:,+]', title):
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*\s*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+\s*$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+\s*$', '', tp).strip()
            if tp and tp != title and len(tp) > 3 and is_ok(tp):
                add(tp)

        all_tours.append({
            'slug': slug,
            'title': title,
            'days': days,
            'source_url': source_url,
            'operator': source_op,
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

# ---- Samples ----
print('\n--- SAMPLES ---')
samples = ['lago-naki-1-den', 'pyatigorsk-kislovodsk-1-den',
           'abrau-dyurso-vinnyj-den', 'abhazia-3-dnya',
           'abrau-novorossijsk-gelendzhik-1-den',
           'peterburg-na-vyhodnye', 'verkhnyaya-balkariya-chegem']
for t in all_tours:
    if t['slug'] in samples:
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

print(f'\nExported {len(all_tours)} tours, {max_cols} photo columns -> {out}')
