"""
Scrape departure times and meeting points from Bogema.ru tour pages.
Updates bogema-tours-batch2.ts with proper departure info.
"""
import urllib.request
import ssl
import re
import json
import time

ssl._create_default_https_context = ssl._create_unverified_context

TOURS = [
    (161, 'https://bogema.ru/tours/10187-zateryannaya-abkhaziya-goroda-prizraki-vodopad-velikan-novyj-afon-gagra-o-ritsa'),
    (162, 'https://bogema.ru/tours/15780-novyj-svet-sudak-feodosiya-muzej-ajvazovskogo'),
    (163, 'https://bogema.ru/tours/18726-guzeripl-po-trope-leoparda-zapovednik-termalnyj-istochnik'),
    (164, 'https://bogema.ru/tours/27328-3-respubliki-kavkaza-severnaya-osetiya-ingushetiya-i-chechnya'),
    (165, 'https://bogema.ru/tours/33359-sokrovishcha-gruzii-ot-vinnykh-podvalov-do-drevnikh-khramov'),
    (166, 'https://bogema.ru/tours/33766-uletnyj-tur-v-adygeyu-rafting-po-reke-beloj-konnye-progulki-vozdushnye-shary'),
    (167, 'https://bogema.ru/tours/45670-dagestan-derbent-makhachkala-sulakskij-kanon-gamsutl-saltinskij-vodopad'),
    (168, 'https://bogema.ru/tours/45696-goryachij-klyuch-park-galitskogo-v-krasnodare-novye-lokatsii'),
    (169, 'https://bogema.ru/tours/45699-kavminvody-pyatigorsk-kislovodsk-zheleznovodsk-essentuki'),
    (170, 'https://bogema.ru/tours/45746-svyato-mikhajlovskij-monastyr-i-termalnyj-spa-kompleks-blagodat'),
    (171, 'https://bogema.ru/tours/45769-pogruzhenie-v-gornuyu-adygeyu-dakhovskaya-panorama-paryashchaya-besedka-kreposti-meot-spa-kompleks-blagodat'),
    (172, 'https://bogema.ru/tours/45770-gornyj-dagestan-za-4-dnya-sulakskij-kanon-yazyk-trollya-khunzakh-gamsutl-gunib-goor'),
    (173, 'https://bogema.ru/tours/45922-13-gorodov-zolotogo-koltsa-rossii'),
    (174, 'https://bogema.ru/tours/46024-goryachij-klyuch-kanatnaya-doroga-dykhanie-gor-ferma-alpak-i-kapibar'),
    (175, 'https://bogema.ru/tours/46268-kalmykiya-buddijskie-khramy-tsvetenie-tyulpanov'),
    (176, 'https://bogema.ru/tours/46389-abkhaziya-na-pervomaj-pogruzhenie-v-prirodu-i-traditsii'),
    (177, 'https://bogema.ru/tours/46688-svyato-mikhajlovskij-monastyr-gora-fiziabgo-i-ushchele-mishoko'),
    (178, 'https://bogema.ru/tours/46690-krym-za-1-den-feodosiya-sudak-staryj-krym'),
    (179, 'https://bogema.ru/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj'),
    (180, 'https://bogema.ru/tours/46692-ledovoe-shou-ili-averbukha-chempiony-tsvetushchij-park-galitskogo'),
    (181, 'https://bogema.ru/tours/46693-dvortsy-i-parki-kryma-za-1-den-parad-tyulpanov'),
    (182, 'https://bogema.ru/tours/46760-goroda-dvortsy-i-usadby-belarusi'),
    (183, 'https://bogema.ru/tours/46767-zh-d-tur-v-sankt-peterburg-vse-samoe-interesnoe'),
    (184, 'https://bogema.ru/tours/46787-tri-stolitsy-povolzhya-astrakhan-volgograd-elista'),
    (185, 'https://bogema.ru/tours/46808-arkhyz-vesna'),
    (186, 'https://bogema.ru/tours/46812-chegem-otkrytie-sezona'),
    (187, 'https://bogema.ru/tours/47412-pervomaj-v-dombae-velichie-gor'),
    (188, 'https://bogema.ru/tours/47461-arkhyz-gornaya-perezagruzka'),
    (189, 'https://bogema.ru/tours/47492-chegem-polety-i-vodopady-zamok-shato-erken'),
]

KNOWN_POINTS = {
    'krasnodar': 'ул. Захарова, 3/2, ост. «ТРК Сити-Центр»',
    'novorossijsk': 'Анапское шоссе, д. 39А, у ТЦ «Бон Пассаж»',
}

CITY_SLUG_MAP = {
    'краснодар': 'krasnodar',
    'новороссийск': 'novorossijsk',
    'анапа': 'anapa',
    'ставрополь': 'stavropol',
    'ростов': 'rostov',
    'ростов-на-дону': 'rostov',
    'армавир': 'armavir',
    'майкоп': 'majkop',
    'геленджик': 'gelendzhik',
    'тимашевск': 'timashevsk',
    'кропоткин': 'kropotkin',
    'горячий ключ': 'goryachij-klyuch',
    'тихорецк': 'tihoretsk',
    'славянск-на-кубани': 'slavyansk-na-kubani',
    'туапсе': 'tuapse',
    'сочи': 'sochi',
}

