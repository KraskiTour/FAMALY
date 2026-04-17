"""
Scrape all Bogema tours that have May 2026 dates.
Step 1: Get all tour links from the calendar page HTML.
Step 2: Fetch each tour page and check for May 2026 dates.
Step 3: Output the full list with URLs, titles, prices, dates.
"""
import urllib.request, ssl, re, json, html as html_mod

ssl._create_default_https_context = ssl._create_unverified_context
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

ALREADY_HAVE = {
    '10203', '10141', '47093', '46825', '45755', '45752', '46113',
}

print("=== Step 1: Fetching calendar page ===")
req = urllib.request.Request("https://bogema.ru/calendar", headers=HEADERS)
with urllib.request.urlopen(req, timeout=20) as resp:
    cal_html = resp.read().decode('utf-8')

tour_links = re.findall(r'href="(/tours/(\d+)-([^"]+))"', cal_html)
seen = {}
for full_path, tour_id, slug in tour_links:
    if tour_id not in seen:
        seen[tour_id] = (full_path, slug)

print(f"  Found {len(seen)} unique tours on calendar page")

# Also fetch May calendar via AJAX
print("\n=== Step 1b: Trying AJAX for May calendar ===")
ajax_url = "https://bogema.ru/component/jatoms/?task=calendar.getAjaxHTML&Itemid=101"
for params_str in ['month=5&year=2026&direction=next', 'month=5&year=2026']:
    try:
        data = params_str.encode('utf-8')
        ajax_headers = dict(HEADERS)
        ajax_headers['X-Requested-With'] = 'XMLHttpRequest'
        ajax_headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        ajax_headers['Referer'] = 'https://bogema.ru/calendar'
        req = urllib.request.Request(ajax_url, data=data, headers=ajax_headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            ajax_html = resp.read().decode('utf-8')
        ajax_links = re.findall(r'href="(/tours/(\d+)-([^"]+))"', ajax_html)
        for full_path, tour_id, slug in ajax_links:
            if tour_id not in seen:
                seen[tour_id] = (full_path, slug)
        if ajax_links:
            print(f"  AJAX: found {len(ajax_links)} tour links, {len(seen)} total unique")
            break
    except Exception as e:
        print(f"  AJAX error: {e}")

print(f"\n=== Step 2: Checking {len(seen)} tours for May dates ===")
print(f"  (Skipping {len(ALREADY_HAVE)} already-added tours)")

may_tours = []
for tour_id, (path, slug) in sorted(seen.items()):
    if tour_id in ALREADY_HAVE:
        continue

    url = f"https://bogema.ru{path}"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            page = resp.read().decode('utf-8')
    except Exception as e:
        print(f"  [{tour_id}] ERROR fetching: {e}")
        continue

    # Check for May 2026 dates
    has_may = bool(re.search(r'0[1-9]\.05\.2026|[12]\d\.05\.2026|3[01]\.05\.2026', page))
    if not has_may:
        has_may = bool(re.search(r'Май\s*2026', page))

    if not has_may:
        continue

    # Extract title
    title_m = re.search(r'<h1[^>]*>([^<]+)</h1>', page)
    title = html_mod.unescape(title_m.group(1).strip()) if title_m else slug

    # Extract price
    price_m = re.search(r'(\d[\d\s]*)\s*руб\.', page)
    price = price_m.group(1).replace(' ', '').strip() if price_m else '?'

    # Extract duration
    dur_m = re.search(r'Продолжительность.*?(\d+)\s*(?:день|дня|дней)', page, re.DOTALL)
    duration = dur_m.group(1) if dur_m else '?'

    # Extract May dates
    may_dates = re.findall(r'(\d{2})\.05\.2026', page)
    may_dates = sorted(set(may_dates))

    # Count images
    tour_imgs = re.findall(r'/images/jatoms/tours/' + re.escape(f'{tour_id}-') + r'[^"\'>\s]+\.(?:jpg|jpeg|png|webp)', page, re.IGNORECASE)
    img_count = len(set(tour_imgs))

    # Count images in scripts too
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', page, re.DOTALL)
    for script in scripts:
        script_imgs = re.findall(r'/images/jatoms/tours/' + re.escape(f'{tour_id}-') + r'[^"\'>\s\\]+\.(?:jpg|jpeg|png|webp)', script)
        for si in script_imgs:
            full = f'https://bogema.ru{si}'
            tour_imgs.append(si)
    img_count = len(set(tour_imgs))

    may_tours.append({
        'id': tour_id,
        'slug': slug,
        'url': url,
        'title': title,
        'price': price,
        'duration': duration,
        'may_dates': may_dates,
        'img_count': img_count,
    })
    print(f"  [{tour_id}] {title} | {duration}d | {price}R | May: {','.join(may_dates)} | {img_count} imgs")

print(f"\n=== RESULT: {len(may_tours)} NEW tours with May dates ===")
for t in may_tours:
    print(f"  {t['title']}")
    print(f"    URL: {t['url']}")
    print(f"    Price: {t['price']} | Duration: {t['duration']}d | May dates: {','.join(t['may_dates'])} | Images: {t['img_count']}")

print(f"\n=== JSON ===")
print(json.dumps(may_tours, ensure_ascii=False, indent=2))
