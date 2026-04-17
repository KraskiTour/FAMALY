"""
Generate bogema-tours-batch2.ts with 29 new tours from bogema.ru.
Fetches each tour page, extracts all data, outputs TypeScript.
"""
import urllib.request, ssl, re, json, html as html_mod, sys, time, textwrap

ssl._create_default_https_context = ssl._create_unverified_context
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

TOURS = [
    (161, 10187, '10187-zateryannaya-abkhaziya-goroda-prizraki-vodopad-velikan-novyj-afon-gagra-o-ritsa'),
    (162, 15780, '15780-novyj-svet-sudak-feodosiya-muzej-ajvazovskogo'),
    (163, 18726, '18726-guzeripl-po-trope-leoparda-zapovednik-termalnyj-istochnik'),
    (164, 27328, '27328-3-respubliki-kavkaza-severnaya-osetiya-ingushetiya-i-chechnya'),
    (165, 33359, '33359-sokrovishcha-gruzii-ot-vinnykh-podvalov-do-drevnikh-khramov'),
    (166, 33766, '33766-uletnyj-tur-v-adygeyu-rafting-po-reke-beloj-konnye-progulki-vozdushnye-shary'),
    (167, 45670, '45670-dagestan-derbent-makhachkala-sulakskij-kanon-gamsutl-saltinskij-vodopad'),
    (168, 45696, '45696-goryachij-klyuch-park-galitskogo-v-krasnodare-novye-lokatsii'),
    (169, 45699, '45699-kavminvody-pyatigorsk-kislovodsk-zheleznovodsk-essentuki'),
    (170, 45746, '45746-svyato-mikhajlovskij-monastyr-i-termalnyj-spa-kompleks-blagodat'),
    (171, 45769, '45769-pogruzhenie-v-gornuyu-adygeyu-dakhovskaya-panorama-paryashchaya-besedka-kreposti-meot-spa-kompleks-blagodat'),
    (172, 45770, '45770-gornyj-dagestan-za-4-dnya-sulakskij-kanon-yazyk-trollya-khunzakh-gamsutl-gunib-goor'),
    (173, 45922, '45922-13-gorodov-zolotogo-koltsa-rossii'),
    (174, 46024, '46024-goryachij-klyuch-kanatnaya-doroga-dykhanie-gor-ferma-alpak-i-kapibar'),
    (175, 46268, '46268-kalmykiya-buddijskie-khramy-tsvetenie-tyulpanov'),
    (176, 46389, '46389-abkhaziya-na-pervomaj-pogruzhenie-v-prirodu-i-traditsii'),
    (177, 46688, '46688-svyato-mikhajlovskij-monastyr-gora-fiziabgo-i-ushchele-mishoko'),
    (178, 46690, '46690-krym-za-1-den-feodosiya-sudak-staryj-krym'),
    (179, 46691, '46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj'),
    (180, 46692, '46692-ledovoe-shou-ili-averbukha-chempiony-tsvetushchij-park-galitskogo'),
    (181, 46693, '46693-dvortsy-i-parki-kryma-za-1-den-parad-tyulpanov'),
    (182, 46760, '46760-goroda-dvortsy-i-usadby-belarusi'),
    (183, 46767, '46767-zh-d-tur-v-sankt-peterburg-vse-samoe-interesnoe'),
    (184, 46787, '46787-tri-stolitsy-povolzhya-astrakhan-volgograd-elista'),
    (185, 46808, '46808-arkhyz-vesna'),
    (186, 46812, '46812-chegem-otkrytie-sezona'),
    (187, 47412, '47412-pervomaj-v-dombae-velichie-gor'),
    (188, 47461, '47461-arkhyz-gornaya-perezagruzka'),
    (189, 47492, '47492-chegem-polety-i-vodopady-zamok-shato-erken'),
]

def fetch(url, retries=2):
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=25) as resp:
                return resp.read().decode('utf-8')
        except Exception as e:
            if attempt < retries:
                time.sleep(2)
            else:
                raise

def unescape(s):
    return html_mod.unescape(s).strip()

def clean_html(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'</?(?:p|div|ul|ol|li|h[1-6]|section|article|header|footer|span|strong|em|b|i|a|table|tr|td|th|thead|tbody|img|figure|figcaption|blockquote|hr)[^>]*>', '\n', s, flags=re.IGNORECASE)
    s = re.sub(r'<[^>]+>', '', s)
    s = html_mod.unescape(s)
    lines = []
    for line in s.split('\n'):
        stripped = line.strip()
        if stripped:
            lines.append(stripped)
    return '\n'.join(lines)

