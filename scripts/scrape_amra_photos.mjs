/**
 * Scrape photos from amra-turistik.ru tour pages
 * Extracts <img> src URLs from tour gallery sections
 */

const tours = [
  { id: '1', slug: 'lago-naki-1-den', url: 'https://amra-turistik.ru/tours/krasivejshij-vidovoj-tur-po-smotrovym-lago-naki-2/' },
  { id: '2', slug: 'gelendzhik-more-i-skaly', url: 'https://amra-turistik.ru/tours/lyubimaya-klassika-ot-abrau-do-gelendzhika' },
  { id: '17', slug: 'termy-adygei-1-den', url: 'https://amra-turistik.ru/tours/termalnye-istochniki-vodnaya-rivera-i-pitejnyj-dom-v-majkope-6/' },
  { id: '20', slug: 'park-loga-1-den', url: 'https://amra-turistik.ru/tours/velikolepnye-vyhodnye-v-rostovskoj-oblasti-8' },
  { id: '22', slug: 'elista-kalmykiya-1-den', url: 'https://amra-turistik.ru/tours/festival-tyulpanov-v-kalmykii-12' },
  { id: '24', slug: 'goryachij-klyuch-park-galitskogo', url: 'https://amra-turistik.ru/tours/goryachij-klyuch-i-kapibary-i-alpaki-na-ferme-10' },
  { id: '25', slug: 'sochi-na-vyhodnye', url: 'https://amra-turistik.ru/tours/mir-vodopadov-i-vodopadov-5' },
];

async function scrapePhotos(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) return [];
    const html = await response.text();
    
    // Extract all image URLs from wp-content/uploads
    const imgRegex = /https?:\/\/amra-turistik\.ru\/wp-content\/uploads\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
    const allImages = [...new Set(html.match(imgRegex) || [])];
    
    // Filter out thumbnails and icons (usually small like -150x150 or -100x100)
    const filtered = allImages.filter(img => {
      if (/-\d{2,3}x\d{2,3}\./.test(img)) return false;
      if (/icon|logo|avatar|favicon/i.test(img)) return false;
      return true;
    });
    
    return filtered.slice(0, 8);
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return [];
  }
}

async function main() {
  const results = {};
  
  for (const tour of tours) {
    console.log(`\nID ${tour.id} | ${tour.slug}`);
    console.log(`  URL: ${tour.url}`);
    
    const photos = await scrapePhotos(tour.url);
    console.log(`  Photos found: ${photos.length}`);
    photos.forEach((p, i) => console.log(`  [${i + 1}] ${p}`));
    
    results[tour.id] = { slug: tour.slug, photos };
  }
  
  // Output as JS for easy copy
  console.log('\n\n=== RESULTS ===');
  for (const [id, data] of Object.entries(results)) {
    if (data.photos.length === 0) continue;
    console.log(`\n// ID ${id} (${data.slug})`);
    console.log(`gallery: [`);
    data.photos.forEach(p => console.log(`  '${p}',`));
    console.log(`],`);
  }
}

main();
