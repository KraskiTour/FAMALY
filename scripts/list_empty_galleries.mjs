import { readFileSync } from 'fs';

const files = ['data/mock-tours.ts', 'data/amra-tours.ts'];

for (const f of files) {
  const code = readFileSync(f, 'utf-8');
  const tourRe = /id:\s*'(\d+)'[\s\S]*?slug:\s*'([^']*)'[\s\S]*?title:\s*'([^']*)'[\s\S]*?sourceUrl:\s*'([^']*)'[\s\S]*?sourceOperator:\s*'([^']*)'[\s\S]*?gallery:\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = tourRe.exec(code)) !== null) {
    const [, id, slug, title, sourceUrl, sourceOp, galleryContent] = m;
    const images = galleryContent.trim();
    if (images.length < 5) {
      console.log(`ID ${id} | ${title.slice(0, 55)}`);
      console.log(`  slug:     ${slug}`);
      console.log(`  operator: ${sourceOp}`);
      console.log(`  url:      ${sourceUrl}`);
      console.log('');
    }
  }
}
