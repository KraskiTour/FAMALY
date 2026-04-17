"""
Fix all generic catalog URLs to specific tour pages where possible.
For tours where no specific page exists, use the most relevant sub-category.
"""
import pathlib
import re

exact_fixes = {
    # ===== БОЛЬШАЯ СТРАНА: Москва =====
    'moskva-stolichnye-vyhodnye': 'https://bolshayastrana.com/moskva/tri-dnya-v-moskve-345550',
    'moskva-na-vyhodnye': 'https://bolshayastrana.com/moskva/moskva-den-za-dnem-puteshestvie-za-2-dnya-229605',
    'moskva-kalejdoskop-5-dnej': 'https://bolshayastrana.com/moskva/glavnye-dostoprimechatelnosti-moskvy-98037',
    'moskva-den-za-dnyom-5-dnej': 'https://bolshayastrana.com/moskva/moskva-den-za-dnem-puteshestvie-za-5-dnej-229600',
    'moskovskaya-istoriya-7-dnej': 'https://bolshayastrana.com/moskva/moskovskaya-istoriya-za-7-dnej-229413',
    'moskva-pokazhite-nam-4-dnya': 'https://bolshayastrana.com/moskva/pokazhite-nam-moskvu-moskvichi--229953',
    'moskva-ya-shagayu-6-dnej': 'https://bolshayastrana.com/moskva/ya-shagayu-po-moskve-ehkskursionnyj-tur-na-6-dnej-247124',

    # ===== БОЛЬШАЯ СТРАНА: Казань =====
    'kazan-i-yoshkar-ola-6-dnej': 'https://bolshayastrana.com/tatarstan/zolotoj-kazan-i-krasnyj-gorod-234546',

    # ===== БОЛЬШАЯ СТРАНА: Золотое кольцо =====
    'maloe-zolotoe-kolco-4-dnya': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/maloe-zolotoe-kolco-rossii-245179',
    'goroda-zolotoj-rusi-5-dnej': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/goroda-zolotoj-rusi-247031',
    'zolotoe-kolco-weekend-2-dnya': 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/na-2-dnya',
    'zolotoe-kolco-zhar-ptitsa-3-dnya': 'https://bolshayastrana.com/yaroslavskaya-oblast/zolotoe-kolco-vsyo-luchshee-za-3-dnya-229560',
}

