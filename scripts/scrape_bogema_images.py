import urllib.request, ssl, re, json, html

ssl._create_default_https_context = ssl._create_unverified_context
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

TOURS = [
    ('vesennij-krym-partenit-gurzuf-yalta', 'https://bogema.ru/tours/10203-vesennij-krym-partenit-gurzuf-yalta'),
    ('guamskoe-ushchele-i-termalnye-istochniki-bogema', 'https://bogema.ru/tours/10141-guamskoe-ushchele-i-termalnye-istochniki'),
    ('smotrovye-lago-naki-krepost-meot-azishskaya-peshchera', 'https://bogema.ru/tours/47093-po-smotrovym-mestam-lago-naki-i-termalnyj-istochnik-krepost-meot-azishskaya-peshchera'),
    ('tsvetushchij-krasnodar-park-galitskogo-yaponskij-sad', 'https://bogema.ru/tours/46825-tsvetushchij-krasnodar-park-galitskogo-s-garantirovannym-poseshcheniem-yaponskogo-sada'),
    ('severnaya-osetiya-polnoe-pogruzhenie', 'https://bogema.ru/tours/45755-severnaya-osetiya-polnoe-pogruzhenie'),
    ('puteshestvie-v-chechnyu-groznyj-kazenoj-am', 'https://bogema.ru/tours/45752-puteshestvie-v-chechnyu-serdtse-groznogo-vysokogornoe-ozero-kazenoj-am'),
    ('ot-ushchelij-do-elbrusa-kabardino-balkariya', 'https://bogema.ru/tours/46113-ot-ushchelij-do-elbrusa-puteshestvie-po-kabardino-balkarii'),
]

results = {}

for slug, url in TOURS:
    print(f"\n=== {slug} ===")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            page = resp.read().decode('utf-8')
    except Exception as e:
        print(f"  ERROR: {e}")
        continue

    images = []

    # 1) Look for gallery/slider images (usually in data attributes or specific containers)
    # Bogema uses UIkit sliders with <img> tags
    img_tags = re.findall(r'<img[^>]+src="([^"]+)"[^>]*>', page)
    for src in img_tags:
        if '/images/content/' in src or '/images/tours/' in src or '/images/jatoms/' in src:
            full = src if src.startswith('http') else f'https://bogema.ru{src}'
            if full not in images:
                images.append(full)

    # 2) Look for background images in style attributes
    bg_imgs = re.findall(r'background-image:\s*url\(["\']?([^"\')\s]+)["\']?\)', page)
    for src in bg_imgs:
        if '/images/' in src:
            full = src if src.startswith('http') else f'https://bogema.ru{src}'
            if full not in images:
                images.append(full)

    # 3) Look for data-src (lazy loaded)
    lazy_imgs = re.findall(r'data-src="([^"]+)"', page)
    for src in lazy_imgs:
        if '/images/' in src and not src.endswith('.svg'):
            full = src if src.startswith('http') else f'https://bogema.ru{src}'
            if full not in images:
                images.append(full)

    # 4) Look for srcset
    srcset_imgs = re.findall(r'srcset="([^"]+)"', page)
    for srcset in srcset_imgs:
        for part in srcset.split(','):
            src = part.strip().split(' ')[0]
            if '/images/' in src and not src.endswith('.svg'):
                full = src if src.startswith('http') else f'https://bogema.ru{src}'
                if full not in images:
                    images.append(full)

    # Filter out icons, logos, small UI elements
    filtered = []
    for img in images:
        lower = img.lower()
        if any(x in lower for x in ['logo', 'icon', 'favicon', 'widget', 'chat.oko', 'callback', 'sendsay']):
            continue
        if any(x in lower for x in ['.svg']):
            continue
        filtered.append(img)

    results[slug] = filtered
    print(f"  Found {len(filtered)} images:")
    for i, img in enumerate(filtered):
        print(f"    [{i+1}] {img}")

# Output as JSON for easy parsing
print("\n\n=== JSON OUTPUT ===")
print(json.dumps(results, ensure_ascii=False, indent=2))
