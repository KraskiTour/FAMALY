/**
 * Update AMRA tour dates using the mapping table as bridge.
 * 1. AMRA dates spreadsheet (operator URL → dates/prices)
 * 2. Mapping table (operator URL → our slug)
 * 3. Our data files (slug → tour data)
 */
import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATES_PATH = 'C:\\Users\\Gerard\\Desktop\\Копия Туры АМРА.xlsx';
const MAPPING_PATH = 'C:\\Users\\Gerard\\Desktop\\tours-for-google-sheets.xlsx';
const DATA_FILES = [
  join(__dirname, '..', 'data', 'amra-tours.ts'),
  join(__dirname, '..', 'data', 'mock-tours.ts'),
];

function normalizeUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

function baseUrl(url) {
  return normalizeUrl(url).replace(/-\d+$/, '');
}

function parseDate(dateStr, year = 2026) {
  if (!dateStr) return null;
  dateStr = String(dateStr).trim();

  const monthMap = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
    'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12,
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
  };

  // Excel serial number
  const num = parseInt(dateStr);
  if (num > 40000 && num < 60000) {
    const epoch = new Date(1899, 11, 30);
    const d = new Date(epoch.getTime() + num * 86400000);
    const iso = d.toISOString().split('T')[0];
    return { start: iso, end: iso };
  }

  // "DD month"
  let m = dateStr.match(/^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)$/i);
  if (m) {
    const day = parseInt(m[1]);
    const month = monthMap[m[2]];
    if (month) {
      const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { start: d, end: d };
    }
  }

  // "DD-DD month"
  m = dateStr.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
  if (m) {
    const month = monthMap[m[3]];
    if (month) return {
      start: `${year}-${String(month).padStart(2, '0')}-${String(parseInt(m[1])).padStart(2, '0')}`,
      end: `${year}-${String(month).padStart(2, '0')}-${String(parseInt(m[2])).padStart(2, '0')}`,
    };
  }

  // "DD month - DD month"
  m = dateStr.match(/^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*[-–]\s*(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
  if (m) {
    return {
      start: `${year}-${String(monthMap[m[2]]).padStart(2, '0')}-${String(parseInt(m[1])).padStart(2, '0')}`,
      end: `${year}-${String(monthMap[m[4]]).padStart(2, '0')}-${String(parseInt(m[3])).padStart(2, '0')}`,
    };
  }

  return null;
}

// ─── 1. Read mapping table ───
function readMapping() {
  const wb = XLSX.readFile(MAPPING_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const map = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;
    const slug = String(r[3] || '').trim();
    const operatorUrl = normalizeUrl(String(r[6] || ''));
    if (slug && operatorUrl) {
      const base = baseUrl(operatorUrl);
      if (!map[base]) map[base] = [];
      map[base].push({ slug, operatorUrl, name: String(r[2] || '') });
    }
  }
  return map;
}

// ─── 2. Read dates spreadsheet ───
function readDates() {
  const wb = XLSX.readFile(DATES_PATH);
  const tours = [];
  for (const sheetName of ['Май', 'Июнь']) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[1] || !r[2] || !r[3]) continue;
      const name = String(r[2]).trim();
      if (name === 'ОДНОДНЕВНЫЕ' || name === 'ОДНОДНЕВНЫЕ АПРЕЛЬ') continue;
      const url = normalizeUrl(String(r[3]));
      const price = parseInt(r[4]) || 0;
      if (!url || !price) continue;
      const parsed = parseDate(r[1]);
      if (!parsed) continue;
      tours.push({ name, url, price, ...parsed });
    }
  }
  return tours;
}