# Amra tours: replace with specific exc.amra-turistik.ru URLs where available,
# otherwise use best matching category on old site
amra_specific_fixes = {
    # ===== MOCK-TOURS.TS (Amra) — specific exc.amra URLs =====
    'krasnodar-park-galitskogo': 'https://exc.amra-turistik.ru/vse-tury/44166-krasnodar-krasivyj-yuzhnyj-gorod',
    'arhyz-gornyj-weekend': 'https://exc.amra-turistik.ru/vse-tury/38297-arkhyz-dvukhdnevnyj',
    'severnaya-osetiya-weekend': 'https://exc.amra-turistik.ru/vse-tury/34614-dvukhdnevnaya-krasavitsa-osetiya',
    'dagestan-4-dnya': 'https://exc.amra-turistik.ru/vse-tury/35146-zdravstvuj-dagestan-dva-neveroyatnykh-dnya-v-dagestane-lajt-tur',
    'chechnya-osetiya-4-dnya': 'https://exc.amra-turistik.ru/vse-tury/34612-tri-respubliki-kavkaza-chechnya-ingushetiya-i-severnaya-osetiya',
    'elista-kalmykiya-1-den': 'https://exc.amra-turistik.ru/vse-tury/35127-kalmykiya-strana-bumba-stepi-barkhany-khuruly-poyushchie-peski-i-goryashchaya-voda',
    'goryachij-klyuch-park-galitskogo': 'https://exc.amra-turistik.ru/vse-tury',

    # Multi-day mock tours (Amra) with no specific page — use multi-day catalog
    'dombay-weekend': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'elbrus-i-chegem': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'adygeya-termy-weekend': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'krym-bolshoe-puteshestvie': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'sochi-weekend-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',

    # ===== AMRA-TOURS.TS — specific exc.amra URLs =====
    'guzeripl-lago-naki-termy': 'https://exc.amra-turistik.ru/vse-tury/34518-po-smotrovym-lago-naki',
    'krasnodar-istoricheskij-centr-ekskursiya': 'https://exc.amra-turistik.ru/vse-tury/44166-krasnodar-krasivyj-yuzhnyj-gorod',
    'park-krasnodar-oblakov-ekskursiya': 'https://exc.amra-turistik.ru/vse-tury/44166-krasnodar-krasivyj-yuzhnyj-gorod',
    'krasivejshie-smotrovye-lago-naki': 'https://exc.amra-turistik.ru/vse-tury/34518-po-smotrovym-lago-naki',
    'gruziya-5-dnej-tblisi-kahetiya': 'https://exc.amra-turistik.ru/vse-tury/41946-leto-v-gruzii',
    'gruziya-5-dnej-dashbashi': 'https://exc.amra-turistik.ru/vse-tury/41946-leto-v-gruzii',
    'gruziya-4-dnya': 'https://exc.amra-turistik.ru/vse-tury/41946-leto-v-gruzii',
    'festival-tyulpanov-kalmykiya-2-dnya': 'https://exc.amra-turistik.ru/vse-tury/39152-festival-tyulpanov-v-kalmykii',
    'krasavica-osetiya-2-dnya': 'https://exc.amra-turistik.ru/vse-tury/34614-dvukhdnevnaya-krasavitsa-osetiya',
    'chegem-yazyk-trollya-verhnyaya-balkariya-2-dnya': 'https://exc.amra-turistik.ru/vse-tury/37877-yazyk-trollya-i-krasavitsa-verkhnyaya-balkariya',
    'gornyj-dagestan-4-dnya': 'https://exc.amra-turistik.ru/vse-tury/35146-zdravstvuj-dagestan-dva-neveroyatnykh-dnya-v-dagestane-lajt-tur',

    # Amra tours with no specific page — use best matching category
    'shato-de-talyu-gelendzhik-staryj-park': 'https://exc.amra-turistik.ru/vse-tury/34622-lyubimyj-tur-ot-abrau-do-gelendzhika',
    'stambul-lajt-5-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'stambul-5-dnej-s-gidom': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'spb-kareliya-9-dnej': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'krym-jubk-novyj-hersones-sevastopol': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'krym-mriya-sakura-yalta-1-den': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krym-novyj-svet-mriya-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'krym-mriya-dvorcy-jubk-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'vesennij-uzbekistan-7-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'vesennee-czvetenie-kryma-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'pasha-v-abhazii-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'krasivaya-doroga-rossii-i-chegem-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'parad-tyulpanov-krym-dvorcy-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'znakomstvo-s-belarusyu-9-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'gruziya-i-armeniya-7-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'kaliningrad-zhd-avia-tur': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'solnechnaya-gruziya-bolshoj-tur-9-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/iz-krasnodara-zarubezhnye-tury/',
    'vinodelni-azovskogo-morya-golubickoe-taman': 'https://exc.amra-turistik.ru/vse-tury',
    'kubanskaya-loza-lefkadiya-myshako-abrau': 'https://exc.amra-turistik.ru/vse-tury',
    'mezmaj-orlinaya-polka-guamskoe-termy': 'https://exc.amra-turistik.ru/vse-tury',
    'skazochnoe-poberezhe-staryj-park-shato-pino-abrau': 'https://exc.amra-turistik.ru/vse-tury/34622-lyubimyj-tur-ot-abrau-do-gelendzhika',
    'vokrug-anapy-800-stupenej-kiparisovoe-abrau': 'https://exc.amra-turistik.ru/vse-tury',
    'vodopady-rufabgo-mishoko-konnye': 'https://exc.amra-turistik.ru/vse-tury',
    'teshebskie-vodopady-muzej-hleba-i-vina': 'https://exc.amra-turistik.ru/vse-tury',
    'vodopady-mezmaya-temnolesye': 'https://exc.amra-turistik.ru/vse-tury',
    'rafting-vesna-lago-naki': 'https://exc.amra-turistik.ru/vse-tury',
    'rassvet-aj-petri-parad-tyulpanov-dvorcy': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'tyulpany-mysa-opuk-koyashskoe-kerch': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'tyulpany-rostovskogo-zapovednika-eko-tropy': 'https://exc.amra-turistik.ru/vse-tury',
    'yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'pasha-v-atamani-1-den': 'https://exc.amra-turistik.ru/vse-tury',
    'velosea-golubaya-buhta-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury',
    'mezmaj-orlinaya-polka-verhnekurdzhipskoe': 'https://exc.amra-turistik.ru/vse-tury',
    'relaks-shato-de-talyu-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury/34622-lyubimyj-tur-ot-abrau-do-gelendzhika',
    'pasha-svyato-mihajlovskij-monastyr-1-den': 'https://exc.amra-turistik.ru/vse-tury',
    'parad-tyulpanov-novyj-hersones-1-den': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'vodopady-zhane-golubaya-bezdna-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury/37873-vodopady-i-dolmeny-r-zhane-golubaya-bezdna-i-romantichnyj-vecher-v-krasivom-gelendzhike',
    'dva-ozera-dva-morya-tyulpany-generalskie': 'https://exc.amra-turistik.ru/vse-tury',
    'chertov-palec-savranskaya-kanatnaya-lago-naki': 'https://exc.amra-turistik.ru/vse-tury',
    'yazyk-trollya-verhnyaya-balkariya-1-den': 'https://exc.amra-turistik.ru/vse-tury/37877-yazyk-trollya-i-krasavitsa-verkhnyaya-balkariya',
    'abrau-dyurso-po-novomu-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury/34622-lyubimyj-tur-ot-abrau-do-gelendzhika',
    'pokhod-po-shapsugskoj-dolmeny-labirint': 'https://exc.amra-turistik.ru/vse-tury',
    'plancheskie-skaly-konnaya-ferma-vladimirovka': 'https://exc.amra-turistik.ru/vse-tury',
    'termalnye-istochniki-vodnaya-rivera-pitejnyj-dom': 'https://exc.amra-turistik.ru/vse-tury',
    'velikolepie-vostochnogo-kryma-zvezdopad-alchak': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'vodopady-lazarevskogo-rajona': 'https://exc.amra-turistik.ru/vse-tury',
    'vokrug-anapy-800-stupenej-vinnyj-grek': 'https://exc.amra-turistik.ru/vse-tury',
    'tyulpany-i-piony-kryma': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/multi-day/',
    'shato-andre-semigorye-abrau': 'https://exc.amra-turistik.ru/vse-tury',
    'fanagoriya-shato-taman-taman': 'https://exc.amra-turistik.ru/vse-tury',
    'morskoj-voyazh-golubaya-bezdna-parus-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury',
    'tur-vostorg-shato-pino-staryj-park-gelendzhik': 'https://exc.amra-turistik.ru/vse-tury/34622-lyubimyj-tur-ot-abrau-do-gelendzhika',
    'vsesvyatskoe-kladbishhe-ekskursiya': 'https://exc.amra-turistik.ru/vse-tury/44166-krasnodar-krasivyj-yuzhnyj-gorod',
    'vinnaya-klassika-tri-centra-vinnogo-turizma-1-den': 'https://exc.amra-turistik.ru/vse-tury',
    'goryachij-klyuch-kapibary-i-alpaki-1-den': 'https://exc.amra-turistik.ru/vse-tury',
}

