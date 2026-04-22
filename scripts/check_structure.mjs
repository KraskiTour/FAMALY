import { readFileSync } from 'fs';

const code = readFileSync('data/mock-tours.ts', 'utf-8');

// Find all tour block starts
const re = /\{\s*\r?\n\s*id:\s*'(\d+)'/g;
let m;
const blocks = [];

while ((m = re.exec(code)) !== null) {
  blocks.push({ id: m[1], start: m.index });
}

console.log(`Found ${blocks.length} tour blocks\n`);

for (let b = 0; b < blocks.length; b++) {
  const { id, start } = blocks[b];
  let depth = 0, i = start;
  while (i < code.length) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  const end = i + 1;
  const block = code.slice(start, end);

  const slug = (block.match(/slug:\s*'([^']*)'/) || [])[1] || '?';
  const hasGallery = block.includes('gallery:');
  const hasItinerary = block.includes('itinerary:');
  const hasIncluded = block.includes('included:');
  const hasExcluded = block.includes('excluded:');
  const hasTransport = block.includes('transport:');
  const hasIsPublished = block.includes('isPublished:');

  // Check for duplicate field names (sign of tour merge)
  const departureCitiesCount = (block.match(/departureCities:/g) || []).length;
  const destinationCount = (block.match(/destination:/g) || []).length;
  const nextDatesCount = (block.match(/nextDates:/g) || []).length;
  const priceFromCount = (block.match(/priceFrom:/g) || []).length;

  const issues = [];
  if (!hasGallery) issues.push('NO gallery');
  if (!hasIsPublished) issues.push('NO isPublished');
  if (!hasTransport) issues.push('NO transport');
  if (departureCitiesCount > 1) issues.push(`departureCities x${departureCitiesCount}`);
  if (destinationCount > 2) issues.push(`destination x${destinationCount}`);
  if (nextDatesCount > 1) issues.push(`nextDates x${nextDatesCount}`);
  if (priceFromCount > 1) issues.push(`priceFrom x${priceFromCount}`);

  const line = code.slice(0, start).split('\n').length;
  const status = issues.length > 0 ? 'BROKEN' : 'OK';
  if (status === 'BROKEN') {
    console.log(`${status} | ID ${id} | line ${line} | ${slug}`);
    issues.forEach(i => console.log(`       ${i}`));
  }
}
