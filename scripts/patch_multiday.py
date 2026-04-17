import pathlib

# =============================================
# AMRA multi-day tours
# =============================================
amra_mapping = {
    'stambul-lajt-5-dnej': 'https://amra-turistik.ru/tours/stambul-lajt-5-dnej/',
    'stambul-5-dnej-s-gidom': 'https://amra-turistik.ru/tours/stambul-za-5-dnej-s-gidom/',
    'spb-kareliya-9-dnej': 'https://amra-turistik.ru/tours/peterburg-kareliya-9-dnej/',
    'krym-jubk-novyj-hersones-sevastopol': 'https://amra-turistik.ru/tours/krym-yuzhnyj-bereg-i-novyj-hersones-v-sevastopole/',
    'krym-novyj-svet-mriya-2-dnya': 'https://amra-turistik.ru/tours/krym-novyj-svet-mriya-resort-2-dnya/',
    'krym-mriya-dvorcy-jubk-2-dnya': 'https://amra-turistik.ru/tours/krym-mriya-dvorcztovaya-naberzhnaya-i-yubk-2-dnya/',
    'gruziya-5-dnej-tblisi-kahetiya': 'https://amra-turistik.ru/tours/gruziya-za-5-dnej-tbilisi-kahetiya/',
    'gruziya-5-dnej-dashbashi': 'https://amra-turistik.ru/tours/gruziya-za-5-dnej-dashbashi/',
    'gruziya-4-dnya': 'https://amra-turistik.ru/tours/gruziya-za-4-dnya/',
    'vesennij-uzbekistan-7-dnej': 'https://amra-turistik.ru/tours/vesennij-uzbekistan-za-7-dnej/',
    'vesennee-czvetenie-kryma-2-dnya': 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-2-dnya/',
    'pasha-v-abhazii-2-dnya': 'https://amra-turistik.ru/tours/pasha-v-abhazii-2-dnya/',
    'krasivaya-doroga-rossii-i-chegem-2-dnya': 'https://amra-turistik.ru/tours/samaya-krasivaya-doroga-v-rossii-i-chegem-2/',
    'festival-tyulpanov-kalmykiya-2-dnya': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-2-dnya/',
    'krasavica-osetiya-2-dnya': 'https://amra-turistik.ru/tours/krasavicza-osetiya-2-dnya/',
    'parad-tyulpanov-krym-dvorcy-2-dnya': 'https://amra-turistik.ru/tours/parad-tyulpanov-krym-dvorcztovaya-naberzhnaya-2-dnya/',
    'chegem-yazyk-trollya-verhnyaya-balkariya-2-dnya': 'https://amra-turistik.ru/tours/chegem-i-yazyk-trollya-s-krasaviczej-verhnej-balkariej-11/',
    'gornyj-dagestan-4-dnya': 'https://amra-turistik.ru/tours/gornyj-dagestan-za-5-dnej-2/',
    'kaliningrad-zhd-avia-tur': 'https://amra-turistik.ru/tours/kaliningrad-zhd-tur/',
    'solnechnaya-gruziya-bolshoj-tur-9-dnej': 'https://amra-turistik.ru/tours/solnechnaya-gruziya-bolshoj-tur-ot-tbilisi-do-batumi-4/',
    'znakomstvo-s-belarusyu-9-dnej': 'https://amra-turistik.ru/tours/znakomstvo-s-belarusyu-vsya-belorussiya-za-6-dnej/',
    'gruziya-i-armeniya-7-dnej': 'https://amra-turistik.ru/tours/gruziya-i-armeniya-za-7-dnej/',
}

f = pathlib.Path(r'c:\COD\FAMALY\data\amra-tours.ts')
code = f.read_text(encoding='utf-8')
count = 0
for slug, url in amra_mapping.items():
    old = f"slug: '{slug}',"
    if old in code:
        # Check if already has sourceUrl
        pos = code.index(old)
        nearby = code[pos:pos+200]
        if 'sourceUrl:' not in nearby:
            new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: 'Amra Turistik',"
            code = code.replace(old, new, 1)
            count += 1
        else:
            print(f'SKIP (already has): {slug}')
    else:
        print(f'NOT FOUND: {slug}')
f.write_text(code, encoding='utf-8')
print(f'Patched {count} multi-day Amra tours')

