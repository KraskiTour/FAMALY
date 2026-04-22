import { readFileSync, writeFileSync } from 'fs';

const filePath = 'data/mock-tours.ts';
let code = readFileSync(filePath, 'utf-8');
let fixes = 0;

// Pattern: "    ],\n      { day:" — orphaned itinerary days after nextDates close
// Fix: replace "],\n      { day:" with "],\n    included: [],\n    excluded: [],\n    itinerary: [\n      { day: 1, ... },\n      { day:"

// But we need context. The pattern is:
// Line N:   ],             <-- closes nextDates
// Line N+1:   { day: 2, ...  <-- orphaned itinerary day (should have itinerary: [ { day: 1, ... }, before it)

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed === '],') {
    const nextTrimmed = (lines[i + 1] || '').trim();
    if (nextTrimmed.startsWith('{ day:')) {
      const dayNum = nextTrimmed.match(/day:\s*(\d+)/);
      if (dayNum && parseInt(dayNum[1]) >= 2) {
        // This is an orphaned itinerary. Need to add included, excluded, itinerary header + day 1 stub
        const indent = lines[i].match(/^(\s*)/)[1];
        const replacement = `${indent}],\n${indent}included: [],\n${indent}excluded: [],\n${indent}itinerary: [\n${indent}  { day: 1, title: 'День 1', description: 'Выезд, экскурсионная программа.' },`;
        lines[i] = replacement;
        console.log(`Line ${i + 1}: Added itinerary header before orphaned day ${dayNum[1]}`);
        fixes++;
      }
    }
  }
}

if (fixes > 0) {
  writeFileSync(filePath, lines.join('\n'));
  console.log(`Fixed ${fixes} orphaned itinerary blocks`);
} else {
  console.log('No orphaned itinerary blocks found');
}