// ─── 3. Update data files ───
function main() {
  const mapping = readMapping();
  console.log(`Mapping table: ${Object.keys(mapping).length} base URLs → slugs`);

  const dates = readDates();
  console.log(`Dates spreadsheet: ${dates.length} entries (May + June)\n`);

  // Group dates by base URL
  const datesByBase = {};
  for (const d of dates) {
    const base = baseUrl(d.url);
    if (!datesByBase[base]) datesByBase[base] = [];
    datesByBase[base].push(d);
  }

  // Match: dates → mapping → slug
  const datesBySlug = {};
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatched = [];

  for (const [base, entries] of Object.entries(datesByBase)) {
    const mappingEntry = mapping[base];
    if (mappingEntry) {
      for (const me of mappingEntry) {
        if (!datesBySlug[me.slug]) datesBySlug[me.slug] = [];
        datesBySlug[me.slug].push(...entries);
      }
      matchedCount++;
    } else {
      unmatchedCount++;
      unmatched.push({ base, name: entries[0].name });
    }
  }

  console.log(`Matched via mapping: ${matchedCount} base URLs → ${Object.keys(datesBySlug).length} slugs`);
  console.log(`Unmatched: ${unmatchedCount}\n`);

  if (unmatched.length > 0) {
    console.log('Unmatched (no mapping entry):');
    for (const u of unmatched.slice(0, 20)) {
      console.log(`  - ${u.name}: ${u.base}`);
    }
    if (unmatched.length > 20) console.log(`  ... and ${unmatched.length - 20} more`);
    console.log('');
  }

  // Now update each data file
  let totalUpdated = 0;
  let totalAprilRemoved = 0;
  let totalPriceUpdated = 0;

  for (const filePath of DATA_FILES) {
    let code = readFileSync(filePath, 'utf-8');
    const fileName = filePath.split(/[/\\]/).pop();

    // Find all tours with their slugs
    const slugRe = /slug:\s*'([^']*)'/g;
    const allSlugs = [];
    let sm;
    while ((sm = slugRe.exec(code)) !== null) {
      allSlugs.push({ slug: sm[1], offset: sm.index });
    }

    let updates = [];

    for (const { slug, offset } of allSlugs) {
      const newDates = datesBySlug[slug];
      if (!newDates && !code.includes("'2026-04")) continue;

      // Find nextDates block for this slug
      const searchChunk = code.slice(Math.max(0, offset - 200), offset + 5000);
      const ndIdx = code.indexOf('nextDates: [', offset);
      if (ndIdx === -1 || ndIdx > offset + 5000) continue;

      let depth = 0, i = code.indexOf('[', ndIdx);
      const arrStart = i;
      while (i < code.length) {
        if (code[i] === '[') depth++;
        else if (code[i] === ']') { depth--; if (depth === 0) break; }
        i++;
      }
      const arrEnd = i + 1;
      const oldDates = code.slice(arrStart, arrEnd);

      // Parse existing dates
      const existingDates = [];
      const dateObjRe = /\{\s*start:\s*'([^']*)',\s*end:\s*'([^']*)',\s*price:\s*(\d+),\s*seatsLeft:\s*(\d+|null)/g;
      let dm;
      while ((dm = dateObjRe.exec(oldDates)) !== null) {
        existingDates.push({
          start: dm[1], end: dm[2], price: parseInt(dm[3]),
          seatsLeft: dm[4] === 'null' ? null : parseInt(dm[4]),
        });
      }

      const aprilDates = existingDates.filter(d => d.start < '2026-05');
      const nonAprilExisting = existingDates.filter(d => d.start >= '2026-05');

      const finalDates = [];

      if (newDates) {
        for (const nd of newDates) {
          finalDates.push({ start: nd.start, end: nd.end, price: nd.price, seatsLeft: null });
        }
        // Keep existing non-April that don't conflict
        const newStarts = new Set(newDates.map(n => n.start));
        for (const ed of nonAprilExisting) {
          if (!newStarts.has(ed.start)) finalDates.push(ed);
        }
      } else {
        finalDates.push(...nonAprilExisting);
      }

      // Sort and dedup
      finalDates.sort((a, b) => a.start.localeCompare(b.start));
      const seen = new Set();
      const dedupDates = finalDates.filter(d => { if (seen.has(d.start)) return false; seen.add(d.start); return true; });

      const indent = '      ';
      let newArr;
      if (dedupDates.length === 0) {
        newArr = '[]';
      } else {
        const items = dedupDates.map(d =>
          `{ start: '${d.start}', end: '${d.end}', price: ${d.price}, seatsLeft: ${d.seatsLeft === null ? 'null' : d.seatsLeft} }`
        );
        newArr = '[\n' + items.map(item => `${indent}${item},`).join('\n') + '\n    ]';
      }

      if (oldDates !== newArr) {
        updates.push({ start: arrStart, end: arrEnd, newArr, slug, aprilRemoved: aprilDates.length, hasNewDates: !!newDates });
      }
    }

    // Apply in reverse
    updates.sort((a, b) => b.start - a.start);
    for (const u of updates) {
      code = code.slice(0, u.start) + u.newArr + code.slice(u.end);
      totalAprilRemoved += u.aprilRemoved;
      if (u.hasNewDates) totalUpdated++;
    }

    // Update priceFrom
    for (const u of updates) {
      if (!u.hasNewDates) continue;
      const slugIdx = code.indexOf(`slug: '${u.slug}'`);
      if (slugIdx === -1) continue;
      const chunk = code.slice(Math.max(0, slugIdx - 500), slugIdx + 3000);
      const priceFromM = chunk.match(/priceFrom:\s*(\d+)/);
      const ndM = chunk.match(/nextDates:\s*\[([\s\S]*?)\]/);
      if (!priceFromM || !ndM) continue;
      const prices = [...ndM[1].matchAll(/price:\s*(\d+)/g)].map(m => parseInt(m[1]));
      if (prices.length === 0) continue;
      const minPrice = Math.min(...prices);
      const oldPrice = parseInt(priceFromM[1]);
      if (minPrice !== oldPrice) {
        const fullPriceFromIdx = code.indexOf(`priceFrom: ${oldPrice}`, Math.max(0, slugIdx - 500));
        if (fullPriceFromIdx !== -1 && fullPriceFromIdx < slugIdx + 3000) {
          code = code.slice(0, fullPriceFromIdx) + `priceFrom: ${minPrice}` + code.slice(fullPriceFromIdx + `priceFrom: ${oldPrice}`.length);
          totalPriceUpdated++;
        }
      }
    }

    writeFileSync(filePath, code, 'utf-8');
    const fileUpdates = updates.filter(u => u.hasNewDates).length;
    const fileCleanups = updates.filter(u => !u.hasNewDates && u.aprilRemoved > 0).length;
    console.log(`${fileName}: ${fileUpdates} tours got new dates, ${fileCleanups} cleaned April-only`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('DONE');
  console.log(`${'='.repeat(50)}`);
  console.log(`Tours with new May/June dates: ${totalUpdated}`);
  console.log(`April dates removed:           ${totalAprilRemoved}`);
  console.log(`priceFrom updated:             ${totalPriceUpdated}`);
}

main();
