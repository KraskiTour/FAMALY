"""Build a proper structured JSON source of truth for tours."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List

try:
    import json5  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise SystemExit("json5 is required. Install it with: py -m pip install json5") from exc


ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "data" / "tours.json"


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


def parse_export_array(code: str, export_name: str, remove_spreads: bool = False) -> List[dict]:
    raw = find_array_block(code, export_name)
    if not raw:
        return []
    cleaned = raw
    if remove_spreads:
        cleaned = re.sub(r"^\s*\.\.\.[A-Za-z0-9_]+\s*,?\s*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\s+as\s+const\b", "", cleaned)
    data = json5.loads(cleaned)
    if not isinstance(data, list):
        return []
    return data


def dedupe_by_slug(rows: List[dict]) -> List[dict]:
    seen: Dict[str, dict] = {}
    order: List[str] = []
    for row in rows:
        slug = row.get("slug")
        title = row.get("title")
        if not slug or not title:
            continue
        if slug not in seen:
            seen[slug] = row
            order.append(slug)
    return [seen[s] for s in order]


def main() -> None:
    mock_code = (ROOT / "data" / "mock-tours.ts").read_text(encoding="utf-8")
    amra_code = (ROOT / "data" / "amra-tours.ts").read_text(encoding="utf-8")
    golden_code = (ROOT / "data" / "golden-ring-tours.ts").read_text(encoding="utf-8")
    bogema_code = (ROOT / "data" / "bogema-tours.ts").read_text(encoding="utf-8")
    bogema_batch2_code = (ROOT / "data" / "bogema-tours-batch2.ts").read_text(encoding="utf-8")

    tours: List[dict] = []
    tours.extend(parse_export_array(mock_code, "tours", remove_spreads=True))
    tours.extend(parse_export_array(amra_code, "amraTours"))
    tours.extend(parse_export_array(golden_code, "goldenRingTours"))
    tours.extend(parse_export_array(bogema_code, "bogemaTours"))
    tours.extend(parse_export_array(bogema_batch2_code, "bogemaToursBatch2"))

    unique_tours = dedupe_by_slug(tours)
    OUT_FILE.write_text(json.dumps(unique_tours, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Built {len(unique_tours)} tours -> {OUT_FILE}")


if __name__ == "__main__":
    main()

