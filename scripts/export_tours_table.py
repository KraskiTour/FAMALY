"""
Export all tours to a TSV file for Google Sheets import.
Columns: Код | Наш тур | Slug | Оператор | Ссылка на тур оператора | ТЗ дизайнеру: 6 фото
"""
import pathlib
import re
import csv

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

block_re = re.compile(
    r"title:\s*['\"]([^'\"]+)['\"].*?"
    r"slug:\s*'([^']+)'.*?"
    r"durationDays:\s*(\d+).*?"
    r"sourceUrl:\s*'([^']*)'.*?"
    r"sourceOperator:\s*'([^']*)'",
    re.DOTALL
)

# Also grab description for better photo briefs
desc_re = re.compile(
    r"slug:\s*'([^']+)'.*?"
    r"description:\s*['\"]([^'\"]{0,500})",
    re.DOTALL
)

# Collect highlights from itinerary for photo briefs
itin_re = re.compile(
    r"slug:\s*'([^']+)'.*?"
    r"itinerary:\s*\[(.*?)\]",
    re.DOTALL
)

highlight_re = re.compile(r"title:\s*['\"]([^'\"]+)['\"]")

tours = []
code_counter = 1001

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    
    # Get descriptions
    descs = {}
    for m in desc_re.finditer(code):
        descs[m.group(1)] = m.group(2)
    
    for m in block_re.finditer(code):
        title = m.group(1)
        slug = m.group(2)
        days = int(m.group(3))
        source_url = m.group(4)
        operator = m.group(5)
        desc = descs.get(slug, '')
        
        tours.append({
            'title': title,
            'slug': slug,
            'days': days,
            'source_url': source_url,
            'operator': operator,
            'desc': desc,
        })


