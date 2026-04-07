import re
from pathlib import Path
h = Path("c:/COD/FAMALY/tours/tour-1.html").read_text(encoding="utf-8")
pat = r'tours-tabs__info__item__title">([^<]+)</div>\s*<div class="tours-tabs__info__item__description">([^<]*)</div>'
for m in re.finditer(pat, h):
    print("T:", m.group(1), "| D:", m.group(2))
