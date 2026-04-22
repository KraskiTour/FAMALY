/**
 * Full audit of all KRASKI.TRAVEL tour data.
 * Checks: cities/slugs, dates, required fields, uniqueness, filters, artifacts.
 * Run: node scripts/full_audit.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const TODAY = new Date('2026-04-15');

function readFile(name) {
  return readFileSync(join(DATA_DIR, name), 'utf-8');
}

function extractCitiesRegistry(text) {
  const cities = {};
  const re = /name:\s*'([^']+)',\s*\n\s*slug:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    cities[m[2]] = m[1];
  }
  return cities;
}

function extractTourBlocks(text) {
  const tours = [];
  const re = /\{\s*\n\s*id:\s*'(\d+)'/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    let depth = 0;
    let i = start;
    while (i < text.length) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          tours.push([m[1], text.slice(start, i + 1)]);
          break;
        }
      }
      i++;
    }
  }
  return tours;
}

function extractStr(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*'([^']*)'`));
  return m ? m[1] : null;
}

function extractNum(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*(\\d+)`));
  return m ? parseInt(m[1]) : null;
}

function extractBalancedArray(block, field) {
  const idx = block.indexOf(`${field}: [`);
  if (idx === -1) return '';
  const start = block.indexOf('[', idx) + 1;
  let depth = 1, i = start;
  while (i < block.length && depth > 0) {
    if (block[i] === '[') depth++;
    else if (block[i] === ']') depth--;
    i++;
  }
  return block.slice(start, i - 1);
}

function extractDepartureCities(block) {
  const dcText = extractBalancedArray(block, 'departureCities');
  if (!dcText) return [];
  const cities = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(dcText)) !== null) {
    const obj = m[1];
    const city = obj.match(/city:\s*'([^']*)'/);
    const slug = obj.match(/slug:\s*'([^']*)'/);
    const dt = obj.match(/departureTime:\s*'([^']*)'/);
    const mp = obj.match(/meetingPoint:\s*'([^']*)'/);
    cities.push({
      city: city ? city[1] : '',
      slug: slug ? slug[1] : '',
      departureTime: dt ? dt[1] : '',
      meetingPoint: mp ? mp[1] : '',
    });
  }
  return cities;
}

function extractNextDates(block) {
  const ndText = extractBalancedArray(block, 'nextDates');
  if (!ndText) return [];
  const dates = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(ndText)) !== null) {
    const obj = m[1];
    const s = obj.match(/start:\s*'([^']*)'/);
    const e = obj.match(/end:\s*'([^']*)'/);
    const p = obj.match(/price:\s*(\d+)/);
    dates.push({
      start: s ? s[1] : '',
      end: e ? e[1] : '',
      price: p ? parseInt(p[1]) : 0,
    });
  }
  return dates;
}

function extractGallery(block) {
  const galText = extractBalancedArray(block, 'gallery');
  if (!galText) return [];
  return [...galText.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

function countItineraryDays(block) {
  const itText = extractBalancedArray(block, 'itinerary');
  if (!itText) return 0;
  return [...itText.matchAll(/day:\s*\d+/g)].length;
}

function checkArtifacts(block) {
  const issues = [];
  const artifacts = ['<div', '<span', '<br', '<p>', '</div', '</span'];
  for (const art of artifacts) {
    const idx = block.indexOf(art);
    if (idx !== -1) {
      const lineStart = block.lastIndexOf('\n', idx);
      const lineEnd = block.indexOf('\n', idx);
      const line = block.slice(lineStart + 1, lineEnd).trim();
      if (!line.includes('http') && !line.includes('//')) {
        issues.push(`Artifact '${art}' near: ${line.slice(0, 80)}`);
      }
    }
  }
  return issues;
}

function extractIncluded(block) {
  const text = extractBalancedArray(block, 'included');
  return text ? [...text.matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
}

function extractExcluded(block) {
  const text = extractBalancedArray(block, 'excluded');
  return text ? [...text.matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
}

// ─── Main ───

const errors = [];
const warnings = [];

console.log('='.repeat(70));
console.log('KRASKI.TRAVEL — ПОЛНЫЙ АУДИТ ДАННЫХ ТУРОВ');
console.log(`Дата: ${TODAY.toISOString().split('T')[0]}`);
console.log('='.repeat(70));

// 1) Cities registry
const mockText = readFile('mock-tours.ts');
const citiesRegistry = extractCitiesRegistry(mockText);
console.log(`\n[CITIES] Реестр городов: ${Object.keys(citiesRegistry).length}`);
for (const [slug, name] of Object.entries(citiesRegistry).sort()) {
  console.log(`   ${slug} -> ${name}`);
}

// 2) Collect all tours
const files = ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts',
               'bogema-tours.ts', 'bogema-tours-batch2.ts'];

const allTours = [];
for (const fname of files) {
  const text = readFile(fname);
  const tours = extractTourBlocks(text);
  console.log(`\n[FILE] ${fname}: ${tours.length} tours`);
  for (const [tid, block] of tours) {
    allTours.push({ id: tid, block, file: fname });
  }
}
console.log(`\n[TOTAL] ${allTours.length} tours\n`);

// 3) Uniqueness
console.log('-'.repeat(70));
console.log('1. UNIQUENESS (ID & SLUG)');
console.log('-'.repeat(70));

const seenIds = {};
const seenSlugs = {};
for (const t of allTours) {
  if (seenIds[t.id]) {
    errors.push(`DUPLICATE ID '${t.id}' in ${t.file} and ${seenIds[t.id]}`);
  }
  seenIds[t.id] = t.file;

  const slug = extractStr(t.block, 'slug');
  if (slug) {
    if (seenSlugs[slug]) {
      errors.push(`DUPLICATE SLUG '${slug}' (ID ${t.id} in ${t.file}, ID ${seenSlugs[slug][0]} in ${seenSlugs[slug][1]})`);
    }
    seenSlugs[slug] = [t.id, t.file];
  }
}
const dupErrors = errors.filter(e => e.includes('DUPLICATE'));
if (dupErrors.length === 0) {
  console.log('   OK: All IDs unique');
  console.log('   OK: All slugs unique');
} else {
  for (const e of dupErrors) console.log(`   ERROR: ${e}`);
}

// 4) Per-tour checks
console.log('\n' + '-'.repeat(70));
console.log('2. PER-TOUR CHECKS');
console.log('-'.repeat(70));

const toursPerCity = {};
let stats = {
  pastDates: 0, dateMismatch: 0, emptyGallery: 0, itinMismatch: 0,
  missingDeptTime: 0, missingMeetPoint: 0, badSlugs: 0, dupCities: 0,
  priceMismatch: 0, artifacts: 0, emptyIncluded: 0, emptyExcluded: 0,
  toursOk: 0,
};

for (const t of allTours) {
  const tourErrors = [];
  const tourWarnings = [];

  const title = extractStr(t.block, 'title') || `(no title ID ${t.id})`;
  const slug = extractStr(t.block, 'slug') || '';
  const duration = extractNum(t.block, 'durationDays') || 0;
  const priceFrom = extractNum(t.block, 'priceFrom') || 0;

  // Required fields
  if (!extractStr(t.block, 'title')) tourErrors.push('title empty');
  if (!slug) tourErrors.push('slug empty');

  const shortDesc = extractStr(t.block, 'shortDescription');
  if (!shortDesc || shortDesc.length < 10)
    tourWarnings.push(`shortDescription too short (${(shortDesc || '').length} chars)`);

  // Gallery
  const gallery = extractGallery(t.block);
  if (gallery.length === 0) {
    tourErrors.push('gallery EMPTY');
    stats.emptyGallery++;
  }

  // Itinerary vs durationDays
  const itinDays = countItineraryDays(t.block);
  if (itinDays > 0 && duration > 0 && itinDays !== duration) {
    tourWarnings.push(`itinerary (${itinDays} days) != durationDays (${duration})`);
    stats.itinMismatch++;
  }

  // Included/Excluded
  const included = extractIncluded(t.block);
  const excluded = extractExcluded(t.block);
  if (included.length === 0) { tourWarnings.push('included[] empty'); stats.emptyIncluded++; }
  if (excluded.length === 0) { tourWarnings.push('excluded[] empty'); stats.emptyExcluded++; }

  // Departure cities
  const depCities = extractDepartureCities(t.block);
  const citySlugsInTour = new Set();
  for (const dc of depCities) {
    if (dc.slug && !citiesRegistry[dc.slug]) {
      tourErrors.push(`slug '${dc.slug}' (${dc.city}) NOT in cities registry`);
      stats.badSlugs++;
    }
    if (citySlugsInTour.has(dc.slug)) {
      tourErrors.push(`duplicate city '${dc.slug}' in departureCities`);
      stats.dupCities++;
    }
    citySlugsInTour.add(dc.slug);

    if (!dc.departureTime) {
      tourWarnings.push(`departureTime empty for ${dc.city} (${dc.slug})`);
      stats.missingDeptTime++;
    }
    if (!dc.meetingPoint) {
      tourWarnings.push(`meetingPoint empty for ${dc.city} (${dc.slug})`);
      stats.missingMeetPoint++;
    }

    if (dc.slug) {
      if (!toursPerCity[dc.slug]) toursPerCity[dc.slug] = [];
      toursPerCity[dc.slug].push(t.id);
    }
  }

  // Dates
  const nextDates = extractNextDates(t.block);
  if (nextDates.length > 0) {
    const prices = nextDates.map(d => d.price).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    if (minPrice > 0 && priceFrom > 0 && minPrice !== priceFrom) {
      tourWarnings.push(`priceFrom (${priceFrom}) != min date price (${minPrice})`);
      stats.priceMismatch++;
    }

    for (const d of nextDates) {
      const startD = new Date(d.start);
      const endD = new Date(d.end);

      if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
        tourErrors.push(`Bad date format: ${d.start} / ${d.end}`);
        continue;
      }
      if (endD < startD) {
        tourErrors.push(`end < start: ${d.start}..${d.end}`);
      }
      if (endD < TODAY) {
        stats.pastDates++;
      }
      const actualDays = Math.round((endD - startD) / 86400000) + 1;
      if (duration > 0 && actualDays !== duration) {
        stats.dateMismatch++;
      }
      if (d.price <= 0) {
        tourErrors.push(`price <= 0 for date ${d.start}`);
      }
    }
  }

  // Artifacts
  const artIssues = checkArtifacts(t.block);
  if (artIssues.length) {
    stats.artifacts += artIssues.length;
    for (const a of artIssues) tourErrors.push(`ARTIFACT: ${a}`);
  }

  // Print
  if (tourErrors.length || tourWarnings.length) {
    console.log(`\n  ID ${t.id} | ${title.slice(0, 50)} (${t.file})`);
    for (const e of tourErrors) {
      errors.push(`ID ${t.id}: ${e}`);
      console.log(`    ERROR: ${e}`);
    }
    for (const w of tourWarnings) {
      warnings.push(`ID ${t.id}: ${w}`);
      console.log(`    WARN:  ${w}`);
    }
  } else {
    stats.toursOk++;
  }
}

// 5) Filter audit
console.log('\n' + '-'.repeat(70));
console.log('3. FILTERS: CITY -> TOURS');
console.log('-'.repeat(70));

for (const [slug, name] of Object.entries(citiesRegistry).sort()) {
  const count = (toursPerCity[slug] || []).length;
  if (count === 0) {
    warnings.push(`City ${name} (${slug}) has 0 tours`);
    console.log(`   WARN: ${name} (${slug}): 0 tours`);
  } else {
    console.log(`   OK:   ${name} (${slug}): ${count} tours`);
  }
}

const orphanSlugs = Object.keys(toursPerCity).filter(s => !citiesRegistry[s]);
if (orphanSlugs.length) {
  console.log(`\n   ERROR: Slugs used in tours but NOT in registry: ${orphanSlugs.join(', ')}`);
  for (const s of orphanSlugs) errors.push(`Slug '${s}' in tours but not in cities[]`);
}

// 6) Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`  Tours checked:             ${allTours.length}`);
console.log(`  Tours OK (no issues):      ${stats.toursOk}`);
console.log(`  Cities in registry:        ${Object.keys(citiesRegistry).length}`);
console.log('');
console.log(`  ERRORS:                    ${errors.length}`);
console.log(`  WARNINGS:                  ${warnings.length}`);
console.log('');
console.log(`  Past dates:                ${stats.pastDates}`);
console.log(`  Duration mismatch:         ${stats.dateMismatch}`);
console.log(`  Empty galleries:           ${stats.emptyGallery}`);
console.log(`  Itinerary mismatch:        ${stats.itinMismatch}`);
console.log(`  Missing departureTime:     ${stats.missingDeptTime}`);
console.log(`  Missing meetingPoint:      ${stats.missingMeetPoint}`);
console.log(`  Unknown city slugs:        ${stats.badSlugs}`);
console.log(`  Duplicate cities:          ${stats.dupCities}`);
console.log(`  priceFrom != min price:    ${stats.priceMismatch}`);
console.log(`  HTML artifacts:            ${stats.artifacts}`);
console.log(`  Empty included[]:          ${stats.emptyIncluded}`);
console.log(`  Empty excluded[]:          ${stats.emptyExcluded}`);

if (errors.length) {
  console.log('\n' + '-'.repeat(70));
  console.log('ALL ERRORS:');
  console.log('-'.repeat(70));
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
}

if (warnings.length) {
  console.log('\n' + '-'.repeat(70));
  console.log('ALL WARNINGS (first 60):');
  console.log('-'.repeat(70));
  warnings.slice(0, 60).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  if (warnings.length > 60) console.log(`  ... and ${warnings.length - 60} more`);
}

process.exit(errors.length > 0 ? 1 : 0);
