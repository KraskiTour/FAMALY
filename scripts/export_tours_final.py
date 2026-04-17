"""
Final version: export tours with clean POI names for photo briefs.
Extracts real location names from all tour text fields.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

# Words to always reject as standalone POIs
REJECT_EXACT_LOWER = {
    'краснодар', 'краснодара', 'россия', 'россии', 'кубань', 'кубани',
    'москва', 'москвы', 'москву', 'европе', 'европы',
    'выезд', 'прибытие', 'возвращение', 'трансфер', 'размещение',
    'отель', 'гостиница', 'автобус', 'маршрут', 'программа',
    'утро', 'вечер', 'день', 'ночь', 'отдых', 'группа',
    'обед', 'ужин', 'завтрак', 'заселение', 'прогулка',
    'фотостоп', 'панорама', 'виды', 'далее', 'затем', 'после',
    'дополнительно', 'бассейны', 'купание', 'вход',
}

REJECT_SUBS = [
    'выезд', 'прибытие', 'возвращение', 'обратный путь',
    'свободное время', 'свободный', 'по желанию', 'по дороге',
    'подходит детям', 'подходит парам', 'подходит всем',
    'без рюкзаков', 'малая группа', 'загранпаспорт',
    'можно попробовать', 'можно искупаться', 'круглый год',
    'под открытым небом', 'панорамные виды', 'два города',
    'два курортных', 'за 1 день', 'за один день', 'за 3 дня',
    'за один', 'всё главное', 'компактно', 'без суеты',
    'рассказ экскурсовод', 'завершение дня', 'финал дня',
    'первая остановка', 'вторая часть', 'первая часть',
    'по пути', 'переезд в', 'остановка на', 'выезд из',
    'маршрут подходит', 'фирменный магазин',
    'дегустация', 'мастер-класс',
]


def is_reject(text):
    if not text or len(text) < 3:
        return True
    t = text.strip().rstrip('.,:;!?')
    if not t or t[0].islower():
        return True
    tl = t.lower()
    if tl in REJECT_EXACT_LOWER:
        return True
    for rs in REJECT_SUBS:
        if rs in tl:
            return True
    if len(t) < 4 and ' ' not in t and '-' not in t:
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


def sf(block, field):
    m = re.search(rf"{field}:\s*['\"]([^'\"]*)['\"]", block)
    return m.group(1) if m else ''


def smf(block, field):
    m = re.search(rf"{field}:\s*'((?:[^'\\]|\\.)*)'", block, re.DOTALL)
    return m.group(1).replace('\\n', '\n') if m else ''


def si(block, field):
    m = re.search(rf"{field}:\s*(\d+)", block)
    return int(m.group(1)) if m else 0


def sl(block, field):
    m = re.search(rf"{field}:\s*\[(.*?)\]", block, re.DOTALL)
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)) if m else []


# Russian adjective suffixes (all genders, cases)
ADJ_END = (
    'ский', 'ская', 'ское', 'ские', 'ской', 'ском', 'скую', 'ских', 'ским',
    'ный', 'ная', 'ное', 'ные', 'ной', 'ном', 'ную', 'ных', 'ным',
    'ний', 'няя', 'нее', 'ние', 'ней', 'нем', 'нюю', 'них', 'ним',
    'тый', 'тая', 'тое', 'тые', 'той', 'том', 'тую', 'тых', 'тым',
    'жий', 'жая', 'жее', 'жие', 'жей', 'жем', 'жую', 'жих', 'жим',
    'щий', 'щая', 'щее', 'щие', 'щей', 'щем', 'щую', 'щих', 'щим',
    'лый', 'лая', 'лое', 'лые', 'лой', 'лом', 'лую', 'лых', 'лым',
    'вый', 'вая', 'вое', 'вые', 'вой', 'вом', 'вую', 'вых', 'вым',
    'чий', 'чья', 'чье', 'чьи', 'чьей', 'чьем', 'чью', 'чьих',
)

LANDMARK_NOUNS = (
    'теснина', 'пещера', 'ущелье', 'каньон', 'водопад', 'водопады',
    'долина', 'гора', 'горы', 'горе', 'крепость', 'монастырь', 'собор',
    'мечеть', 'дворец', 'замок', 'храм', 'башня', 'музей', 'парк',
    'озеро', 'озера', 'река', 'реки', 'бухта', 'площадь', 'мост',
    'источник', 'источники', 'перевал', 'хребет', 'ледник', 'вершина',
    'обсерватория', 'галерея', 'полка', 'тропа', 'роща', 'скала',
    'скалы', 'мыс', 'маяк', 'плато', 'кордон', 'базар', 'базилика',
    'минарет', 'ворота', 'сад', 'сады', 'поляна', 'пик', 'аллея',
    'набережная', 'собор', 'церковь', 'лавра', 'цитадель', 'кремль',
    'беседка', 'курган', 'мемориал', 'памятник', 'дольмен', 'дольмены',
    'остров', 'острова', 'архипелаг', 'залив', 'пролив', 'море',
    'канал', 'фонтан', 'фонтаны', 'терраса', 'комплекс', 'заповедник',
    'проспект', 'улица', 'переулок', 'бульвар',
)

# Pattern for Adj + Noun landmark
def make_adj_noun_pat():
    adj_alt = '|'.join(ADJ_END)
    noun_alt = '|'.join(LANDMARK_NOUNS)
    return re.compile(
        rf'[А-ЯЁа-яё]+(?:{adj_alt})\s+(?:{noun_alt})(?:\s+[А-ЯЁ][а-яё]+)?',
        re.IGNORECASE
    )

# Pattern for Noun + ProperName
def make_noun_name_pat():
    noun_alt = '|'.join(LANDMARK_NOUNS)
    return re.compile(
        rf'(?:{noun_alt})\s+[А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){{0,2}}',
        re.IGNORECASE
    )

PAT_ADJ_NOUN = make_adj_noun_pat()
PAT_NOUN_NAME = make_noun_name_pat()

# Multi-word proper nouns starting with specific adjectives  
PAT_ADJ_PROPER = re.compile(
    r'(?:Малая|Старый|Новый|Большой|Большая|Верхняя|Верхний|Нижняя|Нижний|'
    r'Золотая|Золотое|Красная|Святой|Горячий|Голубое|Голубая|Зелёная|Орлиная|'
    r'Мёртвое|Чёрное|Белая|Водная|Каменный|Южный|Северный|Западный|Восточный)'
    r'\s+[А-ЯЁ][а-яё]+(?:\s+[а-яё]+)?'
)

# Hyphenated proper nouns
PAT_HYPHEN = re.compile(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+')

# Quoted names «...»
PAT_QUOTED = re.compile(r'[«\u00ab]([А-ЯЁ][^»\u00bb]{2,40})[»\u00bb]')

# "Name —" at start of paragraph/sentence
PAT_NAME_DASH = re.compile(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?)\s+[\u2014\u2013\-]')

# City/proper noun after preposition: "в Кисловодск", "по Пятигорску"
PAT_PREP_NAME = re.compile(
    r'(?:в|на|по|из|до|к|у)\s+([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)'
)

# "Name:" at start
PAT_NAME_COLON = re.compile(r'(?:^|\.\s+)([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\s*:')


def extract_pois(text):
    if not text:
        return []
    pois = []
    
    def try_add(p):
        p = p.strip().rstrip('.,:;!?')
        if p and len(p) > 3 and p not in pois:
            pois.append(p)
    
    # 1. Adj + Landmark noun
    for m in PAT_ADJ_NOUN.finditer(text):
        p = m.group(0).strip()
        # Capitalize first letter for consistency
        p = p[0].upper() + p[1:]
        try_add(p)
    
    # 2. Landmark noun + ProperName
    for m in PAT_NOUN_NAME.finditer(text):
        p = m.group(0).strip()
        p = p[0].upper() + p[1:]
        try_add(p)
    
    # 3. Multi-word proper nouns
    for m in PAT_ADJ_PROPER.finditer(text):
        try_add(m.group(0).strip())
    
    # 4. Hyphenated
    for m in PAT_HYPHEN.finditer(text):
        try_add(m.group(0))
    
    # 5. Quoted
    for m in PAT_QUOTED.finditer(text):
        try_add(m.group(1).strip())
    
    # 6. "Name —" paragraph starters
    for m in PAT_NAME_DASH.finditer(text):
        try_add(m.group(1))
    
    # 7. Preposition + ProperNoun (cities etc.)
    for m in PAT_PREP_NAME.finditer(text):
        name = m.group(1)
        if name.lower() not in REJECT_EXACT_LOWER and len(name) > 3:
            try_add(name)
    
    # 8. "Name:" at sentence start
    for m in PAT_NAME_COLON.finditer(text):
        name = m.group(1)
        if name.lower() not in REJECT_EXACT_LOWER and len(name) > 3:
            try_add(name)
    
    return pois


def clean_poi(p):
    """Clean a POI string: remove trailing description after dash, trim."""
    p = p.strip().rstrip('.,:;!?')
    # Don't include "X — description" as full string if too long
    # But short ones like "Малая Земля — мемориал" are fine as-is
    if len(p) > 50 and ' \u2014 ' in p:
        p = p.split(' \u2014 ')[0].strip()
    if len(p) > 50 and ' - ' in p:
        p = p.split(' - ')[0].strip()
    return p


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
        destination_single = sf(block, 'destination')

        destinations = sl(block, 'destinations')
        highlights = sl(block, 'highlights')
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)

        seen = set()
        points = []

        def add(p):
            if not p:
                return
            p = clean_poi(p)
            if is_reject(p):
                return
            key = p.lower()
            # Skip if a longer version already exists
            for existing_key in list(seen):
                if key in existing_key:
                    return
            # Remove shorter versions
            to_remove = [ek for ek in seen if ek in key and ek != key]
            for ek in to_remove:
                seen.discard(ek)
                points[:] = [pt for pt in points if pt.lower() != ek]
            if key not in seen:
                seen.add(key)
                points.append(p)

        # 1. Destinations array
        for d in destinations:
            add(d)

        # 2. Single destination field
        if destination_single:
            add(destination_single)

        # 3. Highlights (filter non-POI)
        skip_h_pats = [
            'подходит', 'без рюкзаков', 'загранпаспорт', 'круглый год',
            'бассейны', 'дегустация', 'можно', 'авиа', 'жд',
            'комфорт', 'от 3 лет', 'от 5 лет', 'семь', 'пар',
        ]
        for h in highlights:
            hl = h.lower()
            if not any(sp in hl for sp in skip_h_pats):
                add(h)

        # 4. fullDescription
        for p in extract_pois(full_desc):
            add(p)

        # 5. Itinerary descriptions
        for id_text in itin_descs:
            for p in extract_pois(id_text):
                add(p)

        # 6. shortDescription
        for p in extract_pois(short_desc):
            add(p)

        # 7. description
        for p in extract_pois(desc):
            add(p)

        # 8. Itinerary titles (skip generic)
        for it in itin_titles:
            if re.match(r'^День\s+\d+', it):
                continue
            if re.search(r'за\s+\d+\s+де', it):
                continue
            it_clean = it.strip()
            if it_clean and len(it_clean) > 4 and not is_reject(it_clean):
                add(it_clean)

        # 9. Title parts (split by separators, skip full title)
        for tp in re.split(r'[\u2014:,+]', title):
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*\s*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+\s*$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+\s*$', '', tp).strip()
            if tp and tp != title and len(tp) > 3 and not is_reject(tp):
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

# Show samples
print('\n--- SAMPLES ---')
samples = ['lago-naki-1-den', 'pyatigorsk-kislovodsk-1-den',
           'abrau-dyurso-vinnyj-den', 'abhazia-3-dnya',
           'abrau-novorossijsk-gelendzhik-1-den',
           'peterburg-na-vyhodnye', 'dagestan-5-dnej']
for t in all_tours:
    if t['slug'] in samples:
        print(f'\n{t["title"]} ({t["days"]}d, {len(t["points"])} pts):')
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
        row = [code_counter, t['title'], t['slug'], t['days'],
               t['operator'], t['source_url']]
        for i in range(max_cols):
            row.append(t['points'][i] if i < len(t['points']) else '')
        w.writerow(row)
        code_counter += 1

print(f'\nExported {len(all_tours)} tours, {max_cols} photo columns')
print(f'File: {out}')
