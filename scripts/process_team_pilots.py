from __future__ import annotations

import io
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
CATALOG_PATH = ROOT / "src" / "data" / "player-catalog.json"
PLAYERS_DIR = ROOT / "src" / "players"
OUTPUT_ROOT = ROOT / "work" / "team-pilots"
BASE_RENDER_ZOOM = 3

TEAM_FOLDERS = {
    "ARG": "ARGENTINA",
    "BRA": "BRASIL",
    "COL": "COLOMBIA",
    "CRO": "CROACIA",
    "ECU": "ECUADOR",
    "ENG": "INGLATERRA",
    "ESP": "ESPAÑA",
    "FRA": "FRANCIA",
    "GER": "ALEMANIA",
    "MAR": "MARRUECOS",
    "NED": "HOLANDA",
    "NOR": "NORUEGA",
    "POR": "PORTUGAL",
    "URU": "URUGUAY",
}

MEXICO_TEMPLATE_MAPPING = {
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

TEAM_MAPPING_OVERRIDES = {
    "ARG": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S03", 0),
        4: (1, "P01-S16", 0),
        5: (2, "P02-S02", 0),
        6: (2, "P02-S04", 0),
        7: (2, "P02-S01", 0),
        8: (1, "P01-S10", 0),
        9: (1, "P01-S11", 0),
        10: (1, "P01-S14", 0),
        11: (1, "P01-S15", 0),
        12: (1, "P01-S13", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S09", 0),
        16: (1, "P01-S05", 0),
        17: (1, "P01-S04", 0),
        18: (1, "P01-S08", 0),
        19: (1, "P01-S07", 0),
        20: (1, "P01-S06", 0),
    },
    "GER": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S02", 0),
        4: (1, "P01-S14", 0),
        5: (1, "P01-S16", 0),
        6: (2, "P02-S03", 0),
        7: (2, "P02-S01", 0),
        8: (1, "P01-S15", 0),
        9: (2, "P02-S04", 0),
        10: (1, "P01-S12", 0),
        11: (1, "P01-S10", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S09", 0),
        15: (1, "P01-S13", 0),
        16: (1, "P01-S06", 0),
        17: (1, "P01-S04", 0),
        18: (1, "P01-S08", 0),
        19: (1, "P01-S07", 0),
        20: (1, "P01-S05", 0),
    },
    "BRA": {
        1: (2, "P02-S05", 0),
        2: (1, "P01-S01", 0),
        3: (1, "P01-S02", 0),
        4: (1, "P01-S03", 0),
        5: (1, "P01-S05", 0),
        6: (1, "P01-S06", 0),
        7: (1, "P01-S07", 0),
        8: (1, "P01-S04", 0),
        9: (1, "P01-S09", 0),
        10: (1, "P01-S10", 0),
        11: (1, "P01-S08", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S03/P02-S04", -90),
        14: (1, "P01-S12", 0),
        15: (2, "P02-S01", 0),
        16: (2, "P02-S02", 0),
        17: (1, "P01-S16", 0),
        18: (1, "P01-S13", 0),
        19: (1, "P01-S14", 0),
        20: (1, "P01-S15", 0),
    },
    "URU": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S04", 0),
        4: (1, "P01-S15", 0),
        5: (2, "P02-S03", 0),
        6: (1, "P01-S14", 0),
        7: (2, "P02-S02", 0),
        8: (2, "P02-S01", 0),
        9: (1, "P01-S16", 0),
        10: (1, "P01-S13", 0),
        11: (1, "P01-S08", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S10", 0),
        16: (1, "P01-S09", 0),
        17: (1, "P01-S04", 0),
        18: (1, "P01-S07", 0),
        19: (1, "P01-S05", 0),
        20: (1, "P01-S06", 0),
    },
    "COL": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S04", 0),
        3: (1, "P01-S03", 0),
        4: (2, "P02-S03", 0),
        5: (2, "P02-S01", 0),
        6: (1, "P01-S16", 0),
        7: (2, "P02-S02", 0),
        8: (2, "P02-S04", 0),
        9: (1, "P01-S15", 0),
        10: (1, "P01-S14", 0),
        11: (1, "P01-S13", 0),
        12: (1, "P01-S10", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S11", 0),
        16: (1, "P01-S09", 0),
        17: (1, "P01-S07", 0),
        18: (1, "P01-S06", 0),
        19: (1, "P01-S08", 0),
        20: (1, "P01-S05", 0),
    },
    "CRO": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (1, "P01-S15", 0),
        4: (2, "P02-S04", 0),
        5: (1, "P01-S16", 0),
        6: (2, "P02-S01", 0),
        7: (2, "P02-S02", 0),
        8: (1, "P01-S14", 0),
        9: (1, "P01-S08", 0),
        10: (1, "P01-S09", 0),
        11: (1, "P01-S10", 0),
        12: (None, None, 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S11", 0),
        15: (1, "P01-S12", 0),
        16: (1, "P01-S13", 0),
        17: (1, "P01-S05", 0),
        18: (1, "P01-S06", 0),
        19: (1, "P01-S07", 0),
        20: (1, "P01-S04", 0),
    },
    "ECU": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (1, "P01-S04", 0),
        4: (2, "P02-S03", 0),
        5: (2, "P02-S01", 0),
        6: (2, "P02-S02", 0),
        7: (2, "P02-S04", 0),
        8: (1, "P01-S15", 0),
        9: (1, "P01-S14", 0),
        10: (1, "P01-S13", 0),
        11: (1, "P01-S12", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S16", 0),
        15: (1, "P01-S10", 0),
        16: (1, "P01-S09", 0),
        17: (1, "P01-S08", 0),
        18: (1, "P01-S07", 0),
        19: (1, "P01-S06", 0),
        20: (1, "P01-S05", 0),
    },
    "ENG": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (1, "P01-S16", 0),
        4: (2, "P02-S02", 0),
        5: (2, "P02-S03", 0),
        6: (2, "P02-S04", 0),
        7: (2, "P02-S01", 0),
        8: (1, "P01-S15", 0),
        9: (1, "P01-S12", 0),
        10: (1, "P01-S14", 0),
        11: (1, "P01-S11", 0),
        12: (1, "P01-S13", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S10", 0),
        15: (1, "P01-S09", 0),
        16: (1, "P01-S06", 0),
        17: (1, "P01-S08", 0),
        18: (1, "P01-S04", 0),
        19: (1, "P01-S05", 0),
        20: (1, "P01-S07", 0),
    },
    "ESP": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S04", 0),
        4: (2, "P02-S03", 0),
        5: (2, "P02-S02", 0),
        6: (2, "P02-S01", 0),
        7: (1, "P01-S16", 0),
        8: (1, "P01-S15", 0),
        9: (1, "P01-S14", 0),
        10: (1, "P01-S13", 0),
        11: (1, "P01-S12", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S10", 0),
        15: (1, "P01-S04", 0),
        16: (1, "P01-S07", 0),
        17: (1, "P01-S06", 0),
        18: (1, "P01-S05", 0),
        19: (1, "P01-S08", 0),
        20: (1, "P01-S09", 0),
    },
    "FRA": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S04", 0),
        4: (2, "P02-S03", 0),
        5: (2, "P02-S02", 0),
        6: (2, "P02-S01", 0),
        7: (1, "P01-S16", 0),
        8: (1, "P01-S15", 0),
        9: (1, "P01-S13", 0),
        10: (1, "P01-S12", 0),
        11: (1, "P01-S11", 0),
        12: (1, "P01-S10", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S14", 0),
        15: (1, "P01-S09", 0),
        16: (1, "P01-S08", 0),
        17: (1, "P01-S07", 0),
        18: (1, "P01-S06", 0),
        19: (1, "P01-S05", 0),
        20: (1, "P01-S04", 0),
    },
    "MAR": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S01", 0),
        4: (1, "P01-S14", 0),
        5: (2, "P02-S04", 0),
        6: (2, "P02-S02", 0),
        7: (1, "P01-S15", 0),
        8: (1, "P01-S16", 0),
        9: (2, "P02-S03", 0),
        10: (1, "P01-S09", 0),
        11: (1, "P01-S10", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S13", 0),
        16: (1, "P01-S04", 0),
        17: (1, "P01-S05", 0),
        18: (1, "P01-S06", 0),
        19: (1, "P01-S07", 0),
        20: (1, "P01-S08", 0),
    },
    "NED": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (1, "P01-S15", 0),
        4: (1, "P01-S16", 0),
        5: (2, "P02-S02", 0),
        6: (1, "P01-S13", 0),
        7: (2, "P02-S03", 0),
        8: (2, "P02-S01", 0),
        9: (1, "P01-S14", 0),
        10: (1, "P01-S10", 0),
        11: (1, "P01-S09", 0),
        12: (1, "P01-S11", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S08", 0),
        16: (1, "P01-S07", 0),
        17: (1, "P01-S04", 0),
        18: (1, "P01-S05", 0),
        19: (1, "P01-S06", 0),
        20: (2, "P02-S04", 0),
    },
    "NOR": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S04", 0),
        4: (2, "P02-S01", 0),
        5: (1, "P01-S16", 0),
        6: (2, "P02-S03", 0),
        7: (2, "P02-S02", 0),
        8: (1, "P01-S15", 0),
        9: (1, "P01-S11", 0),
        10: (1, "P01-S10", 0),
        11: (1, "P01-S13", 0),
        12: (1, "P01-S14", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S12", 0),
        15: (1, "P01-S04", 0),
        16: (1, "P01-S06", 0),
        17: (1, "P01-S09", 0),
        18: (1, "P01-S05", 0),
        19: (1, "P01-S07", 0),
        20: (1, "P01-S08", 0),
    },
    "POR": {
        1: (1, "P01-S01", 0),
        2: (1, "P01-S03", 0),
        3: (2, "P02-S01", 0),
        4: (1, "P01-S16", 0),
        5: (1, "P01-S15", 0),
        6: (1, "P01-S14", 0),
        7: (1, "P01-S13", 0),
        8: (1, "P01-S12", 0),
        9: (1, "P01-S11", 0),
        10: (1, "P01-S10", 0),
        11: (1, "P01-S09", 0),
        12: (1, "P01-S08", 0),
        13: (2, "P02-S05", -90),
        14: (1, "P01-S07", 0),
        15: (1, "P01-S04", 0),
        16: (1, "P01-S06", 0),
        17: (1, "P01-S05", 0),
        18: (2, "P02-S04", 0),
        19: (2, "P02-S03", 0),
        20: (2, "P02-S02", 0),
    },
}

TEAM_CONFIDENCE_OVERRIDES = {
    "CRO": {
        12: "missing",
    },
}

PAGE_1_GRID = {
    "left": 112,
    "top": 118,
    "right": 1730,
    "bottom": 2394,
    "columns": 4,
    "rows": 4,
    "inset_x": 10,
    "inset_y": 8,
}

PAGE_2_TOP = {
    "left": 90,
    "top": 125,
    "right": 1748,
    "bottom": 682,
    "columns": 4,
    "rows": 1,
    "inset_x": 10,
    "inset_y": 8,
}

PAGE_2_TEAM = {
    "left": 94,
    "top": 698,
    "right": 467,
    "bottom": 1268,
}

TRIM_TOP_SOURCES = {
    "P01-S05",
    "P01-S06",
    "P01-S07",
    "P01-S08",
}

TEAM_TRIM_TOP_SOURCE_PIXELS = {
    "BRA": {
        "P01-S09": 28,
        "P01-S10": 28,
        "P01-S11": 28,
        "P01-S12": 28,
    },
    "URU": {
        "P01-S09": 28,
        "P01-S10": 28,
        "P01-S11": 28,
        "P01-S12": 28,
    },
    "COL": {
        "P01-S09": 28,
        "P01-S10": 28,
        "P01-S11": 28,
        "P01-S12": 28,
    },
    "CRO": {
        "P01-S09": 28,
        "P01-S10": 28,
        "P01-S11": 28,
        "P01-S12": 28,
    },
    "NOR": {
        "P01-S09": 28,
        "P01-S10": 28,
        "P01-S11": 28,
        "P01-S12": 28,
    },
}


@dataclass(frozen=True)
class MainImage:
    page_number: int
    xref: int
    rect: fitz.Rect
    width: int
    height: int
    ext: str
    bits: int


def clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibri.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def catalog_team(team_code: str) -> dict:
    catalog = load_catalog()
    for team in catalog["teams"]:
        if team["teamCode"] == team_code:
            return team
    raise KeyError(f"No existe {team_code} en player-catalog.json")


def official_stickers_by_number(team_code: str) -> dict[int, dict]:
    team = catalog_team(team_code)
    stickers = team["stickers"]
    if len(stickers) != 20:
        raise ValueError(f"{team_code} no tiene 20 registros oficiales.")
    by_number = {sticker["number"]: sticker for sticker in stickers}
    expected_codes = {
        number: f"{team_code}-{number:02d}"
        for number in range(1, 21)
    }
    for number, code in expected_codes.items():
        sticker = by_number.get(number)
        if not sticker or sticker["code"] != code:
            raise ValueError(f"Código oficial inválido para {team_code}-{number:02d}.")
    return by_number


def build_grid_boxes(config: dict, page_label: str) -> dict[str, tuple[int, int, int, int]]:
    left = config["left"]
    top = config["top"]
    right = config["right"]
    bottom = config["bottom"]
    columns = config["columns"]
    rows = config["rows"]
    inset_x = config["inset_x"]
    inset_y = config["inset_y"]
    cell_width = (right - left) / columns
    cell_height = (bottom - top) / rows

    boxes = {}
    slot = 1
    for row in range(rows):
        for column in range(columns):
            key = f"{page_label}-S{slot:02d}"
            x1 = round(left + column * cell_width) + inset_x
            y1 = round(top + row * cell_height) + inset_y
            x2 = round(left + (column + 1) * cell_width) - inset_x
            y2 = round(top + (row + 1) * cell_height) - inset_y
            if key in TRIM_TOP_SOURCES:
                y1 += 38
            boxes[key] = (x1, y1, x2, y2)
            slot += 1
    return boxes


def page_box_to_source_box(
    page_box: tuple[int, int, int, int],
    placement_rect: fitz.Rect,
    source_size: tuple[int, int],
) -> tuple[int, int, int, int]:
    page_x1 = page_box[0] / BASE_RENDER_ZOOM
    page_y1 = page_box[1] / BASE_RENDER_ZOOM
    page_x2 = page_box[2] / BASE_RENDER_ZOOM
    page_y2 = page_box[3] / BASE_RENDER_ZOOM
    source_width, source_height = source_size
    x_scale = source_width / placement_rect.width
    y_scale = source_height / placement_rect.height

    x1 = round((page_x1 - placement_rect.x0) * x_scale)
    y1 = round((page_y1 - placement_rect.y0) * y_scale)
    x2 = round((page_x2 - placement_rect.x0) * x_scale)
    y2 = round((page_y2 - placement_rect.y0) * y_scale)

    x1 = max(0, min(source_width, x1))
    y1 = max(0, min(source_height, y1))
    x2 = max(0, min(source_width, x2))
    y2 = max(0, min(source_height, y2))
    if x2 <= x1 or y2 <= y1:
        raise ValueError(f"Recorte inválido {page_box} -> {(x1, y1, x2, y2)}")
    return x1, y1, x2, y2


def find_main_image(document: fitz.Document, page_index: int) -> MainImage:
    page = document.load_page(page_index)
    page_area = page.rect.width * page.rect.height
    candidates = []
    for row in page.get_images(full=True):
        xref = row[0]
        width = row[2]
        height = row[3]
        bits = row[4]
        extracted = document.extract_image(xref)
        ext = extracted.get("ext", "")
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        coverage = max(rect.width * rect.height for rect in rects) / page_area
        if ext in {"jpeg", "jpg"} and bits >= 8 and width * height > 2_000_000:
            candidates.append((coverage, width * height, xref, rects[0], width, height, ext, bits))
    if not candidates:
        raise RuntimeError(f"No se encontró JPEG principal en página {page_index + 1}.")
    candidates.sort(reverse=True, key=lambda item: (item[0], item[1]))
    _, _, xref, rect, width, height, ext, bits = candidates[0]
    return MainImage(page_index + 1, xref, rect, width, height, ext, bits)


def extract_original_image(document: fitz.Document, xref: int) -> Image.Image:
    extracted = document.extract_image(xref)
    data = extracted.get("image")
    if not data:
        raise RuntimeError(f"No fue posible extraer xref={xref}.")
    return Image.open(io.BytesIO(data)).convert("RGB")


def create_placeholder(code: str, name: str, kind: str) -> Image.Image:
    width, height = (650, 450) if kind == "squad" else (450, 650)
    image = Image.new("RGB", (width, height), (245, 244, 238))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width - 1, height - 1), outline=(130, 130, 130), width=4)
    draw.text((width / 2, height * 0.38), code, anchor="mm", font=get_font(42, True), fill=(80, 80, 80))
    draw.text((width / 2, height * 0.52), "SIN IMAGEN", anchor="mm", font=get_font(24, True), fill=(110, 110, 110))
    draw.text((width / 2, height * 0.64), name, anchor="mm", font=get_font(18, True), fill=(65, 65, 65))
    return image


