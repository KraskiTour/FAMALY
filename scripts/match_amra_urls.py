"""
Match our tour slugs/titles to the scraped Amra tour URLs.
Use fuzzy keyword matching from tour title → Amra slug.
"""
import pathlib
import re

# Load scraped Amra URLs
amra_urls = {}
for line in pathlib.Path(r'c:\COD\FAMALY\scripts\amra_tour_urls.txt').read_text(encoding='utf-8').splitlines():
    if '\t' in line:
        slug, url = line.split('\t', 1)
        amra_urls[slug] = url

# Extract our tours with sourceOperator='Amra Turistik'
our_tours = []
for fname in ['mock-tours.ts', 'amra-tours.ts']:
    code = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}').read_text(encoding='utf-8')
    
    block_re = re.compile(
        r"title:\s*['\"]([^'\"]+)['\"].*?"
        r"slug:\s*'([^']+)'.*?"
        r"sourceUrl:\s*'([^']*)'.*?"
        r"sourceOperator:\s*'([^']*)'",
        re.DOTALL
    )
    for m in block_re.finditer(code):
        title, slug, url, operator = m.group(1), m.group(2), m.group(3), m.group(4)
        if operator == 'Amra Turistik':
            our_tours.append((slug, title, url, fname))

print(f'Our Amra tours: {len(our_tours)}')
print(f'Scraped Amra URLs: {len(amra_urls)}')
print()

# For each of our tours, try to find a matching Amra URL
def normalize(s):
    s = s.lower()
    s = re.sub(r'[^a-zа-яё0-9\s]', ' ', s)
    return set(s.split())

def score_match(our_title, amra_slug):
    """Score how well an Amra slug matches our title."""
    our_words = normalize(our_title)
    amra_words = set(amra_slug.replace('-', ' ').split())
    
    # Also transliterate some common words
    translit = {
        'абхазия': 'abhazi', 'крым': 'krym', 'дагестан': 'dagestan',
        'грузия': 'gruziy', 'осетия': 'osetiy', 'чечня': 'chechn',
        'домбай': 'dombaj', 'архыз': 'arkhyz', 'эльбрус': 'elbrus',
        'стамбул': 'stambul', 'калмыкия': 'kalmyki',
        'калининград': 'kaliningrad', 'беларусь': 'belarus',
        'узбекистан': 'uzbekistan', 'адыгея': 'adyge',
        'геленджик': 'gelendzhik', 'абрау': 'abrau',
        'мезмай': 'mezmaj', 'лаго': 'lago', 'наки': 'naki',
        'гузерипль': 'guzeripl', 'сочи': 'sochi',
        'водопады': 'vodopad', 'горячий': 'goryachij',
        'термальные': 'termaln', 'тюльпаны': 'tyulpan',
        'парк': 'park', 'галицкого': 'galitsk',
        'чегем': 'chegem', 'балкария': 'balkariy',
        'осетия': 'osetiy', 'карелия': 'kareli',
        'мрия': 'mriy', 'петербург': 'peterburg',
        'рафтинг': 'rafting', 'шато': 'shato',
    }
    
    # Count amra slug words that appear (partially) in our title transliterations
    overlap = 0
    for word in amra_words:
        if len(word) < 3:
            continue
        for our_w in our_words:
            for rus, lat in translit.items():
                if lat in word and rus in our_w:
                    overlap += 1
                    break
    
    return overlap

# Mapping fixes
fixes = {}
unmatched = []

for our_slug, our_title, current_url, fname in our_tours:
    # Skip if already pointing to a specific amra tour page
    if '/tours/' in current_url and 'amra-turistik.ru/tours/' in current_url:
        # Check if this specific URL exists in our scraped data
        url_slug = current_url.rstrip('/').split('/tours/')[-1]
        if url_slug in amra_urls:
            continue  # Already has a valid specific URL
    
    # Try exact slug match first
    best_url = None
    best_score = 0
    
    # Try finding by our slug keywords
    our_slug_words = set(our_slug.replace('-', ' ').split())
    
    for amra_slug, amra_url in amra_urls.items():
        amra_words = set(amra_slug.replace('-', ' ').split())
        
        # Count common meaningful words (>3 chars)
        common = 0
        for w1 in our_slug_words:
            if len(w1) < 3:
                continue
            for w2 in amra_words:
                if len(w2) < 3:
                    continue
                # Check if one contains the other (partial match)
                if w1 in w2 or w2 in w1:
                    common += 1
                    break
        
        # Bonus: title-based matching
        title_score = score_match(our_title, amra_slug)
        
        total = common * 2 + title_score
        if total > best_score:
            best_score = total
            best_url = amra_url
    
    if best_score >= 3:
        # Only apply if it's actually different and points to a specific tour
        if best_url != current_url:
            fixes[our_slug] = (best_url, best_score, our_title, current_url, fname)
    else:
        unmatched.append((our_slug, our_title, current_url, fname))

print(f'\n=== MATCHED ({len(fixes)}) ===')
for slug, (url, score, title, old_url, fname) in sorted(fixes.items()):
    print(f'  [{score}] {slug}')
    print(f'       TITLE: {title}')
    print(f'       OLD:   {old_url}')
    print(f'       NEW:   {url}')

print(f'\n=== UNMATCHED ({len(unmatched)}) ===')
for slug, title, url, fname in unmatched:
    print(f'  {slug} | {title} | {url}')
