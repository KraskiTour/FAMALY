"""
Scrape actual tour URLs from amra-turistik.ru catalog pages.
"""
import urllib.request
import re
import ssl
import time

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

opener = urllib.request.build_opener(
    urllib.request.ProxyHandler({}),
    urllib.request.HTTPSHandler(context=ssl_ctx)
)

all_urls = {}

pages = [
    # Russia from Krasnodar (222 tours, ~19 pages)
    *[f'https://amra-turistik.ru/product-category/russia/iz-krasnodara/page/{i}/' for i in range(1, 20)],
    # International (45 tours, ~4 pages)
    *[f'https://amra-turistik.ru/product-category/zarubezhnye-tury/page/{i}/' for i in range(1, 5)],
    # Excursions
    *[f'https://amra-turistik.ru/tour-category/ekskursiya/page/{i}/' for i in range(1, 5)],
    # All tours
    'https://amra-turistik.ru/tours/',
]

# Pattern for tour links: <a href="https://amra-turistik.ru/tours/SLUG/">
tour_link_re = re.compile(r'href="(https://amra-turistik\.ru/tours/[^"]+)"')

for page_url in pages:
    try:
        req = urllib.request.Request(page_url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = opener.open(req, timeout=15)
        html = resp.read().decode('utf-8', errors='ignore')
        
        for m in tour_link_re.finditer(html):
            url = m.group(1).rstrip('/')
            slug = url.split('/tours/')[-1].rstrip('/')
            if slug and slug not in all_urls:
                all_urls[slug] = url
        
        time.sleep(0.3)
    except Exception as e:
        pass  # Some pages may 404

# Write results
import pathlib
out = pathlib.Path(r'c:\COD\FAMALY\scripts\amra_tour_urls.txt')
lines = []
for slug, url in sorted(all_urls.items()):
    lines.append(f'{slug}\t{url}')

out.write_text('\n'.join(lines), encoding='utf-8')
print(f'Found {len(all_urls)} unique tour URLs on amra-turistik.ru')
