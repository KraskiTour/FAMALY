/**
 * Update AMRA tour dates: remove April, add May + June from spreadsheet.
 * Matches by sourceUrl.
 * Run: node scripts/update_amra_dates.mjs
 */
import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = 'C:\\Users\\Gerard\\Desktop\\Копия Туры АМРА.xlsx';
const AMRA_PATH = join(__dirname, '..', 'data', 'amra-tours.ts');

// ─── Parse spreadsheet ───

function parseDate(dateStr, year = 2026) {
  if (!dateStr) return null;
  dateStr = dateStr.trim();

  const monthMap = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
    'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12,
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
  };

  // "1-3 мая", "18-19 апреля", "29 апреля - 3 мая", "1 May", "12 June"
  // "30 апреля - 8 мая", "25 июня-01июля"

  // Try: "DD month" (single day)
  let m = dateStr.match(/^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)$/i);
  if (m) {
    const day = parseInt(m[1]);
    const month = monthMap[m[2]];
    if (month) {
      const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { start: d, end: d };
    }
  }

  // Try: "DD-DD month" (same month range)
  m = dateStr.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
  if (m) {
    const d1 = parseInt(m[1]);
    const d2 = parseInt(m[2]);
    const month = monthMap[m[3]];
    if (month) {
      return {
        start: `${year}-${String(month).padStart(2, '0')}-${String(d1).padStart(2, '0')}`,
        end: `${year}-${String(month).padStart(2, '0')}-${String(d2).padStart(2, '0')}`,
      };
    }
  }

  // Try: "DD month - DD month" (cross-month range)
  m = dateStr.match(/^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*[-–]\s*(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
  if (m) {
    const d1 = parseInt(m[1]);
    const mon1 = monthMap[m[2]];
    const d2 = parseInt(m[3]);
    const mon2 = monthMap[m[4]];
    if (mon1 && mon2) {
      return {
        start: `${year}-${String(mon1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`,
        end: `${year}-${String(mon2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`,
      };
    }
  }

  // Try: "DD month-DDmonth" (no spaces, e.g. "25 июня-01июля")
  m = dateStr.match(/^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*[-–]\s*(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i);
  if (m) {
    const d1 = parseInt(m[1]);
    const mon1 = monthMap[m[2]];
    const d2 = parseInt(m[3]);
    const mon2 = monthMap[m[4]];
    return {
      start: `${year}-${String(mon1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`,
      end: `${year}-${String(mon2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`,
    };
  }

  // Try Excel serial number (days since 1899-12-30)
  const num = parseInt(dateStr);
  if (num > 40000 && num < 60000) {
    const epoch = new Date(1899, 11, 30);
    const d = new Date(epoch.getTime() + num * 86400000);
    const iso = d.toISOString().split('T')[0];
    return { start: iso, end: iso };
  }

  console.log(`  UNPARSED date: "${dateStr}"`);
  return null;
}

function normalizeUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

function baseUrl(url) {
  // Remove trailing number suffix: /tours/some-tour-name-42 -> /tours/some-tour-name
  return normalizeUrl(url).replace(/-\d+$/, '');
}

function readSpreadsheet() {
  const wb = XLSX.readFile(XLSX_PATH);
  const tours = [];

  for (const sheetName of ['Май', 'Июнь']) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1] || !row[2] || !row[3]) continue;

      const dateStr = String(row[1]).trim();
      const name = String(row[2]).trim();
      const url = normalizeUrl(String(row[3]));
      const priceAdult = parseInt(row[4]) || 0;
      const priceChild = parseInt(row[5]) || null;

      if (!url || !priceAdult) continue;
      if (name === 'ОДНОДНЕВНЫЕ' || name === 'ОДНОДНЕВНЫЕ АПРЕЛЬ') continue;

      const parsed = parseDate(dateStr);
      if (!parsed) continue;

      tours.push({
        sheetName,
        dateStr,
        name,
        url,
        priceAdult,
        priceChild,
        start: parsed.start,
        end: parsed.end,
      });
    }
  }
  return tours;
}

// ─── Update amra-tours.ts ───

