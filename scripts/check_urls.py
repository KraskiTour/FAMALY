import pathlib
import re
import urllib.request
import urllib.error
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

results = {'ok': [], 'fail': []}

for fname in ['mock-tours.ts', 'golden-ring-tours.ts', 'amra-tours.ts']:
    f = pathlib.Path(rf'c:\COD\FAMALY\data\{fname}')
    code = f.read_text(encoding='utf-8')

    id_positions = [m.start() for m in re.finditer(r'^\s{2,6}id:', code, re.MULTILINE)]

    for i, start in enumerate(id_positions):
        end = id_positions[i + 1] if i + 1 < len(id_positions) else len(code)
        block = code[start:end]

        slug_m = re.search(r"slug:\s*'([^']+)'", block)
        src_m = re.search(r"sourceUrl:\s*'([^']*)'", block)
        op_m = re.search(r"sourceOperator:\s*'([^']*)'", block)

        if not slug_m or not src_m:
            continue

        slug = slug_m.group(1)
        url = src_m.group(1)
        operator = op_m.group(1) if op_m else '?'

        try:
            req = urllib.request.Request(url, method='HEAD', headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            opener = urllib.request.build_opener(
                urllib.request.ProxyHandler({}),
                urllib.request.HTTPSHandler(context=ctx)
            )
            resp = opener.open(req, timeout=10)
            code_http = resp.getcode()
            if code_http < 400:
                print(f'OK  {code_http} | {operator:<16} | {slug}')
                results['ok'].append(slug)
            else:
                print(f'FAIL {code_http} | {operator:<16} | {slug} | {url}')
                results['fail'].append((slug, url, operator, code_http))
        except urllib.error.HTTPError as e:
            print(f'FAIL {e.code} | {operator:<16} | {slug} | {url}')
            results['fail'].append((slug, url, operator, e.code))
        except Exception as e:
            err = str(e)[:60]
            print(f'ERR  --- | {operator:<16} | {slug} | {err}')
            results['fail'].append((slug, url, operator, err))

print(f'\n=== SUMMARY ===')
print(f'OK: {len(results["ok"])}')
print(f'FAIL: {len(results["fail"])}')
if results['fail']:
    print(f'\nFailed URLs:')
    for slug, url, op, status in results['fail']:
        print(f'  {op:<16} | {slug:<55} | {status} | {url}')
