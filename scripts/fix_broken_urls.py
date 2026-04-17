import pathlib
import re

# Correct URLs based on web search results
fixes = {
    # Amra — tours with known correct URLs
    'golubickoe-anapa-supsex': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'stambul-lajt-5-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'stambul-5-dnej-s-gidom': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'spb-kareliya-9-dnej': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krym-jubk-novyj-hersones-sevastopol': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krym-mriya-sakura-yalta-1-den': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krym-novyj-svet-mriya-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krym-mriya-dvorcy-jubk-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'gruziya-5-dnej-tblisi-kahetiya': 'https://amra-turistik.ru/tours/vlyubitsya-v-gruziyu-za-5-dnej-6/',
    'gruziya-5-dnej-dashbashi': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'gruziya-4-dnya': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'krasnodar-istoricheskij-centr-ekskursiya': 'https://amra-turistik.ru/tour-category/ekskursiya/',
    'park-krasnodar-oblakov-ekskursiya': 'https://amra-turistik.ru/tour-category/ekskursiya/',
    'vsesvyatskoe-kladbishhe-ekskursiya': 'https://amra-turistik.ru/tour-category/ekskursiya/',
    'vesennij-uzbekistan-7-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'vesennee-czvetenie-kryma-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'pasha-v-abhazii-2-dnya': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'festival-tyulpanov-kalmykiya-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'krasavica-osetiya-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'parad-tyulpanov-krym-dvorcy-2-dnya': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'gruziya-i-armeniya-7-dnej': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'kubanskaya-loza-lefkadiya-myshako-abrau': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'teshebskie-vodopady-muzej-hleba-i-vina': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'lago-naki-monastyr-termy-1-den': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'rassvet-aj-petri-parad-tyulpanov-dvorcy': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'tyulpany-mysa-opuk-koyashskoe-kerch': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'pasha-svyato-mihajlovskij-monastyr-1-den': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    # Mock Amra tours with broken URLs
    'severnaya-osetiya-weekend': 'https://amra-turistik.ru/product-category/russia/iz-krasnodara/',
    'abhazia-3-dnya': 'https://amra-turistik.ru/product-category/zarubezhnye-tury/',
    'krasnodar-park-galitskogo': 'https://amra-turistik.ru/tour-category/ekskursiya/',
}

# Bolshaya Strana — correct URLs
bs_fixes = {
    # Petersburg
    'peterburg-shedevry-severnoj-stolicy': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-semejnye-kanikuly': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-na-vyhodnye': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-klassicheskij-7-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-ot-petra-do-neboskreba': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-letnij-6-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-portret-velikogo-goroda': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-istorii-vyborg-7-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-roditeli-s-detmi-7-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-blistatelnyj-3-dnya': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-belye-nochi-4-dnya': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-razvodye-mostov-5-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-i-vyborg-5-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-i-valaam-5-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    'peterburg-vyborg-kareliya-6-dnej': 'https://bolshayastrana.com/sankt-peterburg',
    # Kazan
    'kazan-sokrovishcha-tatarstana': 'https://bolshayastrana.com/kazan',
    'kazan-na-vyhodnye': 'https://bolshayastrana.com/kazan',
    'kazan-zolotaya-3-dnya': 'https://bolshayastrana.com/kazan',
    'kazan-den-za-dnyom-5-dnej': 'https://bolshayastrana.com/kazan',
    'tatarstan-na-100-procentov': 'https://bolshayastrana.com/kazan',
    'kazan-i-yoshkar-ola-6-dnej': 'https://bolshayastrana.com/kazan',
}

# Kondagar + Park Loga — use working URLs
other_fixes = {
    'pyatigorsk-kislovodsk-1-den': 'https://www.kondagar.com/',
    'bermamyt-dzhily-su': 'https://www.kondagar.com/',
    'kavminvody-5-gorodov': 'https://www.kondagar.com/',
    'park-loga-1-den': 'https://парклога.рф/',
}

all_fixes = {}
all_fixes.update(fixes)
all_fixes.update(bs_fixes)
all_fixes.update(other_fixes)

for fname in ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts']:
    f = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}')
    code = f.read_text(encoding='utf-8')
    count = 0
    for slug, new_url in all_fixes.items():
        pattern = re.compile(
            rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*')([^']*?)(')"
        )
        if pattern.search(code):
            old_url = pattern.search(code).group(2)
            if old_url != new_url:
                code = pattern.sub(rf"\g<1>{new_url}\3", code)
                count += 1
    if count > 0:
        f.write_text(code, encoding='utf-8')
        print(f'Fixed {count} URLs in {fname}')
    else:
        print(f'No fixes needed in {fname}')
