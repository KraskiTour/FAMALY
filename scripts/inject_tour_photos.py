"""Inject local tour photos into tours.json → tours1.json.

For every tour, the script walks through its `itinerary` days and picks the
most relevant photos from `--photos-dir` based on day title + description
(falling back to tour-level title/shortDescription/fullDescription/highlights
when a day's text is too short). Picked files are written as public URLs
matching the Yandex Object Storage layout used by scripts/upload_tour_photos.py:

    <BASE_URL>/<PREFIX>/<urlencoded_filename>

Fields updated per tour:
  • itinerary[i].images     — up to --max-per-day URLs, no repeats inside tour
  • gallery                 — all unique URLs picked across days, in order

Usage (PowerShell):
  python scripts/inject_tour_photos.py \
    --photos-dir "C:/Users/pavel/Downloads/фото КраскиТревел/фото КраскиТревел" \
    --input-json  data/tours.json \
    --output-json data/tours1.json

Notes:
  • The generated URLs become live only AFTER running
    scripts/upload_tour_photos.py (so photos actually live in the bucket).
  • Pass --mode local to instead embed relative paths like
    "photos/<filename>" (useful for testing offline).
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

# Reuse normalization / photo-gathering helpers from the CSV matcher.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from match_tour_photos import (  # type: ignore  # noqa: E402
    IMAGE_EXTENSIONS,
    content_tokens,
    gather_photos,
    normalize,
)

# Phrases the scorer should not reward when comparing texts.
BOILERPLATE_PATTERNS = (
    re.compile(r"\bвыезд\b", re.IGNORECASE),
    re.compile(r"\bвозвращени[ея]\b", re.IGNORECASE),
    re.compile(r"\bзаезд\b", re.IGNORECASE),
    re.compile(r"\bдень\s+\d+\b", re.IGNORECASE),
)


def collect_tour_text(tour: dict) -> str:
    parts = [
        tour.get("title", "") or "",
        tour.get("shortDescription", "") or "",
        tour.get("fullDescription", "") or "",
        tour.get("region", "") or "",
        tour.get("destination", "") or "",
    ]
    parts.extend(tour.get("destinations", []) or [])
    parts.extend(tour.get("highlights", []) or [])
    return " ".join(str(p) for p in parts if p)


def collect_day_text(day: dict) -> str:
    parts = [day.get("title", "") or "", day.get("description", "") or ""]
    return " ".join(str(p) for p in parts if p)


def score_photo_for_text(
    text_norm: str,
    text_tokens: set[str],
    photo_name_norm: str,
    photo_tokens: set[str],
) -> float:
    """How relevant is a photo filename to a block of text (day or tour).

    Signals, strongest first:
      1. The whole normalized photo name is a substring of the text (the
         itinerary literally names the place).
      2. All photo tokens are present in the text (full coverage).
      3. Partial token overlap, scaled by coverage.
    """
    if not photo_tokens or not text_tokens:
        return 0.0

    if photo_name_norm and photo_name_norm in text_norm:
        return 1.0 + 0.1 * len(photo_tokens)

    overlap = photo_tokens & text_tokens
    if not overlap:
        return 0.0

    coverage = len(overlap) / len(photo_tokens)
    if coverage >= 1.0:
        return 0.9 + 0.05 * len(photo_tokens)
    return 0.4 + 0.5 * coverage


def rank_photos(
    text_norm: str,
    text_tokens: set[str],
    photos: list[tuple[str, str, set[str]]],
    min_score: float,
) -> list[tuple[str, float]]:
    """Return [(filename, score)] sorted by relevance descending."""
    scored: list[tuple[str, float]] = []
    for name, norm, tokens in photos:
        s = score_photo_for_text(text_norm, text_tokens, norm, tokens)
        if s >= min_score:
            scored.append((name, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def pick_day_images(
    day: dict,
    tour_text_norm: str,
    tour_tokens: set[str],
    photos: list[tuple[str, str, set[str]]],
    already_used: set[str],
    max_per_day: int,
    min_score: float,
) -> list[str]:
    day_text = collect_day_text(day)
    for pat in BOILERPLATE_PATTERNS:
        day_text = pat.sub(" ", day_text)
    day_text_norm = normalize(day_text)
    day_tokens = content_tokens(day_text_norm)

    primary = rank_photos(day_text_norm, day_tokens, photos, min_score)
    picked: list[str] = []
    for name, _ in primary:
        if name in already_used:
            continue
        picked.append(name)
        already_used.add(name)
        if len(picked) >= max_per_day:
            break

    # Fall back to tour-wide context if the day has very little content.
    if len(picked) < max_per_day:
        backup = rank_photos(tour_text_norm, tour_tokens, photos, min_score)
        for name, _ in backup:
            if name in already_used:
                continue
            picked.append(name)
            already_used.add(name)
            if len(picked) >= max_per_day:
                break
    return picked


def pick_tour_level_images(
    tour_text_norm: str,
    tour_tokens: set[str],
    photos: list[tuple[str, str, set[str]]],
    already_used: set[str],
    max_items: int,
    min_score: float,
) -> list[str]:
    ranked = rank_photos(tour_text_norm, tour_tokens, photos, min_score)
    picked: list[str] = []
    for name, _ in ranked:
        if name in already_used:
            continue
        picked.append(name)
        already_used.add(name)
        if len(picked) >= max_items:
            break
    return picked


def load_target_slugs(csv_path: Path, slug_column: str) -> set[str]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            return set()
        if slug_column not in reader.fieldnames:
            raise ValueError(
                f"Column '{slug_column}' not found in {csv_path}. "
                f"Available: {reader.fieldnames}"
            )
        out: set[str] = set()
        for row in reader:
            slug = (row.get(slug_column) or "").strip()
            if slug:
                out.add(slug)
        return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos-dir", required=True)
    parser.add_argument("--input-json", default="data/tours.json")
    parser.add_argument("--output-json", default="data/tours1.json")
    parser.add_argument(
        "--slugs-csv",
        default="docs/tours-for-google-sheets - tours-for-google-sheets.csv",
        help="CSV with Slug column; only these tours are updated.",
    )
    parser.add_argument(
        "--slug-column",
        default="Slug",
        help="Slug column name inside --slugs-csv.",
    )
    parser.add_argument(
        "--base-url",
        default="https://storage.yandexcloud.net/kraskideti",
        help="Public S3 endpoint + bucket (used when --mode=public)",
    )
    parser.add_argument("--prefix", default="tours")
    parser.add_argument(
        "--mode",
        choices=("public", "local"),
        default="public",
        help="public → full https URL; local → relative 'photos/<name>' path",
    )
    parser.add_argument("--local-prefix", default="photos")
    parser.add_argument("--max-per-day", type=int, default=5)
    parser.add_argument("--max-gallery", type=int, default=12)
    parser.add_argument(
        "--min-score",
        type=float,
        default=0.45,
        help="Minimum relevance score for a photo to be attached",
    )
    parser.add_argument(
        "--overwrite-images",
        action="store_true",
        help="Replace day.images / gallery even if they already contain data.",
    )
    args = parser.parse_args()

    photos_dir = Path(args.photos_dir)
    if not photos_dir.is_dir():
        print(f"ERROR: photos dir not found: {photos_dir}", file=sys.stderr)
        return 2

    raw_photos = gather_photos(photos_dir)  # list[(filename, normalized_stem)]
    photos: list[tuple[str, str, set[str]]] = [
        (name, norm, content_tokens(norm)) for name, norm in raw_photos
    ]
    print(f"Loaded {len(photos)} photos from {photos_dir}")

    input_path = Path(args.input_json)
    output_path = Path(args.output_json)
    if not input_path.exists():
        print(f"ERROR: input JSON not found: {input_path}", file=sys.stderr)
        return 2

    data = json.loads(input_path.read_text(encoding="utf-8"))
    tours_iterable = data if isinstance(data, list) else data.get("tours", [])
    if not isinstance(tours_iterable, list):
        print("ERROR: tours.json must be a list or {tours: [...]}.", file=sys.stderr)
        return 2

    slugs_csv = Path(args.slugs_csv)
    if not slugs_csv.exists():
        print(f"ERROR: slugs CSV not found: {slugs_csv}", file=sys.stderr)
        return 2
    try:
        target_slugs = load_target_slugs(slugs_csv, args.slug_column)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(f"Target slugs from CSV: {len(target_slugs)}")

    prefix = args.prefix.strip("/")
    base_url = args.base_url.rstrip("/")

    def to_url(filename: str) -> str:
        if args.mode == "local":
            local = args.local_prefix.strip("/")
            return f"{local}/{quote(filename)}" if local else quote(filename)
        return f"{base_url}/{prefix}/{quote(filename)}"

    total_days = 0
    days_filled = 0
    tours_updated = 0
    tours_skipped_by_slug = 0
    tours_without_photos: list[str] = []

    for tour in tours_iterable:
        if not isinstance(tour, dict):
            continue
        slug = (tour.get("slug") or "").strip()
        if slug not in target_slugs:
            tours_skipped_by_slug += 1
            continue
        tour_text = collect_tour_text(tour)
        tour_text_norm = normalize(tour_text)
        tour_tokens = content_tokens(tour_text_norm)

        already_used: set[str] = set()
        itinerary = tour.get("itinerary") or []

        for day in itinerary:
            if not isinstance(day, dict):
                continue
            total_days += 1
            if not args.overwrite_images and day.get("images"):
                # Respect existing non-empty images.
                for url in day["images"]:
                    # Try to register original filenames if they match our scheme.
                    # This keeps gallery de-duplication consistent.
                    already_used.add(url)
                continue
            picked = pick_day_images(
                day=day,
                tour_text_norm=tour_text_norm,
                tour_tokens=tour_tokens,
                photos=photos,
                already_used=already_used,
                max_per_day=args.max_per_day,
                min_score=args.min_score,
            )
            urls = [to_url(name) for name in picked]
            day["images"] = urls
            if urls:
                days_filled += 1

        # Gallery — deduplicated URLs from all day.images + optional top-up
        gallery: list[str] = []
        seen = set()
        for day in itinerary:
            if not isinstance(day, dict):
                continue
            for url in day.get("images", []) or []:
                if url not in seen:
                    seen.add(url)
                    gallery.append(url)

        if len(gallery) < args.max_gallery:
            # Top up gallery with tour-level candidates not yet used.
            already_used_names = {
                url.rsplit("/", 1)[-1] for url in gallery
            }
            extra_names = pick_tour_level_images(
                tour_text_norm=tour_text_norm,
                tour_tokens=tour_tokens,
                photos=photos,
                already_used=already_used_names,
                max_items=args.max_gallery - len(gallery),
                min_score=args.min_score,
            )
            for name in extra_names:
                url = to_url(name)
                if url not in seen:
                    seen.add(url)
                    gallery.append(url)

        if gallery and (args.overwrite_images or not tour.get("gallery")):
            tour["gallery"] = gallery[: args.max_gallery]
        elif not tour.get("gallery") and gallery:
            tour["gallery"] = gallery[: args.max_gallery]

        if gallery:
            tours_updated += 1
        else:
            tours_without_photos.append(tour.get("slug") or tour.get("id") or "<unknown>")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Tours total:         {len(tours_iterable)}")
    print(f"Tours skipped(slug): {tours_skipped_by_slug}")
    print(f"Tours with photos:   {tours_updated}")
    print(f"Tours without match: {len(tours_without_photos)}")
    print(f"Itinerary days:      {total_days}")
    print(f"Days filled:         {days_filled}")
    print(f"Output JSON:         {output_path}")
    if tours_without_photos:
        preview = tours_without_photos[:10]
        print(f"First unmatched tour slugs: {preview}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
