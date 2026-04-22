import { readFileSync, writeFileSync } from 'fs';

const tours = [
  // Большая Страна - corrected URLs
  { id: '33', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-vesna-leto-244639' },
  { id: '34', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburgskaya-kollekciya-tur-na-7-dnej-167025' },
  { id: '35', url: 'https://bolshayastrana.com/sankt-peterburg/osennij-portret-velikogo-goroda-peterburga-tur-na-7-dnej-238030' },
  { id: '45', url: 'https://bolshayastrana.com/tatarstan/dobro-pozhalovat-v-kazan-sokrashchennaya-programma-239877' },
  { id: '51', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-239657' },
  { id: '52', url: 'https://bolshayastrana.com/leningradskaya-oblast/mnogolikij-peterburg-i-neizvestnyj-vyborg-362983' },
  { id: '53', url: 'https://bolshayastrana.com/leningradskaya-oblast/svyatye-kupola-sankt-peterburga-i-valaama-365553' },
  { id: '54', url: 'https://bolshayastrana.com/leningradskaya-oblast/top-3-sankt-peterburg-vyborg-kareliya-246450' },
  { id: '71', url: 'https://bolshayastrana.com/yaroslavskaya-oblast/zolotoe-kolco-vsyo-luchshee-za-3-dnya-229560' },
  // Amra - corrected URLs
  { id: '9', url: 'https://amra-turistik.ru/tours/puteshestvie-v-prielbruse-ozero-donguz-orun-kyol-terskolskoe-ushhele-i-vodopad-terskol-3' },
  { id: '25', url: 'https://amra-turistik.ru/tours/mir-vodopadov-i-vodopadov-5' },
  { id: '94', url: 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy' },
  { id: '105', url: 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy-2' },
  { id: '127', url: 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy-2' },
  { id: '129', url: 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch-22' },
  { id: '146', url: 'https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchak-kaya-14' },
];

async function fetchImages(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { images: [], status: res.status };
    const html = await res.text();
    let images = [];

    if (url.includes('bolshayastrana')) {
      const patterns = [
        /https?:\/\/[a-z0-9.-]*bolshayastrana\.com\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/cdn[^\s"'<>]*bolshaya[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
        // Look for image URLs in data attributes, JSON, or srcset
        /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
      ];
      const all = new Set();
      for (const re of patterns) {
        for (const m of html.matchAll(re)) {
          const u = m[0];
          if (!/icon|logo|avatar|favicon|sprite|placeholder|pixel|svg|\.min\./i.test(u) && u.length > 40) {
            all.add(u);
          }
        }
      }
      // Filter to tour-related images
      images = [...all].filter(u => 
        u.includes('bolshayastrana') || u.includes('tour') || u.includes('excursion') || 
        u.includes('upload') || u.includes('photo') || u.includes('img')
      );
      if (images.length === 0) images = [...all]; // fallback
    } else if (url.includes('amra-turistik')) {
      const re = /https?:\/\/amra-turistik\.ru\/wp-content\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
      images = [...new Set(html.match(re) || [])].filter(img => !/-\d{2,3}x\d{2,3}\./.test(img));
    }

    return { images: images.slice(0, 6), status: res.status };
  } catch (e) {
    return { images: [], status: e.message };
  }
}

async function main() {
  const existing = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
  let added = 0;

  for (const t of tours) {
    const { images, status } = await fetchImages(t.url);
    if (images.length > 0) {
      existing[t.id] = images;
      added++;
      console.log(`✓ ID ${t.id}: ${images.length} photos`);
    } else {
      console.log(`✗ ID ${t.id}: status=${status}`);
    }
  }

  writeFileSync('scripts/scraped_photos.json', JSON.stringify(existing, null, 2));
  console.log(`\nAdded ${added}. Total: ${Object.keys(existing).length}`);
}

main();
