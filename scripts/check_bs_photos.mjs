import { readFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];

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
    const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '';
    
    const galMatch = block.match(/gallery:\s*\[([\s\S]*?)\]/);
    const urls = galMatch ? [...galMatch[1].matchAll(/'(https?:\/\/[^']+)'/g)].map(m => m[1]) : [];
    
    console.log(`\nID ${id}: ${title.slice(0, 50)}`);
    urls.forEach((u, i) => console.log(`  [${i+1}] ${u.slice(0, 100)}`));
  }
}
