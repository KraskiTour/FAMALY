"""
Export all site content to a single Excel workbook.

Sheets:
- tours
- cities
- destinations
- reviews
- faqs
- company
- contacts
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Optional

try:
    from openpyxl import Workbook
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "openpyxl is required. Install it with: py -m pip install openpyxl"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "mock-tours.ts"
AMRA_FILE = ROOT / "data" / "amra-tours.ts"
GOLDEN_RING_FILE = ROOT / "data" / "golden-ring-tours.ts"
BOGEMA_FILE = ROOT / "data" / "bogema-tours.ts"
BOGEMA_BATCH2_FILE = ROOT / "data" / "bogema-tours-batch2.ts"
CONFIG_FILE = ROOT / "lib" / "config.ts"
OUTPUT_FILE = ROOT / "docs" / "site-content-export.xlsx"
FALLBACK_OUTPUT_FILE = ROOT / "docs" / "site-content-export-latest.xlsx"


def find_array_block(code: str, export_name: str) -> str:
    marker = f"export const {export_name}"
    start = code.find(marker)
    if start == -1:
        return ""

    equal_pos = code.find("=", start)
    if equal_pos == -1:
        return ""

    arr_start = code.find("[", equal_pos)
    if arr_start == -1:
        return ""

    depth = 0
    in_string = False
    quote = ""
    escape = False
    for i in range(arr_start, len(code)):
        ch = code[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_string = False
            continue

        if ch in ("'", '"'):
            in_string = True
            quote = ch
            continue

        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return code[arr_start : i + 1]
    return ""


def split_objects(array_text: str) -> List[str]:
    if not array_text.startswith("["):
        return []

    body = array_text[1:-1]
    objects: List[str] = []
    depth_curly = 0
    in_string = False
    quote = ""
    escape = False
    start: Optional[int] = None

    for i, ch in enumerate(body):
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_string = False
            continue

        if ch in ("'", '"'):
            in_string = True
            quote = ch
            continue

        if ch == "{":
            if depth_curly == 0:
                start = i
            depth_curly += 1
        elif ch == "}":
            depth_curly -= 1
            if depth_curly == 0 and start is not None:
                objects.append(body[start : i + 1])
                start = None

    return objects


def extract_string(block: str, field: str) -> str:
    m = re.search(rf"{field}\s*:\s*'((?:\\.|[^'])*)'", block, re.DOTALL)
    if not m:
        return ""
    return m.group(1).replace("\\n", "\n").replace("\\'", "'")


def extract_number(block: str, field: str) -> str:
    m = re.search(rf"{field}\s*:\s*(-?\d+)", block)
    return m.group(1) if m else ""


def extract_bool(block: str, field: str) -> str:
    m = re.search(rf"{field}\s*:\s*(true|false)", block)
    return m.group(1) if m else ""


def extract_value_fragment(block: str, field: str) -> str:
    m = re.search(rf"{field}\s*:\s*", block)
    if not m:
        return ""
    i = m.end()
    if i >= len(block):
        return ""

    open_char = block[i]
    if open_char not in ("[", "{"):
        return ""
    close_char = "]" if open_char == "[" else "}"

    depth = 0
    in_string = False
    quote = ""
    escape = False
    for j in range(i, len(block)):
        ch = block[j]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_string = False
            continue

        if ch in ("'", '"'):
            in_string = True
            quote = ch
            continue

        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                return block[i : j + 1]
    return ""


def clean_multiline(text: str) -> str:
    return re.sub(r"\n\s+", "\n", text.strip())


def parse_tours_from_export(code: str, export_name: str) -> List[Dict[str, str]]:
    arr = find_array_block(code, export_name)
    rows: List[Dict[str, str]] = []
    for block in split_objects(arr):
        title = extract_string(block, "title")
        slug = extract_string(block, "slug")
        if not title or not slug:
            continue

        rows.append(
            {
                "id": extract_string(block, "id"),
                "slug": slug,
                "title": title,
                "sourceOperator": extract_string(block, "sourceOperator"),
                "sourceUrl": extract_string(block, "sourceUrl"),
                "shortDescription": extract_string(block, "shortDescription"),
                "fullDescription": extract_string(block, "fullDescription"),
                "destination": extract_string(block, "destination"),
                "region": extract_string(block, "region"),
                "durationDays": extract_number(block, "durationDays"),
                "priceFrom": extract_number(block, "priceFrom"),
                "oldPrice": extract_number(block, "oldPrice"),
                "isPublished": extract_bool(block, "isPublished"),
                "badges": clean_multiline(extract_value_fragment(block, "badges")),
                "departureCities": clean_multiline(extract_value_fragment(block, "departureCities")),
                "nextDates": clean_multiline(extract_value_fragment(block, "nextDates")),
                "included": clean_multiline(extract_value_fragment(block, "included")),
                "excluded": clean_multiline(extract_value_fragment(block, "excluded")),
                "itinerary": clean_multiline(extract_value_fragment(block, "itinerary")),
                "gallery": clean_multiline(extract_value_fragment(block, "gallery")),
                "highlights": clean_multiline(extract_value_fragment(block, "highlights")),
                "seoTitle": extract_string(block, "seoTitle"),
                "seoDescription": extract_string(block, "seoDescription"),
            }
        )
    return rows


def parse_all_tours(data_code: str, amra_code: str, golden_code: str, bogema_code: str, bogema_batch2_code: str) -> List[Dict[str, str]]:
    all_rows: List[Dict[str, str]] = []
    all_rows.extend(parse_tours_from_export(data_code, "tours"))
    all_rows.extend(parse_tours_from_export(amra_code, "amraTours"))
    all_rows.extend(parse_tours_from_export(golden_code, "goldenRingTours"))
    all_rows.extend(parse_tours_from_export(bogema_code, "bogemaTours"))
    all_rows.extend(parse_tours_from_export(bogema_batch2_code, "bogemaToursBatch2"))

    # Keep unique tours by slug, preserving first occurrence order.
    unique: Dict[str, Dict[str, str]] = {}
    ordered_slugs: List[str] = []
    for row in all_rows:
        slug = row.get("slug", "")
        if not slug:
            continue
        if slug not in unique:
            ordered_slugs.append(slug)
            unique[slug] = row
    return [unique[s] for s in ordered_slugs]


def parse_simple_objects(code: str, export_name: str, fields: List[str]) -> List[Dict[str, str]]:
    arr = find_array_block(code, export_name)
    rows: List[Dict[str, str]] = []
    for block in split_objects(arr):
        row = {}
        for f in fields:
            row[f] = extract_string(block, f) or extract_number(block, f)
        if any(row.values()):
            rows.append(row)
    return rows


def parse_object_const(code: str, const_name: str) -> Dict[str, str]:
    marker = f"export const {const_name}"
    start = code.find(marker)
    if start == -1:
        return {}
    obj_start = code.find("{", start)
    if obj_start == -1:
        return {}

    depth = 0
    in_string = False
    quote = ""
    escape = False
    end = -1
    for i in range(obj_start, len(code)):
        ch = code[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_string = False
            continue

        if ch in ("'", '"'):
            in_string = True
            quote = ch
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        return {}

    block = code[obj_start:end]
    pairs = re.findall(r"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*('(?:\\.|[^'])*'|\d+|true|false)", block)
    out: Dict[str, str] = {}
    for key, raw in pairs:
        if raw.startswith("'"):
            out[key] = raw[1:-1].replace("\\'", "'")
        else:
            out[key] = raw
    return out


def write_sheet(wb: Workbook, name: str, rows: List[Dict[str, str]]) -> None:
    ws = wb.create_sheet(name)
    if not rows:
        ws.append(["empty"])
        return

    headers = list(rows[0].keys())
    ws.append(headers)
    for row in rows:
        ws.append([row.get(h, "") for h in headers])


def main() -> None:
    data_code = DATA_FILE.read_text(encoding="utf-8")
    amra_code = AMRA_FILE.read_text(encoding="utf-8")
    golden_code = GOLDEN_RING_FILE.read_text(encoding="utf-8")
    bogema_code = BOGEMA_FILE.read_text(encoding="utf-8")
    bogema_batch2_code = BOGEMA_BATCH2_FILE.read_text(encoding="utf-8")
    config_code = CONFIG_FILE.read_text(encoding="utf-8")

    tours = parse_all_tours(data_code, amra_code, golden_code, bogema_code, bogema_batch2_code)
    cities = parse_simple_objects(
        data_code, "cities", ["name", "slug", "region", "nameGenitive", "description"]
    )
    destinations = parse_simple_objects(
        data_code, "destinations", ["name", "slug", "region", "description", "image"]
    )
    reviews = parse_simple_objects(
        data_code, "reviews", ["id", "author", "city", "tourSlug", "rating", "text", "date"]
    )
    faqs = parse_simple_objects(
        data_code, "faqs", ["id", "question", "answer", "tourSlug"]
    )

    company = parse_object_const(config_code, "COMPANY")
    contacts = parse_object_const(config_code, "CONTACTS")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    wb.remove(wb.active)

    write_sheet(wb, "tours", tours)
    write_sheet(wb, "cities", cities)
    write_sheet(wb, "destinations", destinations)
    write_sheet(wb, "reviews", reviews)
    write_sheet(wb, "faqs", faqs)
    write_sheet(wb, "company", [company] if company else [])
    write_sheet(wb, "contacts", [contacts] if contacts else [])

    output_path = OUTPUT_FILE
    try:
        wb.save(output_path)
    except PermissionError:
        # Common on Windows when the target file is open in Excel/editor preview.
        output_path = FALLBACK_OUTPUT_FILE
        wb.save(output_path)

    stats = {
        "tours": len(tours),
        "cities": len(cities),
        "destinations": len(destinations),
        "reviews": len(reviews),
        "faqs": len(faqs),
        "output": str(output_path),
    }
    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

