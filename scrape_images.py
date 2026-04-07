import urllib.request, re, sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pages = {
    "az-puppet-theater": "https://azbukaremesel.ru/ekskursii/ekskursiya-v-krasnodarskij-kukolnyj-teatr/",
    "az-survival-class": "https://azbukaremesel.ru/ekskursii/master-klass-vyzhivanie-v-lesu/",
    "az-bakery": "https://azbukaremesel.ru/ekskursii/ekskursiya-v-pekarnyu-s-master-klassom/",
    "az-pastila-factory": "https://azbukaremesel.ru/ekskursii/ekskursiya-na-proizvodstvo-pastily-master-klass/",
    "az-music-interactive": "https://azbukaremesel.ru/ekskursii/muzykalnaya-interaktivnaya-ekskursiya-znakomstvo-2/",
    "az-reading-club": "https://azbukaremesel.ru/ekskursii/klub-chtecov/",
    "az-railway-museum": "https://azbukaremesel.ru/ekskursii/ekskursiya-v-muzej-zheleznyh-dorog/",
    "az-pottery": "https://azbukaremesel.ru/ekskursii/ekskursiya-v-goncharnuyu-masterskuyu/",
    "az-optics-vision": "https://azbukaremesel.ru/ekskursii/ekskursiya-v-optiku-s-proverkoj-zreniya/",
    "az-customizing-clothes": "https://azbukaremesel.ru/ekskursii/master-klass-po-kastomajzingu-odezhdy/",
    "az-leather-wallet": "https://azbukaremesel.ru/ekskursii/master-klass-srednevekovyj-koshelek/",
    "az-felitsyn-theater-tour": "https://azbukaremesel.ru/ekskursii/teatralizovannaya-ekskursiya-v-muzee-felicyna-magiya-arheologii-i-restavracii/",
}

results = {}
for loc_id, url in pages.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
        content_imgs = [i for i in imgs if 'media/images' in i or 'media/original_images' in i]
        if not content_imgs:
            content_imgs = [i for i in imgs if 'azbukaremesel' in i and 'logo' not in i.lower()]
        full_urls = []
        for img in content_imgs:
            if img.startswith('/'):
                img = 'https://azbukaremesel.ru' + img
            full_urls.append(img)
        results[loc_id] = full_urls[:3]
        print(f"{loc_id}: {len(full_urls)} images found -> {full_urls[:3]}")
    except Exception as e:
        results[loc_id] = []
        print(f"{loc_id}: ERROR {e}")

with open(r'c:\COD\FAMALY\scraped_images.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\nDone!")
