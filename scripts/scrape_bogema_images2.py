import urllib.request, ssl, re, json

ssl._create_default_https_context = ssl._create_unverified_context
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

TOURS = [
    ('vesennij-krym', 'https://bogema.ru/tours/10203-vesennij-krym-partenit-gurzuf-yalta'),
    ('guamskoe', 'https://bogema.ru/tours/10141-guamskoe-ushchele-i-termalnye-istochniki'),
    ('lago-naki', 'https://bogema.ru/tours/47093-po-smotrovym-mestam-lago-naki-i-termalnyj-istochnik-krepost-meot-azishskaya-peshchera'),
    ('krasnodar', 'https://bogema.ru/tours/46825-tsvetushchij-krasnodar-park-galitskogo-s-garantirovannym-poseshcheniem-yaponskogo-sada'),
    ('osetiya', 'https://bogema.ru/tours/45755-severnaya-osetiya-polnoe-pogruzhenie'),
    ('chechnya', 'https://bogema.ru/tours/45752-puteshestvie-v-chechnyu-serdtse-groznogo-vysokogornoe-ozero-kazenoj-am'),
    ('kb', 'https://bogema.ru/tours/46113-ot-ushchelij-do-elbrusa-puteshestvie-po-kabardino-balkarii'),
]

for short, url in TOURS:
    print(f"\n=== {short} ===")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        page = resp.read().decode('utf-8')

    imgs = set()

    # All image patterns
    for pat in [
        r'src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"',
        r'data-src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"',
        r'srcset="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*?)[\s,"]',
        r"url\(['\"]?([^'\")\s]*\.(?:jpg|jpeg|png|webp)[^'\")\s]*)",
        r'data-slideshow-items="([^"]*)"',
        r'"image"\s*:\s*"([^"]+)"',
        r'href="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"',
    ]:
        for m in re.finditer(pat, page, re.IGNORECASE):
            src = m.group(1)
            if any(x in src.lower() for x in ['logo', 'icon', 'favicon', '.svg', 'widget', 'callback', 'okocrm', 'yandex', 'google']):
                continue
            full = src if src.startswith('http') else f'https://bogema.ru{src}'
            imgs.add(full)

    # Also look for jatoms image JSON patterns
    jatoms = re.findall(r'/images/jatoms/[^"\'>\s]+\.(?:jpg|jpeg|png|webp)', page, re.IGNORECASE)
    for j in jatoms:
        imgs.add(f'https://bogema.ru{j}')

    # Look in <script> tags for image URLs
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', page, re.DOTALL)
    for script in scripts:
        script_imgs = re.findall(r'/images/jatoms/[^"\'>\s\\]+\.(?:jpg|jpeg|png|webp)', script)
        for si in script_imgs:
            imgs.add(f'https://bogema.ru{si}')
        script_imgs2 = re.findall(r'https://bogema\.ru/images/[^"\'>\s\\]+\.(?:jpg|jpeg|png|webp)', script)
        for si2 in script_imgs2:
            imgs.add(si2)

    # Sort and show
    imgs = sorted(imgs)
    tour_imgs = [i for i in imgs if '/tours/' in i or '/jatoms/tours/' in i]
    hotel_imgs = [i for i in imgs if '/hotels/' in i]
    other_imgs = [i for i in imgs if i not in tour_imgs and i not in hotel_imgs]

    print(f"  Tour images ({len(tour_imgs)}):")
    for i in tour_imgs:
        print(f"    {i}")
    if hotel_imgs:
        print(f"  Hotel images ({len(hotel_imgs)}):")
        for i in hotel_imgs:
            print(f"    {i}")
    if other_imgs:
        print(f"  Other images ({len(other_imgs)}):")
        for i in other_imgs[:5]:
            print(f"    {i}")

    # Debug: dump page section around first image reference for empty tours
    if not tour_imgs and not hotel_imgs:
        print("  DEBUG - Looking for any image-like patterns...")
        all_img_like = re.findall(r'["\']([^"\']*(?:jpg|jpeg|png|webp)[^"\']*)["\']', page, re.IGNORECASE)
        for ail in all_img_like[:10]:
            print(f"    RAW: {ail}")
        # Also check for specific jatoms patterns
        jatoms_any = re.findall(r'jatoms[^"\'>\s]*', page[:5000])
        if jatoms_any:
            print(f"    jatoms refs: {jatoms_any[:5]}")
