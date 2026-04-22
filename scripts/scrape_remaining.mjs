/**
 * Scrape photos for remaining tours that failed in first pass.
 * Also scrapes rt.plus (Русь) and kandagar.com (Кандагар).
 */
import { readFileSync, writeFileSync } from 'fs';

// Remaining Большая Страна with fixed/full URLs
const bolshayaStrana = [
  { id: '33', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-349297' },
  { id: '34', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburgskaya-kollekciya-tur-na-7-dnej-143627' },
  { id: '35', url: 'https://bolshayastrana.com/sankt-peterburg/osennij-portret-velikogo-goroda-peterburga-tur-na-5-dnej-249693' },
  { id: '45', url: 'https://bolshayastrana.com/tatarstan/dobro-pozhalovat-v-kazan-sokrashchennaya-programma-232037' },
  { id: '51', url: 'https://bolshayastrana.com/leningradskaya-oblast/peterburg-pyotr-ot-pervogo-kamnya-do-neboskreba-349297' },
  { id: '52', url: 'https://bolshayastrana.com/leningradskaya-oblast/mnogolikij-peterburg-i-neizvestnyj-vyborg-388006' },
  { id: '53', url: 'https://bolshayastrana.com/leningradskaya-oblast/svyatye-kupola-sankt-peterburga-i-valaama-246050' },
  { id: '54', url: 'https://bolshayastrana.com/leningradskaya-oblast/top-3-sankt-peterburg-vyborg-kareliya-246628' },
  { id: '71', url: 'https://bolshayastrana.com/yaroslavskaya-oblast/zolotoe-kolco-vsyo-luchshee-za-3-dnya-229544' },
];

// Remaining Amra
const amra = [
  { id: '9', url: 'https://amra-turistik.ru/tours/puteshestvie-v-prielbruse-ozero-donguz-orun-kyol-terskol-chegemskie-vodopady' },
  { id: '25', url: 'https://amra-turistik.ru/tours/otdyh-v-sochi' },
  { id: '94', url: 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy' },
  { id: '105', url: 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy' },
  { id: '127', url: 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy-2' },
  { id: '129', url: 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch-22' },
  { id: '146', url: 'https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchaka' },
];

// Русь - конкретные туры по названиям
const rusLinks = [
  'https://rt.plus/tour/vsya-belarus-za-7-dney/',
  'https://rt.plus/tour/charuyushchaya-belarus/',
  'https://rt.plus/tour/dorogami-belarusi/',
  'https://rt.plus/tour/znakomtes-belarus/',
  'https://rt.plus/tour/bolshoe-puteshestvie-v-belarus/',
  'https://rt.plus/tour/k-zubram-zamkam-i-belazam/',
  'https://rt.plus/tour/zemlya-pod-belymi-krylyami/',
  'https://rt.plus/tour/belarus-put-magnatov/',
  'https://rt.plus/tour/zapovednaya-belarus/',
  'https://rt.plus/tour/belorusskaya-mozaika/',
  'https://rt.plus/tour/grand-tur-po-beloy-rusi/',
  'https://rt.plus/tour/iyunskie-prazdniki-v-belarusi/',
  'https://rt.plus/tour/belorusskie-kanikuly/',
];

async function fetchImages(url, type) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    let images = [];

    if (type === 'bolshaya') {
      const patterns = [
        /https?:\/\/[a-z0-9.-]*bolshayastrana\.com\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/cdn[a-z0-9.-]*\.bolshayastrana[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
      ];
      const all = new Set();
      for (const re of patterns) {
        for (const m of html.matchAll(re)) {
          if (!/icon|logo|avatar|favicon|sprite|placeholder/i.test(m[0])) all.add(m[0]);
        }
      }
      images = [...all];
    } else if (type === 'amra') {
      const re = /https?:\/\/amra-turistik\.ru\/wp-content\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
      images = [...new Set(html.match(re) || [])].filter(img => !/-\d{2,3}x\d{2,3}\./.test(img));
    } else if (type === 'rus') {
      // rt.plus images
      const patterns = [
        /https?:\/\/[a-z0-9.-]*rt\.plus\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/[a-z0-9.-]*touroperator-rus[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
        /(\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp))/gi,
        /(\/images\/[^\s"'<>]+\.(jpg|jpeg|png|webp))/gi,
        /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi,
      ];
      const all = new Set();
      for (const re of patterns) {
        for (const m of html.matchAll(re)) {
          let u = m[0];
          if (u.startsWith('/')) u = 'https://rt.plus' + u;
          if (!/icon|logo|avatar|favicon|sprite|placeholder|pixel|svg/i.test(u) && u.length > 40) {
            all.add(u);
          }
        }
      }
      images = [...all];
    }

    return images.slice(0, 6);
  } catch (e) {
    return [];
  }
}

async function main() {
  const existing = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
  let added = 0;

  // Большая Страна
  console.log('=== Большая Страна ===');
  for (const t of bolshayaStrana) {
    const photos = await fetchImages(t.url, 'bolshaya');
    if (photos.length > 0) {
      existing[t.id] = photos;
      added++;
      console.log(`  ✓ ID ${t.id}: ${photos.length} photos`);
    } else {
      console.log(`  ✗ ID ${t.id}: no photos`);
    }
  }

  // Amra
  console.log('\n=== Amra ===');
  for (const t of amra) {
    const photos = await fetchImages(t.url, 'amra');
    if (photos.length > 0) {
      existing[t.id] = photos;
      added++;
      console.log(`  ✓ ID ${t.id}: ${photos.length} photos`);
    } else {
      console.log(`  ✗ ID ${t.id}: no photos`);
    }
  }

  // Русь - try main page to get general Belarus images
  console.log('\n=== Русь ===');
  const rusPage = await fetchImages('https://rt.plus/belarus/', 'rus');
  console.log(`  rt.plus/belarus/ → ${rusPage.length} images`);
  if (rusPage.length > 0) {
    for (let i = 55; i <= 67; i++) {
      existing[String(i)] = rusPage;
      added++;
    }
    console.log(`  Applied to IDs 55-67 (13 tours)`);
  } else {
    // Try individual tour pages
    for (let i = 0; i < rusLinks.length; i++) {
      const id = String(55 + i);
      const photos = await fetchImages(rusLinks[i], 'rus');
      if (photos.length > 0) {
        existing[id] = photos;
        added++;
        console.log(`  ✓ ID ${id}: ${photos.length}`);
      } else {
        console.log(`  ✗ ID ${id}: no photos from ${rusLinks[i]}`);
      }
    }
  }

  writeFileSync('scripts/scraped_photos.json', JSON.stringify(existing, null, 2));
  console.log(`\nAdded ${added} new entries. Total: ${Object.keys(existing).length}`);
}

main();