NOISE_PATTERNS = [
    r'^>\s*$',
    r'^Скачать буклет\s*$',
    r'^Забронировать\s*$',
    r'^В избранное\s*$',
    r'^Бесплатная отмена',
    r'^Предоплата при бронировании',
    r'^Тур можно организовать',
    r'^индивидуально',
    r'^в любые удобные',
    r'^количества участников',
    r'^Стоимость рассчитаем',
    r'^здесь\s*$',
    r'^Места сбора группы',
    r'^Стандартная цена',
    r'^Дети и пенсионеры',
    r'^\d[\d\s]*руб\.\s*$',
    r'^Однодневные экскурсии\s*$',
    r'^Многодневные туры\s*$',
    r'^Автобусные туры\s*$',
    r'^Ж/Д туры\s*$',
    r'^Туры заграницу\s*$',
    r'^Туры по России\s*$',
    r'^Экскурсионные туры\s*$',
    r'^Новороссийск,\s*(?:Краснодар|Анапа)',
    r'^Краснодар,\s*Новороссийск',
    r'^Анапа,\s*Новороссийск',
    r'^\.\s*$',
    r'^Абхазия\s*$',
    r'^Крым\s*$',
    r'^Дагестан\s*$',
    r'^Адыгея\s*$',
    r'^Грузия\s*$',
    r'^Кавказ\s*$',
    r'^Россия\s*$',
    r'^Кабардино.?Балкария\s*$',
    r'^Калмыкия\s*$',
    r'^Беларусь\s*$',
    r'^Карачаево.?Черкесия\s*$',
    r'^Краснодарский край\s*$',
    r'^Ставропольский край\s*$',
    r'^Новороссийск,\s*(?:Геленджик|Анапа)',
    r'^Геленджик,\s*(?:Новороссийск|Анапа)',
    r'^Анапа,\s*(?:Новороссийск|Геленджик)',
    r'^Ростов',
    r'^Санкт-Петербург\s*$',
    r'^Москва\s*$',
    r'^Минск\s*$',
]

def strip_noise(text):
    """Remove known noise lines from extracted text."""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        is_noise = False
        for pattern in NOISE_PATTERNS:
            if re.match(pattern, stripped, re.IGNORECASE):
                is_noise = True
                break
        if not is_noise:
            cleaned.append(stripped)
    result = '\n'.join(cleaned)
    result = result.lstrip('> \n')
    return result

def extract_section(page, header_pattern, next_header_pattern=None):
    """Extract a section of content between header_pattern and the next section header."""
    m = re.search(header_pattern, page, re.IGNORECASE | re.DOTALL)
    if not m:
        return ''
    start = m.end()
    if next_header_pattern:
        m2 = re.search(next_header_pattern, page[start:], re.IGNORECASE | re.DOTALL)
        end = start + m2.start() if m2 else len(page)
    else:
        end = min(start + 20000, len(page))
    return page[start:end]

def extract_items_from_section(section_html):
    """Extract list items or paragraphs from an HTML section."""
    items = re.findall(r'<li[^>]*>(.*?)</li>', section_html, re.DOTALL | re.IGNORECASE)
    if items:
        return [clean_html(item).strip() for item in items if clean_html(item).strip()]
    paras = re.findall(r'<p[^>]*>(.*?)</p>', section_html, re.DOTALL | re.IGNORECASE)
    if paras:
        return [clean_html(p).strip() for p in paras if clean_html(p).strip()]
    text = clean_html(section_html)
    lines = [l.strip() for l in text.split('\n') if l.strip() and len(l.strip()) > 3]
    return lines

def extract_description(page):
    """Extract the main description from the tour page."""
    # Bogema-specific: look for the tour-detail__description or similar content blocks
    bogema_patterns = [
        r'class="tour-detail__description[^"]*"[^>]*>(.*?)(?=<div\s+class="tour-(?:nav|program|included|sidebar|dates|meeting))',
        r'class="tour-description[^"]*"[^>]*>(.*?)(?=<div\s+class="tour-)',
        r'id="opisanie"[^>]*>(.*?)(?=<(?:div|section)\s+(?:class|id)=")',
    ]
    for pattern in bogema_patterns:
        m = re.search(pattern, page, re.DOTALL | re.IGNORECASE)
        if m:
            text = clean_html(m.group(1))
            text = strip_noise(text)
            if len(text) > 50:
                return text

    # Fallback: generic description section
    section_headers = [
        r'class="[^"]*description[^"]*"',
        r'<h[23][^>]*>\s*Описание\s*</h',
        r'id="description"',
        r'Описание\s*тура',
        r'Описание\s*экскурсии',
    ]
    for pattern in section_headers:
        m = re.search(pattern, page, re.IGNORECASE)
        if m:
            start = m.end()
            end_patterns = [
                r'<h[23][^>]*>\s*(?:Программа|Включено|Маршрут|Даты|Места\s*сбора|Дополнительн)',
                r'class="[^"]*(?:program|included|itinerary|dates|meeting)[^"]*"',
            ]
            end = start + 15000
            for ep in end_patterns:
                em = re.search(ep, page[start:start+15000], re.IGNORECASE)
                if em:
                    end = start + em.start()
                    break
            text = clean_html(page[start:end])
            text = strip_noise(text)
            if len(text) > 30:
                return text

    # Last fallback: og:description
    meta_m = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"', page, re.IGNORECASE)
    if meta_m:
        return unescape(meta_m.group(1))
    meta_m = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', page, re.IGNORECASE)
    if meta_m:
        return unescape(meta_m.group(1))
    return ''

