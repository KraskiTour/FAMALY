"""
Export all tours to TSV for Google Sheets.
Parse each tour object block individually.
"""
import pathlib
import re
import csv

files = [
    ('mock-tours.ts', r'c:\COD\FAMALY\data\mock-tours.ts'),
    ('amra-tours.ts', r'c:\COD\FAMALY\data\amra-tours.ts'),
    ('golden-ring-tours.ts', r'c:\COD\FAMALY\data\golden-ring-tours.ts'),
]

def extract_field(block, field):
    m = re.search(rf"{field}:\s*['\"]([^'\"]*)['\"]", block)
    return m.group(1) if m else ''

def extract_int(block, field):
    m = re.search(rf"{field}:\s*(\d+)", block)
    return int(m.group(1)) if m else 0

tours = []

for fname, fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    
    # Split by top-level objects in the array
    # Each tour starts with "  {" and ends with "  },"
    # Find blocks between { id: ... and the next { id:
    blocks = re.split(r'\n\s*\{(?=\s*\n\s*id:)', code)
    
    for block in blocks:
        slug = extract_field(block, 'slug')
        if not slug:
            continue
        title = extract_field(block, 'title')
        if not title:
            continue
        source_url = extract_field(block, 'sourceUrl')
        source_op = extract_field(block, 'sourceOperator')
        days = extract_int(block, 'durationDays')
        desc = extract_field(block, 'description')
        
        tours.append({
            'slug': slug,
            'title': title,
            'days': days,
            'source_url': source_url,
            'operator': source_op,
            'desc': desc,
            'file': fname,
        })

print(f'Parsed {len(tours)} tours')

