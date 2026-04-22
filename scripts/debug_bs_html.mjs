const url = 'https://bolshayastrana.com/sankt-peterburg/shedevry-severnoj-tur-na-5-282642';

const res = await fetch(url);
const html = await res.text();

const progIdx = html.indexOf('Программа тура');
console.log('Program section found at index:', progIdx);

const section = html.slice(progIdx, progIdx + 500);
console.log('\n=== Section start (500 chars) ===');
console.log(section);

// Find as-collapse elements
const collapseRe = /as-collapse/g;
let m;
let count = 0;
while ((m = collapseRe.exec(html)) !== null) {
  count++;
  if (count <= 5) {
    const ctx = html.slice(Math.max(0, m.index - 50), m.index + 200);
    console.log(`\n=== as-collapse #${count} ===`);
    console.log(ctx);
  }
}
console.log(`\nTotal as-collapse occurrences: ${count}`);

// Try to find day number patterns
const dayRe = /(\d+)\s*день/g;
let dm;
let dayCount = 0;
while ((dm = dayRe.exec(html)) !== null) {
  dayCount++;
  if (dayCount <= 10) {
    const ctx = html.slice(Math.max(0, dm.index - 30), dm.index + 100);
    console.log(`\n=== Day pattern #${dayCount}: "${dm[0]}" ===`);
    console.log(ctx);
  }
}
console.log(`\nTotal day patterns found: ${dayCount}`);

// Find article-text divs
const artRe = /article-text/g;
let am;
let artCount = 0;
while ((am = artRe.exec(html)) !== null) {
  artCount++;
}
console.log(`\nTotal article-text occurrences: ${artCount}`);
