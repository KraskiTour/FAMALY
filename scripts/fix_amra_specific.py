"""
Replace all generic Amra URLs with specific tour pages from amra-turistik.ru.
Manually matched based on scraped tour list.
"""
import pathlib
import re

# Our slug → specific amra-turistik.ru/tours/... URL
# Matched by reading both our tour titles and Amra's tour slugs
fixes = {
    # === MOCK-TOURS.TS ===
    'krasnodar-park-galitskogo': 'https://amra-turistik.ru/tours/progulka-s-ekskursovodom-po-parku-krasnodar-i-parku-oblakov-8',
    'arhyz-gornyj-weekend': 'https://amra-turistik.ru/tours/vesna-v-gorah-arhyza-dzhip-den-3',
    'dombay-weekend': 'https://amra-turistik.ru/tours/dombaj-vesnoj',
    'elbrus-i-chegem': 'https://amra-turistik.ru/tours/puteshestvie-v-prielbruse-ozero-donguz-orun-kyol-terskolskoe-ushhele-i-vodopad-terskol-3',
    'severnaya-osetiya-weekend': 'https://amra-turistik.ru/tours/dvuhdnevnaya-krasavicza-osetiya-13',
    'adygeya-termy-weekend': 'https://amra-turistik.ru/tours/relaks-tur-guamskoe-ushhele-i-termalnye-istochniki-42',
    'abhazia-3-dnya': 'https://amra-turistik.ru/tours/pervomajskie-prazdniki-v-abhazii',
    'verkhnyaya-balkariya-chegem': 'https://amra-turistik.ru/tours/chegem-i-yazyk-trollya-s-krasaviczej-verhnej-balkariej-14',
    'dagestan-4-dnya': 'https://amra-turistik.ru/tours/gornyj-dagestan-za-4-dnya',
    'chechnya-osetiya-4-dnya': 'https://amra-turistik.ru/tours/tri-respubliki-kavkaza-chechnyaingushetiya-i-severnaya-osetiya-13',
    'krym-bolshoe-puteshestvie': 'https://amra-turistik.ru/tours/volshebnyj-zapadnyj-bereg-kryma-3-h-dnevnyj-33',
    'sochi-abhazia-4-dnya': 'https://amra-turistik.ru/tours/strana-morya-solncza-i-neveroyatnoj-krasoty-abhaziya-15',
    'park-loga-1-den': 'https://amra-turistik.ru/tours/velikolepnye-vyhodnye-v-rostovskoj-oblasti-8',
    'volgograd-gorod-geroj': 'https://amra-turistik.ru/tours/po-gorodam-povolzhya-volgograd-ulyanovsk-kazan-nizhnij-novgorod-vladimir-2',
    'elista-kalmykiya-1-den': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-12',
    'groznyj-2-dnya': 'https://amra-turistik.ru/tours/priglashaem-vas-v-chechnyu-21',
    'goryachij-klyuch-park-galitskogo': 'https://amra-turistik.ru/tours/goryachij-klyuch-i-kapibary-i-alpaki-na-ferme-10',
    'sochi-weekend-2-dnya': 'https://amra-turistik.ru/tours/abhaziya-strana-gor-ozer-kanonov-i-vodopadov-5',

    # === AMRA-TOURS.TS ===
    'guzeripl-lago-naki-termy': 'https://amra-turistik.ru/tours/guzeripl-lago-naki-termalnye-istochniki-40',
    'shato-de-talyu-gelendzhik-staryj-park': 'https://amra-turistik.ru/tours/romantichnyj-i-krasivyj-tur-na-poberezhe-zamok-shato-de-talyu-gelendzhik-i-stary-park',
    'stambul-lajt-5-dnej': 'https://amra-turistik.ru/tours/stambul-lajt-tur-na-festival-tyulpanov',
    'stambul-5-dnej-s-gidom': 'https://amra-turistik.ru/tours/stambul-gorod-na-dvuh-kontinentah-gorod-tam-gde-serdcze',
    'spb-kareliya-9-dnej': 'https://amra-turistik.ru/tours/lyubimyj-sankt-peterburg-i-kareliya-7',
    'krym-jubk-novyj-hersones-sevastopol': 'https://amra-turistik.ru/tours/krym-na-lajte-ot-vinnyh-istorij-goliczyna-do-yalty-i-mrii-5',
    'krym-mriya-sakura-yalta-1-den': 'https://amra-turistik.ru/tours/den-schastya-v-krymu-mriya-czvetenie-sakury-i-yalta-2',
    'krym-novyj-svet-mriya-2-dnya': 'https://amra-turistik.ru/tours/krym-na-lajte-ot-vinnyh-istorij-goliczyna-do-yalty-i-mrii-4',
    'krym-mriya-dvorcy-jubk-2-dnya': 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy',
    'gruziya-5-dnej-tblisi-kahetiya': 'https://amra-turistik.ru/tours/edem-v-gruziyu-na-pyat-dnej-4',
    'gruziya-5-dnej-dashbashi': 'https://amra-turistik.ru/tours/edem-v-gruziyu-na-pyat-dnej-3',
    'gruziya-4-dnya': 'https://amra-turistik.ru/tours/solnechnyj-maya-v-gruzii',
    'krasnodar-istoricheskij-centr-ekskursiya': 'https://amra-turistik.ru/tours/krasnodar-krasivyj-yuzhnyj-gorod-ekskursiya-po-istoricheskoj-chasti-goroda-4',
    'park-krasnodar-oblakov-ekskursiya': 'https://amra-turistik.ru/tours/progulka-s-ekskursovodom-po-parku-krasnodar-i-parku-oblakov-8',
    'vsesvyatskoe-kladbishhe-ekskursiya': 'https://amra-turistik.ru/tours/nazad-v-proshloe-kakie-tajny-hranit-vsesvyatskoe-kladbishhe-4',
    'vinnaya-klassika-tri-centra-vinnogo-turizma-1-den': 'https://amra-turistik.ru/tours/vinnaya-klassika-tri-czentra-vinnogo-turizma-6',
    'goryachij-klyuch-kapibary-i-alpaki-1-den': 'https://amra-turistik.ru/tours/goryachij-klyuch-i-kapibary-i-alpaki-na-ferme-10',
    'krasivejshie-smotrovye-lago-naki-1-den': 'https://amra-turistik.ru/tours/krasivejshij-vidovoj-tur-po-smotrovym-lago-naki-2',
    'vesennij-uzbekistan-7-dnej': 'https://amra-turistik.ru/tours/vesennij-uzbekistan-2',
    'vesennee-czvetenie-kryma-2-dnya': 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy-2',
    'pasha-v-abhazii-2-dnya': 'https://amra-turistik.ru/tours/pervomajskie-prazdniki-v-abhazii',
    'krasivaya-doroga-rossii-i-chegem-2-dnya': 'https://amra-turistik.ru/tours/samaya-krasivaya-doroga-v-rossii-i-chegem-7',
    'festival-tyulpanov-kalmykiya-2-dnya': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-strana-bumba-stepi-barhany-poyushhie-peski-i-goryashhaya-voda-3',
    'krasavica-osetiya-2-dnya': 'https://amra-turistik.ru/tours/dvuhdnevnaya-krasavicza-osetiya-13',
    'parad-tyulpanov-krym-dvorcy-2-dnya': 'https://amra-turistik.ru/tours/parad-tyulpanov-v-krymu-i-dvorczy',
    'chegem-yazyk-trollya-verhnyaya-balkariya-2-dnya': 'https://amra-turistik.ru/tours/chegem-i-yazyk-trollya-s-krasaviczej-verhnej-balkariej-14',
    'znakomstvo-s-belarusyu-9-dnej': 'https://amra-turistik.ru/tours/znakomstvo-s-belarusyu-vsya-belorussiya-za-6-dnej-2',
    'gruziya-i-armeniya-7-dnej': 'https://amra-turistik.ru/tours/luchshaya-vesna-v-gruzii-i-armenii',
    'gornyj-dagestan-4-dnya': 'https://amra-turistik.ru/tours/gornyj-dagestan-za-4-dnya',
    'kaliningrad-zhd-avia-tur': 'https://amra-turistik.ru/tours/kaliningrad-zhd-tur-3',
    'solnechnaya-gruziya-bolshoj-tur-9-dnej': 'https://amra-turistik.ru/tours/solnechnaya-gruziya-bolshoj-tur-ot-tbilisi-do-batumi-5',
    'vinodelni-azovskogo-morya-golubickoe-taman': 'https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-pomeste-golubiczkoe-shato-taman-i-progulka-po-tamani-5',
    'kubanskaya-loza-lefkadiya-myshako-abrau': 'https://amra-turistik.ru/tours/romantika-i-vino-lefkadiya-staryj-park-shato-pino-4',
    'mezmaj-orlinaya-polka-guamskoe-termy': 'https://amra-turistik.ru/tours/lyubimyj-mezmaj-orlinaya-polka-guamskoe-ushhele-ot-mezmaya-do-guamki-i-termy-8',
    'skazochnoe-poberezhe-staryj-park-shato-pino-abrau': 'https://amra-turistik.ru/tours/skazochnoe-poberezhe-krasivyj-staryj-park-shato-pino-abrau-7',
    'festival-tyulpanov-kalmykiya-1-den': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-12',
    'vokrug-anapy-800-stupenej-kiparisovoe-abrau': 'https://amra-turistik.ru/tours/vokrug-anapy-i-abrau-800-stupenej-lastochkiny-gnezda-kiparisovoe-ozero-vecher-v-abrau',
    'vodopady-rufabgo-mishoko-konnye': 'https://amra-turistik.ru/tours/vodopady-rufabgo-i-mishoko-vodopady-i-konnye-progulki-4',
    'teshebskie-vodopady-muzej-hleba-i-vina': 'https://amra-turistik.ru/tours/vodopady-i-dolmeny-poberezhya-vodopady-teshebskie-i-reki-zhane-zakat-v-goluboj-bezdne',
    'lago-naki-monastyr-termy-1-den': 'https://amra-turistik.ru/tours/vesna-v-lago-naki-monastyr-termalnye-istochniki',
    'vodopady-mezmaya-temnolesye': 'https://amra-turistik.ru/tours/po-vodopadam-mezmaya-vodopady-temnolesya',
    'rassvet-aj-petri-parad-tyulpanov-dvorcy': 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy-2',
    'rafting-vesna-lago-naki': 'https://amra-turistik.ru/tours/rafting-i-vesna-v-lago-naki-2',
    'tyulpany-mysa-opuk-koyashskoe-kerch': 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch-22',
    'tyulpany-rostovskogo-zapovednika-eko-tropy': 'https://amra-turistik.ru/tours/tyulpany-rostovskogo-zapovednika-i-eko-tropy-3',
    'yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet': 'https://amra-turistik.ru/tours/yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet-i-feodosiya-3',
    'pasha-v-atamani-1-den': 'https://amra-turistik.ru/tours/edem-na-masleniczu-v-ataman',
    'velosea-golubaya-buhta-gelendzhik': 'https://amra-turistik.ru/tours/zahvatyvayushhij-marshrut-velosea-i-gelendzhik-8',
    'mezmaj-orlinaya-polka-verhnekurdzhipskoe': 'https://amra-turistik.ru/tours/lyubimyj-mezmaj-orlinaya-polka-verhnekurdzhipskoe-ushhele-32',
    'relaks-shato-de-talyu-gelendzhik': 'https://amra-turistik.ru/tours/relaks-tur-na-poberezhe-zamok-shato-de-talyu-i-gelendzhik-12',
    'pasha-svyato-mihajlovskij-monastyr-1-den': 'https://amra-turistik.ru/tours/pasha-v-svyato-mihajlovskom-muzhskom-monastyre',
    'parad-tyulpanov-novyj-hersones-1-den': 'https://amra-turistik.ru/tours/bal-hrizantem-i-novyj-hersones',
    'vodopady-zhane-golubaya-bezdna-gelendzhik': 'https://amra-turistik.ru/tours/vodopady-i-dolmeny-r-zhane-golubaya-bezdna-i-romantichnyj-vecher-v-gelendzhike',
    'dva-ozera-dva-morya-tyulpany-generalskie': 'https://amra-turistik.ru/tours/dva-ozera-dva-morya-tyulpany-i-velikolepnye-generalskie-plyazhi-odin-iz-samyh-krasivyh-vesennih-turov',
    'chertov-palec-savranskaya-kanatnaya-lago-naki': 'https://amra-turistik.ru/tours/skala-chertov-palecz-savranskaya-kanatnaya-doroga-lago-naki-6',
    'yazyk-trollya-verhnyaya-balkariya-1-den': 'https://amra-turistik.ru/tours/yazyk-trollya-i-krasavicza-verhnyaya-balkariya-11',
    'abrau-dyurso-po-novomu-gelendzhik': 'https://amra-turistik.ru/tours/abrau-dyurso-po-novomu-i-shato-pino-4',
    'pokhod-po-shapsugskoj-dolmeny-labirint': 'https://amra-turistik.ru/tours/den-v-pohode-po-udivitelnoj-i-zagadochnoj-shapsugskoj-6',
    'plancheskie-skaly-konnaya-ferma-vladimirovka': 'https://amra-turistik.ru/tours/plancheskie-skaly-i-konnaya-ferma-vladimirovka-48',
    'termalnye-istochniki-vodnaya-rivera-pitejnyj-dom': 'https://amra-turistik.ru/tours/termalnye-istochniki-vodnaya-rivera-i-pitejnyj-dom-v-majkope-6',
    'velikolepie-vostochnogo-kryma-zvezdopad-alchak': 'https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchak-kaya-14',
    'vodopady-lazarevskogo-rajona': 'https://amra-turistik.ru/tours/vodopady-lazarevskogo-rajona-9',
    'vokrug-anapy-800-stupenej-vinnyj-grek': 'https://amra-turistik.ru/tours/vokrug-anapy-i-grecziya-i-800-stupenej-lastochkiny-gnezda-kiparisovoe-ozero-vinnoe-podvore-starogo-greka-2',
    'tyulpany-i-piony-kryma': 'https://amra-turistik.ru/tours/tyulpany-i-maki-kryma-3',
    'shato-andre-semigorye-abrau': 'https://amra-turistik.ru/tours/estetika-i-volshebstvo-shato-andre-usadba-semigore-i-abrau-4',
    'fanagoriya-shato-taman-taman': 'https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-fanagoriya-shato-taman-i-progulka-po-tamani-2',
    'morskoj-voyazh-golubaya-bezdna-parus-gelendzhik': 'https://amra-turistik.ru/tours/morskoj-voyazh-golubaya-bezdna-skala-parus-gelendzhik-12',
    'tur-vostorg-shato-pino-staryj-park-gelendzhik': 'https://amra-turistik.ru/tours/tur-vostorg-shato-pino-smotrovye-staryj-park-gelendzhik-6',
}

data_files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
]

total = 0
for fpath in data_files:
    f = pathlib.Path(fpath)
    code = f.read_text(encoding='utf-8')
    count = 0
    for slug, new_url in fixes.items():
        pat = re.compile(
            rf"(slug:\s*'{re.escape(slug)}',\s*\n\s*sourceUrl:\s*')([^']*?)(')"
        )
        m = pat.search(code)
        if m and m.group(2) != new_url:
            code = pat.sub(rf"\g<1>{new_url}\3", code)
            count += 1
    if count:
        f.write_text(code, encoding='utf-8')
    print(f'{f.name}: {count} fixed')
    total += count

print(f'\nTOTAL: {total}')
