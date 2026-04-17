"""
Patch bogema-tours-batch2.ts: update departureCities with correct cities,
meeting points, and typical departure times based on tour type/destination.
"""
import json
import re

BATCH2_PATH = r'c:\COD\FAMALY\data\bogema-tours-batch2.ts'

with open(r'c:\COD\FAMALY\scripts\departure_data.json', encoding='utf-8') as f:
    departure_data = json.load(f)

MEETING_POINTS = {
    'novorossijsk': 'Анапское шоссе, д. 39А, ост. общ. транспорта, у ТЦ «Бон Пассаж»',
    'krasnodar': 'ул. Захарова, 3/2, ост. общ. транспорта «ТРК Сити-Центр»',
    'gelendzhik': 'ул. Туристическая, 2, АЗС «Роснефть»',
    'anapa': 'ул. Анапское шоссе, 14, ГМ «Магнит» (открытая стоянка)',
    'stavropol': 'Автовокзал',
    'rostov': 'Автовокзал',
    'majkop': 'Автовокзал',
    'goryachij-klyuch': 'По пути следования',
    'sochi': 'Автовокзал',
}

CITY_NAMES = {
    'novorossijsk': 'Новороссийск',
    'krasnodar': 'Краснодар',
    'gelendzhik': 'Геленджик',
    'anapa': 'Анапа',
    'stavropol': 'Ставрополь',
    'rostov': 'Ростов-на-Дону',
    'majkop': 'Майкоп',
    'goryachij-klyuch': 'Горячий Ключ',
    'sochi': 'Сочи',
}

# Typical departure times for Bogema tours by destination type
# Source: first 7 tours + screenshot of tour 10187
DEPARTURE_TIMES = {
    # Multi-day tours to far destinations (Crimea, Caucasus, etc): evening/night departure
    'far_multiday': {
        'novorossijsk': '19:00',
        'krasnodar': '21:40',
        'gelendzhik': '18:00',
        'anapa': '18:00',
        'goryachij-klyuch': '20:30',
        'stavropol': '23:00',
        'rostov': '17:00',
        'sochi': '16:00',
        'majkop': '20:00',
    },
    # One-day tours to nearby (Adygea, Goryachiy Klyuch, etc): early morning
    'near_oneday': {
        'novorossijsk': '06:00',
        'krasnodar': '08:40',
        'gelendzhik': '05:00',
        'anapa': '05:00',
        'goryachij-klyuch': '07:30',
        'stavropol': '06:00',
        'majkop': '08:00',
        'sochi': '05:00',
    },
    # One-day tours to Crimea: very early / night
    'crimea_oneday': {
        'novorossijsk': '04:00',
        'krasnodar': '01:30',
        'gelendzhik': '03:00',
        'anapa': '03:00',
        'goryachij-klyuch': '02:30',
    },
    # One-day tours to Krasnodar (shows, parks): morning
    'krasnodar_oneday': {
        'novorossijsk': '07:00',
        'anapa': '06:00',
        'gelendzhik': '06:00',
        'goryachij-klyuch': '08:30',
    },
    # Train tour
    'train': {
        'krasnodar': 'По расписанию поезда',
        'goryachij-klyuch': 'По расписанию поезда',
    },
}

# Classify each tour by type for time assignment
TOUR_TYPE = {
    161: 'far_multiday',   # Абхазия 3 дня
    162: 'crimea_oneday',  # Крым 1 день
    163: 'near_oneday',    # Гузерипль 1 день
    164: 'far_multiday',   # 3 республики 4 дня
    165: 'far_multiday',   # Грузия 5 дней
    166: 'near_oneday',    # Адыгея 1 день
    167: 'far_multiday',   # Дагестан 4 дня
    168: 'krasnodar_oneday',  # Горячий ключ + Краснодар 1 день
    169: 'far_multiday',   # КавМинВоды 3 дня
    170: 'near_oneday',    # Монастырь 1 день
    171: 'near_oneday',    # Адыгея 1 день
    172: 'far_multiday',   # Дагестан 4 дня
    173: 'far_multiday',   # Золотое Кольцо 6 дней
    174: 'krasnodar_oneday', # Горячий ключ 1 день
    175: 'far_multiday',   # Калмыкия 3 дня
    176: 'far_multiday',   # Абхазия 4 дня
    177: 'near_oneday',    # Монастырь 1 день
    178: 'crimea_oneday',  # Крым 1 день
    179: 'far_multiday',   # Крым 3 дня
    180: 'krasnodar_oneday',  # Ледовое шоу Краснодар 1 день
    181: 'crimea_oneday',  # Крым 1 день
    182: 'far_multiday',   # Беларусь 7 дней
    183: 'train',          # Ж/Д Петербург
    184: 'far_multiday',   # Поволжье 5 дней
    185: 'far_multiday',   # Архыз 3 дня
    186: 'far_multiday',   # Чегем 3 дня
    187: 'far_multiday',   # Домбай 4 дня
    188: 'far_multiday',   # Архыз 3 дня
    189: 'far_multiday',   # Чегем 3 дня
}

with open(BATCH2_PATH, encoding='utf-8') as f:
    content = f.read()

for tour_id_str, cities in departure_data.items():
    tour_id = int(tour_id_str)
    tour_type = TOUR_TYPE.get(tour_id, 'far_multiday')
    times = DEPARTURE_TIMES[tour_type]
    
    # Build new departureCities array
    new_cities = []
    for c in cities:
        slug = c['slug']
        city_name = CITY_NAMES.get(slug, c['city'])
        point = c['point'] if c['point'] else MEETING_POINTS.get(slug, '')
        dep_time = times.get(slug, '')
        
        new_cities.append({
            'city': city_name,
            'slug': slug,
            'meetingPoint': point,
            'departureTime': dep_time,
        })
    
    # Build TypeScript array text
    lines = []
    for nc in new_cities:
        mp = nc['meetingPoint'].replace("'", "\\'")
        dt = nc['departureTime']
        lines.append(f"      {{ city: '{nc['city']}', slug: '{nc['slug']}', meetingPoint: '{mp}', departureTime: '{dt}' }},")
    new_ts = '    departureCities: [\n' + '\n'.join(lines) + '\n    ],'
    
    # Find and replace the old departureCities block for this tour
    # Pattern: find "id: 'XXX'," ... "departureCities: [" ... "],"
    pattern = (
        r"(id: '" + str(tour_id) + r"'.*?)"
        r"departureCities: \[.*?\],"
    )
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        old_block = match.group(0)
        new_block = match.group(1) + new_ts
        content = content.replace(old_block, new_block, 1)
        print(f'  [{tour_id}] Updated: {len(new_cities)} cities')
    else:
        print(f'  [{tour_id}] WARNING: pattern not found!')

with open(BATCH2_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print('\nDone! File updated.')
