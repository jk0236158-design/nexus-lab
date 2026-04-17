"""Publish a premium template to Gumroad (partial automation).

Usage:
    source ~/.env.nokaze  # exports GUMROAD_ACCESS_TOKEN
    python scripts/publish-premium.py <template_name>

    e.g. python scripts/publish-premium.py api-proxy

What this does (Green — no actual sale starts until you press Publish):
  1. Parse  docs/gumroad-<template>-template.md for name / price / tags.
  2. Load   docs/gumroad-<template>-template-rich.html as the description.
  3. Build  the zip via scripts/build-premium-zip.py <template>.
  4. POST   /v2/products on Gumroad API (creates an unpublished product).
  5. Print  product id + short_url.
  6. Patch  packages/create-mcp-server/src/generator.ts
           so PREMIUM_TEMPLATES[<template>] points at the new short_url.

What is NOT automated (Gumroad API v2 limitation):
  - Uploading the zip   -> do it in the dashboard.
  - Pressing Publish    -> do it in the dashboard.
The script prints the remaining manual steps at the end.

Design notes:
  - Stdlib only (urllib + subprocess). No new dependency.
  - Price is parsed from the ja-JP markdown ("¥800", "$5") and normalized
    to integer cents in USD. ¥ prices are treated as JPY cents via the
    `currency` field.
  - em dash (U+2014) in product names is replaced with ASCII hyphen
    because Gumroad's multipart parser occasionally mangles it.
  - Network call is multipart/form-data, built by hand so we don't
    need `requests`.
"""
from __future__ import annotations

import mimetypes
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path
from urllib import request as urlrequest
from urllib.error import HTTPError

ROOT = Path(__file__).parent.parent
DOCS = ROOT / "docs"
GENERATOR_TS = ROOT / "packages" / "create-mcp-server" / "src" / "generator.ts"
GUMROAD_API = "https://api.gumroad.com/v2/products"


