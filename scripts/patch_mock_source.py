import pathlib

# Mock 1-day tours → Amra sourceUrl mapping
# Matched by content/theme similarity with actual Amra tour pages
mapping = {
    # Лаго-Наки 1 день → Amra "Красивейший видовой тур по смотровым Лаго-Наки"
    'lago-naki-1-den': 'https://amra-turistik.ru/tours/krasivejshij-vidovoj-tur-po-smotrovym-lago-naki-2/',
    # Гуамское ущелье → Amra "Релакс-тур: Гуамское ущелье и термальные источники"
    'guamskoe-ushchelye-1-den': 'https://amra-turistik.ru/tours/relaks-tur-guamskoe-ushhele-i-termalnye-istochniki-40/',
    # Геленджик: море, скалы → Amra "Любимая классика от Абрау до Геленджика"
    'gelendzhik-more-i-skaly': 'https://amra-turistik.ru/tours/lyubimaya-klassika-ot-abrau-do-gelendzhika-3/',
    # Абрау-Дюрсо: винный день → Amra "Абрау-Дюрсо по-новому и Шато Пино"
    'abrau-dyurso-vinnyj-den': 'https://amra-turistik.ru/tours/abrau-dyurso-po-novomu-i-shato-pino-2/',
    # Термы Адыгеи → Amra "Термальные источники «Водная Ривьера» и питейный дом в Майкопе"
    'termy-adygei-1-den': 'https://amra-turistik.ru/tours/termalnye-istochniki-vodnaya-rivera-i-pitejnyj-dom-v-majkope-6/',
    # Верхняя Балкария + Чегем → Amra "Язык Тролля и красавица Верхняя Балкария"
    'verkhnyaya-balkariya-chegem': 'https://amra-turistik.ru/tours/yazyk-trollya-i-krasavicza-verhnyaya-balkariya-8/',
    # Краснодар Парк Галицкого → Amra "Экскурсия «Парк Краснодар»"
    'krasnodar-park-galitskogo': 'https://amra-turistik.ru/tours/ekskursiya-park-krasnodar/',
    # Горячий Ключ + Парк → Amra "Горячий Ключ и капибары и альпаки на ферме"
    'goryachij-klyuch-park-galitskogo': 'https://amra-turistik.ru/tours/goryachij-klyuch-i-kapibary-i-alpaki-na-ferme-9/',
    # Элиста, Калмыкия → Amra "Фестиваль тюльпанов в Калмыкии"
    'elista-kalmykiya-1-den': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-12/',
}

# These mock tours have NO clear Amra equivalent:
# - pyatigorsk-kislovodsk-1-den (КМВ, no direct Amra match)
# - bermamyt-dzhily-su (Bermamyt, no direct Amra match)
# - park-loga-1-den (Ростовская область, no Amra match)
# - kavminvody-5-gorodov (5 городов КМВ, no Amra match)
# - belorusskaya-mozaika-1-den (Беларусь, no Amra match)

f = pathlib.Path(r'c:\COD\FAMALY\data\mock-tours.ts')
code = f.read_text(encoding='utf-8')
count = 0
for slug, url in mapping.items():
    old = f"slug: '{slug}',"
    if old in code:
        new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: 'Amra Turistik',"
        code = code.replace(old, new, 1)
        count += 1
    else:
        print(f'NOT FOUND: {slug}')
f.write_text(code, encoding='utf-8')
print(f'Patched {count} mock tours')
