import re

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    content = f.read()

# Fix tour 181: replace '<div' in excluded, fix itinerary title, add gallery and images
# Find the second occurrence of '<div' (first was already fixed for tour 178)
content = content.replace(
    "      '<div',\n    ],\n    itinerary: [\n      {\n        day: 1,\n        title: 'Программа тура',\n        description: 'Отправление ранним утром",
    "      'Входные билеты в музеи и достопримечательности',\n      'Питание',\n    ],\n    itinerary: [\n      {\n        day: 1,\n        title: 'Никитский сад \\u2014 Массандровский дворец \\u2014 Ялта',\n        description: 'Отправление ранним утром",
    1
)

# Add images to tour 181 itinerary and gallery
content = content.replace(
    "images: [],\n      },\n    ],\n    gallery: [],\n    badges: ['sea', 'city', 'bus'],",
    """images: [
          'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/0403c9a8f07f4aa2b45c614f3e94b8a5.jpeg',
          'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/838c485458f94a2a8e3d2342582d075b.jpeg',
        ],
      },
    ],
    gallery: [
      'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/0403c9a8f07f4aa2b45c614f3e94b8a5.jpeg',
      'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/1de9e0817b22400d97c011fcc714e53f.jpeg',
      'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/1fbd04fdf5aa44739465adc68e2a683b.jpeg',
      'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/838c485458f94a2a8e3d2342582d075b.jpeg',
      'https://bogema.ru/images/jatoms/tours/46691-krym-parad-tyulpanov-i-tsvetenie-sakury-yalta-utjos-foros-bakhchisaraj/9239a2826eb14f128b31d670668d272f.jpeg',
    ],
    badges: ['sea', 'city', 'bus'],""",
    1
)

# Also fix the shortDescription for tour 162 that starts with "ркое" instead of "Яркое"
content = content.replace(
    "shortDescription: 'ркое путешествие",
    "shortDescription: 'Яркое путешествие"
)
content = content.replace(
    "fullDescription: 'ркое путешествие",
    "fullDescription: 'Яркое путешествие"
)

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    check = f.read()
    
# Verify no '<div' remains
divs = check.count("'<div'")
print(f"Remaining '<div' occurrences before write: {divs}")

with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Re-verify
with open(r'c:\COD\FAMALY\data\bogema-tours-batch2.ts', encoding='utf-8') as f:
    final = f.read()

divs2 = final.count("'<div'")
empty_galleries = final.count("gallery: [],")
print(f"After fix: '<div' occurrences: {divs2}, empty galleries: {empty_galleries}")
print("Done!")