def extract_program(page):
    """Extract the tour program (itinerary) from the page."""
    program_patterns = [
        r'<h[23][^>]*>\s*Программа\s*(?:тура|экскурсии)?\s*</h[23]>',
        r'class="[^"]*program[^"]*"',
        r'id="program"',
        r'Программа\s*тура',
    ]
    for pattern in program_patterns:
        m = re.search(pattern, page, re.IGNORECASE | re.DOTALL)
        if m:
            start = m.end()
            end_patterns = [
                r'<h[23][^>]*>\s*(?:Включено|Дополнительн|Даты|Места\s*сбора|Стоимость|Важно)',
                r'class="[^"]*(?:included|excluded|dates|meeting|price)[^"]*"',
            ]
            end = start + 30000
            for ep in end_patterns:
                em = re.search(ep, page[start:start+30000], re.IGNORECASE)
                if em:
                    end = start + em.start()
                    break
            return page[start:end]
    return ''

def parse_program_days(program_html):
    """Parse multi-day program into day-by-day structure."""
    text = clean_html(program_html)
    text = strip_noise(text)

    # Try splitting by "День N" pattern
    day_splits = re.split(r'\n(?=День\s+\d+)', text)
    days = []

    for chunk in day_splits:
        chunk = chunk.strip()
        if not chunk:
            continue
        day_m = re.match(r'День\s+(\d+)\s*[.:\n]\s*(.*)', chunk, re.DOTALL)
        if day_m:
            day_num = int(day_m.group(1))
            content = day_m.group(2).strip()
            # First line of content is the title
            lines = content.split('\n', 1)
            title = lines[0].strip()[:100] if lines else f'День {day_num}'
            description = content
            if description:
                description = strip_noise(description)
                days.append({
                    'day': day_num,
                    'title': title,
                    'description': description,
                })

    if days:
        return days

    # Fallback: single block
    if text and len(text) > 50:
        days.append({
            'day': 1,
            'title': 'Программа тура',
            'description': text,
        })
    return days

def extract_included(page):
    """Extract 'Included in price' items."""
    patterns = [
        r'<h[23][^>]*>\s*(?:Включено|В\s*стоимость|Что\s*включено)[^<]*</h[23]>',
        r'Включено\s*в\s*стоимость',
    ]
    for pattern in patterns:
        m = re.search(pattern, page, re.IGNORECASE | re.DOTALL)
        if m:
            start = m.end()
            end_patterns = [
                r'<h[23][^>]*>\s*(?:Дополнительн|Не\s*включено|Даты|Места|Важно|Программа)',
                r'class="[^"]*(?:excluded|additional|dates|meeting)[^"]*"',
            ]
            end = start + 5000
            for ep in end_patterns:
                em = re.search(ep, page[start:start+5000], re.IGNORECASE)
                if em:
                    end = start + em.start()
                    break
            return extract_items_from_section(page[start:end])
    return []

def extract_excluded(page):
    """Extract 'Not included / Additional expenses' items."""
    patterns = [
        r'<h[23][^>]*>\s*(?:Дополнительные\s*расходы|Не\s*включено|За\s*дополнительную)[^<]*</h[23]>',
        r'Дополнительные\s*расходы',
        r'Не\s*включено',
    ]
    for pattern in patterns:
        m = re.search(pattern, page, re.IGNORECASE | re.DOTALL)
        if m:
            start = m.end()
            end_patterns = [
                r'<h[23][^>]*>\s*(?:Включено|Даты|Места|Важно|Программа|Описание)',
                r'class="[^"]*(?:included|dates|meeting|description)[^"]*"',
            ]
            end = start + 5000
            for ep in end_patterns:
                em = re.search(ep, page[start:start+5000], re.IGNORECASE)
                if em:
                    end = start + em.start()
                    break
            return extract_items_from_section(page[start:end])
    return []

def extract_departure_cities(page):
    """Extract departure cities from 'Места сбора группы' section."""
    cities = []
    patterns = [
        r'<h[23][^>]*>\s*Места?\s*сбора[^<]*</h[23]>',
        r'Места?\s*сбора\s*группы',
        r'class="[^"]*meeting[^"]*"',
    ]
    section = ''
    for pattern in patterns:
        m = re.search(pattern, page, re.IGNORECASE | re.DOTALL)
        if m:
            start = m.end()
            end = start + 5000
            section = page[start:end]
            break

    if not section:
        if re.search(r'Краснодар', page):
            cities.append({
                'city': 'Краснодар',
                'slug': 'krasnodar',
                'meetingPoint': '',
                'departureTime': '',
            })
        if re.search(r'Новороссийск', page):
            cities.append({
                'city': 'Новороссийск',
                'slug': 'novorossijsk',
                'meetingPoint': '',
                'departureTime': '',
            })
        return cities

    city_blocks = re.findall(r'(?:Краснодар|Новороссийск|Ростов[^<,]*|Сочи|Ставрополь|Анапа|Армавир|Майкоп|Пятигорск|Минеральные Воды|Нальчик|Москва|Санкт-Петербург)[^<]{0,500}', section, re.IGNORECASE | re.DOTALL)

    seen_cities = set()
    city_slug_map = {
        'краснодар': 'krasnodar',
        'новороссийск': 'novorossijsk',
        'ростов-на-дону': 'rostov-na-donu',
        'ростов': 'rostov-na-donu',
        'сочи': 'sochi',
        'ставрополь': 'stavropol',
        'анапа': 'anapa',
        'армавир': 'armavir',
        'майкоп': 'majkop',
        'пятигорск': 'pyatigorsk',
        'минеральные воды': 'mineralnye-vody',
        'нальчик': 'nalchik',
        'москва': 'moskva',
        'санкт-петербург': 'sankt-peterburg',
    }

    for block in city_blocks:
        block_clean = clean_html(block)
        city_m = re.match(r'(Краснодар|Новороссийск|Ростов[^\s,]*(?:\s*-?\s*на\s*-?\s*Дону)?|Сочи|Ставрополь|Анапа|Армавир|Майкоп|Пятигорск|Минеральные\s*Воды|Нальчик|Москва|Санкт-Петербург)', block_clean, re.IGNORECASE)
        if not city_m:
            continue
        city_name = city_m.group(1).strip()
        city_lower = city_name.lower().strip()
        if city_lower in seen_cities:
            continue
        seen_cities.add(city_lower)

        slug = city_slug_map.get(city_lower, city_lower.replace(' ', '-'))

        time_m = re.search(r'(\d{1,2}[.:]\d{2})', block_clean)
        dep_time = time_m.group(1).replace('.', ':') if time_m else ''

        meeting_m = re.search(r'(?:ул\.|пр\.|пл\.|ост\.|остановка|вокзал|ТЦ|ТРК|аэропорт)[^,\n]{3,100}', block_clean, re.IGNORECASE)
        meeting = meeting_m.group(0).strip() if meeting_m else ''

        cities.append({
            'city': city_name,
            'slug': slug,
            'meetingPoint': meeting,
            'departureTime': dep_time,
        })

    return cities

