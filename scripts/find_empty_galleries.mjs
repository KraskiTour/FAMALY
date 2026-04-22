import { readFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/bogema-tours.ts', 'data/bogema-tours-batch2.ts', 'data/golden-ring-tours.ts'];

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
    
    // Check gallery
    const galMatch = block.match(/gallery:\s*\[([\s\S]*?)\]/);
    if (!galMatch) continue;
    const galContent = galMatch[1].trim();
    const imageCount = (galContent.match(/'https?:/g) || []).length;
    
    if (imageCount === 0) {
      const slug = (block.match(/slug:\s*'([^']*)'/) || [])[1] || '?';
      const title = (block.match(/title:\s*'([^']*)'/) || [])[1] || '?';
      const srcUrl = (block.match(/sourceUrl:\s*'([^']*)'/) || [])[1] || 'NONE';
      const srcOp = (block.match(/sourceOperator:\s*'([^']*)'/) || [])[1] || '?';
      console.log(`ID ${m[1]} | ${title.slice(0, 55)}`);
      console.log(`  file:     ${f}`);
      console.log(`  slug:     ${slug}`);
      console.log(`  operator: ${srcOp}`);
      console.log(`  url:      ${srcUrl}`);
      console.log('');
    }
  }
}
