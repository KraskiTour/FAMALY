import json
from pathlib import Path

d = json.load(open("c:/COD/FAMALY/tours/parsed.json", encoding="utf-8"))
urls = [
  "https://amra-turistik.ru/tours/termalnye-istochniki-vodnaya-rivera-i-pitejnyj-dom-v-majkope-6/",
  "https://amra-turistik.ru/tours/velikolepie-vostochnogo-kryma-ot-zvezdopada-vospominanij-do-alchak-kaya-13/",
  "https://amra-turistik.ru/tours/vodopady-lazarevskogo-rajona-9/",
  "https://amra-turistik.ru/tours/vokrug-anapy-800-stupenej-lastochkiny-gnezda-kiparisovoe-ozero-i-vecher-v-anape/",
  "https://amra-turistik.ru/tours/tyulpany-i-maki-kryma-3/",
  "https://amra-turistik.ru/tours/estetika-i-volshebstvo-shato-andre-usadba-semigore-i-abrau-4/",
  "https://amra-turistik.ru/tours/vinodelni-azovskogo-morya-fanagoriya-shato-taman-i-progulka-po-tpmani/",
  "https://amra-turistik.ru/tours/morskoj-voyazh-golubaya-bezdna-skala-parus-gelendzhik-10/",
  "https://amra-turistik.ru/tours/tur-vostorg-shato-pino-smotrovye-staryj-park-gelendzhik-6/",
]

lines = []
for i, t in enumerate(d):
    n = i + 1
    lines.append(f"## Tour {n}")
    lines.append(f"**Source:** {urls[i]}")
    lines.append(f"**Tour name:** {t['tour_name']}")
    lines.append(f"**Adult price (schema, RUB):** {t['adult_price_rub']}")
    bi = t.get("tour_info_badges") or {}
    if bi:
        lines.append("**Tour page badges:**")
        for k, v in bi.items():
            lines.append(f"- {k}: {v}")
    dep = t["departure"]
    lines.append("**Departure (badge fields):**")
    lines.append(f"- City: {dep.get('city') or '—'}")
    lines.append(f"- Meeting point: {dep.get('meeting_point') or '—'}")
    lines.append(f"- Departure time: {dep.get('departure_time') or '—'}")
    if dep.get("program_mentions_departure"):
        lines.append("**Departure-related lines from program:**")
        lines.append(dep["program_mentions_departure"])
    lines.append("**Included:**")
    lines.append(t.get("included") or "(See full program.)")
    lines.append("**Excluded / extra:**")
    lines.append(t.get("excluded") or "(See full program.)")
    lines.append("**Full program:**")
    lines.append(t["full_program_text"])
    lines.append("**Image URLs:**")
    for u in t["image_urls"]:
        lines.append(u)
    lines.append("")
    lines.append("---")
    lines.append("")

Path("c:/COD/FAMALY/TOURS_EXTRACTED.md").write_text("\n".join(lines), encoding="utf-8")
print("ok", len(lines))