function main() {
  console.log('Reading spreadsheet...');
  const sheetTours = readSpreadsheet();
  console.log(`Found ${sheetTours.length} tours in May + June sheets\n`);

  // Group by URL
  const datesByUrl = {};
  for (const t of sheetTours) {
    if (!datesByUrl[t.url]) datesByUrl[t.url] = [];
    datesByUrl[t.url].push(t);
  }

  console.log(`Unique URLs: ${Object.keys(datesByUrl).length}\n`);

  // Read amra-tours.ts
  let code = readFileSync(AMRA_PATH, 'utf-8');

  // Find all sourceUrl values in the file
  const sourceUrlRe = /sourceUrl:\s*'([^']*)'/g;
  const fileUrls = new Set();
  let um;
  while ((um = sourceUrlRe.exec(code)) !== null) {
    fileUrls.add(normalizeUrl(um[1]));
  }

  // Build base-URL index for fuzzy matching
  const fileBaseUrls = {};
  for (const u of fileUrls) {
    const base = baseUrl(u);
    if (!fileBaseUrls[base]) fileBaseUrls[base] = [];
    fileBaseUrls[base].push(u);
  }

  // Also group sheet data by base URL for fuzzy matching
  const datesByBaseUrl = {};
  for (const url of Object.keys(datesByUrl)) {
    const base = baseUrl(url);
    if (!datesByBaseUrl[base]) datesByBaseUrl[base] = [];
    datesByBaseUrl[base].push(...datesByUrl[url]);
  }

  // For each file tour, find sheet dates by exact OR base URL match
  const fileTourDates = {};
  for (const fileUrl of fileUrls) {
    const exact = datesByUrl[fileUrl];
    const fuzzy = datesByBaseUrl[baseUrl(fileUrl)];
    if (exact) {
      fileTourDates[fileUrl] = exact;
    } else if (fuzzy) {
      fileTourDates[fileUrl] = fuzzy;
    }
  }

  // Match stats
  let matched = Object.keys(fileTourDates).length;
  let unmatched = 0;
  const unmatchedUrls = [];

  for (const url of Object.keys(datesByUrl)) {
    const base = baseUrl(url);
    const hasMatch = [...fileUrls].some(fu => fu === url || baseUrl(fu) === base);
    if (!hasMatch) {
      unmatched++;
      unmatchedUrls.push({ url, name: datesByUrl[url][0].name });
    }
  }

  console.log(`Matched in amra-tours.ts: ${matched}`);
  console.log(`Not found in amra-tours.ts: ${unmatched}`);
  if (unmatchedUrls.length > 0) {
    console.log('\nUnmatched tours (exist in spreadsheet but not in our data):');
    for (const u of unmatchedUrls) {
      console.log(`  - ${u.name}: ${u.url}`);
    }
  }

  // Process: for each tour block in the file, update nextDates
  // Strategy: find each tour by sourceUrl, replace its nextDates array
  let updatedCount = 0;
  let aprilRemoved = 0;

  // Find each tour block and update
  const tourBlockRe = /\{\s*\n\s*id:\s*'(\d+)'[\s\S]*?sourceUrl:\s*'([^']*)'[\s\S]*?nextDates:\s*\[([\s\S]*?)\]/g;

  let match;
  const replacements = [];

  // Reset regex
  tourBlockRe.lastIndex = 0;

  // We need a different approach: find nextDates for each tour by finding the sourceUrl first,
  // then finding the nextDates block within that tour

  // Split by tour blocks
  const idUrlPairs = [];
  const idRe = /id:\s*'(\d+)'/g;
  while ((match = idRe.exec(code)) !== null) {
    const idStart = match.index;
    // Find sourceUrl near this id
    const chunk = code.slice(idStart, idStart + 2000);
    const urlM = chunk.match(/sourceUrl:\s*'([^']*)'/);
    if (urlM) {
      idUrlPairs.push({ id: match[1], url: normalizeUrl(urlM[1]), offset: idStart });
    }
  }

  // For each tour, find and replace nextDates
  // Work backwards to preserve offsets
  const updates = [];

  for (const pair of idUrlPairs) {
    const sheetData = fileTourDates[pair.url];

    // Find the nextDates block for this tour
    const searchStart = pair.offset;
    const nextDatesIdx = code.indexOf('nextDates: [', searchStart);
    if (nextDatesIdx === -1 || nextDatesIdx > searchStart + 5000) continue;

    // Find the closing bracket
    let depth = 0;
    let i = code.indexOf('[', nextDatesIdx);
    const arrStart = i;
    while (i < code.length) {
      if (code[i] === '[') depth++;
      else if (code[i] === ']') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    const arrEnd = i + 1;
    const oldDates = code.slice(arrStart, arrEnd);

    // Parse existing dates to identify non-April ones we should keep
    const existingDates = [];
    const dateObjRe = /\{\s*start:\s*'([^']*)',\s*end:\s*'([^']*)',\s*price:\s*(\d+),\s*seatsLeft:\s*(\d+|null)/g;
    let dm;
    while ((dm = dateObjRe.exec(oldDates)) !== null) {
      existingDates.push({
        start: dm[1],
        end: dm[2],
        price: parseInt(dm[3]),
        seatsLeft: dm[4] === 'null' ? null : parseInt(dm[4]),
      });
    }

    // Count April dates being removed
    const aprilDates = existingDates.filter(d => d.start.startsWith('2026-04') || d.start < '2026-05');
    aprilRemoved += aprilDates.length;

    // Build new dates array
    const newDates = [];

    // Keep non-April existing dates that aren't in the sheet (so we don't lose them)
    // Actually: we keep existing May+ dates that DON'T conflict with sheet dates
    const nonAprilExisting = existingDates.filter(d => !d.start.startsWith('2026-04') && d.start >= '2026-05');

    if (sheetData) {
      // Add dates from spreadsheet
      for (const sd of sheetData) {
        newDates.push({
          start: sd.start,
          end: sd.end,
          price: sd.priceAdult,
          seatsLeft: null,
        });
      }

      // Add existing non-April dates that don't overlap with sheet dates
      const sheetStarts = new Set(sheetData.map(s => s.start));
      for (const ed of nonAprilExisting) {
        if (!sheetStarts.has(ed.start)) {
          newDates.push(ed);
        }
      }
    } else {
      // No sheet data for this tour: just keep non-April dates
      newDates.push(...nonAprilExisting);
    }

    // Sort by start date
    newDates.sort((a, b) => a.start.localeCompare(b.start));

    // Deduplicate by start date
    const seen = new Set();
    const dedupDates = [];
    for (const d of newDates) {
      if (!seen.has(d.start)) {
        seen.add(d.start);
        dedupDates.push(d);
      }
    }

    // Format new array
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
      updates.push({ start: arrStart, end: arrEnd, newArr, id: pair.id });
      updatedCount++;
    }
  }

  // Apply replacements in reverse order
  updates.sort((a, b) => b.start - a.start);
  for (const u of updates) {
    code = code.slice(0, u.start) + u.newArr + code.slice(u.end);
  }

  // Also update priceFrom for tours where dates changed
  // We need a second pass after dates are updated
  let priceUpdates = 0;
  for (const u of updates) {
    // Find this tour's new nextDates to get min price
    const re = new RegExp(`id:\\s*'${u.id}'[\\s\\S]*?priceFrom:\\s*(\\d+)`);
    const pm = code.match(re);
    if (!pm) continue;

    // Find the nextDates for this tour
    const idIdx = code.indexOf(`id: '${u.id}'`);
    const ndIdx = code.indexOf('nextDates:', idIdx);
    const ndEnd = code.indexOf(']', ndIdx);
    const ndBlock = code.slice(ndIdx, ndEnd);
    const prices = [...ndBlock.matchAll(/price:\s*(\d+)/g)].map(m => parseInt(m[1]));
    if (prices.length === 0) continue;
    const minPrice = Math.min(...prices);
    const oldPriceFrom = parseInt(pm[1]);
    if (minPrice !== oldPriceFrom) {
      code = code.replace(
        new RegExp(`(id:\\s*'${u.id}'[\\s\\S]*?priceFrom:\\s*)${oldPriceFrom}`),
        `$1${minPrice}`
      );
      priceUpdates++;
    }
  }

  writeFileSync(AMRA_PATH, code, 'utf-8');

  console.log(`\n${'='.repeat(50)}`);
  console.log('DONE');
  console.log(`${'='.repeat(50)}`);
  console.log(`Tours updated:       ${updatedCount}`);
  console.log(`April dates removed: ${aprilRemoved}`);
  console.log(`priceFrom updated:   ${priceUpdates}`);
}

main();
