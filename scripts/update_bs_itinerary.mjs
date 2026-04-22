import { readFileSync, writeFileSync } from 'fs';

const scraped = JSON.parse(readFileSync('scripts/bs_itinerary_data.json', 'utf-8'));

function escapeForTS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const toursInFile = scraped.filter(t => t.file === filePath.replace(/^.*[/\\]/, ''));
  
  if (toursInFile.length === 0) {
    console.log(`No tours to update in ${filePath}`);
    return;
  }
  
  console.log(`\nProcessing ${filePath} (${toursInFile.length} tours)...`);
  let updatedCount = 0;

  for (const tour of toursInFile) {
    if (tour.daysCount === 0) {
      console.log(`  [SKIP] ${tour.slug}: no scraped days`);
      continue;
    }

    const slugIdx = content.indexOf(`slug: '${tour.slug}'`);
    if (slugIdx === -1) {
      console.log(`  [SKIP] ${tour.slug}: slug not found in file`);
      continue;
    }

    const itinIdx = content.indexOf('itinerary: [', slugIdx);
    if (itinIdx === -1) {
      console.log(`  [SKIP] ${tour.slug}: itinerary not found`);
      continue;
    }

    const nextTourRe = /\n  \{[\s\n]*id:/g;
    nextTourRe.lastIndex = slugIdx + 10;
    const nextTourMatch = nextTourRe.exec(content);
    const searchEnd = nextTourMatch ? nextTourMatch.index : content.length;

    let bracketDepth = 0;
    let itinStart = -1;
    let itinEnd = -1;
    for (let i = itinIdx + 'itinerary: '.length; i < searchEnd; i++) {
      if (content[i] === '[') {
        if (bracketDepth === 0) itinStart = i;
        bracketDepth++;
      } else if (content[i] === ']') {
        bracketDepth--;
        if (bracketDepth === 0) {
          itinEnd = i + 1;
          break;
        }
      }
    }

    if (itinStart === -1 || itinEnd === -1) {
      console.log(`  [SKIP] ${tour.slug}: couldn't find itinerary bounds`);
      continue;
    }

    const imagesPerDay = Math.max(2, Math.floor(tour.images.length / tour.days.length));
    
    const newItinerary = tour.days.map((day, idx) => {
      const startImg = idx * imagesPerDay;
      const dayImages = tour.images.slice(startImg, startImg + imagesPerDay).slice(0, 2);
      
      const escapedDesc = escapeForTS(day.description);
      const escapedTitle = escapeForTS(day.title);
      
      const imagesStr = dayImages.length > 0
        ? `images: [\n        '${dayImages.join("',\n        '")}',\n      ]`
        : `images: []`;
      
      return `{ day: ${day.day}, title: '${escapedTitle}', description: '${escapedDesc}', ${imagesStr} }`;
    });

    const newItinStr = '[\n      ' + newItinerary.join(',\n      ') + ',\n    ]';

    content = content.slice(0, itinStart) + newItinStr + content.slice(itinEnd);
    
    const totalChars = tour.days.reduce((s, d) => s + d.description.length, 0);
    console.log(`  [OK] ${tour.slug}: ${tour.daysCount} days, ${totalChars} chars total, ${imagesPerDay} imgs/day`);
    updatedCount++;
  }

  writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${updatedCount} tours in ${filePath}`);
}

processFile('data/mock-tours.ts');
processFile('data/golden-ring-tours.ts');

console.log('\nDone!');
