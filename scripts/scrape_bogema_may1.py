import urllib.request
import urllib.parse
import json
import re
import ssl
import html
from html.parser import HTMLParser

ssl._create_default_https_context = ssl._create_unverified_context

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
    'Referer': 'https://bogema.ru/calendar',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
}

# Step 1: Get the May calendar via AJAX
print("=== Step 1: Fetching May calendar via AJAX ===")
ajax_url = "https://bogema.ru/component/jatoms/?task=calendar.getAjaxHTML&Itemid=101"

# Try different parameter combinations
for params in [
    {'month': '5', 'year': '2026', 'direction': 'next'},
    {'month': '5', 'year': '2026'},
    {'direction': 'next'},
]:
    data = urllib.parse.urlencode(params).encode('utf-8')
    req = urllib.request.Request(ajax_url, data=data, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            if 'Май' in body or '01.05' in body or 'vesenn' in body.lower():
                print(f"  SUCCESS with params: {params}")
                print(f"  Response length: {len(body)}")
                break
            else:
                print(f"  No May data with params: {params}, response length: {len(body)}")
                if len(body) < 500:
                    print(f"  Body preview: {body[:300]}")
    except Exception as e:
        print(f"  Error with params {params}: {e}")
else:
    print("  Fallback: fetching full calendar page")
    req = urllib.request.Request("https://bogema.ru/calendar", headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,*/*',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode('utf-8')
    print(f"  Full page length: {len(body)}")

# Step 2: Extract all tour links from the calendar HTML
print("\n=== Step 2: Extracting tour links ===")
tour_links = re.findall(r'href="(/tours/[^"]+)"', body)
tour_links = list(dict.fromkeys(tour_links))  # deduplicate preserving order
print(f"  Found {len(tour_links)} unique tour links")
for link in tour_links[:20]:
    print(f"  {link}")

# Step 3: Also extract date info to match with May 1st
print("\n=== Step 3: Looking for May 1st dates ===")
may1_pattern = re.compile(r'01\.05\.2026|1\s*мая|Пт\s+01\.05', re.IGNORECASE)
rows = re.findall(r'<tr[^>]*>(.*?)</tr>', body, re.DOTALL)
may1_tours = []
for row in rows:
    if may1_pattern.search(row):
        links_in_row = re.findall(r'href="(/tours/[^"]+)"', row)
        name_match = re.search(r'<a[^>]*>([^<]+)</a>', row)
        if links_in_row:
            name = html.unescape(name_match.group(1).strip()) if name_match else "Unknown"
            url = links_in_row[0]
            may1_tours.append((name, url))
            print(f"  May 1st tour: {name} -> {url}")

if not may1_tours:
    print("  No May 1st rows found in table. Looking for any May references...")
    may_refs = [m.start() for m in re.finditer(r'[Мм]ай|05\.2026', body)]
    print(f"  Found {len(may_refs)} May references at positions: {may_refs[:10]}")
    if may_refs:
        context = body[max(0, may_refs[0]-200):may_refs[0]+500]
        print(f"  Context around first ref: ...{context[:300]}...")

# Step 4: If we found May 1st tours, fetch each one
if may1_tours:
    print(f"\n=== Step 4: Found {len(may1_tours)} May 1st tours. Fetching details... ===")
    for name, url_path in may1_tours:
        full_url = f"https://bogema.ru{url_path}"
        print(f"\n--- Tour: {name} ---")
        print(f"URL: {full_url}")
        req = urllib.request.Request(full_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/html,*/*',
        })
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                page = resp.read().decode('utf-8')
            title = re.search(r'<title>([^<]+)</title>', page)
            if title:
                print(f"  Title: {html.unescape(title.group(1).strip())}")
            print(f"  Page length: {len(page)}")
        except Exception as e:
            print(f"  Error fetching: {e}")
else:
    print("\n=== Step 4: No May 1st tours found via AJAX. Will try direct approach. ===")
    all_links = re.findall(r'href="(https?://bogema\.ru/tours/[^"]+|/tours/[^"]+)"', body)
    all_links = list(dict.fromkeys(all_links))
    print(f"  All tour links on page: {len(all_links)}")
    for l in all_links[:30]:
        print(f"    {l}")
