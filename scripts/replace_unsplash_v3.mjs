import { readFileSync, writeFileSync } from 'fs';

const photos = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
const dataFiles = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/golden-ring-tours.ts'];

let totalReplaced = 0;

for (const filePath of dataFiles) {
  let code = readFileSync(filePath, 'utf-8');
  const replacements = [];

  for (const [id, images] of Object.entries(photos)) {
    if (images.length === 0) continue;

    const idPattern = `id: '${id}'`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx === -1) continue;

    // Search up to 15000 chars (tours have long descriptions and itineraries)
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
    const oldGallery = code.slice(galAbsStart, galAbsEnd);

    if (!oldGallery.includes('unsplash.com')) continue;

    const indent = '      ';
    const items = images.map(img => `${indent}'${img}'`).join(',\n');
    const newGallery = `gallery: [\n${items},\n    ]`;

    replacements.push({ id, start: galAbsStart, end: galAbsEnd, newText: newGallery, count: images.length });
  }

  replacements.sort((a, b) => b.start - a.start);

  for (const r of replacements) {
    code = code.slice(0, r.start) + r.newText + code.slice(r.end);
    console.log(`  ID ${r.id}: ${r.count} photos`);
  }

  if (replacements.length > 0) {
    writeFileSync(filePath, code);
    console.log(`${filePath}: ${replacements.length} galleries replaced\n`);
    totalReplaced += replacements.length;
  }
}

console.log(`Total: ${totalReplaced} Unsplash → partner photos`);
