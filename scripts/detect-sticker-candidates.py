from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXTRACTIONS_ROOT = PROJECT_ROOT / "work" / "extractions"


def rectangles_overlap(
    first: dict[str, int],
    second: dict[str, int],
    threshold: float = 0.65,
) -> bool:
    x1 = max(first["x"], second["x"])
    y1 = max(first["y"], second["y"])
    x2 = min(
        first["x"] + first["width"],
        second["x"] + second["width"],
    )
    y2 = min(
        first["y"] + first["height"],
        second["y"] + second["height"],
    )

    intersection_width = max(0, x2 - x1)
    intersection_height = max(0, y2 - y1)
    intersection = intersection_width * intersection_height

    if intersection == 0:
        return False

    first_area = first["width"] * first["height"]
    second_area = second["width"] * second["height"]
    smaller_area = min(first_area, second_area)

    return intersection / smaller_area >= threshold


def remove_duplicate_rectangles(
    rectangles: list[dict[str, int]],
) -> list[dict[str, int]]:
    rectangles = sorted(
        rectangles,
        key=lambda item: item["width"] * item["height"],
        reverse=True,
    )

    accepted: list[dict[str, int]] = []

    for rectangle in rectangles:
        if any(
            rectangles_overlap(rectangle, existing)
            for existing in accepted
        ):
            continue

        accepted.append(rectangle)

    return sorted(
        accepted,
        key=lambda item: (
            item["y"] + item["height"] // 2,
            item["x"] + item["width"] // 2,
        ),
    )


def detect_page_candidates(
    image: Image.Image,
) -> tuple[list[dict[str, int]], np.ndarray]:
    rgb = np.asarray(image.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    page_height, page_width = bgr.shape[:2]

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Separa el contenido coloreado del fondo blanco de la hoja.
    _, mask = cv2.threshold(
        gray,
        247,
        255,
        cv2.THRESH_BINARY_INV,
    )

    # Une pequeñas interrupciones dentro del borde de cada lámina.
    kernel_close = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (
            max(5, page_width // 180),
            max(5, page_height // 250),
        ),
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel_close,
        iterations=2,
    )

    # Elimina ruido muy pequeño.
    kernel_open = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (3, 3),
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel_open,
        iterations=1,
    )

    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    candidates: list[dict[str, int]] = []

    minimum_width = int(page_width * 0.13)
    maximum_width = int(page_width * 0.42)
    minimum_height = int(page_height * 0.10)
    maximum_height = int(page_height * 0.40)

    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)

        if not minimum_width <= width <= maximum_width:
            continue

        if not minimum_height <= height <= maximum_height:
            continue

        aspect_ratio = width / height

        # Incluye jugadores verticales y planteles horizontales/rotados.
        if not 0.38 <= aspect_ratio <= 1.65:
            continue

        contour_area = cv2.contourArea(contour)
        rectangle_area = width * height

        if rectangle_area == 0:
            continue

        fill_ratio = contour_area / rectangle_area

        if fill_ratio < 0.20:
            continue

        padding_x = max(4, int(width * 0.012))
        padding_y = max(4, int(height * 0.012))

        x1 = max(0, x - padding_x)
        y1 = max(0, y - padding_y)
        x2 = min(page_width, x + width + padding_x)
        y2 = min(page_height, y + height + padding_y)

        candidates.append(
            {
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
            }
        )

    candidates = remove_duplicate_rectangles(candidates)

    overlay = bgr.copy()

    for index, candidate in enumerate(candidates, start=1):
        x = candidate["x"]
        y = candidate["y"]
        width = candidate["width"]
        height = candidate["height"]

        cv2.rectangle(
            overlay,
            (x, y),
            (x + width, y + height),
            (0, 0, 255),
            5,
        )

        cv2.putText(
            overlay,
            str(index),
            (x + 10, y + 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 255),
            3,
            cv2.LINE_AA,
        )

    return candidates, overlay


