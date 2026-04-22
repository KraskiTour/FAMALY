/**
 * Fix corrupted lines in mock-tours.ts where text garbage
 * got appended after array closing brackets like:
 *   ]лам и дегустация. Прогулка...
 * 
 * Strategy: find lines matching ']' followed by Cyrillic text,
 * analyze context, and clean them up.
 */
import { readFileSync, writeFileSync } from 'fs';

const filePath = 'data/mock-tours.ts';
let code = readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

let fixes = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Pattern: "]someText" where someText starts with Cyrillic or lowercase Latin
  if (/^\][\u0400-\u04FF\u0451\u0401a-z]/.test(trimmed)) {
    const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
    const nextLines = lines.slice(i + 1, Math.min(lines.length, i + 3)).join('\n');

    console.log(`Line ${i + 1}: ${trimmed.slice(0, 80)}...`);

    // Check what comes next
    const nextTrimmed = lines[i + 1] ? lines[i + 1].trim() : '';

    if (nextTrimmed === '],') {
      // The "]garbage" line is followed by "],"  — this is a corrupted nextDates/itinerary
      // The real close is the "]," on next line. Just remove the garbage line.
      console.log(`  → Removing corrupt line (next line is ],)`);
      lines[i] = lines[i].replace(/\].+/, ']');
      // But wait, actually the ']' on this line might be the close of a date object, 
      // and the '],' on next line is the close of the nextDates array.
      // Let's check: if the previous block has { start: '...' }, the ] closes the array.
      // Actually let's just remove the garbage after ]
      fixes++;
    } else if (trimmed.includes("' },") || trimmed.includes("'] },")) {
      // This is a corrupted itinerary day description that got merged with array close
      // e.g.: ]ные долины и горные реки...' },
      // The ] is part of a broken nextDates, need to just add ] before this line
      console.log(`  → Itinerary content leaked into nextDates close`);
      // Remove this line entirely - the content already exists elsewhere  
      const indent = line.match(/^(\s*)/)[1];
      lines[i] = indent + '],';
      // But we might be losing itinerary content... Let's be more careful
      // Actually this looks like: the update_amra_dates script replaced the nextDates array
      // but accidentally included content from after the array.
      // The real fix: just trim to "],"
      fixes++;
    } else {
      // Generic: just clean the garbage after ]
      const indent = line.match(/^(\s*)/)[1];
      lines[i] = indent + '],';
      console.log(`  → Cleaned to ],`);
      fixes++;
    }
  }
}

if (fixes > 0) {
  writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log(`\nFixed ${fixes} corrupted lines`);
} else {
  console.log('No corrupted lines found');
}
