from __future__ import annotations

import csv
import html
import json
import shutil
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw

import process_team_pilots as base


ROOT = Path.cwd()
REPORT_PATH = ROOT / "work" / "all-teams-inspection" / "pdf-pattern-report.json"
CATALOG_PATH = ROOT / "src" / "data" / "player-catalog.json"
OUTPUT_ROOT = ROOT / "work" / "team-pilots"
SUMMARY_ROOT = ROOT / "work" / "pattern-a-pilots"
PUBLISHED_PILOTS = {"MEX", "ARG", "BRA", "GER"}

PRELIMINARY_MAPPING = {
    1: (1, "P01-S01", 0),
    2: (1, "P01-S03", 0),
    3: (1, "P01-S05", 0),
    4: (1, "P01-S08", 0),
    5: (1, "P01-S06", 0),
    6: (1, "P01-S02", 0),
    7: (1, "P01-S07", 0),
    8: (1, "P01-S10", 0),
    9: (1, "P01-S13", 0),
    10: (1, "P01-S11", 0),
    11: (1, "P01-S09", 0),
    12: (1, "P01-S14", 0),
    13: (2, "P02-S05", -90),
    14: (1, "P01-S12", 0),
    15: (2, "P02-S01", 0),
    16: (1, "P01-S16", 0),
    17: (1, "P01-S15", 0),
    18: (2, "P02-S02", 0),
    19: (2, "P02-S04", 0),
    20: (2, "P02-S03", 0),
}


def normalize_label(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = "".join(character for character in normalized if not unicodedata.combining(character))
    return ascii_text.upper().replace(" ", "").replace("-", "")


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def catalog_by_folder() -> dict[str, dict]:
    aliases = {
        "HOLANDA": "NED",
        "INGLATERRA": "ENG",
        "MARRUECOS": "MAR",
        "ESPAÑA": "ESP",
        "NORUEGA": "NOR",
        "FRANCIA": "FRA",
        "PORTUGAL": "POR",
        "URUGUAY": "URU",
        "CROACIA": "CRO",
        "COLOMBIA": "COL",
        "ECUADOR": "ECU",
    }
    teams = load_catalog()["teams"]
    by_code = {team["teamCode"]: team for team in teams}
    by_folder = {folder: by_code[team_code] for folder, team_code in aliases.items()}
    for team in teams:
        by_folder.setdefault(normalize_label(team["teamName"]), team)
    return by_folder


def pattern_a_targets() -> list[dict]:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    folder_map = catalog_by_folder()
    targets = []
    for record in report["records"]:
        if record.get("pattern") != "A-two-pages-one-main-image-each":
            continue
        pdf_path = Path(record["pdf"])
        folder = pdf_path.parent.name
        team = folder_map.get(normalize_label(folder))
        if not team:
            raise KeyError(f"No catalog team found for folder {folder}")
        if team["teamCode"] in PUBLISHED_PILOTS:
            continue
        targets.append(
            {
                "teamCode": team["teamCode"],
                "teamName": team["teamName"],
                "folder": folder,
                "pdf": pdf_path.as_posix(),
            }
        )
    return sorted(targets, key=lambda item: item["teamCode"])


def page_boxes() -> dict[int, dict[str, tuple[int, int, int, int]]]:
    page_1_boxes = base.build_grid_boxes(base.PAGE_1_GRID, "P01")
    page_2_boxes = base.build_grid_boxes(base.PAGE_2_TOP, "P02")
    page_2_boxes["P02-S05"] = (
        base.PAGE_2_TEAM["left"],
        base.PAGE_2_TEAM["top"],
        base.PAGE_2_TEAM["right"],
        base.PAGE_2_TEAM["bottom"],
    )
    return {1: page_1_boxes, 2: page_2_boxes}


def clean_pilot_dirs(team_root: Path) -> tuple[Path, Path, Path]:
    source_dir = team_root / "source-crops"
    preview_dir = team_root / "official-preview"
    contact_dir = team_root / "contact-sheet"
    for path in [source_dir, preview_dir, contact_dir]:
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True, exist_ok=True)
    return source_dir, preview_dir, contact_dir