def fetch_page(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

def extract_departure_info(html):
    """Extract departure cities, times, and meeting points from the 'Места сбора группы' section."""
    results = []
    
    # Pattern 1: Look for structured departure blocks
    # Bogema uses blocks like: city name, time, address
    
    # Try to find the "Места сбора группы" / "Отправление" / schedule section
    # Pattern: city name followed by time like "07:00" or "в 07:00"
    
    # First, find the schedule/departure section
    schedule_section = ''
    
    # Look for "Места сбора" or "Расписание" or "Отправление" sections
    patterns = [
        r'(?:Места\s+сбора\s+группы|Расписание\s+отправлений|Место\s+начала)(.*?)(?:<(?:h[2-4]|div\s+class)|$)',
        r'(?:Отправление|Выезд|Посадка).*?(<table.*?</table>)',
        r'class="jatoms-tour-departures"(.*?)(?:</div>\s*</div>)',
    ]
    
    for pat in patterns:
        m = re.search(pat, html, re.DOTALL | re.IGNORECASE)
        if m:
            schedule_section = m.group(1)
            break
    
    if not schedule_section:
        schedule_section = html
    
    # Look for patterns like: "Краснодар ... 07:30" or "г. Краснодар, ул.Захарова ... 07:30"
    # Or table rows with city + time + address
    
    # Pattern: table row with city, time, address
    row_pattern = r'<tr[^>]*>(.*?)</tr>'
    rows = re.findall(row_pattern, schedule_section, re.DOTALL | re.IGNORECASE)
    
    for row in rows:
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) >= 2:
            text = ' '.join(re.sub(r'<[^>]+>', ' ', c).strip() for c in cells)
            for city_name, slug in CITY_SLUG_MAP.items():
                if city_name.lower() in text.lower():
                    time_m = re.search(r'(\d{1,2}[:.]\d{2})', text)
                    time_str = time_m.group(1).replace('.', ':') if time_m else ''
                    
                    addr_m = re.search(r'(?:ул\.|пр\.|д\.|шоссе|просп|бульв|пл\.|наб\.|ост|ТЦ|ТРК|вокзал|автовокзал|ж/д)[^<,]{3,60}', text, re.IGNORECASE)
                    addr = addr_m.group(0).strip() if addr_m else ''
                    
                    results.append({
                        'city': city_name.capitalize() if city_name != 'ростов-на-дону' else 'Ростов-на-Дону',
                        'slug': slug,
                        'time': time_str,
                        'point': addr,
                    })
    
    if results:
        return results
    
    # Pattern 2: look for inline text with city + time
    # "Краснодар — 07:30, ул. Захарова 3/2"
    inline_pattern = r'(?:из\s+)?(?:г\.\s*)?(' + '|'.join(re.escape(c) for c in CITY_SLUG_MAP.keys()) + r')[\s\-—:,]*(\d{1,2}[:.]\d{2})?[^<\n]{0,100}'
    matches = re.findall(inline_pattern, html, re.IGNORECASE)
    
    seen_cities = set()
    for city_raw, time_raw in matches:
        city_lower = city_raw.lower().strip()
        if city_lower in seen_cities:
            continue
        seen_cities.add(city_lower)
        
        slug = CITY_SLUG_MAP.get(city_lower, '')
        if not slug:
            continue
            
        time_str = time_raw.replace('.', ':') if time_raw else ''
        
        results.append({
            'city': city_raw.strip().capitalize() if city_lower != 'ростов-на-дону' else 'Ростов-на-Дону',
            'slug': slug,
            'time': time_str,
            'point': '',
        })
    
    return results

def extract_departure_structured(html):
    """Try to extract from JSON-LD or structured data."""
    results = []
    
    # Look for jatoms departure info blocks
    # Pattern: blocks with city name, time, and address in structured format
    dep_blocks = re.findall(
        r'(?:departure|meeting|start|сбор|отправлен)[^{]*?\{[^}]*?(?:city|город|name)[^}]*?\}',
        html, re.IGNORECASE | re.DOTALL
    )
    
    # Also try to find departure info in script tags (JSON data)
    script_blocks = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    for script in script_blocks:
        if 'departure' in script.lower() or 'meeting' in script.lower() or 'сбор' in script.lower():
            for city_name, slug in CITY_SLUG_MAP.items():
                if city_name in script.lower():
                    time_m = re.search(city_name + r'[^"]*?(\d{1,2}:\d{2})', script, re.IGNORECASE)
                    if time_m:
                        results.append({
                            'city': city_name.capitalize(),
                            'slug': slug,
                            'time': time_m.group(1),
                            'point': '',
                        })
    
    return results

results_map = {}

for tour_id, url in TOURS:
    print(f'Fetching ID {tour_id}: {url}')
    try:
        html = fetch_page(url)
        
        departures = extract_departure_info(html)
        if not departures:
            departures = extract_departure_structured(html)
        
        # Fill in known meeting points
        for dep in departures:
            if not dep['point'] and dep['slug'] in KNOWN_POINTS:
                dep['point'] = KNOWN_POINTS[dep['slug']]
        
        results_map[tour_id] = departures
        
        if departures:
            print(f'  Found {len(departures)} cities:')
            for d in departures:
                print(f'    {d["city"]} ({d["slug"]}): {d["time"] or "no time"} | {d["point"] or "no point"}')
        else:
            print(f'  No departure info found')
        
        time.sleep(0.3)
    except Exception as e:
        print(f'  ERROR: {e}')
        results_map[tour_id] = []

# Save results as JSON for next step
with open(r'c:\COD\FAMALY\scripts\departure_data.json', 'w', encoding='utf-8') as f:
    json.dump(results_map, f, ensure_ascii=False, indent=2)

print(f'\nSaved departure data for {len(results_map)} tours to scripts/departure_data.json')

# Summary
has_time = sum(1 for v in results_map.values() if any(d['time'] for d in v))
has_point = sum(1 for v in results_map.values() if any(d['point'] for d in v))
print(f'Tours with departure times: {has_time}/{len(results_map)}')
print(f'Tours with meeting points: {has_point}/{len(results_map)}')