def create_contact_sheet(
    candidates: list[dict],
    output_path: Path,
) -> None:
    if not candidates:
        return

    thumbnail_width = 260
    label_height = 38
    columns = 4
    margin = 18

    prepared: list[tuple[str, Image.Image]] = []

    for candidate in candidates:
        candidate_image = Image.open(
            candidate["absoluteImagePath"]
        ).convert("RGB")

        ratio = thumbnail_width / candidate_image.width
        thumbnail_height = max(
            1,
            int(candidate_image.height * ratio),
        )

        thumbnail = candidate_image.resize(
            (thumbnail_width, thumbnail_height),
            Image.Resampling.LANCZOS,
        )

        prepared.append(
            (
                candidate["candidateId"],
                thumbnail,
            )
        )

    cell_height = max(
        thumbnail.height + label_height
        for _, thumbnail in prepared
    )

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
    font = ImageFont.load_default(size=20)

    for index, (candidate_id, thumbnail) in enumerate(prepared):
        row = index // columns
        column = index % columns

        x = margin + column * (thumbnail_width + margin)
        y = margin + row * (cell_height + margin)

        draw.text(
            (x, y),
            candidate_id,
            fill="black",
            font=font,
        )

        sheet.paste(
            thumbnail,
            (x, y + label_height),
        )

    sheet.save(output_path)


def process_team(team_name: str) -> None:
    team_output = EXTRACTIONS_ROOT / team_name
    pages_directory = team_output / "pages"
    candidates_directory = team_output / "candidates"
    debug_directory = team_output / "debug"

    extraction_path = team_output / "extraction.json"

    if not extraction_path.exists():
        raise FileNotFoundError(
            f"No existe {extraction_path}. "
            "Primero renderiza el PDF."
        )

    if candidates_directory.exists():
        shutil.rmtree(candidates_directory)

    if debug_directory.exists():
        shutil.rmtree(debug_directory)

    candidates_directory.mkdir(parents=True, exist_ok=True)
    debug_directory.mkdir(parents=True, exist_ok=True)

    extraction = json.loads(
        extraction_path.read_text(encoding="utf-8")
    )

    all_candidates: list[dict] = []
    global_index = 1

    for page_data in extraction["pages"]:
        page_number = int(page_data["page"])
        page_path = team_output / page_data["image"]

        image = Image.open(page_path).convert("RGB")

        detected, overlay = detect_page_candidates(image)

        overlay_path = (
            debug_directory /
            f"page-{page_number:02d}-detected.png"
        )

        cv2.imwrite(str(overlay_path), overlay)

        page_candidates: list[dict] = []

        for page_slot, rectangle in enumerate(
            detected,
            start=1,
        ):
            x = rectangle["x"]
            y = rectangle["y"]
            width = rectangle["width"]
            height = rectangle["height"]

            crop = image.crop(
                (
                    x,
                    y,
                    x + width,
                    y + height,
                )
            )

            candidate_id = (
                f"P{page_number:02d}-S{page_slot:02d}"
            )

            output_name = f"{candidate_id}.png"
            output_path = candidates_directory / output_name

            crop.save(output_path)

            candidate = {
                "candidateId": candidate_id,
                "globalIndex": global_index,
                "page": page_number,
                "pageSlot": page_slot,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "image": f"candidates/{output_name}",
                "absoluteImagePath": str(output_path),
                "classification": "pending",
                "name": None,
                "include": True,
            }

            page_candidates.append(candidate)
            all_candidates.append(candidate)

            global_index += 1

        page_data["detectedItems"] = [
            {
                key: value
                for key, value in candidate.items()
                if key != "absoluteImagePath"
            }
            for candidate in page_candidates
        ]

        print(
            f"Página {page_number}: "
            f"{len(page_candidates)} candidatos"
        )

    extraction["status"] = "candidates-detected"
    extraction["detectedCandidateCount"] = len(all_candidates)

    extraction_path.write_text(
        json.dumps(
            extraction,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    candidates_json = team_output / "candidates.json"

    candidates_json.write_text(
        json.dumps(
            [
                {
                    key: value
                    for key, value in candidate.items()
                    if key != "absoluteImagePath"
                }
                for candidate in all_candidates
            ],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    contact_sheet_path = team_output / "contact-sheet.png"

    create_contact_sheet(
        all_candidates,
        contact_sheet_path,
    )

    print()
    print(f"Equipo: {team_name}")
    print(f"Candidatos detectados: {len(all_candidates)}")
    print(f"Recortes: {candidates_directory}")
    print(f"Diagnóstico visual: {debug_directory}")
    print(f"Hoja de contacto: {contact_sheet_path}")


def main() -> None:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "team",
        help='Nombre exacto, por ejemplo: "JAPON"',
    )

    args = parser.parse_args()
    team_name = args.team.strip()

    try:
        process_team(team_name)
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
