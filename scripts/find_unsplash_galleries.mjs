import { readFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/bogema-tours.ts', 'data/bogema-tours-batch2.ts', 'data/golden-ring-tours.ts'];

let total = 0;
const byOperator = {};

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
    
    const hasUnsplash = galContent.includes('unsplash.com');
    const imageCount = (galContent.match(/'https?:/g) || []).length;
    if (!hasUnsplash || imageCount === 0) continue;

    const slug = (block.match(/slug:\s*'([^']*)'/) || [])[1] || '?';
    const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '?';
    const srcUrl = (block.match(/sourceUrl:\s*'([^']*)'/) || [])[1] || 'NONE';
    const srcOp = (block.match(/sourceOperator:\s*'([^']*)'/) || [])[1] || '?';

    if (!byOperator[srcOp]) byOperator[srcOp] = [];
    byOperator[srcOp].push({ id: m[1], slug, title: title.slice(0, 50), srcUrl, file: f, imageCount });
    total++;
  }
}

console.log(`Всего туров с Unsplash-фото: ${total}\n`);

for (const [op, tours] of Object.entries(byOperator).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n=== ${op} (${tours.length} туров) ===`);
  for (const t of tours) {
    console.log(`  ID ${t.id} | ${t.title}`);
    console.log(`    url: ${t.srcUrl.slice(0, 90)}`);
  }
}
