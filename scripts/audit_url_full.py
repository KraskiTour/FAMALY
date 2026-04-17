import pathlib
import re
from urllib.parse import urlparse

files = [
    r'c:\COD\FAMALY\data\mock-tours.ts',
    r'c:\COD\FAMALY\data\amra-tours.ts',
    r'c:\COD\FAMALY\data\golden-ring-tours.ts',
]

generic_patterns = [
    r'product-category/',
    r'/tury-v-moskvu',
    r'/kazan$',
    r'/kazan/$',
    r'/sankt-peterburg$',
    r'/tury-po-zolotomu-kolcu',
    r'/tour-category/',
    r'/region/',
    r'/tours/belarus',
    r'/tours/$',
    r'/tours$',
]

out_lines = []

for fpath in files:
    code = pathlib.Path(fpath).read_text(encoding='utf-8')

    # Extract all tours: find blocks between { ... }
    # We'll find title, slug, sourceUrl, sourceOperator via multi-field regex
    block_re = re.compile(
        r"title:\s*['\"]([^'\"]+)['\"].*?"
        r"slug:\s*'([^']+)'.*?"
        r"sourceUrl:\s*'([^']*)'.*?"
        r"sourceOperator:\s*'([^']*)'",
        re.DOTALL
    )
    
    for m in block_re.finditer(code):
        title = m.group(1)
        slug = m.group(2)
        url = m.group(3)
        operator = m.group(4)
        
        is_generic = False
        for pat in generic_patterns:
            if re.search(pat, url):
                is_generic = True
                break
        
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.strip('/').split('/') if p]
        if len(path_parts) <= 1 and not is_generic:
            is_generic = True
        
        if is_generic:
            out_lines.append(f'{operator} | {slug} | {title} | {url}')

outpath = pathlib.Path(r'c:\COD\FAMALY\scripts\generic_urls_audit.txt')
outpath.write_text('\n'.join(out_lines), encoding='utf-8')
print(f'Found {len(out_lines)} generic URLs. Written to generic_urls_audit.txt')