# Generate photo briefs based on tour title, description, days
def make_photo_brief(t):
    title = t['title']
    days = t['days']
    desc = t['desc']
    slug = t['slug']
    
    # Extract key location/theme words
    locations = []
    themes = []
    
    # Common location patterns
    loc_keywords = {
        'Петербург': 'Санкт-Петербург',
        'Москва': 'Москва', 'Московск': 'Москва',
        'Казань': 'Казань', 'Татарстан': 'Казань',
        'Крым': 'Крым', 'Ялта': 'Ялта', 'Севастополь': 'Севастополь',
        'Абхази': 'Абхазия', 'Сочи': 'Сочи',
        'Дагестан': 'Дагестан', 'Сулакский': 'Сулакский каньон',
        'Чечня': 'Грозный', 'Грозный': 'Грозный',
        'Осетия': 'Северная Осетия', 'Владикавказ': 'Владикавказ',
        'Эльбрус': 'Эльбрус', 'Домбай': 'Домбай', 'Архыз': 'Архыз',
        'Геленджик': 'Геленджик', 'Абрау': 'Абрау-Дюрсо',
        'Лаго-Наки': 'Лаго-Наки', 'Мезмай': 'Мезмай',
        'Грузи': 'Грузия', 'Тбилиси': 'Тбилиси',
        'Стамбул': 'Стамбул', 'Узбекистан': 'Узбекистан',
        'Беларус': 'Беларусь', 'Минск': 'Минск',
        'Калининград': 'Калининград',
        'Кисловодск': 'Кисловодск', 'Пятигорск': 'Пятигорск',
        'Калмыкия': 'Калмыкия', 'Элиста': 'Элиста',
        'Выборг': 'Выборг', 'Карелия': 'Карелия', 'Валаам': 'Валаам',
        'Волгоград': 'Волгоград',
        'Золотое кольцо': 'Золотое кольцо', 'Суздаль': 'Суздаль',
        'Краснодар': 'Краснодар', 'Горячий Ключ': 'Горячий Ключ',
        'Чегем': 'Чегемские водопады', 'Балкария': 'Верхняя Балкария',
        'Йошкар-Ола': 'Йошкар-Ола',
    }
    
    for kw, loc in loc_keywords.items():
        if kw.lower() in title.lower() or kw.lower() in desc.lower():
            if loc not in locations:
                locations.append(loc)
    
    # Theme keywords
    theme_keywords = {
        'водопад': 'водопады крупным планом',
        'термальн': 'термальные источники, пар над водой',
        'вино': 'виноградники, дегустация вин, бочки',
        'шато': 'замок/шато, виноградники',
        'дворц': 'дворцы, парадные залы',
        'парк': 'красивый парк, аллеи, зелень',
        'горн': 'горные панорамы, вершины в облаках',
        'море': 'морское побережье, бирюзовая вода',
        'каньон': 'каньон, скалы, бирюзовая река',
        'тюльпан': 'поля тюльпанов, яркие цветы',
        'сакур': 'цветение сакуры, розовые деревья',
        'мечет': 'мечеть, минареты',
        'крепост': 'старинная крепость, стены',
        'монастыр': 'монастырь, купола, колокольни',
        'рафтинг': 'рафтинг, горная река, лодка',
        'экскурси': 'группа туристов с гидом',
        'ущель': 'горное ущелье, скалы',
        'озер': 'горное озеро, отражение гор',
    }
    
    for kw, theme in theme_keywords.items():
        if kw in title.lower() or kw in desc.lower() or kw in slug:
            if theme not in themes:
                themes.append(theme)
    
    # Build 6 photo descriptions
    photos = []
    
    # Photo 1: always a hero/landscape shot of main location
    if locations:
        photos.append(f'1. Панорамный пейзаж: {locations[0]} (горизонтальный, яркий, дневной свет)')
    else:
        photos.append(f'1. Панорамный пейзаж главной локации тура (горизонтальный, яркий)')
    
    # Photo 2: iconic landmark
    if len(locations) > 1:
        photos.append(f'2. Знаковая достопримечательность: {locations[1]} (крупный план, чистое небо)')
    elif themes:
        photos.append(f'2. {themes[0].capitalize()} (крупный план, высокое качество)')
    else:
        photos.append(f'2. Главная достопримечательность тура (крупный план)')
    
    # Photo 3: atmosphere/activity
    if len(themes) > 1:
        photos.append(f'3. Атмосфера: {themes[1]} (живое фото, естественные цвета)')
    elif len(themes) > 0:
        photos.append(f'3. Атмосфера: {themes[0]} (живое фото, естественные цвета)')
    else:
        photos.append(f'3. Атмосферное фото: люди наслаждаются путешествием')
    
    # Photo 4: detail/food/culture
    if 'Грузия' in str(locations) or 'Тбилиси' in str(locations):
        photos.append('4. Грузинская кухня: хинкали, хачапури, вино (аппетитно, крупный план)')
    elif 'Казань' in str(locations) or 'Татарстан' in title:
        photos.append('4. Татарская кухня: чак-чак, эчпочмак (аппетитно, крупный план)')
    elif 'Стамбул' in str(locations):
        photos.append('4. Турецкая кухня и базар: специи, сладости (яркие цвета)')
    elif 'Узбекистан' in str(locations):
        photos.append('4. Узбекская кухня: плов, лепёшки (яркие цвета)')
    elif 'Беларусь' in str(locations):
        photos.append('4. Белорусская природа: замок Мир или Несвиж (красивый ракурс)')
    elif any('вино' in t for t in themes) or any('шато' in t for t in themes):
        photos.append('4. Дегустация: бокалы с вином, красивая сервировка')
    else:
        photos.append('4. Культурная деталь: местная еда / сувениры / ремёсла (крупный план)')
    
    # Photo 5: second landscape or activity
    if len(locations) > 2:
        photos.append(f'5. Вид: {locations[2]} (панорама или дрон-шот)')
    elif len(themes) > 2:
        photos.append(f'5. {themes[2].capitalize()} (красивый ракурс, золотой час)')
    else:
        photos.append('5. Вторая видовая точка маршрута (закат или рассвет, тёплые тона)')
    
    # Photo 6: group/emotional shot
    photos.append('6. Люди в путешествии: улыбки, восторг, фото на фоне (живые эмоции)')
    
    return ' | '.join(photos)


# Sort by operator, then by title
tours.sort(key=lambda t: (t['operator'], t['title']))

# Write TSV
out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')
with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f, delimiter='\t')
    writer.writerow([
        'Код',
        'Наш тур (название)',
        'Slug (URL)',
        'Дней',
        'Оператор-источник',
        'Ссылка на тур оператора',
        'Фото 1 — Панорама',
        'Фото 2 — Достопримечательность',
        'Фото 3 — Атмосфера',
        'Фото 4 — Детали/Еда',
        'Фото 5 — Второй вид',
        'Фото 6 — Люди/Эмоции',
    ])
    
    for t in tours:
        code = str(code_counter)
        code_counter += 1
        
        brief = make_photo_brief(t)
        photo_parts = brief.split(' | ')
        # Pad to 6
        while len(photo_parts) < 6:
            photo_parts.append('')
        
        writer.writerow([
            code,
            t['title'],
            t['slug'],
            t['days'],
            t['operator'],
            t['source_url'],
            *photo_parts[:6],
        ])

print(f'Exported {len(tours)} tours to {out}')
print(f'Codes: {1001} — {code_counter - 1}')