def save_webp(image: Image.Image, output_path: Path) -> None:
    image.save(output_path, format="WEBP", lossless=True, method=6)


def validate_image(path: Path, kind: str) -> dict:
    with Image.open(path) as image:
        width, height = image.size
        ratio = width / height
    expected = 6.5 / 4.5 if kind == "squad" else 4.5 / 6.5
    return {
        "width": width,
        "height": height,
        "ratio": ratio,
        "expectedRatio": expected,
        "ratioDelta": abs(ratio - expected),
        "opensWithPillow": True,
    }


def create_contact_sheet(records: list[dict], contact_path: Path) -> None:
    columns = 5
    card_width = 330
    card_height = 470
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
    code_font = get_font(18, True)
    name_font = get_font(13, True)
    meta_font = get_font(10)

    for index, record in enumerate(records):
        row = index // columns
        column = index % columns
        x = margin + column * (card_width + gap)
        y = margin + row * (card_height + gap)
        draw.rectangle((x, y, x + card_width, y + card_height), outline=(210, 210, 210), width=2)
        draw.text((x + 12, y + 12), record["code"], font=code_font, fill=(20, 45, 40))
        draw.text((x + 12, y + 38), record["name"][:38], font=name_font, fill=(20, 45, 40))
        status = "OK" if record.get("hasImage") else "SIN IMAGEN"
        confidence = record.get("confidence", "n/a")
        draw.text(
            (x + 12, y + 60),
            f"{status} | {record.get('sourceSlot')} | {confidence}",
            font=meta_font,
            fill=(90, 90, 90),
        )
        warnings = record.get("warnings") or record.get("notes") or []
        if warnings:
            draw.text((x + 12, y + 76), str(warnings[0])[:48], font=meta_font, fill=(130, 70, 70))

        image_path = record.get("previewPath")
        if image_path and Path(image_path).exists():
            image = Image.open(image_path).convert("RGB")
        else:
            image = create_placeholder(record["code"], record["name"], record["kind"])
        image.thumbnail((preview_width, preview_height), Image.Resampling.LANCZOS)
        px = x + (card_width - image.width) // 2
        py = y + 88 + (preview_height - image.height) // 2
        sheet.paste(image, (px, py))

    contact_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(contact_path, quality=94)


