from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import fitz


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PLAYERS_ROOT = PROJECT_ROOT / "src" / "players"
OUTPUT_ROOT = PROJECT_ROOT / "work" / "extractions"


def find_team_folder(team_name: str) -> Path:
    requested = team_name.strip().casefold()

    matches = [
        folder
        for folder in PLAYERS_ROOT.iterdir()
        if folder.is_dir() and folder.name.casefold() == requested
    ]

    if not matches:
        available = sorted(
            folder.name
            for folder in PLAYERS_ROOT.iterdir()
            if folder.is_dir()
        )

        print(f'No se encontró la carpeta "{team_name}".', file=sys.stderr)
        print("Equipos disponibles:", file=sys.stderr)

        for team in available:
            print(f"  - {team}", file=sys.stderr)

        raise SystemExit(1)

    return matches[0]


def find_source_pdf(team_folder: Path) -> Path:
    expected_pdf = team_folder / f"{team_folder.name}.pdf"

    if expected_pdf.exists():
        return expected_pdf

    pdf_files = sorted(team_folder.glob("*.pdf"))

    if len(pdf_files) == 1:
        return pdf_files[0]

    if not pdf_files:
        raise FileNotFoundError(
            f"No se encontró ningún PDF en {team_folder}"
        )

    raise RuntimeError(
        f"Se encontraron {len(pdf_files)} PDF en {team_folder}"
    )


def render_team(team_name: str, zoom: float) -> None:
    team_folder = find_team_folder(team_name)
    pdf_path = find_source_pdf(team_folder)

    team_output = OUTPUT_ROOT / team_folder.name
    pages_output = team_output / "pages"

    if team_output.exists():
        shutil.rmtree(team_output)

    pages_output.mkdir(parents=True, exist_ok=True)

    document = fitz.open(pdf_path)

    metadata = {
        "teamFolder": team_folder.name,
        "sourcePdf": str(pdf_path.relative_to(PROJECT_ROOT)).replace("\\", "/"),
        "pageCount": document.page_count,
        "renderZoom": zoom,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "rendered",
        "pages": [],
    }

    matrix = fitz.Matrix(zoom, zoom)

    for page_index in range(document.page_count):
        page = document.load_page(page_index)

        pixmap = page.get_pixmap(
            matrix=matrix,
            alpha=False,
        )

        page_number = page_index + 1
        output_name = f"page-{page_number:02d}.png"
        output_path = pages_output / output_name

        pixmap.save(output_path)

        metadata["pages"].append(
            {
                "page": page_number,
                "sourceWidthPoints": round(page.rect.width, 2),
                "sourceHeightPoints": round(page.rect.height, 2),
                "renderedWidthPixels": pixmap.width,
                "renderedHeightPixels": pixmap.height,
                "image": f"pages/{output_name}",
                "detectedItems": [],
            }
        )

        print(
            f"Página {page_number}: "
            f"{pixmap.width} × {pixmap.height} px"
        )

    document.close()

    metadata_path = team_output / "extraction.json"

    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print()
    print(f"Equipo: {team_folder.name}")
    print(f"PDF: {pdf_path}")
    print(f"Páginas renderizadas: {metadata['pageCount']}")
    print(f"Carpeta de trabajo: {team_output}")
    print(f"Metadatos: {metadata_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Renderiza un PDF de selección para preparar "
            "la extracción individual de láminas."
        )
    )

    parser.add_argument(
        "team",
        help='Nombre exacto de la carpeta, por ejemplo: "JAPON"',
    )

    parser.add_argument(
        "--zoom",
        type=float,
        default=3.0,
        help="Escala de renderizado. Valor predeterminado: 3.0",
    )

    args = parser.parse_args()

    if args.zoom <= 0:
        parser.error("--zoom debe ser mayor que cero")

    render_team(args.team, args.zoom)


if __name__ == "__main__":
    main()
