"""Match tour CSV photo hints to actual photo filenames and build public URLs.

Reads a CSV where columns Foto 1..Foto N contain human-written hints like
"Набережная Геленджика", finds the best-matching file inside a photos folder
(supports jpg/jpeg/png/webp/avif) and writes a new CSV where hints are
replaced with public URLs of the form
    <BASE_URL>/<PREFIX>/<urlencoded_original_filename>

The default base/prefix match the Yandex Object Storage bucket used by the
MAX bot in c:/code/bot_yndex, so running the accompanying upload script
makes these URLs live.

Usage (PowerShell, one line):
  python scripts/match_tour_photos.py \
    --photos-dir "C:/Users/pavel/Downloads/фото КраскиТревел/фото КраскиТревел" \
    --input-csv  "docs/tours-for-google-sheets - tours-for-google-sheets.csv" \
    --output-csv "docs/tours-for-google-sheets - tours-with-photos.csv" \
    --report     "docs/tours-photos-unmatched.tsv"
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

# Short function words that should not count as "content" tokens when
# measuring semantic overlap between a hint and a filename.
STOPWORDS: frozenset[str] = frozenset(
    {
        "и", "или", "в", "во", "на", "над", "под", "по", "о", "об", "обо",
        "с", "со", "у", "к", "ко", "из", "за", "для", "до", "от", "без",
        "через", "между", "при", "про", "а", "но", "да", "же", "ли", "бы",
        "то", "как", "что", "чем", "где", "когда", "если",
        "дня", "дней", "день", "год", "лет", "часов", "час",
    }
)

# Small prefer-map: hint -> filename (without ext) that a fuzzy score would
# otherwise miss or tie. Extend as you spot bad matches in the report.
PREFERRED_MATCHES: dict[str, str] = {
    "краснодарский край": "Горы Колдун",
    "приэльбрусье": "Приэльбрусье",
    "адыгея": "Адыгея",
    "абхазия": "Гагра",
    "грузия": "Военно-Грузинская дорога — Тбилиси",
    "армения": "Хор Вирап — Арарат на ладони",
    "калмыкия": "Калмыкия",
    "беларусь": "Мирский замок — ЮНЕСКО",
    "белоруссия": "Мирский замок — ЮНЕСКО",
    "дагестан": "Сулакский каньон на катере",
    "горный дагестан": "Сулакский каньон на катере",
    "чечня": "Мечеть «Сердце Чечни»",
    "горная чечня": "Аргунское ущелье",
    "стамбул": "Стамбул",
    "казань": "Казанский Кремль — ЮНЕСКО, мечеть Кул-Шариф",
    "кавминводы": "Нарзанная галерея",
    "санкт-петербург": "Исаакиевский собор",
    "северная осетия": "Цейское ущелье",
    "кахетия": "Кахетия",
    "мрия": "Mriya Resort",
    "узбекистан": "Площадь Регистан в Самарканде",
    "москва": "Парк Горького",
    "полоцк": "Спасо-Евфросиниевский",
    "витебск": "Музей Марка Шагала в Витебске",
    "керчь": "Гора Митридат",
    "балтийск": "Цитадель Пиллау",
    "севастополь": "Графская пристань памятник",
    "волгоград": "Мамаев курган и Родина-мать",
    "родина-мать зовет": "Мамаев курган и Родина-мать",
    "сталинградская битва": "Панорама Сталинградской битвы",
    "кёнигсбергу-калининграду": "Кафедральный собор",
    "кенигсбергу калининграду": "Кафедральный собор",
    "ласточкино гнездо на скале": "Ласточкино гнездо с панорамой моря",
    "ласточкино гнездо": "Ласточкино гнездо с панорамой моря",
    "ласточкины гнезда": "Смотровые Супсеха — Ласточкины Гнёзда",
    "ласточкины гнёзда": "Смотровые Супсеха — Ласточкины Гнёзда",
    "супсех 800 ступеней кипарисовое озеро": "800 ступеней и «край Земли» в Супсехе",
    "800 ступеней и ласточкины гнезда": "800 ступеней и «край Земли» в Супсехе",
    "кипарисовое озеро": "Кипарисовое озеро Сукко",
    "парк краснодар": "Парк Галицкого",
    "парк галицкого": "Парк Галицкого",
    "парк облаков": "парк облаков",
    "никитский сад": "Гурзуф — Никитский сад",
    "никитский сад ласточкино гнездо": "Гурзуф — Никитский сад",
    "новоафонский водопад": "Новоафонская пещера",
    "новый афон": "новый афон",
    "новый свет": "Тропа Голицына",
    "тропа крыма": "Тропа Голицына",
    "кармадонские ворота": "Кармадонское ущелье",
    "кармадон город мертвых": "Город мёртвых в Даргавсе",
    "город мертвых": "Город мёртвых в Даргавсе",
    "горы джан": "Джан-Кутаран",
    "гора джан": "Джан-Кутаран",
    "свято-успенский": "Успенский монастырь",
    "свято успенский": "Успенский монастырь",
    "мангуп-кале бахчисарай": "Пещерный город Мангуп-Кале",
    "мыс опук керчь": "Опукский заповедник — Кояшское озеро",
    "опук": "Опукский заповедник — Кояшское озеро",
    "два озера": "Два моря — Азовское и Чёрное",
    "гуамка": "Гуамское ущелье",
    "гоор": "Гамсутль",
    "старый гоор": "Гамсутль",
    "салтинская теснина карадахская теснина": "Салтинский подземный водопад",
    "салтинская теснина": "Салтинский подземный водопад",
    "село хунзах": "Хунзахское плато",
    "матласский водопад": "Плато Матлас",
    "нарын-кала": "Древний Дербент",
    "нарын кала": "Древний Дербент",
    "цитадель нарын": "Древний Дербент",
    "река сулак": "Сулакский каньон на катере",
    "катер по каньону": "Сулакский каньон на катере",
    "белого солнца пустыни": "Бархан Сарыкум",
    "нохъо": "Сулакский каньон на катере",
    "лунь": "Сулакский каньон на катере",
    "голубая бухта": "Водопады Жане, Голубая бездна",
    "сосна": "Орлиная полка",
    "чертова мельница": "Чинарёв водопад в ущелье",
    "чертовой мельнице": "Чинарёв водопад в ущелье",
    "чёртова мельница": "Чинарёв водопад в ущелье",
    "чёртовой мельнице": "Чинарёв водопад в ущелье",
    "девичья коса": "Водопады Девичьи",
    "термы": "Термальные источники",
    "мамедова купель": "Долина Аше — Мамедово ущелье",
    "целитель": "Термальные источники",
    "витязево": "Вокруг Анапы",
    "гора лысая": "Панорама от Анапы до Новороссийска",
    "аладдине": "Площадь Регистан в Самарканде",
    "таш-хаули": "Ичан-Кала в Хиве",
    "таш хаули": "Ичан-Кала в Хиве",
    "магоки-аттор": "Лаби-Хауз",
    "магоки аттор": "Лаби-Хауз",
    "прилет в ташкент": "Базары Великого Шёлкового пути",
    "вылет из самарканда": "Базар Самарканда",
    "ликурия": "Долина Лефкадия",
    "лефкадия": "Долина Лефкадия",
    "лефкадия старый парк": "Долина Лефкадия",
    "озеро краснодарского": "Парк Галицкого",
    "краснодар лефкадия": "Парк Галицкого",
    "прогулка по тамани": "Тамань — Атамань",
    "краснодар горячий ключ": "Горячий Ключ + Парк Галицкого",
    "отель в старом городе": "Крепость Нарикала",
    "тбилиси с гидом": "Проспект Руставелли",
    "тбилиси с лицензированным гидом": "Проспект Руставелли",
    "вернисаж гарни": "Храм Гарни",
    "ереван джвари": "Монастырь Джвари",
    "языческий храм": "Храм Гарни",
    "пещера птиц": "Пещера Арени",
    "лучшая весна в грузии": "Военно-Грузинская дорога — Тбилиси",
    "фотограф в подарок": "",
    "шесть чувств": "Mriya Resort",
    "экскурсия": "",
    "малая группа": "",
    "малая группа 8 18 человек": "",
    "бесплатно": "",
    "кочующие монументы": "",
    "история города через судьбы людей": "",
    "всесвятское кладбище": "Старейшее кладбище Краснодара с 1830 года",
    "склепы xix века": "Старейшее кладбище Краснодара с 1830 года",
    "казачья история краснодара": "Кубанскому казачеству",
    "исторический краснодар": "Памятник Екатерине II",
    "голубой флаг": "Зеленоградск",
    "королевы луизы": "Зеленоградск",
    "оружейная": "Королевский замок",
    "дорога краснодар минск": "Мирский замок — ЮНЕСКО",
    "дорога домой": "",
    "мужество": "Беловежская пуща — Брестская крепость",
    "витебск славянский базар": "Музей Марка Шагала в Витебске",
    "славянского базара": "Музей Марка Шагала в Витебске",
    "карета": "Несвижский дворец Радзивиллов",
    "войт": "Несвижский дворец Радзивиллов",
    "проспект скорины": "Проспект Независимости",
    "улица суворова": "Гродно — 900 лет истории",
    "музей витебского": "Музей Марка Шагала в Витебске",
    "чачба шервашидзе": "Гагрипш",
    "казачья пасха с обрядами": "Тамань — Атамань",
    "тессирированный сад": "Парк Галицкого",
    "террасированный сад": "Парк Галицкого",
    "история создания от галицкого": "Парк Галицкого",
    "кордон кавказского": "Гузерипль — Лаго-Наки",
    "сибирь": "Лаго-Наки",
    "мишоко с конными прогулками": "Конная прогулка в ущелье Мишоко",
    "замок александра": "Дворцы ЮБК или Ай-Петри",
    "дворец александра": "Дворцы ЮБК или Ай-Петри",
    "ай-тодор": "Ласточкино гнездо с панорамой моря",
    "ай тодор": "Ласточкино гнездо с панорамой моря",
    "оборона севастополя": "Михайловская батарея",
    "абрау новороссийск": "Абрау-Дюрсо",
    "вечер на озере абрау": "Закат в Абрау-Дюрсо",
    "новоафонская пещера": "Новоафонская пещера",
    "скала ласточкины": "Ласточкино гнездо с панорамой моря",
    "храм всех": "Мечеть «Сердце Чечни»",
    "площадь павших": "Панорама Сталинградской битвы",
    "каменная чаша": "Карадахская теснина — «Ворота чудес»",
    # ---- Meta/noise hints (auto-skip) ----
    "прилет": "",
    "прилёт": "",
    "прилет расселение первая прогулка": "",
    "прилёт расселение первая прогулка": "",
    "воздвиженка": "",
    "валаам на метеоре 5 дней": "Остров Кижи",
    "вылет": "",
    "заезд": "",
    "окончание": "",
    "финал": "",
    "старт": "",
    "спуск": "",
    "важно": "",
    "продолжительность": "",
    "рекомендация": "",
    "компактный формат на выходные": "",
    "длинные июньские выходные": "",
    "формат выходного дня": "",
    "полное питание завтраки обеды ужины": "",
    "малая группа до 16 человек": "",
    "малая группа до 14 человек": "",
    "сопровождающий 24 7": "",
    "лицензированный турецкий гид 2 дня": "",
    "прощание с родиной": "",
    "концерт струнного квартета": "",
    "гостиница с аквапарком": "",
    "квест загадай желание": "",
    "шедевры": "",
    "дегустации на каждой локации": "",
    "эстетика": "",
    "магия старинных кварталов": "",
    "сенная": "",
    "садовая": "",
    "адмиралтейская": "",
    "комете": "",
    "эскарго": "",
    "лазоревый цветок": "",
    "загадки манычской долины": "",
    "2 региона за 1 поездку": "",
    "чечня и северная осетия за": "",
    "все 8 городов золотого кольца": "",
    "всех скорбящих радость": "",
    "кулинарное путешествие": "",
    "легенды": "",
    "якын дуслар": "",
    "бахетле": "",
    "летний сад таврический сад михайловский сад": "",
    "лужники": "",
    "федерация": "",
    "эволюция": "",
    "неизвестная": "",
    "утро в сосновом лесу": "",
    "утро стрелецкой казни": "",
    "явление христа народу": "",
    "третьяковка вднх": "",
    "москва сити 89 этаж": "",
    "зарядье": "",
    "восток": "",
    "вднх": "",
    "библиотека ленинка": "",
    "ленинки": "",
    "пречистенье": "",
    "российская государственная библиотека": "",
    "библиотека алвара аалто": "",
    "библиотека аалто крендель": "",
    "нарцисс": "",
    "виктория": "",
    "ласточке": "",
    "ласточек": "",
    "крендель и ко": "",
    "северные острова дельты невы": "",
    "финляндия в миниатюре": "",
    "а зори здесь тихие": "",
    "бриллиантовая кладовая эрмитажа": "",
    "чижику пыжику": "",
    "чижику-пыжику": "",
    "vr экскурсия": "",
    "vr-экскурсия": "",
    "ораниенбаум": "",
    "лахта центр кронштадт": "",
    "лахта-центр кронштадт": "",
    "лахта центр метро": "",
    "лахта-центр метро": "",
    "петербургские истории с выборгом": "",
    "артмуза": "",
    "питерлэнд": "",
    "чертово": "",
    "чёртово": "",
    "волжско камский": "",
    "волжско-камский": "",
    "цветаева": "",
    "цветущая боратынка": "",
    "коломенское восьмое чудо света": "",
    "самсон": "Фонтаны Петергофа",
    "шесть чувств": "Mriya Resort",
    "даме с собачкой": "Ялта",
    "эспаньола": "Ялта",
    "сочи": "Олимпийский парк",
    "элиста": "Фестиваль тюльпанов в Элисте",
    "несвижа": "Несвижский дворец Радзивиллов",
    "вольеры": "Беловежская пуща",
    "к зубрам замкам": "Беловежская пуща",
    "зубры в беловежской пуще": "Беловежская пуща",
    "залесье сморгонь": "Гервяты — «белорусский Нотр-Дам»",
    "сморгонь": "Гервяты — «белорусский Нотр-Дам»",
    "прибытие витебск": "Музей Марка Шагала в Витебске",
    "все лучшее за 10 дней": "Мирский замок — ЮНЕСКО",
    "всё лучшее за 10 дней": "Мирский замок — ЮНЕСКО",
    "новогрудок": "Королевский Гродно",
    "каменска шахтинского": "Парк Лога",
    "каменска-шахтинского": "Парк Лога",
    "мини зоопарк": "Парк Лога",
    "мини-зоопарк": "Парк Лога",
    "ростовская область": "Парк Лога",
    "кавминводы 5 курортных городов": "Нарзанная галерея",
    "5 курортных городов": "Нарзанная галерея",
    "5 городов кавминвод": "Нарзанная галерея",
    "крупнейший буддийский храм европы": "Новый Хурул",
    "тюльпановые степи весна": "Фестиваль тюльпанов в Элисте",
    "тюльпанные поля опукского заповедника": "Опукский заповедник — Кояшское озеро",
    "иван васильевич меняет профессию": "Александровский кремль",
    "слова о полку игореве": "Спасо-Преображенский",
    "слово о полку игореве": "Спасо-Преображенский",
    "владимир боголюбово": "Церковь Покрова на Нерли",
    "сказание о земле свияжской": "Свияжск XVII века",
    "один день из жизни казани": "Казанский Кремль — ЮНЕСКО, мечеть Кул-Шариф",
    "поэма об университете": "Казанский Кремль — ЮНЕСКО, мечеть Кул-Шариф",
    "мыловарение по рецептам шуи": "Колокольня 106 м в Шуе",
    "шуя палех": "Мастер-класс по палехской росписи",
    "ярославль столица золотого кольца": "Спасо-Преображенский",
    "летний петербург 6 дней": "Белые ночи Петербурга",
    "новая география москвы": "Парк Горького",
    "покажите нам москву": "Парк Горького",
    "ночная экскурсия": "Разводные мосты Петербурга",
    "петергоф с работающими фонтанами": "Фонтаны Петергофа",
    "петровский петербург": "Петропавловская крепость",
    "портрет великого города": "Исаакиевский собор",
    "отель у голубой мечети": "Мечеть Сулеймание",
    "великолепный век": "Дворец Топкапы с гаремом",
    "тюльпаны мыса опук кояшское озеро": "Опукский заповедник — Кояшское озеро",
    "самая красивая дорога": "Джилы-Су",
    "теплоход по каналам петергоф": "Фонтаны Петергофа",
    "возвращение домой": "",
    "северная венеция": "Разводные мосты Петербурга",
    "классический петербург": "Исаакиевский собор",
    "блистательный петербург": "Белые ночи Петербурга",
    "зимний петербург": "Белые ночи Петербурга",
    "петроградская сторона": "Петропавловская крепость",
    "эрмитаж без летних очередей": "Эрмитаж и Петергоф",
    "смотровая площадка лахта центра 462 м": "",
    "смотровая площадка лахта-центра 462 м": "",
    "петербургское метро": "",
    "гостиный двор": "Невский проспект",
    "озерки": "",
    "гатчина": "",
    "спас на крови": "",
    "спас-на-крови": "",
    "храм спас на крови": "",
    "гранд макет россия": "",
    "музей железных дорог": "",
    "парта пушкина в лицее": "",
    "рыцарский зал": "",
    "севкабель порт": "",
    "стрельна": "",
    "элабуга шишкин": "",
    "елабуга шишкин": "",
    "болгар белая мечеть": "",
    "ак мэчет": "",
    "памятного знака": "",
    "храм всех религий": "",
    "гостеприимный дом бая": "",
    "остров град свияжск": "Свияжск XVII века",
    "остров-град свияжск": "Свияжск XVII века",
    "гордость мусульман": "Мечеть «Сердце Чечни»",
    "кордон кавказского": "Гузерипль — Лаго-Наки",
    "катер по каньону": "Сулакский каньон на катере",
    "самая красивая дорога россии": "Джилы-Су",
    "тессирированный сад": "Парк Галицкого",
    "террасированный сад": "Парк Галицкого",
    "вечер на черном море": "Тешебские водопады",
    "вечер на чёрном море": "Тешебские водопады",
    "домашнюю": "Термальные источники",
}


def normalize(text: str) -> str:
    """Lowercase, fold ё→е, strip punctuation, collapse whitespace."""
    t = text.lower().replace("ё", "е")
    t = re.sub(r"[^\w\s]", " ", t, flags=re.UNICODE)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def is_semantic_name(stem: str) -> bool:
    """Filter out UUID-like or purely numeric filenames (e.g. random cache names)."""
    if re.fullmatch(r"\d+", stem):
        return False
    if re.fullmatch(r"[a-zA-Z0-9_\-]{10,}", stem):
        return False
    return True


def gather_photos(photos_dir: Path) -> list[tuple[str, str]]:
    """Return [(original_filename, normalized_stem)] for every usable photo."""
    result: list[tuple[str, str]] = []
    for entry in sorted(photos_dir.iterdir()):
        if not entry.is_file():
            continue
        if entry.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        if not is_semantic_name(entry.stem):
            continue
        norm = normalize(entry.stem)
        if norm:
            result.append((entry.name, norm))
    return result


def content_tokens(text: str) -> set[str]:
    """Return meaningful tokens (>=3 chars, no stopwords) from normalized text."""
    return {t for t in text.split() if len(t) >= 3 and t not in STOPWORDS}


def score(a: str, b: str) -> float:
    """Score photo-name 'b' against hint 'a' (both already normalized)."""
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    a_content = content_tokens(a)
    b_content = content_tokens(b)

    if a in b or b in a:
        ratio = min(len(a), len(b)) / max(len(a), len(b))
        return 0.88 + 0.12 * ratio

    # Coverage: what fraction of hint's content tokens appear in the filename.
    # This catches cases like "Ласточкино гнездо на скале" vs
    # "Ласточкино гнездо с панорамой моря" where both share the decisive tokens.
    if a_content and b_content:
        coverage = len(a_content & b_content) / len(a_content)
        jaccard = len(a_content & b_content) / len(a_content | b_content)
    else:
        coverage = 0.0
        jaccard = 0.0

    seq = SequenceMatcher(None, a, b).ratio()

    # Perfect content coverage (all hint tokens found) is a very strong signal.
    if coverage >= 1.0 and len(a_content) >= 1:
        return max(0.82 + 0.1 * jaccard, seq)
    if coverage >= 0.5:
        return max(0.7 + 0.2 * coverage, seq, jaccard * 0.95)
    return max(seq, jaccard * 0.95)


_PREFERRED_EMPTY = object()


def _scan(hint_norm: str, photos: list[tuple[str, str]]) -> tuple[str | None, float]:
    best: str | None = None
    best_score = 0.0
    for name, norm in photos:
        s = score(hint_norm, norm)
        if s > best_score:
            best_score = s
            best = name
    return best, best_score


def find_best_match(
    hint: str,
    photos: list[tuple[str, str]],
    threshold: float,
    tour_tokens: set[str] | None = None,
    context_threshold: float = 0.45,
) -> tuple[str | None, float]:
    """Find best photo for a hint, optionally using tour itinerary context.

    1. Direct fuzzy match against all photos. If it clears `threshold`, return.
    2. Otherwise, if we have the tour's content tokens, restrict the candidate
       pool to photos whose filename tokens intersect those tour tokens and
       retry with a lower `context_threshold`. This rescues short/ambiguous
       hints ("Санкт-Петербург", "Самсон", "Керчь", ...).
    """
    hint_norm = normalize(hint)
    if not hint_norm:
        return None, 0.0

    if hint_norm in PREFERRED_MATCHES:
        preferred = PREFERRED_MATCHES[hint_norm]
        if preferred == "":
            return _PREFERRED_EMPTY, 1.0  # type: ignore[return-value]
        preferred_norm = normalize(preferred)
        for name, norm in photos:
            if norm == preferred_norm:
                return name, 1.0

    best, best_score = _scan(hint_norm, photos)
    if best and best_score >= threshold:
        return best, best_score

    if tour_tokens:
        filtered = [
            (name, norm)
            for name, norm in photos
            if content_tokens(norm) & tour_tokens
        ]
        if filtered:
            ctx_best, ctx_score = _scan(hint_norm, filtered)
            if ctx_best and ctx_score >= context_threshold:
                return ctx_best, ctx_score

    return None, best_score


def load_tour_contexts(tours_json: Path) -> dict[str, set[str]]:
    """Return {slug -> set of content tokens} built from title, descriptions
    and itinerary days. Helps disambiguate short hints."""
    try:
        raw = json.loads(tours_json.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover
        print(f"WARN: could not read {tours_json}: {exc}", file=sys.stderr)
        return {}

    result: dict[str, set[str]] = {}
    iterable = raw if isinstance(raw, list) else raw.get("tours", [])
    for tour in iterable:
        if not isinstance(tour, dict):
            continue
        slug = tour.get("slug")
        if not slug:
            continue
        parts: list[str] = [
            tour.get("title", "") or "",
            tour.get("shortDescription", "") or "",
            tour.get("fullDescription", "") or "",
            tour.get("region", "") or "",
            tour.get("destination", "") or "",
        ]
        parts.extend(tour.get("destinations", []) or [])
        parts.extend(tour.get("highlights", []) or [])
        for day in tour.get("itinerary", []) or []:
            if isinstance(day, dict):
                parts.append(day.get("title", "") or "")
                parts.append(day.get("description", "") or "")
        tokens = content_tokens(normalize(" ".join(parts)))
        result[slug] = tokens
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos-dir", required=True)
    parser.add_argument("--input-csv", required=True)
    parser.add_argument("--output-csv", required=True)
    parser.add_argument(
        "--tours-json",
        default="data/tours.json",
        help="Path to tours.json used as itinerary context for matching",
    )
    parser.add_argument(
        "--base-url",
        default="https://storage.yandexcloud.net/kraskideti",
        help="Public S3 endpoint + bucket (no trailing slash)",
    )
    parser.add_argument(
        "--prefix",
        default="tours",
        help="Key prefix inside the bucket (default: tours/)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.72,
        help="Minimum fuzzy score to accept a match (0..1). Lower = more aggressive.",
    )
    parser.add_argument(
        "--context-threshold",
        type=float,
        default=0.45,
        help="Minimum score when restricting to photos mentioned in the tour itinerary.",
    )
    parser.add_argument(
        "--report",
        default=None,
        help="Optional TSV path for unmatched hints (for manual review)",
    )
    parser.add_argument(
        "--keep-unmatched-text",
        action="store_true",
        help="If set, unmatched hints stay in the cell instead of being cleared.",
    )
    args = parser.parse_args()

    photos_dir = Path(args.photos_dir)
    if not photos_dir.is_dir():
        print(f"ERROR: photos dir not found: {photos_dir}", file=sys.stderr)
        return 2

    photos = gather_photos(photos_dir)
    if not photos:
        print(f"ERROR: no images found in {photos_dir}", file=sys.stderr)
        return 2
    print(f"Loaded {len(photos)} photos from {photos_dir}")

    tours_json_path = Path(args.tours_json)
    slug_to_tokens = load_tour_contexts(tours_json_path) if tours_json_path.exists() else {}
    if slug_to_tokens:
        print(f"Loaded itinerary context for {len(slug_to_tokens)} tours from {tours_json_path}")
    else:
        print(f"WARN: no tour contexts loaded (path={tours_json_path})")

    base_url = args.base_url.rstrip("/")
    prefix = args.prefix.strip("/")

    def to_url(filename: str) -> str:
        return f"{base_url}/{prefix}/{quote(filename)}"

    input_csv = Path(args.input_csv)
    output_csv = Path(args.output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    with input_csv.open("r", encoding="utf-8-sig", newline="") as fin:
        reader = csv.reader(fin)
        header = next(reader)
        rows = list(reader)

    foto_cols = [i for i, c in enumerate(header) if c.strip().lower().startswith("foto ")]
    if not foto_cols:
        print("ERROR: could not find any 'Foto N' column in header", file=sys.stderr)
        return 2
    slug_col = next(
        (i for i, c in enumerate(header) if c.strip().lower() == "slug"),
        None,
    )
    print(f"Found {len(foto_cols)} photo columns (indexes {foto_cols[0]}..{foto_cols[-1]})")
    if slug_col is not None:
        print(f"Slug column index: {slug_col}")

    total_hints = 0
    matched = 0
    used_files: set[str] = set()
    unmatched: list[tuple[str, str, str, float]] = []  # (kod, tour, hint, best_score)

    for row in rows:
        if not row:
            continue
        while len(row) < len(header):
            row.append("")

        kod = row[1].strip() if len(row) > 1 else ""
        tour = row[2].strip() if len(row) > 2 else ""
        slug = row[slug_col].strip() if slug_col is not None and slug_col < len(row) else ""
        tour_tokens = slug_to_tokens.get(slug) if slug else None

        for idx in foto_cols:
            hint = row[idx].strip()
            if not hint:
                continue
            total_hints += 1
            filename, s = find_best_match(
                hint,
                photos,
                args.threshold,
                tour_tokens=tour_tokens,
                context_threshold=args.context_threshold,
            )
            if filename is _PREFERRED_EMPTY:
                row[idx] = ""
                continue
            if filename:
                row[idx] = to_url(filename)
                matched += 1
                used_files.add(filename)
            else:
                unmatched.append((kod, tour, hint, round(s, 3)))
                if not args.keep_unmatched_text:
                    row[idx] = ""

    with output_csv.open("w", encoding="utf-8-sig", newline="") as fout:
        writer = csv.writer(fout)
        writer.writerow(header)
        writer.writerows(rows)

    pct = matched / total_hints * 100 if total_hints else 0.0
    print(f"Hints total:    {total_hints}")
    print(f"Matched:        {matched} ({pct:.1f}%)")
    print(f"Unmatched:      {len(unmatched)}")
    print(f"Unique photos used: {len(used_files)} / {len(photos)}")
    print(f"Output CSV:     {output_csv}")

    if args.report:
        report_path = Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with report_path.open("w", encoding="utf-8") as rep:
            rep.write("Kod\tTour\tHint\tBestScore\n")
            for kod, tour, hint, s in unmatched:
                rep.write(f"{kod}\t{tour}\t{hint}\t{s}\n")
        print(f"Unmatched report: {report_path}")

    unused = sorted({name for name, _ in photos} - used_files)
    if unused:
        print(f"Photos never used ({len(unused)}): first 10 -> {unused[:10]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
