import pathlib
import re

exact_urls = {
    # ===== Петербург =====
    'peterburg-na-vyhodnye': 'https://bolshayastrana.com/sankt-peterburg/v-peterburg-na-3-dnya-366359',
    'peterburg-shedevry-severnoj-stolicy': 'https://bolshayastrana.com/sankt-peterburg/shedevry-severnoj-tur-na-5-282642',
    'peterburg-semejnye-kanikuly': 'https://bolshayastrana.com/sankt-peterburg/semejnye-kanikuly-v-peterburge-343448',
    'peterburg-klassicheskij-7-dnej': 'https://bolshayastrana.com/sankt-peterburg/klassicheskij-sankt-peterburg-7-dnej-250586',
    'peterburg-ot-petra-do-neboskreba': 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-vesna-leto-244639',
    'peterburg-letnij-6-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/peterburgskaya-kollekciya-tur-na-7-dnej-167025',
    'peterburg-portret-velikogo-goroda': 'https://bolshayastrana.com/sankt-peterburg/osennij-portret-velikogo-goroda-peterburga-tur-na-7-dnej-238030',
    'peterburg-istorii-vyborg-7-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/klassicheskij-peterburg-i-srednevekovyj-vyborg-363121',
    'peterburg-roditeli-s-detmi-7-dnej': 'https://bolshayastrana.com/sankt-peterburg/semejnye-kanikuly-v-peterburge-6-dnej-227195',
    'peterburg-blistatelnyj-3-dnya': 'https://bolshayastrana.com/sankt-peterburg/peterburg-lajt-3-dnya-366293',
    'peterburg-belye-nochi-4-dnya': 'https://bolshayastrana.com/sankt-peterburg/belye-nochi-v-severnoj-stolice-362802',
    'peterburg-razvodye-mostov-5-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-239657',
    'peterburg-i-vyborg-5-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/mnogolikij-peterburg-i-neizvestnyj-vyborg-362983',
    'peterburg-i-valaam-5-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/svyatye-kupola-sankt-peterburga-i-valaama-365553',
    'peterburg-vyborg-kareliya-6-dnej': 'https://bolshayastrana.com/leningradskaya-oblast/top-3-sankt-peterburg-vyborg-kareliya-246450',
    # ===== Казань =====
    'kazan-na-vyhodnye': 'https://bolshayastrana.com/kazan/dobro-pozhalovat-v-kazan-na-vyhodnye-347239',
    'kazan-sokrovishcha-tatarstana': 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-vesenne-letnij4-390728',
    'kazan-zolotaya-3-dnya': 'https://bolshayastrana.com/tatarstan/dobro-pozhalovat-v-kazan-sokrashchennaya-programma-239877',
    'kazan-den-za-dnyom-5-dnej': 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-tur-na-5-dnej-386065',
    'tatarstan-na-100-procentov': 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-tur-na-5-dnej-386065',
    'kazan-i-yoshkar-ola-6-dnej': 'https://bolshayastrana.com/kazan',
}

for fname in ['mock-tours.ts']:
    f = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}')
    code = f.read_text(encoding='utf-8')
    count = 0
    for slug, new_url in exact_urls.items():
        pattern = re.compile(
            rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*')([^']*?)(')"
        )
        m = pattern.search(code)
        if m and m.group(2) != new_url:
            code = pattern.sub(rf"\g<1>{new_url}\3", code)
            count += 1
    if count > 0:
        f.write_text(code, encoding='utf-8')
        print(f'Fixed {count} exact URLs in {fname}')
    else:
        print(f'No changes in {fname}')