# Кандагар — use homepage since specific tour pages don't exist
kandagar_fixes = {
    'pyatigorsk-kislovodsk-1-den': 'https://www.kandagar.com/',
    'bermamyt-dzhily-su': 'https://www.kandagar.com/',
    'kavminvody-5-gorodov': 'https://www.kandagar.com/',
}

# Русь Belarus — rtoperator.ru individual pages not found; use rt.plus/belarus which has tour listings
rus_fixes = {
    'vsya-belarus-7-dnej': 'https://rt.plus/belarus/',
    'charuyushchaya-belarus-5-dnej': 'https://rt.plus/belarus/',
    'dorogami-belarusi-3-dnya': 'https://rt.plus/belarus/',
    'znakomtes-belarus-3-dnya': 'https://rt.plus/belarus/',
    'bolshoe-puteshestvie-v-belarus-8-dnej': 'https://rt.plus/belarus/',
    'belarus-k-zubram-zamkam-belazam': 'https://rt.plus/belarus/',
    'zemlya-pod-belymi-krylyami-10-dnej': 'https://rt.plus/belarus/',
    'belarus-put-magnatov-5-dnej': 'https://rt.plus/belarus/',
    'zapovednaya-belarus-3-dnya': 'https://rt.plus/belarus/',
    'belorusskaya-mozaika-1-den': 'https://rt.plus/belarus/',
    'grand-tur-po-beloj-rusi-10-dnej': 'https://rt.plus/belarus/',
    'iyunskie-prazdniki-v-belarusi-4-dnya': 'https://rt.plus/belarus/',
    'belorusskie-kanikuly-3-dnya': 'https://rt.plus/belarus/',
}

# Park Loga — homepage is the most relevant
parkloga_fix = {
    'sochi-abhazia-4-dnya': 'https://logapark.ru/',
}

# Merge all fixes
all_fixes = {}
all_fixes.update(exact_fixes)
all_fixes.update(amra_specific_fixes)
all_fixes.update(kandagar_fixes)
all_fixes.update(rus_fixes)
all_fixes.update(parkloga_fix)

data_files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

total_fixed = 0

for fpath in data_files:
    f = pathlib.Path(fpath)
    code = f.read_text(encoding='utf-8')
    file_fixes = 0

    for slug, new_url in all_fixes.items():
        pattern = re.compile(
            rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*')([^']*?)(')"
        )
        m = pattern.search(code)
        if m and m.group(2) != new_url:
            code = pattern.sub(rf"\g<1>{new_url}\3", code)
            file_fixes += 1
            print(f'  FIXED: {slug}')
            print(f'    OLD: {m.group(2)}')
            print(f'    NEW: {new_url}')

    if file_fixes > 0:
        f.write_text(code, encoding='utf-8')
        print(f'\n=> {f.name}: Fixed {file_fixes} URLs\n')
    else:
        print(f'\n=> {f.name}: No changes needed\n')

    total_fixed += file_fixes

print(f'\n=== TOTAL FIXED: {total_fixed} ===')
