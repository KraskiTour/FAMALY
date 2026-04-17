import pathlib

mapping = {
    'abrau-dyurso-po-novomu-gelendzhik': 'https://amra-turistik.ru/tours/abrau-dyurso-po-novomu-i-shato-pino-2/',
    'abrau-eko-tropa-shato-pino': 'https://amra-turistik.ru/tours/abrau-dyurso-po-novomu-i-shato-pino-2/',
    'abrau-novorossijsk-gelendzhik-1-den': 'https://amra-turistik.ru/tours/lyubimaya-klassika-ot-abrau-do-gelendzhika-3/',
    'chegem-yazyk-trollya-verhnyaya-balkariya-2-dnya': 'https://amra-turistik.ru/tours/chegem-i-yazyk-trollya-s-krasaviczej-verhnej-balkariej-11/',
    'chertov-palec-savranskaya-kanatnaya-lago-naki': 'https://amra-turistik.ru/tours/skala-chertov-palecz-savranskaya-kanatnaya-doroga-lago-naki-6/',
    'dva-ozera-dva-morya-tyulpany-generalskie': 'https://amra-turistik.ru/tours/dva-ozera-dva-morya-tyulpany-i-velikolepnye-generalskie-plyazhi-odin-iz-samyh-krasivyh-vesennih-turov/',
    'fanagoriya-shato-taman-taman': 'https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-fanagoriya-shato-taman-i-progulka-po-tpmani/',
    'festival-tyulpanov-kalmykiya-1-den': 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-12/',
    'golubickoe-anapa-supsex': 'https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-pomeste-golubiczkoe-shato-taman-i-progulka-po-tamani-3/',
    'gornyj-dagestan-4-dnya': 'https://amra-turistik.ru/tours/gornyj-dagestan-za-5-dnej-2/',
    'goryachij-klyuch-kapibary-i-alpaki-1-den': 'https://amra-turistik.ru/tours/goryachij-klyuch-i-kapibary-i-alpaki-na-ferme-9/',
    'guamka-termy-relaks': 'https://amra-turistik.ru/tours/relaks-tur-guamskoe-ushhele-i-termalnye-istochniki-40/',
    'guzeripl-lago-naki-termy': 'https://amra-turistik.ru/tours/guzeripl-lago-naki-termalnye-istochniki-39/',
    'kaliningrad-zhd-avia-tur': 'https://amra-turistik.ru/tours/kaliningrad-zhd-tur/',
    'krasivaya-doroga-rossii-i-chegem-2-dnya': 'https://amra-turistik.ru/tours/samaya-krasivaya-doroga-v-rossii-i-chegem-2/',
    'krasivejshie-smotrovye-lago-naki-1-den': 'https://amra-turistik.ru/tours/krasivejshij-vidovoj-tur-po-smotrovym-lago-naki-2/',
    'krasnodar-istoricheskij-centr-ekskursiya': 'https://amra-turistik.ru/tours/ekskursiya-po-krasnodaru/',
    'kubanskaya-loza-lefkadiya-myshako-abrau': 'https://amra-turistik.ru/tours/kubanskaya-loza-dolina-lefkadiya-starejshaya-vinodelnya-myshako-i-vecher-v-abrau-3/',
    'lago-naki-monastyr-termy-1-den': 'https://amra-turistik.ru/tours/rozhdestvo-v-svyato-mihajlovskom-monastyre-pokatushki-v-lago-naki-termalnye-istochniki/',
    'lefkadiya-staryj-park-shato-pino': 'https://amra-turistik.ru/tours/romantika-i-vino-lefkadiya-staryj-park-shato-pino-3/',
    'mezmaj-orlinaya-polka-guamskoe-termy': 'https://amra-turistik.ru/tours/lyubimyj-mezmaj-orlinaya-polka-guamskoe-ushhele-ot-mezmaya-do-guamki-i-termy-8/',
    'mezmaj-orlinaya-polka-verhnekurdzhipskoe': 'https://amra-turistik.ru/tours/lyubimyj-mezmaj-orlinaya-polka-verhnekurdzhipskoe-ushhele-32/',
    'morskoj-voyazh-golubaya-bezdna-parus-gelendzhik': 'https://amra-turistik.ru/tours/morskoj-voyazh-golubaya-bezdna-skala-parus-gelendzhik-10/',
    'parad-tyulpanov-novyj-hersones-1-den': 'https://amra-turistik.ru/tours/bal-hrizantem-i-novyj-hersones/',
    'park-krasnodar-oblakov-ekskursiya': 'https://amra-turistik.ru/tours/ekskursiya-park-krasnodar/',
    'pasha-svyato-mihajlovskij-monastyr-1-den': 'https://amra-turistik.ru/tours/rozhdestvo-v-svyato-mihajlovskom-monastyre-pokatushki-v-lago-naki-termalnye-istochniki/',
    'pasha-v-atamani-1-den': 'https://amra-turistik.ru/tours/edem-na-masleniczu-v-ataman/',
    'plancheskie-skaly-konnaya-ferma-vladimirovka': 'https://amra-turistik.ru/tours/plancheskie-skaly-i-konnaya-ferma-vladimirovka-44/',
    'pokhod-po-shapsugskoj-dolmeny-labirint': 'https://amra-turistik.ru/tours/den-v-pohode-po-udivitelnoj-i-zagadochnoj-shapsugskoj-6/',
    'rafting-vesna-lago-naki': 'https://amra-turistik.ru/tours/rafting-i-vesna-v-lago-naki-2/',
    'rassvet-aj-petri-parad-tyulpanov-dvorcy': 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-parad-tyulpanov-i-dvorcztovaya-naberzhnaya/',
    'relaks-shato-de-talyu-gelendzhik': 'https://amra-turistik.ru/tours/relaks-tur-na-poberezhe-zamok-shato-de-talyu-i-gelendzhik-12/',
    'shato-andre-semigorye-abrau': 'https://amra-turistik.ru/tours/estetika-i-volshebstvo-shato-andre-usadba-semigore-i-abrau-4/',
    'shato-de-talyu-gelendzhik-staryj-park': 'https://amra-turistik.ru/tours/romantichnyj-i-krasivyj-tur-na-poberezhe-zamok-shato-de-talyu-gelendzhik-i-stary-park/',
    'skazochnoe-poberezhe-staryj-park-shato-pino-abrau': 'https://amra-turistik.ru/tours/skazochnoe-poberezhe-krasivyj-staryj-park-shato-pino-abrau-7/',
    'solnechnaya-gruziya-bolshoj-tur-9-dnej': 'https://amra-turistik.ru/tours/solnechnaya-gruziya-bolshoj-tur-ot-tbilisi-do-batumi-4/',
    'termalnye-istochniki-vodnaya-rivera-pitejnyj-dom': 'https://amra-turistik.ru/tours/termalnye-istochniki-vodnaya-rivera-i-pitejnyj-dom-v-majkope-6/',
    'teshebskie-vodopady-muzej-hleba-i-vina': 'https://amra-turistik.ru/tours/teshebskie-gebiusskie-vodopady-i-ekskursiya-i-degustacziya-v-muzee-hleba-i-vina-v-arhipo-osipovke/',
    'tur-vostorg-shato-pino-staryj-park-gelendzhik': 'https://amra-turistik.ru/tours/tur-vostorg-shato-pino-smotrovye-staryj-park-gelendzhik-6/',
    'tyulpany-i-piony-kryma': 'https://amra-turistik.ru/tours/tyulpany-i-maki-kryma-3/',
    'tyulpany-mysa-opuk-koyashskoe-kerch': 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-i-kerch/',
    'tyulpany-rostovskogo-zapovednika-eko-tropy': 'https://amra-turistik.ru/tours/tyulpany-rostovskogo-zapovednika-i-eko-tropy-3/',
    'velikolepie-vostochnogo-kryma-zvezdopad-alchak': 'https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchak-kaya-13/',
    'velosea-golubaya-buhta-gelendzhik': 'https://amra-turistik.ru/tours/zahvatyvayushhij-marshrut-velosea-i-gelendzhik-6/',
    'vinnaya-klassika-tri-centra-vinnogo-turizma-1-den': 'https://amra-turistik.ru/tours/vinnaya-klassika-tri-czentra-vinnogo-turizma-6/',
    'vinodelni-azovskogo-morya-golubickoe-taman': 'https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-fanagoriya-shato-taman-i-progulka-po-tpmani/',
    'vodopady-lazarevskogo-rajona': 'https://amra-turistik.ru/tours/vodopady-lazarevskogo-rajona-9/',
    'vodopady-mezmaya-temnolesye': 'https://amra-turistik.ru/tours/po-vodopadam-mezmaya-vodopady-temnolesya/',
    'vodopady-rufabgo-mishoko-konnye': 'https://amra-turistik.ru/tours/vesennie-vodopady-rufabgo-i-mishoko-vodopady-i-konnye-progulki-2/',
    'vodopady-zhane-golubaya-bezdna-gelendzhik': 'https://amra-turistik.ru/tours/vodopady-i-dolmeny-r-zhane-golubaya-bezdna-i-romantichnyj-vecher-v-novogodnem-gelendzhike-2/',
    'vodopady-zhane-golubaya-bezdna-parus': 'https://amra-turistik.ru/tours/vodopady-i-dolmeny-r-zhane-golubaya-bezdna-skala-parus-13/',
    'vokrug-anapy-800-stupenej-kiparisovoe-abrau': 'https://amra-turistik.ru/tours/vokrug-anapy-i-abrau-800-stupenej-lastochkiny-gnezda-kiparisovoe-ozero-vecher-v-abrau/',
    'vokrug-anapy-800-stupenej-vinnyj-grek': 'https://amra-turistik.ru/tours/vokrug-anapy-800-stupenej-lastochkiny-gnezda-kiparisovoe-ozero-i-vecher-v-anape/',
    'vsesvyatskoe-kladbishhe-ekskursiya': 'https://amra-turistik.ru/tours/ekskursiya-vsesvyatskoe/',
    'yazyk-trollya-verhnyaya-balkariya-1-den': 'https://amra-turistik.ru/tours/yazyk-trollya-i-krasavicza-verhnyaya-balkariya-8/',
    'yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet': 'https://amra-turistik.ru/tours/yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet-i-feodosiya-3/',
    'znakomstvo-s-belarusyu-9-dnej': 'https://amra-turistik.ru/tours/znakomstvo-s-belarusyu-vsya-belorussiya-za-6-dnej/',
}

f = pathlib.Path(r'c:\COD\FAMALY\data\amra-tours.ts')
code = f.read_text(encoding='utf-8')
count = 0
for slug, url in mapping.items():
    old = f"slug: '{slug}',"
    if old in code:
        new = f"slug: '{slug}',\n    sourceUrl: '{url}',\n    sourceOperator: 'Amra Turistik',"
        code = code.replace(old, new, 1)
        count += 1
f.write_text(code, encoding='utf-8')
print(f'Patched {count} tours')
