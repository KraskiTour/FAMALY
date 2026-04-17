"""
Scrape departure times and meeting points from Bogema.ru tour pages.
v2: Better parsing of "Места сбора группы" section.
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

def strip_tags(html_str):
    return re.sub(r'<[^>]+>', ' ', html_str).strip()

def extract_departure_info(html):
    """
    Extract departure info from Bogema pages.
    The structure is:
      <h2>Места сбора группы</h2>
      Then blocks per city:
        <strong>Новороссийск</strong>
        <br> 19:00, Анапское шоссе, д. 39А (остановка общ. транспорта, возле ТЦ "Бон Пассаж")
    """
    results = []
    
    # Find the "Места сбора группы" section
    section_match = re.search(
        r'(?:Места\s+сбора\s+группы|id=["\']mesta-sbora)(.*?)(?:<h[23]|<div\s+class="jatoms-tour-availability|Даты\s+и\s+наличие\s+мест|Дополнительно)',
        html, re.DOTALL | re.IGNORECASE
    )
    
    if not section_match:
        # Try wider pattern
        section_match = re.search(
            r'mesta-sbora(.*?)(?:availability|dates)',
            html, re.DOTALL | re.IGNORECASE
        )
    
    if not section_match:
        print('    No "Места сбора" section found')
        return results
    
    section = section_match.group(1)
    
    # Extract blocks: city name (bold) followed by time + address
    # Pattern: <strong>CityName</strong> ... time, address ...
    # Or: <b>CityName</b> ... time, address
    # Or: bullet point with city: time, address
    
    # Split by city name markers
    city_blocks = re.split(r'<(?:strong|b)[^>]*>', section)
    
    for block in city_blocks[1:]:  # skip first (before first city)
        # Get city name (before closing tag)
        city_match = re.match(r'(.*?)</(?:strong|b)>', block, re.DOTALL)
        if not city_match:
            continue
        
        city_raw = strip_tags(city_match.group(1)).strip()
        city_lower = city_raw.lower().strip().rstrip(':')
        
        # Try to match with known cities
        slug = None
        city_name = None
        for known_city, known_slug in CITY_SLUG_MAP.items():
            if known_city in city_lower or city_lower in known_city:
                slug = known_slug
                city_name = known_city.title()
                break
        
        if not slug:
            # Try partial match
            for known_city, known_slug in CITY_SLUG_MAP.items():
                if city_lower[:4] in known_city or known_city[:4] in city_lower:
                    slug = known_slug
                    city_name = known_city.title()
                    break
        
        if not slug:
            print(f'    Unknown city: "{city_raw}"')
            continue
        
        # Get the rest (after city name tag close)
        rest = block[city_match.end():]
        rest_text = strip_tags(rest)
        
        # Extract time: HH:MM pattern
        time_match = re.search(r'(\d{1,2}:\d{2})', rest_text)
        dep_time = time_match.group(1) if time_match else ''
        
        # Pad time with leading zero
        if dep_time and len(dep_time) == 4:
            dep_time = '0' + dep_time
        
        # Extract address: everything after the time (and comma)
        meeting_point = ''
        if time_match:
            after_time = rest_text[time_match.end():].strip()
            # Remove leading comma/period
            after_time = re.sub(r'^[,.\s]+', '', after_time).strip()
            # Take the address part (until end of line or parenthesis note)
            meeting_point = after_time.split('\n')[0].strip()
            # Clean up trailing whitespace or parenthetical notes
            meeting_point = re.sub(r'\s+', ' ', meeting_point).strip()
        
        results.append({
            'city': city_name,
            'slug': slug,
            'time': dep_time,
            'point': meeting_point,
        })
    
    return results


results_map = {}

for tour_id, url in TOURS:
    print(f'[{tour_id}] Fetching: {url.split("/")[-1][:50]}')
    try:
        html = fetch_page(url)
        departures = extract_departure_info(html)
        results_map[tour_id] = departures
        
        if departures:
            for d in departures:
                status = 'OK' if d['time'] else 'NO TIME'
                print(f'  {d["city"]:20s} {d["time"] or "??:??":>5s}  {d["point"][:50]}  [{status}]')
        else:
            print(f'  No departure info found')
        
        time.sleep(0.3)
    except Exception as e:
        print(f'  ERROR: {e}')
        results_map[tour_id] = []

# Save
with open(r'c:\COD\FAMALY\scripts\departure_data_v2.json', 'w', encoding='utf-8') as f:
    json.dump(results_map, f, ensure_ascii=False, indent=2)

# Summary
total_cities = sum(len(v) for v in results_map.values())
cities_with_time = sum(sum(1 for d in v if d['time']) for v in results_map.values())
cities_with_point = sum(sum(1 for d in v if d['point']) for v in results_map.values())
tours_with_any_time = sum(1 for v in results_map.values() if any(d['time'] for d in v))

print(f'\n=== SUMMARY ===')
print(f'Total departure entries: {total_cities}')
print(f'With time: {cities_with_time}/{total_cities}')
print(f'With meeting point: {cities_with_point}/{total_cities}')
print(f'Tours with at least one departure time: {tours_with_any_time}/{len(results_map)}')
