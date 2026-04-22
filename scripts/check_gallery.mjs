import { readFileSync } from 'fs';
const code = readFileSync('data/mock-tours.ts', 'utf-8');

for (const id of ['27','28','29','30','32','36','37','38','39','40','41','42','43','46','47','48','49','50','68','69']) {
  const idx = code.indexOf(`id: '${id}'`);
  if (idx === -1) { console.log(`ID ${id}: NOT FOUND`); continue; }
  const chunk = code.slice(idx, idx + 5000);
  const gal = chunk.indexOf('gallery: [');
  if (gal === -1) { console.log(`ID ${id}: NO gallery`); continue; }
  const block = chunk.slice(gal, gal + 200);
  const hasUnsplash = block.includes('unsplash');
  const hasPartner = block.includes('bolshayastrana') || block.includes('amra-turistik');
  console.log(`ID ${id}: unsplash=${hasUnsplash} partner=${hasPartner} | ${block.slice(0,80)}`);
}
