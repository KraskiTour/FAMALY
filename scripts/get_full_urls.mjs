import { readFileSync } from 'fs';

const ids = ['33','34','35','45','51','52','53','54','71','9','25','94','105','127','129','146','5','19','26'];
const files = ['data/mock-tours.ts', 'data/amra-tours.ts', 'data/golden-ring-tours.ts'];

for (const f of files) {
  const code = readFileSync(f, 'utf-8');
  for (const id of ids) {
    const idx = code.indexOf(`id: '${id}'`);
    if (idx === -1) continue;
    const chunk = code.slice(idx, idx + 2000);
    const srcM = chunk.match(/sourceUrl:\s*'([^']*)'/);
    const titleM = chunk.match(/title:\s*'([^']*)'/);
    if (srcM) console.log(`ID ${id} | ${(titleM?titleM[1]:'?').slice(0,50)} | ${srcM[1]}`);
  }
}
