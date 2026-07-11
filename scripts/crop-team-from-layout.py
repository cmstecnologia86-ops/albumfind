from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXTRACTIONS_ROOT = PROJECT_ROOT / "work" / "extractions"
LAYOUTS_ROOT = PROJECT_ROOT / "src" / "data" / "extraction-layouts"


def create_contact_sheet(
    items: list[dict],
    output_path: Path,
) -> None:
    thumbnail_width = 240
    columns = 4
    margin = 18
    label_height = 34

    prepared = []

    for item in items:
        image = Image.open(item["absolutePath"]).convert("RGB")
        ratio = thumbnail_width / image.width
        height = max(1, int(image.height * ratio))

        thumbnail = image.resize(
            (thumbnail_width, height),
            Image.Resampling.LANCZOS,
        )

        prepared.append((item["sourceId"], thumbnail))

    maximum_height = max(
        image.height
        for _, image in prepared
    )

    cell_height = maximum_height + label_height
    rows = (len(prepared) + columns - 1) // columns

    sheet_width = (
        columns * thumbnail_width +
        (columns + 1) * margin
    )

    sheet_height = (
        rows * cell_height +
        (rows + 1) * margin
    )

    sheet = Image.new(
        "RGB",
        (sheet_width, sheet_height),
        "white",
    )

    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)

    for index, (source_id, thumbnail) in enumerate(prepared):
        row = index // columns
        column = index % columns

        x = margin + column * (thumbnail_width + margin)
        y = margin + row * (cell_height + margin)

        draw.text(
            (x, y),
            source_id,
            fill="black",
            font=font,
        )

        sheet.paste(
            thumbnail,
            (x, y + label_height),
        )

    sheet.save(output_path)


def process_team(team_name: str) -> None:
    layout_path = LAYOUTS_ROOT / f"{team_name}.json"
    team_output = EXTRACTIONS_ROOT / team_name
    pages_output = team_output / "pages"
    crops_output = team_output / "manual-crops"
    debug_output = team_output / "manual-debug"

    if not layout_path.exists():
        raise FileNotFoundError(
            f"No existe el manifiesto {layout_path}"
        )

    if not pages_output.exists():
        raise FileNotFoundError(
            f"No existen las páginas renderizadas en {pages_output}"
        )

    layout = json.loads(
        layout_path.read_text(encoding="utf-8-sig")
    )

    if crops_output.exists():
        shutil.rmtree(crops_output)

    if debug_output.exists():
        shutil.rmtree(debug_output)

    crops_output.mkdir(parents=True, exist_ok=True)
    debug_output.mkdir(parents=True, exist_ok=True)

    pages: dict[int, Image.Image] = {}

    for page_number in {
        int(item["page"])
        for item in layout["items"]
    }:
        page_path = pages_output / f"page-{page_number:02d}.png"

        pages[page_number] = Image.open(
            page_path
        ).convert("RGB")

    overlays = {
        page_number: image.copy()
        for page_number, image in pages.items()
    }

    output_items = []

    for item in layout["items"]:
        page_number = int(item["page"])
        source_image = pages[page_number]

        x = int(item["x"])
        y = int(item["y"])
        width = int(item["width"])
        height = int(item["height"])

        crop = source_image.crop(
            (
                x,
                y,
                x + width,
                y + height,
            )
        )

        output_name = f"{item['sourceId']}.png"
        output_path = crops_output / output_name

        crop.save(output_path)

        overlay = overlays[page_number]
        draw = ImageDraw.Draw(overlay)

        draw.rectangle(
            (
                x,
                y,
                x + width,
                y + height,
            ),
            outline="red",
            width=7,
        )

        draw.text(
            (x + 10, y + 10),
            item["sourceId"],
            fill="red",
            stroke_width=2,
            stroke_fill="white",
        )

        output_items.append(
            {
                **item,
                "image": f"manual-crops/{output_name}",
                "absolutePath": str(output_path),
            }
        )

    for page_number, overlay in overlays.items():
        overlay.save(
            debug_output /
            f"page-{page_number:02d}-layout.png"
        )

    inventory_path = team_output / "manual-crops.json"

    inventory_path.write_text(
        json.dumps(
            [
                {
                    key: value
                    for key, value in item.items()
                    if key != "absolutePath"
                }
                for item in output_items
            ],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    contact_sheet_path = team_output / "manual-contact-sheet.png"

    create_contact_sheet(
        output_items,
        contact_sheet_path,
    )

    print(f"Equipo: {team_name}")
    print(f"Recortes generados: {len(output_items)}")
    print(f"Carpeta: {crops_output}")
    print(f"Diagnóstico: {debug_output}")
    print(f"Hoja de contacto: {contact_sheet_path}")
    print(f"Inventario técnico: {inventory_path}")


def main() -> None:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "team",
        help='Nombre exacto de la selección, por ejemplo "JAPON"',
    )

    args = parser.parse_args()

    try:
        process_team(args.team.strip())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
