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

def dep_summary(t):
    dep = t["departure"]
    bi = t.get("tour_info_badges") or {}
    parts = []
    if dep.get("city"):
        parts.append(f"Город отправления (бейдж): {dep['city']}")
    if dep.get("meeting_point"):
        parts.append(f"Место встречи (бейдж): {dep['meeting_point']}")
    if dep.get("departure_time"):
        parts.append(f"Время отправления (бейдж): {dep['departure_time']}")
    if bi:
        parts.append("Бейджи на странице: " + "; ".join(f"{k}={v}" for k, v in bi.items()))
    if dep.get("program_mentions_departure"):
        parts.append("Из текста программы:\n" + dep["program_mentions_departure"])
    return "\n".join(parts) if parts else "(см. полный текст программы)"

for i, t in enumerate(d):
    print("=" * 72)
    print(f"ТУР {i+1} | {urls[i]}")
    print("=" * 72)
    print("НАЗВАНИЕ:", t["tour_name"])
    print("ЦЕНА ВЗРОСЛОГО (schema.org offer, RUB):", t["adult_price_rub"])
    print()
    print("--- ОТПРАВЛЕНИЕ / СБОР ---")
    print(dep_summary(t))
    print()
    print("--- ВКЛЮЧЕНО (выделено со страницы, если есть блок) ---")
    print(t.get("included") or "(отдельного блока нет — см. программу)")
    print()
    print("--- НЕ ВКЛЮЧЕНО / ДОПОЛНИТЕЛЬНО ---")
    print(t.get("excluded") or "(отдельного блока нет — см. программу)")
    print()
    print("--- ПОЛНАЯ ПРОГРАММА (вкладка «О туре») ---")
    print(t["full_program_text"])
    print()
    print("--- URL ИЗОБРАЖЕНИЙ (полноразмерные, без суффиксов -WxH) ---")
    for u in t["image_urls"]:
        print(u)
    print()