# =============================================
# MOCK tours — Caucasus/various (operator matches)
# =============================================
mock_mapping = {
    # Кавказ weekend-туры — аналоги у Amra
    'arhyz-gornyj-weekend': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'dombay-weekend': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'elbrus-i-chegem': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'severnaya-osetiya-weekend': ('https://amra-turistik.ru/tours/krasavicza-osetiya-2-dnya/', 'Amra Turistik'),
    'adygeya-termy-weekend': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'abhazia-3-dnya': ('https://amra-turistik.ru/tours/pasha-v-abhazii-2-dnya/', 'Amra Turistik'),
    'dagestan-4-dnya': ('https://amra-turistik.ru/tours/gornyj-dagestan-za-5-dnej-2/', 'Amra Turistik'),
    'chechnya-osetiya-4-dnya': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'sochi-abhazia-4-dnya': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'sochi-weekend-2-dnya': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'groznyj-2-dnya': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'volgograd-gorod-geroj': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),
    'krym-bolshoe-puteshestvie': ('https://amra-turistik.ru/tours/', 'Amra Turistik'),

    # Петербург — Большая Страна
    'peterburg-shedevry-severnoj-stolicy': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-semejnye-kanikuly': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-na-vyhodnye': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-klassicheskij-7-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-ot-petra-do-neboskreba': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-letnij-6-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-portret-velikogo-goroda': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-istorii-vyborg-7-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-roditeli-s-detmi-7-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-blistatelnyj-3-dnya': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-belye-nochi-4-dnya': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-razvodye-mostov-5-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-i-vyborg-5-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-i-valaam-5-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),
    'peterburg-vyborg-kareliya-6-dnej': ('https://bolshayastrana.com/tury-v-peterburg', 'Большая Страна'),

    # Москва — Большая Страна
    'moskva-stolichnye-vyhodnye': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskva-na-vyhodnye': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskva-kalejdoskop-5-dnej': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskva-den-za-dnyom-5-dnej': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskovskaya-istoriya-7-dnej': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskva-pokazhite-nam-4-dnya': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),
    'moskva-ya-shagayu-6-dnej': ('https://bolshayastrana.com/tury-v-moskvu', 'Большая Страна'),

    # Казань — Большая Страна
    'kazan-sokrovishcha-tatarstana': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),
    'kazan-na-vyhodnye': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),
    'kazan-zolotaya-3-dnya': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),
    'kazan-den-za-dnyom-5-dnej': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),
    'tatarstan-na-100-procentov': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),
    'kazan-i-yoshkar-ola-6-dnej': ('https://bolshayastrana.com/tury-v-kazan', 'Большая Страна'),

    # Беларусь — Русь (rtoperator)
    'vsya-belarus-7-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'charuyushchaya-belarus-5-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'dorogami-belarusi-3-dnya': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'znakomtes-belarus-3-dnya': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'bolshoe-puteshestvie-v-belarus-8-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'belarus-k-zubram-zamkam-belazam': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'zemlya-pod-belymi-krylyami-10-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'belarus-put-magnatov-5-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'zapovednaya-belarus-3-dnya': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'grand-tur-po-beloj-rusi-10-dnej': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'iyunskie-prazdniki-v-belarusi-4-dnya': ('https://rtoperator.ru/tours/belarus', 'Русь'),
    'belorusskie-kanikuly-3-dnya': ('https://rtoperator.ru/tours/belarus', 'Русь'),
}

f2 = pathlib.Path(r'c:\COD\FAMALY\data\mock-tours.ts')
code2 = f2.read_text(encoding='utf-8')
count2 = 0
for slug, (url, operator) in mock_mapping.items():
    old = f"slug: '{slug}',"
    if old in code2:
        pos = code2.index(old)
        nearby = code2[pos:pos+200]
        if 'sourceUrl:' not in nearby:
            new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: '{operator}',"
            code2 = code2.replace(old, new, 1)
            count2 += 1
        else:
            print(f'SKIP (already has): {slug}')
    else:
        print(f'NOT FOUND in mock: {slug}')
f2.write_text(code2, encoding='utf-8')
print(f'Patched {count2} mock tours')

# =============================================
# GOLDEN RING tours — Большая Страна
# =============================================
gr_mapping = {
    'maloe-zolotoe-kolco-4-dnya': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu',
    'goroda-zolotoj-rusi-5-dnej': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu',
    'zolotoe-kolco-weekend-2-dnya': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu',
    'zolotoe-kolco-zhar-ptitsa-3-dnya': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu',
}

f3 = pathlib.Path(r'c:\COD\FAMALY\data\golden-ring-tours.ts')
code3 = f3.read_text(encoding='utf-8')
count3 = 0
for slug, url in gr_mapping.items():
    old = f"slug: '{slug}',"
    if old in code3:
        new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: 'Большая Страна',"
        code3 = code3.replace(old, new, 1)
        count3 += 1
    else:
        print(f'NOT FOUND in golden-ring: {slug}')
f3.write_text(code3, encoding='utf-8')
print(f'Patched {count3} golden ring tours')
