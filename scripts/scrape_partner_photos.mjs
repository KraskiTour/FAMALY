/**
 * Scrape gallery photos from partner tour pages.
 * Supports: bolshayastrana.com, amra-turistik.ru, rt.plus
 */

const tours = [
  // Большая Страна
  { id: '27', url: 'https://bolshayastrana.com/sankt-peterburg/shedevry-severnoj-tur-na-5-282642' },
  { id: '28', url: 'https://bolshayastrana.com/sankt-peterburg/semejnye-kanikuly-v-peterburge-343448' },
  { id: '29', url: 'https://bolshayastrana.com/moskva/tri-dnya-v-moskve-345550' },
  { id: '30', url: 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-vesenne-letnij4-390728' },
  { id: '31', url: 'https://bolshayastrana.com/sankt-peterburg/v-peterburg-na-3-dnya-366359' },
  { id: '32', url: 'https://bolshayastrana.com/sankt-peterburg/klassicheskij-sankt-peterburg-7-dnej-250586' },
  { id: '33', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-349297' },
  { id: '34', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburgskaya-kollekciya-tur-na-7-dnej-143627' },
  { id: '35', url: 'https://bolshayastrana.com/sankt-peterburg/osennij-portret-velikogo-goroda-peterburga-tur-na-5-dnej-249693' },
  { id: '36', url: 'https://bolshayastrana.com/leningradskaya-oblast/klassicheskij-peterburg-i-srednevekovyj-vyborg-237791' },
  { id: '37', url: 'https://bolshayastrana.com/sankt-peterburg/semejnye-kanikuly-v-peterburge-6-dnej-227195' },
  { id: '38', url: 'https://bolshayastrana.com/moskva/moskva-den-za-dnem-puteshestvie-za-2-dnya-229605' },
  { id: '39', url: 'https://bolshayastrana.com/moskva/glavnye-dostoprimechatelnosti-moskvy-98037' },
  { id: '40', url: 'https://bolshayastrana.com/moskva/moskva-den-za-dnem-puteshestvie-za-5-dnej-229600' },
  { id: '41', url: 'https://bolshayastrana.com/moskva/moskovskaya-istoriya-za-7-dnej-229413' },
  { id: '42', url: 'https://bolshayastrana.com/moskva/pokazhite-nam-moskvu-moskvichi--229953' },
  { id: '43', url: 'https://bolshayastrana.com/moskva/ya-shagayu-po-moskve-ehkskursionnyj-tur-na-6-dnej-247124' },
  { id: '44', url: 'https://bolshayastrana.com/kazan/dobro-pozhalovat-v-kazan-na-vyhodnye-347239' },
  { id: '45', url: 'https://bolshayastrana.com/tatarstan/dobro-pozhalovat-v-kazan-sokrashchennaya-programma-232037' },
  { id: '46', url: 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-tur-na-5-dnej-386065' },
  { id: '47', url: 'https://bolshayastrana.com/tatarstan/v-kazan-den-za-dnem-tur-na-5-dnej-386065' },
  { id: '48', url: 'https://bolshayastrana.com/tatarstan/zolotoj-kazan-i-krasnyj-gorod-234546' },
  { id: '49', url: 'https://bolshayastrana.com/sankt-peterburg/peterburg-lajt-3-dnya-366293' },
  { id: '50', url: 'https://bolshayastrana.com/sankt-peterburg/belye-nochi-v-severnoj-stolice-362802' },
  { id: '51', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-349297' },
  { id: '52', url: 'https://bolshayastrana.com/leningradskaya-oblast/mnogolikij-peterburg-i-neizvestnyj-vyborg-388006' },
  { id: '53', url: 'https://bolshayastrana.com/leningradskaya-oblast/svyatye-kupola-sankt-peterburga-i-valaama-246050' },
  { id: '54', url: 'https://bolshayastrana.com/leningradskaya-oblast/top-3-sankt-peterburg-vyborg-kareliya-246628' },
  { id: '68', url: 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/maloe-zolotoe-kolco-rossii-245179' },
  { id: '69', url: 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/goroda-zolotoj-rusi-247031' },
  { id: '70', url: 'https://bolshayastrana.com/tury-po-zolotomu-kolcu/na-2-dnya' },
  { id: '71', url: 'https://bolshayastrana.com/yaroslavskaya-oblast/zolotoe-kolco-vsyo-luchshee-za-3-dnya-229544' },
  // Amra (with Unsplash)
  { id: '4', url: 'https://amra-turistik.ru/tours/abrau-dyurso-po-novomu-i-shato-pino-2/' },
  { id: '7', url: 'https://amra-turistik.ru/tours/vesna-v-gorah-arhyza-dzhip-den-3' },
  { id: '8', url: 'https://amra-turistik.ru/tours/dombaj-vesnoj' },
  { id: '9', url: 'https://amra-turistik.ru/tours/puteshestvie-v-prielbruse-ozero-donguz-orun-kyol-terskol-chegemskie-vodopady' },
  { id: '10', url: 'https://amra-turistik.ru/tours/dvuhdnevnaya-krasavicza-osetiya-13' },
  { id: '12', url: 'https://amra-turistik.ru/tours/pervomajskie-prazdniki-v-abhazii' },
  { id: '18', url: 'https://amra-turistik.ru/tours/chegem-i-yazyk-trollya-s-krasaviczej-verhnej-balkariej-14' },
  { id: '13', url: 'https://amra-turistik.ru/tours/gornyj-dagestan-za-4-dnya' },
  { id: '14', url: 'https://amra-turistik.ru/tours/tri-respubliki-kavkaza-chechnyaingushetiya-i-severnaya-osetiya' },
  { id: '15', url: 'https://amra-turistik.ru/tours/volshebnyj-zapadnyj-bereg-kryma-3-h-dnevnyj-33' },
  { id: '16', url: 'https://amra-turistik.ru/tours/strana-morya-solncza-i-neveroyatnoj-krasoty-abhaziya-15' },
  { id: '21', url: 'https://amra-turistik.ru/tours/po-gorodam-povolzhya-volgograd-ulyanovsk-kazan-nizhnij-novgorodvladimir' },
  { id: '23', url: 'https://amra-turistik.ru/tours/priglashaem-vas-v-chechnyu-21' },
  { id: '25', url: 'https://amra-turistik.ru/tours/mir-vodopadov-i-vodopadov-5' },
  { id: '91', url: 'https://amra-turistik.ru/tours/krym-na-lajte-ot-vinnyh-istorij-goliczyna-do-yalty-i-mrii-5' },
  { id: '92', url: 'https://amra-turistik.ru/tours/den-schastya-v-krymu-mriya-czvetenie-sakury-i-yalta-2' },
  { id: '93', url: 'https://amra-turistik.ru/tours/krym-na-lajte-ot-vinnyh-istorij-goliczyna-do-yalty-i-mrii-4' },
  { id: '94', url: 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy' },
  { id: '101', url: 'https://amra-turistik.ru/tours/vinnaya-klassika-tri-czentra-vinnogo-turizma-6' },
  { id: '105', url: 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy' },
  { id: '110', url: 'https://amra-turistik.ru/tours/parad-tyulpanov-v-krymu-i-dvorczy' },
  { id: '127', url: 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy-2' },
  { id: '129', url: 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch-22' },
  { id: '131', url: 'https://amra-turistik.ru/tours/yugo-vostochnoe-poberezhe-kryma-sudak-novyj-svet-i-feodosiya' },
  { id: '137', url: 'https://amra-turistik.ru/tours/bal-hrizantem-i-novyj-hersones' },
  { id: '139', url: 'https://amra-turistik.ru/tours/dva-ozera-dva-morya-tyulpany-i-velikolepnye-generalskie-plyazhi' },
  { id: '146', url: 'https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchaka' },
  { id: '149', url: 'https://amra-turistik.ru/tours/tyulpany-i-maki-kryma-3' },
];

function extractBolshayaStranaImages(html) {
  // Images from bolshayastrana use CDN patterns
  const patterns = [
    /https?:\/\/[a-z0-9.-]*bolshayastrana\.com\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
    /https?:\/\/cdn[a-z0-9.-]*\.[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
    /https?:\/\/[a-z0-9.-]*storage[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
  ];
  const all = new Set();
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const url = m[0];
      if (!/icon|logo|avatar|favicon|sprite|placeholder/i.test(url)) {
        all.add(url);
      }
    }
  }
  return [...all].slice(0, 6);
}

function extractAmraImages(html) {
  const re = /https?:\/\/amra-turistik\.ru\/wp-content\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
  const all = [...new Set(html.match(re) || [])];
  return all.filter(img => !/-\d{2,3}x\d{2,3}\./.test(img)).slice(0, 6);
}

async function scrape(tour) {
  try {
    const res = await fetch(tour.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    if (!res.ok) return [];
    const html = await res.text();

    if (tour.url.includes('bolshayastrana')) return extractBolshayaStranaImages(html);
    if (tour.url.includes('amra-turistik')) return extractAmraImages(html);
    return [];
  } catch (e) {
    return [];
  }
}

async function main() {
  const results = {};
  let scraped = 0, failed = 0;

  // Process in batches of 5 for speed
  for (let i = 0; i < tours.length; i += 5) {
    const batch = tours.slice(i, i + 5);
    const promises = batch.map(async (t) => {
      const photos = await scrape(t);
      if (photos.length > 0) {
        results[t.id] = photos;
        scraped++;
        process.stdout.write(`✓ ID ${t.id} (${photos.length}) `);
      } else {
        failed++;
        process.stdout.write(`✗ ID ${t.id} `);
      }
    });
    await Promise.all(promises);
  }

  console.log(`\n\nScraped: ${scraped} | Failed: ${failed}`);

  // Write results as JSON for the inject script
  const { writeFileSync } = await import('fs');
  writeFileSync('scripts/scraped_photos.json', JSON.stringify(results, null, 2));
  console.log(`Results saved to scripts/scraped_photos.json`);
}

main();
