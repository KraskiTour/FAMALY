"""
Add Anapa and Gelendzhik to bogema-tours.ts (first batch, IDs 154-160).
Also fix tour 157 (park Galitskogo) to add Krasnodar.
"""
import re

FILEPATH = r'c:\COD\FAMALY\data\bogema-tours.ts'

ANAPA = "      { city: 'Анапа', slug: 'anapa', meetingPoint: 'ул. Анапское шоссе, 14, ГМ «Магнит» (открытая стоянка)', departureTime: 'ATIME' },"
GELENDZHIK = "      { city: 'Геленджик', slug: 'gelendzhik', meetingPoint: 'ул. Туристическая, 2, АЗС «Роснефть»', departureTime: 'GTIME' },"

# Tour-specific times for Anapa and Gelendzhik based on tour type
TOUR_TIMES = {
    # ID 154: Крым 1 день (ночной выезд)
    '154': {'anapa': '03:00', 'gelendzhik': '03:00'},
    # ID 155: Гуамское ущелье 1 день (утро) 
    '155': {'anapa': '05:00', 'gelendzhik': '05:00'},
    # ID 156: Лаго-Наки 1 день (утро)
    '156': {'anapa': '05:00', 'gelendzhik': '05:00'},
    # ID 157: Краснодар парк Галицкого 1 день (утро) - also needs Krasnodar added
    '157': {'anapa': '06:00', 'gelendzhik': '06:00'},
    # ID 158: Северная Осетия многодневный (вечер)
    '158': {'anapa': '18:00', 'gelendzhik': '18:00'},
    # ID 159: Чечня многодневный (вечер)
    '159': {'anapa': '18:00', 'gelendzhik': '18:00'},
    # ID 160: Кабардино-Балкария многодневный (вечер)
    '160': {'anapa': '18:00', 'gelendzhik': '18:00'},
}

with open(FILEPATH, encoding='utf-8') as f:
    content = f.read()

for tour_id, times in TOUR_TIMES.items():
    # Find the departureCities block for this tour
    pattern = r"(id: '" + tour_id + r"'.*?departureCities: \[)(.*?)(\s*\],)"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"  [{tour_id}] NOT FOUND!")
        continue
    
    existing = match.group(2)
    
    # Check if Anapa already there
    has_anapa = 'anapa' in existing
    has_gelendzhik = 'gelendzhik' in existing
    
    additions = []
    if not has_anapa:
        additions.append(ANAPA.replace('ATIME', times['anapa']))
    if not has_gelendzhik:
        additions.append(GELENDZHIK.replace('GTIME', times['gelendzhik']))
    
    if additions:
        new_block = existing.rstrip() + '\n' + '\n'.join(additions)
        old_full = match.group(1) + match.group(2) + match.group(3)
        new_full = match.group(1) + new_block + match.group(3)
        content = content.replace(old_full, new_full, 1)
        print(f"  [{tour_id}] Added {len(additions)} cities")
    else:
        print(f"  [{tour_id}] Already has both cities")

# Special fix: tour 157 needs Krasnodar added
# Check if it already has krasnodar
pattern_157 = r"(id: '157'.*?departureCities: \[)(.*?)(\s*\],)"
match_157 = re.search(pattern_157, content, re.DOTALL)
if match_157 and 'krasnodar' not in match_157.group(2):
    krasnodar_line = "      { city: 'Краснодар', slug: 'krasnodar', meetingPoint: 'ул. Захарова, 3/2, ост. «ТРК Сити-Центр»', departureTime: '09:00' },"
    existing = match_157.group(2)
    new_block = existing.rstrip() + '\n' + krasnodar_line
    old_full = match_157.group(1) + match_157.group(2) + match_157.group(3)
    new_full = match_157.group(1) + new_block + match_157.group(3)
    content = content.replace(old_full, new_full, 1)
    print(f"  [157] Added Krasnodar")

with open(FILEPATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDone!")
