import { readFileSync, writeFileSync } from 'fs';

const fixes = [
  { id: '26', old: 4500, min: 5000 },
  { id: '27', old: 25400, min: 29500 },
  { id: '28', old: 28500, min: 33200 },
  { id: '29', old: 18900, min: 19900 },
  { id: '30', old: 16500, min: 17500 },
  { id: '31', old: 11900, min: 12500 },
  { id: '38', old: 16800, min: 17500 },
  { id: '39', old: 28600, min: 29900 },
  { id: '41', old: 50300, min: 52300 },
  { id: '42', old: 29050, min: 30500 },
  { id: '43', old: 30700, min: 32500 },
  { id: '44', old: 16150, min: 16900 },
  { id: '45', old: 22590, min: 23500 },
  { id: '46', old: 28900, min: 29900 },
];

const filePath = 'data/mock-tours.ts';
let code = readFileSync(filePath, 'utf-8');
let count = 0;

for (const { id, old, min } of fixes) {
  const idIdx = code.indexOf(`id: '${id}'`);
  if (idIdx === -1) { console.log(`ID ${id}: NOT FOUND`); continue; }

  const searchStart = idIdx;
  const searchEnd = Math.min(idIdx + 4000, code.length);
  const chunk = code.slice(searchStart, searchEnd);

  const priceIdx = chunk.indexOf(`priceFrom: ${old}`);
  if (priceIdx === -1) { console.log(`ID ${id}: priceFrom ${old} not found near id`); continue; }

  const absIdx = searchStart + priceIdx;
  const oldStr = `priceFrom: ${old}`;
  const newStr = `priceFrom: ${min}`;
  code = code.slice(0, absIdx) + newStr + code.slice(absIdx + oldStr.length);
  console.log(`ID ${id}: ${old} → ${min}`);
  count++;
}

writeFileSync(filePath, code, 'utf-8');
console.log(`\nUpdated ${count} priceFrom values`);
