/**
 * Fix Bolshaya Strana tours:
 * 1. Scrape actual "от" price from each tour page
 * 2. Re-scrape ALL dates properly (fix missed November dates etc.)
 * 3. Update priceFrom and nextDates in data files
 */
import { readFileSync, writeFileSync } from 'fs';

function getTourUrls() {
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
      const durationDays = parseInt((block.match(/durationDays:\s*(\d+)/) || [])[1] || '1');
      tours.push({ id: m[1], url: srcUrl, title, durationDays, file: f });
    }
  }
  return tours;
}

const months = {
  'янв': 1, 'фев': 2, 'мар': 3, 'апр': 4, 'мая': 5, 'май': 5,
  'июн': 6, 'июл': 7, 'авг': 8, 'сен': 9, 'окт': 10, 'ноя': 11, 'дек': 12
};

function parseDate(dayStr, monthStr) {
  const day = parseInt(dayStr);
  const monthKey = monthStr.toLowerCase().replace(/\.$/, '').slice(0, 3);
  const month = months[monthKey];
  if (!month || !day) return null;
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function scrapeTour(url, durationDays) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { price: null, dates: [], error: `HTTP ${res.status}` };
    const html = await res.text();

    // Extract price "от RUB XX,XXX" or "от XX XXX"
    let price = null;
    const pricePatterns = [
      /от\s*RUB\s*([\d\s,.]+)/i,
      /от\s*([\d\s,.]+)\s*₽/i,
      /от\s*([\d\s,.]+)\s*руб/i,
      /"price"\s*:\s*([\d.]+)/,
    ];
    for (const re of pricePatterns) {
      const m = html.match(re);
      if (m) {
        price = Math.round(parseFloat(m[1].replace(/[\s,]/g, '').replace(/\.(?=\d{3})/, '')));
        if (price > 1000) break;
      }
    }

    // Extract dates - match patterns like "14 окт. – 18 окт." OR "14 окт."
    // Also handle single-date format "14 окт." (start date only)
    const dates = [];
    const seen = new Set();
    
    // Pattern 1: "DD mon. – DD mon." (full range)
    const rangeRe = /(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)\w*\.?\s*[–—-]\s*(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)\w*\.?/gi;
    for (const m of html.matchAll(rangeRe)) {
      const start = parseDate(m[1], m[2]);
      const end = parseDate(m[3], m[4]);
      if (start && end && start >= '2026-04-15') {
        const key = `${start}_${end}`;
        if (!seen.has(key)) {
          seen.add(key);
          dates.push({ start, end });
        }
      }
    }

    // Pattern 2: standalone "DD mon." (use durationDays to compute end)
    const singleRe = /(\d{1,2})\s+(янв|фев|мар|апр|мая|май|июн|июл|авг|сен|окт|ноя|дек)\w*\./gi;
    for (const m of html.matchAll(singleRe)) {
      const start = parseDate(m[1], m[2]);
      if (start && start >= '2026-04-15') {
        const end = addDays(start, durationDays - 1);
        const key = `${start}_${end}`;
        if (!seen.has(key)) {
          seen.add(key);
          dates.push({ start, end });
        }
      }
    }

    // Sort by start date
    dates.sort((a, b) => a.start.localeCompare(b.start));

    return { price, dates };
  } catch (e) {
    return { price: null, dates: [], error: e.message };
  }
}

async function main() {
  const tours = getTourUrls();
  console.log(`Scraping ${tours.length} Bolshaya Strana tours...\n`);

  const results = {};
  for (let i = 0; i < tours.length; i += 4) {
    const batch = tours.slice(i, i + 4);
    await Promise.all(batch.map(async (t) => {
      const data = await scrapeTour(t.url, t.durationDays);
      results[t.id] = data;
      const status = data.error ? `✗ ${data.error}` :
        `✓ price=${data.price || '?'} dates=${data.dates.length}`;
      console.log(`ID ${t.id}: ${status} | ${t.title.slice(0, 45)}`);
    }));
  }

  // Now update data files
  for (const filePath of ['data/mock-tours.ts', 'data/golden-ring-tours.ts']) {
    let code = readFileSync(filePath, 'utf-8');
    const replacements = [];

    for (const [id, data] of Object.entries(results)) {
      const idPattern = `id: '${id}'`;
      const idIdx = code.indexOf(idPattern);
      if (idIdx === -1) continue;

      const chunk = code.slice(idIdx, Math.min(idIdx + 15000, code.length));

      // Update priceFrom
      if (data.price) {
        const priceFromMatch = chunk.match(/priceFrom:\s*(\d+)/);
        if (priceFromMatch) {
          const absIdx = idIdx + priceFromMatch.index;
          replacements.push({
            id, type: 'price',
            start: absIdx,
            end: absIdx + priceFromMatch[0].length,
            newText: `priceFrom: ${data.price}`,
          });
        }
      }

      // Update nextDates
      if (data.dates.length > 0) {
        const datesStart = chunk.indexOf('nextDates: [');
        if (datesStart !== -1) {
          const datesAbsStart = idIdx + datesStart;
          const datesContentStart = datesAbsStart + 'nextDates: ['.length;
          let ddepth = 1, di = datesContentStart;
          while (di < code.length && ddepth > 0) {
            if (code[di] === '[') ddepth++;
            else if (code[di] === ']') ddepth--;
            di++;
          }
          const datesAbsEnd = di;

          const basePrice = data.price || 15000;
          const dateEntries = data.dates.map(d =>
            `      { start: '${d.start}', end: '${d.end}', price: ${basePrice}, seatsLeft: null }`
          );
          const newDates = `nextDates: [\n${dateEntries.join(',\n')},\n    ]`;

          replacements.push({
            id, type: 'dates',
            start: datesAbsStart, end: datesAbsEnd,
            newText: newDates, count: data.dates.length
          });
        }
      }
    }

    // Sort by position descending
    replacements.sort((a, b) => b.start - a.start);

    let priceCount = 0, dateCount = 0;
    for (const r of replacements) {
      code = code.slice(0, r.start) + r.newText + code.slice(r.end);
      if (r.type === 'price') priceCount++;
      else dateCount++;
    }

    if (replacements.length > 0) {
      writeFileSync(filePath, code);
      console.log(`\n${filePath}: ${priceCount} prices + ${dateCount} date sets updated`);
    }
  }
}

main();
