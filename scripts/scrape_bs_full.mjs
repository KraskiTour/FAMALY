/**
 * Full scraper for Bolshaya Strana tours.
 * Extracts: all unique gallery images (best quality), dates, descriptions.
 */
import { readFileSync, writeFileSync } from 'fs';

// Get all BS tour URLs from data files
function getTours() {
  const files = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];
  const tours = [];
  for (const f of files) {
    const code = readFileSync(f, 'utf-8');
    const re = /\{\s*\n\s*id:\s*'(\d+)'/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const start = m.index;
      let depth = 0, i = start;
      while (i < code.length) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') { depth--; if (depth === 0) break; }
        i++;
      }
      const block = code.slice(start, i + 1);
      const srcOp = (block.match(/sourceOperator:\s*'([^']*)'/) || [])[1] || '';
      if (!srcOp.includes('Большая Страна')) continue;
      const srcUrl = (block.match(/sourceUrl:\s*'([^']*)'/) || [])[1] || '';
      const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '';
      tours.push({ id: m[1], url: srcUrl, title, file: f });
    }
  }
  return tours;
}

async function scrapeTour(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { images: [], dates: [], error: `HTTP ${res.status}` };
    const html = await res.text();

    // Extract ALL unique image hashes from imcdn URLs
    const imgHashes = new Set();
    const imgRe = /imcdn\.bolshayastrana\.com\/\d+x\d+\/(BS_[a-f0-9]+)/g;
    for (const m of html.matchAll(imgRe)) {
      imgHashes.add(m[1]);
    }

    // Build high-quality URLs (880x600 is good for gallery)
    const images = [...imgHashes].map(hash => `https://imcdn.bolshayastrana.com/880x600/${hash}`);

    // Extract dates from HTML
    // Look for date patterns like "14 окт. – 18 окт." or structured date data
    const dates = [];
    // Try JSON-LD or structured data first
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    
    // Try text date patterns
    const months = { 'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04', 'мая': '05', 'май': '05', 'июн': '06', 'июл': '07', 'авг': '08', 'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12' };
    const dateRe = /(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)\w*\.\s*[–—-]\s*(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)/gi;
    for (const dm of html.matchAll(dateRe)) {
      const startDay = dm[1].padStart(2, '0');
      const startMonth = months[dm[2].toLowerCase().slice(0, 3)] || '01';
      const endDay = dm[3].padStart(2, '0');
      const endMonth = months[dm[4].toLowerCase().slice(0, 3)] || '01';
      const year = '2026';
      dates.push({
        start: `${year}-${startMonth}-${startDay}`,
        end: `${year}-${endMonth}-${endDay}`,
      });
    }

    // Extract price
    let price = null;
    const priceMatch = html.match(/от\s*RUB\s*([\d\s,]+)/i) || html.match(/(\d[\d\s]{2,})\s*₽/);
    if (priceMatch) {
      price = parseInt(priceMatch[1].replace(/[\s,]/g, ''));
    }

    return { images, dates, price };
  } catch (e) {
    return { images: [], dates: [], error: e.message };
  }
}

async function main() {
  const tours = getTours();
  console.log(`Найдено ${tours.length} туров Большой Страны\n`);

  const results = {};
  
  // Process in batches of 4
  for (let i = 0; i < tours.length; i += 4) {
    const batch = tours.slice(i, i + 4);
    const promises = batch.map(async (t) => {
      const data = await scrapeTour(t.url);
      results[t.id] = { ...data, title: t.title, url: t.url };
      const status = data.error ? `✗ ${data.error}` : `✓ ${data.images.length} img, ${data.dates.length} dates`;
      console.log(`ID ${t.id}: ${status} | ${t.title.slice(0, 40)}`);
    });
    await Promise.all(promises);
  }

  writeFileSync('scripts/bs_scraped_data.json', JSON.stringify(results, null, 2));
  
  // Summary
  let totalImages = 0, totalDates = 0, toursWithDates = 0;
  for (const [id, data] of Object.entries(results)) {
    totalImages += data.images?.length || 0;
    totalDates += data.dates?.length || 0;
    if (data.dates?.length > 0) toursWithDates++;
  }
  
  console.log(`\n=== ИТОГО ===`);
  console.log(`Фото: ${totalImages} (в среднем ${Math.round(totalImages / tours.length)} на тур)`);
  console.log(`Дат: ${totalDates} (у ${toursWithDates} из ${tours.length} туров)`);
}

main();
