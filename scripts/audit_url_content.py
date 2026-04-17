"""
Extract slug, title, sourceUrl, sourceOperator from all tour data files.
Output a TSV for manual/automated review.
"""
import pathlib
import re

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

tour_re = re.compile(
    r"slug:\s*'([^']+)'.*?"
    r"sourceUrl:\s*'([^']*)'.*?"
    r"sourceOperator:\s*'([^']*)'",
    re.DOTALL
)

title_slug_re = re.compile(
    r"title:\s*'([^']*)'.*?slug:\s*'([^']*)'",
    re.DOTALL
)

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')
    
    titles = {}
    for m in title_slug_re.finditer(code):
        titles[m.group(2)] = m.group(1)
    
    for m in tour_re.finditer(code):
        slug = m.group(1)
        url = m.group(2)
        operator = m.group(3)
        title = titles.get(slug, '???')
        
        is_generic = False
        # Check if URL is a generic catalog page (no specific tour ID/name)
        generic_patterns = [
            r'product-category/',
            r'/tury-v-moskvu$',
            r'/tury-v-moskvu/$',
            r'/kazan$',
            r'/kazan/$',
            r'/sankt-peterburg$',
            r'/tury-po-zolotomu-kolcu$',
            r'/tour-category/',
            r'/region/',
            r'/tours/belarus$',
            r'/tours/belarus/$',
        ]
        for pat in generic_patterns:
            if re.search(pat, url):
                is_generic = True
                break
        
        # Also flag if URL path has no specific tour identifier (very short path)
        from urllib.parse import urlparse
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.strip('/').split('/') if p]
        
        flag = ''
        if is_generic:
            flag = 'GENERIC_CATALOG'
        elif len(path_parts) <= 1:
            flag = 'POSSIBLY_GENERIC'
        
        if flag:
            print(f'{flag}\t{operator}\t{slug}\t{title}\t{url}')

print('\n--- Done ---')
