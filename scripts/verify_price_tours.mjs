import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const MAPPING_PATH = 'C:\\Users\\Gerard\\Desktop\\tours-for-google-sheets.xlsx';

// Build mapping: slug → { kod, name, operatorUrl }
const wb = XLSX.readFile(MAPPING_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
const mapping = {};
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[1]) continue;
  const slug = String(r[3] || '').trim();
  const url = String(r[6] || '').trim();
  mapping[slug] = { kod: r[1], name: String(r[2] || ''), url };
}

const ids = ['26', '27', '28', '29', '30', '31', '38', '39', '41', '42', '43', '44', '45', '46'];

const files = ['data/mock-tours.ts', 'data/amra-tours.ts'];

for (const f of files) {
  const code = readFileSync(f, 'utf-8');
  for (const id of ids) {
    const idRe = new RegExp(`id:\\s*'${id}'`);
    const idMatch = idRe.exec(code);
    if (!idMatch) continue;

    const chunk = code.slice(idMatch.index, idMatch.index + 3000);
    const slugM = chunk.match(/slug:\s*'([^']*)'/);
    const srcM = chunk.match(/sourceUrl:\s*'([^']*)'/);
    const priceM = chunk.match(/priceFrom:\s*(\d+)/);
    const titleM = chunk.match(/title:\s*'([^']*)'/);

    const ndBlock = chunk.match(/nextDates:\s*\[([\s\S]*?)\]/);
    let prices = [];
    if (ndBlock) {
      for (const pm of ndBlock[1].matchAll(/price:\s*(\d+)/g)) {
        prices.push(parseInt(pm[1]));
      }
    }
    const minPrice = prices.length ? Math.min(...prices) : 'N/A';

    const slug = slugM ? slugM[1] : '?';
    const mapEntry = mapping[slug];

    const srcUrl = srcM ? srcM[1] : '';
    const mapUrl = mapEntry ? mapEntry.url : '';

    const norm = u => u.replace(/\/+$/, '').toLowerCase();
    let matchStatus = 'NO_DATA';
    if (srcUrl && mapUrl) {
      matchStatus = norm(srcUrl) === norm(mapUrl) ? 'EXACT' :
        norm(srcUrl).replace(/-\d+$/, '') === norm(mapUrl).replace(/-\d+$/, '') ? 'BASE_MATCH' : 'DIFFERENT';
    } else if (!srcUrl) {
      matchStatus = 'NO_sourceUrl';
    } else {
      matchStatus = 'NOT_IN_MAPPING';
    }

    console.log(`ID ${id} | ${(titleM ? titleM[1] : '?').slice(0, 50)}`);
    console.log(`  slug:      ${slug}`);
    console.log(`  sourceUrl: ${srcUrl.slice(0, 90) || 'NONE'}`);
    console.log(`  mapping:   ${mapUrl.slice(0, 90) || 'NOT_FOUND'}`);
    console.log(`  match:     ${matchStatus}`);
    console.log(`  priceFrom: ${priceM ? priceM[1] : '?'} → minDate: ${minPrice}`);
    console.log(`  dates:     ${prices.length} entries`);
    console.log('');
  }
}
