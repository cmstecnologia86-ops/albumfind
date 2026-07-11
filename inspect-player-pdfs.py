from pathlib import Path
import csv
import fitz

root = Path("src/players")
output = Path("player-pdf-inspection.csv")

rows = []

for pdf_path in sorted(root.rglob("*.pdf")):
    try:
        document = fitz.open(pdf_path)

        total_text_chars = 0
        total_images = 0
        page_sizes = set()

        for page in document:
            total_text_chars += len(page.get_text("text").strip())
            total_images += len(page.get_images(full=True))
            page_sizes.add(
                f"{round(page.rect.width, 1)}x{round(page.rect.height, 1)}"
            )

        rows.append(
            {
                "team_folder": pdf_path.parent.name,
                "file_name": pdf_path.name,
                "pages": document.page_count,
                "text_chars": total_text_chars,
                "embedded_images": total_images,
                "page_sizes": " | ".join(sorted(page_sizes)),
                "size_mb": round(pdf_path.stat().st_size / 1024 / 1024, 2),
                "status": "OK",
            }
        )

        document.close()

    except Exception as error:
        rows.append(
            {
                "team_folder": pdf_path.parent.name,
                "file_name": pdf_path.name,
                "pages": "",
                "text_chars": "",
                "embedded_images": "",
                "page_sizes": "",
                "size_mb": round(pdf_path.stat().st_size / 1024 / 1024, 2),
                "status": f"ERROR: {error}",
            }
        )

with output.open("w", newline="", encoding="utf-8-sig") as file:
    writer = csv.DictWriter(file, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f"PDF inspeccionados: {len(rows)}")
print(f"CSV generado: {output}")
print()

for row in rows:
    print(
        f"{row['team_folder']:<20} "
        f"{row['file_name']:<30} "
        f"pag={str(row['pages']):>3} "
        f"texto={str(row['text_chars']):>6} "
        f"img={str(row['embedded_images']):>4} "
        f"{row['status']}"
    )
