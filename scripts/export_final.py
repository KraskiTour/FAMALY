"""
FINAL: Export tours with clean POI/location names for photo briefs.
"""
import pathlib, re, csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

def find_blocks(code):
    tours, depth, start = [], 0, None
    for i, ch in enumerate(code):
        if ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                b = code[start:i+1]
                if "slug:" in b and "title:" in b: tours.append(b)
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

# ---- POI patterns ----
LN = ('теснина|пещера|пещеры|ущелье|каньон|водопад|водопады|долина|гора|горы|'
      'крепость|монастырь|собор|мечеть|дворец|замок|храм|башня|музей|парк|озеро|'
      'река|бухта|площадь|мост|источник|источники|перевал|хребет|ледник|вершина|'
      'обсерватория|галерея|полка|тропа|роща|скала|скалы|мыс|маяк|плато|кордон|'
      'базар|минарет|ворота|сад|сады|поляна|пик|аллея|набережная|лавра|цитадель|'
      'кремль|беседка|курган|мемориал|памятник|дольмен|остров|залив|фонтан|'
      'заповедник|проспект|улица|бульвар|церковь|село|аул|ферма|комплекс|канал')

COMMON_STEMS = [
    'живописн', 'красив', 'огромн', 'маленьк', 'старин', 'древн', 'уникальн',
    'невероятн', 'потрясающ', 'знаменит', 'известн', 'популярн', 'подземн',
    'рукотворн', 'природн', 'горн', 'морск', 'высокогорн', 'крупнейш', 'длинн',
    'белоснежн', 'частн', 'местн', 'авторск', 'городск', 'классическ', 'современн',
    'главн', 'центральн', 'одноимённ', 'мемориальн', 'пешеходн', 'ледников',
    'термальн', 'курортн',
]

FIXED = ('Малая|Старый|Новый|Большой|Большая|Верхняя|Верхний|Нижняя|Нижний|'
         'Золотая|Золотое|Красная|Святой|Горячий|Голубое|Голубая|Орлиная|'
         'Водная|Девичьи|Мужские|Белая|Чёрное|Мёртвое|Янтарная|Царское|'
         'Зимний|Летний|Михайловский|Поместье')

# Reject: generic words, declined forms, noise
REJECT = {
    'краснодар', 'россия', 'россии', 'российск', 'европа', 'европы', 'европе',
    'москва', 'москвы', 'автобус', 'маршрут', 'программа', 'отель', 'обед',
    'ужин', 'завтрак', 'размещение', 'заселение', 'отдых', 'группа', 'панорама',
    'виды', 'утро', 'вечер', 'день', 'ночь', 'вход', 'купание', 'бассейны',
    'прогулка', 'выезд', 'прибытие', 'возвращение', 'трансфер', 'фотостоп',
    'далее', 'затем', 'после', 'отъезд', 'остановка', 'гостиница', 'леонардо',
    'павлин', 'амры', 'ростов', 'ростова', 'государственный',
    'краснодара', 'кубани', 'кавказа', 'кавказ', 'россий',
}
REJECT_SUBS = [
    'подходит', 'загранпаспорт', 'круглый год', 'бассейн', 'дегустация',
    'мастер-класс', 'свободн', 'по желанию', 'можно', 'за 1 день',
    'компактно', 'без суеты', 'без рюкзак', 'малая группа', 'рассказ',
    'экскурсовод', 'завершение', 'финал дня', 'переезд', 'два города',
    'два курортн', 'всё главное', 'панорамн', 'от 3 лет', 'от 5 лет',
    'комфорт', 'обзорная', 'и отъезд', 'и возвращение', 'на высоте',
    'со скалами', 'на горе с', 'за спиной', 'увидите', 'особенно',
    'сужается', 'находится', 'расположен', 'открывается', 'является',
    'ведёт', 'хорош', 'зрелище', 'ощущение', 'впечатлен', 'вид на эльбрус',
    'узкоколейная', 'пешая тропа', 'монастырь на горе', 'авиа', 'жд ',
    'набережная 12', '12 км',
]

# Russian oblique case endings for single proper nouns
OBLIQUE_ENDINGS = re.compile(
    r'^[А-ЯЁ][а-яё]+(ии|ию|ией|ях|ами|ями|ой|ого|ому|ым|ых|ом|ем|ей|ов|ев|ам|'
    r'ую|ою|ьи|ью|ье|ья|ьё)$'
)

def is_ok(p):
    if not p or len(p) < 4: return False
    if p[0].islower(): return False
    pl = p.lower().strip()
    if pl in REJECT: return False
    for rs in REJECT_SUBS:
        if rs in pl: return False
    if len(p) > 50: return False
    # Reject single words in oblique case
    if ' ' not in p and '-' not in p:
        if OBLIQUE_ENDINGS.match(p): return False
    return True


def clean(p):
    p = p.strip().rstrip('.,:;!?')
    p = re.sub(r'\s+(?:в|на|с|и|к|у|по|за|из|от|до|для|со)$', '', p).strip()
    p = re.sub(r'\s+и\s+[а-яё].*$', '', p).strip()
    if ' \u2014 ' in p and len(p) > 35:
        p = p.split(' \u2014 ')[0].strip()
    return p


def norm(p):
    """Aggressive normalization for dedup."""
    n = p.lower().strip()
    n = re.sub(r'(ой|ая|ое|ые|ого|ому|ым|ых|ий|ей|ью|ем|ам|ях|ями|ами|ов|ев|ом|'
               r'ую|ою|ии|ию|ией|ьи|ья|ье|ьё)$', '', n)
    return n


