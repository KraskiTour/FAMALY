/**
 * Replace Unsplash placeholder galleries with real partner photos.
 * Reads scraped_photos.json and updates mock-tours.ts, amra-tours.ts, golden-ring-tours.ts
 */
import { readFileSync, writeFileSync } from 'fs';

const photos = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
const dataFiles = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/golden-ring-tours.ts'];

let totalReplaced = 0;

for (const filePath of dataFiles) {
  let code = readFileSync(filePath, 'utf-8');
  let fileCount = 0;

  for (const [id, images] of Object.entries(photos)) {
    if (images.length === 0) continue;

    // Find the tour by ID
    const idPattern = `id: '${id}'`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx === -1) continue;

    // Find gallery: [...] near this ID (within 5000 chars)
    const searchEnd = Math.min(idIdx + 5000, code.length);
    const chunk = code.slice(idIdx, searchEnd);
    
    const galStart = chunk.indexOf('gallery: [');
    if (galStart === -1) continue;

    // Check if gallery contains unsplash
    const galAbsStart = idIdx + galStart;
    const galContentStart = galAbsStart + 'gallery: ['.length;
    
    // Find the closing ]
    let depth = 1, i = galContentStart;
    while (i < code.length && depth > 0) {
      if (code[i] === '[') depth++;
      else if (code[i] === ']') depth--;
      i++;
    }
    const galAbsEnd = i;
    const oldGallery = code.slice(galAbsStart, galAbsEnd);
    
    if (!oldGallery.includes('unsplash.com')) continue;

    // Build new gallery
    const indent = '      ';
    const items = images.map(img => `${indent}'${img}'`).join(',\n');
    const newGallery = `gallery: [\n${items},\n    ]`;

    code = code.slice(0, galAbsStart) + newGallery + code.slice(galAbsEnd);
    fileCount++;
    console.log(`  ID ${id}: ${images.length} photos`);
  }

  if (fileCount > 0) {
    writeFileSync(filePath, code);
    console.log(`${filePath}: ${fileCount} galleries replaced\n`);
    totalReplaced += fileCount;
  }
}

console.log(`\nTotal: ${totalReplaced} Unsplash galleries → partner photos`);