def extract_dates(page):
    """Extract May 2026 tour dates with prices and seats."""
    dates = []
    date_pattern = r'(\d{2})\.(\d{2})\.(\d{4})\s*[-–—]\s*(\d{2})\.(\d{2})\.(\d{4})'
    single_date_pattern = r'(\d{2})\.(\d{2})\.(\d{4})'

    # Look in both main HTML and script tags
    all_text = page
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', page, re.DOTALL)
    for s in scripts:
        all_text += '\n' + s

    # Try date range pattern
    range_matches = re.findall(date_pattern, all_text)
    for d1, m1, y1, d2, m2, y2 in range_matches:
        if y1 == '2026' and m1 == '05':
            start = f'2026-05-{d1}'
            end = f'{y2}-{m2}-{d2}'
            context_start = all_text.find(f'{d1}.{m1}.{y1}')
            context = all_text[max(0, context_start-200):context_start+500] if context_start >= 0 else ''
            price_m = re.search(r'(\d[\d\s]{2,8})\s*(?:руб|₽|р\.)', context)
            price = int(price_m.group(1).replace(' ', '').replace('\xa0', '')) if price_m else 0
            seats_m = re.search(r'(\d+)\s*(?:мест|свободн)', context, re.IGNORECASE)
            seats = int(seats_m.group(1)) if seats_m else None
            dates.append({'start': start, 'end': end, 'price': price, 'seatsLeft': seats})

    if not dates:
        single_matches = re.findall(r'(\d{2})\.05\.2026', all_text)
        seen_days = set()
        for d in single_matches:
            if d in seen_days:
                continue
            seen_days.add(d)
            start = f'2026-05-{d}'
            context_start = all_text.find(f'{d}.05.2026')
            context = all_text[max(0, context_start-200):context_start+500] if context_start >= 0 else ''
            price_m = re.search(r'(\d[\d\s]{2,8})\s*(?:руб|₽|р\.)', context)
            price = int(price_m.group(1).replace(' ', '').replace('\xa0', '')) if price_m else 0
            seats_m = re.search(r'(\d+)\s*(?:мест|свободн)', context, re.IGNORECASE)
            seats = int(seats_m.group(1)) if seats_m else None
            dates.append({'start': start, 'end': start, 'price': price, 'seatsLeft': seats})

    return dates

def extract_images(page, bogema_id, slug):
    """Extract all tour images from page HTML and script tags."""
    images = set()
    prefix = f'/images/jatoms/tours/{bogema_id}-'
    pattern = re.escape(prefix) + r'[^"\'>\s\\]+\.(?:jpg|jpeg|png|webp)'

    for m in re.finditer(pattern, page, re.IGNORECASE):
        path = m.group(0)
        if '\\' in path:
            path = path.replace('\\/', '/')
        images.add(f'https://bogema.ru{path}')

    scripts = re.findall(r'<script[^>]*>(.*?)</script>', page, re.DOTALL)
    for script in scripts:
        escaped_prefix = prefix.replace('/', '\\/')
        esc_pattern = re.escape(escaped_prefix) + r'[^"\'>\s\\]+\.(?:jpg|jpeg|png|webp)'
        for m in re.finditer(esc_pattern, script, re.IGNORECASE):
            path = m.group(0).replace('\\/', '/')
            images.add(f'https://bogema.ru{path}')
        for m in re.finditer(pattern, script, re.IGNORECASE):
            path = m.group(0)
            images.add(f'https://bogema.ru{path}')

    return sorted(images)