def extract(text):
    if not text: return []
    pois = []
    def ta(p):
        p = clean(p)
        if is_ok(p) and p not in pois: pois.append(p)

    # Noun + ProperName
    for m in re.finditer(rf'({LN})\s+([А-ЯЁ][а-яё]+(?:[-\s][А-ЯЁа-яё]+){{0,2}})', text, re.I):
        f = m.group(0).strip()
        ta(f[0].upper() + f[1:])
    # «Quoted»
    for m in re.finditer(r'[«]([^»]{3,40})[»]', text):
        ta(m.group(1))
    # Hyphenated
    for m in re.finditer(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+', text):
        ta(m.group(0))
    # "Name —" paragraph start
    for m in re.finditer(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?(?:\s+[А-ЯЁ][а-яё]+)?)\s*[\u2014\u2013]', text):
        ta(m.group(1))
    # "Name:" sentence start
    for m in re.finditer(r'(?:^|\.\s+)([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\s*:', text):
        ta(m.group(1))
    # ProperAdj + LandmarkNoun
    for m in re.finditer(
        rf'([А-ЯЁ][а-яё]+(?:ская|ский|ское|ские|ской|ском|скую|ских|ским|'
        rf'нная|нный|нное|нные|нной|нном|нную|нных|нным))\s+({LN})', text, re.I):
        adj = m.group(1)
        if any(adj.lower().startswith(ca) for ca in COMMON_STEMS): continue
        ta(f'{adj} {m.group(2)}')
    # Fixed multi-word
    for m in re.finditer(rf'({FIXED})\s+([А-ЯЁ][а-яё]+)', text):
        ta(f'{m.group(1)} {m.group(2)}')
    # "в/на ProperNoun" cities
    for m in re.finditer(r'(?:в|на)\s+([А-ЯЁ][а-яё]{4,}(?:[-][А-ЯЁ][а-яё]+)?)\b', text):
        n = m.group(1)
        if n.lower() not in REJECT and is_ok(n): ta(n)
    return pois


# ---- Main ----
all_tours = []
for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    for block in find_blocks(code):
        slug = sf(block, 'slug')
        title = sf(block, 'title')
        if not slug or not title or title == '___': continue

        full_desc = smf(block, 'fullDescription')
        short_desc = sf(block, 'shortDescription')
        desc = sf(block, 'description')
        destinations = sl(block, 'destinations')
        destination = sf(block, 'destination')
        highlights = sl(block, 'highlights')
        itin_descs = re.findall(r"description:\s*'([^']*)'", block)
        itin_titles = re.findall(r"title:\s*'([^']*)'", block)

        seen_n = {}
        points = []

        def add(p):
            if not p: return
            p = clean(p)
            if not is_ok(p) or p == title: return
            n = norm(p)
            if n in seen_n:
                if len(p) > len(seen_n[n]):
                    idx = points.index(seen_n[n])
                    points[idx] = p
                    seen_n[n] = p
                return
            for en, ep in list(seen_n.items()):
                if n in en and n != en: return
                if en in n and en != n:
                    if ep in points: points.remove(ep)
                    del seen_n[en]
            seen_n[n] = p
            points.append(p)

        for d in destinations: add(d)
        if destination: add(destination)
        for h in highlights:
            if is_ok(h): add(h)
        for src in [full_desc] + itin_descs + [short_desc, desc]:
            for p in extract(src): add(p)
        for it in itin_titles:
            it = it.strip()
            if re.match(r'^День\s+\d+', it): continue
            it = re.sub(r'\s+за\s+\d+\s+де.*$', '', it).strip()
            parts = re.split(r'\s+и\s+', it)
            for part in parts:
                part = part.strip()
                if part and len(part) > 4 and is_ok(part) and part != title:
                    add(part)
        for tp in re.split(r'[\u2014:,+]', title):
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+$', '', tp).strip()
            if tp and tp != title and len(tp) > 3 and is_ok(tp):
                add(tp)

        all_tours.append({
            'slug': slug, 'title': title, 'days': si(block, 'durationDays'),
            'source_url': sf(block, 'sourceUrl'), 'operator': sf(block, 'sourceOperator'),
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

# Samples
print('\n--- SAMPLES ---')
for s in ['lago-naki-1-den', 'pyatigorsk-kislovodsk-1-den', 'abrau-dyurso-vinnyj-den',
          'abhazia-3-dnya', 'abrau-novorossijsk-gelendzhik-1-den',
          'peterburg-na-vyhodnye', 'verkhnyaya-balkariya-chegem',
          'gelendzhik-more-i-skaly', 'dagestan-5-dnej']:
    for t in all_tours:
        if t['slug'] == s:
            print(f'\n{t["title"]} ({t["days"]}d, {len(t["points"])} pts):')
            for i, p in enumerate(t['points'], 1):
                print(f'  {i}. {p}')

# Export
all_tours.sort(key=lambda t: (t['operator'], t['title']))
out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')
cc = 1001
mp = max(len(t['points']) for t in all_tours)
mc = max(mp, 6)
with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    w.writerow(['Kod', 'Nash tur', 'Slug', 'Dnej', 'Operator', 'Ssylka operatora'] +
               [f'Foto {i}' for i in range(1, mc+1)])
    for t in all_tours:
        row = [cc, t['title'], t['slug'], t['days'], t['operator'], t['source_url']]
        row += [t['points'][i] if i < len(t['points']) else '' for i in range(mc)]
        w.writerow(row)
        cc += 1
print(f'\nExported {len(all_tours)} tours, {mc} photo columns')
