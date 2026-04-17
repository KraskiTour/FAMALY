"""
Clean export: structured data + only high-confidence patterns from text.
Prioritizes precision over recall.
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

# Landmark nouns (for "Noun ProperName" pattern)
LN = set('теснина пещера ущелье каньон водопад водопады долина гора горы '
    'крепость монастырь собор мечеть дворец замок храм башня музей парк '
    'озеро река бухта площадь мост источник источники перевал хребет ледник '
    'вершина обсерватория галерея полка тропа роща скала скалы мыс маяк '
    'плато кордон базар минарет ворота сад сады поляна пик аллея набережная '
    'лавра цитадель кремль беседка курган мемориал памятник дольмен остров '
    'залив фонтан заповедник проспект улица бульвар церковь село аул '
    'комплекс канал ферма'.split())

# Fixed "Adj + Name" combos (known proper name patterns)
FIXED = set('Малая Старый Новый Большой Большая Верхняя Верхний Нижняя Нижний '
    'Золотая Золотое Красная Святой Горячий Голубое Голубая Орлиная Водная '
    'Девичьи Мужские Белая Чёрное Мёртвое Янтарная Царское Зимний Летний '
    'Михайловский Поместье Чегемские Чегемских'.split())

# Words that are NOT proper adjectives (common descriptives)
BAD_ADJ = set('живописн красив огромн маленьк старин древн уникальн невероятн '
    'потрясающ знаменит известн популярн подземн рукотворн природн горн '
    'морск высокогорн крупнейш длинн белоснежн частн местн авторск городск '
    'классическ современн главн центральн одноимённ мемориальн пешеходн '
    'ледников термальн курортн'.split())

# Reject words
REJECT = set('краснодар россия европа москва автобус маршрут программа отель '
    'обед ужин завтрак размещение заселение отдых группа панорама виды утро вечер '
    'день ночь вход купание бассейны прогулка выезд прибытие возвращение '
    'трансфер фотостоп далее затем после отъезд остановка ростов '
    'кавказ кубань амра амры леонардо павлин '
    'кабардино-балкарии иверской'.split())

REJECT_PATS = [
    'подходит', 'загранпаспорт', 'круглый год', 'бассейн', 'дегустация',
    'свободн', 'по желанию', 'можно', 'компактно', 'без суеты',
    'без рюкзак', 'рассказ', 'экскурсовод', 'завершение', 'финал дня',
    'переезд', 'обзорная', 'увидите', 'считается', 'маршрут',
    'один из', 'вечерн', 'авиа', 'жд ', 'неспешн', 'релакс-форма',
    'красивейш', 'за один день', 'за 1 день', 'панорамн',
    'два курортн', 'два города', 'набережная 12', '12 км',
    'вид на эльбрус', 'канатная дорога', 'древние храмы',
    'целебные источник', 'пешая тропа', 'стены высотой',
    'термальные источники для', 'термальные источники в конце',
    'каньон с паровозик', 'панорама кавказа', 'морской вояж',
    'в конце дня', 'для отдыха', 'с подсветк', 'закат на',
    'всё главное', 'парк александра', 'музей александра',
    'дольмены возраст', '100+ лет', 'горный курорт',
    'деревня дольменов', 'лагуна — 16', 'берег азов',
    'историческая тамань',
]


def ok(p):
    if not p or len(p) < 4 or p[0].islower(): return False
    pl = p.lower()
    if pl in REJECT: return False
    for rp in REJECT_PATS:
        if rp in pl: return False
    if len(p) > 45: return False
    if ':' in p: return False
    # Reject standalone declined forms ending with certain suffixes
    words = p.split()
    if len(words) == 1 and re.search(r'(ой|ому|ым|ых|ом|ем|ам|ях|ами|ями|ов|ев|ии|ию|ую|ою)$', p):
        return False
    # Reject 2-word where first is declined adj like "Иверской горы"
    if len(words) == 2 and re.search(r'(ой|ого|ому|ым|ом|ем)$', words[0].lower()):
        if re.search(r'(ы|ов|ей|ях|ами|ям)$', words[1].lower()):
            return False
    return True


def clean(p):
    p = p.strip().rstrip('.,:;!?')
    p = re.sub(r'\s+(?:в|на|с|и|к|у|по|за|из|от|до|для|со)$', '', p).strip()
    p = re.sub(r'\s+и\s+[а-яё].*$', '', p).strip()
    # Trim "— long description" but keep "— short name" (max 3 words after dash)
    if ' \u2014 ' in p:
        parts = p.split(' \u2014 ')
        after = parts[1].strip()
        if len(after.split()) > 3 or after[0].islower():
            p = parts[0].strip()
        else:
            p = f'{parts[0].strip()} \u2014 {after}'
    # Remove trailing genitive region names
    p = re.sub(r'\s+(?:Балкарии|Кабардино-Балкарии|России|Кавказа|Кубани)$', '', p).strip()
    return p


def deduplicate(points):
    """Remove near-duplicates: shorter substrings of longer entries."""
    result = []
    norms = []
    for p in points:
        # Normalize: lowercase, strip common endings
        n = re.sub(r'(ой|ая|ое|ые|ого|ому|ым|ых|ий|ей|ью|ем|ам|ях|ями|ами|'
                   r'ов|ев|ом|ую|ою|ии|ию|ую|ие|ья|ье|ьё)$', '',
                   p.lower().strip())
        is_dup = False
        for i, en in enumerate(norms):
            if n == en:
                # Same normalized form — keep longer
                if len(p) > len(result[i]):
                    result[i] = p
                is_dup = True
                break
            if n in en:
                is_dup = True
                break
            if en in n:
                result[i] = p
                norms[i] = n
                is_dup = True
                break
        if not is_dup:
            result.append(p)
            norms.append(n)
    return result


def extract_from_text(text):
    """Extract only high-confidence POIs from free text."""
    if not text: return []
    pois = []

    # 1. «Quoted names» — highest confidence
    for m in re.finditer(r'[«]([^»]{3,35})[»]', text):
        n = m.group(1).strip()
        if ok(n): pois.append(n)

    # 2. Hyphenated proper nouns: Абрау-Дюрсо, Лаго-Наки
    for m in re.finditer(r'[А-ЯЁ][а-яё]+-[А-ЯЁ][а-яё]+', text):
        pois.append(m.group(0))

    # 3. "Noun + ProperName": озеро Рица, водопады Руфабго
    for m in re.finditer(r'(\w+)\s+([А-ЯЁ][а-яё]{2,})', text):
        noun = m.group(1).lower()
        name = m.group(2)
        if noun in LN and ok(name):
            full = f'{noun.capitalize()} {name}'
            pois.append(full)

    # 4. "ProperAdj + Noun": Азишская пещера, Нарзанная галерея
    for m in re.finditer(r'([А-ЯЁ][а-яё]+(?:ская|ский|ское|ские|ской|ском|ских|ским|'
                         r'нная|нный|нное|нные|нной|нным|нных))\s+(\w+)', text):
        adj = m.group(1)
        noun = m.group(2).lower()
        if any(adj.lower().startswith(ba) for ba in BAD_ADJ): continue
        if noun in LN:
            pois.append(f'{adj} {noun}')

    # 5. "Name —" paragraph starter
    for m in re.finditer(r'(?:^|\n)\s*([А-ЯЁ][а-яё]+(?:[-][А-ЯЁ][а-яё]+)?)\s*\u2014', text):
        n = m.group(1)
        if len(n) > 3 and ok(n): pois.append(n)

    # 6. "Name:" at sentence start (city/location before listing its sights)
    for m in re.finditer(r'(?:^|\.\s+)([А-ЯЁ][а-яё]{3,}(?:[-][А-ЯЁ][а-яё]+)?)\s*:', text):
        n = m.group(1)
        if ok(n): pois.append(n)

    # 7. Fixed multi-word names: Малая Земля, Старый Парк
    for m in re.finditer(r'([А-ЯЁ][а-яё]+)\s+([А-ЯЁ][а-яё]+)', text):
        if m.group(1) in FIXED:
            pois.append(f'{m.group(1)} {m.group(2)}')

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

        points = []

        # 1. Destinations (cleanest source)
        for d in destinations:
            if ok(d): points.append(d)
        if destination and ok(destination):
            points.append(destination)

        # 2. Highlights (filtered)
        for h in highlights:
            h = clean(h)
            if ok(h): points.append(h)

        # 3. Text extraction
        for src in [full_desc] + itin_descs + [short_desc, desc]:
            for p in extract_from_text(src):
                p = clean(p)
                if ok(p): points.append(p)

        # 4. Itinerary titles (split compound)
        for it in itin_titles:
            if re.match(r'^День\s+\d+', it): continue
            it = re.sub(r'\s+за\s+\d+.*$', '', it).strip()
            for part in re.split(r'\s+и\s+', it):
                part = clean(part.strip())
                if part and len(part) > 4 and ok(part) and part != title:
                    points.append(part)

        # 5. Title parts — split by dash only, not colon/comma (to avoid fragments)
        for tp in title.split('\u2014'):
            tp = tp.strip()
            tp = re.sub(r'\s*\d+\s*дн[а-я]*$', '', tp).strip()
            tp = re.sub(r'\s*на\s+\d+$', '', tp).strip()
            tp = re.sub(r'\s*за\s+\d+$', '', tp).strip()
            tp = re.sub(r'\s+на$', '', tp).strip()  # trailing "на"
            tp = re.sub(r'\s+в$', '', tp).strip()    # trailing "в"
            # Skip if same as title, too short
            if tp and tp != title and len(tp) > 3 and ok(tp):
                points.append(tp)

        # Deduplicate
        points = deduplicate(points)

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
          'abhazia-3-dnya', 'peterburg-na-vyhodnye', 'verkhnyaya-balkariya-chegem',
          'gelendzhik-more-i-skaly', 'dagestan-5-dnej',
          'abrau-novorossijsk-gelendzhik-1-den']:
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
