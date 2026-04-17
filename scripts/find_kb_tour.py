import urllib.request, ssl, re
ssl._create_default_https_context = ssl._create_unverified_context
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# Check Ingushetiya page (might list KB tours too)
for url in [
    'https://bogema.ru/tours/ingushetiya',
]:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8')
    links = re.findall(r'href="(/tours/\d+-[^"]+)"', body)
    links = list(dict.fromkeys(links))
    print(f"=== {url} ===")
    for l in links:
        print(f"  {l}")

# Brute-force search for the tour URL by trying different IDs
slug = 'ot-ushchelij-do-elbrusa-puteshestvie-po-kabardino-balkarii'
print(f"\n=== Trying URL with slug: {slug} ===")

found = False
for id_try in list(range(47090, 47120)) + list(range(45750, 45760)) + list(range(47300, 47450)):
    test_url = f"https://bogema.ru/tours/{id_try}-{slug}"
    req = urllib.request.Request(test_url, headers=headers, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                print(f"FOUND: {test_url}")
                found = True
                break
    except urllib.error.HTTPError:
        pass
    except Exception:
        pass

if not found:
    # Try alternative slug forms
    alt_slugs = [
        'ot-ushchelij-do-elbrusa-puteshestvie-po-kabardino-balkarii',
        'ot-uschelij-do-elbrusa-puteshestvie-po-kabardino-balkarii',
        'ot-ushchelij-do-elbrusa',
    ]
    for s in alt_slugs:
        for id_try in range(46800, 47500):
            test_url = f"https://bogema.ru/tours/{id_try}-{s}"
            req = urllib.request.Request(test_url, headers=headers, method='HEAD')
            try:
                with urllib.request.urlopen(req, timeout=3) as resp:
                    if resp.status == 200:
                        print(f"FOUND: {test_url}")
                        found = True
                        break
            except:
                pass
        if found:
            break
    if not found:
        print("Not found. Will try fetching all tours page.")
        req = urllib.request.Request("https://bogema.ru/tours", headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
        links = re.findall(r'href="(/tours/\d+-[^"]+)"', body)
        links = list(dict.fromkeys(links))
        for l in links:
            if 'elbrus' in l.lower() or 'kabard' in l.lower() or 'ushchel' in l.lower():
                print(f"  Possible match: {l}")
