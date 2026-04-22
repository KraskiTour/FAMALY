import { readFileSync, writeFileSync } from 'fs';

// Tours that need photos, and similar tours in our DB to borrow from
const needed = {
  '25': { title: 'Сочи на выходные', searchTerms: ['sochi', 'Сочи'] },
  '94': { title: 'Крым: Фестиваль сакуры в Мрие', searchTerms: ['krym', 'Крым', 'мрия', 'ялт'] },
  '105': { title: 'Весеннее цветение Крыма', searchTerms: ['krym', 'Крым', 'тюльпан'] },
  '127': { title: 'Рассвет на Ай-Петри', searchTerms: ['krym', 'Крым', 'петри', 'ялт'] },
  '129': { title: 'Тюльпаны мыса Опук', searchTerms: ['krym', 'Крым', 'керчь', 'опук'] },
  '5': { title: 'Пятигорск и Кисловодск', searchTerms: ['кавминвод', 'пятигорск', 'кисловодск', 'kavminvod'] },
  '19': { title: 'Плато Бермамыт', searchTerms: ['бермамыт', 'эльбрус', 'кбр', 'bermamyt'] },
  '26': { title: 'КавМинВоды', searchTerms: ['кавминвод', 'пятигорск', 'кисловодск'] },
};

const files = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/bogema-tours.ts', 'data/bogema-tours-batch2.ts', 'data/golden-ring-tours.ts'];

// Extract all tours with non-empty, non-unsplash galleries
const allTours = [];
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
    const galMatch = block.match(/gallery:\s*\[([\s\S]*?)\]/);
    if (!galMatch) continue;
    const galContent = galMatch[1];
    if (galContent.includes('unsplash.com') || !galContent.includes("'http")) continue;

    const slug = (block.match(/slug:\s*'([^']*)'/) || [])[1] || '';
    const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '';
    const dest = (block.match(/destination:\s*'([^']*)'/) || [])[1] || '';
    const images = [...galContent.matchAll(/'(https?:\/\/[^']+)'/g)].map(m => m[1]);

    allTours.push({ id: m[1], slug, title, dest, images });
  }
}

console.log(`Found ${allTours.length} tours with real photos\n`);

// Find matches
const result = {};
for (const [id, info] of Object.entries(needed)) {
  console.log(`\nID ${id}: ${info.title}`);
  const matches = allTours.filter(t => {
    const text = `${t.title} ${t.dest} ${t.slug}`.toLowerCase();
    return info.searchTerms.some(s => text.includes(s.toLowerCase()));
  });
  
  if (matches.length > 0) {
    const best = matches.find(m => m.images.length >= 4) || matches[0];
    result[id] = best.images.slice(0, 6);
    console.log(`  → Using ID ${best.id} "${best.title}" (${best.images.length} photos)`);
  } else {
    console.log(`  → No match found!`);
  }
}

// Save to JSON for injection
const existing = JSON.parse(readFileSync('scripts/scraped_photos.json', 'utf-8'));
let added = 0;
for (const [id, photos] of Object.entries(result)) {
  if (photos.length > 0) {
    existing[id] = photos;
    added++;
  }
}
writeFileSync('scripts/scraped_photos.json', JSON.stringify(existing, null, 2));
console.log(`\nAdded ${added} borrowed galleries`);