def create_preliminary_contact_sheet(records: list[dict], contact_path: Path) -> None:
    columns = 5
    card_width = 330
    card_height = 492
    preview_width = 290
    preview_height = 330
    margin = 24
    gap = 18
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (
            margin * 2 + columns * card_width + (columns - 1) * gap,
            margin * 2 + rows * card_height + (rows - 1) * gap,
        ),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    code_font = base.get_font(18, True)
    name_font = base.get_font(13, True)
    meta_font = base.get_font(10)

    for index, record in enumerate(records):
        row = index // columns
        column = index % columns
        x = margin + column * (card_width + gap)
        y = margin + row * (card_height + gap)
        draw.rectangle((x, y, x + card_width, y + card_height), outline=(210, 210, 210), width=2)
        draw.text((x + 12, y + 12), record["code"], font=code_font, fill=(20, 45, 40))
        draw.text((x + 12, y + 38), record["name"][:38], font=name_font, fill=(20, 45, 40))
        meta = f"{record['confidence'].upper()} | {record.get('sourceSlot')} | review"
        draw.text((x + 12, y + 60), meta, font=meta_font, fill=(110, 80, 25))
        if record["notes"]:
            draw.text((x + 12, y + 76), record["notes"][0][:46], font=meta_font, fill=(120, 70, 70))

        image = Image.open(record["previewPath"]).convert("RGB")
        image.thumbnail((preview_width, preview_height), Image.Resampling.LANCZOS)
        px = x + (card_width - image.width) // 2
        py = y + 104 + (preview_height - image.height) // 2
        sheet.paste(image, (px, py))

    contact_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(contact_path, quality=94)


def source_slots(
    team_code: str,
    document,
    main_images: dict[int, base.MainImage],
    source_images: dict[int, Image.Image],
    boxes_by_page: dict[int, dict[str, tuple[int, int, int, int]]],
    source_dir: Path,
) -> list[dict]:
    records = []
    for source_page in [1, 2]:
        for source_slot, page_box in sorted(boxes_by_page[source_page].items()):
            main = main_images[source_page]
            source_image = source_images[source_page]
            source_rect = base.page_box_to_source_box(page_box, main.rect, source_image.size)
            crop = source_image.crop(source_rect)
            rotation = -90 if source_slot == "P02-S05" else 0
            if rotation:
                crop = crop.rotate(rotation, expand=True)
            output_path = source_dir / f"{team_code}-SRC-{source_slot}.webp"
            base.save_webp(crop, output_path)
            records.append(
                {
                    "sourcePage": source_page,
                    "sourceXref": main.xref,
                    "sourceSlot": source_slot,
                    "sourceRect": list(source_rect),
                    "rotation": rotation,
                    "width": crop.width,
                    "height": crop.height,
                    "path": str(output_path),
                }
            )
    return records


