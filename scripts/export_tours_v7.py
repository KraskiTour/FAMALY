"""
Export tours with CLEAN location/POI names for photo briefs.
Only real place names, no generic phrases, no tour titles.
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

NOISE_LOWER = {
    'краснодар', 'краснодара', 'краснодаре', 'россия', 'россии', 'кубань',
    'кубани', 'выезд', 'прибытие', 'возвращение', 'вход', 'трансфер',
    'размещение', 'отель', 'гостиница', 'гид', 'автобус', 'маршрут',
    'программа', 'далее', 'затем', 'после', 'утро', 'вечер', 'день',
    'ночь', 'отдых', 'группа', 'обед', 'ужин', 'завтрак', 'заселение',
    'отъезд', 'панорама', 'виды', 'прогулка', 'фотостоп', 'продолжение',
    'знакомство', 'остановка', 'подъём', 'спуск', 'москва', 'москвы',
    'бассейны', 'дополнительно',
}

NOISE_SUBS = [
    'выезд', 'прибытие', 'возвращение', 'обратный путь', 'трансфер',
    'размещение', 'заселение', 'свободное время', 'свободный',
    'по желанию', 'по дороге', 'фотостоп', 'обзорная экскурсия',
    'пешая прогулка', 'вечерняя прогулка', 'подходит детям',
    'подходит парам', 'подходит всем', 'без рюкзаков', 'малая группа',
    'загранпаспорт', 'дегустация', 'мастер-класс', 'можно попробовать',
    'можно искупаться', 'ночь в ', 'переезд в ', 'остановка на ',
    'фирменный магазин', 'смотровые площадки', 'панорамная смотровая',
    'местную кухню', 'рассказ экскурсовод', 'завершение дня', 'финал дня',
    'за 1 день', 'за один день', 'города за', 'круглый год',
    'под открытым небом', 'узкоколейная', 'панорамные виды',
    'два города', 'два курортных', 'краснодар за', 'дополнительно',
    'бассейны', 'термальные источники', 'термальная база',
    'вид на эльбрус',  # too generic for a photo brief
]


def is_noise(text):
    if not text or len(text) < 3:
        return True
    t = text.strip().rstrip('.,:;!?')
    if not t:
        return True
    tl = t.lower()
    if tl in NOISE_LOWER:
        return True
    for ns in NOISE_SUBS:
        if ns in tl:
            return True
    if t[0].islower():
        return True
    if ' ' not in t and '-' not in t and len(t) < 5:
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
    """Extract named places/landmarks from Russian text."""
    if not text:
        return []
    pois = []

    # 1. "Adjective + landmark-noun"
    pat1 = r'[А-ЯЁ][а-яё]+(?:ская|ское|ский|ские|ская|ской|ском|скую|ское|ским|ских)\s+(?:теснина|пещера|ущелье|каньон|водопад|водопады|долина|гора|горы|крепость|монастырь|собор|мечеть|дворец|замок|храм|башня|музей|парк|озеро|озера|река|бухта|площадь|мост|источник|источники|перевал|хребет|ледник|вершина|обсерватория|галерея|полка|тропа|роща|скала|мыс|маяк|плато|кордон|базар|базилика|минарет|ворота|сад|сады|поляна|пик|аллея|набережная|дорога|собор|церковь|лавра|крепость|цитадель)'
    for m in re.finditer(pat1, text, re.IGNORECASE):
        p = m.group(0).strip()
        if len(p) > 5:
            pois.append(p)

    # 2. "Landmark-noun + ProperName"
    pat2 = r'(?:водопад|водопады|озеро|река|гора|крепость|монастырь|собор|мечеть|дворец|замок|храм|музей|парк|перевал|хребет|мыс|маяк|ущелье|каньон|тропа|долина|источник|источники|бухта|плато|село|посёлок|станица|аул|город|базар|сад|поляна|пик|церковь|лавра|цитадель|минарет|ворота|аллея|скала|набережная)\s+[А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){0,2}'
    for m in re.finditer(pat2, text):
        p = m.group(0).strip()
        if len(p) > 5:
            pois.append(p)

    # 3. Proper nouns with «» quotes
    for m in re.finditer(r'[«\u00ab]([А-ЯЁ][^»\u00bb]{2,40})[»\u00bb]', text):
        pois.append(m.group(1).strip())

    # 4. Multi-word proper nouns: "Малая Земля", "Старый Парк", "Красная Поляна"
    pat4 = r'(?:Малая|Старый|Новый|Большой|Большая|Верхняя|Верхний|Нижняя|Нижний|Золотая|Красная|Святой|Горячий|Голубое|Голубая|Зелёная|Орлиная|Мёртвое|Чёрное|Белая)\s+[А-ЯЁ][а-яё]+(?:\s+[а-яё]+)?'
    for m in re.finditer(pat4, text):
        p = m.group(0).strip()
        if len(p) > 5:
            pois.append(p)

    # 5. Hyphenated names: "Абрау-Дюрсо", "Шато-Пино", "Лаго-Наки"
    for m in re.finditer(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+', text):
        pois.append(m.group(0))

    # 6. Sentence-starter proper nouns before dash: "Гузерипль —"
    for m in re.finditer(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?)\s+[\u2014\-]', text):
        name = m.group(1)
        if len(name) > 3:
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
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)

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
                  'Загранпаспорт не нужен', 'Авиа', 'ЖД', 'Круглый год',
                  'Без предоплаты', 'Комфорт', 'Можно искупаться летом',
                  'Дегустация шампанского', 'Бассейны под открытым небом'}
        for h in highlights:
            if h not in skip_h and not any(s in h for s in skip_h):
                add(h)

        # 3. fullDescription
        for p in extract_pois_from_text(full_desc):
            add(p)

        # 4. Itinerary descriptions
        for id_text in itin_descs:
            for p in extract_pois_from_text(id_text):
                add(p)

        # 5. Itinerary titles (skip "Day N" and "X за N дней")
        for it in itin_titles:
            if re.match(r'^День\s+\d+', it):
                continue
            if re.search(r'за\s+\d+\s+де', it):
                continue
            add(it)

        # 6. shortDescription + description
        for p in extract_pois_from_text(short_desc):
            add(p)
        for p in extract_pois_from_text(desc):
            add(p)

        # 7. Title parts — ONLY proper noun parts (not the full title itself)
        title_parts = re.split(r'[\u2014:,+]', title)
        for tp in title_parts:
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*\s*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+\s*$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+\s*$', '', tp).strip()
            if tp and len(tp) > 3 and not is_noise(tp) and tp != title:
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

# Show a few examples
print('\n--- SAMPLES ---')
samples = ['lago-naki-1-den', 'abhazia-3-dnya', 'abrau-novorossijsk-gelendzhik-1-den',
           'peterburg-na-vyhodnye', 'dagestan-5-dnej', 'krym-bolshoj-10-dnej']
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