# Generate specific photo briefs per tour
def photo_brief(t):
    title = t['title']
    desc = t['desc']
    slug = t['slug']
    text = f"{title} {desc}".lower()
    
    # Detect locations
    locs = []
    loc_map = [
        ('петербург', 'Санкт-Петербург: Невский проспект, Эрмитаж, Исаакиевский собор'),
        ('москв', 'Москва: Кремль, Москва-Сити, Красная площадь'),
        ('казань', 'Казань: Кул-Шариф, Кремль, набережная'),
        ('крым', 'Крым: южный берег, скалы, море'),
        ('абхаз', 'Абхазия: озеро Рица, горы, субтропики'),
        ('сочи', 'Сочи: набережная, горы, море'),
        ('дагестан', 'Дагестан: Сулакский каньон, аул Гамсутль, Дербент'),
        ('чечн', 'Грозный: мечеть «Сердце Чечни», высотки, горы'),
        ('осети', 'Владикавказ: горы, Цейское ущелье, Город мёртвых'),
        ('эльбрус', 'Эльбрус: снежные вершины, канатная дорога, ущелья'),
        ('домбай', 'Домбай: горные вершины, хвойные леса, водопады'),
        ('архыз', 'Архыз: горные озёра, хребты, звёздная обсерватория'),
        ('геленджик', 'Геленджик: набережная, скала Парус, бухта'),
        ('абрау', 'Абрау-Дюрсо: озеро, виноградники, завод шампанских'),
        ('лаго-наки', 'Лаго-Наки: плато, цветущие луга, горные панорамы'),
        ('lago-naki', 'Лаго-Наки: плато, цветущие луга, горные панорамы'),
        ('мезмай', 'Мезмай: Орлиная полка, ущелья, водопады'),
        ('грузи', 'Грузия: Тбилиси, храмы, горы, виноградники'),
        ('стамбул', 'Стамбул: Босфор, мечети, Гранд-Базар'),
        ('узбекистан', 'Узбекистан: Самарканд, Бухара, мозаика, купола'),
        ('беларус', 'Беларусь: замок Мир, Несвиж, Беловежская пуща'),
        ('калининград', 'Калининград: Куршская коса, Кафедральный собор, янтарь'),
        ('кисловодск', 'Кисловодск: Нарзанная галерея, курортный парк'),
        ('пятигорск', 'Пятигорск: Провал, вид на Эльбрус, Машук'),
        ('калмыки', 'Калмыкия: степи, тюльпаны, Золотая обитель Будды'),
        ('выборг', 'Выборг: средневековый замок, парк Монрепо'),
        ('карели', 'Карелия: Рускеала, водопады, Ладога'),
        ('валаам', 'Валаам: монастырь, Ладожское озеро, скиты'),
        ('волгоград', 'Волгоград: Мамаев курган, Родина-мать'),
        ('золот', 'Золотое кольцо: Суздаль, Владимир, белокаменные храмы'),
        ('краснодар', 'Краснодар: Парк Галицкого, Парк Облаков'),
        ('горячий ключ', 'Горячий Ключ: скалы, термальные источники, лес'),
        ('чегем', 'Чегемские водопады: каскады, ущелье, скалы'),
        ('балкари', 'Верхняя Балкария: башни, ущелья, горные реки'),
        ('йошкар', 'Йошкар-Ола: набережная Брюгге, архитектура'),
        ('шато', 'Шато/винодельня: виноградники, погреба, бочки'),
        ('вино', 'Виноградники, дегустация, бокалы вина'),
        ('водопад', 'Водопады: каскады, брызги, зелень вокруг'),
        ('термальн', 'Термальные источники: пар, бассейны, горы'),
        ('тюльпан', 'Поля тюльпанов: яркие ковры цветов, степь'),
        ('рафтинг', 'Рафтинг: горная река, пороги, лодки'),
    ]
    
    for kw, loc_desc in loc_map:
        if kw in text or kw in slug:
            if loc_desc not in locs:
                locs.append(loc_desc)
    
    # Build 6 photo descriptions
    p = []
    if locs:
        p.append(f'Панорама: {locs[0].split(":")[0]} — широкий горизонтальный кадр, дневной свет, яркие цвета')
    else:
        p.append(f'Панорама главной локации «{title}» — широкий горизонтальный кадр, яркий')
    
    if len(locs) > 1:
        p.append(f'Достопримечательность: {locs[1]}')
    elif locs:
        parts = locs[0].split(': ')
        if len(parts) > 1:
            p.append(f'Достопримечательность: {parts[1].split(",")[0]} — крупный план, чистое небо')
        else:
            p.append('Главная достопримечательность маршрута — крупный план')
    else:
        p.append('Главная достопримечательность маршрута — крупный план')
    
    if len(locs) > 2:
        p.append(f'Атмосфера: {locs[2]}')
    elif any(kw in text for kw in ['горн', 'горы', 'вершин', 'хреб']):
        p.append('Горные панорамы: вершины в облаках, драматичное небо')
    elif any(kw in text for kw in ['мор', 'побережь', 'бухт']):
        p.append('Морской пейзаж: бирюзовая вода, скалы, побережье')
    else:
        p.append('Атмосферный кадр маршрута: природа или архитектура, мягкий свет')
    
    # Food/culture
    if 'грузи' in text:
        p.append('Грузинская кухня: хинкали, хачапури, вино — крупный план, аппетитно')
    elif 'казань' in text or 'татарстан' in text:
        p.append('Татарская кухня: чак-чак, эчпочмак — аппетитный крупный план')
    elif 'стамбул' in text or 'турци' in text:
        p.append('Турция: базар со специями, чай, сладости — яркие цвета')
    elif 'узбекистан' in text:
        p.append('Узбекская кухня: плов, самса, лепёшки — аппетитный крупный план')
    elif 'беларус' in text:
        p.append('Беларусь: драники, местные продукты или замок Мир/Несвиж')
    elif 'вино' in text or 'шато' in text or 'дегустац' in text:
        p.append('Дегустация: бокалы вина на фоне виноградников, красивая сервировка')
    elif 'дагестан' in text:
        p.append('Дагестанская кухня: хинкал, чуду, урбеч — аппетитный крупный план')
    else:
        p.append('Местная кухня / сувениры / ремёсла — аппетитный крупный план')
    
    # Second view
    if len(locs) > 3:
        p.append(f'Второй вид: {locs[3]}')
    elif len(locs) > 1:
        p.append(f'Второй ракурс: {locs[-1].split(":")[0]} — закат или рассвет, тёплые тона')
    else:
        p.append('Вторая видовая точка маршрута — закат или золотой час')
    
    # People
    p.append('Путешественники: счастливые люди на фоне природы/архитектуры, живые эмоции')
    
    return p


tours.sort(key=lambda t: (t['operator'], t['title']))

code_counter = 1001
out = pathlib.Path(r'c:\COD\FAMALY\docs\tours-for-google-sheets.tsv')

with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, delimiter='\t')
    w.writerow([
        'Код',
        'Наш тур',
        'Slug',
        'Дней',
        'Оператор',
        'Ссылка на тур оператора',
        'Фото 1 — Панорама',
        'Фото 2 — Достопримечательность',
        'Фото 3 — Атмосфера',
        'Фото 4 — Еда/Культура',
        'Фото 5 — Второй вид',
        'Фото 6 — Люди',
    ])
    
    for t in tours:
        photos = photo_brief(t)
        w.writerow([
            code_counter,
            t['title'],
            t['slug'],
            t['days'],
            t['operator'],
            t['source_url'],
            *photos[:6],
        ])
        code_counter += 1

print(f'Exported {len(tours)} tours, codes 1001–{code_counter-1}')
print(f'File: {out}')