def create_source_slots_sheet(records: list[dict], contact_path: Path) -> None:
    columns = 5
    card_width = 330
    card_height = 455
    preview_width = 290
    preview_height = 320
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
    title_font = get_font(18, True)
    meta_font = get_font(10)

    for index, record in enumerate(records):
        row = index // columns
        column = index % columns
        x = margin + column * (card_width + gap)
        y = margin + row * (card_height + gap)
        draw.rectangle((x, y, x + card_width, y + card_height), outline=(210, 210, 210), width=2)
        draw.text((x + 12, y + 12), record["sourceSlot"], font=title_font, fill=(20, 45, 40))
        meta = (
            f"P{record['sourcePage']:02d} | xref {record['sourceXref']} | "
            f"{record['width']}x{record['height']} | rot {record['rotation']}"
        )
        draw.text((x + 12, y + 38), meta, font=meta_font, fill=(90, 90, 90))
        image = Image.open(record["path"]).convert("RGB")
        image.thumbnail((preview_width, preview_height), Image.Resampling.LANCZOS)
        px = x + (card_width - image.width) // 2
        py = y + 74 + (preview_height - image.height) // 2
        sheet.paste(image, (px, py))

    contact_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(contact_path, quality=94)


def process_team(team_code: str) -> dict:
    team = catalog_team(team_code)
    stickers_by_number = official_stickers_by_number(team_code)
    folder = TEAM_FOLDERS[team_code]
    pdf_path = PLAYERS_DIR / folder / f"{folder}.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    team_root = OUTPUT_ROOT / team_code
    source_dir = team_root / "source-crops"
    preview_dir = team_root / "official-preview"
    contact_dir = team_root / "contact-sheet"
    clean_dir(source_dir)
    clean_dir(preview_dir)
    clean_dir(contact_dir)

    mapping = TEAM_MAPPING_OVERRIDES.get(team_code, MEXICO_TEMPLATE_MAPPING)
    warnings = [
        "Generated in work/ only; public/stickers was not modified.",
    ]
    if team_code in TEAM_MAPPING_OVERRIDES:
        warnings.append("Uses user-approved explicit source-slot mapping for this pilot.")
        if team_code == "URU":
            warnings.append("P01-S02 is a duplicated/rotated team photo source and is intentionally not used.")
    else:
        warnings.append("Mapping uses Mexico validated slot template; requires visual approval before publishing.")
    missing = []
    extras = []
    records = []

    page_1_boxes = build_grid_boxes(PAGE_1_GRID, "P01")
    page_2_boxes = build_grid_boxes(PAGE_2_TOP, "P02")
    page_2_boxes["P02-S05"] = (
        PAGE_2_TEAM["left"],
        PAGE_2_TEAM["top"],
        PAGE_2_TEAM["right"],
        PAGE_2_TEAM["bottom"],
    )
    boxes_by_page = {1: page_1_boxes, 2: page_2_boxes}

    document = fitz.open(pdf_path)
    try:
        if document.page_count != 2:
            warnings.append(f"PDF has {document.page_count} pages, expected 2.")
        main_images = {
            1: find_main_image(document, 0),
            2: find_main_image(document, 1),
        }
        source_images = {
            page: extract_original_image(document, main.xref)
            for page, main in main_images.items()
        }

        used_slots = set()
        for number in range(1, 21):
            sticker = stickers_by_number[number]
            code = sticker["code"]
            kind = sticker["kind"]
            source_page, source_slot, rotation = mapping[number]
            item = {
                "code": code,
                "number": number,
                "name": sticker["name"],
                "kind": kind,
                "sourcePage": source_page,
                "sourceXref": None,
                "sourceSlot": source_slot,
                "rotation": rotation,
                "hasImage": False,
                "output": None,
                "sourceCrop": None,
                "validation": None,
                "warnings": [],
                "confidence": TEAM_CONFIDENCE_OVERRIDES.get(team_code, {}).get(
                    number,
                    "high" if team_code in TEAM_MAPPING_OVERRIDES else "low",
                ),
                "notes": [],
            }

            if source_page is None or source_slot is None:
                item["confidence"] = "missing"
                item["notes"].append("No approved source slot exists for this official catalog entry.")
                missing.append({"code": code, "number": number, "name": sticker["name"], "reason": "approved source slot is missing"})
                records.append({**item, "previewPath": None})
                continue

            main = main_images[source_page]
            source_image = source_images[source_page]
            if team_code == "BRA" and number == 13:
                page_box_3 = boxes_by_page[source_page]["P02-S03"]
                page_box_4 = boxes_by_page[source_page]["P02-S04"]
                source_box_3 = page_box_to_source_box(page_box_3, main.rect, source_image.size)
                source_box_4 = page_box_to_source_box(page_box_4, main.rect, source_image.size)
                source_box = source_box_3
                item["sourceBlockUnionBox"] = (
                    min(source_box_3[0], source_box_4[0]),
                    min(source_box_3[1], source_box_4[1]),
                    max(source_box_3[2], source_box_4[2]),
                    max(source_box_3[3], source_box_4[3]),
                )
                item["selectedOccurrenceBox"] = source_box_3
                item["sourceBlockNote"] = (
                    "P02-S03 and P02-S04 are duplicate slices of the same horizontal team-photo block; "
                    "BRA-13 uses one complete occurrence cropped directly from the original page-2 JPEG."
                )
            else:
                page_box = boxes_by_page[source_page][source_slot]
                source_box = page_box_to_source_box(page_box, main.rect, source_image.size)
            trim_top_pixels = TEAM_TRIM_TOP_SOURCE_PIXELS.get(team_code, {}).get(source_slot, 0)
            if trim_top_pixels:
                source_box = (
                    source_box[0],
                    min(source_box[3] - 1, source_box[1] + trim_top_pixels),
                    source_box[2],
                    source_box[3],
                )
                item["trimTopPixels"] = trim_top_pixels
            crop = source_image.crop(source_box)
            if rotation:
                crop = crop.rotate(rotation, expand=True)

            safe_source_slot = source_slot.replace("/", "-")
            source_output = source_dir / f"{team_code}-SRC-{safe_source_slot}.webp"
            official_output = preview_dir / f"{code}.webp"
            save_webp(crop, source_output)
            save_webp(crop, official_output)
            validation = validate_image(official_output, kind)
            if validation["ratioDelta"] > 0.22:
                item["warnings"].append(
                    f"ratio delta {validation['ratioDelta']:.3f} needs visual review"
                )

            item.update(
                {
                    "sourceXref": main.xref,
                    "hasImage": True,
                    "output": official_output.name,
                    "sourceCrop": source_output.name,
                    "sourceRect": list(source_box),
                    "sourceBox": source_box,
                    "validation": validation,
                }
            )
            if team_code == "URU" and number == 13:
                item["notes"].append("P02-S05 is the approved valid horizontal team photo.")
            used_slots.add((source_page, source_slot))
            records.append({**item, "previewPath": str(official_output)})

        if team_code not in TEAM_MAPPING_OVERRIDES:
            all_slots = {(1, slot) for slot in page_1_boxes} | {(2, slot) for slot in page_2_boxes}
            for source_page, source_slot in sorted(all_slots - used_slots):
                extras.append(
                    {
                        "sourcePage": source_page,
                        "sourceSlot": source_slot,
                        "reason": "slot not mapped by official pilot template",
                    }
                )

    finally:
        document.close()

    contact_name = (
        "BRA-contact-sheet-final.jpg"
        if team_code == "BRA"
        else "URU-contact-sheet-mapped.jpg"
        if team_code == "URU"
        else f"{team_code}-contact-sheet-mapped.jpg"
        if team_code in {"COL", "CRO", "ECU", "ENG", "ESP", "FRA", "MAR", "NED", "NOR", "POR"}
        else f"{team_code}-contact-sheet-corrected.jpg"
        if team_code in TEAM_MAPPING_OVERRIDES
        else f"{team_code}-contact-sheet.jpg"
    )
    contact_path = contact_dir / contact_name
    create_contact_sheet(records, contact_path)
    manifest = {
        "teamCode": team_code,
        "teamName": team["teamName"],
        "pdf": pdf_path.relative_to(ROOT).as_posix(),
        "pattern": "A-two-pages-one-main-image-each",
        "published": False,
        "stickers": [
            {
                key: value
                for key, value in record.items()
                if key != "previewPath"
            }
            for record in records
        ],
        "extras": extras,
        "missing": missing,
        "warnings": warnings,
        "requiresVisualReview": True,
        "mappingConfidence": {
            "high": sum(1 for record in records if record.get("confidence") == "high"),
            "medium": sum(1 for record in records if record.get("confidence") == "medium"),
            "low": sum(1 for record in records if record.get("confidence") == "low"),
            "missing": len(missing),
            "extra": len(extras),
        },
        "unusedSources": [
            {
                "sourcePage": 1,
                "sourceSlot": "P01-S02",
                "reason": "duplicated/rotated team photo source; not used as an official position",
            }
        ]
        if team_code == "URU"
        else [],
        "contactSheet": contact_path.relative_to(ROOT).as_posix(),
        "outputRoot": team_root.relative_to(ROOT).as_posix(),
    }
    (team_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return manifest


def generate_source_slots_sheet(team_code: str) -> dict:
    folder = TEAM_FOLDERS[team_code]
    pdf_path = PLAYERS_DIR / folder / f"{folder}.pdf"
    team_root = OUTPUT_ROOT / team_code
    source_dir = team_root / "source-crops"
    contact_dir = team_root / "contact-sheet"
    source_dir.mkdir(parents=True, exist_ok=True)
    contact_dir.mkdir(parents=True, exist_ok=True)

    page_1_boxes = build_grid_boxes(PAGE_1_GRID, "P01")
    page_2_boxes = build_grid_boxes(PAGE_2_TOP, "P02")
    page_2_boxes["P02-S05"] = (
        PAGE_2_TEAM["left"],
        PAGE_2_TEAM["top"],
        PAGE_2_TEAM["right"],
        PAGE_2_TEAM["bottom"],
    )
    boxes_by_page = {1: page_1_boxes, 2: page_2_boxes}

    records = []
    document = fitz.open(pdf_path)
    try:
        main_images = {
            1: find_main_image(document, 0),
            2: find_main_image(document, 1),
        }
        source_images = {
            page: extract_original_image(document, main.xref)
            for page, main in main_images.items()
        }

        for source_page in [1, 2]:
            for source_slot, page_box in sorted(boxes_by_page[source_page].items()):
                main = main_images[source_page]
                source_image = source_images[source_page]
                source_box = page_box_to_source_box(page_box, main.rect, source_image.size)
                crop = source_image.crop(source_box)
                rotation = -90 if source_slot == "P02-S05" else 0
                if rotation:
                    crop = crop.rotate(rotation, expand=True)
                output_path = source_dir / f"{team_code}-SRC-{source_slot}.webp"
                save_webp(crop, output_path)
                records.append(
                    {
                        "sourcePage": source_page,
                        "sourceXref": main.xref,
                        "sourceSlot": source_slot,
                        "sourceBox": source_box,
                        "rotation": rotation,
                        "width": crop.width,
                        "height": crop.height,
                        "path": str(output_path),
                    }
                )
    finally:
        document.close()

    contact_path = contact_dir / f"{team_code}-source-slots.jpg"
    create_source_slots_sheet(records, contact_path)
    diagnostic = {
        "teamCode": team_code,
        "pdf": pdf_path.relative_to(ROOT).as_posix(),
        "contactSheet": contact_path.relative_to(ROOT).as_posix(),
        "sourceSlots": [
            {
                key: value
                for key, value in record.items()
                if key != "path"
            }
            for record in records
        ],
        "notes": [
            "P01-S04 is included and must not be treated as an automatic extra.",
            "P02-S05 is rotated for source-slot review because it is the candidate horizontal team/emblem-like block in the validated page-2 geometry.",
            "Brazil is not published; official BRA-13 remains unresolved pending visual approval.",
        ],
    }
    diagnostic_path = team_root / "source-slots-diagnostic.json"
    diagnostic_path.write_text(
        json.dumps(diagnostic, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return diagnostic


def main() -> int:
    requested = sys.argv[1:] or ["ARG", "BRA", "GER"]
    manifests = []
    for team_code in requested:
        print(f"Procesando {team_code}...")
        manifest = process_team(team_code)
        manifests.append(manifest)
        print(
            f"  contacto: {manifest['contactSheet']} | "
            f"missing={len(manifest['missing'])} extras={len(manifest['extras'])}"
        )
        if team_code == "BRA":
            diagnostic = generate_source_slots_sheet(team_code)
            print(f"  slots fuente: {diagnostic['contactSheet']}")
    summary_path = OUTPUT_ROOT / "pilot-summary.json"
    summary_path.write_text(
        json.dumps(
            {
                "teams": [
                    {
                        "teamCode": manifest["teamCode"],
                        "teamName": manifest["teamName"],
                        "manifest": f"work/team-pilots/{manifest['teamCode']}/manifest.json",
                        "contactSheet": manifest["contactSheet"],
                        "published": manifest["published"],
                        "warnings": manifest["warnings"],
                        "missing": manifest["missing"],
                        "extras": manifest["extras"],
                    }
                    for manifest in manifests
                ]
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Resumen: {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
