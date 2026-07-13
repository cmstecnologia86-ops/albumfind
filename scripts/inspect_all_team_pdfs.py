from __future__ import annotations

import csv
import json
from pathlib import Path

import fitz


ROOT = Path.cwd()
PLAYERS_DIR = ROOT / "src" / "players"
OUTPUT_DIR = ROOT / "work" / "all-teams-inspection"
JSON_REPORT = OUTPUT_DIR / "pdf-pattern-report.json"
CSV_REPORT = OUTPUT_DIR / "pdf-pattern-report.csv"


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def orientation(width: float, height: float) -> str:
    if width > height:
        return "landscape"
    if height > width:
        return "portrait"
    return "square"


def classify_page(images: list[dict]) -> str:
    main_images = [
        image
        for image in images
        if image["isMainCandidate"]
    ]
    masks = [
        image
        for image in images
        if image["isMaskCandidate"]
    ]

    if main_images and masks:
        return "main-image-with-mask"
    if main_images:
        return "main-image-only"
    if masks:
        return "mask-only"
    return "no-main-image"


def classify_document(page_summaries: list[dict]) -> str:
    page_count = len(page_summaries)
    main_counts = [
        summary["mainCandidateCount"]
        for summary in page_summaries
    ]

    if page_count != 2:
        return "exceptional-page-count"

    if main_counts == [1, 1]:
        return "A-two-pages-one-main-image-each"

    if all(count >= 1 for count in main_counts):
        return "B-two-pages-multiple-main-candidates"

    return "exceptional-image-layout"


def inspect_pdf(pdf_path: Path) -> dict:
    document = fitz.open(pdf_path)

    try:
        pages = []

        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            page_rect = page.rect
            image_rows = page.get_images(full=True)
            images = []

            for image_index, row in enumerate(image_rows):
                xref = row[0]
                smask = row[1]
                width = row[2]
                height = row[3]
                bits = row[4]
                colorspace = row[5]
                alt_colorspace = row[6]
                name = row[7]
                filter_name = row[8]

                extracted = document.extract_image(xref)
                ext = extracted.get("ext", "")
                rects = page.get_image_rects(xref)
                placement_rects = [
                    {
                        "x0": rect.x0,
                        "y0": rect.y0,
                        "x1": rect.x1,
                        "y1": rect.y1,
                        "width": rect.width,
                        "height": rect.height,
                        "orientation": orientation(rect.width, rect.height),
                    }
                    for rect in rects
                ]

                pixel_area = width * height
                page_area = page_rect.width * page_rect.height
                largest_placement_area = max(
                    (
                        rect["width"] * rect["height"]
                        for rect in placement_rects
                    ),
                    default=0,
                )
                placement_coverage = (
                    largest_placement_area / page_area
                    if page_area
                    else 0
                )

                is_mask = (
                    bits == 1
                    or "Mask" in str(filter_name)
                    or ext in {"png", "pbm"}
                )

                is_main = (
                    ext in {"jpeg", "jpg"}
                    and bits >= 8
                    and pixel_area >= 2_000_000
                    and placement_coverage >= 0.35
                )

                images.append(
                    {
                        "page": page_index + 1,
                        "imageIndex": image_index,
                        "xref": xref,
                        "smask": smask,
                        "format": ext,
                        "filter": filter_name,
                        "name": name,
                        "width": width,
                        "height": height,
                        "bits": bits,
                        "colorspace": colorspace,
                        "alternateColorspace": alt_colorspace,
                        "orientation": orientation(width, height),
                        "pixelArea": pixel_area,
                        "placementCoverage": placement_coverage,
                        "rectangles": placement_rects,
                        "isMainCandidate": is_main,
                        "isMaskCandidate": is_mask and not is_main,
                    }
                )

            pages.append(
                {
                    "page": page_index + 1,
                    "width": page_rect.width,
                    "height": page_rect.height,
                    "orientation": orientation(page_rect.width, page_rect.height),
                    "imageCount": len(images),
                    "mainCandidateCount": sum(
                        1
                        for image in images
                        if image["isMainCandidate"]
                    ),
                    "maskCandidateCount": sum(
                        1
                        for image in images
                        if image["isMaskCandidate"]
                    ),
                    "pagePattern": classify_page(images),
                    "images": images,
                }
            )

        return {
            "selection": pdf_path.parent.name,
            "pdf": rel(pdf_path),
            "pageCount": document.page_count,
            "pattern": classify_document(pages),
            "possibleDistribution": (
                "two album pages using one embedded JPEG per page"
                if classify_document(pages).startswith("A-")
                else "requires manual inspection"
            ),
            "pages": pages,
        }

    finally:
        document.close()


def write_csv(records: list[dict]) -> None:
    rows = []

    for record in records:
        for page in record["pages"]:
            for image in page["images"]:
                first_rect = image["rectangles"][0] if image["rectangles"] else {}
                rows.append(
                    {
                        "selection": record["selection"],
                        "pdf": record["pdf"],
                        "documentPattern": record["pattern"],
                        "page": page["page"],
                        "pageWidth": page["width"],
                        "pageHeight": page["height"],
                        "pageOrientation": page["orientation"],
                        "pagePattern": page["pagePattern"],
                        "pageImageCount": page["imageCount"],
                        "xref": image["xref"],
                        "smask": image["smask"],
                        "format": image["format"],
                        "filter": image["filter"],
                        "width": image["width"],
                        "height": image["height"],
                        "bits": image["bits"],
                        "colorspace": image["colorspace"],
                        "orientation": image["orientation"],
                        "isMainCandidate": image["isMainCandidate"],
                        "isMaskCandidate": image["isMaskCandidate"],
                        "rectX0": first_rect.get("x0"),
                        "rectY0": first_rect.get("y0"),
                        "rectX1": first_rect.get("x1"),
                        "rectY1": first_rect.get("y1"),
                        "rectWidth": first_rect.get("width"),
                        "rectHeight": first_rect.get("height"),
                        "placementCoverage": image["placementCoverage"],
                    }
                )

    with CSV_REPORT.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=list(rows[0].keys()) if rows else [],
        )
        if rows:
            writer.writeheader()
            writer.writerows(rows)


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(PLAYERS_DIR.glob("*/*.pdf"))
    records = [inspect_pdf(pdf_path) for pdf_path in pdfs]

    summary: dict[str, int] = {}
    for record in records:
        summary[record["pattern"]] = summary.get(record["pattern"], 0) + 1

    JSON_REPORT.write_text(
        json.dumps(
            {
                "pdfCount": len(records),
                "patterns": summary,
                "records": records,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    write_csv(records)

    print(f"PDFs inspeccionados: {len(records)}")
    print(f"JSON: {JSON_REPORT}")
    print(f"CSV: {CSV_REPORT}")
    print("Patrones:")
    for pattern, count in sorted(summary.items()):
        print(f"- {pattern}: {count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