def extract_price(page):
    """Extract the main price from the page."""
    price_patterns = [
        r'class="[^"]*price[^"]*"[^>]*>\s*(?:от\s*)?(\d[\d\s]*)\s*(?:руб|₽)',
        r'Стоимость[^<]*?(\d[\d\s]{2,8})\s*(?:руб|₽)',
        r'(?:от|Цена|цена)\s*(\d[\d\s]{2,8})\s*(?:руб|₽|р\.)',
        r'(\d[\d\s]{2,8})\s*руб\.',
    ]
    for pattern in price_patterns:
        m = re.search(pattern, page, re.IGNORECASE)
        if m:
            p = m.group(1).replace(' ', '').replace('\xa0', '').strip()
            if p.isdigit() and int(p) > 500:
                return int(p)
    return 0

def extract_duration(page):
    """Extract tour duration in days."""
    patterns = [
        r'Продолжительность[^<]*?(\d+)\s*(?:день|дня|дней)',
        r'(\d+)\s*(?:день|дня|дней)\s*/\s*\d+\s*(?:ночь|ночи|ночей)',
        r'(\d+)\s*(?:день|дня|дней)',
    ]
    for pattern in patterns:
        m = re.search(pattern, page, re.IGNORECASE | re.DOTALL)
        if m:
            return int(m.group(1))
    return 1

def make_slug(bogema_slug):
    """Create a clean slug from the bogema slug."""
    parts = bogema_slug.split('-', 1)
    if len(parts) > 1:
        return parts[1]
    return bogema_slug

def infer_badges(title, description, destinations, duration, transport_hint):
    """Infer badges based on tour content."""
    badges = []
    text = (title + ' ' + description + ' ' + ' '.join(destinations)).lower()

    mountain_words = ['гор', 'ущель', 'канат', 'хребет', 'ледник', 'перевал', 'вершин',
                      'эльбрус', 'домбай', 'архыз', 'чегем', 'лаго-наки', 'адыге',
                      'кавказ', 'дагестан', 'осети', 'кабардин', 'балкар']
    if any(w in text for w in mountain_words):
        badges.append('mountains')

    sea_words = ['мор', 'побереж', 'пляж', 'набережн', 'корабл', 'черноморск',
                 'абхази', 'крым', 'ялта', 'гурзуф', 'судак', 'феодоси',
                 'гагр', 'новый афон', 'батуми']
    if any(w in text for w in sea_words):
        badges.append('sea')

    city_words = ['город', 'столиц', 'музе', 'дворц', 'парк галицкого', 'краснодар',
                  'санкт-петербург', 'москв', 'золотое кольц', 'беларус', 'грузи',
                  'грозный', 'минск', 'тбилиси', 'астрахан', 'волгоград']
    if any(w in text for w in city_words):
        badges.append('city')

    if 'поезд' in text or 'ж/д' in text or 'ж.д.' in text or 'жд ' in text or 'ж-д' in text:
        badges.append('train')
    else:
        badges.append('bus')

    return badges

def infer_region(title, description, destinations):
    """Infer region from tour content."""
    text = (title + ' ' + description + ' ' + ' '.join(destinations)).lower()
    region_map = {
        'абхази': 'Абхазия',
        'крым': 'Крым',
        'адыге': 'Адыгея',
        'дагестан': 'Дагестан',
        'осети': 'Северная Осетия',
        'чечн': 'Чечня',
        'ингушети': 'Ингушетия',
        'кабардин': 'Кабардино-Балкария',
        'балкар': 'Кабардино-Балкария',
        'грузи': 'Грузия',
        'краснодар': 'Краснодарский край',
        'горяч': 'Краснодарский край',
        'кавминвод': 'Ставропольский край',
        'пятигорск': 'Ставропольский край',
        'кисловодск': 'Ставропольский край',
        'ессентуки': 'Ставропольский край',
        'железноводск': 'Ставропольский край',
        'золотое кольц': 'Центральная Россия',
        'санкт-петербург': 'Санкт-Петербург',
        'беларус': 'Беларусь',
        'калмыки': 'Калмыкия',
        'элист': 'Калмыкия',
        'астрахан': 'Астраханская область',
        'волгоград': 'Волгоградская область',
        'поволжь': 'Поволжье',
        'архыз': 'Карачаево-Черкесия',
        'домбай': 'Карачаево-Черкесия',
        'чегем': 'Кабардино-Балкария',
    }
    for key, val in region_map.items():
        if key in text:
            return val
    return 'Россия'

def infer_destination(title, destinations_list, region):
    """Infer main destination."""
    text = title.lower()
    dest_map = {
        'абхази': 'Абхазия',
        'крым': 'Крым',
        'адыге': 'Адыгея',
        'дагестан': 'Дагестан',
        'осети': 'Северная Осетия',
        'чечн': 'Чечня',
        'ингушети': 'Ингушетия',
        'кабардин': 'Кабардино-Балкария',
        'грузи': 'Грузия',
        'краснодар': 'Краснодар',
        'горяч': 'Горячий Ключ',
        'кавминвод': 'Кавказские Минеральные Воды',
        'пятигорск': 'Кавказские Минеральные Воды',
        'золотое кольц': 'Золотое кольцо',
        'петербург': 'Санкт-Петербург',
        'беларус': 'Беларусь',
        'калмыки': 'Калмыкия',
        'поволжь': 'Поволжье',
        'архыз': 'Архыз',
        'домбай': 'Домбай',
        'чегем': 'Чегем',
    }
    for key, val in dest_map.items():
        if key in text:
            return val
    if destinations_list:
        return destinations_list[0]
    return region

