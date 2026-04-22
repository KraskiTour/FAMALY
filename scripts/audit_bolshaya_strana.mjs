import { readFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];

const tours = [];

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
    
    const srcOp = (block.match(/sourceOperator:\s*'([^']*)'/) || [])[1] || '';
    if (!srcOp.includes('Большая Страна')) continue;

    const id = m[1];
    const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '?';
    const slug = (block.match(/slug:\s*'([^']*)'/) || [])[1] || '?';
    const srcUrl = (block.match(/sourceUrl:\s*'([^']*)'/) || [])[1] || '';
    
    // Description lengths
    const shortDesc = (block.match(/shortDescription:\s*'([^']*)'/) || [])[1] || '';
    const fullDescMatch = block.match(/fullDescription:\s*'([\s\S]*?)(?:',\s*\n|\',\s*\n)/);
    const fullDesc = fullDescMatch ? fullDescMatch[1] : '';
    
    // Gallery count
    const galMatch = block.match(/gallery:\s*\[([\s\S]*?)\]/);
    const galContent = galMatch ? galMatch[1] : '';
    const photoCount = (galContent.match(/'https?:/g) || []).length;
    
    // Dates count
    const datesMatch = block.match(/nextDates:\s*\[([\s\S]*?)\]/);
    const datesContent = datesMatch ? datesMatch[1] : '';
    const dateCount = (datesContent.match(/start:/g) || []).length;
    
    // Itinerary days
    const itinCount = (block.match(/day:\s*\d+/g) || []).length;
    const durationDays = (block.match(/durationDays:\s*(\d+)/) || [])[1] || '?';
    
    // fullDescription length (approx)
    const fullDescLen = fullDesc.length;
    
    tours.push({ id, title: title.slice(0, 50), slug, srcUrl, shortDescLen: shortDesc.length, fullDescLen, photoCount, dateCount, itinCount, durationDays, file: f });
  }
}

tours.sort((a, b) => parseInt(a.id) - parseInt(b.id));

console.log(`Всего туров Большой Страны: ${tours.length}\n`);
console.log('ID  | Фото | Даты | Itin | Дни | FullDesc | Название');
console.log('----|------|------|------|-----|---------|--------');

let lowPhotos = 0, lowDesc = 0, noDates = 0;
for (const t of tours) {
  const photoFlag = t.photoCount < 4 ? '⚠' : '✓';
  const descFlag = t.fullDescLen < 300 ? '⚠' : (t.fullDescLen < 600 ? '~' : '✓');
  const dateFlag = t.dateCount === 0 ? '⚠' : '✓';
  
  if (t.photoCount < 4) lowPhotos++;
  if (t.fullDescLen < 300) lowDesc++;
  if (t.dateCount === 0) noDates++;
  
  console.log(`${t.id.padStart(3)} | ${photoFlag} ${String(t.photoCount).padStart(2)} | ${dateFlag} ${String(t.dateCount).padStart(2)} | ${String(t.itinCount).padStart(4)} | ${String(t.durationDays).padStart(3)} | ${descFlag} ${String(t.fullDescLen).padStart(5)} | ${t.title}`);
}

console.log(`\n--- Проблемы ---`);
console.log(`Мало фото (<4): ${lowPhotos}`);
console.log(`Короткое описание (<300): ${lowDesc}`);
console.log(`Нет дат: ${noDates}`);
