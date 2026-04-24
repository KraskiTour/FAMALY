"""Bulk-upload tour photos to Yandex Object Storage with public-read ACL.

Every image in --photos-dir is uploaded to:
    s3://<bucket>/<prefix>/<original_filename>
Matching the URL shape produced by scripts/match_tour_photos.py, so the
links inside the generated CSV become live once this script finishes.

Credentials are loaded from .env (default) using the same variable names as
the MAX bot in c:/code/bot_yndex:
    YC_ACCESS_KEY_ID
    YC_SECRET_ACCESS_KEY
    YC_BUCKET            (default: kraskideti)
    YC_ENDPOINT_URL      (default: https://storage.yandexcloud.net)
    YC_REGION            (default: ru-central1)

Requires: boto3, python-dotenv (pip install boto3 python-dotenv).

Usage:
  python scripts/upload_tour_photos.py \
    --photos-dir "C:/Users/pavel/Downloads/фото КраскиТревел/фото КраскиТревел"
  python scripts/upload_tour_photos.py --photos-dir "..." --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    import boto3  # type: ignore
    from botocore.client import Config  # type: ignore
except ImportError:  # pragma: no cover
    boto3 = None  # type: ignore
    Config = None  # type: ignore

try:
    from dotenv import load_dotenv  # type: ignore
except ImportError:  # pragma: no cover
    load_dotenv = None  # type: ignore

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos-dir", required=True)
    parser.add_argument("--prefix", default="tours")
    parser.add_argument("--env", default=".env", help="Path to .env file (default: .env)")
    parser.add_argument("--dry-run", action="store_true", help="List files, do not upload")
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip objects that already exist in the bucket",
    )
    args = parser.parse_args()

    if load_dotenv is not None and Path(args.env).exists():
        load_dotenv(args.env)

    bucket = os.getenv("YC_BUCKET", "kraskideti")
    endpoint = os.getenv("YC_ENDPOINT_URL", "https://storage.yandexcloud.net")
    region = os.getenv("YC_REGION", "ru-central1")
    key_id = os.getenv("YC_ACCESS_KEY_ID", "")
    secret = os.getenv("YC_SECRET_ACCESS_KEY", "")

    photos_dir = Path(args.photos_dir)
    if not photos_dir.is_dir():
        print(f"ERROR: photos dir not found: {photos_dir}", file=sys.stderr)
        return 2

    files = sorted(
        p for p in photos_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )
    prefix = args.prefix.strip("/")

    print(f"Will upload {len(files)} files -> s3://{bucket}/{prefix}/")
    if args.dry_run:
        for p in files:
            print(f"  DRY  {p.name}")
        return 0

    if boto3 is None or Config is None:
        print("ERROR: boto3 is not installed. pip install boto3 python-dotenv", file=sys.stderr)
        return 3
    if not key_id or not secret:
        print(
            "ERROR: YC_ACCESS_KEY_ID / YC_SECRET_ACCESS_KEY not set. "
            "Fill .env or export them in the shell.",
            file=sys.stderr,
        )
        return 3

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret,
        region_name=region,
        config=Config(signature_version="s3v4"),
    )

    existing: set[str] = set()
    if args.skip_existing:
        token = None
        while True:
            kwargs = {"Bucket": bucket, "Prefix": f"{prefix}/"}
            if token:
                kwargs["ContinuationToken"] = token
            resp = s3.list_objects_v2(**kwargs)
            for obj in resp.get("Contents", []) or []:
                existing.add(obj["Key"])
            if not resp.get("IsTruncated"):
                break
            token = resp.get("NextContinuationToken")
        print(f"Found {len(existing)} existing objects under prefix '{prefix}/'")

    uploaded = 0
    skipped = 0
    for i, path in enumerate(files, start=1):
        key = f"{prefix}/{path.name}"
        if args.skip_existing and key in existing:
            skipped += 1
            print(f"[{i}/{len(files)}] skip {path.name}")
            continue
        ctype = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
        try:
            with path.open("rb") as fh:
                s3.put_object(
                    Bucket=bucket,
                    Key=key,
                    Body=fh.read(),
                    ContentType=ctype,
                    ACL="public-read",
                )
            uploaded += 1
            print(f"[{i}/{len(files)}] ok   {path.name}")
        except Exception as exc:  # pragma: no cover
            print(f"[{i}/{len(files)}] FAIL {path.name}: {exc}", file=sys.stderr)

    print(f"Done. Uploaded: {uploaded}, skipped: {skipped}, total: {len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