def infer_destinations(title, description):
    """Infer key destination cities/places from title and description."""
    known_places = [
        'Абхазия', 'Гагра', 'Новый Афон', 'озеро Рица', 'Судак', 'Феодосия', 'Новый Свет',
        'Гузерипль', 'Адыгея', 'Лаго-Наки', 'Дагестан', 'Дербент', 'Махачкала',
        'Сулакский каньон', 'Гамсутль', 'Салтинский водопад',
        'Грузия', 'Тбилиси', 'Мцхета', 'Кахетия', 'Казбеги',
        'Пятигорск', 'Кисловодск', 'Железноводск', 'Ессентуки',
        'Горячий Ключ', 'Краснодар', 'Парк Галицкого',
        'Архыз', 'Домбай', 'Чегем', 'Эльбрус', 'Нальчик',
        'Крым', 'Ялта', 'Бахчисарай', 'Форос', 'Утёс',
        'Калмыкия', 'Элиста', 'Астрахань', 'Волгоград',
        'Санкт-Петербург', 'Беларусь', 'Минск',
        'Северная Осетия', 'Владикавказ', 'Ингушетия', 'Чечня', 'Грозный',
        'Хунзах', 'Гуниб', 'Гоор', 'Золотое кольцо',
        'Шато Эркен', 'Чегемские водопады',
        'Даховская', 'Мишоко', 'Свято-Михайловский монастырь',
        'Старый Крым', 'Сухум',
    ]
    text = title + ' ' + description[:500]
    places = []
    for place in known_places:
        if place.lower() in text.lower() and place not in places:
            places.append(place)

    return places[:8] if places else [title[:40]]

def infer_transport(page, badges):
    """Infer transport type."""
    if 'train' in badges:
        return 'Ж/д транспорт + автобус'
    text = page.lower()
    if 'комфортабельн' in text:
        return 'Комфортабельный автобус'
    return 'Автобус туристического класса'

def infer_meals(page, duration, included_items):
    """Infer meals info from included items list."""
    if duration <= 1:
        return 'Питание не включено'
    included_text = ' '.join(included_items).lower()
    bk_m = re.search(r'(\d+)\s*завтрак', included_text)
    if bk_m:
        n = int(bk_m.group(1))
        if n == 1:
            return '1 завтрак'
        elif n < 5:
            return f'{n} завтрака'
        else:
            return f'{n} завтраков'
    if 'завтрак' in included_text:
        nights = duration - 1
        if nights == 1:
            return '1 завтрак'
        elif nights < 5:
            return f'{nights} завтрака'
        else:
            return f'{nights} завтраков'
    if 'питание' in included_text and 'не включ' not in included_text:
        return 'Питание включено'
    if 'полный пансион' in included_text or 'трёхразовое' in included_text:
        return 'Полный пансион'
    return 'Питание не включено'

def infer_hotel(page, duration):
    """Infer hotel info."""
    if duration <= 1:
        return 'Без проживания (1 день)'
    text = clean_html(page)
    hotel_patterns = [
        r'(?:Проживание|Размещение)[:\s]+(?:в\s+)?(?:гостиниц[аеу]\s+[«"]?[\w\s-]{3,40}[»"]?|отел[ьеи]\s+[«"]?[\w\s-]{3,40}[»"]?)',
        r'(?:Гостиница|Отель)\s+[«"][\w\s-]{3,40}[»"]',
    ]
    for pattern in hotel_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            result = m.group(0).strip()
            result = re.sub(r'<[^>]+>', '', result)
            if len(result) > 5 and len(result) < 100:
                return result
    nights = duration - 1
    if nights == 1:
        return 'Гостиница (1 ночь)'
    elif nights < 5:
        return f'Гостиница ({nights} ночи)'
    else:
        return f'Гостиница ({nights} ночей)'

def infer_season(dates, duration):
    """Infer season months."""
    if duration <= 1:
        return [3, 4, 5, 6, 7, 8, 9, 10]
    return [3, 4, 5, 6, 7, 8, 9, 10, 11]

def escape_ts_string(s):
    """Escape a string for TypeScript single-quoted string."""
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '')
    return s

def format_string_array(items, indent=6):
    """Format a string array for TypeScript."""
    if not items:
        return '[]'
    lines = []
    pad = ' ' * indent
    lines.append('[')
    for item in items:
        lines.append(f"{pad}'{escape_ts_string(item)}',")
    lines.append(f"{' ' * (indent-2)}]")
    return '\n'.join(lines)

