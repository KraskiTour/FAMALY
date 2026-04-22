import { readFileSync, writeFileSync } from 'fs';

const DELAY_MS = 1500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function collectTours() {
  const mockContent = readFileSync('data/mock-tours.ts', 'utf-8');
  const grContent = readFileSync('data/golden-ring-tours.ts', 'utf-8');

  const tours = [];
  const re = /id:\s*'(\d+)',\s*\n\s*slug:\s*'([^']+)',\s*\n\s*sourceUrl:\s*'([^']+)',\s*\n\s*sourceOperator:\s*'Большая Страна'/g;

  for (const [content, file] of [[mockContent, 'mock-tours.ts'], [grContent, 'golden-ring-tours.ts']]) {
    let m;
    while ((m = re.exec(content)) !== null) {
      tours.push({ id: m[1], slug: m[2], sourceUrl: m[3], file });
    }
  }
  return tours;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseDays(html) {
  const progIdx = html.indexOf('Программа тура');
  if (progIdx === -1) return [];

  const progSection = html.slice(progIdx);
  
  const endSections = ['Проживание', 'Важно знать', 'Условия'];
  let progEnd = progSection.length;
  for (const sec of endSections) {
    const secTitle = `tour-content__section-title">${sec}`;
    const idx = progSection.indexOf(secTitle);
    if (idx > 0 && idx < progEnd) progEnd = idx;
  }
  const programHtml = progSection.slice(0, progEnd);

  const dayPositions = [];
  const dayHeaderRe = /class="as-collapse__prepend">\s*(\d+)\s*день\s*<\/span>/g;
  let m;
  while ((m = dayHeaderRe.exec(programHtml)) !== null) {
    dayPositions.push({ dayNum: parseInt(m[1]), index: m.index });
  }

  if (dayPositions.length === 0) return [];

  const days = [];
  for (let i = 0; i < dayPositions.length; i++) {
    const dp = dayPositions[i];
    const blockStart = dp.index;
    const blockEnd = i < dayPositions.length - 1 ? dayPositions[i + 1].index : programHtml.length;
    const block = programHtml.slice(blockStart, blockEnd);

    const titleMatch = block.match(/itemprop="name"[^>]*>([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `День ${dp.dayNum}`;

    const artIdx = block.indexOf('class="article-text"');
    if (artIdx === -1) continue;
    
    const artStart = block.indexOf('>', artIdx) + 1;
    let bodyHtml = block.slice(artStart);
    
    const closingDivIdx = findMatchingCloseDiv(bodyHtml);
    if (closingDivIdx > 0) {
      bodyHtml = bodyHtml.slice(0, closingDivIdx);
    }

    const description = stripHtml(bodyHtml);
    if (description.length < 20) continue;

    days.push({ day: dp.dayNum, title, description });
  }

  return days;
}

function findMatchingCloseDiv(html) {
  let depth = 1;
  let i = 0;
  while (i < html.length && depth > 0) {
    const openIdx = html.indexOf('<div', i);
    const closeIdx = html.indexOf('</div>', i);
    
    if (closeIdx === -1) break;
    
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      i = openIdx + 4;
    } else {
      depth--;
      if (depth === 0) return closeIdx;
      i = closeIdx + 6;
    }
  }
  return -1;
}

function extractUniqueImages(html) {
  const imgRe = /https:\/\/imcdn\.bolshayastrana\.com\/\d+x\d+\/BS_([a-f0-9]+)\.(?:jpeg|webp|png)/g;
  const hashes = new Map();
  let im;
  while ((im = imgRe.exec(html)) !== null) {
    const hash = im[1];
    if (!hashes.has(hash)) {
      hashes.set(hash, `https://imcdn.bolshayastrana.com/880x600/BS_${hash}.jpeg`);
    }
  }
  return [...hashes.values()];
}

async function scrapeTour(tour) {
  const res = await fetch(tour.sourceUrl);
  if (!res.ok) {
    console.error(`  FAIL ${res.status} for ${tour.sourceUrl}`);
    return null;
  }
  const html = await res.text();
  
  const days = parseDays(html);
  const images = extractUniqueImages(html);
  
  return {
    id: tour.id,
    slug: tour.slug,
    sourceUrl: tour.sourceUrl,
    file: tour.file,
    days,
    images,
    daysCount: days.length,
    imagesCount: images.length,
  };
}

async function main() {
  const tours = collectTours();
  console.log(`Found ${tours.length} Bolshaya Strana tours`);
  
  const results = [];
  
  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i];
    console.log(`[${i + 1}/${tours.length}] Scraping ${tour.slug}...`);
    
    try {
      const data = await scrapeTour(tour);
      if (data) {
        results.push(data);
        console.log(`  -> ${data.daysCount} days, ${data.imagesCount} images`);
        for (const d of data.days) {
          console.log(`     Day ${d.day}: "${d.title}" (${d.description.length} chars)`);
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
    
    if (i < tours.length - 1) await sleep(DELAY_MS);
  }
  
  writeFileSync('scripts/bs_itinerary_data.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nDone! Saved ${results.length} tours to scripts/bs_itinerary_data.json`);
  
  const totalDays = results.reduce((s, t) => s + t.daysCount, 0);
  const totalImgs = results.reduce((s, t) => s + t.imagesCount, 0);
  const toursWithDays = results.filter(t => t.daysCount > 0).length;
  console.log(`Tours with days: ${toursWithDays}/${results.length}`);
  console.log(`Total: ${totalDays} days, ${totalImgs} unique images`);
}

main().catch(console.error);