def _fail(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def _normalize_dashes(s: str) -> str:
    return s.replace("\u2014", "-").replace("\u2013", "-")


def parse_md(template: str) -> dict:
    """Extract product name, price (cents + currency), and tags from the .md."""
    md_path = DOCS / f"gumroad-{template}-template.md"
    if not md_path.exists():
        _fail(f"spec markdown not found: {md_path}")

    text = md_path.read_text(encoding="utf-8")

    def section(header: str) -> str:
        # capture text under "## <header>" up to the next "## " or EOF
        pattern = rf"##\s+{re.escape(header)}\s*\n(.*?)(?=\n##\s+|\Z)"
        m = re.search(pattern, text, re.DOTALL)
        return m.group(1).strip() if m else ""

    name = _normalize_dashes(section("商品名").splitlines()[0]) if section("商品名") else ""
    price_raw = section("価格").splitlines()[0] if section("価格") else ""
    tags_raw = section("タグ").splitlines()[0] if section("タグ") else ""

    if not name:
        _fail("could not parse 商品名 from markdown")
    if not price_raw:
        _fail("could not parse 価格 from markdown")

    # "¥800" -> (80000, "jpy")   "$5" -> (500, "usd")
    price_cents, currency = _parse_price(price_raw)

    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    return {
        "name": name,
        "price_cents": price_cents,
        "currency": currency,
        "tags": tags,
    }


def _parse_price(raw: str) -> tuple[int, str]:
    raw = raw.strip()
    m = re.search(r"([¥$])\s*([\d,]+)", raw)
    if not m:
        _fail(f"unrecognized price format: {raw!r}")
    symbol, num = m.group(1), m.group(2).replace(",", "")
    value = int(num)
    if symbol == "¥":
        # JPY has no minor units — Gumroad expects raw yen, not *100.
        # Verified against database ¥500 / auth ¥800 manual submissions.
        return value, "jpy"
    return value * 100, "usd"


def load_description(template: str) -> str:
    html_path = DOCS / f"gumroad-{template}-template-rich.html"
    if not html_path.exists():
        _fail(f"rich description not found: {html_path}")
    return _normalize_dashes(html_path.read_text(encoding="utf-8"))


def build_zip(template: str) -> Path:
    print(f"[1/4] building zip for {template}...")
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build-premium-zip.py"), template],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        _fail("build-premium-zip.py failed")
    zip_path = ROOT / "dist" / "premium" / f"mcp-server-{template}-template.zip"
    if not zip_path.exists():
        _fail(f"expected zip missing: {zip_path}")
    print(f"  -> {zip_path}")
    return zip_path


def _multipart(fields: list[tuple[str, str]]) -> tuple[bytes, str]:
    """Build a minimal multipart/form-data body. Supports repeated keys (tags[])."""
    boundary = f"----nokaze{uuid.uuid4().hex}"
    parts: list[bytes] = []
    for key, value in fields:
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(
            f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8")
        )
        parts.append(value.encode("utf-8"))
        parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def create_product(spec: dict, description_html: str, token: str) -> dict:
    print("[2/4] POST /v2/products...")
    fields: list[tuple[str, str]] = [
        ("access_token", token),
        ("name", spec["name"]),
        ("price", str(spec["price_cents"])),
        ("currency", spec["currency"]),
        ("description", description_html),
    ]
    for tag in spec["tags"]:
        fields.append(("tags[]", tag))

    body, content_type = _multipart(fields)
    req = urlrequest.Request(
        GUMROAD_API,
        data=body,
        method="POST",
        headers={"Content-Type": content_type},
    )
    try:
        with urlrequest.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        _fail(f"Gumroad API error {e.code}: {detail}")

    import json

    payload = json.loads(raw)
    if not payload.get("success"):
        _fail(f"Gumroad responded with success=false: {payload}")
    product = payload["product"]
    print(f"  product_id = {product.get('id')}")
    print(f"  short_url  = {product.get('short_url')}")
    return product


def update_generator_ts(template: str, short_url: str) -> None:
    print("[3/4] updating PREMIUM_TEMPLATES in generator.ts...")
    if not GENERATOR_TS.exists():
        _fail(f"generator.ts not found: {GENERATOR_TS}")
    src = GENERATOR_TS.read_text(encoding="utf-8")

    # Replace an existing "<template>: \"...\"," entry if present;
    # otherwise insert before the closing brace of PREMIUM_TEMPLATES.
    entry_re = re.compile(
        rf'(^\s*{re.escape(template)}\s*:\s*)"[^"]*"(\s*,?\s*$)',
        re.MULTILINE,
    )
    if entry_re.search(src):
        new_src = entry_re.sub(rf'\g<1>"{short_url}"\g<2>', src)
    else:
        block_re = re.compile(
            r"(const\s+PREMIUM_TEMPLATES\s*:\s*Record<string,\s*string>\s*=\s*\{)([^}]*)(\})",
            re.DOTALL,
        )
        m = block_re.search(src)
        if not m:
            _fail("could not locate PREMIUM_TEMPLATES block in generator.ts")
        head, body, tail = m.group(1), m.group(2), m.group(3)
        # ensure trailing comma on last line
        trimmed = body.rstrip()
        if trimmed and not trimmed.endswith(","):
            trimmed += ","
        inserted = f'{trimmed}\n  {template}: "{short_url}",\n'
        new_src = src[: m.start()] + head + inserted + tail + src[m.end() :]

    if new_src == src:
        print("  (no change)")
        return
    GENERATOR_TS.write_text(new_src, encoding="utf-8")
    print(f"  -> wrote {template}: {short_url}")


def print_manual_steps(template: str, product: dict, zip_path: Path) -> None:
    print()
    print("[4/4] MANUAL STEPS (Gumroad API v2 cannot upload files / publish):")
    print(f"  1. Open: https://app.gumroad.com/products/{product.get('id')}/edit")
    print(f"  2. Upload zip: {zip_path}")
    print("  3. Press Publish.")
    print(f"  4. Verify short_url works: {product.get('short_url')}")
    print()
    print("After publish:")
    print("  - Rebuild / release packages/create-mcp-server if the generator.ts")
    print("    URL change should reach npm users.")
    print(f"  - Update docs/gumroad-upload-checklist.md (mark {template} done).")


def main() -> int:
    if len(sys.argv) != 2:
        _fail("usage: python scripts/publish-premium.py <template_name>")
    template = sys.argv[1].strip()

    token = os.environ.get("GUMROAD_ACCESS_TOKEN")
    if not token:
        _fail("GUMROAD_ACCESS_TOKEN not set. Run: source ~/.env.nokaze")

    spec = parse_md(template)
    description = load_description(template)
    zip_path = build_zip(template)

    print(f"  name     = {spec['name']}")
    print(f"  price    = {spec['price_cents']} ({spec['currency']})")
    print(f"  tags     = {spec['tags']}")

    product = create_product(spec, description, token)
    update_generator_ts(template, product.get("short_url", ""))
    print_manual_steps(template, product, zip_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