def format_tour(tour_data):
    """Format a single tour as TypeScript object."""
    t = tour_data
    lines = []
    lines.append('  {')
    lines.append(f"    id: '{t['id']}',")
    lines.append(f"    slug: '{escape_ts_string(t['slug'])}',")
    lines.append(f"    sourceUrl: '{escape_ts_string(t['sourceUrl'])}',")
    lines.append(f"    sourceOperator: 'Богема Тур',")
    lines.append(f"    title: '{escape_ts_string(t['title'])}',")

    # destinations
    lines.append(f"    destinations: {format_string_array(t['destinations'], 6)},")

    lines.append(f"    shortDescription: '{escape_ts_string(t['shortDescription'])}',")
    lines.append(f"    fullDescription: '{escape_ts_string(t['fullDescription'])}',")

    # departureCities
    lines.append('    departureCities: [')
    for dc in t['departureCities']:
        mp = escape_ts_string(dc['meetingPoint']) if dc.get('meetingPoint') else ''
        dt = dc.get('departureTime', '')
        lines.append(f"      {{ city: '{escape_ts_string(dc['city'])}', slug: '{dc['slug']}', meetingPoint: '{mp}', departureTime: '{dt}' }},")
    lines.append('    ],')

    lines.append(f"    destination: '{escape_ts_string(t['destination'])}',")
    lines.append(f"    region: '{escape_ts_string(t['region'])}',")
    lines.append(f"    durationDays: {t['durationDays']},")
    lines.append(f"    seasonMonths: {json.dumps(t['seasonMonths'])},")
    lines.append(f"    priceFrom: {t['priceFrom']},")
    lines.append(f"    oldPrice: {t['oldPrice'] if t['oldPrice'] else 'null'},")

    # nextDates
    lines.append('    nextDates: [')
    for d in t['nextDates']:
        seats = d['seatsLeft'] if d['seatsLeft'] is not None else 'null'
        lines.append(f"      {{ start: '{d['start']}', end: '{d['end']}', price: {d['price']}, seatsLeft: {seats} }},")
    lines.append('    ],')

    lines.append(f"    included: {format_string_array(t['included'], 6)},")
    lines.append(f"    excluded: {format_string_array(t['excluded'], 6)},")

    # itinerary
    lines.append('    itinerary: [')
    for day in t['itinerary']:
        lines.append('      {')
        lines.append(f"        day: {day['day']},")
        lines.append(f"        title: '{escape_ts_string(day['title'])}',")
        lines.append(f"        description: '{escape_ts_string(day['description'])}',")
        if day.get('images'):
            lines.append(f"        images: {format_string_array(day['images'], 10)},")
        else:
            lines.append('        images: [],')
        lines.append('      },')
    lines.append('    ],')

    lines.append(f"    gallery: {format_string_array(t['gallery'], 6)},")

    badges_str = ', '.join(f"'{b}'" for b in t['badges'])
    lines.append(f"    badges: [{badges_str}],")

    lines.append(f"    transport: '{escape_ts_string(t['transport'])}',")
    lines.append(f"    meals: '{escape_ts_string(t['meals'])}',")
    lines.append(f"    hotel: '{escape_ts_string(t['hotel'])}',")
    lines.append(f"    difficulty: '{t['difficulty']}',")
    lines.append(f"    minAge: {t.get('minAge', 3)},")
    lines.append(f"    seoTitle: '{escape_ts_string(t['seoTitle'])}',")
    lines.append(f"    seoDescription: '{escape_ts_string(t['seoDescription'])}',")
    lines.append(f"    highlights: {format_string_array(t['highlights'], 6)},")
    lines.append('  },')
    return '\n'.join(lines)


