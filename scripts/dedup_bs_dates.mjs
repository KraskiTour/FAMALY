/**
 * Remove duplicate nextDates entries from Bolshaya Strana tours.
 * Also filter out past dates (before today 2026-04-15).
 */
import { readFileSync, writeFileSync } from 'fs';

const dataFiles = ['data/mock-tours.ts', 'data/golden-ring-tours.ts'];
const today = '2026-04-15';

for (const filePath of dataFiles) {
  let code = readFileSync(filePath, 'utf-8');
  const replacements = [];

  // Find all BS tours
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
    
    // Find nextDates in the code
    const datesStart = code.indexOf('nextDates: [', start);
    if (datesStart === -1 || datesStart > i) continue;
    
    const datesContentStart = datesStart + 'nextDates: ['.length;
    let dd = 1, di = datesContentStart;
    while (di < code.length && dd > 0) {
      if (code[di] === '[') dd++;
      else if (code[di] === ']') dd--;
      di++;
    }
    const datesEnd = di;
    const datesContent = code.slice(datesContentStart, datesEnd - 1);
    
    // Parse date entries
    const entries = [];
    const entryRe = /\{\s*start:\s*'([^']+)',\s*end:\s*'([^']+)',\s*price:\s*(\d+),\s*seatsLeft:\s*(\w+)\s*\}/g;
    let em;
    while ((em = entryRe.exec(datesContent)) !== null) {
      entries.push({ start: em[1], end: em[2], price: parseInt(em[3]), seatsLeft: em[4] });
    }
    
    // Deduplicate by start+end
    const seen = new Set();
    const unique = entries.filter(e => {
      const key = `${e.start}_${e.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return e.start >= today;
    });

    if (unique.length < entries.length) {
      const removed = entries.length - unique.length;
      const dateLines = unique.map(e => 
        `      { start: '${e.start}', end: '${e.end}', price: ${e.price}, seatsLeft: ${e.seatsLeft} }`
      );
      const newDates = `nextDates: [\n${dateLines.join(',\n')},\n    ]`;
      replacements.push({ id, start: datesStart, end: datesEnd, newText: newDates, before: entries.length, after: unique.length });
    }
  }

  replacements.sort((a, b) => b.start - a.start);

  let totalRemoved = 0;
  for (const r of replacements) {
    code = code.slice(0, r.start) + r.newText + code.slice(r.end);
    const removed = r.before - r.after;
    totalRemoved += removed;
    console.log(`  ID ${r.id}: ${r.before} → ${r.after} dates (-${removed})`);
  }

  if (replacements.length > 0) {
    writeFileSync(filePath, code);
    console.log(`\n${filePath}: removed ${totalRemoved} duplicate dates\n`);
  }
}