def process_target(target: dict) -> dict:
    team_code = target["teamCode"]
    team_root = OUTPUT_ROOT / team_code
    source_dir, preview_dir, contact_dir = clean_pilot_dirs(team_root)
    boxes_by_page = page_boxes()
    team = next(team for team in load_catalog()["teams"] if team["teamCode"] == team_code)
    stickers = sorted(team["stickers"], key=lambda sticker: sticker["number"])
    if len(stickers) != 20:
        raise ValueError(f"{team_code} catalog has {len(stickers)} stickers")

    pdf_path = ROOT / target["pdf"]
    records = []
    missing = []
    warnings = [
        "Preliminary Pattern A pilot only; not published.",
        "Associations use a conservative provisional geometry template and require visual review.",
        "P01-S04 remains an unassigned source candidate, not an automatic extra.",
    ]
    used_slots = set()

    document = base.fitz.open(pdf_path)
    try:
        main_images = {
            1: base.find_main_image(document, 0),
            2: base.find_main_image(document, 1),
        }
        source_images = {
            page: base.extract_original_image(document, main.xref)
            for page, main in main_images.items()
        }
        slot_records = source_slots(team_code, document, main_images, source_images, boxes_by_page, source_dir)
        source_sheet = contact_dir / f"{team_code}-source-slots.jpg"
        base.create_source_slots_sheet(
            [
                {
                    **record,
                    "sourceBox": record["sourceRect"],
                }
                for record in slot_records
            ],
            source_sheet,
        )

        for sticker in stickers:
            number = sticker["number"]
            expected_code = f"{team_code}-{number:02d}"
            if sticker["code"] != expected_code:
                raise ValueError(f"{team_code}: expected {expected_code}, got {sticker['code']}")
            source_page, source_slot, rotation = PRELIMINARY_MAPPING[number]
            main = main_images[source_page]
            source_image = source_images[source_page]
            page_box = boxes_by_page[source_page][source_slot]
            source_rect = base.page_box_to_source_box(page_box, main.rect, source_image.size)
            crop = source_image.crop(source_rect)
            if rotation:
                crop = crop.rotate(rotation, expand=True)
            output_path = preview_dir / f"{sticker['code']}.webp"
            base.save_webp(crop, output_path)
            validation = base.validate_image(output_path, sticker["kind"])
            notes = ["Provisional slot mapping; visual approval required."]
            if number == 1:
                notes.append("Verify emblem visually; do not assume P01-S01 is correct.")
            if number == 13:
                notes.append("Verify full horizontal team photo and page-2 geometry.")
            if source_slot == "P01-S04":
                notes.append("P01-S04 is treated as a valid candidate source, not an automatic extra.")
            if validation["ratioDelta"] > 0.22:
                notes.append(f"Aspect ratio differs from expected by {validation['ratioDelta']:.3f}.")
            used_slots.add((source_page, source_slot))
            records.append(
                {
                    "code": sticker["code"],
                    "number": number,
                    "name": sticker["name"],
                    "kind": sticker["kind"],
                    "sourcePage": source_page,
                    "sourceXref": main.xref,
                    "sourceSlot": source_slot,
                    "sourceRect": list(source_rect),
                    "rotation": rotation,
                    "trimTopPixels": 0,
                    "hasImage": True,
                    "confidence": "low",
                    "output": output_path.name,
                    "sourceCrop": f"{team_code}-SRC-{source_slot}.webp",
                    "validation": validation,
                    "notes": notes,
                    "previewPath": str(output_path),
                }
            )
    finally:
        document.close()

    all_slots = {(1, slot) for slot in boxes_by_page[1]} | {(2, slot) for slot in boxes_by_page[2]}
    extras = [
        {
            "sourcePage": page,
            "sourceSlot": slot,
            "reason": "unassigned source candidate for visual review; not published",
        }
        for page, slot in sorted(all_slots - used_slots)
        if slot != "P01-S04"
    ]

    contact_sheet = contact_dir / f"{team_code}-contact-sheet-preliminary.jpg"
    create_preliminary_contact_sheet(records, contact_sheet)

    confidence_counts = {"high": 0, "medium": 0, "low": 0, "missing": 0, "extra": len(extras)}
    for record in records:
        confidence_counts[record["confidence"]] += 1
    confidence_counts["missing"] = len(missing)

    manifest = {
        "teamCode": team_code,
        "teamName": team["teamName"],
        "pdf": target["pdf"],
        "pattern": "A-two-pages-one-main-image-each",
        "published": False,
        "requiresVisualReview": True,
        "mappingConfidence": confidence_counts,
        "stickers": [{key: value for key, value in record.items() if key != "previewPath"} for record in records],
        "extras": extras,
        "missing": missing,
        "warnings": warnings,
        "contactSheet": contact_sheet.relative_to(ROOT).as_posix(),
        "sourceSlotsSheet": source_sheet.relative_to(ROOT).as_posix(),
        "outputRoot": team_root.relative_to(ROOT).as_posix(),
    }
    (team_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return manifest


def write_summary(manifests: list[dict]) -> None:
    SUMMARY_ROOT.mkdir(parents=True, exist_ok=True)
    rows = []
    for manifest in manifests:
        confidence = manifest["mappingConfidence"]
        rows.append(
            {
                "teamCode": manifest["teamCode"],
                "teamName": manifest["teamName"],
                "high": confidence["high"],
                "medium": confidence["medium"],
                "low": confidence["low"],
                "missing": confidence["missing"],
                "extras": confidence["extra"],
                "warnings": len(manifest["warnings"]),
                "sourceSlotsSheet": manifest["sourceSlotsSheet"],
                "contactSheet": manifest["contactSheet"],
                "status": "pending_review",
            }
        )
    (SUMMARY_ROOT / "pattern-a-summary.json").write_text(
        json.dumps({"teams": rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    with (SUMMARY_ROOT / "pattern-a-summary.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()) if rows else [])
        writer.writeheader()
        writer.writerows(rows)
    write_index(rows)


def write_index(rows: list[dict]) -> None:
    body_rows = []
    for row in rows:
        source_href = Path("..") / ".." / row["sourceSlotsSheet"]
        contact_href = Path("..") / ".." / row["contactSheet"]
        body_rows.append(
            "<tr>"
            f"<td>{html.escape(row['teamCode'])}</td>"
            f"<td>{html.escape(row['teamName'])}</td>"
            f"<td>{row['high']}</td>"
            f"<td>{row['medium']}</td>"
            f"<td>{row['low']}</td>"
            f"<td>{row['missing']}</td>"
            f"<td>{row['extras']}</td>"
            f"<td>{row['warnings']}</td>"
            f"<td><a href=\"{html.escape(source_href.as_posix())}\">source slots</a></td>"
            f"<td><a href=\"{html.escape(contact_href.as_posix())}\">preliminary</a></td>"
            f"<td>{row['status']}</td>"
            "</tr>"
        )
    document = """<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pattern A Pilot Review</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #16251f; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d8ded8; padding: 8px 10px; text-align: left; }
    th { background: #eef4ef; }
    tr:nth-child(even) { background: #fafafa; }
    a { color: #006b4f; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Pattern A Pilot Review</h1>
  <table>
    <thead>
      <tr>
        <th>teamCode</th><th>teamName</th><th>high</th><th>medium</th><th>low</th>
        <th>missing</th><th>extras</th><th>warnings</th>
        <th>source-slots</th><th>preliminary</th><th>status</th>
      </tr>
    </thead>
    <tbody>
      __ROWS__
    </tbody>
  </table>
</body>
</html>
""".replace("__ROWS__", "\n      ".join(body_rows))
    (SUMMARY_ROOT / "pattern-a-review-index.html").write_text(document, encoding="utf-8")


def main() -> int:
    targets = pattern_a_targets()
    print("Pattern A targets:")
    for target in targets:
        print(f"  {target['teamCode']} - {target['teamName']} ({target['folder']})")
    manifests = []
    for target in targets:
        print(f"Generating {target['teamCode']}...")
        manifest = process_target(target)
        confidence = manifest["mappingConfidence"]
        print(
            f"  {manifest['contactSheet']} | "
            f"high={confidence['high']} medium={confidence['medium']} "
            f"low={confidence['low']} missing={confidence['missing']} extras={confidence['extra']}"
        )
        manifests.append(manifest)
    write_summary(manifests)
    print(f"Summary: {(SUMMARY_ROOT / 'pattern-a-summary.json').as_posix()}")
    print(f"Index: {(SUMMARY_ROOT / 'pattern-a-review-index.html').as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
