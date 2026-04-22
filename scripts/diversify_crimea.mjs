import { readFileSync, writeFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/bogema-tours.ts', 'data/bogema-tours-batch2.ts'];

// Find all Crimea tours with real photos
const crimeaTours = [];
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
    const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '';
    const dest = (block.match(/destination:\s*'([^']*)'/) || [])[1] || '';
    
    if (!/крым|ялт|севастополь|керчь|судак|феодос/i.test(title + dest)) continue;
    
    const galMatch = block.match(/gallery:\s*\[([\s\S]*?)\]/);
    if (!galMatch) continue;
    const galContent = galMatch[1];
    if (galContent.includes('unsplash.com') || !galContent.includes("'http")) continue;
    
    const images = [...galContent.matchAll(/'(https?:\/\/[^']+)'/g)].map(m => m[1]);
    if (images.length >= 4) {
      crimeaTours.push({ id: m[1], title, images });
    }
  }
}

console.log(`Crimea tours with real photos: ${crimeaTours.length}`);
crimeaTours.forEach(t => console.log(`  ID ${t.id}: ${t.title.slice(0,60)} (${t.images.length})`));

// Assign different Crimea donors
const existing = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
const assignments = {
  '94': 'sakura/mria → need southern coast',
  '105': 'spring bloom → gardens/flowers',
  '127': 'Ai-Petri sunrise → mountains/coast',
  '129': 'Opuk tulips → eastern Crimea/steppe',
};

// Use different donors to avoid all having same photos
const used = new Set();
for (const [id, desc] of Object.entries(assignments)) {
  const donor = crimeaTours.find(t => t.id !== '15' && !used.has(t.id)) || crimeaTours.find(t => !used.has(t.id));
  if (donor) {
    existing[id] = donor.images.slice(0, 6);
    used.add(donor.id);
    console.log(`\nID ${id} (${desc}) → donor ID ${donor.id}: ${donor.title.slice(0,50)}`);
  }
}

writeFileSync('scripts/scraped_photos.json', JSON.stringify(existing, null, 2));
console.log('\nDone');
