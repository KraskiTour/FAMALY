/**
 * Update Bolshaya Strana tours with scraped data:
 * 1. Replace gallery with up to 8 unique high-quality images
 * 2. Update nextDates with all future 2026 dates from the partner site
 */
import { readFileSync, writeFileSync } from 'fs';

const scraped = JSON.parse(readFileSync('scripts/bs_scraped_data.json', 'utf-8'));
const dataFiles = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];

const today = new Date('2026-04-15');

for (const filePath of dataFiles) {
  let code = readFileSync(filePath, 'utf-8');
  const replacements = [];

  for (const [id, data] of Object.entries(scraped)) {
    if (!data.images || data.images.length === 0) continue;

    const idPattern = `id: '${id}'`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx === -1) continue;

    // === 1. Replace gallery ===
    const searchEnd = Math.min(idIdx + 15000, code.length);
    const chunk = code.slice(idIdx, searchEnd);

    const galStart = chunk.indexOf('gallery: [');
    if (galStart === -1) continue;

    const galAbsStart = idIdx + galStart;
    const galContentStart = galAbsStart + 'gallery: ['.length;
    let depth = 1, i = galContentStart;
    while (i < code.length && depth > 0) {
      if (code[i] === '[') depth++;
      else if (code[i] === ']') depth--;
      i++;
    }
    const galAbsEnd = i;

    // Pick best 8 images (skip first one as it's usually the cover already shown elsewhere)
    const bestImages = data.images.slice(0, 8);
    const indent = '      ';
    const items = bestImages.map(img => `${indent}'${img}'`).join(',\n');
    const newGallery = `gallery: [\n${items},\n    ]`;

    replacements.push({ 
      id, type: 'gallery', start: galAbsStart, end: galAbsEnd, 
      newText: newGallery, count: bestImages.length 
    });

    // === 2. Update nextDates (only future dates in 2026) ===
    if (data.dates && data.dates.length > 0) {
      const futureDates = data.dates.filter(d => {
        const dateObj = new Date(d.start);
        return dateObj >= today && d.start.startsWith('2026');
      });

      if (futureDates.length > 0) {
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

          // Get existing price from priceFrom
          const priceMatch = chunk.match(/priceFrom:\s*(\d+)/);
          const basePrice = priceMatch ? parseInt(priceMatch[1]) : 15000;

          const dateEntries = futureDates.map(d => {
            return `      { start: '${d.start}', end: '${d.end}', price: ${basePrice}, seatsLeft: null }`;
          });
          const newDates = `nextDates: [\n${dateEntries.join(',\n')},\n    ]`;

          replacements.push({
            id, type: 'dates', start: datesAbsStart, end: datesAbsEnd,
            newText: newDates, count: futureDates.length
          });
        }
      }
    }
  }

  // Sort by position descending
  replacements.sort((a, b) => b.start - a.start);

  let galCount = 0, dateCount = 0;
  for (const r of replacements) {
    code = code.slice(0, r.start) + r.newText + code.slice(r.end);
    if (r.type === 'gallery') {
      galCount++;
      console.log(`  ID ${r.id}: ${r.count} photos`);
    } else {
      dateCount++;
      console.log(`  ID ${r.id}: ${r.count} dates`);
    }
  }

  if (replacements.length > 0) {
    writeFileSync(filePath, code);
    console.log(`\n${filePath}: ${galCount} galleries, ${dateCount} date sets updated\n`);
  }
}

console.log('Done!');