def process_tour(our_id, bogema_id, bogema_slug):
    """Fetch and process a single tour."""
    url = f'https://bogema.ru/tours/{bogema_slug}'
    print(f'  [{our_id}] Fetching {url} ...', flush=True)

    page = fetch(url)
    print(f'  [{our_id}] Got {len(page)} bytes, parsing...', flush=True)

    # Title
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', page, re.DOTALL)
    title = unescape(clean_html(title_m.group(1))) if title_m else bogema_slug.split('-', 1)[1].replace('-', ' ').title()

    # Description
    full_desc = extract_description(page)
    full_desc = strip_noise(full_desc) if full_desc else ''
    if not full_desc or len(full_desc) < 50:
        meta_m = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"', page, re.IGNORECASE)
        if not meta_m:
            meta_m = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', page, re.IGNORECASE)
        if meta_m:
            full_desc = unescape(meta_m.group(1))

    full_desc = strip_noise(full_desc)

    short_desc = full_desc[:200].rsplit('.', 1)[0] + '.' if len(full_desc) > 200 else full_desc
    if not short_desc or len(short_desc) < 10:
        short_desc = title

    # Duration
    duration = extract_duration(page)

    # Price
    price = extract_price(page)

    # Dates
    dates = extract_dates(page)
    if not dates and price > 0:
        dates = [{'start': '2026-05-01', 'end': '2026-05-01', 'price': price, 'seatsLeft': None}]

    # Fix prices if they are 0
    if dates and price > 0:
        for d in dates:
            if d['price'] == 0:
                d['price'] = price

    # Included / Excluded
    included = extract_included(page)
    excluded = extract_excluded(page)
    if not included:
        included = ['Транспортное обслуживание', 'Экскурсионное обслуживание', 'Страховка']
    if not excluded:
        excluded = ['Питание', 'Личные расходы']

    # Departure cities
    dep_cities = extract_departure_cities(page)
    if not dep_cities:
        dep_cities = [
            {'city': 'Краснодар', 'slug': 'krasnodar', 'meetingPoint': '', 'departureTime': ''},
        ]

    # Images
    images = extract_images(page, bogema_id, bogema_slug)

    # Program / Itinerary
    program_html = extract_program(page)
    itinerary = parse_program_days(program_html)
    if not itinerary:
        itinerary = [{
            'day': 1,
            'title': title,
            'description': full_desc if full_desc else title,
        }]

    # Strip hotel/accommodation info from last day description
    for day in itinerary:
        desc = day['description']
        # Remove trailing hotel/accommodation blocks
        desc = re.sub(r'\nПроживание\n.*$', '', desc, flags=re.DOTALL)
        desc = strip_noise(desc)
        day['description'] = desc
        day['title'] = strip_noise(day['title'])

    # Distribute images to itinerary days
    if images:
        imgs_per_day = max(2, len(images) // max(len(itinerary), 1))
        idx = 0
        for day in itinerary:
            day_imgs = images[idx:idx+imgs_per_day]
            day['images'] = day_imgs
            idx += imgs_per_day

    # Infer metadata
    destinations = infer_destinations(title, full_desc)
    region = infer_region(title, full_desc, destinations)
    destination = infer_destination(title, destinations, region)
    badges = infer_badges(title, full_desc, destinations, duration, '')
    transport = infer_transport(page, badges)
    meals = infer_meals(page, duration, included)
    hotel = infer_hotel(page, duration)
    hotel = hotel.replace('\n', ', ').strip()
    hotel = re.sub(r'^Проживание[,:\s]+', '', hotel).strip()
    if not hotel or len(hotel) < 3:
        if duration <= 1:
            hotel = 'Без проживания (1 день)'
        else:
            hotel = f'Гостиница ({duration-1} {"ночь" if duration == 2 else "ночи" if duration < 6 else "ночей"})'
    season = infer_season(dates, duration)
    slug = make_slug(bogema_slug)

    highlights = destinations[:5]

    dur_word = 'день' if duration == 1 else ('дня' if 2 <= duration <= 4 else 'дней')
    seo_title = f'Тур {title} | {duration} {dur_word} от {price:,} ₽ | KRASKI.TRAVEL'.replace(',', ' ')
    seo_desc_text = strip_noise(short_desc)[:150]
    if '.' in seo_desc_text:
        seo_desc_text = seo_desc_text.rsplit('.', 1)[0] + '.'
    seo_desc = f'{seo_desc_text} Выезд из Краснодара.'

    tour = {
        'id': str(our_id),
        'slug': slug,
        'sourceUrl': url,
        'title': title,
        'destinations': destinations,
        'shortDescription': short_desc,
        'fullDescription': full_desc,
        'departureCities': dep_cities,
        'destination': destination,
        'region': region,
        'durationDays': duration,
        'seasonMonths': season,
        'priceFrom': price if price > 0 else 5000,
        'oldPrice': None,
        'nextDates': dates,
        'included': included,
        'excluded': excluded,
        'itinerary': itinerary,
        'gallery': images,
        'badges': badges,
        'transport': transport,
        'meals': meals,
        'hotel': hotel,
        'difficulty': 'easy',
        'minAge': 3,
        'seoTitle': seo_title,
        'seoDescription': seo_desc,
        'highlights': highlights,
    }

    print(f'  [{our_id}] OK: "{title}" | {duration}d | {price}R | {len(dates)} dates | {len(images)} imgs | {len(itinerary)} days', flush=True)
    return tour


def main():
    print(f'=== Generating {len(TOURS)} Bogema tours ===\n', flush=True)

    results = []
    errors = []

    for our_id, bogema_id, bogema_slug in TOURS:
        try:
            tour = process_tour(our_id, bogema_id, bogema_slug)
            results.append(tour)
        except Exception as e:
            print(f'  [{our_id}] FAILED: {e}', flush=True)
            errors.append((our_id, bogema_slug, str(e)))
        time.sleep(0.5)

    print(f'\n=== Done: {len(results)} OK, {len(errors)} errors ===', flush=True)
    if errors:
        for eid, eslug, emsg in errors:
            print(f'  ERROR [{eid}] {eslug}: {emsg}', flush=True)

    # Generate TypeScript
    ts_lines = []
    ts_lines.append('/**')
    ts_lines.append(' * Партнёрские туры Богема Тур (bogema.ru) — Партия 2')
    ts_lines.append(f' * {len(results)} туров (IDs 161-189)')
    ts_lines.append(' * Автоматически сгенерировано скриптом generate_bogema_29.py')
    ts_lines.append(' */')
    ts_lines.append('')
    ts_lines.append("import { Tour } from '@/lib/types';")
    ts_lines.append('')
    ts_lines.append('export const bogemaToursBatch2: Tour[] = [')
    ts_lines.append('')

    for i, tour in enumerate(results):
        ts_lines.append(f'  // ─── {i+1}. {tour["title"][:60]} {"─" * max(1, 70 - len(tour["title"][:60]))}')
        ts_lines.append(format_tour(tour))
        ts_lines.append('')

    ts_lines.append('];')
    ts_lines.append('')

    output_path = r'c:\COD\FAMALY\data\bogema-tours-batch2.ts'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(ts_lines))

    print(f'\nWrote {output_path} ({len(results)} tours)', flush=True)

if __name__ == '__main__':
    main()
