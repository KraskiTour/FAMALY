import { readFileSync, writeFileSync } from 'fs';

// For tours with 404 URLs, try base URL without trailing numbers
const tours = [
  { id: '25', url: 'https://amra-turistik.ru/tours/mir-vodopadov-i-vodopadov-5', alt: 'https://amra-turistik.ru/tours/mir-vodopadov-i-vodopadov' },
  { id: '94', url: 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy', alt: 'https://amra-turistik.ru/tours/krym-pinterest-tur-festival-sakury-v-mrie-i-dvorczy-2' },
  { id: '105', url: 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy-2', alt: 'https://amra-turistik.ru/tours/vesennee-czvetenie-kryma-tyulpany-sady-peshhernye-goroda-i-dvorczy' },
  { id: '127', url: 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy-2', alt: 'https://amra-turistik.ru/tours/rassvet-na-aj-petri-bal-hrizantem-i-dvorczy' },
  { id: '129', url: 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch-22', alt: 'https://amra-turistik.ru/tours/tyulpany-mysa-opuk-koyashskoe-ozero-kerch' },
];

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const re = /https?:\/\/amra-turistik\.ru\/wp-content\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
    return [...new Set(html.match(re) || [])].filter(img => !/-\d{2,3}x\d{2,3}\./.test(img)).slice(0, 6);
  } catch { return []; }
}

async function main() {
  const existing = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
  let added = 0;

  for (const t of tours) {
    let photos = await tryFetch(t.url);
    if (photos.length === 0 && t.alt) {
      console.log(`  ID ${t.id}: trying alt URL...`);
      photos = await tryFetch(t.alt);
    }
    // Try with different suffixes
    if (photos.length === 0) {
      const base = t.url.replace(/-\d+$/, '');
      for (let suf = 1; suf <= 20 && photos.length === 0; suf++) {
        photos = await tryFetch(`${base}-${suf}`);
      }
    }
    if (photos.length > 0) {
      existing[t.id] = photos;
      added++;
      console.log(`✓ ID ${t.id}: ${photos.length} photos`);
    } else {
      console.log(`✗ ID ${t.id}: all attempts failed`);
    }
  }

  writeFileSync('scripts/scraped_photos.json', JSON.stringify(existing, null, 2));
  console.log(`\nAdded ${added}`);
}

main();
