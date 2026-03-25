import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath =
  process.argv[2] ||
  'C:/Users/Gerard/Documents/Диаграма Герарда/tours_rus_belarus_import_ready.json';
const outPath = path.join(__dirname, '../data/_belarus_tours_fragment.ts');

const tours = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const galleryDefault = [
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560090995-1bf7cb27c1c0?w=800&h=600&fit=crop',
];

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function fmtStrArr(name, arr, ind) {
  const sp = ' '.repeat(ind);
  if (!arr || !arr.length) return `${sp}${name}: [],`;
  return (
    `${sp}${name}: [\n` +
    arr.map((x) => `${sp}  '${esc(x)}',`).join('\n') +
    `\n${sp}],`
  );
}

function fmtItinerary(days, gallery) {
  const imgs = gallery && gallery.length ? gallery : galleryDefault;
  if (!days || !days.length) return '    itinerary: [],';
  const rows = days.map((d) => {
    const im = d.images && d.images.length ? d.images : imgs;
    const imStr = im.map((u) => `'${esc(u)}'`).join(', ');
    return `      { day: ${d.day}, title: '${esc(d.title)}', description: '${esc(d.description)}', images: [${imStr}] },`;
  });
  return `    itinerary: [\n${rows.join('\n')}\n    ],`;
}

function fmtTour(t) {
  const g = t.gallery && t.gallery.length ? t.gallery : galleryDefault;
  const lines = [];
  lines.push('{');
  lines.push(`    id: '${t.id}',`);
  lines.push(`    slug: '${esc(t.slug)}',`);
  lines.push(`    title: '${esc(t.title)}',`);
  lines.push(`    shortDescription: '${esc(t.shortDescription)}',`);
  lines.push(`    fullDescription: '${esc(t.fullDescription)}',`);
  lines.push('    departureCities: [],');
  lines.push(`    destination: '${esc(t.destination)}',`);
  lines.push(`    region: '${esc(t.region)}',`);
  lines.push(`    durationDays: ${t.durationDays},`);
  lines.push(`    seasonMonths: [${t.seasonMonths.join(', ')}],`);
  lines.push(`    priceFrom: ${t.priceFrom},`);
  lines.push('    oldPrice: null,');
  lines.push('    nextDates: [],');
  lines.push(fmtStrArr('included', t.included, 4));
  lines.push(fmtStrArr('excluded', t.excluded, 4));
  lines.push(fmtItinerary(t.itinerary, g));
  lines.push(fmtStrArr('gallery', g, 4));
  lines.push(fmtStrArr('badges', t.badges, 4));
  lines.push(`    transport: '${esc(t.transport)}',`);
  lines.push(`    meals: '${esc(t.meals)}',`);
  lines.push(`    hotel: '${esc(t.hotel)}',`);
  lines.push(`    difficulty: '${t.difficulty}',`);
  lines.push(`    seoTitle: '${esc(t.seoTitle)}',`);
  lines.push(`    seoDescription: '${esc(t.seoDescription)}',`);
  lines.push('    isPublished: true,');
  if (t.highlights && t.highlights.length) lines.push(fmtStrArr('highlights', t.highlights, 4));
  if (t.minAge != null) lines.push(`    minAge: ${t.minAge},`);
  if (t.maxGroupSize != null) lines.push(`    maxGroupSize: ${t.maxGroupSize},`);
  if (t.organizationalInfo && typeof t.organizationalInfo === 'object') {
    const o = t.organizationalInfo;
    lines.push('    organizationalInfo: {');
    for (const k of Object.keys(o)) {
      if (o[k] != null) lines.push(`      ${k}: '${esc(o[k])}',`);
    }
    lines.push('    },');
  }
  lines.push('  }');
  return lines.join('\n');
}

let block = '';
tours.forEach((t, i) => {
  const { sourceUrl: _s, ...rest } = t;
  const tour = { ...rest, id: String(55 + i) };
  block += `\n  // ==================== БЕЛАРУСЬ ${i + 1}/13 ====================\n  ${fmtTour(tour)},\n`;
});

fs.writeFileSync(outPath, block);
console.log('Wrote', outPath, block.length, 'chars');
